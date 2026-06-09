# Step 4 verifikacija bootstrap pipelinea

## Svrha
Ovaj dokument definira ponovljivu lokalnu provjeru za Step 4 minimalni bootstrap data pipeline.

Step 4 je verificiran samo za uski tok:

`raw_listings -> extraction -> normalization -> validation -> boats + listings`

Provjera potvrđuje:
- validan pending raw zapis prelazi u `processed`
- `boats` dobiva zapis s `primary_raw_listing_id`
- `listings` dobiva zapis s `raw_listing_id`
- lineage prema izvornom `raw_listings.id` ostaje očuvan
- validan zapis ne stvara `ingest_errors`
- nevalidan pending raw zapis prelazi u `failed`
- nevalidan zapis stvara `ingest_errors` s `step4_validation` i `validation_failed`
- nevalidan zapis ne stvara `boats` ni `listings`

## Preduvjeti
Lokalni Supabase mora biti pokrenut i baza resetirana ili migrirana:

```powershell
supabase start
supabase db reset
supabase status
```

Postavi varijable okoline za pipeline:

```powershell
$env:SUPABASE_URL="http://127.0.0.1:54321"
$env:SUPABASE_SERVICE_ROLE_KEY="<secret key iz supabase status>"
```

## Valid path smoke test
Pripremi kontrolirani validan raw zapis:

```powershell
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v phase=setup_valid -f supabase/verify_step4_bootstrap_pipeline.sql
```

Pokreni Step 4 pipeline:

```powershell
python -m services.pipeline.bootstrap --limit 1
```

Očekivani pipeline output:

```json
{"status":"processed","boatId":"...","listingId":"...","issues":[]}
```

Provjeri rezultat:

```powershell
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v phase=check_valid -f supabase/verify_step4_bootstrap_pipeline.sql
```

## Invalid path smoke test
Pripremi kontrolirani nevalidan raw zapis bez buildera, modela, cijene i valute:

```powershell
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v phase=setup_invalid -f supabase/verify_step4_bootstrap_pipeline.sql
```

Pokreni Step 4 pipeline:

```powershell
python -m services.pipeline.bootstrap --limit 1
```

Očekivani pipeline output:

```json
{"status":"failed","boatId":null,"listingId":null}
```

Provjeri rezultat:

```powershell
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v phase=check_invalid -f supabase/verify_step4_bootstrap_pipeline.sql
```

## Što je verificirano
Lokalno je verificirano:
- raw loading iz `raw_listings`
- extraction iz kontroliranog manual/bootstrap payload oblika
- minimalna normalization kandidata za `boats` i `listings`
- validation za obavezne business signale
- publication u normalized core tablice
- status promjena `pending -> processed`
- status promjena `pending -> failed`
- zapis greške u `ingest_errors`
- lineage kroz `boats.primary_raw_listing_id` i `listings.raw_listing_id`

## Granica Step 4
Step 4 je kompletan samo za minimalni bootstrap raw-to-normalized pipeline.

Step 4 ne implementira:
- scraping adaptere
- scoring
- valuation-ready search UI
- geography weighting
- recency weighting
- confidence model
- valuation range calculation
- ranking comparablesa

Ti dijelovi ostaju Step 5+ i kasnije product faze.

## Tehnički dug
Trenutna publication implementacija koristi više Supabase REST poziva. To znači da publication nije atomska transakcija.

Prije većeg ingestion volumena treba dodati Step 4 hardening:
- transakcijski publication path, vjerojatno kroz RPC
- jasniji partial-publication recovery
- dodatni integration smoke test nakon `supabase db reset`

## Step 4 completion checklist
Step 4 je funkcionalno verificiran lokalno za minimalni bootstrap raw-to-normalized path.

