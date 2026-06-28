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

## Anfaenger-Erklaerung

Eine Einkaufsbestellung ist nicht nur ein Einkaufsformular. Sie verbindet Lieferant, Artikel, Menge, Lagerort, Preis und spaetere Rechnung. Erst wenn Business Central aus diesen Daten eine Vorschau erzeugen kann, ist klar, dass die Einrichtung fuer den Laborfall traegt.

Die gebuchte Einkaufsrechnung ist danach nur ein Teil der Wahrheit. Fuer Finance sind `Kreditorenposten` wichtig, weil sie zeigen, ob noch gezahlt werden muss. Fuer das Hauptbuch sind `Sachposten` wichtig, weil sie Konten wie Verbindlichkeiten und Lager treffen. Fuer Lager und Bewertung sind `Artikelposten` und `Wertposten` wichtig, weil sie Menge und Wert der Materialbewegung erklaeren.

Die Labor-Kreditorenzahlung `PAYP2P-108219` zeigt den naechsten Finance-Schritt: Eine Zahlung entsteht nicht aus der Einkaufsrechnung selbst, sondern aus einem Zahlungsjournal. Entscheidend sind Kreditor, Betrag, Bankgegenkonto und der Bezug auf die Ausgangsrechnung. Der Lauf beweist die gebuchte Zahlung und die Postenspur. Er beweist noch nicht eindeutig, dass die Ausgangsrechnung `108219` vollstaendig geschlossen ist, weil `Remaining Amount = 0,00` oder `Applied Entries = 1` an der Rechnungszeile nicht sichtbar nachgewiesen wurden.

## Was nicht bewiesen wurde

- Kein deutscher `19 %`-Vorsteuer-Endstand.
- Kein deutscher Kontenplan-Endstand.
- Keine E-Rechnung.
- Kein eindeutig nachgewiesener vollstaendiger OP-Ausgleich der P2P-Rechnung `108219`; belegt ist die Zahlung `PAYP2P-108219` mit Postenspur.
- Keine P2P-Dimensionen in den Posten.
- Keine deutsche Finaloberflaeche und keine deutschen Final-Screenshots.

## Buchwirkung

Kapitel 12 darf den P2P-Laborfall als Lernstrecke nutzen:

1. Readiness vor Beleg.
2. Pflichtfeld `Vendor Invoice No.` vor Preview/Buchung.
3. Preview Posting als Sicherheitsgate.
4. Bewusste Buchungsoption `Receive and Invoice`.
5. Postenspur nach der Buchung.
6. Payment-Journal-Folgefall mit Kreditorenzahlung und Bank-/G/L-/Vendor-Trace.
7. Laborgrenzen klar sichtbar.

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

## Naechster sinnvoller Laborblock

Nicht `UAT-P2P-001` wiederholen. Der naechste praktische P2P-Nutzen ist ein Abweichungsfall, zum Beispiel:

- Teil-Wareneingang vs. Rechnung.
- Preisabweichung.
- OP-Ausgleich/Restbetrag der Rechnung `108219` nach Zahlung gezielt klaeren.
- P2P-Dimensionen in gebuchten Posten.
