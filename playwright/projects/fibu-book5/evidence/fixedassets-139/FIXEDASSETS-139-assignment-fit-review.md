# FIXEDASSETS-139 - FA-CNC-01 Assignment-Fit Review

Status: `local-review`, `blocked-field-mapping`, `no-bc-run`, `no-playwright-run`, `no-setup-change`, `no-posting`.

## Geprueft

- Referenzlauf: `FIXEDASSETS-138-FA-CNC-01-POSTING-GROUP-ASSIGNMENT-FIT`
- Environment: `MCP_1_20260210`
- Company: `RM-DEMO`
- Objekt: `FA-CNC-01`
- Ziel: Kartenfeld `Posting Group` im Bereich `Depreciation Book` von `EQUIPMENT` auf `MACHINES` umstellen.

## Entscheidung

`FIXEDASSETS-138` wird als sauberer Blocker-Nachweis akzeptiert, nicht als Setup-Fit.

Die Evidence beweist:

- `FA-CNC-01` wurde in der richtigen Instanz und Company geoeffnet.
- Vor dem Fit steht `Posting Group = EQUIPMENT`.
- `Book Value = 0,00` ist sichtbar.
- `Acquired` ist nicht aktiv sichtbar.
- Es gibt keine kompakte FA-Ledger-Trace fuer `FA-CNC-01`.
- Es wurde keine Anschaffung, keine Preview, kein Posting, kein Draft und kein API-Shortcut ausgefuehrt.

Die Evidence beweist nicht:

- dass `Posting Group = MACHINES` auf `FA-CNC-01` gesetzt wurde,
- dass ein Setup-Change gespeichert wurde,
- dass die Anlage anschaffungs- oder buchungsreif ist,
- einen deutschen Finalnachweis.

## Screenshot-QA

Der Screenshot `fixedassets-138-060-fa-cnc-01-posting-group-machines.png` ist als Blockerbild brauchbar, weil er den relevanten Kartenbereich zeigt:

- `FA-CNC-01 - CNC Maschine FRA`
- `Depreciation Book Code = HGB`
- `Posting Group = EQUIPMENT`
- `Book Value = 0,00`
- `Acquired` Toggle nicht aktiv

Er ist kein Buchkandidat fuer `MACHINES`, weil `MACHINES` nicht sichtbar ist. Der Dateiname enthaelt noch das Zielwort `machines`; in der Metadatei und im Evidence-Text ist das Bild korrekt als Blockerbild markiert.

## Ursache

Der aktuelle UI-Write-Hebel behandelt das Kartenfeld `Posting Group` zu sehr wie ein normales Textinput. In Business Central ist das Feld sichtbar als Kombinations-/Lookup-Feld im `Depreciation Book`-Bereich. Das Tippen von `MACHINES` plus `Tab` und der generische Dropdown-Fallback haben den Wert nicht gesetzt; nach dem Versuch steht weiter `EQUIPMENT`.

Wichtig ist nicht nur, dass ein Control in derselben sichtbaren Zeile gefunden wird. Der naechste Helper muss die konkrete BC-Combobox-Route fuer dieses Feld beweisen:

1. Feld `Posting Group` im `Depreciation Book`-FastTab fokussieren.
2. Werteliste/Lookup fuer genau dieses Feld oeffnen.
3. Sichtbare Option `MACHINES` nachweisen.
4. `MACHINES` auswaehlen.
5. Karte verlassen oder neu oeffnen.
6. Danach `Posting Group = MACHINES` sichtbar beweisen.

## Naechster sicherer Schritt

`FIXEDASSETS-140-FA-CNC-01-POSTING-GROUP-COMBOBOX-ROUTE`

Dieser Lauf darf nur den Posting-Group-Combobox-Pfad reparieren und erneut versuchen. Weiter gesperrt bleiben:

- Anschaffung / `Acquire`
- Einkaufsrechnung / Journal
- Preview Posting
- Posting
- Betrag / Kreditor / Belegzeile
- deutsche Finalbehauptung
