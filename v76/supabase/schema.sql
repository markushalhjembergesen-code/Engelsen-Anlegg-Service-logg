-- Engelsen Anlegg ServiceLogg: felles database, berre for Supabase SQL Editor.
-- Køyr EIN GONG i eit nytt Supabase-prosjekt før appen blir publisert.
-- Ingen hemmelege nøklar skal inn i GitHub.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table if not exists public.staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null check (role in ('administrator','servicefolk','maskinforar','lastebilsjafor','altmulig')),
  confirmed boolean not null default false,
  disabled boolean not null default false,
  confirm_hash text,
  confirm_salt text,
  confirm_attempts integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Stadfestingshashar ligg i profilsystemet, men er IKKJE lesbare for klientar.
-- Den publiserbare nøkkelen får berre SELECT på oppførte kolonnar nedanfor.

-- Funksjonen blir berre kalla av RLS. Eit konto- eller rollefelta i nettlesaren
-- kan ALDRI oppgradera rettane til ein brukar.
create or replace function private.active_staff_role()
returns text
language sql stable security definer set search_path = ''
as $$
  select role from public.staff_profiles
  where id = (select auth.uid()) and confirmed = true and disabled = false
  limit 1;
$$;
revoke all on function private.active_staff_role() from public, anon;
grant execute on function private.active_staff_role() to authenticated;

alter table public.staff_profiles enable row level security;
drop policy if exists staff_read on public.staff_profiles;
create policy staff_read on public.staff_profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.active_staff_role()) = 'administrator');
-- Ingen direkte INSERT/UPDATE/DELETE på tilsette frå klienten.
revoke all on public.staff_profiles from anon;
revoke all on public.staff_profiles from authenticated;
grant select (id,email,full_name,role,confirmed,disabled,created_at,updated_at)
  on public.staff_profiles to authenticated;

create table if not exists public.app_records (
  bucket text not null check (bucket in (
    'machines','dealers','mechanics','mechanic_statuses',
    'service','intervals','interval_selected','faults'
  )),
  item_id text not null,
  payload jsonb not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (bucket,item_id)
);
create index if not exists app_records_bucket_updated_idx on public.app_records(bucket,updated_at desc);
alter table public.app_records enable row level security;

-- Alle aktive kan sjå maskinnamn for feilmeldingar og sjølve feilmeldingane.
-- Service folk og administrator kan lesa heile verkstad-/maskinregisteret.
drop policy if exists records_read on public.app_records;
create policy records_read on public.app_records for select to authenticated
  using ((select private.active_staff_role()) in ('administrator','servicefolk')
    or ((select private.active_staff_role()) in ('maskinforar','lastebilsjafor','altmulig')
        and bucket in ('machines','faults')));

-- Alle kan registrera eigne feilmeldingar. Andre typer føringar krev Service folk.
drop policy if exists records_insert on public.app_records;
create policy records_insert on public.app_records for insert to authenticated
  with check (created_by = (select auth.uid())
    and ((select private.active_staff_role()) in ('administrator','servicefolk')
      or ((select private.active_staff_role()) in ('maskinforar','lastebilsjafor','altmulig')
        and bucket='faults')));

drop policy if exists records_update on public.app_records;
create policy records_update on public.app_records for update to authenticated
  using ((select private.active_staff_role()) in ('administrator','servicefolk'))
  with check ((select private.active_staff_role()) in ('administrator','servicefolk'));

drop policy if exists records_delete on public.app_records;
create policy records_delete on public.app_records for delete to authenticated
  using ((select private.active_staff_role()) in ('administrator','servicefolk'));

-- Registreringar kan ikkje skifta opphavsbrukar ved oppdatering.
create or replace function private.stamp_record()
returns trigger language plpgsql set search_path = '' as $$
begin
  if TG_OP='UPDATE' then
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists app_records_stamp on public.app_records;
create trigger app_records_stamp before update on public.app_records
for each row execute function private.stamp_record();

revoke all on public.app_records from anon;
grant select, insert, update, delete on public.app_records to authenticated;
-- Endringar av tilsette går via Edge Functions med server-side administrator-kontroll.

-- Når ein tilsett registrerer høgare timetal i service eller feilmelding,
-- oppdaterer databasen maskinens timetal. Dette skjer på serversida, så
-- Maskinførar kan melda feil utan å få generell skriverett i Maskinregisteret.
create or replace function private.update_hours_from_record()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  h numeric;
  machine_id text;
  name_normal text;
