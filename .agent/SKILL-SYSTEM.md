# Universaarl Skill System

Status: active-draft
Purpose: Wiederverwendbare Faehigkeiten dort dokumentieren, wo sie echte Sicherheit, Wiederholbarkeit, Training, UAT, Buchqualitaet oder Legacy-Bereinigung verbessern.

## Grundsatz

Skills sind keine zweite Projektmethodik. Ein Skill entsteht nur, wenn ein Muster wiederholt, riskant, fehleranfaellig, beweisrelevant oder fuer Menschen/Agenten wiederverwendbar ist.

## Aktuelle Prioritaet

| Priority | Skill | Warum jetzt |
| --- | --- | --- |
| P0 | `playthru-context-check` | Jede BC-/Playwright-Arbeit muss `playthru / UNIVERSAARL-DE` beweisen, bevor ein weiterer Schritt sinnvoll ist. |
| P0 | `legacy-reference-finder` | Das Repo enthaelt noch viele RM-/MCP-/CRONUS-Muster; aktive Rueckfaelle muessen verhindert werden, ohne historische Evidence zu zerstoeren. |
| P0 | `read-first-page-proof` | TARGET-075 und die Foundation-Validierung brauchen lesende Nachweise, bevor Writes wieder erlaubt werden. |
| P0 | `state-sync-check` | Roadmap, Dashboard, State und Backlog duerfen keine widerspruechlichen naechsten Schritte liefern. |
| P0 | `bc-write-gate` | Sandbox-Superrechte sollen handlungsfaehig bleiben, aber Setup/Master Data/Posting brauchen Zweck, Evidence und Korrekturpfad. |

## Skill-Entstehungsregel

Nach jeder sinnvollen Arbeit pruefen:

- Wurde ein Muster gefunden, das wiederkommt?
- Wurde ein Fehler verhindert oder korrigiert?
- Wuerde ein kuenftiger Lauf mit weniger Kontext sicherer arbeiten?
- Hilft es einem Key User, Consultant, Autor oder Playwright-Test?
- Hilft es, Legacy aus aktiven Pfaden zu entfernen?

Nur bei mindestens einem klaren Ja wird ein Skill erstellt oder verbessert.

## Projektverknuepfung

Jeder aktive Skill muss mindestens einen Bezug haben zu Workstream, Jira-/Confluence-Artefakt, BC-Prozess, Playwright-Szenario, UAT, Training, Buch/Handbuch, Legacy-Bereinigung oder Agentenuebergabe.

## Nicht tun

- keine vollstaendige Skill-Bibliothek auf Vorrat
- keine Skills ohne aktuellen Projektbezug
- keine parallele Wahrheit neben `UNIVERSAARL-EXECUTION-ROADMAP.md`
- keine Skills, die historische RM-DEMO-Evidence als aktive Universaarl-Wahrheit behandeln
