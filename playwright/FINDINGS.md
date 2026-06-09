# Business-Central-Fundstellen

Diese Datei sammelt Dinge, die Playwright-Läufe, Screenshots oder manuelle Sichtprüfungen in Business Central sichtbar machen, die im Buch aber noch nicht ausreichend erklärt sind.

Eine Fundstelle ist keine Störung. Sie ist Lernmaterial.

## Statuswerte

| Status | Bedeutung |
|---|---|
| `offen` | gesehen, aber noch nicht recherchiert |
| `recherchieren` | braucht Microsoft Learn, BC-Hilfe oder praktischen Gegentest |
| `getestet` | Funktion wurde in BC ausprobiert |
| `buch-update` | Erkenntnis muss ins Buch eingearbeitet werden |
| `erledigt` | Buch/Doku/Test wurden aktualisiert |
| `ignoriert` | bewusst nicht relevant für das Buchziel |

## Vorlage

```markdown
## <ID> <kurzer Titel>

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall |  |
| Screenshot |  |
| BC-Seite |  |
| sichtbarer Text |  |
| Elementtyp | Button / Menü / Feld / FastTab / FactBox / Dialog / Hinweis / Bericht |
| erste Hypothese |  |
| Recherchequelle |  |
| Testergebnis |  |
| Entscheidung | Buch ergänzen / Projektnotiz / ignorieren |
| Buchstelle |  |
```

## Aktuelle Fundstellen

## FIND-BC-SCOPE-001 Shopify ist aus Buch-5-Lernscope gestrichen

| Feld | Wert |
|---|---|
| Status | erledigt als Scope-Entscheidung |
| Projekt | fibu-book5 |
| Testfall | `SCOPE-001` |
| Screenshot | keine BC-Screenshots; Scope-/Buchentscheidung |
| Evidence | `playwright/projects/fibu-book5/evidence/scope-001/SCOPE-001-SHOPIFY-REMOVAL.md`, `playwright/projects/fibu-book5/evidence/scope-001/SCOPE-001-result.json` |
| BC-Seite | nicht zutreffend |
| sichtbarer Text | Shopify/Online Store war im Buch und in Testdaten als aktiver Prozess enthalten |
| Elementtyp | Scope / Buchplanung / Testdatenmodell |
| erste Hypothese | Shopify erzeugt einen eigenen Connector-/Integrationsscope und lenkt vom aktuellen UI-first Business-Central-Lernpfad ab. |
| Recherchequelle | Projektentscheidung vom 08.06.2026 und Buch-/Backlog-Sync |
| Testergebnis | Kapitel 17, Backlog, Testdaten und Datenluecken wurden auf Dropshipping/Sonderverkauf umgestellt. `WEB-24001`, `CHANNEL=SHOP` und Shopify-Klickpfade sind kein aktives Ziel mehr. |
| Entscheidung | Shopify/Online Store ist out of scope. Dropshipping bleibt als BC-Standardprozess ohne Connector-Scope erhalten. |
| Buchstelle | Kapitel 17, Kapitel 1/3/7/10/25/29/38 |

Bewertung:

Fuer Anfaenger ist das wichtig, weil Shopify nicht nur eine BC-Seite ist, sondern Connector, Mapping, Integration und Payment-Provider-Logik nach sich zieht. Das aktuelle Buchprojekt soll zuerst die BC-Standardprozesse ueber UI-Klickpfade lernen.

## FIND-BC-FA-001 Anlagenkapitel braucht Zielwertabgleich vor Setup und Buchung

| Feld | Wert |
|---|---|
| Status | erledigt als Zielwert- und Buch-Sync; praktische Anlagen-Setup-/Buchungslinie offen |
| Projekt | fibu-book5 |
| Testfall | `FIXEDASSETS-001` |
| Screenshot | `playwright/projects/fibu-book5/img/fixedassets-001-010-fixed-assets-tell-me.png`, `playwright/projects/fibu-book5/img/fixedassets-001-040-fa-ledger-entries-tell-me.png`, `playwright/projects/fibu-book5/img/fixedassets-002-010-anlagen-tell-me.png`, `playwright/projects/fibu-book5/img/fixedassets-002-030-anlagenbuchungsgruppen-tell-me.png`, `playwright/projects/fibu-book5/img/fixedassets-003-010-fixed-assets-list.png`, `playwright/projects/fibu-book5/img/fixedassets-003-020-depreciation-books.png`, `playwright/projects/fibu-book5/img/fixedassets-003-040-purchase-invoices.png`, `playwright/projects/fibu-book5/img/fixedassets-003-050-fa-ledger-entries.png`, `playwright/projects/fibu-book5/img/fixedassets-004-010-fixed-asset-fa-cnc-01.png`, `playwright/projects/fibu-book5/img/fixedassets-004-020-depreciation-book-hgb.png`, `playwright/projects/fibu-book5/img/fixedassets-004-030-fa-posting-groups-tell-me.png`, `playwright/projects/fibu-book5/img/fixedassets-004-040-vendor-k30000.png`, `playwright/projects/fibu-book5/img/fixedassets-004-050-purchase-invoices-entry-path.png`, `playwright/projects/fibu-book5/img/fixedassets-005-010-fa-posting-groups-tell-me.png`, `playwright/projects/fibu-book5/img/fixedassets-005-020-fa-posting-groups-result.png`, `playwright/projects/fibu-book5/img/fixedassets-006-010-fa-posting-groups-accounts.png`, `playwright/projects/fibu-book5/img/fixedassets-007-010-depreciation-books.png`, `playwright/projects/fibu-book5/img/fixedassets-007-021-fixed-asset-classes-result.png` |
| BC-Seite | Tell-Me / Seiten und Aufgaben |
| sichtbarer Text | `Fixed Assets`, `FA Ledger Entries`; danach deutsche Suchpfade `Anlagen`, `AfA`, `Anlagenbuchungsgruppen`, `Einkaufsrechnungen`, `Anlagenposten` als Candidate; `FIXEDASSETS-003` oeffnet Anlagenliste, AfA-Buecher, Einkaufsrechnungen und Anlagenposten direkt |
| Elementtyp | Tell-Me / Suchpfad / Anlagen-Readiness |
| erste Hypothese | Das Anlagenkapitel darf nicht direkt mit Anlagenkarte, Aktivierung oder AfA starten, bevor Zielwerte und robuste Seitenpfade geklaert sind. |
| Recherchequelle | praktischer Playwright-Lauf `npm run fibu:fixedassets:readiness` |
| Testergebnis | `FIXEDASSETS-001` hat nur read-only Tell-Me-Evidence erzeugt. `FIXEDASSETS-002` hat deutsche/BC-nahe Suchpfade als Candidate belegt und den Betragswiderspruch nachgewiesen: Kapitel 21 nennt `120.000 EUR`, `resources-assets-projects.json` enthielt `250.000`. Da Kapitel 21 mehrfach konsistent `120.000 EUR` verwendet, wurde die Testdatendatei auf `120000` harmonisiert. `FIXEDASSETS-003` oeffnet direkte Zielseiten read-only: Anlagenliste `5601`, AfA-Buecher `5611`, Einkaufsrechnungen `9308` und Anlagenposten `5604` sind labor-candidate; FA Posting Groups ueber Page-ID `5606` ist rejected. `FIXEDASSETS-004` zeigt danach gefiltert: `FA-CNC-01`, `HGB`, `MACHINES` und `K30000` sind nicht sichtbar; `Purchase Invoices` ist erreichbar. `FIXEDASSETS-005` klaert den UI-Pfad: Tell-Me zeigt `FA Posting Groups`, der Klick erreicht die Seite, vorhandene CRONUS-Gruppen und Kontenspalten sind sichtbar, `MACHINES` fehlt weiter. `FIXEDASSETS-006` liest die vorhandenen Konten read-only: `EQUIPMENT = 12210/82000`, `GOODWILL = 11300`, `PLANT = 12110/81000`, `PROPERTY = 12130/81000`, `VEHICLES = 12230/82000`. `FIXEDASSETS-007` liest AfA-Buecher und Anlagenklassen read-only: `COMPANY = Company Book` ist sichtbar, `HGB` nicht; `FA Classes` zeigt `FINANCIAL`, `INTANGIBLE`, `TANGIBLE`. Keine Anlage, keine Einkaufs-/Aktivierungsbuchung, keine AfA und keine Anlagenposten fuer `FA-CNC-01` wurden angelegt. |
| Entscheidung | Zielbetrag ist harmonisiert und mehrere Zielseiten sind erreichbar. FA Posting Groups, vorhandene CRONUS-Konten, Depreciation Books und FA Classes sind belastbar gelesen; `FIXEDASSETS-008` hat Kapitel 21 mit einer Status-/Setup-Checkliste synchronisiert. Die Zielobjekte fehlen weiter im Labor. Ohne Gate bleibt der Anlagenblock fuer Setup und Buchung gesperrt. Mit Gate kann spaeter ein idempotenter UI-Setup-Fit fuer `HGB`, `MACHINES`, `FA-CNC-01` und `K30000` geplant werden; keine Aktivierung oder AfA ohne eigenen Buchungsfreigabe-Lauf. |
| Buchstelle | Kapitel 21 Anlagenbuchhaltung |

Bewertung:

Fuer Anfaenger ist das wichtig, weil Anlagenbuchhaltung mehrere Einrichtungsebenen kombiniert: Anlagenkarte, AfA-Buch, Anlagenbuchungsgruppe, Zugangsbuchung und spaeter AfA. Ein sichtbarer Tell-Me-Treffer oder eine direkt geoeffnete Liste ist nur ein Einstieg, kein Beweis, dass der Prozess fachlich eingerichtet oder buchungsbereit ist.

## FIND-BC-TAX-001 CRONUS-USA-Sales-Tax ist kein deutscher VAT19-Nachweis

| Feld | Wert |
|---|---|
| Status | erledigt als Buch-/Evidence-Sync; praktischer DE-Finallauf offen |
| Projekt | fibu-book5 |
| Testfall | `TAX-001` |
| Screenshot | keine neuen Screenshots; nutzt vorhandene O2C-/P2P-/Tax-Evidence |
| Evidence | `playwright/projects/fibu-book5/evidence/tax-001/TAX-001-DE-VAT-READINESS.md`, `playwright/projects/fibu-book5/evidence/tax-001/TAX-001-result.json` |
| BC-Seite | Sales Order, Purchase Order, Posted Sales Invoice, Posted Purchase Invoice, VAT/Tax Posting Setup |
| sichtbarer Text | `PS-INV103297`, `108219`, `Tax Group Code = FURNITURE`, `taxPercent = 0`, `totalTaxAmount = 0`, `VAT Calculation Type = Sales Tax` |
| Elementtyp | Steuer-Setup / Laborgrenze / Buchziel |
| erste Hypothese | CRONUS-USA-Steuerfelder koennen Bedienpfade und Laborbuchungen tragen, beweisen aber keine deutsche `19 %`-USt. |
| Recherchequelle | vorhandene Evidence `045-target-vs-labor-delta.md`, `080-posting-result.json`, `100-purchase-posting-result.json`, `MICROSOFT-DOC-VALIDATION.md`; Microsoft Learn zu VAT Setup und Sales Tax |
| Testergebnis | O2C und P2P sind gebucht, aber beide Laborbelege haben Steuerbetrag `0`. Die vorhandene Steuergruppe `FURNITURE` ist ein CRONUS-USA-Laborfit. Fuer deutsche `19 %` braucht es einen eigenen VAT-Ziellauf mit VAT Business/Product Posting Groups, VAT Posting Setup, Preview und VAT Entries. |
| Entscheidung | Buch und Projektstatus trennen jetzt klar: aktueller Laborlauf beweist Prozessbedienung und Postenspur, nicht deutschen VAT19-Endstand. Praktischer DE-VAT-Fit bleibt freigabepflichtig. |
| Buchstelle | Kapitel 9, 11, 12 und 22 |

Bewertung:

Das ist ein zentraler Einsteigerbefund. Wer `Tax Group Code`, `VAT Posting Setup` oder Steuerfelder sieht, darf daraus nicht automatisch `19 %` deutsche USt ableiten. Im Buch muss der Leser lernen, dass Steuerlogik eine eigene Einrichtungsschicht ist: Partnerlogik, Produktlogik, Setup-Matrix, Belegvorschau und USt-Posten muessen zusammenpassen.

## FIND-BC-POST-001 Postenspur ist eine Kette, kein einzelner Beleg

| Feld | Wert |
|---|---|
| Status | erledigt als Buch-/Evidence-Sync |
| Projekt | fibu-book5 |
| Testfall | `POSTING-TRACE-001`, `POSTING-TRACE-002` |
| Screenshot | vorhandene Bilder aus `uat-o2c-001`, `p2p-001`, `inventory-008` |
| Evidence | `playwright/projects/fibu-book5/evidence/posting-trace-001/POSTING-TRACE-LEARNING-ATLAS.md`, `playwright/projects/fibu-book5/evidence/posting-trace-002/POSTING-TRACE-BOOK-SYNC.md` |
| BC-Seite | Posted Sales Invoice, Posted Purchase Invoice, Customer/Vendor Ledger Entries, G/L Entries, Item Ledger Entries, Value Entries, Inventory Valuation |
| sichtbarer Text | `PS-INV103297`, `108219`, `INV008-899959`, `14140`, `Entry No. 792`, `Entry No. 793`, `Total Inventory Value = 67.000,00` |
| Elementtyp | Postenspur / Evidence Pack / Anfaengererklaerung |
| erste Hypothese | Lernende verstehen Buchungen besser, wenn jede Postenart als Antwort auf eine eigene Frage erklaert wird. |
| Recherchequelle | vorhandene Playwright-Evidence `UAT-O2C-001`, `UAT-P2P-001`, `INVENTORY-008` |
| Testergebnis | Die gebuchten Laborbelege zeigen unterschiedliche Postenketten: O2C erzeugt Debitoren-, Sach-, Wert- und Artikelposten; P2P erzeugt Kreditoren-, Sach-, Wert- und Artikelposten; Inventory Journal erzeugt Artikel-, Wert- und Sachposten sowie Lagerbewertungswirkung. |
| Entscheidung | Buch ergaenzt: Postenspur wird als Lernkette aus Beleg, Nebenbuch, Sachposten, Artikelposten, Wertposten und Bericht erklaert. `POSTING-TRACE-002` hat Kapitel 11 zusaetzlich auf vorhandene O2C-Screenshotpfade, erfolgreiche Preview nach `MASTERDATA-009`, Laborbuchung `PS-INV103297` und Kontrollfragen fuer Anfaenger synchronisiert. Laborgrenzen bleiben sichtbar: keine deutsche `19 %` USt, keine deutschen Kontenplan-Endstaende, keine Reporting-Summe nach `PRODUCTLINE`/`CHANNEL`. |
| Buchstelle | Kapitel 9, 11, 12, 13, 19, 23, 25 |

