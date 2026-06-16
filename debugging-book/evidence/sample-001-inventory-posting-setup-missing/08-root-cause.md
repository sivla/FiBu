# Root Cause

## Bestaetigte Ursache

Fuer die Kombination `Location Code = FRA-ZL` und `Invt. Posting Group Code = RESALE` fehlt in `Inventory Posting Setup` ein `Inventory Account`.

## Beleg

Die Fehlermeldung nennt die konkrete Setup-Kombination und das fehlende Konto.

## Technische Erklaerung

Beim Buchen oder in der Buchungsvorschau einer Artikelbewegung muss Business Central aus Lagerort und Lagerbuchungsgruppe ein Bestandskonto ermitteln. Ohne Konto kann BC keine vollstaendige Sachpostenlogik vorbereiten.

## Fachliche Erklaerung

Der Verkaufsprozess erzeugt nicht nur Umsatz und Forderung. Bei lagergefuehrten Artikeln entsteht auch ein Wertfluss fuer Bestand und Wareneinsatz. Das benoetigte Bestandskonto darf nicht geraten werden, weil sonst Lagerwert und Hauptbuch falsch werden.

## Ausgeschlossene Hypothesen

- Berechtigungsfehler: Die Meldung nennt kein Permission Set und keine TableData-Berechtigung.
- Reiner UI-Fehler: Die Meldung kommt aus der Posting-Logik, nicht aus einer fehlenden Spalte.
- Bereits erfolgte Buchung: Der Fehler tritt vor der Buchung beziehungsweise in der Vorschau auf.

## Betroffene BC-Objekte

- Page `Inventory Posting Setup`
- Table `Inventory Posting Setup`
- Feld `Inventory Account`
- Sales Order Posting Preview

## Moegliche Nebenwirkungen

Ein falsch gesetztes Konto kann spaetere Bestandswerte, COGS, Abschluss und Reporting verfaelschen.
