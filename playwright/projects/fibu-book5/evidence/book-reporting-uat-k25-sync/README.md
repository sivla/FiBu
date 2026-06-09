# BOOK-REPORTING-UAT-K25-SYNC Evidence Index

Status: `book-sync`, `no-bc-run`, `no-setup`, `no-posting`, `not-final`

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `BOOK-REPORTING-UAT-K25-SYNC.md` | Markdown-Evidence | Kapitel 25 wurde gegen `REPORTING-001` bis `REPORTING-014` synchronisiert; `UAT-K25-001` ist als Ziel-UAT markiert | Keine neue BC-Ausfuehrung, keine Financial-Reports-Summenwirkung, kein `RM-PLCH`, kein deutscher Finalnachweis | completed |
| `BOOK-REPORTING-UAT-K25-SYNC-result.json` | JSON-Evidence | maschinenlesbarer Sync-Status, Quellen, Grenzen und naechster Schritt | Keine UI-Screenshots, keine Posten, keine Buchung, kein Setup | completed |

## Kernaussage

Der Reporting-UAT-Fall `UAT-K25-001` bleibt fachlich wichtig, ist aber im aktuellen `RM-DEMO`-Labor noch Zielbild. Belegt ist:

- `Financial Reports` ist erreichbar.
- `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` sind am Artikelposten `Entry No. 792` sichtbar.
- `Analysis Views` ist erreichbar.
- `REVENUE` nutzt nicht `PRODUCTLINE`/`CHANNEL`.
- `G/L Entries` zeigen im Labor keine sichtbaren Ziel-Dimensionsspalten fuer `PRODUCTLINE`/`CHANNEL`.
- `RM-PLCH` wurde nicht angelegt.
- Das Analysis-View-Gate aus `GOVERNANCE-007` ist durch `REPORTING-013` verbraucht und rejected.

Nicht belegt sind `RM-GUV-MONAT`, `SO-1001`, deutsche `19 %` USt, deutscher Kontenplan, Financial-Reports-Summenwirkung nach `PRODUCTLINE`/`CHANNEL` und Power-BI-Abstimmung.

## Naechster Schritt

Ohne neues Gate keinen Analysis-View-Setup-Lauf starten. Naechster No-Approval-Schritt ist ein kleiner Governance-/Arbeitsplan-Sync, der den naechsten praktischen Block waehlt oder ein neues eng gescoptes Reporting-Gate vorbereitet.
