# MB800-001 - MB-800-Kompetenzmatrix gegen Evidence

Stand: 09.06.2026

## Ziel

Kapitel 34 ordnet das Buch gegen die offizielle MB-800-Kompetenzstruktur ein. Dieser Lauf synchronisiert diese Matrix mit dem aktuellen Evidence-Stand des Projekts.

## Quelle

Primaerquelle ist der Microsoft-Learn-Study-Guide fuer Exam MB-800:

<https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/mb-800>

Die Quelle nennt am 09.06.2026 vier Skill-Areas:

| Skill-Area | Gewichtung | Evidence-Einordnung im Projekt |
|---|---:|---|
| Set up Business Central | 25-30 % | Foundation, Company, Dimensionen und mehrere Readiness-/Buch-Syncs sind belegt. Security, Migration, Integrationen, Betrieb und neue Companies bleiben Gate-/Finalthemen. |
| Configure financials | 30-35 % | Posting Groups, O2C, P2P, Inventory und Payments-Readiness sind im CRONUS-USA-Labor belegt. Deutsche VAT19, deutscher Kontenplan, Zahlungsbuchung, Bankabstimmung und finale Reports bleiben offen. |
| Configure sales and purchasing | 10-15 % | O2C, P2P und Inventory sind als Laborprozesse belegt. Warehouse, Service, Projects, Manufacturing und Dropshipping sind ueberwiegend Readiness oder Buch-Sync und nicht prozessfaehig bewiesen. |
| Perform Business Central operations | 25-30 % | Beleganlage, Preview Posting, Postenspur, Journal Check, Apply-Readiness und Reporting-Negativpfade sind praktisch gelernt. Viele operative Folgefaelle bleiben gate-gesperrt. |

## Aktueller Beweisstand

O2C, P2P und Inventory liefern starke CRONUS-USA-Laborbeweise: gebuchte Belege, Postenspur, Sachposten, Artikelposten, Wertposten und einzelne Reporting-/Kontrollbilder.

Payments ist bis zum zahlungsreifen Cash-Receipt-Draft, Apply Entries und Post-Dialog mit Abbruch belegt, aber ohne Zahlung, ohne Ausgleich und ohne Bankposten.

Reporting ist als Einstieg und Teil-/Negativbefund belegt: `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` sind am Artikelposten sichtbar, aber nicht als Financial-Reports-Summenwirkung nachgewiesen.

Security, Migration, Integrationen, Operations, Solution Architecture, UAT und Training sind als Buch-/Readiness-Syncs eingeordnet. Sie beweisen keine praktische Zielumsetzung.

## Was Kapitel 34 deshalb sagen darf

- Das Buch deckt die MB-800-Themen als Lern- und Projektstruktur ab.
- Mehrere Skill-Areas sind durch echte Laborprozesse gestuetzt.
- Die Matrix ist ein Lernwegweiser: Wo gibt es Evidence, wo nur Readiness, wo bleibt ein Gate?

## Was Kapitel 34 nicht sagen darf

- keine bestandene Zertifizierung
- keine vollstaendige praktische MB-800-Kompetenzabdeckung
- kein deutscher VAT19- oder Kontenplan-Endstand
- kein Security-/Migration-/Integration-/Operations-Finalnachweis
- keine finale Financial-Reports-Dimensionswirkung nach `PRODUCTLINE`/`CHANNEL`

## Buchwirkung

Kapitel 34 hat eine Statusbox erhalten, die die bisherige Matrix begrenzt: `abgedeckt` meint Lernabdeckung im Buch, nicht vollstaendige praktische Zielumsetzung. Die Evidence-Dateien dieses Laufs trennen `labor belegt`, `readiness`, `teilweise` und `offen/gate`.

## Naechster Schritt

`LEARNPATH-001-READINESS`: Kapitel 35 Microsoft-Learn-Lernpfad-Mapping gegen offizielle Microsoft-Learn-Pfade und vorhandene Evidence einordnen. Keine Buchung, keine Setup-Aenderung und kein neuer BC-Lauf.
