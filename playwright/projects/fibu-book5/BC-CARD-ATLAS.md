# BC Card Atlas

Status: `universaarl-draft`, `not-empty`, `target-evidence-started`.

Dieses Atlas-Dokument sammelt Kartenkontexte, die fuer Klickanleitungen und technische Nachweisfuehrung wichtig sind. Es ist keine vollstaendige Tabellenreferenz.

PREP-022-Qualitaet: `thin-but-usable`.

Der Atlas enthaelt inzwischen aktive Universaarl-Kontexte. `UNIVERSAARL-DE` existiert in `playthru`; Company Information, No. Series, Dimensions und der erste Kontenplan-/Sachkontenkartenpfad haben Evidence. Posting Groups, VAT Setup und Masterdata Cards bleiben naechste Prioritaeten.

| Card/List/Worksheet | Page ID | Bereich | FastTabs/Felder | Actions | Evidence | Grenze |
|---|---:|---|---|---|---|---|
| Companies List / Mandanten | `357` | Foundation/Company | `Name`, `Anzeigename`, `Testunternehmen`, `Unternehmenseinrichtung aktivieren`, `Einrichtungsstatus` | `Neu`, Pfeil neben `Neu`, `Kopieren`, `Testunternehmen`, `Liste bearbeiten` sichtbar; TARGET-002 zeigt `Neu` als unsaved blank row; TARGET-007 zeigt Dropdown; TARGET-009 ist bis Rechtefreigabe geparkt | `evidence/target-001/` bis `evidence/target-009-main-neu-list-company-create-gate/` | Liste, keine Company Card und keine gespeicherte Erstellung bewiesen; nach Rechtefreigabe `Neues Unternehmen erstellen` neu pruefen |
| No. Series / Nummernserien | `456` | Foundation/Numbering | Seriencode, Beschreibung, Start-/Endnummernspalten, Checkboxen wie `Manuelle Anz.` und `Luecken in Nummern zulassen` | `Zeilen`, `Liste bearbeiten`, Page-Inspection-Shortcut `Ctrl+Alt+F1` | `evidence/target-016*/`; TARGET-016 zeigt U-Serienkoepfe, TARGET-016D beweist Lines-Page/Table/Felder | Start-/Endnummern sind noch nicht persistent eingerichtet; keine Setup-Zuweisung und keine Belegnummernreife |
| No. Series Lines / Nr.-Serienzeilen | `457` | Foundation/Numbering | Tabelle `No. Series Line (309)` mit `Starting Date`, `Starting No.`, `Ending No.`, `Warning No.`, `Increment-by No.`, `Last No. Used`, `Open` | `Liste bearbeiten`; Page Inspection; `Einstellungen > Personalisieren`; `Fertig` zum Verlassen ohne Aenderung | TARGET-016D: `target-016d-040-after-page-inspection-shortcut.png`; TARGET-016E: Feldfluss/F2-Rejected-Proofs; TARGET-016F: `target-016f-030-personalize-mode-or-menu.png`; TARGET-016G: `target-016g-020-personalize-mode-field-action-map.png` | Koordinaten-, Selected-Cell-, einfacher Feldfluss- und F2-Routen nicht wiederholen; Personalisieren zeigt Felder/Spalten, aber kein Add-field-Panel und keine Wertpersistenz; naechster Weg ist source-backed oder Assisted Setup |
| Chart of Accounts / Kontenplan | `16` | Foundation/Finance | `Nr.`, `Name`, `GuV/Bilanz`, `Kontoart`; FactBox `Ursprungswaehrungen` | `Neu`, `Liste bearbeiten`, Zeile oeffnet Sachkontokarte | TARGET-026B: read-only blank/insufficient list; TARGET-026F: `1200 Bank Saarland` sichtbar, aber als Bankpfad fachlich verworfen; TARGET-026J: `1800 Bank Saarland` mit `Bilanz` und `Buchung` nach Reopen | Zwei sichtbare Konten sind kein vollstaendiger Kontenplan, kein SKR04-Finalclaim und keine VAT-/Posting-Setup-Freigabe; Konto und Name muessen zusammen geprueft werden |
| G/L Account Card / Sachkontokarte | `17` | Foundation/Finance | `Nr.`, `Name`, `GuV/Bilanz` / `Income/Balance (9, Option)`, `Kontokategorie`, `Kontoart` | `Bearbeiten`; Feldfluss von `Name` per `Tab` nach `GuV/Bilanz`; Kartenwerte danach ueber Page `16` reopen pruefen; `Ctrl+Alt+F1` oeffnet `Seitenueberpruefung` fuer Page/Table/Field-Wahrheit | TARGET-026F: Listen-Zelle `GuV/Bilanz` blieb erst `GuV`; erfolgreiche Korrektur ueber Sachkontokarte und Reopen-Proof. TARGET-026M Page Inspection: Page `G/L Account Card (17, Card)`, Table `G/L Account (15)`, field `Income/Balance (9, Option)` sichtbar; 4400/5400 weiter `Bilanz` | Kartenfeldoptionen koennen ohne normales `aria-label` gerendert werden; nicht als normales Textinput behandeln; Beschriftung `GuV/Bilanz` ist kein Wert `GuV` |

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
| `RO-W1-NO-SERIES` | No. Series / Nummernserien | `in-progress-blocked-standard-route-needed` | Seriencode, Beschreibung, Start-/Letztnummern, Manual-Nos.-Signal; Lines-Page 457 und Tabelle 309 sind technisch bewiesen | keine aktive Nummernserienkonfiguration ohne persistierte Start-/Endnummern und Setup-Zuweisung |

## Erfassungsregel

Jeder neue Universaarl-Prozess soll Page, Typ, sichtbare FastTabs/Felder, Buttons/Actions, Pflichtfelder, Defaults, Screenshot-Beweis und Buchkapitelbezug erfassen.

## Zero-Open-Questions-Regel

Jede nicht verstandene Karte oder FastTab erzeugt entweder einen Eintrag in `.agent/state/open_questions_register.json` oder bekommt einen finalen Status aus `BC-ZERO-OPEN-QUESTIONS-POLICY.md`.

## UI-Look-and-Feel-Regel

Karten brauchen FastTab-Bewusstsein: relevante FastTabs aufklappen, stoerende FastTabs einklappen, FactBox-Zweck bewerten und erst danach Feld-/Action-Blocker schreiben.
