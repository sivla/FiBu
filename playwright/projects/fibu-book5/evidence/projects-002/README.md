# PROJECTS-002 Evidence-Index

Ziel: Kapitel 16 mit der vorhandenen `PROJECTS-001`-Readiness synchronisieren, ohne Business Central erneut auszufuehren, ohne Projektanlage, ohne WIP, ohne Rechnung und ohne Buchung.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `PROJECTS-002-result.json` | JSON-Ergebnis | Sandbox/Company-Kontext, Arbeitsmodus, betroffene Buchstelle, verwendete Evidence und Sicherheitsgrenzen | keinen neuen BC-Lauf und keine neue UI-Sichtbarkeit | labor, book-sync, no-posting |
| `PROJECTS-002-BOOK-SYNC.md` | Lern-/Buch-Sync | Warum Kapitel 16 sichtbare Project-/Job-Einstiege nur als Readiness lesen darf | kein eingerichtetes Projekt `PROJ-5001`, keine Projektbuchung, keine WIP | labor, gate-locked |
| `../projects-001/*` | Basis-Evidence | UI-Einstiege und Zielobjektbefunde aus dem read-only Lauf | keinen End-to-End-Projektprozess | labor, read-only |

## Kernaussage

`PROJECTS-002` schliesst den sicheren nicht freigabepflichtigen Projektblock: Das Buch erklaert jetzt, dass `Projects`, `Project Planning Lines`, `Project Journals`, `Project Ledger Entries`, `Project Statistics` und `Project WIP` sichtbare Einstiege sind, aber `PROJ-5001`, `RES-TECH`, `SP-SENSOR-02` und `PROJ-LAG` in `RM-DEMO` fehlen. Projekt-Setup, Planzeilen, Journal, WIP, Faktura und Postenspur bleiben Gate-Folgearbeit.
