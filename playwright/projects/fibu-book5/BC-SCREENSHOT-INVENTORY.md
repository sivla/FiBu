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
| `target-026n-010-chart-foundation-checkpoint.png` | Role Center statt sichtbarem Kontenplan | `playthru`, `UNIVERSAARL-DE` | Kontenplan-Checkpoint nach SKR04-Starterkonten | Das Bild zeigt nicht die behauptete Kontenplanliste, sondern den Role Center. Kompakte Kontenplan-Textfragmente im Result reichen deshalb nicht als Bildbeweis. | Screenshot-Truth-Gate fuer versteckte/stale Frame-Texte; der Lauf bleibt vor VAT/Postingsetup blockiert | sichtbarer Kontenplan, vollstaendiger SKR04-Checkpoint, VAT Posting Setup, Posting Groups, Stammdaten | `rejected-screenshot`, `blocked` |
| `target-026o-010-visible-chart-iframe.png` | Kontenplan, sichtbares BC-Iframe | `playthru`, `UNIVERSAARL-DE` | Recovery nach abgelehntem TARGET-026N-Screenshot | Sichtbare Kontenplanliste mit `1200`, `1406`, `1800`, `3300`, `3806`, `4400`, `5400`, Spalten `Nr.`, `Name`, `GuV/Bilanz`, `Kontoart` und FactBox | Der sichtbare Screenshot-Gate ist erfuellt; VAT Posting Groups duerfen als naechster Read-only-Preflight geprueft werden | vollstaendiger SKR04, Steuerberaterfreigabe, VAT Setup, Posting Groups, Stammdaten, Belege, Preview, Posting | `universaarl-foundation-proof`, `book-candidate`, `screenshot-truth-recovered` |
| `target-027-001/002/003-*.png` | Role Center statt VAT-Setupseiten | `playthru`, `UNIVERSAARL-DE` | VAT Posting Groups / VAT Posting Setup Preflight | Die Bilder zeigen nicht die behaupteten VAT Business/Product Posting Groups oder VAT Posting Setup Seiten, sondern weiter den Role Center bzw. keinen sichtbaren VAT-Seitenkontext | Strenger Screenshot-Gate fuer VAT-Setupseiten; Direct Page und Search-Fallback sind ohne sichtbare Zielseite nicht ausreichend | VAT Business/Product Posting Groups, VAT Posting Setup, deutsche 19-Prozent-USt, VAT Entries, Preview, Posting | `rejected-screenshot`, `blocked`, `do-not-use-as-vat-proof` |

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
| `target-023b-productline-090-final-reopen.png` | Dimensionswerte, Page 537 | `playthru` / `UNIVERSAARL-DE` | PRODUCTLINE-Reopen nach Recovery | `SOFTWARE`, `SERVICE` und `TRAINING` sind als PRODUCTLINE-Werte sichtbar | PRODUCTLINE-Startwerte sind fuer die Foundation sichtbar | Default Dimensions, Posten, Reportingwirkung | `universaarl-setup-after`, `foundation-values-proven` |
| `target-023b-costcenter-090-final-reopen.png` | Dimensionswerte, Page 537 | `playthru` / `UNIVERSAARL-DE` | COSTCENTER-Reopen nach Recovery | `ADMIN`, `SALES` und `OPERATIONS` sind als COSTCENTER-Werte sichtbar | COSTCENTER-Startwerte sind fuer die Foundation sichtbar | Default Dimensions, Posten, Reportingwirkung | `universaarl-setup-after`, `foundation-values-proven` |
| `target-023b-channel-090-final-reopen.png` | Dimensionswerte, Page 537 | `playthru` / `UNIVERSAARL-DE` | CHANNEL-Reopen nach Recovery | `DIRECT` und `PARTNER` sind als CHANNEL-Werte sichtbar | CHANNEL-Startwerte sind fuer die Foundation sichtbar | Default Dimensions, Posten, Reportingwirkung | `universaarl-setup-after`, `foundation-values-proven` |

Screenshot-QA zu TARGET-023/TARGET-023B: TARGET-023 bleibt als Lernbild fuer den direkten Page-537-Blocker wichtig. TARGET-023B ist der bessere Foundation-Nachweis: Die finalen Reopen-Screenshots zeigen die Startwerte je Dimension. Sie sind Setup-/Foundation-Bilder, aber keine Beleg-, Posten- oder Reportingbilder.

## Universaarl Foundation - Globale Dimensionen TARGET-024B

