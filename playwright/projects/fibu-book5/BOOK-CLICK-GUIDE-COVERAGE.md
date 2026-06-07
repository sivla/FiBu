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
| Foundation | Spielwiese und Suche öffnen | `UAT-START-001` | `playwright/projects/fibu-book5/img/uat-start-001-*` | Testlauf/Screenshots | abgedeckt |
| Foundation | Company `RM-DEMO` aus CRONUS bestätigen | `FOUNDATION-001` | `playwright/projects/fibu-book5/img/foundation-001-*` | Playwright-Test | abgedeckt |
| Foundation | Unternehmensdaten pflegen | `FOUNDATION-002` | `playwright/projects/fibu-book5/img/foundation-002-*` | Playwright-Test | abgedeckt |
| Stammdaten-Audit | Ist-Stand Customers, Items, Locations, Dimensions, Posting Setup sichern | `MASTERDATA-001` | `playwright/projects/fibu-book5/img/masterdata-001-*` | `evidence/masterdata-001/` | abgedeckt |
| Dimensionen | Mindestdimensionen anlegen | `MASTERDATA-002` | `playwright/projects/fibu-book5/img/masterdata-002-dimensions-rhein-main.png` | `evidence/masterdata-002/` | abgedeckt |
| Dimensionen | Mindest-Dimensionswerte anlegen | `MASTERDATA-003` | `playwright/projects/fibu-book5/img/masterdata-003-dimension-values-rhein-main.png` | `evidence/masterdata-003/` | abgedeckt |
| Lager | Lagerort `FRA-ZL` anlegen | `MASTERDATA-004` | `playwright/projects/fibu-book5/img/masterdata-004-locations-rhein-main.png` | `evidence/masterdata-004/` | abgedeckt |
| Debitoren | Debitor `D10000` anlegen und sichtbar prüfen | `MASTERDATA-005` | `playwright/projects/fibu-book5/img/masterdata-005-customers-after-api.png` | `evidence/masterdata-005/api-result.json` | abgedeckt |
| Artikel | Artikel `RM-M100` mit Kosten und Preis anlegen und sichtbar prüfen | `MASTERDATA-005` | `playwright/projects/fibu-book5/img/masterdata-005-items-after-api.png` | `evidence/masterdata-005/api-result.json` | abgedeckt |
| Posting-Fit | Debitor-Template und Artikel-Buchungsgruppen für ersten O2C-Probelauf setzen | `MASTERDATA-006` | `playwright/projects/fibu-book5/img/masterdata-006-customer-template-fit.png`, `playwright/projects/fibu-book5/img/masterdata-006-item-posting-fit.png` | `evidence/masterdata-006/api-result.json` | abgedeckt als CRONUS-Technikfit |
| Dimensionen | Standarddimensionen `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` setzen und im Dialog `Default Dimensions` prüfen | `MASTERDATA-007` | `playwright/projects/fibu-book5/img/masterdata-007-default-dimensions-item-rm-m100.png`, `playwright/projects/fibu-book5/img/masterdata-007-default-dimensions-customer-d10000.png`, `playwright/projects/fibu-book5/img/masterdata-007-item-rm-m100-standarddimension.png`, `playwright/projects/fibu-book5/img/masterdata-007-customer-d10000-standarddimension.png` | `evidence/masterdata-007/api-result.json`, `evidence/masterdata-007/default-dimensions-*-page-text.txt` | abgedeckt als API-/Evidence-Nachweis und UI-Laborbild |

| O2C | Verkaufsauftragsliste oeffnen, Debitor `D10000` setzen und Zeile `RM-M100` mit Menge `1`, Lagerort `FRA-ZL`, Preis `68.000`, EUR-Summen, Dimension und Preview-Posting-Fehlerbild pruefen | `UAT-O2C-001` | `playwright/projects/fibu-book5/img/uat-o2c-001-010-suche-verkaufsauftraege.png`, `playwright/projects/fibu-book5/img/uat-o2c-001-020-liste-verkaufsauftraege.png`, `playwright/projects/fibu-book5/img/uat-o2c-001-030-kopf-debitor-d10000.png`, `playwright/projects/fibu-book5/img/uat-o2c-001-040-zeile-artikel-rm-m100.png`, `playwright/projects/fibu-book5/img/uat-o2c-001-050-dimension-productline-machine.png`, `playwright/projects/fibu-book5/img/uat-o2c-001-060-buchungsvorschau.png` | `evidence/uat-o2c-001/030-kopf-debitor-d10000-page-text.txt`, `evidence/uat-o2c-001/039-factbox-hidden-result.json`, `evidence/uat-o2c-001/040-zeile-artikel-rm-m100-api-result.json`, `evidence/uat-o2c-001/045-target-vs-labor-delta.md`, `evidence/uat-o2c-001/046-o2c-lab-learning-summary.md`, `evidence/uat-o2c-001/050-line-dimension-dialog-result.json`, `evidence/uat-o2c-001/060-preview-posting-result.json`, `evidence/uat-o2c-001/060-preview-posting-learning.md`, `evidence/uat-o2c-001/999-cleanup.json` | abgedeckt als Laborlauf mit API-gestuetzter Anlage, eingeklappter FactBox, UI-Nachweis, Lernzusammenfassung und Preview-Posting-Fehlerbild; EUR ist geloest, deutsche 19-%-USt und Inventory-Posting-Konto `FRA-ZL`/`RESALE` bleiben offen |

## Nächste fehlende Klickanleitungen

| Priorität | Buchbereich | Klickanleitung | Blocker |
|---:|---|---|---|
| 1 | Steuer | Deutschen Ziel-Fit `19 %` von CRONUS-USA-Fit trennen | aktueller Laborlauf zeigt EUR, aber weiter CRONUS-USA-Sales-Tax `FURNITURE` mit 0 % statt deutschem VAT-Endstand |
| 2 | O2C | Dimension `PRODUCTLINE = MACHINE` im Auftrag final sichtbar nachweisen | Im O2C-Labor über `Line` -> `Related Information` -> `Dimensions` nachgewiesen; finaler deutscher Screenshot und Postennachweis offen |
| 3 | O2C | Auftrag buchen und Postenspur nachweisen | Buchung erst nach Steuer-/Dimensionsentscheidung und geloestem Inventory Posting Setup |

## Geschlossene Findings

Alle aktuellen Findings in `playwright/FINDINGS.md` sind auf `erledigt` gesetzt. Neue sichtbare UI-Elemente, ungeklärte Buttons oder Buchabweichungen werden dort neu angelegt.
