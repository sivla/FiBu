# Universaarl Book Usecase Quality Scorecard

Aktive Zielwelt:

- Instanz: `playthru`
- Zielcompany: `UNIVERSAARL-DE`
- Musterfirma: `Universaarl GmbH`

Diese Scorecard ist der Qualitaetscheck fuer kuenftige Buch- und Usecase-Kapitel. Sie verhindert, dass ein Kapitel nur aus Planung, Screenshot-Sammlung oder Agenten-Notizen besteht.

## Bewertungsstufen

| Status | Bedeutung |
| --- | --- |
| `draft-planned` | Inhalt ist fachlich geplant, aber noch nicht mit Universaarl-Evidence belegt. |
| `reader-draft-ready` | Der Abschnitt ist fuer Anfaenger lesbar, aber noch nicht final bewiesen. |
| `evidence-backed-lab` | Abschnitt nutzt alte Labor-Evidence nur als historische Lernquelle. |
| `universaarl-evidence-backed` | Universaarl-Screenshot, Result oder Entry-Trace belegt die Aussage. |
| `uat-ready` | Entry Criteria, Testdaten, erwartetes Ergebnis und Evidenceplan stehen. |
| `uat-passed` | UAT wurde ausgefuehrt, Ergebnis und Grenzen sind dokumentiert. |
| `german-final-proof` | Finaler deutscher Nachweis ist erbracht. |

## Mindestscore je Abschnitt

| Kriterium | Frage | Punkte |
| --- | --- | --- |
| Leserstart | Weiss ein Anfaenger, welche Seite er oeffnet und warum? | 0-2 |
| Felder | Sind Pflichtfelder und buchungsrelevante Felder erklaert? | 0-2 |
| Actions | Sind sichere und datenveraendernde Buttons getrennt? | 0-2 |
| Screenshot | Sieht man genau das, was erklaert wird? | 0-2 |
| Evidence-Level | Ist klar, ob es Planung, Read-only, Prozess-Test, E2E oder UAT ist? | 0-2 |
| Wirkung | Wird erklaert, was nach Speichern, Preview, Posting oder Fehler passiert? | 0-2 |
| Entries | Sind erwartete Posten/Entries genannt oder als offen markiert? | 0-2 |
| Fehler/Korrektur | Gibt es typischen Fehler und sicheren Korrekturweg? | 0-2 |
| Universaarl-Grenze | Keine RM-DEMO-/CRONUS- oder Labor-Evidence als Finalclaim? | 0-2 |
| Naechster Schritt | Ist der naechste Case logisch und mit Lookahead begruendet? | 0-2 |

Bewertung:

| Punkte | Entscheidung |
| --- | --- |
| 0-7 | Nicht als Buchpatch verwenden. Erst Luecken klaeren. |
| 8-13 | Interner Draft, aber noch nicht anfaengerfertig. |
| 14-17 | `reader-draft-ready`, wenn keine Finalclaims enthalten sind. |
| 18-20 | Buchabschnitt ist stark genug fuer Universaarl-Draft oder UAT-nahe Fassung. |

## Pflichtcheck vor Buchpatch

Vor jeder Buchaenderung:

1. Welche UAT-Zeile aus `UNIVERSAARL-UAT-MATRIX.md` wird bedient?
2. Welche Page, Felder, Actions und Entries sind betroffen?
3. Gibt es eine Screenshot-QA mit sichtbarem Ziel?
4. Gibt es einen Result JSON oder eine Quelle?
5. Ist der Text direkt fuer Leser formuliert, ohne Agenten-Meta?
6. Ist klar, was noch nicht bewiesen ist?
7. Ist `UNIVERSAARL-DE` wirklich die Beweiscompany oder nur geplant?

## Buchtext-Regel

Ein Buchabschnitt beschreibt nicht die Agentenarbeit. Er beschreibt Business Central.

Gute Abschnitte beantworten:

- Was sehe ich auf der Seite?
- Warum ist diese Seite wichtig?
- Welches Feld fuelle ich aus?
- Welcher Button ist ungefaehrlich?
- Welcher Button aendert Daten?
- Was passiert nach Speichern?
- Was passiert nach Preview oder Buchen?
- Welche Posten entstehen?
- Woran erkenne ich Erfolg?
- Was ist ein typischer Fehler?
- Wie korrigiere ich ihn?

## Usecase-Gates nach Testklasse

| Testklasse | Muss im Kapitel sichtbar sein | Nicht behaupten |
| --- | --- | --- |
| `read-only-probe` | Page, Rolle/Company-Kontext, sichtbare Felder/Actions, Screenshot-Zweck | Prozess sei ausgefuehrt oder bestanden |
| `process-test` | Setup-Voraussetzung, Eingabe, erwartete Wirkung, Stop-Regel | End-to-End- oder UAT-Erfolg |
| `end-to-end-test` | Stammdaten, Beleg, Preview/Post, Folgeobjekte, Entry-Trace | Anwenderabnahme ohne UAT |
| `uat` | Rolle, Daten, erwartetes Ergebnis, Durchfuehrung, Abnahme, Fehlerweg | German Final, wenn nicht final belegt |

## Scorecard fuer aktuelle PREP-Reife

| Bereich | Aktueller Status | Score-Entscheidung | Naechste Luecke |
| --- | --- | --- | --- |
| Kapitel 3/4 - Environment, Company, Mandantenliste | `reader-draft-ready` auf Basis PREP-031 bis PREP-034 | stark fuer Draft, nicht final | Company Creation mit Rechten ausfuehren |
| Company Creation | `draft-planned` / `blocked-until-company` | nicht als erfolgreiches Kapitel darstellen | TARGET-009 nach Rechtefreigabe |
| Look-and-Feel / Filter | `reader-draft-ready` fuer Konzepte | spaeter mit Datenreichtum bebildern | Data Richness und Listen mit echten Universaarl-Zeilen |
| W0/W1 Quellen und UAT | `source-backed-prep` | als interne Steuerung nutzbar | PREP-Regeln in spaetere Buchpatches anwenden |
| Prozesskapitel O2C/P2P/Inventory/Payments/FA | `draft-planned` / Legacy-Labor nur Archiv | keine finalen Prozessclaims | nach Company/Foundation neu beweisen |

## Naechster Schritt

Die PREP-Queue ist nach dieser Scorecard fachlich geschlossen. Der naechste praktische Schritt bleibt `TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE`, sobald SUPER-/Company-Create-Rechte bestaetigt sind. Bis dahin sind nur weitere read-only oder Quellen-/Buchpflege-Laeufe sinnvoll, wenn eine konkrete Luecke neu entsteht.