| Screenshot | Page | Company | Schritt | Was sieht man? | Intern bewiesen | Nicht bewiesen | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `target-024b-010-before.png` | Finanzbuchhaltung Einrichtung, Page 118 | `playthru` / `UNIVERSAARL-DE` | Vorherkontext globale Dimensionen | `Globaler Dimensionscode 1` und `Globaler Dimensionscode 2` sind im Abschnitt `Dimensionen` sichtbar und leer | Der richtige Setup-Kontext ist erreichbar | Zuweisung, Standarddimensionen, Posten, Reportingwirkung | `universaarl-setup-before`, `blocked-route-context` |
| `target-024b-012-direct-card-after-fill.png` | Finanzbuchhaltung Einrichtung, Page 118 | `playthru` / `UNIVERSAARL-DE` | Direkte Kartenroute nach Edit-Versuch | Die Hauptkarte bleibt sichtbar; die globalen Dimensionsfelder sind weiterhin leer | Direkte Kartenbearbeitung ist mit diesem Helper keine bewiesene Persistenzroute | gespeicherte Global Dimensions | `rejected-route`, `screenshot-qa-required` |
| `target-024b-016-change-dialog-after-fill.png` | Globale Dimensionen aendern | `playthru` / `UNIVERSAARL-DE` | Action-Page nach Eingabe | Die linke Spalte zeigt `PRODUCTLINE` und `COSTCENTER`, die rechte Spalte bleibt leer | Die Action-Page ist erreichbar und nimmt sichtbare Werte links an | welche Spalte fachlich wirksam ist, gespeicherte globale Dimensionen | `blocked-action-page`, `needs-field-inspection` |
| `target-024b-090-after-reopen.png` | Finanzbuchhaltung Einrichtung, Page 118 | `playthru` / `UNIVERSAARL-DE` | Reopen nach Versuch | Beide globalen Dimensionsfelder sind weiter leer | TARGET-024B hat keine Persistenz bewiesen | Global Dimension Code 1/2 assignment | `blocked`, `not-book-final` |

Screenshot-QA zu TARGET-024B: Der wichtigste Befund ist negativ. Die Bilder duerfen nicht als Erfolgsscreenshots fuer globale Dimensionen verwendet werden. Sie zeigen, dass Page 118 und die Action-Page erreichbar sind, aber dass die aktuelle Playwright-Route die Zuweisung nicht beweist. Der naechste Screenshot-Case muss Page Inspection, Tooltip/Action-Namen und linke/rechte Feldspalte erklaeren.

## Universaarl Foundation - Globale Dimensionen TARGET-024C

| Screenshot | Page | Company | Schritt | Was sieht man? | Intern bewiesen | Nicht bewiesen | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `target-024c-010-general-ledger-setup.png` | Finanzbuchhaltung Einrichtung, Page 118 | `playthru` / `UNIVERSAARL-DE` | Ausgangspunkt vor Action-Page | `Globaler Dimensionscode 1/2` sind leer; `Globale Dimensionen aendern...` ist sichtbar | Page 118 und der passende Aktionspfad sind erreichbar | gespeicherte Global Dimensions, Stammdaten, Posten | `universaarl-setup-discovery`, `not-final-book-proof` |
| `target-024c-020-change-global-dimensions-action-page.png` | Globale Dimensionen aendern, Page 577 | `playthru` / `UNIVERSAARL-DE` | Action-Page nach Oeffnen und Editmode | `Fortlaufend`, `Parallel`, `Weitere Optionen` und die Zeilen fuer `Globaler Dimensionscode 1/2` sind sichtbar | Die Action-Page hat eigene Run-Aktionen und eigene Eingabezeilen | welche Aktion Werte dauerhaft speichert | `universaarl-action-page-discovery`, `no-run-clicked` |
| `target-024c-030-action-page-control-map.png` | Globale Dimensionen aendern, Page 577 | `playthru` / `UNIVERSAARL-DE` | Control-/Tooltip-QA | Links liegt pro Zeile eine editierbare Combobox; rechts liegt ein disabled/read-only Textbox-/Pruefbereich | Die linke/rechte Feldgeometrie ist dokumentiert; `Fortlaufend`/`Parallel` wurden nicht geklickt | Global Dimension Code 1/2 assignment, Reportingwirkung | `universaarl-control-map`, `next-route-candidate` |

Screenshot-QA zu TARGET-024C: Diese Bilder sind Bedien- und Debugging-Evidence. Sie erklaeren, warum ein sichtbares Feld noch kein gespeicherter Setup-Wert ist. Fuer das Buch eignen sie sich als Erklaerbild zur Action-Page, aber nicht als Beweis, dass `PRODUCTLINE` und `COSTCENTER` globale Dimensionen sind.

## Universaarl Foundation - Globale Dimensionen TARGET-024D

