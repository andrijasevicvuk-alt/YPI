# Scraping, automatizacija i operativa

## 1. Cilj
Scraping nije jedna skripta nego operativni sustav koji redovno puni i osvježava bazu bez rušenja kvalitete.

## 2. Arhitektura po komponentama

### 2.1 Source adapters
Svaki izvor ima vlastiti adapter:
- fetch logika
- parser logika
- source-specific mapping
- health checks

### 2.2 Crawl scheduler
Zadužen za:
- periodično pokretanje crawlova
- prioritizaciju izvora
- retry logiku
- evidenciju zadnjeg uspjeha i greške

### 2.3 Snapshot storage
Spremamo:
- raw HTML ili JSON snapshot
- fetch metadata
- parser verziju

To je bitno za debugging i ponovnu obradu.

### 2.4 Processing queue
Nakon fetcha zapis ulazi u queue za:
- extraction
- normalization
- dedupe
- publication

### 2.5 Monitoring
Po izvoru pratimo:
- broj dohvaćenih listinga
- broj novih listinga
- broj updateova
- broj parser errors
- broj low-confidence zapisa
- coverage po builderima/modelima
- zadnje uspješno izvođenje

## 3. Frekvencija osvježavanja
Ne treba sve izvore crawlati istim ritmom.

Predloženo:
- pilot izvori: jednom dnevno
- stabilni prioritetni izvori: 1-2 puta dnevno
- sporedni izvori: svakih nekoliko dana
- ručni CSV import: on demand

## 4. Promjena cijene i statusa oglasa
Sustav mora razlikovati:
- novi listing
- isti listing s novom cijenom
- isti listing s izmijenjenim opisom
- removed listing
- stale listing
- duplicate listing

To znači da scraping mora podržati delta logiku, ne samo insert.

## 5. Pravila za robustan scraping
- svaki adapter mora imati fixture primjere
- parser se verzionira
- HTML struktura se ne smije hardkodirati bez fallbacka
- greške jednog izvora ne smiju blokirati ostale
- source-specific logika se ne smije miješati s canonical business logikom

## 6. Operativni workflow za razvoj adaptera
1. odabrati izvor
2. definirati koja polja želimo izvući
3. prikupiti 10-20 reprezentativnih primjera
4. napraviti raw snapshot fixture
5. napisati parser
6. napisati parser testove
7. spojiti na normalization pipeline
8. pregledati review queue
9. pustiti pilot crawl
10. tek onda aktivirati periodično pokretanje

## 7. Risk register za scraping
Glavni rizici:
- promjena HTML strukture
- rate limiting ili blokiranje
- nekonzistentan ownership status
- duplikati između izvora
- naslovi puni marketinškog šuma
- nestajanje listinga bez jasnog signala
- previsok ručni rad ako review queue nije dobro dizajniran

## 8. Što automation mora isporučiti businessu
Business ne treba "crawler koji nešto skupi", nego:
- svježe usporedive oglase
- trag odakle su došli
- status kvalitete
- povijest cijene
- minimum ručnog ispravljanja

## 9. Deployment logika
Preporuka:
- Python scraping/pipeline jobovi odvojeni od Next.js aplikacije
- zajednička PostgreSQL baza
- scheduler kroz cron/job runner
- logovi i metrički pregled u zasebnom admin prikazu ili barem tablicama

## 10. MVP prag
Za MVP nije potrebno imati 20 izvora.
Dovoljno je:
- ručni unos
- CSV import
- 1-2 pilot adaptera
- stabilan pipeline
- monitoring po izvoru
