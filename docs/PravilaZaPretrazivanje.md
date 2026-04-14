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

## Pravila scoringa
- Točan builder + model = 40
- Ista varijanta = 20
- Ista godina = 15
- Unutar +/- 1 godine = 10
- Isti ownership status = 20
- Ista konfiguracija motora = 10
- Ista država ili podregija = 5

## Pravila prikaza
- Summary panel mora prikazati preporučeni raspon, medianu, prosjek, broj usporedbi i confidence.
- Rezultati moraju imati numeric score i kratko objašnjenje.
- Ako se koristi fallback, to mora biti jasno napisano na vrhu rezultata.
- Korisnik mora moći otvoriti detalj i vidjeti source trace i osnovni quality status.

## Pravila razvoja
- Svaka promjena pravila mora biti evidentirana u GitHub repou.
- Ako se scoring promijeni, mora se ažurirati dokumentacija i testovi.
- Ako se promijene mapping pravila za builder/model/variant, mora postojati regression test ili fixture primjer.
