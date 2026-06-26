# FIXEDASSETS-221 Decision

## Befund

FA-218 hat gezeigt, dass der vorhandene Fixed-Asset-G/L-Journal-Datensatz fuer `FA-CNC-01` eindeutig ansprechbar war und dass `Amount 120.000,00` unmittelbar nach der Eingabe sichtbar/current wurde.

FA-220 hat danach bewusst nicht Preview Posting geoeffnet, weil der Betrag nach erneutem Laden der Journal Page nicht sichtbar war. Das ist ein korrekter Safety-Stopp: Ohne sichtbaren Betrag darf der Test nicht in Preview Posting laufen, weil sonst ein alter oder unvollstaendiger Journalzustand geprueft wuerde.

## Einordnung

FA-220 beweist:

- Instanz und Company blieben korrekt.
- Die Zielzeile blieb fachlich erkennbar.
- `FA Posting Type = Acquisition Cost` und `Bal. Account No. = 82000` waren weiterhin sichtbar.
- Der Lauf hat keinen Preview-, Post-, OK-/Yes- oder Setup-Schritt ausgeloest.

FA-220 beweist nicht:

- Preview Posting nach Betrag.
- Buchungsfaehigkeit des Anlagenzugangs.
- Postenwirkung in FA Ledger Entries oder G/L Entries.

## Entscheidung

Der naechste Case soll den Betrag und Preview Posting in einer einzigen kontrollierten Browser-Sitzung verbinden. Damit wird die Persistenzluecke vermieden, ohne die Sicherheitsgrenze zu lockern.

Posting bleibt gesperrt. Erst wenn Preview Posting echte Vorschauzeilen oder einen fachlichen Fehler zeigt, darf ein spaeterer Review ueber eine separate Buchungsfreigabe entscheiden.

## Naechster Case

`FIXEDASSETS-222-FA-GL-JOURNAL-AMOUNT-AND-PREVIEW-SINGLE-SESSION`
