# Klickanleitungs-Abdeckung Buch 5

Diese Datei ist die redaktionelle Ampel: Welche Buch-Klickanleitungen sind bereits mit Playwright ausgeführt, bebildert und mit Evidence abgesichert?

## Regel

Eine Klickanleitung gilt erst als abgedeckt, wenn:

1. die relevante Buchstelle vor dem Lauf gelesen wurde
2. der Klickpfad in Business Central ausgeführt wurde
3. der Screenshot im Repo liegt
4. Evidence den Zustand prüft
5. der Buchtext die tatsächlich sichtbaren Felder, Buttons und Prüfhinweise erklärt
6. Abweichungen zwischen Buch und BC im Buch oder als Finding dokumentiert sind
7. offene Findings geschlossen oder bewusst als Folgearbeit markiert sind
8. relevante Fehlerbilder und Workarounds in `WORKAROUNDS-AND-ERRORS.md` dokumentiert sind
9. die Anleitung die Anfängerfragen aus `BEGINNER-LEARNING-CHECKLIST.md` beantwortet: Bedienung, Verständnis, Kontrolle, Fehlerbild und Lösung
10. die verwendeten Bilder gegen `SCREENSHOT-QA.md` geprüft sind und keinen Laborbefund als finales Buchbild ausgeben
11. fachliche Aussagen gegen `MICROSOFT-DOC-VALIDATION.md` beziehungsweise Microsoft Learn geprüft sind, sofern sie allgemeine Business-Central-Regeln betreffen
12. die Anleitung gegen `ENVIRONMENT-PORTABILITY.md` geprüft ist, wenn sie später in einem deutschen Zielmandanten wiederholt werden soll

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

| O2C | Verkaufsauftragsliste öffnen, Debitor `D10000` setzen und Zeile `RM-M100` mit Menge `1`, Lagerort `FRA-ZL`, Preis `68.000` prüfen | `UAT-O2C-001` | `img/uat-o2c-001-010-suche-verkaufsauftraege.png`, `img/uat-o2c-001-020-liste-verkaufsauftraege.png`, `img/uat-o2c-001-030-kopf-debitor-d10000.png`, `img/uat-o2c-001-040-zeile-artikel-rm-m100.png` | `evidence/uat-o2c-001/030-kopf-debitor-d10000-page-text.txt`, `evidence/uat-o2c-001/040-zeile-artikel-rm-m100-api-result.json`, `evidence/uat-o2c-001/045-target-vs-labor-delta.md`, `evidence/uat-o2c-001/999-cleanup.json` | abgedeckt als Laborlauf mit API-gestützter Anlage und UI-Nachweis; nicht abgedeckt als deutscher Steuer-/Währungsnachweis und noch ohne sichtbaren Auftragsdimensionsnachweis |

## Nächste fehlende Klickanleitungen

| Priorität | Buchbereich | Klickanleitung | Blocker |
|---:|---|---|---|
| 1 | Dimensionen | UI-Klickpfad zum Dialog `Default Dimensions` fotografieren | `MASTERDATA-007` beweist die Daten per API, aber der Standarddimensionen-Dialog ist noch kein gutes Buchbild |
| 2 | Steuer | Deutschen Ziel-Fit `EUR` / `19 %` von CRONUS-USA-Fit trennen | aktueller API-Probelauf ergibt `USD`, `FURNITURE`, `taxPercent = 0` |
| 3 | O2C | Dimension `PRODUCTLINE = MACHINE` im Auftrag sichtbar nachweisen | Im O2C-Labor über `Line` -> `Related Information` -> `Dimensions` nachgewiesen; finaler deutscher Screenshot und Postennachweis offen |
| 4 | O2C | Auftrag buchen und Postenspur nachweisen | Buchung erst nach Steuer-/Dimensionsentscheidung |

## Geschlossene Findings

Alle aktuellen Findings in `playwright/FINDINGS.md` sind auf `erledigt` gesetzt. Neue sichtbare UI-Elemente, ungeklärte Buttons oder Buchabweichungen werden dort neu angelegt.
