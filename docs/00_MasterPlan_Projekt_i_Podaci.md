# Master plan projekta i podatkovnog sloja

## 1. Svrha dokumenta
Ovaj dokument definira kako projekt stvarno dolazi do tržišnih podataka, kako se ti podaci čiste i standardiziraju, kako se spremaju u bazu i kako se dalje koriste za evaluaciju vrijednosti plovila i radnički web app.

Glavna ideja projekta nije "napraviti scraper pa vidjeti što će izaći", nego izgraditi kontrolirani interni podatkovni sustav s jasnim fazama:
1. ručni unos i CSV import
2. poluautomatizirani import iz prioritetnih izvora
3. scraping za podržane izvore
4. cleaning i normalizacija
5. deduplikacija i kvalitativno bodovanje zapisa
6. scoring usporedivih plovila
7. prikaz u internom web alatu

## 2. Temeljni problem koji rješavamo
Radnik treba odgovoriti na vrlo konkretno poslovno pitanje:

"Koji su najbolji usporedivi mediteranski primjeri za ovo plovilo i koji je branljiv raspon cijene?"

Zbog toga podatkovni sustav mora podržati:
- pouzdan builder/model matching
- nearest-year fallback
- razliku između private, charter i ex-charter statusa
- objašnjiv izračun preporučenog raspona
- trag izvora i kvalitete podataka

## 3. Zašto je podatkovni sloj najteži dio
Najveći rizik projekta nije UI ni osnovni SQL, nego činjenica da:
- ne postoji jedan kvalitetan javni API za sve relevantne oglase
- podaci po oglasnicima nisu standardizirani
- ista brodica može biti objavljena na više mjesta
- status ownershipa često nije eksplicitno označen
- godina, model, varijanta i motor mogu biti napisani na više načina
- tražena cijena nije isto što i realizirana cijena
- izvori se mijenjaju, brišu oglase i mijenjaju strukturu stranice

Zato se projekt mora voditi kao data acquisition + data quality sustav, a ne samo kao scraping task.

## 4. Princip rada po fazama

### Faza A - Osnovni operativni MVP bez punog scrapinga
Cilj je da alat radi i prije nego što scraping bude stabilan.

Ulazi:
- ručni unos
- standardizirani CSV import
- interni seed dataset
- ručno prikupljeni prioritetni mediteranski oglasi

Ishod:
- baza ima dovoljno kvalitetne podatke za testiranje scoringa
- workeri mogu koristiti alat
- backend i UI nisu blokirani čekanjem scrapinga

### Faza B - Poluautomatizirani acquisition layer
Cilj je smanjiti ručni rad.

Ulazi:
- kontrolirani importer za pojedine izvore
- parseri po izvoru
- batch validacija i review queue

Ishod:
- redovito punjenje baze
- manji rizik od prljavih podataka
- bolja kontrola kvalitete nego kod agresivnog masovnog scrapinga

### Faza C - Operativni scraping sustav
Cilj je redovno osvježavanje tržišnih podataka.

Ulazi:
- source registry
- crawler scheduler
- parser po izvoru
- normalizacija
- dedupe i quality flags

Ishod:
- kontinuirano praćenje tržišta
- price history
- stale / removed / duplicate statusi
- bolji confidence valuation rezultata

## 5. Glavni arhitekturni slojevi

### 5.1 Source acquisition layer
Zadužen za dohvat sirovih podataka iz:
- ručnog unosa
- CSV datoteka
- web izvora
- internih bilješki ili povijesnih tablica

Izlaz ovog sloja nije finalni zapis za aplikaciju, nego raw zapis sa što manje pretpostavki.

### 5.2 Parsing and normalization layer
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

### 5.3 Data quality and deduplication layer
Procjenjuje:
- je li zapis potpun
- je li zapis vjerojatno duplikat
- ima li kontradikcija
- kolika je pouzdanost izvora
- smije li zapis ući u valuation set

### 5.4 Serving layer
Priprema izvedene tablice i API izlaze za:
- scoring engine
- search UI
- summary panel
- audit trail
- export izvještaj

## 6. Načela dizajna datasetova
Podatke ne spremamo samo u jednu tablicu "listings", nego u više slojeva.

### Sloj 1 - raw ingestion
Sirovi zapis kakav je došao s izvora.
Ne briše se osim u iznimnim slučajevima.
Služi za:
- audit
- ponovni parsing
- debug parsera
- usporedbu verzija

### Sloj 2 - normalized listing
Standardizirani zapis spreman za poslovnu upotrebu.
Sadrži:
- kanonske vrijednosti
- mapirane enum tipove
- standardizirane valute i jedinice

### Sloj 3 - matched / deduped market entity
Predstavlja jedinstveni tržišni primjerak kad je isti oglas viđen na više mjesta ili više puta.

### Sloj 4 - valuation-ready comparable set
Skup zapisa koji su prošli kvalitetne provjere i smiju ulaziti u scoring.

## 7. Što mora biti automatizirano, a što ostaje ručno
Automatizirati treba:
- dohvat HTML-a / feedova gdje je dopušteno i stabilno
- ekstrakciju polja
- normalizaciju valute i jedinica
- dedupe scoring
- označavanje stale / removed oglasa
- price history snapshoting
- review queue za problematične zapise

Ručno ostaje:
- verifikacija spornih modela i varijanti
- korekcija ownership statusa kad nije jasan
- unos internih bilješki
- potvrda važnih pravila mapiranja
- odobrenje parsera prije produkcije

## 8. Konkretni operativni plan
1. Definirati source registry i prioritetne izvore.
2. Napraviti raw ingestion tablice i file storage za raw HTML/JSON snapshot.
3. Uvesti canonical mapping tablice za builder, model, variant i lokacije.
4. Izgraditi cleaning pipeline kao zaseban Python modul, ne kao logiku razbacanu po skriptama.
5. Implementirati dedupe i quality scoring.
6. Izgraditi valuation-ready view / materialized view.
7. Spojiti scoring engine na valuation-ready sloj.
8. Spojiti web app na query/API sloj, ne direktno na sirove tablice.
9. Uvesti monitoring po izvoru: broj zapisa, broj grešaka, coverage, zadnji uspješan crawl.
10. Tek nakon stabilnog ingestion + cleaning sloja širiti broj izvora.

## 9. Definicija uspjeha za podatkovni dio
Podatkovni dio je "done" za MVP kad:
- postoji kontroliran ručni unos i CSV import
- postoji najmanje jedan standardizirani seed dataset za testiranje
- postoji raw -> normalized -> valuation-ready pipeline
- postoji barem osnovna deduplikacija
- svaki valuation rezultat ima trag izvora
- nearest-year fallback radi nad čistim i standardiziranim podacima
- worker može otvoriti zapis i razumjeti zašto je odabran
