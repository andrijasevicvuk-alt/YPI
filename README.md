# Yacht Premium Insurance - repo dokumentacija

Ovo je kanonski paket dokumentacije za projekt internog alata za procjenu vrijednosti plovila.

## Što je ovdje službeno
Za daljnji rad koristi samo dokumente u mapi `docs/`.

## Struktura
- `docs/00_MasterPlan_Projekt_i_Podaci.md` - glavni dokument za projekt, podatke, scraping, pipeline i integraciju
- `docs/01_Strategija_Izvora_Podataka.md` - konkretan plan izvora i prioriteta po fazama
- `docs/02_ModelPodataka_i_DatasetSlojevi.md` - struktura datasetova i prijenos prema evaluaciji i aplikaciji
- `docs/03_Pipeline_Ciscenja_Normalizacije.md` - cleaning, standardizacija, deduplikacija i validacija
- `docs/04_Scraping_Automatizacija_i_Operativa.md` - scraping arhitektura, scheduling i monitoring
- `docs/05_Evaluacija_i_WebApp_Integracija.md` - kako podaci hrane scoring, API i UI
- `docs/06_Codex_Upute_DataLayer.md` - jasne upute za Codex za data layer
- `docs/08_Verifikacija_Step3_ManualEntry.md` - smoke provjera manual-entry raw ingestion toka
- `docs/AGENTS.md` - operativna pravila projekta
- `docs/PravilaZaPretrazivanje.md` - pravila pretrage, scoringa i prikaza
- `docs/PromptoviZaCodex.md` - paket promptova za implementaciju
- `docs/PromptZaDrugiChat.md` - čišći prompt za otvaranje novog chata
- `docs/archive/` - arhiva starijih verzija i ulaznih dokumenata, nije službeni izvor za implementaciju

## Pravilo rada
1. Dokumenti u `docs/` su službeni.
2. Arhiva služi samo za trag odluka i povijest.
3. Svaka veća promjena implementacije mora ažurirati i dokumentaciju.
