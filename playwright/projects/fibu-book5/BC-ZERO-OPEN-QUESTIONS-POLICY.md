# Business Central Zero Open Questions Policy

Aktive Buchwelt:

- Instanz: `playthru`
- Zielcompany: `UNIVERSAARL-DE`
- Musterfirma: `Universaarl GmbH`
- Ausgeschlossen: Shopify / Online Store

Diese Policy verhindert, dass Business-Central-Fragen im Buch, in Coverage oder in Cases als vage offene Punkte liegen bleiben. Jede unklare Page, Karte, Liste, Worksheet, jedes Feld, jede Action, jeder Dialog, jede Request Page, jeder Report, jede Tabelle, jeder Entry und jede Buchungswirkung bekommt entweder eine erklaerte Antwort oder einen finalen Klassifikationsstatus.

## Finalstatus fuer Fragen

| Status | Bedeutung |
| --- | --- |
| `explained-by-universaarl-evidence` | In `playthru` / `UNIVERSAARL-DE` praktisch beobachtet oder ausgefuehrt und mit Evidence belegt. |
| `explained-by-microsoft-learn` | Durch offizielle Microsoft-Dokumentation ausreichend erklaert. |
| `explained-by-al-object-analysis` | Durch erlaubte AL-/Objektanalyse ausreichend erklaert. |
| `not-visible-due-permission-or-role` | In aktueller Rolle nicht sichtbar; Rolle/Permission ist die erklaerte Grenze. |
| `not-available-in-current-license-or-app-area` | In aktueller Lizenz/App Area nicht verfuegbar. |
| `not-applicable-to-universaarl-main-company` | Fuer die Hauptcompany fachlich nicht passend. |
| `requires-subcompany-usecase` | Braucht einen eigenen Universaarl-Subcompany- oder Spezialusecase. |
| `excluded-shopify` | Online Store / Shopify ist bewusst ausgeschlossen. |
| `removed-or-deprecated` | Nicht mehr Teil des aktuellen Standards oder abgeloest. |
| `external-integration-required` | Erfordert ein externes System und wird nur mit sicherem Testkontext ausgefuehrt. |
| `needs-human-decision` | Harte Ausnahme: autonom nicht loesbar und fachlich entscheidungspflichtig. |

`needs-human-decision` ist kein Parkplatz. Es ist nur erlaubt, wenn UI, Quellen, AL-/Objektanalyse und ein sinnvoller Usecase keine sichere Klaerung liefern.

## Register-Regel

Maschinenlesbare Fragen stehen in:

`.agent/state/open_questions_register.json`

Das Register darf am Ende eines Laufs keine Items mit `status = "open"` enthalten. Neue Unklarheiten werden sofort als `in-progress`, `explained`, `excluded-shopify`, `not-applicable`, `requires-subcompany-usecase` oder `needs-human-decision` klassifiziert.

## Eskalationsleiter

1. Repo, Buchdrafts, Coverage, Atlanten, alte Evidence als Lernmuster.
2. Playwright UI Evidence in `playthru`.
3. Microsoft Learn und offizielle Microsoft-Dokumentation.
4. Amtliche Quellen fuer Recht, Steuer, GoBD und E-Rechnung.
5. Erlaubte AL-/Objektanalyse.
6. Experimenteller Universaarl-Test mit Smart Decision Gate.

Es wird nicht geraten. Wenn ein Verhalten nicht erklaert ist, entsteht ein Follow-up-Case oder ein finaler Status.

## Objektabdeckung

Die Objektabdeckung steht in:

`playwright/projects/fibu-book5/BC-OBJECT-COVERAGE-CATALOG.md`

Jeder relevante Standardbereich wird nicht nur pro Prozess, sondern auch pro Objekt betrachtet: Page, Card, List, Worksheet, Field, Action, Dialog, Request Page, Report, Table, Entry, Setup Switch und Posting Impact.

## Buchregel

Das Buch enthaelt keine internen Open-Question-Listen. Im Buch steht die fertige Erklaerung fuer Anfaenger: was sichtbar ist, warum es wichtig ist, welcher Button oder welches Feld wirkt und was nach Speichern oder Buchen passiert.

Interne Unklarheiten bleiben in Register, Atlas, Result JSON, Coverage oder Case-Datei.

## Done Definition

Ein Bereich ist erst `complete`, wenn:

1. relevante Usecases praktisch bewiesen oder final klassifiziert sind,
2. Pages, Karten, Listen und Worksheets erklaert sind,
3. Felder und Actions erklaert sind,
4. Dialoge, Request Pages, Reports und Batch Jobs erklaert sind,
5. Tabellen, Entries und Buchungswirkungen erklaert sind,
6. Quellenbasis oder Universaarl-Evidence vorhanden ist,
7. Screenshots und Playwright-Evidence vorhanden oder begruendet nicht noetig sind,
8. Buchtext anfaengerfreundlich geschrieben ist,
9. Legacy-RM-DEMO/Rhein-Main/CRONUS nicht als aktive Zielwahrheit genutzt wird,
10. keine Registerfrage fuer den Bereich `open` ist.
