# FIXEDASSETS-014 Evidence-Index

Status: `labor`, `ui-first`, `setup-proof`, `idempotent`, `no-posting`, `not-final`, `de-final-open`.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-014-result.json` | JSON-Ergebnis | Ziel, Aktion, Vorher/Nachher, Sicherheitsgrenzen und naechsten Schritt | keinen deutschen finalen Anlagenprozess | labor |
| `FIXEDASSETS-014-HGB-DEPRECIATION-BOOK-FIT.md` | Lernzusammenfassung | warum `HGB` als AfA-Buch-Prerequisite angelegt/erkannt wurde | keine Anlagenbuchung und keine Kontenentscheidung | labor |
| `010-before-hgb-page-text.txt` | Seitentext | Startkontext Depreciation Books mit HGB-Pruefung | keinen finalen Zielzustand | compact |
| `020-after-hgb-page-text.txt` | Seitentext | Nachher-Kontext mit sichtbarem `HGB` | keine Anlagenbuchung | compact |
| `020-after-hgb-visible-rows.json` | JSON-Auszug | sichtbare relevante Zeilen nach dem Fit | keine vollstaendige Tabellenextraktion | compact |
| `fixedassets-014-010-depreciation-books-before-hgb.png` | Screenshot | Vorher-Kontext der HGB-Pruefung | kein Buch-Endbild, falls HGB fehlt | labor |
| `fixedassets-014-020-depreciation-books-after-hgb.png` | Screenshot | sichtbares `HGB` als AfA-Buch im Labor | kein deutscher Finalnachweis | labor/book-candidate |
| `*.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen je Bild | keine eigenstaendige fachliche Wahrheit ohne JSON/Markdown | labor |

FIXEDASSETS-015-MACHINES-ACCOUNT-MAPPING-DECISION: read existing CRONUS FA Posting Groups and decide whether a narrow MACHINES setup-fit is safe; do not create FA-CNC-01 yet.