Step 4 ukljucuje:
- loading pending zapisa iz `raw_listings`
- creation `RawListingEnvelope` objekta
- extraction kontroliranih manual/bootstrap polja
- normalization minimalnih kandidata za `boats` i `listings`
- validation obaveznih business signala
- publication u `boats` i `listings`
- `processed` status handling za validne zapise
- `failed` status handling za nevalidne zapise
- `ingest_errors` za validation failure
- lineage kroz `boats.primary_raw_listing_id`
- lineage kroz `listings.raw_listing_id`
- ponovljivu valid-path smoke provjeru
- ponovljivu invalid-path smoke provjeru

Step 4 ne ukljucuje:
- scoring
- ranking
- confidence model
- geography weighting
- recency weighting
- valuation range calculation
- search/comparison UI
- scraping adaptere
- full valuation-ready product layer
- production security implementation

## Known limitation: publication is not atomic
Trenutni publisher koristi vise Supabase REST poziva:
- resolve/insert builder
- resolve/insert model
- resolve/insert variant
- resolve/insert boat
- resolve/insert listing
- update raw status

Ovo je prihvatljivo za lokalnu Step 4 bootstrap verifikaciju, ali nije prihvatljivo za veci ingestion volume ili scraper-driven ingestion.

Moguci partial failure scenariji:
- builder/model se upisu, ali boat ili listing faila
- boat se upise, ali listing faila
- listing se upise, ali raw status update faila
- raw se oznaci kao `failed` nakon sto partial normalized rows vec postoje

Trenutne mitigacije:
- `listings.raw_listing_id` ima unique constraint i sprjecava duplicate listing publication za isti raw zapis
- builder/model/variant resolver prvo trazi postojeci canonical row
- boat idempotency postoji u kodu kroz lookup po `primary_raw_listing_id`
- Step 4C dodaje DB-level partial unique index na `boats.primary_raw_listing_id` za non-null vrijednosti

Nedostaje:
- nema DB transakcije preko cijelog publication toka
- nema formalne partial-publication recovery procedure

Future hardening preporuka:
- prije scraping volumena premjestiti publication u PostgreSQL RPC/funkciju ili ekvivalentnu transactional boundary
- dodati dodatne recovery smoke checks za partial publication scenarije
- dokumentirati rucni recovery postupak za partial publication slucajeve

## Step 4C idempotency verification
Step 4C dodaje ponovljivu provjeru da rerun istog raw zapisa ne stvara duplicate normalized rows.

Komande:

```powershell
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v phase=setup_valid -f supabase/verify_step4_bootstrap_pipeline.sql
python -m services.pipeline.bootstrap --limit 1
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v phase=check_valid -f supabase/verify_step4_bootstrap_pipeline.sql

psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v phase=reset_valid_pending -f supabase/verify_step4_bootstrap_pipeline.sql
python -m services.pipeline.bootstrap --limit 1
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v phase=check_valid -f supabase/verify_step4_bootstrap_pipeline.sql
```

Ocekivano:
- `boats` count za taj `raw_listing_id` ostaje `1`
- `listings` count za taj `raw_listing_id` ostaje `1`
- `raw_listings.ingest_status` se vraca na `processed`

## Partial-publication detection
Partial publication znaci da dio normalized rowova postoji, ali raw status ili kompletna lineage veza nisu u ocekivanom stanju.

Detekcija za jedan raw zapis:

```sql
select
  rl.id as raw_listing_id,
  rl.ingest_status,
  count(distinct b.id) as boats_for_raw,
  count(distinct l.id) as listings_for_raw,
  count(distinct ie.id) as ingest_errors_for_raw
from public.raw_listings rl
left join public.boats b on b.primary_raw_listing_id = rl.id
left join public.listings l on l.raw_listing_id = rl.id
left join public.ingest_errors ie on ie.raw_listing_id = rl.id
where rl.source_listing_key = 'step4-smoke-valid-lagoon-42'
group by rl.id, rl.ingest_status;
```

Sumnjiva stanja:
- `ingest_status = failed` uz `boats_for_raw > 0` ili `listings_for_raw > 0`
- `ingest_status = processed` uz `boats_for_raw <> 1`
- `ingest_status = processed` uz `listings_for_raw <> 1`
- `boats_for_raw = 1` i `listings_for_raw = 0`

