# TARGET-027B - VAT Posting Setup Write Gate Decision

Status: `observed-decision-no-write`

Instanz: `playthru`

Company: `UNIVERSAARL-DE`

## Zweck

Dieser Lauf entscheidet die kleinste source-backed Zielstruktur fuer die Universaarl-USt-Einrichtung, ohne Business Central zu veraendern.

## Verwendete Evidence

- `TARGET-020-VAT-SETUP-READINESS`: Page 470, 471 und 472 wurden read-only sichtbar.
- `TARGET-027R-VAT-PAGE-ROUTE-RECOVERY`: Page 471 und 472 wurden erneut sichtbar read-only belegt.
- `TARGET-027S-VAT-PAGE-ROUTE-SOURCE-AND-UI-FOLLOWUP`: Die neue Page-470-Suchfallbackroute wurde als unbrauchbar markiert; Page 470 gilt nur ueber die TARGET-020-Direktroute als Kontext.
- `TARGET-026K`, `TARGET-026L`, `TARGET-026M-SAFE-WRITE`: `1406`, `3806`, `4400` und `5400` sind sichtbare Starterkonten; kein VAT Posting Setup ist bewiesen.

## Quellenentscheidung

Microsoft Learn beschreibt die drei Bausteine:

- VAT Business Posting Groups beschreiben den Markt bzw. die Geschaeftspartnergruppe.
- VAT Product Posting Groups beschreiben den Artikel-/Ressourcen-/Leistungstyp.
- VAT Posting Setup verbindet beide Gruppen mit VAT %, Calculation Type und Sachkonten.

Fuer die erste Universaarl-Inlandsstrecke ist deshalb nur eine enge Startkombination entscheidungsbereit:

| Element | Zielwert | Zweck | Status |
| --- | --- | --- | --- |
| VAT Business Posting Group | `INLAND` | Inland Deutschland | `decision-ready-not-written` |
| VAT Product Posting Group | `VAT19` | normal besteuerte Waren/Leistungen mit 19 Prozent | `decision-ready-not-written` |
| VAT Posting Setup | `INLAND` + `VAT19` | Standard-Inlandskombination fuer spaetere O2C/P2P-Previews | `planned-after-groups-write` |
| VAT % | `19` | deutscher Regelsteuersatz nach UStG § 12 | `source-backed-not-bc-proven` |
| VAT Calculation Type | `Normal VAT` / normale MwSt. | Standardberechnung fuer Inland | `source-backed-not-written` |
| Sales VAT Account | `3806` | Umsatzsteuer 19 Prozent | `account-visible-not-setup-proven` |
| Purchase VAT Account | `1406` | Abziehbare Vorsteuer 19 Prozent | `account-visible-not-setup-proven` |

## Smart Decision

Der naechste wirksame Schritt darf noch nicht die komplette MwSt.-Buchungsmatrix schreiben. Zuerst werden die beiden Gruppen `INLAND` und `VAT19` kontrolliert angelegt oder bestaetigt. Erst danach ist eine Matrixzeile `INLAND` + `VAT19` sinnvoll.

## Nicht gemacht

- Kein Business-Central-Write.
- Kein Playwright-Live-Test.
- Keine MwSt.-Buchungsmatrix-Zeile angelegt.
- Keine Posting Groups geaendert.
- Keine Stammdaten erzeugt.
- Kein Beleg/Draft.
- Keine Preview.
- Keine Buchung.
- Kein API-Shortcut.

## Naechster Case

`TARGET-027C-VAT-GROUPS-CONTROLLED-WRITE`

Der Case darf nur die Gruppen `INLAND` und `VAT19` schreiben oder sichtbar bestaetigen. Er darf noch keine VAT Posting Setup Matrixzeile, keine Stammdaten, keine Belege, keine Preview und keine Buchung ausfuehren.
