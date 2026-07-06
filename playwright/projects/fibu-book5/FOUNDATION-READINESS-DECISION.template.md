# FOUNDATION-READINESS-DECISION Template

Status: `template/no-evidence`

Diese Vorlage ist keine Evidence und keine Freigabe. Sie darf erst nach einem gueltigen TARGET-075-Result in `FOUNDATION-READINESS-DECISION.md` ueberfuehrt werden.

Aktive Zielwelt:

- Instanz: `playthru`
- Company: `UNIVERSAARL-DE`
- Referenzfirma: `Universaarl GmbH`

## Eingabe

| Feld | Wert |
| --- | --- |
| Quelle | `playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/TARGET-075-result.json` |
| Case | `TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK` |
| Erwarteter Modus | read-first/no-write |
| Guard-Ziel-URL | Muss an TARGET-075 uebergeben werden, darf aber nicht im Result ausgegeben werden. |
| Ausgabedatei | `playwright/projects/fibu-book5/FOUNDATION-READINESS-DECISION.md` |

## Entscheidung

| Frage | Entscheidung nach TARGET-075 |
| --- | --- |
| Ist der Foundation-Kontext fuer Master Data ausreichend sichtbar? | `pending-target075-evidence` |
| Darf Master Data vorbereitet werden? | `pending-target075-evidence` |
| Darf Master Data geschrieben werden? | `nein; keine Stammdaten-Freigabe aus dieser Vorlage` |
| Darf Setup geschrieben werden? | `nein; keine Setup-Freigabe aus dieser Vorlage` |
| Darf Preview Posting oder Posting vorbereitet werden? | `nein` |

## Nach TARGET-075 Eintragen

| Bereich | Ergebnis | Grenze |
| --- | --- | --- |
| Instanz und Company | `pending` | Nur `playthru / UNIVERSAARL-DE` mit Auth-Zielnachweis aus aktuellem State ist gueltig. |
| Kontenplan / Sachkonten | `pending` | Sichtbarkeit ist noch keine SKR04-Vollstaendigkeit. |
| Geschaeftsbuchungsgruppen | `pending` | Sichtbarkeit ist noch keine Buchungsfaehigkeit. |
| Produktbuchungsgruppen | `pending` | Sichtbarkeit ist noch keine Buchungsfaehigkeit. |
| General Posting Setup | `pending` | Sichtbarkeit ist noch keine Buchungsfaehigkeit. |
| VAT Posting Setup | `pending` | Keine deutsche Steuer- oder Compliance-Finalbehauptung. |
| Dimensionskontext | `pending` | Kein Reporting- oder Postenclaim ohne spaeteren Prozessbeweis. |
| Screenshot-QA | `pending` | Alle TARGET-075 Foundation-Pages brauchen beobachtete Page-Evidence, Screenshot und Screenshot-Metadaten. |

## Master-Data-Gate

Master Data darf nach dieser Entscheidung nur als naechster Block vorbereitet werden, wenn TARGET-075 mindestens zeigt:

- `playthru / UNIVERSAARL-DE` ist eindeutig aktiv.
- Das Auth-Ziel wurde aus dem aktuellen State auf `playthru / UNIVERSAARL-DE` aufgebaut.
- Die Guard-Ziel-URL wurde an TARGET-075 uebergeben und nicht im Result ausgegeben.
- Kontenplan, Geschaeftsbuchungsgruppen, Produktbuchungsgruppen, General Posting Setup und VAT Posting Setup haben beobachtete Page-Evidence.
- Jede dieser Foundation-Pages hat Screenshot und Screenshot-Metadaten.
- Keine Setupwerte, Stammdaten, Belege, Buchungsvorschau, Buchung, Zahlung oder API-Shortcuts wurden ausgefuehrt.
- Offene Foundation-Luecken sind benannt und nicht als erledigt umgedeutet.

## Foundation-Read-first-Folgeprobes

Diese Tabelle wird erst nach TARGET-075 ausgefuellt. Sie verhindert, dass der naechste Schritt zu schnell in Stammdaten springt, wenn zuerst eine engere Foundation-Luecke geklaert werden muss.

