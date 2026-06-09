# FIXEDASSETS-009 Setup-Gate-Readiness

Status: `gate-readiness`, `no-bc-run`, `no-setup-change`, `no-posting`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Datenbasis | CRONUS USA |
| Buchkapitel | Kapitel 21 Anlagen / Fixed Assets |
| Zielanlage | `FA-CNC-01` |
| Zielbetrag | `120.000 EUR` |
| Ziel-AfA-Buch | `HGB` |
| Ziel-Anlagenbuchungsgruppe | `MACHINES` |
| Zielkreditor | `K30000` |
| BC-Lauf in dieser Session | nein |
| Setup-Aenderung | nein |
| Buchung | nein |

## Konsolidierter Evidence-Stand

| Quelle | Belegter Befund | Bedeutung |
|---|---|---|
| `FIXEDASSETS-004` | `FA-CNC-01`, `HGB`, `MACHINES` und `K30000` sind nicht sichtbar; `Purchase Invoices` ist erreichbar | Der Anlagenprozess ist noch nicht setupfaehig; der Zugangspfad allein reicht nicht |
| `FIXEDASSETS-005` | `FA Posting Groups` ist per UI erreichbar; `Neu`/`Liste bearbeiten` und vorhandene CRONUS-Gruppen sind sichtbar; `MACHINES` fehlt | Die Kontenfindungsseite ist gefunden, aber der Zielwert fehlt |
| `FIXEDASSETS-006` | CRONUS-Gruppen und Konten wurden read-only gelesen: `EQUIPMENT = 12210/82000`, `GOODWILL = 11300`, `PLANT = 12110/81000`, `PROPERTY = 12130/81000`, `VEHICLES = 12230/82000` | Ein spaeteres `MACHINES` darf nicht geraten werden; diese Konten sind Laborreferenz, kein deutscher Kontenplan |
| `FIXEDASSETS-007` | `Depreciation Book COMPANY` ist sichtbar; `HGB` fehlt; FA Classes `FINANCIAL`, `INTANGIBLE`, `TANGIBLE` sind sichtbar | AfA-Buch, Anlagenklasse und Anlagenbuchungsgruppe sind getrennte Setup-Schichten |
| `FIXEDASSETS-008` | Kapitel 21 ist mit der Readiness-Kette synchronisiert | Das Buch trennt Zielprozess und aktuellen RM-DEMO-Laborbefund |

## Setup-Gate-Vorschlag

Das naechste Setup darf nicht in einem einzigen grossen Lauf erfolgen. Sinnvoll ist diese Gate-Kette:

| Gate | Zweck | Erlaubt | Nicht erlaubt |
|---|---|---|---|
| `FIXEDASSETS-010-SETUP-PREFLIGHT-READONLY` | Feld- und Aktionsmapping pruefen | UI read-only: Seitenanker, Kartenaktionen, Feldpositionen, `New/Neu`-Kontext, vorhandene Werte | kein Anlegen, kein Aendern, kein Buchen |
| `FIXEDASSETS-011-UI-SETUP-FIT` | Zielwerte idempotent einrichten, nur nach ausdruecklicher Freigabe | `K30000`, `MACHINES`, `HGB` oder begruendete Labormappings und `FA-CNC-01` genau nach dokumentiertem UI-Pfad | keine Buchung, kein beliebiges Konto, kein deutscher Finalnachweis |
| `FIXEDASSETS-012-ACQUISITION-READINESS` | Einkaufsrechnung/Anlagenzugang vorbereiten | Draft, Zielwerte, Zeilenart `Fixed Asset`, Preview Posting soweit verfuegbar | kein Post, kein Receive/Invoice ohne Freigabe |
| `FIXEDASSETS-013-LAB-ACQUISITION-POSTING` | genau eine kontrollierte Laboraktivierung | Buchung nur nach Preview/Preflight und mit Postenspur | keine AfA-Buchung im selben Lauf |
| `FIXEDASSETS-014-DEPRECIATION-READINESS` | AfA separat vorbereiten | Calculate Depreciation, Journal-Preflight, erwartete Posten | keine AfA-Buchung ohne eigenes Gate |

## Harte Stop-Kriterien

- Wenn `New/Neu` nicht eindeutig im Zielseitenkontext gescoped ist, wird nicht angelegt.
- Wenn die Kontenfelder der FA Posting Group nicht sicher sichtbar und fachlich gemappt sind, wird `MACHINES` nicht angelegt.
- Wenn unklar bleibt, ob `HGB` wirklich eingerichtet werden soll oder `COMPANY` nur als CRONUS-Labormapping genutzt werden darf, wird kein AfA-Buch-Fit ausgefuehrt.
- Wenn `K30000` fehlt und kein UI-first Vendor-Setup-Gate vorliegt, wird keine Einkaufsrechnung vorbereitet.
- Wenn die Einkaufsrechnungszeile `Art/Type = Fixed Asset` nicht sicher gesetzt und geprueft werden kann, wird nicht gebucht.
- Wenn Preview Posting oder ein gleichwertiger Preflight fehlt, wird keine Anlagenaktivierung gebucht.

## Anfaenger-Lernwert

Eine Anlage in Business Central ist nicht einfach ein Sachkonto mit Namen. Vor einem Anlagenzugang muessen mindestens vier Dinge zusammenpassen:

- die Anlagenkarte, damit BC ein eigenes Objekt fuer Buchwert und AfA fuehrt,
- das AfA-Buch, damit Bewertungs- und Abschreibungsregeln gelten,
- die Anlagenbuchungsgruppe, damit Sachkonten fuer Zugang, Buchwert, AfA und Abgang gefunden werden,
- der Zugangspfad, zum Beispiel Einkaufsrechnung mit Kreditor und Zeilenart `Fixed Asset`.

Wenn eine dieser Schichten fehlt, ist ein sichtbarer Einkaufsrechnungsbutton kein Beweis fuer einen buchungsfaehigen Anlagenprozess. Das ist der wichtigste Lernpunkt aus `FIXEDASSETS-004` bis `FIXEDASSETS-008`.

## Buchwirkung

Kapitel 21 bleibt als Zielprozess richtig, aber der aktuelle `RM-DEMO`-Stand ist nur Setup-Readiness. Die Schrittfolge `FA-CNC-01` anlegen, Zugang buchen und AfA berechnen darf erst als bebilderte Klickanleitung gelten, wenn `FIXEDASSETS-010` bis spaeter ein freigegebenes Setup-/Buchungsgate mit UI-Evidence liefern.

Die sichtbaren CRONUS-Konten duerfen im Buch nur als Laborreferenz erklaert werden. Sie sind kein deutscher HGB- oder Kontenplan-Endstand.

## Naechster konkreter Schritt

`FIXEDASSETS-010-SETUP-PREFLIGHT-READONLY`: Business Central read-only oeffnen und fuer FA Posting Groups, Depreciation Books, Fixed Assets und Vendors die genauen UI-Kontexte pruefen, in denen ein spaeteres `New/Neu` und die Ziel-Felder sicher angesprochen werden koennen. Keine Anlage, keine Aenderung, keine Einkaufsrechnung, keine Buchung.
