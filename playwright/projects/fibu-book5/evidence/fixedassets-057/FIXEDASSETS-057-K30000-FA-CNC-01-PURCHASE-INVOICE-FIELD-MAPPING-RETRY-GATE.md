# FIXEDASSETS-057 K30000 / FA-CNC-01 Purchase-Invoice-Retry-Gate

Status: `decision`, `no-bc-run`, `no-posting`, `not-final`, `de-final-open`

## Entscheidung

Ein neuer enger UI-first Retry ist vertretbar, aber nicht durch Wiederholung von `FIXEDASSETS-055`. Der naechste praktische Lauf muss ein neuer Testfall sein:

`FIXEDASSETS-058-K30000-FA-CNC-01-PURCHASE-INVOICE-FIELD-MAPPING-RETRY-NO-POSTING`

## Warum der Retry vertretbar ist

`FIXEDASSETS-056` hat aus dem 055-Fehler einen maschinenlesbaren Guard gemacht. Damit kann der naechste Lauf nach jeder Kopf- oder Zeilenaktion stoppen, sobald Business Central in einen falschen Stammdaten- oder Dialogkontext springt.

Der neue Lauf ist also kein "nochmal probieren", sondern ein enger Feldmapping-Versuch mit Laufbremse.

## Harte Stop-Kriterien

- Vendor-Registrierungsdialog sichtbar.
- `Vendor Card` sichtbar.
- versehentliche Vendor-Nummer sichtbar.
- `FA-CNC-01` sichtbar, aber ohne Zeilentyp `Fixed Asset`.
- `Purchase Invoice` ist nach einer Feldaktion nicht mehr sichtbar.
- Zeilen-/Grid-Kontext ist nicht mehr sichtbar.
- Ein Posting-Dialog oeffnet sich.

## Erfolgskriterien fuer 058

- `Purchase Invoice` bleibt sichtbar.
- `K30000` ist im Kopf sichtbar.
- Zeilen-/Grid-Kontext bleibt sichtbar.
- Zeilentyp ist sichtbar `Fixed Asset`.
- `FA-CNC-01` steht sichtbar in der Einkaufsrechnungszeile, nicht in einer Vendor Card.
- Guard-Status ist `safe-purchase-invoice-line-candidate`.
- Kein `Preview Posting`, kein `Post`, kein Zugang, keine AfA.
- Jeder Entwurf oder versehentliche Datensatz ist per UI bereinigt.

## Nicht freigegeben

- Preview Posting.
- Posting.
- Anlagenzugang.
- AfA.
- Setup-Aenderungen.
- API-Abkuerzungen.
- Company-Wechsel.
- deutscher HGB-/Kontenplan-/USt-Finalnachweis.

## Buchwirkung

Kapitel 21 kann diesen Gate-Fall als Beispiel fuer sichere Automatisierung und Screenshot-QA nutzen: Ein Bild muss nicht nur Codes zeigen, sondern den korrekten Page-, Tabellen- und Zeilenkontext. Der eigentliche Anlagenkauf bleibt offen, bis ein spaeterer Lauf einen gueltigen Einkaufsrechnungs-Zeilenkontext und danach ein separates Preview-/Posting-Gate nachweist.

## Naechster Schritt

`FIXEDASSETS-058-K30000-FA-CNC-01-PURCHASE-INVOICE-FIELD-MAPPING-RETRY-NO-POSTING`

