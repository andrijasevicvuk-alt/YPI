# Master plan projekta i podatkovnog sloja

## 1. Svrha dokumenta
Ovaj dokument definira stvarni smjer projekta: sustav je market comparison engine i search UI za procjenu cijena mediteranskih plovila.

End product nije worker data-entry alat i nije admin panel. Ručni unos i CSV import postoje samo kao bootstrap/admin alati za rane podatke, testiranje i iznimne korekcije. Glavna vrijednost proizvoda je da korisnik unese ciljano plovilo, dobije relevantne usporedive brodove i vidi branljiv raspon cijene s objašnjenjem.

Glavni korisnički tok:

`input boat -> retrieve comparables -> compute price range -> explain result`

Glavna podatkovna logika ostaje nepromijenjena:

`raw -> normalized -> valuation-ready -> scoring -> search/comparison UI`

## 2. Temeljni problem koji rješavamo
Korisnik treba odgovoriti na konkretno tržišno pitanje:

"Koji su najbolji usporedivi mediteranski primjeri za ovo plovilo i koji je branljiv raspon cijene?"

Zbog toga sustav mora podržati:
- pouzdan builder/model matching
- nearest-year fallback
- razliku između private, charter i ex-charter statusa
- objašnjiv izračun preporučenog raspona
- trag izvora i kvalitete podataka
- pretraživanje i filtriranje nad čistim tržišnim datasetom

## 3. Product framing
Sustav se gradi kao:
- search interface za mediteranske cijene brodova
- market comparison engine za usporedive oglase
- valuation-ready data product koji scoring engine može koristiti
- interni alat za donošenje branljivih procjena cijene

Sustav se ne gradi kao:
- chat tražilica
- primarno worker data-entry sučelje
- admin panel za ručno održavanje baze
- scraper bez podatkovne kontrole

Manual entry i CSV import ostaju korisni, ali samo kao pomoćni admin/bootstrap tokovi. Core product je rezultat nad valuation-ready datasetom.

## 4. Zašto je podatkovni sloj najteži dio
Najveći rizik projekta nije UI ni osnovni SQL, nego činjenica da:
- ne postoji jedan kvalitetan javni API za sve relevantne oglase
- podaci po oglasnicima nisu standardizirani
- ista brodica može biti objavljena na više mjesta
- status ownershipa često nije eksplicitno označen
- godina, model, varijanta i motor mogu biti napisani na više načina
- tražena cijena nije isto što i realizirana cijena
- izvori se mijenjaju, brišu oglase i mijenjaju strukturu stranice

Zato se projekt mora voditi kao data acquisition + data quality sustav. Scraping je primarni način akvizicije tržišnih podataka, ali scraping smije puniti samo raw ingestion sloj. Poslovna logika radi tek nad normaliziranim i valuation-ready podacima.

## 5. Valuation-ready dataset kao core product layer
Valuation-ready dataset je najvažniji proizvodni sloj sustava.

On predstavlja tržišne zapise koji su:
- prikupljeni iz raw izvora
- parsirani i normalizirani
- mapirani na kanonski builder/model/variant
- očišćeni po valuti, lokaciji, ownership statusu i osnovnim tehničkim poljima
- deduplikacijski obrađeni ili barem označeni
- dovoljno kvalitetni za scoring i prikaz u search/comparison UI-ju

UI i scoring ne čitaju raw tablice direktno. Raw sloj služi za audit, reprocessing i debug. Normalized sloj služi za strukturiranje. Valuation-ready sloj je proizvodni sloj za tržišnu usporedbu.

## 6. Glavni arhitekturni slojevi

### 6.1 Ingestion layer
Zadužen je za dohvat sirovih podataka iz:
- marketplace i broker scrapinga
- pilot adaptera
- budućih kontroliranih feedova/API-ja ako se pojave
- ručnog unosa kao admin/bootstrap alata
- CSV importa kao admin/bootstrap alata

Izlaz ovog sloja je raw zapis sa source traceom i što manje pretpostavki.

### 6.2 Pipeline layer
Pretvara sirove zapise u kontrolirani standard:
- builder
- model
- variant
- year
- ownership status
- location
- currency
- asking price
- motori
- tehničke dimenzije

