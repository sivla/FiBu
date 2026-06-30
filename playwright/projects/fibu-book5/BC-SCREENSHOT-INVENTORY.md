# BC Screenshot Inventory

Status: `labor-reference`.

Grundregel: Ein Screenshot beweist nur, was im Bild sichtbar ist. Wenn Codes, Werte oder Posten nicht sichtbar sind, ist das Bild Kontext oder Debugging, nicht Buchbeweis.

| Screenshot-Gruppe | Status | Zweck | Buchnutzung | Grenze |
|---|---|---|---|---|
| `img/target-004-*` | `german-final-candidate-blocked` | Companies-Seite in `playthru` nach scoped Command-Bar-/Menue-Discovery; kein sicherer exakter `Create New Company`-Pfad sichtbar | Buchdraft Company Creation: warum Menues allein noch keine saubere Company-Anlage ergeben | keine Company erstellt, kein Wizard-Finish, kein Setup |
| `img/target-003-*` | `german-final-candidate-blocked` | Companies-Seite in `playthru`, Smart-Decision-Routenversuch fuer `UNIVERSAARL-DE`, keine sichtbare/klickbare exakte `Create New Company`-Aktion | Buchdraft Company Creation: Mandantenliste, sichere Routenwahl und warum nicht blind gespeichert wird | keine Company erstellt, kein Wizard sichtbar, kein Setup |
| `img/p2p-004-*` | `labor-gate` | Purchase Orders Liste, PO Draft nach New, Kopf nach Vendor `K10000` | Kapitel 12 Teil-WE-Startgate | keine Zeile/Menge/Preview/Buchung |
| `img/p2p-005-010-draft-open.png` | `labor-blocked` | Draft `106051` in `MCP_1_20260210/RM-DEMO` mit Vendor No. `K10000`; Lines-Grid noch nicht befuellbar nachgewiesen | Kapitel 12 Teil-WE-Blocker/Debugging | nicht fuer finalen Teil-WE |
| `img/p2p-005-015-fresh-draft-after-vendor.png` | `labor-blocked` | Frischer Fallback-Draft nach Vendor-Eingabe; belegt, warum `106051` als Labor-Blocker-Draft existiert | Kapitel 12 Labor-Lernfall | spaeter deutsch neu erzeugen |
| `img/p2p-006-*` | `labor-blocked` | Breite Layoutansicht und Lines-Fokusmodus fuer Purchase Order `106051`; Spalten sichtbar, keine Datenzeile sichtbar | Kapitel 12 Debugging/Lernfall zu BC-Subforms | keine Zielcodes `RAW-STEEL/FRA-ZL`, keine Menge/Preis/Qty. to Receive, kein Teil-WE-Beweis |
| `img/p2p-007-*` | `labor-proven` | `Select items...` Route erzeugt/revealt sichtbare `RAW-STEEL`-Zeile auf Purchase Order `106051` | Kapitel 12 Clickguide-Draft: erst Datenzeile erzeugen, dann Werte | Zielwerte `FRA-ZL`, Menge `4`, `Qty. to Receive 2` fehlen; kein Preview/Post |
| `img/p2p-008-*` | `labor-blocked` | `RAW-STEEL`-Zeile sichtbar, aber direkte Zielwerteingabe wird nicht sichtbar bestaetigt | Kapitel 12 Debugging/Lernfall: sichtbare Zeile reicht nicht fuer Teil-WE | `ATLANTA, GA` bleibt sichtbar; keine deutsche Finalstrecke |
| `img/p2p-009-*` | `labor-blocked` | `RAW-STEEL`-Zeile, breite Ansicht und spaltige Purchase-Lines-Kontextansicht nach Cell-Edit-Helper-Probe | Kapitel 12 Debugging/Lernfall: Display-Textbox-Fokus ist kein persistierter Zielwert | `FRA-ZL`, Menge `4`, `Qty. to Receive 2` sind nicht sichtbar; kein Preview/Post |
| P2P-001 Bilder | `labor-proven` | Einkauf, Preview, Rechnung, Postenspur | Kapitel 12 Laborstrecke | USD/0% Tax, kein deutscher Finalbeweis |
| P2P-002/P2P-003 Bilder | `labor-proven` | Payment Journal, Apply Entries, Vendor/Detailed/Bank/G/L trace | Kapitel 12/19/20 | keine Bankabstimmung |
| Fixed Assets G05001 Bilder | `labor-proven` | FA G/L Journal, Zugang, G/L/FA Ledger Trace | Kapitel 21 | kein deutscher Finalbeweis |
| Fixed Assets AfA Bilder | `labor-blocked` | Calculate Depreciation/Batches/Journal-Kontext | Kapitel 21 Lernblock | keine AfA-Journalzeile/Postenspur |
| Reporting Bilder | `partial-labor` | Financial Reports/Analysis/Dimensionen | Kapitel 25 | Auswertungswirkung nur teilweise belegt |
| Gemischtsprachige Laborbilder | `labor-reference` | Klickpfad, Debugging, Buchdraft | Buchdraft ja | finale deutsche Screenshots spaeter ersetzen |

## Universaarl Target-Screenshots

Diese Screenshots gehoeren zur aktiven Zielwelt `playthru`. Seit TARGET-009 ist `UNIVERSAARL-DE` als Company sichtbar. Alle aelteren Bilder vor TARGET-009 bleiben Vorbereitungs-, Kontext- oder Blockerbilder. Der naechste Buchbeweis muss den aktiven Company-Kontext `UNIVERSAARL-DE` zeigen, nicht nur die Existenz in der Mandantenliste.

