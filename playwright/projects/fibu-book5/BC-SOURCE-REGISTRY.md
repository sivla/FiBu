# Business Central Source Registry

Diese Registry ordnet Quellen fuer das Universaarl-Buch und den Autopilot. Sie entscheidet nicht, ob ein Prozess schon in `playthru` bewiesen ist. Sie sagt, welche Quelle fuer welche Art von Aussage verwendet werden darf.

## Quellenpyramide

| Tier | Quellenklasse | Nutzbar fuer | Nicht nutzbar fuer | Aktualitaetsregel |
| ---: | --- | --- | --- | --- |
| 0 | Eigene Universaarl-Evidence aus `playthru` / `UNIVERSAARL-DE` | konkrete UI-Schritte, sichtbare Felder, Screenshots, Result JSON, Entry-/Ledger-Spuren, Fehler, Preview-/Posting-Wirkung | allgemeine Microsoft-Produktversprechen, Rechtsauslegung ohne amtliche Quelle | bei jedem Buchpatch zum Prozess pruefen |
| 1 | Microsoft Learn Business Central Produktdokumentation | BC-Funktionen, Pages, Prozesse, Setup, Actions, Module | deutsche Rechts-, Steuer- oder GoBD-Claims | bei groesseren Buchpatches und UI-Abweichungen pruefen |
| 2 | Microsoft Release Plans / What's New | releaseabhaengige Funktionen, neue UI, geaenderte Features, Copilot/Agents, E-Documents | historische Standardfunktion allein | je Release Wave und bei neuen Features pruefen |
| 3 | Dynamics 365 Implementation Guide / Success by Design | Projektmethodik, Environment-Strategie, Teststrategie, UAT, Migration, Cutover, Governance | konkrete Feld-/Button-Behauptungen in BC | bei Architektur-, UAT- und Projektkapiteln pruefen |
| 4 | Amtliche deutsche/EU-Quellen | USt, Rechnung, E-Rechnung, GoBD, Aufbewahrung, Datenzugriff, Verfahrensdokumentation, EU-VAT | BC-UI-Bedienung | bei Rechtsstand und jedem Steuer-/Compliance-Kapitel pruefen |
| 5 | Microsoft Community / TechCommunity / Dynamics Community | Debugging-Hinweise, UI-Abweichungen, bekannte Fehlerbilder | finale Buchclaims, Rechts- oder Steuerclaims | nur mit Microsoft-/amtlicher Quelle oder eigener Evidence verwenden |
| 6 | Partner-Blogs, MVP-Blogs, YouTube, Foren | praktische Testideen, Hypothesen, Implementierungshinweise | Buchwahrheit, Rechts-/Steuerclaims, alleinige Best Practice | nur als Inspiration; danach validieren |

## Gepruefte Kernquellen

| Quelle | Tier | Bereich | Nutzbar fuer | Nicht nutzbar fuer | Claim-Regel | Status |
| --- | ---: | --- | --- | --- | --- | --- |
| Microsoft Learn: Create new companies in Business Central | 1 | Companies, Company Creation | Assisted-Setup-Route, Super-Berechtigung, neue Company als Prozess | Beweis, dass `UNIVERSAARL-DE` in `playthru` existiert | Produkt-/Setupclaim; UI-Claim braucht eigene Evidence | geprueft 2026-06-29 |
| Microsoft Learn: Overview of tasks to set up Business Central | 1 | Setup, Assisted Setup, Manual Setup | Reihenfolge und Kategorien fuer Grundsetup | konkreter Universaarl-Setupstand | Produkt-/Best-Practice-Claim plus Universaarl-Proof fuer Buchprozess | geprueft 2026-06-29 |
| Microsoft Learn: Company information overview | 1 | Company Information, Unternehmensdaten | Zweck und Einordnung der Company Information; Feld-/FastTab-Abhaengigkeit je Land/Region | konkrete sichtbare Universaarl-Felder, Pflichtfelder oder gespeicherte Werte | Produkt-/Setupclaim; konkrete Universaarl-Werte brauchen TARGET-COMPANY-INFO Evidence | geprueft 2026-06-30 |
| Microsoft Learn: Business functionality supported by Business Central | 1 | Modulabdeckung | Scope fuer Finance, Sales, Purchasing, Inventory, Warehouse, Service, Projects, Reporting | Nachweis, dass ein Universaarl-Prozess gelaufen ist | Produktclaim | geprueft 2026-06-29 |
| Microsoft Learn: Managing production and sandbox environments | 1 | Environments | Environment-Begriff, Admin-/Sandbox-Kontext | Company-spezifische Buchungsaussage | Produkt-/Adminclaim | geprueft 2026-06-29 |
| Microsoft Learn: Release plans for Dynamics 365 / Business Central | 2 | Release Wave | neue oder geaenderte Funktionen, releaseabhaengige UI | stabile Altbehauptung ohne BC-Doku | Release-Claim | geprueft 2026-06-29 |
| Microsoft Learn: What's New or Changed in Business Central | 2 | Version und Releasezyklus | Pruefung, ob ein Feature releaseabhaengig ist | Prozessnachweis | Release-Claim | geprueft 2026-06-29 |
| Microsoft Learn: Searching, sorting, and filtering data in Business Central | 1 | Look and Feel, Listen, Filter | Such-, Sortier- und Filterprinzipien, Filterausdruecke, `Filter list by`, `Filter totals by`, Reportfilter | Beweis, dass Universaarl-Daten existieren oder ein konkreter Filter im Zielmandanten funktioniert | Produkt-/UI-Claim; Universaarl-Beispiel braucht eigene Evidence | geprueft 2026-06-29 |
| Microsoft Learn: Analyze list page and query data using data analysis mode | 1 | Look and Feel, Analysis Mode | read-only Analysemodus, Gruppierung/Filterung/Summen auf Listen- oder Querydaten | Buchungs-, Posting- oder Reportfinalnachweis | Produkt-/UI-Claim; konkrete Universaarl-Auswertung braucht eigene Evidence | geprueft 2026-06-29 |
| Microsoft Learn: Personalize your workspace | 1 | Look and Feel, Debugging, Personalisierung | Felder, Spalten, Aktionen und Oberflaechenbereiche fuer den Benutzer sichtbar machen | Tabellenlogik, Buchungswirkung oder allgemeingueltige Sicht fuer alle Benutzer | Produkt-/UI-Claim; konkrete Universaarl-Personalisierung braucht eigene Evidence und Gate | geprueft 2026-06-30 |
| Microsoft Learn: Create number series | 1 | Number Series, No. Series Lines | Nummernseriencodes, Lines, Starting Date, Starting No., Ending No., Default Nos., Manual Nos., Allow Gaps, spaetere Setup-Zuweisung | konkrete Universaarl-Werte, persistierte Start-/Endnummern, deutsche Rechts-/Steuerfinalclaims | Produkt-/Setupclaim; Universaarl braucht TARGET-016I Write-Gate und spaetere Setup-/Beleg-Evidence | geprueft 2026-07-01, TARGET-036D2D |
| Microsoft Learn: View / set up chart of accounts | 1 | Chart of Accounts, G/L Accounts, Kontenplan | Kontenplan als Finanzkontenverzeichnis; Konten koennen in Business Central eingerichtet/geaendert werden | konkreter Universaarl-Kontenplan, SKR04-/Steuerberater-Finalitaet, USt-Kontenwirkung | Produkt-/Setupclaim; Universaarl braucht TARGET-026E Plan und spaeter UI-Reopen-/Posting-Evidence | geprueft 2026-06-30, TARGET-026D |
| Microsoft Learn: Set up value-added tax | 1 | VAT Setup, USt, Posting Setup | VAT Business Posting Groups, VAT Product Posting Groups, VAT Posting Setup als Produktstandard | deutsche Steuerrechtsbehauptung, konkrete Universaarl-19-Prozent-USt, Preview-/Posting-/VAT-Entry-Beweis | Produkt-/Setupclaim; Universaarl braucht TARGET-020 Kontext plus spaeter Setup-Fit, Preview und VAT Entries | geprueft 2026-06-30, TARGET-020 |
| Microsoft Learn: Work with dimensions | 1 | Dimensions, Global Dimensions, Shortcut Dimensions | Dimensionen, Dimensionswerte, globale Dimensionen und Shortcut-Dimensionen als Produktstandard; General Ledger Setup als globaler Dimensionskontext | konkreter Universaarl-Persistenzbeweis fuer `PRODUCTLINE`/`COSTCENTER`, Default Dimensions, Dimension Set Entries oder Reportingwirkung | Produkt-/Setupclaim; Universaarl braucht TARGET-024F Page-118-Reopen-Proof und spaeter Entry-/Reporting-Evidence | geprueft 2026-06-30, TARGET-024E |
| Microsoft Learn: Business intelligence and reporting | 1 | Reporting, Request Pages | Reporting-/BI-Bereich und Reportauswertung als Produktfunktion | konkrete Reportparameter oder Universaarl-Reportausgabe | Produktclaim; konkrete Request Page und Reportausgabe brauchen eigene Evidence | geprueft 2026-06-30 |
| Microsoft Learn: Dynamics 365 Implementation Guide overview | 3 | Implementierungsmethodik | Strategize, Initiate, Implement, Prepare, Operate | konkrete BC-Feldlogik | Best-Practice-/Projektclaim | geprueft 2026-06-29 |
| Microsoft Learn: Success by Design framework | 3 | Governance, Reviews, Projektrisiko | Projekt-, Test- und Architekturdenken | UI- oder Buchungsbeweis | Best-Practice-/Projektclaim | geprueft 2026-06-29 |
| Microsoft Learn: Process-focused solution | 3 | Prozessdesign | Business-Prozesse als Loesungsschnitt und Fit-to-standard-/Fit-gap-Denken | Beweis fuer konkrete BC-UI oder Universaarl-Prozesslauf | Best-Practice-/Projektclaim | geprueft 2026-06-30 |
| Microsoft Learn: Fit-to-standard and fit-gap analysis | 3 | Fit-to-standard, Fit-gap | Standardweg zuerst, Abweichungen bewusst bewerten, Gaps dokumentieren | Customizing-Freigabe ohne Evidence oder Risikobewertung | Best-Practice-/Projektclaim | geprueft 2026-06-30 |
| Microsoft Learn: Types of tests | 3 | Testarten | Unterschied zwischen Prozess-, End-to-End-, UAT- und weiteren Testtypen | bestandener Universaarl-UAT | Best-Practice-/Projektclaim | geprueft 2026-06-30 |
| Gesetze im Internet: UStG § 14 | 4 | Rechnung | Rechnungspflichtangaben und Rechnungsbegriff | BC-UI-Bedienung | Rechts-/Steuerclaim | geprueft 2026-06-29 |
| Gesetze im Internet: UStG § 14b | 4 | Aufbewahrung Rechnungen | Aufbewahrungspflicht fuer Rechnungen | BC-Archivierungsfeature ohne BC-Proof | Rechts-/Steuerclaim | geprueft 2026-06-29 |
| Gesetze im Internet: AO § 146 | 4 | Ordnung von Buchungen | Grundsatz einzeln, vollstaendig, richtig, zeitgerecht, geordnet | konkrete BC-Postenanzeige | Rechts-/GoBD-Claim | geprueft 2026-06-29 |
| Gesetze im Internet: AO § 147 | 4 | Aufbewahrung und Datenzugriff | Aufbewahrung, Datenzugriff, Pruefkontext | BC-Exportfunktion ohne Evidence | Rechts-/GoBD-Claim | geprueft 2026-06-29 |
| BMF: GoBD | 4 | elektronische Buchfuehrung, Datenzugriff | GoBD, Nachvollziehbarkeit, Aufbewahrung, Datenzugriff | BC-UI-Schritt | Rechts-/Compliance-Claim | geprueft 2026-06-29 |
| BMF: E-Rechnung FAQ / BMF-Schreiben | 4 | E-Rechnung | deutsche E-Rechnungspflichten, UStAE-Kontext | BC-E-Documents-UI ohne Evidence | Rechts-/Steuerclaim | geprueft 2026-06-29 |
| UStH/BMF zu § 14 | 4 | USt-Anwendung | Auslegungshilfe zu Rechnungen und innerbetrieblichem Kontrollverfahren | BC-Featureclaim | Rechts-/Steuerclaim | geprueft 2026-06-29 |
| EUR-Lex / EU VAT / EU E-Invoicing | 4 | EU-Recht | EU-VAT, Richtlinien, E-Invoicing-Rahmen | deutsche Umsetzung allein | EU-Rechtsclaim, nationale Umsetzung separat pruefen | needs-live-validation |
| Peppol / XRechnung / EN 16931 | 4 | E-Rechnung Standards | technische E-Rechnungsstandards | BC-E-Documents-Funktion ohne BC-Proof | Standard-/Compliance-Claim | needs-live-validation |
| Community/Blogs/YouTube | 5/6 | Debugging und Ideen | Hypothese fuer UI-Route, bekannter Fehler | finaler Buchclaim | nur nach Validierung | nur ergaenzend |

