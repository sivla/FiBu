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
