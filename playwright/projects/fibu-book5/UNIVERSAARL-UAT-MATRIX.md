# Universaarl UAT Matrix

Aktive Zielwelt:

- Instanz: `playthru`
- Zielcompany: `UNIVERSAARL-DE`
- Musterfirma: `Universaarl GmbH`
- Shopify / Online Store: `excluded-shopify`

Diese Matrix uebersetzt die Microsoft-Implementation-Guide-Regeln aus `UNIVERSAARL-IMPLEMENTATION-GUIDE-MAPPING.md` in konkrete Testfaelle fuer das Buch. Sie trennt bewusst vier Ebenen:

| Ebene | Zweck | Reicht fuer Buchtext? | Reicht fuer UAT bestanden? |
| --- | --- | --- | --- |
| `read-only-probe` | Seite, Rolle, Kontext, Button, Feld oder Dialog sicher sichtbar machen. | ja, fuer Bedienerklaerung und Screenshot-Kontext | nein |
| `process-test` | Einen einzelnen Prozessschritt mit Setup, Pflichtfeldern und erwarteter Wirkung pruefen. | ja, wenn Grenzen sichtbar sind | nein, wenn nicht end-to-end |
| `end-to-end-test` | Prozess von Stammdaten/Beleg bis Posten/Entries vollstaendig durchspielen. | ja | teilweise, wenn fachlich abgenommen |
| `uat` | Anwenderfall mit Rolle, Daten, Erwartung, Ergebnis, Abnahme und Fehlerweg pruefen. | ja | ja, wenn bestanden und dokumentiert |

Statuswerte:

| Status | Bedeutung |
| --- | --- |
| `planned` | Testfall gehoert zum Buchziel, aber es gibt noch keinen Universaarl-Nachweis. |
| `blocked-until-company` | `UNIVERSAARL-DE` existiert noch nicht oder ist nicht als Zielcompany nutzbar. |
| `needs-foundation` | Company existiert spaeter, aber Setup, Nummernserien, Posting Groups, USt oder Dimensionen fehlen. |
| `needs-data-richness` | Mehrere Stammdaten, Belege, Perioden oder Posten fehlen fuer aussagekraeftige Listen/Reports. |
| `ready-after-company` | Direkt nach Company-Anlage als naechster sinnvoller Test moeglich. |
| `source-backed-prep` | Quellen- oder Planungsnachweis liegt vor, aber kein Prozess wurde ausgefuehrt. |
| `universaarl-proven` | In `playthru` / `UNIVERSAARL-DE` praktisch bewiesen. |
| `excluded-shopify` | Bewusst nicht Teil des Buchprojekts. |

## UAT-Entry- und Exit-Regeln

Ein Universaarl-Testfall darf erst ausgefuehrt werden, wenn die Entry Criteria des Falls erfuellt sind. Ein Fall gilt erst als abgeschlossen, wenn die Exit Criteria dokumentiert sind.

| Regel | Entry Criteria | Exit Criteria |
| --- | --- | --- |
| Kontext | Instanz, Company, Rolle und Seite sind sichtbar oder bewusst als geplant/blockiert markiert. | Result JSON nennt Instanz, Company, Rolle/Page-Kontext und Grenzen. |
| Quelle | Produkt-/Projektclaim ist durch Microsoft Learn oder eigene Evidence gestuetzt. | Matrix, Katalog oder Evidence verlinkt Quelle oder Screenshot. |
| Daten | Benoetigte Stammdaten und Setupwerte sind vorhanden oder als Voraussetzung markiert. | Testdaten, Belegnummern, Dokumentstatus und Folgeobjekte sind nachvollziehbar. |
| Wirkung | Riskante Actions sind vorab klassifiziert: safe, write, setup, preview, post, external. | Preview/Posting/Trace nur, wenn der Case sie erlaubt und Entries sichtbar sind. |
| Buch | Buchtext erklaert den Schritt fuer Anfaenger ohne Agenten-Meta. | Abschnitt erklaert Seite, Felder, Buttons, Ergebnis, Fehler und Korrekturweg. |

## Universaarl Testfaelle

