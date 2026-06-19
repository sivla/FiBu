# FIXEDASSETS-065 - Purchase-Invoice-Line-Type Helper Diagnosis

Status: `labor`, `local-static-analysis`, `helper-diagnosis`, `no-bc-run`, `no-playwright-run`, `no-preview`, `no-posting`, `not-final`

## Ziel

Der Lauf wiederholt `FIXEDASSETS-064` nicht. Er wertet vorhandene Evidence aus, damit der naechste Helper-/Guard-Schritt sicherer wird.

## Befund

- `FIXEDASSETS-064` erreichte einen Purchase-Invoice- und Lines-Kontext.
- Die sichtbare Zeile blieb aber `Type = Item`.
- Der Versuch, `Fixed Asset` in dieser Situation zu tippen, fuehrte in einen Vendor-Registrierungsdialog.
- `FA-CNC-01` wurde nicht eingegeben und nicht sichtbar.
- Der versehentlich erzeugte Entwurf `107209` wurde im separaten Cleanup ueber die UI geloescht.

## Guard-Entscheidung

`Type = Item` plus Vendor-Registrierungsdialog ist ein harter Stop.

Der lokale Helper wurde dafuer erweitert:

- `classifyPurchaseInvoiceLineTypeVisibility()` bewertet strukturierte Zeilentyp-Evidence.
- Nach `Neu` aus `FIXEDASSETS-064` lautet der Status `blocked-item-line-type-visible`.
- Nach dem fehlerhaften Eingabeversuch lautet der Status `blocked-vendor-registration-dialog`.
- Ein Dialogtext mit `Fixed Asset` zaehlt nicht als sichtbarer Zeilentyp `Fixed Asset`.

Der naechste UI-Lauf darf keine Zielwerte wie `K30000` oder `FA-CNC-01` eingeben, bevor der Test sichtbar belegt:

- Purchase Invoice Card ist stabil.
- Lines/Grid-Kontext ist stabil.
- Die Zielzeile zeigt wirklich `Type = Fixed Asset`.
- Kein Vendor-Registrierungsdialog ist sichtbar.

## Buchwirkung

Das ist ein Debugging-/Lernfall fuer Kapitel 21 und das technische Nachweiskapitel. Ein sichtbarer Begriff `Fixed Asset` in einem Dialog ist kein Anlagenzeilenbeweis. Fuer eine Klickanleitung muss der Zeilentyp selbst sichtbar in der Belegzeile stehen.

## Grenzen

- Kein neuer BC-Lauf.
- Kein neuer Playwright-Browser-Lauf.
- Keine Preview.
- Keine Buchung.
- Kein Anlagenzugang.
- Keine AfA.
- Kein deutscher Finalnachweis.

## Naechster Schritt

Den naechsten no-target UI-Probe so vorbereiten, dass er `classifyPurchaseInvoiceLineTypeVisibility()` nutzt und bei `Item`-Zeile oder Vendor-Registrierungsdialog sofort stoppt. `K30000` und `FA-CNC-01` bleiben weiter gesperrt.
