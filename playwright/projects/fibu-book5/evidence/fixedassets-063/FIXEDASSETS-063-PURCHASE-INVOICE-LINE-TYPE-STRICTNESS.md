# FIXEDASSETS-063 - Purchase Invoice Line Type Strictness

Status: `labor`, `no-bc-run`, `helper-strictness`, `no-preview`, `no-posting`, `not-final`

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Quell-Evidence | playwright/projects/fibu-book5/evidence/fixedassets-062/FIXEDASSETS-062-result.json, playwright/projects/fibu-book5/evidence/fixedassets-062/090-cleanup-result.json, playwright/projects/fibu-book5/evidence/fixedassets-062/094-accidental-purchase-invoice-107223-cleanup-result.json, playwright/projects/fibu-book5/evidence/fixedassets-062/097-accidental-vendor-V00060-cleanup-result.json |
| Ergebnis | strictness-gate-defined |
| Naechster Schritt | FIXEDASSETS-064-PURCHASE-INVOICE-LINE-TYPE-UI-PROBE-NO-TARGET |

## Entscheidung

`FIXEDASSETS-062` ist ein gueltiger Rejected-Path-/Lernfall, aber kein gueltiger Anlagen-Einkaufsrechnungs-Preflight. Der naechste praktische Lauf muss zuerst das Zeilentyp-Problem isolieren, bevor die Zielanlagennummer eingegeben wird.

## Strikte Regel fuer den naechsten UI-Lauf

- `FA-CNC-01` darf erst eingegeben oder ausgewaehlt werden, wenn dieselbe sichtbare Einkaufsrechnungszeile `Type = Fixed Asset` zeigt.
- Ein Klick auf den Default-Zeilentyp `Item` ist kein Nachweis, dass der Zeilentyp gewechselt wurde.
- `Vendor Card`, Vendor-Registrierungsdialog, verlorener Purchase-Invoice-Kontext oder fehlender Zeilentyp sind harte Stop-Kriterien.
- Ein Screenshot ist nur als Buchkandidat brauchbar, wenn Kopfwerte und Anlagenzeile gemeinsam sichtbar sind.

## Buchwirkung

Kapitel 21 und das Debugging-/Screenshot-QA-Kapitel muessen erklaeren: Bei Anlagen-Einkaufsrechnungen ist der Zeilentyp der fachliche Schalter. Ein Code im falschen Lookup-Kontext ist kein Beweis.

## Beweist nicht

- keinen neuen Business-Central-UI-Zustand
- keine valide Einkaufsrechnungszeile fuer `FA-CNC-01`
- kein Preview Posting
- keinen Anlagenzugang
- keine AfA
- keinen deutschen Finalnachweis
