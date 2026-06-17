# FIXEDASSETS-036 - K30000 Vendor Preflight Read-only

Status: `labor`, `read-only`, `vendor-preflight`, `no-save`, `no-posting`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Zielkreditor | K30000 |
| Fachlicher Zweck | Anlagenkreditor fuer spaetere Einkaufsrechnung / Anlagenzugang zu FA-CNC-01 |
| Zielkreditor als Datensatz sichtbar | nein |
| Leerer Ergebniszustand sichtbar | ja |
| Gebucht | nein |

## Ergebnis

`K30000` ist im gefilterten Vendor-/Kreditoren-Kontext nicht als Datensatz sichtbar. Damit bleibt die spaetere Anlagen-Einkaufsrechnung gesperrt, bis ein eigener UI-first Setup-/Stammdaten-Gate den Kreditor entweder anlegt oder einen vorhandenen Kreditor fachlich freigibt.

## Was man in Business Central sieht

- Die Seite `Vendors` / `Kreditoren` ist der richtige Stammdatenkontext fuer den Anlagenlieferanten.
- Der gefilterte Kontext dient als Vorpruefung: existiert der Zielkreditor bereits oder muss er erst angelegt werden?
- Ein fehlender Kreditor ist kein Fehler von Business Central. BC verhindert damit, dass eine Einkaufsrechnung ohne valide Gegenpartei, Zahlungslogik und Buchungsgruppen aufgebaut wird.

## Warum dieser Schritt vor der Einkaufsrechnung kommt

Der Kreditor steuert nicht nur Name und Adresse. Auf der Kreditorenkarte haengen unter anderem Zahlungsbedingungen, Waehrung, Kreditorenbuchungsgruppe, Geschaeftsbuchungsgruppe, Steuer-/Tax-Kontext und Sperrstatus. Wenn diese Werte fehlen oder falsch sind, scheitert spaeter Preview Posting oder die Anlagenanschaffung wird falsch kontiert.

## Buchwirkung

Kapitel 21 muss vor der Einkaufsrechnung einen eigenen Kreditoren-Preflight zeigen: zuerst Zielkreditor suchen, dann Ergebnis bewerten, erst danach ueber Anlagekreditor-Anlage oder Einkaufsrechnung entscheiden. Das verhindert den Anfaengerfehler, vom fertigen Anlagenstamm direkt in den Kaufbeleg zu springen.

## Grenzen

- Kein Kreditor wurde angelegt oder geaendert.
- Keine Kreditorenkarte wurde gespeichert.
- Keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.
- Nur CRONUS-USA-Labor in `RM-DEMO`; kein deutscher Finalnachweis.

## Naechster Schritt

FIXEDASSETS-037-K30000-VENDOR-SETUP-GATE-DECISION: ohne BC-Aenderung entscheiden, ob und wie K30000 UI-first als Anlagenkreditor angelegt werden darf; weiterhin keine Einkaufsrechnung, kein Zugang, keine AfA und keine Buchung.
