# Step 3 verifikacija manual-entry ingestiona

## Svrha
Ovaj dokument definira minimalnu provjeru da ručni admin/bootstrap unos ide kroz ispravan Step 3 tok:

`manual-entry forma -> server action -> data-access query layer -> submit_manual_entry RPC -> ingest_runs + raw_listings + worker_manual_entries`

Provjera mora potvrditi:
- zapis se prvo sprema u raw ingestion sloj
- source trace i manual-entry origin ostaju vidljivi
- submit path ne upisuje direktno u normalized business tablice
- raw-to-normalized pipeline, scraping i valuation-ready publication se ne pokreću u ovom koraku

## Preduvjeti za lokalni Supabase/PostgREST
Na ovom repou trenutno postoje migracije i seed podaci u `supabase/`, ali lokalni runtime zahtijeva instalirane vanjske alate:
- Docker Desktop
- Supabase CLI

Ako `supabase/config.toml` još ne postoji lokalno, inicijaliziraj Supabase config iz root direktorija repoa:

```powershell
supabase init
```

Zatim pokreni lokalne servise i primijeni migracije/seed:

```powershell
supabase start
supabase db reset
supabase status
```

`supabase status` treba prikazati lokalni API URL, obično:

```text
API URL: http://127.0.0.1:54321
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

Za web app postavi lokalne varijable okoline prema vrijednostima iz `supabase status`:

```powershell
$env:SUPABASE_URL="http://127.0.0.1:54321"
$env:SUPABASE_SERVICE_ROLE_KEY="<service_role key iz supabase status>"
npm.cmd run dev:web
```

## Primjer ručnog submit testa kroz aplikaciju
Otvori:

```text
http://localhost:3000/manual-entry
```

Unesi primjer:

```text
Admin / inicijali: test-admin
URL oglasa: https://example.test/listings/lagoon-42-step3-smoke
Source listing key: step3-smoke-lagoon-42
Naslov: Lagoon 42 Step 3 Smoke Test
Builder: Lagoon
Model: 42
Varijanta: Owner Version
Godina: 2020
Tražena cijena: 420000
Valuta: EUR
Lokacija: Hrvatska, Split
Ownership status: private
Motor: 2x Yanmar 57 HP
Opis: Kontrolirani Step 3 smoke test za manual-entry raw ingestion.
Interna bilješka: Ovaj zapis mora ostati u raw ingestion sloju.
```

Očekivani UI rezultat:
- forma prikazuje uspješnu poruku da je unos spremljen u sirovi ingestion sloj
- receipt prikazuje `rawListingId`, `manualEntryId`, `ingestRunId`, `sourceName = internal_manual_entry` i `acquisitionMethod = manual_entry`

## SQL smoke test bez web forme
Za brzu DB/RPC provjeru može se pokrenuti:

```powershell
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f supabase/verify_step3_manual_entry.sql
```

Skripta poziva `submit_manual_entry`, provjerava raw ingestion zapise i radi `ROLLBACK`, pa ne ostavlja testni zapis u bazi.

## SQL provjere nakon submitanja kroz web app
Ako je submit napravljen kroz aplikaciju, koristi `source_listing_key` iz primjera:

```sql
select
  ir.id as ingest_run_id,
  ir.acquisition_method,
  ir.trigger_type,
  ir.status,
  ir.record_count,
  ir.notes,
  ss.source_name,
  ss.source_type,
  ss.allowed_collection_method
from public.ingest_runs ir
join public.source_sites ss on ss.id = ir.source_site_id
where ir.acquisition_method = 'manual_entry'
order by ir.started_at desc
limit 5;
```

```sql
select
  rl.id as raw_listing_id,
  rl.ingest_run_id,
  rl.acquisition_method,
  rl.source_listing_key,
  rl.raw_title,
  rl.raw_price_text,
  rl.raw_location_text,
  rl.ingest_status,
  rl.raw_payload_json->>'origin' as origin,
  rl.raw_payload_json->>'submitted_via' as submitted_via,
  rl.raw_payload_json->>'raw_ingestion_target' as raw_ingestion_target,
  rl.raw_specs_json->>'builder_input' as builder_input,
  rl.raw_specs_json->>'model_input' as model_input
from public.raw_listings rl
where rl.source_listing_key = 'step3-smoke-lagoon-42';
```

```sql
select
  wme.id as manual_entry_id,
  wme.raw_listing_id,
  wme.entered_by,
  wme.builder_input,
  wme.model_input,
  wme.year_input,
  wme.asking_price_input,
  wme.currency_input,
  wme.location_input,
  wme.ownership_status_hint,
  wme.raw_notes
from public.worker_manual_entries wme
join public.raw_listings rl on rl.id = wme.raw_listing_id
where rl.source_listing_key = 'step3-smoke-lagoon-42';
```

Provjera da submit nije direktno objavio normalized business zapise:

```sql
select 'boats' as table_name, count(*) as matching_rows
from public.boats
where primary_raw_listing_id in (
  select id from public.raw_listings where source_listing_key = 'step3-smoke-lagoon-42'
)
union all
select 'engines', count(*)
from public.engines
where boat_id in (
  select b.id
  from public.boats b
  join public.raw_listings rl on rl.id = b.primary_raw_listing_id
  where rl.source_listing_key = 'step3-smoke-lagoon-42'
)
union all
select 'listings', count(*)
from public.listings
where raw_listing_id in (
  select id from public.raw_listings where source_listing_key = 'step3-smoke-lagoon-42'
)
union all
select 'price_history', count(*)
from public.price_history
where listing_id in (
  select l.id
  from public.listings l
  join public.raw_listings rl on rl.id = l.raw_listing_id
  where rl.source_listing_key = 'step3-smoke-lagoon-42'
)
union all
select 'worker_notes', count(*)
from public.worker_notes
where raw_listing_id in (
  select id from public.raw_listings where source_listing_key = 'step3-smoke-lagoon-42'
);
```

Očekivani rezultat za normalized provjeru:
- svi `matching_rows` su `0`

## Što ova provjera ne radi
Ova provjera namjerno ne radi:
- scraping
- dedupe
- quality scoring
- raw-to-normalized publication
- valuation-ready publication

Ti koraci pripadaju sljedećoj data-engine fazi.
