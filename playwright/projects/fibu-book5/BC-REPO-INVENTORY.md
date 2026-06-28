# BC Repo Inventory

Status: `labor-reference`, Stand: 2026-06-28.

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

- Instanz: `MCP_1_20260210`.
- Company: `RM-DEMO`.
- Aktiver Area-State: `p2p`.
- Aktiver Case: `P2P-005-PARTIAL-RECEIPT-LINE-QTY-GATE`.
- Aktuelle Laborbasis: O2C, P2P, Payments, Inventory, Fixed Assets und Reporting haben Teil-/Labor-Evidence; deutsche Finalbeweise bleiben offen.

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
- Screenshot-Metadaten liegen teils im Evidence-Ordner, PNGs im projektweiten `img/`. Diese Struktur bleibt vorerst bestehen.

## Kuenftige Struktur

- Prozesswahrheit wird in `BC-COVERAGE-MATRIX.md` verdichtet.
- Page-/Field-/Action-Wissen wird in `BC-PAGE-ATLAS.md`, `BC-FIELD-ATLAS.md`, `BC-ACTION-ATLAS.md` gepflegt.
- Buchungswirkungen stehen in `BC-POSTING-IMPACT-ATLAS.md`.
- Screenshot-Status steht in `BC-SCREENSHOT-INVENTORY.md`.
- Fehler und Blocker stehen in `BC-ERROR-BLOCKER-ATLAS.md`.
- Langfristige Reihenfolge steht in `BC-PROCESS-COVERAGE-ROADMAP.md`.
