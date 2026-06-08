# Lab-Fit-Status fuer FiBu Buch 5

Diese Datei ist die Prozesslandkarte fuer das Business-Central-Labor. Sie verhindert, dass das Projekt nur auf einen einzelnen Testfall schaut. Jeder groessere Prozess- oder Setupblock bekommt einen kompakten Status: Was wurde praktisch in Business Central geprueft, welche Evidence existiert, was ist nur Laborbefund und was muss spaeter im deutschen Zielmandanten erneut bewiesen werden?

## Statuslegende

| Status | Bedeutung |
|---|---|
| passt | praktisch nachgewiesen und fuer das aktuelle Labor belastbar |
| labor | praktisch teilweise nachgewiesen; Einschraenkung dokumentiert |
| offen | fehlerhaft, blockiert oder fachlich noch nicht eingerichtet |
| nicht geprueft | im Buch relevant, aber im Labor noch nicht durchgespielt |

## Aktuelle Umgebung

| Feld | Wert |
|---|---|
| Modus | active-us-lab |
| Sandbox | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Datenbasis | CRONUS USA |
| Sprache | gemischt Deutsch/Englisch |
| Buchziel | future-de-final mit deutscher Oberflaeche, EUR und deutscher USt |

## Blockstatus

| Block | Status | Praktisch geprueft | Evidence/Screenshots | Laborbefund | Deutscher Finalnachweis | Naechster Schritt |
|---|---|---|---|---|---|---|
| Foundation / Company / Umgebung | passt | Company `RM-DEMO` aus CRONUS aufgebaut, Unternehmensdaten gepflegt, Webclient-Login nutzbar | `foundation-*`, `CURRENT-STATE.md` | Laborcompany ist CRONUS-basiert und gemischtsprachig | deutsche Zielcompany mit passender Lokalisierung und Sprache | erst bei neuer Umgebung wiederholen |
| Stammdaten-Audit | passt | Customers, Items, Locations, Dimensions, General/VAT/Inventory Posting Setup gesichtet | `evidence/masterdata-001/`, `playwright/projects/fibu-book5/img/masterdata-001-*` | Ist-Stand als Laborbasis bekannt | Audit in deutscher Zielcompany wiederholen | bei neuen Modulen Audit erweitern |
| Debitoren | labor | `D10000` existiert; Adresse, Currency Code `EUR`, Posting-/Tax-Herkunft untersucht | `masterdata-005`, `mcp-currency`, `mcp-tax-origin`, `UAT-O2C-001` | `EUR` ist fuer O2C geloest; `Tax Area Code` bleibt CRONUS-USA-Laborbefund | deutscher Debitor mit VAT Bus. Posting Group, Zahlungsbedingungen und USt-Logik | Debitor-Setup-Checkliste fuer Anfaenger weiter ausbauen |
| Artikel | labor | `RM-M100` existiert mit Preis `68.000`, Kosten `42.000`, `PCS`, `RETAIL`, `RESALE`, `FURNITURE` | `masterdata-005`, `masterdata-006`, `mcp-tax-origin`, `UAT-O2C-001` | Artikel ist technisch verkaufsfaehig; `FURNITURE` ist US-Tax-Gruppe, keine deutsche Maschinen-USt | deutscher Artikel mit Gen. Product, Inventory und VAT Product Posting Group | Artikel-Setup-Checkliste und Preview-Posting-Nachweis |
| Lagerorte | labor | `FRA-ZL` als einfacher Lagerort angelegt und in Verkaufszeile genutzt | `masterdata-004`, `UAT-O2C-001` | einfacher Lagerort reicht fuer ersten O2C-Laborlauf | deutscher Lagerort mit gewuenschter Warehouse-Logik | Warehouse erst spaeter gezielt aktivieren |
| Dimensionen | labor | O2C-Kerndimensionen und Default Dimensions geprueft; `MASTERDATA-DIMENSIONS` prueft Buchstandard-Dimensionen gegen API | `masterdata-002`, `masterdata-003`, `masterdata-007`, `masterdata-dimensions`, `UAT-O2C-001` | `DEPARTMENT`, `CHANNEL`, `PRODUCTLINE`, `LOCATION-GROUP` existieren; `COMPANY-GROUP` und mehrere Erweiterungswerte fehlen; `PRODUCTLINE=MACHINE` am Artikel, `CHANNEL=B2B` am Debitor und beide Dimensionen am Artikelposten `Entry No. 792` nachgewiesen | gleiche Dimensionen, vollstaendige Werte und globale/Shortcut-Dimensionen in DE-Company pruefen | fehlende P1-Dimensionswerte per UI-Setup-Lauf oder pro Prozessbedarf anlegen; danach Reporting auswerten |
| Posting Groups | labor | Debitor-/Artikel-Posting-Fit fuer CRONUS-Techniklauf hergestellt; Inventory Posting Setup fuer `FRA-ZL` + `RESALE` auf `Inventory Account = 14140` gesetzt; O2C-Preview und G/L-Preview-Drilldown nach Fix geprueft | `masterdata-006`, `masterdata-008`, `masterdata-009`, `UAT-O2C-001`, `MICROSOFT-DOC-VALIDATION.md` | konkrete Inventory-Posting-Setup-Luecke ist im Labor geschlossen; `Preview Posting` zeigt echte Vorschauzeilen statt Inventory-Fehler; G/L-Preview zeigt `14140` | deutsche Posting Groups, General Posting Setup und Inventory Posting Setup | G/L-Preview-Betraege im Screenshot sichtbar machen; deutschen Steuer-/VAT-Fit getrennt klaeren |
| Tax / VAT / Sales Tax | offen | Tax Areas, Tax Groups, Tax Details, VAT Posting Setup Pages geoeffnet und bewertet | `mcp-tax-setup-*`, `mcp-vat-posting-setup`, `045-target-vs-labor-delta.md` | aktuelle Zeile: `Tax Group Code = FURNITURE`, `taxPercent = 0`; kein deutscher 19-%-Nachweis | deutscher VAT-Zielmandant oder explizit deutsches VAT-Setup | keine Buchung als deutscher Zielbeleg; erst Preview-/VAT-Setup-Befund vertiefen |
| Waehrungen | passt | `EUR` existiert und ist am Debitor `D10000` gesetzt; aktueller O2C-Auftrag laeuft mit EUR | `mcp-currency`, `045-target-vs-labor-delta.md`, `046-o2c-lab-learning-summary.md` | fruehere USD-Abweichung ist im aktuellen Lauf geloest | EUR in deutscher Zielcompany erneut pruefen | keine Sofortaktion |
| Order-to-Cash | labor | Sales Orders gesucht, Auftrag per API erzeugt, Kopf/Zeile fotografiert, Dimensionen geprueft, Preview Posting mit Vorschauzeilen, genau eine Laborbuchung mit `Ship and Invoice`, gebuchte Verkaufsrechnung und Postenspur read-only nachgewiesen | `playwright/projects/fibu-book5/img/uat-o2c-001-*`, `evidence/uat-o2c-001/` | Klickpfad, EUR, Menge, Lagerort, Preis, Dimension, Posting Preview und Laborbuchung funktionieren; gebuchte Rechnung `PS-INV103297`, Debitorenposten, Sachposten, Wertposten und Artikelposten sichtbar; Artikelposten wurde ueber Wertposten `Item Ledger Entry No. = 792` gefunden; `Entry` -> `Dimensions` zeigt `CHANNEL=B2B` und `PRODUCTLINE=MACHINE`; Steuer bleibt 0 % | deutscher O2C mit 19 % USt, finale Buchung und vollstaendige Postenspur | Keine weitere Buchung; Reporting/Financial Reports oder naechsten Prozessblock vorbereiten |
| Procure-to-Pay | nicht geprueft | noch kein P2P-Laborlauf | keine | Buch enthaelt P2P-Annahmen, aber Labor fehlt | deutscher Einkaufsprozess mit Kreditor, Artikel/Anlage, Vorsteuer und Posten | Kreditoren- und P2P-Stammdaten vorbereiten |
| Inventory | labor | Artikel und Lagerort vorhanden; Verkaufszeile nutzt Lagerort; `FRA-ZL` + `RESALE` wurde mit `Inventory Account = 14140` als CRONUS-Laborfit eingerichtet; Preview zeigt `Item Ledger Entry = 1` und `Value Entry = 1`; nach Laborbuchung sind Wertposten und Artikelposten sichtbar | `masterdata-004`, `masterdata-005`, `masterdata-008`, `masterdata-009`, `UAT-O2C-001` | Inventory-Posting-Setup-Luecke ist im Labor geschlossen; Wertposten zur Rechnung sichtbar; Artikelposten wurde nicht ueber `Order No.`, sondern ueber `Item Ledger Entry No. = 792` aus dem Wertposten gefunden | Artikelposten und Wertposten in deutscher Zielcompany | Dimensionswirkung in Posten/Reporting suchen |
| Warehouse | nicht geprueft | bewusst noch nicht aktiviert | `MASTERDATA-BUILD-PLAN.md` | einfacher Lagerort verhindert fruehen Warehouse-Overhead | gesteuerte Lagerlogik separat testen | eigener Warehouse-Block |
| Manufacturing / Assembly | nicht geprueft | noch kein Lauf | keine | Buchmodell enthaelt Maschinen-/Fertigungsbezug, aber BC-Lauf fehlt | Produktions-/Montagelogik in passender Company | spaeterer Prozessblock |
| Service | nicht geprueft | noch kein Lauf | keine | Buchkapitel offen | deutscher Serviceprozess | spaeterer Prozessblock |
| Projects | nicht geprueft | noch kein Lauf | keine | Buchkapitel offen | Projektposten, Projektfaktura, Dimensionen | spaeterer Prozessblock |
| Bank / Payments | nicht geprueft | gebuchte Laborrechnung `PS-INV103297` existiert als Ausgangspunkt; Zahlung noch nicht getestet | `evidence/uat-o2c-001/080-posting-result.json` | Zahlungsprozesse koennen jetzt an einer Laborrechnung geuebt werden | Zahlung, Ausgleich, Bankposten im deutschen Zielmandanten | nach Postenspur-/Dimensionscheck |
| Fixed Assets | nicht geprueft | noch kein Lauf | keine | Anlagenkapitel offen | Anlagenkarte, AfA-Buch, Anlagenposten | spaeterer Prozessblock |
| Reporting / Financial Reports | labor | Financial Reports per Tell-Me in der Gruppe `Berichte und Analysen` read-only geoeffnet; Liste zeigt u. a. `Balance Sheet`, `Income Statement` und `Revenue` | `evidence/reporting-001/010-financial-reports-open-result.json`, `playwright/projects/fibu-book5/img/reporting-001-010-financial-reports.png` | Reporting-Seite ist erreichbar; Teaching Tip erklaert Financial Reports; Dimensionen/PRODUCTLINE sind im Finanzbericht noch nicht gefiltert oder summiert | Finanzbericht mit gebuchten Dimensionen `PRODUCTLINE=MACHINE`, `CHANNEL=B2B`, `DEPARTMENT=SALES` in deutscher Zielcompany | Financial Reports maximieren oder passenden Report waehlen und Dimensionsfilter suchen |
| Periodenabschluss | nicht geprueft | noch kein Lauf | keine | haengt an gebuchten Belegen | Abschlussprozess in DE-Company | spaeterer Prozessblock |
| E-Rechnung / Compliance | nicht geprueft | noch kein Lauf | keine | nicht im CRONUS-Labor belastbar | deutsche Lokalisierung und Compliance-Setup | spaeterer DE-Finalblock |
| Migration / Opening Balances | nicht geprueft | noch kein Lauf | keine | nicht Teil des aktuellen Labors | Migration/Openings in Zielcompany | spaeterer Prozessblock |
| Security / Rollen | nicht geprueft | Login funktioniert; Rollen/Berechtigungen nicht systematisch getestet | `auth:bc`, Smoke-Test | aktueller Benutzer reicht fuer Labor | Rollen, Permission Sets, Security Groups im Zielmandanten | eigener Admin-/Security-Block |