begin
  if NEW.bucket not in ('service','faults') then return NEW; end if;
  if (NEW.payload->>'hours') !~ '^\d{1,9}(\.\d{1,2})?$' then return NEW; end if;
  h := (NEW.payload->>'hours')::numeric;
  if h < 0 or h > 999999999 then return NEW; end if;
  machine_id := NEW.payload->>'machineId';
  name_normal := lower(trim(coalesce(NEW.payload->>'machineName','')));
  update public.app_records as m
     set payload = jsonb_set(m.payload,'{hours}',to_jsonb(h),true)
   where m.bucket = 'machines'
     and (m.item_id = machine_id or (name_normal<>'' and lower(trim(m.payload->>'name'))=name_normal))
     and coalesce(case when (m.payload->>'hours') ~ '^\d{1,9}(\.\d{1,2})?$' then (m.payload->>'hours')::numeric else 0 end,0) < h;
  return NEW;
end;
$$;
drop trigger if exists app_records_hours on public.app_records;
create trigger app_records_hours after insert or update of payload on public.app_records
for each row execute function private.update_hours_from_record();


-- ServiceLogg v76: sjølvregistrering og admin-godkjenning utan Edge Functions.
-- Alle registrerte kontoar startar utan tilgang. Rolle og godkjenning kan aldri
-- skrivast av ein vanleg innlogga brukar.
create or replace function private.staff_on_signup()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.staff_profiles(id,email,full_name,role,confirmed,disabled)
  values (
    new.id,
    lower(new.email),
    left(coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),'Ny tilsett'),120),
    'maskinforar',false,false
  ) on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function private.staff_on_signup() from public, anon, authenticated;
drop trigger if exists service_logg_staff_on_signup on auth.users;
create trigger service_logg_staff_on_signup
  after insert on auth.users for each row execute function private.staff_on_signup();

-- Dersom brukarar blei registrerte før dette SQL-oppsettet, opprett pending-profilar.
insert into public.staff_profiles(id,email,full_name,role,confirmed,disabled)
select id, lower(email), left(coalesce(nullif(trim(raw_user_meta_data->>'full_name'),''),'Ny tilsett'),120),
       'maskinforar',false,false
from auth.users where email is not null
on conflict (id) do nothing;

-- Administrator godkjenner og endrar roller. Databasefunksjonen verifiserer
-- rolla og hindrar at siste aktive administrator blir fjerna.
create or replace function public.staff_admin_action(
  p_action text, p_user_id uuid, p_role text default null, p_full_name text default null
)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  existing public.staff_profiles%rowtype;
  active_admins integer;
begin
  if actor is null or not exists (
    select 1 from public.staff_profiles
    where id=actor and role='administrator' and confirmed=true and disabled=false
  ) then
    raise exception 'Berre administrator kan godkjenna eller endra tilsette' using errcode='42501';
  end if;
  if p_action not in ('approve','update','disable','enable') then
    raise exception 'Ugyldig handling' using errcode='22023';
  end if;
  select * into existing from public.staff_profiles where id=p_user_id for update;
  if not found then raise exception 'Fann ikkje brukaren' using errcode='22023'; end if;
  if p_role is not null and p_role not in (
    'administrator','servicefolk','maskinforar','lastebilsjafor','altmulig'
  ) then raise exception 'Ugyldig stilling' using errcode='22023'; end if;
  if p_full_name is not null and (length(trim(p_full_name))<2 or length(trim(p_full_name))>120)
    then raise exception 'Ugyldig namn' using errcode='22023'; end if;
  if existing.role='administrator' and existing.confirmed and not existing.disabled and (
    p_action='disable' or (p_action='update' and p_role is not null and p_role <> 'administrator')
  ) then
    select count(*) into active_admins from public.staff_profiles
    where role='administrator' and confirmed=true and disabled=false;
    if active_admins<=1 then
      raise exception 'Siste administrator kan ikkje fjernast' using errcode='42501';
    end if;
  end if;
  if p_action='approve' then
    -- Godkjenn berre etter at e-post er verifisert av Supabase Auth.
    if not exists (select 1 from auth.users u where u.id=p_user_id and u.email_confirmed_at is not null) then
      raise exception 'Brukaren må stadfesta e-posten først' using errcode='22023';
    end if;
    update public.staff_profiles set role=coalesce(p_role,role),confirmed=true,disabled=false,
      updated_at=now() where id=p_user_id;
  elsif p_action='update' then
    update public.staff_profiles set role=coalesce(p_role,role),
      full_name=coalesce(nullif(trim(p_full_name),''),full_name),
      updated_at=now() where id=p_user_id;
  elsif p_action='disable' then
    update public.staff_profiles set disabled=true,updated_at=now() where id=p_user_id;
  elsif p_action='enable' then
    update public.staff_profiles set disabled=false,updated_at=now() where id=p_user_id;
  end if;
  return jsonb_build_object('ok',true,'user_id',p_user_id,'action',p_action);
end;
$$;
revoke all on function public.staff_admin_action(text,uuid,text,text) from public, anon;
grant execute on function public.staff_admin_action(text,uuid,text,text) to authenticated;