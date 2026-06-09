# Security i operativna pravila

## 1. Trenutni security status
Projekt je trenutno lokalni i interni razvojni sustav.

Trenutno vrijedi:
- nema odobrenog produkcijskog ili javnog deploya
- `/manual-entry` i `/csv-import` su bootstrap/admin rute, ne javni product UI
- service role key smije se koristiti samo u lokalnom/internom server-side kontekstu
- web app glavni product flow kasnije mora raditi nad valuation-ready/query slojem, ne nad raw tablicama
- manual entry i CSV import ne smiju nikad pisati direktno u normalized business tablice

Ovaj dokument je security boundary za daljnji rad. Ako se sustav ikad pokrene izvan lokalnog/internog okruženja, pravila iz deployment gatea moraju biti riješena prije toga.

## 2. Secrets policy
Lokalne tajne ne smiju završiti u GitHub repou.

Pravila:
- `.env.local`, `.env`, `.env.*.local` i lokalni secret fajlovi ne smiju se commitati
- `SUPABASE_SERVICE_ROLE_KEY` je server-only tajna
- `SUPABASE_SERVICE_ROLE_KEY` se ne smije koristiti u client komponentama, browseru ili javnom JavaScript bundleu
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ili Supabase publishable key mogu biti javni, ali ne smiju zamijeniti service role key za server-side admin operacije
- ako je bilo koji secret prikazan u screenshotu, chatu, logu, issueu, commit historyju ili javnom outputu, mora se rotirati prije non-local upotrebe
- lokalni development ključevi iz `supabase status` smiju se koristiti samo za lokalni Supabase projekt

## 3. Supabase i RLS policy
Za lokalni razvoj i smoke testove trenutno je prihvatljivo koristiti service role iz server-side koda i pipeline jobova.

Prije bilo kakvog non-local deploya mora biti odlučeno:
- hoće li UI pristupati bazi samo kroz backend/server actions
- koje tablice dobivaju Row Level Security policies
- koje RPC funkcije smiju biti izložene kojem tipu korisnika
- kako se odvaja admin/bootstrap write path od read-only product UI-ja

Minimalno pravilo:
- UI ne smije direktno izlagati write access prema `raw_listings`, `worker_manual_entries`, `boats`, `engines`, `listings`, `price_history` ili drugim business tablicama
- product UI mora biti read-only prema valuation-ready/query sloju
- admin/bootstrap write path mora ostati server-side i autoriziran

## 4. Admin/bootstrap route policy
`/manual-entry` i budući `/csv-import` postoje samo za bootstrap/admin rad.

Pravila:
- nisu javne produkcijske rute
- prije produkcije moraju imati authentication i authorization
- moraju nastaviti pisati prvo u raw ingestion sloj
- ne smiju zaobići `raw -> normalized -> valuation-ready` arhitekturu
- ne smiju postati glavni product UX

## 5. Pipeline i job policy
Ingestion, pipeline i budući scraper poslovi moraju se pokretati server-side.

Pravila:
- pipeline koristi server-side credentials
- scraper adapteri ne smiju pisati direktno u normalized ili valuation-ready tablice
- svaki source adapter mora puniti raw ingestion i čuvati source trace
- budući scraper credentials trebaju biti least-privilege gdje je praktično moguće
- parser/source-specific logika ne smije biti spojena sa scoring logikom

## 6. Deployment gate
Prije bilo kakvog non-local ili javnog deploya mora postojati:
- authentication za admin/bootstrap rute
- authorization za admin/bootstrap akcije
- service role key zadržan isključivo server-side
- debug env logging uklonjen ili eksplicitno gated
- RLS ili backend-only access policy dokumentiran i implementiran
- odvojeni local, staging i production Supabase projekti
- backup/restore plan
- key rotation ako je bilo koji secret bio izložen
- abuse protection za RPC/admin submit paths
- odluka kako se logiraju i čuvaju ingest errors bez curenja osjetljivih podataka

Bez ovih uvjeta sustav ostaje lokalni/interni alat.

## 7. Deferred security items
Sljedeće ne blokira lokalni MVP, ali pripada kasnijem security hardeningu:
- puni incident response proces
- produkcijski security monitoring
- fine-grained user roles
- scraper proxy / anti-abuse infrastruktura
- rate limiting po korisniku i izvoru
- audit dashboard za administrativne akcije

## 8. Security implementation gates

### Now / local development
Trenutno je security posao dokumentacijski i operativni boundary, ne produkcijska implementacija.

Vrijedi sada:
- sustav ostaje local/internal only
- service role key se koristi samo server-side
- `.env.local` i lokalni secreti ne smiju u Git
- admin/bootstrap rute nisu javne produkcijske rute
- raw/normalized business tablice ne smiju biti izlozene direktno iz client UI-ja

### Before non-local deployment
Prije bilo kakvog non-local deploya moraju postojati:
- authentication za admin/bootstrap rute
- authorization za admin-only operacije
- RLS ili backend-only access policy
- potvrda da service role key ostaje iskljucivo server-side
- rotacija secreta ako su bili izlozeni u screenshotovima, chatovima, logovima ili commit historyju
- odvojeni local/staging/production Supabase projekti
- uklonjeno ili eksplicitno gated debug env logiranje

### Before real production operation
Prije rada sa stvarnim produkcijskim podacima i korisnicima trebaju postojati:
- backup/restore plan
- audit logging policy za admin i ingestion akcije
- incident response proces
- monitoring za aplikaciju, pipeline i Supabase
- least-privilege credentials za jobove gdje je prakticno moguce
- abuse protection za RPC/admin submit paths

## 9. Step 4 boundary
Step 4B ne implementira produkcijski security model.

Step 4B samo dokumentira:
- lokalni/internal-only status
- service role i secret granice
- admin/bootstrap route policy
- deployment gate prije produkcije

Implementacija auth/RLS/production securityja ostaje zaseban security hardening prije non-local deploya.
