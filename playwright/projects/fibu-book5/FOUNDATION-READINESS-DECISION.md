# FOUNDATION-READINESS-DECISION

> Automatisch aus TARGET-075 Evidence erzeugt. Diese Datei ist eine Projektentscheidung, kein Buchkapitel.

## Kontext

- Quelle: playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/TARGET-075-result.json
- Instanz: playthru
- Company: UNIVERSAARL-DE
- Result-Status: partially-completed
- Erzeugt am: 2026-07-06T19:59:12.674Z
- Auth-Ziel: playthru / UNIVERSAARL-DE
- Auth-Ziel aus aktuellem State aufgebaut: ja
- Auth-Ziel passt zum State: ja
- Guard-Ziel-URL an TARGET-075 uebergeben: ja
- Guard-Ziel-URL im Result ausgegeben: nein

## Aktuelles Verdict

`UNIVERSAARL-DE` hat genug echte Oberflaechen- und Stammdaten-Evidence fuer Schulung, Handbuch und weitere lokale Routenentscheidungen. Das ist noch keine Prozessfreigabe.

- Als Schulungs-/Handbuchsubstanz nutzbar: Kontenplan-Starterkonten, Nummernserien, Dimensionsliste/-werte, Debitor `U-CUST-100 / Saarland Maschinenbau AG`, Artikel `U-ITEM-HW100 / Steuerbox Standard U100`.
- Weiterhin blockierend fuer O2C/P2P, Preview und Posting: VAT Business Posting Groups Page 470, vollstaendige VAT-/USt-Buchungsmatrix, Buchungsmatrix Einrichtung / General Posting Setup, Page-314-/Page-472-Schreibroute, globale/default Dimensionen, VAT-/Posting-Finalitaet.
- Naechste sinnvolle Arbeit: keine weitere Wiederholung abgeschlossener VAT-, Kontenplan-, Debitoren- oder Artikel-Read-first-Cases. Als naechster konkreter Projektbaustein braucht Foundation eine Route-Entscheidung: Was wird fuer eine realistische Universaarl-Implementierung manuell per UI nachgewiesen, was besser ueber Konfigurationspaket/Import vorbereitet wird, und welche offenen Gaps bleiben bewusst als Prozessgrenze geparkt?
- Datenregel: realistische fiktive Universaarl-Daten verwenden, keine UI-Mockups und keine vertraulichen echten Kundendaten.
- Buchmaster-Anker: Kapitel 9 enthaelt jetzt einen Universaarl-Abschnitt zu `U-CUST-100` und `U-ITEM-HW100`. Dieser Abschnitt ist fuer Schulung und Handbuch nutzbar, aber nicht als Prozessfreigabe zu lesen.
- Screenshot-QA fuer naechsten Live-Proof: Der naechste read-first VAT-/Posting-Setup- oder Foundation-Refresh-Lauf muss eine Bildkette mit mindestens fuenf akzeptierten Checkpoints erfassen: Startkontext, Navigationsweg, Zielseite, relevanter Button/Tooltip oder Action-Kontext, Zielzeile/FastTab/FactBox-Kontext, optional Page Inspection sowie explizite Grenze. Ein einzelner End-Screenshot reicht fuer Page- oder Feldclaims nicht mehr aus.

## Entscheidung

Master-Data-Schreibfaelle bleiben geparkt. Lesende Master-Data-Kontextprobes duerfen jetzt einzeln starten, weil Company, Kontenplan, Nummernserien und Dimensionen ausreichend sichtbar sind, um Debitoren-/Kreditoren-/Artikel-Oberflaechen ohne Datenanlage zu verstehen. Diese Entscheidung gibt keine Freigabe fuer Stammdatenanlage, Templates, Belege, Buchungsvorschau oder Buchung.

PWS-FF-002C hat die Buchungsmatrix Einrichtung neu eingeordnet: Page 314 ist nicht als generischer Navigationsblocker zu behandeln. TARGET-057 ist der staerkere Page-314-/Table-252-/Feldwahrheitsnachweis; TARGET-058/TARGET-059 parken aber den persistierten Wert `Wareneinkaufskonto 5400`. Die Buchungsmatrix bleibt deshalb partiell und nicht posting-ready.

Aktuelle General-Posting-Setup-Grenze: `INLAND` / `WAREN` / `Warenverkaufskonto 4400` darf fuer Training, Handbuch und Setup-Erklaerung genutzt werden. Es beweist nicht, dass Einkaufsaufwand, Wareneingang, O2C, P2P, Preview Posting oder Posting bereit sind. `Wareneinkaufskonto 5400` ist weiterhin nicht als persistierter Page-314-Wert bewiesen; die vorhandenen List-Edit-/Grid-/Geometrie-Routen duerfen nicht wiederholt werden, solange keine materiell neue UI-, Konfigurationspaket-, Import- oder source-backed Route dokumentiert ist.

PWS-FF-005 hat die Dimensionsliste als read-only Kontext in `playthru / UNIVERSAARL-DE` nachgewiesen: `CHANNEL`, `COSTCENTER` und `PRODUCTLINE` sind im Screenshot sichtbar. PWS-FF-005B hat danach die echte UI-Route aus der Dimensionsliste ueber `Dimension > Dimensionswerte` fuer `PRODUCTLINE`, `COSTCENTER` und `CHANNEL` read-only nachgewiesen. Das reicht fuer Foundation-Verstaendnis, UAT-/Trainingserklaerung und spaetere Handbuchsubstanz, aber nicht fuer globale Dimensionen, Standarddimensionen, Reporting Readiness, Master Data Readiness, Preview Posting oder Posting.

PWS-FF-001 hat die Nummernserien-Seite read-only beobachtet: sieben Universaarl-U-Nummernserien sind sichtbar, `Standardnr.`/`Default Nos.` und `Manuelle Anz.`/`Manual Nos.` wurden als Checkboxkontext erfasst, `Zeilen`/`Lines` und Page Inspection lieferten zusaetzliche UI-Wahrheit. Das reicht fuer Foundation-Verstaendnis und Schulungs-/Handbuchvorbereitung, aber nicht fuer vollstaendige Nummerierungs-, Setup-, Master-Data-, Audit-, Preview- oder Posting-Readiness.

## VAT-/USt-Boundary nach Read-first und Route Recovery

- Quellen:
  - playwright/projects/fibu-book5/evidence/vat-posting-setup-readfirst/result.json
  - playwright/projects/fibu-book5/evidence/vat-posting-setup-route-recovery/result.json
  - playwright/projects/fibu-book5/evidence/vat-business-posting-groups-source-or-alternative-route-decision/result.json
