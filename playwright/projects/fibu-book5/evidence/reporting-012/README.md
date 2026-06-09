# REPORTING-012 Evidence Index

Status: `book-sync`, `governance-sync`, `reporting-blocker-sync`, `no-bc-run`, `no-setup-change`, `no-posting`, `not-final`.

## Kurzbefund

`REPORTING-012` wertet den abgelehnten UI-first Analysis-View-Fit aus `REPORTING-011` aus und synchronisiert die Projektwahrheit. Es wurde kein neuer Business-Central-Lauf gestartet. Es wurde keine Analysis View angelegt oder geaendert.

Der Kernbefund bleibt: `Analysis Views` ist in `MCP_1_20260210` / `RM-DEMO` erreichbar, aber der Ziel-Fit `RM-PLCH` fuer `PRODUCTLINE` und `CHANNEL` wurde nicht angelegt, weil keine sichere editierbare Feldzuordnung fuer Code, Name und Dimensionsfelder sichtbar war.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `REPORTING-012-result.json` | JSON-Ergebnis | Sandbox, Company, Arbeitsart, keine BC-Ausfuehrung, keine Buchung, Entscheidung und naechster Schritt | keinen neuen UI-Zustand und keine Reporting-Summenwirkung | `book-sync` |
| `REPORTING-012-ANALYSIS-VIEW-BLOCKER-SYNC.md` | Sync-/Lernzusammenfassung | warum `REPORTING-011` nicht wiederholt werden darf und welches Gate fuer einen neuen Setup-Versuch noetig ist | keine angelegte Analysis View | `book-sync` |
| `../reporting-011/REPORTING-011-result.json` | Vorlauf-Evidence | sichtbarer UI-Zustand und rejected-Fit | keinen finalen Reportingnachweis | `labor/rejected` |

## Buchwirkung

Kapitel 25 darf die Zielanleitung fuer Financial Reports und Analysis Views weiterhin als Zielbild zeigen. Fuer den aktuellen RM-DEMO-Laborstand muss aber klar markiert bleiben:

- `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` sind am Artikelposten belegt.
- Eine Financial-Reports- oder Analysis-View-Summenwirkung nach diesen Dimensionen ist nicht belegt.
- Eine passende Analysis View ist ein eigener Setup-Klickpfad.
- Dieser Setup-Klickpfad braucht ein neues ausdrueckliches Feldmapping-/Setup-Gate.

## Naechster Schritt

Ohne neues Gate: `GOVERNANCE-007-REPORTING-NEXT-GATE-DECISION` oder ein anderer sicherer Buch-/State-Sync. Mit neuem Gate: `REPORTING-013-ANALYSIS-VIEW-FIELDMAPPING-SETUP`, zuerst Card/List-Feldmapping dokumentieren, danach erst `RM-PLCH` anlegen oder aendern.
