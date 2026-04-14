# PromptoviZaCodex.md

## Kako koristiti ovaj dokument
Promptove šalji redom. Nemoj odmah tražiti da Codex radi sve odjednom. Prvo neka izloži plan, zatim data layer, zatim UI i integraciju.

---

## 1. Početni plan prije pisanja koda
Pregledaj repozitorij i predloži najjednostavniju implementaciju MVP market comparison enginea i search/comparison UI-ja za procjenu vrijednosti plovila.

Kontekst:
- projekt je strukturirani valuation i market comparison alat, nije chat tražilica
- prioritet je podatkovni sloj, quality pipeline i objašnjiv scoring
- scraping marketplace i broker izvora je primarni acquisition model
- ručni unos i CSV import su samo bootstrap/admin alati i ne smiju oblikovati glavni product flow
- scraping, cleaning i scoring ne smiju biti spojeni u jednu nečitljivu cjelinu

Prvo napiši:
1. predloženu arhitekturu
2. strukturu foldera
3. koje tablice i servise uvodiš
4. kako teče raw -> normalized -> valuation-ready flow
5. najveće rizike i kako ih rješavaš

Nemoj još pisati kod.

---

## 2. Scaffold projekta
Postavi clean MVP projekt koristeći Next.js + TypeScript + Supabase.

Uvjeti:
- napravi urednu strukturu repoa
- dodaj shared types
- dodaj osnovni layout za internu aplikaciju
- pripremi prostor za Python ingestion/pipeline servise
- nemoj uvoditi nepotrebne biblioteke

Na kraju predloži logičan niz commit poruka.

---

## 3. Baza, migracije i data slojevi
Kreiraj SQL migracije za početnu bazu.

Obavezno:
- enum tipovi za ownership_status, listing_status, boat_type, engine_type, source_type, condition_rating
- tablice boats, engines, source_sites, listings, price_history, worker_notes
- po potrebi dodatne tablice za raw ingestion, mapping i review queue
- indeksi za builder/model/year i ownership_status/regiju
- valuation-ready view ili sličan query layer

Sve mora biti spremno za versioning kroz migracije.

---

## 4. Seed podaci i bootstrap/admin CSV import
Generiraj mali skup project-owned seed podataka za razvoj, testiranje i provjeru scoring edge caseova.

Treba uključiti:
- private, charter i ex-charter primjere
- točan match
- nearest-year fallback
- različite regije
- različite konfiguracije motora
- barem nekoliko namjernih edge caseova za test cleaninga

Ako je potreban CSV import, tretiraj ga kao pomoćni admin/bootstrap put:
- upload datoteke
- mapiranje stupaca
- osnovna validacija
- preview prije importa
- spremanje prvo u raw ingestion sloj
- bez prilagođavanja glavnog modela podataka jednom CSV layoutu

---

## 5. Ingestion i cleaning pipeline
Implementiraj osnovni Python data pipeline.

Želim:
- raw ingestion spremanje za scraping izvore, uz pomoćne admin/bootstrap ulaze
- parser / extractor sloj
- canonical mapping builder/model/variant
- currency i unit normalization
- basic duplicate detection
- quality score
- eligibility flag za valuation-ready skup

Pipeline mora biti modularan i testabilan.

---

## 6. Search form, results page i scoring
Izgradi MVP ekran pretrage i ekran rezultata.

Obavezna polja:
- builder
- model
- godina
- ownership status

Napredna polja:
- varijanta
- duljina
- država / podregija
- motor

Na ekranu rezultata prikaži:
- summary panel
- tablicu usporedivih plovila
- match score
- human-readable explanation
- oznaku nearest-year fallbacka
- osnovni source trace

UI mora biti poslovan i pregledan.

---

## 7. Refaktor i dokumentacija
Refaktoriraj MVP radi čitljivosti i održavanja.

Zatim ažuriraj:
- README
- AGENTS.md
- dokumentaciju za data pipeline
- dokumentaciju za scoring i fallback
- kratke upute za lokalno pokretanje

Nemoj dodavati fancy funkcije. Fokus je na urednosti, jasnoći i stabilnosti.
