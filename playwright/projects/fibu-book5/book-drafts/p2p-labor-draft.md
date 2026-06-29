# P2P Labor-Draft fuer Kapitel 12

Status: `labor-draft`, `labor-proven`, `labor-sufficient-for-book-draft`, `needs-german-final-rebuild`.

Umgebung: `MCP_1_20260210`, Company `RM-DEMO`.

Dieser Draft verdichtet die vorhandene Evidence aus `UAT-P2P-001` fuer das Buch. Er ist kein deutscher Finalnachweis.

## Was im Labor bewiesen wurde

| Thema | Laborbefund | Evidence |
|---|---|---|
| Stammdaten/Setup | `K10000`, `RAW-STEEL`, `FRA-ZL` und der CRONUS-Labor-Posting-Fit tragen fuer den Fall | `P2P-READINESS.md`, `P2P-READINESS.json` |
| Einkaufsbestellung | Bestellung `106049` wurde mit `K10000`, `RAW-STEEL`, Menge `10`, Lagerort `FRA-ZL` und `Direct Unit Cost = 2500` aufgebaut | `090-purchase-order-api-result.json`, `090-purchase-order-page-text.txt` |
| Pflichtfeld | `Vendor Invoice No.` musste vor Preview/Buchung gepflegt werden | `P2P-LAB-POSTING.md`, `100-purchase-posting-result.json` |
| Preview Posting | Vorschau zeigte `G/L Entry`, `Vendor Ledger Entry`, `Detailed Vendor Ledg. Entry`, `Item Ledger Entry`, `Value Entry` | `095-preview-posting-result.json` |
| Buchung | Genau eine Laborbuchung mit `Receive and Invoice` | `100-purchase-posting-result.json` |
| Gebuchte Rechnung | Gebuchte Einkaufsrechnung `108219` ist sichtbar | `110-posted-purchase-invoice-page-text.txt` |
| Postenspur | Kreditorenposten, Sachposten, Wertposten und Artikelposten `793` sind nachvollziehbar | `120-*`, `130-*`, `150-*`, `155-*`, `160-posting-trace-summary.json` |
| Folgezahlung | Kreditorenzahlung `PAYP2P-108219` wurde im Payment Journal UI-first gebucht; Preflight, Apply-Entries-Ansicht, Post-Dialog, Kreditorenposten, detaillierte Kreditorenposten, Bankposten und Sachposten sind belegt | `evidence/p2p-002/P2P-002-result.json`, `P2P-002-VENDOR-PAYMENT.md` |
| OP-/Application-Klaerung | Read-only Nachweis: Rechnung `108219` zeigt Restbetrag `0,00`; Detailed Vendor Ledger zeigt `Initial Entry`, `Payment Discount` und `Application` zur Zahlung `PAYP2P-108219` | `evidence/p2p-003/P2P-003-result.json`, `P2P-003-OP-APPLICATION-READONLY.md` |
| Teil-WE-Startgate | UI-first Nachweis: `Purchase Orders` ist erreichbar, `New` oeffnet einen Einkaufsbestellungskontext, Draft `106002` wurde mit `K10000` im Kopf angelegt und die Zeilensteuerung fuer den naechsten Teil-WE-Schritt ist sichtbar | `evidence/p2p-004/P2P-004-result.json`, `P2P-004-PARTIAL-RECEIPT-GATE.md` |
| Teil-WE-Folgerouten | `P2P-007` bis `P2P-012` zeigen: Select items, Cell-Edit, frischer Draft und echte Line-Action-Discovery wurden geprueft; `Location FRA-ZL`, `Quantity 4` und `Qty. to Receive 2` wurden auf Purchase-Order-Zeilen nicht stabil sichtbar/persistiert. `Item Journal` ist als stabilere Material-/Wert-Route beobachtet, aber kein Kreditor-/Bestellprozess. | `evidence/p2p-007/` bis `evidence/p2p-013/`, `evidence/p2p-035/P2P-035-result.json` |
| Direktbuchung ueber Purchase Journal | Kontrollierte RM-DEMO-Laborbuchung `P2P032-682298`: Journal Check `0 Issues`, Preview Posting, sichtbarer Post-Dialog, genau eine Buchung und Postenspur ueber Kreditorenposten, detaillierte Kreditorenposten und Sachposten | `evidence/p2p-032/P2P-032-result.json`, `evidence/p2p-033/P2P-033-result.json` |
| Screenshotanker zur Direktbuchung | `P2P-038` zeigt die Postenspur nicht nur als Code, sondern mit lesbaren Buchungsdetails: Kreditorenposten mit Related G/L Entries, detaillierter Kreditorenposten mit `Initial Entry` und Sachposten `22100`/`82000` mit Gegenbetraegen | `evidence/p2p-038/P2P-038-result.json`, `img/p2p-038-010-*`, `img/p2p-038-020-*`, `img/p2p-038-030-*` |

## Anfaenger-Erklaerung

Eine Einkaufsbestellung ist nicht nur ein Einkaufsformular. Sie verbindet Lieferant, Artikel, Menge, Lagerort, Preis und spaetere Rechnung. Erst wenn Business Central aus diesen Daten eine Vorschau erzeugen kann, ist klar, dass die Einrichtung fuer den Laborfall traegt.