## Konkrete Entscheidung fuer Universaarl Company Creation

Fuer die Anlage von `UNIVERSAARL-DE` gibt es mehrere Einstiegspunkte, die im Buch getrennt erklaert werden sollen: `Mandanten` / Companies, der Company-Field-Lookup in `My Settings` und setupnahe Assisted-Setup-Kontexte. Der praktische Anfaengerpfad ist die Seite `Mandanten` mit `Neu` und dem Dropdown-Eintrag `Neues Unternehmen erstellen`. TARGET-007 zeigt den Pfeil neben `Neu` als Dropdown fuer Alternativen. TARGET-008/TARGET-009 zeigen, dass die sichtbare Route noch keinen gespeicherten Mandanten erzeugt hat, weil aktuell ausreichende Rechte fehlen. Das ist ein Berechtigungsblocker, kein fachlicher Beweis gegen diesen UI-Weg. `Kopieren`, CRONUS-Kopie und `Testunternehmen` bleiben fuer die finale Universaarl-Basis gesperrt, solange Datenwirkung und Demodatenfreiheit nicht belegt sind. Bis zur Rechtefreigabe arbeitet der Autopilot im PREP-/Read-only-Modus weiter.

## Permission-Parking-Regel

Company Creation ist bis zur Bestaetigung ausreichender Rechte geparkt. Produktclaims stammen aus Microsoft Learn; konkrete Universaarl-Existenz, Datenbasis und UI-Schritte brauchen nach der Rechtefreigabe eigene `playthru`-Evidence. Interne Details stehen in `PERMISSION-BLOCKERS.md`, `BC-MICROSOFT-LEARN-MAPPING.md` und `.agent/state/source_registry.json`.

## PREP-008 Claim-Gate-Matrix

Vor jedem neuen Universaarl-Buchtext wird die Aussage in einen dieser Gates eingeordnet. Ein Satz darf erst in den Buchmaster, wenn sein Gate erfuellt ist.

| Gate | Frage | Erlaubte Grundlage | Buchwirkung |
| --- | --- | --- | --- |
| Produktstandard | Beschreibt der Satz, was Business Central grundsaetzlich kann? | Microsoft Learn Business Central | als Produktbeschreibung erlaubt, aber nicht als Universaarl-Proof |
| Sichtbare UI | Beschreibt der Satz eine konkrete Seite, Action, Spalte, Tooltip oder einen Dialog? | eigene `playthru`-Evidence oder Atlas-Eintrag | als Klickanleitung erst nach Screenshot/Result |
| Aktueller Universaarl-Zustand | Behauptet der Satz, dass `UNIVERSAARL-DE` existiert, eingerichtet ist oder Daten enthaelt? | eigene Universaarl-Result-JSON plus Screenshot/State | vorher nicht in den Buchmaster als Fakt schreiben |
| Setup-Wirkung | Behauptet der Satz, dass ein Setup eine Buchungs-, Pflichtfeld- oder Prozesswirkung hat? | Microsoft Learn plus eigene Preview/Posting/Entry-Evidence | bis dahin nur als Plan oder Warnhinweis |
| Projekt-/UAT-Vorgehen | Beschreibt der Satz Testplan, Abnahme, Rollen, Cutover oder Governance? | Dynamics 365 Implementation Guide / Success by Design | als Vorgehen erlaubt, nicht als BC-Feld-/Buttonbeweis |
| Recht/Steuer/Compliance | Beschreibt der Satz USt, Rechnungspflicht, Aufbewahrung, GoBD oder E-Rechnungspflicht? | amtliche deutsche/EU-Quelle plus ggf. BC-Evidence fuer Umsetzung | nie allein aus BC oder Microsoft Learn ableiten |

## PREP-008 Quellenentscheidung fuer den geparkten Company-Creation-Pfad

Microsoft Learn stuetzt die Aussage, dass neue Companies ueber Business Central angelegt werden koennen und dass dafuer ausreichende Berechtigungen wie `SUPER` noetig sein koennen. Die vorhandene Universaarl-Evidence stuetzt nur die sichtbare Mandantenliste, den `Neu`-Splitbutton, den Eintrag `Neues Unternehmen erstellen` und den Berechtigungsblocker. Sie stuetzt noch nicht, dass `UNIVERSAARL-DE` gespeichert wurde oder welche Datenbasis die spaetere Company hat.

Fuer das Buch bedeutet das:

- Die Seite `Mandanten` und die Alternativen `Neu`, `Neues Unternehmen erstellen`, `Kopieren` und `Testunternehmen` duerfen erklaert werden, wenn sie als UI beobachtet wurden.
- `UNIVERSAARL-DE wurde angelegt` bleibt gesperrt, bis ein eigener `playthru`-Result mit sichtbarer Company vorliegt.
- `Blank`, `No Data`, `Setup Data Only`, `Production Setup Data` oder Sample-/Demo-Daten duerfen nicht vermischt werden. Die gewaehlte Datenbasis muss im spaeteren TARGET-Case sichtbar belegt werden.
- Implementation-Guide-Quellen helfen bei Testplan und UAT, ersetzen aber keine Companies-Page-Evidence.


## PREP-026 W0/W1 Quellenentscheidung

Die erste Universaarl-Welle wird nicht aus alten RM-/CRONUS-Laborbelegen abgeleitet. Fuer W0/W1 gilt:

