# Scraping, automatizacija i operativa

## 1. Cilj
Scraping je primarni data acquisition model za stvarni proizvod. Sustav mora redovno puniti i osvježavati tržišne podatke iz marketplace i broker izvora, ali bez rušenja kvalitete i bez preskakanja raw -> normalized -> valuation-ready arhitekture.

Scraper nikad ne piše direktno u business/scoring tablice. Njegov izlaz je raw zapis sa snapshotom, source traceom i minimalnim pretpostavkama.

## 2. Product kontekst
End product je search and comparison UI za mediteranske cijene brodova. Scraping postoji zato da valuation-ready dataset ima dovoljno svježih i usporedivih tržišnih oglasa.

Glavni tok:

`marketplace/broker source -> scraper adapter -> raw ingestion -> pipeline -> valuation-ready dataset -> scoring -> search/comparison UI`

Manual entry i CSV import ostaju bootstrap/admin alati. Oni ne smiju postati glavni način punjenja tržišnog dataseta.

## 3. Arhitektura po komponentama

### 3.1 Source adapters
Svaki izvor ima vlastiti adapter:
- fetch logika
- parser logika
- source-specific mapping
- health checks
- fixture primjeri

Adapter mora biti izoliran od canonical business logike.

### 3.2 Crawl scheduler
Zadužen je za:
- periodično pokretanje crawlova
- prioritizaciju izvora
- retry logiku
- evidenciju zadnjeg uspjeha i greške
- odvajanje pilot izvora od stabilnih izvora

### 3.3 Snapshot storage
Spremamo:
- raw HTML ili JSON snapshot
- fetch metadata
- parser verziju
- source listing key ili stabilan URL

To je bitno za debugging, regression testove i ponovno procesiranje nakon promjene parsera.

### 3.4 Processing queue
Nakon fetcha zapis ulazi u queue za:
- extraction
- normalization
- validation
- dedupe
- quality scoring
- publication u valuation-ready dataset

### 3.5 Monitoring
Po izvoru pratimo:
- broj dohvaćenih listinga
- broj novih listinga
- broj updateova
- broj parser errors
- broj low-confidence zapisa
- coverage po builderima/modelima
- zadnje uspješno izvođenje
- udio zapisa koji ulaze u valuation-ready dataset

## 4. Frekvencija osvježavanja
Ne treba sve izvore crawlati istim ritmom.

Predloženo:
- pilot izvori: jednom dnevno dok se parser stabilizira
- stabilni prioritetni izvori: 1-2 puta dnevno
- sporedni izvori: svakih nekoliko dana
- admin CSV import: on demand
- manual entry: samo iznimno, za bootstrap ili korekcije

## 5. Promjena cijene i statusa oglasa
Sustav mora razlikovati:
- novi listing
- isti listing s novom cijenom
- isti listing s izmijenjenim opisom
- removed listing
- stale listing
- duplicate listing

Scraping mora podržati delta logiku, ne samo insert. Price history je važan dio tržišne usporedbe i confidence modela.

## 6. Pravila za robustan scraping
- svaki adapter mora imati fixture primjere
- parser se verzionira
- HTML struktura se ne smije hardkodirati bez fallbacka
- greške jednog izvora ne smiju blokirati ostale
- source-specific logika se ne smije miješati s canonical business logikom
- parser output mora biti reprocessabilan iz raw snapshotova
- adapteri se uvode jedan po jedan, ne masovno

## 7. Operativni workflow za razvoj adaptera
1. odabrati izvor po poslovnoj vrijednosti
2. definirati koja polja želimo izvući
3. prikupiti 10-20 reprezentativnih primjera
4. napraviti raw snapshot fixture
5. napisati fetch i parser logiku
6. napisati parser testove
7. spojiti na normalization pipeline
8. pregledati review queue i quality signale
9. pustiti pilot crawl
10. objaviti samo zapise koji prođu pipeline u valuation-ready dataset
11. tek onda aktivirati periodično pokretanje

## 8. Risk register za scraping
Glavni rizici:
- promjena HTML strukture
- rate limiting ili blokiranje
- nekonzistentan ownership status
- duplikati između izvora
- naslovi puni marketinškog šuma
- nestajanje listinga bez jasnog signala
- previsok ručni rad ako review queue nije dobro dizajniran
- prebrzo širenje izvora prije stabilnog data enginea

## 9. Što automation mora isporučiti productu
Product ne treba "crawler koji nešto skupi", nego:
- svježe usporedive oglase
- trag odakle su došli
- status kvalitete
- povijest cijene
- dovoljno coveragea za search i comparison UI
- stabilan valuation-ready dataset za scoring
- minimum ručnog ispravljanja

## 10. Deployment logika
Preporuka:
- Python scraping/pipeline jobovi odvojeni od Next.js aplikacije
- zajednička PostgreSQL baza
- scheduler kroz cron/job runner
- logovi i metrički pregled u zasebnom admin prikazu ili barem tablicama
- web app čita samo valuation-ready/query sloj za glavni product flow

## 11. MVP prag
Za MVP nije potrebno imati 20 izvora.

Dovoljno je:
- stabilan raw -> normalized -> valuation-ready pipeline
- 1 do 2 pilot scraping adaptera
- dovoljno kvalitetnih valuation-ready comparablesa za test search/comparison UI-ja
- monitoring po izvoru
- manual entry i CSV import kao bootstrap/admin fallback, ne kao core product
