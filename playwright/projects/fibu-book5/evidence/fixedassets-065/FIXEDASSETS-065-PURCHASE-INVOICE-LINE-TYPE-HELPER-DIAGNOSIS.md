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

Der naechste UI-Lauf darf keine Zielwerte wie `K30000` oder `FA-CNC-01` eingeben, bevor der Test sichtbar belegt:

- Purchase Invoice Card ist stabil.
- Lines/Grid-Kontext ist stabil.
- Die Zielzeile zeigt wirklich `Type = Fixed Asset`.
- Kein Vendor-Registrierungsdialog ist sichtbar.

## Buchwirkung

Das ist ein Debugging-/Lernfall fuer Kapitel 21 und das technische Nachweiskapitel. Ein sichtbarer Begriff `Fixed Asset` in einem Dialog ist kein Anlagenzeilenbeweis. Fuer eine Klickanleitung muss der Zeilentyp selbst sichtbar in der Belegzeile stehen.

## Grenzen

- Kein neuer BC-Lauf.
- Kein neuer Playwright-Lauf.
- Keine Preview.
- Keine Buchung.
- Kein Anlagenzugang.
- Keine AfA.
- Kein deutscher Finalnachweis.

## Naechster Schritt

Den Purchase-Invoice-Line-Type-Guard lokal verfeinern: `Item`-Zeile plus Vendor-Registrierungsdialog muss als harter Blocker erkannt werden, bevor ein weiterer no-target UI-Probe gestartet wird.