Bewertung:

Dieser Befund macht aus vorhandenen Screenshots Unterrichtsmaterial. Der Leser soll nicht nur sehen, dass nach dem Buchen viele Listen entstehen, sondern verstehen, welche Liste welche Kontrollfrage beantwortet.

## FIND-BC-PAY-008 Post-Button ist noch keine Zahlung, erst der Dialog entscheidet

| Feld | Wert |
|---|---|
| Status | erledigt als UI-only Buchungsdialog-Readiness; echte Zahlung offen |
| Projekt | fibu-book5 |
| Testfall | `PAYMENTS-010` |
| Screenshot | `playwright/projects/fibu-book5/img/payments-010-030-post-dialog-before-cancel.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/payments-010/PAYMENTS-010-result.json`, `playwright/projects/fibu-book5/evidence/payments-010/PAYMENTS-010-POSTING-READINESS.md`, `playwright/projects/fibu-book5/evidence/payments-010/PAYMENTS-EVIDENCE-PACK-SYNC.md` |
| BC-Seite | Cash Receipt Journals |
| sichtbarer Text | `Post`, `Ja`, `Nein`, `Journal Check`, `0 Issues Total` |
| Elementtyp | Zahlungsjournal / Buchungsdialog / Sicherheitsabbruch |
| erste Hypothese | Nach `Journal Check = 0 Issues` und Apply-Readiness ist die naechste riskante Schwelle nicht die Sichtbarkeit von `Post`, sondern die Bestaetigung im Dialog. |
| Recherchequelle | praktischer UI-only Playwright-Lauf `npm run fibu:payments:posting-readiness`; `playwright/projects/fibu-book5/evidence/payments-010/README.md` |
| Testergebnis | `PAYMENTS-010` bereitet den Cash-Receipt-Draft fuer `D10000`/`PS-INV103297`/`BANK-RM-01` erneut vor, bestaetigt `Journal Check = 0 Issues`, oeffnet `Apply Entries` read-only und klickt danach `Post` nur bis zum Bestaetigungsdialog. Business Central zeigt `Ja`/`Nein`; der Test klickt `Nein`, loescht den Draft und bucht nichts. |
| Entscheidung | Buch ergaenzen: Ein sichtbarer `Post`-Button ist noch keine Zahlung. Fuer Einsteiger muss der Bestaetigungsdialog als letzte Sicherheitsgrenze erklaert werden. `PAYMENTS-EVIDENCE-PACK-SYNC.md` ordnet die Kette von offenem Posten bis Post-Dialog als Lernpfad; eine echte Laborzahlung darf erst in `PAYMENTS-011` nach ausdruecklicher Freigabe erfolgen. |
| Buchstelle | Kapitel 19 Debitoren/Kreditoren und Kapitel 20 Bank/Payments |

Bewertung:

Dieser Befund ist didaktisch stark, weil er Angst und Sorglosigkeit gleichzeitig korrigiert: `Post` anzuklicken kann einen Dialog oeffnen, aber die eigentliche Buchung entsteht erst durch die Bestaetigung. Fuer das Buch ist wichtig, dass Lernende den Unterschied zwischen Vorpruefung, Dialog und finaler Buchung sehen.

## FIND-BC-PAY-007 Apply Entries im Zahlungsjournal ist ein Readiness-Pfad, noch kein Ausgleich

| Feld | Wert |
|---|---|
| Status | erledigt als UI-only Apply-/Preview-Readiness; Folgefund `FIND-BC-PAY-008` erledigt |
| Projekt | fibu-book5 |
| Testfall | `PAYMENTS-009` |
| Screenshot | `playwright/projects/fibu-book5/img/payments-009-010-cash-receipt-apply-preview-readiness.png`, `playwright/projects/fibu-book5/img/payments-009-020-apply-entries-readonly.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/payments-009/PAYMENTS-009-result.json`, `playwright/projects/fibu-book5/evidence/payments-009/PAYMENTS-009-APPLY-PREVIEW-READINESS.md` |
| BC-Seite | Cash Receipt Journals / Apply Entries |
| sichtbarer Text | `D10000`, `PS-INV103297`, `Amount to Apply`, `Remaining Amount`, `Journal Check`, `0 Issues Total`, `Post`, `OK` |
| Elementtyp | Zahlungsjournal / Apply Entries / Ausgleichsbezug |
| erste Hypothese | Wenn `Applies-to Doc. Type` und `Applies-to Doc. No.` im Draft gesetzt sind, sollte Business Central den offenen Rechnungsbezug im Apply-Entries-Kontext anzeigen, ohne dass dadurch schon ein gebuchter OP-Ausgleich entsteht. |
| Recherchequelle | praktischer UI-only Playwright-Lauf `npm run fibu:payments:apply-preview-readiness`; `playwright/projects/fibu-book5/evidence/payments-009/README.md` |
| Testergebnis | `PAYMENTS-009` bereitet den Cash-Receipt-Draft fuer `D10000`/`PS-INV103297`/`BANK-RM-01` erneut vor, bestaetigt `Journal Check = 0 Issues`, oeffnet `Apply Entries` read-only und zeigt den Rechnungs-/Betragskontext. Sichtbare Aktionen wie `Post`/`OK` wurden nicht ausgefuehrt. `Preview Posting` war im Cash Receipt Journal nicht direkt sichtbar. Der Draft wurde geloescht; keine Zahlung, kein Ausgleich, keine Bankabstimmung. |
| Entscheidung | Buch ergaenzen: `Apply Entries` ist ein Kontroll- und Zuordnungskontext. Das Oeffnen der Seite ist noch kein Ausgleich; erst Buchungs-/Apply-Aktionen erzeugen Zahlungs-, Bank- oder Ausgleichsposten. Vor einer Laborzahlung braucht es einen separaten Freigabecheck fuer Buchungsdialog und Preview-Risiko. |
| Buchstelle | Kapitel 19 Debitoren/Kreditoren und Kapitel 20 Bank/Payments |

Bewertung:

Dieser Befund ist fuer Anfaenger besonders wichtig, weil Business Central riskante Aktionen im selben Kontext zeigt, in dem auch harmlose Kontrolle stattfindet. Das Buch muss daher sprachlich sauber trennen: Rechnungsbezug pruefen, Apply Entries ansehen, aber `Post`, `OK`, `Set Applies-to ID` oder `Post Application` nur ausfuehren, wenn genau dieser Schritt freigegeben ist.

## FIND-BC-PAY-005 Bank Account Posting Group blockiert Zahlungsjournal nach Amount-Fix

| Feld | Wert |
|---|---|
| Status | erledigt durch `PAYMENTS-007`; Folgefund `FIND-BC-PAY-006` offen |
| Projekt | fibu-book5 |
| Testfall | `PAYMENTS-006`, `PAYMENTS-007` |
| Screenshot | `playwright/projects/fibu-book5/img/payments-006-010-cash-receipt-amount-validation.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/payments-006/PAYMENTS-006-result.json`, `playwright/projects/fibu-book5/evidence/payments-006/PAYMENTS-006-AMOUNT-VALIDATION.md`, `playwright/projects/fibu-book5/evidence/payments-007/PAYMENTS-007-result.json` |
| BC-Seite | Cash Receipt Journals |
| sichtbarer Text | `BANK-RM-01`, `Journal Check`, `1 Issues Total`, `Bank Account Posting Group` |
| Elementtyp | Zahlungsjournal / Bankkonto-Posting-Fit / Journal Check |
| erste Hypothese | Nach korrekter Amount-Eingabe prueft BC den Balance Account. Ein Bankkonto ohne Bank Account Posting Group ist als Gegenkonto im Zahlungsjournal noch nicht buchungsreif. |
| Recherchequelle | praktischer UI-only Playwright-Lauf `npm run fibu:payments:cash-receipt-amount-validation`; `playwright/projects/fibu-book5/evidence/payments-006/README.md` |
| Testergebnis | Rohzahl `-68000` erzeugt den bekannten Amount-Fehler. Lokales Format `-68.000,00` loest die Amount-Validierung zwischenzeitlich. Nach `Refresh` meldet Journal Check in `PAYMENTS-006`: `'Bank Account Posting Group' ist nicht vorhanden. Identifizierende Felder und Werte: Code=''`. `PAYMENTS-007` fittet `BANK-RM-01 = CHECKING`; dieser Fehler ist danach weg. Es wurde keine Zahlung und kein Ausgleich gebucht. |
| Entscheidung | Buch ergaenzen: Zahlungsjournal-Preflight prueft nicht nur Debitor, Betrag und Rechnung, sondern auch den Bankkonto-Posting-Fit. `BANK-RM-01 = CHECKING` ist im CRONUS-Labor erledigt, aber der Zahlungsjournal-Preflight bleibt wegen Amount-Issue gesperrt. |
| Buchstelle | Kapitel 19 Debitoren/Kreditoren und Kapitel 20 Bank/Payments |

Bewertung:

Das ist ein sehr praktischer Anfaengerbefund. Ein Bankkonto kann in der Liste existieren und als Gegenkonto auswaehlbar sein, aber trotzdem noch keine tragfaehige Kontenfindung fuer die Zahlungsbuchung besitzen. Der Journal Check macht diese fehlende Einrichtung sichtbar, bevor echte Bank- und Debitorenposten entstehen.

## FIND-BC-PAY-006 Amount bleibt Journal-Check-Blocker nach Bankkonto-Fit

| Feld | Wert |
|---|---|
| Status | erledigt als UI-Amount-/Journal-Check-Lernfall; Folgefund `FIND-BC-PAY-007` erledigt |
| Projekt | fibu-book5 |
| Testfall | `PAYMENTS-007`, `PAYMENTS-008` |
| Screenshot | `playwright/projects/fibu-book5/img/payments-007-020-cash-receipt-journal-after-bank-fit.png`, `playwright/projects/fibu-book5/img/payments-008-010-cash-receipt-amount-field-diagnosis.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/payments-007/PAYMENTS-007-result.json`, `playwright/projects/fibu-book5/evidence/payments-007/PAYMENTS-007-BANK-POSTING-FIT.md`, `playwright/projects/fibu-book5/evidence/payments-008/PAYMENTS-008-result.json`, `playwright/projects/fibu-book5/evidence/payments-008/PAYMENTS-008-AMOUNT-FIELD-DIAGNOSIS.md` |
| BC-Seite | Cash Receipt Journals |
| sichtbarer Text | `BANK-RM-01`, `Amount ($)`, `Journal Check`, `1 Issues Total`, `Amount` |
| Elementtyp | Zahlungsjournal / Amount-Feld / Journal Check |
| erste Hypothese | Nach geloestem Bankkonto-Fit trifft der UI-Draft noch nicht stabil das fachlich relevante `Amount`-Feld oder BC validiert die Zeile erst nach anderer Feld-/Spalteninteraktion. |
| Recherchequelle | praktische UI-only Playwright-Laeufe `npm run fibu:payments:bank-posting-fit` und `npm run fibu:payments:amount-field-diagnosis`; `playwright/projects/fibu-book5/evidence/payments-008/README.md` |
| Testergebnis | `BANK-RM-01` traegt persistiert `Bank Acc. Posting Group = CHECKING`; der alte Bank-Posting-Group-Fehler ist weg. `PAYMENTS-008` zeigt in breiter Ansicht `Amount = -68.000,00` und `Amount ($) = -67.673,60`. Nach `Refresh` zeigt `Journal Check` `1 Lines checked`, `0 Lines with issues`, `0 Issues Total` und `No issues found`. Entwurf wurde geloescht; keine Zahlung, kein Ausgleich. |
| Entscheidung | Buch ergaenzen: Betragsspalte und `Amount ($)` unterscheiden, lokalen Betrag nach Fokus/Refresh pruefen und erst bei `Journal Check = 0 Issues` zum naechsten nicht buchenden Apply-/Preview-Schritt gehen. |
| Buchstelle | Kapitel 19 Debitoren/Kreditoren und Kapitel 20 Bank/Payments |

Bewertung:

Das ist ein guter Anfaengerbefund, weil er zeigt: Ein sichtbarer Betrag in der Journalzeile beweist noch keine zahlungsreife Gen.-Journal-Line. Erst der rechte `Journal Check` entscheidet, ob BC die Zeile fachlich akzeptiert. Nach `PAYMENTS-008` ist dieser Preflight im Labor positiv; `PAYMENTS-009` hat danach den Apply-Entries-Kontext read-only nachgewiesen. Der naechste Kontrollpunkt ist Zahlungsfreigabe/Buchungsdialog-Risiko, nicht blindes Buchen.

## FIND-BC-PAY-004 UI-Draft ist noch nicht zahlungsreif