- Status: `partially-observed` fuer VAT Product Posting Groups und VAT Posting Setup; `blocked` fuer die sichtbare Page-470-Route der VAT Business Posting Groups.
- Akzeptiert: Page 471 zeigt `VAT19 / USt 19 Prozent`; Page 472 zeigt die VAT Posting Setup / MwSt.-Buchungsmatrix read-only als echten Business-Central-Kontext.
- Geparkt: Page 470 / MwSt.-Geschaeftsbuchungsgruppen ist lokal nicht als sichtbare Zielseite bewiesen. Direkte Page-470-URL, generische Tell-Me-/Suchroute und Page-Inspection aus Such-/Role-Center-Kontext duerfen nicht als Erfolg wiederholt werden.
- Schreibgrenze: keine VAT Business Posting Group, keine VAT Product Posting Group, keine VAT Posting Setup-Zeile, keine Sachkonto-/USt-Konto-Zuordnung, kein Beleg, keine Buchungsvorschau, keine Buchung.
- Fachgrenze: Page 471 und Page 472 erklaeren das BC-Konzept und liefern Schulungs-/Handbuchkontext. Sie beweisen keine deutsche USt-Korrektheit, keine vollstaendige `INLAND/VAT19`-Einrichtung, keine Kontoableitung und keine VAT Entries oder G/L Entries.
- Realistischer Implementierungsweg: Fuer eine grosse Firma waere eine kontrollierte Setup-Route ueber vorbereitete Tabellenwerte, Konfigurationspaket/Import oder einen eindeutig nachgewiesenen Standard-UI-Weg plausibler als wiederholtes manuelles Raten in fragilen Listen. Vor jedem Write braucht es eine separate Routenentscheidung mit Datenherkunft, Fallback, Reopen-Proof und Screenshot-QA.

## No-Write-Grenze aus TARGET-075

- Setup geaendert: nein
- Stammdaten geaendert: nein
- Beleg/Draft erzeugt: nein
- Buchungsvorschau: nein
- Buchung: nein
- Zahlung: nein
- API Shortcut: nein

## Bewiesen

- Business Central stayed in playthru / UNIVERSAARL-DE.
- 4/5 Foundation pages were accepted as read-only visible evidence.
- TARGET-075 did not write setup, master data, documents, Preview Posting, Posting, Payment or API shortcuts.
- Kontenplan / Chart of Accounts was visible read-only.
- Geschaeftsbuchungsgruppen / Gen. Business Posting Groups was visible read-only.
- Produktbuchungsgruppen / Gen. Product Posting Groups was visible read-only.
- MwSt.-Buchungsmatrix / VAT Posting Setup was visible read-only.

## PWS-FF-006 Folgeproof: Kontenplan-Starterkonten

- Quelle: playwright/projects/fibu-book5/evidence/pws-ff-006-chart-of-accounts-starter-accounts-readfirst/PWS-FF-006-result.json
- Status: observed
- Route: tell-me-search-kontenplan
- Sichtbare Starterkonten: 1200, 1406, 1800, 3300, 3806, 4400, 5400
- Fehlend oder unklar: keine
- Schreibgrenze: keine Kontoanlage, keine Kontenaenderung, kein Setup, keine Stammdaten, keine Buchungsvorschau und keine Buchung.
- Fachgrenze: Sichtbare Starterkonten sind noch kein vollstaendiger SKR04, keine Steuerberaterfreigabe und keine Posting Readiness.

## Nicht bewiesen

- No complete SKR04 chart of accounts.
- No final German tax or compliance claim.
- No VAT Posting Setup correctness.
- No General Posting Setup correctness.
- No master data readiness.
- No document, Preview Posting, Posting or ledger trace.
- Buchungsmatrix Einrichtung / General Posting Setup was not visible enough for accepted proof.

## Kontenplan

- Status: observed
- Sichtbare Starterkonten: 1200, 1406, 1800, 3300, 3806, 4400, 5400
- Fehlend oder unklar: keine
- Buchgrenze: Use as beginner-facing chart visibility only, not as complete SKR04 or posting readiness proof.

## Setup-Kontext

- Geschaeftsbuchungsgruppen: observed
- Produktbuchungsgruppen: observed
- Buchungsmatrix Einrichtung: partial-not-posting-ready
- USt-Buchungsmatrix Einrichtung: observed
- Grenze: Use as setup-page visibility and dependency map only; do not claim setup correctness from read-only visibility.

## FOUNDATION-SETUP-PACKAGE-READFIRST-DISCOVERY

- Quelle: playwright/projects/fibu-book5/evidence/foundation-setup-package-readfirst-discovery/result.json
- Status: blocked-readfirst-context
- Route: direkte Page-8615-URL, danach Tell-Me-Suche nach `Konfigurationspakete`
- Akzeptiert: `playthru / UNIVERSAARL-DE` wurde bestaetigt; es wurde nichts angelegt, importiert, validiert, angewendet oder geschrieben.
- Verworfen: Der Zielseitenbeweis fuer `Konfigurationspakete` ist nicht akzeptiert, weil die Screenshot-QA weiterhin Rollencenter-Kontext zeigt.
- Fachgrenze: Keine Table-252-/Table-325-/Page-470-Paketmetadaten, keine Setupwerte, keine Master-Data-, VAT-, Preview- oder Posting-Readiness.
- Praktische Folge: Nicht denselben Such-/Page-8615-Weg wiederholen. Naechster Schritt ist eine lokale Gate-Entscheidung: Paketroute parken, materiell andere read-only Route definieren oder ein enges Paket-Metadaten-Write-Gate mit Zweck, Cleanup/Keep-Regel und Reopen-Proof vorbereiten.

## FOUNDATION-SETUP-PACKAGE-METADATA-WRITE-GATE-DECISION

- Quelle: playwright/projects/fibu-book5/evidence/foundation-setup-package-metadata-write-gate-decision/result.json
- Status: completed-local-decision
- Entscheidung: kein Paket-Metadaten-Write-Gate, solange die Seite `Konfigurationspakete` nicht read-only belastbar sichtbar ist.
- Begruendung: Konfigurationspakete sind fuer ein echtes Kundenprojekt als Setup-/Importweg plausibel. Ein Paketkopf oder eine Paket-Tabellenzeile ist aber bereits ein Admin-Artefakt und darf nicht aus einem Rollencenter-/Suchblocker heraus erzeugt werden.
- Naechster Case: `FOUNDATION-SETUP-PACKAGE-ROUTE-RECOVERY-READFIRST`, nur lesend, mit materiell anderer Route und Bildkette.

## FOUNDATION-SETUP-PACKAGE-ROUTE-RECOVERY-READFIRST