- Microsoft Learn `Create new companies` stuetzt Company, Environment, SUPER-Permission, Template-Optionen und Copy Company als Produktstandard. Eigene Evidence bleibt Pflicht fuer `UNIVERSAARL-DE`, die sichtbare Mandantenliste und die gewaehlte Datenbasis.
- Microsoft Learn `Overview of tasks to set up Business Central` stuetzt Company Information, Assisted Setup, Manual Setup und die Setup-Kategorien. Eigene Evidence bleibt Pflicht fuer konkrete Universaarl-Felder und Setup-Vorher/Nachher.
- Microsoft Learn `Company information overview` stuetzt, dass Company Information pro Company gepflegt wird und dass sichtbare Felder/FastTabs je Land/Region variieren koennen. Eigene Evidence bleibt Pflicht fuer konkrete `UNIVERSAARL-DE`-Felder und gespeicherte Werte.
- Microsoft Learn `Create number series` stuetzt Nummernserien als Identifikations- und Audit-/Nachvollziehbarkeitsmechanismus. Eigene Evidence bleibt Pflicht fuer konkrete Universaarl-Serien und Belegnummern.
- Microsoft Learn `Posting group setup` stuetzt Kontenfindung ueber General/Special Posting Groups und General Posting Setup. Eigene Preview-/Posting-/Entry-Evidence bleibt Pflicht fuer konkrete Kontenwirkung.
- Microsoft Learn `Set up VAT` stuetzt VAT Business/Product Posting Groups und VAT Posting Setup. Deutsche 19-Prozent-USt bleibt zusaetzlich amtlich und durch Universaarl-VAT-Entries zu belegen.
- Microsoft Learn `Work with dimensions` stuetzt Dimensionen, Dimension Sets, Global/Shortcut Dimensions und Default Dimensions. Eigene Evidence bleibt Pflicht fuer Universaarl-Dimensionswerte und Dimension Set Entries.

Der naechste praktische Source-Nachfolger ist `PREP-031-COMPANIES-PAGE-READONLY-PLAYWRIGHT`, weil die Produktquellen nun klar trennen, was die spaetere Mandantenlisten-Evidence beweisen muss.

## TARGET-016H Nummernserien-Quellenentscheidung

Microsoft Learn `Create number series` stuetzt fuer TARGET-016H den BC-Standardpfad: Nummernserie oeffnen, `Neu` fuer einen Code nutzen, danach `Zeilen` oeffnen und dort die Line-Felder wie `Starting Date`, `Starting No.` und `Ending No.` pflegen. Die Quelle trennt ausserdem `Manual Nos.`, `Allow Gaps in Nos.` und die spaetere Zuweisung in Setup-Seiten wie `Sales & Receivables Setup`.

Fuer Universaarl folgt daraus:

- TARGET-016B bis TARGET-016G waren Diagnosepfade, aber kein vollstaendiger Standardpfad fuer Wertpersistenz.
- `Personalisieren` beweist Sichtbarkeit von Feldern/Spalten, aber nicht das Schreiben von `Startnr.`/`Endnr.`.
- Der naechste praktische Write-Gate darf nur den offiziellen Lines-Pfad testen: richtige `U-*` Nummernserie waehlen, `Zeilen`, `Neu`, `Startdatum`, `Startnr.`, `Endnr.`; danach Reopen-Proof.
- `Luecken in Nummern zulassen` bleibt default-locked und darf nicht als Nebeneffekt geaendert werden.
- Setup-Zuweisung an Sales/Purchase/Inventory bleibt bis nach sichtbarer Line-Persistenz gesperrt.

## TARGET-036D2D Kreditoren-Nummernroute

Microsoft Learn `Create number series` trennt die automatische Nummernvergabe ueber `Default Nos.` von der manuellen Nummerneingabe ueber `Manual Nos.`. TARGET-036D2C hat dazu in `UNIVERSAARL-DE` die technische Seitenpruefung auf Page `No. Series (456, List)` / Tabelle `No. Series (308)` fuer `U-VEND` erfasst: `Default Nos. (3, Boolean)` und `Manual Nos. (4, Boolean)`.

Fuer Universaarl folgt daraus:

- Der geplante erste Lieferant verwendet den lesbaren Code `U-VEND-100`.
- Dafuer ist als naechster enger Setup-Fit `Manual Nos. / Manuelle Anz.` fuer `U-VEND` sinnvoller als ein weiterer blinder `Standardnr.`-Versuch.
- `Standardnr. / Default Nos.` bleibt eine spaetere separate Entscheidung fuer automatische Kreditorennummern.
- TARGET-036D2E darf nur `U-VEND Manual Nos.` aendern, wenn Zeile und Feld vor dem Write eindeutig sichtbar/gemappt sind.
- Nach TARGET-036D2E zaehlt nur ein Reopen-Proof; Page Inspection allein beweist keine gespeicherte Checkbox.

## TARGET-024E Global-Dimensions-Quellenentscheidung

Microsoft Learn `Work with dimensions` stuetzt fuer TARGET-024E die Produktlogik: Globale Dimensionen gehoeren in den Kontext `General Ledger Setup` und dort in den Dimensionsbereich. Die bisher getestete Seite `Globale Dimensionen aendern...` bleibt ein Verarbeitungs-/Aenderungspfad, aber TARGET-024D hat nach Eingabe und `Starten` keinen gespeicherten Wert auf Page 118 bewiesen.

Fuer Universaarl folgt daraus:

- Die naechste Route ist nicht noch einmal Page 577 mit linker Combobox und `Starten`.
- Der naechste praktische Case muss Page 118 selbst behandeln: Dimensions-FastTab sichtbar machen, Feldnamen/Tooltips/Page Inspection pruefen, dann nur die exakt identifizierten Felder `Globaler Dimensionscode 1/2` setzen.
- Nach jeder Eingabe zaehlt erst das erneute Oeffnen von Page 118 als Persistenzbeweis.
- Masterdaten, Default Dimensions, Belege und Reporting bleiben gesperrt, bis `PRODUCTLINE` und `COSTCENTER` sichtbar gespeichert sind oder die globale Dimension bewusst geparkt wird.

## TARGET-026 VAT-Setup-Quellenentscheidung

Microsoft Learn `Set up VAT` stuetzt fuer TARGET-026 die Produktlogik: VAT Business Posting Groups beschreiben, mit wem gehandelt wird; VAT Product Posting Groups beschreiben, was gehandelt wird; VAT Posting Setup kombiniert beide Gruppen und enthaelt VAT %, VAT Calculation Type sowie G/L-Konten wie Sales VAT Account und Purchase VAT Account.

Fuer Universaarl folgt daraus:

- VAT Setup wird nicht sofort geschrieben.
- Geplante Zielcodes wie `INLAND` und `VAT19` bleiben Zielwerte, keine BC-Evidence.
- Vor einem VAT Posting Setup Write muessen Kontenplan und USt-Konto-Kandidaten sichtbar geprueft werden.
- Deutsche 19-Prozent-USt braucht zusaetzlich amtliche Quelle und spaeter Universaarl-Preview, VAT Entries und Sachposten.
- Naechster Case ist `TARGET-026B-CHART-OF-ACCOUNTS-VAT-ACCOUNT-PREFLIGHT`.

## TARGET-027B VAT-Write-Gate-Quellenentscheidung

Microsoft Learn `Set up VAT` stuetzt die Trennung zwischen MwSt.-Geschaeftsbuchungsgruppe, MwSt.-Produktbuchungsgruppe und MwSt.-Buchungsmatrix. Die amtliche USt-Quelle stuetzt den deutschen Regelsteuersatz als Rechtsgrundlage, ersetzt aber keinen Business-Central-Buchungsnachweis.

Fuer Universaarl folgt daraus:

- `INLAND` ist der source-backed Zielcode fuer die erste MwSt.-Geschaeftsbuchungsgruppe.
- `VAT19` ist der source-backed Zielcode fuer die erste MwSt.-Produktbuchungsgruppe.
- `INLAND` + `VAT19` wird erst nach sichtbarer Gruppenanlage als Matrixzeile vorbereitet.
- `19` Prozent ist ein Rechts-/Steuerzielwert, aber noch keine BC-VAT-Entry- oder Posting-Wahrheit.
- `3806` und `1406` sind sichtbare SKR04-orientierte Starterkonten, aber noch nicht als MwSt.-Buchungsmatrix-Konten bewiesen.
- Naechster Case ist `TARGET-027C-VAT-GROUPS-CONTROLLED-WRITE`; er darf noch keine Matrixzeile, keine Stammdaten, keine Preview und keine Buchung ausfuehren.

## TARGET-027D7 VAT-Matrix-Route-Entscheidung

Microsoft Learn bleibt fuer `TARGET-027D7` die fachliche Produktquelle: VAT Posting Setup kombiniert VAT Business Posting Group und VAT Product Posting Group und enthaelt VAT rate sowie VAT G/L accounts. Diese Quelle begruendet, warum die Universaarl-Zielzeile `INLAND` + `VAT19` fachlich `19`, Sales VAT Account `3806` und Purchase VAT Account `1406` braucht. Sie beweist aber nicht, dass diese Werte in `UNIVERSAARL-DE` bereits gespeichert sind.

Fuer Universaarl folgt daraus:

