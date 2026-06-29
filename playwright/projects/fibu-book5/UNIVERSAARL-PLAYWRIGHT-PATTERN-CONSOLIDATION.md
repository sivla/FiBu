# Universaarl Playwright Pattern Consolidation

Status: `universaarl-pattern-baseline`, `helper-only`, `no-bc-run`.

Dieser Zwischenlauf konsolidiert die vorhandenen Business-Central-Playwright-Muster fuer die aktive Zielwelt `playthru` / `UNIVERSAARL-DE`. Es wurde keine Business-Central-Seite geoeffnet und kein Playwright-Test ausgefuehrt. Historische RM-DEMO-, MCP_1_20260210-, CRONUS- und Rhein-Main-Tests bleiben als Laborarchiv erhalten, gelten aber nicht mehr als aktive Zieltests fuer Universaarl.

PREP-018 ergaenzt die konkrete Skript- und Helper-Inventur in `UNIVERSAARL-PLAYWRIGHT-SCRIPT-INVENTORY.md`. Neue Laeufe sollen zuerst dort pruefen, ob ein Test aktiv Universaarl-faehig, read-only, geparkt, legacy oder archive-only ist.

## Aktive Zielregel

Neue aktive Universaarl-Tests muessen mindestens diese Kontextfelder in Result/Evidence fuehren:

| Feld | Erwartung |
|---|---|
| `targetWorld` | `Universaarl` |
| `instance` | `playthru` |
| `company` | `UNIVERSAARL-DE`, sobald angelegt; davor Companies-/Creation-Kontext |
| `sourceStatus` | `universaarl-evidence`, `universaarl-readonly`, `universaarl-setup`, `universaarl-posting` oder `legacy-pattern-reuse` |
| `capabilitiesUsed` | IDs aus `.agent/capabilities.json` |
| `legacyPatternSource` | optional; nur fuer alte RM-/CRONUS-Muster, nicht als Zielbeweis |

## Konsolidierte Muster

| Muster | Wiederverwendbare Capability / Helper | Status | Universaarl-Regel |
|---|---|---|---|
| Navigation | `bc_navigation_control`, `openBcPageById`, `searchFor`, `openSearchResult` | `lab-reusable` | Direkte Page-ID ist fuer sichere Regression erlaubt; Buchpfade brauchen spaeter sichtbaren Anwenderpfad oder erklaerte Page-ID-Grenze. Kein blindes Tell-Me-Enter. |
| Page Context | `bc_page_context_guard`, `pageText`, Page Inspection bei Bedarf | `lab-reusable` | Vor jeder wirksamen Aktion muessen Page, sichtbarer Zieltext und ggf. Frame-Kontext stimmen. Shell-only-Text reicht nicht. |
| Company Context | `bc_page_context_guard`, `target-001` bis `target-004` | `universaarl-in-progress` | `playthru` ist belegt; `UNIVERSAARL-DE` ist noch nicht angelegt. Bis TARGET-005 gibt es nur Companies-/Creation-Kontext, keinen Zielcompany-Kontext. |
| Scoped Action Click | `bc_scoped_action_click`, `clickBcAction`, `clickBcScoredAction`, `clickBcTopIconAction` | `lab-reusable` | Aktionen wie `Neu`, `Post`, `Preview`, `Kopieren`, `Testunternehmen`, `Delete` nur im belegten Page-/Card-/Line-Kontext. Keine globale Action ohne Nachbedingung. |
| Dialog Gate | `bc_dialog_gate`, `clickBcDialogButton` | `lab-reusable` | `OK`, `Ja`, `Finish`, `Erstellen`, `Post`, `Preview`, `Delete` nur mit sichtbarem Dialogtext, erlaubter Wirkung und Rueckfalllogik. |
| Screenshot Truth Gate | `screenshot_truth_gate`, `screenshot()` metadata | `book-ready` | Screenshot ist nur Buchkandidat, wenn der behauptete Code, Wert, Button, Dialog oder Postentyp sichtbar ist. Unscharfe Kontextbilder bleiben Debugging-Evidence. |
| Card Field Diagnostics | `bc_card_field_diagnostics`, `collectActiveCardControlDiagnostics` | `lab-reusable` | Caption, Wert und editierbares Control getrennt pruefen. Verwandte Karten, FactBox-Text oder Hintergrundlisten zaehlen nicht als Kartenfeldwert. |
| Journal/Grid Handling | `journal_line_control_snapshot`, `journal-grid-candidates.ts` | `lab-reusable` | Vor Werteingabe Header, Zielzeile, Zielspalte, editierbaren Kandidaten und sichtbaren Nachherwert row-anchored pruefen. |
| Evidence Writer | `evidence_pack_writer`, `writeJsonEvidence`, `writeTextEvidence`, Screenshot-Metadaten | `lab-reusable` | Evidence bleibt kompakt: bewiesen, nicht bewiesen, Grenze, naechster Schritt, Labor-/Universaarl-Status. Keine Rohsnapshots oder Screenshots ohne Zweck. |
| Error Recovery | `bc_error_recovery_pattern`, Dialog-/Page-Text-Capture | `lab-reusable` | Fehler nicht wegklicken. Sichtbaren Fehler sichern, Ursache klassifizieren, Cleanup-/Fallback-Route dokumentieren und erst dann neuen UI-Schritt waehlen. |