| Screenshot | Page | Company | Schritt | Was sieht man? | Beweist intern | Beweist nicht | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `target-024d-010-page118-before.png` | Finanzbuchhaltung Einrichtung, Page 118 | `playthru` / `UNIVERSAARL-DE` | Vorher-Reopen | `Globaler Dimensionscode 1/2` sind leer sichtbar | Page-118-Ausgangspunkt vor dem kontrollierten Versuch | globale Dimensionen, Standarddimensionen, Postenwirkung | `universaarl-setup-before`, `negative-baseline` |
| `target-024d-020-action-page-before-entry.png` | Globale Dimensionen aendern, Page 577 | `playthru` / `UNIVERSAARL-DE` | Action-Page vor Eingabe | Linke Eingabespalte, rechte gesperrte Spalte, `Fortlaufend`/`Parallel` | Die 024C-Geometrie ist wieder sichtbar | Persistenz oder Ausfuehrung | `universaarl-control-map`, `before-write` |
| `target-024d-030-action-page-after-entry-before-run.png` | Globale Dimensionen aendern, Page 577 | `playthru` / `UNIVERSAARL-DE` | Vor `Starten` | `PRODUCTLINE` und `COSTCENTER` stehen links in den Eingabefeldern | Werte wurden sichtbar in die geplanten Controls eingetragen | gespeicherte Page-118-Werte | `universaarl-controlled-setup-attempt`, `not-reopen-proof` |
| `target-024d-040-after-run-return-or-message.png` | Finanzbuchhaltung Einrichtung, Page 118 | `playthru` / `UNIVERSAARL-DE` | Nach `Fortlaufend` -> `Starten` | BC kehrt zur Einrichtung zurueck; die globalen Dimensionsfelder bleiben leer | `Starten` wurde ausgefuehrt, aber kein positiver Persistenzbeweis ist sichtbar | Global Dimension Code 1/2 assignment | `blocked`, `negative-reopen-signal` |
| `target-024d-090-page118-after-reopen.png` | Finanzbuchhaltung Einrichtung, Page 118 | `playthru` / `UNIVERSAARL-DE` | Reopen nach Versuch | Beide globalen Dimensionsfelder sind weiterhin leer | Der kontrollierte 024D-Pfad ist kein Erfolgsbeweis | Standarddimensionen, Posten, Reportingwirkung | `blocked`, `do-not-use-as-success` |

Screenshot-QA zu TARGET-024D: Wichtig ist der Bedienfehler-Fund aus der ersten Testfassung: `Fortlaufend` oeffnet nur den Reiter, `Starten` ist der eigentliche Ausfuehrungsbutton. Der korrigierte Lauf klickt `Starten`, liefert aber weiterhin keinen positiven Reopen-Beweis auf Page 118. Diese Bilder sind deshalb gute Debugging- und Buch-Erklaerbilder fuer den Unterschied zwischen sichtbarer Eingabe, Ausfuehrungsbutton und gespeichertem Setup-Wert.

## Universaarl Foundation - Globale Dimensionen TARGET-024F

| Screenshot | Page | Company | Schritt | Was sieht man? | Beweist intern | Beweist nicht | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `target-024f-010-page118-before.png` | Finanzbuchhaltung Einrichtung, Page 118 | `playthru` / `UNIVERSAARL-DE` | Vorher vor Page-118-Direktroute | Page 118 ist in der Zielcompany offen; die Felder `Globaler Dimensionscode 1/2` sind leer sichtbar | Richtiger Zielkontext und negative Baseline | gespeicherte globale Dimensionen, Default Dimensions, Postenwirkung | `universaarl-setup-before`, `negative-baseline` |
| `target-024f-020-page118-editmode-field-map.png` | Finanzbuchhaltung Einrichtung, Page 118 | `playthru` / `UNIVERSAARL-DE` | Bearbeiten-Modus und Feld-QA | Der Stift/Bearbeiten-Modus ist aktiv; viele Felder werden editierbar, aber `Globaler Dimensionscode 1/2` bleiben graue Button-/Detailfelder | Frame-aware Editmode funktioniert; die Global-Dimension-Felder sind keine direkten Textboxen | dass `PRODUCTLINE`/`COSTCENTER` gespeichert sind | `blocked-direct-field-route`, `lookup-route-needed` |

Screenshot-QA zu TARGET-024F: Das Bild ist kein Erfolgsscreenshot fuer globale Dimensionen. Es erklaert, warum die direkte Textbox-Hypothese falsch war: Die Page-118-Felder erscheinen im Bearbeiten-Modus als Lookup-/Detailbutton-Flaechen. Der naechste Screenshot muss zeigen, was beim gezielten Klick auf genau diese Feldflaechen passiert.

## Universaarl Foundation - Globale Dimensionen TARGET-024G

