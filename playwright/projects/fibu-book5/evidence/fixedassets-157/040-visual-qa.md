# FIXEDASSETS-157 Visual QA

Status: `labor`, `visual-qa`, `read-only`, `technical-extraction-blocked`, `not-final`.

## Bildpruefung

Das Bild `playwright/projects/fibu-book5/img/fixedassets-157-010-fa-gl-journal-line-ownership-readonly.png` ist als Labor-/Diagnosebild brauchbar. Sichtbar sind:

- Seite `Fixed Asset G/L Journals`
- `Batch Name = DEFAULT`
- eine sichtbare Journalzeile
- `Document No. = G05001`
- `Account Type = Fixed Asset`
- `Account No. = FA-CNC-01`
- `Depreciation Book Code = HGB`
- `Description = CNC Maschine FRA`
- unten `Number of Lines = 1`, `Balance = 0.00`, `Total Balance = 0.00`

## Nicht sichtbar

- Betrag `68.000`
- Gegenkonto
- kontrollierte Ownership-Entscheidung `keep`, `cleanup` oder `rebuild`
- Preview Posting
- Buchung
- Postenspur

## Technischer Befund

Der Screenshot beweist mehr als der DOM-/Text-Extractor: `030-line-ownership-signals.json` zeigt, dass die maschinelle Auswertung nur den Business-Central-Shell-Text erfasst hat. Das ist ein Playwright-Lernfall fuer Business Central: Bei bestimmten Seiten/Grid-Zustaenden kann der sichtbare Grid-Inhalt im Screenshot fachlich klar sein, waehrend `innerText`/DOM-Auswertung leer oder unvollstaendig bleibt.

## Buchwirkung

Das Bild darf als Diagnosebild fuer die Zeilenbesitz-Frage genutzt werden: Vor einer Werteingabe muss ein Autor erklaeren, ob die sichtbare Zeile zum aktuellen Laborfall gehoert oder erst lokal entschieden werden muss.

Es darf nicht als Anschaffungs-, Preview-, Posting- oder Postenspur-Bild genutzt werden.
