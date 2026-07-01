# TARGET-036D2F-U-VEND-MANUAL-NOS-ROUTE-RECOVERY

Status: blocked
Instanz: playthru
Company: UNIVERSAARL-DE

## Zweck

Dieser Lauf prueft eine neue, engere Bedienroute fuer die Nummernserie `U-VEND`: Die Seite `Nummernserie` wird direkt auf `U-VEND` gefiltert, bevor `Liste bearbeiten` und die Checkbox `Manuelle Anz.` bewertet werden.

## Ergebnis

- Blockiert: No unique filtered U-VEND Manual Nos checkbox was available after Edit List: u-vend-row-count-0-cell-count-0-fallback-candidates-0.; U-VEND Manual Nos is not proven active after reopen: u-vend-row-count-0-cell-count-0-fallback-candidates-0.

## Nicht gemacht

- kein Kreditor, Debitor oder Artikel
- kein Beleg oder Draft
- keine Buchungsvorschau
- keine Buchung
- kein API Shortcut
- keine andere Nummernserie

## Buchwirkung

Die Kreditorenanlage bleibt gesperrt, bis eine source-backed oder assistierte Route fuer `Manuelle Anz.` vorliegt.