- Quelle: playwright/projects/fibu-book5/evidence/foundation-setup-package-route-recovery-readfirst/result.json
- Status: observed-readfirst-page-route
- Route: direkte Page-8615-URL, danach scoped Tell-Me-Suche nach `Konfigurationspakete`
- Akzeptiert: `playthru / UNIVERSAARL-DE` wurde bestaetigt, die Seite `Konfigurationspakete` ist als Listenoberflaeche sichtbar, die Bildkette umfasst direkten Versuch, Tell-Me-Fallback, Zielseitenproof, Action Inventory, Hover-Kontext und No-Write-Endzustand.
- Verworfen: Kein Setup-, Paketmetadaten-, Import-, Validate-, Apply- oder Tabellenabruf-Beweis. Sichtbare Paketaktionen bleiben Inventory-only.
- Korrigierte Diagnose: Der zentrale Tell-Me-Helper und die Screenshot-QA unterscheiden jetzt zwischen offener Suche und echter Zielseite. Versteckte Rollencenter-Reste im Seitentext duerfen einen sichtbaren Listenproof nicht mehr falsch blockieren.
- Fachliche Folge: Konfigurationspakete sind wieder ein realistischer BC-Implementierungsweg fuer die Foundation-Route. Der naechste Schritt ist trotzdem nur ein lokaler Metadata-Write-Gate-Entscheid, weil ein Paketkopf bereits ein Admin-Artefakt waere.
- Naechster Case: `FOUNDATION-SETUP-PACKAGE-METADATA-WRITE-GATE-DECISION`, lokal/no-live. Dort wird entschieden, ob ein enger Paket-Metadaten-Write fachlich sinnvoll ist und welche Stop-/Cleanup-/Keep-Regeln gelten.

## FOUNDATION-SETUP-PACKAGE-ROUTE-PARK-OR-ALTERNATIVE-DECISION

- Status: withdrawn-before-commit
- Entscheidung: Der lokale Park-Entschluss wurde zurueckgenommen, weil die bessere Diagnose ein Tell-Me-Helper-/Screenshot-QA-Problem ist.
- Grenze: Die Route ist nach Helper-Korrektur read-first bewiesen, aber nicht als Setup- oder Importweg freigegeben.
- Naechster Case: `FOUNDATION-SETUP-PACKAGE-METADATA-WRITE-GATE-DECISION`.

## FOUNDATION-SETUP-PACKAGE-METADATA-WRITE-GATE-DECISION

- Quelle: playwright/projects/fibu-book5/evidence/foundation-setup-package-metadata-write-gate-decision/result.json
- Status: completed-local-decision
- Entscheidung: Kein neuer Paketkopf. In `playthru / UNIVERSAARL-DE` existiert bereits `U-VAT325-DISC`, und ein frischer Paketkopf wuerde die Metadatenlage verschlechtern.
- Naechster Case: `FOUNDATION-SETUP-PACKAGE-EXISTING-METADATA-READFIRST`, read-first/no-write. Dort wird das bestehende Paket als `keep`, `cleanup-needed` oder `route-candidate` klassifiziert.
- Weiterhin gesperrt: `Tabellen abrufen`, Import, Export, Validate, Apply, Edit in Excel, Delete, Setupwerte, Stammdaten, Preview Posting und Posting.

## FOUNDATION-SETUP-PACKAGE-EXISTING-METADATA-READFIRST

- Quelle: playwright/projects/fibu-book5/evidence/foundation-setup-package-existing-metadata-readfirst/result.json
- Status: observed-existing-metadata-readfirst
- Akzeptiert: `playthru / UNIVERSAARL-DE` wurde bestaetigt. Die Seite `Konfigurationspakete` oeffnet als rechtes Seitenpaneel ueber dem Rollencenter. `U-VAT325-DISC` ist sichtbar; die Zeile zeigt `0` Tabellen und `0` Datensaetze.
- UI-Learning: Nach Tell-Me-Navigation nicht sofort `Escape` druecken, weil dadurch das echte Seitenpaneel geschlossen wird. Screenshot-QA muss das Vordergrund-Paneel bewerten und den abgedunkelten Rollencenter-Hintergrund ignorieren.
- Verworfen: Kein Paketkarteninhalt, keine Tabellenzeile fuer Table 252, Table 325 oder Page/Table 470, kein Import, Export, Validate, Apply, Delete, Edit in Excel oder Setupwert.

## FOUNDATION-SETUP-PACKAGE-KEEP-CLEANUP-DECISION

- Quelle: playwright/projects/fibu-book5/evidence/foundation-setup-package-keep-cleanup-decision/result.json
- Status: completed-local-decision
- Entscheidung: `U-VAT325-DISC` bleibt als `parked-route-candidate` erhalten. Es wird jetzt nicht geloescht und nicht fuer Setup wiederverwendet.
- Begruendung: Die Metadatenzeile mit 0 Tabellen/0 Datensaetzen ist als bestehendes Admin-Artefakt harmlos genug, um sie vorerst stehen zu lassen. Loeschen waere ein unnoetiger Cleanup-Write; Wiederverwendung waere ohne genaue Tabellen-/Feld-Mapping-Entscheidung fachlich zu frueh.
- Naechster Case: `FOUNDATION-SETUP-PACKAGE-TABLE-MAPPING-SOURCE-DECISION`, lokal/no-live. Dort wird entschieden, ob Konfigurationspakete fuer die naechsten Foundation-Gaps besser sind als manuelle UI, Assisted Setup oder andere Standardwege.
- Weiterhin gesperrt: Business Central oeffnen, Playwright live ausfuehren, Paketaktionen, Setupwerte, Stammdaten, Belege, Preview Posting und Posting.

## PWS-FF-002C Route Decision: Buchungsmatrix Einrichtung

- Quelle: playwright/projects/fibu-book5/evidence/pws-ff-002c-general-posting-setup-route-decision/PWS-FF-002C-result.json
- PWS-FF-002/PWS-FF-002B: direkte Page-314-URL und Tell-Me/Search-Routen sind als Zielseitennachweis verworfen.
- TARGET-057: Page 314, Table 252 und `Purch. Account` Feldkontext sind als technische Feldwahrheit akzeptiert.
- TARGET-058/TARGET-059: getestete List-Edit-/Grid-/Headerroute fuer `5400` ist geparkt; keine Persistenz nach Reopen.
- TARGET-032P: Page-314-Geometrie-/List-Edit-Route ist erschoepft; General Posting Setup bleibt partiell und darf nur mit materiell neuer Route wieder aufgenommen werden.
- Akzeptierter Teilstand: `INLAND` / `WAREN` / `Warenverkaufskonto 4400`.
- Offene Grenze: `Wareneinkaufskonto 5400`, vollstaendige Buchungsmatrix, Posting Readiness, Preview Posting und Posten.
- Praktische Folge: keine Wiederholung der verworfenen Page-314-Routen ohne materiell neue Hypothese; Master-Data-Schreibfaelle bleiben geparkt. Lesende Debitoren-/Kreditoren-/Artikel-Kontextprobes duerfen erst nach dieser Foundation-Entscheidung einzeln laufen.

