# FIXEDASSETS-020 Evidence-Index

Status: `labor`, `ui-first`, `readiness`, `field-mapping`, `no-save`, `no-setup-change`, `no-posting`, `not-final`, `de-final-open`.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-020-result.json` | JSON-Ergebnis | Kartenfeldmapping, sichtbare Feldpfade, Sicherheitsgrenzen und naechsten Schritt | keine gespeicherte Anlage und keine Buchung | labor |
| `FIXEDASSETS-020-FA-CNC-01-CARD-MORE-FIELDS-MAPPING.md` | Lernzusammenfassung | warum AfA-Buch und Anlagenbuchungsgruppe vor dem Speichern geklaert werden muessen | keinen deutschen Finalnachweis | labor |
| `010-new-action-candidates.json` | JSON-Auszug | kontrollierter New/Kartenkontext | keine Speichergenehmigung | compact |
| `020-card-more-fields-page-text.txt` | Seitentext | kompakter Kartenkontext nach Mehr-/Bereichsdiagnose | keinen Rohdump und keine gespeicherte Karte | compact |
| `020-card-more-fields-hints.json` | JSON-Auszug | sichtbare Felder, FastTabs und Zielwertsichtbarkeit | kein vollstaendiges Tabellenmodell | compact |
| `fixedassets-020-020-card-more-fields-mapping.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Grenzen des Bilds | keine eigenstaendige fachliche Wahrheit ohne JSON/Markdown | labor/candidate/rejected |
| `playwright/projects/fibu-book5/img/fixedassets-020-020-card-more-fields-mapping.png` | Screenshot | Karten-/Feldmapping-Kontext | keine gespeicherte Anlage und nur dann Buchkandidat, wenn Zielwerte/Zielfelder sichtbar sind | labor |
## Kernaussage

Feldpfade fuer AfA-Buch und Anlagenbuchungsgruppe wirken erreichbar. Naechster Lauf darf nur einen engen No-Save/Save-Decision-Schritt fuer FA-CNC-01 vorbereiten; Speichern weiterhin nur nach expliziter Setup-Fit-Entscheidung.
