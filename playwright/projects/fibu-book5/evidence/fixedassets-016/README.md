# FIXEDASSETS-016 Evidence-Index

Status: `labor`, `ui-first`, `setup-proof`, `idempotent`, `no-posting`, `not-final`, `de-final-open`.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-016-result.json` | JSON-Ergebnis | Ziel, Aktion, Vorher/Nachher, sichtbare Konten, Sicherheitsgrenzen und naechsten Schritt | keinen deutschen finalen Anlagenprozess | labor |
| `FIXEDASSETS-016-MACHINES-FA-POSTING-GROUP-FIT.md` | Lernzusammenfassung | warum `MACHINES` als Anlagenbuchungsgruppen-Prerequisite gefittet wurde | keine Anlagenbuchung und keine deutsche Kontenentscheidung | labor |
| `010-before-machines-page-text.txt` | Seitentext | Startkontext FA Posting Groups mit MACHINES-Pruefung | keinen finalen Zielzustand | compact |
| `010-before-machines-rows.json` | JSON-Auszug | relevante sichtbare Zeilen vor dem Fit | keine vollstaendige Tabellenextraktion | compact |
| `015-new-card-page-text.txt` | Seitentext | New/Card-Kontext, falls `MACHINES` neu angelegt wurde | keinen Nachher-Zustand | compact/conditional |
| `015-new-card-fields-before-fill.json` | JSON-Auszug | sichtbare Eingabefelder vor der Befuellung, falls neu angelegt wurde | keine fachliche Kontenentscheidung jenseits des freigegebenen Patterns | compact/conditional |
| `016-filled-card-page-text.txt` | Seitentext | gefuellter Kartenkontext vor Rueckkehr zur Liste, falls neu angelegt wurde | keine Buchung | compact/conditional |
| `020-after-machines-page-text.txt` | Seitentext | Nachher-Kontext mit `MACHINES`, `12210` und `82000` | keinen deutschen Kontenplan | compact |
| `020-after-machines-rows.json` | JSON-Auszug | relevante sichtbare Zeilen nach dem Fit | keine vollstaendige Tabellenextraktion | compact |
| `fixedassets-016-010-fa-posting-groups-before-machines.png` | Screenshot | Vorher-Kontext der MACHINES-Pruefung | kein Zielbild, falls MACHINES fehlt | labor |
| `fixedassets-016-020-fa-posting-groups-after-machines.png` | Screenshot | sichtbares `MACHINES` mit relevanten Kontenwerten | kein deutscher Finalnachweis | labor/book-candidate |
| `*.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen je Bild | keine eigenstaendige fachliche Wahrheit ohne JSON/Markdown | labor |

FIXEDASSETS-017-FA-CNC-01-SETUP-READINESS: decide the next narrow UI-first layer after MACHINES, likely fixed asset card or vendor K30000 readiness; still no acquisition/depreciation posting without a fresh gate.
