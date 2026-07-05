# Universaarl Business-Central-Implementierungsbetriebssystem

## Aktueller Einstieg

Neue Agents, Projektleiter, Business-Central-Consultants und Solution Architects starten hier:

```text
.agent/project-template/UNIVERSAARL-EXECUTION-ROADMAP.md
.agent/ACTIVE-ARTIFACT-CLASSIFICATION.md
.agent/project-template/PROJECT-DASHBOARD-DRAFT.md
.agent/state/current.json
```

Diese Dateien beschreiben die aktive Projektwahrheit, die erlaubte naechste Aktion, die Freeze-/Resume-Grenzen und die Artefaktklassen. Sie sind wichtiger als alte Chatverlaeufe oder historische State-Bloecke.

## Aktive Zielwelt

- Business-Central-Instanz: `playthru`
- Zielcompany: `UNIVERSAARL-DE`
- Referenzfirma: Universaarl GmbH
- Waehrung und Zielkontext: EUR, deutsches Business Central, deutsche Kunden-/Schulungslogik
- Fuehrende Sprache fuer Projekt, Buch, UAT, Training und Kundenhandbuch: Deutsch
- Geparkter Live-Case: `TARGET-073`
- Erster erlaubter Resume-Pilot nach Freeze-Gate: `TARGET-075`, read-first und no-write

Legacy-Grenze:

- `RM-DEMO`, `MCP_1_20260210`, CRONUS, Rhein-Main und RM-* sind keine aktive Projektwahrheit.
- Historische Evidence bleibt erhalten, darf aber neue Arbeit nicht mehr fuehren.
- Wiederverwendbare Muster aus Legacy werden neutralisiert oder fuer Universaarl neu aufgebaut.

## Projektauftrag

`FiBu` wird zu einem schlanken, realitaetsnahen und wiederverwendbaren Business-Central-Implementierungsbetriebssystem.

Das Projekt soll:

- eine realistische Universaarl-Referenzimplementierung in Business Central aufbauen,
- Kunden-Onboarding, Projektsetup, Discovery, Solution Blueprint, Datenanforderungen, Konfiguration, Migration, UAT, Schulung, Go-live und Hypercare als wiederverwendbare Projektakte abbilden,
- Business-Central-Setup und Prozesse in `playthru` nachweisen,
- Playwright als reproduzierbares Evidence- und Schulungswerkzeug nutzen,
- Jira-/Confluence-nahe Artefakte erzeugen, die fuer echte Kundenprojekte wiederverwendbar sind,
- aus Evidence kuratierte Kundenhandbuch- und Buchtexte machen,
- Legacy-Pfade aus aktiver Steuerung entfernen.

Das Ziel ist nicht maximale Dokumentmenge. Das Ziel ist ein belastbarer Blueprint, mit dem ein echter Business-Central-Partner ein Kundenprojekt fuehren koennte.

## Projektziele

1. Aktive Projektwahrheit und Legacy-Grenzen eindeutig halten.
2. Universaarl als realistische Fallstudienfirma aufbauen.
3. Business-Central-Foundation zuerst lesend beweisen, danach gated schreiben.
4. Datenanforderungen, Entscheidungen, Risiken, UAT und Training wie in einem Kundenprojekt fuehren.
5. Playwright-Szenarien mit Startzustand, Zweck, Stop-Regeln, Evidence und Buch-/Trainingsbezug bauen.
6. Buch und Kundenhandbuch aus kuratierten, belegten Projektbausteinen schreiben.
7. Wiederholbare Muster als Skills, Helper oder Check-Regeln dokumentieren, aber nur bei echtem Nutzen.
8. Legacy-Pfade aus aktiven README-/Dashboard-/Backlog-/Script-/State-Fuehrungen entfernen.

## Zentrale Dokumente

