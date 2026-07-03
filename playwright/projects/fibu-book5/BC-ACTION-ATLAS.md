# BC Action Atlas

Status: `labor-reference`.

PREP-022-Qualitaet: `useful-but-legacy-heavy`.

Aktiv fuer Universaarl sind vor allem die Split-Button-, Tooltip-, Dialog- und Companies-Regeln. P2P-, Payment-, Fixed-Assets- und andere RM-DEMO-Actions bleiben Patternquelle, aber keine aktive Zielroute. Sie werden erst wieder aktiv, wenn ein konkreter Universaarl-Usecase sie neu braucht.

## TARGET-009 Company Creation

TARGET-009 hat die bevorzugte Buch- und Live-Route bestaetigt: `Mandanten` -> Pfeil neben `Neu` -> `Neues Unternehmen erstellen`.

Der Hauptbutton `Neu` ist nicht dasselbe Ziel. Er kann eine direkte, leere Mandantenzeile oeffnen und darf nicht als Nachweis fuer den gefuehrten Weg `Neues Unternehmen erstellen` verwendet werden. Wenn nach einem Klick nur eine leere Mandantenzeile sichtbar ist, gilt dieser Zustand als eigener ListPart-/Zeilenpfad oder als `rejected-path`, nicht als erfolgreicher Wizard-Start.

Die Datenbasis fuer `UNIVERSAARL-DE` ist `Neu erstellen - Keine Daten`. `Kopieren`, `Testunternehmen`, CRONUS-/Demo-Routen und API-Abkuerzungen wurden nicht verwendet. Der naechste sinnvolle Schritt ist nicht noch ein Creation-Versuch, sondern der bewusste Wechsel in `UNIVERSAARL-DE` und der read-only Nachweis des aktiven Company-Kontexts.