| Screenshot | Page | Company/Kontext | Schritt | Was sieht man / Lernwert | Interner Beweis | Beweist nicht | Status |
|---|---|---|---|---|---|---|---|
| `target-001-010-playthru-role-center.png` | Role Center / BC Shell | `playthru`, Shell ggf. `CRONUS DE` | Startkontext vor Companies | Umgebung wird zuerst geprueft; Startseite ist nur Einstieg | BC kann in `playthru` geoeffnet werden | `UNIVERSAARL-DE`, Setup, Prozess, Posting | `draft-context`, `not-final` |
| `target-001-020-companies-page-readonly.png` | Companies / Mandanten, Page 357 | Companies-Liste | Read-only Mandantenliste | Anfaenger sehen, wo Companies verwaltet werden | Companies-Seite read-only; `UNIVERSAARL-DE` im erfassten Text nicht sichtbar | sichere Erstellroute, Company-Anlage, Setup | `draft-context`, `not-final` |
| `target-002-010-companies-before.png` | Companies / Mandanten | Companies-Liste | Vor Company-Creation-Gate | Vor Neuanlage wird vorhandene Liste geprueft | Vorherzustand ohne sichtbare `UNIVERSAARL-DE` | Erstellroute, gespeicherte Company | `draft-context`, `not-final` |
| `target-002-020-new-options-inventory.png` | Companies / Mandanten, unsaved New row | keine Zielcompany gespeichert | `Neu`-/Optionsinventar | Eine neue Zeile ist noch keine fertige Company | Direkter `Neu`-Pfad fuehrt in unsaved Kontext und wurde gestoppt | blank/setup-only Datenbasis, Save-Erfolg, finaler Buchscreen | `blocked-draft`, `not-final` |
| `target-003-010-companies-before-route.png` | Companies / Mandanten | Companies-Liste | Vor Routenversuch | Routenpruefung startet im richtigen Page-Kontext | Vorherkontext fuer Action-Scan | Create-New-Company-Route, Wizard, Setup | `draft-context`, `not-final` |
| `target-003-020-after-create-route-attempt.png` | Companies/BC-Kontext nach Versuch | keine bestaetigte Zielcompany | fehlgeschlagener Create-Route-Versuch | Nicht jeder Routenversuch ist Erfolg | sicherer Create-New-Company-Pfad nicht sichtbar | Company-Anlage, Wizard-Felder, finaler Screenshot | `rejected` |
| `target-004-010-companies-before-scoped-action-discovery.png` | Companies / Mandanten | Companies-Liste | Vor scoped Action Discovery | Actions muessen seitenbezogen statt global betrachtet werden | Vorherkontext fuer scoped Action Discovery | Erstellroute, Setup | `draft-context`, `not-final` |
| `target-004-020-after-scoped-action-discovery.png` | BC-Kontext nach Action Discovery | keine bestaetigte Zielcompany; ggf. `CRONUS DE` sichtbar | Menue-/Action-Blocker | Menues allein beweisen keine sichere Company-Anlage | kein sicherer exakter Create-New-Company-Pfad gefunden | `UNIVERSAARL-DE`, Wizard-Finish, finaler Screenshot | `rejected` |
| `target-005-010-companies-source-route-before.png` | Companies / Mandanten, Page 357 | `playthru`, Shell-Kontext vor `UNIVERSAARL-DE` | Vor source-backed Route Discovery | Vor der Anlage wird geprueft, ob die Zielcompany schon existiert und welche Standardaktionen sichtbar sind | `UNIVERSAARL-DE` ist im Mandantenkontext nicht sichtbar; direkte Liste bleibt nur Kontext | Company-Anlage, Blank-/Setup-only-Datenbasis, Setup | `german-final-candidate-context`, `not-final` |
| `target-005-020-after-source-backed-route-discovery.png` | Unterstuetztes Setup, Page 1801 | `playthru`, Shell-Kontext vor `UNIVERSAARL-DE` | Direkte Assisted-Setup-Route | Das Unterstuetzte Setup ist direkt erreichbar und zeigt Aufgaben wie `Unternehmen einrichten` | Page 1801 ist erreichbar, ohne Finish/Create/OK/Save; kein Copy/Test/CRONUS-Pfad bestaetigt | Create-New-Company-Wizard, `Production - Setup Data Only`, `Create New - No Data`, gespeicherte Company | `german-final-candidate-preflight`, `not-final` |
| `target-006-010-assisted-setup-before-row-click.png` | Unterstuetztes Setup, Page 1801 | `playthru`, Shell-Kontext vor `UNIVERSAARL-DE` | Vor `Unternehmen einrichten` Route Discovery | Assisted Setup zeigt die Zeile `Unternehmen einrichten` als Setup-Aufgabe | Page 1801 und Zeile sind sichtbar | Company Creation, Blank-/Setup-only Datenbasis, Wizard-Finish | `german-final-candidate-preflight`, `not-final` |
| `target-006-020-after-unternehmen-einrichten-route.png` | Unterstuetztes Setup Folgekontext | `playthru`, Shell-Kontext vor `UNIVERSAARL-DE` | Nach scoped Row Click ohne Bestaetigung | Die generische Zeile ist kein sauberer Company-Creation-Pfad fuer Universaarl | Route wurde ohne Finish/Create/OK/Save geoeffnet und blockiert | neue Company, Setup-Datenbasis, finaler Buchscreen | `blocked`, `not-final` |
| `target-007-010-companies-new-dropdown-open.png` | Companies / Mandanten, Page 357 | `playthru`, Shell-Kontext vor `UNIVERSAARL-DE` | Pfeil neben `Neu` geoeffnet | Der Hauptbutton `Neu` und der Pfeil daneben sind verschiedene UI-Bedienelemente; im Dropdown sind `Neu` und `Neues Unternehmen erstellen` sichtbar | Dropdown-Kontext wurde ohne Auswahl, ohne Werteingabe und ohne Speichern geoeffnet; Screenshot-QA bestaetigt sichtbaren Zielzustand | keine Company-Anlage, kein Save, kein Setup, keine ausgewaehlte Aktion | `clickguide-candidate`, `not-final` |
| `prep-031-010-companies-page-before-dropdown.png` | Companies / Mandanten, Page 357 | `playthru`, Shell-Kontext `CRONUS DE` vor `UNIVERSAARL-DE` | Mandantenliste vor Dropdown-Oeffnung | Der Button `Neu`, der Pfeil daneben und die Companies-Liste sind sichtbar; `UNIVERSAARL-DE` ist nicht sichtbar | Page 357 wurde read-only in `playthru` geoeffnet | keine Company-Anlage, keine Auswahl, kein Setup | `usable-context-screenshot`, `not-final` |
| `prep-031-020-companies-new-dropdown-open.png` | Companies / Mandanten, Page 357 | `playthru`, Shell-Kontext `CRONUS DE` vor `UNIVERSAARL-DE` | Pfeil neben `Neu` geoeffnet | Im Dropdown sind `Neu` und `Neues Unternehmen erstellen` lesbar; `Kopieren` bleibt als separate Command-Bar-Action sichtbar | Der echte Pfeil neben `Neu` wurde mit Frame-Offset geklickt; keine Menueaktion wurde ausgewaehlt | keine Company-Anlage, kein Wizard, kein Save, keine Zielcompany | `usable-clickguide-screenshot`, `not-final` |
| `prep-033-010-my-settings-readonly-context.png` | Meine Einstellungen / My Settings | `playthru`, Shell-Kontext `CRONUS DE` vor `UNIVERSAARL-DE` | Einstellungen-Menue geoeffnet, dann `Meine Einstellungen` | Rolle, Mandant, Arbeitsdatum, Region, Sprache, Zeitzone sowie `OK`/`Abbrechen` sind sichtbar; personenbezogene Randtexte sind maskiert | My Settings ist als read-only Kontextseite nutzbar und erklaert, wo der aktuelle Mandant sichtbar ist | keine Universaarl-Company, kein Speichern, kein Company Switch, keine Page-9176-Direktroute | `usable-context-screenshot`, `not-final` |
| `prep-034-010-role-center-shell-readonly.png` | Role Center / Startseite | `playthru`, Shell-Kontext `CRONUS DE` vor `UNIVERSAARL-DE` | Startseite read-only geoeffnet | Umgebung, Shell-Company, Topbar, Navigation, Aktivitaetskacheln und sichtbarer Shopify-Ausschluss sind erkennbar; Kontoindikator ist maskiert | Role Center ist als Einstieg und Navigationskontext nutzbar | keine Universaarl-Company, keine Suche ausgefuehrt, keine Liste geoeffnet, kein Setup | `usable-context-screenshot`, `not-final` |
| `target-008-020-create-new-company-route-opened.png` | Companies / Mandanten, `Neu - Mandanten` ListPart | `playthru`, Shell-Kontext vor `UNIVERSAARL-DE` | Nach Klick im `Neu`-/`Neues Unternehmen erstellen`-Kontext | Das Bild zeigt nicht den gefuehrten Wizard, sondern die direkte neue Mandantenzeile; Screenshot-QA korrigiert damit den DOM-Treffer | leere Mandantenzeile sichtbar, kein Speichern | `UNIVERSAARL-DE`, Wizard, Company-Anlage, Setup | `blocked-main-new-route`, `not-final` |
| `target-009-020-after-main-neu-create-attempt.png` | Companies / Mandanten, Page 357 | `playthru`, Shell-Kontext vor `UNIVERSAARL-DE` | Nach kontrolliertem Anlageversuch | `UNIVERSAARL-DE` ist nicht sichtbar; die Anlage ist wegen fehlender Berechtigung/fehlendem Speichernachweis blockiert | Companies-Kontext nach Versuch, keine Zielcompany sichtbar | Company-Anlage, Company Information, Setup | `blocked-permission`, `not-final` |
| `target-009-010-before-neu-dropdown-create.png` | Companies / Mandanten, Page 357 | `playthru`, Companies-Liste | Vor Aktion und spaeterer Abschlusscheck | Die Mandantenliste zeigt den Kontext; im Abschlusslauf ist `UNIVERSAARL-DE` sichtbar | Zielcompany ist in der Mandantenliste vorhanden | aktiver Company-Kontext, Company Information, Setup | `universaarl-proven`, `company-existence-only` |
| `target-009-015-neu-dropdown-open-create-new-company-visible.png` | Companies / Mandanten, Page 357 | `playthru`, Companies-Liste | Pfeil neben `Neu` geoeffnet | Das Dropdown zeigt `Neues Unternehmen erstellen`; der Hauptbutton `Neu` ist nicht der Zielklick | richtiger Splitbutton-/Menuepfad ist sichtbar | keine Datenbasis, keine Anlage allein durch dieses Bild | `universaarl-proof-chain` |
| `target-009-019-wizard-expanded-welcome.png` | Neues Unternehmen erstellen / Assistent | `playthru` | Wizard geoeffnet und vergroessert | Der gefuehrte Anlageassistent ist offen; vergroesserte Karte macht Text und Buttons lesbarer | Menueintrag startet den Wizard | keine Zielcompany gespeichert, keine Datenbasis entschieden | `universaarl-proof-chain` |
| `target-009-021-wizard-after-weiter.png` | Neues Unternehmen erstellen / Assistent | `playthru` | Wizard nach `Weiter` | Eingabe-/Datenbasis-Seite ist sichtbar | Wizard ist auf der Erstellungsseite angekommen | kein Finish, kein Setup | `universaarl-proof-chain` |
| `target-009-022-wizard-name-entered-no-data-selected.png` | Neues Unternehmen erstellen / Assistent | `playthru`, Ziel `UNIVERSAARL-DE` | Name und Datenbasis | `UNIVERSAARL-DE` ist eingetragen; `Neu erstellen - Keine Daten` ist sichtbar | No-Data-Route ohne CRONUS-/Test-/Copy-Basis | noch keine Company Information, noch kein Setup | `universaarl-proven`, `book-candidate` |
| `target-009-024-wizard-after-third-weiter.png` | Neues Unternehmen erstellen / Assistent | `playthru`, Ziel `UNIVERSAARL-DE` | Wizard-Abschlussphase | Abschlussphase vor/um `Fertig stellen` | Wizard wurde weitergefuehrt und nicht beim ersten Screen verlassen | keine Posten, kein Setup, keine Company Information | `universaarl-proof-chain` |
| `target-010-010-role-center-company-context.png` | Role Center / BC Shell | `playthru`, `UNIVERSAARL-DE` | Company-Kontext nach Anlage | Oben links ist `UNIVERSAARL-DE` als Arbeitskontext sichtbar; Startseite und Navigation sind im Zielmandanten geoeffnet | aktiver Shell-/Page-Kontext fuer `UNIVERSAARL-DE` | keine Firmendaten-Werte, kein Setup, keine Buchungsfaehigkeit | `universaarl-proven`, `company-context` |
| `target-010-020-my-settings-company-context.png` | Meine Einstellungen | `playthru`, Shell `UNIVERSAARL-DE`, Dialog zeigt Benutzerkontext | Benutzer-/Rollen-/Sprache-Kontext | Rolle, Arbeitsdatum, Region, Sprache und Mandantenfeld sind sichtbar; das Mandantenfeld kann vom Shell-Kontext abweichen | My Settings ist eine Benutzerkontext-Seite und wurde ohne OK/Speichern geoeffnet | kein alleiniger Aktiv-Company-Beweis, kein Setup, keine gespeicherte Einstellung | `universaarl-learning`, `context-warning` |
| `target-010-030-company-information-readonly.png` | Firmendaten / Company Information, Page 1 | `playthru`, URL-Kontext `UNIVERSAARL-DE` | Firmendaten read-only vor Setup | Allgemein, Kommunikation und weitere FastTabs sind sichtbar; Felder wie Name, Adresse, USt-IdNr. und E-Mail sind noch leer | Firmendaten-Seite ist fuer `UNIVERSAARL-DE` erreichbar und vor Aenderung dokumentiert | keine gespeicherten Firmendaten, keine Nummernserien, keine Buchungsgruppen, keine USt- oder Posting-Reife | `universaarl-proven`, `setup-before` |
| `target-011-010-company-information-before-name.png` | Firmendaten / Company Information, Page 1 | `playthru`, `UNIVERSAARL-DE` | Vor/Nach-Reload-Kontext fuer Firmendaten | Der Name `Universaarl GmbH` ist in der Firmendatenkarte sichtbar; weitere Felder bleiben leer | gespeicherter Firmenname in der Zielcompany ist sichtbar | Adresse, USt-IdNr., Nummernserien, Buchungsgruppen, Posting-Reife | `universaarl-proven`, `setup-name` |
| `target-011-015-company-information-edit-mode.png` | Firmendaten / Company Information, Page 1 | `playthru`, `UNIVERSAARL-DE` | Bearbeiten-Modus-Diagnose | Das Stift-Symbol aktiviert den Karten-Editmodus; rote Sterne markieren Pflichtfelder | Editmodus und Pflichtfeldlogik der Karte sind sichtbar | gespeicherter Zielwert allein durch dieses Bild | `diagnostic`, `ui-learning` |
| `target-011-016-company-information-after-name-entry-before-reopen.png` | Firmendaten / Company Information, Page 1 | `playthru`, `UNIVERSAARL-DE` | Wert sichtbar vor erneutem Oeffnen | `Universaarl GmbH` steht im Feld `Name`; der Fokus liegt danach auf dem naechsten Feld | UI-Wert wurde in der Karte sichtbar gesetzt | Persistenz nach Reload ohne Abschlussbild | `diagnostic`, `setup-entry` |
| `target-011-020-company-information-after-name.png` | Firmendaten / Company Information, Page 1 | `playthru`, `UNIVERSAARL-DE` | Nach erneutem Oeffnen | `Universaarl GmbH` ist nach Reload sichtbar | Name der Universaarl GmbH ist als gespeicherter Firmendatenwert belegt | vollstaendige Foundation, Adresse/USt, Nummernserien, Buchungsgruppen, Buchungen | `universaarl-proven`, `setup-after` |
| `target-012-010-company-information.png` | Firmendaten / Company Information, Page 1 | `playthru`, `UNIVERSAARL-DE` | W1-Readiness Startkontrolle | `Universaarl GmbH` ist weiter sichtbar; die Karte bleibt der Ausgangspunkt fuer Foundation | gespeicherter Firmenname und richtiger Zielcompany-Kontext | Adresse/USt, Nummernserien, Buchungsgruppen, Buchungsreife | `universaarl-proven`, `foundation-readonly` |
| `target-012-020-general-ledger-setup.png` | Finanzbuchhaltung Einrichtung, Page 118 | `playthru`, `UNIVERSAARL-DE` | W1-Readiness Finanzbuchhaltung | Die Seite fuer zentrale Buchhaltungsgrundlagen ist sichtbar; globale Dimensionen/Bankkontonummern/Felder erscheinen als Kontext | direkte read-only Route zur General-Ledger-Setup-Seite | geaenderte Werte, Vollstaendigkeit, Posting-Reife | `universaarl-candidate`, `foundation-readonly` |
| `target-012-030-no-series.png` | Nummernserie, Page 456 | `playthru`, `UNIVERSAARL-DE` | W1-Readiness Nummernserien | Nummernserienliste mit Codes/Start-/Endnummern und rechter FactBox ist sichtbar | Nummernserien-Seite ist als naechster Preflight erreichbar | neue oder geaenderte Nummernserien, Dokumentnummern-Reife | `universaarl-candidate`, `foundation-readonly` |
| `target-012-040-general-posting-setup.png` | Buchungsmatrix Einrichtung, Page 314 | `playthru`, `UNIVERSAARL-DE` | W1-Readiness Kontenfindung | Die Buchungsmatrix-Seite und ihre Spalten fuer Kontenfindung sind sichtbar; eine Info-Karte erklaert den Zweck | General Posting Setup ist erreichbar und leer/sichtbar pruefbar | eingerichtete Kontenmatrix, Preview/Post, Sachposten | `universaarl-candidate`, `foundation-readonly` |
| `target-012-050-vat-posting-setup.png` | MwSt.-Buchungsmatrix Einrichtung, Page 472 | `playthru`, `UNIVERSAARL-DE` | W1-Readiness USt | Die MwSt.-Buchungsmatrix-Seite und USt-Spalten sind sichtbar; Info-Karte erklaert die MwSt.-Berechnung | VAT Posting Setup ist erreichbar | deutsche 19-Prozent-USt, USt-Entries, Kontenwirkung | `universaarl-candidate`, `foundation-readonly` |
| `target-012-060-dimensions.png` | Dimensionswerteuebersicht / Dimensionen, Page 560 | `playthru`, `UNIVERSAARL-DE` | W1-Readiness Dimensionen | Dimensionskontext ist sichtbar, aber noch nicht als eingerichtete Reportingachse bewertet | Dimensionen-Kontext ist erreichbar | produktive Dimensionen, Default-Dimensions, Postenwirkung, Reportingwirkung | `universaarl-candidate`, `foundation-readonly` |
| `target-013-010-number-series-preflight.png` | Nummernserie, Page 456 | `playthru`, `UNIVERSAARL-DE` | Nummernserien-Preflight | Sichtbar sind `BANKEINZ`, `CT-MSG`, `VATNOTIF`, Start-/Endnummern und FactBox-Zeilen; `Neu`, `Liste bearbeiten`, `Zeilen`, `Verbindungen` bleiben ungeklickt | Die Nummernserienliste ist erreichbar und zeigt nur begrenzte Foundation-Codes | Debitoren-/Kreditoren-/Artikel-/Verkaufs-/Einkaufs-/Journalnummern, Setup-Reife, Buchungsreife | `universaarl-candidate`, `number-series-readonly` |
| `target-016c-010-lines-before-edit-mode.png` | Nr.-Serienzeilen, Page 456 Modal | `playthru`, `UNIVERSAARL-DE`, `U-CUST` | Vor Edit-Mode-Probe | Die Lines-Seite fuer `U-CUST` ist im Vordergrund; `Startdatum`, `Startnr.`, `Endnr.`, Checkboxen und `Offen` sind als Spalten sichtbar | richtiger Nummernserienzeilen-Kontext | persistierte Start-/Endnummern, Setup-Zuweisung, Stammdaten | `diagnostic`, `blocked-editor-route` |
| `target-016c-020-lines-after-edit-list-probe.png` | Nr.-Serienzeilen, Page 456 Modal | `playthru`, `UNIVERSAARL-DE`, `U-CUST` | Nach `Liste bearbeiten` | Business Central oeffnet eine neue Zeile; der Cursor startet im Feld `Startdatum`, nicht in `Startnr.` | `Liste bearbeiten` bringt die Lines-Liste in einen bearbeitbaren Zeilenkontext | geschriebene Start-/Endnummern, Persistenz | `ui-learning`, `not-book-final` |
| `target-016c-030-active-editor-after-cell-clicks.png` | Nr.-Serienzeilen, Page 456 Modal | `playthru`, `UNIVERSAARL-DE`, `U-CUST` | Nach Header-/Zellklicks | Die `Startnr.`-Spalte/Zelle wird sichtbar markiert; trotzdem ist kein klassischer aktiver Editor bewiesen | Header-Matching und Zellfokus wurden korrigiert und diagnostiziert | Zellwertschreibung, Nummernserien-Reife | `diagnostic`, `blocked-editor-route` |
| `target-016c-040-after-unique-editor-write-attempt.png` | Nr.-Serienzeilen, Page 456 Modal | `playthru`, `UNIVERSAARL-DE`, `U-CUST` | Nach Selected-Cell-Typing-Versuch | Statt sichtbarer `U-CUST00001`/`U-CUST99999` sind Seitentexte/Labels markiert; die Werte wurden nicht sichtbar geschrieben | Selected-Cell-Typing ist fuer diese Lines-Route ein abgelehnter Pfad | Setup-Aenderung, Start-/Endnummern-Persistenz, Belegnummern-Reife | `rejected-path`, `not-book-final` |

