# FIXEDASSETS-017 Evidence-Index

Status: `labor`, `readiness-decision`, `ui-first-next-step`, `no-bc-run`, `no-setup-change`, `no-posting`, `not-final`, `de-final-open`.

Ziel: Nach den erledigten Labor-Prerequisites `HGB` und `MACHINES` genau die naechste sichere Fixed-Assets-Schicht festlegen, ohne `FA-CNC-01`, `K30000`, Einkaufsrechnung, Zugang oder AfA anzulegen beziehungsweise zu buchen.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-017-result.json` | JSON-Ergebnis | Entscheidung, Begruendung, erlaubten Folgeschritt und Sperren | keine BC-Ausfuehrung und kein Zielstammdaten-Fit | labor, decision |
| `FIXEDASSETS-017-FA-CNC-01-SETUP-READINESS.md` | Lernzusammenfassung | warum `FA-CNC-01` als naechster UI-first Karten-Preflight vor `K30000` kommt | keine Anlage, keinen Kreditor, keine Einkaufsrechnung, keine Anlagenposten | labor, readiness |

## Kernaussage

Der naechste schmale Schritt ist nicht `K30000` und noch kein Anlagenzugang, sondern ein UI-first Preflight fuer die Anlagenkarte `FA-CNC-01`. Begruendung: `HGB` und `MACHINES` sind die beiden bereits sichtbaren Setup-Prerequisites; die Anlagenkarte ist der zentrale fachliche Gegenstand des Kapitels 21. Erst wenn auf der Fixed-Asset-Card die benoetigten Felder, Pflichtfelder, FastTabs, AfA-Buch-Zuordnung und Abbruch-/Speicherlogik sichtbar verstanden sind, ist ein Kreditor- oder Einkaufsrechnungs-Fit sinnvoll.

## Buchwirkung

Kapitel 21 kann die Reihenfolge jetzt klarer erklaeren:

1. AfA-Buch `HGB` sichtbar machen.
2. Anlagenbuchungsgruppe `MACHINES` sichtbar machen.
3. Danach Anlagenkarte `FA-CNC-01` als Stammdaten-Preflight klaeren.
4. Erst danach Kreditor `K30000`, Einkaufsrechnung, Zugang, AfA und Postenspur.

Diese Evidence ist kein deutscher Finalnachweis und kein Anlagenprozess. Sie verhindert nur den naechsten typischen Anfaengerfehler: vom Setup direkt in eine Einkaufsrechnung oder Buchung zu springen, bevor die Anlage selbst sauber als Stammdatum verstanden ist.
