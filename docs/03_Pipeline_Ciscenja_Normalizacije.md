# Pipeline čišćenja i normalizacije

## 1. Cilj
Cleaning pipeline pretvara sirove, nekonzistentne i često nepotpune tržišne podatke u stabilan valuation-ready dataset.

## 2. Redoslijed koraka

### Korak 1 - ingestion validation
Provjere odmah nakon dohvaćanja:
- postoji li source listing key ili stabilan URL
- postoji li title ili description
- postoji li price signal
- je li zapis tehnički ispravno spremljen

Rezultat:
- raw zapis se sprema
- tehnički neispravni zapisi idu u ingest error log

### Korak 2 - field extraction
Ekstraktira se:
- builder
- model
- variant
- year
- price
- currency
- location
- ownership status
- engine data
- osnovne dimenzije

Svako polje dobiva i:
- extracted_value
- extraction_method
- extraction_confidence

### Korak 3 - canonical mapping
Vrijednosti se prevode u kanonski oblik.
Primjeri:
- "Lagoon Cat 42", "Lagoon 42", "Lagoon Forty Two" -> `Lagoon / 42`
- "ex charter", "ex-charter", "former charter" -> `ex_charter`

### Korak 4 - unit normalization
- duljine u metre
- snaga u HP
- valute u ISO kod
- cijene u EUR po definiranim pravilima

### Korak 5 - text normalization
- trimming
- uklanjanje viška whitespacea
- standardizacija separatora
- transliteracija gdje ima smisla
- uklanjanje marketinških fraza iz title polja za potrebe matchinga

### Korak 6 - business validation
Provjere:
- builder/model kombinacija ima smisla
- godina nije očito izvan raspona
- duljina i model nisu očito kontradiktorni
- ownership status nije u konfliktu s drugim signalima
- cijena nije ekstremni outlier bez oznake

### Korak 7 - duplicate detection
Duplikate tražimo po:
- source listing key
- identičnom ili vrlo sličnom URL-u
- builder + model + year + location + price proximity
- title similarity
- description similarity
- engine signature
- first_seen / last_seen obrascu

### Korak 8 - quality scoring
Svaki zapis dobiva quality score, npr. 0-100, na temelju:
- potpunosti
- pouzdanosti izvora
- jačine parser signala
- stabilnosti ključnih polja
- duplicate statusa
- starosti oglasa

### Korak 9 - review queue
Zapisi s problemima ne odbacuju se tiho, nego idu u review:
- unclear model
- unclear year
- unclear ownership status
- suspicious price
- low-confidence parsing

### Korak 10 - publication u valuation-ready sloj
Samo zapisi koji zadovolje prag idu u scoring i UI.

## 3. Pravila normalizacije po ključnim poljima

### Builder
- canonical builder mora dolaziti iz controlled vocabulary
- aliasi se vode u posebnoj mapping tablici
- novi alias ne ulazi automatski bez review pravila

### Model
- model se ne izvodi samo iz jedne regex logike
- treba podržati aliase, spacing varijacije i marketinške oznake

### Variant
- owner version, charter version, flybridge, coupe i slične oznake čuvaju se odvojeno od glavnog modela
- variant nikad ne smije razbiti osnovni model key

### Year
Redoslijed prioriteta:
1. eksplicitno navedena godina gradnje
2. eksplicitno navedena godina porinuća
3. izvedena godina iz strukturiranih specs
4. godina iz naslova samo uz niži confidence
5. unknown ako nije sigurno

### Ownership status
Izvodi se iz:
- eksplicitnih oznaka
- title/description patterna
- izvorne kategorije oglasa
- ručne korekcije

Status mora imati confidence i source_reason.

### Price
- čuvati originalni text i originalni iznos
- standardizirati valutu
- računati `price_eur`
- evidentirati datum opažanja
- pratiti promjene kroz price_history

