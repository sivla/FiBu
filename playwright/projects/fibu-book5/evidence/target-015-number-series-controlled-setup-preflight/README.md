# TARGET-015 Number Series Controlled Setup Preflight

Status: `observed`, `read-only`, `german-final-candidate`, `before-state`

## Zweck

TARGET-015 prueft den Zustand vor einer moeglichen Nummernserien-Einrichtung in `playthru / UNIVERSAARL-DE`.

Es wurde nichts angelegt, nichts bearbeitet und nichts gebucht. Der Lauf oeffnet nur die relevanten Seiten, schreibt Text-/Screenshot-Evidence und entscheidet, ob ein separater Schreib-Gate vorbereitet werden kann.

## Beobachtet

- Die Seite `Nummernserie` zeigt aktuell nur `BANKEINZ`, `CT-MSG` und `VATNOTIF`.
- Keine der geplanten Universaarl-Serien `U-CUST`, `U-VEND`, `U-ITEM`, `U-SO`, `U-SINV`, `U-PO`, `U-PINV` war sichtbar.
- `Einrichtung Debitoren und Verkauf` wurde read-only geoeffnet. Der FastTab `Nummernserie` ist sichtbar, aber im Screenshot nicht aufgeklappt.
- `Kreditoren & Einkauf Einr.` wurde read-only geoeffnet. Nummernserienfelder fuer Kreditoren, Rechnungen, gebuchte Rechnungen, Gutschriften und Lieferanmahnungen sind sichtbar.
- `Lager Einrichtung` wurde read-only geoeffnet. Der FastTab `Nummerierung` ist sichtbar, aber im Screenshot nicht aufgeklappt.

## Nicht bewiesen

- Es wurde keine Nummernserie erstellt.
- Es wurde keine Nummernserie zugewiesen.
- Die Verkaufs- und Lager-Nummerierungsfelder sind noch nicht vollstaendig sichtbar dokumentiert.
- Es gibt keinen Master-Data-, Preview-, Posting- oder Ledger-Nachweis.
- Aus diesem Lauf entsteht kein deutscher Rechts-/Compliance-Claim zur Rechnungsnummerierung.

## Screenshot-QA

| Screenshot | Zweck | Qualitaet |
|---|---|---|
| `target-015-010-number-series.png` | Vorherzustand der Nummernserienliste | brauchbar; Codes und Spalten sind lesbar |
| `target-015-020-sales-receivables-setup.png` | Verkaufs-/Debitoren-Setup-Kontext | brauchbar fuer Page/FastTab-Kontext; nicht genug fuer konkrete Feldzuweisung |
| `target-015-030-purchases-payables-setup.png` | Einkaufs-/Kreditoren-Setup mit sichtbaren Nummernserienfeldern | brauchbar fuer Feldkontext |
| `target-015-040-inventory-setup.png` | Lager-Setup-Kontext | brauchbar fuer Page/FastTab-Kontext; nicht genug fuer konkrete Artikelnr.-Zuweisung |

## Naechster Schritt

Der naechste Case darf nicht pauschal alle Zuweisungen schreiben.

Sinnvoll ist ein enger `TARGET-016-NUMBER-SERIES-CONTROLLED-SETUP-WRITE-GATE`:

1. zuerst nur die fehlenden `U-*` Nummernserien in der Nummernserienliste kontrolliert anlegen,
2. vor und nach jeder Schreibaktion Screenshots erzeugen,
3. keine Masterdaten anlegen,
4. keine Belege erzeugen,
5. Verkaufs-/Lager-Zuweisungen erst nach separater FastTab-/Feld-Sichtbarkeitspruefung vornehmen.
