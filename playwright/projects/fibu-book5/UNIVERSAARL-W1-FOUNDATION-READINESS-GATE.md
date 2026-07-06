# Universaarl W1 Foundation Readiness Gate

Status: `active-reference-after-company-creation`

Instanz: `playthru`

Zielcompany: `UNIVERSAARL-DE` (`exists-current-target`)

Dieser Gate-Plan gilt fuer die ersten Foundation-Schritte in der bestehenden Zielcompany. Er ersetzt keine Business-Central-Evidence. Er verhindert, dass nach dem Freeze zu schnell Setup, Stammdaten oder Belege angefasst werden.

## Ausgangspunkt

`UNIVERSAARL-DE` existiert bereits. Der alte Company-Creation-Fokus ist nicht mehr der aktive naechste Pfad.

Der richtige Wiedereinstieg nach Freeze-/Live-Gate-Freigabe ist:

1. `TARGET-075` als read-first/no-write Pilot ausfuehren.
2. Instanz `playthru` und Company `UNIVERSAARL-DE` pruefen.
3. Kontenplan und Foundation-Kontext nur lesend wieder oeffnen.
4. Screenshot-QA und Result JSON erzeugen.
5. `FOUNDATION-READINESS-DECISION.md` aus TARGET-075 ableiten.
6. Erst danach entscheiden, welche Stammdaten-, Setup- oder Prozessroute fachlich sinnvoll ist.

## Gate 0 - Rechte und Instanz

| Pruefung | Erwartung | Stop wenn |
| --- | --- | --- |
| Instanz | URL und Kontext zeigen `playthru`. | andere Instanz, Produktivumgebung oder unklare URL |
| Rechte | Gespeicherter Auth ist nutzbar und der Live-Gate ist ausdruecklich freigegeben. | Auth unklar, Freeze aktiv oder Live-Gate blockiert |
| Zielcompany | `UNIVERSAARL-DE` ist die aktive Zielcompany. | andere Company, Company-Kontext nicht sichtbar oder Zielcompany unklar |
| Route | TARGET-075 nutzt den geschuetzten Foundation-Runner read-first/no-write. | direkter Legacy-Test, ungeschuetzter Storage-State oder Schreibaktion |

## Gate 1 - Foundation Read-first

Ziel ist kein Setup-Write, sondern ein belastbarer lesender Wiedereinstieg in die Foundation.

| Bereich | Erwartung | Nicht beweisen |
| --- | --- | --- |
| Kontenplan | Seite und sichtbarer Foundation-Kontext sind erreichbar. | SKR04-Vollstaendigkeit oder Posting-Reife |
| Buchungsgruppen | relevante Foundation-Seiten sind sichtbar oder Grenzen sind dokumentiert. | Buchungsfaehigkeit ohne Matrix- und Entry-Beweis |
| USt/VAT | VAT-Setup-Kontext ist sichtbar oder blockiert. | deutsche Steuer- oder Compliance-Finalbehauptung |
| Dimensionen | Dimensionskontext ist sichtbar oder blockiert. | Reportingwirkung ohne spaetere Posten |

Erfolg liegt erst vor, wenn TARGET-075 Result JSON, Screenshot-QA und Page-Evidence erzeugt hat.

## Gate 2 - Company Context

Nach der Freeze-Freigabe wird nicht sofort Setup ausgefuehrt. Zuerst wird der Kontext geprueft:

- aktuelle Company,
- Rolle,
- Sprache,
- Arbeitsdatum,
- Seite oder Role Center,
- sichtbarer Speicher-/Statuskontext.

Wenn die Company nicht eindeutig aktiv oder erreichbar ist, wird nicht weiter eingerichtet.

## Gate 3 - Company Information

Die Seite `Unternehmensdaten` ist der zentrale Stammdatenpunkt der bestehenden Universaarl-Company.

| Feldgruppe | Zweck | Screenshot muss zeigen |
| --- | --- | --- |
| Name / Adresse | rechtlicher und organisatorischer Kontext | Name, Adresse, PLZ, Ort, Land/Region |
| Kontakt | Kommunikation und Belegausgaben | Kontaktfelder, falls gepflegt |
| Steuerdaten | spaeter USt-/E-Rechnungsbezug | nur pflegen, wenn Zielwert und Quelle klar sind |
| Speicherstatus | Persistenz | sichtbarer gespeicherter Zustand, kein Zwischenstatus |

