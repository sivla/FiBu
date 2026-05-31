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

## Nächste fehlende Klickanleitungen

| Priorität | Buchbereich | Klickanleitung | Blocker |
|---:|---|---|---|
| 1 | Debitoren | Debitor `D10000` anlegen und Standarddimensionen setzen | Posting-/Vorlagenfelder prüfen |
| 2 | Artikel | Artikel `RM-M100` anlegen, Preis/Kosten/Buchungsgruppen setzen | Item Template und Posting Groups prüfen |
| 3 | Posting | Posting-Fit für `D10000` + `RM-M100` + `FRA-ZL` prüfen | Debitor und Artikel müssen existieren |
| 4 | O2C | Verkaufsauftrag erfassen und Buchungsvorschau prüfen | Masterdata 005/006 |
| 5 | O2C | Auftrag buchen und Postenspur nachweisen | Posting-Fit muss grün sein |

## Geschlossene Findings

Alle aktuellen Findings in `playwright/FINDINGS.md` sind auf `erledigt` gesetzt. Neue sichtbare UI-Elemente, ungeklärte Buttons oder Buchabweichungen werden dort neu angelegt.
