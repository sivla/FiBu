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
| Microsoft Learn: Create number series | 1 | Number Series, No. Series Lines | Nummernseriencodes, Lines, Starting Date, Starting No., Ending No., Manual Nos., Allow Gaps, spaetere Setup-Zuweisung | konkrete Universaarl-Werte, persistierte Start-/Endnummern, deutsche Rechts-/Steuerfinalclaims | Produkt-/Setupclaim; Universaarl braucht TARGET-016I Write-Gate und spaetere Setup-/Beleg-Evidence | geprueft 2026-06-30, TARGET-016H |
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

## URLs

- https://learn.microsoft.com/en-us/dynamics365/business-central/about-new-company
- https://learn.microsoft.com/en-us/dynamics365/business-central/setup
- https://learn.microsoft.com/en-us/dynamics365/business-central/admin-company-information
- https://learn.microsoft.com/en-us/dynamics365/business-central/across-business-functionality
- https://learn.microsoft.com/en-us/dynamics365/business-central/ui-how-users-permissions
- https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/tenant-admin-center-environments
- https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/whatsnew/overview
- https://learn.microsoft.com/en-us/dynamics365/business-central/ui-enter-criteria-filters
- https://learn.microsoft.com/en-us/dynamics365/business-central/analysis-mode
- https://learn.microsoft.com/en-us/dynamics365/business-central/ui-personalization-user
- https://learn.microsoft.com/en-us/dynamics365/business-central/finance-setup-vat
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
- https://www.gesetze-im-internet.de/ustg_1980/__14.html
- https://www.gesetze-im-internet.de/ustg_1980/__14b.html
- https://www.gesetze-im-internet.de/ao_1977/__146.html
- https://www.gesetze-im-internet.de/ao_1977/__147.html
- https://www.bundesfinanzministerium.de/Content/DE/Downloads/BMF_Schreiben/Weitere_Steuerthemen/Abgabenordnung/AO-Anwendungserlass/2024-03-11-aenderung-gobd.html
- https://www.bundesfinanzministerium.de/Content/DE/FAQ/e-rechnung.html