### Aktueller Entscheid fuer O2C/P2P

O2C/P2P bleiben gesperrt, auch wenn Debitor `U-CUST-100` und Artikel `U-ITEM-HW100` fuer Training und Handbuch nutzbar sind. Fuer einen realistischen Verkaufs- oder Einkaufsprozess fehlen weiterhin:

- vollstaendige Buchungsmatrix Einrichtung / General Posting Setup fuer die betroffenen Business-/Product-Kombinationen,
- persistierter Nachweis fuer `Wareneinkaufskonto 5400` auf `INLAND` / `WAREN`,
- belastbare VAT Posting Setup Boundary fuer `INLAND` / `VAT19`,
- Preview- oder Posten-Nachweis, der zeigt, welche Sachkonten, USt-Posten und Wertposten tatsaechlich entstehen.

Diese Grenze ist kein reiner Testblocker. Sie ist fachlich richtig: Ein echter Kunde darf Verkaufs- oder Einkaufsbelege erst trainieren oder abnehmen, wenn klar ist, welche Konten Business Central bei der Buchung trifft und welche Steuerlogik greift.

## PWS-FF-005 Dimensionen Read-first

- Quelle: playwright/projects/fibu-book5/evidence/pws-ff-005-dimensions-readfirst/PWS-FF-005-result.json
- Status: partially-completed
- Akzeptiert: Dimensionsliste ueber Tell-Me-Route, Screenshot mit `CHANNEL`, `COSTCENTER`, `PRODUCTLINE`.
- Verworfen: direkte Page-537-/Tell-Me-Route fuer Dimensionswerte; sie oeffnet beziehungsweise zeigt nicht die Zielseite fuer Dimensionswerte.
- Offen: Dimensionswerte fuer PRODUCTLINE, COSTCENTER, CHANNEL; Finanzbuchhaltung Einrichtung mit globalen Dimensionsfeldern.
- Schreibgrenze: keine Dimension, kein Dimensionswert, keine globale Dimension, keine Standarddimension, keine Stammdaten, keine Buchungsvorschau, keine Buchung.
- Praktische Folge: `PWS-FF-005B` muss zuerst die read-only Related-Action-Route `Dimensionen -> Dimension -> Dimensionswerte` pruefen oder den Blocker bewusst parken.

## PWS-FF-005B Dimensionswerte Related-Action-Route

- Quelle: playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/PWS-FF-005B-result.json
- Status: observed
- Akzeptiert: `Dimensionen -> Dimension -> Dimensionswerte` fuer `PRODUCTLINE`, `COSTCENTER` und `CHANNEL`.
- Sichtbare Werte: `SOFTWARE`, `TRAINING`, `OPERATIONS`, `SALES`, `PARTNER` sowie die zugehoerigen Dimensionswerte-Seitenkontexte.
- UI-Learning: Fuer Business-Central-Action-Bar-, Dropdown- und Grid-Routen sind Zwischen-Screenshots Pflicht. End-Screenshots allein koennen falsche Annahmen verbergen.
- Schreibgrenze: keine Dimension, kein Dimensionswert, keine globale Dimension, keine Standarddimension, keine Stammdaten, keine Buchungsvorschau, keine Buchung.
- Fachgrenze: sichtbare Dimensionswerte beweisen keine Reporting-, UAT-, Master-Data-, Preview- oder Posting-Bereitschaft.
- Praktische Folge: Dimensionen duerfen als read-only Foundation-Baustein fuer Training/Handbuch eingeordnet werden.

## PWS-FF-001 Nummernserien Read-first

- Quelle: playwright/projects/fibu-book5/evidence/pws-ff-001-number-series-readfirst/PWS-FF-001-result.json
- Status: observed
- Akzeptiert: Nummernserien-Seite Page 456 wurde ueber Tell-Me/Suche read-only geoeffnet.
- Sichtbar: `U-CUST`, `U-VEND`, `U-ITEM`, `U-SO`, `U-SINV`, `U-PO`, `U-PINV` mit Start-/Endsignalen.
- UI-Learning: Suchtreffer heisst in dieser Oberflaeche `Nummernserie Verwaltung`; zu strenge Tell-Me-Erwartungen blockieren korrekte BC-Navigation. Nach `Zeilen`/`Lines` muss Playwright sofort auf den Ziel-Dialog pruefen, weil BC-Dialoge den alten Button ueberlagern koennen.
- Screenshot-QA: Liste, U-CUST-Zeilenauswahl, Checkbox-Hover, Zeilenkontext und Page Inspection wurden getrennt erfasst.
- Schreibgrenze: keine Nummernserie, keine Nummernserienzeile, keine Setup-Zuweisung, keine Stammdaten, keine Buchungsvorschau, keine Buchung.
- Fachgrenze: sichtbare U-Nummernserien beweisen keine Vollstaendigkeit, keine Persistenz durch Schreib-/Reopen-Zyklus, keine rechtliche Nummerierungs-/Audit-Readiness und keine Master-Data-Readiness.
- Praktische Folge: Nummernserien duerfen als read-only Foundation-Baustein fuer Training/Handbuch eingeordnet werden. Der naechste sinnvolle Schritt ist ein einzelner Debitoren-Readfirst-Probe, nicht eine Debitorenanlage.

## PWS-MD-001 Debitoren-Kontext Read-first

- Quelle: playwright/projects/fibu-book5/evidence/pws-md-001-customer-context-readonly/PWS-MD-001-result.json
- Status: observed
- Akzeptiert: Die Debitorenliste `Customer List (22, List)` wurde read-only in `playthru / UNIVERSAARL-DE` geoeffnet.
- Sichtbar: Page Inspection zeigt `Customer (18)` mit Feldern wie `No.`, `Name`, `Customer Posting Group` und `Payment Terms Code`.
- UI-Learning: Direkte Page-22-Navigation kann im Rollencenter landen. Die sichtbare `Debitoren`-Navigation aus dem Rollencenter ist die bessere Nutzerroute; Playwright muss solche sichtbaren BC-Links frame-aware suchen.
- Screenshot-QA: Rollencenter/Listenkontext, Debitoren-Linkroute, Aktions-/Hover-Kontext und Page Inspection wurden getrennt erfasst.
- Schreibgrenze: kein Debitor, keine Debitorenvorlage, kein Verkaufsbeleg, keine Buchungsvorschau, keine Buchung.
- Fachgrenze: sichtbare Debitorenfelder beweisen keine Debitorenanlage, keine Buchungsgruppen-Korrektheit, keine USt-Korrektheit und keine Verkaufsprozessbereitschaft.
- Praktische Folge: Der naechste sinnvolle Master-Data-Probe ist `PWS-MD-002` Kreditoren read-only, aber nur mit derselben mehrstufigen Screenshot-QA.

