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

Diese Screenshots gehoeren zur aktiven Zielwelt `playthru`, aber noch nicht zu einer final eingerichteten Zielcompany. `UNIVERSAARL-DE` existiert in diesen Evidence-Staenden noch nicht als nutzbarer Mandant. Sichtbarer `CRONUS DE`-Kontext ist deshalb Ausgangs-/Shell-Kontext, kein Universaarl-Finalbeweis.

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
