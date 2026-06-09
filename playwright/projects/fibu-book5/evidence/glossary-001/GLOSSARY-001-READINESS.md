# GLOSSARY-001 - Glossar Deutsch/Englisch/Tell-Me Readiness

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

## Ziel

Kapitel 37 soll Anfaenger nicht nur mit Begriffen versorgen, sondern ihnen zeigen, wie Begriffe in Business Central praktisch funktionieren:

- Ein deutscher Begriff ist die fuehrende Buchsprache.
- Ein englischer Begriff ist Suchhilfe, Microsoft-Learn-Begriff oder aktuelle Labor-UI.
- Ein Tell-Me-Treffer beweist nur einen Einstieg, nicht automatisch einen erfolgreichen Prozess.
- Ein Glossarbegriff ist erst dann ein Klickpfad, wenn eine Seite, ein Button/Feld, ein Ergebnis und Evidence vorhanden sind.

## Begriffsklassen

| Begriffsklasse | Beispiel | vorhandener Nachweis | Grenze |
|---|---|---|---|
| Navigation/Suche | `Alt+Q`, `Tell-Me`, `Sales Orders`, `Financial Reports` | `UAT-START-001`, `UAT-O2C-001`, `REPORTING-001`, `UI-INVENTORY.md` | Suchtreffer ist Einstieg, kein fachlicher Ergebnisnachweis. |
| Beleg vs. Posten | Verkaufsauftrag, gebuchte Verkaufsrechnung, Debitorenposten, Sachposten | O2C `S-ORD101068` -> `PS-INV103297`, Postenspur in `uat-o2c-001`, `POSTING-TRACE-001/002` | Laborbeleg ist CRONUS-USA, kein deutscher Finalnachweis. |
| Nebenbuch vs. Hauptbuch | Customer/Vendor Ledger Entries, G/L Entries | O2C/P2P/Payments Evidence | Sachposten zeigen nicht automatisch alle Ziel-Dimensionen. |
| Lagerposten/Wertposten | Item Ledger Entries, Value Entries | O2C Artikelposten `792`, P2P `793`, Inventory `INV008-899959` | Manufacturing-Output darf daraus nicht abgeleitet werden. |
| Dimensionen | `PRODUCTLINE`, `CHANNEL`, `DEPARTMENT`, `LOCATION-GROUP` | `MASTERDATA-002/003/007/010`, O2C-Zeilendimension, Reporting-Teilbefunde | Reportingwirkung nach `PRODUCTLINE`/`CHANNEL` bleibt offen. |
| Finanzberichte/Analyse | Financial Reports, Analysis Views, Analysis by Dimensions | `REPORTING-001` bis `REPORTING-010` | Mehrere Pfade sind Teil-/Negativbefunde; Analysis-View-Fit braucht Gate. |
| Zahlung/Ausgleich | Cash Receipt Journal, Payment Journal, Apply Entries | `PAYMENTS-001` bis `PAYMENTS-010` | Keine Zahlung, kein OP-Ausgleich, keine Bankabstimmung. |
| Steuer/Compliance | VAT Entries, VAT Posting Setup, Tax Group, E-Rechnungen | `TAX-001`, `COMPLIANCE-001/002` | CRONUS-USA-Sales-Tax ist kein deutscher VAT19-Nachweis. |
| Rollen/Rechte | Profiles Roles, Permission Sets, Security Groups | `SECURITY-001/002` | Keine Rechteaenderung, kein SoD-/Audit-Finalnachweis. |
| Setup-/Gate-Begriffe | Analysis View Fit, VAT19 Fit, Payment Gate, New Company Gate | `AUTOPILOT-STATE.json`, `POSTING-AND-SETUP-GATES.md` | Ohne Freigabe keine Ausfuehrung. |

## Buchwirkung

Kapitel 37 ist jetzt als Lern- und Suchschicht markiert. Fuer jedes Prozesskapitel gilt:

1. Deutsche Bezeichnung zuerst nennen.
2. Englischen Business-Central-/Tell-Me-Begriff als Suchhilfe in Klammern nennen.
3. Wenn ein Begriff nur Zielbild ist, nicht als getesteten Klickpfad formulieren.
4. Wenn ein Begriff praktisch belegt ist, Evidence oder Screenshot-Kontext nennen.
5. Bei gemischtsprachiger Laboroberflaeche den deutschen Finalbild-Nachweis offen halten.

## Nicht bewiesen

- keine neue Business-Central-Seite wurde geoeffnet
- keine neuen Screenshots
- keine vollstaendige deutsche Terminologie-Freigabe
- kein bestandener UI-Navigationstest fuer alle Glossarbegriffe
- keine Setup-Aenderung
- keine Buchung

## Naechster sinnvoller Schritt

`PAGESINDEX-001-READINESS`: Kapitel 38 Seitenindex, Prozesskatalog und Qualitaetssicherung gegen `BOOK-CLICK-GUIDE-COVERAGE.md`, `UI-INVENTORY.md`, `SCREENSHOT-QA.md` und vorhandene Evidence einordnen.
