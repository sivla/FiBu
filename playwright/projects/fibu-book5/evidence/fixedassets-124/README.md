# FIXEDASSETS-124 Evidence Index

Status: `local-evidence-review`, `judge_work`, `no-bc-run`, `no-playwright-run`, `no-posting`

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-124-route-decision.md` | Route decision | FA-123 ist als Personalize-/Debugging-Evidence nutzbar; der Purchase-Invoice-Line-Type-Pfad wird nicht weiter blind verfolgt | keine auswaehlbare `Fixed Asset`/`Anlage`-Option, kein Anlagenzugang, keine Preview, keine Buchung | `accepted-local-decision` |
| `FIXEDASSETS-124-result.json` | Normalized local result input | naechster Case ist ein lokaler Akquisitionsrouten-Audit nach wiederholten Purchase-Invoice-Zeilentyp-Blockern | keine BC-Wirkung, keine UI-Aktion, kein Setup-Fit | `state-sync-input` |

## Kurzbefund

`FIXEDASSETS-123` war wertvoll, weil `Personalisieren` ohne aktive Page-Inspection-Blockade oeffnete und den Kontext `Wird personalisiert: Lines` mit sichtbarem `Type`-Feld belegte. Das ist ein brauchbarer technischer Debugging-Nachweis.

Es ist aber kein fachlicher Nachweis, dass `Type = Fixed Asset` / `Anlage` in der Einkaufsrechnungszeile auswaehlbar ist. Der sichtbare Befund bleibt ohne `Fixed Asset`/`Anlage`, ohne `K30000`, ohne `FA-CNC-01`, ohne Betrag, ohne Preview und ohne Buchung.

## Entscheidung

Der Purchase-Invoice-Line-Type-Pfad bleibt vorerst gesperrt. Der naechste sinnvolle Schritt ist keine weitere Dropdown- oder Personalisieren-Probe, sondern ein lokaler Audit der Anlagenzugangswege nach den bisherigen Befunden:

- `Purchase Invoice` Zeilentyp: mehrfach blockiert, `Fixed Asset` nicht bewiesen.
- `FA G/L Journal`: Zielzeilen-Shell vorhanden, aber Werte-/Control-Pfad blockiert.
- `Acquire`/Anschaffung-Aktion: bisher nur als disabled/Diagnosehebel bekannt.

Naechster Case: `FIXEDASSETS-125-FA-ACQUISITION-ROUTE-AUDIT-AFTER-PERSONALIZE`.