| Screenshot | Page | Company | Schritt | Was sieht man? | Beweist intern | Beweist nicht | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `target-024g-010-page118-editmode-before-lookup.png` | Finanzbuchhaltung Einrichtung, Page 118 | `playthru` / `UNIVERSAARL-DE` | Vor Lookup-/Detailbutton-Probe | Bearbeiten-Modus ist aktiv, `Globaler Dimensionscode 1/2` bleiben leere Button-Felder | Die Zielcontrols sind sichtbar und gezielt lokalisierbar | gespeicherte globale Dimensionen | `universaarl-setup-before`, `button-route-probe` |
| `target-024g-020-after-global-dim-1-button-click.png` | Finanzbuchhaltung Einrichtung, Page 118 | `playthru` / `UNIVERSAARL-DE` | Nach Klick auf Globaler Dimensionscode 1 | Die Seite bleibt im Page-118-Kontext; kein sichtbarer `PRODUCTLINE`-Lookup entsteht | Der Button-Klick liefert keine sichere Auswahlroute | `PRODUCTLINE` als Global Dimension Code 1 | `blocked-lookup-route`, `do-not-use-as-success` |
| `target-024g-090-page118-after-lookup-probe-reopen.png` | Finanzbuchhaltung Einrichtung, Page 118 | `playthru` / `UNIVERSAARL-DE` | Reopen nach Button-Probe | Die globalen Dimensionsfelder sind weiterhin leer | TARGET-024G hat keine Persistenz bewiesen | Default Dimensions, Posten, Reportingwirkung | `blocked`, `park-decision-needed` |

Screenshot-QA zu TARGET-024G: Diese Bilder begruenden die Parkentscheidung. Sie sind gute Debugging-Bilder fuer das Buch/Atlas-System, aber keine Erfolgsscreenshots fuer globale Dimensionen.

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

## Universaarl Master Data - Listen-Preflight TARGET-025

| Screenshot | Page | Company | Schritt | Was sieht man? | Intern bewiesen | Nicht bewiesen | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `target-025-010-customers-list.png` | Debitoren, Page 22 | `playthru` / `UNIVERSAARL-DE` | Read-only Debitorenliste | Leere Debitorenliste, `Neu`, Filter-/Listenaktionen, FactBox und Teaching Tip unten links | Die Debitorenliste ist in der Zielcompany erreichbar und aktuell leer | Debitorenvorlagen, Pflichtfelder, Nummernserien, Posting Groups, Anlage eines Debitors | `universaarl-readonly-preflight`, `not-a-create-proof` |
| `target-025-020-vendors-list.png` | Kreditoren, Page 27 | `playthru` / `UNIVERSAARL-DE` | Read-only Kreditorenliste | Leere Kreditorenliste, `Neu`, Listenaktionen, FactBox und Teaching Tip unten links | Die Kreditorenliste ist in der Zielcompany erreichbar und aktuell leer | Kreditorenvorlagen, Pflichtfelder, Posting Groups, Zahlungskontext | `universaarl-readonly-preflight`, `not-a-create-proof` |
| `target-025-030-items-list.png` | Artikel, Page 31 | `playthru` / `UNIVERSAARL-DE` | Read-only Artikelliste | Leere Artikelliste, `Neu`, FactBox mit Artikeldetails/Fakturierung/Planung und Teaching Tip | Die Artikelliste und der FactBox-Kontext sind erreichbar; es gibt noch keine Artikel | Artikelvorlagen, Lager-/Fakturierungspflichtfelder, Posting Groups, Artikelanlage | `universaarl-readonly-preflight`, `not-a-create-proof` |
| `target-025-040-locations-list.png` | Lagerorte, Page 15 | `playthru` / `UNIVERSAARL-DE` | Read-only Lagerortliste | Leere Lagerortliste, `Neu`, Listenaktionen und Teaching Tip | Die Lagerortliste ist erreichbar und aktuell leer | Lagerortanlage, Lagerbuchungsgruppen, Lagerplatz-/Warehouse-Setup | `universaarl-readonly-preflight`, `not-a-create-proof` |

Screenshot-QA zu TARGET-025: Diese vier Bilder sind gute Kontext- und Buchvorbereitungsbilder fuer leere Stammdatenlisten. Sie sind keine Beweise fuer Vorlagen, Pflichtfelder oder erfolgreich angelegte Stammdaten. Teaching Tips werden nur dann im Buchbild gelassen, wenn sie den Lernpunkt erklaeren; fuer Feld- oder Tabellenbeweise muessen sie geschlossen werden. Die FactBox ist nur dann Teil des Beweises, wenn ihr Inhalt erklaert wird und keine relevanten Spalten verdeckt.

## Universaarl Kontenplan - Read-only Preflight TARGET-026B

| Screenshot | Page | Company | Schritt | Was sieht man? | Intern bewiesen | Nicht bewiesen | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `target-026b-010-chart-of-accounts-readonly.png` | Kontenplan, Page 16 | `playthru` / `UNIVERSAARL-DE` | Erste Read-only-Aufnahme | Leerer Kontenplan, `Neu`, `Liste bearbeiten`, FactBox und ein eingeblendeter Spalten-Tooltip zu `Nr.` | Kontenplan ist erreichbar; Tooltip erklaert die Nummernspalte | Sachkonten, USt-Konten, Kontenplan-Finalitaet, VAT-Setup | `universaarl-readonly-preflight`, `hover-learning` |
| `target-026b-020-chart-of-accounts-context-after-hover-clear.png` | Kontenplan, Page 16 | `playthru` / `UNIVERSAARL-DE` | Kontext nach Hover-Clear | Leerer Kontenplan ohne Spalten-Tooltip, FactBox rechts, keine sichtbaren Sachkontenzeilen | Die leere/insufficient Kontenplanansicht ist in der Zielcompany sichtbar | keine Kontenrichtigkeit, kein Sales-/Purchase-VAT-Konto, keine Buchungsfaehigkeit | `universaarl-readonly-preflight`, `foundation-blocker` |

