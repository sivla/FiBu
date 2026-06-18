# FIXEDASSETS-058 K30000 / FA-CNC-01 guarded Purchase-Invoice-Retry

Status: `labor`, `ui-first`, `guarded-retry`, `no-preview`, `no-posting`, `not-final`

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Zielkreditor | K30000 / Zollspedition Nord GmbH |
| Zielanlage | FA-CNC-01 / CNC Maschine FRA |
| Status | blocked-before-field-entry |
| Gebucht | nein |

## Ergebnis

Der neue Purchase-Invoice-Kontext wurde nicht stabil erreicht; deshalb wurden keine Zielwerte eingetragen.

## Guard-Wirkung

- Der Lauf prueft nach jedem Kopf-/Zeilenschritt, ob der Kontext noch Purchase Invoice plus Zeilen/Grid ist.
- Vendor-Registrierungsdialog, Vendor Card oder `FA-CNC-01` ohne Zeilentyp `Fixed Asset` stoppen den Lauf.
- Ein sichtbarer Code allein zaehlt nicht; der richtige fachliche Kontext zaehlt.

## Buchwirkung

Kapitel 21 und das Debugging-Kapitel bekommen einen besseren Lernfall: Der Guard verhindert, dass falsche Vendor-/Dialogkontexte als Anlagenzeile gelesen werden.

## Grenzen

- Keine Preview, keine Buchung, kein Anlagenzugang, keine AfA, keine Anlagenposten.
- Kein deutscher HGB-/Kontenplan-/USt-Finalnachweis.

## Naechster Schritt

FIXEDASSETS-059-PURCHASE-INVOICE-FIELD-MAPPING-HELPER-REFINEMENT-OR-MANUAL-PATH
