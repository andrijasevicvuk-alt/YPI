# Scaffold foundation

## Svrha
Ovaj dokument opisuje sto je pripremljeno u scaffold fazi projekta i koja pravila vrijede prije pune implementacije ingestiona, pipelinea i kasnijeg pilot scrapinga.

## Trenutni stav projekta
- projekt se gradi od nule
- ne koristi se Kaggle dataset
- jos ne postoji potvrden vanjski dataset
- sustav mora raditi i ako prvi korisni podaci dolaze samo iz manual entry procesa
- CSV import postoji kao kontrolirani sekundarni path
- pilot marketplace i broker scraping dolaze kasnije

## Arhitekturne granice
- `apps/web` je worker aplikacija
- `packages/domain` drzi zajednicke tipove i controlled vocabulary
- `packages/data-access` definira query boundary
- `packages/scoring` ostaje odvojen od acquisition logike
- `services/ingestion` prima raw input
- `services/pipeline` vodi raw u normalized i valuation-ready
- `services/scrapers` je samo pripremljena granica za kasniji pilot rad

## Prvi garantirani input path
Prvi garantirani input path je manual entry.

To znaci:
- worker unos mora ici u raw ingestion tablice
- source registry mora postojati i za manual input
- UI i scoring ne citaju raw tablice direktno

## CSV import pravilo
CSV import je podrzan, ali:
- ne definira arhitekturu projekta
- ne pretpostavlja jedan fiksni shape
- prvo zapisuje raw payload i source trace

## Raw to valuation-ready princip
Scaffold je postavljen tako da se zadrzi jezgra sustava:

`raw -> normalized -> valuation-ready`

To ostaje glavno pravilo za sve daljnje migracije i implementaciju servisa.

## Step 3 status
Step 3 sada uvodi minimalni normalized core schema i prvi stvarni app -> raw ingestion wiring.

Trenutno implementirano:
- nova migracija za normalized core tablice `boats`, `engines`, `listings`, `price_history`, `worker_notes`
- mapping/reference tablice za `boat_builders`, `boat_models`, `boat_variants`, ownership status i osnovnu location normalizaciju
- lineage veza `raw_listings -> listings` preko `listings.raw_listing_id`
- app manual-entry forma koja ne upisuje direktno u normalized tablice
- server-side submit preko `submit_manual_entry` RPC funkcije koja stvara `ingest_runs`, `raw_listings` i `worker_manual_entries`
- Python contracts za extraction, normalization, validation i publication korake

## Trenutni raw ingestion flow
Aktivni tok za manual entry sada izgleda ovako:

`worker forma -> server action -> data-access query layer -> submit_manual_entry RPC -> ingest_runs + raw_listings + worker_manual_entries`

Bitna pravila:
- source trace ostaje jasan kroz `source_sites`, `acquisition_method = manual_entry` i payload metadata `origin = manual_entry`
- manual entry ostaje audit-first input, ne business-safe normalized zapis
- normalized tablice postoje kao cilj publication faze, ali ih Step 3 jos ne puni automatski

## Sto ostaje stubano
Namjerno nije implementirano u ovoj fazi:
- puna ekstrakcija polja iz raw payloada
- canonical mapping logika za builder/model/variant
- unit i currency normalization
- business validation pravila
- review queue generiranje
- dedupe i quality scoring
- publication u valuation-ready sloj
- puni CSV import workflow

To ostaje posao sljedece faze, ali granice su sada eksplicitne i spremne za nadogradnju.