Screenshot-QA zu TARGET-026B: Das zweite Bild ist der bessere Buch-/Setup-Kontext, weil es den Hover-Tooltip entfernt. Beide Bilder beweisen keine Konten oder USt-Einrichtung. Sie begruenden aber fachlich, warum vor VAT-Gruppen und Stammdaten zuerst eine minimale Kontenplan-Struktur geplant werden muss.

## Universaarl Kontenplan - SKR04 Bankkonto TARGET-026J

| Screenshot | Page | Company | Schritt | Was sieht man? | Intern bewiesen | Nicht bewiesen | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `target-026j-010-before-chart-of-accounts.png` | Kontenplan, Page 16 | `playthru` / `UNIVERSAARL-DE` | Vorheraufnahme | `1200 Bank Saarland` ist sichtbar, `1800` noch nicht | Die falsche Bankverwendung von `1200` ist als Ausgangslage sichtbar | kein Bankkonto `1800`, kein vollstaendiger Kontenplan, keine USt-/Posting-Gruppen | `universaarl-setup-before`, `wrong-bank-path` |
| `target-026j-020-after-account-attempt.png` | Kontenplan, Page 16 | `playthru` / `UNIVERSAARL-DE` | Nach kontrollierter Eingabe | `1200 Bank Saarland` und `1800 Bank Saarland`, beide `Bilanz`/`Buchung` | `1800` wurde in der Zielcompany sichtbar angelegt oder bestaetigt | keine VAT Posting Setup Zeile, kein Bankkonto-Stammsatz, keine Buchung | `universaarl-controlled-setup`, `skr04-bank-account-proof` |
| `target-026j-030-after-reopen-proof.png` | Kontenplan, Page 16 | `playthru` / `UNIVERSAARL-DE` | Reopen-Proof | `1800 Bank Saarland` bleibt nach erneutem Oeffnen sichtbar | Persistenz-/Reopen-Proof fuer `1800` als Bilanzkonto | keine fachliche Bereinigung von `1200`, kein vollstaendiger SKR04, keine USt-/Posting-Freigabe | `universaarl-reopen-proof`, `book-candidate` |

Screenshot-QA zu TARGET-026J: Das dritte Bild ist der beste Buchkandidat fuer den Bankkonto-Abschnitt im Kontenplan. Es zeigt aber auch die offene Altlast: `1200 Bank Saarland` ist sichtbar und darf nicht fuer Bank, Zahlung, VAT oder Posting Groups verwendet werden.

## Universaarl Kontenplan - SKR04 Vorsteuerkonto TARGET-026K

| Screenshot | Page | Company | Schritt | Was sieht man? | Intern bewiesen | Nicht bewiesen | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `target-026k-010-before-chart-of-accounts.png` | Kontenplan, Page 16 | `playthru` / `UNIVERSAARL-DE` | Idempotente Startaufnahme nach Re-Run | `1200 Bank Saarland`, `1406 Abziehbare Vorsteuer 19 Prozent` und `1800 Bank Saarland` | Der Kontenplan ist erreichbar; `1406` ist bereits sichtbar | kein Anlage-Vorherbild ohne `1406`, kein VAT Setup, keine Buchungsfaehigkeit | `universaarl-idempotent-start` |
| `target-026k-020-after-account-attempt.png` | Kontenplan, Page 16 | `playthru` / `UNIVERSAARL-DE` | Nach kontrollierter Existing-Account-Pruefung | `1406 Abziehbare Vorsteuer 19 Prozent` ist sichtbar, `Bilanz`, Kontoart `Buchung` | `1406` wurde in der Zielcompany sichtbar bestaetigt | keine VAT Posting Setup Zeile, keine Einkaufsbuchung, keine USt-Posten | `universaarl-controlled-setup`, `skr04-vat-account-proof` |
| `target-026k-030-after-reopen-proof.png` | Kontenplan, Page 16 | `playthru` / `UNIVERSAARL-DE` | Reopen-Proof | `1406` bleibt nach erneutem Oeffnen sichtbar; `1200` und `1800` sind ebenfalls sichtbar | Persistenz-/Reopen-Proof fuer `1406` als Bilanz-/Buchungskonto | keine fachliche Bereinigung von `1200`, kein vollstaendiger SKR04, keine USt-/Posting-Freigabe | `universaarl-reopen-proof`, `book-candidate` |

