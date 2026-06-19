# FIXEDASSETS-066 - Guarded Purchase-Invoice-Line-Type Probe

Status: `labor`, `guarded-no-target-probe`, `no-preview`, `no-posting`, `not-final`

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | blocked-blocked-item-line-type-visible |
| Guard | blocked-item-line-type-visible |
| Draft | 107210 |
| Cleanup | cleaned-up via `091-cleanup-retry-result.json` |

## Ergebnis

Der Guard stoppte korrekt, weil in den Einkaufsrechnungszeilen weiterhin `Item` statt `Fixed Asset` sichtbar war. Zielwerte blieben gesperrt: `K30000` und `FA-CNC-01` wurden nicht eingegeben.

Der erste Cleanup-Versuch hatte den Loeschdialog nicht bestaetigt. Der anschliessende dedizierte UI-Cleanup entfernte den temporaeren Draft `107210`; die Nachkontrolle zeigt in der gefilterten Liste: `In dieser Ansicht kann nichts angezeigt werden`.

## Grenzen

- Kein `K30000`.
- Kein `FA-CNC-01`.
- Keine Preview.
- Kein `Post`.
- Kein Anlagenzugang und keine AfA.
- Kein deutscher Finalnachweis.

## Naechster Schritt

Zeilentyp-Auswahl/Personalisierung fuer `Purchase Invoice Lines` diagnostizieren. Zielwerte bleiben verboten, bis `Type = Fixed Asset` sichtbar im Zeilenkontext belegt ist.
