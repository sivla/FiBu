# FIXEDASSETS-012 Evidence-Index

Status: `labor`, `ui-first`, `form-preflight`, `cancel-safe`, `no-save`, `no-setup-change`, `no-posting`, `not-final`.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-012-result.json` | JSON-Ergebnis | strukturierte Formular-Preflight-Ergebnisse je Zielkontext | keinen Setup-Fit und keine Buchung | labor |
| `FIXEDASSETS-012-SCOPED-NEW-CARD-PREFLIGHT.md` | Lernzusammenfassung | warum `New/Neu` vor Stammdatenanlage als Formular-/Pflichtfeldschritt verstanden werden muss | keinen deutschen Finalnachweis | labor |
| `*-before-page-text.txt` | Seitentext | Ausgangskontext vor `New/Neu` | keine Stammdatenanlage | compact |
| `*-after-new-page-text.txt` | Seitentext | sichtbarer Zustand nach kontrolliertem `New/Neu`-Versuch | keine vollstaendigen Rohsnapshots | compact |
| `*-form-hints.json` | JSON-Auszug | sichtbare Felder, Defaults/Templates und Abbruch-/Schliessen-Aktionen | keine sichere Feldbefuellung | compact |
| `*-buttons-after-new.json` | JSON-Auszug | sichtbare Buttons nach `New/Neu` | keine Freigabe zum Speichern | compact |
| `*.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Grenzen je Bild | keine eigenstaendige fachliche Wahrheit ohne JSON/Markdown | candidate/rejected |

## Kernaussage

Die PNGs aus `FIXEDASSETS-012` zeigen keine angelegten Zielcodes. Sie zeigen leere Karten oder den Vendor-Template-Dialog:

- `MACHINES` ist auf der `FA Posting Group Card` nicht sichtbar.
- `HGB` ist auf der `Depreciation Book Card` nicht sichtbar.
- `FA-CNC-01` ist auf der `Fixed Asset Card` nicht sichtbar.
- `K30000` ist im Vendor-Template-Dialog nicht sichtbar.

FIXEDASSETS-013-SETUP-FIT-DECISION: Aus FIXEDASSETS-012 entscheiden, ob ein kleiner idempotenter UI-first Setup-Fit fuer genau einen Zielwert sicher ist, oder ob ein Formularpfad rejected/blockiert bleibt. Fuer Buchscreenshots muss danach der Zielcode sichtbar fotografiert werden.