Screenshot-QA zu TARGET-026K: Das dritte Bild ist der beste Buchkandidat fuer den Vorsteuerkonto-Abschnitt. Es ist gross genug, zeigt die Spalten `Nr.`, `Name`, `GuV/Bilanz` und `Kontoart`, und macht zugleich die Grenze sichtbar: ein Sachkonto `1406` ist noch kein VAT Posting Setup und noch kein USt-Posten. Die aktuelle Evidence ist ein stabiler Sichtbarkeits-/Reopen-Nachweis; sie ist kein separates Vorherbild ohne `1406`.

## Universaarl Kontenplan - SKR04 Bilanzkonten TARGET-026L

| Screenshot | Page | Company | Schritt | Was sieht man? | Intern bewiesen | Nicht bewiesen | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `target-026l-3300-010-before-chart-of-accounts.png` | Kontenplan, Page 16 | `playthru` / `UNIVERSAARL-DE` | Vorheraufnahme 3300 | `1200`, `1406` und `1800` sind sichtbar; `3300` noch nicht | Ausgangslage fuer das Kreditoren-/Verbindlichkeitenkonto | kein Konto `3300`, keine Vendor Posting Group, keine Buchung | `universaarl-setup-before` |
| `target-026l-3300-030-after-reopen-proof.png` | Kontenplan, Page 16 | `playthru` / `UNIVERSAARL-DE` | Reopen-Proof 3300 | `3300 Verbindlichkeiten aus Lieferungen und Leistungen` ist sichtbar, `Bilanz`, Kontoart `Buchung` | Persistenz-/Reopen-Proof fuer `3300` als Bilanzkonto | keine Kreditorenbuchungsgruppe, keine Einkaufsrechnung, keine Posten | `universaarl-reopen-proof`, `book-candidate` |
| `target-026l-3806-010-before-chart-of-accounts.png` | Kontenplan, Page 16 | `playthru` / `UNIVERSAARL-DE` | Vorheraufnahme 3806 | `3300` ist bereits sichtbar; `3806` noch nicht | Ausgangslage fuer das Umsatzsteuerkonto | kein Konto `3806`, keine VAT Posting Setup Zeile | `universaarl-setup-before` |
| `target-026l-3806-030-after-reopen-proof.png` | Kontenplan, Page 16 | `playthru` / `UNIVERSAARL-DE` | Reopen-Proof 3806 | `3300` und `3806 Umsatzsteuer 19 Prozent` sind sichtbar, beide `Bilanz`/`Buchung` | Persistenz-/Reopen-Proof fuer `3806` als Bilanzkonto | kein Umsatzsteuer-Setup, keine USt-Posten, keine Buchung | `universaarl-reopen-proof`, `book-candidate` |

Screenshot-QA zu TARGET-026L: Die Reopen-Bilder sind lesbar und zeigen die entscheidenden Spalten `Nr.`, `Name`, `GuV/Bilanz` und `Kontoart`. `3300` und `3806` sind als Sachkonten sichtbar, aber die Bilder beweisen noch keine Buchungsgruppen, keine VAT Posting Setup Zeile und keine gebuchten Kreditoren- oder Umsatzsteuerposten. Die sichtbare Altlast `1200 Bank Saarland` bleibt fuer Bank, Payment, VAT und Posting Groups gesperrt.

## Universaarl Kontenplan - SKR04 GuV-Route TARGET-026M

| Screenshot | Page | Company | Schritt | Was sieht man? | Intern bewiesen | Nicht bewiesen | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `target-026m-4400-030-after-reopen-proof.png` | Kontenplan, Page 16 | `playthru` / `UNIVERSAARL-DE` | Reopen-Proof 4400 nach Recovery-Versuchen | `4400 Umsatzerloese Inland 19 Prozent` ist sichtbar, aber `GuV/Bilanz` steht weiter auf `Bilanz` | Das Konto existiert sichtbar in der Zielcompany; Screenshot-QA erkennt den falschen Kontotyp | kein GuV-Konto, keine Sales-Posting-Freigabe, keine Buchung | `blocked-wrong-account-type`, `do-not-use-as-success` |
| `target-026m-5400-030-after-reopen-proof.png` | Kontenplan, Page 16 | `playthru` / `UNIVERSAARL-DE` | Reopen-Proof 5400 nach Recovery-Versuchen | `5400 Wareneingang / Materialaufwand` ist sichtbar, aber `GuV/Bilanz` steht weiter auf `Bilanz` | Das Konto existiert sichtbar in der Zielcompany; Screenshot-QA erkennt den falschen Kontotyp | kein GuV-Konto, keine Purchase-/COGS-Posting-Freigabe, keine Buchung | `blocked-wrong-account-type`, `do-not-use-as-success` |

Screenshot-QA zu TARGET-026M: Die Bilder sind als Blockerbilder wertvoll, aber keine Buchkandidaten fuer eine fertige GuV-Kontenplan-Strecke. Sie zeigen genau den Fehler: `4400` und `5400` duerfen fachlich nicht als Bilanzkonten in die naechsten Setup-Schritte uebernommen werden. Vor VAT Setup, Posting Groups, Stammdaten oder Belegen muss `TARGET-026M-SKR04-GUV-ACCOUNT-ROUTE-RECOVERY` die Sachkontokarten-/Feldroute fuer `GuV/Bilanz` beweisen.

