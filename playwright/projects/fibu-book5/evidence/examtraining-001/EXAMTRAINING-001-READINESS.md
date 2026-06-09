# EXAMTRAINING-001 - MB-800-Pruefungstraining Readiness

Stand: 2026-06-09

## Kontext

| Feld | Wert |
|---|---|
| Repository | `sivla/FiBu` |
| Branch | `codex/playwright-bc-screenshot-foundation` |
| Sandbox | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Datenbasis | CRONUS USA |
| Arbeitstyp | Buch-Sync / Readiness |
| BC-Lauf | nein |
| Setup-Aenderung | nein |
| Buchung | nein |
| Pruefungssimulation | nein |

## Ziel

Kapitel 36 soll Anfaengern helfen, typische MB-800-Fallen fachlich zu unterscheiden. Der Lauf macht daraus keinen bestandenen Test, sondern ordnet die Fallen gegen:

- Kapitel 34 `MB-800-Kompetenzmatrix`
- Kapitel 35 `Microsoft-Learn-Lernpfad-Mapping`
- offiziellen Microsoft-Learn-Study-Guide fuer MB-800
- vorhandene Labor-Evidence aus O2C, P2P, Inventory, Payments, Reporting, Security, Migration, Integration, Operations und Solution Architecture

## Was als Laboranker traegt

| Pruefungsfalle | vorhandener Lernanker | Grenze |
|---|---|---|
| Posting Groups vs. VAT Posting Groups vs. Inventory Posting Setup | O2C/P2P/Inventory zeigen Posting-Fit, Preview, Buchung und Postenspur; `MASTERDATA-009` erklaert `FRA-ZL + RESALE -> 14140`. | Konto `14140` ist CRONUS-USA-Labor, kein deutscher Kontenplan-Endstand; VAT19 bleibt offen. |
| Item Ledger vs. Value Entries vs. G/L Entries | O2C, P2P und `INVENTORY-008` zeigen Postenarten und deren unterschiedliche Kontrollfragen. | Nicht jede Dimension ist in jeder Postenliste sichtbar; Reportingwirkung bleibt teilweise offen. |
| Default, Global und Shortcut Dimensions | `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` sind als Stammdaten-/Beleg-/Artikelposten-Laborbefund belegt. | Financial Reports nach `PRODUCTLINE`/`CHANNEL` sind nicht final belegt. |
| Customer/Vendor Ledger vs. Detailed Entries | O2C/P2P und Payments-Readiness zeigen offene Posten und Ausgleichskontext. | Keine Zahlung und kein OP-Ausgleich wurden gebucht. |
| Payment Journal, Cash Receipt Journal, Payment Registration | Payments-Readiness zeigt Journal Check, Apply Entries und Post-Dialog mit Abbruch. | Zahlung braucht eigenes Gate; kein Bankposten und kein Ausgleichsnachweis. |
| Receive vs. Invoice | P2P-Laborbuchung `106049 -> 108219` wurde bewusst als `Receive and Invoice` dokumentiert. | Deutsche Vorsteuer und deutscher Kontenplan bleiben offen. |
| Report Layouts vs. Financial Reports | Reporting-Evidence trennt Belegausgabe von Finanzanalyse und dokumentiert negative/teilweise Pfade. | Keine belastbare Financial-Reports-Summenwirkung nach `PRODUCTLINE`/`CHANNEL`. |
| Company vs. Dimension | Projektzustand trennt `RM-DEMO` als Lerncompany von spaeteren Ziel-Companies und Dimensionen als Auswertungsachsen. | Keine neue Company, kein Intercompany-Prozess, keine produktive Mehrmandantenstruktur. |
| Profile/Rollen vs. Berechtigungssaetze | Security-Readiness zeigt getrennte Admin-Kontexte. | Keine Benutzer-/Berechtigungs-/Profil-Aenderung, kein SoD-Finalnachweis. |
| Extension vs. Configuration vs. Customizing | Solution-Architect- und Integrations-Sync trennen Standard, Setup, Extension, AppSource, API/Web Services und UAT. | Keine Architekturentscheidung, keine Extension, kein Connector, kein produktiver Integrationslauf. |

## Buchwirkung

Kapitel 36 darf als Pruefungstraining genutzt werden, wenn jede Falle mit einer Frage verbunden wird:

1. Welche Business-Central-Seite oder Aktion ist betroffen?
2. Welche Einrichtung entscheidet fachlich?
3. Welcher Beleg oder Posten beweist die Wirkung?
4. Ist das im Projekt praktisch belegt, nur Readiness oder offen?
5. Ist der Nachweis CRONUS-USA-Labor oder deutscher Finalnachweis?

## Nicht bewiesen

- keine bestandene MB-800-Pruefung
- keine abgeschlossene Pruefungssimulation
- keine vollstaendige praktische Kompetenzabdeckung
- keine deutsche `19 %` USt
- kein deutscher Kontenplan-Endstand
- keine neuen Screenshots oder UI-Evidence
- keine neue BC-Ausfuehrung

## Naechster sinnvoller Schritt

`GLOSSARY-001-READINESS`: Kapitel 37 Glossar Deutsch/Englisch/Tell-Me gegen vorhandene UI-Inventar- und Evidence-Begriffe einordnen. Das ist ohne Gate moeglich, solange kein neuer BC-Lauf, keine Setup-Aenderung und keine Buchung gestartet wird.
