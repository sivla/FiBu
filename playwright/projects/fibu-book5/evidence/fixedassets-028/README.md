# fixedassets-028 Evidence

Status: `decision`, `governance`, `fixed-assets`, `save-gate`, `no-bc-run`, `no-posting`, `not-final`, `de-final-open`.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-028-result.json` | JSON-Ergebnis | Save-Gate-Entscheidung fuer den naechsten kontrollierten Anlagenstammdatenlauf | keinen gespeicherten Stammsatz, kein Setup, keine Buchung | decision |
| `FIXEDASSETS-028-FA-CNC-01-AUTO-NUMBER-SAVE-GATE-DECISION.md` | Markdown | fachliche Begruendung, Sicherheitsregeln und naechsten erlaubten Lauf | keinen deutschen Finalnachweis | decision |

## Kernaussage

`FIXEDASSETS-027` hat bewiesen, dass Lookupwerte sichtbar sind, aber auch dass eine neue Anlagenkarte automatisch eine Nummer ziehen und speichern kann. Deshalb ist der naechste praktische Schritt kein weiterer Preflight, sondern ein kontrollierter Zielstammdaten-Speicherlauf fuer `FA-CNC-01`.

Der naechste Lauf darf `FA-CNC-01` nur speichern, wenn die UI im selben Lauf zeigt:

- Umgebung `MCP_1_20260210` und Company `RM-DEMO`.
- `FA-CNC-01` ist vor dem Lauf nicht vorhanden.
- Beim Klick auf `Neu/New` entsteht entweder keine Nummer oder die automatisch gezogene Nummer kann sofort im Feld `No.` auf `FA-CNC-01` geaendert werden.
- `Description = CNC Maschine FRA`.
- `FA Class Code = TANGIBLE`.
- `FA Subclass Code = EQUIPMENT`.
- `Depreciation Book Code = HGB`.
- `Posting Group = MACHINES`.
- AfA-Daten werden bewusst gesetzt oder, wenn BC sie aus `No. of Depreciation Years = 8` ableitet, sichtbar dokumentiert.

Wenn BC die Nummer nicht sicher auf `FA-CNC-01` setzen laesst oder ein anderer Auto-Number-Entwurf entsteht, muss der Lauf abbrechen, den Entwurf per UI bereinigen und den Blocker dokumentieren.

## Nicht erlaubt

- Kein Kreditor `K30000`.
- Keine Einkaufsrechnung.
- Kein Anlagenzugang.
- Keine AfA.
- Keine Buchung.
- Keine deutsche HGB-/Kontenplan-Finalbehauptung.

