# FIXEDASSETS-061 - K30000 / FA-CNC-01 Target Field Mapping Gate

Status: `decision`, `no-bc-run`, `no-posting`, `target-field-mapping-approved`, `de-final-open`

## Ausgangslage

`FIXEDASSETS-060` hat in `MCP_1_20260210` / `RM-DEMO` einen aktiven `Purchase Invoice`-Karten-/Lines-Kontext nach gescoptem `Neu` belegt. Sichtbar waren `Purchase Invoice`, Pflichtfelder wie `Vendor Name` und `Vendor Invoice No.` sowie der Lines-/Gridbereich mit `Type`, `No.` und `Description`.

Nicht belegt sind weiterhin `K30000`, eine konkrete `Vendor Invoice No.`, Zeilentyp `Fixed Asset`, `FA-CNC-01`, Preview Posting, Anlagenzugang, AfA, Anlagenposten und deutscher Finalnachweis.

## Entscheidung

Genau ein neuer enger UI-first Zielwerte-Preflight ist freigegeben:

`FIXEDASSETS-062-K30000-FA-CNC-01-TARGET-FIELD-MAPPING-NO-POSTING`

Der Zweck ist nur das Feldmapping in der Einkaufsrechnung:

- `K30000` im Belegkopf sichtbar machen.
- `Vendor Invoice No.` als eindeutigen Laborwert sichtbar machen, falls BC das fuer den Belegkontext benoetigt.
- In den Zeilen erst `Type = Fixed Asset` setzen oder sichtbar bestaetigen.
- Erst danach `FA-CNC-01` als Anlagen-Nr. setzen oder sichtbar bestaetigen.
- Screenshot nur erzeugen, wenn Kopf und Zeile im selben sichtbaren Vordergrundkontext stehen.

## Zwingende Guard-Regel

Der Lauf muss `playwright/core/bc/purchase-invoice-guards.ts::classifyCurrentPurchaseInvoiceFieldMappingPage` oder einen gleichwertigen, dokumentierten Guard nach jedem Kopf- und Zeilenschritt verwenden.

Der Lauf stoppt sofort, wenn eines dieser Signale erscheint:

- falsche Umgebung oder falsche Company
- Vendor-Registrierungsdialog
- `Vendor Card`
- versehentliche Vendor-Nummer wie `V00040`
- Verlust des `Purchase Invoice`-Karten-/Lines-Kontexts
- `FA-CNC-01` ohne sichtbaren Zeilentyp `Fixed Asset`
- Preview-Posting- oder Posting-Dialog
- Draft kann nicht per UI bereinigt werden

## Verboten

- `Preview Posting`
- `Post`
- `Receive`
- `Invoice`
- `Receive and Invoice`
- Anlagenzugang
- AfA
- Setup-Aenderungen
- API-Shortcut
- Company-Wechsel
- Draft im System belassen

## Screenshot-QA

Ein Screenshot fuer das Buch zaehlt nur, wenn in demselben Vordergrundkontext sichtbar sind:

- `Purchase Invoice`
- `K30000`
- `Vendor Invoice No.`-Wert, falls eingegeben
- Lines/Grid
- `Fixed Asset`
- `FA-CNC-01`

Wenn nur `FA-CNC-01`, nur `K30000` oder nur ein allgemeiner Einkaufsrechnungsbildschirm sichtbar ist, ist das Bild nur Kontext- oder Rejected-Evidence.

## Buchwirkung

Kapitel 21 darf den Schritt als vorsichtigen Labor-Preflight erklaeren: Bei Anlagenkauf ueber Einkaufsrechnung muss der Leser zuerst verstehen, dass der Kreditor im Kopf und die Anlage in einer Zeile mit passendem Zeilentyp stehen. Erst diese Kombination macht den Screenshot didaktisch brauchbar.

Es darf weiterhin nicht behauptet werden:

- Anlagenzugang sei gebucht.
- AfA sei vorbereitet oder gebucht.
- deutsche HGB-/Kontenplan-/VAT-Finalwahrheit sei erreicht.
- Preview Posting oder Postenspur seien fuer diesen Anlagenfall belegt.

## Naechster Lauf

`FIXEDASSETS-062-K30000-FA-CNC-01-TARGET-FIELD-MAPPING-NO-POSTING`
