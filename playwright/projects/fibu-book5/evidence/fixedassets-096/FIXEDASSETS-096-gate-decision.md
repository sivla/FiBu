# FIXEDASSETS-096 Gate Decision

## Entscheidung

Ein eng begrenzter Purchase-Invoice-Draft-Proof ist freigegeben.

## Begruendung

FA-095 zeigt, dass die reine Purchase-Invoices-Liste `Type = Fixed Asset` nicht beweisen kann. FA-074 zeigt aber, dass ein realer Purchase-Invoice-Draft die Lines-Umgebung erreicht und die Type-Hilfe `fixed asset` erwaehnt. Weitere Listen- oder Purchase-Order-Probes wuerden wahrscheinlich nur Wiederholung erzeugen.

## Freigegebener Umfang fuer FA-097

- Purchase Invoices in `MCP_1_20260210` / `RM-DEMO` oeffnen.
- `New/Neu` nur im scoped Purchase-Invoices-Kontext klicken.
- Nur die Zeile `Type` fokussieren.
- Nur Dropdown/Wertehilfe fuer `Type` pruefen.
- `Fixed Asset` nur als Zeilentyp erkennen oder setzen.
- Draft loeschen, wenn eine Belegnummer entsteht.

## Bleibt gesperrt

- `K30000`
- `FA-CNC-01`
- Menge, Betrag, Preis
- Preview Posting
- Posting
- Setup Change
- Keep Draft

## Buchwirkung

Das Buch darf weiterhin keinen Anlagenzugang behaupten. Der naechste Lauf darf nur klaeren, ob die Einkaufsrechnungszeile technisch `Fixed Asset` als Typ zulaesst.

