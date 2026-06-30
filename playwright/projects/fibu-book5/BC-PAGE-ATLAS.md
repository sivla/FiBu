# BC Page Atlas

Status: `labor-reference`.

PREP-022-Qualitaet: `useful-but-mixed`.

Die Page-Atlas-Datei enthaelt gute Legacy-Muster, aber die aktive Universaarl-Reihenfolge beginnt mit Company, Foundation, Stammdaten und erst danach Prozessposten. RM-DEMO-Seiten bleiben Patternquelle, nicht Zielbeweis.

## Aktive Universaarl-Page-Prioritaeten

| Reihenfolge | Page/Kontext | Usecase | Status |
| ---: | --- | --- | --- |
| 1 | Companies / Mandanten Page `357` | `TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE` | `blocked-until-super-permissions` |
| 2 | Company Information | `TARGET-COMPANY-INFO-001` | `planned-after-company` |
| 3 | Assisted Setup / Manual Setup / General Ledger Setup | `TARGET-FOUNDATION-001` | `planned-after-company` |
| 4 | No. Series, Posting Setup, VAT Posting Setup, Dimensions | `TARGET-NOSERIES-001`, `TARGET-POSTINGGROUPS-001`, `TARGET-VAT-001`, `TARGET-DIMENSIONS-001` | `planned-after-foundation` |
| 5 | Customers, Vendors, Items, Locations, Bank Accounts | `TARGET-DATA-*` | `planned-after-foundation` |
| 6 | Posted Documents and Ledger Entries | `TARGET-O2C-001` bis `TARGET-PAYMENT-001` | `planned-after-masterdata` |

## PREP-024 Read-only Discovery Pack

| Discovery-ID | Page/Kontext | Status | Read-only-Zweck | Stopps |
| --- | --- | --- | --- | --- |
| `RO-W0-COMPANIES-357` | Companies / Mandanten Page `357` | `ready-for-readonly-playwright` | Mandantenliste, Hauptbutton `Neu`, Pfeil neben `Neu`, Dropdown und sichtbare Company-Kontexte ohne Speicheraktion erfassen | kein Save, kein Copy/Testunternehmen, kein Wizard-Finish, keine API |
| `RO-W0-MY-SETTINGS` | My Settings / Meine Einstellungen | `universaarl-prep-observed` | Company-/Rollen-/Sprachkontext lesen, ohne Werte zu speichern; PREP-033 nutzt `Einstellungen -> Meine Einstellungen`, nicht die in `playthru` ungueltige Page-9176-Direktroute | kein Company Switch, kein Speichern |
| `RO-W0-ROLE-CENTER` | Role Center / Startseite | `universaarl-prep-observed` | Shell, Umgebung, aktuelle Company, Suche, Einstellungen, Hilfe, Navigationsleiste und Aktivitaetskacheln erfassen | keine wirksamen Treffer, keine neuen Belege, kein Setup-Assistent |
| `RO-W1-COMPANY-INFORMATION` | Company Information | `requires-universaarl-company` | Firmenstammdatenkarte spaeter als erster Universaarl-Firmennachweis | kein Edit, kein Speichern, kein Logo-Upload |
| `RO-W1-ASSISTED-SETUP` | Assisted Setup / Unterstuetztes Setup | `ready-for-readonly-playwright` | Assistentenliste und Status lesen, ohne Setup zu starten | kein `Weiter`, `OK`, `Finish`, keine Setup-Aenderung |
| `RO-W1-NO-SERIES` | No. Series / Nummernserien | `requires-universaarl-company` | Belegnummernlisten und Spalten fuer spaetere Foundation erklaeren | keine neue Serie, kein Edit List, keine Zeilenbearbeitung |
| `RO-W1-POSTING-GROUPS` | Posting Groups / Posting Setup | `requires-universaarl-company` | Kontenfindungsseiten und Matrixfelder spaeter read-only erfassen | keine neue Gruppe, keine Matrixaenderung |
| `RO-W1-VAT-SETUP` | VAT Posting Setup | `requires-universaarl-company` | VAT-Matrixfelder fuer spaetere deutsche USt-Kette vorbereiten | keine neue Zeile, kein Konto-/Prozentsatzwechsel |
| `RO-W1-DIMENSIONS` | Dimensions / Dimension Values | `requires-universaarl-company` | Dimensionen und Dimensionswerte fuer Reportingbasis erfassen | keine neue Dimension, keine Default-Dimension speichern |