## PREP-011 Screenshot-Erklaerungsentscheidungen

PREP-011 wendet die PREP-010-Regel auf die aktuellen Universaarl-Company-Creation-Bilder an. Ziel ist nicht, mehr Screenshots zu erzeugen, sondern falsche Bildaussagen zu verhindern.

| Screenshot | PREP-011 Entscheidung | Was im Buch erlaubt ist | Was gesperrt bleibt |
|---|---|---|---|
| `target-006-020-after-unternehmen-einrichten-route.png` | `debugging-only` | Assisted Setup als Navigations-/Diagnosekontext erklaeren | keine Company-Anlage, keine Datenbasis, kein Wizard-Finish |
| `target-008-020-create-new-company-route-opened.png` | `debugging-only` | zeigen, dass der erwartete Wizard nicht sauber sichtbar wurde | kein Beweis fuer `Neues Unternehmen erstellen`, keine gespeicherte Company |
| `target-009-010-before-main-neu-create.png` | `preflight-context` | Mandantenliste vor einer Anlage erklaeren | keine Berechtigung, keine Anlage, kein Setup |
| `target-009-020-after-main-neu-create-attempt.png` | `blocked-permission-screenshot` | Berechtigungs-/Speicherblocker sachlich erklaeren | keine sichtbare `UNIVERSAARL-DE`, keine Company Information, keine Foundation |

