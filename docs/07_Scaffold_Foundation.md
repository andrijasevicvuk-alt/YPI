# Scaffold foundation

## Svrha
Ovaj dokument opisuje što je pripremljeno u scaffold/foundation fazi projekta i kako se ta faza uklapa u stvarni product direction.

End product nije worker data-entry alat. End product je search and comparison UI za mediteranske cijene brodova, podržan valuation-ready datasetom i scoring logikom.

## Trenutni stav projekta
- projekt se gradi od nule i solo
- ne koristi se Kaggle dataset
- još ne postoji potvrđen vanjski dataset
- glavni product flow je `input boat -> retrieve comparables -> compute price range -> explain result`
- scraping marketplace i broker izvora je primarni acquisition model za pravi tržišni dataset
- manual entry i CSV import su bootstrap/admin alati, ne core product feature
- raw -> normalized -> valuation-ready arhitektura ostaje glavno pravilo

## Arhitekturne granice
- `apps/web` je primarno search and comparison UI, uz moguće admin/bootstrap rute
- `packages/domain` drži zajedničke tipove i controlled vocabulary
- `packages/data-access` definira query boundary
- `packages/scoring` ostaje odvojen od acquisition logike
- `services/ingestion` prima raw input iz scrapinga, CSV-a ili ručnog admin unosa
- `services/pipeline` vodi raw u normalized i valuation-ready
- `services/scrapers` drži marketplace/broker adaptere i fixtures

## Uloga manual entry i CSV importa
Manual entry i CSV import postoje zato da solo-built projekt može napredovati prije stabilnih scraping adaptera.

To znači:
- ručni unos mora ići u raw ingestion tablice
- CSV import mora ići u raw ingestion tablice
- source registry mora postojati i za admin/bootstrap izvore
- UI i scoring ne čitaju raw tablice direktno
- ovi tokovi ne definiraju glavni product UX

Glavni proizvodni podatkovni tok dolazi kroz scraping i pipeline u valuation-ready dataset.

## Raw to valuation-ready princip
Scaffold je postavljen tako da se zadrži jezgra sustava:

`raw -> normalized -> valuation-ready -> scoring -> search/comparison UI`

To ostaje glavno pravilo za sve daljnje migracije i implementaciju servisa.

## Step 1-3 status
Step 1-3 rad i dalje vrijedi kao foundation.

Trenutno implementirano:
- repo scaffold
- osnovne Next.js/TypeScript/Supabase granice
- raw ingestion i source registry temelj
- normalized core schema za `boats`, `engines`, `listings`, `price_history`, `worker_notes`
- mapping/reference tablice za builder/model/variant, ownership status i osnovnu location normalizaciju
- lineage veza `raw_listings -> listings` preko `listings.raw_listing_id`
- manual-entry admin/bootstrap forma koja ne upisuje direktno u normalized tablice
- server-side submit preko `submit_manual_entry` RPC funkcije koja stvara `ingest_runs`, `raw_listings` i `worker_manual_entries`
- Python contracts za extraction, normalization, validation i publication korake

Ovo nije finalni proizvod. Ovo je temelj koji omogućuje sljedeći data engine i scraping rad.

## Trenutni raw ingestion flow za manual entry
Aktivni tok za manual entry sada izgleda ovako:

`admin/bootstrap forma -> server action -> data-access query layer -> submit_manual_entry RPC -> ingest_runs + raw_listings + worker_manual_entries`

Bitna pravila:
- source trace ostaje jasan kroz `source_sites`, `acquisition_method = manual_entry` i payload metadata `origin = manual_entry`
- manual entry ostaje audit-first bootstrap input, ne business-safe normalized zapis
- normalized tablice postoje kao cilj publication faze, ali ih Step 3 još ne puni automatski

## Što ostaje stubano
Namjerno nije implementirano u ovoj fazi:
- puna ekstrakcija polja iz raw payloada
- canonical mapping logika za builder/model/variant
- unit i currency normalization
- business validation pravila
- review queue generiranje
- dedupe i quality scoring
- publication u valuation-ready sloj
- scraping adapteri
- search/comparison UI kao glavni product flow
- puni CSV import workflow

## Redefinirani roadmap

### Phase 1 - Foundation (već napravljeno)
Scaffold, raw ingestion temelj, source registry, normalized core schema, manual entry bootstrap path i pipeline contracts.

### Phase 2 - Data engine
Implementirati raw -> normalized pipeline, canonical mapping, normalization, validation i publication u valuation-ready sloj.

### Phase 3 - Scraping
Uvesti 1 do 2 marketplace/broker izvora, napraviti adaptere, raw snapshots, parser fixtures i povezati ih s pipelineom.

### Phase 4 - Search and comparison UI
Izgraditi glavni product UI: unos ciljanog plovila, dohvat valuation-ready comparablesa, prikaz rezultata i summary raspona cijene.

### Phase 5 - Scoring and intelligence improvements
Poboljšati scoring, confidence model, duplicate handling, explainability, source coverage i price history/trendove.

## Uloga web appa
Web app je primarno search and comparison interface.

Web app nije:
- primarni admin panel
- data-entry tool kao end product
- mjesto gdje se ručno gradi tržišni dataset
- direktni čitač raw ingestion sloja

Admin/bootstrap rute smiju postojati, ali glavni proizvodni UI mora raditi nad valuation-ready datasetom.

## Step 3 compliance fix
Nakon lokalne provjere aplikacije napravljen je dodatni Step 3 fix pass.

Ispravljeno:
- manual entry forma više ne čita `state.values` prije sigurne inicijalizacije statea
- inicijalni form state premješten je iz server action modula u neutralni `form-state.ts`
- forma normalizira state prije čitanja `defaultValue` vrijednosti
- worker-facing UI tekst na rutama `/`, `/manual-entry`, `/csv-import` i `/architecture` preveden je na hrvatski

Arhitektura nije promijenjena:
- ručni unos i dalje ide prvo u raw ingestion sloj
- nema scrapinga
- nema dedupea
- nema scoringa
- nema valuation-ready publicationa
