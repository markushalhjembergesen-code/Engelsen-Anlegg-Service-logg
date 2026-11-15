-- Køyr etter at DU har registrert e-posten din og stadfesta han.
-- Byte ut namnet i anførselsteikn nedanfor med di eiga e-postadresse.
-- Denne fila skal køyrast manuelt i Supabase SQL Editor av prosjekteigaren.
do $$
declare v_email text := lower('SETT_INN_DIN_EPOST_HER');
declare v_id uuid;
begin
  if v_email='sett_inn_din_epost_her' then
    raise exception 'Skriv inn di eiga e-postadresse fyrst';
  end if;
  select u.id into v_id from auth.users u
   where lower(u.email)=v_email and u.email_confirmed_at is not null;
  if v_id is null then raise exception 'E-postadressa må registrerast og stadfestast i ServiceLogg fyrst'; end if;
  insert into public.staff_profiles (id,email,full_name,role,confirmed,disabled)
  select id,lower(email),coalesce(nullif(trim(raw_user_meta_data->>'full_name'),''),'Administrator'),
       'administrator',true,false from auth.users where id=v_id
  on conflict(id) do update set role='administrator',confirmed=true,disabled=false,updated_at=now();
end $$;