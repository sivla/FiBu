# BC Card Atlas

Status: `universaarl-draft`, `not-empty`, `target-evidence-started`.

Dieses Atlas-Dokument sammelt Kartenkontexte, die fuer Klickanleitungen und technische Nachweisfuehrung wichtig sind. Es ist keine vollstaendige Tabellenreferenz.

PREP-022-Qualitaet: `thin-but-usable`.

Der Atlas enthaelt aktuell nur einen belastbaren aktiven Companies-/Mandantenkontext. Das ist korrekt, solange `UNIVERSAARL-DE` noch nicht existiert. Nach Company Creation muessen Company Information, No. Series, Posting Groups, VAT Setup, Dimensions und Masterdata Cards priorisiert ergaenzt werden.

| Card/List/Worksheet | Page ID | Bereich | FastTabs/Felder | Actions | Evidence | Grenze |
|---|---:|---|---|---|---|---|
| Companies List / Mandanten | `357` | Foundation/Company | `Name`, `Anzeigename`, `Testunternehmen`, `Unternehmenseinrichtung aktivieren`, `Einrichtungsstatus` | `Neu`, Pfeil neben `Neu`, `Kopieren`, `Testunternehmen`, `Liste bearbeiten` sichtbar; TARGET-002 zeigt `Neu` als unsaved blank row; TARGET-007 zeigt Dropdown; TARGET-009 ist bis Rechtefreigabe geparkt | `evidence/target-001/` bis `evidence/target-009-main-neu-list-company-create-gate/` | Liste, keine Company Card und keine gespeicherte Erstellung bewiesen; nach Rechtefreigabe `Neues Unternehmen erstellen` neu pruefen |

## Naechste Kartenprioritaeten

| Reihenfolge | Karte/Liste | Usecase | Warum |
| ---: | --- | --- | --- |
| 1 | Company Information | `TARGET-COMPANY-INFO-001` | Rechtsname, Adresse und Firmenkontext tragen alle spaeteren Buchscreenshots. |
| 2 | No. Series / No. Series Lines | `TARGET-NOSERIES-001` | Ohne Nummernserien sind Belegnummern und Entries spaeter schwer erklaerbar. |
| 3 | General Posting Setup und Posting Group Cards | `TARGET-POSTINGGROUPS-001` | Kontenfindung ist Gate vor Preview und Posting. |
| 4 | VAT Posting Setup | `TARGET-VAT-001` | Deutsche USt braucht Setup, Preview und VAT Entries. |
| 5 | Dimensions / Dimension Values / Default Dimensions | `TARGET-DIMENSIONS-001` | Reporting und Filterlogik brauchen Dimensionen vor den ersten Buchungen. |

## PREP-024 Read-only Kartenpaket

| Discovery-ID | Karte/Liste | Status | Pflichtbeobachtung | Nicht behaupten |
| --- | --- | --- | --- | --- |
| `RO-W0-COMPANIES-357` | Companies List / Mandanten | `ready-for-readonly-playwright` | sichtbare Spalten, sichtbarer `Neu`-Kontext, sichtbarer Dropdown-Kontext, ob `UNIVERSAARL-DE` sichtbar ist | keine Company-Anlage, kein Speichererfolg |
| `RO-W0-MY-SETTINGS` | My Settings / Meine Einstellungen | `universaarl-prep-observed` | aktive Company-/Rollen-/Sprachfelder; PREP-033 beweist Settings-Menue-Route und OK/Abbrechen-Grenze | keine erfolgte Company-Auswahl, keine gespeicherte Aenderung |
| `RO-W1-COMPANY-INFORMATION` | Company Information | `requires-universaarl-company` | Name, Adresse, Land/Region, USt-IdNr., FastTabs | keine rechtlich/final korrekten Firmendaten ohne spaeteres Setup |
| `RO-W1-NO-SERIES` | No. Series / Nummernserien | `requires-universaarl-company` | Seriencode, Beschreibung, Start-/Letztnummern, Manual-Nos.-Signal | keine aktive Nummernserienkonfiguration ohne Setup-Case |

## Erfassungsregel

Jeder neue Universaarl-Prozess soll Page, Typ, sichtbare FastTabs/Felder, Buttons/Actions, Pflichtfelder, Defaults, Screenshot-Beweis und Buchkapitelbezug erfassen.

## Zero-Open-Questions-Regel

Jede nicht verstandene Karte oder FastTab erzeugt entweder einen Eintrag in `.agent/state/open_questions_register.json` oder bekommt einen finalen Status aus `BC-ZERO-OPEN-QUESTIONS-POLICY.md`.

## UI-Look-and-Feel-Regel

Karten brauchen FastTab-Bewusstsein: relevante FastTabs aufklappen, stoerende FastTabs einklappen, FactBox-Zweck bewerten und erst danach Feld-/Action-Blocker schreiben.
