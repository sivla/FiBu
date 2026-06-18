# FIXEDASSETS-054 - K30000 / FA-CNC-01 Purchase Invoice Field-Mapping Gate

Status: `done-decision-no-bc`, `gate`, `no-posting`, `no-setup-change`, `not-final`, `de-final-open`.

## Entscheidung

Der naechste praktische Lauf darf genau einen engen UI-first Field-Mapping-Preflight fuer die Anlagen-Einkaufsrechnung ausfuehren:

`FIXEDASSETS-055-K30000-FA-CNC-01-PURCHASE-INVOICE-FIELD-MAPPING-NO-POSTING`

Das ist keine Freigabe fuer Anlagenzugang, Preview Posting, Buchung oder AfA. Es ist nur die Freigabe, kontrolliert zu pruefen, ob `K30000` im Belegkopf und `FA-CNC-01` in einer Einkaufsrechnungszeile sichtbar und fachlich richtig auswaehlbar sind.

## Ausgangslage

- Instanz: `MCP_1_20260210`
- Company: `RM-DEMO`
- Datenbasis: CRONUS USA
- Kreditor: `K30000` / `Zollspedition Nord GmbH`
- Anlage: `FA-CNC-01` / `CNC Maschine FRA`
- Vorbeleg: keiner
- Buchung: keine
- Vorheriger Nachweis: `FIXEDASSETS-053`

`FIXEDASSETS-053` zeigt die leere `Purchase Invoice` Page `51` mit Pflichtfeldern `Vendor Name` und `Vendor Invoice No.`, Datumsfeldern, Zeilenbereich `Type`/`No.` und sichtbarer `Post`-Gefahrengrenze. `K30000` und `FA-CNC-01` wurden dort bewusst nicht eingetragen.

## Warum jetzt ein Field-Mapping-Lauf erlaubt ist

Fuer das Buch reicht ein leeres Purchase-Invoice-Bild nicht aus. Anfaenger muessen sehen, wo der Kreditor in den Belegkopf gehoert, wie Business Central die Zeile fuer eine Anlage fuehrt und ob `FA-CNC-01` als Zielobjekt sichtbar auswählbar ist.

Gleichzeitig ist die Einkaufsrechnung ein auto-save-naher Belegkontext. Deshalb darf der naechste Lauf Zielwerte nur mit harter Stop- und Cleanup-Logik testen.

## Erlaubt im naechsten Lauf

Der naechste Lauf darf:

1. `Purchase Invoices` Page `9308` in `RM-DEMO` oeffnen.
2. Breiten Viewport nutzen und FactBox ausblenden, wenn dadurch Pflichtfelder oder Zeilen besser sichtbar werden.
3. Einen neuen Purchase-Invoice-Kontext oeffnen.
4. `K30000` als Kreditor im Kopf testen.
5. Eine eindeutige Labor-`Vendor Invoice No.` nur dann eintragen, wenn Business Central sie fuer die kontrollierte Feldvalidierung verlangt.
6. In der Zeile den passenden Zeilentyp fuer Anlage/Festanlage suchen und nur verwenden, wenn die UI den Kontext sichtbar macht.
7. `FA-CNC-01` in der Zeile suchen/auswaehlen, wenn der Zeilentyp eindeutig passt.
8. Screenshots nur behalten, wenn sie sichtbare Zielwerte zeigen: `K30000`, `FA-CNC-01`, Zeilentyp, Pflichtfeldstatus, Dokumentnummer/Entwurf oder Abbruch-/Loeschstatus.
9. Eine entstandene Entwurfsrechnung dokumentieren und am Ende ueber die UI loeschen oder den Lauf als Blocker beenden, falls Cleanup nicht sicher ist.

## Verboten

- kein `Preview Posting`
- kein `Post`
- kein Anlagenzugang
- keine AfA
- keine Buchung
- keine Setup-/Kreditor-/Anlagen-Aenderung
- keine gespeicherte Personalisierung
- kein API-Shortcut
- kein Company-Wechsel
- keine deutsche VAT-, HGB- oder Kontenplan-Finalbehauptung
- keinen Entwurf stehen lassen

## Stop-Kriterien

Der naechste Lauf muss abbrechen und Evidence sichern, wenn:

- Business Central nicht `MCP_1_20260210` / `RM-DEMO` zeigt,
- `New/Neu` nicht eindeutig im Purchase-Invoices-Kontext liegt,
- nach `K30000` eine unerwartete Fehlermeldung erscheint,
- der Zeilentyp fuer Anlagen nicht eindeutig sichtbar oder auswaehlbar ist,
- `FA-CNC-01` nicht sichtbar gefunden wird,
- eine Vorschau- oder Buchungsaktion fokussiert wird,
- ein Draft entsteht und nicht eindeutig per UI bereinigt werden kann.

## Buchwirkung

Kapitel 21 darf den naechsten Schritt als Feldmapping fuer eine Anlagen-Einkaufsrechnung beschreiben: Kopf zuerst, dann Zeilentyp, dann Anlagen-Nr., dann Kontrollpunkte. Es darf noch nicht behaupten, dass der Anlagenzugang fachlich oder buchhalterisch funktioniert. Erst ein spaeterer Preview-/Posting-Gate mit Postenspur kann Anlagenposten, Sachposten und AfA-Folgen erklaeren.

## Naechster Schritt

`FIXEDASSETS-055-K30000-FA-CNC-01-PURCHASE-INVOICE-FIELD-MAPPING-NO-POSTING`