| UAT ID | Kapitel / Bereich | Testklasse | Entry Criteria | Testdaten | Erwartetes Ergebnis | Evidence / Screenshots | Status | Naechster Case |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `UAT-W0-001` | Kap. 3/4 - Environment und Mandantenliste | `read-only-probe` | `playthru` erreichbar, keine Company-Anlage | vorhandene Shell-Company, Zielname `UNIVERSAARL-DE` | Seite `Mandanten` zeigt vorhandene Companies; `Neu`-Hauptbutton und Pfeil/Dropdown sind unterscheidbar. | PREP-031 Screenshots und Result | `source-backed-prep` | nach Rechten `TARGET-009` |
| `UAT-W0-002` | Kap. 3/4 - Company Creation | `process-test` | SUPER/company-create Rechte bestaetigt; Smart Decision Card vorhanden | `UNIVERSAARL-DE`, `Universaarl GmbH` | Neue Company wird ueber `Neu` -> `Neues Unternehmen erstellen` angelegt oder exakter Berechtigungs-/Wizard-Blocker wird dokumentiert. | Companies Page vor/nach, Wizard-Option, Erfolg/Fehler | `blocked-until-company` | `TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE` |
| `UAT-W0-003` | Kap. 3/4 - Meine Einstellungen | `read-only-probe` | Role Center erreichbar, keine Speicherung | aktuelle Rolle/Sprache/Region | Rolle, Mandant, Arbeitsdatum, Region, Sprache, Zeitzone sind sichtbar; kein OK/Speichern. | PREP-033 Screenshot und Result | `source-backed-prep` | nach Company-Anlage erneut in `UNIVERSAARL-DE` |
| `UAT-W0-004` | Kap. 3/4 - Role Center | `read-only-probe` | Role Center erreichbar | Shell-Kontext | Navigation, Suche, Einstellungen, Hilfe und Kacheln sind erklaerbar; Shopify sichtbar, aber ausgeschlossen. | PREP-034 Screenshot und Result | `source-backed-prep` | nach Company-Anlage erneut in `UNIVERSAARL-DE` |
| `UAT-W1-001` | Kap. 4 - Company Information | `process-test` | `UNIVERSAARL-DE` existiert | Universaarl GmbH, Adresse, Land/Region, USt-ID spaeter | Company Information zeigt rechtlichen Kontext und kann vor/nach Setup erklaert werden. | Setup Before/After, Company Card | `blocked-until-company` | `TARGET-COMPANY-INFO-001` |
| `UAT-W1-002` | Kap. 5/6 - Number Series | `process-test` | Company Information steht | Nummernserien fuer Debitoren, Kreditoren, Artikel, Verkaufs-/Einkaufsbelege, Journale | Belegnummern sind erklaerbar und werden nicht zufaellig erzeugt. | No. Series List/Card, Lines | `needs-foundation` | `TARGET-005-NUMBER-SERIES-PREFLIGHT` |
| `UAT-W1-003` | Kap. 7 - Posting Groups | `process-test` | Kontenplan/Grundsetup sichtbar | Business/Product Posting Groups, Customer/Vendor/Inventory/Bank/FA Groups | Kontenfindung ist vor jedem Preview/Post nachvollziehbar. | Posting Setup Matrix, Posting Group Cards | `needs-foundation` | `TARGET-006-POSTING-GROUPS-PREFLIGHT` |
| `UAT-W1-004` | Kap. 8 - USt/VAT | `process-test` | Posting Groups stehen | deutsche Inlandsgruppen, 19 Prozent erst nach Setupnachweis | VAT Setup kann Preview/VAT Entries spaeter korrekt stuetzen; keine USt-Behauptung ohne Entries. | VAT Posting Setup, Preview, VAT Entries spaeter | `needs-foundation` | `TARGET-008-VAT19-SETUP-READINESS` |
| `UAT-W1-005` | Kap. 9 - Dimensionen | `process-test` | Dimensionen anlegbar | `PRODUCTLINE`, `CHANNEL`, `COSTCENTER` | Dimensionen sind auf Stammdaten/Belegen nutzbar und spaeter in Entries auswertbar. | Dimensions, Default Dimensions, Entry Trace | `needs-foundation` | `TARGET-007-DIMENSIONS-FOUNDATION` |
| `UAT-MD-001` | Kap. 10 - Debitoren | `process-test` | Posting Groups, USt, Nummernserien stehen | mindestens 5 Universaarl-Debitoren | Debitorenkarte erklaert Pflichtfelder, Posting Groups, Zahlungsbedingungen und Dimensionen. | Customer Card, Customer List | `needs-foundation` | `TARGET-010-O2C-MASTERDATA` |
| `UAT-MD-002` | Kap. 11 - Kreditoren | `process-test` | Posting Groups, USt, Nummernserien stehen | mindestens 5 Universaarl-Kreditoren | Kreditorenkarte erklaert Pflichtfelder, Posting Groups, Zahlungsbedingungen und Dimensionen. | Vendor Card, Vendor List | `needs-foundation` | `TARGET-013-P2P-MASTERDATA` |
| `UAT-MD-003` | Kap. 10-13 - Artikel | `process-test` | Inventory/Posting Setup steht | Verkaufsartikel, Einkaufsartikel, Rohmaterial, Fertigprodukt | Artikelkarte erklaert Typ, Basiseinheit, Posting Groups, USt und Kostenmethode. | Item Card, Item List | `needs-foundation` | `TARGET-010-O2C-MASTERDATA` / `TARGET-013-P2P-MASTERDATA` |
| `UAT-O2C-001` | Kap. 10 - Sales / O2C | `end-to-end-test` | Debitor, Artikel, USt, Dimensionen, Posting Groups stehen | Verkaufsauftrag oder Verkaufsrechnung | Beleg wird mit Preview/Posting/Entries nachvollziehbar; Debitorenposten, Sachposten, VAT/Item/Value Entries sichtbar. | Sales Document, Preview, Posted Doc, Ledger Trace | `needs-foundation` | `TARGET-011-O2C-PREVIEW` |
| `UAT-P2P-001` | Kap. 12 - Purchase / P2P | `end-to-end-test` | Kreditor, Artikel, Lagerort, USt, Posting Groups stehen | Einkaufsbeleg mit Menge, Preis, ggf. Teil-WE | Einkaufsprozess erzeugt Kreditoren-/Sach-/VAT-/Item-/Value-Entries je Route. | Purchase Document, Preview, Posted Doc, Ledger Trace | `needs-foundation` | `TARGET-014-P2P-PREVIEW` |
| `UAT-INV-001` | Kap. 13 - Inventory | `end-to-end-test` | Artikel, Lagerort, Inventory Posting Setup stehen | Item Journal oder Lagerbewegung | Bestands- und Wertwirkung sind ueber Item Ledger, Value Entries und ggf. G/L Entries sichtbar. | Journal, Item Ledger, Value Entries | `needs-foundation` | `TARGET-017-INVENTORY-POSTING-TRACE` |
| `UAT-PAY-001` | Kap. 19/20 - Payments | `end-to-end-test` | offene Debitoren-/Kreditorenposten, Bankkonto, Payment Journal Setup | Zahlung mit Apply Entries | Offener Posten wird ausgeglichen; Detailed Ledger, Bank Ledger und G/L Entries sind sichtbar. | Payment Journal, Apply Entries, Posted Trace | `needs-data-richness` | `TARGET-021-PAYMENTS-FOUNDATION` |
| `UAT-BANK-001` | Kap. 20 - Bank Reconciliation | `uat` | Bankkonto, Bankposten, Statement/Lines, Payments stehen | Teststatement ohne echte Bankdatei | Abstimmung zeigt Match/Apply/Difference und wird nur nach klarem Gate gebucht. | Bank Reconciliation, Lines, Bank Ledger | `needs-data-richness` | `TARGET-023-BANK-RECONCILIATION` |
| `UAT-FA-001` | Kap. 21 - Fixed Assets | `end-to-end-test` | FA Setup, Depreciation Book, FA Posting Group, G/L Integration stehen | Anlage, Zugang, AfA-Daten | Zugang und AfA erzeugen FA Ledger und G/L Entries; AfA nur nach Preview/Gate. | FA Card, FA G/L Journal, FA Ledger, G/L Entries | `needs-foundation` | `TARGET-018-FIXEDASSETS-FOUNDATION` |
| `UAT-REPORT-001` | Kap. 25 - Reporting | `uat` | gebuchte Universaarl-Posten mit Dimensionen existieren | mehrere Monate, Dimensionen, offene/geschlossene Posten | Financial Reports, G/L Entries und Analysis Views zeigen nachvollziehbare Filter-/Summenwirkung. | Reports, G/L Entries, Analysis Views | `needs-data-richness` | `TARGET-024-REPORTING-DIMENSIONS` |
| `UAT-ERR-001` | Kap. 29 - Diagnostics | `process-test` | kontrollierter Blocker oder Fehlerdialog tritt auf | Fehlertext, Page Context, Korrekturweg | Fehler wird gelesen, eingeordnet und mit sicherem naechsten Schritt geloest oder geparkt. | Error Screenshot, Page Inspection, Workaround | `planned` | laufend je Prozess |
| `UAT-CUT-001` | Kap. 26 - Migration / Opening Balances | `uat` | Foundation, Journale, Nummernserien, Posting Groups stehen | Eroeffnungsbilanz, offene Posten, Anfangsbestand | Anfangswerte sind abstimmbar und erzeugen nachvollziehbare Entries. | Journals, Trial Balance, Ledger Entries | `planned` | spaeter |
| `UAT-SHOP-001` | ausgeschlossen - Shopify / Online Store | `excluded` | keines | keines | kein Shopify-Test im FiBu-Buch. | keine | `excluded-shopify` | keiner |

