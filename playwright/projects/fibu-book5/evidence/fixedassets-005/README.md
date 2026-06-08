# FIXEDASSETS-005 Evidence-Index

Ziel: Read-only klaeren, ob `FA Posting Groups` als UI-Pfad fuer den naechsten Anlagen-Setup-Fit belastbar erreichbar ist.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-005-result.json` | JSON-Ergebnis | Sandbox, Company, Tell-Me-Kandidat, Klickmethode, Zielkontext, MACHINES-Sichtbarkeit, Sicherheitsgrenzen | keine Anlage, keine Setup-Aenderung, keine Buchung | labor, read-only |
| `FIXEDASSETS-005-FA-POSTING-GROUPS-PATH.md` | Lernzusammenfassung | warum FA Posting Groups vor Anlagenzugang/AfA geklaert werden muessen | keinen deutschen Kontenplan-Endstand | labor |
| `010-fa-posting-groups-tell-me-page-text.txt` | Seitentext | Such-/Tell-Me-Kontext | keine Zielseite | labor-candidate |
| `010-fa-posting-groups-tell-me-buttons.json` | Button-Evidence | sichtbare Aktionen im Suchkontext | keine Setup-Wirkung | ui-evidence |
| `010-fa-posting-groups-tell-me-candidates.json` | DOM-Kandidaten | welche UI-Elemente als Treffer erkannt wurden und welche Klickmethode genutzt wurde | keine fachliche Einrichtung | ui-diagnostic |
| `020-fa-posting-groups-result-page-text.txt` | Seitentext | Zustand nach Klickversuch | nur dann Zielnachweis, wenn Anlagenbuchungsgruppen-Kontext sichtbar ist | labor/rejected |
| `020-fa-posting-groups-result-buttons.json` | Button-Evidence | sichtbare Aktionen nach Klickversuch | keine ausgefuehrte Aktion | ui-evidence |
| `*.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen der Bilder | keine eigenstaendige fachliche Wahrheit ohne JSON/Markdown | mixed |

## Kernaussage

FIXEDASSETS-006: idempotenten UI-Setup-Fit fuer MACHINES vorbereiten; vorher CRONUS-Konten aus vorhandenen Gruppen lesen, kein Konto raten.