| Datei/Ordner | Zweck |
|---|---|
| `.agent/project-template/UNIVERSAARL-EXECUTION-ROADMAP.md` | aktuelle Roadmap und naechste erlaubte Aktion |
| `.agent/ACTIVE-ARTIFACT-CLASSIFICATION.md` | Einordnung in `active-control`, `active-work`, `reference`, `parked`, `legacy-purge-source` und `superseded/remove-candidate` |
| `.agent/project-template/PROJECT-DASHBOARD-DRAFT.md` | kompakte Projektleiter-Sicht |
| `.agent/state/current.json` | maschinenlesbarer State; top-level aktive Wahrheit gewinnt gegen historische `latest*`-Bloecke |
| `.agent/PLAYTHRU-AUTHORITY-CHARTER.md` | Handlungsvollmacht innerhalb `playthru`, ohne den Freeze zu uebergehen |
| `.agent/SKILL-SYSTEM.md` | Regel, wann Skills entstehen duerfen und wann nicht |
| `.agent/project-template/WORKSTREAM-BOOK-CHAPTER-MAP-DRAFT.md` | Verbindung von Workstreams, UAT, Training, Evidence und Buch |
| `.agent/project-template/ROUTE-DECISION-CARDS-FOUNDATION-MASTER-DATA-DRAFT.md` | Variantenvergleich fuer Foundation- und Stammdatenrouten |
| `FiBu_Buch_BC_Standardprozesse_DE_Master_Blueprint.md` | Buchmaster, aber nicht aktive Projektsteuerung |
| `playwright/projects/fibu-book5/` | Playwright, Evidence, Atlanten und Bucharbeitsmaterial |

## Aktueller Fokus

1. Improvement Freeze sauber halten, bis Resume-Gates geprueft sind.
2. `TARGET-073` geparkt lassen.
3. `TARGET-075` als ersten read-first/no-write Foundation-Pilot verwenden, sobald der Freeze bewusst geliftet ist.
4. Danach `FOUNDATION-READINESS-DECISION.md` erstellen oder aktualisieren.
5. Legacy-Pfade nur noch als Migrationsquelle lesen, nicht als aktive Fuehrung.

## Definition von belastbar

Ein Projektbaustein oder Buchabschnitt ist erst dann belastbar, wenn:

- die aktive Zielwelt und Company stimmen,
- Zweck, Daten, Entscheidung, UAT-/Training- und Buchbezug klar sind,
- der Business-Central-Weg lesend beobachtet oder gated ausgefuehrt wurde,
- Evidence sagt, was bewiesen und was nicht bewiesen ist,
- Screenshots wirklich den behaupteten Kontext zeigen,
- Legacy nicht als aktive Universaarl-Wahrheit genutzt wird,
- der naechste Schritt in Roadmap, Dashboard und State nicht widerspruechlich ist.

## Arbeitsprinzip

Arbeite in kleinen, pruefbaren Batches:

1. Aktive Wahrheit lesen.
2. Kleinsten sinnvollen Fortschritt waehlen.
3. Ergebnis als bewiesen, beobachtet, Annahme, blockiert, geparkt, verworfen oder `legacy-purge-source` klassifizieren.
4. Nur die Steuerdateien aktualisieren, deren Aussage sich wirklich geaendert hat.
5. Rauschen entfernen oder parken, wenn es die aktive Steuerung erschwert.

Keine neue Methodikdatei anlegen, wenn ein bestehendes Artefakt erweitert, gekuerzt, zusammengefuehrt oder geparkt werden kann.

## Checks

Wichtige lokale Checks:

```powershell
npm run agent:preflight
npm run agent:workbreakdown:check
npm run check:encoding
git diff --check
npx tsc --noEmit
```

Business Central oder Playwright live nur ausfuehren, wenn die aktiven Gates es erlauben.

## Encoding und Plattformen

Alle Textdateien werden als UTF-8 gepflegt. Das Projekt soll auf Windows und macOS laufen.

| Bereich | Regel |
|---|---|
| Node/npm | Skripte in `package.json` plattformneutral halten |
| Playwright | Browserinstallation je Rechner mit `npx playwright install chromium` |
| Pfade | Im Code bevorzugt Node-`path` oder Playwright-Projektpfade nutzen |
| Encoding | UTF-8 und LF ueber `.editorconfig` und `.gitattributes` |
| Secrets | `.env` und `playwright/.auth/` bleiben lokal auf jedem Rechner |