| Action | Bereich | Status | Belegte Nutzung | Evidence | Guard |
|---|---|---|---|---|---|
| Direkte Page `1801` / `Unterstuetztes Setup` | Universaarl Company | `route-proven-blocked-before-create` | TARGET-005 oeffnet die Assisted-Setup-Seite direkt in `playthru`; sichtbar sind u. a. `Unternehmen einrichten` und `Unternehmensdetails eingeben`, aber keine bestaetigte Blank-/Setup-only-Company-Anlage | `evidence/target-005-company-creation-source-backed-alternative-route/TARGET-005-result.json` | keine Auswahl von `Finish`, `Create`, `OK`, `Save`, Copy/Test/CRONUS; naechster Case mappt die Zeile `Unternehmen einrichten` scoped |
| `Unternehmen einrichten` auf Page 1801 | Universaarl Company | `blocked-wrong-route-for-company-creation` | TARGET-006 oeffnet die sichtbare Zeile nur fuer Route Discovery; es erscheint kein sauberer Create-New-Company-Wizard und keine Blank-/Setup-only-Datenbasis | `evidence/target-006-company-creation-specific-assisted-setup-route/TARGET-006-result.json` | nicht wiederholen; fuer die praktische Buchroute zurueck zur Mandantenliste und dort den Pfeil neben `Neu` -> `Neues Unternehmen erstellen` verwenden |
| `My Settings` / Company Lookup / Create New Company | Universaarl Company | `secondary-context-route-not-primary` | Kann Company-Kontext erklaeren, ist aber nicht der beste Anfaengerpfad fuer die Anlage; die praktische UI-Route ist `Mandanten` -> Pfeil neben `Neu` -> `Neues Unternehmen erstellen` | geplant, durch TARGET-007/PREP-031 ersetzt | nur bei spaeterem Company-Switch-/Kontextkapitel inventarisieren; nicht als Creation-Primärweg |
| Mehrere Company-Creation-Einstiege | Universaarl Company | `taxonomy-for-book` | `Mandanten`, `My Settings` und Assisted-Setup-Kontexte sind unterschiedliche Einstiege; fuer die Universaarl-Anlage ist `Mandanten` -> Pfeil neben `Neu` -> `Neues Unternehmen erstellen` der aktive Zielpfad; der Hauptbutton `Neu` erklaert nur den alternativen Listenzeilenpfad | TARGET-002..007, PREP-039, PREP-040 | Einstiegspunkt nicht mit Datenbasis verwechseln; Universaarl braucht eigene Basis ohne Demo-/CRONUS-Kopie |
| `Verwandte Aktionen fuer Neu` / Pfeil neben `Neu` auf Companies | Universaarl Company | `clickguide-proven-dropdown-only` | TARGET-007 oeffnet den Pfeil neben `Neu` und zeigt das Dropdown fuer die Klickanleitung; keine Auswahl, keine Company-Anlage | `evidence/target-007-companies-new-dropdown-clickguide/TARGET-007-result.json` | Dropdown erklaeren, aber nicht `Kopieren` oder `Testunternehmen` fuer Universaarl waehlen |
| `Verwandte Aktionen fuer Neu` / Pfeil neben `Neu` auf Companies | Universaarl Company | `universaarl-readonly-observed` | PREP-031 oeffnet Page 357 in `playthru`, rechnet Frame-Offsets fuer den echten Pfeiltreffer ein und zeigt im Dropdown `Neu` sowie `Neues Unternehmen erstellen`; `Kopieren` ist als eigene Command-Bar-Action sichtbar, `Testunternehmen` als Spalte | `evidence/prep-031-companies-page-readonly-playwright/PREP-031-result.json`, `img/prep-031-020-companies-new-dropdown-open.png` | nur Dropdown/Tooltip/Screenshot-QA; kein Klick auf `Neues Unternehmen erstellen`, keine Werteingabe, keine Company-Anlage |
| `Neues Unternehmen erstellen` auf Companies | Universaarl Company | `universaarl-proven-no-data-company-creation` | TARGET-009 oeffnet den Pfeil neben `Neu`, waehlt `Neues Unternehmen erstellen`, zeigt den Wizard, nutzt `Neu erstellen - Keine Daten` und verifiziert `UNIVERSAARL-DE` in der Mandantenliste | `evidence/target-009-main-neu-list-company-create-gate/TARGET-009-result.json`, `img/target-009-022-wizard-name-entered-no-data-selected.png` | beweist keine Company Information, keine Nummernserien, keine Buchungsgruppen, kein VAT Setup und keine Buchung |
| Split-Button-Hover/Tooltip vor wirksamer Aktion | Universaarl UI | `prep-reusable` | PREP-003 trennt Hauptbutton, Dropdown-Pfeil und Menueintrag; Tooltip/Accessible Name ist Pflicht, wenn der sichtbare Button mehrdeutig ist | `evidence/prep-003-readonly-ui-look-and-feel/PREP-003-result.json`, `UNIVERSAARL-READONLY-UI-LOOK-AND-FEEL-MAP.md` | Hover/Tooltip ist read-only; danach keine Auswahl von `Neu`, `OK`, `Fertig stellen`, `Post`, `Preview` ohne Case-Gate |
| Splitbutton-Zielpruefung `Neu` vs Pfeil vs Menueintrag | Universaarl UI | `prep-reusable` | PREP-010 macht aus dem TARGET-007/008-Learning eine harte Regel: Hauptbutton, Pfeil und Menueintrag sind unterschiedliche Action-Ziele; ein Treffer auf `Neu` ist kein Beweis fuer `Neues Unternehmen erstellen` | `evidence/prep-010-playwright-readonly-ui-ergonomics/PREP-010-result.json`, `.agent/BC-UI-LOOK-AND-FEEL-GUIDE.md` | vor wirksamer Aktion Hover/Tooltip, sichtbaren Zielzustand und Screenshot-QA erfassen; falscher Zielzustand wird `rejected-path`, nicht Erfolg |
| `Create New Company` / Assisted Setup | Universaarl Company | `blocked` | TARGET-003 sucht die exakte Aktion auf Page `357`, findet sie aber nicht sichtbar/klickbar; keine Company erstellt | `evidence/target-003/TARGET-003-result.json` | direkte Mandanten-Listenzeile, `Kopieren`, `Testunternehmen`, CRONUS und Wizard-Finish bleiben gesperrt; naechster Case braucht scoped Action/Menu Discovery |
| `Neu` auf Companies / Mandanten | Universaarl Company | `rejected-or-secondary-list-row-path` | TARGET-002 zeigt: Hauptbutton `Neu` oeffnet eine leere, ungespeicherte Mandantenzeile; PREP-039/PREP-040 trennen diesen Zustand vom Zielpfad `Neues Unternehmen erstellen` | `evidence/target-002/`, `evidence/target-007-companies-new-dropdown-clickguide/`, `UNIVERSAARL-COMPANY-CREATION-SCREENSHOT-QA-GATE.md` | nicht als gefuehrte Company Creation behaupten; naechster Rechte-Lauf nutzt den Pfeil neben `Neu` und den Menueintrag `Neues Unternehmen erstellen` |
| `New` auf Purchase Orders | P2P | `labor-proven` | oeffnet Draft `106002` | `evidence/p2p-004/` | nur nach Listen-/Page-Kontext, nicht ungescoped global |
| `Preview Posting` | P2P | `labor-proven` fuer UAT-P2P-001 | Vorschauarten vor Rechnung `108219` | `evidence/p2p-001/095-preview-posting-result.json` | default-locked, P2P-005 noch ohne Preview |
| `New` auf Purchase Orders | P2P | `labor-proven` fuer P2P-005 Fallback | erzeugt kontrollierten Draft, wenn vorhandener Draft nicht als Basis taugt | `evidence/p2p-005/P2P-005-result.json` | nur case-gesteuert; Draft `106051` bleibt Labor-Blocker-Draft |
| `Breite Layoutansicht anzeigen` | P2P/Playwright | `labor-reusable` | vergrössert die Purchase Order Page/Karte vor Grid-Diagnose | `evidence/p2p-006/P2P-006-result.json`, `img/p2p-006-010-draft-open-wide.png` | sicher als read-only Layoutaktion; beweist keine Werte |
| `Fokusmodus umschalten` auf Lines | P2P/Playwright | `labor-reusable` | vergrössert Purchase Order Lines und macht Spalten wie `Qty. to Receive` sichtbar | `evidence/p2p-006/020-grid-control-snapshot.json`, `img/p2p-006-020-lines-focus-mode.png` | sicher als read-only Layoutaktion; wenn keine Datenzeile sichtbar ist, bleibt Werteingabe blockiert |
| `Select items...` auf Purchase Order Lines | P2P | `labor-proven` | oeffnet Item-Auswahl und erzeugt/revealt `RAW-STEEL` als echte Zeile in Purchase Order `106051` | `evidence/p2p-007/P2P-007-result.json`, `img/p2p-007-020-after-select-items-route.png` | erzeugt Zeile, aber setzt nicht automatisch `FRA-ZL`, Menge `4` oder `Qty. to Receive 2` |
| Grid-Zelle per Koordinate/F2/Tab bearbeiten | P2P/Playwright | `labor-blocked` | P2P-008 findet Frame-1-Gridgeometrie und Zellkoordinaten, bestaetigt aber Zielwerte nicht sichtbar | `evidence/p2p-008/P2P-008-result.json` | kein Buchungs-/Preview-Schritt, naechster Helper braucht stabilen Bearbeiten-/Cell-Edit-Modus |
| Purchase-Lines Cell-Edit-Routen `Single Click/Enter`, `Double Click`, `F2` | P2P/Playwright | `labor-blocked` | P2P-009 fokussiert sichtbare Display-Textboxes, aber `FRA-ZL`, Menge `4` und `Qty. to Receive 2` werden nicht sichtbar persistiert | `evidence/p2p-009/P2P-009-result.json`, `evidence/p2p-009/020-after-grid-geometry.json` | `Direct Unit Cost 2.500,00` sichtbar; Preview/Receive bleibt gesperrt |
| `Select items...` ohne Suche, wenn Artikel schon sichtbar | P2P | `labor-blocked` | P2P-010 waehlte `RAW-STEEL` direkt aus sichtbarem Select-items-Kontext; die Suche wurde nicht mehr geoeffnet | `evidence/p2p-010/P2P-010-result.json` | erzeugt/zeigt Artikelkontext, aber setzt nicht `FRA-ZL`, Menge `4`, `Qty. to Receive 2` oder Unit Cost `2500` |
| `More options` / `Line` Action Discovery | P2P/Playwright | `labor-blocked`, `helper-evidence-captured` | P2P-011 inventarisiert sichere Menues im Purchase-Order-Lines-Kontext auf Draft `106054` | `evidence/p2p-011/P2P-011-result.json`, `evidence/p2p-011/021-menu-attempts.json` | keine direkte sichere `Edit`/`Edit List`-Route fuer Zeilenwerte gefunden; Item Tracking ist kein Werteingabe-Beweis |
| Direct Page Route Comparison | P2P/Inventory | `labor-route-comparison` | P2P-012 oeffnet Purchase Journal, Item Journal, Purchase Invoices und Requisition Worksheet direkt per Page-ID statt Tell-Me/Suche | `evidence/p2p-012/P2P-012-result.json` | keine Werteingabe; Route-Auswahl ist Readiness, kein Posting- oder Ledger-Beweis |
| `Receive and Invoice` | P2P | `labor-proven` | genau eine Laborbuchung `108219` | `evidence/p2p-001/100-purchase-posting-result.json` | nicht wiederholen ohne neuen Case |
| `Post` im Payment Journal | P2P Payment | `labor-proven` | Zahlung `PAYP2P-108219` | `evidence/p2p-002/` | default-locked |
| `Apply Entries` | P2P Payment | `labor-proven` | Bezug Zahlung/Rechnung | `evidence/p2p-002/`, `p2p-003/` | read-only pruefen vor Post |
| `Post` im FA G/L Journal | Fixed Assets | `labor-proven` | Zugang `G05001` | `evidence/fixedassets-225/` | genau dokumentierte Laborbuchung, nicht wiederholen |
| `Calculate Depreciation` | Fixed Assets | `labor-blocked` | OK ausgefuehrt, keine sichtbare Journalzeile im geprueften Kontext | `evidence/fixedassets-291/` | kein weiterer OK ohne neuen Gate-Plan |
| Page Inspection `Ctrl+Alt+F1` | Debugging | `labor-reusable` | technische Page/Table-Diagnose | `fixedassets-051` und Patterns | Werte muessen separat sichtbar sein |
| Personalize | Debugging | `labor-reusable` | Feldverfuegbarkeit diagnostizieren | `fixedassets-049` | kein stilles Buchscreen-/Setup-Ersatzbild |
| Search / Suche | Look and Feel | `prep-012-mapped` | globale Navigation zu Pages, Reports und Setupseiten | `book-drafts/universaarl-look-and-feel-filtering-draft.md` | Suche oeffnet Seiten; sie ist kein Beweis fuer Datenaenderung |
| Sortieren in Listen | Look and Feel | `prep-012-mapped` | Spalten nach Nummer, Name, Datum oder Betrag ordnen | `book-drafts/universaarl-look-and-feel-filtering-draft.md` | braucht mehrere Zeilen; keine Datenwirkung |
| `Filter list by` / Filterbereich | Look and Feel | `prep-012-mapped` | sichtbare Zeilen in Listen einschraenken | `UNIVERSAARL-READONLY-UI-LOOK-AND-FEEL-MAP.md` | beweist keine Summenlogik und keine Buchung |
| `Filter totals by` | Look and Feel/Reporting | `prep-012-mapped` | FlowFields/Summen nach Datum, Dimension oder anderem Kontext begrenzen | `UNIVERSAARL-READONLY-UI-LOOK-AND-FEEL-MAP.md` | braucht passende Summenfelder und Universaarl-Daten |
| Views / Ansicht speichern | Look and Feel | `prep-012-gated` | wiederverwendbare Listenansichten fuer Buchuebungen | PREP-012 | Personalisierungs-/User-Kontext beachten; Speichern ist keine reine Lesehandlung |
| Analysis Mode / Analysemodus | Look and Feel/Reporting | `prep-012-mapped` | Daten read-only gruppieren, filtern und summieren | PREP-012 plus Microsoft Learn Mapping | kein Ersatz fuer Ledger- oder Reportbeweis |
| Report Request Page `OK`/`Preview`/`Run` | Reporting/Look and Feel | `prep-012-gated` | Report mit Filter ausfuehren, wenn Reportklasse sicher ist | `BC-REQUEST-PAGE-ATLAS.md` | vor Ausfuehrung klaeren, ob nur Anzeige oder Datenwirkung |

