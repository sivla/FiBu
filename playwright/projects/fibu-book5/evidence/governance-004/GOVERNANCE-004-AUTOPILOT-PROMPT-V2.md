# GOVERNANCE-004 - Autopilot Prompt V2 Projektartefakt

Stand: 2026-06-09

## Kontext

| Feld | Wert |
|---|---|
| Repository | `sivla/FiBu` |
| Branch | `codex/playwright-bc-screenshot-foundation` |
| Sandbox | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Arbeitstyp | Governance-/State-Sync |
| BC-Lauf | nein |
| Setup-Aenderung | nein |
| Buchung | nein |

## Was wurde gemacht?

Der robuste Autopilot-Prompt V2 wurde als projektinternes Handover-Dokument abgelegt:

```text
playwright/projects/fibu-book5/AUTOPILOT-PROMPT-V2.md
```

Der Prompt fasst die wiederholbaren Autopilot-Regeln zusammen:

- Git-Startpruefung
- Pflichtlekture von `AUTOPILOT-STATE.json` und Gates
- Sandbox-/Company-Grenze
- harte Freigabe-Gates
- Shopify-Scope-Ausschluss
- UI-first-Regel
- Arbeitstypen
- Evidence- und Buchregeln
- Validierung, Commit und Push
- Abschlussmeldung

## Ergebnis

Der naechste Codex-Agent muss die Regeln nicht mehr aus Chat-Historie rekonstruieren. Der aktuelle maschinenlesbare State bleibt in `AUTOPILOT-STATE.json`; die Gate-Wahrheit bleibt in `POSTING-AND-SETUP-GATES.md`.

## Grenzen

- Kein Business-Central-Lauf.
- Keine neue Evidence aus BC.
- Keine Setup-Aenderung.
- Keine Buchung.
- Der Prompt ersetzt nicht `AUTOPILOT-STATE.json`; er ist die menschlich lesbare Queue-Vorlage.

## Naechster Schritt

Ohne Gate bleibt `GLOSSARY-001-READINESS` der naechste sichere fachliche Schritt.
