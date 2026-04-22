# Strategija izvora podataka

## 1. Cilj
Ovaj dokument određuje odakle sustav uzima tržišne podatke i kojim redoslijedom širi coverage. Budući da ne postoji jedinstveni API, primarni acquisition model je scraping marketplace i broker izvora, uz kontrolirani raw ingestion i pipeline normalizacije.

Manual entry i CSV import postoje kao bootstrap/admin alati. Oni pomažu u ranoj validaciji modela i iznimnim korekcijama, ali nisu glavni izvor podataka ni core product feature.

## 1.1 Geografski valuation kontekst izvora
Izvori se ne procjenjuju samo po količini listinga, nego i po tome koliko dobro hrane valuation koji je:
- mediteranski po coverageu
- hrvatski usidren po tržišnoj relevantnosti
- jadranski osjetljiv po regionalnim comparablesima

Praktično pravilo:
- Hrvatska je primarni market anchor
- Slovenija je visoko relevantan susjedni mikro-market
- ostali Jadran je snažan regionalni sloj
- širi Mediteran je fallback i market context layer

## 2. Osnovna strategija
Ne krećemo od "svih mogućih izvora", nego od malog broja izvora s najvećom poslovnom vrijednošću i najboljom šansom za stabilan parser.

### Prioritet 1 - pilot marketplace i broker scraping
Traže se izvori koji imaju:
- stabilne listing URL-ove
- dovoljno konzistentan HTML
- jasno prikazane cijene, godinu, model i lokaciju
- dovoljno mediteranskog coveragea
- jaku hrvatsku ili jadransku relevantnost kad je to moguće
- korisne signale za price history i stale/removed status

Cilj je prvo uvesti 1 do 2 izvora, ne masovno širiti scraping prije nego što pipeline radi.

### Prioritet 2 - pipeline-ready proširenje izvora
Nakon prvih adaptera dodaju se novi izvori samo ako:
- raw snapshots se mogu spremati i reprocessati
- parser ima fixture primjere
- source registry jasno opisuje pouzdanost i ograničenja izvora
- normalizacija i review signali mogu obraditi izvor bez ručnog krpanja baze

### Prioritet 3 - admin/bootstrap izvori
Ovdje spadaju:
- ručno dodani oglasi
- CSV import iz već prikupljenih tablica
- seed podaci za razvoj i testiranje
- interni valuation caseovi i povijesne bilješke

Ovi izvori su korisni, ali ne definiraju product direction. Služe za bootstrap, testiranje i iznimne admin korekcije.

### Prioritet 4 - teži i nestabilni izvori
- izvori s agresivnim anti-bot mjerama
- izvori s puno nedostajućih polja
- izvori s jakim duplikatima
- izvori bez stabilnog listing ID-a

Ove izvore dodajemo tek kad data engine i quality handling rade pouzdano.

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

Manual entry i CSV import također imaju source registry zapise, ali su označeni kao admin/bootstrap acquisition metode.

## 4. Procjena izvora po poslovnoj vrijednosti
Svaki izvor ocjenjujemo po šest kriterija:
1. koliko često sadrži relevantne mediteranske brodove
2. koliko dobro prikazuje builder/model/godinu
3. koliko dobro prikazuje status ownershipa
4. koliko je stabilan za scraping ili kontrolirani import
5. koliko je koristan za price history
6. koliko je koristan za hrvatski i jadranski valuation anchor

Najveću prednost imaju izvori koji najbrže pune valuation-ready dataset usporedivim brodovima.

## 4.1 Trenutno preferirani izvori
Trenutno preferirani skup izvora nije "svi izvori odjednom", nego mali empirijski testiran backbone:

- `Boat24` kao marketplace backbone
- `Croatia Yachting` kao hrvatski / jadranski broker trust anchor
- `Marine One` kao dodatni hrvatski / jadranski broker trust anchor
- `iNautia` kao širi mediteranski / europski expansion layer

Uloge:
- Boat24 daje širok marketplace backbone
- Croatia Yachting i Marine One daju lokalni trust sloj za hrvatski i bliži jadranski valuation
- iNautia služi kao širi mediteranski / europski expansion source

To su preferirani kandidati za rollout, ali najbolja kombinacija mora se potvrditi empirijski nakon implementacije i testiranja.

## 5. Pravilo "source before scraper"
Prvo definiramo:
- zašto nam izvor treba
- koja polja iz njega vadimo
- koliko mu vjerujemo
- kako ga mapiramo
- kako ćemo spremiti raw snapshot
- kako ćemo testirati parser

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

### Val 1 - bootstrap/admin podaci
- seed dataset
- ručni unos samo za kontrolirane primjere
- CSV import samo ako već postoji korisna tablica

Cilj:
- testirati data model
- testirati raw ingestion i pipeline contracts
- imati minimalne podatke dok scraping adapteri nisu spremni

### Val 2 - pilot scraping za 1 do 2 izvora
- Boat24 + Croatia Yachting

Cilj:
- testirati source adapters
- testirati raw snapshot storage
- testirati extraction i normalization na stvarnim listingima
- početi graditi pravi valuation-ready dataset

### Val 2B - lokalno pojačanje hrvatskog / jadranskog sloja
- Boat24 + Croatia Yachting + Marine One

Cilj:
- pojačati hrvatski i jadranski trust layer
- provjeriti povećava li dodatni broker source valuation usefulness
- izmjeriti dodatni maintenance cost i parser burden

### Val 3 - proširenje coveragea
- evaluirati poboljšava li iNautia valuation kvalitetu dovoljno da opravda složenost
- periodični crawlovi
- praćenje promjene cijene
- stale/removal detekcija
- širi coverage po builderima, modelima i regijama

Pravilo:
- nakon svake nove kombinacije izvora procjenjuju se data quality, scraping stabilnost, similarity usefulness, hrvatska relevantnost, mediteranski coverage i maintenance cost
- zadržava se kombinacija koja daje najbolji valuation quality per operational cost
- ne pretpostavlja se da maksimalan broj izvora daje najbolji sustav

## 8. Pravilo pouzdanosti
Ne tretiramo sve izvore jednako.

Primjeri:
- broker izvor može biti jači signal za opis stanja
- marketplace može dati širi raspon, ali nižu pouzdanost
- interni verified unos može imati visok reliability score, ali nije primarni acquisition model

Također:
- hrvatski izvori imaju veću važnost za lokalni valuation anchor
- slovenski listingi imaju vrlo visoku susjednu relevantnost kad su dostupni
- ostali jadranski izvori ostaju jaki regionalni comparables
- širi mediteranski izvori daju fallback i market context, ali ne nose istu lokalnu težinu

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
- raw snapshot storage
- monitoring dashboard po izvoru
- publication u valuation-ready dataset kao core product layer

Napomena za faze rada:
- Step 4 još ne implementira geography-aware scoring ni confidence weights
- Step 4 priprema pipeline outpute koji kasnije omogućuju Croatia-first / Adriatic-aware valuation logiku
- Step 5 i dalje ostaje mjesto za scoring, confidence i ranking pravila
