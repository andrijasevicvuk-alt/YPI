# PromptoviZaCodex.md

## 1. Početni plan prije pisanja koda
Pregledaj postojeći repozitorij i napravi kratak plan implementacije za MVP internog alata za procjenu vrijednosti plovila.  
Radimo u skladu s GitHub workflowom: sve izmjene trebaju biti organizirane po logičnim commitovima, a dokumentacija mora ostati ažurna.

Prvo napiši:
1. najjednostavniju arhitekturu za MVP
2. koje datoteke planiraš dodati ili mijenjati
3. koje rizike vidiš u modelu podataka i scoring logici

Nemoj još pisati kod dok ne izložiš plan.

## 2. Scaffold projekta
Postavi clean MVP projekt koristeći Next.js + TypeScript + Supabase.

Uvjeti:
- projekt je interni alat za Yacht Premium Insurance by Jack Surija
- sve držimo u GitHub repozitoriju
- napravi urednu strukturu foldera
- dodaj shared types
- napravi osnovni layout za internu aplikaciju
- nemoj uvoditi nepotrebne biblioteke

Nakon implementacije predloži logičan niz commit poruka.

## 3. Baza i migracije
Kreiraj SQL migracije za početnu bazu:
- enum tipovi za ownership_status, listing_status, boat_type, engine_type, source_type, condition_rating
- tablice boats, engines, source_sites, listings, price_history, worker_notes
- indeksi za builder/model/year i ownership_status/regiju

Sve mora biti spremno za versioning u GitHubu kroz migracije, bez ručnih promjena koje nisu zapisane u repou.

## 4. Seed podaci
Generiraj seed podatke za 20-30 realističnih mediteranskih oglasa za plovila.  
Treba uključiti private, charter i ex-charter primjere.

Podaci moraju biti dovoljno raznoliki da možemo testirati:
- točan match
- nearest-year fallback
- različite regije
- različite konfiguracije motora

Spremi seed podatke u repo i napiši kratke upute kako ih pokrenuti.

## 5. Search form i results page
Izgradi MVP ekran pretrage i ekran rezultata.

Za ekran pretrage obavezna polja su:
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
- kratko objašnjenje zašto je rezultat dobar match

UI mora biti pregledan, brz i poslovan, ne marketinški.

## 6. Scoring i nearest-year fallback
Implementiraj scoring logiku za usporedbu plovila.

Težine:
- točan builder + model = 40
- ista varijanta = 20
- ista godina = 15
- unutar +/- 1 godine = 10
- isti ownership status = 20
- ista konfiguracija motora = 10
- ista država ili podregija = 5

Ako ne postoji isti year match, automatski koristi najbližu godinu i jasno to označi u UI-u.  
Vrati i numeric score i human-readable explanation.

## 7. CSV import
Dodaj jednostavan CSV import za oglase.

Potrebno:
- upload datoteke
- mapiranje stupaca
- osnovna validacija
- preview prije importa
- spremanje u bazu

Implementacija mora biti dovoljno jednostavna za internu upotrebu i održavanje. Sve izmjene moraju biti commit-friendly za GitHub repo.

## 8. Refaktor i dokumentacija
Refaktoriraj MVP radi čitljivosti i održavanja.

Zatim ažuriraj README i AGENTS.md tako da novi developer može brzo shvatiti:
- svrhu projekta
- strukturu repoa
- kako pokrenuti projekt
- kako rade scoring i fallback pravila
- koja su pravila rada na GitHubu

Nemoj dodavati fancy funkcije. Fokus je na urednosti, jasnoći i stabilnosti.