| Feld | Wert |
|---|---|
| Status | erledigt als Payment-Draft-Lernfall; Folgechecks `PAYMENTS-006` bis `PAYMENTS-010` abgeschlossen |
| Projekt | fibu-book5 |
| Testfall | `PAYMENTS-005` |
| Screenshot | `playwright/projects/fibu-book5/img/payments-005-010-cash-receipt-ui-draft.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/payments-005/PAYMENTS-005-result.json`, `playwright/projects/fibu-book5/evidence/payments-005/PAYMENTS-005-CASH-RECEIPT-UI-DRAFT.md` |
| BC-Seite | Cash Receipt Journals |
| sichtbarer Text | `D10000`, `BANK-RM-01`, `PS-INV103297`, `Journal Check`, `1 Issues Total`, `Amount` |
| Elementtyp | Zahlungsjournal-Entwurf / Journal Check |
| erste Hypothese | Ein sichtbarer Zahlungsjournal-Draft beweist noch nicht, dass die Zeile fachlich buchungsreif ist. Journal Check muss vor einer Zahlung ohne Issues sein oder die Restgrenze muss erklaert werden. |
| Recherchequelle | praktischer UI-only Playwright-Lauf `npm run fibu:payments:cash-receipt-ui-draft`; `playwright/projects/fibu-book5/evidence/payments-005/README.md` |
| Testergebnis | Die Zeile wurde vollstaendig ueber die UI vorbereitet und wieder geloescht. Debitor, Betrag, Gegenkonto und Rechnungsbezug sind sichtbar. Journal Check meldete zunaechst `1 Issue`: `'Amount' muss in 'Gen. Journal Line' einen Wert enthalten...`. Die Folgechecks klaerten Amount-Format, Bank Account Posting Group, `Journal Check = 0 Issues`, Apply Entries read-only und den Post-Dialog mit Abbruch. Es wurde keine Zahlung und kein Ausgleich gebucht. |
| Entscheidung | Buch ergaenzen: Zahlungsjournal-Entwurf, Journal Check, Apply-Bezug, Post-Dialog und Zahlungsfreigabe trennen. Amount-Validierung ist geloest; echte Zahlung bleibt `PAYMENTS-011` nur nach ausdruecklicher Freigabe. |
| Buchstelle | Kapitel 19 Debitoren/Kreditoren und Kapitel 20 Bank/Payments |

Bewertung:

Das ist ein idealer Anfaengerbefund: In Business Central kann eine Zeile sichtbar plausibel aussehen, waehrend die Journal-Check-FactBox noch einen internen Validierungsfehler meldet. Das Buch sollte deshalb nicht nur die Zeile zeigen, sondern auch den rechten Journal Check erklaeren.

## FIND-BC-PAY-003 Cash Receipt Journal braucht Readiness vor der ersten Zahlungszeile

| Feld | Wert |
|---|---|
| Status | erledigt als read-only Labor-Readiness, Folgearbeit offen |
| Projekt | fibu-book5 |
| Testfall | `PAYMENTS-004` |
| Screenshot | `playwright/projects/fibu-book5/img/payments-004-010-cash-receipt-journal-readiness.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/payments-004/PAYMENTS-004-result.json`, `playwright/projects/fibu-book5/evidence/payments-004/PAYMENTS-004-CASH-RECEIPT-JOURNAL-READINESS.md` |
| BC-Seite | Cash Receipt Journals / Bank Accounts |
| sichtbarer Text | `Cash Receipt Journal`, `Posting Date`, `Document Type`, `Document No.`, `Account Type`, `Account No.`, `Amount`, `Bal. Account`, `Apply Entries`, `Journal Check`, `Post`, `BANK-RM-01` |
| Elementtyp | Zahlungsjournal-Readiness / OP-Ausgleichsvorbereitung |
| erste Hypothese | Nach offenen Posten und Bankkonto-Fit muss vor einer Zahlung zuerst der Journalort mit Pflichtfeldern, Gegenkonto, Ausgleichsbezug und Preflight-Aktionen verstanden werden. |
| Recherchequelle | praktischer Playwright-Lauf `npm run fibu:payments:cash-receipt-readiness`; `playwright/projects/fibu-book5/evidence/payments-004/README.md` |
| Testergebnis | `BANK-RM-01` ist live in Bank Accounts sichtbar. Cash Receipt Journal ist erreichbar und zeigt Pflichtfelder, Gegenkonto-/Ausgleichshinweise sowie `Journal Check`; `Preview Posting` ist in diesem Lauf nicht sichtbar. Es wurde keine Journalzeile erstellt, keine Zahlung gebucht und kein Ausgleich angewendet. |
| Entscheidung | Buch ergaenzen: Zwischen OP-Liste/Bankkonto und erster Zahlung gehoert ein nicht-buchender Zahlungsjournal-Readiness-Schritt. Naechste Arbeit ist eine bereinigbare Entwurfszeile, nicht sofort Zahlung. |
| Buchstelle | Kapitel 19 Debitoren/Kreditoren und Kapitel 20 Bank/Payments |

Bewertung:

Das ist fuer Anfaenger ein wichtiger Sicherheitsanker: Ein sichtbares Zahlungsjournal und ein sichtbarer `Post`-Button bedeuten noch nicht, dass gebucht werden darf. Erst wenn Debitor, offener Posten, Betrag, Gegenkonto, Ausgleichsbezug und Journal Check zusammenpassen, darf eine kontrollierte Laborzahlung ueberhaupt vorbereitet werden.

## FIND-BC-PAY-002 Bankkonto-Fit vor der ersten Laborzahlung

| Feld | Wert |
|---|---|
| Status | geloest als Bankkonto-Fit, Folgearbeit offen |
| Projekt | fibu-book5 |
| Testfall | `PAYMENTS-002`, `PAYMENTS-003` |
| Screenshot | `playwright/projects/fibu-book5/img/payments-002-010-bank-accounts.png`, `playwright/projects/fibu-book5/img/payments-003-010-bank-accounts-bank-rm-01-fit.png`, `playwright/projects/fibu-book5/img/payments-002-020-cash-receipt-journal.png`, `playwright/projects/fibu-book5/img/payments-002-030-payment-journal.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/payments-002/PAYMENTS-002-result.json`, `playwright/projects/fibu-book5/evidence/payments-002/PAYMENTS-002-READINESS.md`, `playwright/projects/fibu-book5/evidence/payments-002/PAYMENTS-READINESS.md`, `playwright/projects/fibu-book5/evidence/payments-003/PAYMENTS-003-result.json`, `playwright/projects/fibu-book5/evidence/payments-003/PAYMENTS-003-BANK-ACCOUNT-FIT.md` |
| BC-Seite | Bank Accounts / Cash Receipt Journals / Payment Journals / Apply Entries |
| sichtbarer Text | `CHECKING`, `SAVINGS`, `Cash Receipt Journals`, `Payment Journals`, `Apply Entries`, `Post`, `Journal Check`, `PS-INV103297`, `108219` |
| Elementtyp | Bankkonto-Setup / Zahlungsjournal / Ausgleichspfad |
| erste Hypothese | Das Buchziel `BANK-RM-01` ist nicht automatisch in der CRONUS-USA-Laborcompany vorhanden. Vor einer Zahlungsbuchung muss entweder das Zielbankkonto eingerichtet oder ein vorhandenes CRONUS-Bankkonto bewusst als Laborersatz gewaehlt werden. |
| Recherchequelle | praktischer Playwright-Lauf `npm run fibu:payments:readiness`; `playwright/projects/fibu-book5/evidence/payments-002/README.md` |
| Testergebnis | `PAYMENTS-002` zeigte `CHECKING`/`SAVINGS`, aber nicht `BANK-RM-01`. `PAYMENTS-003` legte `BANK-RM-01` per BC-Standard-API an und zeigte das Konto danach in Bank Accounts. Cash Receipt Journal, Payment Journal und Apply Entries sind erreichbar. Es wurde keine Journalzeile erstellt, keine Zahlung gebucht und kein Ausgleich angewendet. |
| Entscheidung | Buch ergaenzen: Eine Payments-Anleitung braucht vor der Buchung einen Bankkonto-Readiness-Schritt. Der Bankkonto-Fit ist erledigt, aber die naechste Arbeit ist eine nicht buchende Zahlungsjournal-Readiness, nicht Zahlung. |
| Buchstelle | Kapitel 19 Debitoren/Kreditoren und Kapitel 20 Bank/Payments |

Bewertung:

Das ist ein wichtiger Stopppunkt. Die Bedienpfade fuer Journal und Apply Entries sind vorhanden, und `BANK-RM-01` ist jetzt als Laborbankkonto vorhanden. Fuer Anfaenger bedeutet das trotzdem: Ein sichtbarer `Post`-Button im Zahlungsjournal ist keine Buchungsfreigabe. Erst Journalfelder, Gegenkonto, Betrag, Ausgleichsbezug, Bank Account Posting Group/Sachkonto-Fit und Vorabkontrolle muessen passen.

## FIND-BC-PAY-001 OP-Ausgleich startet bei offenen Posten, nicht beim Bankkonto

| Feld | Wert |
|---|---|
| Status | erledigt als read-only Labor-Readiness |
| Projekt | fibu-book5 |
| Testfall | `PAYMENTS-001` |
| Screenshot | `playwright/projects/fibu-book5/img/payments-001-010-customer-ledger-entry-ps-inv103297.png`, `playwright/projects/fibu-book5/img/payments-001-020-vendor-ledger-entry-108219.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/payments-001/PAYMENTS-001-result.json`, `playwright/projects/fibu-book5/evidence/payments-001/PAYMENTS-001-OPEN-ENTRY-READINESS.md` |
| BC-Seite | Customer Ledger Entries / Vendor Ledger Entries |
| sichtbarer Text | `PS-INV103297`, `D10000`, `108219`, `K10000`, `Remaining Amount`, `Open`, `Due Date`, `Payment Method`, `Applied Entries`, `Related G/L Entries` |
| Elementtyp | OP-Ausgleich / Payments / offene Posten |
| erste Hypothese | Nach O2C und P2P sind Belege nicht einfach abgeschlossen. Fuer Zahlung und Ausgleich muss zuerst geklaert werden, welcher Debitoren- oder Kreditorenposten offen ist und welcher Restbetrag ausgeglichen werden soll. |
| Recherchequelle | praktischer Playwright-Lauf `npm run fibu:payments:open-entries`; `playwright/projects/fibu-book5/evidence/payments-001/README.md` |
| Testergebnis | Debitorenposten zur gebuchten Verkaufsrechnung `PS-INV103297` und Kreditorenposten zur gebuchten Einkaufsrechnung `108219` sind in `RM-DEMO` sichtbar. Payment-/Apply-Aktionen sind im Kontext sichtbar, wurden aber bewusst nicht ausgefuehrt. Keine Zahlung, kein Ausgleich, kein Zahlungsjournal und keine Bankabstimmung. |
| Entscheidung | Buch ergaenzen: Kapitel 19/20 sollen zuerst offene Posten, Restbetrag, Faelligkeit und Ausgleichslogik erklaeren. Bankkonto und Zahlungsjournal sind der naechste Readiness-Schritt, nicht schon bewiesene Wirkung. |
| Buchstelle | Kapitel 19 Debitoren/Kreditoren und Kapitel 20 Bank/Payments |

Bewertung:

Das ist ein zentraler Lernpunkt fuer Anfaenger. Eine gebuchte Rechnung erzeugt einen offenen Nebenbuchposten. Erst Zahlung und Ausgleich schliessen ihn. Das Buch sollte deshalb die Postenlisten als Kontrollpunkt vor der Zahlungsbuchung zeigen: Was ist offen, fuer wen, in welcher Waehrung, mit welchem Restbetrag und welcher Faelligkeit? `PAYMENTS-001` beweist nur diesen Startpunkt. `PAYMENTS-002` muss Bank-/Journal-/Apply-Readiness pruefen, bevor eine einzelne Laborzahlung erlaubt wird.

## FIND-BC-INV-002 Item Journals sind der kontrollierte Bestandszugang

| Feld | Wert |
|---|---|
| Status | erledigt als CRONUS-USA-Laborbuchung |
| Projekt | fibu-book5 |
| Testfall | `INVENTORY-005`, `INVENTORY-006`, `INVENTORY-007`, `INVENTORY-008` |
| Screenshot | `playwright/projects/fibu-book5/img/inventory-005-010-item-journal-direct.png`, `playwright/projects/fibu-book5/img/inventory-006-010-target-journal-line-before-post.png`, `playwright/projects/fibu-book5/img/inventory-007-010-journal-check-no-issues.png`, `playwright/projects/fibu-book5/img/inventory-008-050-item-ledger-entry.png`, `playwright/projects/fibu-book5/img/inventory-008-091-inventory-valuation-preview.png` |
| BC-Seite | `Item Journals`, Page `40`, Tell-Me |
| sichtbarer Text | `Item Journals`, `Post`, `Positive Adjmt.`, `INV008-899959`, `RM-M100`, `FRA-ZL`, `Quantity 2`, `Unit Cost 42.000,00`, `Item Ledger Entries`, `Value Entries`, `G/L Entries`, `Inventory Valuation`, `Total Inventory Value 67.000,00` |
| Elementtyp | Inventory Journal / Trainingsbestand / Buchungsrisiko |
| erste Hypothese | Der negative `RM-M100`-Laborwert darf nicht ueber manuelle Sachposten korrigiert werden. Der naechste sichere Einstieg ist ein Artikeljournal, weil es Artikel-/Wertposten erzeugen kann. |
| Recherchequelle | praktische Playwright-Laeufe `npm run fibu:inventory:target-stock-readiness`, `npm run fibu:inventory:target-stock-draft`, `npm run fibu:inventory:journal-check`, `npm run fibu:inventory:post-target-stock`; `playwright/projects/fibu-book5/evidence/inventory-008/README.md` |
| Testergebnis | Page `40` oeffnet im Labor `Item Journals`; die Zielzeile `RM-M100 +2` in `FRA-ZL` kann vorbereitet, mit `PRODUCTLINE=MACHINE` geprueft und nach Journal-Check-/Current-line-Preflight genau einmal gebucht werden. `INVENTORY-008` erzeugte `INV008-899959`, Artikelposten, Wertposten, Sachposten mit `14140` und eine korrigierte Inventory Valuation. |
| Entscheidung | Buch ergaenzen: Vor einer positiven Bestandsbewegung muss der Leser Zielwerte, Dimension und Journal Check verstehen. Nach der Buchung muessen Artikelposten, Wertposten, Sachposten und Lagerbewertung zusammen gelesen werden. |
| Buchstelle | Kapitel 13 Inventory/Warehouse, Kapitel 23 Inventory Costing und Lagerbewertung |

Bewertung:

Das ist der praktische Anschluss an `INVENTORY-004`. Fuer Anfaenger ist wichtig: Ein Artikelbestand entsteht in BC ueber Artikelbewegungen, nicht ueber eine isolierte Fibu-Korrektur. Die Buchanleitung darf den positiven Bestand jetzt als CRONUS-USA-Laborbefund erklaeren, aber nicht als deutschen Finalwert oder Manufacturing-Output.

