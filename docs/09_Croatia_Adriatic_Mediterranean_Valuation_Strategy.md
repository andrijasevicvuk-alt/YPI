# Croatia / Adriatic / Mediterranean valuation strategija

## 1. Svrha
Ovaj dokument definira buduću valuation filozofiju sustava nakon foundation faze.

Projekt nije "Croatia-only pricing" alat. Projekt je:
- mediteranski valuation sustav
- lokalno usmjeren prema hrvatskoj tržišnoj realnosti
- osjetljiv na Sloveniju i širi Jadran kao visoko relevantne regionalne comparablese

## 2. Market anchor hijerarhija
Geografski prioritet nije flat Mediterranean view.

Namjeravana hijerarhija je:

`Croatia -> Slovenia -> Adriatic -> Mediterranean`

To znači:
- Hrvatska je primarni local market anchor
- Slovenija je visoko relevantan adjacent micro-market
- ostali Jadran je snažan regionalni sloj
- širi Mediteran daje fallback i market context

Sustav zato:
- ne tretira sve mediteranske listinge jednako
- ne traži samo hrvatske matchove
- ne ignorira bliska tržišta kao što je Slovenija

## 3. Retrieval princip za budući scoring
Kad valuation-ready dataset i scoring postanu aktivni, retrieval i weighting trebaju slijediti redoslijed:

`Croatia-first -> Slovenia -> Adriatic fallback -> Mediterranean fallback`

Posljedice:
- hrvatski listingi dobivaju najveću geography weight vrijednost
- slovenski listingi dobivaju vrlo visoku težinu, tik ispod Hrvatske
- ostali jadranski listingi dobivaju snažnu, ali nižu težinu
- širi mediteranski listingi ostaju fallback i šire market context

## 4. Geography kao confidence signal
Confidence kasnije ne smije ovisiti samo o builder/model/year matchu.

Mora uzeti u obzir:
- builder/model/variant/year/ownership/engine similarity
- source reliability
- recency listinga
- market closeness prema Hrvatskoj

Praktični princip:
- listingi bliži Hrvatskoj povećavaju confidence
- valuation koji se oslanja na udaljenije listinge mora imati niži confidence
- valuation koji se oslanja na starije listinge mora imati niži confidence

Važno:
- to ne znači da su stariji listingi beskorisni
- znači da smanjuju sigurnost procjene trenutnog tržišnog stanja
- stariji listingi i dalje mogu biti važni za price range i market context

## 5. Recency pravilo
Recency mora biti eksplicitna komponenta valuation logike.

Pravila:
- recentni listingi dobivaju najveću važnost za trenutni market signal
- umjereno stari listingi ostaju valjani comparables
- stale listingi se down-weightaju, ali se ne odbacuju automatski
- vrlo stari listingi mogu ostati fallback uz niži confidence i vidljivo upozorenje
- output mora jasno komunicirati kad nedostaju jaki recentni hrvatski comparablesi

## 5.1 Price influence vs confidence influence
Starost listinga treba gledati kroz dvije odvojene uloge:

1. Price influence
- listing može i dalje pomoći oblikovati valuation range
- stariji listing može pomoći definirati floor, ceiling i širu tržišnu strukturu

2. Confidence influence
- isti listing može imati manji doprinos sigurnosti valuationa
- razlog nije "staro = bezvrijedno", nego "staro = manje siguran signal trenutnog tržišta"

## 5.2 Price adjustment koncept
Kad se valuation kasnije oslanja na starije listinge, sustav može trebati price adjustment koncept kako bi ih približio trenutnim tržišnim uvjetima.

To može uključivati:
- trend-based adjustment
- category-based adjustment

Ovdje se ne definira formula ni implementacija. To ostaje budući scoring/data-layer feature.

## 6. Izvori i geografska uloga
Trenutno preferirani izvori po ulozi:

- `Boat24` = marketplace backbone
- `Croatia Yachting` = hrvatski / jadranski broker trust anchor
- `Marine One` = dodatni hrvatski / jadranski broker trust anchor
- `iNautia` = širi mediteranski / europski expansion layer

Ovo nije konačna tvrdnja da su to "zauvijek najbolji izvori". To je trenutno preferirani rollout set koji treba testirati empirijski.

## 7. Fazični rollout izvora
Preporučeni rollout:

Phase A:
- Boat24 + Croatia Yachting

Phase B:
- Boat24 + Croatia Yachting + Marine One

Phase C:
- procijeniti poboljšava li iNautia valuation kvalitetu dovoljno da opravda dodatnu scraping složenost

Nakon svake faze procjenjuje se:
- data quality
- scraping stabilnost
- similarity-scoring usefulness
- hrvatska relevantnost
- mediteranski coverage
- cost / maintenance burden

Pravilo:
- zadržava se kombinacija koja daje najbolji valuation quality per operational cost
- ne pretpostavlja se da maksimalan broj izvora daje najbolji sustav

## 8. Granica prema Step 4
Ovaj dokument ne znači da se geography-aware scoring implementira odmah.

Važna granica:
- Step 4 ostaje fokusiran na raw -> normalized pipeline
- Step 4 implementira extraction, normalization, validation i publication granice
- Step 4 radi nad minimalnim kontroliranim podacima i pilot source kombinacijama
- Step 4 ne implementira scoring, weighting ni ranking logiku

Ove smjernice služe da Step 4 pripremi podatke i signalne atribute, a Step 5 kasnije može provesti scoring i confidence pravila bez promjene arhitekture.
