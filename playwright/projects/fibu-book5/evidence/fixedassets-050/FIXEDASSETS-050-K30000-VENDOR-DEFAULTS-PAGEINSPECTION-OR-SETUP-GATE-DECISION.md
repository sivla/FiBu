# FIXEDASSETS-050 K30000 Vendor Defaults Page Inspection Or Setup Gate Decision

## Entscheidung

Status: `done-decision-no-bc`

Nach `FIXEDASSETS-049` wird kein Kaufbeleg-Preflight, kein Kreditor-Default-Fit und kein Setup-Fit freigegeben.

Der naechste erlaubte praktische Schritt ist:

`FIXEDASSETS-051-K30000-VENDOR-PAGEINSPECTION-READONLY`

## Ausgangslage

- Instanz: `MCP_1_20260210`
- Company: `RM-DEMO`
- Datenbasis: CRONUS USA
- Kreditor: `K30000` / `Zollspedition Nord GmbH`
- Sichtbar belegt: `K30000`, Name, `Tax Area Code`, `Tax Liable`, `Payment Terms Code = 1M(8D)`, `Payment Method Code = BANK`
- Nicht sichtbar belegt: `Vendor Posting Group`, `Gen. Bus. Posting Group`, `Currency Code`, `VAT Bus. Posting Group`
- `FIXEDASSETS-049` beweist nur: Personalisieren-Modus ist erreichbar, aber Feldliste und kritische Captions sind nicht sichtbar.

## Warum kein Setup-Fit

Ein Setup-/Default-Fit waere jetzt geraten. Es ist noch nicht klar, ob die kritischen Felder:

- auf der `Vendor Card` vorhanden, aber ausgeblendet sind,
- durch Rolle/Profil/Personalisierung nicht sichtbar sind,
- in einem anderen FastTab/FactBox-/Page-Kontext liegen,
- technisch in der Source Table vorhanden sind, aber auf der Page nicht verfuegbar sind,
- oder fachlich leer/falsch eingerichtet sind.

Solange diese Unterscheidung offen ist, waere eine Aenderung an `K30000` oder an Posting-/VAT-/Currency-Setup kein sauberer Buch- oder Evidence-Schritt.

## Erlaubter naechster Schritt

`FIXEDASSETS-051` darf read-only:

1. `K30000` auf `Vendor Card` Page `26` in `RM-DEMO` oeffnen.
2. Breite Layoutansicht nutzen und FactBox nur ausblenden, wenn sie die Felder verdeckt.
3. Page Inspection / Seitenpruefung oeffnen:
   - zuerst `Ctrl+Alt+F1`,
   - falls abgefangen: Help & Support / `Inspect pages and data` oder BC-Suche.
4. Page Name, Page ID, Source Table und relevante Feldwerte sichern.
5. Speziell pruefen:
   - `Vendor Posting Group`
   - `Gen. Bus. Posting Group`
   - `Currency Code`
   - `VAT Bus. Posting Group`
   - `Tax Area Code`
   - `Tax Liable`
   - `Payment Terms Code`
   - `Payment Method Code`
6. Nur Screenshots behalten, die den behaupteten technischen oder sichtbaren Zustand wirklich zeigen.

## Verboten

- keine Einkaufsrechnung
- kein Anlagenzugang
- keine AfA
- keine Buchung
- keine Kreditor-Aenderung
- kein Setup-Fit
- keine gespeicherte Personalisierung
- kein API-Shortcut
- kein Company-Wechsel
- keine deutsche Finalbehauptung

## Buchwirkung

Kapitel 21 bleibt vor Anlagen-Einkauf und Zugang gesperrt.

Das Debugging-/Nachweiskapitel gewinnt eine klare Regel: Wenn ein Feld in der Anwendersicht und im Personalisieren-Modus nicht sichtbar wird, ist Page Inspection der naechste saubere technische Diagnosepfad. Sie ersetzt keine normale Buchabbildung, hilft aber zu klaeren, ob Buchtext, Page-Sichtbarkeit, Rolle/Profil oder Setup das Problem ist.

## Naechster Schritt

`FIXEDASSETS-051-K30000-VENDOR-PAGEINSPECTION-READONLY`