## FIND-BC-INV-001 Inventory Trace braucht Artikelposten, Wertposten und Sachposten zusammen

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `INVENTORY-001` |
| Screenshot | `playwright/projects/fibu-book5/img/inventory-001-010-o2c-item-ledger-entry-rm-m100.png`, `playwright/projects/fibu-book5/img/inventory-001-040-p2p-item-ledger-entry-raw-steel.png`, `playwright/projects/fibu-book5/img/inventory-001-060-p2p-gl-entries-inventory-ap.png` |
| BC-Seite | Item Ledger Entries / Value Entries / G/L Entries / Item Card / Locations |
| sichtbarer Text | `RM-M100`, `RAW-STEEL`, `FRA-ZL`, `Entry No. 792`, `Entry No. 793`, `14140`, `22100`, `25.000` |
| Elementtyp | Inventory / Postenspur / Screenshot-Layout |
| erste Hypothese | Ein einzelner Beleg oder eine einzelne Liste erklaert Lager nicht ausreichend; der Leser muss Menge, Wert und Kontenwirkung gemeinsam sehen. |
| Recherchequelle | praktischer Playwright-Lauf `npm run fibu:inventory:trace`, `evidence/inventory-001/INVENTORY-LAB-TRACE-result.json` |
| Testergebnis | O2C `PS-INV103297` ist ueber Wertposten mit Artikelposten `792` verbunden; P2P `108219` ist ueber Wertposten mit Artikelposten `793` verbunden. Artikelposten zeigen Artikel, Lagerort und Menge; Wertposten zeigen die Bewertungsbruecke; Sachposten zeigen `14140` und bei P2P auch `22100`. Der Lauf nutzt `Breites Layout umschalten`, und die Evidence protokolliert `wideLayoutActivated = true` fuer die gefilterten Tabellen. |
| Entscheidung | Buch ergaenzen: Inventory-Nachweise muessen Beleg, Artikelposten, Wertposten und Sachposten kombinieren. Breite Layoutansicht ist fuer Tabellen-Screenshots ein sinnvoller Standard, wenn sonst Spalten fehlen. Inventory Valuation bleibt ein eigener Zahlenbericht und wurde in diesem Lauf nur als Tell-Me-Einstieg belegt. |
| Buchstelle | Kapitel 13 Inventory/Warehouse, Kapitel 23 Inventory Costing und Lagerbewertung, Evidence Pack |

Bewertung:

Das ist ein Kernlernfall fuer Anfaenger. Artikelposten beantworten die Frage „Was wurde mengenmaessig an welchem Lagerort bewegt?“. Wertposten beantworten „Welche Kosten-/Wertwirkung gehoert dazu?“. Sachposten beantworten „Welche Konten wurden im Hauptbuch beruehrt?“. Ein Buch-Screenshot sollte deshalb nicht nur eine gebuchte Rechnung zeigen, sondern die Spur bis zu diesen Postenarten erklaeren.

## FIND-BC-P2P-003 Vendor Invoice No. ist Pflicht vor P2P-Preview/Buchung

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `UAT-P2P-001` |
| Screenshot | `playwright/projects/fibu-book5/img/p2p-001-090-purchase-order-before-preview.png`, `playwright/projects/fibu-book5/img/p2p-001-095-preview-posting.png` |
| BC-Seite | Purchase Order / Error Messages / Posting Preview |
| sichtbarer Text | `Vendor Invoice No.`, `You need to enter the document number of the document from the vendor`, `Posting Preview` |
| Elementtyp | Pflichtfeld / Fehlerbild / Buchungsvorschau |
| erste Hypothese | Der erste P2P-Preview-Versuch ist nicht am Artikel oder an Posting Groups gescheitert, sondern an der fehlenden Lieferantenrechnungsnummer. |
| Recherchequelle | `playwright/projects/fibu-book5/evidence/p2p-001/095-preview-posting-page-text.txt`, `090-purchase-order-api-result.json`, ODataV4-Metadaten `purchaseDocuments.vendorInvoiceNumber` |
| Testergebnis | Ohne `Vendor Invoice No.` zeigt BC `Error Messages` und stoppt vor Preview/Buchung. Die v2.0-Standard-API `purchaseOrders` enthaelt das Feld nicht; ODataV4 `purchaseDocuments` enthaelt `vendorInvoiceNumber` und wurde fuer den Laborlauf genutzt. Danach erreichte Preview echte Vorschauarten und die kontrollierte Buchung `Receive and Invoice` erzeugte Einkaufsrechnung `108219`. |
| Entscheidung | Buch ergaenzen: Eine Eingangsrechnung braucht eine externe Belegnummer des Lieferanten. Fuer Automatisierung muss zwischen Standard-API und Page-/OData-Feldern unterschieden werden. |
| Buchstelle | Kapitel 12 P2P, Einkaufsbestellung, Eingangsrechnung, Evidence Pack |

## FIND-BC-P2P-004 P2P-Postenspur braucht Wertposten-Bruecke zum Artikelposten

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `UAT-P2P-001` |
| Screenshot | `playwright/projects/fibu-book5/img/p2p-001-150-value-entries.png`, `playwright/projects/fibu-book5/img/p2p-001-155-item-ledger-entry-by-entry-no.png` |
| BC-Seite | Value Entries / Item Ledger Entries |
| sichtbarer Text | `RAW-STEEL`, `Item Ledger Entry No. 793`, `Purchase Invoice 108219`, `FRA-ZL`, `Quantity 10` |
| Elementtyp | Postenspur / Inventory |
| erste Hypothese | Der direkte Filter `Item Ledger Entries` nach `Order No. = 106049` reicht nicht als Nachweis fuer den Wareneingang. |
| Recherchequelle | `playwright/projects/fibu-book5/evidence/p2p-001/140-item-ledger-entries-page-text.txt`, `150-value-entries-page-text.txt`, `160-posting-trace-summary.json` |
| Testergebnis | Der direkte Artikelpostenfilter blieb leer. Der Wertposten zur Einkaufsrechnung zeigt aber `Item Ledger Entry No. = 793`; ueber diesen Schluessel ist der Artikelposten sichtbar. |
| Entscheidung | Buch ergaenzen: Postenspur ist kein einzelner Listenfilter. Wenn ein direkter Filter leer bleibt, fuehrt die robuste Diagnose ueber Wertposten und deren Verknuepfung zum Artikelposten. |
| Buchstelle | Kapitel 12 P2P, Kapitel 13 Inventory, Evidence Pack |

## FIND-BC-P2P-001 Vendor Template schliesst K10000-Posting-Blocker

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `UAT-P2P-001` |
| Screenshot | `playwright/projects/fibu-book5/img/p2p-001-010-vendor-k10000.png` |
| BC-Seite | Vendor Card / Purchase Order Draft |
| sichtbarer Text | `K10000`, `Stahlwerk Ruhr GmbH`, `Apply Template`, `Payment Terms Code` |
| Elementtyp | Stammdaten-/Posting-Fit |
| erste Hypothese | Der P2P-Fall scheitert nicht am Klickpfad, sondern daran, dass ein neu angelegter Kreditor ohne Template keine tragfaehigen Einkaufs-/Posting-Vorgaben hat. |
| Recherchequelle | `playwright/projects/fibu-book5/evidence/p2p-001/P2P-READINESS.json`, `005-vendor-template-application-page-text.txt`, `P2P-READINESS.md` |
| Testergebnis | Nach Anwendung des Vendor Templates konnte fuer `K10000` ein temporaerer Purchase-Order-Entwurf mit `RAW-STEEL` angelegt und wieder geloescht werden. Die Standard-API zeigt nicht alle Postingfelder direkt; der Nachweis gilt deshalb als Labor-Readiness bis zur Entwurfszeile, nicht als finaler Buchungsnachweis. |
| Entscheidung | Buch ergaenzen: Wenn `Vendor Posting Group` oder Einkaufs-Postingdaten fehlen, ist das ein Stammdaten-/Template-Thema, kein Bedienfehler des Einkaeufers. |
| Buchstelle | Kapitel 12 P2P, Kreditorenstammdaten, Evidence Pack |

## FIND-BC-P2P-002 RAW-STEEL braucht Labor-Posting-Fit und Direct Unit Cost

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `UAT-P2P-001` |
| Screenshot | `playwright/projects/fibu-book5/img/p2p-001-020-item-raw-steel.png` |
| BC-Seite | Item Card / Purchase Order Line |
| sichtbarer Text | `RAW-STEEL`, `Unit Cost 2,500.00`, `Gen. Prod. Posting Group RETAIL`, `Tax Group Code FURNITURE`, `Inventory Posting Group RESALE` |
| Elementtyp | Artikel-/Zeilenlogik |
| erste Hypothese | Ein Artikel mit Nummer und Beschreibung reicht fuer P2P nicht; Kosten, Lagerort und Buchungsgruppen muessen eine Einkaufszeile tragen koennen. |
| Recherchequelle | `playwright/projects/fibu-book5/evidence/p2p-001/P2P-READINESS.json`, `020-item-raw-steel-page-text.txt`, `testdata/purchase/uat-p2p-001.json` |
| Testergebnis | `RAW-STEEL` wurde als Inventory-Artikel mit `Unit Cost = 2500` und CRONUS-Laborfit `RETAIL`/`RESALE`/`FURNITURE` nachgewiesen. Die Purchase-Order-Line-API verwendet `directUnitCost`; ein Setzen von `unitCost` ist fuer die Entwurfszeile nicht ausreichend. Nach Patch auf `directUnitCost = 2500` zeigte die Entwurfszeile `amountExcludingTax = 25000` und `Tax Percent = 0`. |
| Entscheidung | Buch ergaenzen: P2P-Zeilenwerte sind nicht nur Eingabefelder, sondern Ergebnis von Artikel, Postinggruppen, Kostenlogik, Lagerort und Steuer-/Tax-Setup. |
| Buchstelle | Kapitel 12 P2P, Artikelstammdaten, Einkaufszeile |

## FIND-BC-BOOK-002 O2C-/Reporting-Buchstand hinkt Evidence hinterher

| Feld | Wert |
|---|---|
| Status | recherchieren |
| Projekt | fibu-book5 |
| Testfall | `UAT-O2C-001`, `REPORTING-001`, `MASTERDATA-009` |
| Screenshot | `playwright/projects/fibu-book5/img/uat-o2c-001-080-posting-dialog-before-ok.png`, `playwright/projects/fibu-book5/img/uat-o2c-001-082-posted-sales-invoice.png`, `playwright/projects/fibu-book5/img/reporting-001-010-financial-reports.png` |
| BC-Seite | Sales Order, Posted Sales Invoice, Financial Reports |
| sichtbarer Text | `S-ORD101068`, `PS-INV103297`, `Financial Reports`, `Income Statement`, `Revenue` |
| Elementtyp | Buch-/Evidence-Drift |
| erste Hypothese | Mehrere Buchstellen beschreiben noch den frueheren Stand: O2C nur bis Kopf/Zeile oder Inventory-Posting-Setup-Diagnose; Reporting als Ziel, aber noch ohne Filter-/Summen-Evidence. |
| Recherchequelle | `playwright/projects/fibu-book5/BOOK-TO-EVIDENCE-AUDIT.md`, `080-posting-result.json`, `082-posting-entry-trace.json`, `reporting-001/010-financial-reports-open-result.json` |
| Testergebnis | O2C ist im CRONUS-USA-Labor bis Preview, genau einer Laborbuchung, gebuchter Verkaufsrechnung und Postenspur belegt. `PRODUCTLINE=MACHINE` ist im Belegdialog und am Artikelposten belegt, aber noch nicht in Sachposten oder Financial Reports. Deutsche `19 %` USt ist weiterhin offen. |
| Entscheidung | O2C-Buchstand wurde aktualisiert: `MASTERDATA-009`, `PS-INV103297`, CRONUS-USA-Laborgrenzen und Ziel-vs.-Labor-Tabelle sind eingearbeitet. Offen bleibt die Recherche/Pruefung fuer Sachposten- und Financial-Reports-Dimensionen. |
| Buchstelle | Foundation-Stand, Kapitel 10 Dimensionen/Reporting, Kapitel 11 O2C, Kapitel 25 Financial Reports |

## FIND-BC-SHOT-001 O2C-Zeilenbild beweist nicht alle Buchbehauptungen

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `UAT-O2C-001` |
| Screenshot | `playwright/projects/fibu-book5/img/uat-o2c-001-040-zeile-artikel-rm-m100.png`, `playwright/projects/fibu-book5/img/uat-o2c-001-041-zeile-betraege-steuer.png` |
| BC-Seite | `Sales Order`, Page `42` |
| sichtbarer Text | `RM-M100`, `Standardmaschine M100`, `FRA-ZL`, `68.000,00`; aktueller Laborlauf zeigt `EUR`, `FURNITURE`, `taxPercent = 0` |
| Elementtyp | Screenshot-/Evidence-Qualitaet |
| erste Hypothese | Das Bild `040` ist als Laborbild brauchbar, aber nicht als finales Buchbild, weil Menge, USt-/Tax-Gruppe, Waehrung und Dimension nicht sauber sichtbar sind. Ein zweites Bild nach gezieltem horizontalem Grid-Scroll koennte die Steuer-/Betragsspalten sichtbar machen. |
| Recherchequelle | visuelle Screenshot-Pruefung am 2026-06-07, `SCREENSHOT-QA.md` |
| Testergebnis | DOM-Scroll auf den BC-Container `freeze-pane-scrollbar` funktioniert. `041` zeigt `Unit Price Excl. Tax`, `Tax Group Code = FURNITURE` und `Line Amount Excl. Tax = 68.000,00`. `042` zeigt, dass Scroll ans rechte Ende andere spaete Spalten trifft. |
| Entscheidung | `041` als Laborbild fuer Steuer-/Betragsspalten behalten; `050` weist `PRODUCTLINE=MACHINE` im Zeilendimensionsdialog nach; fuer finale deutsche Buchbilder bleiben deutsche Sprache, 19-%-USt und Postennachweis offen |
| Buchstelle | `UAT-O2C-001`, Verkaufszeile, Evidence Pack |