Company Information ist kein Posting. Trotzdem veraendert sie die Company und braucht Vorher/Nachher-Evidence.

## Gate 4 - Number Series

Nummernserien werden vor den ersten Stammdaten und Belegen geprueft.

Mindestblick:

- Debitoren,
- Kreditoren,
- Artikel,
- Verkaufsbelege,
- Einkaufsbelege,
- Journale,
- Anlagen.

Ein Screenshot ist erst brauchbar, wenn Code, Startnummer, letzte Nummer und manuelle Nummern sichtbar oder bewusst als nicht sichtbar dokumentiert sind.

## Gate 5 - Posting Groups

Buchungsgruppen werden vor Preview und Posting geprueft.

Mindestblick:

- General Business Posting Groups,
- General Product Posting Groups,
- General Posting Setup,
- Customer Posting Groups,
- Vendor Posting Groups,
- Inventory Posting Setup,
- Bank Account Posting Groups,
- Fixed Asset Posting Groups, wenn Anlagen anstehen.

Ohne passende Matrixzeile ist ein Prozessbeleg nicht fachlich bereit fuer Preview oder Posting.

## Gate 6 - VAT / USt

Deutsche USt wird nicht aus einem Prozentfeld behauptet.

Mindestblick:

- VAT Business Posting Groups,
- VAT Product Posting Groups,
- VAT Posting Setup,
- Prozentsatz,
- Berechnungsart,
- Verkaufs-/Einkaufs-USt-Konten.

Ein 19-Prozent-Claim wird erst nach Setup, Preview, VAT Entries und Sachposten als Zielnachweis akzeptiert.

## Gate 7 - Dimensions

Dimensionen werden vor Reporting- und Prozessclaims vorbereitet.

Erste Zielachsen:

- `PRODUCTLINE`,
- `CHANNEL`,
- `COSTCENTER`.

Ein Dimensions-Setup ist erst buchrelevant, wenn spaeter sichtbar ist, dass die Dimension auf Beleg, Journal oder Posten angekommen ist.

## Gate 8 - Erster Prozess erst nach Foundation

Vor O2C, P2P, Inventory, Payment oder Fixed Assets muss klar sein:

| Voraussetzung | Warum |
| --- | --- |
| Company Information steht | Belege und Berichte haben richtigen Unternehmenskontext. |
| Nummernserien stehen | Belege und Stammdaten sind nachvollziehbar nummeriert. |
| Posting Groups stehen | Kontenfindung ist erklaerbar. |
| VAT Setup steht | Steuerwirkung kann in Preview und Entries geprueft werden. |
| Dimensionen stehen | Reportingachsen koennen von Anfang an mitlaufen. |

## Lookahead nach Freeze-Freigabe

| Reihenfolge | Case / Artefakt | Status |
| --- | --- | --- |
| 1 | `TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK` | `ready-after-freeze-lift` |
| 2 | `FOUNDATION-READINESS-DECISION.md` | `ready-after-target-075-result` |
| 3 | VAT/USt read-first Proof | `needs-foundation-decision-first` |
| 4 | Dimensions read-first Proof | `needs-foundation-decision-first` |
| 5 | Posting Groups read-first Proof | `needs-foundation-decision-first` |
| 6 | Master Data read-first | `blocked-until-foundation-decision` |

## Screenshot-QA

Jeder Foundation-Screenshot muss zeigen:

- Page oder Karte,
- Company oder Kontext,
- relevante Felder,
- relevante Action oder Dialog,
- sichtbarer Zustand nach der Aktion,
- was der Screenshot nicht beweist.

Wenn ein Bild nur Codes zeigt, aber die fachlich wichtige Feldgruppe nicht sichtbar ist, wird die Ansicht vergroessert, ein FastTab aufgeklappt, eine FactBox angepasst oder ein neuer Ausschnitt erstellt.
