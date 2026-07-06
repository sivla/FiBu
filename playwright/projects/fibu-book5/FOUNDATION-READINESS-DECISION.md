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

## Konsolidierter Stand nach den Folgeprobes

Die Foundation ist fuer Schulung und Buch als Lernpfad nutzbar, aber noch nicht posting-ready. TARGET-075 hat mehrere Foundation-Seiten lesend sichtbar gemacht. PWS-FF-002 und PWS-FF-002B zeigen aber, dass die aktuelle Page-314-Route zur Buchungsmatrix Einrichtung nicht als sichtbarer Seitennachweis akzeptiert werden darf. Der VAT-Strang ist weiter fortgeschritten: INLAND und VAT19 sind nach TARGET-027C-RETRY per Screenshot-QA sichtbar, Page 472 ist erreichbar, aber TARGET-071/TARGET-073 beweisen keinen row-scoped aktiven Editor fuer die INLAND/VAT19-Matrixzeile.

Praktische Entscheidung:

- Master Data, O2C, P2P, Journale, Buchungsvorschau und Buchung bleiben blockiert.
- TARGET-073 bleibt als as-is Retry geparkt, weil single-click, double-click, Enter und F2 keinen echten aktiven Editor bewiesen haben.
- Der naechste neue Live-Versuch ist `TARGET-073B-VAT-PAGE472-SURFACE-AND-EDITOR-PROOF`. Dieser Case darf nur no-write diagnostizieren: sichtbare Page-472-Oberflaeche, Layout/Fokus/Scroll-Zustand, Page-Inspection-Kontext und row-/column-bound aktiven Editor beweisen oder sauber blockieren.
- Page-314-/Page-472-Screenshots duerfen nur als Proof gelten, wenn sie die Zielseite, relevante Felder/Spalten und den aktiven Kontext sichtbar zeigen; Role Center, Suche/Tell-Me oder versteckter Text reichen nicht.

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

## PWS-FF-002 Folgeproof: Buchungsmatrix Einrichtung

- Quelle: playwright/projects/fibu-book5/evidence/pws-ff-002-general-posting-setup-readfirst-recovery/PWS-FF-002-result.json
- Status: blocked
- Instanz/Company: playthru / UNIVERSAARL-DE
- Route: direkte Page-314-URL, danach Tell-Me/Search-Fallback
- Geaendert: nein
- Nicht ausgefuehrt: Neu, Bearbeiten/Liste bearbeiten, Konten vorschlagen, Stammdaten, Draft, Buchungsvorschau, Buchung, API Shortcut
- Screenshot-QA: rejected, weil der Screenshot das Rollencenter zeigt und nicht die Buchungsmatrix Einrichtung.
- Ergebnis: Die Business-Central-Session und Company sind erreichbar, aber die aktuelle PWS-FF-002-Navigation/Capture-Route beweist die Buchungsmatrix nicht.
- Blocker: Page 314 bleibt fuer Foundation Readiness ungeprueft; der naechste Versuch muss zuerst die Navigation auf die konkrete Setup-Seite beweisen, bevor Zeilen oder Kontospalten bewertet werden.
- Naechste sinnvolle Route: enger UI-/Navigation-Recovery-Probe mit Seitentitel-/URL-/Text-Gate vor Screenshot-Akzeptanz. Keine Master Data und keine Setup-Writes.

## PWS-FF-002B Recovery-Probe: Page-314-Navigation

- Quelle: playwright/projects/fibu-book5/evidence/pws-ff-002b-page314-navigation-capture-recovery/PWS-FF-002B-result.json
- Status: blocked
- Instanz/Company: playthru / UNIVERSAARL-DE
- Route: direkte Page-314-URL, danach Tell-Me/Search-Fallback mit scoped Search-Click
- Geaendert: nein
- Nicht ausgefuehrt: Neu, Bearbeiten/Liste bearbeiten, Konten vorschlagen, Stammdaten, Draft, Buchungsvorschau, Buchung, API Shortcut
- Screenshot-QA: rejected, weil Screenshot und Text weiterhin das Rollencenter zeigen und nicht die Buchungsmatrix Einrichtung.
- Ergebnis: Der Auth-/Instanz-/Company-Kontext funktioniert, aber die aktuelle Page-314-Navigation ist fuer Playwright nicht als Zielseite beweisbar.
- Naechste Entscheidung: Nicht denselben Live-Weg wiederholen. Entweder Page 314 als Foundation-Gap parken und Master Data weiter blockieren oder eine wirklich neue Route begruenden, zum Beispiel ueber eine gezielte BC-URL-/Page-Route-Analyse statt weiterer Tell-Me-Varianten.

## VAT-/USt-Folgeproofs

- TARGET-027R/TARGET-027S: MwSt.-Produktbuchungsgruppen und MwSt.-Buchungsmatrix sind sichtbar; MwSt.-Geschaeftsbuchungsgruppen ist nur mit Route-Parity-Warnung belastbar.
- TARGET-027B: Zielwerte wurden lokal entschieden, ohne BC zu schreiben: INLAND, VAT19, 19 Prozent, Normale MwSt., 3806 Umsatzsteuerkonto und 1406 Vorsteuerkonto.
- TARGET-027C-RETRY: INLAND und VAT19 sind nach Reopen per Screenshot-QA sichtbar. Der Text-Extractor hat BC-Grid-Zellwerte teilweise nicht erfasst; deshalb ist Screenshot-QA hier der staerkere Nachweis.
- TARGET-071: Page 472 wurde erreicht, aber der kontrollierte Write-Gate hat gestoppt, weil fuer die Zielzellen kein echter aktiver Editor erkannt wurde.
- TARGET-073: Zusätzliche aktive-Editor-Probes ohne Zielwerteingabe blieben blockiert. Deshalb ist TARGET-073 als Wiederholung ohne neue Route-Hypothese nicht sinnvoll.

Grenze: Diese VAT-Evidence beweist noch keine korrekte deutsche USt-Berechnung. Es gibt keinen Preview-Posting-Nachweis, keine MwSt.-Posten, keine Sachposten und keine steuerliche Finalfreigabe.

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
- PWS-FF-002 nicht als akzeptierten Buchungsmatrix-Nachweis verwenden; der Screenshot zeigt Rollencenter statt Page 314.
- PWS-FF-002B nicht wiederholen, solange keine neue Route-Hypothese vorliegt; direkte URL und scoped Search-Click sind als aktueller Weg blockiert.
- TARGET-073 nicht als as-is Retry wiederholen; als naechsten no-write Live-Folgecase `TARGET-073B-VAT-PAGE472-SURFACE-AND-EDITOR-PROOF` verwenden.
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
