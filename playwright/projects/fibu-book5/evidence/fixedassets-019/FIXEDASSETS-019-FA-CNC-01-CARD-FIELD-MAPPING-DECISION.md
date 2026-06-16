# FIXEDASSETS-019 - FA-CNC-01 Card Field Mapping Decision

Status: `labor`, `readiness-decision`, `no-bc-run`, `no-setup-change`, `no-masterdata-change`, `no-posting`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Zielanlage | `FA-CNC-01` / `CNC Maschine FRA` |
| Grundlage | `FIXEDASSETS-018` Karten-Preflight |
| Entscheidung | noch kein Setup-Fit; erst weiteres Feldmapping |
| Buchung | nein |
| Setup geaendert | nein |
| Stammdaten gespeichert | nein |

## Ausgangslage

`FIXEDASSETS-018` hat die leere `Fixed Asset Card` UI-first geoeffnet. Sichtbar waren unter anderem:

- `No.`
- `Description`
- `FA Class Code`
- `FA Subclass Code`
- `Depreciation Method = Straight-Line`
- `Depreciation Starting Date`
- `No. of Depreciation Years`
- `Depreciation Ending Date`
- `Book Value = 0,00`

Damit ist der Eingaberaum fuer die Anlage besser verstanden. Es ist aber noch kein gespeicherter Zielstammsatz entstanden.

## Entscheidung

Ein enger UI-first Setup-Fit fuer `FA-CNC-01` ist noch nicht sicher genug.

Grund:

- `No.` und `Description` sind sichtbar und prinzipiell setzbar.
- `FA Class Code` und `FA Subclass Code` sind sichtbar, aber die Zielwerte `MASCHINE`/`CNC` sind im Labor noch nicht als passende Werte nachgewiesen.
- Der Bereich `Depreciation Book` ist sichtbar, aber der konkrete Feldpfad fuer `AfA-Buchcode = HGB` ist im Bild nicht eindeutig sichtbar.
- Die Anlagenbuchungsgruppe `MACHINES` ist auf der leeren Karte noch nicht sichtbar zugeordnet.
- `Acquire` ist auf der Karte sichtbar, darf aber vor gespeicherter Anlage, Kreditor-/Einkaufspfad und Posting-Preflight nicht genutzt werden.

## Erlaubter naechster Lauf

`FIXEDASSETS-020-FA-CNC-01-CARD-MORE-FIELDS-MAPPING`

Erlaubt:

- in `MCP_1_20260210` und `RM-DEMO` bleiben
- `Fixed Assets` / `Fixed Asset Card` UI-first oeffnen
- keine Anlage speichern
- `Mehr anzeigen` im Bereich `General` und `Depreciation Book` gezielt pruefen
- falls noetig `Personalisieren` oder `Page Inspection` nur als Diagnosekontext nutzen
- sichtbar dokumentieren, ob die Felder fuer `HGB` und `MACHINES` erreichbar sind
- Screenshot nur behalten, wenn der sichtbare Zielbezug im Bild erkennbar ist

Nicht erlaubt:

- keine Anlage `FA-CNC-01` speichern
- kein Kreditor `K30000`
- keine Einkaufsrechnung
- kein Anlagenzugang
- keine AfA-Berechnung
- keine Buchung
- kein deutscher HGB-/Kontenplan-Endstand

## Anfaenger-Lernwert

Eine Anlagenkarte besteht nicht nur aus Nummer und Beschreibung. Fuer eine spaetere Buchung muss Business Central wissen, welches AfA-Buch und welche Anlagenbuchungsgruppe verwendet werden. Sonst kann die Anlage zwar wie ein Stammdatum aussehen, spaeter aber beim Zugang oder bei der AfA fachlich falsch oder gar nicht buchbar sein.

Deshalb ist ein leeres Kartenbild nur ein Lernbild. Ein echter Buch-Screenshot fuer die angelegte Anlage muss die Zielwerte zeigen: `FA-CNC-01`, `CNC Maschine FRA`, `HGB` und `MACHINES`.

## Buchwirkung

Kapitel 21 darf `FIXEDASSETS-018` als Karten-Preflight erklaeren, aber nicht als Freigabe zur Stammdatenanlage. Vor dem ersten gespeicherten Anlagenbild braucht das Buch einen Zwischenschritt: Feldmapping der Anlagenkarte mit sichtbarem AfA-Buch- und Anlagenbuchungsgruppenbezug.

## Naechster Schritt

`FIXEDASSETS-020-FA-CNC-01-CARD-MORE-FIELDS-MAPPING`: Kartenfelder ohne Speichern erweitern/diagnostizieren und entscheiden, ob danach ein enger Setup-Fit fuer `FA-CNC-01` erlaubt ist.
