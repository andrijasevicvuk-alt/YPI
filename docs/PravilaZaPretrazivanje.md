# PravilaZaPretrazivanje.md

## Svrha
Ovaj dokument definira pravila pretrage, usporedbe i prikaza rezultata za interni market comparison MVP.

## Osnovna pravila pretrage
- Korisnik ne piše dugi chat upit, nego koristi strukturirana polja.
- Builder, model, godina i ownership status su obavezni kada god su poznati.
- Ako nema točne godine, sustav jasno označava da koristi nearest-year fallback.
- Charter i ex-charter usporedbe ne smiju se miješati s private rezultatima bez vidljive oznake.
- Svaki rezultat mora imati izvor, datum viđenja i cijenu u standardiziranoj valuti.
- Interne bilješke (`worker_notes`) služe za audit i korekcije te se ne smiju izgubiti pri refaktoru, importu ili reprocessingu.

## Pravila dataset ulaza
- Raw podaci nikad ne idu direktno u UI i scoring.
- U scoring ulaze samo valuation-ready zapisi koji su prošli cleaning i minimalni quality prag.
- Duplicate cluster mora biti riješen prije konačnog rangiranja.
- Niski confidence parsing mora biti vidljivo označen ili isključen prema pravilima eligibilityja.

## Buduća pravila scoringa
Scoring, weighting, ranking i confidence nisu još implementirani. Detaljna scoring logika pripada Step 5+ fazi, nakon što Step 4 završi raw -> normalized pipeline, extraction, normalization, validation i publication.

Budući scoring mora gledati ove signale:
- builder/model similarity kao najvažniji signal
- variant, year, ownership status i engine similarity kao jake dodatne signale
- source quality, data quality i duplicate status kao uvjete pouzdanosti
- geography prema redoslijedu `Croatia -> Slovenia -> Adriatic -> Mediterranean`
- recency kao signal trenutnog tržišta

Geografsko pravilo:
- Hrvatska je najjači lokalni market anchor
- Slovenija ima vrlo visoku adjacent-market relevantnost
- Jadran je snažan regionalni fallback
- širi Mediteran je broader fallback i market context

Recency pravilo:
- recentni listingi su najjači signal trenutnog tržišta
- stariji listingi nisu beskorisni i mogu pomoći definirati price range, floor/ceiling i market structure
- stariji listingi smanjuju confidence zato što su slabiji dokaz trenutnih tržišnih uvjeta
- fallback na starije ili udaljenije podatke mora biti jasno objašnjen

## Pravila prikaza
- Summary panel mora prikazati preporučeni raspon, medianu, prosjek, broj usporedbi i confidence.
- Kad scoring bude implementiran, rezultati moraju imati numeric score i kratko objašnjenje.
- Ako se koristi fallback, to mora biti jasno napisano na vrhu rezultata.
- Korisnik mora moći otvoriti detalj i vidjeti source trace i osnovni quality status.

## Pravila razvoja
- Svaka promjena pravila mora biti evidentirana u GitHub repou.
- Kad se scoring uvede ili promijeni, mora se ažurirati dokumentacija i testovi.
- Ako se promijene mapping pravila za builder/model/variant, mora postojati regression test ili fixture primjer.
