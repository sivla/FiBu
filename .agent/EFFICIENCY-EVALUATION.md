# Effizienz-Evaluation fuer FiBu Buch 5

Stand: 2026-06-19  
Branch: `codex/token-efficient-autopilot-state`

## Ziel

Die Agentenstruktur soll nicht einfach kleinere Modelle erzwingen. Sie soll Wiederholungen, falsche Kontextladung und unnoetige teure Urteilsarbeit reduzieren.

Das Zielbild:

- `Monkey Crew` erledigt billige Fleissarbeit.
- `Wizard Bench` baut und prueft Tools.
- `Judge Panel` entscheidet nur bei BC-/FiBu-Urteil und Risiko.
- `Big Brain` bleibt seltene Endabnahme.

## Aktueller Befund

Gut geloest:

- kompakter State unter `.agent/state/`
- klare harte Sandbox-Grenze `MCP_1_20260210`
- `shopify` ist hart ausgeschlossen
- keine neuen npm-Abhaengigkeiten fuer Agent-Tools
- Routing-Hierarchie ist maschinenlesbar und im Preflight geprueft
- Skills existieren als kleine, fokussierte Markdown-Anweisungen

Noch ineffizient:

- Ein Agent muss am Anfang mehrere Dateien einzeln lesen, obwohl daraus fast immer derselbe Lauf-Steckbrief entsteht.
- `last_run_summary.json` enthaelt noch nicht automatisch die aktuelle Routing-Pruefung.
- Modellnutzung oberhalb `wizard_work` ist zwar definiert, aber noch nicht mit echten Laufdaten messbar.
- Es gibt noch keinen schnellen Blick darauf, welche drei Skills fuer den aktiven Case wirklich zuerst geladen werden sollen.

## Naechster Effizienz-Hebel

Der erste praktische Hebel ist ein dependencyfreies Context-Pack:

```bash
npm run agent:context
```

Das Skript liest nur:

- `.agent/state/current.json`
- `.agent/state/project_state.json`
- `.agent/state/coverage_state.json`
- `.agent/state/last_run_summary.json`
- aktive Case-Datei
- `.agent/model-routing.json`

Es gibt danach einen kompakten JSON-Steckbrief aus:

- aktiver Case
- Instanz und Company
- vorgeschlagene Taskclass
- erlaubte und verbotene Aktionen
- maximal drei empfohlene Skills
- naechster Schritt
- harte Ausschluesse

## Bewertete Verbesserungen

| Verbesserung | Nutzen | Risiko | Entscheidung |
|---|---:|---:|---|
| Context-Pack-Skript | hoch | niedrig | jetzt umsetzen |
| echte Model-Usage-Auswertung | mittel | niedrig | nach ersten Logs |
| automatische Skill-Auswahl mit Score | mittel | mittel | spaeter |
| aktive Case-Datei automatisch aktualisieren | mittel | mittel | nur nach klarer Policy |
| weitere npm-Dependencies fuer Agent-Tools | niedrig | hoch | nicht machen |

## Messbare Effizienzkriterien

Ein Lauf ist effizienter, wenn:

- maximal acht Dateien vor der ersten Entscheidung gelesen werden
- maximal drei Skills geladen werden
- BC-/FiBu-Urteil nicht von `monkey_work` getroffen wird
- grosse Buchdateien nur bei belegtem Buch-Sync gelesen werden
- Screenshots nur geoeffnet werden, wenn Screenshot-QA wirklich Bildinhalt braucht
- ein Lauf mit einem klaren `nextStep` endet

## Naechste Ausbaustufe

Nach einigen echten Autopilot-Laeufen sollte das Model-Usage-Log ausgewertet werden:

- Welche Tasks eskalieren zu oft?
- Wo spart `monkey_work` wirklich Tokens?
- Wo waere direktes `judge_work` guenstiger gewesen?
- Welche Skills erzeugen Wiederholungen statt Klarheit?

Dann kann ein zweiter Check entstehen:

```bash
npm run agent:usage:summary
```

Dieser Schritt ist erst sinnvoll, wenn echte Logdaten vorhanden sind.
