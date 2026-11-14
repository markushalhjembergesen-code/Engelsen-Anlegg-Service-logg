# Engelsen Anlegg ServiceLogg v75 – felles innlogging

Dette er **eit klargjort prosjekt**, ikkje ei nettside som er aktivert. Det krev eit ekte Supabase-prosjekt før bruk. GitHub Pages eller Upfling kan visa appen, medan Supabase står for sikre kontoar og felles maskindata. **IKKJE erstatt den fungerande nettsida før alle punkta nedanfor er gjorde og testa.**

## Innhald

- `index.html` – same ServiceLogg-grensesnittet som før, men med eit nytt innloggingsskjermbilete.
- `legacy.js` – funksjonane frå ServiceLogg v74 (maskinregister, servicebok, feilmeldingar, rapportar, tilsette).
- `cloud.js` – Supabase-pålogging, overføring til felles database, status for lagring, import/sikkerheitskopi.
- `config.js` – **fyll inn Supabase-URL og publiserbar/anon-nøkkel**. Dette er IKKJE hemmelege nøklar.
- `supabase/schema.sql` – tabellar og tilgangsreglar (RLS).
- `supabase/bootstrap_admin.sql` – gjer den første Auth-brukaren til administrator.
- `supabase/functions/manage-staff/index.ts` – opprett, endre og slett tilsette. Administratorrett blir kontrollert på serveren.
- `supabase/functions/confirm-staff/index.ts` – sjekkar privat sekssifra stadfestingskode på serveren med sperre etter fleire feil.

## Oppsett i Supabase

1. Lag eit **Supabase-prosjekt** på https://supabase.com/dashboard.
2. Opna **SQL Editor**, lim inn `supabase/schema.sql` og køyr. Merk at dette opprettar nye tabellar og RLS-reglar. Det er skrive for eit prosjekt som ikkje har andre tabellar med desse namna.
3. Gå til **Authentication → Users → Add user**. Opprett di eiga e-postadresse med ein ny **8-sifra PIN** (passordfeltet), og vel stadfesta/auto-confirm e-post. Dette er den første administratoren.
4. Opna `supabase/bootstrap_admin.sql`, byt ut `SKRIV_INN_EPOST_TIL_ADMINISTRATOREN` med e-posten du oppretta, og køyr i SQL Editor.
5. Slå AV **Allow new users to sign up** i Authentication → Providers → Email / General Settings (menypunkt kan endra namn). Berre administratoren skal kunna oppretta tilsette frå appen.
6. Bruk Supabase CLI eller Supabase-koplinga til å publisera Edge Functions `manage-staff` og `confirm-staff`. Funksjonane krev JWT-verifisering (ikkje slå av den). Dei bruker automatisk `SUPABASE_URL` og `SUPABASE_SERVICE_ROLE_KEY` inne på serveren; legg **aldri** sistnemnde nøkkel i GitHub.
7. I Supabase **Project Settings → API**, kopier prosjekt-URL og **publishable key** (eller legacy `anon`-nøkkel). Lim inn i `config.js`. Berre desse to offentlege verdiane skal liggja i nettsida.
8. Last opp **alle fire filene** `index.html`, `cloud.js`, `legacy.js` og `config.js` til same mappe på Upfling eller GitHub Pages. `index.html` åleine er ikkje nok. Med GitHub Pages må `index.html` liggja i rotmappa og Pages vera aktivert.
9. Opna nettsida, logg inn som administrator, opprett ein testtilsett med **8-sifra PIN**. Administrator får ein sekssifra kode som må delast privat, separat frå PIN-koden. Test innlogging og stadfesting på ein **annan PC eller i eit privat nettlesarvindauge**.
10. Registrer ei testmaskin og ei feilmelding på kvar sin PC. Trykk **Oppdater data** for å henta siste registreringar. Kontrollér at begge ser dei same dataa.

## Kva som er annleis i v75

- Nettutgåva bruker Supabase Auth med **8 siffer** i staden for dei gamle lokale 4–8 siffer. Lokalt lagra PIN-hashar blir **ikkje** overførte til Supabase. Administrator må oppretta kontoane på nytt i felles system.
- Maskinførar, Lastebilsjåfør og Alt mulig har Oversikt/Rapporter. Service folk har også Maskinregisteret/Service bok. Administrator har alt. Databasen kontrollerer rettane, ikkje berre menyen.
- Data synkroniserer når brukaren lagrar ei føring; status for felles lagring står nede til høgre. Dersom nettverket feilar, blir statusen **raud**, og ein må få han grøn før ein reknar endringa som ferdig lagra.
- Andre brukarar sine endringar blir henta ved å trykkja **Oppdater data** eller opna sida på nytt. Dette er ikkje full sanntidssynkronisering.
- Første gong v75 blir opna på same nettadresse der eldre data finst, blir gamle registreringar lagra som ein lokal tryggleikskopi, og administrator kan bruka **Importer gamle data**. Importen hoppar over identiske ID-ar som alt er i databasen.
- Eksisterande lokale data på **andre nettadresser eller lokale HTML-filer** kan ikkje lesast automatisk på grunn av nettlesaren sine tryggleiksreglar. Ikkje slett dei gamle filene eller nettlesardata.
- `Sikkerheitskopi` lagrar ein JSON-kopi av dataa som er henta inn på denne PC-en, ikkje ein full databaseeksport. Ta også jamleg sikkerheitskopi av Supabase-databasen.

## Tryggleik

- Ikkje publiser `SUPABASE_SERVICE_ROLE_KEY`, SQL-påloggingspassord eller brukarane sine PIN-kodar på GitHub.
- Tilsette må ikkje dela PIN og stadfestingskode i same melding.
- Dei offentlege HTML- og JS-filene kan alle lesa, men Supabase Auth/RLS vernar databaseinnhaldet og skriveoperasjonane.
- PIN-kodar med åtte siffer er svakare enn lange passord. Bruk Supabase sitt angrepsvern/rate limiting, og vurder seinare sterkare innlogging eller e-postbasert eingongskode/MFA.
- Denne versjonen har fått grunnleggjande automatisert grensesnitttest med ein **falsk/mock Supabase-tenar**, men ikkje ein ende-til-ende-test mot ein ekte Supabase-konto. Før produksjonsbruk må ekte innlogging, stadfesting, RLS og kopiering av alle eksisterande registreringar testast.

## Kjende avgrensingar

- Ein ny publisering krev både SQL og Edge Functions, ikkje berre HTML. Dersom skjermen viser «Denne versjonen er ikkje kopla til Supabase», er `config.js` enno ikkje fylt inn.
- Når fleire redigerer **same** føring samtidig, kan den siste lagringa overta. Ulike feilmeldingar blir lagra som separate rader og kan registrerast parallelt.
- Role-/datamodellen er eit første fleirbrukaroppsett og bør gjennomgåast før ein bruker han med sensitive opplysningar om tilsette eller kundar.