- `TARGET-027D8-VAT-MATRIX-LIST-EDIT-ACTION-ROUTE` ist der naechste bounded Execute-Case.
- Die sichtbare Page-472-Route `Weitere Optionen` / `Liste bearbeiten` wird zuerst als neuer Standard-UI-Weg geprueft.
- Werte duerfen erst geschrieben werden, wenn echte aktive Editoren fuer `MwSt. %`, `Umsatzsteuerkonto` und `Vorsteuerkonto` sichtbar/technisch belegt sind.
- D3/D5-Zellklick-, F2-, Enter- und Koordinatenrouten bleiben fuer `3806`/`1406` gesperrt.
- Cleanup/Delete bleibt Fallback und braucht eine eigene row-scoped Bestaetigungs-Evidence.
- Keine Preview, keine Buchung, keine Stammdaten und kein deutscher Finalclaim vor Universaarl-Reopen-Proof.

## TARGET-027D9 VAT-Matrix-Cleanup-Entscheidung

Microsoft Learn `Set up VAT` bleibt die Produktquelle fuer die fachliche Notwendigkeit der Kombination aus VAT Business Posting Group, VAT Product Posting Group, VAT %, Calculation Type und VAT G/L Accounts. Die Quelle sagt aber nicht, wie eine bereits falsch angelegte `UNIVERSAARL-DE`-Zeile sicher korrigiert oder geloescht wird. Diese UI-Wahrheit muss aus eigener Evidence kommen.

Fuer Universaarl folgt daraus:

- D3/D5/D8 sind fuer direkte Zell-/Listen-Edit-Routen gesperrt, weil sie `3806` und `1406` nicht als sichere aktive Editorwerte belegen.
- Eine zweite korrekte Matrixzeile mit denselben Gruppen ist voraussichtlich kein sauberer Standardweg, weil `INLAND` + `VAT19` die fachliche Kombination ist.
- Cleanup ist nur erlaubt, wenn zuerst row-scoped bewiesen wird, welche Zeile betroffen ist und ob Business Central einen Bestaetigungsdialog zeigt.
- Der naechste Execute-Case ist deshalb keine Loeschung, sondern `TARGET-027D10-VAT-MATRIX-ROW-ACTION-INVENTORY-NO-DELETE`.
- Master Data, Posting Groups, Preview Posting, Posting und finaler deutscher USt-Claim bleiben gesperrt.

## TARGET-027D12 VAT-Matrix kontrollierte Cleanup-Entscheidung

D12 nutzt keine neue externe Produktquelle. Die bestehende Microsoft-Learn-Basis stuetzt weiter nur die fachliche Struktur der VAT Posting Setup Kombination. Die Entscheidung fuer Cleanup entsteht aus Universaarl-Evidence:

- D4 beweist die unvollstaendige technische Wahrheit der Zeile.
- D8 sperrt die sichtbare Listen-/Cell-Edit-Route fuer `3806` und `1406`.
- D10 zeigt eine row-nahe `Loeschen`-Aktion ohne Delete-Effekt.
- D11 zeigt einen `Ja`/`Nein`-Dialog und beweist mit `Nein`, dass die Zeile bleibt.

Fuer Universaarl folgt daraus:

- `TARGET-027D13-VAT-MATRIX-CONTROLLED-CLEANUP-EXECUTION` ist der naechste eng begrenzte Execute-Case.
- D13 darf nur die unvollstaendige Zeile bereinigen und danach Zeilenabwesenheit beweisen.
- Neuerstellung/Vervollstaendigung der korrekten `INLAND` + `VAT19`-Zeile bleibt ein spaeterer separater Case.
- Keine Stammdaten, keine Preview, keine Buchung und kein finaler deutscher USt-Claim vor korrekter Matrix plus Buchungs-/Postennachweis.

## TARGET-027D13 VAT-Matrix Cleanup-Wirkungspruefung

D13 nutzt keine neue externe Produktquelle. Die neue Wahrheit stammt aus Universaarl-UI-Evidence: Der erwartete Delete-Dialog wurde nach Zielzeilenfokus bestaetigt, aber der Nachher-Reopen zeigte die `INLAND` + `VAT19`-Zeile weiterhin sichtbar.

Fuer Universaarl folgt daraus:

- Dialogtext und `Ja`-Klick beweisen nur, dass eine gefaehrliche Aktion angeboten und bestaetigt wurde.
- Ein Setup-Cleanup ist erst bewiesen, wenn der exakte Ziel-Datensatz nach Reopen fehlt.
- Die getestete toolbar-/More-Options-Delete-Route ist fuer diese Zeile blockiert und darf nicht blind wiederholt werden.
- Der naechste Execute-Case ist `TARGET-027D13C-VAT-MATRIX-ROW-INLINE-MENU-CLEANUP-ROUTE`.
- Keine Stammdaten, keine Preview, keine Buchung und kein finaler deutscher USt-Claim vor korrekter Matrix plus Buchungs-/Postennachweis.

## TARGET-027D13C VAT-Matrix Row-Inline Cleanup

D13C nutzt keine neue externe Produktquelle. Die neue Wahrheit stammt aus Universaarl-UI-Evidence: Die Zeilen-Ellipsis direkt an der `INLAND`/`VAT19`-Zeile fuehrte in denselben erwarteten Dialog, aber diesmal ist die Zielzeile nach Reopen nicht mehr sichtbar.

Fuer Universaarl folgt daraus:

- Row-Inline-Menues koennen fachlich praeziser sein als toolbar-/More-Options-Aktionen.
- Der falsche partielle `INLAND` + `VAT19`-Datensatz ist bereinigt.
- Die Bereinigung ist kein USt-Setup-Erfolg; es fehlt jetzt eine korrekte Matrixzeile.
- Der naechste Execute-Case ist `TARGET-027D14-VAT-MATRIX-RECREATE-AFTER-CLEANUP`.
- Keine Stammdaten, keine Preview, keine Buchung und kein finaler deutscher USt-Claim vor korrekter Matrix plus Buchungs-/Postennachweis.

## TARGET-027D14 VAT-Matrix Recreate After Cleanup

D14 nutzt keine neue externe Produktquelle. Die neue Wahrheit stammt aus Universaarl-UI-Evidence: Nach `Liste bearbeiten` und `Neu` kann Page 472 eine transiente neue Zeile anzeigen, aber der erste fachliche Pflichtwert `INLAND` erhielt keinen nachweisbaren aktiven Editor. Der Lauf stoppte deshalb vor jeder Werteingabe.

Fuer Universaarl folgt daraus:

- Die alte falsche Zielzeile bleibt nach D13C bereinigt; D14 hat keine neue Zielzeile persistiert.
- Eine sichtbare leere/default-artige Grid-Zeile ist kein Setup-Erfolg.
- `INLAND`, `VAT19`, `19`, `3806` und `1406` duerfen erst geschrieben werden, wenn echte Feld-/Karten-/Editorcontrols bewiesen sind.
- Der naechste Case ist `TARGET-027D15-VAT-MATRIX-RECREATE-ROUTE-DIAGNOSIS`.
- Keine Stammdaten, keine Preview, keine Buchung und kein finaler deutscher USt-Claim vor korrekter Matrix plus Buchungs-/Postennachweis.

## TARGET-027D15 VAT-Matrix Recreate Route Diagnosis

D15 nutzt keine neue externe Produktquelle. Die neue Wahrheit stammt aus Universaarl-UI-Evidence und Page Inspection: Die transiente Page-472-Zeile gehoert technisch zu `VAT Posting Setup (472, List)` und Tabelle `VAT Posting Setup (325)`. Die Felder fuer VAT Business Posting Group, VAT Product Posting Group, VAT %, Sales VAT Account und Purchase VAT Account sind in der Seitenueberpruefung sichtbar, aber leer. `Bearbeiten` hat keine sichere Kartenroute erzeugt.

Fuer Universaarl folgt daraus:

- Page Inspection ist der richtige technische Nachweis fuer Page, Table und Feldnamen.
- D15 ist keine Setup-Aenderung und kein USt-Erfolg.
- Der naechste Schritt muss lokal entscheiden, welche konkrete Nicht-Wiederholungsroute vertretbar ist.
- Der naechste Case ist `TARGET-027D16-VAT-MATRIX-RECREATE-CARD-OR-INSPECTION-ROUTE-DECISION`.

## TARGET-027D16 VAT-Matrix Route Decision

D16 prueft die bestehende Microsoft-Learn-Quelle `Set up value-added tax` erneut und nutzt zusaetzlich die Microsoft-Learn-Objektquelle zu Tabelle `VAT Posting Setup`. Die Produktquelle bestaetigt die fachliche Struktur: Business Central kombiniert VAT Business Posting Groups und VAT Product Posting Groups in der VAT Posting Setup Matrix und hinterlegt dort Steuersatz und G/L-Konten. Die Objektquelle bestaetigt die technischen Feldnamen der Tabelle 325, unter anderem `VAT Bus. Posting Group`, `VAT Prod. Posting Group`, `VAT %`, `Sales VAT Account` und `Purchase VAT Account`.

Fuer Universaarl folgt daraus:

