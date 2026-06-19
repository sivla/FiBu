# FIXEDASSETS-075 - Line Type Capability Decision

Status: `labor`, `decision`, `ui-first`, `no-bc-run`, `no-playwright-run`, `not-final`.

## Entscheidung

Der naechste sinnvolle Weg ist `FIXEDASSETS-076-GUARDED-DIRECT-LINE-TYPE-VALUE-ENTRY`.

Grund: FA-072 und FA-073 haben gezeigt, dass Dropdown-/Pointer-/Keyboard-Routen auf der `Type`-Zelle `Fixed Asset` nicht sichtbar machen. FA-074 hat aber per Page Inspection den `Type`-Hilfetext sichtbar gemacht: fixed asset wird dort als moegliche Einkaufsart genannt. Microsoft Learn bestaetigt zusaetzlich, dass Anlagenzugang ueber Einkaufsbelege bzw. Einkaufsrechnungen fachlich vorgesehen ist.

## Was bewiesen ist

- `MCP_1_20260210` / `RM-DEMO` ist der Laborrahmen.
- Die bisherigen Type-Zell-Dropdown-Routen sind kein guter Hebel mehr.
- Page Inspection zeigt im aktuellen Lauf `Purchase Invoice` / `Purchase Header`, nicht `Purchase Line`.
- Der Hilfetext zum Feld `Type` nennt fixed asset als moegliche Art.
- `K30000` und `FA-CNC-01` bleiben gesperrt.

## Was nicht bewiesen ist

- `Type = Fixed Asset` ist noch nicht sichtbar ausgewaehlt.
- Die Source Table `Purchase Line` ist im Playwright-Page-Inspection-Lauf nicht belegt.
- Es gibt keinen Preview-/Posting-/Setup-/DE-Finalnachweis.

## Naechster Lauf

`FIXEDASSETS-076` darf genau eine neue Route testen: in einem temporaeren Einkaufsrechnungs-Draft nur die Zeilenart `Fixed Asset` direkt in die `Type`-Zelle eingeben, sichtbar pruefen und den Draft bereinigen.

Nicht erlaubt:

- `K30000`
- `FA-CNC-01`
- Preview Posting
- Posting
- Setup Change
- API Shortcut

## Quellen

- Microsoft Learn: Acquire fixed assets - Business Central: https://learn.microsoft.com/en-us/dynamics365/business-central/fa-how-acquire
- Microsoft Learn Training: Purchase fixed assets in Dynamics 365 Business Central: https://learn.microsoft.com/en-us/training/modules/purchase-fixed-assets/
- Microsoft Learn Release Plan: Create multiple fixed asset cards: https://learn.microsoft.com/en-us/dynamics365/release-plan/2025wave2/smb/dynamics365-business-central/create-multiple-fixed-asset-cards
