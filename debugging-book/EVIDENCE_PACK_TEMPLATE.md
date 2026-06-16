# Evidence Pack Template

Fuer jeden reproduzierten Fall wird ein Ordner erzeugt:

```text
debugging-book/evidence/[ticket-id]-[kurztitel]/
```

## Pflichtstruktur

Pflichtdateien:

```text
00-ticket-summary.md
01-screenshot-analysis.md
02-hypotheses.md
03-repro-plan.md
04-page-inspection.md
05-data-checks.md
06-telemetry.md
07-repro-steps.md
08-root-cause.md
09-fix-or-workaround.md
10-regression-test.md
11-book-chapter-draft.md
12-lessons-learned.md
13-follow-up-questions.md
14-risk-notes.md
```

Optionale Unterordner, wenn Material entsteht:

```text
img/
logs/
api/
playwright/
```

## Evidence-Arten

Jedes Evidence Pack trennt:

| Evidence-Art | Zweck | Beispiel |
|---|---|---|
| Symptom-Evidence | zeigt, was der User sieht | Screenshot der fehlenden Spalte |
| Kontext-Evidence | zeigt Page/Table/Feld/Umgebung | Page Inspection |
| Root-Cause-Evidence | belegt die Ursache | Datencheck, Telemetry, Setup-Wert |
| Regression-Evidence | zeigt, dass der alte Fehler abgefangen wird | Playwright-Test, Testplan |

## 00-ticket-summary.md

| Feld | Wert |
|---|---|
| Ticket-ID |  |
| Kunde |  |
| Environment |  |
| Company |  |
| User/Rolle |  |
| Modul |  |
| Prozess |  |
| Fehlermeldung |  |
| Erwartung |  |
| Ist-Verhalten |  |
| Betroffene Belege/Daten |  |
| Anhaenge/Screenshots |  |
| Datenschutzstatus |  |

## 02-hypotheses.md

| Hypothese | Wahrscheinlichkeit | Test | Ergebnis | Status |
|---|---:|---|---|---|
|  | niedrig |  |  | offen |

Statuswerte:

- offen
- bestaetigt
- widerlegt
- teilweise bestaetigt
- nicht testbar
- braucht Kundenzugriff
- braucht Entwicklerpruefung
- blockiert wegen Sicherheitsregel

## 04-page-inspection.md

| Merkmal | Wert |
|---|---|
| Page Caption |  |
| Page Name |  |
| Page ID |  |
| Page Type |  |
| Source Table |  |
| Table ID |  |
| Aktive Filter |  |
| Betroffene Felder |  |
| Extensions auf der Page |  |
| Company |  |
| User/Rolle |  |

## 06-telemetry.md

| Merkmal | Wert |
|---|---|
| Zeitpunkt |  |
| User |  |
| Environment |  |
| Company |  |
| Operation |  |
| Error Message |  |
| Object Type / Object ID |  |
| Extension |  |
| Duration |  |
| Correlation ID |  |

## 08-root-cause.md

Muss enthalten:

- bestaetigte Ursache
- Beleg
- technische Erklaerung
- fachliche Erklaerung
- ausgeschlossene Hypothesen
- betroffene BC-Objekte
- betroffene Daten
- moegliche Nebenwirkungen

## 12-lessons-learned.md

Enthaelt die wiederverwendbare Regel fuer `FEHLERJOURNAL.md` oder das Buch.

## 13-follow-up-questions.md

Enthaelt offene Rueckfragen an Kunde, Consultant, Entwickler oder Admin.

## 14-risk-notes.md

Enthaelt Datenschutz-, Production-, Buchungs-, Zahlungs-, Integrations- und Nebenwirkungsrisiken.
