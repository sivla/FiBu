# Buchkapitel-Entwurf: Posting Setup Fehler debuggen

## Ziel des Kapitels

Leser lernen, Fehlermeldungen aus der Buchungsvorschau nicht als Stoerung, sondern als Diagnosepfad zu lesen.

## Typisches Kundenticket

"Der Verkaufsauftrag laesst sich nicht buchen. Business Central meldet, dass ein Inventory Account fehlt."

## Was der User sieht

Eine Error-Message beim Buchen oder bei `Preview Posting`.

## Was BC wahrscheinlich im Hintergrund tut

BC versucht, aus Stammdaten, Belegzeile, Lagerort, Buchungsgruppen und Setup die benoetigten Posten vorzubereiten.

## Betroffene Pages

- Sales Order
- Error Messages
- Inventory Posting Setup

## Betroffene Tabellen

- Sales Header
- Sales Line
- Item
- Inventory Posting Setup

## Relevante Felder

- Location Code
- Inventory Posting Group
- Inventory Account

## Haeufige Ursachen

- Setup-Kombination fehlt
- Setup-Zeile existiert, aber Konto ist leer
- Artikel oder Lagerort liefern unerwartete Buchungsgruppe

## Diagnosepfad

1. Fehlermeldung exakt kopieren.
2. Genannte Codes identifizieren.
3. Passende Setup-Seite oeffnen.
4. Feld pruefen, nicht raten.
5. Preview nach fachlicher Korrektur wiederholen.

## Repro in Sandbox

Siehe `07-repro-steps.md`.

## Evidence Pack

Siehe Dateien `00` bis `10` in diesem Sample-Fall.

## Fix / Workaround

Workaround: nicht buchen. Dauerhaft: Konto fachlich bestimmen, Setup korrigieren, Preview wiederholen.

## Regressionstest

Der alte Fehler darf in Preview Posting nicht mehr erscheinen; es wird ohne separates Gate nicht gebucht.

## Was man nicht tun darf

Nicht irgendein Konto eintragen. Nicht die Buchung erzwingen. Nicht den Test gruen machen, ohne den Wertfluss zu verstehen.

## Merksatz

Eine Posting-Setup-Fehlermeldung ist oft kein Bedienfehler, sondern Business Centrals Schutz vor falschen Sachposten.
