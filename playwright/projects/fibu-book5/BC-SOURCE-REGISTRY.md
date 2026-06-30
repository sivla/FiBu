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