## FIND-BC-SHOT-002 O2C-Listenbild zeigt CRONUS-Auftraege, nicht den Buchfall

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `UAT-O2C-001` |
| Screenshot | `playwright/projects/fibu-book5/img/uat-o2c-001-020-liste-verkaufsauftraege.png` |
| BC-Seite | `Sales Orders`, Page `9305` |
| sichtbarer Text | vorhandene CRONUS-Auftraege, `10000`, `Adatum Corporation` |
| Elementtyp | Screenshot-/Datensatz-Scope |
| erste Hypothese | Das Bild ist ein Navigationsbild, aber kein Prozessnachweis fuer `D10000`. |
| Recherchequelle | visuelle Screenshot-Pruefung am 2026-06-07, `SCREENSHOT-QA.md` |
| Testergebnis | `020` bleibt als Navigationsbild dokumentiert; `030` und folgende Bilder tragen den Prozessnachweis fuer `D10000`. |
| Entscheidung | im Buch nur als Navigationsbild verwenden; Prozessnachweis erfolgt ueber die erzeugte Auftragskarte und Evidence. |
| Buchstelle | `UAT-O2C-001`, Verkaufsauftragsliste |

## FIND-BC-SHOT-003 Redundanter Screenshot `030-neuer-verkaufsauftrag`

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `UAT-O2C-001` |
| Screenshot | `playwright/projects/fibu-book5/img/uat-o2c-001-030-neuer-verkaufsauftrag.png` |
| BC-Seite | `Sales Order`, Page `42` |
| sichtbarer Text | identisch zu `playwright/projects/fibu-book5/img/uat-o2c-001-030-kopf-debitor-d10000.png` |
| Elementtyp | Asset-Qualitaet |
| erste Hypothese | Der Test erstellt zwei Dateien zum selben Zustand; der Dateiname `neuer-verkaufsauftrag` suggeriert faelschlich einen leeren neuen Auftrag. |
| Recherchequelle | `Get-FileHash` am 2026-06-07, `SCREENSHOT-QA.md` |
| Testergebnis | beide Dateien hatten denselben Hash; die redundante PNG wurde entfernt und der Test erzeugt sie nicht mehr. |
| Entscheidung | nicht als eigenes Buchbild verwenden; der laufende Test erzeugt nur noch `030-kopf-debitor-d10000`. |
| Buchstelle | Screenshot-Konvention, `UAT-O2C-001` |

## FIND-BC-BOOK-001 Auslandsgesellschaft `RM-CH` vs. `RM-AT`

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | Build-Scope aus Buch |
| Screenshot | noch keiner |
| BC-Seite | nicht UI-bezogen |
| sichtbarer Text | Kapitel 6 nennt `RM-CH`; Kapitel 3 nennt `RM-AT GmbH` |
| Elementtyp | Buch-/Datenmodell-Fundstelle |
| erste Hypothese | Das Buch vermischt Drittland-/CH-Fall und EU-/AT-Fall. |
| Recherchequelle | Buchkapitel 3, 6, 18, 22 gegenprüft |
| Testergebnis | Buchmodell bereinigt: Company für EU-Ausland ist `RM-AT`; Drittland/CH bleibt als Debitor-/Steuerfall `D30000`/CH, nicht als eigene Company in Welle 1. |
| Entscheidung | Buch und Projektdaten auf `RM-AT` als Auslandsgesellschaft vereinheitlicht; CH als Drittland-Kunden-/Lieferfall dokumentieren. |
| Buchstelle | Konzernstruktur, Beispieldatenpaket, Ausland/USt/Intercompany |

Bewertung:

Für EU-B2B, Drittland, USt-ID, Exportnachweis und Intercompany ist es fachlich relevant, ob die Auslandsgesellschaft Schweiz oder Österreich ist. Entscheidung: `RM-AT` ist die Auslandsgesellschaft für EU-/Intercompany-Fälle; CH bleibt als Drittlandfall über Debitor `D30000 SwissTech AG` und Kreditor-/Importfälle erhalten.

## FIND-BC-UI-001 Tell-Me-Suche wählt nicht automatisch die richtige Seite

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | alle Such-basierten Playwright-Läufe |
| Screenshot | diverse `smoke-bc-*` und `masterdata-001-*` |
| BC-Seite | Tell-Me / Suche |
| sichtbarer Text | Suchergebnislisten mit Seiten, Aktionen, Berichten und Datenfundstellen |
| Elementtyp | Such-/Navigationsverhalten |
| erste Hypothese | Der oberste Treffer ist nicht zwingend die gewünschte BC-Seite. |
| Recherchequelle | praktischer Playwright-Lauf |
| Testergebnis | Blindes `first().click()` und `Enter` sind fachlich riskant. |
| Entscheidung | Playwright-Helfer darf keinen stillen Enter-Fallback verwenden; bei Mehrdeutigkeit Treffer explizit wählen. |
| Buchstelle | Bedienlogik, Suchlogik, Playwright-Klickanleitungen |

Bewertung:

Die Business-Central-Suche ist für Menschen hilfreich, aber für Automatisierung mehrdeutig. Eine Klickanleitung muss zeigen, welchen Treffer der Anwender wählen soll, nicht nur welchen Suchbegriff er eintippt.

Folgeentscheidung:

Für Audit- und Setup-Prüfungen verwendet Playwright nach Möglichkeit direkte BC-Seiten-URLs mit Page-ID. Tell-Me bleibt für Buchscreenshots und Anwenderschulung wichtig, darf aber nicht die einzige technische Navigation für kritische Prüfungen sein.

## FIND-BC-UI-003 Verkaufsauftrag: `Neu` und `Customer Name` sind für Anfänger erklärungsbedürftig

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `UAT-O2C-001` |
| Screenshot | `playwright/projects/fibu-book5/img/uat-o2c-001-020-liste-verkaufsauftraege.png`, `playwright/projects/fibu-book5/img/uat-o2c-001-030-kopf-debitor-d10000.png` |
| BC-Seite | `Sales Orders` / `Sales Order` |
| sichtbarer Text | `Neu`, `Customer Name`, `Customer No. D10000`, `Mueller Maschinenbau GmbH` |
| Elementtyp | Menü / Feld / FactBox |
| erste Hypothese | Die Buchanweisung „Debitor D10000 auswählen“ ist für die sichtbare Oberfläche zu knapp. |
| Recherchequelle | praktischer Playwright-Lauf am 2026-06-07 |
| Testergebnis | `Neu` ist in der Liste als Menüaktion gerendert. Im Auftragskopf ist zuerst `Customer Name` sichtbar; die Eingabe der Debitornummer in dieses Feld wurde nicht übernommen, die Eingabe des Kundennamens dagegen schon. Danach zeigt BC in Liste und FactBox `Customer No. D10000`. |
| Entscheidung | Buch ergänzen: sichtbares Feld, Eingabelogik und Prüfung von Nummer/Name erklären. |
| Buchstelle | `UAT-O2C-001`, Verkaufsauftrag Kopf |

Bewertung:

Für Anwender ist fachlich der Debitor `D10000` gemeint, in der Oberfläche kann die erste Pflichtauswahl aber über den Namen erfolgen. Eine gute Klickanleitung muss deshalb sagen, dass der Leser den Debitor über Name oder Lookup auswählt und anschließend die Debitornummer `D10000` in FactBox, Liste oder Kopfkontext prüft.

## FIND-BC-TEST-003 BC-Text enthält alte Liste und aktuelle Karte gleichzeitig

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `UAT-O2C-001` |
| Screenshot | `playwright/projects/fibu-book5/img/uat-o2c-001-030-kopf-debitor-d10000.png` |
| BC-Seite | `Sales Orders` / `Sales Order` |
| sichtbarer Text | mehrere `S-ORD...` aus Liste und aktueller Karte |
| Elementtyp | Testqualitäts-Fundstelle |
| erste Hypothese | Nach `Neu` bleiben Listeninhalt und Karteninhalt im DOM; freier Seitentext ist kein sicherer Datensatz-Scope. |
| Recherchequelle | praktischer Playwright-Lauf am 2026-06-07 |
| Testergebnis | Eine erste Cleanup-Logik griff die erste Belegnummer aus dem Seitentext und damit einen alten Listendatensatz. Korrigiert: Für Screenshot-Cleanup wird die aktuelle Kartennummer aus dem späteren Kartenkontext bzw. der letzten Belegnummer im Seitentext verwendet. Offene Laborbelege für `D10000` wurden gezielt entfernt. |
| Entscheidung | Cleanup- und Evidence-Logik niemals gegen ungescopten Freitext bauen; Datensatznummern aus Kartenkontext, URL, API-Antwort oder eindeutigem Marker ermitteln. |
| Buchstelle | Playwright-Regeln, Evidence-Pack-Regeln |

Bewertung:

Business Central rendert häufig Liste, Karte, FactBox und Hintergrundkontext gleichzeitig. Für Screenshots ist das nützlich, für automatisierte Nachweise aber gefährlich. Tests müssen deshalb immer klären, welcher sichtbare Text wirklich zum aktuellen Beleg gehört.

## FIND-BC-TEST-004 Screenshot-Bereinigung darf BC-Fokuszustände nicht zerstören

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `UAT-O2C-001` |
| Screenshot | `playwright/projects/fibu-book5/img/uat-o2c-001-040-zeile-artikel-rm-m100.png` |
| BC-Seite | `Sales Order`, Page `42` |
| sichtbarer Text | `RM-M100`, `Standardmaschine M100`, `FRA-ZL`, `68.000,00` |
| Elementtyp | Testqualitäts-Fundstelle / Screenshot-Stabilisierung |
| erste Hypothese | Hilfekarten lassen sich vor Buchscreenshots pauschal mit `Escape` schließen. |
| Recherchequelle | praktischer Playwright-Lauf am 2026-06-07 |
| Testergebnis | Die Hypothese ist falsch. `Escape` kann je nach Fokus einen BC-Größenänderungsmodus auslösen und danach den Seitentext für Evidence unbrauchbar machen. |
| Entscheidung | Keine globale `Escape`-Bereinigung. Finale Screenshots schließen Hilfekarten nur gezielt über das sichtbare Schließen-Element oder lassen sie im Laborbild bewusst stehen. |
| Buchstelle | Playwright-Regeln, Bildqualität und Wiederholbarkeit |

Bewertung:

Business Central ist kein statisches Webformular. Tastaturbefehle wirken immer im aktuellen Fokuskontext. Für Buchscreenshots ist deshalb eine fachliche Nachprüfung nach jedem UI-Cleanup Pflicht: Der Test muss erneut sehen, dass der richtige Auftrag, der richtige Debitor oder die richtige Zeile sichtbar ist.

## FIND-BC-TEST-001 MASTERDATA-001 war False Positive

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `MASTERDATA-001` |
| Screenshot | `playwright/projects/fibu-book5/img/masterdata-001-*` |
| BC-Seite | Role Center statt Zielseite |
| sichtbarer Text | Role-Center-Kacheln wie `Sales This Month`, `Ongoing Sales`, `Sales Orders` |
| Elementtyp | Testqualitäts-Fundstelle |
| erste Hypothese | Der Test hat nur geprüft, ob Begriffe irgendwo im Role Center vorkommen. |
| Recherchequelle | Evidence-Textdateien unter `playwright/projects/fibu-book5/evidence/masterdata-001/` |
| Testergebnis | Der grüne Audit war fachlich nicht belastbar. |
| Entscheidung | Audit auf direkte Page-ID-Navigation und Negativprüfung gegen Role-Center-Text umstellen. |
| Buchstelle | Test- und Evidence-Regeln |

Bewertung:

Ein bestandener Playwright-Test ist nur dann Evidence, wenn er die richtige Business-Central-Seite prüft. Für Buch und UAT muss die Seite selbst Teil des Akzeptanzkriteriums sein.

## FIND-BC-UI-002 Dimensionsseite vs. Dimension-Value-Liste

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `MASTERDATA-001` |
| Screenshot | `playwright/projects/fibu-book5/img/masterdata-001-dimensions.png` |
| BC-Seite | `Dimensions` / `Dimension Value List` |
| sichtbarer Text | `Dimensions`, `Dimension Value List` |
| Elementtyp | Seiten-/Navigations-Fundstelle |
| erste Hypothese | Page `560` zeigt Dimensionswerte, nicht die Dimensions-Hauptliste. |
| Recherchequelle | direkter BC-Test mit Page-IDs; Microsoft Learn zu Dimensions |
| Testergebnis | Page `536` öffnet `Dimensions`; Page `560` öffnet `Dimension Value List`. |
| Entscheidung | `MASTERDATA-001` nutzt Page `536`; Dimension Values werden erst im Aufbau je Dimension geöffnet. |
| Buchstelle | Foundation Setup, Dimensionen |

Bewertung:

Für das Anlegen einer Dimension braucht der Leser zuerst die Seite `Dimensions`. Dimension Values sind der zweite Schritt innerhalb einer bestehenden Dimension.

## FIND-BC-TEST-002 BC-Listen-Neuanlage braucht Scope auf die `Neu - ...`-Form

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `MASTERDATA-002` |
| Screenshot | `playwright/projects/fibu-book5/img/masterdata-002-dimensions-rhein-main.png` |
| BC-Seite | `Dimensions`, Page `536` |
| sichtbarer Text | `Neu`, `Liste bearbeiten`, `Neu - Dimensions`, `Gespeichert` |
| Elementtyp | Liste / Neuanlage / Grid-Fokus |
| erste Hypothese | Nach `Neu` existieren Hauptliste und Neuanlage-Form gleichzeitig; ein unspezifischer Locator schreibt in die falsche Liste oder gar nicht. |
| Recherchequelle | praktischer Playwright-Lauf |
| Testergebnis | Erfolgreich erst nach Scope auf `form "Neu - Dimensions"`; vorher wurde ein falscher Datensatz `LINE` erzeugt bzw. keine Zeile angelegt. |
| Entscheidung | BC-Grid-Neuanlagen immer auf die konkrete `Neu - <Seite>`-Form scopen und nach dem Speichern gegen den Seitentext prüfen. |
| Buchstelle | Stammdatenaufbau, Playwright-Regeln, Dimensionen |

Bewertung:

Business-Central-Listen verhalten sich anders als klassische Webformulare. Der Button `Neu` erzeugt einen eigenen Neuanlagekontext, während die alte Liste weiter sichtbar bleibt. Für Buchscreenshots ist das didaktisch wichtig: Der Leser muss erkennen, dass er nicht einfach irgendwo in die Tabelle tippt, sondern in der neu erzeugten Zeile arbeitet.

