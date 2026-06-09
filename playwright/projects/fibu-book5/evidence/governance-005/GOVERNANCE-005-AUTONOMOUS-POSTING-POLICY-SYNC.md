# GOVERNANCE-005 - Autonomous Posting Policy Sync

## Ziel

Der Autopilot-V2.2-Prompt erweitert die autonome Arbeitsweise: In der `RM-DEMO`-Sandbox duerfen bestimmte Laborbuchungen kuenftig ohne erneute externe Freigabe durchgefuehrt werden, wenn sie fachlich eng begrenzt und im UI frisch vorgeprueft sind.

Vor diesem Lauf widersprachen sich Projektdateien:

- `AUTOPILOT-STATE.json` und `POSTING-AND-SETUP-GATES.md` sperrten Zahlungen und OP-Ausgleich generell ohne ausdrueckliches Gate.
- Der neue V2.2-Prompt erlaubt kontrollierte Laborbuchungen, vor allem `PAYMENTS-011-LAB-PAYMENT`, wenn alle Sicherheitskriterien erfuellt sind.

## Durchgefuehrt

Dieser Lauf hat nur Governance-Dateien synchronisiert:

- `AUTOPILOT-STATE.json` erhaelt `autonomousAllowed`.
- `POSTING-AND-SETUP-GATES.md` erhaelt den Status `autonomous-allowed`.
- `PAYMENTS-011-LAB-PAYMENT` wird als erster autonomer Kandidat markiert.
- Wiederholungsbuchungen fuer bestehende Referenzbelege bleiben gesperrt.
- Der naechste konkrete Schritt wird auf `PAYMENTS-011-LAB-PAYMENT` mit frischem UI-Preflight gesetzt.

Es gab keine Business-Central-Ausfuehrung, keine Zahlung, keinen Ausgleich, keine Bankabstimmung, keine Setup-Aenderung und keine neue Company.

## Autonom Erlaubt

### PAYMENTS-011-LAB-PAYMENT

Erlaubt ist genau eine kontrollierte RM-DEMO-Laborzahlung fuer:

- Sandbox: `MCP_1_20260210`
- Company: `RM-DEMO`
- Debitor: `D10000`
- offene gebuchte Verkaufsrechnung: `PS-INV103297`
- Laborbankkonto: `BANK-RM-01`

Vor der Buchung muss derselbe Lauf im UI nachweisen:

- der Debitorenposten `PS-INV103297` ist noch offen
- `BANK-RM-01` hat `Bank Acc. Posting Group = CHECKING`
- Cash Receipt Journal enthaelt `D10000`, `BANK-RM-01`, Betrag `-68.000,00`
- Apply Entries bezieht sich auf `PS-INV103297`
- `Journal Check` zeigt nach `Refresh` `0 Issues`
- der Post-Bestaetigungsdialog wird vor `Ja` fotografiert
- die Postenspur ist geplant: Customer Ledger Entries, Detailed Customer Ledger Entries, Bank Account Ledger Entries falls sichtbar, G/L Entries und Open-/Apply-Status

Wenn eine Vorbedingung fehlt, wird nicht gebucht. Dann wird ein Fehlerbild mit Lernwert dokumentiert.

## Weiter Gesperrt

Diese Grenzen bleiben hart:

- keine neue Company
- kein Environment-Wechsel
- keine Produktivumgebung
- kein deutsches `19 %`-VAT-Setup als Nebenbei-Fix
- keine Security-, Integrations-, Migration-, Operations- oder Architektur-Setup-Aenderung
- keine Bankabstimmung im Payment-Lauf
- keine zweite O2C-/P2P-/`INV008`-Referenzbuchung ohne neuen fachlichen Evidence-Zweck
- keine Warehouse-Aktivierung ohne Plan
- keine Manufacturing-/Service-/Project-Buchung ohne vorherige UI-first Setup-Readiness
- kein Shopify-Scope

## Buchwirkung

Kapitel 19/20 duerfen kuenftig ergaenzt werden: Nach `PAYMENTS-001` bis `PAYMENTS-010` ist nicht mehr nur Readiness vorhanden. Der naechste belegbare Lernschritt ist eine kontrollierte Laborzahlung, aber erst nach frischem UI-Preflight. Das ist weiter kein deutscher Bank-, Steuer- oder Compliance-Endstand.

## Naechster Schritt

`PAYMENTS-011-LAB-PAYMENT` als kontrollierten Prozesslauf starten:

1. offene Rechnung `PS-INV103297` read-only pruefen
2. Cash Receipt Journal im UI vorbereiten
3. Apply Entries pruefen
4. Journal Check nach Refresh auf `0 Issues` pruefen
5. nur dann genau einmal buchen
6. Postenspur sichern

Bei jeder Abweichung: abbrechen, Evidence schreiben, Gate nicht auf `done-labor` setzen.
