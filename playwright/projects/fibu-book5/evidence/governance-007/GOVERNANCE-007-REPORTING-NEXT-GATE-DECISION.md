# GOVERNANCE-007 Reporting Next Gate Decision

| Feld | Wert |
|---|---|
| Sandbox | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Datenbasis | CRONUS USA |
| Arbeitsart | Governance-/State-/Gate-Sync |
| BC-Lauf | nein |
| Setup geaendert | nein |
| Gebucht | nein |
| Vorlauf | `REPORTING-011`, `REPORTING-012` |
| Entscheidung | `REPORTING-013-ANALYSIS-VIEW-FIELDMAPPING-SETUP` fuer genau den naechsten Lauf freigeben |

## Situation

Das Buchziel fuer Kapitel 10 und 25 bleibt offen: Financial Reports beziehungsweise eine GuV-Auswertung sollen nach `PRODUCTLINE=MACHINE`, `CHANNEL=B2B` und `DEPARTMENT=SALES` erklaert werden. Die vorhandene Evidence beweist `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` am Artikelposten, aber nicht als Financial-Reports-Summenwirkung.

`REPORTING-011` hat das von `GOVERNANCE-006` freigegebene Analysis-View-Gate verbraucht. Der Lauf war fachlich richtig, aber nicht erfolgreich: `Analysis Views` war erreichbar, jedoch ohne sichere editierbare Feldzuordnung fuer die Anlage oder Aenderung von `RM-PLCH`. `REPORTING-012` hat diesen Blocker in Buch, Workplan, Audit, Coverage und State synchronisiert.

## Entscheidung

`REPORTING-013-ANALYSIS-VIEW-FIELDMAPPING-SETUP` wird fuer genau den naechsten Lauf auf `approved-for-next-run` gesetzt.

Die Freigabe gilt nur fuer diesen engen Ablauf:

1. `Analysis Views` in `RM-DEMO` oeffnen.
2. Vorherzustand sichern: vorhandene Views, insbesondere ob `RM-PLCH` bereits existiert.
3. Die editierbare Card oder Liste sichtbar machen.
4. Feldmapping dokumentieren: `Code`, `Name`, `Dimension 1 Code`, `Dimension 2 Code`.
5. Nur wenn das Feldmapping sicher ist: `RM-PLCH` idempotent anlegen oder aktualisieren mit `PRODUCTLINE` und `CHANNEL`.
6. Danach `Update` ausfuehren, falls verfuegbar und fachlich noetig.
7. Danach `Analysis by Dimensions` pruefen und nachweisen, ob `PRODUCTLINE`/`CHANNEL` als Achsen nutzbar sind.

Wenn Schritt 3 oder 4 nicht sicher gelingt, muss `REPORTING-013` abbrechen, `rejected` dokumentieren und darf keine Analysis View anlegen oder aendern.

## Warum dieser Gate-Hebel sinnvoll ist

- Reporting ist der wichtigste offene O2C-nahe Nachweis fuer Kapitel 10 und 25.
- Die bisherigen read-only Pfade sind ausgeschoepft oder negativ belegt.
- Ein erneuter Blindversuch wuerde nichts lernen; ein Feldmapping-Lauf lernt dagegen genau den fehlenden BC-Klickpfad.
- Die Freigabe ist reversibilitaetsbewusst: kein Setup ohne sichere Feldzuordnung, keine Buchung, keine Zahlung, keine Bankabstimmung.
- Ein positiver Lauf wuerde Anfaengern erklaeren, warum Dimensionen in Posten nicht automatisch Reportingachsen sind.

## Nicht erlaubt

- Kein Wiederholen von `REPORTING-011` als gleicher Fit-Versuch.
- Keine API-Abkuerzung.
- Keine Analysis View anlegen oder aendern, wenn die UI-Felder nicht sicher identifiziert sind.
- Keine neue O2C-/P2P-/Inventory-/Payment-Buchung.
- Keine Bankabstimmung.
- Keine deutsche `19 %` USt oder deutscher Reporting-Finalnachweis behaupten.

## Naechster Schritt

`REPORTING-013-ANALYSIS-VIEW-FIELDMAPPING-SETUP`: UI-first Feldmapping fuer Analysis Views dokumentieren und nur bei sicherer Zuordnung `RM-PLCH` idempotent anlegen oder aktualisieren. Danach Analysis by Dimensions pruefen. Wenn die Zuordnung nicht sicher ist, abbrechen und den Blocker als Lernfall dokumentieren.