## Universaarl Kontenplan - SKR04 GuV-Route Recovery TARGET-026M

| Screenshot | Page | Company | Schritt | Was sieht man? | Intern bewiesen | Nicht bewiesen | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `target-026m-recovery-4400-030-card-after-field-attempt.png` | Sachkontokarte, Page 17 | `playthru` / `UNIVERSAARL-DE` | Card-Feldversuch 4400 | `4400 Umsatzerloese Inland 19 Prozent`, Feld `GuV/Bilanz` mit Wert `Bilanz` | Die gefilterte Karte ist im Zielkontext erreichbar; die sichtbare Feldroute persistiert nicht als GuV | kein GuV-Wert, keine Posting-Setup-Freigabe | `blocked-wrong-account-type`, `do-not-use-as-success` |
| `target-026m-recovery-4400-040-chart-reopen-proof.png` | Kontenplan, Page 16 | `playthru` / `UNIVERSAARL-DE` | Reopen-Proof 4400 | `4400` und `5400` sind sichtbar, beide weiterhin `Bilanz/Buchung` | Reopen-Wahrheit nach Card-Feldversuch | keine GuV-Korrektur, kein fertiger Kontenplan | `blocked-reopen-proof`, `do-not-use-as-success` |
| `target-026m-recovery-5400-030-card-after-field-attempt.png` | Sachkontokarte, Page 17 | `playthru` / `UNIVERSAARL-DE` | Card-Feldversuch 5400 | `5400 Wareneingang / Materialaufwand`, Feld `GuV/Bilanz` mit Wert `Bilanz` | Die gefilterte Karte ist im Zielkontext erreichbar; die sichtbare Feldroute persistiert nicht als GuV | kein GuV-Wert, keine Posting-Setup-Freigabe | `blocked-wrong-account-type`, `do-not-use-as-success` |
| `target-026m-recovery-5400-040-chart-reopen-proof.png` | Kontenplan, Page 16 | `playthru` / `UNIVERSAARL-DE` | Reopen-Proof 5400 | `4400` und `5400` sind sichtbar, beide weiterhin `Bilanz/Buchung` | Reopen-Wahrheit nach Card-Feldversuch | keine GuV-Korrektur, kein fertiger Kontenplan | `blocked-reopen-proof`, `do-not-use-as-success` |

Screenshot-QA zu TARGET-026M Recovery: Die Bilder korrigieren einen moeglichen False Positive in der Textauswertung. `GuV/Bilanz` ist hier nur die Feldbeschriftung; der sichtbare Feldwert bleibt `Bilanz`. Der naechste Lauf braucht Page Inspection oder eine source-backed Field-Control-Diagnose, bevor ein weiterer Schreibversuch sinnvoll ist.

## Universaarl Kontenplan - SKR04 GuV Page Inspection TARGET-026M

| Screenshot | Page | Company | Schritt | Was sieht man? | Interner Beweis | Beweist nicht | Status |
|---|---|---|---|---|---|---|---|
| `target-026m-pageinspection-4400-010-card-before.png` | Sachkontokarte, Page 17 | `playthru` / `UNIVERSAARL-DE` | 4400 vor technischer Pruefung | `4400 Umsatzerloese Inland 19 Prozent`, Feld `GuV/Bilanz` mit Wert `Bilanz`, Kontoart `Buchung` | Zielkonto ist in der Zielcompany auf der Sachkontokarte sichtbar; aktueller Kontotyp ist falsch fuer Verkaufserloese | keine GuV-Korrektur, keine VAT-/Posting-Setup-Freigabe | `diagnostic-before`, `do-not-use-as-success` |
| `target-026m-pageinspection-4400-020-page-inspection.png` | Sachkontokarte + Seitenueberpruefung | `playthru` / `UNIVERSAARL-DE` | 4400 Page Inspection | Rechts ist `Seitenueberpruefung` offen: Page `G/L Account Card (17, Card)`, Table `G/L Account (15)`, Field `Income/Balance (9, Option)` mit Wert `Bilanz` | Technische Page-/Table-/Field-Wahrheit fuer den naechsten kontrollierten Schreibversuch | kein geaenderter Wert, keine Buchung, kein finaler Buchbeweis | `field-truth`, `ready-for-safe-write-followup` |
| `target-026m-pageinspection-5400-010-card-before.png` | Sachkontokarte, Page 17 | `playthru` / `UNIVERSAARL-DE` | 5400 vor technischer Pruefung | `5400 Wareneingang / Materialaufwand`, Feld `GuV/Bilanz` mit Wert `Bilanz`, Kontoart `Buchung` | Zielkonto ist in der Zielcompany auf der Sachkontokarte sichtbar; aktueller Kontotyp ist falsch fuer Aufwand | keine GuV-Korrektur, keine VAT-/Posting-Setup-Freigabe | `diagnostic-before`, `do-not-use-as-success` |
| `target-026m-pageinspection-5400-020-page-inspection.png` | Sachkontokarte + Seitenueberpruefung | `playthru` / `UNIVERSAARL-DE` | 5400 Page Inspection | Rechts ist `Seitenueberpruefung` offen: Page `G/L Account Card (17, Card)`, Table `G/L Account (15)`, Field `Income/Balance (9, Option)` mit Wert `Bilanz` | Technische Page-/Table-/Field-Wahrheit fuer den naechsten kontrollierten Schreibversuch | kein geaenderter Wert, keine Buchung, kein finaler Buchbeweis | `field-truth`, `ready-for-safe-write-followup` |

