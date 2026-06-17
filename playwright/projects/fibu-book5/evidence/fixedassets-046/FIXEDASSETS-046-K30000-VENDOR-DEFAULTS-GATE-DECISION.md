# FIXEDASSETS-046 - K30000 Vendor Defaults Gate Decision

Status: `done-decision-no-bc-run`, `labor`, `ui-first`, `no-posting`, `purchase-invoice-locked`.

## Ausgangslage

Der letzte praktische Lauf `FIXEDASSETS-045` hat die `K30000`-Kreditorenkarte in `RM-DEMO` read-only geoeffnet. Sichtbar waren:

- `K30000`
- `Zollspedition Nord GmbH`
- `Tax Liable`
- `Tax Area Code`
- `Payment Terms Code = 1M(8D)`
- `Payment Method Code = BANK`
- Einstellungen-Pane mit `Personalisieren`

Nicht sichtbar belegt waren:

- `Vendor Posting Group`
- `Gen. Bus. Posting Group`
- `Currency Code`
- `VAT Bus. Posting Group`

`Ctrl+Alt+F1` / Page Inspection wurde in diesem Playwright-/Browserkontext nicht stabil geoeffnet. Es wurde keine Personalisierung gestartet oder gespeichert.

## Entscheidung

Ein enger UI-first Setup-/Default-Fit fuer `K30000` wird jetzt nicht freigegeben.

Grund: Es gibt noch keinen sichtbaren oder technischen Nachweis, welche Werte in den fehlenden Default-Feldern stehen oder stehen sollen. Ein Setup-Fit wuerde an dieser Stelle Werte raten oder aus alten Annahmen ableiten. Das waere fuer Buch, Evidence und spaetere deutsche Wiederholung zu riskant.

Der naechste erlaubte Lauf ist deshalb:

`FIXEDASSETS-047-K30000-VENDOR-DEFAULTS-VISIBILITY-VALUE-DISCOVERY-READONLY`

Dieser Lauf darf:

- die `K30000`-Kreditorenkarte in `RM-DEMO` oeffnen,
- breite Layoutansicht nutzen,
- FactBox/Sidepanes schliessen, wenn sie Zielwerte verdecken,
- FastTabs gezielt oeffnen,
- `Personalisieren` nur als Sichtbarkeitsdiagnose nutzen,
- Page Inspection nur als technische Diagnose nutzen, falls der UI-Pfad stabil erreichbar ist,
- sichtbare Feldcaptions, Lookup-Optionen und Default-Werte dokumentieren.

Dieser Lauf darf nicht:

- Werte setzen,
- Personalisierung speichern, wenn dadurch der Buch-Screenshot still personalisiert wird,
- Kreditoren- oder Setupdaten aendern,
- Einkaufsrechnung, Anlagenzugang, AfA oder Buchung starten,
- API-/Direktdatenwege als Ersatz fuer den UI-Klickpfad nutzen.

## Warum Business Central so behandelt wird

Business Central blendet Felder je nach Page, FastTab, Personalisierung, Profil/Rolle, App/Extension und Kartenzustand ein oder aus. Ein nicht sichtbares Feld ist deshalb nicht automatisch fehlendes Setup. Umgekehrt beweist ein sichtbarer `Personalisieren`-Eintrag nicht, dass ein bestimmtes Default-Feld vorhanden, gefuellt oder buchungsreif ist.

Fuer eine Anlagen-Einkaufsrechnung ist der Kreditor nicht nur Adresse. Die Kreditorenkarte beeinflusst Buchungsgruppen, Waehrung, Zahlungsbedingungen und Steuer-/Tax-Kontext. Wenn diese Werte nicht sichtbar oder technisch nachvollziehbar sind, darf die Klickanleitung nicht zum Kaufbeleg springen.

## Buchwirkung

Kapitel 21 bleibt vor dem Anlagenkauf gegated. Die Anleitung muss Anfaengern erklaeren:

- Eine Kreditorenkarte ist nur teilweise geprueft, wenn nur Name, Zahlungsbedingung und Zahlungsmethode sichtbar sind.
- `Personalisieren` ist ein Diagnosewerkzeug, kein fachlicher Wertebeweis.
- Page Inspection ist technische Nachweisfuehrung, aber kein finales Anwenderbild.
- Ein Screenshot muss die Felder oder Codes zeigen, die im Text erklaert werden.

## Offene Punkte

- Sichtbarer Nachweis fuer `Vendor Posting Group`
- Sichtbarer Nachweis fuer `Gen. Bus. Posting Group`
- Sichtbarer Nachweis fuer `Currency Code`
- Sichtbarer Nachweis fuer `VAT Bus. Posting Group`
- Entscheidung, ob danach ein echter no-posting Default-Fit noetig und erlaubt ist

## Naechster Schritt

`FIXEDASSETS-047-K30000-VENDOR-DEFAULTS-VISIBILITY-VALUE-DISCOVERY-READONLY`.

Kein Kaufbeleg, kein Anlagenzugang, keine AfA und keine Buchung, bis diese Sichtbarkeits-/Werte-Discovery belegt ist und ein spaeteres Gate den naechsten Schritt freigibt.
