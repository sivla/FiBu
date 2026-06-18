# FIXEDASSETS-062 - K30000 / FA-CNC-01 Target Field Mapping ohne Posting

Status: `labor`, `ui-first`, `target-field-mapping`, `rejected-path`, `cleanup-done`, `no-preview`, `no-posting`, `not-final`

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Zielkreditor | K30000 / Zollspedition Nord GmbH |
| Zielanlage | FA-CNC-01 / CNC Maschine FRA |
| Labor-Vendor-Invoice-No. | FA062-15224469 |
| Status | line-no-lookup-opened-vendor-card-rejected |
| Gebucht | nein |
| Cleanup | filtered-cleanup-clicked-and-confirmed |

## Ergebnis

`FA-CNC-01` wurde sichtbar, aber nicht als Anlagenzeile: BC oeffnete einen Vendor-Card-/Lookup-Kontext. Der Screenshot ist ein Rejected Path, kein Anlagenzugang-Preflight.

## Anfaenger-Lernwert

Bei einer Anlagen-Einkaufsrechnung reicht es nicht, irgendwo `FA-CNC-01` zu sehen. Der Kreditor gehoert in den Belegkopf; die Anlage gehoert in eine Zeile mit Zeilentyp `Fixed Asset`. Erst wenn beide Ebenen zusammen sichtbar sind, ist der Screenshot fuer eine Klickanleitung belastbar.

## Grenzen

- Keine Preview, kein `Post`, kein Anlagenzugang, keine AfA und keine Anlagenposten.
- CRONUS-USA-Labor; kein deutscher HGB-/Kontenplan-/VAT-Finalnachweis.

## Naechster Schritt

FIXEDASSETS-063-PURCHASE-INVOICE-LINE-TYPE-STRICTNESS: Zeilentyp `Fixed Asset` sichtbar und stabil setzen/pruefen, bevor `FA-CNC-01` erneut eingegeben oder ausgewaehlt wird.
