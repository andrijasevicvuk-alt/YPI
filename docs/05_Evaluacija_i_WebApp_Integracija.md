# Evaluacija i integracija s web aplikacijom

## 1. Cilj
Podaci moraju završiti u obliku koji scoring engine i web app mogu koristiti brzo, predvidljivo i objašnjivo.

## 2. Put podataka do evaluacije
1. raw ingestion
2. cleaning i normalizacija
3. dedupe
4. valuation-ready view
5. scoring engine
6. summary engine
7. API response
8. UI prikaz

## 3. Što scoring engine treba dobiti
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

## 4. Pravila prije scoriranja
Prije izračuna se radi filter:
- builder i model moraju biti kompatibilni
- zapisi ispod minimalnog quality praga ispadaju
- duplicate cluster se kolabira
- removed ili stale status se posebno tretira
- charter i ex-charter se ne miješaju s private bez jasne oznake

## 5. Rezultat scoringa
Za svaki comparable treba vratiti:
- numeric score
- human-readable explanation
- flag je li korišten nearest-year fallback
- data quality summary
- source summary

## 6. Summary engine
Nakon rangiranja treba izračunati:
- preporučeni raspon
- medijan
- prosjek
- broj jakih usporedbi
- confidence razinu
- upozorenja, npr. "nema točnog year matcha"

## 7. Confidence model
Confidence ne ovisi samo o broju rezultata, nego i o kvaliteti:
- broj jakih usporedbi
- raspodjela cijena
- kvaliteta izvora
- pokrivenost ownership statusa
- prisutnost exact year matcha
- kvaliteta normalizacije

## 8. API granica
Web app ne bi smio sam računati složenu business logiku.
Preporučeno:
- backend endpoint ili server action vraća već pripremljene rezultate
- UI samo prikazuje podatke i explanation

## 9. UI elementi koji ovise o podatkovnom sloju
UI mora moći prikazati:
- izvor zapisa
- datum zadnjeg viđenja
- reason for match
- je li listing low-confidence
- je li korišten fallback
- internu bilješku radnika

## 10. Audit i traceability
Kad radnik klikne rezultat, mora biti moguće vidjeti:
- iz kojeg je izvora došao
- kada je prvi i zadnji put viđen
- kako je standardiziran
- je li bio ručno korigiran
- zašto je uključen ili isključen iz valuation seta
