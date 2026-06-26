# FIXEDASSETS-204 HGB G/L Integration Read-only Diagnosis

Status: `labor`, `read-only`, `setup-diagnosis`, `no-preview`, `no-posting`, `no-setup-change`, `not-final`.

| Feld | Wert |
|---|---|
| Case | FIXEDASSETS-204-HGB-GL-INTEGRATION-READONLY |
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Zielobjekt | Depreciation Book `HGB` |
| Page-Kontext | Depreciation Books page 5611, Depreciation Book Card via list-record-link |
| Acquisition-Cost-G/L-Integration | not-visible |

## Was geprueft wurde

- Business Central wurde nur lesend in `MCP_1_20260210` / `RM-DEMO` geoeffnet.
- Die Depreciation-Book-Kontexte wurden auf `HGB` gefiltert.
- Sichtbare Texte und Controls rund um `G/L Integration` und `Acquisition Cost` wurden kompakt gesichert.
- Es wurde kein Feld umgeschaltet, keine Vorschau gestartet und nichts gebucht.

## Warum das fachlich wichtig ist

Der vorherige FA-202-Blocker sagt, dass `Acquisition Cost` im FA Journal gebucht werden muss. In Business Central entscheidet die Einrichtung des AfA-Buchs mit, ob Anlagenbuchungen in die Sachposten integriert werden. Deshalb ist der naechste sichere Schritt nicht erneutes Preview Posting, sondern die lesende Pruefung des `HGB`-AfA-Buchs.

## Ergebnis

- HGB sichtbar: ja.
- G/L-Integration-Hinweise sichtbar: ja.
- Acquisition-Cost-Status: `not-visible` (no-acquisition-cost-integration-control-visible).

## Grenze

- Wenn der Checkbox-Wert nicht eindeutig sichtbar ist, ist das kein Setup-Fit. Dann braucht der naechste Lauf eine lokale Review-Entscheidung oder einen gezielten, weiter abgesicherten UI-Pfad.
- Kein deutscher HGB-Endstand, keine deutsche Steuer-/Kontenplan-Finalisierung.
- Kein Preview Posting und keine Anlagenbuchung.

## Naechster Schritt

FIXEDASSETS-205: locally review FA-204 HGB G/L Integration evidence and decide whether setup-fit or FA Journal route is the next safe case.
