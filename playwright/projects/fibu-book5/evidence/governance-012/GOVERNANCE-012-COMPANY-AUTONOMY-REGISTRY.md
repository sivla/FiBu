# GOVERNANCE-012 Company Autonomy Registry

Status: `governance`, `instance-bound`, `no-bc-run`, `no-company-switch`, `no-company-created`, `no-setup-change`, `no-posting`.

## Ausgangslage

Der bisherige Repo-Stand behandelte `RM-DEMO` als alleinigen aktiven Lernmandanten und neue Companies als gesperrt. Der neue V5-Arbeitsrahmen erweitert die Autonomie: Der Autopilot darf innerhalb der Instanz `MCP_1_20260210` eigenstaendiger arbeiten, muss aber die Instanzgrenze absolut einhalten.

## Entscheidung

Vor jeder Multi-Company-Arbeit wird eine Company Registry Pflicht. Deshalb wurden angelegt:

- `playwright/projects/fibu-book5/COMPANY-REGISTRY.md`
- `playwright/projects/fibu-book5/COMPANY-REGISTRY.json`

`RM-DEMO` bleibt die belegte aktive Laborcompany. `RM-PROD`, `RM-SALES`, `RM-SERVICE`, `RM-SHARED` und `RM-AT` sind geplante Zielcompanies, aber noch nicht als live sichtbare BC-Companies nachgewiesen.

## Neue Regel

Company-Wechsel oder Company-Anlage sind innerhalb `MCP_1_20260210` erlaubt, wenn vor der Aktion dokumentiert ist:

- Zielcompany
- Zweck
- Buchkapitel
- Datenbasis oder Vorlage
- erwartete Nutzung
- Risiken
- Evidence-Plan
- Rueckfalllogik

Ohne Registry-Eintrag keine Company-Aktion.

## Warum das fuer Anfaenger wichtig ist

Ein Business-Central-Prozess kann in einem Mandanten funktionieren und in einem anderen scheitern, weil Stammdaten, Kontenplan, Posting Setup, Steuerlogik, Waehrung, Lagerorte oder Rollen abweichen. Das Buch muss daher immer erklaeren, in welcher Company ein Screenshot oder Beleg entstanden ist und ob das ein Laborbefund, Zielbild oder finaler Nachweis ist.

## Was nicht bewiesen wurde

- keine live ausgelesene Liste aller Companies in `MCP_1_20260210`
- keine neue Company
- kein Company-Wechsel
- kein deutsches VAT19-Setup
- kein deutscher Kontenplan-Endstand
- kein Intercompany-Prozess
- keine Buchung

## Naechster sinnvoller Schritt

`GOVERNANCE-013-COMPANY-LIST-READONLY`: Companies-Seite in `MCP_1_20260210` read-only oeffnen, sichtbare Companies und aktuellen Mandanten als Screenshot/Evidence sichern, Registry danach synchronisieren.

