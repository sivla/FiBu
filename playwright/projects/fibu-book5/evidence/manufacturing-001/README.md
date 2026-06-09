# MANUFACTURING-001 Evidence-Index

Ziel: Manufacturing-/Assembly-Readiness fuer Kapitel 14 read-only pruefen, ohne Setup, ohne Produktions-/Montageauftrag, ohne Verbrauch, ohne Output und ohne Buchung.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `MANUFACTURING-001-result.json` | JSON-Ergebnis | Sandbox, Company, Gate, Tell-Me-Einstiege, Artikelbefunde, Sicherheitsgrenzen | keine Produktion, keine Montage, keine Buchung | labor, read-only |
| `MANUFACTURING-001-READINESS.md` | Lernzusammenfassung | Warum Fertigung zuerst Stammdaten-/Setup-Readiness braucht | keinen Prozessnachweis | labor, gate-locked |
| `010-*` bis `070-*` | Tell-Me-Evidence | sichtbare oder verworfene Einstiegspfade fuer Planning, BOM, Routing, Production Orders, Consumption, Output und Assembly | keinen geoeffneten Prozess und keine Buchung | navigation-evidence |
| `rm-m100-*`, `raw-steel-*`, `comp-ctrl-*`, `kit-maint-*` | kompakter Artikel-Seitentext und Buttons | vorhandene oder fehlende Zielartikel im Labor | keine BOM-/Routing-Zuordnung und keinen Bestand-/Kosten-Endstand | item-readiness |
| `*.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen je Bild | keine eigenstaendige fachliche Wahrheit | mixed |

## Kernaussage

MANUFACTURING-002 als Buch-/Evidence-Sync fuer Kapitel 14: Readiness-Befunde einarbeiten und danach nur mit ausdruecklichem Gate Production BOM/Routing/Assembly-Setup UI-first vorbereiten.