## Allgemeine Arbeitsregel

Wenn ein neuer Prozessblock praktisch bearbeitet wird, wird diese Datei im selben Arbeitsgang aktualisiert. Ein Block gilt nicht als `passt`, nur weil ein Test gruen ist. Er gilt erst als `passt`, wenn Bedienpfad, Daten, fachliche Wirkung, Evidence, Anfaengererklaerung und offene Grenzen dokumentiert sind.

## Naechste sinnvolle Lab-Fit-Schritte

1. Reporting/Financial Reports weiterfuehren: passenden Report waehlen, Ansicht maximieren und Dimensionsfilter fuer `PRODUCTLINE=MACHINE` suchen.
2. Stammdaten-Backlog nutzen: P2P erst starten, wenn `K10000`, `RAW-STEEL`, benoetigte Dimensionswerte wie `PURCH`, Vendor Posting Group, General Posting Setup, Tax/VAT-Laborgrenze und Nummernserie als Setup-Fit geprueft sind.
3. Postenspur aus `UAT-O2C-001` als Anfaenger-Lernbild erklaeren: gebuchte Verkaufsrechnung, Debitorenposten, Sachposten, Wertposten, Artikelposten und Dimensionen am Artikelposten.
4. Deutsche USt-Grenze weiter offen halten: CRONUS-USA zeigt weiter keinen 19-%-USt-Endstand.
