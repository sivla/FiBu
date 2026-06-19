# FIXEDASSETS-122 - Purchase Invoice Line Type Diagnosis Review

Status: `labor`, `local-review`, `judge-work`, `no-bc-run`, `no-playwright-run`, `no-book-change`.

## Ausgangspunkt

`FIXEDASSETS-121` hat die Einkaufsrechnungsseite in `MCP_1_20260210` / `RM-DEMO` praktisch geoeffnet und die sichtbare `Type`-Zelle (`Item`) fokussiert.

Belegt ist:

- Page Inspection startet per `Ctrl+Alt+F1`.
- Der technische Kontext zeigt `Purchase Invoice (51)` und `Purchase Header (38)`.
- Der `Type`-Hilfetext nennt `fixed asset` als moegliche fachliche Einkaufsart.
- `Personalisieren` wurde angeklickt, startete aber nicht, weil Page Inspection noch aktiv war.
- Es gab keine Auswahl, keine Zielwerte, keine Preview, keine Buchung, kein Setup und keinen persistenten Draft.

Nicht belegt ist:

- `Purchase Line` als Source Table der fokussierten Zeile.
- `Fixed Asset` / `Anlage` als sichtbare oder auswählbare Type-Option.
- ein geoeffneter Personalisieren-/Add-field-Bereich.
- irgendeine Buchungs- oder Anlagenzugangsreife.

## Bewertung

Die Page-Inspection-Evidence ist nuetzlich fuer das spaetere Debugging-Kapitel, aber sie ist kein Zeilentyp-Fit. Der `fixed asset`-Hinweis im Hilfetext erklaert, was Business Central fachlich unter `Type` versteht; er beweist aber nicht, dass Playwright die Option in der konkreten Einkaufsrechnungszeile sicher auswaehlen kann.

Der Personalize-Befund ist ein Blockerbild, kein Feldlistenbild. Die entscheidende Lehre ist: Page Inspection und Personalisieren duerfen nicht im selben UI-Zustand vermischt werden. Bevor Personalisieren als Diagnosewerkzeug genutzt wird, muss Page Inspection geschlossen sein oder der Lauf muss frisch ohne vorherige Page Inspection starten.

## Entscheidung

Der naechste praktische Schritt ist:

`FIXEDASSETS-123-PURCHASE-INVOICE-LINE-TYPE-PERSONALIZE-RETRY-NO-SAVE`

Dieser Lauf soll:

- Business Central in `MCP_1_20260210` / `RM-DEMO` oeffnen.
- `Purchase Invoices` geoeffnet lassen.
- optional einen scoped Purchase-Invoice-Draft nur fuer den Lines-Kontext oeffnen.
- die `Type`-Zelle nur fokussieren.
- **keine** Page Inspection vorher oeffnen.
- `Einstellungen > Personalisieren` direkt versuchen.
- nur Feld-/Page-/Blocker-Signale erfassen.
- keine Personalisierung speichern.
- keinen Zeilentyp auswaehlen.
- keine Zielwerte eingeben.
- Draft sauber bereinigen oder nicht-persistiert dokumentieren.

## Weiter gesperrt

- `Type = Fixed Asset` auswaehlen
- `K30000` eingeben
- `FA-CNC-01` eingeben
- Betrag eingeben
- Preview Posting
- `Post`
- Setup-Aenderung
- API-Shortcut
- Company-Wechsel
- Buchaenderung

## Buchwirkung

Fuer das Buch ist FA-121/FA-122 vor allem Debugging-Wissen:

- Page Inspection hilft, Page/Table/Hilfetexte zu verstehen.
- Personalisieren hilft nur, wenn der Modus wirklich startet und die Feld-/Add-field-Angebote sichtbar sind.
- Ein Hilfetext oder ein blockierter Personalize-Einstieg ersetzt keinen sichtbaren Klickpfad.