Folgeentscheidung:

Für `MASTERDATA-002` ist die richtige technische Regel: `Dimensions` öffnen, `Neu` klicken, innerhalb der Form `Neu - Dimensions` die Felder `Code` und `Name` erfassen, speichern lassen, danach den neuen Code in der Dimensionsliste nachweisen.

Zusatz-Learning:

Cleanup-Prüfungen dürfen nicht gegen freien Seitentext laufen. Der Text `Product Line` enthält fachlich das Wort `Line`, ist aber kein Dimensionscode `LINE`. Deshalb muss Cleanup eine konkrete Code-Zelle oder einen konkreten Datensatz-Locator prüfen.

## FIND-BC-API-001 Stammdaten per API sind noch kein Posting-Fit

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `MASTERDATA-005`, gelöst in `MASTERDATA-006` |
| Screenshot | `playwright/projects/fibu-book5/img/masterdata-005-items-after-api.png`, `playwright/projects/fibu-book5/img/masterdata-006-item-posting-fit.png` |
| BC-Seite | `Items` / `Item Card` |
| sichtbarer Text | `Base Unit of Measure`, `Gen. Prod. Posting Group`, `Inventory Posting Group` leer |
| Elementtyp | Feld / Stammdaten-/Buchungslogik |
| erste Hypothese | Die Standard-API legt den Artikel an, setzt aber nicht automatisch alle buchungsrelevanten BC-Felder. |
| Recherchequelle | praktischer Playwright-Lauf mit BC-API und Item Card |
| Testergebnis | `RM-M100` existierte zunächst mit Kosten `42.000,00` und Verkaufspreis `68.000,00`; Buchungsgruppen und Basiseinheit waren leer. `MASTERDATA-006` setzt `PCS`, `RETAIL`, `RESALE`, `FURNITURE` und beweist einen Sales-Order-Probelauf. |
| Entscheidung | `MASTERDATA-005` bleibt Existenz- und Screenshot-Nachweis; `MASTERDATA-006` ist der erste technische Posting-Fit. |
| Buchstelle | Stammdaten, Artikel, Posting-Fit, O2C-Vorbereitung |

Bewertung:

Das ist ein klassischer Beratungsfehler: Stammdaten sind nicht fertig, nur weil Name und Preis sichtbar sind. Für einen Verkaufsauftrag braucht der Artikel eine Basiseinheit, Produktbuchungsgruppe, Lagerbuchungsgruppe und passende Buchungsmatrix. Der erste O2C-Lauf darf deshalb erst nach `MASTERDATA-006` gebucht werden.

## FIND-BC-TAX-001 CRONUS-Technikfit ist noch kein deutscher Steuerfit

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `MASTERDATA-006` |
| Screenshot | `playwright/projects/fibu-book5/img/masterdata-006-customer-template-fit.png`, `playwright/projects/fibu-book5/img/masterdata-006-item-posting-fit.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/masterdata-006/api-result.json`, `playwright/projects/fibu-book5/evidence/uat-o2c-001/045-target-vs-labor-delta.md` |
| BC-Seite | `Customer Card`, `Item Card`, Standard-API `salesOrders` |
| sichtbarer/API-Text | frueher `currencyCode = USD`, nach MCP-Korrektur `Currency Code = EUR`; weiterhin `Tax Area Code` leer, `Tax Group Code = FURNITURE`, kein deutscher `19 %`-VAT-Nachweis |
| Elementtyp | Steuer-/Währungs-/Posting-Setup |
| erste Hypothese | Die aktuelle Spielwiese ist CRONUS USA. Sie kann den technischen Klickpfad tragen, bildet aber den deutschen Zielsteuerfall nicht automatisch ab. |
| Entscheidung | UI- und API-Lernen darf weitergehen; `EUR` ist am Debitor `D10000` geloest, endgueltige Buchscreenshots fuer `19 %` brauchen aber einen deutschen Lauf oder ein explizit konfiguriertes deutsches VAT-Setup. |
| Buchstelle | Foundation, Posting Groups, USt, O2C |

Bewertung:

Das ist fuer das Buch zentral: Ein gruener technischer Test ist nicht automatisch ein fachlich korrekter deutscher Steuerfall. Fuer die jetzige Spielwiese zaehlt `MASTERDATA-006` als Laufbarkeitsnachweis. MCP hat die Herkunft genauer gemacht: `RM-M100` liefert `Tax Group Code = FURNITURE`; `D10000` liefert `Tax Liable`, `Tax Area Code = leer`, `Gen. Bus. Posting Group = DOMESTIC`, `Customer Posting Group = DOMESTIC` und inzwischen `Currency Code = EUR`. Fuer den Buch-Endstand muessen deutsche USt-Logik und `19 %` separat nachgewiesen werden.

## FIND-BC-O2C-004 Preview Posting prueft Inventory Posting Setup

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `UAT-O2C-001` |
| Screenshot | `playwright/projects/fibu-book5/img/uat-o2c-001-060-buchungsvorschau.png`, `playwright/projects/fibu-book5/img/masterdata-008-inventory-posting-setup-fra-zl-resale.png`, `playwright/projects/fibu-book5/img/masterdata-009-inventory-posting-setup-fra-zl-resale-14140.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/uat-o2c-001/060-preview-posting-result.json`, `playwright/projects/fibu-book5/evidence/uat-o2c-001/060-preview-posting-learning.md`, `playwright/projects/fibu-book5/evidence/masterdata-008/013-diagnosis.json`, `playwright/projects/fibu-book5/evidence/masterdata-008/014-learning-note.md`, `playwright/projects/fibu-book5/evidence/masterdata-009/010-inventory-posting-setup-fit.json`, `playwright/projects/fibu-book5/evidence/masterdata-009/011-learning-note.md` |
| BC-Seite | `Sales Order`, `Posting Preview`, `Inventory Posting Setup` |
| sichtbarer/API-Text | Vor `MASTERDATA-009`: `Inventory Account is missing in Inventory Posting Setup Location Code: FRA-ZL, Invt. Posting Group Code: RESALE.` Nach `MASTERDATA-009`: `G/L Entry = 4`, `Cust. Ledger Entry = 1`, `Item Ledger Entry = 1`, `Detailed Cust. Ledg. Entry = 1`, `Value Entry = 1`. |
| Elementtyp | Buchungsvorschau / Setup-Wirkung / Buchungslogik |
| erste Hypothese | `Preview Posting` prueft vor dem Buchen nicht nur Debitor, Artikel und Steuer, sondern auch die Kontenfindung fuer Lagerort und Lagerbuchungsgruppe. |
| Recherchequelle | praktischer Playwright-Lauf `npm run fibu:uat:o2c`; Microsoft Learn `Preview Posting Results` in `MICROSOFT-DOC-VALIDATION.md` |
| Testergebnis | Der Test klickt den Dropdown-Teil von `Post...`, waehlt `Preview Posting` und oeffnet nach `MASTERDATA-009` eine echte Posting Preview. Der fruehere Inventory-Fehler ist nicht mehr vorhanden. Der normale Buchungsdialog `Ship / Invoice / Ship and Invoice` wurde nicht geoeffnet und der Test hat nicht gebucht. |
| Entscheidung | Buch ergaenzen: Preview Posting ist Pflicht vor dem Buchen; wenn BC auf `Inventory Posting Setup` stoppt, muss zuerst `FRA-ZL` + `RESALE` fachlich eingerichtet oder als Laborgrenze dokumentiert werden. Der CRONUS-Laborfit ist jetzt durch Folge-Preview bestaetigt. Offen bleiben deutsche 19-%-USt, bewusster Buchungsentscheid und finale Postenspur. |
| Buchstelle | `UAT-O2C-001`, Posting Groups, Inventory Posting Setup, Fehler-/Workaround-Kapitel |

Bewertung:

Das ist ein echter Lernfund fuer Anfaenger und Consultants. Ein Verkaufsauftrag kann technisch angelegt sein und trotzdem nicht buchungsfaehig sein. Die Buchungsvorschau macht diese Grenze sichtbar, bevor echte Posten entstehen. Der konkrete Inventory-Posting-Setup-Blocker ist im CRONUS-Labor mit `14140` geloest und durch Vorschauzeilen bestaetigt. Der naechste Block ist nicht direktes Buchen, sondern Verstehen der Preview-Arten und sauberes Trennen von Labor-Preview, deutscher USt und finaler Postenspur.

## FIND-BC-DIM-002 Standarddimensionen brauchen Daten- und UI-Nachweis

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `MASTERDATA-007` |
| Screenshot | `playwright/projects/fibu-book5/img/masterdata-007-default-dimensions-item-rm-m100.png`, `playwright/projects/fibu-book5/img/masterdata-007-default-dimensions-customer-d10000.png`, `playwright/projects/fibu-book5/img/masterdata-007-item-rm-m100-standarddimension.png`, `playwright/projects/fibu-book5/img/masterdata-007-customer-d10000-standarddimension.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/masterdata-007/api-result.json` |
| BC-Seite | `Default Dimensions`, `Item Card`, `Customer Card` |
| sichtbarer/API-Text | `PRODUCTLINE=MACHINE`, `CHANNEL=B2B`, `postingValidation=Same_x0020_Code` |
| Elementtyp | Standarddimension / Reporting- und Beleglogik |
| erste Hypothese | Standarddimensionen sind für das Buch fachlich wichtiger als ihr unscheinbarer UI-Ort vermuten lässt, weil sie spätere Beleg- und Sachpostendimensionen vorbereiten. |
| Recherchequelle | praktischer Playwright-Lauf mit BC-API |
| Testergebnis | Die Standarddimensionen wurden persistent gesetzt, per API nachgewiesen und per Page `540` als UI-Laborbild fotografiert. Die Dialogbilder zeigen `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` mit `Same Code`. |
| Entscheidung | Buch ergänzt: Standarddimensionen, `Same Code`, UI-Dialog und Laborgrenzen erklären. Finale deutsche Bilder später neu erzeugen. |
| Buchstelle | Kapitel 10 Dimensionen, Kapitel 11 O2C, Reporting nach `PRODUCTLINE` |

Bewertung:

Für den Verkaufsauftrag ist `PRODUCTLINE=MACHINE` nicht kosmetisch. Ohne diese Dimension kann der Erlös später zwar gebucht sein, aber im Produktlinienbericht fehlen oder falsch zugeordnet sein. `Same Code` ist deshalb die harte Lernregel: Der Artikel `RM-M100` soll nicht irgendeine Produktlinie zulassen, sondern genau `MACHINE`.

## FIND-BC-TEST-003 Dimensionswerte brauchen Persistenzprüfung über Grid-Werte

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `MASTERDATA-003` |
| Screenshot | `playwright/projects/fibu-book5/img/masterdata-003-dimension-values-rhein-main.png` |
| BC-Seite | `Dimension Values` aus `Dimensions` |
| sichtbarer Text | `Dimension Values - PRODUCTLINE`, `Nicht gespeichert`, `Gespeichert` |
| Elementtyp | Liste / Neuanlage / Speichern |
| erste Hypothese | Die Zeile lässt sich optisch füllen, aber reiner Seitentext ist kein belastbarer Persistenznachweis. |
| Recherchequelle | praktischer Playwright-Lauf; Microsoft Learn zu Dateneingabe und Keyboard Shortcuts |
| Testergebnis | `MACHINE`, `B2B`, `SALES`, `DIRECTED` sind nach erneutem Öffnen über Grid-Werte nachweisbar. |
| Entscheidung | `MASTERDATA-003` prüft `input.value`/Grid-Werte statt nur `innerText`. Reload-/Neuöffnungsnachweis ist Pflicht. |
| Buchstelle | Dimensionen, vorbereitender Stammdatenaufbau |

Bewertung:

Ein Screenshot mit sichtbarem Wert reicht nicht als Evidence, wenn der Wert nach erneutem Öffnen nicht nachweisbar ist. Für das Projekt gilt: Stammdatenaufbau ist erst erledigt, wenn der Datensatz nach Reload oder erneutem Öffnen der Seite wiedergefunden wird.

Zusatz-Learning:

Business-Central-Grids geben Werte nicht immer über `innerText` aus. Sichtbare Zellwerte können in `input.value` liegen. Für Evidence muss der Test daher je Seite entscheiden, ob Text, ARIA, Input-Wert oder Screenshot der belastbare Nachweis ist.

## FIND-BC-DIM-004 Standard-API liest Dimensionen, legt sie aber nicht an

| Feld | Wert |
|---|---|
| Status | offen |
| Projekt | fibu-book5 |
| Testfall | `MASTERDATA-DIMENSIONS` |
| Screenshot | `playwright/projects/fibu-book5/img/masterdata-dimensions-010-book-standard-dimensions.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/masterdata-dimensions/010-dimension-foundation-result.json`, `playwright/projects/fibu-book5/evidence/masterdata-dimensions/011-dimension-foundation-summary.md` |
| BC-Seite/API | `Dimensions`, API v2.0 `dimensions`, `dimensionValues` |
| sichtbarer/API-Text | `DEPARTMENT`, `CHANNEL`, `PRODUCTLINE`, `LOCATION-GROUP` existieren; `COMPANY-GROUP` fehlt. `POST dimensions` und `POST dimensionValues` liefern `405 Entity does not support insert`. |
| Elementtyp | Dimension / Stammdatenanlage / API-Grenze |
| erste Hypothese | Die Standard-API eignet sich fuer Pruefung und Evidence, aber nicht fuer die Anlage der Dimensionsstammdaten. |
| Recherchequelle | praktischer Playwright-Lauf `npm run fibu:masterdata:dimension-foundation` |
| Testergebnis | Der Lauf wurde auf Read-only-/Delta-Evidence umgestellt. O2C-Kerndimensionen und Default Dimensions sind nachgewiesen. `MASTERDATA-010` hat danach die P1-Werte `PURCH`, `WHSE`, `SPARE` und `SIMPLE` per UI angelegt. Spaetere Service/Project/Shop/IC-Werte bleiben offen. |
| Entscheidung | Fuer weitere Buchstandard-Dimensionswerte braucht das Projekt einen gezielten UI-Setup-Lauf oder einen anderen freigegebenen Setup-Kanal. P2P/Inventory/Warehouse koennen jetzt mit P1-Dimensionsbasis vorbereitet werden, aber noch nicht ohne Stammdaten-/Posting-Fit laufen. |
| Buchstelle | Kapitel 10 Dimensionen, Stammdatenaufbau, Evidence Pack |