Ovdje se radi extraction, canonical mapping, unit/currency normalization, validation, dedupe priprema i quality signal.

### 6.3 Valuation-ready layer
Objavljuje samo zapise koji su dovoljno čisti za search, comparison i scoring.

Ovaj sloj mora sadržavati sve što UI treba za usporedive brodove:
- canonical builder/model/variant
- godina i fallback signal
- ownership status
- lokacija
- cijena u standardiziranoj valuti
- source trace
- reliability i quality signali
- razlog uključenja ili isključenja

### 6.4 Scoring layer
Računa relevantnost comparablesa i preporučeni raspon cijene. Ne dohvaća raw podatke i ne zna ništa o scraperima.

### 6.5 UI layer
Web app je primarno search and comparison interface:
- korisnik unosi ciljano plovilo
- sustav dohvaća valuation-ready comparables
- scoring engine rangira i objašnjava rezultate
- summary prikazuje raspon cijene, medianu/prosjek i confidence

UI je read-only prema valuation-ready sloju za glavni product flow. Admin/bootstrap forme smiju postojati, ali nisu core product.

## 7. Redefinirani roadmap

### Phase 1 - Foundation (već napravljeno)
Cilj:
- repo scaffold
- osnovne Next.js/TypeScript/Supabase granice
- raw ingestion temelj
- source registry temelj
- normalized core schema
- manual entry bootstrap path prema raw sloju
- pipeline contracts

Manual entry ovdje služi samo da sustav ima kontrolirani ulaz dok data engine i scraping nisu gotovi.

### Phase 2 - Data engine
Cilj:
- implementirati raw -> normalized pipeline
- field extraction
- builder/model/variant mapping
- ownership/location/currency normalization
- validation i review signals
- publication u normalized i valuation-ready sloj

Bez ovog sloja search UI i scoring ne smiju postati glavni product.

### Phase 3 - Scraping (1-2 izvora prvo)
Cilj:
- odabrati 1 do 2 izvora s najvećom poslovnom vrijednošću
- napraviti source adaptere i snapshot fixtures
- puniti raw ingestion iz stvarnih marketplace/broker izvora
- povezati adaptere s pipelineom
- pratiti promjene cijene, stale/removed signale i parser health

Scraping je primarni acquisition model, ali širi se tek nakon što pipeline radi nad pilot izvorima.

### Phase 4 - Search and comparison UI (glavni proizvod)
Cilj:
- strukturirana forma za ciljano plovilo
- dohvat comparable kandidata iz valuation-ready sloja
- prikaz rezultata, source tracea i osnovnih quality signala
- summary panel za branljiv raspon cijene
- jasno označen nearest-year fallback

Ovo je glavni korisnički proizvod, ne admin panel.

### Phase 5 - Scoring and intelligence improvements
Cilj:
- bolji scoring weights
- kvalitetniji confidence model
- bolji duplicate handling
- explainability poboljšanja
- veći source coverage
- price history i trendovi
- regression testovi za mapping i scoring pravila

## 8. Što mora biti automatizirano, a što ostaje ručno
Automatizirati treba:
- dohvat HTML-a / feedova gdje je dopušteno i stabilno
- ekstrakciju polja
- normalizaciju valute i jedinica
- dedupe scoring
- označavanje stale / removed oglasa
- price history snapshoting
- review queue za problematične zapise
- publication u valuation-ready dataset

Ručno ostaje:
- verifikacija spornih modela i varijanti
- korekcija ownership statusa kad nije jasan
- unos internih bilješki
- potvrda važnih pravila mapiranja
- odobrenje parsera prije produkcije
- bootstrap/admin unos u iznimnim slučajevima

## 9. Definicija uspjeha za MVP
MVP je uspješan kad:
- postoji raw -> normalized -> valuation-ready pipeline
- postoje 1 do 2 pilot scraping izvora
- valuation-ready dataset ima dovoljno kvalitetnih mediteranskih comparablesa
- search UI može dohvatiti i prikazati usporedive brodove
- scoring vraća objašnjiv ranking i preporučeni raspon cijene
- svaki rezultat ima source trace i quality signal
- nearest-year fallback je jasno označen
- manual entry i CSV import postoje samo kao admin/bootstrap alati, ne kao glavni product flow
