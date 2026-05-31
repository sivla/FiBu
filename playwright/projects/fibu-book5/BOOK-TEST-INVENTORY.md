# Buch-5-Testinventur

Diese Inventur übersetzt das Buch in testbare Business-Central-Läufe. Sie ist der Arbeitsplan für `lass alles machen was im Buch steht`.

## Arbeitsregel

Jeder Buchabschnitt wird in eine oder mehrere testbare Einheiten zerlegt:

| Ebene | Bedeutung |
|---|---|
| Kapitel | fachlicher Kontext im Buch |
| Prozessfall | realer Business-Central-Ablauf |
| Testfall-ID | stabiler technischer und redaktioneller Bezug |
| Testdaten | Debitoren, Artikel, Preise, Dimensionen, Setup |
| Screenshots | buchfähige Kontrollpunkte |
| Evidence | Belege, Posten, Berichte, Filter |
| Fundstellen | sichtbare, aber noch nicht erklärte BC-Funktionen |

## Priorisierte Teststrecke

| Reihenfolge | Kapitel | Testfall | Ziel | Status |
|---:|---|---|---|---|
| 1 | 4/6 | `UAT-START-001` | Spielwiese öffnen, Company und Suche verstehen | bestanden |
| 2 | 6 | `FOUNDATION-001` | `RM-DEMO` aus CRONUS erstellen oder bestätigen | bestanden |
| 3 | 6 | `FOUNDATION-002` | Unternehmensdaten für `RM-DEMO` setzen | bestanden |
| 4 | 7 | `MASTERDATA-001` | Ist-Stand der relevanten Stammdaten- und Setup-Seiten sichern | bestanden |
| 5 | 7/10 | `MASTERDATA-002` | Mindestdimensionen für O2C anlegen | erledigt |
| 6 | 10 | `MASTERDATA-003` | Mindest-Dimensionswerte für O2C anlegen und persistent prüfen | erledigt |
| 7 | 7/13 | `MASTERDATA-004` | Mindestlagerort `FRA-ZL` anlegen | erledigt |
| 8 | 7/11/13 | `MASTERDATA-005` | Debitor `D10000` und Artikel `RM-M100` anlegen | offen |
| 9 | 9 | `MASTERDATA-006` | Posting-Fit für O2C prüfen | offen |
| 10 | 9 | `UAT-SETUP-POSTING-001` | Buchungsgruppen und Posting-Setup für Verkauf prüfen | blockiert bis Masterdata |
| 11 | 10 | `UAT-DIM-001` | Dimension `PRODUCTLINE = MACHINE` und weitere Reportingdimensionen prüfen | teilvorbereitet |
| 12 | 11 | `UAT-O2C-001` | Verkaufsauftrag für `D10000`/`RM-M100` erfassen, prüfen, buchen, Posten nachweisen | blockiert bis Masterdata |
| 13 | 12 | `UAT-P2P-001` | Einkaufsprozess mit Wareneingang und Rechnung | offen |
| 14 | 13 | `UAT-INV-001` | Lagerbestand, Lagerbewegung, Wertposten und Lagerbewertung | offen |
| 15 | 14 | `UAT-MFG-001` | Fertigungs-/Montagefall mit Materialverbrauch | offen |
| 16 | 15 | `UAT-SERVICE-001` | Servicefall, Ersatzteil, Ressource und Abrechnung | offen |
| 17 | 16 | `UAT-PROJ-001` | Projekt/Job mit Meilensteinrechnung | offen |
| 18 | 18 | `UAT-IC-001` | Intercompany-/Auslandsfall | offen |
| 19 | 19 | `UAT-OP-001` | Debitoren-/Kreditorenposten und Ausgleich | offen |
| 20 | 20 | `UAT-BANK-001` | Zahlung, Bankabstimmung und OP-Ausgleich | offen |
| 21 | 21 | `UAT-FA-001` | Anlage Zugang und AfA | offen |
| 22 | 22 | `UAT-VAT-001` | Inland-USt, EU-B2B, Drittland und Nachweise | offen |
| 23 | 23 | `UAT-COST-001` | Kostenregulierung und Lagerkostenbuchung | offen |
| 24 | 24 | `UAT-R2R-001` | Monatsabschluss und Evidence Pack | offen |
| 25 | 25 | `UAT-REPORT-001` | Finanzbericht nach Dimension und Drilldown | offen |

## Aktueller Fokus: `UAT-O2C-001`

Ziel:

- Verkaufsauftrag öffnen und neuen Auftrag anlegen.
- Debitor `D10000` verwenden.
- Artikel `RM-M100`, Menge `1`, Preis `68.000 EUR` erfassen.
- USt `19 %` und Dimension `PRODUCTLINE = MACHINE` prüfen.
- Buchungsvorschau und später Postenspur dokumentieren.

Vorarbeiten:

- Prüfen, ob `D10000`, `RM-M100`, `FRA-ZL` und `PRODUCTLINE = MACHINE` in `RM-DEMO` existieren.
- Wenn nicht vorhanden: Testdaten anlegen und im Buch dokumentieren.
- Sichtbare Buttons und FactBoxes aus der Verkaufsauftragsseite in `playwright/FINDINGS.md` erfassen, wenn sie im Buch fehlen.