## 4. Operativna implementacija pipelinea
Predlaže se Python paket s modulima:
- `ingestion/`
- `parsers/`
- `normalizers/`
- `validators/`
- `dedupe/`
- `quality/`
- `review/`
- `publish/`

Ne raditi monolitnu skriptu od 1500 linija.

## 5. Testovi koje pipeline mora imati
- unit testovi za mapping pravila
- testovi za currency i unit normalization
- testovi za dedupe heuristiku
- fixture-based testovi po izvoru
- regression testovi na poznatim problematičnim oglasima

## 6. Minimalni output za svaki zapis
Pipeline mora na kraju dati:
- normalized fields
- confidence / quality score
- source trace
- duplicate status
- eligibility flag
- exclusion reason ako zapis nije spreman za valuation

## 7. Trenutni status implementacije
Step 4 je funkcionalno verificiran lokalno za minimalni bootstrap raw-to-normalized pipeline.

Trenutno postoje:
- `services/pipeline/contracts.py`
- `services/pipeline/bootstrap.py`
- `services/pipeline/extract`
- `services/pipeline/normalizers`
- `services/pipeline/validators`
- `services/pipeline/publish`
- `supabase/verify_step4_bootstrap_pipeline.sql`

Ti ugovori definiraju:
- ulazni `RawListingEnvelope`
- `Extractor` za field extraction
- `Normalizer` za prijelaz u normalized candidate objekte
- `Validator` za business i quality provjere
- `Publisher` za upis u normalized core tablice
- status promjenu `pending -> processed` za validne zapise
- status promjenu `pending -> failed` i `ingest_errors` zapis za nevalidne zapise
- lineage kroz `boats.primary_raw_listing_id` i `listings.raw_listing_id`

Ovaj slice objavljuje samo u `boats` i `listings`. Ne objavljuje valuation-ready dataset i ne implementira scoring.

Tehnički dug:
- publication trenutno koristi više Supabase REST poziva i nije atomska transakcija
- prije većeg ingestion volumena treba dodati transakcijski publication hardening ili recovery ponašanje

### Known limitation: publication is not atomic
Trenutni Step 4 publisher koristi vise Supabase REST poziva. To je prihvatljivo za lokalnu bootstrap verifikaciju, ali nije dovoljno sigurno za veci ingestion volume ili scraper-driven ingestion.

Moguci partial failure scenariji:
- builder/model se upisu, ali boat ili listing faila
- boat se upise, ali listing faila
- listing se upise, ali raw status update faila
- raw se oznaci kao `failed` nakon sto partial normalized rows vec postoje

Trenutne mitigacije:
- `listings.raw_listing_id` ima unique constraint
- builder/model/variant resolver koristi postojece canonical rows kad postoje
- boat idempotency postoji u kodu kroz `primary_raw_listing_id` lookup
- Step 4C dodaje DB-level partial unique index na `boats.primary_raw_listing_id` za non-null vrijednosti

Nedostaje:
- DB transakcija preko cijelog publication toka
- formalna partial-publication recovery procedura

Future hardening prije scraping volumena:
- premjestiti publication u PostgreSQL RPC/funkciju ili ekvivalentnu transactional boundary
- razmotriti DB-level uniqueness na `boats.primary_raw_listing_id`
- dodati recovery/idempotency smoke checks

## 8. Trenutni operativni boundary nakon Step 3
Manual entry je pomoćni admin/bootstrap ulaz koji sada puni raw sloj kroz aplikaciju, ali publication ostaje odvojen.

Aktivni tok:
1. admin unese kontrolirani bootstrap zapis kroz app
2. payload se sprema u `raw_listings` i `worker_manual_entries`
3. record ostaje u `pending` statusu
4. Step 4 pipeline radi extraction -> normalization -> validation -> publication
5. validni zapis dobiva `processed`, a nevalidni `failed` i `ingest_errors`

Time ostaje ocuvano glavno pravilo projekta da raw podaci ne idu direktno u normalized ili valuation-ready sloj bez kontrolirane obrade.