| Kandidat | Entscheidung nach TARGET-075 | Nutzen nach TARGET-075 | Bleibt verboten |
| --- | --- | --- | --- |
| `PWS-FF-002` Buchungsgruppen (Posting Groups) | `pending-target075-evidence` | Wenn Buchungsgruppen, Produktbuchungsgruppen oder Buchungsmatrix-Kontext fehlen oder unklar sind. | Buchungsgruppen speichern, Buchungsmatrix-Zeilen aendern, Preview Posting, Posting. |
| `PWS-FF-004` USt/MwSt.-Einrichtung (VAT setup boundary) | `pending-target075-evidence` | Wenn USt-/VAT-Luecken, unklare Setup-Zeilen oder zu schwache Screenshot-QA sichtbar werden. | USt-Gruppen speichern, VAT Posting Setup schreiben, Steuerfinalitaet behaupten, Preview Posting, Posting. |
| `PWS-FF-005` Dimensionen und Dimensionswerte | `pending-target075-evidence` | Wenn Dimensionen, Dimensionswerte, globale Dimensionen oder Reporting-Grenzen unklar bleiben. | Dimension speichern, Dimensionswert speichern, Standarddimension aendern, Reporting- oder Postenclaim behaupten. |
| `PWS-FF-003` Zahlungsbedingungen (Payment Terms) | `pending-target075-evidence` | Wenn Debitoren-/Kreditoren-Handoff durch unklare Zahlungsbedingungen blockiert ist. | Zahlungsbedingung speichern, Zahlungsart/Bankdaten erfassen, Zahlung vorbereiten. |
| `PWS-FF-001` Nummernserien (Number Series) | `pending-target075-evidence` | Wenn Nummernlogik fuer Debitoren, Kreditoren oder Artikel unklar bleibt. | Nummernserie speichern, Setup zuweisen, Stammdatensatz anlegen. |

## Master-Data-Read-first-Handoff

Diese Tabelle wird erst nach TARGET-075 ausgefuellt. Sie gibt keine Schreibfreigabe, sondern waehlt hoechstens den naechsten lesenden Master-Data-Probe.

| Kandidat | Entscheidung nach TARGET-075 | Mindestgrundlage | Bleibt verboten |
| --- | --- | --- | --- |
| `PWS-MD-001` Debitoren (Customers) | `pending-target075-evidence` | Company, Kontenplan, Debitoren-/Buchungsgruppen-/Payment-Abhaengigkeiten sind fuer Read-first ausreichend sichtbar oder als Luecke benannt. | Debitor speichern, Vorlage aendern, Verkaufsbeleg anlegen. |
| `PWS-MD-002` Kreditoren (Vendors) | `pending-target075-evidence` | Company, Kontenplan, Kreditoren-/Buchungsgruppen-/Payment-Abhaengigkeiten sind fuer Read-first ausreichend sichtbar oder als Luecke benannt; Bankdaten bleiben ausserhalb. | Kreditor speichern, Bankdaten erfassen, Einkaufsbeleg oder Zahlung anlegen. |
| `PWS-MD-003` Artikel/Services/Nichtlagerartikel | `pending-target075-evidence` | Company, Kontenplan, Produktbuchungsgruppen, USt-Produktkontext, Basiseinheiten und Inventory-/Costing-Grenzen sind fuer Read-first ausreichend sichtbar oder als Luecke benannt. | Artikel speichern, Basiseinheit anlegen, Lager-/Bewertungs-/Buchungssetup aendern, Lagerwert oder Wertposten behaupten. |

Erlaubte Klassifikationen nach TARGET-075:

- Debitoren: `ready-for-customer-write-gate`, `needs-foundation-follow-up`, `needs-template-discovery`, `blocked`.
- Kreditoren: `ready-for-vendor-write-gate`, `needs-foundation-follow-up`, `needs-template-discovery`, `needs-payment-boundary-decision`, `blocked`.
- Artikel/Services: `ready-for-item-write-gate`, `needs-uom-follow-up`, `needs-product-posting-follow-up`, `needs-inventory-setup-follow-up`, `needs-service-route-decision`, `blocked`.

Jede `ready-for-*-write-gate`-Klassifikation bedeutet nur: Ein spaeterer Smart-Decision-Case darf einen Schreib-Gate vorbereiten. Sie bedeutet nicht, dass direkt geschrieben, importiert, gebucht oder gepostet werden darf.

## UAT, Training und Buch

| Output | Regel |
| --- | --- |
| UAT | Aus TARGET-075 entsteht hoechstens ein Readiness-/Navigation-Checkpoint, kein Prozess-UAT. |
| Training | Training darf erklaeren, welche Foundation-Seiten vor Stammdaten geprueft werden. |
| Buch/Handbuch | Buchtext darf nur beschreiben, was ein Anfaenger auf den Seiten sieht und warum diese Pruefung vor Stammdaten noetig ist. |
| Evidence | Result JSON und Screenshot-QA bleiben interne Grundlage; keine rohen Testprotokolle ins Buch uebernehmen. |

## Naechster Case

Nach TARGET-075 und dieser Entscheidung:

- Wenn Foundation-Kontext ausreichend sichtbar ist: naechsten engen Master-Data-Read-first-Pilot waehlen.
- Wenn Setup-Luecken oder Screenshot-QA-Blocker bleiben: Foundation-Grenze klaeren, bevor Master Data oder Prozessbelege starten.
- Wenn Auth, Instanz oder Company unklar sind: keine BC-Folgeaktion ausfuehren.
