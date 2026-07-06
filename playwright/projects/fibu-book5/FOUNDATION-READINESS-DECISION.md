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

## Entscheidung

Master-Data-Schreibfaelle bleiben geparkt. Lesende Master-Data-Kontextprobes duerfen jetzt einzeln starten, weil Company, Kontenplan, Nummernserien und Dimensionen ausreichend sichtbar sind, um Debitoren-/Kreditoren-/Artikel-Oberflaechen ohne Datenanlage zu verstehen. Diese Entscheidung gibt keine Freigabe fuer Stammdatenanlage, Templates, Belege, Buchungsvorschau oder Buchung.

PWS-FF-002C hat die Buchungsmatrix Einrichtung neu eingeordnet: Page 314 ist nicht als generischer Navigationsblocker zu behandeln. TARGET-057 ist der staerkere Page-314-/Table-252-/Feldwahrheitsnachweis; TARGET-058/TARGET-059 parken aber den persistierten Wert `Wareneinkaufskonto 5400`. Die Buchungsmatrix bleibt deshalb partiell und nicht posting-ready.

PWS-FF-005 hat die Dimensionsliste als read-only Kontext in `playthru / UNIVERSAARL-DE` nachgewiesen: `CHANNEL`, `COSTCENTER` und `PRODUCTLINE` sind im Screenshot sichtbar. PWS-FF-005B hat danach die echte UI-Route aus der Dimensionsliste ueber `Dimension > Dimensionswerte` fuer `PRODUCTLINE`, `COSTCENTER` und `CHANNEL` read-only nachgewiesen. Das reicht fuer Foundation-Verstaendnis, UAT-/Trainingserklaerung und spaetere Handbuchsubstanz, aber nicht fuer globale Dimensionen, Standarddimensionen, Reporting Readiness, Master Data Readiness, Preview Posting oder Posting.

PWS-FF-001 hat die Nummernserien-Seite read-only beobachtet: sieben Universaarl-U-Nummernserien sind sichtbar, `Standardnr.`/`Default Nos.` und `Manuelle Anz.`/`Manual Nos.` wurden als Checkboxkontext erfasst, `Zeilen`/`Lines` und Page Inspection lieferten zusaetzliche UI-Wahrheit. Das reicht fuer Foundation-Verstaendnis und Schulungs-/Handbuchvorbereitung, aber nicht fuer vollstaendige Nummerierungs-, Setup-, Master-Data-, Audit-, Preview- oder Posting-Readiness.

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

## PWS-FF-002C Route Decision: Buchungsmatrix Einrichtung

- Quelle: playwright/projects/fibu-book5/evidence/pws-ff-002c-general-posting-setup-route-decision/PWS-FF-002C-result.json
- PWS-FF-002/PWS-FF-002B: direkte Page-314-URL und Tell-Me/Search-Routen sind als Zielseitennachweis verworfen.
- TARGET-057: Page 314, Table 252 und `Purch. Account` Feldkontext sind als technische Feldwahrheit akzeptiert.
- TARGET-058/TARGET-059: getestete List-Edit-/Grid-/Headerroute fuer `5400` ist geparkt; keine Persistenz nach Reopen.
- Akzeptierter Teilstand: `INLAND` / `WAREN` / `Warenverkaufskonto 4400`.
- Offene Grenze: `Wareneinkaufskonto 5400`, vollstaendige Buchungsmatrix, Posting Readiness, Preview Posting und Posten.
- Praktische Folge: keine Wiederholung der verworfenen Page-314-Routen ohne materiell neue Hypothese; Master-Data-Schreibfaelle bleiben geparkt. Lesende Debitoren-/Kreditoren-/Artikel-Kontextprobes duerfen erst nach dieser Foundation-Entscheidung einzeln laufen.

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

## Naechste Projektoutputs

- PWS-FF-002C als aktuelle Buchungsmatrix-Grenze konsumieren: Page 314 ist partiell bekannt, aber nicht posting-ready.
- PWS-FF-006 als akzeptierten Kontenplan-Starterkonten-Nachweis konsumieren; keine weitere Starterkonten-Wiederholung ohne neuen Claim.
- Master-Data-Schreibfaelle, USt-Schreiblaeufe, Buchungsgruppen-Schreiblaeufe, Buchungsvorschau und Buchung bleiben geparkt, bis die Foundation-Grenzen geklaert sind.
- PWS-FF-005B als beobachteten no-write Dimensionswerte-Proof konsumieren.
- PWS-FF-001 als beobachteten no-write Nummernserien-Proof konsumieren.
- `PWS-MD-001`, `PWS-MD-002` und `PWS-MD-003` sind als read-only Kontext beobachtet. Naechster Schritt ist eine Route Decision fuer den ersten Master-Data-Write-Gate-Kandidaten.
- Classify master-data readiness only after chart/setup context is accepted.
- Use accepted screenshots as draft handbook/training evidence, not final compliance proof.

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

## Naechster Case

- `FOUNDATION-MASTER-DATA-ROUTE-DECISION`: Debitoren/Kreditoren/Artikel-Read-first-Evidence auswerten und entscheiden, ob als erstes ein Debitor-, Kreditor- oder Artikel-Write-Gate fachlich sinnvoll, datenbereit und korrigierbar ist. Keine direkte Stammdatenanlage aus dieser Entscheidung ableiten.