- D14/D15 reichen nicht fuer einen Schreibversuch, weil sie keine sichere Feld-/Auswahlroute beweisen.
- `Bearbeiten` bleibt fuer Page 472 aktuell eine Listen-/Grid-Oberflaeche, keine Kartenroute.
- Page Inspection ist Feld- und Tabellenwahrheit, aber kein Schreibweg.
- Der naechste nicht wiederholende Pfad ist `TARGET-027D17-VAT-MATRIX-FIRST-FIELDS-LOOKUP-DISCOVERY`: zuerst pruefen, ob die ersten beiden Pflichtfelder sichere Lookup-/Detail-/Select-Controls haben.
- Eine kuenftige Matrix-Schreibung ist erst vertretbar, wenn D17 echte Controls, Stopbedingungen und Reopen-Proof liefert.
- Keine Stammdaten, keine Preview, keine Buchung und kein finaler deutscher USt-Claim vor korrekter Matrix plus Buchungs-/Postennachweis.

## TARGET-027D17 VAT-Matrix Lookup Discovery

D17 nutzt keine neue externe Produktquelle. Die neue Wahrheit stammt aus Universaarl-UI-Evidence: Page 472 blieb in `playthru` / `UNIVERSAARL-DE`; nach `Liste bearbeiten` und `Neu` wurde die erste Kandidatenzelle per Hover, Klick und `Alt+ArrowDown` no-write geprueft. Es erschien kein sicherer Listbox-/Dialog-/Select-Kontext fuer die ersten Pflichtfelder. Nach Reopen war keine `INLAND`/`VAT19`-Zeile sichtbar.

Fuer Universaarl folgt daraus:

- D17 beweist keinen Setup-Erfolg, sondern einen gesperrten Page-472-Gridpfad.
- `Alt+ArrowDown` und erster Pflichtfeld-Klick duerfen nicht nochmals als neue Route gelten.
- Die naechste Entscheidung muss eine Standardroute ausserhalb dieses fragilen Gridpfads pruefen, zum Beispiel quellenbasiert ueber Setup-/Import-/Konfigurationspaket-Optionen oder eine andere von Microsoft dokumentierte UI-Route.
- Diese Alternative darf kein API-Shortcut werden und darf keine Matrixwerte schreiben, bevor der neue Pfad als Case mit Gates, Evidence und Reopen-Proof beschrieben ist.
- Der naechste Case ist `TARGET-027D18-VAT-MATRIX-NON-UI-SETUP-ROUTE-DECISION`.

## TARGET-027D18 VAT-Matrix Non-UI Setup Route Decision

D18 nutzt Microsoft Learn als Quellenbasis fuer eine andere Standardroute: Die Dokumentation zu Company Configuration Packages nennt Setup-Tabellen wie `VAT Posting Setup` als moeglichen Inhalt eines Konfigurationspakets. Die Import-Dokumentation beschreibt den Arbeitsweg ueber Konfigurationspakete mit Excel-Export, Import, Validierung und Anwendung. Das ist Standard-Business-Central-Funktionalitaet, aber fortgeschritten und potentiell wirksam.

Fuer Universaarl folgt daraus:

- Page-472-Gridtyping, erster Pflichtfeld-Klick und `Alt+ArrowDown` sind nach D14-D17 geparkt.
- Die naechste Route ist `TARGET-027D19-VAT-MATRIX-CONFIG-PACKAGE-READONLY-DISCOVERY`.
- D19 darf nur die Configuration-Packages-UI lesen und fotografieren.
- `Import`, `Export`, `Validate`, `Apply`, `Edit in Excel` und Publish bleiben gesperrt, bis ein spaeterer Case sie ausdruecklich mit Gates, Screenshot-QA und Reopen-Proof freigibt.
- Das ist kein API-Shortcut und kein deutscher USt-Finalbeweis.

## TARGET-027D19 Configuration Packages Read-only Discovery

D19 prueft die in D18 gewaehlte Standardroute in der Universaarl-UI. Page `8615` / `Konfigurationspakete` ist in `playthru` / `UNIVERSAARL-DE` direkt erreichbar. Die Seite zeigt Paketaktionen wie `Neu`, `Paket importieren...`, `Paket exportieren...` und `Tabellen abrufen...`; diese Aktionen wurden nur inventarisiert und nicht geklickt.

Fuer Universaarl folgt daraus:

- Die Konfigurationspaket-Seite ist als UI-Kontext bewiesen.
- Table `325` / `VAT Posting Setup` ist im leeren read-only Listenbild nicht sichtbar.
- Eine weitere Discovery wuerde wahrscheinlich Paketmetadaten oder Tabellenzuordnung beruehren und braucht deshalb einen separaten Smart-Decision-Case.
- Die Info-Kachel unten links darf als Hilfetext gelesen werden; sie ist kein Dialog und kein Beleg fuer ausgefuehrte Import-/Exportaktionen.
- Der naechste Case ist `TARGET-027D20-VAT-MATRIX-CONFIG-PACKAGE-TABLE-325-ROUTE-DECISION`.
- Kein API-Shortcut, keine Excel-Publish-Route, kein Import/Export/Validate/Apply und kein deutscher USt-Finalbeweis.

## TARGET-027D20 Configuration Package Table-325 Route Decision

D20 nutzt erneut Microsoft Learn zu Company Configuration Packages und VAT Setup. Die Quellen stuetzen, dass Konfigurationspakete ein Standardweg fuer Setup-/Tabellendaten sein koennen und dass VAT Posting Setup fachlich aus VAT Business Posting Group, VAT Product Posting Group, VAT %, Calculation Type und Steuerkonten besteht. Gleichzeitig machen die Quellen klar, dass Import, Export, Validate, Apply und Excel-/Publish-Routen wirksame Datenpfade sind und nicht als harmlose UI-Navigation behandelt werden duerfen.

Fuer Universaarl folgt daraus:

- Die VAT-Matrix wird nicht geparkt, weil sie Posting Groups, Stammdaten und erste Buchungsfaelle blockiert.
- Der naechste Case ist `TARGET-027D21-VAT-MATRIX-CONTROLLED-PACKAGE-TABLE-DISCOVERY`.
- D21 darf nur eine eng begrenzte Paket-/Tabellen-Metadaten-Discovery versuchen, um Table `325` / `VAT Posting Setup` sichtbar zu machen.
- D21 darf keine VAT-Matrixwerte schreiben und darf kein Paket importieren, exportieren, validieren, anwenden oder per Excel veroeffentlichen.
- Eine Paket-/Tabellen-Metadatenzeile ist noch kein USt-Setup-Erfolg. Erfolg ist nur: Table 325/Feldkontext sichtbar oder sauber blockiert, mit Screenshot-QA und Cleanup-/Keep-Entscheidung.

## TARGET-027D21 Configuration Package Metadata Discovery

D21 nutzt keine neue externe Quelle. Die bestehende Microsoft-Learn-Basis bleibt gueltig: Configuration Packages sind ein Standardmechanismus fuer Setup-/Tabellendaten, aber Import, Export, Validate, Apply und Excel-Pfade koennen wirksam werden. Die neue Wahrheit stammt aus Universaarl-UI-Evidence:

- `U-VAT325-DISC` / `VAT 325 Discovery` ist als temporaere Paketmetadaten sichtbar.
- Der sichtbare Text `325` im Paketcode ist kein Table-325-Beweis.
- Die aktive Paketkarte kann nach `Neu` einen leeren/zweiten Kontext zeigen, waehrend die bestehende Paketzeile im Hintergrund sichtbar ist.
- Die Paketkarte zeigt weiterhin wirksame Aktionen wie Paket uebernehmen, Paket pruefen, Excel-Import/Export und Tabellen abrufen.
- Deshalb ist D21 blockiert, bevor `Tabellen-ID 325` geschrieben oder eine Aktion bestaetigt wird.
- Der naechste Case ist `TARGET-027D22-VAT-MATRIX-PACKAGE-ROUTE-PARK-OR-CLEANUP-DECISION`.

## TARGET-027D22 Konfigurationspaket-Route geparkt

D22 nutzt keine neue externe Quelle, sondern bewertet die D21-UI-Evidence gegen die bereits registrierten Microsoft-Learn-Grenzen zu VAT Setup und Company Configuration Packages. Ergebnis: `U-VAT325-DISC` ist nur temporaere Konfigurationspaket-Metadaten. Es ist kein Table-325-Beweis, keine USt-Matrix und keine Grundlage fuer Posting Groups oder Stammdaten.

Fuer Universaarl folgt daraus:

- Die Konfigurationspaket-Route wird geparkt.
- Der naechste sinnvolle Schritt ist exact-code Cleanup von `U-VAT325-DISC`.
- Cleanup darf nur den exakten Paketcode betreffen und muss bei Mehrdeutigkeit blockieren.
- Danach braucht die USt-Matrix eine neue Standardroute oder eine bewusst dokumentierte Parkentscheidung.

## TARGET-026D Kontenplan-Quellenentscheidung

TARGET-026B zeigt in `UNIVERSAARL-DE` einen erreichbaren, aber leeren/insufficient Kontenplan ohne sichtbare USt-Konto-Kandidaten. Microsoft Learn `View the chart of accounts` und `Set up or change the chart of accounts` stuetzen die Produktlogik: Der Kontenplan ist das Verzeichnis der Finanzkonten und kann fuer die Company eingerichtet/geaendert werden.

Fuer Universaarl folgt daraus:

- VAT Setup und erste Stammdatenanlage bleiben gesperrt, bis eine minimale Kontenstruktur geplant und danach kontrolliert eingerichtet oder sichtbar bestaetigt ist.
- Der leere Kontenplan ist kein deutscher Finalnachweis, sondern Foundation-Evidence.
- Naechster Case ist `TARGET-026E-CHART-OF-ACCOUNTS-MINIMAL-STRUCTURE-PLAN`.

