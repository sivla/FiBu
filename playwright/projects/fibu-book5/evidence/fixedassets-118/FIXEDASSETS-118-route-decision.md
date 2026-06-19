# FIXEDASSETS-118 - Purchase Invoice Line Type Route Decision

Status: `labor`, `local-review`, `no-bc-run`, `no-playwright-run`, `no-posting`

## Ausgangspunkt

`FIXEDASSETS-117` hat die `Type`-Zelle in einer Einkaufsrechnungszeile praktisch diagnostiziert. Der Lauf blieb in `MCP_1_20260210` / `RM-DEMO` und hat keine Zielwerte eingegeben:

- kein `K30000`
- kein `FA-CNC-01`
- kein Betrag
- keine Auswahl von `Fixed Asset` / `Anlage`
- keine `Preview Posting`
- kein `Post`
- keine Setup-Aenderung
- kein API-Shortcut
- kein Company-Wechsel

## Bewertung der FA-117-Evidence

FA-117 zeigt drei wichtige Dinge:

1. Die breitere `TD role=gridcell` mit Text `Item` ist sichtbar und liegt fachlich im `Type`-Bereich.
2. Ein direkter Klick in diese Zelle oeffnet weiterhin einen Kontext-/Detailzustand (`Details anzeigen`) und ist deshalb nicht der richtige Wertelisten-Beweis.
3. `Alt+ArrowDown` fokussiert einen kleinen Button mit `aria` ungefaehr `Menue fuer Type oeffnen`. Das ist ein belastbares Routen-Signal, aber noch kein Optionslisten-Beweis.

Die bereinigten Optionssignale enthalten weiterhin nur `Item`. `Fixed Asset` / `Anlage` ist nicht sichtbar und nicht bewiesen. Der Screenshot aus FA-117 bleibt `rejected/do-not-use`, weil er nicht die behaupteten Zieloptionen zeigt.

## Entscheidung

Der naechste sinnvolle praktische Schritt ist ein enger no-target UI-Probe:

`FIXEDASSETS-119-PURCHASE-INVOICE-LINE-TYPE-MENU-BUTTON-OPTIONS-NO-SELECTION`

Dieser Lauf darf den in FA-117 gefundenen kleinen `Type`-Menuebutton gezielt aktivieren und danach nur sichtbare Optionen erfassen.

## Freigegeben fuer FA-119

- Business Central in `MCP_1_20260210` / `RM-DEMO` oeffnen.
- `Purchase Invoices` / `Purchase Invoice` im vorhandenen Pattern erreichen.
- Eine temporaere Einkaufsrechnung nur fuer die Zeilentyp-Diagnose oeffnen, falls noetig.
- `Type`-Gridcell fokussieren.
- Den kleinen `Menue fuer Type oeffnen`-Button gezielt aktivieren.
- Sichtbare Optionen erfassen.
- Screenshot nur behalten, wenn er echte Optionen oder einen klaren Blocker zeigt.
- Entwurf bereinigen oder nachweisen, dass kein persistenter Entwurf entstanden ist.

## Weiter gesperrt

- `Fixed Asset` / `Anlage` auswaehlen
- `K30000` eingeben
- `FA-CNC-01` eingeben
- Betrag eingeben
- `Preview Posting`
- `Post`
- Setup-Aenderung
- API-Shortcut
- Company-Wechsel
- Buchaenderung

## Buchwirkung

Fuer das Buch ist weiterhin kein Bild fuer den Anlagenzugang entstanden. Der Lernwert ist ein technischer: In Business-Central-Zeilengrids kann der sichtbare Wert `Item` zugleich als Datensatz-/Details-Aktion wirken. Fuer eine Klickanleitung muss die Werteliste selbst sichtbar sein, nicht nur ein fokussierter Button oder ein Seitentexttreffer.

## Naechster Schritt

FA-119 soll genau pruefen, ob der kleine Type-Menuebutton eine echte Werteliste oeffnet. Erfolg zaehlt nur, wenn `Fixed Asset` / `Anlage` als sichtbare Option erscheint. Eine Auswahl bleibt in FA-119 noch verboten.
