# TARGET-001 Evidence

Status: `german-final-candidate`, `read-only`, `no-write`, `no-search`, `no-company-switch`.

## Ergebnis

`playthru` wurde direkt geoeffnet und die Companies-Seite wurde ueber Page-ID `357` read-only geladen. `UNIVERSAARL-DE` war im erfassten Companies-Seitentext nicht sichtbar. Sichtbare Creation-/Company-Aktionslabels wurden nur inventarisiert, nicht geklickt.

## Dateien

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `TARGET-001-result.json` | Result JSON | Instanz `playthru`, Companies-Seite read-only, `UNIVERSAARL-DE` nicht sichtbar, no-write Flags | Company-Anlage, Setup, Posting, deutscher Finalprozess | observed |
| `010-role-center-context.txt` | kompakter UI-Text | Start-/Shell-Kontext in `playthru` | Company-Setup oder Prozessbeleg | read-only |
| `020-companies-context.txt` | kompakter UI-Text | Companies-Seite und sichtbare Namen/Aktionen | vollstaendige Tabellen-/Backendlogik | read-only |
| `target-001-010-playthru-role-center.screenshot.json` | Screenshot-Metadaten | Zweck und Grenze des Start-Screenshots | kein Feld-/Postenbeweis | candidate |
| `target-001-020-companies-page-readonly.screenshot.json` | Screenshot-Metadaten | Zweck und Grenze des Companies-Screenshots | keine Company-Anlage | candidate |

## Naechster Schritt

`TARGET-002-UNIVERSAARL-DE-COMPANY-CREATION`: UI-first Company-Anlage nur mit eindeutigem Companies-/Wizard-Kontext. Kein API-Shortcut und kein Company-Wechsel ohne neues Gate.