## PREP-027 Implementation-Guide-Quellenentscheidung

Success by Design, Process-focused solution, Fit-to-standard/Fit-gap, Testing Strategy, Create a test plan und Types of tests stuetzen nur Projekt-, Prozess- und Teststruktur. Fuer Universaarl bedeutet das:

- Der Full-Playthrough-Katalog bleibt prozessorientiert und wird nicht nach Menues allein sortiert.
- Standard-BC-Pfade werden zuerst geprueft; Abweichungen brauchen Grund, Risiko, Alternative und Test.
- Read-only UI-Probes, Prozess-Tests, End-to-End-Tests und UAT werden getrennt klassifiziert.
- Ein UAT-Fall braucht Scope, Rolle, Daten, erwartetes Ergebnis, tatsaechliches Ergebnis und Status.
- Keine dieser Quellen beweist, dass `UNIVERSAARL-DE` existiert, eingerichtet ist oder einen Prozess erfolgreich gebucht hat.

Die operative Zuordnung steht in `UNIVERSAARL-IMPLEMENTATION-GUIDE-MAPPING.md`. Der naechste Case ist `PREP-028-TESTING-STRATEGY-AND-UAT-MATRIX`.

## TARGET-027D24 VAT-Matrix Parkgrenze und Posting-Groups-Preflight

D24 nutzt Microsoft Learn erneut als Produktgrenze: `Set up VAT` trennt VAT Business Posting Groups, VAT Product Posting Groups und VAT Posting Setup; `Posting group setup` beschreibt Posting Groups als Kontenfindungsmechanismus fuer Entitaeten und Belege; `Set Up Company Configuration Packages` zeigt, dass Konfigurationspakete Setup-Tabellen wie VAT Posting Setup enthalten koennen, aber Import/Export/Validate/Apply wirksame Datenpfade sind.

Die Universaarl-Evidence D14-D23B zeigt keinen sicheren Standardweg, der eine korrekte `INLAND` + `VAT19`-Matrixzeile schreibt. D24 parkt deshalb die VAT-Matrix als `parked-blocked-not-proven` und waehlt `TARGET-028-POSTING-GROUPS-PREFLIGHT` als naechsten read-only Schritt.

- Das ist kein USt-Setup-Erfolg und kein deutscher 19-Prozent-Finalbeweis.
- `TARGET-028` darf Posting-Group-Seiten nur read-only revalidieren.
- Posting Groups, Stammdaten, Preview Posting und Posting bleiben bis zu eigenen Cases gesperrt.

## TARGET-031A SKR04 Forderungskonto-Korrektur

TARGET-031 hat Page 16 und Page 110 read-only geoeffnet und damit gezeigt: `1200` ist in `UNIVERSAARL-DE` sichtbar, aber als `Bank Saarland` benannt. `1400 Forderungen aus Lieferungen und Leistungen` ist nicht sichtbar. Der nachgelagerte Quellencheck korrigiert die naechste Aktion:

- Fuer die SKR04-orientierte Universaarl-Struktur ist `1200 Forderungen aus Lieferungen und Leistungen` der Forderungsanker.
- `1400` darf nicht als neues SKR04-Forderungskonto angelegt werden; das waere eine Vermischung mit SKR03-/Falschmapping-Sprache.
- `1406` bleibt Vorsteuer und darf nicht als Debitorensammelkonto verwendet werden.
- TARGET-031A muss deshalb `1200` korrigieren oder sichtbar bestaetigen: Name `Forderungen aus Lieferungen und Leistungen`, `Bilanz`, Kontoart `Buchung`, Reopen-Proof.
- Erst danach darf ein separater Customer-Posting-Group-Write-Gate Page 110 beschreiben.

TARGET-031A hat diesen Schritt in `playthru` / `UNIVERSAARL-DE` ausgefuehrt. Nach Reopen zeigt der Kontenplan `1200 Forderungen aus Lieferungen und Leistungen`, `Bilanz`, Kontoart `Buchung`. `1800 Bank Saarland` bleibt als separates Bankkonto sichtbar. Damit ist nur das Forderungskonto als Voraussetzung fuer die Debitorenbuchungsgruppe bewiesen. Nicht bewiesen sind Debitorenbuchungsgruppe, Buchungsmatrix, USt-Setup, Stammdaten, Preview Posting, Buchung oder steuerliche Finalkorrektheit.

## TARGET-036 First Master-Data Write Source Decision

Microsoft Learn trennt die Anlage von Kunden, Lieferanten, Artikeln und Lagerorten fachlich:

- Debitoren/Kunden koennen beim Anlegen mit Customer Templates vorbelegt werden.
- Kreditoren/Lieferanten koennen beim Anlegen mit Vendor Templates vorbelegt werden.
- Artikel koennen beim Anlegen mit Item Templates und lager-/buchungsrelevanten Feldern vorbelegt werden.
- Lagerorte beschreiben Orte, an denen Bestand gekauft, gelagert, bewegt und spaeter in Beleg-/Artikelzeilen verwendet wird.

TARGET-035 hat in `playthru` / `UNIVERSAARL-DE` die leeren Listen fuer Debitoren, Kreditoren, Artikel und Lagerorte nur lesend gezeigt. TARGET-036 entscheidet deshalb:

- Erster kontrollierter Write wird ein einfacher Lagerort `SAAR-HL` / `Saarbruecken Hauptlager`.
- Erlaubt sind im naechsten Case nur `Location.Code` und `Location.Name`.
- Debitoren, Kreditoren und Artikel bleiben bis zur Template-/Pflichtfeld-Discovery gesperrt.
- Warehouse-Felder, Posting Setup, USt, Belege, Preview Posting und Posting bleiben gesperrt.

Diese Entscheidung ist ein Produkt-/UI-Quellenclaim plus Universaarl-Evidence-Grenze. Sie beweist noch keinen gespeicherten Lagerort und keine Buchungsfaehigkeit.

## TARGET-031B Debitorenbuchungsgruppe INLAND

TARGET-031B hat Page 110 `Debitorenbuchungsgruppen` in `playthru` / `UNIVERSAARL-DE` genutzt. Die Gruppe `INLAND` ist nach Reopen sichtbar mit Beschreibung `Inlaendische Kunden` und `Debitorensammelkonto 1200`.

- Der sichtbare deutsche Feldname ist `Debitorensammelkonto`.
- `Neu` oeffnete in diesem Lauf eine Karte, nicht nur eine direkte neue Listenzeile.
- Der Screenshot nach Reopen ist der Buchkandidat, weil er die Spalte `Debitorensammelkonto` sichtbar zeigt.
- Bewiesen ist nur die Debitorenbuchungsgruppe als Forderungs-Kontenfindung.
- Nicht bewiesen sind Buchungsmatrix, USt-Setup, Stammdaten, Verkaufsbelege, Preview Posting, Buchung, Sachposten oder steuerliche Finalkorrektheit.

## TARGET-032 Allgemeine Buchungsmatrix-Entscheidung

Microsoft Learn trennt die allgemeine Kontenfindung in mehrere Ebenen:

- Die Finanzuebersicht beschreibt Standard-Buchungsgruppen als Mechanismus, um Standard-Sachkonten fuer Kunden, Lieferanten und Artikel effizient zuzuordnen.
- `Gen. Business Posting Group` enthaelt u. a. `Code`, `Description` und eine optionale Default-VAT-Business-Posting-Group.
- `Gen. Product Posting Group` enthaelt u. a. `Code`, `Description` und eine optionale Default-VAT-Product-Posting-Group.
- `General Posting Setup` kombiniert `Gen. Bus. Posting Group` und `Gen. Prod. Posting Group` mit Kontenfeldern wie `Sales Account` und `Purch. Account`.
- Die deutsche Seite zum Bericht `G/L Setup Information` trennt `Posting Groups`, `Posting Matrix` und `VAT Setup` als pruefbare Setupbereiche.

Fuer Universaarl folgt daraus: Page 314 darf nicht direkt breit geschrieben werden. Vorher muessen Page 312, Page 313 und Page 314 read-only/source-backed geprueft werden. Kandidaten fuer den ersten Warenfall sind `INLAND` als Geschaeftsbuchungsgruppe, `WAREN` als Produktbuchungsgruppe, `4400` als Verkaufskonto und `5400` als Einkaufskonto. Diese Werte sind noch keine gespeicherte Buchungsmatrix, kein Preview-Beweis und keine Buchungsfaehigkeit.

## TARGET-032E General Posting Setup Alternativroute abgelehnt

TARGET-032E prueft die Microsoft-Learn-Aussage, dass General Posting Setup Kombinationen fachlich als Zeilen bzw. einzelne Setup-Kontexte gepflegt werden koennen, gegen die sichtbare Universaarl-Oberflaeche. Das Ergebnis ist eine Grenze, kein Setup-Erfolg:

- `Weitere Optionen` erweitert die Befehlsleiste, zeigt aber keinen belastbaren Karten-/Oeffnen-Pfad fuer die Zielzeile.
- `Ctrl+Alt+F1` liefert in diesem Lauf keinen stabilen technischen Page-314-Nachweis.
- Direkte Page `315` ist sichtbar `MwSt.-Posten` / VAT Entries und wird als General-Posting-Setup-Kartenroute verworfen.
- Die Kombination `INLAND` + `WAREN` mit `4400` und `5400` ist weiterhin nicht gespeichert bewiesen.

