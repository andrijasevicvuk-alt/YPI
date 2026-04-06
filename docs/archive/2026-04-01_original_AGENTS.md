# AGENTS.md

## Projekt
Interni alat za procjenu vrijednosti plovila za Yacht Premium Insurance by Jack Surija.

## Cilj
Omogućiti radnicima da brzo pronađu najrelevantnije usporedive oglase za plovila na Mediteranu i dobiju branljiv raspon cijena.

## Prioriteti MVP-a
1. Strukturirani podaci o plovilima
2. Brza filtracija
3. Scoring usporedivih plovila
4. Nearest-year fallback
5. Jasan summary panel
6. Ručni unos i CSV import prije scrapinga

## Tech stack
- Next.js
- TypeScript
- Supabase / PostgreSQL
- Python skripte za import i kasnije scraping

## GitHub pravila rada
- Sve ide kroz GitHub repo.
- Rad po feature branch principu.
- Mali i logični commitovi.
- Dokumentacija mora biti ažurna uz svaku veću promjenu.
- Migracije moraju biti verzionirane.
- Ne uvoditi nepotrebne biblioteke.
- Preferirati čitljiv i održiv kod.

## Poslovna pravila
- Isti builder i model su najvažniji.
- Isti ownership status je vrlo važan.
- Ako nema točne godine, koristi najbližu godinu.
- Rezultat mora objasniti zašto je match dobar.
- Confidence mora ovisiti o kvaliteti usporedbe.

## Done znači
- Aplikacija se može pokrenuti lokalno
- Seed podaci rade
- Pretraga radi
- Scoring radi
- Nearest-year fallback radi
- Osnovna dokumentacija postoji
