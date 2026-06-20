# FIXEDASSETS-133 - Acquisition Readiness Cause Review

Status: `labor`, `local-evidence-review`, `judge_work`, `no-bc-run`, `no-playwright-run`, `no-setup`, `no-posting`, `not-final`.

## Ausgangspunkt

`FIXEDASSETS-132` hat `FA-CNC-01` read-only auf der `Fixed Asset Card` in `MCP_1_20260210` / `RM-DEMO` geoeffnet. Der gepruefte Screenshot zeigt:

- `FA-CNC-01`
- Beschreibung `CNC Maschine FRA`
- `FA Class Code = TANGIBLE`
- `FA Subclass Code = EQUIPMENT`
- AfA-Daten im Bereich `Depreciation Book`
- `Book Value = 0,00`
- `Acquire` sichtbar, aber deaktiviert

Nicht sichtbar waren:

- Ready-to-acquire-Hinweis
- `HGB` im sichtbaren Kartenausschnitt
- `MACHINES` im sichtbaren Kartenausschnitt
- `Acquired`-Status
- Anschaffungswert, Preview Posting oder Postenspur

## Entscheidung

`Acquire` bleibt gesperrt. Das Bild ist ein gutes Kontrollbild fuer die Anlagenkarten-Vorpruefung, aber kein Anschaffungsnachweis.

Der naechste praktische Schritt soll nicht `Acquire` klicken und nicht wieder zu Purchase Invoice oder FA G/L Journal springen. Stattdessen soll ein enger read-only Lauf die versteckten/zusatzlichen Felder im Bereich `Depreciation Book` der Anlagenkarte sichtbar machen.

## Warum dieser Schritt

Microsoft Learn beschreibt den Anlagenzugang so, dass eine Anlage zuerst eingerichtet und einem AfA-Buch zugeordnet sein muss, bevor sie angeschafft werden kann. FA-132 zeigt zwar AfA-Daten und `Book Value = 0,00`, aber nicht die vollstaendige Bereitschaftslage. Besonders fehlen im sichtbaren Bild die Zielsignale `HGB`, `MACHINES` und ein expliziter `Acquired`-/Ready-to-acquire-Kontext.

Deshalb ist der naechste risikoarme Hebel:

- `FA-CNC-01` erneut read-only oeffnen
- `Depreciation Book` / `Mehr anzeigen` sichtbar erweitern
- `Depreciation Book Code`, `FA Posting Group`, `Acquired`, relevante Datums-/Jahreswerte und `Book Value` erfassen
- keine Werte aendern
- kein `Acquire`
- keine Preview
- kein `Post`

## Nicht tun

- `Acquire` nicht klicken
- keinen Edit-/Stiftmodus aktivieren
- keine Werte eingeben
- keine Einkaufsrechnung, kein Journal, keine neue Route starten
- keine Setup-Aenderung
- keine Buchung
- keine deutsche Finalbehauptung

## Buchwirkung

Kapitel 21 kann die Anlagenkarte als fachlichen Kontrollpunkt erklaeren: Eine Anlage ist nicht dadurch angeschafft, dass die Karte existiert oder die Aktion `Acquire` sichtbar ist. Ein Anfaenger muss verstehen, welche Felder den Anlagenstammsatz vorbereiten und warum `Book Value = 0,00` bedeutet, dass noch kein Zugang gebucht ist.

## Naechster Lauf

`FIXEDASSETS-134-FA-CNC-01-DEPRECIATION-BOOK-FIELDS-READONLY`

Ziel: Read-only die erweiterten AfA-/Posting-/Acquired-Felder auf `FA-CNC-01` sichtbar machen und als Ursachen-/Readiness-Evidence sichern.
