# Evaluacija i integracija s web aplikacijom

## 1. Cilj
Podaci moraju završiti u obliku koji search/comparison UI i scoring engine mogu koristiti brzo, predvidljivo i objašnjivo.

End product je alat za pretragu i tržišnu usporedbu mediteranskih cijena brodova. Korisnik unosi ciljano plovilo, sustav dohvaća usporedive valuation-ready zapise, računa branljiv raspon cijene i objašnjava rezultat.

Glavni product flow:

`input boat -> retrieve comparables -> compute price range -> explain result`

## 2. Put podataka do evaluacije
1. raw ingestion
2. cleaning i normalizacija
3. dedupe / duplicate signals
4. valuation-ready dataset
5. scoring engine
6. summary engine
7. API/query response
8. search and comparison UI

UI ne čita raw podatke direktno. UI i scoring rade nad valuation-ready slojem.

## 3. Valuation-ready dataset kao core product layer
Valuation-ready dataset je sloj koji web app i scoring engine smiju koristiti za glavni product flow.

On mora sadržavati:
- comparable_id
- boat_id
- listing_id
- canonical builder/model/variant
- year_built i fallback signal
- ownership status
- country/subregion/location bucket
- loa_m i engine signature gdje postoje
- price_eur
- source name i source reliability
- data quality score
- comparable eligibility
- exclusion reason ako zapis nije uključen
- last_seen_at

Sirovi i djelomično normalizirani podaci ostaju operativni slojevi, ne product UI slojevi.

## 4. Što scoring engine treba dobiti
Scoring ne treba cijelu povijest raw podataka, nego čisti comparable payload:
- canonical builder
- canonical model
- canonical variant
- year_built
- ownership_status
- country / subregion
- loa_m
- engine signature
- price_eur
- source reliability
- data quality score
- duplicate/cluster signal
- last_seen_at

## 5. Pravila prije scoriranja
Prije izračuna se radi filter:
- builder i model moraju biti kompatibilni
- zapisi ispod minimalnog quality praga ispadaju
- duplicate cluster se kolabira ili jasno označava
- removed ili stale status se posebno tretira
- charter i ex-charter se ne miješaju s private bez jasne oznake
- cijena mora biti standardizirana ili zapis ne ulazi u valuation-ready set

## 6. Rezultat scoringa
Za svaki comparable treba vratiti:
- numeric score
- human-readable explanation
- flag je li korišten nearest-year fallback
- data quality summary
- source summary
- razlog zašto je comparable uključen

## 7. Summary engine
Nakon rangiranja treba izračunati:
- preporučeni raspon
- medijan
- prosjek
- broj jakih usporedbi
- confidence razinu
- upozorenja, npr. "nema točnog year matcha"

Summary nije samo UI dekoracija. To je glavni proizvodni odgovor sustava.

## 8. Confidence model
Confidence ne ovisi samo o broju rezultata, nego i o kvaliteti:
- broj jakih usporedbi
- raspodjela cijena
- kvaliteta izvora
- pokrivenost ownership statusa
- prisutnost exact year matcha
- kvaliteta normalizacije
- starost oglasa i last_seen_at signal

## 9. Uloga web aplikacije
Web app je primarno search and comparison interface.

Web app mora:
- omogućiti unos ciljanog plovila kroz strukturirana polja
- dohvatiti comparable zapise iz valuation-ready sloja
- prikazati rezultate i summary raspon cijene
- objasniti zašto su comparables odabrani
- prikazati fallbacke, source trace i quality signale
- ostati read-only prema raw i normalized operativnim slojevima u glavnom product flowu

Web app nije:
- primarni admin panel
- primarni data-entry alat
- mjesto za ručno uređivanje tržišnog dataseta
- direktni čitač raw ingestion tablica

Manual entry i CSV import smiju postojati u aplikaciji samo kao admin/bootstrap rute. One ne definiraju glavni UX proizvoda.

## 10. API granica
Web app ne bi smio sam računati složenu business logiku.

Preporučeno:
- backend endpoint ili server action vraća pripremljene search/comparison rezultate
- query layer čita valuation-ready dataset
- scoring engine vraća numeric score i explanation
- UI samo prikazuje rezultate, filtere, summary i explanation

## 11. UI elementi koji ovise o podatkovnom sloju
UI mora moći prikazati:
- izvor zapisa
- datum zadnjeg viđenja
- razlog matcha
- je li listing low-confidence
- je li korišten fallback
- ownership status i upozorenje ako je nejasan
- internu bilješku ako postoji kao pomoćni audit signal
- zašto je zapis uključen ili isključen iz valuation-ready seta

## 12. Audit i traceability
Kad korisnik otvori rezultat, mora biti moguće vidjeti:
- iz kojeg je izvora došao
- kada je prvi i zadnji put viđen
- kako je standardiziran
- je li bio ručno korigiran
- zašto je uključen ili isključen iz valuation seta

Audit služi povjerenju u valuation rezultat, ali ne smije pretvoriti glavni product UI u admin panel.
