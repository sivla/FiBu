# FIXEDASSETS-014 HGB Depreciation Book Fit

Status: `labor`, `ui-first`, `setup-proof`, `idempotent`, `no-posting`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Zielobjekt | Depreciation Book / AfA-Buch `HGB` |
| Aktion | created-hgb |
| Buchung | nein |
| Setup geaendert | ja, genau `HGB` |

## Was praktisch nachgewiesen ist

- Die Seite `Depreciation Books` wurde in `RM-DEMO` innerhalb `MCP_1_20260210` UI-first geoeffnet.
- Vor der Aktion wurde gezielt auf `HGB` geprueft.
- Nach der Aktion ist `HGB` im sichtbaren BC-Kontext nachgewiesen.
- Es wurde keine Anlage, keine Anlagenbuchungsgruppe, kein Kreditor und keine Einkaufsrechnung angelegt.
- Es wurde nichts gebucht.

## Warum das fachlich wichtig ist

Ein AfA-Buch ist die Bewertungs- und Abschreibungsebene fuer Anlagen. Es ist nicht die Anlage selbst und nicht die Kontenfindung. Fuer Anfaenger ist diese Trennung zentral: Erst Bewertungslogik vorbereiten, dann Anlagenbuchungsgruppe/Konten entscheiden, dann Anlage und Zugang buchen.

## Grenzen

- CRONUS-USA-Labor, kein deutscher HGB-Endstand.
- Keine deutsche Steuer-, Kontenplan- oder Abschlussaussage.
- `MACHINES`, `FA-CNC-01` und `K30000` bleiben gesperrt.
- Der naechste Schritt muss die Anlagenbuchungsgruppe `MACHINES` fachlich aus Konten-/Posting-Logik entscheiden, nicht raten.

## Buchwirkung

Kapitel 21 darf `HGB` jetzt als RM-DEMO-Labor-Setup-Prerequisite zeigen. Der Text muss weiter klar trennen: HGB-AfA-Buch vorhanden bedeutet noch keine Anlagenaktivierung und keine deutsche finale Anlagenbuchhaltung.

## Naechster Schritt

FIXEDASSETS-015-MACHINES-ACCOUNT-MAPPING-DECISION: read existing CRONUS FA Posting Groups and decide whether a narrow MACHINES setup-fit is safe; do not create FA-CNC-01 yet.
