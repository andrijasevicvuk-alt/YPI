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