| Page / Kontext | Page ID falls bekannt | Bereich | Belegte Nutzung | Evidence | Grenze |
|---|---:|---|---|---|---|
| Purchase Orders | `9307` | P2P | P2P-004 oeffnet Liste, `New` oeffnet Purchase Order Card | `evidence/p2p-004/` | kein finaler Teil-WE, keine Zeile |
| Purchase Order Card | n/a | P2P | Draft `106002`, Vendor `K10000`, Lines-Kontext sichtbar | `evidence/p2p-004/030-after-vendor-controls.json` | Zeilenwerte noch offen |
| Posted Purchase Invoice | n/a | P2P | Rechnung `108219` sichtbar | `evidence/p2p-001/` | CRONUS-USA Labor |
| Vendor Ledger Entries | n/a | P2P/Payments | Rechnung `108219`, Zahlung `PAYP2P-108219`, Remaining Amount `0,00` | `evidence/p2p-003/` | kein deutscher Finalnachweis |
| Detailed Vendor Ledger Entries | n/a | P2P/Payments | Initial Entry, Payment Discount, Application | `evidence/p2p-003/` | Skonto-/Discount-Wirkung deutsch neu pruefen |
| Payment Journal | n/a | Payments/P2P | Zahlung `PAYP2P-108219` UI-first gebucht | `evidence/p2p-002/` | keine Bankabstimmung |
| Bank Account Ledger Entries | n/a | Payments/Bank | Bankspur zu Zahlungen sichtbar | `evidence/p2p-002/`, `payments-013/` | Bank Reconciliation offen |
| Fixed Asset Card | `5600` | Fixed Assets | `FA-CNC-01`, `HGB`, `MACHINES`, Karten-/Setupwerte | `evidence/fixedassets-*` | viele historische Teilfits; konkrete Evidence beachten |
| Fixed Asset Ledger Entries | `5604` | Fixed Assets | Anlagenposten zu `FA-CNC-01` / `G05001` brauchbar | `evidence/fixedassets-227/` | Page 5606 war rejected/leer |
| Fixed Asset Ledger Entries Preview | `5606` | Fixed Assets | leerer/rejected Preview-Pfad | Fixed-Assets Evidence | nicht als Postenspur nutzen |
| FA G/L Journal | n/a | Fixed Assets | Zugang `G05001`, Preview, Posting, G/L Trace | `evidence/fixedassets-225/` | Einkaufsrechnung-Route offen |
| General Journal Batches | `251` | Fixed Assets | `DEFAULT`, `Default Journal Batch`, `FA-JNL` sichtbar | `evidence/fixedassets-287/` | kein ausgewaehlter Batchwert |
| Financial Reports | n/a | Reporting | O2C-/Dimension-Reporting Teil-/Negativbefunde | `evidence/reporting-*` | Dimension-Auswertung nicht final |
| Role Center | Shell-/Startseitenroute | Look and Feel | PREP-034 zeigt Umgebung `playthru`, Shell-Company `CRONUS DE`, Topbar, Navigation, Kacheln und sichtbaren Shopify-Ausschluss read-only | `evidence/prep-034-role-center-readonly-shell-map/` | noch kein `UNIVERSAARL-DE`-Kontext, keine Suche ausgefuehrt, keine Liste geoeffnet |
| My Settings / Meine Einstellungen | Settings-Menue-Route | Foundation/Context | PREP-033 zeigt Rolle, Mandant, Arbeitsdatum, Region, Sprache und OK/Abbrechen-Grenze read-only | `evidence/prep-033-my-settings-readonly-context/` | `CRONUS DE` bleibt Shell-Kontext; keine Universaarl-Company, kein Save, keine Direktroute ueber Page 9176 |
| Customers / Debitoren | offen | Look and Feel/O2C | Zielseite fuer Suche, Sortierung, Filterbereich und Debitorenlisten-Erklaerung | geplant | braucht Universaarl-Debitorenfamilie |
| Vendors / Kreditoren | offen | Look and Feel/P2P | Zielseite fuer Lieferantenfilter, Salden und OP-Navigation | geplant | braucht Universaarl-Kreditorenfamilie |
| Items / Artikel | offen | Look and Feel/Inventory | Zielseite fuer Artikeltypen, Lagerbestand und Filter | geplant | braucht Universaarl-Artikelbasis |
| Customer/Vendor/G/L/Item Ledger Entries | offen | Look and Feel/Posten | Zielseiten fuer Postenfilter nach Datum, Beleg, Status, Betrag und Dimension | geplant | braucht gebuchte Universaarl-Prozesse |
| Report Request Pages | offen | Reporting/Look and Feel | Zielkontext fuer Reportoptionen und Filter vor Reportlauf | geplant | braucht konkreten Reportcase und Datenbasis |
| Analysis Mode / Analysemodus | offen | Reporting/Look and Feel | Zielkontext fuer read-only Datenanalyse, Gruppierung und Summen | geplant | braucht Datenreichtum und Quellen-/UI-Nachweis |
| Accounting Periods / No. Series Lines / Dimension Values | offen | Foundation | PREP-005 Zielobjekte fuer Foundation-Setup nach Company Creation | geplant | erst nach `UNIVERSAARL-DE`; keine Setup-Aenderung im PREP-Modus |
| Currencies / Payment Terms / Bank Accounts / Bank Account Posting Groups | offen | Finance/Payments | PREP-005 Zielobjekte fuer Zahlungs-, Bank- und Fremdwaehrungsfaelle | geplant | braucht Company, Quellencheck und spaetere Stammdaten |
| Item Categories / Bins | offen | Inventory/Warehouse | PREP-005 Zielobjekte fuer Datenreichtum, Lagerstruktur und spaetere Warehouse-Faelle | geplant | braucht Artikel-/Lagerdaten; keine aktive Universaarl-Evidence |
| Configuration Packages / Change Log / Job Queue / Workflows | offen | Governance/Operation | PREP-005 Zielobjekte fuer Migration, Audit, Hintergrundlaeufe und Genehmigungen | geplant | nicht vor Foundation; wirksame Actions brauchen eigene Gates |
| E-Documents / Intercompany Partners / Credit Memos | offen | Compliance/Intercompany/Corrections | PREP-005 Zielobjekte fuer spaetere Spezialkapitel | geplant | E-Documents braucht Quellencheck; Intercompany braucht Subcompany-Usecase; Credit Memos brauchen gebuchte Belege |
| Page Inspection / Personalize | offen | Diagnostics/Look and Feel | PREP-005 Zielobjekte fuer technische Nachweisfuehrung und UI-Fehlerdiagnose | geplant | read-only nutzbar, aber Buchbilder erst mit Universaarl-Kontext |

