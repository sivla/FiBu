# PROJECTS-001 Readiness

Status: `labor`, `read-only`, `projects-readiness`, `gate-locked`, `no-posting`, `no-setup-change`, `not-final`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Relevantes Gate | `PROJECTS-001-POSTING` locked |
| Setup-Aenderung | nein |
| Buchung | nein |

## Gepruefte UI-Einstiege

| Tell-Me-Suche | Treffer sichtbar | Screenshot |
|---|---|---|
| Projects | ja | projects-001-010-projects-tell-me.png |
| Project Planning Lines | ja | projects-001-020-project-planning-lines-tell-me.png |
| Project Journals | ja | projects-001-030-project-journals-tell-me.png |
| Project Ledger Entries | ja | projects-001-040-project-ledger-entries-tell-me.png |
| Project Statistics | ja | projects-001-050-project-statistics-tell-me.png |
| Project WIP | ja | projects-001-060-project-wip-tell-me.png |

## Gepruefte Zielobjekte

| Objekt | Sichtbar | Rolle im Buchfall | Screenshot |
|---|---|---|---|
| PROJ-5001 | nein | geplantes Projekt fuer Installation Sondermaschine | projects-001-070-project-proj-5001.png |
| D10000 | ja | Projektkunde / Meilensteinfaktura | projects-001-080-customer-d10000.png |
| RES-TECH | nein | geplante Technikerzeit | projects-001-090-resource-res-tech.png |
| SP-SENSOR-02 | nein | geplanter Materialverbrauch im Projekt | projects-001-100-item-sp-sensor-02.png |
| PROJ-LAG | nein | geplanter Projektlagerort | projects-001-110-location-proj-lag.png |

## Anfaenger-Lernwert

Projekte starten nicht mit einer Rechnung. Zuerst muss klar sein, ob Business Central den Projektbereich findet und ob Projekt, Debitor, Ressource, Materialartikel und Projektlager ueberhaupt vorhanden sind. Erst danach machen Projektplanzeilen, Projektjournale, WIP oder Meilensteinrechnung fachlich Sinn. Wenn `PROJ-5001`, `RES-TECH`, `SP-SENSOR-02` oder `PROJ-LAG` fehlen, ist das kein Klickfehler des Anfaengers, sondern eine Stammdaten- oder Setup-Luecke.

## Was bewiesen ist

- Projects/Jobs-Einstiege wurden in RM-DEMO read-only gesucht und als Navigationsevidence dokumentiert.
- D10000 wurde als vorhandener Projektkunde read-only geprueft.
- PROJ-5001, RES-TECH, SP-SENSOR-02 und PROJ-LAG wurden als Zielobjekte read-only geprueft; fehlende Sichtbarkeit ist ein Stammdaten-/Setup-Backlog-Befund.
- Kapitel 16 braucht vor dem Projektprozess einen eigenen Projekt-Stammdaten- und Setup-Fit.

## Was nicht bewiesen ist

- Kein Projekt PROJ-5001 als fertig eingerichteter Zielprozess.
- Keine Projektaufgaben 1000/2000/3000.
- Keine Projektplanzeilen fuer RES-TECH oder SP-SENSOR-02.
- Kein Projektjournal, kein Ressourcen- oder Materialverbrauch.
- Keine WIP-Berechnung und keine WIP-Buchung.
- Keine Meilensteinrechnung, keine Debitoren-/Sach-/Projektposten aus Projects.
- Kein deutscher Finalnachweis.

## Buchwirkung

Kapitel 16 darf den aktuellen Stand nur als Project-Readiness behandeln. Die Zielschritte `PROJ-5001`, Projektaufgaben, Projektplanzeilen, Projektjournal, WIP-nahe Sicht, Meilensteinrechnung und Postenspur bleiben Gate-gesperrt, bis die benoetigten Stammdaten und ein eigener UI-first Projektlauf freigegeben sind.

## Naechster Schritt

PROJECTS-002 als Buch-/Evidence-Sync fuer Kapitel 16: Readiness-Befunde einarbeiten und danach nur mit ausdruecklichem Gate Projekt, Aufgaben, Ressource, Material, Projektlager und Projektbuchung UI-first vorbereiten.
