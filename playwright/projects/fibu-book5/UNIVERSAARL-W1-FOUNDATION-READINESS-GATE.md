# Universaarl W1 Foundation Readiness Gate

Status: `prep-done`

Instanz: `playthru`

Zielcompany: `UNIVERSAARL-DE` (`planned-not-yet-created`)

Dieser Gate-Plan gilt fuer die ersten wirksamen Schritte nach der Rechtefreigabe. Er ersetzt keine Business-Central-Evidence. Er verhindert, dass nach der Company-Anlage zu schnell Setup, Stammdaten oder Belege angefasst werden.

## Ausgangspunkt

`TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE` bleibt geparkt, bis ausreichende Rechte fuer Company Creation bestaetigt sind.

Nach der Rechtefreigabe ist die richtige Reihenfolge:

1. `UNIVERSAARL-DE` ueber die Mandantenliste und `Neues Unternehmen erstellen` anlegen oder sauber blockieren.
2. Sichtbar pruefen, dass `UNIVERSAARL-DE` in der Mandantenliste steht.
3. Company Context pruefen.
4. Company Information oeffnen und pflegen.
5. Datenbasis pruefen: keine unbemerkten Demo-/CRONUS-Daten als Zielbasis.
6. Foundation Readiness fuer Nummernserien, Buchungsgruppen, USt und Dimensionen vorbereiten.
7. Erst danach Stammdaten und erste Prozessbelege anlegen.

## Gate 0 - Rechte und Instanz

| Pruefung | Erwartung | Stop wenn |
| --- | --- | --- |
| Instanz | URL und Kontext zeigen `playthru`. | andere Instanz, Produktivumgebung oder unklare URL |
| Rechte | Nutzer hat SUPER oder ausreichende Company-Creation-Rechte bestaetigt. | Rechte nicht bestaetigt |
| Zielcompany | `UNIVERSAARL-DE` ist geplant, aber vor dem Lauf noch nicht als eigene Company belegt. | Company existiert, aber Herkunft/Datenbasis unklar |
| Route | Mandantenliste -> Pfeil neben `Neu` -> `Neues Unternehmen erstellen`. | Hauptbutton `Neu` erzeugt falsche Listenzeile oder falschen Zielzustand |

## Gate 1 - Company Creation

Ziel ist nicht irgendeine Company, sondern eine kontrollierte Universaarl-Company.

| Entscheidung | Bevorzugt | Nicht als finale Zielbasis verwenden |
| --- | --- | --- |
| Datenbasis | `No Data` oder `Setup Data Only`, wenn Bedeutung sichtbar klar ist | `Testunternehmen`, Sample Data, unklare Demo-Route |
| Kopie | nur mit eigenem, spaeterem Copy-Usecase | CRONUS-Kopie als Universaarl-Zielbasis |
| Abschluss | nur mit sichtbarer Datenbasis und erwarteter Wirkung | `Finish`, `OK`, `Create`, wenn Datenbasis unklar ist |

Erfolg liegt erst vor, wenn `UNIVERSAARL-DE` in der Mandantenliste lesbar ist.

## Gate 2 - Company Context

Nach der Anlage wird nicht sofort Setup ausgefuehrt. Zuerst wird der Kontext geprueft:

- aktuelle Company,
- Rolle,
- Sprache,
- Arbeitsdatum,
- Seite oder Role Center,
- sichtbarer Speicher-/Statuskontext.

Wenn die Company nicht eindeutig aktiv oder erreichbar ist, wird nicht weiter eingerichtet.

## Gate 3 - Company Information

Die Seite `Unternehmensdaten` ist der erste Stammdatenpunkt der neuen Company.

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

## Lookahead nach Rechtefreigabe

| Reihenfolge | Case | Status bis Rechtefreigabe |
| --- | --- | --- |
| 1 | `TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE` | `blocked` |
| 2 | `TARGET-COMPANY-INFO-001` | `needs-setup-first` |
| 3 | `TARGET-005-NUMBER-SERIES-PREFLIGHT` | `ready-after-company` |
| 4 | `TARGET-006-POSTING-GROUPS-PREFLIGHT` | `ready-after-number-series` |
| 5 | `TARGET-008-VAT19-SETUP-READINESS` | `needs-source-and-setup-evidence` |
| 6 | `TARGET-007-DIMENSIONS-FOUNDATION` | `ready-after-company` |

## Screenshot-QA

Jeder Foundation-Screenshot muss zeigen:

- Page oder Karte,
- Company oder Kontext,
- relevante Felder,
- relevante Action oder Dialog,
- sichtbarer Zustand nach der Aktion,
- was der Screenshot nicht beweist.

Wenn ein Bild nur Codes zeigt, aber die fachlich wichtige Feldgruppe nicht sichtbar ist, wird die Ansicht vergroessert, ein FastTab aufgeklappt, eine FactBox angepasst oder ein neuer Ausschnitt erstellt.

