# FIXEDASSETS-127 - Acquire Disabled Cause Review

Status: `labor`, `local-review`, `judge_work`, `no-bc-run`, `no-playwright-run`, `no-posting`, `not-final`.

## Kontext

- Instanz: `MCP_1_20260210`
- Company: `RM-DEMO`
- Anlage: `FA-CNC-01`
- Grundlage: `FIXEDASSETS-082`, `FIXEDASSETS-125`, `FIXEDASSETS-126`

## Bewertete Evidenz

| Route | Befund | Entscheidung |
|---|---|---|
| `Acquire` auf Anlagenkarte | In FA-082 und FA-126 sichtbar, aber deaktiviert; `Book Value = 0,00`; kein Wizard geoeffnet | Nicht ausfuehren; nur gezielt Mode-/Toolbar-Zustand pruefen |
| Purchase Invoice | Fachlich guter Anfaengerpfad, aber `Fixed Asset`/`Anlage` als Zeilentyp nach vielen UI-Probes nicht bewiesen | Nicht erneut blind wiederholen |
| FA G/L Journal | Zielzeilen-Shell vorhanden, aber Betrag/Gegenkonto-Control nicht sicher | Kein Wertschreib-, Preview- oder Posting-Lauf |

## Entscheidung

`Acquire` bleibt blockiert, aber der naechste sinnvolle Hebel ist enger als ein weiterer allgemeiner Ursachenlauf: FA-126 zeigte auf dem Screenshot eine sichtbare Stift-/Edit-Aktion im oberen Kartenbereich, waehrend der Test keinen exakt benannten `Edit`-/`Bearbeiten`-Button fand. Das ist eine konkrete Hypothese:

> Business Central koennte `Acquire` nur in einem anderen Kartenmodus oder nach einer sauber identifizierten Toolbar-Aktion aktivieren.

Deshalb ist genau ein neuer read-only/diagnostic UI-Probe sinnvoll:

`FIXEDASSETS-128-FA-CNC-01-EDIT-ICON-ACTION-STATE-PROBE`

Der Probe darf die Kartenansicht oeffnen, die sichtbare Edit-/Stift-Aktion eindeutig inventarisieren und, wenn sicher identifiziert, nur den Modus wechseln. Danach darf er `Acquire` erneut auf sichtbar/aktiv/deaktiviert pruefen. Er darf keine Feldwerte aendern, nicht speichern, `Acquire` nicht ausfuehren, keine Preview und kein `Post` ausloesen.

## Buchwirkung

Kapitel 21 sollte den Lernfall spaeter so erklaeren: Eine sichtbare Aktion ist in Business Central nicht automatisch ausfuehrbar. Wenn eine Aktion deaktiviert ist, muss zuerst geklaert werden, ob der aktuelle Modus, der Datensatzstatus oder fehlendes Setup die Aktion sperrt. Der Screenshot aus FA-126 ist dafuer ein Diagnosebild, aber kein Anschaffungsbild.

## Grenzen

- Keine BC-Ausfuehrung in FA-127.
- Keine neue Page Inspection.
- Keine Setup-Aenderung.
- Keine Anschaffung, keine Preview, keine Buchung.
- Kein deutscher Finalnachweis.

## Naechster Schritt

`FIXEDASSETS-128`: enger UI-Probe auf `FA-CNC-01`, um die Edit-/Toolbar-Aktion und den danach unveraendert oder veraendert sichtbaren `Acquire`-Status zu pruefen.