Regel fuer das Buch: Ein Bild darf erst dann als Schritt-fuer-Schritt-Screenshot gelten, wenn der behauptete UI-Teil und der Folgezustand sichtbar sind. Die aktuellen TARGET-006/008/009-Bilder bleiben Kontext-, Debugging- oder Blockerbilder.

## PREP-040 Company Creation Screenshot-QA

Der naechste Rechte-Lauf darf erst als Company-Creation-Beweis gelten, wenn die Bildkette den konkreten UI-Zustand zeigt. Pflicht sind: Mandantenliste vor Aktion, Hover/Tooltip fuer Hauptbutton `Neu`, Hover/Tooltip fuer den Pfeil neben `Neu`, geoeffnetes Dropdown mit lesbarem `Neues Unternehmen erstellen`, Folgezustand nach Klick, sichtbare Datenbasis, sichtbarer Abschlusszustand und danach `UNIVERSAARL-DE` in der Liste.

Eine leere Mandantenzeile nach Hauptbutton `Neu` bleibt `rejected-path` oder separater ListPart-Pfad. Sie ist kein Screenshot fuer den gefuehrten Weg `Neues Unternehmen erstellen`.

| Screenshot-Anforderung | TARGET-009 Status | Buchnutzung | Grenze |
| --- | --- | --- | --- |
| Mandantenliste vor Aktion | `observed-target-009` | Einstieg und Kontext fuer die Anlage erklaeren | keine Company Information |
| Hauptbutton-Tooltip `Neu` | `planned` | Unterschied zwischen Hauptbutton und Pfeil erklaeren | kein Zielklick fuer TARGET-009 |
| Pfeil-Tooltip neben `Neu` | `planned` | richtigen Splitbutton-Teil zeigen | kein Menueintrag angeklickt |
| Dropdown mit `Neues Unternehmen erstellen` | `observed-target-009` | Klickziel fuer den gefuehrten Weg zeigen | keine Datenbasis allein durch Dropdown |
| Folgezustand nach Menueintrag | `observed-target-009` | pruefen, ob wirklich der gefuehrte Weg gestartet wurde | kein Setup |
| Datenbasisentscheidung | `observed-target-009-no-data` | No Data/Setup Data Only/Sample/Copy/Test unterscheiden | keine Company Information |
| Ergebnisliste mit `UNIVERSAARL-DE` | `observed-target-009` | Erfolgsscreenshot fuer die Company-Anlage | keine Company Information, kein Setup |

## Geplante Universaarl Look-and-Feel-Screenshots

Diese Bilder werden erst erzeugt, wenn `UNIVERSAARL-DE` existiert und genug sinnvolle Universaarl-Daten vorhanden sind. Bis dahin sind sie keine Buchkandidaten.

| Geplanter Screenshot | Page | Company/Kontext | Schritt | Was man sehen soll | Interner Beweis | Beweist nicht | Status |
|---|---|---|---|---|---|---|---|
| Role Center Universaarl | Role Center | `playthru` / `UNIVERSAARL-DE` | Einstieg und Navigation | Startseite, Navigation, globale Suche, sichere Navigationswege | Universaarl-Kontext und Startpunkt | Datenreichtum, Buchung, Setupvollstaendigkeit | `planned`, `needs-company` |
| Debitorenliste mit mehreren Kunden | Customers / Debitoren | `UNIVERSAARL-DE` | Listenarbeit | Sortierung, Suchfeld, Filterbereich, mehrere Kunden | Listenfilter an echten Stammdaten | O2C-Posting oder OP-Ausgleich | `planned`, `needs-data-richness` |
| Debitorenposten mit offenen/geschlossenen Posten | Customer Ledger Entries | `UNIVERSAARL-DE` | Posten lesen | Belegnummer, Buchungsdatum, Restbetrag, Offen-Status | Filter auf Status/Kunde/Datum | Zahlungs- oder USt-Finalbeweis | `planned`, `needs-postings` |
| Sachposten mit Dimensionsfilter | G/L Entries | `UNIVERSAARL-DE` | Buchungsspur filtern | Konto, Datum, Belegnummer, Dimensionen, Betrag | `Filter list by` und `Filter totals by` an echten Posten | deutschen Abschluss oder Steuerreport | `planned`, `needs-ledger-richness` |
| Report Request Page | Report / Request Page | `UNIVERSAARL-DE` | Report vor Ausfuehrung filtern | Optionen, Datumsfilter, Konto-/Dimensionsfilter | Reportfilter werden vor Lauf gesetzt | Reportinhalt ohne Ausfuehrung | `planned`, `needs-reporting-foundation` |
| Analysis Mode / Analysemodus | Liste mit Analysemodus | `UNIVERSAARL-DE` | Daten ohne Buchung untersuchen | Spalten, Gruppierung, Filter, Summen | read-only Analyse an echten Daten | Buchung oder Datenkorrektur | `planned`, `needs-data-richness` |

## Universaarl Foundation - Nummernserien TARGET-015

| Screenshot | Page | Company/Kontext | Schritt | Was man sehen soll | Interner Beweis | Beweist nicht | Status |
|---|---|---|---|---|---|---|---|
| `target-015-010-number-series.png` | Nummernserie / No. Series | `playthru` / `UNIVERSAARL-DE` | Vorherzustand vor U-Serien | vorhandene Codes `BANKEINZ`, `CT-MSG`, `VATNOTIF`, keine sichtbaren `U-*` Zielcodes | Nummernserienliste ist erreichbar und Start-/Endnummern sind lesbar | keine Anlage, keine Zuweisung, keine Compliance | `accepted-readonly-before-state` |
| `target-015-020-sales-receivables-setup.png` | Einrichtung Debitoren und Verkauf | `playthru` / `UNIVERSAARL-DE` | Verkaufssetup-Kontext | Seite, FastTabs, sichtbarer FastTab `Nummernserie` | Verkaufssetup ist erreichbar | konkrete Debitoren-/Auftrags-/Rechnungsnummernfelder sind noch nicht aufgeklappt belegt | `accepted-page-context-not-field-proof` |
| `target-015-030-purchases-payables-setup.png` | Kreditoren & Einkauf Einr. | `playthru` / `UNIVERSAARL-DE` | Einkaufssetup-Kontext | sichtbare Felder `Kreditorennummern`, `Rechnungsnummern`, `Gebuchte Rechnungsnummern`, `Gutschriftsnummern` | Einkaufsnummernfelder sind als Vorherzustand sichtbar | keine Zuweisung, keine Einkaufsbelege, keine Buchung | `accepted-field-context` |
| `target-015-040-inventory-setup.png` | Lager Einrichtung | `playthru` / `UNIVERSAARL-DE` | Lagersetup-Kontext | Seite, FastTabs, sichtbarer FastTab `Nummerierung` | Lagersetup ist erreichbar | konkrete Artikelnr.-Felder sind noch nicht aufgeklappt belegt | `accepted-page-context-not-field-proof` |

## Universaarl Foundation - Nummernserien TARGET-016

| Screenshot | Page | Company/Kontext | Schritt | Was man sehen soll | Interner Beweis | Beweist nicht | Status |
|---|---|---|---|---|---|---|---|
| `target-016-010-number-series-before.png` | Nummernserie / No. Series | `playthru` / `UNIVERSAARL-DE` | Vor dem Schreib-Gate | `U-*` Nummernserienkoepfe sind bereits sichtbar, weil ein vorheriger kontrollierter Versuch die Kopfzeilen angelegt hat | Zielcompany und Nummernserienliste sind erreichbar; U-Codes sind Kontext fuer den Lines-Follow-up | keine Startnummern, keine Setup-Zuweisung, keine Stammdaten | `accepted-partial-setup-context` |
| `target-016-090-number-series-after-reload.png` | Nummernserie / No. Series | `playthru` / `UNIVERSAARL-DE` | Nach Reload | `U-CUST`, `U-VEND`, `U-ITEM`, `U-SO`, `U-SINV`, `U-PO`, `U-PINV` stehen in der Liste; `Startnr.` bleibt leer/Strich | Nummernserienkoepfe sind sichtbar und wieder auffindbar | vollstaendige Nummernserien-Reife, Start-/Endnummern, Setup-Zuweisung, Belegnummern- oder Compliance-Beweis | `accepted-partial-proof` |
| `target-016-041-u-cust-lines-before.png` | Nr.-Serienzeilen / No. Series Lines | `playthru` / `UNIVERSAARL-DE` | Lines-Kontext fuer `U-CUST` | die Lines-Seite zeigt zuerst `Startdatum`, danach `Startnr.` und `Endnr.` | die Aktion `Zeilen` oeffnet den richtigen Detailkontext | kein gespeicherter Startnummernwert | `debugging-evidence` |
| `target-016-051-u-cust-lines-after.png` | Nr.-Serienzeilen / No. Series Lines | `playthru` / `UNIVERSAARL-DE` | Blockierter Startnr.-Versuch | `Startnr.` bleibt leer; die getestete Eingaberoute persistiert `U-CUST00001` nicht sichtbar | der blockierte Grid-/Fokuspfad ist sichtbar dokumentiert | keine fertige Startnummernzeile, keine Belegnummernreife | `blocked-debugging-evidence` |

## Universaarl Foundation - Nummernserien TARGET-016B

