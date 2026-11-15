# ServiceLogg v76 – felles innlogging og sjølvregistrering

## Status
Dette er ein klargjord og ikkje-produksjonstesta versjon. IKKJE erstatt offentleg `index.html` før databasen er sett opp og testa. Om det står at Supabase manglar, er det fordi `config.js` har ein plasshaldar for den offentlege API-nøkkelen. Det er ikkje eit fungerande innloggingssystem før det er sett opp.

## Kortaste vegen til felles innlogging
1. Supabase → SQL Editor: køyr heile `supabase/schema.sql` på prosjekt `pskaupzdqbvqbedveyrn`. Det opprettar tabellar, RLS og sjølvregistrering med administratorgodkjenning. SQL er idempotent for eit prosjekt med tidlegare v75-schema, men må gjennomgåast dersom prosjektet inneheld eigne tabellar.
2. Supabase → Project Settings → API Keys: hent **publishable key** (`sb_publishable_...`). Dette er ein offentleg nøkkel som kan stå i `config.js`. Send han til den som oppdaterer GitHub. **Ikkje** send `sb_secret_...` / `service_role`.
3. Supabase → Authentication → Providers → Email: sørg for at brukarar kan registrera seg og at e-poststadfesting er aktiv. Tilbakelenkja for e-post må tillatast under Authentication → URL Configuration: `https://markushalhjembergesen-code.github.io/Engelsen-Anlegg-Service-logg/` (eventuelt `/v76/` for test).
4. Opna testutgåva, trykk **Opprett ny brukar**, registrer di eiga adresse og stadfest e-posten.
5. I SQL Editor: opna `supabase/bootstrap_admin.sql`, set inn di eiga e-post og køyr. Dette gjer berre din stadfesta konto til administrator. Ingen offentleg første-brukar-admin-funksjon.
6. Test med to ulike nettlesarar: logg inn som admin i første, registrer ein tilsett med anna e-post i andre, godkjenn han under `Ansatte`, og test feilmelding. Kontroller at han er synleg hos admin etter «Oppdater data».
7. Når testen fungerer, flytt `index.html`, `legacy.js`, `cloud.js` og `config.js` til rota i GitHub Pages og send eksisterande nettadresse til tilsette. 

## Kva du får
- Tilsette opprettar sjølve konto med e-post og passord/PIN med minst 8 teikn.
- E-post må stadfestast, og administrator godkjenner konto/rolle i `Ansatte`.
- Tilsette kan ikkje setja eigen administratorrolle. SQL/RLS kontrollerer rollene på serveren.
- Administrator og servicefolk har tilgang til maskinar, service og feil. Dei andre kan lesa maskinar/feil og senda feilmeldingar.
- Endringar blir skrivne til `app_records` og kan hentast frå andre maskinar med «Oppdater data». Dette er ikkje live push.
- Ved import av tidlegare lokal informasjon kan berre data som finst på same nettadresse/PC hentast automatisk.

## Tryggleik
Ikkje legg `sb_secret`, `service_role` eller databasepassord i GitHub. Supabase-publiserbar nøkkel er offentleg etter design. Før produksjonsbruk må SQL/RLS og ekte pålogging med fleire brukarar testast. Gamle lokale PIN-kodar blir ikkje overførte.