# FIXEDASSETS-018 Evidence-Index

Status: `labor`, `ui-first`, `card-preflight`, `no-save`, `no-setup-change`, `no-posting`, `not-final`, `de-final-open`.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-018-result.json` | JSON-Ergebnis | Ziel, Kontext, New-/Karten-Preflight, Feldhinweise, Sicherheitsgrenzen und naechsten Schritt | keine gespeicherte Anlage und keine Buchung | labor |
| `FIXEDASSETS-018-FA-CNC-01-CARD-PREFLIGHT.md` | Lernzusammenfassung | warum die Anlagenkarte vor Kreditor/Rechnung/Zugang/AfA kommt | keinen deutschen Finalnachweis | labor |
| `010-fixed-assets-list-page-text.txt` | Seitentext | Anlagenliste/Seitentext vor Karten-Preflight | keinen fertigen Zielstammsatz und keinen vollstaendigen Nicht-Existenz-Beweis | compact |
| `020-new-action-candidates.json` | JSON-Auszug | sichtbare New/Neu-Kandidaten, falls FA-CNC-01 nicht sichtbar war | keine Klickfreigabe fuer Speichern | compact/conditional |
| `030-card-preflight-page-text.txt` | Seitentext | Karten-/Folgekontext nach New, falls geoeffnet | keine gespeicherte Karte | compact/conditional |
| `030-card-preflight-hints.json` | JSON-Auszug | sichtbare Felder, FastTabs und Aktionen im Karten-Preflight | kein vollstaendiges Tabellenmodell | compact/conditional |
| `040-after-preflight-fixed-assets-page-text.txt` | Seitentext | Rueckkehr zur gefilterten Liste nach Preflight | keine Anlage | compact |
| `*.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Grenzen je Bild | keine eigenstaendige fachliche Wahrheit ohne JSON/Markdown | labor/candidate/rejected |
| `playwright/projects/fibu-book5/img/fixedassets-018-010-fixed-assets-list-target-not-visible.png` | Screenshot | Anlagenlisten-Kontext ohne sichtbaren Zielcode `FA-CNC-01` im Ausschnitt | keinen Karten-/Stammdatenbeweis und keinen sauber leeren Filterbeweis | labor-preflight-limited |
| `playwright/projects/fibu-book5/img/fixedassets-018-030-fixed-asset-card-preflight.png` | Screenshot | leere Anlagenkarte mit sichtbaren Grund- und AfA-Feldern | keine gespeicherte Anlage `FA-CNC-01`, keine `HGB`-/`MACHINES`-Zuordnung | labor-preflight |

## Kernaussage

`FA-CNC-01` ist im aktuellen RM-DEMO-Labor noch nicht sichtbar und wurde nicht gespeichert. Die leere `Fixed Asset Card` ist aber als Lern- und Feldmapping-Nachweis brauchbar: sichtbar sind unter anderem `No.`, `Description`, `FA Class Code`, `FA Subclass Code`, `Depreciation Method`, AfA-Start-/Enddatum und `Book Value = 0,00`. Naechster Schritt ist `FIXEDASSETS-019-FA-CNC-01-CARD-FIELD-MAPPING-DECISION`: entscheiden, ob die sichtbaren Kartenfelder fuer einen engen UI-first Setup-Fit reichen; weiterhin kein `K30000`, keine Einkaufsrechnung, kein Zugang, keine AfA und keine Buchung.
