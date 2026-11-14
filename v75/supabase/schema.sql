-- Engelsen Anlegg ServiceLogg: felles database, berre for Supabase SQL Editor.
-- Køyr i eit NYTT Supabase-prosjekt. Ingen hemmelege nøklar i GitHub.

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

drop policy if exists records_read on public.app_records;
create policy records_read on public.app_records for select to authenticated
  using ((select private.active_staff_role()) in ('administrator','servicefolk')
    or ((select private.active_staff_role()) in ('maskinforar','lastebilsjafor','altmulig')
        and bucket in ('machines','faults')));

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