Die gebuchte Einkaufsrechnung ist danach nur ein Teil der Wahrheit. Fuer Finance sind `Kreditorenposten` wichtig, weil sie zeigen, ob noch gezahlt werden muss. Fuer das Hauptbuch sind `Sachposten` wichtig, weil sie Konten wie Verbindlichkeiten und Lager treffen. Fuer Lager und Bewertung sind `Artikelposten` und `Wertposten` wichtig, weil sie Menge und Wert der Materialbewegung erklaeren.

Die Labor-Kreditorenzahlung `PAYP2P-108219` zeigt den naechsten Finance-Schritt: Eine Zahlung entsteht nicht aus der Einkaufsrechnung selbst, sondern aus einem Zahlungsjournal. Entscheidend sind Kreditor, Betrag, Bankgegenkonto und der Bezug auf die Ausgangsrechnung. Der Folgecheck `P2P-003` zeigt danach read-only: Die Ausgangsrechnung `108219` hat Restbetrag `0,00`, und die detaillierten Kreditorenposten zeigen Application-Zeilen zur Zahlung. Der sichtbare `Payment Discount` ist ein eigener CRONUS-USA-Laborbefund und muss im Buch erklaert werden, weil Zahlung und Rechnung dadurch nicht nur als einfache 1:1-Zeile erscheinen.

`P2P-004` ergaenzt keinen neuen gebuchten P2P-Prozess, sondern ein bewusst kleines UI-first Startgate fuer den spaeteren Teil-Wareneingang. Der Lauf zeigt, dass eine Einkaufsbestellung per UI neu geoeffnet werden kann, dass `K10000` im Kopf gesetzt werden kann und dass die Zeilenoberflaeche danach vorhanden ist. Das ist fuer Anfaenger wichtig, weil Teil-WE nicht beim Buchen beginnt: Zuerst muss der Belegkopf stimmen, dann die Zeile, dann die Menge, dann erst Preview oder Buchung. Der Draft `106002` bleibt als Labor-Trace erhalten; er beweist noch keine Artikelzeile und keine Teilmenge.

`P2P-035` schliesst die wiederholte Purchase-Order-Zellenroute bewusst ab. `P2P-007` erzeugte zwar einen sichtbaren `RAW-STEEL`-Zeilenkontext, aber `P2P-008`, `P2P-009` und `P2P-010` konnten `FRA-ZL`, `Quantity 4` und `Qty. to Receive 2` nicht belastbar sichtbar setzen. `P2P-011` fand im sichtbaren Action-Menue keine sichere Edit-/List-Edit-Aktion fuer diese Werte. `P2P-012` zeigte danach mehrere alternative Standardseiten; `Item Journal` ist fuer Materialmenge, Lagerort und Wert am stabilsten, bleibt aber Inventory-Evidence und ersetzt keinen Kreditorenprozess. Fuer das Buch heisst das: Teil-WE bleibt Zielpfad, aber die RM-DEMO-Laborroute ueber Purchase-Order-Zellbearbeitung wird geparkt, bis eine wirklich neue UI-Hypothese oder eine deutsche Zielcompany existiert.

`P2P-032` zeigt eine andere P2P-Route als die Einkaufsbestellung: eine direkte Einkaufsrechnung ueber das Purchase Journal. Hier entsteht kein Artikel- oder Wareneingangsposten, sondern eine Finanzbuchungsroute. Der Laborbeleg `P2P032-682298` wurde erst nach sauberem Journal Check, gefuellter `External Document No.`, Preview Posting und sichtbarem Post-Dialog genau einmal gebucht. Danach sind ein Kreditorenposten, ein detaillierter Kreditorenposten und zwei Sachposten sichtbar. Fuer Anfaenger ist das wichtig: Purchase Journal ist kein Ersatz fuer Wareneingang, aber ein guter Laborfall, um zu sehen, wie Business Central aus einer Journalzeile direkt Kreditor und Sachkonten trifft.

Die sichtbare Buchwirkung aus `P2P-032` ist CRONUS-USA-Labor:

| Sichtbarer Nachweis | Laborbefund |
|---|---|
| Vendor Ledger Entry | `P2P032-682298`, `K10000`, `Stahlwerk Ruhr GmbH`, Betrag `-2.500,00`, Entry No. `5010` |
| Detailed Vendor Ledger Entry | `Initial Entry`, `Invoice`, `P2P032-682298`, Betrag `-2.500,00`, Entry No. `822` |
| G/L Entries | Konto `22100 Accounts Payable, Domestic` mit `-2.500,00` und Konto `82000 Depreciation, Fixed Assets` mit `2.500,00` |

Die P2P-038-Screenshots sind als Buchanker geeignet, weil sie genau diese Kontrollpunkte sichtbar machen. Fuer Anfaenger ist der Unterschied wichtig: Ein Screenshot, der nur `P2P032-682298` zeigt, beweist noch nicht die Buchwirkung. Ein brauchbarer Screenshot zeigt auch Konto, Betrag, Postenart oder Entry No.