Bewertung:

Das ist ein wichtiger Automatisierungsbefund. Nicht jede BC-API-Ressource, die lesbar ist, ist auch fuer Stammdatenanlage beschreibbar. Fuer das Buch bedeutet das: Der Leser darf API-Evidence als Pruefnachweis verstehen, aber nicht als universellen Anlageweg. Fehlende Werte muessen bewusst ueber die BC-Oberflaeche oder einen projektspezifisch freigegebenen Setup-Kanal angelegt werden.

## FIND-BC-DIM-003 Auftragskopf-Dimension ist nicht automatisch Zeilendimension

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `UAT-O2C-001` |
| Screenshot | `playwright/projects/fibu-book5/img/uat-o2c-001-030-kopf-debitor-d10000.png`, `playwright/projects/fibu-book5/img/uat-o2c-001-041-zeile-betraege-steuer.png`, `playwright/projects/fibu-book5/img/uat-o2c-001-050-dimension-productline-machine.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/uat-o2c-001/040-zeile-artikel-rm-m100-api-result.json`, `playwright/projects/fibu-book5/evidence/uat-o2c-001/045-target-vs-labor-delta.md`, `playwright/projects/fibu-book5/evidence/uat-o2c-001/050-line-dimension-dialog-result.json` |
| BC-Seite/API | `Sales Order`, API-Navigation `salesOrders(...)/dimensionSetLines` |
| sichtbarer/API-Text | `CHANNEL=B2B`; `PRODUCTLINE=MACHINE` ist im Zeilendimensionsdialog sichtbar nachgewiesen |
| Elementtyp | Dimension / Belegkopf / Verkaufszeile / Reportingnachweis |
| erste Hypothese | Die Debitor-Standarddimension kommt am Auftragskopf an. Die Artikel-Standarddimension muss in der Zeile, im Dimensionsdialog oder nach dem Buchen separat nachgewiesen werden. |
| Recherchequelle | praktischer Playwright-Lauf; Microsoft Learn Sales Order API mit `dimensionSetLines` |
| Testergebnis | `orderDimensionSetLines` liefert `CHANNEL=B2B`. Der O2C-Test oeffnet danach `Line` -> `Related Information` -> `Dimensions`; Screenshot `050` und `050-line-dimension-dialog-result.json` weisen `PRODUCTLINE=MACHINE` nach. |
| Entscheidung | Beleg-Dimensionsnachweis im Labor ist erledigt. Finaler deutscher Screenshot und Nachweis in Posten/Reporting bleiben offen, weil noch nicht gebucht wird. |
| Buchstelle | Kapitel 10 Dimensionen, Kapitel 11 O2C, Reporting nach Produktlinie |

Bewertung:

Das ist ein sehr nuetzlicher Lernpunkt fuer Anfaenger: Eine Dimension kann korrekt am Kopf stehen und trotzdem muss die fachlich entscheidende Produktliniendimension in der Zeile geprueft werden. Fuer das Buch braucht der Leser deshalb drei Ebenen: Standarddimension vorbereiten, Dimension im Beleg pruefen, Dimension in Posten oder Bericht wiederfinden.

## FIND-BC-REPORT-005 Financial Reports zeigen Dimension Perspective, aber noch keine PRODUCTLINE-/CHANNEL-Auswertung

| Feld | Wert |
|---|---|
| Status | offen |
| Projekt | fibu-book5 |
| Testfall | `REPORTING-002`, `REPORTING-003`, `REPORTING-004`, `REPORTING-005`, `REPORTING-006`, `REPORTING-007`, `REPORTING-008`, `REPORTING-009` |
| Screenshot | `playwright/projects/fibu-book5/img/reporting-002-010-gl-entries-ps-inv103297.png`, `playwright/projects/fibu-book5/img/reporting-002-046-item-ledger-entry-792-dimensions.png`, `playwright/projects/fibu-book5/img/reporting-002-055-financial-reports-list.png`, `playwright/projects/fibu-book5/img/reporting-003-020-financial-reports-wide-layout.png`, `playwright/projects/fibu-book5/img/reporting-003-030-dimension-perspective-result.png`, `playwright/projects/fibu-book5/img/reporting-004-030-revenue-analysis-view-card.png`, `playwright/projects/fibu-book5/img/reporting-005-010-tell-me-dimensions-detail.png`, `playwright/projects/fibu-book5/img/reporting-005-020-dimensions-detail-request.png`, `playwright/projects/fibu-book5/img/reporting-006-010-gl-entries-before-analysis.png`, `playwright/projects/fibu-book5/img/reporting-006-020-gl-entries-after-analysis-attempt.png`, `playwright/projects/fibu-book5/img/reporting-007-010-tell-me-analysis-by-dimensions.png`, `playwright/projects/fibu-book5/img/reporting-007-020-analysis-by-dimensions-result.png`, `playwright/projects/fibu-book5/img/reporting-009-010-gl-entries-before-dimensions.png`, `playwright/projects/fibu-book5/img/reporting-009-020-gl-entry-dimensions-result.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/reporting-002/REPORTING-002-result.json`, `playwright/projects/fibu-book5/evidence/reporting-002/REPORTING-002-PRODUCTLINE-CHANNEL.md`, `playwright/projects/fibu-book5/evidence/reporting-003/REPORTING-003-result.json`, `playwright/projects/fibu-book5/evidence/reporting-003/REPORTING-003-DIMENSION-PERSPECTIVE.md`, `playwright/projects/fibu-book5/evidence/reporting-004/REPORTING-004-result.json`, `playwright/projects/fibu-book5/evidence/reporting-004/REPORTING-004-ANALYSIS-VIEWS.md`, `playwright/projects/fibu-book5/evidence/reporting-005/REPORTING-005-result.json`, `playwright/projects/fibu-book5/evidence/reporting-005/REPORTING-005-DIMENSIONS-DETAIL.md`, `playwright/projects/fibu-book5/evidence/reporting-006/REPORTING-006-result.json`, `playwright/projects/fibu-book5/evidence/reporting-006/REPORTING-006-GL-ENTRIES-DATA-ANALYSIS.md`, `playwright/projects/fibu-book5/evidence/reporting-007/REPORTING-007-result.json`, `playwright/projects/fibu-book5/evidence/reporting-007/REPORTING-007-ANALYSIS-BY-DIMENSIONS.md`, `playwright/projects/fibu-book5/evidence/reporting-008/REPORTING-008-ANALYSIS-VIEW-FIT-READINESS.md`, `playwright/projects/fibu-book5/evidence/reporting-009/REPORTING-009-result.json`, `playwright/projects/fibu-book5/evidence/reporting-009/REPORTING-009-GL-ENTRY-DIMENSIONS.md` |
| BC-Seite | `G/L Entries`, `Item Ledger Entries`, `Financial Reports` |
| sichtbarer Text | `PS-INV103297`, `Entry No. 792`, `PRODUCTLINE=MACHINE`, `CHANNEL=B2B`, `Dimension Perspective`, `Column Definition`, `REVENUE`, `AREA`, `DEPARTMENT`, `CUSTOMERGROUP`; `Dimensions - Detail` ist in `REPORTING-005` nicht sichtbar erreicht; `Analysis by Dimensions` ist in `REPORTING-007` als Tell-Me-Suchpfad sichtbar, aber nicht als Analysezustand mit Ziel-Dimensionen; `REPORTING-009` zeigt `Department Code`/`Customergroup Code` in `G/L Entries`, aber nicht `PRODUCTLINE`/`CHANNEL` |
| Elementtyp | Reporting / Dimension / Postenspur |
| erste Hypothese | Eine Dimension kann am gebuchten Posten vorhanden sein, ohne im Financial Report sofort als sichtbarer Filter oder Summenachse aufzutauchen. |
| Recherchequelle | praktische Playwright-Laeufe `npm run fibu:reporting:productline-channel`, `npm run fibu:reporting:dimension-perspective`, `npm run fibu:reporting:analysis-views`; Microsoft Learn zu Analysis by Dimensions und Dimensions - Detail |
| Testergebnis | `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` sind am Artikelposten `792` sichtbar. In den gefilterten Sachposten und in Financial Reports wurden sie nicht als sichtbarer Filter/Summenbeweis gefunden. `REPORTING-003` zeigt: Financial Reports ist im breiten Viewport brauchbar, aber `Definitions -> Dimension Perspective` fuehrt nicht zu einem sichtbaren Dimensionskontext. `REPORTING-004` zeigt: `Analysis Views` ist erreichbar, aber die bestehende `REVENUE` Analysis View nutzt `AREA`, `DEPARTMENT`, `CUSTOMERGROUP`, nicht `PRODUCTLINE`/`CHANNEL`. `REPORTING-005` zeigt: `Dimensions - Detail` wird ueber Tell-Me in diesem Laborlauf nicht sichtbar erreicht. `REPORTING-006` zeigt: `G/L Entries` zur Rechnung `PS-INV103297` sind sichtbar, aber Data Analysis wird dort nicht belastbar erreicht und `PRODUCTLINE`/`CHANNEL` sind nicht sichtbar. `REPORTING-007` zeigt: `Analysis by Dimensions` ist in Tell-Me sichtbar, aber der Ziel-/Request-/Analysezustand mit `PRODUCTLINE`/`CHANNEL`, Matrix- oder Datumsfilter-Kontext wird nicht belastbar erreicht. `REPORTING-009` zeigt: Die breite Sachpostenliste enthaelt Shortcut-Dimensionsspalten `Department Code` und `Customergroup Code`; `PRODUCTLINE`/`CHANNEL` sind dort aber nicht sichtbar und `Entry` -> `Dimensions` wurde trotz `Weitere Optionen` nicht erreicht. `REPORTING-008` definiert daraus den naechsten freigabepflichtigen Hebel: eine eigene oder angepasste Labor-Analysis-View mit `PRODUCTLINE`/`CHANNEL`. |
| Entscheidung | Buch ergaenzen: Postendimension und Reportingauswertung sind zwei Nachweisebenen. Fuer den finalen Reportingbeweis braucht es jetzt einen kontrollierten Analysis-View-Fit fuer `PRODUCTLINE`/`CHANNEL`; vorhandene Revenue-Views, gefilterte `G/L Entries` und reine Tell-Me-Treffer duerfen nicht ungeprueft als Produktlinienauswertung ausgegeben werden. Da eine Analysis View Reporting-Setup veraendert, braucht der Fit eigene Freigabe. |
| Buchstelle | Kapitel 10 Dimensionen, Kapitel 25 Reporting/Financial Reports |

Bewertung:

Das ist ein starker Anfaenger-Lernpunkt. Der Artikelposten beweist, dass die Dimension in der gebuchten Spur angekommen ist. Der Financial Report beweist damit aber noch nicht automatisch eine GuV-Auswertung nach Produktlinie oder Kanal. `REPORTING-003` verschaerft diese Regel: Auch ein sichtbarer Menuepunkt `Dimension Perspective` ist noch kein Klickpfad, solange der Folgezustand nicht die erwartete Dimensionsansicht zeigt. `REPORTING-004` zeigt zusaetzlich, dass eine vorhandene Revenue-Analysis-View andere Dimensionen haben kann als das Buchziel. `REPORTING-005` zeigt, dass auch ein plausibler Berichtssuchbegriff kein belastbarer Pfad ist, wenn der Zielbericht nicht sichtbar erreicht wird. `REPORTING-006` zeigt dasselbe fuer gefilterte Sachposten: Hauptbuchspur ist nicht automatisch Dimensionsreporting. `REPORTING-007` ergaenzt: Ein Tell-Me-Treffer `Analysis by Dimensions` reicht ebenfalls nicht; erst der sichtbare Analysezustand mit den Ziel-Dimensionen waere ein Buchbild. `REPORTING-009` macht die Differenz noch konkreter: Einzelne Shortcut-Dimensionsspalten koennen in Sachposten sichtbar sein, ohne dass die Buchziel-Dimensionen `PRODUCTLINE`/`CHANNEL` oder ein vollstaendiger Dimensionsdialog sichtbar sind. Fuer das Buch muss deshalb der Reportingpfad selbst bebildert werden, statt die Postendimension als Berichtssumme umzudeuten.

## FIND-BC-INV-001 Inventory Valuation braucht Stichtag und erklaert die RM-M100-Laborbewertung

| Feld | Wert |
|---|---|
| Status | erledigt als Labor-Lernfall; positiver Trainingsbestand seit `INVENTORY-008` belegt; finaler deutscher Nachweis offen |
| Projekt | fibu-book5 |
| Testfall | `INVENTORY-002` |
| Screenshot | `playwright/projects/fibu-book5/img/inventory-002-020-inventory-valuation-request.png`, `playwright/projects/fibu-book5/img/inventory-002-030-inventory-valuation-preview.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/inventory-002/INVENTORY-VALUATION-result.json`, `playwright/projects/fibu-book5/evidence/inventory-002/INVENTORY-VALUATION.md`, `playwright/projects/fibu-book5/evidence/inventory-002/README.md`, `playwright/projects/fibu-book5/evidence/inventory-003/INVENTORY-NEGATIVE-RM-M100.md` |
| BC-Seite | `Inventory Valuation` |
| sichtbarer Text | vor `INVENTORY-008`: `RAW-STEEL = 25.000,00`, `RM-M100 = -42.000,00`, `Total Inventory Value = -17.000,00`; nach `INVENTORY-008`: `RM-M100 = 42.000,00`, `RAW-STEEL = 25.000,00`, `Total Inventory Value = 67.000,00` |
| Elementtyp | Lagerbewertung / Report Request Page / Report Viewer |
| erste Hypothese | Die Lagerbewertung ist eine Stichtagsauswertung aus Artikel-/Wertposten. Der negative `RM-M100`-Wert entsteht nicht im Bericht, sondern aus der Labor-Bewegungskette: Verkauf/Lieferung ohne vorher passend aufgebauten positiven Bestand im selben Filterkontext. |
| Recherchequelle | praktischer Playwright-Lauf `npm run fibu:inventory:valuation` |
| Testergebnis | Der Report rendert read-only mit Stichtag, Item- und Lagerortfilter. `INVENTORY-002` zeigt die negative Ausgangssumme; `INVENTORY-003` erklaert sie aus P2P-Zugang `RAW-STEEL = 25.000,00` und O2C-Abgang `RM-M100 = -42.000,00`. `INVENTORY-008` bucht danach den kontrollierten Trainings-/Opening-Balance-Zugang `RM-M100 +2` und belegt die korrigierte Laborbewertung `Total Inventory Value = 67.000,00`. |
| Entscheidung | Buch ergaenzt: Lagerbewertung braucht Stichtag und Filter. Negative Lagerwerte sind kein Screenshotfehler, sondern ein Hinweis auf Bestands-/Kostenkette, Anfangsbestand oder Reihenfolge der Bewegungen. Der positive Laborzugang ist jetzt belegt, bleibt aber Trainings-/Opening-Balance-Logik und kein Manufacturing-Output oder deutscher Finalabschluss. |
| Buchstelle | Kapitel 13 Inventory/Warehouse, Kapitel 23 Inventory Costing und Lagerbewertung |

