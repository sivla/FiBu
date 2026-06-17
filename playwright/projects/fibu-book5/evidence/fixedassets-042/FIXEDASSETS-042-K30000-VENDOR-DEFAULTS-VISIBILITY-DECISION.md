# FIXEDASSETS-042 K30000 Vendor Defaults Visibility Decision

## Status

- Case: `FIXEDASSETS-042-K30000-VENDOR-DEFAULTS-VISIBILITY-DECISION`
- Umgebung: `MCP_1_20260210`
- Company: `RM-DEMO`
- Arbeitstyp: Decision / kein BC-Lauf
- Buchbereich: Kapitel 21 Anlagen, Kapitel technische Nachweisfuehrung, Screenshot-QA
- Buchung: nein
- Setup-/Kreditor-Aenderung: nein
- Deutscher Finalnachweis: nein

## Ausgangspunkt

`FIXEDASSETS-041` hat die `K30000`-Kreditorenkarte read-only geoeffnet. Sichtbar sind:

- `K30000`
- `Zollspedition Nord GmbH`
- `Payment Terms Code = 1M(8D)`
- `Payment Method Code = BANK`

Nicht sichtbar belegt sind:

- `Vendor Posting Group`
- `Gen. Bus. Posting Group`
- `Currency Code`
- `Tax Area Code`
- `Tax Liable`
- `VAT Bus. Posting Group`

Der bisherige FastTab-Klick ist kein ausreichender Aufklappnachweis. Ein sichtbarer Header mit `Payments 1M(8D) BANK` beweist Zahlungswerte, aber nicht die fehlenden Posting-/Currency-/Tax-Defaults.

## Entscheidung

Der naechste praktische Lauf darf noch keinen Kaufbeleg vorbereiten. Er muss zuerst als read-only UI-Lauf die Sichtbarkeit der relevanten Kreditoren-FastTabs technisch sauber pruefen.

Freigegeben wird:

- `FIXEDASSETS-043-K30000-VENDOR-INVOICING-FASTTAB-VISIBILITY-READONLY`

Ziel von `FIXEDASSETS-043`:

1. `Vendor Card` Page `26` fuer `K30000` in `RM-DEMO` oeffnen.
2. Breite Layoutansicht nutzen und FactBox bei Bedarf ausblenden.
3. FastTabs gezielt ueber Chevron/`aria-expanded`/kleines Header-Control oeffnen, nicht ueber den Wertstreifen.
4. Fuer `Invoicing`, `Payments` und falls sichtbar `Receiving` jeweils eine Nachbedingung pruefen:
   - konkrete Zielcaption sichtbar, oder
   - konkrete Zielwerte sichtbar, oder
   - technisch sauber dokumentiert, dass die Caption im Standardbild nicht sichtbar ist.
5. Screenshots nur als brauchbar markieren, wenn die behaupteten Felder oder Werte im Bild wirklich zu sehen sind.

## Nicht freigegeben

- keine Einkaufsrechnung
- kein Anlagenzugang
- keine AfA
- keine Anlagen- oder Einkaufsbuchung
- keine Kreditor-Aenderung
- kein Setup-Fit
- kein API-Shortcut
- keine deutsche Steuer- oder Kontenplanbehauptung

## Diagnose-Reihenfolge

1. **FastTab-Chevron zuerst.**  
   Der wahrscheinlichste Befund ist ein Sichtbarkeitsproblem: Die Felder koennen auf der Karte vorhanden sein, aber der falsche Klickpfad oeffnet den FastTab nicht.

2. **Personalisieren nur als Diagnose.**  
   Wenn Zielcaptions auch nach sauberem FastTab-Oeffnen fehlen, darf Personalisieren pruefen, ob Felder auf der Page verfuegbar, aber ausgeblendet sind. Das ist kein Tabellen- oder Setupbeweis.

3. **Page Inspection nur als technischer Nachweis.**  
   Wenn UI und Personalisieren unklar bleiben, darf Page Inspection Page/Table/Field-Kontext dokumentieren. Das ist Debug-Evidence, kein finales Anwenderbild.

4. **Setup-Gate erst danach.**  
   Ein Setup-Fit ist erst begruendbar, wenn sichtbar oder technisch belegt ist, dass die benoetigten Werte wirklich fehlen beziehungsweise fuer den Prozess falsch sind.

## Anfaenger-Lernwert

Business Central zeigt in FastTab-Headern manchmal Werte, ohne alle darunterliegenden Felder offen anzuzeigen. Fuer Anfaenger ist wichtig:

- Ein sichtbarer Kreditorname beweist nur den Stammdatensatz.
- Sichtbare Zahlungswerte beweisen nur Zahlungsbedingungen/Zahlungsmethode.
- Buchungsgruppen, Waehrung und Steuerkontext steuern spaetere Buchung und duerfen nicht geraten werden.
- Fehlende Felder bedeuten nicht automatisch fehlendes Setup; oft ist zuerst die Oberflaeche, Personalisierung oder Rollen-/Profilansicht zu klaeren.

## Buchwirkung

Kapitel 21 darf `K30000` weiterhin nur als Labor-Kreditor mit sichtbaren Zahlungswerten behandeln. Die Klickanleitung vor einer Anlagen-Einkaufsrechnung braucht einen eigenen Kontrollschritt:

> Kreditorenkarte oeffnen, relevante FastTabs sichtbar aufklappen und pruefen, welche Buchungsgruppen, Waehrung und Steuer-/VAT-Kontexte Business Central fuer diesen Kreditor verwenden wuerde.

Solange diese Felder nicht sichtbar oder technisch erklaert sind, bleibt der Kaufbeleg gesperrt.

## Naechster Schritt

`FIXEDASSETS-043-K30000-VENDOR-INVOICING-FASTTAB-VISIBILITY-READONLY`: praktischer UI-first Read-only-Lauf mit gezielter FastTab-Chevron-/`aria-expanded`-Logik und sichtbaren Nachbedingungen fuer die fehlenden K30000-Default-Felder.