Diese Konten sind kein deutscher Kontenplan-Endstand. Konto `82000` ist hier nur das im Labor gewaehlte Balance Account aus der getesteten Journalroute. Fuer die deutsche Finalfassung muss die Route mit deutschen Konten, Buchungsgruppen und Steuerlogik neu aufgebaut werden.

## Was nicht bewiesen wurde

- Kein deutscher `19 %`-Vorsteuer-Endstand.
- Kein deutscher Kontenplan-Endstand.
- Keine E-Rechnung.
- Keine Bankabstimmung und kein Kontoauszugsimport; der OP-Ausgleich der P2P-Rechnung `108219` ist im Labor read-only belegt, aber nicht deutsch/final.
- Keine P2P-Dimensionen in den Posten.
- Keine Teil-WE-Buchung: `P2P-004` beweist nur Draft/Kopf/Zeilenkontext, nicht `RAW-STEEL`, Menge `4`, `Qty. to Receive = 2`, Preview Posting oder Wareneingang.
- Keine stabile Purchase-Order-Zellroute fuer Teil-WE-Zielwerte: `P2P-035` parkt die bekannten PO-Zellenrouten nach `P2P-007` bis `P2P-012`, statt sie blind zu wiederholen.
- Kein Artikelposten/Wertposten aus der Purchase-Journal-Direktbuchung `P2P032-682298`, weil diese Route nicht den Wareneingang ueber Artikelzeilen abbildet.
- Keine Aussage, dass `82000` ein fachlich passendes deutsches Einkaufskonto ist; es ist nur CRONUS/RM-DEMO-Labor-Balance-Account.
- Keine deutsche Finaloberflaeche und keine deutschen Final-Screenshots.

## Buchwirkung

Kapitel 12 darf den P2P-Laborfall als Lernstrecke nutzen:

1. Readiness vor Beleg.
2. Pflichtfeld `Vendor Invoice No.` vor Preview/Buchung.
3. Preview Posting als Sicherheitsgate.
4. Bewusste Buchungsoption `Receive and Invoice`.
5. Postenspur nach der Buchung.
6. Payment-Journal-Folgefall mit Kreditorenzahlung und Bank-/G/L-/Vendor-Trace.
7. OP-/Application-Kontrolle mit Restbetrag `0,00`, detaillierten Kreditorenposten und Payment Discount.
8. Teil-WE als separaten Stufenfall erklaeren: Draft/Kopf/Zeile zuerst, danach Menge, Preview, Wareneingang, Rechnung und Postenspur.
9. Direkte Purchase-Journal-Buchung als separaten Finanzbuchungs-Laborpfad erklaeren: Journal Check, Preview, Post-Dialog, Buchung, Kreditorenposten und Sachposten.
10. Item Journal als Abgrenzung erklaeren: stabil fuer Material-/Inventory-Wirkung, aber kein Kreditor-/Bestellnachweis.
11. Laborgrenzen klar sichtbar.

Kapitel 12 darf daraus nicht ableiten, dass deutsche Vorsteuer, deutsche Konten, deutsche E-Rechnung oder deutsche Final-Screenshots erledigt sind.

## German-Final-Rebuild

In einer deutschen Zielinstanz muss dieser Fall neu aufgebaut werden:

- `K10000` oder Zielkreditor mit deutscher Kreditorenbuchungsgruppe.
- `RAW-STEEL` oder Zielartikel mit deutscher Lager-/Buchungsmatrix.
- Zielwaehrung `EUR`.
- deutsche VAT Posting Setup / Vorsteuerlogik mit `19 %`, falls fachlich passend.
- Einkaufsbestellung, Preview Posting, Buchung, gebuchte Einkaufsrechnung.
- Kreditorenposten, Sachposten, USt-Posten, Artikelposten, Wertposten.
- Kreditorenzahlung im Zahlungsjournal, Bankposten, Sachposten und detaillierte Kreditorenposten.
- OP-Ausgleich sichtbar mit Restbetrag/Applied Entries an der Ausgangsrechnung.
- Payment Discount / Skonto- oder Rabattwirkung fachlich klaeren.
- Direkte Purchase-Journal-Route nur dann uebernehmen, wenn deutsche Konten, Buchungsgruppen, Belegnummern, Steuerlogik und Postenspur neu belegt sind.

## Naechster sinnvoller Laborblock

Nicht `UAT-P2P-001` wiederholen. Der naechste praktische P2P-Nutzen ist ein Abweichungsfall, zum Beispiel:

- Teil-Wareneingang vs. Rechnung bleibt fachliches Ziel, aber die bisherige Purchase-Order-Zellenroute ist geparkt.
- Naechster praktischer Hebel: kontrollierter Item-Journal-/Inventory-Folgefall fuer Materialwirkung und Postenspur oder eine wirklich neue PO-UI-Hypothese, nicht erneut `P2P-008`/`P2P-009`/`P2P-010`.
- Preisabweichung als eigener spaeterer Fall.
- P2P-Dimensionen in gebuchten Posten.
