# FOUNDATION-READINESS-DECISION

> Automatisch aus TARGET-075 Evidence erzeugt. Diese Datei ist eine Projektentscheidung, kein Buchkapitel.

## Kontext

- Quelle: playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/TARGET-075-result.json
- Instanz: playthru
- Company: UNIVERSAARL-DE
- Result-Status: partially-completed
- Erzeugt am: 2026-07-06T17:14:40.050Z
- Auth-Ziel: playthru / UNIVERSAARL-DE
- Auth-Ziel aus aktuellem State aufgebaut: ja
- Auth-Ziel passt zum State: ja
- Guard-Ziel-URL an TARGET-075 uebergeben: ja
- Guard-Ziel-URL im Result ausgegeben: nein

## Entscheidung

Master Data bleibt geparkt, bis die offenen Foundation-Grenzen geprueft oder bewusst akzeptiert sind.

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

## Nicht bewiesen

- No complete SKR04 chart of accounts.
- No final German tax or compliance claim.
- No VAT Posting Setup correctness.
- No General Posting Setup correctness.
- No master data readiness.
- No document, Preview Posting, Posting or ledger trace.
- Buchungsmatrix Einrichtung / General Posting Setup was not visible enough for accepted proof.
- Starter account 1200 was not visible in compact chart evidence.
- Starter account 1406 was not visible in compact chart evidence.
- Starter account 1800 was not visible in compact chart evidence.
- Starter account 3300 was not visible in compact chart evidence.
- Starter account 3806 was not visible in compact chart evidence.
- Starter account 4400 was not visible in compact chart evidence.
- Starter account 5400 was not visible in compact chart evidence.

## Kontenplan

- Status: observed
- Sichtbare Starterkonten: keine
- Fehlend oder unklar: 1200, 1406, 1800, 3300, 3806, 4400, 5400
- Buchgrenze: Use as beginner-facing chart visibility only, not as complete SKR04 or posting readiness proof.

## Setup-Kontext

- Geschaeftsbuchungsgruppen: observed
- Produktbuchungsgruppen: observed
- Buchungsmatrix Einrichtung: rejected
- USt-Buchungsmatrix Einrichtung: observed
- Grenze: Use as setup-page visibility and dependency map only; do not claim setup correctness from read-only visibility.

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

- Den abgelehnten Nachweis zur Buchungsmatrix Einrichtung vor Master Data klaeren oder bewusst als Grenze akzeptieren.
- Starterkonten erneut sichtbar pruefen, wenn der Kontenplan Setup- oder Buchaussagen tragen soll.
- Master Data, USt-Schreiblaeufe, Buchungsgruppen-Schreiblaeufe, Buchungsvorschau und Buchung bleiben geparkt, bis die Foundation-Grenzen geklaert sind.
- Classify master-data readiness only after chart/setup context is accepted.
- Use accepted screenshots as draft handbook/training evidence, not final compliance proof.

## Evidence

- Screenshot: playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-001-chart-of-accounts.png
- Screenshot: playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-002-general-business-posting-groups.png
- Screenshot: playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-003-general-product-posting-groups.png
- Screenshot: playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-004-general-posting-setup.png
- Screenshot: playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-005-vat-posting-setup.png

## Naechster Case

- Foundation-Grenzen zuerst klaeren; keine Master-Data-, VAT-, Posting- oder Prozess-Writes starten.
