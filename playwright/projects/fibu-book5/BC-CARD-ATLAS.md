# BC Card Atlas

Status: `universaarl-draft`, `not-empty`, `target-evidence-started`.

Dieses Atlas-Dokument sammelt Kartenkontexte, die fuer Klickanleitungen und technische Nachweisfuehrung wichtig sind. Es ist keine vollstaendige Tabellenreferenz.

| Card/List/Worksheet | Page ID | Bereich | FastTabs/Felder | Actions | Evidence | Grenze |
|---|---:|---|---|---|---|---|
| Companies List / Mandanten | `357` | Foundation/Company | `Name`, `Anzeigename`, `Testunternehmen`, `Unternehmenseinrichtung aktivieren`, `Einrichtungsstatus` | `Neu`, `Kopieren`, `Testunternehmen`, `Liste bearbeiten` sichtbar; TARGET-002 zeigt `Neu` als unsaved blank row; TARGET-003 findet keine sichtbare/klickbare exakte `Create New Company`-Aktion | `evidence/target-001/`, `evidence/target-002/`, `evidence/target-003/` | Liste, keine Company Card und keine gespeicherte Erstellung bewiesen; naechster Schritt braucht scoped Action/Menu Discovery |

## Erfassungsregel

Jeder neue Universaarl-Prozess soll Page, Typ, sichtbare FastTabs/Felder, Buttons/Actions, Pflichtfelder, Defaults, Screenshot-Beweis und Buchkapitelbezug erfassen.

## Zero-Open-Questions-Regel

Jede nicht verstandene Karte oder FastTab erzeugt entweder einen Eintrag in `.agent/state/open_questions_register.json` oder bekommt einen finalen Status aus `BC-ZERO-OPEN-QUESTIONS-POLICY.md`.