## Universaarl Page-Kontext-Regel

Universaarl-Tests duerfen historische Page-IDs, Frame-Muster und Locator-Erkenntnisse wiederverwenden, aber der aktive Nachweis muss in `playthru` entstehen. Vor einer wirksamen Aktion zaehlt nur ein Kontext, der Seite, sichtbaren Zieltext, Instanz und Company beziehungsweise Companies-/Creation-Kontext neu belegt. Shell-only-Signale und alte `RM-DEMO`-URLs sind nur Legacy-Diagnose.

Look-and-Feel-Nachweise brauchen echte Universaarl-Daten. Leere Listen duerfen Page-Kontext beweisen, aber keine Filter-, Summen- oder Reportingerklaerung tragen.

## Zero-Open-Questions-Regel

Jede nicht verstandene Page erzeugt entweder einen Eintrag in `.agent/state/open_questions_register.json` oder bekommt einen finalen Status aus `BC-ZERO-OPEN-QUESTIONS-POLICY.md`.

## UI-Look-and-Feel-Regel

Page-Blocker duerfen erst geschrieben werden, wenn Overlays, FactBox, FastTabs, Layout-/Focus-Buttons, Scrollbereiche, Command-Bar-Overflow und Page Inspection als passende Sichtbarkeitswege geprueft wurden.
