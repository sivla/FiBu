# FIXEDASSETS-205 HGB G/L Integration Review

Status: `labor`, `local-review`, `judge_work`, `no-business-central`, `no-playwright`, `no-preview`, `no-posting`, `no-setup-change`, `not-final`.

| Feld | Wert |
|---|---|
| Case | FIXEDASSETS-205-HGB-GL-INTEGRATION-REVIEW |
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Quelle | FA-202, FA-203, FA-204, Microsoft Learn |
| Entscheidung | weiterer Read-only-Nachweis ueber Page Inspection |

## Befund

FA-202 hat gezeigt: Der alte Blocker `FA Posting Type` leer ist geloest. Der neue BC-Fehler lautet sinngemaess, dass `FA Posting Type Acquisition Cost` im FA Journal gebucht werden muss.

FA-203 hat diesen Fehler gegen Microsoft Learn eingeordnet: Ob Fixed Asset G/L Journal oder Fixed Asset Journal fuer eine Aktivitaet genutzt wird, haengt am AfA-Buch und seiner G/L Integration.

FA-204 hat `HGB` und den Bereich `G/L Integration` auf der Depreciation Book Card sichtbar gemacht. Sichtbar waren auch Feldbeschriftungen wie `G/L Integration - Acq. Cost`. Der konkrete Wert der Checkbox wurde aber nicht eindeutig als an/aus bewiesen.

## Entscheidung

Kein Setup-Fit und kein Posting. Die Evidence reicht noch nicht, um `G/L Integration - Acq. Cost` gezielt zu setzen oder die Route abschliessend zu wechseln.

Der naechste sichere Schritt ist `FIXEDASSETS-206-HGB-PAGEINSPECTION-READONLY`: Page Inspection auf der HGB Depreciation Book Card oeffnen und die Tabellenfelder/Werte fuer G/L Integration read-only sichern.

## Warum Page Inspection

Microsoft Learn beschreibt Page Inspection als Werkzeug, das Seiten-, Tabellen- und Feldinformationen zur aktuellen Page zeigt, einschliesslich Source Table, Table Fields und Werte. Microsoft Learn beschreibt ausserdem, dass auf dem Integration-FastTab des AfA-Buchs festgelegt wird, welche fixed-asset activities ueber das Fixed Asset G/L Journal gebucht werden.

Damit passt Page Inspection fachlich genau zum offenen Punkt: Nicht noch einmal Preview Posting versuchen, sondern zuerst den technischen Feldwert beweisen.

## Nicht tun

- Kein Toggle von `G/L Integration - Acq. Cost`.
- Kein Setup Change.
- Kein Preview Posting.
- Kein Post.
- Kein FA Journal oder FA G/L Journal anlegen/aendern.
- Keine deutsche HGB-/Steuer-/Kontenplan-Finalbehauptung.

## Anfaenger-Lernwert

Ein Anfaenger sieht hier den Unterschied zwischen drei Ebenen:

1. Bedienoberflaeche: Die Karte zeigt Feldbeschriftungen und FastTabs.
2. Einrichtung: Das AfA-Buch entscheidet, welche Anlagenaktivitaeten in die Finanzbuchhaltung integriert werden.
3. Technischer Nachweis: Wenn der sichtbare Wert nicht eindeutig ist, hilft Page Inspection, die Tabelle und Felder der aktuellen Page zu pruefen.

## Naechster Schritt

`FIXEDASSETS-206-HGB-PAGEINSPECTION-READONLY`: HGB Depreciation Book Card read-only oeffnen, Page Inspection starten, Felder/Werte zu G/L Integration sichern, keine Werte aendern.
