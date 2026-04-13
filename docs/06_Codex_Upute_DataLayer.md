# Codex upute za data layer

## Tvoja uloga
Tvoj zadatak nije samo napisati UI ili nekoliko SQL tablica. Tvoj zadatak je implementirati podatkovni sloj koji omogućuje da alat daje branljive usporedbe tržišnih plovila na Mediteranu.

## Poslovni cilj
Sustav mora omogućiti tok:

`input boat -> retrieve comparables -> compute price range -> explain result`

Korisnik unosi ciljano plovilo i dobiva:
- najbolje usporedive oglase
- objašnjiv ranking
- preporučeni raspon cijena
- jasnu oznaku fallbacka i kvalitete podataka
- source trace za svaki rezultat

## Product framing
Ovo je market comparison engine i search UI za mediteranske cijene brodova.

Ovo nije:
- worker data-entry alat kao end product
- admin panel kao glavni UI
- chat search engine
- scraper bez data quality sloja

Manual entry i CSV import su bootstrap/admin alati. Scraping marketplace i broker izvora je primarni acquisition model za pravi tržišni dataset.

## Obvezni tehnički ciljevi
1. Implementirati raw -> normalized -> valuation-ready data flow.
2. Definirati valuation-ready dataset kao core product layer.
3. Ne spajati scraper logiku i business scoring logiku u isti modul.
4. Uvesti source registry i source-specific adaptere.
5. Uvesti mapping tablice i cleaning pipeline.
6. Uvesti quality score i duplicate handling.
7. Izložiti čist query layer za web aplikaciju.
8. Web app za glavni product flow mora čitati valuation-ready sloj, ne raw tablice.

## Roadmap

### Phase 1 - Foundation (već napravljeno)
- repo scaffold
- osnovne aplikacijske granice
- raw ingestion temelj
- normalized core schema
- manual entry bootstrap path
- pipeline contracts

### Phase 2 - Data engine
- extraction
- canonical mapping
- currency/unit normalization
- business validation
- publication u normalized i valuation-ready sloj

### Phase 3 - Scraping
- 1 do 2 pilot marketplace/broker izvora
- source adapters
- raw snapshots i fixtures
- parser testovi
- monitoring po izvoru

### Phase 4 - Search and comparison UI
- strukturirani unos ciljanog plovila
- dohvat comparablesa iz valuation-ready sloja
- results table
- summary panel
- source trace i quality explanation

### Phase 5 - Scoring and intelligence improvements
- bolji scoring weights
- confidence model
- duplicate handling
- price history/trendovi
- explainability poboljšanja

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
- ne pretvaraj admin/bootstrap ručni unos u glavni product flow

## Ne radi ovo
- ne pretvaraj aplikaciju u chat sučelje
- ne uvodi kompleksni search engine prije valuation-ready sloja
- ne spajaj sve u jednu skriptu
- ne čitaj raw podatke direktno iz UI-ja
- ne tretiraj manual entry kao core product feature
- ne preskači dokumentaciju

## Definicija gotovog MVP-a
MVP je gotov tek kad:
- aplikacija radi lokalno
- postoji jasan ingestion i cleaning pipeline
- 1 do 2 scraping izvora pune raw ingestion
- valuation-ready dataset postoji
- search/comparison UI radi nad valuation-ready slojem
- scoring radi nad čistim podacima
- nearest-year fallback radi
- UI prikazuje razlog matcha
- source trace i quality status su vidljivi
- dokumentacija je ažurna