| Screenshot | Page | Company/Kontext | Schritt | Was man sehen soll | Interner Beweis | Beweist nicht | Status |
|---|---|---|---|---|---|---|---|
| `target-016b-010-number-series-list-u-cust-context.png` | Nummernserie / No. Series | `playthru` / `UNIVERSAARL-DE` | U-CUST Listenkontext vor Lines-Diagnose | `U-CUST` ist in der Nummernserienliste sichtbar; Spalten fuer Start-/Endnummern und Checkboxen sind sichtbar | der Zielkopf existiert und die Liste zeigt fachlich relevante Checkbox-Spalten | keine Start-/Endnummernzeile, keine Setup-Zuweisung | `diagnostic-context` |
| `target-016b-020-u-cust-lines-control-inventory.png` | Nr.-Serienzeilen / No. Series Lines | `playthru` / `UNIVERSAARL-DE` | Lines- und Checkbox-Inventar | `Startdatum`, `Startnr.`, `Endnr.`, `Luecken in Nummern zulassen` und `Offen` sind im Lines-Kontext sichtbar | Playwright hat den richtigen Detailkontext und Checkbox-Spalten erkannt | keine Persistenz von `U-CUST00001`/`U-CUST99999`, keine Belegnummernreife | `diagnostic-context` |
| `target-016b-030-u-cust-lines-after-targeted-cell-route.png` | Nr.-Serienzeilen / No. Series Lines | `playthru` / `UNIVERSAARL-DE` | Abgelehnter Header-/Fokusversuch | Header-/Tooltip-Fokus ist sichtbar; die Zielwerte stehen nicht sichtbar in der Zeile | die getestete Header-Koordinatenroute ist nicht ausreichend | kein gespeicherter Start-/Endnummernwert; nicht als Buch- oder Setup-Erfolg verwenden | `rejected-value-proof` |

## Universaarl Foundation - Nummernserien TARGET-016D/016E

| Screenshot | Page | Company/Kontext | Schritt | Was man sehen soll | Interner Beweis | Beweist nicht | Status |
|---|---|---|---|---|---|---|---|
| `target-016d-040-after-page-inspection-shortcut.png` | Nr.-Serienzeilen / Seitenueberpruefung | `playthru` / `UNIVERSAARL-DE` | Technische Seitenpruefung fuer `U-CUST` Lines | rechts ist die Seitenueberpruefung offen; Page `No. Series Lines (457, List)`, Tabelle `No. Series Line (309)` und Felder wie `Starting Date`, `Starting No.`, `Ending No.`, `Open` sind sichtbar | `Ctrl+Alt+F1` liefert hier Page-/Table-/Field-Wahrheit fuer den Lines-Kontext | keine Wertpersistenz, keine Setup-Zuweisung, keine Belegnummernreife | `technical-proof-book-debug-candidate` |
| `target-016e-020-after-field-flow-write.png` | Nr.-Serienzeilen / No. Series Lines | `playthru` / `UNIVERSAARL-DE` | Abgelehnter Feldfluss-Versuch | nach dem Feldfluss sind die Zielwerte `U-CUST00001` und `U-CUST99999` nicht sichtbar in der Zeile | einfacher `Startdatum -> Startnr. -> Endnr.` Feldfluss reicht fuer Playwright nicht als Schreibroute | keine gespeicherte Nummernserienzeile; nicht als Setup-Erfolg verwenden | `rejected-path` |
| `target-016e-025-after-f2-field-flow-fallback.png` | Nr.-Serienzeilen / Microsoft-365-App-Launcher | `playthru` / `UNIVERSAARL-DE` | Abgelehnter F2-Fallback | F2 oeffnet den Microsoft-365-App-Launcher links oben statt eines BC-Zelleditors | F2 ist in diesem Browser-/BC-Kontext keine sichere Grid-Edit-Route | keine BC-Zellenbearbeitung, keine Wertpersistenz, keine Nummernserienreife | `do-not-repeat-rejected-path` |
| `target-016e-030-after-reopen-proof.png` | Nr.-Serienzeilen / No. Series Lines | `playthru` / `UNIVERSAARL-DE` | Reopen-Proof nach Feldfluss/F2 | `U-CUST` Lines sind wieder geoeffnet; Start-/Endnummern sind weiterhin nicht als Zielwerte sichtbar | der Schreibversuch wurde nicht sichtbar persistiert | keine fertige Nummernserienzeile, keine Setup-Zuweisung, keine Stammdatenreife | `blocked-reopen-proof` |

## Universaarl Foundation - Nummernserien TARGET-016F

| Screenshot | Page | Company/Kontext | Schritt | Was man sehen soll | Interner Beweis | Beweist nicht | Status |
|---|---|---|---|---|---|---|---|
| `target-016f-020-lines-more-options-open.png` | Nummernserie / No. Series | `playthru` / `UNIVERSAARL-DE` | Abgelehnte More-Options-Route | statt eines fachlichen Menues ist ein kleines Copilot/Generieren-Flyout sichtbar | der getestete More-Options-Klick ist kein brauchbarer Standardpfad fuer Nummernserienzeilen | keine Feldliste, keine Wertpersistenz, keine Setup-Route | `do-not-repeat-rejected-path` |
| `target-016f-030-personalize-mode-or-menu.png` | Nr.-Serienzeilen / Personalisieren | `playthru` / `UNIVERSAARL-DE` | Personalisieren-Modus auf Lines | oben steht `Wird personalisiert: Nr.-Serienzeilen`, daneben `Fertig`; die Lines-Spalten bleiben sichtbar | Settings -> Personalisieren erreicht den page-level Personalisieren-Modus fuer Nr.-Serienzeilen | keine eingefuegten Felder, keine gespeicherte Personalisierung, keine Start-/Endnummernreife | `technical-ui-proof` |
| `target-016f-040-after-personalize-escape.png` | Nr.-Serienzeilen / No. Series Lines | `playthru` / `UNIVERSAARL-DE` | Nach Verlassen des Personalisieren-Modus | der Personalisierungsbalken ist weg; die Lines-Seite bleibt im U-CUST-Kontext sichtbar | `Fertig` beendet die reine Inspektion ohne sichtbare Feld-/Aktionsaenderung | keine Setup-Aenderung, keine Nummernserien-Zeilenwerte | `exit-proof-no-change` |

## Universaarl Foundation - Nummernserien TARGET-016G

| Screenshot | Page | Company/Kontext | Schritt | Was man sehen soll | Interner Beweis | Beweist nicht | Status |
|---|---|---|---|---|---|---|---|
| `target-016g-020-personalize-mode-field-action-map.png` | Nr.-Serienzeilen / Personalisieren | `playthru` / `UNIVERSAARL-DE` | Feld-/Aktionskarte im Personalisieren-Modus | `Wird personalisiert: Nr.-Serienzeilen`, `Fertig`, die Spalten `Startnr.`, `Endnr.`, `Luecken in Nummern zulassen`, `Offen` und ein roter Marker bei `Startnr.` sind sichtbar | Playwright ist im richtigen Lines-Kontext und erkennt die fachlich wichtigen Spalten im Personalize-Modus | kein Add-field-Panel, keine Wertpersistenz, keine gespeicherte Personalisierung | `field-action-map`, `not-write-proof` |
| `target-016g-030-personalize-hover-tooltip-map.png` | Nr.-Serienzeilen / Personalisieren | `playthru` / `UNIVERSAARL-DE` | Hover-/Tooltip-Probe | sichtbare Spalten und `Fertig` bleiben im Fokus; keine gefaehrliche Aktion wird ausgeloest | Hover-Probe bleibt im richtigen UI-Kontext und veraendert nichts | kein Tooltip-/Feldlistenbeweis fuer Add-field; keine Start-/Endnummernreife | `diagnostic`, `no-change-proof` |
| `target-016g-050-after-personalize-field-map-exit.png` | Nr.-Serienzeilen / No. Series Lines | `playthru` / `UNIVERSAARL-DE` | Nach Verlassen der Feldkarte | der Personalisierungsbalken ist weg; `U-CUST` Lines bleiben sichtbar | `Fertig` beendet 016G ohne gespeicherte Personalisierung | keine Setup-Aenderung, keine Nummernserien-Zeilenwerte | `exit-proof-no-change` |

## Universaarl Foundation - Nummernserien TARGET-016I

| Screenshot | Page | Company/Kontext | Schritt | Was man sehen soll | Interner Beweis | Beweist nicht | Status |
|---|---|---|---|---|---|---|---|
| `target-016i-010-u-cust-lines-before.png` | Nr.-Serienzeilen / No. Series Lines | `playthru` / `UNIVERSAARL-DE`, `U-CUST` | Vor offizieller Lines-Route | die `U-CUST`-Lines-Seite zeigt eine sichtbare Sternzeile, leeres `Startdatum`, roten Pflichtmarker bei `Startnr.`, `Endnr.` und Checkboxspalten wie `Luecken in Nummern zulassen` und `Offen` | richtiger Detailkontext und fachlich relevante Spalten sind sichtbar | kein aktiver Editor, keine Start-/Endnummern-Persistenz, keine Setup-Zuweisung | `diagnostic-context`, `not-write-proof` |
| `target-016i-020-after-lines-new.png` | Nr.-Serienzeilen / No. Series Lines | `playthru` / `UNIVERSAARL-DE`, `U-CUST` | Nach `Neu` im Lines-Kontext | die sichtbare Sternzeile bleibt vorhanden, aber die Zielwerte sind nicht sichtbar | `Neu` wurde im richtigen Lines-Kontext versucht | keine erfolgreiche Werteingabe, keine Persistenz, kein Setup-Erfolg | `blocked-route-evidence` |
| `target-016i-030-after-official-route-write.png` | Nr.-Serienzeilen / No. Series Lines | `playthru` / `UNIVERSAARL-DE`, `U-CUST` | Nach Wert-Eingabeversuch | `U-CUST00001` und `U-CUST99999` sind nicht sichtbar; die Zeile bleibt leer | die getestete offizielle Route reicht fuer Playwright noch nicht ohne echten Editor-Nachweis | keine Start-/Endnummernreife, keine Buchungsreife | `rejected-value-proof` |
| `target-016i-040-after-reopen-proof.png` | Nr.-Serienzeilen / No. Series Lines | `playthru` / `UNIVERSAARL-DE`, `U-CUST` | Reopen-Proof | nach erneutem Oeffnen sind die Zielwerte weiterhin nicht sichtbar | keine sichtbare Persistenz nach Reopen | keine fertige Nummernserienzeile, keine Setup-Zuweisung, keine Stammdatenreife | `blocked-reopen-proof` |

