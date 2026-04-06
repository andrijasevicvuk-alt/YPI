# Strategija izvora podataka

## 1. Cilj
Ovaj dokument određuje odakle ćemo uzimati podatke i kojim redoslijedom. Budući da ne postoji jedinstveni API, trebamo složiti višeslojni pristup.

## 2. Osnovna strategija
Ne krećemo od "svih mogućih izvora", nego od kontroliranog prioriteta.

### Prioritet 1 - interni i ručno kontrolirani izvori
- ručno dodani oglasi
- CSV import iz već prikupljenih tablica
- seed podaci za razvoj i testiranje
- interni valuation caseovi i povijesne bilješke

Zašto prvo ovo:
- najbrže daje radni sustav
- najbolja kontrola kvalitete
- idealno za razvoj scoringa i UI-ja

### Prioritet 2 - strukturiraniji marketplace i broker izvori
Traže se izvori koji imaju:
- stabilne listing URL-ove
- dovoljno konzistentan HTML
- jasno prikazane cijene, godinu, model i lokaciju
- dovoljno mediteranskog coveragea

### Prioritet 3 - teži i nestabilni izvori
- izvori s agresivnim anti-bot mjerama
- izvori s puno nedostajućih polja
- izvori s jakim duplikatima
- izvori bez stabilnog listing ID-a

Ove izvore dodajemo tek kad pipeline već radi.

## 3. Source registry model
Za svaki izvor mora postojati zapis u source registryju s ovim poljima:
- source_name
- base_url
- source_type
- market_focus
- allowed_collection_method
- parser_version
- reliability_score
- ownership_status_signal_strength
- price_signal_strength
- year_signal_strength
- region_signal_strength
- notes
- is_active

## 4. Procjena izvora po poslovnoj vrijednosti
Svaki izvor ocjenjujemo po pet kriterija:
1. koliko često sadrži relevantne mediteranske brodove
2. koliko dobro prikazuje builder/model/godinu
3. koliko dobro prikazuje status ownershipa
4. koliko je stabilan za scraping ili import
5. koliko je koristan za price history

## 5. Pravilo "source before scraper"
Prvo definiramo:
- zašto nam izvor treba
- koja polja iz njega vadimo
- koliko mu vjerujemo
- kako ga mapiramo

Tek onda pišemo scraper ili parser.

## 6. Minimalni skup polja koji svaki izvor mora pokušati dati
- source listing key
- title
- listing url
- builder
- model
- variant ako postoji
- year built ili launched
- asking price
- currency
- location
- ownership status ako se može izvesti
- engine info
- description raw
- observed_at

## 7. Praktični plan akvizicije po valovima

### Val 1 - bez punog web scrapinga
- ručni unos
- CSV import
- seed dataset
- kontrolirani unos 100-300 relevantnih mediteranskih oglasa

Cilj:
- testirati scoring
- testirati data model
- izgraditi review workflow

### Val 2 - pilot scraping za 1 do 2 izvora
- jedan strukturiraniji broker izvor
- jedan marketplace izvor

Cilj:
- testirati source adapters
- testirati raw snapshot storage
- testirati dedupe na realnim duplikatima

### Val 3 - proširenje coveragea
- više izvora
- periodični crawlovi
- praćenje promjene cijene
- stale/removal detekcija

## 8. Pravilo pouzdanosti
Ne tretiramo sve izvore jednako.
Primjeri:
- broker izvor može biti jači signal za opis stanja
- marketplace može dati širi raspon, ali nižu pouzdanost
- interni verified unos može imati najveći reliability score

## 9. Što ne smijemo pretpostaviti
- da je title uvijek točan model
- da je charter status jasno naveden
- da su jedinice konzistentne
- da je valuta konzistentna
- da je jedan listing jednak jednom jedinstvenom plovilu
- da asking price znači tržišno ostvarivu cijenu

## 10. Output ovog plana prema kodu
Ovaj dokument se prevodi u:
- `source_sites` tablicu
- `source_registry` konfiguraciju u kodu
- parser module per source
- monitoring dashboard po izvoru
