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
| Microsoft Learn: Business functionality supported by Business Central | 1 | Modulabdeckung | Scope fuer Finance, Sales, Purchasing, Inventory, Warehouse, Service, Projects, Reporting | Nachweis, dass ein Universaarl-Prozess gelaufen ist | Produktclaim | geprueft 2026-06-29 |
| Microsoft Learn: Managing production and sandbox environments | 1 | Environments | Environment-Begriff, Admin-/Sandbox-Kontext | Company-spezifische Buchungsaussage | Produkt-/Adminclaim | geprueft 2026-06-29 |
| Microsoft Learn: Release plans for Dynamics 365 / Business Central | 2 | Release Wave | neue oder geaenderte Funktionen, releaseabhaengige UI | stabile Altbehauptung ohne BC-Doku | Release-Claim | geprueft 2026-06-29 |
| Microsoft Learn: What's New or Changed in Business Central | 2 | Version und Releasezyklus | Pruefung, ob ein Feature releaseabhaengig ist | Prozessnachweis | Release-Claim | geprueft 2026-06-29 |
| Microsoft Learn: Searching, sorting, and filtering data in Business Central | 1 | Look and Feel, Listen, Filter | Such-, Sortier- und Filterprinzipien, Filterausdruecke, `Filter list by`, `Filter totals by`, Reportfilter | Beweis, dass Universaarl-Daten existieren oder ein konkreter Filter im Zielmandanten funktioniert | Produkt-/UI-Claim; Universaarl-Beispiel braucht eigene Evidence | geprueft 2026-06-29 |
| Microsoft Learn: Analyze list page and query data using data analysis mode | 1 | Look and Feel, Analysis Mode | read-only Analysemodus, Gruppierung/Filterung/Summen auf Listen- oder Querydaten | Buchungs-, Posting- oder Reportfinalnachweis | Produkt-/UI-Claim; konkrete Universaarl-Auswertung braucht eigene Evidence | geprueft 2026-06-29 |
| Microsoft Learn: Dynamics 365 Implementation Guide overview | 3 | Implementierungsmethodik | Strategize, Initiate, Implement, Prepare, Operate | konkrete BC-Feldlogik | Best-Practice-/Projektclaim | geprueft 2026-06-29 |
| Microsoft Learn: Success by Design framework | 3 | Governance, Reviews, Projektrisiko | Projekt-, Test- und Architekturdenken | UI- oder Buchungsbeweis | Best-Practice-/Projektclaim | geprueft 2026-06-29 |
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

Fuer die Anlage von `UNIVERSAARL-DE` ist die direkte Listenzeile kein bevorzugter Buchpfad. Sie ist ein UI-Befund. Der Buchpfad soll am Microsoft-Learn-Standard ausgerichtet werden: `Mandanten` / Companies, `Neu`, dann der Create-New-Company-/Assisted-Setup-Weg. Geeignete Optionen sind eine leere Company oder eine setup-nahe Production-Option ohne Sample-/Demodaten. `Kopieren`, CRONUS-Kopie und `Testunternehmen` sind fuer die finale Universaarl-Basis nur dann zulaessig, wenn vorher Quelle, Datenwirkung und Buchfolgen verstanden und als passend bewiesen sind.

## URLs

- https://learn.microsoft.com/en-us/dynamics365/business-central/about-new-company
- https://learn.microsoft.com/en-us/dynamics365/business-central/setup
- https://learn.microsoft.com/en-us/dynamics365/business-central/across-business-functionality
- https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/tenant-admin-center-environments
- https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/whatsnew/overview
- https://learn.microsoft.com/en-us/dynamics365/business-central/ui-enter-criteria-filters
- https://learn.microsoft.com/en-us/dynamics365/business-central/analysis-mode
- https://learn.microsoft.com/en-us/dynamics365/release-plans/
- https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/overview
- https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/success-by-design
- https://www.gesetze-im-internet.de/ustg_1980/__14.html
- https://www.gesetze-im-internet.de/ustg_1980/__14b.html
- https://www.gesetze-im-internet.de/ao_1977/__146.html
- https://www.gesetze-im-internet.de/ao_1977/__147.html
- https://www.bundesfinanzministerium.de/Content/DE/Downloads/BMF_Schreiben/Weitere_Steuerthemen/Abgabenordnung/AO-Anwendungserlass/2024-03-11-aenderung-gobd.html
- https://www.bundesfinanzministerium.de/Content/DE/FAQ/e-rechnung.html
