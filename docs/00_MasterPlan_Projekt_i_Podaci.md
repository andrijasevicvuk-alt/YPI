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
- geografsku bliskost hrvatskom tržištu kao eksplicitni signal
- starost oglasa kao eksplicitni signal za confidence
- korištenje starijih oglasa za razumijevanje raspona i strukture tržišta
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

Valuation filozofija nije "Croatia-only pricing". Sustav je mediteranski valuation alat, ali lokalno usmjeren prema hrvatskoj tržišnoj realnosti:
- Hrvatska je primarni lokalni market anchor
- Slovenija je visoko relevantan susjedni mikro-market
- Adriatic listingi su jaki regionalni comparables
- širi Mediteran služi kao fallback i kontekst šireg tržišta

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

Važno:
- scoring i confidence u budućnosti moraju uz builder/model/variant/year/ownership/engine gledati i geografsku bliskost Hrvatskoj
- recentniji oglasi moraju imati jači signal trenutnog tržišta
- stariji oglasi nisu beskorisni; oni i dalje pomažu definirati raspon, floor/ceiling i strukturu tržišta
- stariji ili geografski udaljeniji oglasi smiju ostati fallback, ali uz niži confidence i jasnu oznaku
- treba jasno razlikovati price influence od confidence influence
- ova pravila ne ulaze u Step 4 implementaciju; služe kao smjer za Step 5 i valuation-ready scoring logiku

Konceptualno:
- comparable može imati price influence i kad je stariji
- isti comparable može imati slabiji confidence influence ako je star, dalek ili ako je dostupno malo usporedbi
- starost sama po sebi ne čini podatak bezvrijednim; smanjuje sigurnost procjene trenutnog tržišnog stanja

### 6.5 UI layer
Web app je primarno search and comparison interface:
- korisnik unosi ciljano plovilo
- sustav dohvaća valuation-ready comparables
- scoring engine rangira i objašnjava rezultate
- summary prikazuje raspon cijene, medianu/prosjek i confidence

UI je read-only prema valuation-ready sloju za glavni product flow. Admin/bootstrap forme smiju postojati, ali nisu core product.

## 7. Redefinirani roadmap

Trenutni status:
- Step 1 je završen
- Step 2 je završen
- Step 3 je završen
- sljedeći implementacijski rad počinje od Step 4

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

U praktičnom redoslijedu rada to znači:
- Step 4 počinje ovdje
- Step 4 ostaje fokusiran na extraction, normalization, validation i publication granice
- Step 4 radi nad minimalnim bootstrap/pilot podacima i kontroliranim source kombinacijama
- geografski weights, recency weights i ranking logika još se ne implementiraju u ovom koraku

### Phase 3 - Scraping (1-2 izvora prvo)
Cilj:
- odabrati 1 do 2 izvora s najvećom poslovnom vrijednošću
- napraviti source adaptere i snapshot fixtures
- puniti raw ingestion iz stvarnih marketplace/broker izvora
- povezati adaptere s pipelineom
- pratiti promjene cijene, stale/removed signale i parser health

Scraping je primarni acquisition model, ali uvodi se fazno i empirijski:
- Phase A: Boat24 + Croatia Yachting
- Phase B: Boat24 + Croatia Yachting + Marine One
- Phase C: testirati poboljšava li iNautia valuation kvalitetu dovoljno da opravda dodatnu scraping složenost

Ne pretpostavlja se da "više izvora" automatski znači "bolji sustav". Nakon svake kombinacije treba procijeniti:
- kvalitetu podataka
- scraping stabilnost
- usefulness za similarity/scoring
- hrvatsku relevantnost
- mediteranski coverage
- cost / maintenance burden

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

Tu ulaze i:
- Croatia -> Slovenia -> Adriatic -> Mediterranean retrieval prioriteti
- geography-aware confidence
- recency-aware weighting
- niži confidence kad valuation ovisi o starijim ili udaljenijim comparablesima
- price adjustment koncept za starije oglase kad ih treba približiti trenutnim tržišnim uvjetima

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
- rezultat je mediteranski, ali lokalno usidren prema Hrvatskoj i bližem Jadranu
- manual entry i CSV import postoje samo kao admin/bootstrap alati, ne kao glavni product flow