## PREP-010 UI-Ergonomie-Muster

Diese Muster entstehen aus den aktuellen Universaarl-Fehlern rund um `Mandanten`, `Neu`, Dropdown-Pfeil und Screenshot-Qualitaet. Sie sind keine neuen Live-Beweise, sondern verpflichtende Bedienregeln fuer die naechsten read-only oder wirksamen Universaarl-Cases.

| Muster | Zweck | Use when | Stop if | Ergebnis |
|---|---|---|---|---|
| `bc_splitbutton_intent_gate` | Hauptbutton, Pfeil und Menueintrag trennen | Eine Aktion wie `Neu` einen Pfeil oder mehrere Eintraege hat | Der Screenshot zeigt nicht eindeutig, welcher Teil getroffen wurde | Result nennt `mainButton`, `dropdownArrow`, `menuItem`, `selectedTarget` |
| `bc_hover_tooltip_probe` | Tooltip/Accessible Name vor riskantem Klick sichern | sichtbarer Buttontext mehrdeutig ist oder der User eine genaue Klickanleitung braucht | Tooltip/Name widerspricht der geplanten Aktion | Result nennt Hover-Ziel, Tooltip, erwartete Wirkung |
| `bc_screenshot_qa_gate` | Sichtbaren Beweis gegen DOM-Annahme pruefen | ein Screenshot fuer Evidence oder Buch genutzt werden soll | Code, Wert, Button, Dialog oder Menueintrag ist nicht sichtbar/lesbar | Screenshotstatus wird `book-candidate`, `debug-context`, `rejected-path` oder `not-final` |
| `bc_layout_escalation_ladder` | Verdeckte Bereiche sichtbar machen | Feld, Zeile, Spalte oder Button angeblich fehlt | Maximize/Fokus/FastTab/Scroll/FactBox-Route nicht versucht wurde | Result beschreibt versuchte Layoutwege |
| `bc_wrong_target_rejection` | Falsche Klickziele sofort als Fehler erkennen | nach Klick ein anderer Zielzustand erscheint als erwartet | Agent versucht trotzdem weiter, als waere die richtige Route aktiv | Evidence bekommt `rejectedPathReason` und naechsten sicheren Schritt |

Minimaler Result-Ausschnitt fuer UI-Faelle:

```json
{
  "uiErgonomics": {
    "splitButtonIntent": {
      "mainButton": "",
      "dropdownArrow": "",
      "menuItem": "",
      "selectedTarget": "",
      "tooltip": "",
      "resultingVisibleState": "",
      "targetMatched": false
    },
    "layoutEscalation": [],
    "screenshotQa": {
      "visiblePage": "",
      "visibleTarget": "",
      "internallyProves": [],
      "doesNotProve": [],
      "qualityDecision": ""
    }
  }
}
```

## Legacy-Test-Klassifikation

| Testgruppe | Beispiele | Aktiver Status | Naechste Behandlung |
|---|---|---|---|
| Universaarl Target | `target-001-*` bis `target-009-*` | `active-universaarl`, teils `parked-until-super-permissions` | Nur Read-only-Referenzen laufen lassen; Company-Creation-Cases bleiben bis Rechtefreigabe geparkt. |
| Live Smoke / Context | `live-smoke-bc-*` | `convert-to-generic-or-universaarl` | Nur aktiv verwenden, wenn Instanz/Company auf `playthru`/Universaarl passt; sonst als Patternquelle. |
| RM-DE-LAB Company Creation | `rm-de-lab-create-*` | `legacy-pattern-source` | Nicht als aktive Zieltests ausfuehren; nur Create-Company-UI-Fehler-/Actionmuster wiederverwenden. |
| RM-DEMO Prozessstrecken | `p2p-*`, `payments-*`, `bank-*`, `warehouse-*`, `inventory-*`, `fixedassets-*` | `legacy-labor-reference` | Keine direkte aktive Zielwahrheit. Relevante Helper-/Gate-Muster in Universaarl-Tests neu anwenden. |
| UAT CRONUS Lab | `uat-o2c-*`, `uat-p2p-*`, `uat-start-*` | `archive-only` | Beweiskette erhalten, aber im Buch durch Universaarl-Evidence ersetzen, sobald vorhanden. |
| Generische Helper-/Selftests | `playwright/core/bc/*.selftest.ts`, Helper in `playwright/core/bc/` | `helper-reusable` | Behalten und bei Bedarf mit Universaarl-neutralen Fixtures erweitern. |

## Mindeststandard fuer neue Universaarl-Tests

1. Vor dem ersten wirksamen Klick: `bc_page_context_guard`.
2. Vor Action-Klicks: `bc_scoped_action_click` oder dokumentierte sichere Ausnahme.
3. Vor Dialogbestaetigung: `bc_dialog_gate`.
4. Vor Screenshot-Buchkandidat: `screenshot_truth_gate`.
5. Vor Kartenwert-Fit: `bc_card_field_diagnostics`.
6. Vor Journal-/Grid-Fill: `journal_line_control_snapshot`.
7. Nach jedem Lauf: Result JSON mit `capabilitiesUsed`, `targetWorld`, `legacyPatternSource` falls relevant.
8. Bei Splitbuttons: `bc_splitbutton_intent_gate`, inklusive Hover/Tooltip und sichtbarem Zielzustand.

## Naechster praktischer Nutzen

TARGET-005 soll keine alten RM-DE-LAB- oder RM-DEMO-Tests wiederholen. Der Lauf soll nur die belegten Muster verwenden:

- `bc_navigation_control` fuer den sicheren Einstieg in `playthru`.
- `bc_page_context_guard` fuer Companies/Page-Kontext.
- `bc_scoped_action_click` fuer source-backed, nicht globale Company-Creation-Aktionen.
- `bc_dialog_gate` fuer jedes moegliche Create-/Finish-/Save-Fenster.
- `evidence_pack_writer` fuer kompaktes Result.

Wenn TARGET-005 blockiert, ist der naechste Schritt kein weiterer Mikro-Click, sondern eine klare Alternative: offizieller Quellenpfad, UI-Discovery mit Dialog-Gate oder ein dokumentierter Verzicht auf UI-Company-Creation bis zur passenden BC-Option.