Bewertung:

Das ist ein idealer Lernfall fuer Anfaenger: Der Bericht ist nicht falsch, sondern zeigt die Folge der gebuchten Laborposten. Wer Lagerbewertung versteht, muss Artikelposten, Wertposten, Stichtag, Lagerortfilter und Anfangsbestand zusammen lesen. Die erklaerende Kette ist jetzt dokumentiert und durch `INVENTORY-008` praktisch geschlossen: `RM-M100` hat im Labor einen belegten positiven Zugang. Der naechste Schritt ist nicht noch eine Inventory-Buchung, sondern didaktische Abrundung, Reporting-Dimensionswirkung oder Payments/OP-Ausgleich.

Folgeentscheidung aus `INVENTORY-004` bis `INVENTORY-008`: Der klar markierte Trainings-/Opening-Balance-Zugang `RM-M100 +2` in `FRA-ZL` war der kleinste kontrollierte Schritt und wurde genau einmal gebucht. Einkauf von `RM-M100` passt fachlich schlechter, Assembly gehoert in einen anderen Prozess, und Manufacturing/Output bleibt der spaetere echte End-to-End-Nachweis fuer Maschinenfertigung.

## FIND-BC-GOV-001 Autopilot-State und Gates verhindern Drift und Doppelbuchungen

| Feld | Wert |
|---|---|
| Status | erledigt als Governance-Sync |
| Projekt | fibu-book5 |
| Testfall | `GOVERNANCE-001-AUTOPILOT-STATE-GATES`, `WAREHOUSE-002` |
| Screenshot | keiner; Governance-/State-Sync ohne BC-Lauf |
| Evidence | `playwright/projects/fibu-book5/AUTOPILOT-STATE.json`, `playwright/projects/fibu-book5/POSTING-AND-SETUP-GATES.md`, `playwright/projects/fibu-book5/CURRENT-STATE.md`, `playwright/projects/fibu-book5/LAB-FIT-STATUS.md` |
| BC-Seite | keine |
| sichtbarer Text / Werte | O2C `PS-INV103297`, P2P `108219`, Inventory `INV008-899959`; gesperrte Gates fuer Payments, Reporting Analysis View, DE-VAT, Fixed Assets, Warehouse, Manufacturing, Service, Projects, neue Company und Wiederholungsbuchungen |
| Elementtyp | Governance / Handover / Autopilot-Sicherheit |
| erste Hypothese | Wiederholte Queue-Laeufe brauchen eine maschinenlesbare Wahrheit, sonst koennen alte Prompts versehentlich Zahlungen, Setup-Fits oder Doppelbuchungen ausloesen. |
| Recherchequelle | aktueller Repo-Stand und V2-Autopilot-Prompt |
| Testergebnis | `AUTOPILOT-STATE.json` haelt Sandbox, Company, letzte Laborbuchungen, Hard Locks und naechsten nicht freigabepflichtigen Schritt fest. `POSTING-AND-SETUP-GATES.md` definiert, welche Aktionen ohne ausdrueckliche Freigabe gesperrt sind. |
| Entscheidung | Folge-Agenten muessen vor Setup-Aenderungen, Buchungen, neuer Company oder Wiederholungen die Gate-Datei lesen. `FIXEDASSETS-008` und `WAREHOUSE-002` sind erledigt; ohne Freigabe bleiben Fixed Assets und Warehouse-Aktivierung gesperrt. Naechster praktischer Schritt ohne Gate ist ein anderer read-only Block, aktuell Manufacturing/Assembly-Readiness. |
| Buchstelle | Handover, Evidence Governance, alle Kapitel mit Buchung oder Setup-Aenderung |

Bewertung:

Das ist kein Business-Central-Fachnachweis, aber ein wichtiger Projektsicherheitsnachweis. Das Buchprojekt lernt durch echte Bedienung; damit diese Bedienung nicht chaotisch wird, muessen einmalige Laborbuchungen und freigabepflichtige Setup-Schritte explizit gesperrt sein.

## FIND-BC-INV-003 Item Journal kann Zielbestand vorbereiten, pruefen und buchen

| Feld | Wert |
|---|---|
| Status | erledigt als CRONUS-USA-Laborbuchung |
| Projekt | fibu-book5 |
| Testfall | `INVENTORY-006`, `INVENTORY-007`, `INVENTORY-008` |
| Screenshot | `playwright/projects/fibu-book5/img/inventory-006-010-target-journal-line-before-post.png`, `playwright/projects/fibu-book5/img/inventory-007-010-journal-check-no-issues.png`, `playwright/projects/fibu-book5/img/inventory-008-010-journal-line-before-post.png`, `playwright/projects/fibu-book5/img/inventory-008-050-item-ledger-entry.png`, `playwright/projects/fibu-book5/img/inventory-008-091-inventory-valuation-preview.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/inventory-006/README.md`, `playwright/projects/fibu-book5/evidence/inventory-006/INVENTORY-006-TARGET-STOCK-DRAFT-result.json`, `playwright/projects/fibu-book5/evidence/inventory-007/README.md`, `playwright/projects/fibu-book5/evidence/inventory-007/INVENTORY-007-JOURNAL-CHECK-result.json`, `playwright/projects/fibu-book5/evidence/inventory-008/README.md`, `playwright/projects/fibu-book5/evidence/inventory-008/INVENTORY-008-POSTING-result.json` |
| BC-Seite | `Item Journals`, Page `40` |
| sichtbarer Text / Werte | `Positive Adjmt.`, `INV008-899959`, `RM-M100`, `FRA-ZL`, Menge `2`, `PCS`, Unit Amount/Amount/Unit Cost `42.000,00`/`84.000,00`, `PRODUCTLINE=MACHINE` im Dimensionsdialog, `Journal Check`, `No issues found`, Artikelposten, Wertposten, Sachposten `14140`, Inventory Valuation `67.000,00` |
| Elementtyp | Inventory Journal / positiver Trainingsbestand / Vorabkontrolle |
| erste Hypothese | Der kleinste kontrollierte Weg zum positiven `RM-M100`-Bestand ist eine positive Anpassung im Item Journal, aber vor Buchung braucht es eine belastbare Kontrolle. |
| Recherchequelle | praktische Playwright-Laeufe `npm run fibu:inventory:target-stock-draft`, `npm run fibu:inventory:journal-check`, `npm run fibu:inventory:post-target-stock` |
| Testergebnis | Die Zielzeile kann vorbereitet werden, BC zieht Mengen-, Betrags- und Kostenwerte plausibel, `PRODUCTLINE=MACHINE` ist vor Buchung sichtbar. `Preview Posting` wurde im Item Journal nicht als nutzbare Aktion nachgewiesen. `INVENTORY-008` nutzt deshalb den belegten Journal-Check-/Current-line-Preflight und bucht genau einmal. Danach sind Artikelposten, Wertposten, Sachposten und Inventory Valuation sichtbar. |
| Entscheidung | Buch ergaenzen: Ein Journal-Draft und ein gruener Journal Check sind Vorabkontrollen; der Bestandsnachweis entsteht erst nach bewusster Buchung ueber Artikelposten, Wertposten, Sachposten und Lagerbewertung. Rechts liegende Felder wie `Applies-to Entry` duerfen nicht blind mit Kostenwerten gefuellt werden. |
| Buchstelle | Kapitel 13 Inventory/Warehouse, Kapitel 23 Inventory Costing und Lagerbewertung |

Bewertung:

Das ist ein sehr guter Anfaenger-Lernfall. Die Zeile sieht fachlich einfach aus, aber BC-Journale haben viele Spalten mit unterschiedlicher Bedeutung. `Unit Cost` ist eine Bewertungsinformation; `Applies-to Entry` ist eine Zuordnungs-/Ausgleichsspalte. Wer dort den Kostenwert eintraegt, erzeugt einen Zeilenfehler statt einer besseren Bewertung. `INVENTORY-008` hat die bewusste Laborbuchung umgesetzt. Fuer die naechste Arbeit braucht das Projekt keine weitere `INV008`-Buchung, sondern Buch-/Anfaengererklaerung und spaeter getrennte Reporting-, Warehouse- oder Manufacturing-Nachweise.

## FIND-BC-WH-001 Warehouse-Readiness ist nicht Warehouse-Aktivierung

| Feld | Wert |
|---|---|
| Status | erledigt als read-only Readiness und Buch-Sync; Aktivierung offen/gate-gesperrt |
| Quelle | `WAREHOUSE-001`, `WAREHOUSE-002` |
| BC-Seite | Locations / Tell-Me |
| sichtbarer Text / Werte | `FRA-ZL`, `Warehouse Receipts`, `Warehouse Put-aways`, `Warehouse Picks`, `Bins`; `Warehouse Shipments` nicht belastbar sichtbar |
| Elementtyp | Lagerort / Warehouse-Einstiegspfade |
| erste Hypothese | Nach Inventory-Postenspur und Lagerbewertung muss zuerst geklaert werden, ob `FRA-ZL` schon Warehouse-Logik traegt oder nur einfacher Lagerort ist. |
| Testergebnis | `WAREHOUSE-001` oeffnet `FRA-ZL` read-only als Location. Die typischen Warehouse-Marker `Bin Mandatory`, `Require Receive`, `Require Shipment`, `Require Put-away`, `Require Pick` und `Directed Put-away and Pick` sind nicht sichtbar. Tell-Me zeigt `Warehouse Receipts`, `Warehouse Put-aways`, `Warehouse Picks` und `Bins`; `Warehouse Shipments` wurde nicht belastbar sichtbar. Keine Bins, keine Warehouse-Aktivitaet, keine Setup-Aenderung, keine Buchung. |
| Entscheidung | Kapitel 13 stellt den aktuellen Laborstand jetzt nur als einfachen Lagerort plus Warehouse-Readiness dar. `WAREHOUSE-002` hat dafuer eine Statusbox ergaenzt: Buchziel, RM-DEMO-Labor, Warehouse-Readiness, Nichtbehauptungen, Gate und deutscher Finalnachweis sind getrennt. Ein gesteuerter Warehouse-Prozess braucht weiter ein eigenes Gate fuer Aktivierung, Bins und spaetere Prozess-Evidence. Naechster sicherer Schritt ohne Gate ist Manufacturing/Assembly-Readiness read-only. |
| Buchstelle | Kapitel 13 Inventory/Warehouse |

Fuer Anfaenger ist das wichtig, weil `Location Code = FRA-ZL` nicht automatisch bedeutet, dass BC schon Warehouse Receipts, Put-aways, Picks und Bins erzwingt. Ein Lagerort ist die Ortsdimension der Bewegung; Warehouse-Aktivierung ist zusaetzliches Setup, das den Prozesspfad aendert.

## FIND-BC-MFG-001 Manufacturing-Readiness ist nicht Produktionsfaehigkeit

| Feld | Wert |
|---|---|
| Status | erledigt als read-only Readiness; Setup und Buchung offen/gate-gesperrt |
| Quelle | `MANUFACTURING-001` |
| BC-Seite | Tell-Me, Item Card Page `31` |
| sichtbarer Text / Werte | `Planning Worksheet`, `Production BOMs`, `Routings`, `Released Production Orders`, `Consumption Journal`, `Output Journal`; `RM-M100`, `RAW-STEEL`; `COMP-CTRL` und `KIT-MAINT` nicht sichtbar |
| Elementtyp | Planning-/Manufacturing-/Assembly-Einstiege und Artikel-Readiness |
| erste Hypothese | Nach Inventory/Warehouse muss zuerst geklaert werden, ob Kapitel 14 ueberhaupt die noetigen Einstiege und Zielartikel in `RM-DEMO` findet, bevor BOM/Routing, Fertigungsauftrag, Verbrauch oder Output geplant werden. |
| Testergebnis | `MANUFACTURING-001` findet die zentralen Manufacturing-Einstiege ueber Tell-Me, aber `Assembly Orders` nicht belastbar. `RM-M100` und `RAW-STEEL` sind als Artikel sichtbar; `COMP-CTRL` und `KIT-MAINT` sind nicht sichtbar. Auf den Artikelkarten wurden keine sichtbaren BOM-/Routing-/Manufacturing-Marker nachgewiesen. Keine Einrichtung, kein Fertigungsauftrag, kein Montageauftrag, kein Verbrauch, kein Output und keine Buchung. |
| Entscheidung | Kapitel 14 braucht vor einem Produktionslauf eine eigene Readiness-Statusbox: sichtbare Menueinstiege reichen nicht. Fuer einen belastbaren Manufacturing-Fall fehlen mindestens Komponenten-/Kit-Stammdaten, BOM/Routing- oder Assembly-Struktur, ein freigegebener Auftrag, Preview/Pruefung soweit verfuegbar und danach Postenspur. Der vorhandene Inventory-Zugang `INV008-899959` bleibt Trainingsbestand und kein Manufacturing-Output. |
| Buchstelle | Kapitel 14 Planning, Assembly und Manufacturing |

Fuer Anfaenger ist das der Kern: Business Central zeigt viele Produktionsseiten, aber Seitenzugriff ist noch kein Produktionsprozess. Erst wenn Stammdaten, Struktur, Auftrag, Verbrauch, Output und Kostenposten zusammenpassen, darf aus einem Navigationsbild ein Buchungsfall werden.