## Universaarl Foundation - Nummernserien TARGET-016J/016K

| Screenshot | Page | Company/Kontext | Schritt | Was man sehen soll | Interner Beweis | Beweist nicht | Status |
|---|---|---|---|---|---|---|---|
| `target-016j-030-after-true-editor-probes.png` | Nr.-Serienzeilen / No. Series Lines | `playthru` / `UNIVERSAARL-DE`, `U-CUST` | Nach echter Editor-Probe | Tooltip/Fokus liegt bei `Startnr.`, rote Pflichtmarkierung bleibt sichtbar; Start-/Endnummernwerte sind noch nicht eingetragen | frame-aware Header-/Editor-Diagnose erreicht den richtigen Lines-Kontext und erkennt echte Inputs fuer `Startdatum`/`Startnr.` | kein bewiesener `Endnr.`-Editor, keine vollstaendige Zeilenpersistenz, keine Setup-Zuweisung | `diagnostic-context`, `not-write-proof` |
| `target-016j-050-after-reopen-proof.png` | Nr.-Serienzeilen / No. Series Lines | `playthru` / `UNIVERSAARL-DE`, `U-CUST` | Reopen-Proof nach Editor-Probe | eine Zeile mit `Startdatum 30.06.2026` ist sichtbar, `Startnr.` ist leer mit rotem Pflichtmarker, `Endnr.` bleibt leer | der Probe hat unbeabsichtigt eine unvollstaendige date-only Zeile gespeichert; der Zustand ist nach Reopen sichtbar | keine fertige Nummernserie, keine Start-/Endnummernreife, keine Buchungs- oder Stammdatenfreigabe | `blocked-side-effect`, `cleanup-required` |
| `target-016k-020-after-delete-attempt.png` | Nr.-Serienzeilen / No. Series Lines | `playthru` / `UNIVERSAARL-DE`, `U-CUST` | Nach Cleanup-/Delete-Versuch | die unvollstaendige Zeile mit `30.06.2026` bleibt sichtbar; kein sicherer Bestaetigungsdialog ist belegt | der toolbar-nahe Delete-Pfad reicht nicht als Cleanup | keine Entfernung der Zeile, keine sichere Loeschroute | `rejected-cleanup-path` |
| `target-016k-030-after-reopen-cleanup-proof.png` | Nr.-Serienzeilen / No. Series Lines | `playthru` / `UNIVERSAARL-DE`, `U-CUST` | Reopen-Proof nach Cleanup-Versuch | dieselbe unvollstaendige Zeile ist nach erneutem Oeffnen weiterhin sichtbar | Cleanup ist blockiert und muss vor Setup-Zuweisung/Stammdaten geloest werden | keine bereinigte Nummernserienbasis, keine fertige Foundation | `blocked-reopen-proof`, `next-recovery-required` |

## Universaarl Foundation - Nummernserien TARGET-016L

| Screenshot | Page | Company/Kontext | Schritt | Was man sehen soll | Interner Beweis | Beweist nicht | Status |
|---|---|---|---|---|---|---|---|
| `target-016l-010-before-recovery.png` | Nr.-Serienzeilen / No. Series Lines | `playthru` / `UNIVERSAARL-DE`, `U-CUST` | Vor Recovery | die vorhandene `U-CUST`-Zeile steht im Lines-Kontext; der vorherige date-only Zustand ist Ausgangspunkt | richtiger Recovery-Kontext vor wirksamer Setup-Korrektur | keine fertige Nummernserie, keine Zuweisung | `setup-before`, `recovery-context` |
| `target-016l-040-after-reopen-proof.png` | Nr.-Serienzeilen / No. Series Lines | `playthru` / `UNIVERSAARL-DE`, `U-CUST` | Nach Reopen-Proof | `U-CUST00001` und `U-CUST99999` sind in der Zeile sichtbar; `Offen` ist angehakt, `Luecken in Nummern zulassen` ist nicht angehakt | bestehende unvollstaendige Zeile wurde zur sichtbaren Start-/Endnummernzeile vervollstaendigt | keine Setup-Zuweisung, keine weiteren U-* Linien, kein Stammdatensatz, kein Posting; das Startdatum ist im Bild aktiv/abgeschnitten und braucht bei Datumsclaim eigene QA | `universaarl-proven`, `number-series-line-recovery-proof` |

## Universaarl Foundation - Nummernserien TARGET-016M

| Screenshot | Page | Company/Kontext | Schritt | Was man sehen soll | Interner Beweis | Beweist nicht | Status |
|---|---|---|---|---|---|---|---|
| `target-016m-u-vend-030-after-reopen.png` | Nr.-Serienzeilen / No. Series Lines | `playthru` / `UNIVERSAARL-DE`, `U-VEND` | Reopen-Proof nach Linienanlage | `U-VEND00001` und `U-VEND99999` stehen in der Zeile; die Nummernserienliste bleibt im Hintergrund auf `U-VEND` | Lieferanten-Nummernserienzeile ist nach erneutem Oeffnen sichtbar | keine Zuweisung im Kreditoren-/Einkaufssetup, keine Kreditorenkarte, keine rechtliche Nummernfolge | `universaarl-proven`, `number-series-line-proof` |
| `target-016m-u-item-030-after-reopen.png` | Nr.-Serienzeilen / No. Series Lines | `playthru` / `UNIVERSAARL-DE`, `U-ITEM` | Reopen-Proof nach Linienanlage | `U-ITEM00001` und `U-ITEM99999` stehen in der Zeile | Artikel-Nummernserienzeile ist nach erneutem Oeffnen sichtbar | keine Zuweisung im Lagersetup, kein Artikelstamm | `universaarl-proven`, `number-series-line-proof` |
| `target-016m-u-so-030-after-reopen.png` | Nr.-Serienzeilen / No. Series Lines | `playthru` / `UNIVERSAARL-DE`, `U-SO` | Reopen-Proof nach Linienanlage | `U-SO00001` und `U-SO99999` stehen in der Zeile | Verkaufsauftrags-Nummernserienzeile ist nach erneutem Oeffnen sichtbar | keine Zuweisung im Verkaufssetup, kein Verkaufsauftrag | `universaarl-proven`, `number-series-line-proof` |
| `target-016m-u-sinv-030-after-reopen.png` | Nr.-Serienzeilen / No. Series Lines | `playthru` / `UNIVERSAARL-DE`, `U-SINV` | Reopen-Proof nach Linienanlage | `U-SINV00001` und `U-SINV99999` stehen in der Zeile | Verkaufsrechnungs-Nummernserienzeile ist nach erneutem Oeffnen sichtbar | keine Zuweisung im Verkaufssetup, keine Rechnung, keine rechtliche Rechnungsnummernbehauptung | `universaarl-proven`, `number-series-line-proof` |
| `target-016m-u-po-030-after-reopen.png` | Nr.-Serienzeilen / No. Series Lines | `playthru` / `UNIVERSAARL-DE`, `U-PO` | Reopen-Proof nach Linienanlage | `U-PO00001` und `U-PO99999` stehen in der Zeile | Einkaufsbestellungs-Nummernserienzeile ist nach erneutem Oeffnen sichtbar | keine Zuweisung im Einkaufssetup, keine Bestellung | `universaarl-proven`, `number-series-line-proof` |
| `target-016m-u-pinv-030-after-reopen.png` | Nr.-Serienzeilen / No. Series Lines | `playthru` / `UNIVERSAARL-DE`, `U-PINV` | Reopen-Proof nach Linienanlage | `U-PINV00001` und `U-PINV99999` stehen in der Zeile | Einkaufsrechnungs-Nummernserienzeile ist nach erneutem Oeffnen sichtbar | keine Zuweisung im Einkaufssetup, keine Einkaufsrechnung | `universaarl-proven`, `number-series-line-proof` |

Screenshot-QA zu TARGET-016M: Die Nummern sind im Grid eng dargestellt. Der Bildbeweis zaehlt deshalb zusammen mit den `.txt`-/Snapshot-Dateien, die je Code denselben Zielwert im richtigen `Nr.-Serienzeilen`-Kontext enthalten. Dieser Block ist ein Linien-Reife-Beweis, kein Setup-Zuweisungs- oder Belegnummern-Compliance-Beweis.

## Universaarl Foundation - Nummernserien TARGET-017

