# PravilaZaPretrazivanje.md

## Svrha
Ovaj dokument definira pravila pretrage i usporedbe plovila za interni MVP alat.

## Osnovna pravila
- Radnik ne piše dugi chat upit, nego koristi strukturirana polja.
- Builder, model, godina i ownership status su obavezni kada god su poznati.
- Ako nema točne godine, sustav jasno označava da koristi nearest-year fallback.
- Charter i ex-charter usporedbe ne smiju se miješati s private rezultatima bez vidljive oznake.
- Svaki rezultat mora imati izvor, datum viđenja i cijenu u standardiziranoj valuti.
- Worker notes služe za internu procjenu i ne smiju se izgubiti pri refaktoru ili importu.

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

## Pravila razvoja
- Svaka promjena pravila mora biti evidentirana u GitHub repou.
- Ako se scoring promijeni, mora se ažurirati i dokumentacija i testovi.