## PWS-MD-002 Kreditoren-Kontext Read-first

- Quelle: playwright/projects/fibu-book5/evidence/pws-md-002-vendor-context-readonly/PWS-MD-002-result.json
- Status: observed
- Akzeptiert: Die Kreditorenliste `Vendor List (27, List)` wurde read-only in `playthru / UNIVERSAARL-DE` geoeffnet.
- Sichtbar: leere Kreditorenliste, Import-/Datenmigration-Hinweis, `Neu`, `Loeschen`, FactBox `Kreditorenstatistik` und Page Inspection zu `Vendor (23)` mit Feldern wie `No.`, `Name`, `Vendor Posting Group`, `Payment Terms Code` und `Payment Method Code`.
- UI-Learning: Die PWS-MD-001-Route mit frame-aware Role-Center-Navigation und mehrstufiger Screenshot-QA ist auf Kreditoren uebertragbar.
- Schreibgrenze: kein Kreditor, keine Kreditorenvorlage, keine Bankdaten, kein Einkaufsbeleg, keine Zahlung, keine Buchungsvorschau, keine Buchung.
- Fachgrenze: sichtbare Kreditorenfelder beweisen keine Kreditorenanlage, keine Zahlungs-/Bankbereitschaft, keine Buchungsgruppen-Korrektheit und keine Einkaufsprozessbereitschaft.
- Praktische Folge: Der naechste sinnvolle Master-Data-Probe ist `PWS-MD-003` Artikel/Services read-only, aber ohne Artikelanlage oder Setup-Aenderung.

## PWS-MD-003 Artikel-/Service-Kontext Read-first

- Quelle: playwright/projects/fibu-book5/evidence/pws-md-003-item-service-context-readonly/PWS-MD-003-result.json
- Status: observed
- Akzeptiert: Die Artikelliste `Item List (31, List)` wurde read-only in `playthru / UNIVERSAARL-DE` geoeffnet.
- Sichtbar: vorhandener Artikel `U-ITEM-HW100`, Beschreibung `Universaarl Hardware 100Inventory`, Art `Bestand`, Basiseinheit `STK`, Lagerbestand `0`, FactBox-Details zu Fakturierung/Planung und Page Inspection zu `Item (27)`.
- UI-Learning: Auch Artikel/Services brauchen mehrstufige Screenshot-QA, weil vorhandene Datensaetze und FactBoxen leicht zu starken Prozessclaims verleiten.
- Schreibgrenze: kein Artikel, kein Service, keine Vorlage, keine Einheit, keine Buchungsgruppe, keine Lager-/Kosten-/Planungseinrichtung, kein Einkaufs- oder Verkaufsbeleg, keine Buchungsvorschau, keine Buchung.
- Fachgrenze: sichtbarer Artikelbestand und sichtbare Artikel-Felder beweisen keine Artikelanlage dieses Laufs, keine Product-Posting-/VAT-Product-/Inventory-Posting-Korrektheit, keine Costing-Method-Korrektheit und keine O2C-/P2P-/Inventory-Bereitschaft.
- Praktische Folge: Nach Debitoren, Kreditoren und Artikeln ist kein weiterer blinder Read-first-Microcase sinnvoll. Naechster Schritt ist eine kleine `FOUNDATION-MASTER-DATA-ROUTE-DECISION`: Was darf als naechstes geschrieben werden, was braucht vorher Setup-/Template-/Datenentscheidung?

## Foundation-Read-first-Folgeprobes

Diese Tabelle verhindert den Sprung in Stammdaten, wenn TARGET-075 zuerst eine engere Foundation-Luecke zeigt. Sie gibt keine Schreibfreigabe.

| Kandidat | Entscheidung | Nutzen nach TARGET-075 | Bleibt verboten |
| --- | --- | --- | --- |
| `PWS-FF-002` Buchungsgruppen (Posting Groups) | required-before-master-data | TARGET-075 shows missing, rejected or unclear business/product/general posting group or posting setup context. | Buchungsgruppen speichern, Buchungsmatrix-Zeilen aendern, Preview Posting, Posting |
| `PWS-FF-004` USt/MwSt.-Einrichtung (VAT setup boundary) | required-before-master-data | TARGET-075 shows VAT gaps, unclear VAT Posting Setup rows or weak screenshot QA. | USt-Gruppen speichern, VAT Posting Setup schreiben, Steuerfinalitaet behaupten, Posting |
| `PWS-FF-005` Dimensionen und Dimensionswerte | required-before-master-data | TARGET-075 leaves dimensions, dimension values, global dimensions or reporting boundaries unclear. | Dimension speichern, Dimensionswert speichern, Standarddimension aendern, Reporting- oder Postenclaim behaupten |
| `PWS-FF-003` Zahlungsbedingungen (Payment Terms) | required-before-master-data | TARGET-075 or the master-data handoff shows unclear customer/vendor payment terms. | Zahlungsbedingung speichern, Zahlungsart oder Bankdaten erfassen, Zahlung vorbereiten |
| `PWS-FF-001` Nummernserien (Number Series) | required-before-master-data | TARGET-075 or the master-data handoff shows unclear numbering logic for customers, vendors or items. | Nummernserie speichern, Setup zuweisen, Stammdatensatz anlegen |

## Blocker und Warnungen

- Warnung: New/Neu action may be visible but was not clicked.
- Warnung: Edit/Bearbeiten action may be visible but was not clicked.
- Warnung: Posting or preview action text may be visible but was not clicked.

## UAT und Training

- Key User sehen, wo Kontenplan-, Buchungsgruppen-, Nummernserien- und Stammdatenkontext liegen.
- Der Foundation-Checkpoint wird als Uebung vor der ersten Stammdatenerfassung nutzbar.
- Stop-Bedingungen fuer Setup- und Stammdatenseiten bleiben sichtbar: Schreibaktionen, unklare Dialoge oder fehlende Page-/Feld-Evidence stoppen den naechsten wirksamen Schritt.

## Master-Data-Read-first-Handoff

Diese Entscheidung gibt keine Schreibfreigabe. Sie waehlt hoechstens den naechsten lesenden Master-Data-Probe.