| Screenshot | Page | Company/Kontext | Schritt | Was man sehen soll | Interner Beweis | Beweist nicht | Status |
|---|---|---|---|---|---|---|---|
| `target-017-sales-receivables-setup-040-after-reopen.png` | Debitoren & Verkauf Einrichtung / Sales & Receivables Setup, Page 459 | `playthru` / `UNIVERSAARL-DE` | Reopen-Proof nach Setup-Zuweisung | Im Bereich Nummernserien sind `U-SO` fuer Auftragsnummern und `U-SINV` fuer Rechnungsnummern sichtbar; die Karte zeigt gleichzeitig mehrere Spalten/FastTabs | Verkaufsauftrags- und Verkaufsrechnungsnummern sind im Verkaufssetup sichtbar zugewiesen | Debitorennummern `U-CUST`, Verkaufsbeleg-Posting, Rechnungsnummern-Compliance, Stammdatenanlage | `universaarl-partial-proof`, `setup-assignment-proof` |
| `target-017-purchases-payables-setup-040-after-reopen.png` | Kreditoren & Einkauf Einrichtung / Purchases & Payables Setup, Page 460 | `playthru` / `UNIVERSAARL-DE` | Reopen-Proof nach Setup-Zuweisung | `U-VEND` und `U-PINV` sind im Einkaufssetup als sichtbare Nummernserienwerte erfasst; genaue Feldzuordnung wird durch `.txt`-/Diagnostics-Dateien mitgetragen | Kreditoren- und Einkaufsrechnungsnummern sind im Einkaufssetup sichtbar zugewiesen | Einkaufsbestellungsnummern `U-PO`, Einkaufsposten, Eingangsrechnung, rechtliche Rechnungsnummernfolge | `universaarl-partial-proof`, `setup-assignment-proof` |
| `target-017-inventory-setup-040-after-reopen.png` | Lager Einrichtung / Inventory Setup, Page 461 | `playthru` / `UNIVERSAARL-DE` | Reopen-Proof nach blockierter Artikelnummern-Zuweisung | die Lager-Einrichtung ist erreichbar, aber das Ziel-Feld fuer Artikelnummern wurde nicht eindeutig gefunden | `U-ITEM` darf nicht geraten werden; Field Discovery ist der naechste Schritt | Artikelnummern-Zuweisung, Artikelstamm, Lagerbuchung, Item Ledger | `blocked-field-discovery-needed` |

Screenshot-QA zu TARGET-017: Setupkarten koennen zweispaltig rendern. Ein Wert im rechten Kartenbereich ist nicht automatisch derselbe Zielwert wie das linke Label. Deshalb zaehlen hier Screenshots, Text-Snapshots und Diagnostics zusammen. TARGET-017 beweist nur vier technische Setup-Zuweisungen; `U-CUST`, `U-PO` und `U-ITEM` bleiben fuer TARGET-017B offen.

## Universaarl Foundation - Nummernserien TARGET-017B

| Screenshot | Page | Company/Kontext | Schritt | Was man sehen soll | Interner Beweis | Beweist nicht | Status |
|---|---|---|---|---|---|---|---|
| `target-017b-sales-receivables-setup-field-discovery.png` | Debitoren & Verkauf Einrichtung / Sales & Receivables Setup, Page 459 | `playthru` / `UNIVERSAARL-DE` | Field Discovery fuer Debitorennummern | Die Verkaufssetupkarte ist im Edit-/Diagnosekontext sichtbar; `Customer Nos.`/Debitorennummern wird nicht als sichere sichtbare Feldroute gefunden | `U-CUST` darf nicht ueber eine geratene Setup-Card-Route zugewiesen werden | Debitorennummern-Zuweisung, Kundenanlage, Belegnummern-Compliance | `diagnostic`, `not-visible-field-route` |
| `target-017b-purchases-payables-setup-field-discovery.png` | Kreditoren & Einkauf Einrichtung / Purchases & Payables Setup, Page 460 | `playthru` / `UNIVERSAARL-DE` | Field Discovery fuer Einkaufsbestellungsnummern | Im Einkaufssetup sind Kandidaten rund um `Bestellungsnummern` sichtbar; nahe Labels/Controls und Tooltips werden in den JSON-Snapshots mitgefuehrt | `U-PO` hat eine moegliche sichtbare Feld-/Control-Route fuer einen spaeteren engen Assignment-Case | Wertezuweisung, Reopen-Proof, Einkaufsbestellung oder Posting | `diagnostic`, `route-candidate-only` |
| `target-017b-inventory-setup-field-discovery.png` | Lager Einrichtung / Inventory Setup, Page 461 | `playthru` / `UNIVERSAARL-DE` | Field Discovery fuer Artikelnummern | Die Lagereinrichtung ist sichtbar, aber `Item Nos.`/Artikelnummern wird in dieser Kartenansicht nicht als sichere Feldroute gefunden | `U-ITEM` braucht eine andere Route oder bewusste Park-Entscheidung | Artikelnummern-Zuweisung, Artikelanlage, Lagerbuchung | `diagnostic`, `not-visible-field-route` |

Screenshot-QA zu TARGET-017B: Dieser Block ist kein Setup-Erfolg. Er beweist nur, welche Setupfelder in den getesteten Kartenansichten sichtbar oder nicht sichtbar wurden. `U-PO` ist ein Kandidat, `U-CUST` und `U-ITEM` bleiben offen. Deshalb folgt TARGET-019 als Park-/Follow-up-Entscheidung vor Stammdaten oder Posting Groups.

## Universaarl Foundation - Posting Groups TARGET-019B

| Screenshot | Page | Company/Kontext | Schritt | Was man sehen soll | Interner Beweis | Beweist nicht | Status |
|---|---|---|---|---|---|---|---|
| `target-019b-001-general-posting-setup.png` | Buchungsmatrix Einrichtung / General Posting Setup, Page 314 | `playthru` / `UNIVERSAARL-DE` | Read-only Posting-Groups-Preflight | Kombinationen aus Geschaeftsbuchungsgruppe, Produktbuchungsgruppe und Kontenspalten sind sichtbar | Die zentrale Buchungsmatrix ist in der Zielcompany erreichbar | fachliche Vollstaendigkeit, korrekte Konten, Preview oder Posting | `universaarl-readonly-candidate`, `setup-context` |
| `target-019b-002-customer-posting-groups.png` | Debitorenbuchungsgruppen / Customer Posting Groups, Page 110 | `playthru` / `UNIVERSAARL-DE` | Read-only Debitorenbuchungsgruppen | Code, Beschreibung und Debitorensammelkonto-Spalten sind sichtbar | Debitorenbuchungsgruppen sind als Forderungs-Kontenfindungskontext erreichbar | Debitorenstamm, gebuchte Forderung, Kontenrichtigkeit | `universaarl-readonly-candidate`, `setup-context` |
| `target-019b-003-vendor-posting-groups.png` | Kreditorenbuchungsgruppen / Vendor Posting Groups, Page 93 | `playthru` / `UNIVERSAARL-DE` | Read-only Kreditorenbuchungsgruppen | Kreditorenbuchungsgruppen-Seite ist sichtbar; genaue Textsignale liegen in der Evidence | Kreditorenbuchungsgruppen-Kontext ist erreichbar | Kreditorenstamm, gebuchte Verbindlichkeit, Kontenrichtigkeit | `universaarl-readonly-candidate`, `setup-context` |
| `target-019b-004-inventory-posting-setup.png` | Lagerbuchung Einrichtung / Inventory Posting Setup, Page 5826 | `playthru` / `UNIVERSAARL-DE` | Read-only Lagerbuchung Einrichtung | Lagerortcode, Lagerbuchungsgruppencode und Lagerkontenspalten sind sichtbar | Bestandskontenfindung hat eine eigene Setupmatrix | Artikelstamm, Lagerbuchung, Bestandskonto-Richtigkeit | `universaarl-readonly-candidate`, `setup-context` |
| `target-019b-005-vat-posting-setup.png` | USt-Buchungsmatrix / VAT Posting Setup, Page 472 | `playthru` / `UNIVERSAARL-DE` | Read-only USt-Buchungsmatrix | MwSt.-Geschaeftsbuchungsgruppe, MwSt.-Produktbuchungsgruppe und MwSt.-%-Spalten sind sichtbar | USt-Setup-Kontext ist erreichbar | deutsche 19-Prozent-USt, Steuerposten, Preview oder Posting | `universaarl-readonly-candidate`, `setup-context-not-vat-proof` |

Screenshot-QA zu TARGET-019B: Die Bilder zeigen erreichbare Setupkontexte. Sie sind keine fachliche Freigabe fuer Konten, USt, Stammdaten, Preview oder Posting. Fuer das Buch sind sie als Erklaerbilder fuer Kontenfindung geeignet, solange der Text klar sagt, dass Sichtbarkeit noch keine richtige Einrichtung beweist.

## Universaarl Foundation - USt/VAT TARGET-020

