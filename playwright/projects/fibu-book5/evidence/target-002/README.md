# TARGET-002 Evidence

Status: `universaarl-draft`, `company-creation-gate`, `blocked-before-save`, `not-final`.

## Ergebnis

TARGET-002 hat die Companies-Seite in `playthru` erneut direkt ueber Page-ID `357` geoeffnet. `UNIVERSAARL-DE` war nicht sichtbar. Die Aktion `Neu` oeffnete eine leere, nicht gespeicherte Mandantenzeile. Es wurden keine Zielwerte eingegeben, keine Company gespeichert, kein Wizard bestaetigt und keine CRONUS-/Demo-/Copy-Route ausgefuehrt.

## Dateien

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `TARGET-002-result.json` | Result JSON | `UNIVERSAARL-DE` nicht sichtbar, `Neu` oeffnet unsaved blank row, keine Werte/kein Save | fertige Company, Company Information, Setup | blocked |
| `010-companies-before.txt` | kompakter UI-Text | Companies-Liste vor Create-Gate | Backend-/Tabellenzustand vollstaendig | observed |
| `020-new-options.txt` | Action-Inventar | sichtbare relevante Aktionen wie `Neu`, `Kopieren`, `Testunternehmen` | sichere Produktions-/Blank-Wizard-Route | observed |
| `target-002-010-companies-before.screenshot.json` | Screenshot-Metadaten | Mandantenliste vor dem Gate; Anfaenger sehen, dass vor Neuanlage vorhandene Companies geprueft werden | sichere Erstellroute, gespeicherte Company, Company Information | draft-context |
| `target-002-020-new-options-inventory.screenshot.json` | Screenshot-Metadaten | `Neu`-/Optionskontext und unsaved row als Warnbild: eine neue Zeile ist noch keine Company | gespeicherte Company, blank/setup-only Datenbasis, finaler Buchscreen | blocked-draft |

## Screenshot-Qualitaet

Die Bilder sind nur fuer den Buchdraft geeignet. Das zweite Bild ist kein Erfolgsbild, sondern ein Warn- und Blockerbild: `Neu` oeffnet einen sichtbaren Kontext, aber ohne Speichern, Zielwert und Datenbasisnachweis entsteht keine fertige Company. Es darf deshalb nicht als finaler Company-Creation-Screenshot verwendet werden.

## Blocker

`direct-new-opened-unsaved-company-row-no-values-entered`: Eine direkte Listenzeilen-Route ist sichtbar, aber fruehere Labor-Evidence zeigte bei Company-Listenzeilen ein Save-Risiko. TARGET-002 stoppt deshalb vor Zielwerten und Save.

## Naechster Schritt

TARGET-003 sollte entweder eine sichere Create-New-Company-/Assisted-Setup-Route ohne Demo/Kopie finden oder die direkte Listenzeilen-Route als bewusstes Execute-Gate mit Vorher/Nachher/Save-Fehler-Plan absichern.
