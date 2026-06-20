# FIXEDASSETS-158 Line Ownership Decision

Status: `local-review`, `judge_work`, `no-bc`, `no-playwright`, `no-cleanup`, `no-value-entry`, `no-preview`, `no-posting`, `not-final`.

## Entscheidung

Die in `FIXEDASSETS-157` sichtbare Fixed-Asset-G/L-Journalzeile wird als `keep-protected-existing-labor-line` klassifiziert.

Sie wird nicht geloescht, nicht ueberschrieben und nicht als Buchungsfreigabe behandelt.

## Begruendung

Der Screenshot aus `FIXEDASSETS-157` zeigt fachlich relevante Zielsignale:

- Seite `Fixed Asset G/L Journals`
- `Batch Name = DEFAULT`
- eine sichtbare Zeile
- `Document No. = G05001`
- `Account Type = Fixed Asset`
- `Account No. = FA-CNC-01`
- `Depreciation Book Code = HGB`
- `Description = CNC Maschine FRA`
- `Number of Lines = 1`
- `Balance = 0.00`
- `Total Balance = 0.00`

Damit ist die Zeile fuer das Buch und das Labor wichtig genug, um sie nicht blind zu bereinigen.

Gleichzeitig fehlen fuer Schreib-/Preview-/Posting-Reife:

- Betrag `68.000`
- Gegenkonto
- stabile maschinenlesbare Grid-Auswertung
- klare Entscheidung, ob diese Zeile der geplante Zielentwurf ist oder ein Rest aus frueheren Laborlaeufen
- Preview Posting
- Postenspur

## Entscheidung fuer den naechsten Lauf

Der naechste Lauf soll kein Cleanup und keine Werteingabe durchfuehren. Sinnvoll ist ein enger Read-only-Lauf:

`FIXEDASSETS-159-FA-GL-JOURNAL-AMOUNT-BALACCOUNT-READONLY`

Ziel:

- horizontale Grid-Sicht gezielt auf Betrag und Gegenkonto pruefen
- Screenshot nur akzeptieren, wenn Betrag-/Gegenkonto-Spalten oder ihr Fehlen sichtbar sind
- DOM-/Grid-Extractor-Grenze weiter diagnostizieren
- keine Werte, kein Cleanup, keine Preview, kein `Post`

## Buchwirkung

Fuer Kapitel 21 ist das ein guter Anfaenger-Lernfall: Eine Journalzeile ist nicht automatisch "meine naechste Eingabezeile". Vor jeder Werteingabe muss der Autor klaeren, ob die Zeile bereits fachlich zum Fall gehoert und welche Pflichtfelder noch fehlen.

Das Bild aus FA-157 darf als Diagnosebild genutzt werden, nicht als Anschaffungs- oder Buchungsbild.
