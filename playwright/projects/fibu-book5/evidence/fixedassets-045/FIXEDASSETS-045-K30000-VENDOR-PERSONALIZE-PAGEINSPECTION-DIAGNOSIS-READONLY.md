# FIXEDASSETS-045 - K30000 Vendor Personalize/Page Inspection Diagnosis read-only

Status: `labor`, `read-only`, `ui-first`, `diagnosis`, `no-posting`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Zielkreditor | K30000 / Zollspedition Nord GmbH |
| Status | done-labor-readonly-diagnosis-critical-defaults-still-not-visibly-proven |
| Gebucht | nein |
| Einkaufsrechnung erzeugt | nein |
| Setup/Kreditor geaendert | nein |

## Ergebnis

Die K30000-Kreditorenkarte wurde read-only diagnostiziert. Weiter nicht sichtbar belegt: Vendor Posting Group, Gen. Bus. Posting Group, Currency Code, VAT Bus. Posting Group. Personalisieren ist als Diagnoseeinstieg sichtbar; Page Inspection wurde per Shortcut versucht, aber nicht stabil geoeffnet. Daraus folgt keine stille Setup-Aenderung und keine Kaufbelegfreigabe.

## Feldsichtbarkeit in normaler UI

| Feld | Sichtbarkeit | Wert / Diagnose |
|---|---|---|
| Vendor Posting Group | nicht sichtbar | caption-not-visible |
| Gen. Bus. Posting Group | nicht sichtbar | caption-not-visible |
| Currency Code | nicht sichtbar | caption-not-visible |
| VAT Bus. Posting Group | nicht sichtbar | caption-not-visible |
| Tax Area Code | sichtbar | `Tax Area Code`, `(Leer)`, `Withholding Tax Liable` |
| Tax Liable | sichtbar | `Tax Liable` |
| Payment Terms Code | sichtbar | label-only |
| Payment Method Code | sichtbar | label-only |

## Personalisieren

- Einstieg ueber Einstellungen sichtbar: ja
- Grenze: Personalize entry is visible, but the run did not enter or save personalization; it does not prove hidden field availability.

## Page Inspection

- Shortcut: `Control+Alt+F1`
- Geoeffnet: nein
- Grenze: Shortcut was not reliably available in this Playwright/browser context; use Help & Support / Inspect pages and data manually if needed.

## Buchwirkung

Kapitel 21 soll Anfaengern erklaeren: Wenn kaufrelevante Defaults auf der Kreditorenkarte fehlen, zuerst UI-Sichtbarkeit und technischen Page-/Tabellenkontext klaeren. Personalisieren hilft bei ausgeblendeten UI-Elementen, Page Inspection bei Page/Table/Feldkontext; beides ersetzt keinen Screenshot, auf dem der konkrete Code wirklich sichtbar ist.

## Grenzen

- Read-only: keine Kreditoren-, Setup- oder Belegaenderung.
- Keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.
- Keine API-Abkuerzung; der Befund basiert auf sichtbarer BC-UI.
- Nicht als deutscher USt-, Kontenplan- oder HGB-Finalnachweis verwenden.
- Personalisieren/Page Inspection erklaeren die Diagnosewerkzeuge, ersetzen aber keinen sichtbaren Buchbild-Nachweis fuer konkrete Codes.

## Naechster Schritt

FIXEDASSETS-046-K30000-VENDOR-DEFAULTS-GATE-DECISION: auf Basis von 045 entscheiden, ob ein enger UI-first Setup-/Default-Fit fuer die fehlenden Kreditorenfelder no-posting erlaubt ist oder ob erst ein manueller Personalisieren-Schritt die Felder sichtbar machen muss.