| Kandidat | Entscheidung | Mindestgrundlage | Bleibt verboten |
| --- | --- | --- | --- |
| `PWS-MD-001` Debitoren (Customers) | observed-readfirst | Debitorenliste und zentrale Felder wurden read-only mit mehrstufiger Screenshot-QA beobachtet. | Debitor speichern, Vorlage aendern, Verkaufsbeleg anlegen |
| `PWS-MD-002` Kreditoren (Vendors) | observed-readfirst | Kreditorenliste und zentrale Felder wurden read-only mit mehrstufiger Screenshot-QA beobachtet. | Kreditor speichern, Bankdaten erfassen, Einkaufsbeleg oder Zahlung anlegen |
| `PWS-MD-003` Artikel/Services/Nichtlagerartikel | observed-readfirst | Artikelliste, vorhandener Artikel `U-ITEM-HW100` und zentrale Felder wurden read-only mit mehrstufiger Screenshot-QA beobachtet. | Artikel speichern, Basiseinheit anlegen, Lager-/Bewertungs-/Buchungssetup aendern, Lagerwert oder Wertposten behaupten |

Erlaubte Anschlussklassifikationen:

- Debitoren: `ready-for-customer-write-gate`, `needs-foundation-follow-up`, `needs-template-discovery`, `blocked`.
- Kreditoren: `ready-for-vendor-write-gate`, `needs-foundation-follow-up`, `needs-template-discovery`, `needs-payment-boundary-decision`, `blocked`.
- Artikel/Services: `ready-for-item-write-gate`, `needs-uom-follow-up`, `needs-product-posting-follow-up`, `needs-inventory-setup-follow-up`, `needs-service-route-decision`, `blocked`.

`ready-for-*-write-gate` bedeutet nur, dass ein spaeterer Smart-Decision-Case vorbereitet werden darf. Es erlaubt kein direktes Schreiben, Importieren, Buchen oder Posten.

## FOUNDATION-MASTER-DATA-ROUTE-DECISION

- Quelle: PWS-MD-001, PWS-MD-002 und PWS-MD-003 Result JSONs.
- Status: completed-local-decision
- Entscheidung: Debitoren (Customers) sind der erste Master-Data-Kandidat, aber noch nicht als direkter Anlagefall. Der naechste Live-Case ist ein enger Debitoren-Karten-/Vorlagen-/Pflichtfeld-Preflight mit Screenshot-QA und ohne Speichern.
- Warum Debitoren zuerst: Ein Debitor ist fuer Anfaenger didaktisch am einfachsten, traegt spaeter O2C, OP-Liste, Zahlung und Buchkapitel, und hat weniger technische Abhaengigkeiten als Artikel/Services. Er braucht keine Bankdaten und keine Lager-/Kostenbewertungslogik.
- Warum nicht Kreditoren zuerst: Kreditoren fuehren schnell in Zahlungsbedingungen, Bank-/Zahlungsdaten, P2P, Eingangsrechnung und Zahlungsvorschlag. Das ist fachlich wichtig, aber als erster Write-Gate-Kandidat riskanter.
- Warum nicht Artikel/Services zuerst: Artikel haengen an Basiseinheit, Artikelart, Lagerbuchungsgruppe, Produktbuchungsgruppe, USt-Produktbuchungsgruppe, Kalkulationsmethode, Lager-/Bewertungssetup und spaeter Wertposten. Zudem existiert `U-ITEM-HW100` bereits sichtbar; ein blindes Duplikat waere schlechter Projektstil.
- Naechster Case: `PWS-MD-004-CUSTOMER-CARD-TEMPLATE-REQUIRED-FIELDS-PREFLIGHT`.
- Schreibgrenze: kein Debitor, keine Vorlage, keine Buchungsgruppe, keine Zahlungsbedingung, keine Dimension, kein Verkaufsbeleg, keine Buchungsvorschau, keine Buchung.
- Pflicht-Screenshot-QA fuer den naechsten Case: Debitorenliste, `Neu`-/Dropdown- oder Tooltip-Kontext, ggf. Vorlagendialog nur wenn ohne Speichern abbrechbar, sichtbare Pflichtfelder/FastTabs, Page Inspection.
- Stop-Regeln: Stop, wenn `UNIVERSAARL-DE` nicht eindeutig aktiv ist, ein Dialog Speichern/Erstellen erzwingt, ein Template nicht abbrechbar ist, Buchungsgruppen oder Nummernserien nicht sichtbar/erklaerbar sind oder ein Feld nur ueber fragiles Force-/Koordinatenklicken erreichbar waere.
- UAT/Training-Auswirkung: Der Preflight liefert Schulungsmaterial fuer Debitorenliste, Debitorenkarte, Pflichtfelder und sichere Abbruchlogik. Er beweist noch keine Debitorenanlage und keine Verkaufsprozessbereitschaft.

## PWS-MD-004 Customer Prewrite Boundary

- Quelle: playwright/projects/fibu-book5/evidence/pws-md-004-customer-card-template-required-fields-preflight/PWS-MD-004-result.json
- Status: observed-prewrite-boundary
- Akzeptiert: Debitorenliste, `Neu`-/Hover-Kontext und no-click Menuegrenze wurden mit mehreren Screenshots dokumentiert.
- Sichtbar: `U-CUST-100` existierte bereits in `playthru / UNIVERSAARL-DE`; die spaetere realistische Identitaet ist `Saarland Maschinenbau AG`.
- UI-Learning: Mehr Screenshots haben einen falschen Folgeschritt verhindert. Page Inspection landete auf dem Role Center Shell und ist deshalb kein Debitoren-Tabellenbeweis.
- Schreibgrenze: kein `Neu`-Create geklickt, keine Vorlage gewaehlt, kein Debitor gespeichert, keine Werte getippt, kein Verkaufsbeleg, keine Buchungsvorschau, keine Buchung.
- Folgeentscheidung: `PWS-MD-005-CUSTOMER-U-CUST-100-CONTROLLED-CREATE-GATE` ist fuer `U-CUST-100` obsolete. Naechster sinnvoller Case ist `PWS-MD-004B-CUSTOMER-REOPEN-AND-FIELD-PROOF`.
- Fachgrenze: Sichtbarkeit eines Debitors beweist keine Debitorenkarten-Vollstaendigkeit, keine Buchungsgruppen-/USt-Korrektheit, keine Verkaufsprozessbereitschaft und keinen Reopen-/Feldbeweis.

## PWS-MD-004B Customer Reopen and Field Proof