Fuer Universaarl folgt daraus: Der naechste Schritt ist keine weitere Wiederholung von `Neu`, `Liste bearbeiten`, `Strg+Einfuegen` oder Page `315`, sondern eine bewusste Park-/Source-Route-Entscheidung.

## TARGET-032F General Posting Setup Park-Entscheidung

TARGET-032F parkt die Page-314-Schreibroute fuer die Kombination `INLAND` + `WAREN` mit `4400` und `5400`. Die Park-Entscheidung ist kein Setup-Erfolg. Sie bedeutet:

- `INLAND` und `WAREN` bleiben als einzelne Buchungsgruppen bewiesene Voraussetzungen.
- Die gespeicherte `General Posting Setup`-/Buchungsmatrixzeile ist nicht bewiesen.
- Page `315` bleibt als Route verworfen, weil sie `MwSt.-Posten` / VAT Entries zeigt.
- Es darf keine Posting-Readiness, kein Preview-Posting und keine Sachpostenwirkung aus diesem Stand abgeleitet werden.

Fuer Universaarl folgt daraus: Ein spaeterer General-Posting-Setup-Schreibfall braucht eine neue, belastbare Route. Bis dahin duerfen andere W1-Grundlagen wie Dimensionen nur mit dieser Grenze weiterlaufen.

## TARGET-036D2G U-VEND Manual Nos Quellenentscheidung

Microsoft Learn beschreibt `No. Series` als Standardseite fuer Nummernserien und nennt `Lines` als Route fuer die eigentlichen Nummernserienzeilen. Dieselbe Produktdokumentation nutzt `Manual Nos.` als Checkbox auf der `No. Series`-Seite, wenn man manuelle Nummern zulassen muss. Fuer Universaarl folgt daraus:

- `Manual Nos.` ist der fachlich richtige Schalter fuer eine lesbare manuelle Kreditorennummer wie `U-VEND-100`.
- Die Quelle ersetzt keinen UI-Beweis. In `TARGET-036D2G` blieb der Schreibweg blockiert, weil die Zeile `U-VEND` und die Checkbox `Manual Nos.` nicht eindeutig genug als ein row-scoped Playwright-Ziel verbunden waren.
- Vor der ersten Kreditorenanlage bleibt `U-VEND` deshalb gesperrt, bis Page Inspection, ein verbesserter Helper oder eine bewusst dokumentierte Park-Entscheidung den Weg klaert.

## TARGET-045 Debitor-/Artikel-Feldfit vor O2C

TARGET-045 nutzt keine neue Business-Central-Ausfuehrung. Die Entscheidung verknuepft vorhandene Universaarl-Evidence mit den Microsoft-Learn-Grenzen zu Posting Groups und VAT Setup:

- Microsoft Learn `Posting group setup` stuetzt die Produktlogik, dass Buchungsgruppen Kunden, Lieferanten, Artikel und Belege mit Sachkonten verbinden.
- Microsoft Learn `Set up VAT` stuetzt die Produktlogik, dass VAT Business Posting Group, VAT Product Posting Group und VAT Posting Setup gemeinsam die USt-Berechnung und USt-Konten bestimmen.
- TARGET-031B beweist `INLAND` als Debitorenbuchungsgruppe mit Sammelkonto `1200`.
- TARGET-032B beweist `INLAND` und `WAREN` als einzelne allgemeine Buchungsgruppen.
- TARGET-032F parkt die gespeicherte General-Posting-Setup-Zeile `INLAND` + `WAREN` mit `4400`/`5400`.
- TARGET-027D24 parkt die VAT Posting Setup Matrix und damit alle finalen USt-/VAT-Field-Claims.
- TARGET-044D zeigt `U-CUST-100` und `U-ITEM-HW100` auf Standardkarten, aber nicht die benoetigten Posting-/VAT-/Payment-/Costing-Werte.

Fuer Universaarl folgt daraus: Debitoren- und Artikelfelder duerfen nicht aus sichtbaren Kartentexten heraus blind geschrieben werden. Vor jedem Schreibfall braucht TARGET-045A eine exakte Feld-/Wertekarte: welche Felder wirklich auf `U-CUST-100` und `U-ITEM-HW100` gesetzt werden sollen, welche Zielwerte nur vorbereitete Kandidaten sind und welche Felder durch geparkte Setup-Grenzen blockiert bleiben.

## TARGET-045A Debitor-/Artikel-Feldquellenkarte

TARGET-045A schliesst die lokale Feldquellenkarte ohne Business-Central- oder Playwright-Ausfuehrung:

- `U-CUST-100`: `Debitorenbuchungsgruppe = INLAND` ist ein fachlicher Zielkandidat, weil TARGET-031B die Debitorenbuchungsgruppe `INLAND` mit Sammelkonto `1200` beweist. Es ist aber noch kein gespeicherter Feldwert auf dem Debitor.
- `U-CUST-100`: `Geschaeftsbuchungsgruppe = INLAND` ist ein Zielkandidat, bleibt aber fuer Buchungsfaehigkeit durch die geparkte General-Posting-Setup-Zeile blockiert.
- `U-CUST-100`: `MwSt.-Geschaeftsbuchungsgruppe = INLAND` bleibt durch die geparkte VAT Posting Setup Matrix blockiert.
- `U-CUST-100`: `Zahlungsbedingungscode` hat noch keinen Universaarl-Zielwert.
- `U-ITEM-HW100`: `Basiseinheit = STK` ist bereits sichtbar/proven und soll nicht neu geschrieben werden.
- `U-ITEM-HW100`: `Produktbuchungsgruppe = WAREN` ist ein Zielkandidat, bleibt aber fuer Buchungsfaehigkeit durch die geparkte General-Posting-Setup-Zeile blockiert.
- `U-ITEM-HW100`: `MwSt.-Produktbuchungsgruppe = VAT19` bleibt durch die geparkte VAT Posting Setup Matrix blockiert.
- `U-ITEM-HW100`: `Artikelbuchungsgruppe/Lagerbuchungsgruppe` und `Einstandspreismethode` brauchen eigene Quellen-/UI-Route.

Fuer Universaarl folgt daraus: TARGET-045B darf die genannten Felder nur read-only auf den Karten suchen. Es darf keine Felder schreiben, keine Vorlage anwenden und keine O2C-/P2P-Dokumente erzeugen.

## TARGET-046 Artikel-/Lagerbuchungsgruppen-Quellenkarte

TARGET-046 laeuft ohne Business-Central- und ohne Playwright-Ausfuehrung. Der Lauf verknuepft die vorhandene Universaarl-Evidence mit Microsoft Learn:

- Microsoft Learn `Posting group setup` stuetzt die Produktlogik, dass Posting Groups Stammdaten und Belege mit Sachkonten verbinden.
- Die Microsoft-Learn-Objektquelle zu `Inventory Posting Setup` trennt `Location Code`, `Invt. Posting Group Code` und `Inventory Account` als eigene Felder.
- Microsoft Learn `Design details: inventory posting` stuetzt, dass Lagerbuchungen spaeter Item Ledger Entries, Value Entries und G/L Entries beruehren koennen.
- TARGET-040/TARGET-040R zeigen `Item Posting Groups` und `Inventory Posting Setup` in `UNIVERSAARL-DE` nur read-only als Oberflaechen.
- TARGET-045B zeigt `U-ITEM-HW100` read-only, aber nicht `Lagerbuchungsgruppe` / `Item Posting Group` als sichere Feldroute.

Fuer Universaarl folgt daraus: `U-ITEM-HW100` darf noch keine Lagerbuchungsgruppe erhalten. Erst muss TARGET-047 source-backed entscheiden, welcher Lagerbuchungsgruppencode, welche `SAAR-HL`-Kombination und welches SKR04-orientierte Lagerkonto fachlich passen. Daraus entsteht noch kein Inventory-Posting-Erfolg; Preview Posting, Posting, Item Ledger Entries, Value Entries und Sachposten bleiben gesperrt.

## TARGET-047 Inventory Posting Setup Entscheidung

TARGET-047 laeuft ohne Business-Central- und ohne Playwright-Ausfuehrung. Der Lauf verbindet TARGET-046 mit dem sichtbaren Kontenplan-Checkpoint TARGET-026O und dem Universaarl-SKR04-Minimalmapping:

- `SAAR-HL` ist als erster Universaarl-Lagerort nur ein Kandidat fuer die spaetere Inventory-Posting-Setup-Kombination.
- Der aktuelle Starterkontenplan enthaelt kein freigegebenes Lagerbewertungskonto.
- `5400 Wareneingang / Materialaufwand` ist ein GuV-Aufwandskonto fuer Einkaufs-/Materiallogik und darf nicht still als Inventory Account verwendet werden.
- `WAREN` darf nicht automatisch von der allgemeinen Produktbuchungsgruppe in eine Lagerbuchungsgruppe umgedeutet werden.

