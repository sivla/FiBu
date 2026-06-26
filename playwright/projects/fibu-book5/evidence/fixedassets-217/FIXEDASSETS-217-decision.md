# FIXEDASSETS-217 - Review FA Ledger Entry Preview Detail

Status: `labor-review`, `local-only`, `no-bc-run`, `no-playwright-run`, `no-posting`

## Entscheidung

FA-216 wird als gueltiger Preview-Detail-Nachweis akzeptiert: Der Lauf blieb in `MCP_1_20260210 / RM-DEMO`, oeffnete nur `Preview Posting`, klickte nur den zuvor bewiesenen `FA Ledger Entry`-Link und zeigte im Detailkontext `FA-CNC-01`, `HGB`, `Acquisition Cost` sowie ein Betragssignal.

Das reicht aber nicht fuer eine Buchungsfreigabe. Die sichtbare Journal-/Preview-Evidence zeigt `Amount = 0,00`. Fuer einen Anlagenzugang waere eine Nullbetragsbuchung fachlich wertlos und fuer das Buch irrefuehrend.

## Was ist bewiesen?

- Der Preview-Pfad ueber das exakte `Preview Posting`-Menuitem funktioniert.
- Der `FA Ledger Entry`-Eintrag ist ein sicherer, read-only oeffenbarer Detailpfad.
- Die Preview-Detailansicht zeigt den Anlagenkontext `FA-CNC-01 / HGB / Acquisition Cost`.
- Es wurde nicht gebucht, kein Setup geaendert, keine Journalzeile editiert und kein `OK`/`Yes` bestaetigt.

## Was ist nicht bewiesen?

- Kein echter Anlagenposten ist gebucht.
- Kein Sachposten ist gebucht.
- Kein G/L-Entry-Detailpfad ist bewiesen.
- Kein deutscher Finalnachweis besteht.
- Der Zielbetrag `120.000 EUR` aus den Testdaten ist in der aktuellen Journalzeile nicht sichtbar; sichtbar ist `0,00` mit CRONUS-USA-Laborwaehrungssignal.

## Naechster Schritt

`FIXEDASSETS-218-FA-GL-JOURNAL-AMOUNT-VALUE-PREFLIGHT`

Der naechste Case darf genau pruefen und, falls die Zielzeile eindeutig ist, den Amount-Wert fuer die bestehende FA-G/L-Journalzeile kontrolliert setzen und nachweisen. Keine Preview, kein Post, keine Setup-Aenderung.