- Quelle: playwright/projects/fibu-book5/evidence/pws-md-004b-customer-reopen-and-field-proof/PWS-MD-004B-result.json
- Status: observed-existing-customer-boundary
- Akzeptiert: vorhandener Debitor `U-CUST-100` wurde ohne Anlage, Bearbeitung oder Speichern geoeffnet/selektiert; die aktuelle Schulungsidentitaet ist `Saarland Maschinenbau AG`.
- Sichtbar: Debitorenkarte, `Nr.`, `Name`, leere Adress-/Kontaktfelder, FactBox, Pflicht-/Hinweismarker bei `Fakturierung` und `Zahlungen`, Page Inspection mit `Customer Card (21, Card)` und `Customer (18)`.
- UI-Learning: Mehr Screenshots sind noetig, weil Listenansicht, Kartenansicht und Page Inspection unterschiedliche Wahrheiten liefern. In diesem Lauf ist Page Inspection als Debitoren-/Customer-Kontext akzeptiert.
- Schreibgrenze: kein `Neu`, kein Debitor erstellt, kein Debitor bearbeitet, keine Werte getippt, keine Vorlage, keine Buchungsgruppe, keine Zahlungsbedingung, kein Verkaufsbeleg, keine Buchungsvorschau, keine Buchung.
- Folgeentscheidung: Der Nachweis reicht fuer Handbuch-/Training-Draft zur Debitorenkarte. Er reicht nicht fuer Debitoren-Write-Gate, O2C-Readiness, USt-Korrektheit, Buchungsgruppen-Korrektheit oder Posting.
- Naechster Case: `PWS-MD-CUSTOMER-SETUP-GAP-DECISION` lokal auswerten; keine weitere Live-UI oeffnen, bis die Setup-Gaps aus PWS-MD-004B entschieden sind.

## PWS-MD-CUSTOMER-SETUP-GAP-DECISION

- Quelle: playwright/projects/fibu-book5/evidence/pws-md-customer-setup-gap-decision/PWS-MD-CUSTOMER-SETUP-GAP-DECISION-result.json
- Status: completed-local-decision
- Entscheidung: `U-CUST-100` ist als vorhandener Debitor fuer Handbuch-/Training-Draft zur Debitorenkarte nutzbar, aber nicht setup-ready und nicht O2C-ready.
- Akzeptiert fuer Training: Debitorennummer, Name, Debitorenkarte, allgemeine Felder, Adress-/Kontaktbereich, FactBox und Page Inspection koennen Anfaengern die Orientierung auf der Debitorenkarte zeigen.
- Blockiert fuer O2C: `Fakturierung` und `Zahlungen` zeigen Pflicht-/Hinweismarker, wurden aber noch nicht aufgeklappt und bewertet. Customer Posting Group, VAT Business Posting Group, Payment Terms, Payment Method und Dimensions-/Posting-Kontext sind nicht als vollstaendig oder korrekt bewiesen.
- UI-Learning: Der naechste UI-Lauf braucht mehr Screenshot-Checkpoints: Liste, Karte, aufgeklappte `Fakturierung`, aufgeklappte `Zahlungen`, Page Inspection und Endzustand ohne Speichern.
- Schreibgrenze: kein Debitor anlegen, bearbeiten oder speichern; keine Vorlage, Buchungsgruppe, Zahlungsbedingung, USt-/VAT-Einstellung, Dimension, Verkaufsbeleg, Buchungsvorschau oder Buchung.
- Naechster Case: `PWS-MD-004C-CUSTOMER-BILLING-PAYMENTS-FASTTABS-READFIRST`.

## PWS-MD-004C Customer Billing and Payments FastTabs

- Quelle: playwright/projects/fibu-book5/evidence/pws-md-004c-customer-billing-payments-fasttabs-readfirst/PWS-MD-004C-result.json
- Status: observed-read-first-fasttabs
- Akzeptiert fuer Training: vorhandener Debitor `U-CUST-100` wurde read-only auf der Debitorenkarte geoeffnet; die aktuelle realistische fiktive Identitaet ist `Saarland Maschinenbau AG`. `Fakturierung` und `Zahlungen` wurden aufgeklappt und mit mehreren Screenshots sowie Page Inspection dokumentiert.
- Sichtbar: `Fakturierung` zeigt abrechnungs- und buchungsnahe Felder wie USt-/E-Rechnungs-/Geschaeftsbuchungsgruppen-Kontext. `Zahlungen` zeigt Zahlungsfeld-Kontext wie `Zlg.-Bedingungscode`.
- UI-Learning: Screenshot-QA muss vor der Bewertung kommen. Der direkte Karten-URL-Kontext kann auf das Role Center zurueckfallen, `Escape` kann eine Karte schliessen, und FastTab-Ueberschriften koennen mehrfach vorkommen oder durch aktive Eingabefelder abgefangen werden.
- Schreibgrenze: kein Debitor angelegt, bearbeitet oder gespeichert; keine Vorlage, keine Buchungsgruppe, keine Zahlungsbedingung, keine USt-/VAT-Einstellung, keine Dimension, kein Verkaufsbeleg, keine Buchungsvorschau, keine Buchung.
- Folgeentscheidung: Die Screenshots reichen fuer eine kundentaugliche Debitorenkarten-Schulung. Sie reichen nicht fuer Debitoren-Write-Gate, O2C-Readiness, USt-Korrektheit, Buchungsgruppen-Korrektheit oder Posting.
- Folgeoutput: Trainingskarte `TR-03-01A Debitorenkarte lesen: Fakturierung und Zahlungen` wurde in `.agent/project-template/TRAINING-MODULE-CARDS-DRAFT.md` erstellt und spaeter auf `U-CUST-100 / Saarland Maschinenbau AG` synchronisiert.
- Aktueller Folgepunkt: Diese Debitoren-Evidence ist konsumiert. Sie fuehrt nicht direkt in O2C oder weitere Kundenschreibfaelle, sondern in die uebergeordnete `FOUNDATION-READINESS-DECISION`: VAT-/Posting-Boundaries zuerst entscheiden, dann erst weitere Kundenpaket- oder Prozessrouten.

## Naechste Projektoutputs

- PWS-FF-002C, TARGET-057, TARGET-058 und TARGET-032P als aktuelle Buchungsmatrix-Grenze konsumieren: Page 314 ist partiell bekannt, aber nicht posting-ready.
- PWS-FF-006 als akzeptierten Kontenplan-Starterkonten-Nachweis konsumieren; keine weitere Starterkonten-Wiederholung ohne neuen Claim.
- VAT-POSTING-SETUP-READFIRST, VAT-POSTING-SETUP-ROUTE-RECOVERY und VAT-BUSINESS-POSTING-GROUPS-SOURCE-OR-ALTERNATIVE-ROUTE-DECISION als aktuelle VAT-Grenze konsumieren: Page 471/Page 472 sind echter Kontext, Page 470 bleibt sichtbarer UI-Blocker.
- Master-Data-Schreibfaelle, USt-Schreiblaeufe, Buchungsgruppen-Schreiblaeufe, Buchungsvorschau und Buchung bleiben geparkt. Naechster Schritt ist keine weitere Debitoren-Microprobe und keine Wiederholung von TARGET-075, sondern eine enge Foundation-Route-Entscheidung: manueller UI-Weg, Konfigurationspaket/Import, source-backed Page Inspection oder bewusstes Parken.
- PWS-FF-005B als beobachteten no-write Dimensionswerte-Proof konsumieren.
- PWS-FF-001 als beobachteten no-write Nummernserien-Proof konsumieren.
- `PWS-MD-001`, `PWS-MD-002` und `PWS-MD-003` sind als read-only Kontext beobachtet und konsumiert. Debitor und Artikel haben Schulungswert; Kreditoren bleiben fuer P2P und Zahlung spaeter separat vorzubereiten.
- Master Data bleibt nur training-/handbook-ready, nicht process-ready, bis VAT-/Posting-Boundaries akzeptiert oder geloest sind.
- Akzeptierte Screenshots duerfen als Handbuch-/Trainingsentwurf genutzt werden, aber nicht als finaler Compliance-Nachweis.

