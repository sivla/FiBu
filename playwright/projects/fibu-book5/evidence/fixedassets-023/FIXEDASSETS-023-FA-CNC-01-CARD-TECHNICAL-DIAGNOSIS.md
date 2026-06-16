# FIXEDASSETS-023 - FA-CNC-01 Card Technical Diagnosis

Status: labor-technical-diagnosis-save-gate-blocked-no-save

## Zweck

Dieser Lauf klaert no-save, warum die Feldpfade der leeren Anlagenkarte zwar sichtbar sind, aber noch nicht sicher als Werte-/Lookup-Klickpfad fuer `FA-CNC-01` genutzt werden duerfen.

## Kontext

- Instanz: `MCP_1_20260210`
- Company: `RM-DEMO`
- Zielanlage: `FA-CNC-01`
- Zielwerte spaeter: `CNC Maschine FRA`, `HGB`, `MACHINES`
- Modus: technische Diagnose, keine Speicherung, kein Setup, keine Buchung

## Feld-/Control-Diagnose

| Feldcaption | im Seitentext sichtbar | Diagnose | nahe Controls | nahe Buttons |
|---|---:|---|---|---|
| No. | nein | caption-only | - | BUTTON; BUTTON; BUTTON |
| Description | ja | caption-only | - | BUTTON; BUTTON; BUTTON |
| FA Class Code | ja | caption-only | - | BUTTON; BUTTON; BUTTON |
| FA Subclass Code | ja | caption-only | - | BUTTON; BUTTON; BUTTON |
| Depreciation Book Code | ja | caption-and-control-nearby | INPUT; INPUT; INPUT | Depreciation Book Code; Book Value; Details ffnen fr "Book Value" "0,00" (Whrung angezeigt in USD) |
| Posting Group | ja | caption-and-control-nearby | INPUT; INPUT; INPUT | Posting Group; Depreciation Table Code; Whlen Sie einen Wert fr Posting Group |
| Depreciation Method | ja | caption-and-control-nearby | Straight-Line; INPUT; Geben Sie das Datum im Format dd.MM.yyyy ein | Depreciation Method; Use Half-Year Convention; Whlen Sie einen Wert fr Posting Group |
| Depreciation Starting Date | ja | caption-and-control-nearby | Geben Sie das Datum im Format dd.MM.yyyy ein; Straight-Line; 0,00 | Depreciation Starting Date; Datumsauswahl fr Depreciation Starting Date ffnen; Depreciation Method |
| Depreciation Ending Date | ja | caption-and-control-nearby | Geben Sie das Datum im Format dd.MM.yyyy ein; 0,00 | Depreciation Ending Date; Datumsauswahl fr Depreciation Ending Date ffnen; No. of Depreciation Years |
| Book Value | ja | caption-and-control-nearby | INPUT | Book Value; Details ffnen fr "Book Value" "0,00" (Whrung angezeigt in USD); Depreciation Table Code |

## Page Inspection

- Shortcut: `Control+Alt+F1`
- Geoeffnet: ja
- Grenze: Page Inspection is debug context only and does not prove card values.

## Technischer Befund

Page Inspection confirms the foreground page as Fixed Asset Card (5600, Document) with source table Fixed Asset (5600). The visual card shows FA Class Code, FA Subclass Code, Depreciation Book Code and Posting Group controls, but the DOM diagnosis can still pick background Fixed Assets list headers if locators are not scoped to the foreground card/pane. The next helper must scope to the active card surface and prefer the visible card label/control row over background list headers.

## Entscheidung

- `FA-CNC-01` wurde nicht gespeichert: ja
- Save-Gate moeglich: nein

Die Diagnose liefert technischen Kontext, aber noch keine fachliche Speicherfreigabe. Fuer ein Buchbild reicht weiterhin nicht, dass ein Feldname irgendwo sichtbar ist; der relevante Code muss im richtigen Karten- oder Lookup-Kontext sichtbar sein.

## Naechster Schritt

FIXEDASSETS-024: use manual Page Inspection/Personalize or a more specific card-control helper before saving FA-CNC-01.