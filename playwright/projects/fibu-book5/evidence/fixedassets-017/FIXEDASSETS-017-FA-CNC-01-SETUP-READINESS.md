# FIXEDASSETS-017 - FA-CNC-01 Setup-Readiness

Status: `labor`, `readiness-decision`, `ui-first`, `no-bc-run`, `no-setup-change`, `no-posting`, `not-final`, `de-final-open`.

## Ausgangslage

Umgebung: `MCP_1_20260210`  
Company: `RM-DEMO`  
Datenbasis: CRONUS USA

Der Anlagenblock hat inzwischen zwei sichtbare Labor-Prerequisites:

- `HGB` ist seit `FIXEDASSETS-014` als AfA-Buch sichtbar.
- `MACHINES` ist seit `FIXEDASSETS-016` als Anlagenbuchungsgruppe sichtbar; das Nachherbild zeigt `MACHINES`, `12210` und `82000`.

Weiter offen sind:

- Anlage `FA-CNC-01`
- Kreditor `K30000`
- Einkaufsrechnung / Anlagenzugang
- AfA-Lauf
- Anlagenposten, Kreditorenposten und Sachposten zur Anlage
- deutscher Kontenplan- und HGB-Finalnachweis

## Entscheidung

Der naechste sinnvolle No-Approval-Schritt ist:

```text
FIXEDASSETS-018-FA-CNC-01-CARD-PREFLIGHT
```

Erlaubt fuer den naechsten Lauf:

- `Anlagen (Fixed Assets)` in `RM-DEMO` oeffnen.
- Ziel `FA-CNC-01` suchen und sichtbar pruefen, ob es bereits existiert.
- Wenn nicht vorhanden: `Neu` nur als kontrollierten Karten-Preflight nutzen.
- Pflichtfelder, FastTabs, sichtbare Felder, Defaults, AfA-Buch-/Anlagenbuchungsgruppen-Kontext und sichere Abbruchwege dokumentieren.
- Falls die Karte gespeichert werden soll, braucht der Lauf vorher ein klares Feldmapping und muss danach Code, Beschreibung, `HGB` und `MACHINES` sichtbar nachweisen.

Nicht erlaubt:

- keine Einkaufsrechnung
- kein Kreditor `K30000`
- kein Anlagenzugang
- keine AfA
- keine Anlagen-, Kreditoren- oder Sachposten
- kein deutscher Finalnachweis

## Warum nicht zuerst K30000?

`K30000` ist fuer die Einkaufsrechnung wichtig, aber fachlich nachgelagert. Der Buchfall handelt zuerst von einer Anlage: Ohne belastbare Anlagenkarte weiss der Anfaenger nicht, wo `FA-CNC-01`, Beschreibung, AfA-Buch, Nutzungsdauer und Anlagenbuchungsgruppe gepflegt werden. Ein Kreditor-Fit wuerde bereits in Richtung Beschaffung und Rechnung springen, obwohl die Anlage selbst noch nicht als Stammdatum verstanden und belegt ist.

## Warum nicht direkt Zugang/AfA?

Business Central bucht Anlagen nicht nur auf ein Sachkonto. Der Zugang muss eine Anlage, ein AfA-Buch, eine Anlagenbuchungsgruppe und spaeter Anlagenposten erzeugen. Wenn `FA-CNC-01` falsch oder unvollstaendig ist, entstehen spaeter falsche Anlagenposten oder gar kein Anlagenposten. Deshalb kommt vor jeder Buchung:

1. Anlagenkarte verstehen.
2. Pflichtfelder und Setup-Verweise pruefen.
3. Buchungsvorschau oder vergleichbaren Preflight vorbereiten.
4. Erst danach bewusst buchen.

## Anfaenger-Lernwert

`HGB` und `MACHINES` sind nicht die Maschine. Sie sind Setup-Schichten. `FA-CNC-01` ist die eigentliche Maschine im Anlagenstamm. Der naechste Screenshot muss deshalb nicht nur irgendeine Anlagenliste zeigen, sondern sichtbar machen, woran man die Anlage erkennt und welche Einrichtung dahinter haengt.

Guter Screenshot-Kandidat fuer den naechsten Lauf:

- Fixed Asset Card oder Liste mit sichtbar gefiltertem `FA-CNC-01`
- Beschreibung `CNC Maschine FRA`
- AfA-Buch-Kontext `HGB`, falls auf der Karte/FastTab sichtbar
- Anlagenbuchungsgruppe `MACHINES`, falls auf der Karte/FastTab sichtbar

Wenn diese Werte nicht sichtbar sind, ist das Bild kein Buchbild fuer die fertige Anlage, sondern nur Preflight- oder Fehlerbild.

## Naechster Schritt

`FIXEDASSETS-018-FA-CNC-01-CARD-PREFLIGHT`: UI-first, moeglichst breiter Viewport, keine Buchung, kein Kaufbeleg. Bei unklaren Feldern zuerst `Personalisieren` oder `Page Inspection` als Debug-Werkzeug nutzen und danach zur normalen Anwendersicht zurueckkehren.
