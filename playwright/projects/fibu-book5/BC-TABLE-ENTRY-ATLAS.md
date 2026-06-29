# BC Table Entry Atlas

Status: `universaarl-draft`, `not-empty`, `target-evidence-started`.

Dieses Atlas-Dokument sammelt Posten-/Entry-Kontexte fuer spaetere Buchprozesse. TARGET-001/TARGET-002 erzeugen noch keine Posten, definieren aber die Erfassungsregel.

| Entry/Page | Bereich | Erwartete Felder | Evidence | Grenze |
|---|---|---|---|---|
| Companies List row | Foundation/Company | `Name`, `Anzeigename`, `Testunternehmen`, Setup-Status | `evidence/target-001/`, `evidence/target-002/` | Keine Buchungsposten; TARGET-002 oeffnete eine unsaved blank row, aber keine gespeicherte Company |

## Erfassungsregel

Jeder gebuchte Universaarl-Prozess muss die passenden Entries/Posten erfassen: Page, Filter, Belegnummer, Konten, Betrage, Dimensionen, Steuer/VAT, Nebenbuchbezug, Korrekturweg und Screenshot-Beweis.

## Zero-Open-Questions-Regel

Jede nicht verstandene Tabelle oder Entry-Seite erzeugt entweder einen Eintrag in `.agent/state/open_questions_register.json` oder bekommt einen finalen Status aus `BC-ZERO-OPEN-QUESTIONS-POLICY.md`.
