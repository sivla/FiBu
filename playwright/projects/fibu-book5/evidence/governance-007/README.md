# GOVERNANCE-007 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `GOVERNANCE-007-REPORTING-NEXT-GATE-DECISION.md` | Governance-/Gate-Entscheidung | warum nach `REPORTING-012` genau ein neuer Feldmapping-/Setup-Versuch fuer `REPORTING-013` freigegeben wird | keine BC-Ausfuehrung, keine Analysis-View-Aenderung, keine Buchung, keine Reporting-Summenwirkung | final fuer diesen Governance-Lauf |
| `GOVERNANCE-007-result.json` | maschinenlesbares Ergebnis | Gate-Status, erlaubte naechste Aktion, harte Grenzen und Folgepflichten | keine UI-Evidence und keinen deutschen Finalnachweis | final fuer diesen Governance-Lauf |

## Kurzfazit

`REPORTING-011` ist verbraucht und `rejected`. `REPORTING-012` hat diesen Blocker synchronisiert. `GOVERNANCE-007` gibt nun genau fuer den naechsten Lauf `REPORTING-013-ANALYSIS-VIEW-FIELDMAPPING-SETUP` frei.

Die Freigabe ist eng: Der naechste Lauf muss zuerst die editierbare Analysis-View-Card oder Listen-Feldzuordnung fuer `Code`, `Name`, `Dimension 1 Code` und `Dimension 2 Code` sichtbar belegen. Nur wenn diese Zuordnung sicher ist, darf `RM-PLCH` idempotent angelegt oder aktualisiert werden.

## Grenzen

- Kein BC-Lauf in `GOVERNANCE-007`.
- Keine Setup-Aenderung in `GOVERNANCE-007`.
- Keine Buchung, Zahlung oder Bankabstimmung.
- Kein deutscher `19 %`-USt- oder deutscher Reporting-Finalnachweis.
- Kein Wiederholen von `REPORTING-011` ohne den neuen Feldmapping-Hebel.
