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

Master Data bleibt geparkt, bis die offenen Foundation-Grenzen geprueft oder bewusst akzeptiert sind.

PWS-FF-002C hat die Buchungsmatrix Einrichtung neu eingeordnet: Page 314 ist nicht als generischer Navigationsblocker zu behandeln. TARGET-057 ist der staerkere Page-314-/Table-252-/Feldwahrheitsnachweis; TARGET-058/TARGET-059 parken aber den persistierten Wert `Wareneinkaufskonto 5400`. Die Buchungsmatrix bleibt deshalb partiell und nicht posting-ready.

PWS-FF-005 hat die Dimensionsliste als read-only Kontext in `playthru / UNIVERSAARL-DE` nachgewiesen: `CHANNEL`, `COSTCENTER` und `PRODUCTLINE` sind im Screenshot sichtbar. Dimensionswerte und der Dimensionskontext der Finanzbuchhaltung Einrichtung sind aber noch nicht als Zielseiten akzeptiert. Der naechste sichere Fortschritt ist `PWS-FF-005B-DIMENSION-VALUES-RELATED-ACTION-ROUTE-RECOVERY`, nicht Master Data, globale Dimensionen oder ein weiterer VAT-Schreibversuch.

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
- Praktische Folge: keine Wiederholung der verworfenen Page-314-Routen ohne materiell neue Hypothese; Master Data bleibt geparkt.

## PWS-FF-005 Dimensionen Read-first

- Quelle: playwright/projects/fibu-book5/evidence/pws-ff-005-dimensions-readfirst/PWS-FF-005-result.json
- Status: partially-completed
- Akzeptiert: Dimensionsliste ueber Tell-Me-Route, Screenshot mit `CHANNEL`, `COSTCENTER`, `PRODUCTLINE`.
- Verworfen: direkte Page-537-/Tell-Me-Route fuer Dimensionswerte; sie oeffnet beziehungsweise zeigt nicht die Zielseite fuer Dimensionswerte.
- Offen: Dimensionswerte fuer PRODUCTLINE, COSTCENTER, CHANNEL; Finanzbuchhaltung Einrichtung mit globalen Dimensionsfeldern.
- Schreibgrenze: keine Dimension, kein Dimensionswert, keine globale Dimension, keine Standarddimension, keine Stammdaten, keine Buchungsvorschau, keine Buchung.
- Praktische Folge: `PWS-FF-005B` muss zuerst die read-only Related-Action-Route `Dimensionen -> Dimension -> Dimensionswerte` pruefen oder den Blocker bewusst parken.

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

- Shows key users where chart and posting setup context lives.
- Supports a Foundation checkpoint exercise before master data entry.
- Defines stop conditions for setup pages that expose write actions or unclear dialogs.

## Master-Data-Read-first-Handoff

Diese Entscheidung gibt keine Schreibfreigabe. Sie waehlt hoechstens den naechsten lesenden Master-Data-Probe.

| Kandidat | Entscheidung | Mindestgrundlage | Bleibt verboten |
| --- | --- | --- | --- |
| `PWS-MD-001` Debitoren (Customers) | blocked-or-needs-foundation-follow-up | Company, Kontenplan, Debitoren-/Buchungsgruppen-/Payment-Abhaengigkeiten sind sichtbar oder als Luecke benannt. | Debitor speichern, Vorlage aendern, Verkaufsbeleg anlegen |
| `PWS-MD-002` Kreditoren (Vendors) | blocked-or-needs-foundation-follow-up | Company, Kontenplan, Kreditoren-/Buchungsgruppen-/Payment-Abhaengigkeiten sind sichtbar oder als Luecke benannt; Bankdaten bleiben ausserhalb. | Kreditor speichern, Bankdaten erfassen, Einkaufsbeleg oder Zahlung anlegen |
| `PWS-MD-003` Artikel/Services/Nichtlagerartikel | blocked-or-needs-foundation-follow-up | Company, Kontenplan, Produktbuchungsgruppen, USt-Produktkontext, Basiseinheiten und Inventory-/Costing-Grenzen sind sichtbar oder als Luecke benannt. | Artikel speichern, Basiseinheit anlegen, Lager-/Bewertungs-/Buchungssetup aendern, Lagerwert oder Wertposten behaupten |

Erlaubte Anschlussklassifikationen:

- Debitoren: `ready-for-customer-write-gate`, `needs-foundation-follow-up`, `needs-template-discovery`, `blocked`.
- Kreditoren: `ready-for-vendor-write-gate`, `needs-foundation-follow-up`, `needs-template-discovery`, `needs-payment-boundary-decision`, `blocked`.
- Artikel/Services: `ready-for-item-write-gate`, `needs-uom-follow-up`, `needs-product-posting-follow-up`, `needs-inventory-setup-follow-up`, `needs-service-route-decision`, `blocked`.

`ready-for-*-write-gate` bedeutet nur, dass ein spaeterer Smart-Decision-Case vorbereitet werden darf. Es erlaubt kein direktes Schreiben, Importieren, Buchen oder Posten.

## Naechste Projektoutputs

- PWS-FF-002C als aktuelle Buchungsmatrix-Grenze konsumieren: Page 314 ist partiell bekannt, aber nicht posting-ready.
- PWS-FF-006 als akzeptierten Kontenplan-Starterkonten-Nachweis konsumieren; keine weitere Starterkonten-Wiederholung ohne neuen Claim.
- Master Data, USt-Schreiblaeufe, Buchungsgruppen-Schreiblaeufe, Buchungsvorschau und Buchung bleiben geparkt, bis die Foundation-Grenzen geklaert sind.
- PWS-FF-005B als naechste no-write Foundation-Spur vorbereiten: Dimensionswerte ueber die Related-Action-Route aus der akzeptierten Dimensionsliste pruefen.
- Classify master-data readiness only after chart/setup context is accepted.
- Use accepted screenshots as draft handbook/training evidence, not final compliance proof.

## Evidence

- Screenshot: playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-001-chart-of-accounts.png
- Screenshot: playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-002-general-business-posting-groups.png
- Screenshot: playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-003-general-product-posting-groups.png
- Screenshot: playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-004-general-posting-setup.png
- Screenshot: playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-005-vat-posting-setup.png
- Screenshot: playwright/projects/fibu-book5/evidence/pws-ff-006-chart-of-accounts-starter-accounts-readfirst/pws-ff-006-010-chart-of-accounts-starter-accounts.png

## Naechster Case

- `PWS-FF-005B-DIMENSION-VALUES-RELATED-ACTION-ROUTE-RECOVERY`: Aus der akzeptierten Dimensionsliste heraus die read-only Route zu Dimensionswerten pruefen. Keine Dimensionsanlage, keine Dimensionswertaenderung, keine Standarddimensionsaenderung, keine Stammdaten, keine Buchungsvorschau und keine Buchung.
