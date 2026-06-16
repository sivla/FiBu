# Evidence Pack Template

Fuer jeden reproduzierten Fall wird ein Ordner erzeugt:

```text
evidence/[ticket-id]-[kurztitel]/
```

## Pflichtstruktur

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
img/
logs/
api/
playwright/
```

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