## Lookahead nach PREP-028

| Case | Status | Grund |
| --- | --- | --- |
| `PREP-029-AL-OBJECT-ANALYSIS-ROADMAP` | `ready-next` | Objektanalyse soll gezielt helfen, Page/Table/Report-Verstaendnis zu verbessern, ohne UI-Evidence zu ersetzen. |
| `PREP-030-BOOK-USECASE-QUALITY-SCORECARD` | `ready-after-current` | Die Scorecard kann UAT-Level, Entry/Exit-Kriterien und Anfaengerfragen aus dieser Matrix nutzen. |
| `TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE` | `blocked` | Company Creation bleibt bis bestaetigten SUPER-/Company-Create-Rechten geparkt. |
| `TARGET-COMPANY-INFO-001` | `needs-setup-first` | Erst sinnvoll, wenn `UNIVERSAARL-DE` sichtbar angelegt ist. |

## Grenzen

- Diese Matrix ist kein bestandener UAT.
- `UNIVERSAARL-DE` existiert noch nicht als bewiesene Zielcompany.
- PREP-028 fuehrt kein Business Central, kein Playwright und keine Buchung aus.
- Jede spaetere Prozesszeile braucht eigene Universaarl-Evidence, bevor sie `universaarl-proven` oder `german-final-proof` werden darf.
