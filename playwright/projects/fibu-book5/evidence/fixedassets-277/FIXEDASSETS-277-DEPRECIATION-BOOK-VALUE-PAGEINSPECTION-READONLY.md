# FIXEDASSETS-277 AfA-Buchwerte und Page Inspection

Status: `labor`, `read-only`, `page-inspection`, `value-diagnosis`, `no-ok`, `no-preview`, `no-posting`, `not-final`.

## Ergebnis

- Instanz: `MCP_1_20260210`
- Company: `RM-DEMO`
- Anlage: `FA-CNC-01`
- AfA-Buch: `HGB`
- Klassifikation: `field-values-still-not-fieldsecure-and-journal-line-missing`
- Page Inspection: geoeffnet

## Feldwerte

- Depreciation Starting Date: `nicht field-secure bewiesen`
- No. of Depreciation Years: `nicht field-secure bewiesen`
- Depreciation Ending Date: `nicht field-secure bewiesen`
- Last Depreciation Date: `nicht field-secure bewiesen`
- Book Value 120.000 sichtbar: ja

## Hypothesen

- FA-CNC-01 still has acquisition basis and book value context; the missing FADEP journal line is not explained by missing acquisition evidence.
- Visible UI/Page-Inspection text still does not prove enough depreciation-book field values to safely repeat Calculate Depreciation OK.
- FADEP-273-OK is still not visible in the Fixed Asset G/L Journal context.

## Anfaenger-Lernwert

- Wenn `Calculate Depreciation` keine sichtbare Zeile erzeugt, muss man zuerst die AfA-Buchwerte und das Ziel-Journal pruefen.
- `Book Value` zeigt den vorhandenen Restwert, beweist aber allein noch nicht, dass eine AfA-Zeile faellig und im richtigen Batch sichtbar ist.
- Page Inspection hilft bei der technischen Nachweisfuehrung, ersetzt aber keine Buchungsvorschau und keine Postenspur.

## Grenzen

- Kein `OK` auf `Calculate Depreciation`.
- Kein Preview Posting.
- Keine Buchung.
- Kein Setup Change.
- Kein deutscher Finalnachweis.

## Naechster Schritt

FIXEDASSETS-278: local review of FA-277 value/Page-Inspection evidence before any repeat Calculate Depreciation OK, Preview Posting or Post.
