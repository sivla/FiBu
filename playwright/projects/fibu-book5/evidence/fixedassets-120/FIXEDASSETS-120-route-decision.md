# FIXEDASSETS-120 - Purchase Invoice Line Type Options Route Decision

Status: `labor`, `local-review`, `judge-work`, `no-bc-run`, `no-playwright-run`, `no-posting`

## Ausgangspunkt

`FIXEDASSETS-119` hat den bisher engsten UI-Pfad praktisch getestet: Der kleine `Type`-Menuebutton in der Einkaufsrechnungszeile wurde aktiviert, ohne eine Auswahl zu treffen.

Der Lauf blieb innerhalb `MCP_1_20260210` / `RM-DEMO` und fuehrte keine Zielwerte aus:

- kein `K30000`
- kein `FA-CNC-01`
- kein Betrag
- keine Auswahl von `Fixed Asset` / `Anlage`
- keine `Preview Posting`
- kein `Post`
- keine Setup-Aenderung
- kein API-Shortcut
- kein Company-Wechsel

## Bewertung der FA-119-Evidence

FA-119 beweist:

1. Der kleine `Type`-Menuebutton ist als UI-Element sichtbar und kann gezielt angeklickt werden.
2. Der Klick fuehrte nicht zu einer sichtbaren echten Werteliste.
3. Der bereinigte Optionsbefund blieb bei `Item`; `Fixed Asset` / `Anlage` wurde nicht sichtbar.
4. Nach `Alt+ArrowDown` kann der Fokus auf `Groesse aendern` landen. Dieser Fokus ist kein Wertelisten-Erfolg.
5. Nach dem Menuebutton-Klick lag der Fokus im Grid-/Headerbereich. Das ist kein Dropdown-Beweis.

Die Screenshot-Metadaten sind korrekt: `rejected`, `bookUse = do-not-use`. Das Bild zeigt nicht, was das Buch spaeter zeigen muss.

## Entscheidung

Der bisherige Menuebutton-/Dropdown-Pfad wird vorerst nicht weiter wiederholt. Ein weiterer Live-Klick auf denselben kleinen Button waere wahrscheinlich nur eine Wiederholung derselben Fehlklasse.

Der naechste sinnvolle praktische Schritt ist ein technischer UI-first Diagnosefall:

`FIXEDASSETS-121-PURCHASE-INVOICE-LINE-TYPE-PAGEINSPECTION-PERSONALIZE-DIAGNOSIS`

Ziel ist nicht, `Fixed Asset` auszuwaehlen. Ziel ist, die technische Wahrheit der aktuellen Page/Line/Subform-Situation zu belegen:

- Welche Page/Subpage ist im Vordergrund?
- Welche Source Table steckt hinter der Einkaufsrechnungszeile?
- Welches technische Feld entspricht der sichtbaren Spalte `Type`?
- Ist die Spalte ueber `Personalisieren` / Seitenpruefung sauber als Page-Feld erkennbar?
- Gibt es Hinweise auf Extension-/Layout-/Control-Besonderheiten, die den Dropdown-Pfad erklaeren?

## Freigegeben fuer FA-121

- Business Central in `MCP_1_20260210` / `RM-DEMO` oeffnen.
- `Purchase Invoices` / `Purchase Invoice` im vorhandenen Pattern erreichen.
- Eine temporaere Einkaufsrechnung nur fuer die Zeilentyp-Diagnose oeffnen, falls noetig.
- Die `Type`-Zeile/Zelle fokussieren.
- `Ctrl+Alt+F1` / Page Inspection versuchen.
- `Personalisieren` nur als Diagnosemodus oeffnen, ohne zu speichern.
- Page-/Table-/Field-/Extension-Kontext kompakt sichern.
- Screenshot nur behalten, wenn Page Inspection, Personalisieren-Modus oder ein klarer Blocker sichtbar ist.
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

Fuer Kapitel 21 entsteht noch kein Bild fuer den Anlagenzugang. Der Lernwert liegt im Debugging-Kapitel und in der Klickanleitungsqualitaet: Wenn ein sichtbarer Dropdown-/Menuebutton nicht die erwartete Liste oeffnet, muss zuerst Page-/Table-/Field-Kontext geklaert werden. Ein schlechtes Bild darf nicht als Buch-Screenshot weitergetragen werden.

## Naechster Schritt

FA-121 soll Page Inspection und Personalisieren als Diagnosewerkzeug fuer die `Type`-Spalte nutzen. Erfolg zaehlt nur als technischer Kontextnachweis, nicht als Zeilentyp- oder Buchungsfreigabe.
