# INTERCOMPANY-002 Book-Sync

Status: `book-sync`, `labor-readiness`, `gate-locked`, `no-bc-run`, `no-posting`, `no-setup-change`, `not-final`.

## Quelle

Dieser Sync nutzt `INTERCOMPANY-001` als praktische Evidence fuer Kapitel 18. Es wurde in diesem Lauf kein neuer Business-Central-Test gestartet.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Buchkapitel | Kapitel 18 Intercompany und Ausland |
| Evidence-Basis | `playwright/projects/fibu-book5/evidence/intercompany-001/` |
| Relevante Gates | `INTERCOMPANY-001-PROCESS`, `NEW-COMPANY-001`, `TAX-002-DE-VAT-FIT` |
| Setup-Aenderung | nein |
| Buchung | nein |
| Company-Wechsel | nein |

## Synchronisierte Buchwahrheit

Kapitel 18 beschreibt fachlich den Zielprozess `IC-7001`. Der aktuelle RM-DEMO-Laborstand beweist aber nur Readiness:

- `Intercompany Setup`, `IC Partners`, `IC Inbox Transactions`, `IC Outbox Transactions` und `VAT Entries` sind als Einstiegspfade sichtbar.
- `Currencies` ist in `INTERCOMPANY-001` nicht stabil sichtbar.
- `D20000`, `D30000` und `D90000` sind in gefilterten Customer-Listen nicht sichtbar.
- Es gibt keine nachgewiesene Zielcompany `RM-PROD`, `RM-SALES` oder `RM-AT` als praktischen Prozesskontext.
- Es gibt keinen IC-Beleg `IC-7001`, keine IC Inbox/Outbox-Wirkung, keine VAT Entries zum Zielbeleg und keine IC-Abstimmung.

## Buchaenderung

Kapitel 18 hat eine Status-/Evidence-Box erhalten. Die Schrittfolge und Loesung sind jetzt als Zielpfad markiert, nicht als bereits ausgefuehrter RM-DEMO-Endstand. Damit erkennt ein Anfaenger:

- sichtbare Suchtreffer sind nur Navigationsfaehigkeit;
- fehlende Debitoren sind ein Setup-/Stammdatenbefund;
- Intercompany braucht mehrere Companies, IC-Partner, Steuer-/Waehrungsfit, Partnerannahme und Abstimmung;
- ein echter Prozesslauf ist erst mit Gate und UI-first Vorbereitung erlaubt.

## Was nicht behauptet wird

- keine deutsche 19-%-USt;
- kein deutscher Kontenplan-Endstand;
- kein finaler Intercompany-Prozess;
- keine EU-/Export-/IC-Steuerwirkung;
- keine IC-Abstimmung;
- keine Postenspur.

## Naechster Schritt ohne Gate

Weiterer sicherer Buch-/State-Sync oder ein anderer read-only Block. Kapitel 18 selbst ist ohne Gate vorerst synchronisiert.

## Naechster Schritt mit Gate

`INTERCOMPANY-001-PROCESS`: Zielcompanies, IC-Partner, Zieldebitoren, VAT-/Waehrungsfit und Beleg `IC-7001` UI-first vorbereiten und erst danach Preview/Buchung/Postenspur pruefen.