## Universaarl Action-Regel

Alte RM-DEMO-/CRONUS-Tests liefern weiterhin wertvolle Action-Muster, aber keine aktive Zielwahrheit. Fuer Universaarl gilt: Jede neue Action-Evidence benennt Page-/Card-/Line-Kontext, Capability-ID und Nachbedingung. `Neu`, `Kopieren`, `Testunternehmen`, `Post`, `Preview`, `Finish`, `OK`, `Delete` und aehnliche wirksame Aktionen duerfen nicht aus alten Tests uebernommen werden, sondern brauchen im `playthru`-/Universaarl-Kontext einen neuen Gate-Nachweis.

## Aktive Universaarl-Prioritaeten

| Prioritaet | Usecase | Action-Fokus | Status |
| ---: | --- | --- | --- |
| 1 | `TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE` | `Mandanten` -> Pfeil neben `Neu` -> `Neues Unternehmen erstellen` -> `Neu erstellen - Keine Daten` -> Ergebnisliste | `universaarl-proven` |
| 2 | `TARGET-010-UNIVERSAARL-COMPANY-CONTEXT-PROOF` | bewusster Wechsel/Oeffnen von `UNIVERSAARL-DE`, Shell-/Company-Kontext und Company Information read-only | `ready-next` |
| 3 | `TARGET-COMPANY-INFO-001` | sichere Navigation zur Company Information, keine Setup- oder Speicheraenderung ohne Gate | `planned-after-context-proof` |
| 4 | `TARGET-FOUNDATION-001` | Assisted/Manual Setup Actions nur bis sichtbarer Entscheidungspunkt; kein Finish ohne Datenbasis | `planned-after-company-information` |
| 5 | `TARGET-O2C-001` bis `TARGET-PAYMENT-001` | `Preview`, `Post`, `Apply Entries`, `Navigate/Find Entries` mit eigener Smart Decision Card | `planned-after-masterdata` |