## Evidence

- Screenshot: playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-001-chart-of-accounts.png
- Screenshot: playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-002-general-business-posting-groups.png
- Screenshot: playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-003-general-product-posting-groups.png
- Screenshot: playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-004-general-posting-setup.png
- Screenshot: playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-005-vat-posting-setup.png
- Screenshot: playwright/projects/fibu-book5/evidence/pws-ff-006-chart-of-accounts-starter-accounts-readfirst/pws-ff-006-010-chart-of-accounts-starter-accounts.png
- Screenshot: playwright/projects/fibu-book5/evidence/pws-ff-001-number-series-readfirst/pws-ff-001-010-number-series-list-context.png
- Screenshot: playwright/projects/fibu-book5/evidence/pws-ff-001-number-series-readfirst/pws-ff-001-030-checkbox-hover-context.png
- Screenshot: playwright/projects/fibu-book5/evidence/pws-ff-001-number-series-readfirst/pws-ff-001-040-lines-action-context.png

## Aktueller Stand nach Debitor- und Artikel-Evidence

- Debitor `U-CUST-100 / Saarland Maschinenbau AG` ist als realistische fiktive Universaarl-Kundendatenbasis fuer Handbuch, Training und spaetere O2C-Vorbereitung verwendbar. Das ist kein Claim auf echte vertrauliche Kundendaten.
- Artikel `U-ITEM-HW100 / Steuerbox Standard U100` ist in echter `playthru`-Oberflaeche beobachtet. `STK`, `WARE`, `VAT19`, FIFO-Kontext, Einstandspreis `100,00` und VK-Preis `149,00` sind als realistische fiktive Universaarl-Werte belegt.
- Beide Stammdatensaetze reichen fuer Schulungs- und Handbuchsubstanz. Sie reichen noch nicht fuer Verkaufs-/Einkaufsbelege, Buchungsvorschau, Buchung oder USt-/Posting-Finalitaet.
- Blockierend bleibt die Foundation-Grenze: VAT Business Posting Groups, VAT Posting Setup und Posting Setup muessen entweder mit belastbarer neuer Route bewiesen oder bewusst als Prozessgrenze geparkt werden. Fuer realistische Kundenarbeit ist eine Route-Entscheidung wichtiger als der naechste isolierte UI-Klick.
- Projektregel: echte Business-Central-Oberflaechen und echte Sandbox-Beobachtungen nutzen; keine UI-Mockups als Evidence, keine vertraulichen echten Kundendaten im Repo.

## Naechster Case

- `FOUNDATION-SETUP-ROUTE-DECISION` als naechster lokaler Projektbaustein vorbereiten: VAT-/Posting-Boundaries in eine realistische Implementierungsroute ueberfuehren. Kandidaten sind manueller Standard-UI-Weg, Konfigurationspaket/Import, source-backed Page Inspection oder bewusstes Parken als Prozessgrenze. Keine BC-Live-Ausfuehrung, kein Speichern, kein Import, kein O2C/P2P in diesem Entscheidungsschritt.

## FOUNDATION-SETUP-ROUTE-DECISION

- Quelle: playwright/projects/fibu-book5/evidence/foundation-setup-route-decision/result.json
- Status: completed-local-decision
- Entscheidung: Fuer die offenen Foundation-Gaps ist der naechste realistische Projektweg eine kompakte Konfigurationspaket-/Excel-unterstuetzte Feldkarte, bevor Business Central wieder geoeffnet oder Setup geschrieben wird.
- Warum: Posting Groups und VAT Setup sind Kontenfindungs- und Steuerlogik, keine reine Klickstrecke. Wiederholte manuelle Zellversuche auf Page 314 oder Page 472 sind fragiler als eine vorbereitete Feldkarte mit Owner, Quelle, Validierung, Screenshot-Bedarf und Reopen-Proof-Plan.
- Rolle der manuellen UI: weiter wichtig fuer Schulung, Handbuch und Einzelvalidierung. Sie ist aber nicht der primaere Wiederholweg fuer mehrere Foundation-Setup-Zeilen, solange kein stabiler Editorpfad bewiesen ist.
- Rolle von Quellen und Page Inspection: Quellen erklaeren Produktlogik; Page Inspection kann Tabellen-/Feldwahrheit liefern. Beides ersetzt keinen spaeteren `playthru`-Nachweis gespeicherter Werte.
- Schreibgrenze: kein Konfigurationspaket erstellt, importiert, validiert oder angewendet; keine Setup-Aenderung, keine Stammdatenanlage, kein Beleg, keine Buchungsvorschau, keine Buchung.
- Naechster Case: `FOUNDATION-SETUP-PACKAGE-FIELD-MAP`.

## FOUNDATION-SETUP-PACKAGE-FIELD-MAP

- Quelle: playwright/projects/fibu-book5/evidence/foundation-setup-package-field-map/result.json
- Feldkarte: playwright/projects/fibu-book5/UNIVERSAARL-FOUNDATION-SETUP-FIELD-MAP.md
- Status: completed-local-field-map
- Entscheidung: Die minimalen Foundation-Gaps sind jetzt als geplante Setup-Objekte gemappt: allgemeine Buchungsmatrix `INLAND/WAREN`, MwSt.-Buchungsmatrix `INLAND/VAT19`, MwSt.-Geschaeftsbuchungsgruppe `INLAND` und die abhaengigen allgemeinen Buchungsgruppen.
- Grenze: Die Feldkarte beweist keine gespeicherten Werte in Business Central. Sie ist Vorbereitung fuer einen spaeteren no-write Discovery- oder Write-/Import-Gate.
- Naechster Case: `FOUNDATION-SETUP-PACKAGE-READFIRST-DISCOVERY`, nur lesend, mit Bildkette und Stop vor Paket erstellen, Import, Validate, Apply oder Setup-Write.
