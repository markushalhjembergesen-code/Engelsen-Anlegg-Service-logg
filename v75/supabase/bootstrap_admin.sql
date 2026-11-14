-- Køyr etter schema.sql og etter at første brukar er oppretta
-- i Supabase → Authentication → Users → Add user (stadfesta e-post).
-- Byt ut e-posten under med di eiga.
DO $$
DECLARE
  admin_email text := 'SKRIV_INN_EPOST_TIL_ADMINISTRATOREN';
  found_id uuid;
BEGIN
  select id into found_id from auth.users where lower(email)=lower(admin_email) limit 1;
  if found_id is null then
    raise exception 'Fann ikkje administratorkontoen i Authentication > Users.';
  end if;
  insert into public.staff_profiles(id,email,full_name,role,confirmed)
  values(found_id,lower(admin_email),'Administrator','administrator',true)
  on conflict(id) do update set role='administrator',confirmed=true,disabled=false;
END $$;