| Screenshot | Page | Company/Kontext | Schritt | Was man sehen soll | Interner Beweis | Beweist nicht | Status |
|---|---|---|---|---|---|---|---|
| `target-020-001-vat-business-posting-groups.png` | MwSt.-Geschaeftsbuchungsgruppen / VAT Business Posting Groups, Page 470 | `playthru` / `UNIVERSAARL-DE` | Read-only USt-Business-Gruppen | Code-/Beschreibungs-Spalten der MwSt.-Geschaeftsbuchungsgruppen sind sichtbar | USt-Geschaeftsgruppen-Kontext ist erreichbar | inlaendische 19-Prozent-USt, Kunden-/Kreditoren-Zuweisung, Preview oder USt-Posten | `universaarl-readonly-candidate`, `vat-context` |
| `target-020-002-vat-product-posting-groups.png` | MwSt.-Produktbuchungsgruppen / VAT Product Posting Groups, Page 471 | `playthru` / `UNIVERSAARL-DE` | Read-only USt-Produktgruppen | Code-/Beschreibungs-Spalten und Info-Kontext fuer Produktgruppen sind sichtbar | USt-Produktgruppen-Kontext ist erreichbar | 19-Prozent-Produktgruppe, Artikel-/Sachkonto-Zuweisung, Preview oder USt-Posten | `universaarl-readonly-candidate`, `vat-context` |
| `target-020-003-vat-posting-setup.png` | MwSt.-Buchungsmatrix Einrichtung / VAT Posting Setup, Page 472 | `playthru` / `UNIVERSAARL-DE` | Read-only USt-Buchungsmatrix | Spalten fuer MwSt.-Geschaeftsgruppe, MwSt.-Produktgruppe, MwSt. %, Berechnungsart und USt-Konten sind sichtbar | USt-Buchungsmatrix-Kontext ist erreichbar und als eigener Setup-Baustein erklaerbar | richtige Steuersaetze, Kontenrichtigkeit, deutsche 19-Prozent-USt, Preview, VAT Entries oder Sachposten | `universaarl-readonly-candidate`, `setup-context-not-vat-proof` |

Screenshot-QA zu TARGET-020: Diese Bilder zeigen nur die USt-Setup-Ebenen. Sie duerfen im Buch erklaeren, welche Seiten vor einem deutschen USt-Beleg geprueft werden. Sie beweisen noch keine 19-Prozent-USt, keine Kontenrichtigkeit und keine Buchungswirkung.

## Universaarl Foundation - Dimensionen TARGET-021

| Screenshot | Page | Company/Kontext | Schritt | Was man sehen soll | Interner Beweis | Beweist nicht | Status |
|---|---|---|---|---|---|---|---|
| `target-021-001-dimensions-list.png` | Dimensionswerteuebersicht / Dimensionen, Page 560 | `playthru` / `UNIVERSAARL-DE` | Read-only Dimensionen-Kontext | Die Liste zeigt die Spalten `Code` und `Name`, aber keine Zeilen; die Meldung sagt, dass in dieser Ansicht nichts angezeigt werden kann | Die Dimensionsseite ist erreichbar und aktuell leer sichtbar | angelegte Dimensionscodes, Dimensionswerte, Standarddimensionen, Reportingwirkung | `universaarl-readonly-candidate`, `empty-setup-context` |
| `target-021-002-general-ledger-global-dimensions.png` | Finanzbuchhaltung Einrichtung / General Ledger Setup, Page 118 | `playthru` / `UNIVERSAARL-DE` | Read-only globale Dimensionen | Im Abschnitt `Dimensionen` sind `Globaler Dimensionscode 1` und `Globaler Dimensionscode 2` sichtbar | Die Felder fuer globale Dimensionen sind als Setup-Kontext erreichbar | gespeicherte globale Dimensionen, Dimension Set Entries, Sachposten, Reportingwirkung | `universaarl-readonly-candidate`, `setup-context-not-reporting-proof` |

Screenshot-QA zu TARGET-021: Das erste Bild ist gerade wegen der leeren Liste wertvoll. Es beweist nicht, dass Dimensionen eingerichtet sind, sondern dass vor Stammdaten ein Setup-Fit-Entscheid noetig ist. Das zweite Bild erklaert, wo globale Dimensionen in Business Central sitzen; es ist kein Beweis fuer gesetzte Werte oder fuer spaetere Berichte.

## Universaarl Foundation - Dimensionen TARGET-023

| Screenshot | Page | Company | Schritt | Was sieht man? | Beweist intern | Beweist nicht | Status |
|---|---|---|---|---|---|---|---|
| `target-023-010-dimensions-before.png` | Dimensionen, Page 536 | `playthru` / `UNIVERSAARL-DE` | Vorher-/Startkontext des Setup-Fit | Die Dimensionsliste als anlegbare Liste mit `Code`, `Name`, `Neu` und Listenaktionen | Der Schreibkontext fuer Dimension-Codes ist Page 536, nicht die leere Page-560-Kontextansicht | vollstaendige Werte, globale Dimensionen, Stammdaten, Posten | `universaarl-setup-before`, `partial-proof` |
| `target-023-productline-values-after.png` | Dimensionswerte, Page 537 | `playthru` / `UNIVERSAARL-DE` | PRODUCTLINE-Werte | `SOFTWARE` ist als Wert sichtbar; `Neu` und `Liste bearbeiten` sind sichtbar | `PRODUCTLINE.SOFTWARE` ist sichtbar | `SERVICE`, `TRAINING`, Default Dimensions, Reportingwirkung | `universaarl-setup-partial`, `blocked-multirow-entry` |
| `target-023-costcenter-values-after.png` | Dimensionswerte, Page 537 | `playthru` / `UNIVERSAARL-DE` | COSTCENTER-Werte | `ADMIN` ist als Wert sichtbar | `COSTCENTER.ADMIN` ist sichtbar | `SALES`, `OPERATIONS`, Default Dimensions, Reportingwirkung | `universaarl-setup-partial`, `blocked-multirow-entry` |
| `target-023-channel-values-after.png` | Dimensionswerte, Page 537 | `playthru` / `UNIVERSAARL-DE` | CHANNEL-Werte | `DIRECT` ist als Wert sichtbar | `CHANNEL.DIRECT` ist sichtbar | `PARTNER`, Default Dimensions, Reportingwirkung | `universaarl-setup-partial`, `blocked-multirow-entry` |
| `target-023-090-dimensions-after-reopen.png` | Dimensionen, Page 536 | `playthru` / `UNIVERSAARL-DE` | Nachher-Reopen | `PRODUCTLINE`, `COSTCENTER` und `CHANNEL` sind in der Dimensionsliste sichtbar | Die drei Dimension-Codes sind nach Reopen sichtbar | globale Dimensionen, vollstaendige Werte, Postenwirkung | `universaarl-setup-after-reopen`, `partial-proof` |
| `target-023-095-general-ledger-setup-dimension-context.png` | Finanzbuchhaltung Einrichtung, Page 118 | `playthru` / `UNIVERSAARL-DE` | Kontext globale Dimensionen | `Globaler Dimensionscode 1` und `Globaler Dimensionscode 2` sind weiterhin leer sichtbar | Der spaetere Assignment-Ort ist sichtbar | Zuweisung von `PRODUCTLINE`/`COSTCENTER`, Posten- oder Reportingwirkung | `universaarl-global-dimension-context`, `not-assigned` |

Screenshot-QA zu TARGET-023: Der Lauf ist kein Vollerfolg, aber kein Wegwerfbild. Er zeigt den echten Fortschritt und den echten Blocker: Dimension-Codes sind angelegt/sichtbar, je ein erster Wert ist sichtbar, weitere Werte werden mit der aktuellen Page-537-Route nicht stabil gespeichert. Fuer das Buch duerfen diese Bilder nur als Foundation-/Blocker-Erklaerung verwendet werden, nicht als Reporting- oder Belegbeweis.

## Qualitaetsfelder fuer neue Screenshot-Metadaten

Neue oder ueberarbeitete `.screenshot.json`-Dateien sollen diese Felder tragen:

- `page`
- `instance`
- `company`
- `step`
- `visibleLearning`
- `importantUi`
- `internallyProves`
- `doesNotProve`
- `qualityDecision`
- `finalScreenshotStatus`

Wenn eines dieser Felder nicht sinnvoll beantwortet werden kann, ist der Screenshot kein Buchkandidat. Er bleibt dann Debugging-, Kontext- oder Rejected-Evidence.

## Screenshot-Typen

- `Company Context`
- `Navigation`
- `Setup Before/After`
- `Master Data Card`
- `Preflight`
- `Preview Posting`
- `Posting Dialog`
- `Posted Document`
- `Ledger Trace`
- `Report`
- `Error`
- `Rejected Path`
- `Book Candidate`

## UI-Ergonomie-Regel

Ein Screenshot ist fuer Buch oder Evidence nur brauchbar, wenn der sichtbare Ausschnitt den behaupteten Zweck zeigt. Stoerende Help-/Tour-Overlays werden geschlossen, wenn sie nicht Teil des Beweises sind. FactBoxes bleiben sichtbar, wenn sie Kontext beweisen; sie werden ausgeblendet, wenn sie die Haupttabelle zu eng machen. Bei Listen, Worksheets und Journals sollen relevante Spalten durch breite Ansicht, Fokusmodus oder horizontales Scrollen sichtbar gemacht werden.

UI-relevante Result JSONs sollen `uiErgonomics` enthalten: Overlays, FactBox-Zweck, FastTabs, Grid-Fokus, horizontales/vertikales Scrollen, Personalisierung und Page Inspection.

## PREP-010 Screenshot-QA-Regel

Vor jeder Buch- oder Clickguide-Nutzung muss der Screenshot gegen die konkrete Behauptung geprueft werden:

- Zeigt das Bild den konkreten Button, Pfeil oder Menueintrag?
- Ist der relevante Code, Wert, Dialog oder Feldbereich lesbar?
- Ist der Zielzustand nach dem Klick sichtbar?
- Kann ein Anfaenger erkennen, welcher UI-Teil gemeint ist?
- Wurde ein falscher Klickpfad als `rejected-path` markiert?

Ein Screenshot, der nur den allgemeinen Page-Kontext oder einen DOM-/ARIA-Treffer stuetzt, bleibt Debugging-Evidence. Er darf nicht als Buchbeweis fuer einen konkreten Code, Button, Menueintrag, Wert oder erfolgreichen Schritt verwendet werden.
