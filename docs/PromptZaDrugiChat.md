# Prompt za drugi chat

Treba mi potpuni plan podatkovnog sloja za interni alat za procjenu vrijednosti plovila za Yacht Premium Insurance.

Projektni cilj:
Napraviti interni search/comparison alat u kojem korisnik unosi podatke o ciljanom plovilu, sustav dohvaća najbolje usporedive mediteranske oglase iz valuation-ready dataseta i prikazuje branljiv raspon cijena.

Važno:
- projekt radimo na hrvatskom
- ne želim općeniti AI chat alat nego strukturirani valuation alat
- najvažniji dio projekta je kako dolazimo do podataka, kako ih čistimo, kako ih strukturiramo i kako ih kasnije koristimo za scoring i web app
- nemamo kvalitetan jedinstveni API ni gotov dataset za sve relevantne oglase
- zato trebam realan plan za scraping kao primarni acquisition model, te CSV import i ručni unos samo kao bootstrap/admin alate
- cleaning pipeline, dedupe, quality score i valuation-ready dataset su temelj glavnog proizvoda

Želim da odgovor bude organiziran u ove cjeline:
1. strategija akvizicije podataka po fazama
2. plan izvora podataka i source registry
3. struktura dataset slojeva: raw, normalized, deduped, valuation-ready
4. cleaning pipeline korak po korak
5. plan automatizacije scrapinga i operativni monitoring
6. kako se taj data layer spaja na scoring engine i web app
7. glavni rizici i mitigacije
8. jasne upute za Codex što treba implementirati u repo

Tech stack:
- Next.js + TypeScript
- Supabase / PostgreSQL
- Python za import, cleaning i kasnije scraping
- GitHub repo i commit-friendly workflow

Poslovna pravila:
- builder + model su najvažniji
- ownership status je vrlo važan
- ako nema točne godine, koristi se nearest-year fallback
- rezultat mora objasniti zašto je match dobar
- confidence mora ovisiti o kvaliteti usporedbe
- private, charter i ex-charter ne smiju se miješati bez jasne oznake

Molim odgovor na hrvatskom, vrlo konkretno, bez generičkih fraza i s fokusom na provediv plan.
