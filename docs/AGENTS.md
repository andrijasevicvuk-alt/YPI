# AGENTS.md

## Projekt
Interni alat za procjenu vrijednosti plovila za Yacht Premium Insurance by Jack Surija.

## Poslovni cilj
Omogućiti radnicima da brzo pronađu najrelevantnije usporedive oglase za plovila na Mediteranu i dobiju branljiv raspon cijena.

## Glavni princip projekta
Ovo nije generički AI search engine, nego kontrolirani interni valuation alat sa strukturiranim podacima, scoring logikom i jasnim audit tragom.

## Prioriteti MVP-a
1. strukturirani podaci o plovilima
2. ručni unos i CSV import prije punog scrapinga
3. raw -> normalized -> valuation-ready podatkovni tok
4. brza filtracija
5. scoring usporedivih plovila
6. nearest-year fallback
7. jasan summary panel
8. trag izvora i kvalitete podataka

## Tech stack
- Next.js
- TypeScript
- Supabase / PostgreSQL
- Python skripte i servisi za import, cleaning i kasnije scraping

## Pravila implementacije
- sve ide kroz GitHub repo
- rad po feature branch principu
- mali i logični commitovi
- dokumentacija mora biti ažurna uz svaku veću promjenu
- migracije moraju biti verzionirane
- ne uvoditi nepotrebne biblioteke
- preferirati čitljiv i održiv kod
- raw acquisition logika mora biti odvojena od business scoring logike

## Poslovna pravila
- isti builder i model su najvažniji
- isti ownership status je vrlo važan
- ako nema točne godine, koristi najbližu godinu
- rezultat mora objasniti zašto je match dobar
- confidence mora ovisiti o kvaliteti usporedbe
- worker mora vidjeti izvor i osnovu rezultata
- charter i ex-charter se ne smiju neprimjetno miješati s private rezultatima

## Podatkovna pravila
- raw podaci se čuvaju radi audita i reprocessinga
- scoring i UI rade samo nad clean / valuation-ready slojem
- svaki izvor mora imati source registry zapis
- duplicate handling i quality scoring su obavezni
- svaka promjena mapping pravila mora biti testabilna

## Done znači
- aplikacija se može pokrenuti lokalno
- seed podaci rade
- pretraga radi
- scoring radi
- nearest-year fallback radi
- postoji osnovni ingestion i cleaning pipeline
- izvor i quality status su vidljivi
- osnovna dokumentacija postoji i odgovara stanju koda
