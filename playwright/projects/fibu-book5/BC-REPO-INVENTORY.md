# BC Repo Inventory

Status: `universaarl-transition`, Stand: 2026-06-30.

Dieses Inventar beschreibt die Projektstruktur fuer `FiBu Buch 5`. Es ist kein Ersatz fuer Evidence, sondern die Orientierung fuer neue Agenten und spaetere deutsche Final-Rebuild-Laeufe.

## Hauptbereiche

| Bereich | Pfad | Zweck | Status |
|---|---|---|---|
| Agent-State | `.agent/state/` | aktive Cases, Coverage, letzter Lauf, Rebuild-Map | aktiv |
| Agent-Regeln | `.agent/autopilot.md`, `.agent/BC-OPERATING-MODEL.md`, `.agent/modes/` | Arbeitsmodus, Safety, Modell-/Skill-Nutzung | aktiv |
| Tests | `playwright/projects/fibu-book5/tests/` | versionierte Playwright-Laeufe fuer BC-Labor und Evidence | aktiv |
| Evidence | `playwright/projects/fibu-book5/evidence/` | kompakte JSON/Markdown/Text-Nachweise | aktiv, sehr gross |
| Screenshots | `playwright/projects/fibu-book5/img/` | buch- und evidence-relevante PNGs | aktiv |
| Testdaten | `playwright/projects/fibu-book5/testdata/` | wiederverwendbare fachliche Testdaten | aktiv |
| Buchdrafts | `playwright/projects/fibu-book5/book-drafts/` | Laborfassungen fuer Buchkapitel | aktiv |
| Buchmaster | `FiBu_Buch_BC_Standardprozesse_DE_Master_Blueprint.md` | redaktioneller Zieltext | aktiv, vorsichtig patchen |
| Projektstatus | `CURRENT-STATE.md`, `BOOK-CLICK-GUIDE-COVERAGE.md`, `LAB-FIT-STATUS.md` | legacy/Projektwahrheit fuer Buch 5 | aktiv, aber parallel zur `.agent`-Struktur |

## Aktiver Arbeitsstand

- Instanz: `playthru`.
- Zielcompany: `UNIVERSAARL-DE`, noch nicht angelegt.
- Musterfirma: `Universaarl GmbH`.
- Aktiver Modus: PREP-/Read-only-/Repo-/Doku-Arbeit bis SUPER-/Company-Create-Rechte vorhanden sind.
- Aktiver Case nach PREP-017: `PREP-018-PLAYWRIGHT-SCRIPT-AND-HELPER-INVENTORY`.
- Aktive Steuerwahrheit liegt in `.agent/state/current.json` und `.agent/state/marathon_queue.json`.
- Alte RM-DEMO-/MCP-/CRONUS-Evidence bleibt historische Laborquelle, nicht aktive Zielwelt.

## Legacy / unklar

- Viele `fixedassets-*` Evidence-Ordner sind historische Mikro-Cases. Sie duerfen nicht geloescht werden, weil Buch- und State-Links darauf zeigen.
- Alte `mcp-*` Evidence-Ordner sind Labor-/Explorationsartefakte. Sie sind keine finalen Klickpfade.
- `dropshipping-*` bleibt historisch/ausgeschlossen: Shopify ist fuer Buch 5 gestrichen.
- Gemischtsprachige Screenshots sind Laborbilder, nicht automatisch Buchfinalbilder.

## Nicht anfassen / nicht committen

- `.env`, `playwright/.auth/`, Auth-/Secret-Dateien.
- `playwright-report/`, `test-results/`, Traces, Videos, rohe Browserlogs.
- Rohsnapshots wie `page-*.yml`, `console-*.log`.
- Evidence-Links nicht durch Umbenennen brechen.

## Duplikate und Struktur-Risiken

- `CURRENT-STATE.md`/Legacy-Dokumente und `.agent/state/*.json` laufen parallel. Neue Agents nutzen zuerst `.agent/state/current.json`, danach nur gezielt Legacy-State.
- Fixed-Assets hat sehr viele Mikro-Cases. Neue Struktur soll daraus Atlas-/Coverage-Wissen ziehen, nicht noch mehr Review-Schleifen erzeugen.
- PREP-018 zaehlt 306 Playwright-Tests und 307 `fibu:*`-Skripte. Die aktive Universaarl-Schiene ist deutlich kleiner: 9 `target-*`-Tests plus 4 `live-smoke-*`-Read-only-Kandidaten. Details stehen in `UNIVERSAARL-PLAYWRIGHT-SCRIPT-INVENTORY.md`.
- Screenshot-Metadaten liegen teils im Evidence-Ordner, PNGs im projektweiten `img/`. Diese Struktur bleibt vorerst bestehen.

## Kuenftige Struktur

- Prozesswahrheit wird in `BC-COVERAGE-MATRIX.md` verdichtet.
- Page-/Field-/Action-Wissen wird in `BC-PAGE-ATLAS.md`, `BC-FIELD-ATLAS.md`, `BC-ACTION-ATLAS.md` gepflegt.
- Buchungswirkungen stehen in `BC-POSTING-IMPACT-ATLAS.md`.
- Screenshot-Status steht in `BC-SCREENSHOT-INVENTORY.md`.
- Fehler und Blocker stehen in `BC-ERROR-BLOCKER-ATLAS.md`.
- Langfristige Reihenfolge steht in `BC-PROCESS-COVERAGE-ROADMAP.md`.