Screenshot-QA zu TARGET-026M Page Inspection: Die Bilder sind gute technische Diagnosebilder. Sie sind keine Erfolgsscreenshots fuer einen fertigen SKR04-Kontenplan, weil beide Zielkonten weiter `Bilanz` zeigen. Der Buch-Lernwert ist: Page Inspection erklaert, welche BC-Page, Tabelle und welches Feld hinter einem sichtbaren Kartenfeld stehen.

## Universaarl Kontenplan - SKR04 GuV Safe Write TARGET-026M

| Screenshot | Page | Company | Schritt | Was sieht man? | Interner Beweis | Beweist nicht | Status |
|---|---|---|---|---|---|---|---|
| `target-026m-safe-write-4400-030-card-reopen-proof.png` | Sachkontokarte, Page 17 | `playthru` / `UNIVERSAARL-DE` | Karten-Reopen 4400 | `4400 Umsatzerloese Inland 19 Prozent`, Feld `GuV/Bilanz` mit Wert `GuV`, `Kontoart` = `Buchung` | 4400 wurde nach kontrolliertem Karten-Feldweg sichtbar als GuV-/Buchungskonto persistiert | kein vollstaendiger SKR04, keine VAT-/Posting-Setup-Freigabe, keine Buchung | `universaarl-reopen-proof`, `book-candidate` |
| `target-026m-safe-write-5400-030-card-reopen-proof.png` | Sachkontokarte, Page 17 | `playthru` / `UNIVERSAARL-DE` | Karten-Reopen 5400 | `5400 Wareneingang / Materialaufwand`, Feld `GuV/Bilanz` mit Wert `GuV`, `Kontoart` = `Buchung` | 5400 wurde nach kontrolliertem Karten-Feldweg sichtbar als GuV-/Buchungskonto persistiert | kein vollstaendiger SKR04, keine VAT-/Posting-Setup-Freigabe, keine Buchung | `universaarl-reopen-proof`, `book-candidate` |
| `target-026m-safe-write-090-chart-reopen-proof.png` | Kontenplan, Page 16 | `playthru` / `UNIVERSAARL-DE` | Kontenplan-Reopen | `4400` und `5400` stehen im Kontenplan sichtbar auf `GuV` und `Buchung`; Bilanzkonten wie `1406`, `3300`, `3806` bleiben `Bilanz` | Die GuV-Korrektur ist nicht nur auf der Karte, sondern auch in der Liste sichtbar | kein VAT Setup, keine Posting Groups, keine Stammdaten, keine Belege, keine Preview, keine Buchung | `universaarl-foundation-proof`, `book-candidate` |

Screenshot-QA zu TARGET-026M Safe Write: Die Bilder sind brauchbare Buchkandidaten fuer den Abschnitt "Sachkonten anlegen und Kontotyp pruefen". Sie zeigen, warum bei Optionsfeldern der sichtbare Feldwert zaehlt und nicht die Feldbeschriftung. Der naechste Buch-/Setup-Schritt darf trotzdem nur ein Kontenplan-Checkpoint sein, weil VAT Posting Setup, Posting Groups, Stammdaten und Buchungen noch nicht bewiesen sind.

## PREP-010 Screenshot-QA-Regel

Vor jeder Buch- oder Clickguide-Nutzung muss der Screenshot gegen die konkrete Behauptung geprueft werden:

- Zeigt das Bild den konkreten Button, Pfeil oder Menueintrag?
- Ist der relevante Code, Wert, Dialog oder Feldbereich lesbar?
- Ist der Zielzustand nach dem Klick sichtbar?
- Kann ein Anfaenger erkennen, welcher UI-Teil gemeint ist?
- Wurde ein falscher Klickpfad als `rejected-path` markiert?

Ein Screenshot, der nur den allgemeinen Page-Kontext oder einen DOM-/ARIA-Treffer stuetzt, bleibt Debugging-Evidence. Er darf nicht als Buchbeweis fuer einen konkreten Code, Button, Menueintrag, Wert oder erfolgreichen Schritt verwendet werden.
