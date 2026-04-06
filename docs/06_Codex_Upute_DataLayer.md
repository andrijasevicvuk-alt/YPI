# Codex upute za data layer

## Tvoja uloga
Tvoj zadatak nije samo napisati UI ili nekoliko SQL tablica. Tvoj zadatak je implementirati podatkovni sloj koji omogućuje da interni alat daje branljive usporedbe tržišnih plovila.

## Poslovni cilj
Sustav mora omogućiti da radnik unese ciljno plovilo i dobije:
- najbolje usporedive oglase
- objašnjiv ranking
- preporučeni raspon cijena
- jasnu oznaku fallbacka i kvalitete podataka

## Obvezni tehnički ciljevi
1. Implementirati raw -> normalized -> valuation-ready data flow.
2. Ne spajati scraper logiku i business scoring logiku u isti modul.
3. Omogućiti ručni unos i CSV import prije punog scrapinga.
4. Uvesti source registry i source-specific adaptere.
5. Uvesti mapping tablice i cleaning pipeline.
6. Uvesti quality score i duplicate handling.
7. Izložiti čist query layer za web aplikaciju.

## Što moraš napraviti prvo
Prvo napiši plan implementacije, bez koda:
- predložena struktura foldera
- koje tablice i dataset slojeve uvodiš
- kako će raw ingestion teći do valuation-ready viewa
- koji dio je MVP, a koji je kasnija faza
- najveći rizici i kako ih mitigiraš

## Obavezna struktura repoa za data dio
Predložena struktura:

```text
/apps/web
/packages/domain
/packages/data-access
/packages/scoring
/services/ingestion
/services/pipeline
/services/scrapers
/docs
/supabase/migrations
/supabase/seed
/tests
```

## Pravila implementacije
- mali i logični commitovi
- svaki adapter ima test fixture
- svaka promjena scoring pravila ažurira dokumentaciju i testove
- svaka migracija mora biti verzionirana
- bez nepotrebnih biblioteka
- preferiraj čitljiv i održiv kod

## MVP opseg
Za MVP implementiraj:
- tablice za boats, engines, source_sites, listings, price_history, worker_notes
- dodatne raw ingestion i review tablice ako je potrebno
- seed dataset
- CSV import
- osnovni ingestion pipeline
- canonical mapping
- basic dedupe
- valuation-ready query/view
- pretragu i prikaz rezultata
- nearest-year fallback
- scoring explanation

## Ne radi ovo
- ne pretvaraj aplikaciju u chat sučelje
- ne uvodi kompleksni search engine bez potrebe
- ne spajaj sve u jednu skriptu
- ne čitaj raw podatke direktno iz UI-ja
- ne preskači dokumentaciju

## Definicija gotovog zadatka
Zadatak je gotov tek kad:
- aplikacija radi lokalno
- seed podaci rade
- postoji jasan ingestion pipeline
- scoring radi nad čistim podacima
- UI prikazuje razlog matcha
- fallback je jasno označen
- dokumentacija je ažurna
