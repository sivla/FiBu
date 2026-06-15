# GOVERNANCE-011 Documentation Structure

Status: `done-governance`

Dieser Lauf hat keine Business-Central-Ausfuehrung gestartet. Es gab keine Buchung, keine Zahlung, keine Setup-Aenderung, keine Stammdatenanlage, keine neue Company und keine Screenshot-/Evidence-Loeschung.

## Zweck

Die Projektwahrheit wurde strukturell auffindbarer gemacht:

- Dokumentationsrollen stehen jetzt in `DOCUMENTATION-MAP.md`.
- Wiederverwendbare BC-/Playwright-Muster stehen in `BC-PLAYWRIGHT-PATTERNS.md`.
- Seiten, Aktionen und bekannte Fallen stehen maschinenlesbar in `BC-PAGE-ACTION-MAP.json`.
- Setup-Readiness je Prozess steht in `SETUP-READINESS-MATRIX.md`.
- Prozessfaelle stehen maschinenlesbar in `PROCESS-CASE-REGISTRY.json`.
- Screenshot-QA wurde um Typen, Pflichtmetadaten und Nicht-Loeschregeln ergaenzt.

## Stichprobe Evidence-Struktur

| Ordner | Befund | Folge |
|---|---|---|
| `uat-o2c-001` | README, Result-JSON, Sync, Trace, Screenshot-Metadaten und Cleanup vorhanden | keine Umstrukturierung noetig |
| `p2p-001` | README, Posting-/Readiness-Dateien, Result-/Trace-Evidence und Screenshot-Metadaten vorhanden | keine Umstrukturierung noetig |
| `inventory-008` | README, Posting-Trace, Sync, Result und Report-/Postenbilder vorhanden | keine Umstrukturierung noetig |
| `payments-011` | README, Zahlungsresultat, Postenspur und Screenshot-Metadaten vorhanden; Bankposten-Folgepfad in `payments-013` | keine Umstrukturierung noetig |
| `reporting-013` | README, Result, Feldmapping-/Rejected-Evidence und Screenshots vorhanden | als rejected Setup-Gate im Register aufgenommen |
| `fixedassets-010` | README, Result, UI-Preflight, Page-Text, UI-Hints und Screenshot-Metadaten vorhanden | als Preflight-Basis fuer Fixed Assets aufgenommen |

## Ergebnis

Die Stichprobe zeigt: Wichtige Evidence-Ordner tragen bereits die benoetigte Mindeststruktur. Der groesste Nutzen lag deshalb nicht im Umschreiben der Evidence, sondern in einer uebergeordneten Navigations- und Governance-Schicht.

