# TARGET-001 Evidence

Status: `universaarl-draft`, `read-only`, `no-write`, `no-search`, `no-company-switch`, `not-final`.

## Ergebnis

`playthru` wurde direkt geoeffnet und die Companies-Seite wurde ueber Page-ID `357` read-only geladen. `UNIVERSAARL-DE` war im erfassten Companies-Seitentext nicht sichtbar. Sichtbare Creation-/Company-Aktionslabels wurden nur inventarisiert, nicht geklickt.

## Dateien

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `TARGET-001-result.json` | Result JSON | Instanz `playthru`, Companies-Seite read-only, `UNIVERSAARL-DE` nicht sichtbar, no-write Flags | Company-Anlage, Setup, Posting, deutscher Finalprozess | observed |
| `010-role-center-context.txt` | kompakter UI-Text | Start-/Shell-Kontext in `playthru` | Company-Setup oder Prozessbeleg | read-only |
| `020-companies-context.txt` | kompakter UI-Text | Companies-Seite und sichtbare Namen/Aktionen | vollstaendige Tabellen-/Backendlogik | read-only |
| `target-001-010-playthru-role-center.screenshot.json` | Screenshot-Metadaten | Start-/Shell-Kontext in `playthru`; Anfaenger sehen, dass zuerst Umgebung und BC-Shell geprueft werden | `UNIVERSAARL-DE`, Setup, Prozess, Posting, deutscher Finalscreen | draft-context |
| `target-001-020-companies-page-readonly.screenshot.json` | Screenshot-Metadaten | Companies-/Mandantenliste read-only; Anfaenger sehen den Ort, an dem Companies verwaltet werden | sichere Erstellroute, Company-Anlage, Setup, deutscher Finalscreen | draft-context |

## Screenshot-Qualitaet

Die beiden Screenshots sind Buchdraft-Kontext, aber keine finalen Buchscreenshots. Sie duerfen erklaeren, was Environment, Shell und Mandantenliste sind. Sie duerfen nicht behaupten, dass `UNIVERSAARL-DE` existiert oder dass ein deutscher Zielmandant eingerichtet wurde. Wenn `CRONUS DE` im Shell-/Listenrahmen sichtbar ist, ist das nur Ausgangskontext der `playthru`-Umgebung.

## Naechster Schritt

`TARGET-002-UNIVERSAARL-DE-COMPANY-CREATION`: UI-first Company-Anlage nur mit eindeutigem Companies-/Wizard-Kontext. Kein API-Shortcut und kein Company-Wechsel ohne neues Gate.