Step 4C uniqueness/idempotency smanjuje rizik duplicate rowova, ali ne uklanja rizik partial publicationa. Atomic publication kroz RPC/funkciju i dalje ostaje preporuceni hardening prije scraping volumena.

## Step 4D deferred hardening gates
Step 4D nije potreban da bi se Step 4 zatvorio za MVP bootstrap pipeline. Trenutni Step 4 je prihvatljiv jer je lokalni, kontroliran, verificiran i idempotency je dodatno zasticen lineage uniqueness pravilima.

Step 4D je ipak obavezan prije:
- scheduled scraper-driven ingestion volumena
- velikih batch ingestova
- produkcijske ili bilo koje non-local upotrebe

Step 4D se ne smije zaboraviti. Ove stavke su namjerno deferred hardening gates, ne odbaceni posao.

### A. Atomic publication RPC/function
Zasto je vazno:
- trenutni publisher koristi vise Supabase REST poziva
- partial failure moze ostaviti builder/model/boat/listing u nekom medustanju
- scraper volume bi povecao vjerojatnost i cijenu takvih medustanja

Zasto je deferred sada:
- lokalni Step 4 bootstrap path je verificiran
- idempotency guardovi smanjuju duplicate rizik
- jos nema scheduled scraping volumena ni produkcijske upotrebe

Trigger za implementaciju:
- prije scheduled scraping volumena
- prije large batch ingestiona
- prije produkcijske upotrebe

Vjerojatni smjer implementacije:
- PostgreSQL RPC/funkcija koja objavljuje jedan `raw_listing_id` transakcijski
- funkcija create/find builder/model/variant
- funkcija create/find boat/listing
- funkcija oznacava raw listing kao `processed`
- funkcija zapisuje `ingest_errors` na failure gdje je prikladno

Buduci testovi:
- valid transaction objavi sve potrebne rowove
- forced failure rollbacka normalized writes
- rerun ostaje idempotentan

### B. Partial-publication recovery procedure
Trenutna detekcija:
- koristiti partial-publication detection query iz ovog dokumenta
- traziti nesklad izmedu `raw_listings.ingest_status`, `boats`, `listings` i `ingest_errors`

Primjeri partial stanja:
- boat postoji, ali listing nedostaje
- listing postoji, ali raw status nije `processed`
- raw je oznacen `failed`, ali partial normalized rows postoje

Zasto je full recovery deferred:
- nema scraping volumena
- atomic publication jos nije dizajniran
- rucni recovery je dovoljan za lokalni bootstrap ako se problem pojavi

Trigger:
- prije scheduled scrapinga
- prije bulk ingestiona
- prije produkcije

Buduci output:
- recovery SQL/check script
- dokumentirani manual recovery postupak
- moguca automated repair komanda

### C. Simulated mid-publication failure tests
Zasto su vazni:
- provjeravaju stvarna failure medustanja, ne samo validation failure
- dokazuju atomic rollback ili recovery behavior

Zasto su deferred:
- smisleni su tek nakon atomic publication ili recovery dizajna
- trenutni local bootstrap path vec ima valid/invalid/idempotency smoke pokrivenost

Buduci testovi:
- fail nakon builder/model resolutiona
- fail nakon boat creationa
- fail prije listing creationa
- fail prije raw status updatea
- potvrditi da nema orphan/partial rowova ili da recovery path radi

### D. Production auth/RLS/security implementation
Trenutni status:
- projekt je local/internal only
- admin/bootstrap rute nisu javne produkcijske rute
- service role key smije ostati samo server-side

Zasto je production security deferred:
- nema non-local deploya
- nema external usera
- nema pravog production dataseta

Trigger:
- prije non-local deploya
- prije external usera
- prije real production data

Buduca obavezna implementacija:
- authentication za admin/bootstrap rute
- authorization za admin-only operacije
- RLS ili backend-only access policy
- server-only enforcement za service role key
- odvojeni local/staging/production Supabase projekti
- key rotation prije deploya ako su kljucevi izlozeni u screenshotima/chatovima/logovima
- audit/logging policy
