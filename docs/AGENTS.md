# AGENTS.md

## Projekt
Interni search and valuation alat za mediteranske cijene plovila za Yacht Premium Insurance by Jack Surija.

## Poslovni cilj
Omogućiti korisniku da unese ciljano plovilo, pronađe najrelevantnije usporedive mediteranske oglase i dobije branljiv raspon cijena s objašnjenjem.

Glavni tok:

`input boat -> retrieve comparables -> compute price range -> explain result`

## Glavni princip projekta
Ovo nije generički AI search engine i nije worker data-entry alat. Ovo je kontrolirani market comparison engine sa strukturiranim podacima, scoring logikom, valuation-ready datasetom i jasnim audit tragom.

Manual entry i CSV import postoje kao bootstrap/admin alati, ali nisu core product feature.

## Prioriteti MVP-a
1. raw -> normalized -> valuation-ready podatkovni tok
2. valuation-ready dataset kao core product layer
3. scraping 1 do 2 marketplace/broker izvora
4. brza strukturirana pretraga nad valuation-ready slojem
5. scoring usporedivih plovila
6. nearest-year fallback
7. jasan summary panel s rasponom cijene
8. trag izvora i kvalitete podataka

## Tech stack
- Next.js
- TypeScript
- Supabase / PostgreSQL
- Python skripte i servisi za import, cleaning i scraping

## Pravila implementacije
- sve ide kroz GitHub repo
- rad po feature branch principu
- mali i logični commitovi
- dokumentacija mora biti ažurna uz svaku veću promjenu
- migracije moraju biti verzionirane
- ne uvoditi nepotrebne biblioteke
- preferirati čitljiv i održiv kod
- raw acquisition logika mora biti odvojena od business scoring logike
- web app za glavni product flow čita valuation-ready/query sloj, ne raw tablice

## Poslovna pravila
- isti builder i model su najvažniji
- isti ownership status je vrlo važan
- ako nema točne godine, koristi najbližu godinu
- rezultat mora objasniti zašto je match dobar
- confidence mora ovisiti o kvaliteti usporedbe
- korisnik mora vidjeti izvor i osnovu rezultata
- charter i ex-charter se ne smiju neprimjetno miješati s private rezultatima

## Podatkovna pravila
- raw podaci se čuvaju radi audita i reprocessinga
- scraping puni raw ingestion sloj
- pipeline objavljuje u normalized i valuation-ready sloj
- scoring i UI rade samo nad clean / valuation-ready slojem
- svaki izvor mora imati source registry zapis
- duplicate handling i quality scoring su obavezni prije ozbiljnog product scoringa
- svaka promjena mapping pravila mora biti testabilna

## Done znači
- aplikacija se može pokrenuti lokalno
- postoji jasan ingestion i cleaning pipeline
- 1 do 2 scraping izvora pune raw ingestion
- valuation-ready dataset postoji i može se queryjati
- pretraga radi nad valuation-ready slojem
- scoring radi nad čistim podacima
- nearest-year fallback radi
- UI prikazuje razlog matcha, source trace i quality status
- osnovna dokumentacija postoji i odgovara stanju koda