## PREP-024 Read-only Action-Karte

| Discovery-ID | Action-Typ | Read-only erlaubt | Riskant/gesperrt | Buchnutzen |
| --- | --- | --- | --- | --- |
| `RO-W0-COMPANIES-357` | Split-Button `Neu`, Dropdown-Pfeil, Menueintrag | PREP-031 beobachtet: Hover/Tooltip, Dropdown oeffnen und Menueintraege fotografieren; Frame-Offset fuer BC-iframe beachten | Hauptbutton `Neu` als Create-Wizard verwechseln, `Kopieren`, `Testunternehmen`, Speichern | Anfaenger sehen, dass Button, Pfeil und Menueintrag verschiedene Ziele sind. |
| `RO-W0-MY-SETTINGS` | Company-/Rollen-Auswahl | aktuelle Werte lesen und erklaeren | Company wechseln oder Einstellungen speichern | Der Leser versteht, warum Kontext vor jedem Screenshot geprueft wird. |
| `RO-W1-ASSISTED-SETUP` | Setup-Assistentenliste | Status/Zeilen/Actions lesen | Assistent starten, `Weiter`, `OK`, `Finish` | Assistenten sind hilfreich, aber wirksam; sie brauchen eigene Gate-Entscheidung. |
| `RO-W1-NO-SERIES` | Listen-/Zeilenactions | Spalten und Actions inventarisieren | `Neu`, `Edit List`, Zeilen bearbeiten | Nummernserien werden spaeter erklaert, ohne vorher etwas zu erzeugen. |
| `RO-W1-GEN-POSTING-SETUP-314` | Page-314-Actions, Tooltips, `Weitere Optionen`, Spaltenmenues | TARGET-032H beobachtet `Neu`, `Liste bearbeiten`, `Kopieren...`, `Weitere Optionen`, Tooltiptexte und finalen Reopen-Proof ohne Werteingabe | `Neu`, `Liste bearbeiten`, `Kopieren...` oder Spaltenmenues als Write-Route behandeln, bevor TARGET-032I den schwachen Routenkandidaten klassifiziert | Anfaenger sehen die Buchungsmatrix-Oberflaeche; intern bleibt klar, dass Sichtbarkeit keine Kontenfindungs- oder Postingbereitschaft beweist. |

## Zero-Open-Questions-Regel

Jede nicht verstandene Action erzeugt entweder einen Eintrag in `.agent/state/open_questions_register.json` oder bekommt einen finalen Status aus `BC-ZERO-OPEN-QUESTIONS-POLICY.md`.

## UI-Look-and-Feel-Regel

Actions werden nach Kontext erfasst: Page, Karte, Zeile, FactBox, Dropdown oder Command-Bar-Overflow. Vor riskanten Actions gilt Smart Decision Gate; ungefaehrliche Navigationsactions brauchen trotzdem sichtbaren Kontext.

Look-and-Feel-Actions sind vorrangig read-only. Sobald eine Action Ansichten speichert, Daten aendert, Reports ausfuehrt oder Dialoge bestaetigt, braucht sie einen eigenen Gate-Eintrag.

PREP-003 ergaenzt: Bei Split-Buttons immer zuerst unterscheiden, ob die Hauptflaeche, der Pfeil oder ein Dropdown-Eintrag gemeint ist. Ein sichtbarer Tooltip oder Accessible Name ist ein UI-Beleg, aber kein Beleg fuer eine Datenanlage.
