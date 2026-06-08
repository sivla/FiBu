# FIXEDASSETS-006 Evidence-Index

Ziel: vorhandene CRONUS-Konten in `FA Posting Groups` read-only lesen, bevor ein spaeterer `MACHINES`-Fit geplant wird.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-006-result.json` | JSON-Ergebnis | Sandbox, Company, Gate, sichtbare Gruppen/Konten, Sicherheitsgrenzen | kein Setup, keine Buchung, kein deutscher Kontenplan | labor, read-only |
| `FIXEDASSETS-006-FA-POSTING-GROUP-ACCOUNTS.md` | Lernzusammenfassung | warum FA Posting Groups Kontenfindung sind und warum kein Konto geraten wird | keinen MACHINES-Fit | labor, setup-preparation |
| `010-fa-posting-groups-accounts-page-text.txt` | kompakter Seitentext | sichtbare Tabellen-/Kontenhinweise | keinen Rohdump | ui-evidence |
| `010-fa-posting-groups-accounts-buttons.json` | Button-Evidence | sichtbare Aktionen, ohne sie auszufuehren | keine Aktion | ui-evidence |
| `fixedassets-006-010-fa-posting-groups-accounts.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen des Bildes | keine eigenstaendige fachliche Wahrheit | candidate |

## Kernaussage

Without gate: `FIXEDASSETS-007` read-only fortsetzen und vorhandene AfA-Buecher/Depreciation Books sowie Anlagenklassen lesen. With gate: idempotenten UI-Setup-Fit fuer MACHINES planen, aber die Zielkonten fachlich aus CRONUS-Gruppen ableiten und als Labor, nicht DE-Final, markieren.
