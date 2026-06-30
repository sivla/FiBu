# TARGET-016H Number Series Source / Assisted Setup Decision

Instanz: playthru
Company: UNIVERSAARL-DE

## Ergebnis

TARGET-016H ist ein Quellen- und Routenentscheid. Es wurde kein Business-Central-UI-Schreibversuch ausgefuehrt.

Microsoft Learn beschreibt den Standardpfad fuer Nummernserien: Nummernserie anlegen oder oeffnen, danach `Lines` / `Zeilen` verwenden und dort `Starting Date`, `Starting No.` und `Ending No.` pflegen. `Manual Nos.` und `Allow Gaps in Nos.` sind eigene fachliche Einstellungen und duerfen nicht nebenbei geaendert werden.

## Entscheidung

Der naechste praktische Schritt ist nicht ein weiterer Personalize-, F2-, Header- oder Selected-Cell-Versuch. Der naechste Schritt ist ein kontrollierter Write-Gate fuer genau den offiziellen Lines-Pfad:

1. `U-CUST` waehlen.
2. `Zeilen` oeffnen.
3. `Neu` in den Nr.-Serienzeilen nutzen.
4. `Startdatum`, `Startnr.` und `Endnr.` in dieser Reihenfolge setzen.
5. Reopen-Proof erzeugen.

## Grenze

- Keine BC-Ausfuehrung in diesem Quellenlauf.
- Keine Setup-Aenderung.
- Keine Setup-Zuweisung.
- Keine Stammdaten.
- Keine Preview und keine Buchung.
- Keine Checkbox wurde geaendert.
