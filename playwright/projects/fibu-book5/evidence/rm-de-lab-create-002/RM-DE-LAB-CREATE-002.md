# RM-DE-LAB-CREATE-002 Save Error Diagnosis

Status: `labor-blocked`, `ui-first-company-create-diagnosis`, `needs-german-final-rebuild`.

## Zweck

Dieser Lauf diagnostiziert den Companies-Page-Blocker aus `RM-DE-LAB-CREATE-001`. Er wiederholt nicht blind eine weitere Company-Anlage, sondern sammelt gezielt UI-/DOM-Signale zur ungespeicherten `RM-DE-LAB`-Zeile.

## Ergebnis

| Feld | Wert |
|---|---|
| Result Status | `blocked` |
| Zielwert sichtbar | ja |
| Save-/Page-Error sichtbar | ja |
| Fehlerkern | To create a new company, choose the Create New Company button. An assisted setup guide will make sure you get everything you need to get started. |
| Naechste Route | Do not proceed to RM-DE-LAB setup. Next safe route: Companies creation route with explicit setup-assist/status value decision or an assisted company setup/copy-company route, still UI-first and documented. |

## Was Anfaenger daraus lernen

- Ein sichtbarer Wert in einer BC-Listenzeile ist noch kein gespeicherter Datensatz.
- `Nicht gespeichert` und eine Fehlerleiste bedeuten: erst Fehlerdetails oder eine andere UI-Route pruefen, nicht mit Setup oder Company-Wechsel fortfahren.
- Fuer eine Buch-/Clickguide-Anleitung braucht der Screenshot nicht nur den Code, sondern auch den Zustand, den man fachlich sehen will: Zielwert, Spaltenkontext und Fehlerstatus.

## Grenzen

- Es wurde keine Company gespeichert oder gewechselt.
- Kein Setup, keine Datenmigration, kein Posting, kein Preview Posting und kein API-Shortcut.
- Das ist weiterhin RM-DEMO-Labor innerhalb `MCP_1_20260210`, kein deutscher Finalnachweis.