Fuer Universaarl folgt daraus: Der naechste Schritt ist `TARGET-048-INVENTORY-ACCOUNT-SKR04-SOURCE-GATE`. Erst wenn ein Lagerbewertungskonto und danach ein Inventory-Posting-Group-Code source-backed entschieden sind, darf ein kontrollierter Schreibcase fuer Item Posting Groups oder Inventory Posting Setup geplant werden. Daraus entsteht weiterhin kein Posting-Erfolg; Preview Posting, Posting, Item Ledger Entries, Value Entries und Sachposten bleiben gesperrt.

## TARGET-048 SKR04 Lagerkonto-Quellengate

TARGET-048 laeuft ohne Business-Central- und ohne Playwright-Ausfuehrung. Der Lauf nutzt den registrierten SKR04-Kontenrahmen 2026 von Collmex als Quellenbasis fuer den ersten Waren-/Hardwarefall:

- Der SKR04-Kontenrahmen fuehrt die Kontenklasse `Vorraete` und darin `Fertige Erzeugnisse und Waren`.
- Innerhalb dieser Gruppe liegt `1140-1179 Waren (Bestand)`.
- Fuer den ersten Universaarl-Warenfall ist deshalb `1140 Waren (Bestand)` der source-backed Kandidat fuer ein Lagerbewertungskonto.
- `5400 Wareneingang / Materialaufwand` bleibt ein GuV-Aufwandskonto und darf nicht still als Inventory Account verwendet werden.
- Das alte CRONUS-/RM-DEMO-Konto `14140` bleibt historische Laborreferenz und ist keine aktive Universaarl-Zielwahrheit.

Fuer Universaarl folgt daraus: Der naechste Schritt ist `TARGET-048B-INVENTORY-ACCOUNT-1140-CONTROLLED-WRITE-GATE`. Dort darf ausschliesslich `1140 Waren (Bestand)` als `Bilanz`/`Buchung` geprueft oder angelegt und nach erneutem Oeffnen bewiesen werden. Item Posting Groups, Inventory Posting Setup, Artikel, Belege, Preview Posting und Posting bleiben gesperrt.

## TARGET-053 Artikel-Produkt-/MwSt.-Produktbuchungsgruppen-Entscheidung

TARGET-053 laeuft ohne Business-Central- und ohne Playwright-Ausfuehrung. Der Lauf verbindet die vorhandene Universaarl-Evidence mit Microsoft Learn:

- Microsoft Learn `Posting group setup` stuetzt die Produktlogik, dass allgemeine Produktbuchungsgruppen beschreiben, was verkauft oder gekauft wird, und dass die allgemeine Buchungsmatrix erst aus der Kombination von Geschaefts- und Produktbuchungsgruppe die Sachkonten bestimmt.
- Microsoft Learn `Set up VAT` stuetzt die Produktlogik, dass MwSt.-Produktbuchungsgruppen beschreiben, welche Art von Artikeln/Ressourcen fuer die MwSt.-Berechnung verwendet wird, und dass die MwSt.-Buchungsmatrix erst aus MwSt.-Geschaefts- und MwSt.-Produktbuchungsgruppe Steuersatz und Steuerkonten bestimmt.
- Die Objektquelle `Gen. Product Posting Group` zeigt zusaetzlich, dass eine allgemeine Produktbuchungsgruppe einen Default fuer die MwSt.-Produktbuchungsgruppe haben kann. Das ist eine Strukturgrenze, aber kein Universaarl-Speicherbeweis.
- TARGET-032B beweist `WAREN` als allgemeine Produktbuchungsgruppe.
- TARGET-027C beweist `VAT19` als sichtbare MwSt.-Produktbuchungsgruppe.
- TARGET-052 beweist auf `U-ITEM-HW100` die sichtbaren, noch leeren Felder `Produktbuchungsgruppe` und `MwSt.-Produktbuchungsgruppe`.

Fuer Universaarl folgt daraus: `WAREN` und `VAT19` sind die source-backed Zielwerte fuer den naechsten engen Artikelkarten-Schreibcase. TARGET-054 darf nur diese beiden Felder auf `U-ITEM-HW100` setzen und nach erneutem Oeffnen beweisen. Daraus entsteht noch keine Buchungsfaehigkeit: General Posting Setup `INLAND` + `WAREN`, VAT Posting Setup `INLAND` + `VAT19`, Belege, Preview Posting, Posting und Posten bleiben eigene Gates.

## TARGET-054 Artikel-Produkt-/MwSt.-Produktbuchungsgruppen-Schreibgate

TARGET-054 laeuft mit Business Central und Playwright in `playthru` / `UNIVERSAARL-DE`. Der Lauf setzt auf der Artikelkarte `U-ITEM-HW100` nur zwei zuvor entschiedene Werte:

- `Produktbuchungsgruppe = WAREN`
- `MwSt.-Produktbuchungsgruppe = VAT19`

Der Reopen-Proof zeigt beide Werte zusammen mit `Lagerbuchungsgruppe=WARE`, `Lagerabgangsmethode=FIFO` und `Basiseinheit=STK` auf der Artikelkarte. Damit ist die Item-Card-Seite fuer den ersten Warenartikel fachlich weiter vorbereitet.

Die Grenze bleibt hart: TARGET-054 beweist keine `INLAND`/`VAT19`-Zeile in der MwSt.-Buchungsmatrix, keine `INLAND`/`WAREN`-Zeile in der allgemeinen Buchungsmatrix, keine Steuerberechnung, keine Belege, keine Preview Posting, keine Buchung und keine Posten. Der naechste Schritt ist deshalb eine lokale Entscheidung, ob die geparkte VAT-Matrixroute mit dieser neuen Artikelkartenlage wieder geoeffnet werden soll.

## TARGET-027D25 VAT-Matrix nach Artikel-VAT19

TARGET-027D25 laeuft ohne Business-Central- und ohne Playwright-Ausfuehrung. Der Lauf bewertet TARGET-054 gegen die geparkte MwSt.-Buchungsmatrixroute:

- `VAT19` auf `U-ITEM-HW100` ist ein echter Artikelkarten-Nachweis.
- Dieser Nachweis erzeugt aber keine `INLAND`/`VAT19`-Matrixzeile.
- Steuersatz, Berechnungsart, Umsatzsteuerkonto und Vorsteuerkonto bleiben in der MwSt.-Buchungsmatrix unbewiesen.
- Die alten Page-472- und Configuration-Package-Blocker werden durch den Artikelwert nicht geloest.

Fuer Universaarl folgt daraus: Die VAT-Matrix bleibt geparkt, bis ein materiell neuer Standardweg oder eine sicherere Setup-Route belegt ist. Der naechste sinnvolle Foundation-Schritt ist die andere Matrixabhaengigkeit: General Posting Setup `INLAND` + `WAREN` mit den Konten `4400` und `5400` als eigener lokaler Reopen-Entscheidungsfall.

## URLs

- https://learn.microsoft.com/en-us/dynamics365/business-central/about-new-company
- https://learn.microsoft.com/en-us/dynamics365/business-central/setup
- https://learn.microsoft.com/en-us/dynamics365/business-central/admin-company-information
- https://learn.microsoft.com/en-us/dynamics365/business-central/across-business-functionality
- https://learn.microsoft.com/en-us/dynamics365/business-central/ui-how-users-permissions
- https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/tenant-admin-center-environments
- https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/whatsnew/overview
- https://learn.microsoft.com/en-us/dynamics365/business-central/ui-enter-criteria-filters
- https://www.collmex.de/skr04.pdf
- https://learn.microsoft.com/en-us/dynamics365/business-central/analysis-mode
- https://learn.microsoft.com/en-us/dynamics365/business-central/ui-personalization-user
- https://learn.microsoft.com/en-us/dynamics365/business-central/ui-create-number-series
- https://learn.microsoft.com/en-us/dynamics365/business-central/admin-integrate-field-service
- https://learn.microsoft.com/en-us/dynamics365/business-central/finance-posting-groups
- https://learn.microsoft.com/en-us/dynamics365/business-central/finance-setup-vat
- https://learn.microsoft.com/en-us/dynamics365/business-central/application/base-application/table/microsoft.finance.generalledger.setup.gen.-product-posting-group
- https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/set-up-standard-company-configuration-packages
- https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/apply-company-configuration-packages
- https://learn.microsoft.com/en-us/training/modules/set-up-vat-dynamics-365-business-central/
- https://learn.microsoft.com/en-us/dynamics365/business-central/reports-bi-reporting
- https://learn.microsoft.com/en-us/dynamics365/release-plans/
- https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/overview
- https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/success-by-design
- https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/process-focused-solution
- https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/process-focused-solution-fit-to-standard-fit-gap-analysis
- https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/testing-strategy
- https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/testing-strategy-planning
- https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/testing-strategy-test-types
- https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/prepare-to-go-live
- https://help-center.apps.datev.de/documents/1029628
- https://www.collmex.de/skr04.pdf
- https://www.gesetze-im-internet.de/ustg_1980/__14.html
- https://www.gesetze-im-internet.de/ustg_1980/__14b.html
- https://www.gesetze-im-internet.de/ao_1977/__146.html
- https://www.gesetze-im-internet.de/ao_1977/__147.html
- https://www.bundesfinanzministerium.de/Content/DE/Downloads/BMF_Schreiben/Weitere_Steuerthemen/Abgabenordnung/AO-Anwendungserlass/2024-03-11-aenderung-gobd.html
- https://www.bundesfinanzministerium.de/Content/DE/FAQ/e-rechnung.html
