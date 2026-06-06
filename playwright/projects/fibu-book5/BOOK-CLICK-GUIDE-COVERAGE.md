# Klickanleitungs-Abdeckung Buch 5

Diese Datei ist die redaktionelle Ampel: Welche Buch-Klickanleitungen sind bereits mit Playwright ausgeführt, bebildert und mit Evidence abgesichert?

## Regel

Eine Klickanleitung gilt erst als abgedeckt, wenn:

1. der Klickpfad in Business Central ausgeführt wurde
2. der Screenshot im Repo liegt
3. Evidence den Zustand prüft
4. der Buchtext die sichtbaren Felder, Buttons und Prüfhinweise erklärt
5. offene Findings geschlossen oder bewusst als Folgearbeit markiert sind

## Abgedeckte Klickanleitungen

| Buchbereich | Klickanleitung | Testfall | Screenshot | Evidence | Status |
|---|---|---|---|---|---|
| Foundation | Spielwiese und Suche öffnen | `UAT-START-001` | `img/uat-start-001-*` | Testlauf/Screenshots | abgedeckt |
| Foundation | Company `RM-DEMO` aus CRONUS bestätigen | `FOUNDATION-001` | `img/foundation-001-*` | Playwright-Test | abgedeckt |
| Foundation | Unternehmensdaten pflegen | `FOUNDATION-002` | `img/foundation-002-*` | Playwright-Test | abgedeckt |
| Stammdaten-Audit | Ist-Stand Customers, Items, Locations, Dimensions, Posting Setup sichern | `MASTERDATA-001` | `img/masterdata-001-*` | `evidence/masterdata-001/` | abgedeckt |
| Dimensionen | Mindestdimensionen anlegen | `MASTERDATA-002` | `img/masterdata-002-dimensions-rhein-main.png` | `evidence/masterdata-002/` | abgedeckt |
| Dimensionen | Mindest-Dimensionswerte anlegen | `MASTERDATA-003` | `img/masterdata-003-dimension-values-rhein-main.png` | `evidence/masterdata-003/` | abgedeckt |
| Lager | Lagerort `FRA-ZL` anlegen | `MASTERDATA-004` | `img/masterdata-004-locations-rhein-main.png` | `evidence/masterdata-004/` | abgedeckt |
| Debitoren | Debitor `D10000` anlegen und sichtbar prüfen | `MASTERDATA-005` | `img/masterdata-005-customers-after-api.png` | `evidence/masterdata-005/api-result.json` | abgedeckt |
| Artikel | Artikel `RM-M100` mit Kosten und Preis anlegen und sichtbar prüfen | `MASTERDATA-005` | `img/masterdata-005-items-after-api.png` | `evidence/masterdata-005/api-result.json` | abgedeckt |
| Posting-Fit | Debitor-Template und Artikel-Buchungsgruppen für ersten O2C-Probelauf setzen | `MASTERDATA-006` | `img/masterdata-006-customer-template-fit.png`, `img/masterdata-006-item-posting-fit.png` | `evidence/masterdata-006/api-result.json` | abgedeckt als CRONUS-Technikfit |
| Dimensionen | Standarddimensionen `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` setzen | `MASTERDATA-007` | `img/masterdata-007-item-rm-m100-standarddimension.png`, `img/masterdata-007-customer-d10000-standarddimension.png` | `evidence/masterdata-007/api-result.json` | abgedeckt als API-/Evidence-Nachweis |

## Nächste fehlende Klickanleitungen

| Priorität | Buchbereich | Klickanleitung | Blocker |
|---:|---|---|---|
| 1 | Dimensionen | UI-Klickpfad zum Dialog `Default Dimensions` fotografieren | `MASTERDATA-007` beweist die Daten per API, aber der Standarddimensionen-Dialog ist noch kein gutes Buchbild |
| 2 | Steuer | Deutschen Ziel-Fit `EUR` / `19 %` von CRONUS-USA-Fit trennen | aktueller API-Probelauf ergibt `USD`, `FURNITURE`, `taxPercent = 0` |
| 3 | O2C | Verkaufsauftrag in der UI erfassen und Screenshots erzeugen | API-Probe ist grün, UI-Klickpfad fehlt noch |
| 4 | O2C | Auftrag buchen und Postenspur nachweisen | Buchung erst nach Steuer-/Dimensionsentscheidung |

## Geschlossene Findings

Alle aktuellen Findings in `playwright/FINDINGS.md` sind auf `erledigt` gesetzt. Neue sichtbare UI-Elemente, ungeklärte Buttons oder Buchabweichungen werden dort neu angelegt.
