# Business-Central-Fundstellen

Diese Datei sammelt Dinge, die Playwright-Läufe, Screenshots oder manuelle Sichtprüfungen in Business Central sichtbar machen, die im Buch aber noch nicht ausreichend erklärt sind.

Eine Fundstelle ist keine Störung. Sie ist Lernmaterial.

## Statuswerte

| Status | Bedeutung |
|---|---|
| `offen` | gesehen, aber noch nicht recherchiert |
| `recherchieren` | braucht Microsoft Learn, BC-Hilfe oder praktischen Gegentest |
| `getestet` | Funktion wurde in BC ausprobiert |
| `buch-update` | Erkenntnis muss ins Buch eingearbeitet werden |
| `erledigt` | Buch/Doku/Test wurden aktualisiert |
| `ignoriert` | bewusst nicht relevant für das Buchziel |

## Vorlage

```markdown
## <ID> <kurzer Titel>

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall |  |
| Screenshot |  |
| BC-Seite |  |
| sichtbarer Text |  |
| Elementtyp | Button / Menü / Feld / FastTab / FactBox / Dialog / Hinweis / Bericht |
| erste Hypothese |  |
| Recherchequelle |  |
| Testergebnis |  |
| Entscheidung | Buch ergänzen / Projektnotiz / ignorieren |
| Buchstelle |  |
```

## Aktuelle Fundstellen

## FIND-BC-FA-019 Setup-Felder muessen vor dem Speichern sichtbar gemappt sein

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `FIXEDASSETS-019-FA-CNC-01-CARD-FIELD-MAPPING-DECISION` |
| Screenshot | kein neuer Screenshot; nutzt `playwright/projects/fibu-book5/img/fixedassets-018-030-fixed-asset-card-preflight.png` als Negativ-/Preflight-Kontext |
| Evidence | `playwright/projects/fibu-book5/evidence/fixedassets-019/README.md`, `playwright/projects/fibu-book5/evidence/fixedassets-019/FIXEDASSETS-019-FA-CNC-01-CARD-FIELD-MAPPING-DECISION.md` |
| BC-Seite | `Fixed Asset Card` |
| sichtbarer Text | `No.`, `Description`, `FA Class Code`, `FA Subclass Code`, `Depreciation Book`, `Depreciation Method`, AfA-Datumsfelder; nicht sichtbar belegt: konkrete Zuordnung `HGB` und `MACHINES` |
| Elementtyp | Karte / Pflichtfelder / Setup-Referenzfelder / Decision |
| erste Hypothese | Eine leere Stammdatenkarte darf nicht gespeichert werden, bevor die fuer spaetere Buchungen relevanten Setup-Referenzfelder sichtbar und setzbar sind. |
| Recherchequelle | Projekt-Evidence `FIXEDASSETS-018` und `FIXEDASSETS-019`; keine neue Microsoft-Learn-Recherche, weil die Entscheidung aus konkreter UI-Evidence folgt. |
| Testergebnis | Setup-Fit fuer `FA-CNC-01` noch nicht freigegeben. `HGB` und `MACHINES` muessen auf der Anlagenkarte erst per `Mehr anzeigen`, Personalisieren oder Page Inspection als sichtbare/setzbare Felder belegt werden. |
| Entscheidung | Kapitel 21, Gates, State, Backlog, Coverage, Patterns und Action Map wurden auf `FIXEDASSETS-020-FA-CNC-01-CARD-MORE-FIELDS-MAPPING` als naechsten Schritt synchronisiert. |
| Buchstelle | Kapitel 21 Anlagen |

## FIND-BC-FA-018 Leere Anlagenkarte ist Preflight, kein Zielstammsatz

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `FIXEDASSETS-018-FA-CNC-01-CARD-PREFLIGHT` |
| Screenshot | `playwright/projects/fibu-book5/img/fixedassets-018-010-fixed-assets-list-target-not-visible.png`, `playwright/projects/fibu-book5/img/fixedassets-018-030-fixed-asset-card-preflight.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/fixedassets-018/README.md`, `playwright/projects/fibu-book5/evidence/fixedassets-018/FIXEDASSETS-018-FA-CNC-01-CARD-PREFLIGHT.md` |
| BC-Seite | `Fixed Assets` / `Fixed Asset Card` |
| sichtbarer Text | Anlagenliste ohne sichtbaren Zielcode `FA-CNC-01` im Ausschnitt; leere Karte mit `No.`, `Description`, `FA Class Code`, `FA Subclass Code`, `Depreciation Method`, AfA-Datumsfeldern und `Book Value = 0,00` |
| Elementtyp | Liste / Karte / Pflichtfelder / Preflight |
| erste Hypothese | Ein Kartenbild darf nur als Stammdatennachweis gelten, wenn Zielcode und relevante Werte sichtbar sind. |
| Recherchequelle | Projekt-Evidence `FIXEDASSETS-018`; Microsoft-Learn-Quellen wurden in diesem Lauf nicht neu benoetigt, weil es um konkrete UI-/Screenshot-Wahrheit geht. |
| Testergebnis | `FA-CNC-01` ist im Listen-/Seitentext vor `New` nicht sichtbar und wurde nicht gespeichert. Das Listenbild ist nur ein begrenzter Kontextnachweis, kein harter Nicht-Existenz-Beweis. Die leere Karte ist als Lernbild fuer Pflichtfelder brauchbar, aber kein Buchbild fuer eine angelegte Anlage. |
| Entscheidung | Buchkapitel 21, Coverage, Screenshot-QA, State, Gates, Patterns und Action Map wurden aktualisiert. Naechster Schritt ist Feldmapping-/Setup-Fit-Entscheidung, nicht Kreditor oder Einkaufsrechnung. |
| Buchstelle | Kapitel 21 Anlagen |

## FIND-BC-UI-002 Personalisieren erklaert fehlende Felder, Spalten und Aktionen

| Feld | Wert |
|---|---|
| Status | erledigt als Projekt-/Buchregel ohne BC-Lauf |
| Projekt | fibu-book5 |
| Testfall | `GOVERNANCE-014-PERSONALIZATION-PATTERN` |
| Screenshot | keiner; Quellen-/Pattern-Sync |
| Evidence | `playwright/projects/fibu-book5/evidence/governance-014/README.md`, `playwright/projects/fibu-book5/evidence/governance-014/GOVERNANCE-014-PERSONALIZATION-PATTERN.md` |
| BC-Seite | querschnittlich fuer Business-Central-Pages |
| sichtbarer Text | nicht praktisch geprueft in diesem Lauf |
| Elementtyp | Personalisierung / Page Customization / UI-Sichtbarkeit |
| erste Hypothese | Fehlende Felder, Spalten oder Aktionen in Klickanleitungen koennen durch Personalisierung, Profilanpassung, Ansicht, Rolle oder Einstellungen verursacht sein. |
| Recherchequelle | Microsoft Learn: `Personalise your workspace`, `Customize pages for profiles`, 2025 Wave 2 Release Plan zu mehr Feldern/Spalten in der Personalisierung |
| Testergebnis | Als Regel aufgenommen: Personalisieren ist ein Diagnosewerkzeug fuer sichtbare Page-Elemente, aber kein Beweis fuer Tabellen-, Posting-, Steuer- oder Berechtigungslogik. |
| Entscheidung | Buch, Pattern, Workaround-Journal, Coverage und Microsoft-Doc-Validation wurden aktualisiert. Kuenftige Screenshots muessen markieren, ob sie Standardansicht, Nutzer-Personalisierung oder Profilanpassung zeigen. |
| Buchstelle | Kapitel 37 Glossar/Bedienlogik; querschnittlich fuer Klickanleitungen |

## FIND-BC-UI-003 Page Inspection erklaert technische Page-/Tabellenkontexte

| Feld | Wert |
|---|---|
| Status | erledigt als Projekt-/Buchregel ohne BC-Lauf |
| Projekt | fibu-book5 |
| Testfall | `GOVERNANCE-015-PAGE-INSPECTION-PATTERN` |
| Screenshot | keiner; Quellen-/Pattern-Sync |
| Evidence | `playwright/projects/fibu-book5/evidence/governance-015/README.md`, `playwright/projects/fibu-book5/evidence/governance-015/GOVERNANCE-015-PAGE-INSPECTION-PATTERN.md` |
| BC-Seite | querschnittlich fuer Business-Central-Pages |
| sichtbarer Text | nicht praktisch geprueft in diesem Lauf |
| Elementtyp | Page Inspection / Seitenpruefung / technische Diagnose |
| erste Hypothese | `Ctrl+Alt+F1` beziehungsweise Help & Support / `Inspect pages and data` hilft, Page Name, Page ID, Page Type, Source Table, Felder, Filter und Extensions fuer Klickpfade zu dokumentieren. |
| Recherchequelle | Microsoft Learn: `Inspecting pages in Business Central`, `Keyboard shortcuts`, Developer-Doku `Inspecting pages` |
| Testergebnis | Als Regel aufgenommen: Page Inspection ist technischer Kontext fuer Klickanleitungen und Bugfixing, aber kein finales Anwenderbild und kein fachlicher Buchungsnachweis. |
| Entscheidung | Buch, Pattern, Workaround-Journal, Coverage und Microsoft-Doc-Validation wurden aktualisiert. Kuenftige unklare Page-/Feld-/Locator-Kontexte sollen Page Inspection nutzen, bevor Buchtext oder Helper groesser geaendert werden. |
| Buchstelle | Kapitel 37 Glossar/Bedienlogik; querschnittlich fuer Klickanleitungen |

## FIND-BC-BUG-001 BC-Fehler brauchen Ebenenmodell statt Schnellfix

| Feld | Wert |
|---|---|
| Status | erledigt als Playbook-/Buchregel ohne BC-Lauf |
| Projekt | fibu-book5 |
| Testfall | `GOVERNANCE-016-BC-BUGFIXING-PLAYBOOK` |
| Screenshot | keiner; Quellen-/Pattern-Sync |
| Evidence | `playwright/projects/fibu-book5/evidence/governance-016/README.md`, `playwright/projects/fibu-book5/evidence/governance-016/GOVERNANCE-016-BC-BUGFIXING-PLAYBOOK.md`, `playwright/projects/fibu-book5/BC-BUGFIXING-PLAYBOOK.md` |
| BC-Seite | querschnittlich fuer BC-Fehleranalyse |
| sichtbarer Text | nicht praktisch geprueft in diesem Lauf |
| Elementtyp | Fehleranalyse / Support / Bugfixing / Consultant-Denkweise |
| erste Hypothese | BC-Fehler muessen nach Oberflaeche, Page/Tabelle, Berechtigung, Stammdaten, Prozessstatus, Posting Setup, Extension, Daten/Filter, Integration und Performance klassifiziert werden, bevor gefixt wird. |
| Recherchequelle | Microsoft Learn Troubleshooting Tools, Permission Error Telemetry, Event Recorder, Telemetry Overview, Performance Troubleshooting, Page View Telemetry, Webservice Telemetry |
| Testergebnis | `BC-BUGFIXING-PLAYBOOK.md` wurde angelegt und Kapitel 37 um eine kompakte Fehleranalyse-Denkweise erweitert. |
| Entscheidung | Kuenftige Fehlerlaeufe sollen erst Fehlerklasse und Diagnosewerkzeug dokumentieren, dann Setup, Buchtext oder Playwright aendern. |
| Buchstelle | Kapitel 37 Glossar/Bedienlogik; querschnittlich fuer Fehlerbilder in Klickanleitungen |

## FIND-BC-GOV-017 Buchfaehige Klickanleitungen brauchen vier Evidence-Ebenen

| Feld | Wert |
|---|---|
| Status | erledigt als Struktur-/Buchregel ohne BC-Lauf |
| Projekt | fibu-book5 |
| Testfall | `GOVERNANCE-017-EVIDENCE-PACK-STANDARD` |
| Screenshot | keiner; Struktur-/Standard-Sync |
| Evidence | `playwright/projects/fibu-book5/EVIDENCE-PACK-STANDARD.md`, `playwright/projects/fibu-book5/evidence/governance-017/README.md` |
| BC-Seite | querschnittlich fuer grosse Prozessanleitungen |
| sichtbarer Text | nicht praktisch geprueft in diesem Lauf |
| Elementtyp | Evidence Pack / Screenshot-QA / technische Nachweisfuehrung |
| erste Hypothese | Eine grosse Klickanleitung ist erst final buchfaehig, wenn UI-Nachweis, technischer Page-/Table-Nachweis, fachlicher Prozesszustand und Posten-/Persistenznachweis zusammenpassen. |
| Recherchequelle | Projekt-Evidence, Page Inspection/Personalisierung/Bugfixing-Pattern und Blueprint-Review aus dem Nutzeranhang |
| Testergebnis | `EVIDENCE-PACK-STANDARD.md` wurde angelegt und in Coverage, Screenshot-QA, Artifact-Governance und Buchkapitel 37 verankert. |
| Entscheidung | Bestehende Laborpacks bleiben Labor, bis die vier Ebenen pro Prozess erfuellt sind. Kuenftige Prozess-Upgrades sollen die Tabelle `Page -> Table -> Fields -> Posting Result -> Evidence` nutzen. |
| Buchstelle | Kapitel 37 Glossar/Bedienlogik; querschnittlich fuer alle grossen Klickanleitungen |

## FIND-BC-GOV-012 Company-Autonomie braucht Registry und Instanzgrenze

| Feld | Wert |
|---|---|
| Status | erledigt als Governance-/Registry-Regel mit Live-UI-Nachweis |
| Projekt | fibu-book5 |
| Testfall | `GOVERNANCE-012`, ergaenzt durch `GOVERNANCE-013-COMPANY-LIST-READONLY` |
| Screenshot | `playwright/projects/fibu-book5/img/governance-013-010-companies-list-readonly.png` |
| BC-Seite | `Companies`, Page `357` |
| sichtbarer Text | `CRONUS USA, Inc.`, `My Company`, `RM-DEMO`, `Rhein-Main Demo GmbH`; geplant, aber nicht sichtbar: `RM-PROD`, `RM-SALES`, `RM-SERVICE`, `RM-SHARED`, `RM-AT` |
| Elementtyp | Governance / Company Registry / Sandbox-Grenze |
| erste Hypothese | Fuer mehr Lernfortschritt soll der Autopilot Companies innerhalb der Sandbox nutzen oder anlegen koennen. |
| Recherchequelle | Autopilot-Prompt V5/V6, `testdata/masterdata/companies.json`, Projekt-State und Gate-Dateien, `evidence/governance-013/` |
| Testergebnis | Company-Autonomie ist fachlich sinnvoll, aber nur instanzgebunden. `GOVERNANCE-013` hat die Companies-Liste read-only geoeffnet: sichtbar sind `CRONUS USA, Inc.`, `My Company` und `RM-DEMO`; die Zielcompanies sind noch nicht sichtbar und wurden nicht angelegt. |
| Entscheidung | `COMPANY-REGISTRY.md/json`, Gates, State, Coverage und Matrix wurden synchronisiert. Company-Aktionen sind nur innerhalb `MCP_1_20260210` mit Registry-Eintrag, Zweck, Risiko, Evidence-Plan und Rueckfalllogik erlaubt. Der Company-Nachweis ist erledigt; nach `FIXEDASSETS-014` liegt der aktuelle No-Approval-Fokus auf `FIXEDASSETS-015-MACHINES-ACCOUNT-MAPPING-DECISION`. |
| Buchstelle | Kapitel 18 Intercompany/Ausland, Kapitel 28 Migration/Opening Balances, Kapitel 39 Projektartefakte/Handover |

## FIND-BC-FA-014 HGB ist als AfA-Buch sichtbar, aber kein Anlagenprozess

| Feld | Wert |
|---|---|
| Status | erledigt als UI-first Labor-Setup-Proof |
| Projekt | fibu-book5 |
| Testfall | `FIXEDASSETS-014` |
| Screenshot | `playwright/projects/fibu-book5/img/fixedassets-014-020-depreciation-books-after-hgb.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/fixedassets-014/README.md`, `playwright/projects/fibu-book5/evidence/fixedassets-014/FIXEDASSETS-014-HGB-DEPRECIATION-BOOK-FIT.md`, `playwright/projects/fibu-book5/evidence/fixedassets-014/FIXEDASSETS-014-result.json` |
| BC-Seite | `Depreciation Books`, Page `5611` |
| sichtbarer Text / Werte | `HGB`, `HGB depreciation book` |
| Elementtyp | Setup-Fit / AfA-Buch / Buchbild-Kandidat |
| erste Hypothese | Nach `FIXEDASSETS-013` sollte genau ein kleiner UI-first Setup-Fit fuer `HGB` moeglich sein, ohne die weiteren Anlagenobjekte anzulegen. |
| Recherchequelle | `FIXEDASSETS-013`, `FIXEDASSETS-014`, Screenshot-Sichtpruefung |
| Testergebnis | `HGB` war vorher nicht sichtbar und wurde in `RM-DEMO` angelegt. Das Nachher-Bild zeigt Code und Beschreibung lesbar in der Liste. Keine Anlage, keine Anlagenbuchungsgruppe, kein Kreditor, keine Einkaufsrechnung, keine Aktivierung, keine AfA und keine Buchung wurden erzeugt. |
| Entscheidung | Kapitel 21 darf `HGB` jetzt als RM-DEMO-Labor-Prerequisite zeigen. `MACHINES`, `FA-CNC-01`, `K30000`, Zugang und AfA bleiben gesperrt; naechster Schritt ist eine Kontenmapping-Entscheidung fuer `MACHINES`, nicht sofort Setup. |
| Buchstelle | Kapitel 21 Anlagen / Fixed Assets |

Fuer Anfaenger ist das wichtig, weil ein AfA-Buch nur die Bewertungs-/Abschreibungsebene vorbereitet. Es macht eine Anlage noch nicht buchungsfaehig: Die Kontenfindung ueber Anlagenbuchungsgruppen, Anlagenkarte, Zugang und spaetere AfA brauchen eigene Nachweise.

## FIND-BC-FA-015 MACHINES darf nur als CRONUS-Laboralias von EQUIPMENT vorbereitet werden

| Feld | Wert |
|---|---|
| Status | erledigt als Account-Mapping-Decision ohne BC-Lauf |
| Projekt | fibu-book5 |
| Testfall | `FIXEDASSETS-015` |
| Evidence | `playwright/projects/fibu-book5/evidence/fixedassets-015/README.md`, `playwright/projects/fibu-book5/evidence/fixedassets-015/FIXEDASSETS-015-MACHINES-ACCOUNT-MAPPING-DECISION.md`, `playwright/projects/fibu-book5/evidence/fixedassets-015/FIXEDASSETS-015-result.json` |
| BC-Seite | kein neuer BC-Lauf; Entscheidung basiert auf `FA Posting Groups` aus `FIXEDASSETS-006` |
| sichtbarer Text / Werte | `EQUIPMENT`, `12210`, `82000`, `MACHINES` als Zielwert |
| Elementtyp | Anlagenbuchungsgruppe / Kontenfindung / Setup-Decision |
| erste Hypothese | Nach `HGB` koennte `MACHINES` als naechstes Setup-Objekt vorbereitet werden, aber nur wenn die Konten nicht geraten werden. |
| Recherchequelle | `FIXEDASSETS-006`, `FIXEDASSETS-014`, Microsoft Learn zu Fixed Assets Posting Groups und FA Posting Group Card |
| Testergebnis | `MACHINES` ist im Labor weiterhin nicht angelegt. Die naechste Anlage ist nur als enger UI-first Fit erlaubt: `MACHINES` wird als CRONUS-USA-Laboralias der bestehenden Gruppe `EQUIPMENT` vorbereitet. |
| Entscheidung | `FIXEDASSETS-016` darf nur `MACHINES` pruefen/anlegen und muss im Nachher-Bild Code plus relevante Konten zeigen. `FA-CNC-01`, `K30000`, Zugang, AfA und Buchung bleiben gesperrt. |
| Buchstelle | Kapitel 21 Anlagen / Fixed Assets |

Fuer Anfaenger ist das wichtig, weil die Anlagenbuchungsgruppe eine Kontenentscheidung ist. Wer `MACHINES` falsch anlegt, erzeugt spaeter falsche Sachposten. Deshalb ist die Reihenfolge: `HGB` AfA-Buch sichtbar, dann `MACHINES` Konten-Setup, dann erst Anlagenkarte, Kreditor/Zugang und AfA.

## FIND-BC-FA-016 MACHINES ist sichtbar, aber noch kein Anlagenprozess

| Feld | Wert |
|---|---|
| Status | erledigt als UI-first Labor-Setup-Proof |
| Projekt | fibu-book5 |
| Testfall | `FIXEDASSETS-016` |
| Screenshot | `playwright/projects/fibu-book5/img/fixedassets-016-020-fa-posting-groups-after-machines.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/fixedassets-016/README.md`, `playwright/projects/fibu-book5/evidence/fixedassets-016/FIXEDASSETS-016-MACHINES-FA-POSTING-GROUP-FIT.md`, `playwright/projects/fibu-book5/evidence/fixedassets-016/FIXEDASSETS-016-result.json` |
| BC-Seite | `FA Posting Group Card` |
| sichtbarer Text / Werte | `MACHINES`, `12210`, `82000` |
| Elementtyp | Anlagenbuchungsgruppe / Kontenfindung / Setup-Fit |
| erste Hypothese | Nach der Kontenentscheidung aus `FIXEDASSETS-015` kann `MACHINES` als kleinster naechster Setup-Baustein UI-first angelegt werden, wenn das Nachherbild Code und Konten zeigt. |
| Recherchequelle | `FIXEDASSETS-006`, `FIXEDASSETS-015`, praktischer Lauf `FIXEDASSETS-016`, Screenshot-Sichtpruefung |
| Testergebnis | `MACHINES` war vorher nicht sichtbar und wurde in `RM-DEMO` angelegt. Das Nachherbild zeigt `MACHINES` mit relevanten CRONUS-Kontenwerten `12210` und `82000`. Keine Anlage, kein Kreditor, keine Einkaufsrechnung, kein Zugang, keine AfA und keine Buchung wurden erzeugt. |
| Entscheidung | Kapitel 21 darf `MACHINES` jetzt als RM-DEMO-Labor-Prerequisite zeigen. `FA-CNC-01`, `K30000`, Zugang und AfA bleiben gesperrt; naechster Schritt ist eine Readiness-Entscheidung fuer die naechste Stammdaten-/Setup-Schicht. |
| Buchstelle | Kapitel 21 Anlagen / Fixed Assets |

Fuer Anfaenger ist das wichtig, weil `MACHINES` nicht die Maschine selbst ist. Es ist das Konto-Set, das Business Central spaeter bei Zugang, Abschreibung und Abgang verwendet. Erst wenn Anlage, Kreditor oder Zugangspfad ebenfalls belegt sind, darf ueber eine Anlagenbuchung nachgedacht werden.

## FIND-BC-FA-017 Nach HGB und MACHINES kommt zuerst die Anlagenkarte, nicht der Kreditor

| Feld | Wert |
|---|---|
| Status | erledigt als Readiness-Entscheidung ohne BC-Lauf |
| Projekt | fibu-book5 |
| Testfall | `FIXEDASSETS-017` |
| Evidence | `playwright/projects/fibu-book5/evidence/fixedassets-017/README.md`, `playwright/projects/fibu-book5/evidence/fixedassets-017/FIXEDASSETS-017-FA-CNC-01-SETUP-READINESS.md`, `playwright/projects/fibu-book5/evidence/fixedassets-017/FIXEDASSETS-017-result.json` |
| BC-Seite | kein neuer BC-Lauf; Entscheidung basiert auf `HGB` aus `FIXEDASSETS-014` und `MACHINES` aus `FIXEDASSETS-016` |
| sichtbarer Text / Werte | Zielwerte `FA-CNC-01`, `CNC Maschine FRA`, `HGB`, `MACHINES`, `K30000`, `120.000 EUR` |
| Elementtyp | Anlagen-Readiness / Stammdatenreihenfolge / Anfaengerfehler |
| erste Hypothese | Nach `HGB` und `MACHINES` koennte man direkt `K30000` oder eine Einkaufsrechnung vorbereiten. |
| Testergebnis | Die sichere Reihenfolge ist enger: zuerst `FA-CNC-01` als Anlagenkarte verstehen und belegen. Kreditor, Einkaufsrechnung, Zugang und AfA bleiben nachgelagert. |
| Entscheidung | Naechster Lauf ist `FIXEDASSETS-018-FA-CNC-01-CARD-PREFLIGHT`; kein `K30000`, kein Kaufbeleg, kein Zugang, keine AfA, keine Buchung. |
| Buchstelle | Kapitel 21 Anlagen / Fixed Assets |

Fuer Anfaenger ist das wichtig, weil eine Anlagenbuchung nicht mit dem Lieferanten beginnt. Business Central braucht zuerst ein belastbares Anlagenstammdatum. Das Buch soll daher zeigen, wo `FA-CNC-01` auf der Anlagenkarte gepflegt wird, welche Setup-Bezuege sichtbar sind und woran man erkennt, dass die Anlage bereit fuer den spaeteren Zugang ist.

## FIND-BC-FA-013 Fixed Assets darf mit `HGB` anfangen, aber nicht mit Anlage oder Kontenmapping

| Feld | Wert |
|---|---|
| Status | erledigt als Setup-Fit-Entscheidung ohne BC-Lauf |
| Projekt | fibu-book5 |
| Testfall | `FIXEDASSETS-013` |
| Evidence | `playwright/projects/fibu-book5/evidence/fixedassets-013/README.md`, `playwright/projects/fibu-book5/evidence/fixedassets-013/FIXEDASSETS-013-SETUP-FIT-DECISION.md`, `playwright/projects/fibu-book5/evidence/fixedassets-013/FIXEDASSETS-013-result.json` |
| BC-Seite | kein neuer BC-Lauf; Entscheidung basiert auf `Depreciation Book Card`, `FA Posting Group Card`, `Fixed Asset Card`, Vendor Template Dialog aus `FIXEDASSETS-012` |
| sichtbarer Text / Werte | `HGB`, `MACHINES`, `FA-CNC-01`, `K30000` als Zielwerte; in `FIXEDASSETS-012` noch nicht als fertige Zielcodes sichtbar |
| Elementtyp | Setup-Gate / Anlagen-Setup / AfA-Buch |
| erste Hypothese | Nach dem Formular-Preflight koennte ein kleiner Setup-Fit moeglich sein, aber nicht zwingend fuer alle Zielobjekte. |
| Recherchequelle | `FIXEDASSETS-009` bis `FIXEDASSETS-012`, Screenshot-Sichtpruefung, Microsoft Learn Fixed Assets Depreciation/Setup/Acquire |
| Testergebnis | `HGB` ist der kleinste unabhaengige naechste Setup-Fit-Kandidat, weil das AfA-Buch vor der Anlagenaktivierung steht und kein komplettes Sachkonto-Mapping verlangt. `MACHINES` bleibt wegen vieler Konto-Felder gesperrt, `FA-CNC-01` wegen fehlender Setup-Kette und `K30000` wegen unvollstaendig gemapptem Vendor-Template-/Kartenpfad. |
| Entscheidung | Naechster Lauf darf nur `FIXEDASSETS-014-HGB-DEPRECIATION-BOOK-FIT` sein: UI-first, idempotent, `HGB` pruefen/anlegen, Vorher/Nachher-Bild; keine Anlage, keine Anlagenbuchungsgruppe, kein Kreditor, keine Einkaufsrechnung, keine Buchung. |
| Buchstelle | Kapitel 21 Anlagen / Fixed Assets |

Fuer Anfaenger ist das wichtig, weil Business Central Anlagen in Schichten aufbaut: AfA-Buch, Kontenfindung, Anlagenkarte, Zugang und AfA. Ein kleines Setup-Objekt kann als naechster Lernschritt sinnvoll sein, waehrend die eigentliche Buchung noch klar gesperrt bleibt.

## FIND-BC-SHOT-001 Buchbild braucht sichtbaren fachlichen Pruefpunkt

| Feld | Wert |
|---|---|
| Status | erledigt als Screenshot-QA-/Workaround-Regel |
| Projekt | fibu-book5 |
| Testfall | `FIXEDASSETS-012` |
| Screenshot | `playwright/projects/fibu-book5/img/fixedassets-012-010-fa-posting-groups-new-preflight.png`, `playwright/projects/fibu-book5/img/fixedassets-012-020-depreciation-books-new-preflight.png`, `playwright/projects/fibu-book5/img/fixedassets-012-030-fixed-assets-new-preflight.png`, `playwright/projects/fibu-book5/img/fixedassets-012-040-vendors-new-preflight.png` |
| BC-Seite | FA Posting Group Card, Depreciation Book Card, Fixed Asset Card, Vendor Template Dialog |
| sichtbarer Text | leere Karten/Felder beziehungsweise Vendor-Templates; `MACHINES`, `HGB`, `FA-CNC-01`, `K30000` nicht sichtbar |
| Elementtyp | Screenshot-QA / Formular-Preflight / Buchbild-Grenze |
| erste Hypothese | Ein geoeffneter Formular- oder Template-Kontext koennte als ausreichender Buch-Screenshot fuer den naechsten Anlagen-Setup-Schritt wirken. |
| Recherchequelle | Sichtpruefung der `FIXEDASSETS-012`-Screenshots und Evidence |
| Testergebnis | Der Lauf beweist den Formular-/Template-Kontext und sichere Abbruchwege, aber nicht den fachlichen Zielzustand. Fuer Buchbilder muss das sichtbar sein, was der Leser lernen oder pruefen soll: Code, Name, Betrag, Status, Buchungsoption, Postenart, Konto, Dimension, Filter, Fehlermeldung, Reportzeile oder Dialogauswahl. |
| Entscheidung | `SCREENSHOT-QA.md`, `WORKAROUNDS-AND-ERRORS.md`, Coverage, Evidence und Testmetadaten wurden korrigiert. |
| Buchstelle | Kapitel 21 Anlagen; allgemeine Screenshot-QA fuer alle Kapitel |

## FIND-BC-FA-011 Setup-Gate-Entscheidung verlangt Formular-Preflight vor Datenanlage

| Feld | Wert |
|---|---|
| Status | erledigt als Governance-/Gate-Decision ohne BC-Lauf |
| Bereich | Fixed Assets / Anlagen-Setup |
| Evidence | `playwright/projects/fibu-book5/evidence/fixedassets-011/README.md`, `playwright/projects/fibu-book5/evidence/fixedassets-011/FIXEDASSETS-011-SETUP-GATE-DECISION.md`, `playwright/projects/fibu-book5/evidence/fixedassets-011/FIXEDASSETS-011-result.json` |
| BC-Seite | kein neuer BC-Lauf; Entscheidung basiert auf `FA Posting Groups`, `Depreciation Books`, `Fixed Assets`, `Vendors` aus `FIXEDASSETS-010` |
| sichtbarer Text / Werte | `MACHINES`, `HGB`, `FA-CNC-01`, `K30000`, `New/Neu` |
| Elementtyp | Setup-Gate / Formular-Preflight / Anfaengerfehler |
| erste Hypothese | Nach sichtbaren Zielseiten und sichtbarem `New/Neu` koennte der naechste Lauf direkt Stammdaten anlegen. |
| Recherchequelle | Evidence `fixedassets-009`, `fixedassets-010`, Gate-Datei und Autopilot-State; kein BC-Lauf |
| Testergebnis | Die Seitenkontexte sind belastbar, aber gescopte `New/Neu`-Formulare, Pflichtfelder, Defaults/Templates und sichere Abbruchwege sind noch nicht nachgewiesen. |
| Entscheidung | Kein Daten-Setup in `FIXEDASSETS-011`. Naechster Schritt ist `FIXEDASSETS-012-SCOPED-NEW-CARD-PREFLIGHT`: Formulare nur cancel-safe inspizieren, nichts speichern, keine Buchung. |
| Buchstelle | Kapitel 21 Anlagen / Fixed Assets |

Fuer Anfaenger ist das wichtig, weil ein sichtbarer `Neu`-Button nur die technische Anlageoption zeigt. Fachlich sicher wird die Anlage erst, wenn klar ist, welche Felder Pflicht sind, welche Vorlagen oder Defaults Business Central setzt und wie man ohne Datensatzanlage wieder abbricht.

## FIND-BC-FA-010 Setup-Preflight zeigt sichtbare Kontexte, aber kein Setup

| Feld | Wert |
|---|---|
| Status | erledigt als read-only UI-Preflight |
| Quelle | `FIXEDASSETS-010-SETUP-PREFLIGHT-READONLY` |
| Screenshot | `playwright/projects/fibu-book5/img/fixedassets-010-010-fa-posting-groups-preflight.png`, `playwright/projects/fibu-book5/img/fixedassets-010-020-depreciation-books-preflight.png`, `playwright/projects/fibu-book5/img/fixedassets-010-030-fixed-assets-preflight.png`, `playwright/projects/fibu-book5/img/fixedassets-010-040-vendors-preflight.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/fixedassets-010/README.md`, `playwright/projects/fibu-book5/evidence/fixedassets-010/FIXEDASSETS-010-SETUP-PREFLIGHT-READONLY.md`, `playwright/projects/fibu-book5/evidence/fixedassets-010/FIXEDASSETS-010-result.json` |
| BC-Seite | `FA Posting Groups`, `Depreciation Books`, `Fixed Assets`, `Vendors` |
| sichtbarer Text / Werte | `FA Posting Groups`, `Depreciation Books`, `Fixed Assets`, `Vendors`, `GOODWILL`, `COMPANY`, `MACHINES`, `HGB`, `FA-CNC-01`, `K30000` |
| Elementtyp | Setup-Preflight / Tabellenkontext / `New/Neu`-Aktionskandidat |
| erste Hypothese | Wenn die vier Setup-Kontexte sichtbar sind, kann ein naechster Agent direkt Zielobjekte anlegen. |
| Recherchequelle | praktischer Playwright-Lauf `npm run fibu:fixedassets:setup-preflight`, Evidence `fixedassets-010` |
| Testergebnis | Alle vier Kontexte sind read-only sichtbar. `MACHINES`, `HGB`, `FA-CNC-01` und `K30000` sind nicht sichtbar und wurden nicht angelegt. `New/Neu` ist sichtbar, aber bleibt ohne Setup-Gate tabu. Die breite Ansicht verbessert Tabellenbilder, beweist aber keinen Setup-Fit. |
| Entscheidung | Kapitel 21 kann den Preflight als Lern- und Kontrollschritt nutzen. Ein echter Setup-Fit braucht danach ein ausdrueckliches Gate und muss idempotent, UI-first und seitenbezogen arbeiten; Anlagenbuchung/AfA bleiben ein spaeteres separates Posting-Gate. |
| Buchstelle | Kapitel 21 Anlagen / Fixed Assets |

Fuer Anfaenger ist das wichtig, weil sichtbare Listen nur zeigen, wo eingerichtet wird. Buchungsfaehig wird eine Anlage erst, wenn Anlage, AfA-Buch, Anlagenbuchungsgruppe, Kreditor und Zugangspfad fachlich zusammenpassen.

## FIND-BC-FA-009 Fixed-Assets-Gate-Readiness ist noch kein Anlagen-Setup

| Feld | Wert |
|---|---|
| Status | erledigt als Gate-Readiness-Sync |
| Quelle | `FIXEDASSETS-009-SETUP-GATE-READINESS` |
| Screenshot | keine neuen Screenshots; nutzt vorhandene `fixedassets-004` bis `fixedassets-008` |
| Evidence | `playwright/projects/fibu-book5/evidence/fixedassets-009/README.md`, `playwright/projects/fibu-book5/evidence/fixedassets-009/FIXEDASSETS-009-SETUP-GATE-READINESS.md`, `playwright/projects/fibu-book5/evidence/fixedassets-009/FIXEDASSETS-009-result.json` |
| BC-Seite | nicht ausgefuehrt; konsolidiert Fixed Assets, FA Posting Groups, Depreciation Books, FA Classes, Vendors und Purchase Invoices aus vorhandener Evidence |
| sichtbarer Text / Werte | `FA-CNC-01`, `HGB`, `MACHINES`, `K30000`, `COMPANY`, `EQUIPMENT`, `12210`, `82000` |
| Elementtyp | Setup-Gate / Anlagenbuchhaltung / Evidence-Grenze |
| erste Hypothese | Nach mehreren sichtbaren Fixed-Assets-Seiten koennte ein Folge-Agent direkt `MACHINES`, `HGB`, `FA-CNC-01` oder `K30000` anlegen, obwohl die UI-Kontexte und fachlichen Mapping-Entscheidungen noch nicht freigegeben sind. |
| Recherchequelle | vorhandene Evidence `FIXEDASSETS-004` bis `FIXEDASSETS-008`, `GOVERNANCE-010`, `AUTOPILOT-STATE.json`, `POSTING-AND-SETUP-GATES.md`; kein BC-Lauf |
| Testergebnis | `FIXEDASSETS-009` formuliert eine Gate-Kette: zuerst `FIXEDASSETS-010-SETUP-PREFLIGHT-READONLY` fuer Seitenanker, Feldpositionen und gescopte New-/Card-Aktionen; erst danach ein freigegebener Setup-Fit; Aktivierung und AfA bleiben separate Posting-Gates. |
| Entscheidung | Das Buch behandelt Kapitel 21 weiter als Zielprozess, aber der aktuelle `RM-DEMO`-Stand ist nur Readiness. `MACHINES`, `HGB`, `FA-CNC-01` und `K30000` bleiben missing/not-proven; kein Setup und keine Buchung wurden ausgefuehrt. |
| Buchstelle | Kapitel 21 Anlagen / Fixed Assets |

Fuer Anfaenger ist das wichtig, weil Anlagenbuchhaltung mehrere Schichten hat: Anlagenkarte, AfA-Buch, Anlagenbuchungsgruppe, Kreditor oder Journalpfad, Preview/Preflight und Postenspur. Sichtbare Listen beweisen den Einstieg, aber nicht die Buchungsfaehigkeit.

## FIND-BC-GOV-010 No-Gate-Entscheidung ist keine Setup-Freigabe

| Feld | Wert |
|---|---|
| Status | erledigt als Governance-/State-Sync |
| Quelle | `GOVERNANCE-010-NEXT-NO-GATE-DECISION` |
| Screenshot | keine Screenshots; Governance-/State-Sync ohne BC-Lauf |
| Evidence | `playwright/projects/fibu-book5/evidence/governance-010/README.md`, `playwright/projects/fibu-book5/evidence/governance-010/GOVERNANCE-010-NEXT-NO-GATE-DECISION.md`, `playwright/projects/fibu-book5/evidence/governance-010/GOVERNANCE-010-result.json` |
| BC-Seite | nicht ausgefuehrt; State-/Gate-Dateien und Fixed-Assets-Evidence |
| sichtbarer Text / Werte | `FIXEDASSETS-009-SETUP-GATE-READINESS`, `FA-CNC-01`, `HGB`, `MACHINES`, `K30000` |
| Elementtyp | Governance-Regel / Setup-Gate-Readiness / Evidence-Grenze |
| erste Hypothese | Nach einem erledigten Buch-/Reporting-Sync koennte ein Folge-Agent direkt einen Anlagen-Setup- oder Buchungslauf starten, obwohl die Zielobjekte in `RM-DEMO` noch fehlen und Fixed Assets laut Gate-Datei gesperrt ist. |
| Recherchequelle | vorhandene Evidence `FIXEDASSETS-004` bis `FIXEDASSETS-008`, `AUTOPILOT-STATE.json`, `POSTING-AND-SETUP-GATES.md`, `BOOK-EVIDENCE-WORKPLAN.md`; kein BC-Lauf |
| Testergebnis | `GOVERNANCE-010` entscheidet ohne BC-Ausfuehrung: Der naechste No-Approval-Schritt ist nur `FIXEDASSETS-009-SETUP-GATE-READINESS`. Er darf ein enges UI-first Gate formulieren, aber noch keine Anlage, kein AfA-Buch, keine Anlagenbuchungsgruppe, keinen Kreditor und keine Buchung erzeugen. |
| Entscheidung | Projekt und Buch behandeln Fixed Assets als naechsten fachlichen Block, aber Setup und Buchung bleiben gatepflichtig. `GOVERNANCE-010` oeffnet kein Setup-Gate; es bereitet nur den naechsten sicheren Gate-Readiness-Lauf vor. |
| Buchstelle | Kapitel 21 Anlagen; Projekt-Governance |

Fuer Anfaenger ist das wichtig, weil Anlagenbuchhaltung in Business Central mehrere Einrichtungsschichten vor der ersten Buchung braucht. Sichtbare Seiten und eine gute Schrittfolge reichen nicht: Erst Stammdatum, AfA-Buch, Anlagenbuchungsgruppe, Kreditor oder Journalpfad, Vorschau/Preflight und Postenspur machen den Prozess buchungsfaehig.

## FIND-BC-BOOK-REPORTING-UAT-K25 Ziel-UAT ist kein RM-DEMO-Reportingbeweis

| Feld | Wert |
|---|---|
| Status | erledigt als Buch-/Evidence-Sync |
| Quelle | `BOOK-REPORTING-UAT-K25-SYNC`, `REPORTING-001` bis `REPORTING-014` |
| Screenshot | keine neuen Screenshots; Buch-Sync ohne BC-Lauf |
| Evidence | `playwright/projects/fibu-book5/evidence/book-reporting-uat-k25-sync/README.md`, `playwright/projects/fibu-book5/evidence/book-reporting-uat-k25-sync/BOOK-REPORTING-UAT-K25-SYNC.md`, `playwright/projects/fibu-book5/evidence/book-reporting-uat-k25-sync/BOOK-REPORTING-UAT-K25-SYNC-result.json` |
| BC-Seite | nicht ausgefuehrt; Buchstelle in Kapitel 25 |
| sichtbarer Text / Werte | `UAT-K25-001`, `RM-GUV-MONAT`, `SO-1001`, `PS-INV103297`, `Entry No. 792`, `PRODUCTLINE=MACHINE`, `CHANNEL=B2B` |
| Elementtyp | Buch-Zielbild / UAT-Akzeptanzkriterium / Evidence-Grenze |
| erste Hypothese | Die UAT-Tabelle in Kapitel 25 konnte trotz Evidence-Hinweis noch so gelesen werden, als seien `RM-GUV-MONAT`, `SO-1001` und die Financial-Reports-Summenwirkung bereits in `RM-DEMO` bewiesen. |
| Recherchequelle | vorhandene Reporting-Evidence `REPORTING-001` bis `REPORTING-014`; kein neuer BC-Lauf |
| Testergebnis | `UAT-K25-001` wurde als Ziel-UAT markiert. Die Tabelle trennt jetzt Zielvoraussetzung, Ziel-Testdaten und Ziel-Akzeptanzkriterium von aktuellem RM-DEMO-Gegenstand und aktuellem RM-DEMO-Nachweis. |
| Entscheidung | Kapitel 25 darf den finalen Reporting-UAT lehren, aber nicht als aktuellen Laborbeweis ausgeben. Belegt sind `PS-INV103297` und Artikelposten `792`; offen bleiben `RM-GUV-MONAT`, `SO-1001`, Financial-Reports-Summe, Power BI, deutsche `19 %` USt und deutscher Kontenplan. |
| Buchstelle | Kapitel 25 Reporting, Controlling, Finanzberichte und Power BI |

Fuer Anfaenger ist das wichtig, weil ein UAT-Fall immer Ziel, Voraussetzung, Testdaten, Ist-Nachweis und offene Luecke trennen muss. Sonst wirkt ein gutes Zielskript wie ein bestandener Test, obwohl Business Central die Reportingwirkung noch nicht gezeigt hat.

## FIND-BC-BOOK-O2C-FOUNDATION-DRIFT Reporting-Zielbild darf nicht als Laborbeweis gelesen werden

| Feld | Wert |
|---|---|
| Status | erledigt als Buch-/Evidence-Sync |
| Quelle | `BOOK-O2C-FOUNDATION-DRIFT-SYNC`, `GOVERNANCE-009`, `REPORTING-001` bis `REPORTING-014`, `UAT-O2C-001` |
| Screenshot | keine neuen Screenshots; Buch-Sync ohne BC-Lauf |
| Evidence | `playwright/projects/fibu-book5/evidence/book-o2c-foundation-drift-sync/README.md`, `playwright/projects/fibu-book5/evidence/book-o2c-foundation-drift-sync/BOOK-O2C-FOUNDATION-DRIFT-SYNC.md`, `playwright/projects/fibu-book5/evidence/book-o2c-foundation-drift-sync/BOOK-O2C-FOUNDATION-DRIFT-SYNC-result.json` |
| BC-Seite | nicht ausgefuehrt; Buchstellen in Kapitel 10/25 |
| sichtbarer Text / Werte | `PS-INV103297`, `Entry No. 792`, `PRODUCTLINE=MACHINE`, `CHANNEL=B2B`, `UAT-K25-001`, `SO-1001`, `RM-GUV-MONAT`, `19 %` |
| Elementtyp | Buch-Zielbild / Evidence-Grenze / Reporting-Governance |
| erste Hypothese | Die Reporting-Zielschritte koennen wie ein bereits bewiesener RM-DEMO-Finanzbericht gelesen werden, obwohl die Labor-Evidence bisher nur Beleg-/Artikelposten-Dimensionen und mehrere Reporting-Teil-/Negativbefunde zeigt. |
| Recherchequelle | vorhandene Evidence `masterdata-009`, `uat-o2c-001`, `reporting-001` bis `reporting-014`; kein neuer BC-Lauf |
| Testergebnis | Die zentrale O2C-Stelle war bereits weitgehend synchron. Zwei Reporting-nahe Buchstellen wurden ergaenzt: Die Prueftabelle in Kapitel 10 und die Loesung zu `UAT-K25-001` markieren nun Zielbild vs. RM-DEMO-Laborbeweis. |
| Entscheidung | Das Buch darf `PRODUCTLINE`/`CHANNEL` als Zielauswertung erklaeren, aber Financial-Reports-Summenwirkung, `SO-1001`, `RM-GUV-MONAT`, deutsche `19 %` USt und deutschen Finalnachweis nicht als erledigt ausgeben. |
| Buchstelle | Kapitel 10 Dimensionen/Reporting, Kapitel 25 Reporting/UAT |

Fuer Anfaenger ist das wichtig, weil Business Central Ziel-Reporting erst dann traegt, wenn Beleg, Posten, Dimensionen, Bericht/Analysis View und Filterwirkung zusammen nachgewiesen sind. Eine sichtbare Dimension am Artikelposten ist wertvolle Evidence, aber noch keine GuV-Summe nach Produktlinie.

## FIND-BC-GOV-009 Autonome Laborbuchung braucht neuen Evidence-Zweck

| Feld | Wert |
|---|---|
| Status | erledigt als Governance-/State-Sync |
| Quelle | `GOVERNANCE-009`, Autopilot V2.2, `POSTING-AND-SETUP-GATES.md` |
| Screenshot | keine neuen Screenshots; Governance-/State-Sync |
| Evidence | `playwright/projects/fibu-book5/evidence/governance-009/README.md`, `playwright/projects/fibu-book5/evidence/governance-009/GOVERNANCE-009-AUTONOMOUS-POLICY-SYNC.md`, `playwright/projects/fibu-book5/evidence/governance-009/GOVERNANCE-009-result.json` |
| BC-Seite | nicht ausgefuehrt; State-/Gate-Dateien |
| sichtbarer Text / Werte | `autonomousAllowed`, `autonomous-allowed`, `PS-INV103297`, `108219`, `INV008-899959`, `PAY011-PS103297` |
| Elementtyp | Governance-Regel / Laborbuchung / No-Repeat-Lock |
| erste Hypothese | Wenn ein Prompt autonome Laborbuchungen erlaubt, kann ein spaeterer Agent das als freie Wiederholungsbuchung lesen. Das wuerde Referenzbelege, offene Posten, Lagerwerte und Buchwahrheit verwischen. |
| Recherchequelle | vorhandene Projekt-Evidence und Gate-Matrix; kein BC-Lauf in `GOVERNANCE-009` |
| Testergebnis | `GOVERNANCE-009` fuellt `autonomousAllowed` im maschinenlesbaren State, koppelt diese Erlaubnis aber an `POSTING-AND-SETUP-GATES.md`, frischen UI-Preflight, neuen Evidence-Zweck und No-Repeat-Locks. |
| Entscheidung | Das Buch und die Projektregeln behandeln autonome Laborbuchungen als kontrollierten Lernmodus. Alte Referenzen wie `PS-INV103297`, `108219`, `INV008-899959` und `PAY011-PS103297` duerfen nicht erneut gebucht werden. |
| Buchstelle | Projekt-Governance, Kapitel 11 O2C, Kapitel 12 P2P, Kapitel 19/20 Payments, Kapitel 23 Inventory, Kapitel 39 Evidence Pack |

Fuer Anfaenger ist das wichtig, weil Business Central jede Buchung als neue fachliche Wahrheit speichert. In einer Sandbox darf man bewusst lernen und buchen, aber nur wenn Ziel, Preflight, Belegnummer, Postenspur und Grenzen dokumentiert sind.

## FIND-BC-TAX-002 VAT19-Gate-Kriterien sind kein Steuerbeleg

| Feld | Wert |
|---|---|
| Status | erledigt als Steuer-Gate-Readiness |
| Quelle | `TAX-002`, `TAX-001`, `GOVERNANCE-008` |
| Screenshot | keine neuen Screenshots; Governance-/Readiness-Sync |
| Evidence | `playwright/projects/fibu-book5/evidence/tax-002/README.md`, `playwright/projects/fibu-book5/evidence/tax-002/TAX-002-DE-VAT-GATE-READINESS.md`, `playwright/projects/fibu-book5/evidence/tax-002/TAX-002-result.json` |
| BC-Seite | nicht ausgefuehrt; State-/Gate-Dateien |
| sichtbarer Text / Werte | `VAT Business Posting Groups`, `VAT Product Posting Groups`, `VAT Posting Setup`, `Preview Posting`, `VAT Entries`, `0 %`, `19 %` |
| Elementtyp | Steuer-Gate / Evidence-Grenze / Buch-Lernfall |
| erste Hypothese | Ein sauberer Plan fuer VAT19 kann fuer Anfaenger so wirken, als sei die Steuer bereits bewiesen. Tatsaechlich beweist er nur, welche UI-Nachweise vor einem praktischen Steuerlauf erforderlich sind. |
| Recherchequelle | vorhandene Evidence `TAX-001`, `GOVERNANCE-008`, O2C/P2P-Laborbelege und `POSTING-AND-SETUP-GATES.md`; kein BC-Lauf in `TAX-002` |
| Testergebnis | `TAX-002` dokumentiert Freigabe- und Stop-Kriterien fuer einen spaeteren UI-first VAT19-Ziellauf. Es gab keine BC-Ausfuehrung, keine Setup-Aenderung, keine Buchung und keinen Company-Wechsel. |
| Entscheidung | Buch und Projekt duerfen `TAX-002` als Gate-Readiness nutzen, aber nicht als deutschen Steuerbeleg. Praktischer `TAX-002-DE-VAT-FIT` bleibt gesperrt und braucht eigene Freigabe. |
| Buchstelle | Kapitel 9 Posting Setup, Kapitel 11 O2C, Kapitel 12 P2P, Kapitel 22 Compliance/E-Rechnung |

Fuer Anfaenger ist das wichtig, weil Business Central Steuerlogik ueber mehrere Schichten nachweist: Gruppen, Setup-Zeile, Belegzeile, Vorschau und VAT Entries. Erst die sichtbare Kette macht aus einem Steuerziel einen belastbaren Nachweis.

## FIND-BC-GOV-008 VAT-Gate-Readiness ist noch kein VAT19-Setup

| Feld | Wert |
|---|---|
| Status | erledigt als Governance-/Readiness-Entscheidung |
| Quelle | `GOVERNANCE-008`, `TAX-001`, `REPORTING-014` |
| Screenshot | keine neuen Screenshots; Governance-/State-Sync |
| Evidence | `playwright/projects/fibu-book5/evidence/governance-008/README.md`, `playwright/projects/fibu-book5/evidence/governance-008/GOVERNANCE-008-result.json`, `playwright/projects/fibu-book5/evidence/governance-008/GOVERNANCE-008-NEXT-READINESS-DECISION.md` |
| BC-Seite | nicht ausgefuehrt; State-/Gate-Dateien |
| sichtbarer Text / Werte | `TAX-002-DE-VAT-GATE-READINESS`, `TAX-002-DE-VAT-FIT`, `0 %`, `19 %`, `VAT Entries` |
| Elementtyp | Governance-Regel / Steuer-Gate / Evidence-Grenze |
| erste Hypothese | Nach einem guten O2C-/P2P-Laborbeleg kann die Steuerwirkung zu schnell als fachlich erledigt wirken. Tatsaechlich beweisen CRONUS-USA-Belege mit `0 %` keine deutsche `19 %`-USt. |
| Recherchequelle | vorhandene Evidence `TAX-001`, `REPORTING-014`, `AUTOPILOT-STATE.json`, `POSTING-AND-SETUP-GATES.md`; kein BC-Lauf in `GOVERNANCE-008` |
| Testergebnis | `GOVERNANCE-008` entscheidet ohne BC-Lauf: Naechster No-Approval-Schritt ist nur die Vorbereitung der Freigabekriterien fuer deutschen VAT19. Der eigentliche `TAX-002-DE-VAT-FIT` bleibt gesperrt, bis er ausdruecklich freigegeben wird. |
| Entscheidung | Buch und Projekt duerfen die Gate-Readiness erklaeren, aber keine deutsche Steuerwirkung behaupten. Anfaenger sollen lernen: Steuer-Setup, Belegvorschau und VAT Entries sind eigene Nachweisschichten. |
| Buchstelle | Kapitel 9 Posting Setup, Kapitel 11 O2C, Kapitel 12 P2P, Kapitel 22 Compliance/E-Rechnung |

## FIND-BC-PAY-011 Zahlung erzeugt Ausgleich und Payment Discount

| Feld | Wert |
|---|---|
| Status | erledigt als Laborbuchung, Buch-/Evidence-Sync, Bankposten-read-only und Bankposten-Buch-Sync `PAYMENTS-014` |
| Quelle | `PAYMENTS-011`, `PAYMENTS-012`, `PAYMENTS-013`, `PAYMENTS-014` |
| Screenshot | `playwright/projects/fibu-book5/img/payments-011-060-customer-ledger-invoice-after-payment.png`, `playwright/projects/fibu-book5/img/payments-011-062-detailed-customer-ledger-payment.png`, `playwright/projects/fibu-book5/img/payments-011-064-gl-entries-payment.png`, `playwright/projects/fibu-book5/img/payments-013-020-page-372-document-no.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/payments-011/README.md`, `playwright/projects/fibu-book5/evidence/payments-011/PAYMENTS-011-result.json`, `playwright/projects/fibu-book5/evidence/payments-011/PAYMENTS-011-LAB-PAYMENT.md`, `playwright/projects/fibu-book5/evidence/payments-012/PAYMENTS-012-BOOK-SYNC.md`, `playwright/projects/fibu-book5/evidence/payments-013/PAYMENTS-013-result.json`, `playwright/projects/fibu-book5/evidence/payments-014/PAYMENTS-014-BANK-LEDGER-BOOK-SYNC.md` |
| BC-Seite | Cash Receipt Journal, Customer Ledger Entries, Detailed Customer Ledger Entries, G/L Entries, Bank Account Ledger Entries |
| sichtbarer Text / Werte | `PAY011-PS103297`, `PS-INV103297`, `Remaining Amount = 0,00`, `Applied Entries = 1`, `Payment Discount`, `Application`, `15110`, `18200`, `40910`, `BANK-RM-01`, `67.673,60`, `Entry No. 4995` |
| Elementtyp | Buchung / Postenspur / Zahlungsbedingung / Skonto |
| erste Hypothese | Eine Zahlung ist fuer Anfaenger oft nur eine Bankbewegung. Business Central erzeugt aber je nach Zahlungsbedingung zusaetzlich Ausgleichs- und Skonto-/Discount-Posten. |
| Testergebnis | `PAYMENTS-011` hat genau eine UI-first Laborzahlung gebucht. Die Rechnung ist im Debitorenposten ausgeglichen; Detailed Customer Ledger Entries zeigen `Initial Entry`, `Payment Discount` und `Application`; G/L Entries zeigen Forderung, Bankwirkung und Discounts. `PAYMENTS-013` zeigt Bank Account Ledger Entries ueber Page `372`; der alte Page-371-Pfad bleibt rejected. |
| Entscheidung | Kapitel 19/20 erklaeren Zahlung, Ausgleich, Skonto, Sachposten und Bankposten als unterschiedliche Nachweisschichten. Kapitel 20 ist seit `PAYMENTS-014` mit dem Page-372-Bankpostenpfad synchronisiert. Bankabstimmung bleibt ein separater Gate-Prozess. |
| Buchstelle | Kapitel 19 Debitoren, Kreditoren und OP-Ausgleich; Kapitel 20 Bank, Payments und Bankabstimmung |

Fuer Anfaenger ist das wichtig, weil die OP-Wahrheit nicht am Journal endet. Nach dem Buchen muss man Rechnung, Zahlungsbeleg, detaillierte Debitorenposten und Sachposten lesen: Erst dort sieht man, ob der Posten wirklich ausgeglichen ist und ob Skonto/Payment Discount gebucht wurde.

## FIND-BC-PAY-013 Bankposten liegen auf Page 372, nicht Page 371

| Feld | Wert |
|---|---|
| Status | erledigt als read-only Laborbefund |
| Quelle | `PAYMENTS-013` |
| Screenshot | `playwright/projects/fibu-book5/img/payments-013-020-page-372-document-no.png`, `playwright/projects/fibu-book5/img/payments-013-030-page-372-bank-account-no.png`, `playwright/projects/fibu-book5/img/payments-013-040-page-371-document-no-legacy.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/payments-013/README.md`, `playwright/projects/fibu-book5/evidence/payments-013/PAYMENTS-013-result.json`, `playwright/projects/fibu-book5/evidence/payments-013/PAYMENTS-013-BANK-LEDGER-READONLY.md` |
| BC-Seite | Bank Account Ledger Entries / Bankposten |
| sichtbarer Text / Werte | `PAY011-PS103297`, `BANK-RM-01`, `67.673,60`, `Entry No. 4995`, `Related G/L Entries`, `15110`, `18200`, `40910` |
| Elementtyp | Postenliste / Related Entries / UI-Pfad |
| erste Hypothese | Der vorherige Page-371-Pfad war die falsche oder nicht belastbare Zielseite fuer Bank Account Ledger Entries. |
| Recherchequelle | praktischer UI-Lauf `PAYMENTS-013`; kein Setup, keine API, keine Bankabstimmung |
| Testergebnis | Tell-Me zeigt `Bank Account Ledger Entries` als Kandidat. Page `372` mit Filter auf `Document No. = PAY011-PS103297` und auf `Bank Account No. = BANK-RM-01` zeigt den Bankposten. Page `371` bleibt als Legacy-Pfad rejected. |
| Entscheidung | Buch und Evidence-Pack erklaeren seit `PAYMENTS-014`: Bankwirkung in Sachposten ist nicht identisch mit Bankposten. Fuer den Bankposten-Nachweis wird Page `372` genutzt; Bankabstimmung bleibt offen und braucht ein eigenes Gate. |
| Buchstelle | Kapitel 20 Bank, Payments und Bankabstimmung |

Fuer Anfaenger ist das ein sauberer Bedienhinweis: Wenn ein Bankposten gesucht wird, muss die Seite wirklich `Bankposten / Bank Account Ledger Entries` zeigen. Ein technisch falscher Page-ID-Pfad kann leer wirken, obwohl die Buchung fachlich korrekt ist.

## FIND-BC-GOV-005 Autonom erlaubt ist kein Blind-Post

| Feld | Wert |
|---|---|
| Status | erledigt als Governance-Sync; `PAYMENTS-011` und `PAYMENTS-012` sind inzwischen erledigt |
| Quelle | `GOVERNANCE-005` |
| Screenshot | keine neuen Screenshots; Governance-/State-Sync |
| Evidence | `playwright/projects/fibu-book5/evidence/governance-005/GOVERNANCE-005-AUTONOMOUS-POSTING-POLICY-SYNC.md`, `playwright/projects/fibu-book5/evidence/governance-005/GOVERNANCE-005-result.json`, `playwright/projects/fibu-book5/evidence/governance-005/README.md` |
| BC-Seite | nicht ausgefuehrt; State-/Gate-Dateien |
| sichtbarer Text / Werte | `autonomous-allowed`, `PAYMENTS-011-LAB-PAYMENT`, `D10000`, `PS-INV103297`, `BANK-RM-01`, `Journal Check = 0 Issues` |
| Elementtyp | Governance-Regel / Buchungsfreigabe / Safety Gate |
| erste Hypothese | Autonome Laborbuchungen koennen nuetzlich sein, wenn jeder Lauf weiterkommen soll. Ohne harte Vorbedingungen wuerden sie aber Referenzbelege, OP-Status und Buchwahrheit verwischen. |
| Recherchequelle | Autopilot-V2.2-Prompt, `AUTOPILOT-STATE.json`, `POSTING-AND-SETUP-GATES.md`, vorhandene `PAYMENTS-001` bis `PAYMENTS-010` Evidence |
| Testergebnis | `GOVERNANCE-005` hat keinen BC-Lauf gestartet. Die Policy ist jetzt: `PAYMENTS-011` darf autonom laufen, aber nur fuer den bestehenden offenen Debitorenposten `D10000` / `PS-INV103297` und nur nach frischem UI-Preflight. |
| Entscheidung | Die Regel wurde in `PAYMENTS-011` angewendet und in `PAYMENTS-012` synchronisiert. Weitere Zahlungen brauchen einen neuen Zweck oder ein neues Gate; der naechste sinnvolle Payment-Schritt ist nur read-only Bank-Ledger-Klaerung. |
| Buchstelle | Kapitel 19/20 Payments und OP-Ausgleich; Projekt-Governance |

Fuer Anfaenger ist das wichtig, weil Business Central im Zahlungsjournal schnell einen `Post`-Dialog zeigt. Fachlich darf man ihn erst bestaetigen, wenn offener Posten, Bankkonto, Ausgleichsbezug, Betrag und Journal Check zusammenpassen.

## FIND-BC-SOURCES-001 Quellen sind keine RM-DEMO-Prozess-Evidence

| Feld | Wert |
|---|---|
| Status | erledigt als Buch-Sync; Quellen bleiben Referenz- und Zielbildschicht |
| Quelle | `SOURCES-001` |
| Screenshot | keine neuen Screenshots; Buch-/Readiness-Sync |
| Evidence | `playwright/projects/fibu-book5/evidence/sources-001/SOURCES-001-READINESS.md`, `playwright/projects/fibu-book5/evidence/sources-001/SOURCES-001-result.json`, `playwright/projects/fibu-book5/evidence/sources-001/README.md` |
| BC-Seite | nicht ausgefuehrt; Kapitel 40 Quellenverzeichnis |
| sichtbarer Text / Werte | Microsoft Learn, amtliche Quellen, Vendor-Dokumentation, gestrichener Shopify-Scope, Projekt-Evidence |
| Elementtyp | Quellenregel / Evidence-Grenze / Scope-Grenze |
| erste Hypothese | Ein Quellenverweis kann so wirken, als sei der fachliche Prozess bereits praktisch bewiesen. Tatsaechlich erklaert eine Quelle nur Regel, Zielbild oder Recherchepfad; der Projektbeweis braucht konkrete RM-DEMO-Evidence. |
| Recherchequelle | vorhandenes Quellenverzeichnis, `ARTIFACTS-001`, `LEARNPATH-001`, `MB800-001`, `SCOPE-001`, Autopilot-State und Gates; kein Live-URL-Audit in diesem Lauf |
| Testergebnis | `SOURCES-001` hat Kapitel 40 ohne BC-Lauf synchronisiert. Quellen sind jetzt als Standardreferenz, amtliche Steuer-/Compliance-Quelle, optionale Vendor-Dokumentation, gestrichener Scope-Hinweis oder konkrete Projekt-Evidence eingeordnet. |
| Entscheidung | Kapitel 40 trennt Quellen, Labor-Evidence und deutschen Finalnachweis. `Q10` Shopify bleibt nur Out-of-Scope-Marker. `PAYMENTS-012`, `REPORTING-011` und `REPORTING-012` sind inzwischen erledigt; naechster sicherer Entscheidungsblock ist `GOVERNANCE-008-NEXT-READINESS-DECISION`. |
| Buchstelle | Kapitel 40 Quellenverzeichnis |

Fuer Anfaenger ist das wichtig, weil eine gute Quelle Orientierung gibt, aber nicht zeigt, was im eigenen Mandanten wirklich eingerichtet, geklickt, gebucht oder blockiert war.

## FIND-BC-ARTIFACTS-001 Projektartefakte sind keine BC-Prozess-Evidence

| Feld | Wert |
|---|---|
| Status | erledigt als Buch-Sync; Artefakte bleiben Kontroll- und Uebergabeschicht |
| Quelle | `ARTIFACTS-001` |
| Screenshot | keine neuen Screenshots; Buch-/Readiness-Sync |
| Evidence | `playwright/projects/fibu-book5/evidence/artifacts-001/ARTIFACTS-001-READINESS.md`, `playwright/projects/fibu-book5/evidence/artifacts-001/ARTIFACTS-001-result.json`, `playwright/projects/fibu-book5/evidence/artifacts-001/README.md` |
| BC-Seite | nicht ausgefuehrt; Kapitel 39 Zielbild |
| sichtbarer Text / Werte | Fit-Gap-Matrix, Prozessaufnahme, Stammdaten-Template, Migration-Mapping, UAT-Testfall, Klickanleitungs-Template, Rollen-/Berechtigungsmatrix, ADR, Checklisten, Evidence Pack |
| Elementtyp | Projektartefakt / Template / Handover / Evidence-Grenze |
| erste Hypothese | Ein Template oder Handover-Dokument kann so wirken, als sei der Nachweis bereits erbracht. Tatsaechlich ist es nur die Struktur, in die echte BC-Evidence eingeordnet wird. |
| Recherchequelle | vorhandenes Evidence-Modell, Autopilot-State, Gates, Coverage, UI-Inventar und Kapitel 39; keine neue Microsoft-Learn-Behauptung in diesem Lauf |
| Testergebnis | `ARTIFACTS-001` hat Kapitel 39 ohne BC-Lauf synchronisiert. Artefakte werden jetzt als Kontroll- und Uebergabeschicht erklaert, nicht als Prozess-, Screenshot-, Buchungs- oder deutscher Finalnachweis. |
| Entscheidung | Kapitel 39 trennt Templates, Handover und echte Evidence. `SOURCES-001`, `PAYMENTS-012`, `REPORTING-011` und `REPORTING-012` sind inzwischen erledigt; naechster sicherer Entscheidungsblock ist `GOVERNANCE-008-NEXT-READINESS-DECISION`. |
| Buchstelle | Kapitel 39 Projektartefakte |

Fuer Anfaenger ist das wichtig, weil eine gute Vorlage zwar sagt, was zu pruefen ist, aber noch nicht zeigt, dass Business Central den Prozess wirklich mit den richtigen Daten, Feldern, Posten und Berichten getragen hat.

## FIND-BC-PAGESINDEX-001 Seitenindex ist kein Prozessnachweis

| Feld | Wert |
|---|---|
| Status | erledigt als Buch-Sync; praktische Klickpfade bleiben nur dort abgedeckt, wo konkrete Evidence und Screenshots existieren |
| Quelle | `PAGESINDEX-001` |
| Screenshot | keine neuen Screenshots; Buch-/Readiness-Sync |
| Evidence | `playwright/projects/fibu-book5/evidence/pagesindex-001/PAGESINDEX-001-READINESS.md`, `playwright/projects/fibu-book5/evidence/pagesindex-001/PAGESINDEX-001-result.json`, `playwright/projects/fibu-book5/evidence/pagesindex-001/README.md` |
| BC-Seite | nicht ausgefuehrt; Kapitel 38 Zielbild |
| sichtbarer Text / Werte | Seitenindex, Prozesskatalog, Reifegradmatrix, Screenshot-QA, Coverage, vorhandene O2C-/P2P-/Inventory-/Payments-/Reporting-Evidence |
| Elementtyp | Seitenindex / Prozesskatalog / Evidence-Grenze |
| erste Hypothese | Ein Indexeintrag oder eine hohe Reifegradbewertung darf nicht so wirken, als sei der jeweilige Prozess praktisch getestet, gebucht und final nachgewiesen. |
| Recherchequelle | vorhandenes UI-Inventar, Coverage, Screenshot-QA, Autopilot-State und Gates; keine neue Microsoft-Learn-Behauptung in diesem Lauf |
| Testergebnis | `PAGESINDEX-001` hat Kapitel 38 ohne BC-Lauf synchronisiert. Der Prozesskatalog ist jetzt Zielbild und Steuerungsrahmen, nicht Sammelbeweis fuer alle Business-Central-Prozesspfade. |
| Entscheidung | Kapitel 38 trennt jetzt Index, Zielpfad, QA-Rahmen, echte Klickpfad-Evidence, Labor-Nachweis und offenen deutschen Finalnachweis. `SOURCES-001`, `PAYMENTS-012`, `REPORTING-011` und `REPORTING-012` sind inzwischen erledigt; naechster sicherer Entscheidungsblock ist `GOVERNANCE-008-NEXT-READINESS-DECISION`. |
| Buchstelle | Kapitel 38 Seitenindex, Prozesskatalog und Qualitaetssicherung |

Fuer Anfaenger ist das wichtig, weil ein Buchindex beim Finden hilft, aber nicht beweist, dass der Prozess in Business Central schon richtig eingerichtet, gebucht, kontrolliert und mit Postenspur verstanden wurde.

## FIND-BC-GLOSSARY-001 Glossarbegriffe sind keine Klickpfad-Evidence

| Feld | Wert |
|---|---|
| Status | erledigt als Buch-Sync; praktische Klickpfade bleiben nur dort abgedeckt, wo konkrete Evidence existiert |
| Quelle | `GLOSSARY-001` |
| Screenshot | keine neuen Screenshots; Buch-/Readiness-Sync |
| Evidence | `playwright/projects/fibu-book5/evidence/glossary-001/GLOSSARY-001-READINESS.md`, `playwright/projects/fibu-book5/evidence/glossary-001/GLOSSARY-001-result.json`, `playwright/projects/fibu-book5/evidence/glossary-001/README.md` |
| BC-Seite | nicht ausgefuehrt; Kapitel 37 Zielbild |
| sichtbarer Text / Werte | deutsche Buchbegriffe, englische Such-/UI-Begriffe, Tell-Me, vorhandene O2C-/P2P-/Inventory-/Reporting-/Payment-Evidence |
| Elementtyp | Glossar / Suchhilfe / Evidence-Grenze |
| erste Hypothese | Ein Glossarbegriff darf nicht so wirken, als sei der zugehoerige BC-Klickpfad bereits praktisch getestet. |
| Recherchequelle | vorhandenes UI-Inventar, Coverage und Evidence; keine neue Microsoft-Learn-Behauptung in diesem Lauf |
| Testergebnis | `GLOSSARY-001` hat Kapitel 37 ohne BC-Lauf synchronisiert. Begriffe werden als Buchsprache, englische Suchhilfe, praktisch belegter UI-Pfad oder offener Zielbegriff eingeordnet. |
| Entscheidung | Kapitel 37 trennt jetzt Terminologie, Tell-Me-Suchhilfe und echte Klickpfad-Evidence. Der naechste sichere Block wurde mit `PAGESINDEX-001` erledigt; jetzt ist Kapitel 39 Projektartefakte/Handover/Repo-QA der sichere Folgeblock. |
| Buchstelle | Kapitel 37 Glossar Deutsch / Englisch / Tell-Me |

Fuer Anfaenger ist das wichtig, weil Business Central in deutscher Zielumgebung, englischer Laboroberflaeche und Tell-Me-Suche unterschiedliche Begriffe zeigen kann. Das Glossar hilft beim Finden, ersetzt aber keinen belegten Klickpfad mit Screenshot, Feldpruefung und Evidence.

## FIND-BC-EXAMTRAINING-001 Pruefungstraining ist kein bestandener Test

| Feld | Wert |
|---|---|
| Status | erledigt als Buch-Sync; praktische Pruefungssimulation und Zertifizierung bleiben ausserhalb dieses Nachweises |
| Quelle | `EXAMTRAINING-001` |
| Screenshot | keine neuen Screenshots; Buch-/Readiness-Sync |
| Evidence | `playwright/projects/fibu-book5/evidence/examtraining-001/EXAMTRAINING-001-READINESS.md`, `playwright/projects/fibu-book5/evidence/examtraining-001/EXAMTRAINING-001-result.json`, `playwright/projects/fibu-book5/evidence/examtraining-001/README.md` |
| BC-Seite | nicht ausgefuehrt; Kapitel 36 Zielbild |
| sichtbarer Text / Werte | MB-800-Pruefungsfallen, Kapitel 34/35, O2C `PS-INV103297`, P2P `108219`, Inventory `INV008-899959`, Payments Readiness, Reporting Teil-/Negativbefund |
| Elementtyp | Pruefungstraining / Readiness / Gate-Grenze |
| erste Hypothese | Kapitel 36 darf nicht so wirken, als sei eine Pruefungssimulation abgeschlossen oder eine MB-800-Pruefung bestanden, nur weil typische Fallen erklaert sind. |
| Recherchequelle | Microsoft Learn Study Guide fuer Exam MB-800: https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/mb-800 |
| Testergebnis | `EXAMTRAINING-001` hat Kapitel 36 ohne BC-Lauf synchronisiert. Die Fallen werden als Denkmodelle gegen vorhandene Evidence eingeordnet: Welche Seite, Einrichtung, Belegart, Postenart und Laborgrenze ist betroffen |
| Entscheidung | Kapitel 36 trennt jetzt Pruefungsvorbereitung, Pruefungssimulation, Zertifizierung, Labor-Evidence und deutsche Finalnachweise. Praktische Uebungs- oder Pruefungslaeufe bleiben an das passende Prozess-/Setup-/Posting-Gate gebunden. |
| Buchstelle | Kapitel 36 MB-800-Pruefungstraining |

Fuer Anfaenger ist das wichtig, weil richtige Antworten in Business Central aus Unterscheidungen entstehen: Oberflaeche vs. Rechte, Beleg vs. Posten, Nebenbuch vs. Hauptbuch, Setup-Matrix vs. Steuermatrix, Laborbefund vs. deutscher Finalnachweis.

## FIND-BC-LEARNPATH-001 Lernpfad-Mapping ist kein absolvierter Lernpfad

| Feld | Wert |
|---|---|
| Status | erledigt als Buch-Sync; praktische Lern-/Pruefungsabnahme bleibt Folgearbeit |
| Quelle | `LEARNPATH-001` |
| Screenshot | keine neuen Screenshots; Buch-/Readiness-Sync |
| Evidence | `playwright/projects/fibu-book5/evidence/learnpath-001/LEARNPATH-001-READINESS.md`, `playwright/projects/fibu-book5/evidence/learnpath-001/LEARNPATH-001-result.json`, `playwright/projects/fibu-book5/evidence/learnpath-001/README.md` |
| BC-Seite | nicht ausgefuehrt; Kapitel 35 Zielbild |
| sichtbarer Text / Werte | Microsoft Learn Training Browse, MB-800 Study Guide, Business Central business functionality, O2C `PS-INV103297`, P2P `108219`, Inventory `INV008-899959` |
| Elementtyp | Lernpfad-Mapping / Readiness / Gate-Grenze |
| erste Hypothese | Kapitel 35 darf nicht so wirken, als seien Microsoft-Learn-Module abgeschlossen oder alle Lernfelder praktisch final belegt, nur weil sie auf Buchkapitel gemappt sind. |
| Recherchequelle | Microsoft Learn Training Browse: https://learn.microsoft.com/de-de/training/browse/expanded=dynamics-365&products=dynamics-business-central; MB-800 Study Guide: https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/mb-800; Business functionality: https://learn.microsoft.com/en-us/dynamics365/business-central/across-business-functionality |
| Testergebnis | `LEARNPATH-001` hat Kapitel 35 ohne BC-Lauf synchronisiert. Die Lernpfad-Landkarte verbindet offizielle Quellen, Buchkapitel und vorhandene Evidence. O2C, P2P und Inventory sind Laboranker; Payments, Reporting und Gate-Themen bleiben Readiness, Teilbefund oder Buch-Sync. |
| Entscheidung | Kapitel 35 trennt jetzt Lernlandkarte, absolvierte Learn-Module, Zertifizierung, deutsche Finalnachweise und praktische Prozessnachweise. Naechster sicherer Block ohne Gate ist Kapitel 36 als Pruefungstraining-Sync. |
| Buchstelle | Kapitel 35 Microsoft-Learn-Lernpfad-Mapping |

Fuer Anfaenger ist das wichtig, weil ein Lernpfad Orientierung gibt, aber nicht automatisch Kompetenz beweist. Kompetenz entsteht erst, wenn Einrichtung, Klickpfad, Beleg, Postenspur, Fehlerfall und Bericht praktisch verstanden und im passenden Mandanten nachgewiesen sind.

## FIND-BC-MB800-001 Kompetenzmatrix ist kein Zertifizierungsnachweis

| Feld | Wert |
|---|---|
| Status | erledigt als Buch-Sync; praktische Kompetenz- und Pruefungsvorbereitung bleibt Folgearbeit |
| Quelle | `MB800-001` |
| Screenshot | keine neuen Screenshots; Buch-/Readiness-Sync |
| Evidence | `playwright/projects/fibu-book5/evidence/mb800-001/MB800-001-READINESS.md`, `playwright/projects/fibu-book5/evidence/mb800-001/MB800-001-result.json`, `playwright/projects/fibu-book5/evidence/mb800-001/README.md` |
| BC-Seite | nicht ausgefuehrt; Kapitel 34 Zielbild |
| sichtbarer Text / Werte | MB-800 Skill Areas, O2C `PS-INV103297`, P2P `108219`, Inventory `INV008-899959`, Payments Readiness, Reporting Teil-/Negativbefund |
| Elementtyp | Zertifizierungs-Readiness / Kompetenzmatrix / Gate-Grenze |
| erste Hypothese | Kapitel 34 darf nicht so wirken, als sei durch Buchstruktur und Labor-Evidence bereits eine bestandene MB-800-Pruefung oder vollstaendige praktische Kompetenzabdeckung bewiesen. |
| Recherchequelle | Microsoft Learn Study Guide fuer Exam MB-800: https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/mb-800 |
| Testergebnis | `MB800-001` hat Kapitel 34 ohne BC-Lauf synchronisiert. Die Matrix ordnet offizielle Skill-Areas gegen vorhandene Evidence ein. O2C, P2P und Inventory sind starke Laborbelege; Payments, Reporting und mehrere Governance-/Setup-Bereiche bleiben Readiness, Teilbefund oder Gate-Folgearbeit. |
| Entscheidung | Kapitel 34 trennt jetzt Lernabdeckung, Evidence-Stand, deutsche Finalnachweise und Zertifizierungs-/Pruefungserfolg. Praktische MB-800-Uebungslaeufe bleiben an das passende Prozess-/Setup-/Posting-Gate gebunden. |
| Buchstelle | Kapitel 34 MB-800-Kompetenzmatrix |

Fuer Anfaenger ist das wichtig, weil eine Zertifizierungsmatrix Orientierung gibt, aber keine Praxisleistung ersetzt. Erst wenn Aufgabe, Einrichtung, Beleg, Postenspur, Fehlerfall, Bericht und Wiederholung belastbar funktionieren, entsteht Kompetenznachweis.

## FIND-BC-TRAIN-001 Uebungsloesung ist kein praktischer Prozessnachweis

| Feld | Wert |
|---|---|
| Status | erledigt als Buch-Sync; praktische Uebungsausfuehrung gate-/prozessabhaengig |
| Quelle | `TRAINING-001` |
| Screenshot | keine neuen Screenshots; Buch-/Readiness-Sync |
| Evidence | `playwright/projects/fibu-book5/evidence/training-001/TRAINING-001-READINESS.md`, `playwright/projects/fibu-book5/evidence/training-001/TRAINING-001-result.json`, `playwright/projects/fibu-book5/evidence/training-001/README.md` |
| BC-Seite | nicht ausgefuehrt; Kapitel 33 Zielbild |
| sichtbarer Text / Werte | Uebungen und Loesungen, O2C `PS-INV103297`, P2P `108219`, Inventory `INV008-899959`, Payments Readiness, Reporting Teil-/Negativbefund |
| Elementtyp | Training-Readiness / Loesungsbibliothek / Gate-Grenze |
| erste Hypothese | Kapitel 33 darf nicht so wirken, als seien alle Uebungen praktisch geloest, nur weil Musterloesungen formuliert sind. |
| Testergebnis | `TRAINING-001` hat Kapitel 33 ohne BC-Lauf synchronisiert. O2C, P2P und Inventory sind als CRONUS-USA-Labormuster nutzbar; Payments und Reporting bleiben Readiness beziehungsweise Teil-/Negativbefund. Es gab keine neue praktische Uebung, keine Schulungsabnahme, keine Setup-Aenderung und keine Buchung. |
| Entscheidung | Kapitel 33 trennt jetzt Trainingsbibliothek, belastbare Labormuster und offene Final-/Gate-Nachweise. Praktische Uebungslaeufe bleiben an das jeweils passende Prozess-/Setup-/Posting-Gate gebunden. |
| Buchstelle | Kapitel 33 Uebungen und Loesungen |

Fuer Anfaenger ist das wichtig, weil eine Loesung mehr ist als ein Klickrezept. Eine belastbare Business-Central-Uebung muss zeigen, welche Einrichtung vorausgesetzt wird, welche Felder zu pflegen sind, welche Posten entstehen, welcher Bericht das Ergebnis beweist und wie typische Fehler fachlich korrigiert werden.

## FIND-BC-UAT-001 UAT-Bibliothek ist kein bestandener Gesamt-UAT

| Feld | Wert |
|---|---|
| Status | erledigt als Buch-Sync; praktische UAT-Ausfuehrung gate-/prozessabhaengig |
| Quelle | `UAT-001` |
| Screenshot | keine neuen Screenshots; Buch-/Readiness-Sync |
| Evidence | `playwright/projects/fibu-book5/evidence/uat-001/UAT-001-READINESS.md`, `playwright/projects/fibu-book5/evidence/uat-001/UAT-001-result.json`, `playwright/projects/fibu-book5/evidence/uat-001/README.md` |
| BC-Seite | nicht ausgefuehrt; Kapitel 32 Zielbild |
| sichtbarer Text / Werte | Master-UAT, UAT-001 bis UAT-020, O2C `PS-INV103297`, P2P `108219`, Inventory `INV008-899959`, Payments Readiness, Reporting Teil-/Negativbefund |
| Elementtyp | UAT-Readiness / Gate-Grenze |
| erste Hypothese | Kapitel 32 darf nicht so wirken, als seien alle UAT-Faelle bestanden, nur weil einzelne Laborprozesse bereits Evidence besitzen. |
| Recherchequelle | vorhandene Labor-Evidence und Microsoft Learn Testing Strategy |
| Testergebnis | `UAT-001` hat Kapitel 32 ohne BC-Lauf synchronisiert. O2C, P2P und Inventory sind als CRONUS-USA-Laborbausteine nutzbar; Payments, Reporting und mehrere Folgeprozesse bleiben Readiness, Teilbefund oder Gate-Folgearbeit. Es gab keinen Gesamt-UAT, keinen Fachbereichs-Sign-off, keine Setup-Aenderung und keine Buchung. |
| Entscheidung | Kapitel 32 trennt jetzt Zielbibliothek, Labor-Evidence und Finalnachweis. Praktische UAT-Laeufe bleiben an das jeweils passende Prozess-/Setup-/Posting-Gate gebunden. |
| Buchstelle | Kapitel 32 UAT-Testbibliothek |

Fuer Anfaenger ist das wichtig, weil ein UAT-Fall mehr ist als ein Screenshot oder ein einzelner gruener Test. Erst Testziel, Testdaten, erwarteter Nachweis, tatsaechliches Ergebnis, Abweichung, Fehlerbehandlung und Sign-off machen aus Labor-Evidence eine belastbare Abnahme.

## FIND-BC-SA-001 Solution-Architect-Readiness ist keine Architekturentscheidung

| Feld | Wert |
|---|---|
| Status | erledigt als Buch-Sync; praktische Architekturentscheidung/ADR gate-gesperrt |
| Quelle | `SOLUTIONARCHITECT-001` |
| Screenshot | keine neuen Screenshots; Buch-/Readiness-Sync |
| Evidence | `playwright/projects/fibu-book5/evidence/solutionarchitect-001/SOLUTIONARCHITECT-001-READINESS.md`, `playwright/projects/fibu-book5/evidence/solutionarchitect-001/SOLUTIONARCHITECT-001-result.json`, `playwright/projects/fibu-book5/evidence/solutionarchitect-001/README.md` |
| BC-Seite | nicht ausgefuehrt; Kapitel 31 Zielbild |
| sichtbarer Text / Werte | Standard-first, Fit-Gap, Extension/AppSource/Custom, Architecture Decision Record, UAT, Rollback, Betriebsfolge |
| Elementtyp | Solution-Architecture-Readiness / Gate-Grenze |
| erste Hypothese | Kapitel 31 darf nicht so wirken, als sei durch die Laborbelege bereits eine produktive Architekturentscheidung, Extension-Empfehlung oder Customizing-Freigabe entstanden. |
| Testergebnis | `SOLUTIONARCHITECT-001` hat Kapitel 31 gegen den aktuellen Laborstand synchronisiert. Es gab keinen BC-Lauf, keine AL-/Extension-Entwicklung, keine AppSource-Installation, kein API-/Connector-/Power-Platform-/Power-BI-Setup, keine produktive Architekturentscheidung, keine Setup-Aenderung und keine Buchung. |
| Entscheidung | Kapitel 31 trennt jetzt Entscheidungsrahmen und Umsetzung. Praktische Architekturentscheidungen bleiben Gate-Folgearbeit mit `SOLUTIONARCHITECT-002-ARCHITECTURE-DECISION-OR-ADR`. |
| Buchstelle | Kapitel 31 Business Central Solution Architect Pfad |

Fuer Anfaenger ist das wichtig, weil Architektur nicht bedeutet, Standardgrenzen sofort technisch zu umgehen. Ein Solution Architect muss zuerst Standardnachweis, Fit-Gap, Risiko, UAT, Owner, Rollback und Betriebsfolge dokumentieren. Erst danach wird entschieden, ob Standard, Setup, Prozessdesign, Extension oder Custom wirklich richtig ist.

## FIND-BC-OPS-001 Operations-Readiness ist kein eingerichtetes Monitoring

| Feld | Wert |
|---|---|
| Status | erledigt als Buch-Sync; praktische Operations-/Monitoring-Linie gate-gesperrt |
| Quelle | `OPERATIONS-001` |
| Screenshot | keine neuen Screenshots; Buch-/Readiness-Sync |
| Evidence | `playwright/projects/fibu-book5/evidence/operations-001/OPERATIONS-001-READINESS.md`, `playwright/projects/fibu-book5/evidence/operations-001/OPERATIONS-001-result.json`, `playwright/projects/fibu-book5/evidence/operations-001/README.md` |
| BC-Seite | nicht ausgefuehrt; Kapitel 30 Zielbild |
| sichtbarer Text / Werte | `Aufgabenwarteschlangenposten (Job Queue Entries)`, Telemetrie/Application Insights, Admin Center, Support Owner, Hypercare-Protokoll |
| Elementtyp | Operations-/Monitoring-/Hypercare-Readiness / Gate-Grenze |
| erste Hypothese | Kapitel 30 darf nicht so wirken, als sei Betrieb schon bewiesen, nur weil Job Queue, Telemetrie oder Admin Center als Begriffe bekannt sind. |
| Testergebnis | `OPERATIONS-001` hat Kapitel 30 gegen den aktuellen Laborstand synchronisiert. Es gab keinen BC-Lauf, keine Job Queue, keinen Monitoring-Connector, keine Telemetrie-/Admin-Aenderung, keine Produktivumgebung und keine Buchung. |
| Entscheidung | Kapitel 30 trennt jetzt Betriebszielbild und Laborstatus. Praktisches Operations-Setup bleibt Gate-Folgearbeit mit `OPERATIONS-002-JOB-QUEUE-OR-MONITORING-SETUP`. |
| Buchstelle | Kapitel 30 Betrieb, Monitoring und Hypercare |

Fuer Anfaenger ist das wichtig, weil Betrieb nicht bedeutet, irgendwo eine Admin-Seite zu oeffnen. Ein belastbarer Betriebsnachweis braucht Fehlerbild, Uhrzeit, Company, Benutzer, Job-/Integrationskontext, Telemetrie- oder Log-Hinweis, Support Owner, Massnahme und Nachtest.

## FIND-BC-INT-001 Integrations-Readiness ist keine eingerichtete Integration

| Feld | Wert |
|---|---|
| Status | erledigt als Buch-Sync; praktische Setup-/Connector-Linie gate-gesperrt |
| Quelle | `INTEGRATIONS-001` |
| Screenshot | keine neuen Screenshots; Buch-/Readiness-Sync |
| Evidence | `playwright/projects/fibu-book5/evidence/integrations-001/INTEGRATIONS-001-READINESS.md`, `playwright/projects/fibu-book5/evidence/integrations-001/INTEGRATIONS-001-result.json`, `playwright/projects/fibu-book5/evidence/integrations-001/README.md` |
| BC-Seite | nicht ausgefuehrt; Kapitel 29 Zielbild |
| sichtbarer Text / Werte | `Extension Management`, `Microsoft AppSource Apps`, `Web Services`, `API Setup`, Power Platform, Power BI, UAT, Rollback, Support Owner |
| Elementtyp | Integrations-/Extension-Readiness / Gate-Grenze |
| erste Hypothese | Kapitel 29 darf nicht so wirken, als sei eine Integration durch einen sichtbaren Menuepunkt oder eine schnelle Extension-Installation bereits bewiesen. |
| Testergebnis | `INTEGRATIONS-001` hat Kapitel 29 gegen den aktuellen Laborstand synchronisiert. Es gab keinen BC-Lauf, keine Extension, keine AppSource-App, kein API-/Web-Service-Setup, keinen Connector, kein Power-Platform-/Power-BI-Setup, keinen produktiven Datenaustausch und keine Buchung. |
| Entscheidung | Kapitel 29 trennt jetzt Standardnachweis, Fit-Gap, AppSource/Extension, API/Web Services, Power Platform, Power BI, UAT, Rollback und Betrieb. Praktische Integration bleibt Gate-Folgearbeit mit `INTEGRATIONS-002-SETUP-OR-CONNECTOR`. |
| Buchstelle | Kapitel 29 Integrationen |

Fuer Anfaenger ist das wichtig, weil Integration schnell nach Technik klingt. In Business Central ist sie aber ein pruefbarer Prozess: Datenquelle, Zielsystem, Authentifizierung, Mapping, Berechtigungen, Fehlerfall, Monitoring, Support und Rollback muessen zusammenpassen. Ein sichtbarer Einstieg ist nur Orientierung, kein Integrationsnachweis.

## FIND-BC-SCOPE-001 Shopify ist aus Buch-5-Lernscope gestrichen

| Feld | Wert |
|---|---|
| Status | erledigt als Scope-Entscheidung |
| Projekt | fibu-book5 |
| Testfall | `SCOPE-001` |
| Screenshot | keine BC-Screenshots; Scope-/Buchentscheidung |
| Evidence | `playwright/projects/fibu-book5/evidence/scope-001/SCOPE-001-SHOPIFY-REMOVAL.md`, `playwright/projects/fibu-book5/evidence/scope-001/SCOPE-001-result.json` |
| BC-Seite | nicht zutreffend |
| sichtbarer Text | Shopify/Online Store war im Buch und in Testdaten als aktiver Prozess enthalten |
| Elementtyp | Scope / Buchplanung / Testdatenmodell |
| erste Hypothese | Shopify erzeugt einen eigenen Connector-/Integrationsscope und lenkt vom aktuellen UI-first Business-Central-Lernpfad ab. |
| Recherchequelle | Projektentscheidung vom 08.06.2026 und Buch-/Backlog-Sync |
| Testergebnis | Kapitel 17, Backlog, Testdaten und Datenluecken wurden auf Dropshipping/Sonderverkauf umgestellt. `WEB-24001`, `CHANNEL=SHOP` und Shopify-Klickpfade sind kein aktives Ziel mehr. |
| Entscheidung | Shopify/Online Store ist out of scope. Dropshipping bleibt als BC-Standardprozess ohne Connector-Scope erhalten. |
| Buchstelle | Kapitel 17, Kapitel 1/3/7/10/25/29/38 |

Bewertung:

Fuer Anfaenger ist das wichtig, weil Shopify nicht nur eine BC-Seite ist, sondern Connector, Mapping, Integration und Payment-Provider-Logik nach sich zieht. Das aktuelle Buchprojekt soll zuerst die BC-Standardprozesse ueber UI-Klickpfade lernen.

## FIND-BC-FA-001 Anlagenkapitel braucht Zielwertabgleich vor Setup und Buchung

| Feld | Wert |
|---|---|
| Status | erledigt als Zielwert- und Buch-Sync; praktische Anlagen-Setup-/Buchungslinie offen |
| Projekt | fibu-book5 |
| Testfall | `FIXEDASSETS-001` |
| Screenshot | `playwright/projects/fibu-book5/img/fixedassets-001-010-fixed-assets-tell-me.png`, `playwright/projects/fibu-book5/img/fixedassets-001-040-fa-ledger-entries-tell-me.png`, `playwright/projects/fibu-book5/img/fixedassets-002-010-anlagen-tell-me.png`, `playwright/projects/fibu-book5/img/fixedassets-002-030-anlagenbuchungsgruppen-tell-me.png`, `playwright/projects/fibu-book5/img/fixedassets-003-010-fixed-assets-list.png`, `playwright/projects/fibu-book5/img/fixedassets-003-020-depreciation-books.png`, `playwright/projects/fibu-book5/img/fixedassets-003-040-purchase-invoices.png`, `playwright/projects/fibu-book5/img/fixedassets-003-050-fa-ledger-entries.png`, `playwright/projects/fibu-book5/img/fixedassets-004-010-fixed-asset-fa-cnc-01.png`, `playwright/projects/fibu-book5/img/fixedassets-004-020-depreciation-book-hgb.png`, `playwright/projects/fibu-book5/img/fixedassets-004-030-fa-posting-groups-tell-me.png`, `playwright/projects/fibu-book5/img/fixedassets-004-040-vendor-k30000.png`, `playwright/projects/fibu-book5/img/fixedassets-004-050-purchase-invoices-entry-path.png`, `playwright/projects/fibu-book5/img/fixedassets-005-010-fa-posting-groups-tell-me.png`, `playwright/projects/fibu-book5/img/fixedassets-005-020-fa-posting-groups-result.png`, `playwright/projects/fibu-book5/img/fixedassets-006-010-fa-posting-groups-accounts.png`, `playwright/projects/fibu-book5/img/fixedassets-007-010-depreciation-books.png`, `playwright/projects/fibu-book5/img/fixedassets-007-021-fixed-asset-classes-result.png` |
| BC-Seite | Tell-Me / Seiten und Aufgaben |
| sichtbarer Text | `Fixed Assets`, `FA Ledger Entries`; danach deutsche Suchpfade `Anlagen`, `AfA`, `Anlagenbuchungsgruppen`, `Einkaufsrechnungen`, `Anlagenposten` als Candidate; `FIXEDASSETS-003` oeffnet Anlagenliste, AfA-Buecher, Einkaufsrechnungen und Anlagenposten direkt |
| Elementtyp | Tell-Me / Suchpfad / Anlagen-Readiness |
| erste Hypothese | Das Anlagenkapitel darf nicht direkt mit Anlagenkarte, Aktivierung oder AfA starten, bevor Zielwerte und robuste Seitenpfade geklaert sind. |
| Recherchequelle | praktischer Playwright-Lauf `npm run fibu:fixedassets:readiness` |
| Testergebnis | `FIXEDASSETS-001` hat nur read-only Tell-Me-Evidence erzeugt. `FIXEDASSETS-002` hat deutsche/BC-nahe Suchpfade als Candidate belegt und den Betragswiderspruch nachgewiesen: Kapitel 21 nennt `120.000 EUR`, `resources-assets-projects.json` enthielt `250.000`. Da Kapitel 21 mehrfach konsistent `120.000 EUR` verwendet, wurde die Testdatendatei auf `120000` harmonisiert. `FIXEDASSETS-003` oeffnet direkte Zielseiten read-only: Anlagenliste `5601`, AfA-Buecher `5611`, Einkaufsrechnungen `9308` und Anlagenposten `5604` sind labor-candidate; FA Posting Groups ueber Page-ID `5606` ist rejected. `FIXEDASSETS-004` zeigt danach gefiltert: `FA-CNC-01`, `HGB`, `MACHINES` und `K30000` sind nicht sichtbar; `Purchase Invoices` ist erreichbar. `FIXEDASSETS-005` klaert den UI-Pfad: Tell-Me zeigt `FA Posting Groups`, der Klick erreicht die Seite, vorhandene CRONUS-Gruppen und Kontenspalten sind sichtbar, `MACHINES` fehlt weiter. `FIXEDASSETS-006` liest die vorhandenen Konten read-only: `EQUIPMENT = 12210/82000`, `GOODWILL = 11300`, `PLANT = 12110/81000`, `PROPERTY = 12130/81000`, `VEHICLES = 12230/82000`. `FIXEDASSETS-007` liest AfA-Buecher und Anlagenklassen read-only: `COMPANY = Company Book` ist sichtbar, `HGB` nicht; `FA Classes` zeigt `FINANCIAL`, `INTANGIBLE`, `TANGIBLE`. Keine Anlage, keine Einkaufs-/Aktivierungsbuchung, keine AfA und keine Anlagenposten fuer `FA-CNC-01` wurden angelegt. |
| Entscheidung | Zielbetrag ist harmonisiert und mehrere Zielseiten sind erreichbar. FA Posting Groups, vorhandene CRONUS-Konten, Depreciation Books und FA Classes sind belastbar gelesen; `FIXEDASSETS-008` hat Kapitel 21 mit einer Status-/Setup-Checkliste synchronisiert. Die Zielobjekte fehlen weiter im Labor. Ohne Gate bleibt der Anlagenblock fuer Setup und Buchung gesperrt. Mit Gate kann spaeter ein idempotenter UI-Setup-Fit fuer `HGB`, `MACHINES`, `FA-CNC-01` und `K30000` geplant werden; keine Aktivierung oder AfA ohne eigenen Buchungsfreigabe-Lauf. |
| Buchstelle | Kapitel 21 Anlagenbuchhaltung |

Bewertung:

Fuer Anfaenger ist das wichtig, weil Anlagenbuchhaltung mehrere Einrichtungsebenen kombiniert: Anlagenkarte, AfA-Buch, Anlagenbuchungsgruppe, Zugangsbuchung und spaeter AfA. Ein sichtbarer Tell-Me-Treffer oder eine direkt geoeffnete Liste ist nur ein Einstieg, kein Beweis, dass der Prozess fachlich eingerichtet oder buchungsbereit ist.

## FIND-BC-TAX-001 CRONUS-USA-Sales-Tax ist kein deutscher VAT19-Nachweis

| Feld | Wert |
|---|---|
| Status | erledigt als Buch-/Evidence-Sync; praktischer DE-Finallauf offen |
| Projekt | fibu-book5 |
| Testfall | `TAX-001` |
| Screenshot | keine neuen Screenshots; nutzt vorhandene O2C-/P2P-/Tax-Evidence |
| Evidence | `playwright/projects/fibu-book5/evidence/tax-001/TAX-001-DE-VAT-READINESS.md`, `playwright/projects/fibu-book5/evidence/tax-001/TAX-001-result.json` |
| BC-Seite | Sales Order, Purchase Order, Posted Sales Invoice, Posted Purchase Invoice, VAT/Tax Posting Setup |
| sichtbarer Text | `PS-INV103297`, `108219`, `Tax Group Code = FURNITURE`, `taxPercent = 0`, `totalTaxAmount = 0`, `VAT Calculation Type = Sales Tax` |
| Elementtyp | Steuer-Setup / Laborgrenze / Buchziel |
| erste Hypothese | CRONUS-USA-Steuerfelder koennen Bedienpfade und Laborbuchungen tragen, beweisen aber keine deutsche `19 %`-USt. |
| Recherchequelle | vorhandene Evidence `045-target-vs-labor-delta.md`, `080-posting-result.json`, `100-purchase-posting-result.json`, `MICROSOFT-DOC-VALIDATION.md`; Microsoft Learn zu VAT Setup und Sales Tax |
| Testergebnis | O2C und P2P sind gebucht, aber beide Laborbelege haben Steuerbetrag `0`. Die vorhandene Steuergruppe `FURNITURE` ist ein CRONUS-USA-Laborfit. Fuer deutsche `19 %` braucht es einen eigenen VAT-Ziellauf mit VAT Business/Product Posting Groups, VAT Posting Setup, Preview und VAT Entries. |
| Entscheidung | Buch und Projektstatus trennen jetzt klar: aktueller Laborlauf beweist Prozessbedienung und Postenspur, nicht deutschen VAT19-Endstand. Praktischer DE-VAT-Fit bleibt freigabepflichtig. |
| Buchstelle | Kapitel 9, 11, 12 und 22 |

Bewertung:

Das ist ein zentraler Einsteigerbefund. Wer `Tax Group Code`, `VAT Posting Setup` oder Steuerfelder sieht, darf daraus nicht automatisch `19 %` deutsche USt ableiten. Im Buch muss der Leser lernen, dass Steuerlogik eine eigene Einrichtungsschicht ist: Partnerlogik, Produktlogik, Setup-Matrix, Belegvorschau und USt-Posten muessen zusammenpassen.

## FIND-BC-POST-001 Postenspur ist eine Kette, kein einzelner Beleg

| Feld | Wert |
|---|---|
| Status | erledigt als Buch-/Evidence-Sync |
| Projekt | fibu-book5 |
| Testfall | `POSTING-TRACE-001`, `POSTING-TRACE-002` |
| Screenshot | vorhandene Bilder aus `uat-o2c-001`, `p2p-001`, `inventory-008` |
| Evidence | `playwright/projects/fibu-book5/evidence/posting-trace-001/POSTING-TRACE-LEARNING-ATLAS.md`, `playwright/projects/fibu-book5/evidence/posting-trace-002/POSTING-TRACE-BOOK-SYNC.md` |
| BC-Seite | Posted Sales Invoice, Posted Purchase Invoice, Customer/Vendor Ledger Entries, G/L Entries, Item Ledger Entries, Value Entries, Inventory Valuation |
| sichtbarer Text | `PS-INV103297`, `108219`, `INV008-899959`, `14140`, `Entry No. 792`, `Entry No. 793`, `Total Inventory Value = 67.000,00` |
| Elementtyp | Postenspur / Evidence Pack / Anfaengererklaerung |
| erste Hypothese | Lernende verstehen Buchungen besser, wenn jede Postenart als Antwort auf eine eigene Frage erklaert wird. |
| Recherchequelle | vorhandene Playwright-Evidence `UAT-O2C-001`, `UAT-P2P-001`, `INVENTORY-008` |
| Testergebnis | Die gebuchten Laborbelege zeigen unterschiedliche Postenketten: O2C erzeugt Debitoren-, Sach-, Wert- und Artikelposten; P2P erzeugt Kreditoren-, Sach-, Wert- und Artikelposten; Inventory Journal erzeugt Artikel-, Wert- und Sachposten sowie Lagerbewertungswirkung. |
| Entscheidung | Buch ergaenzt: Postenspur wird als Lernkette aus Beleg, Nebenbuch, Sachposten, Artikelposten, Wertposten und Bericht erklaert. `POSTING-TRACE-002` hat Kapitel 11 zusaetzlich auf vorhandene O2C-Screenshotpfade, erfolgreiche Preview nach `MASTERDATA-009`, Laborbuchung `PS-INV103297` und Kontrollfragen fuer Anfaenger synchronisiert. Laborgrenzen bleiben sichtbar: keine deutsche `19 %` USt, keine deutschen Kontenplan-Endstaende, keine Reporting-Summe nach `PRODUCTLINE`/`CHANNEL`. |
| Buchstelle | Kapitel 9, 11, 12, 13, 19, 23, 25 |

Bewertung:

Dieser Befund macht aus vorhandenen Screenshots Unterrichtsmaterial. Der Leser soll nicht nur sehen, dass nach dem Buchen viele Listen entstehen, sondern verstehen, welche Liste welche Kontrollfrage beantwortet.

## FIND-BC-PAY-008 Post-Button ist noch keine Zahlung, erst der Dialog entscheidet

| Feld | Wert |
|---|---|
| Status | erledigt als UI-only Buchungsdialog-Readiness; echte Zahlung offen |
| Projekt | fibu-book5 |
| Testfall | `PAYMENTS-010` |
| Screenshot | `playwright/projects/fibu-book5/img/payments-010-030-post-dialog-before-cancel.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/payments-010/PAYMENTS-010-result.json`, `playwright/projects/fibu-book5/evidence/payments-010/PAYMENTS-010-POSTING-READINESS.md`, `playwright/projects/fibu-book5/evidence/payments-010/PAYMENTS-EVIDENCE-PACK-SYNC.md` |
| BC-Seite | Cash Receipt Journals |
| sichtbarer Text | `Post`, `Ja`, `Nein`, `Journal Check`, `0 Issues Total` |
| Elementtyp | Zahlungsjournal / Buchungsdialog / Sicherheitsabbruch |
| erste Hypothese | Nach `Journal Check = 0 Issues` und Apply-Readiness ist die naechste riskante Schwelle nicht die Sichtbarkeit von `Post`, sondern die Bestaetigung im Dialog. |
| Recherchequelle | praktischer UI-only Playwright-Lauf `npm run fibu:payments:posting-readiness`; `playwright/projects/fibu-book5/evidence/payments-010/README.md` |
| Testergebnis | `PAYMENTS-010` bereitet den Cash-Receipt-Draft fuer `D10000`/`PS-INV103297`/`BANK-RM-01` erneut vor, bestaetigt `Journal Check = 0 Issues`, oeffnet `Apply Entries` read-only und klickt danach `Post` nur bis zum Bestaetigungsdialog. Business Central zeigt `Ja`/`Nein`; der Test klickt `Nein`, loescht den Draft und bucht nichts. |
| Entscheidung | Buch ergaenzen: Ein sichtbarer `Post`-Button ist noch keine Zahlung. Fuer Einsteiger muss der Bestaetigungsdialog als letzte Sicherheitsgrenze erklaert werden. `PAYMENTS-EVIDENCE-PACK-SYNC.md` ordnet die Kette von offenem Posten bis Post-Dialog als Lernpfad; `PAYMENTS-011` hat die echte Laborzahlung inzwischen genau einmal ausgefuehrt und darf nicht wiederholt werden. |
| Buchstelle | Kapitel 19 Debitoren/Kreditoren und Kapitel 20 Bank/Payments |

Bewertung:

Dieser Befund ist didaktisch stark, weil er Angst und Sorglosigkeit gleichzeitig korrigiert: `Post` anzuklicken kann einen Dialog oeffnen, aber die eigentliche Buchung entsteht erst durch die Bestaetigung. Fuer das Buch ist wichtig, dass Lernende den Unterschied zwischen Vorpruefung, Dialog und finaler Buchung sehen.

## FIND-BC-PAY-007 Apply Entries im Zahlungsjournal ist ein Readiness-Pfad, noch kein Ausgleich

| Feld | Wert |
|---|---|
| Status | erledigt als UI-only Apply-/Preview-Readiness; Folgefund `FIND-BC-PAY-008` erledigt |
| Projekt | fibu-book5 |
| Testfall | `PAYMENTS-009` |
| Screenshot | `playwright/projects/fibu-book5/img/payments-009-010-cash-receipt-apply-preview-readiness.png`, `playwright/projects/fibu-book5/img/payments-009-020-apply-entries-readonly.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/payments-009/PAYMENTS-009-result.json`, `playwright/projects/fibu-book5/evidence/payments-009/PAYMENTS-009-APPLY-PREVIEW-READINESS.md` |
| BC-Seite | Cash Receipt Journals / Apply Entries |
| sichtbarer Text | `D10000`, `PS-INV103297`, `Amount to Apply`, `Remaining Amount`, `Journal Check`, `0 Issues Total`, `Post`, `OK` |
| Elementtyp | Zahlungsjournal / Apply Entries / Ausgleichsbezug |
| erste Hypothese | Wenn `Applies-to Doc. Type` und `Applies-to Doc. No.` im Draft gesetzt sind, sollte Business Central den offenen Rechnungsbezug im Apply-Entries-Kontext anzeigen, ohne dass dadurch schon ein gebuchter OP-Ausgleich entsteht. |
| Recherchequelle | praktischer UI-only Playwright-Lauf `npm run fibu:payments:apply-preview-readiness`; `playwright/projects/fibu-book5/evidence/payments-009/README.md` |
| Testergebnis | `PAYMENTS-009` bereitet den Cash-Receipt-Draft fuer `D10000`/`PS-INV103297`/`BANK-RM-01` erneut vor, bestaetigt `Journal Check = 0 Issues`, oeffnet `Apply Entries` read-only und zeigt den Rechnungs-/Betragskontext. Sichtbare Aktionen wie `Post`/`OK` wurden nicht ausgefuehrt. `Preview Posting` war im Cash Receipt Journal nicht direkt sichtbar. Der Draft wurde geloescht; keine Zahlung, kein Ausgleich, keine Bankabstimmung. |
| Entscheidung | Buch ergaenzen: `Apply Entries` ist ein Kontroll- und Zuordnungskontext. Das Oeffnen der Seite ist noch kein Ausgleich; erst Buchungs-/Apply-Aktionen erzeugen Zahlungs-, Bank- oder Ausgleichsposten. Vor einer Laborzahlung braucht es einen separaten Freigabecheck fuer Buchungsdialog und Preview-Risiko. |
| Buchstelle | Kapitel 19 Debitoren/Kreditoren und Kapitel 20 Bank/Payments |

Bewertung:

Dieser Befund ist fuer Anfaenger besonders wichtig, weil Business Central riskante Aktionen im selben Kontext zeigt, in dem auch harmlose Kontrolle stattfindet. Das Buch muss daher sprachlich sauber trennen: Rechnungsbezug pruefen, Apply Entries ansehen, aber `Post`, `OK`, `Set Applies-to ID` oder `Post Application` nur ausfuehren, wenn genau dieser Schritt freigegeben ist.

## FIND-BC-PAY-005 Bank Account Posting Group blockiert Zahlungsjournal nach Amount-Fix

| Feld | Wert |
|---|---|
| Status | erledigt durch `PAYMENTS-007`; Folgefund `FIND-BC-PAY-006` offen |
| Projekt | fibu-book5 |
| Testfall | `PAYMENTS-006`, `PAYMENTS-007` |
| Screenshot | `playwright/projects/fibu-book5/img/payments-006-010-cash-receipt-amount-validation.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/payments-006/PAYMENTS-006-result.json`, `playwright/projects/fibu-book5/evidence/payments-006/PAYMENTS-006-AMOUNT-VALIDATION.md`, `playwright/projects/fibu-book5/evidence/payments-007/PAYMENTS-007-result.json` |
| BC-Seite | Cash Receipt Journals |
| sichtbarer Text | `BANK-RM-01`, `Journal Check`, `1 Issues Total`, `Bank Account Posting Group` |
| Elementtyp | Zahlungsjournal / Bankkonto-Posting-Fit / Journal Check |
| erste Hypothese | Nach korrekter Amount-Eingabe prueft BC den Balance Account. Ein Bankkonto ohne Bank Account Posting Group ist als Gegenkonto im Zahlungsjournal noch nicht buchungsreif. |
| Recherchequelle | praktischer UI-only Playwright-Lauf `npm run fibu:payments:cash-receipt-amount-validation`; `playwright/projects/fibu-book5/evidence/payments-006/README.md` |
| Testergebnis | Rohzahl `-68000` erzeugt den bekannten Amount-Fehler. Lokales Format `-68.000,00` loest die Amount-Validierung zwischenzeitlich. Nach `Refresh` meldet Journal Check in `PAYMENTS-006`: `'Bank Account Posting Group' ist nicht vorhanden. Identifizierende Felder und Werte: Code=''`. `PAYMENTS-007` fittet `BANK-RM-01 = CHECKING`; dieser Fehler ist danach weg. Es wurde keine Zahlung und kein Ausgleich gebucht. |
| Entscheidung | Buch ergaenzen: Zahlungsjournal-Preflight prueft nicht nur Debitor, Betrag und Rechnung, sondern auch den Bankkonto-Posting-Fit. `BANK-RM-01 = CHECKING` ist im CRONUS-Labor erledigt, aber der Zahlungsjournal-Preflight bleibt wegen Amount-Issue gesperrt. |
| Buchstelle | Kapitel 19 Debitoren/Kreditoren und Kapitel 20 Bank/Payments |

Bewertung:

Das ist ein sehr praktischer Anfaengerbefund. Ein Bankkonto kann in der Liste existieren und als Gegenkonto auswaehlbar sein, aber trotzdem noch keine tragfaehige Kontenfindung fuer die Zahlungsbuchung besitzen. Der Journal Check macht diese fehlende Einrichtung sichtbar, bevor echte Bank- und Debitorenposten entstehen.

## FIND-BC-PAY-006 Amount bleibt Journal-Check-Blocker nach Bankkonto-Fit

| Feld | Wert |
|---|---|
| Status | erledigt als UI-Amount-/Journal-Check-Lernfall; Folgefund `FIND-BC-PAY-007` erledigt |
| Projekt | fibu-book5 |
| Testfall | `PAYMENTS-007`, `PAYMENTS-008` |
| Screenshot | `playwright/projects/fibu-book5/img/payments-007-020-cash-receipt-journal-after-bank-fit.png`, `playwright/projects/fibu-book5/img/payments-008-010-cash-receipt-amount-field-diagnosis.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/payments-007/PAYMENTS-007-result.json`, `playwright/projects/fibu-book5/evidence/payments-007/PAYMENTS-007-BANK-POSTING-FIT.md`, `playwright/projects/fibu-book5/evidence/payments-008/PAYMENTS-008-result.json`, `playwright/projects/fibu-book5/evidence/payments-008/PAYMENTS-008-AMOUNT-FIELD-DIAGNOSIS.md` |
| BC-Seite | Cash Receipt Journals |
| sichtbarer Text | `BANK-RM-01`, `Amount ($)`, `Journal Check`, `1 Issues Total`, `Amount` |
| Elementtyp | Zahlungsjournal / Amount-Feld / Journal Check |
| erste Hypothese | Nach geloestem Bankkonto-Fit trifft der UI-Draft noch nicht stabil das fachlich relevante `Amount`-Feld oder BC validiert die Zeile erst nach anderer Feld-/Spalteninteraktion. |
| Recherchequelle | praktische UI-only Playwright-Laeufe `npm run fibu:payments:bank-posting-fit` und `npm run fibu:payments:amount-field-diagnosis`; `playwright/projects/fibu-book5/evidence/payments-008/README.md` |
| Testergebnis | `BANK-RM-01` traegt persistiert `Bank Acc. Posting Group = CHECKING`; der alte Bank-Posting-Group-Fehler ist weg. `PAYMENTS-008` zeigt in breiter Ansicht `Amount = -68.000,00` und `Amount ($) = -67.673,60`. Nach `Refresh` zeigt `Journal Check` `1 Lines checked`, `0 Lines with issues`, `0 Issues Total` und `No issues found`. Entwurf wurde geloescht; keine Zahlung, kein Ausgleich. |
| Entscheidung | Buch ergaenzen: Betragsspalte und `Amount ($)` unterscheiden, lokalen Betrag nach Fokus/Refresh pruefen und erst bei `Journal Check = 0 Issues` zum naechsten nicht buchenden Apply-/Preview-Schritt gehen. |
| Buchstelle | Kapitel 19 Debitoren/Kreditoren und Kapitel 20 Bank/Payments |

Bewertung:

Das ist ein guter Anfaengerbefund, weil er zeigt: Ein sichtbarer Betrag in der Journalzeile beweist noch keine zahlungsreife Gen.-Journal-Line. Erst der rechte `Journal Check` entscheidet, ob BC die Zeile fachlich akzeptiert. Nach `PAYMENTS-008` ist dieser Preflight im Labor positiv; `PAYMENTS-009` hat danach den Apply-Entries-Kontext read-only nachgewiesen. Der naechste Kontrollpunkt ist Zahlungsfreigabe/Buchungsdialog-Risiko, nicht blindes Buchen.

## FIND-BC-PAY-004 UI-Draft ist noch nicht zahlungsreif

| Feld | Wert |
|---|---|
| Status | erledigt als Payment-Draft-Lernfall; Folgechecks `PAYMENTS-006` bis `PAYMENTS-010` abgeschlossen |
| Projekt | fibu-book5 |
| Testfall | `PAYMENTS-005` |
| Screenshot | `playwright/projects/fibu-book5/img/payments-005-010-cash-receipt-ui-draft.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/payments-005/PAYMENTS-005-result.json`, `playwright/projects/fibu-book5/evidence/payments-005/PAYMENTS-005-CASH-RECEIPT-UI-DRAFT.md` |
| BC-Seite | Cash Receipt Journals |
| sichtbarer Text | `D10000`, `BANK-RM-01`, `PS-INV103297`, `Journal Check`, `1 Issues Total`, `Amount` |
| Elementtyp | Zahlungsjournal-Entwurf / Journal Check |
| erste Hypothese | Ein sichtbarer Zahlungsjournal-Draft beweist noch nicht, dass die Zeile fachlich buchungsreif ist. Journal Check muss vor einer Zahlung ohne Issues sein oder die Restgrenze muss erklaert werden. |
| Recherchequelle | praktischer UI-only Playwright-Lauf `npm run fibu:payments:cash-receipt-ui-draft`; `playwright/projects/fibu-book5/evidence/payments-005/README.md` |
| Testergebnis | Die Zeile wurde vollstaendig ueber die UI vorbereitet und wieder geloescht. Debitor, Betrag, Gegenkonto und Rechnungsbezug sind sichtbar. Journal Check meldete zunaechst `1 Issue`: `'Amount' muss in 'Gen. Journal Line' einen Wert enthalten...`. Die Folgechecks klaerten Amount-Format, Bank Account Posting Group, `Journal Check = 0 Issues`, Apply Entries read-only und den Post-Dialog mit Abbruch. Es wurde keine Zahlung und kein Ausgleich gebucht. |
| Entscheidung | Buch ergaenzen: Zahlungsjournal-Entwurf, Journal Check, Apply-Bezug, Post-Dialog und Zahlungsfreigabe trennen. Amount-Validierung ist geloest; echte Zahlung wurde in `PAYMENTS-011` genau einmal gebucht und in `PAYMENTS-012` synchronisiert. |
| Buchstelle | Kapitel 19 Debitoren/Kreditoren und Kapitel 20 Bank/Payments |

Bewertung:

Das ist ein idealer Anfaengerbefund: In Business Central kann eine Zeile sichtbar plausibel aussehen, waehrend die Journal-Check-FactBox noch einen internen Validierungsfehler meldet. Das Buch sollte deshalb nicht nur die Zeile zeigen, sondern auch den rechten Journal Check erklaeren.

## FIND-BC-PAY-003 Cash Receipt Journal braucht Readiness vor der ersten Zahlungszeile

| Feld | Wert |
|---|---|
| Status | erledigt als read-only Labor-Readiness, Folgearbeit offen |
| Projekt | fibu-book5 |
| Testfall | `PAYMENTS-004` |
| Screenshot | `playwright/projects/fibu-book5/img/payments-004-010-cash-receipt-journal-readiness.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/payments-004/PAYMENTS-004-result.json`, `playwright/projects/fibu-book5/evidence/payments-004/PAYMENTS-004-CASH-RECEIPT-JOURNAL-READINESS.md` |
| BC-Seite | Cash Receipt Journals / Bank Accounts |
| sichtbarer Text | `Cash Receipt Journal`, `Posting Date`, `Document Type`, `Document No.`, `Account Type`, `Account No.`, `Amount`, `Bal. Account`, `Apply Entries`, `Journal Check`, `Post`, `BANK-RM-01` |
| Elementtyp | Zahlungsjournal-Readiness / OP-Ausgleichsvorbereitung |
| erste Hypothese | Nach offenen Posten und Bankkonto-Fit muss vor einer Zahlung zuerst der Journalort mit Pflichtfeldern, Gegenkonto, Ausgleichsbezug und Preflight-Aktionen verstanden werden. |
| Recherchequelle | praktischer Playwright-Lauf `npm run fibu:payments:cash-receipt-readiness`; `playwright/projects/fibu-book5/evidence/payments-004/README.md` |
| Testergebnis | `BANK-RM-01` ist live in Bank Accounts sichtbar. Cash Receipt Journal ist erreichbar und zeigt Pflichtfelder, Gegenkonto-/Ausgleichshinweise sowie `Journal Check`; `Preview Posting` ist in diesem Lauf nicht sichtbar. Es wurde keine Journalzeile erstellt, keine Zahlung gebucht und kein Ausgleich angewendet. |
| Entscheidung | Buch ergaenzen: Zwischen OP-Liste/Bankkonto und erster Zahlung gehoert ein nicht-buchender Zahlungsjournal-Readiness-Schritt. Naechste Arbeit ist eine bereinigbare Entwurfszeile, nicht sofort Zahlung. |
| Buchstelle | Kapitel 19 Debitoren/Kreditoren und Kapitel 20 Bank/Payments |

Bewertung:

Das ist fuer Anfaenger ein wichtiger Sicherheitsanker: Ein sichtbares Zahlungsjournal und ein sichtbarer `Post`-Button bedeuten noch nicht, dass gebucht werden darf. Erst wenn Debitor, offener Posten, Betrag, Gegenkonto, Ausgleichsbezug und Journal Check zusammenpassen, darf eine kontrollierte Laborzahlung ueberhaupt vorbereitet werden.

## FIND-BC-PAY-002 Bankkonto-Fit vor der ersten Laborzahlung

| Feld | Wert |
|---|---|
| Status | geloest als Bankkonto-Fit, Folgearbeit offen |
| Projekt | fibu-book5 |
| Testfall | `PAYMENTS-002`, `PAYMENTS-003` |
| Screenshot | `playwright/projects/fibu-book5/img/payments-002-010-bank-accounts.png`, `playwright/projects/fibu-book5/img/payments-003-010-bank-accounts-bank-rm-01-fit.png`, `playwright/projects/fibu-book5/img/payments-002-020-cash-receipt-journal.png`, `playwright/projects/fibu-book5/img/payments-002-030-payment-journal.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/payments-002/PAYMENTS-002-result.json`, `playwright/projects/fibu-book5/evidence/payments-002/PAYMENTS-002-READINESS.md`, `playwright/projects/fibu-book5/evidence/payments-002/PAYMENTS-READINESS.md`, `playwright/projects/fibu-book5/evidence/payments-003/PAYMENTS-003-result.json`, `playwright/projects/fibu-book5/evidence/payments-003/PAYMENTS-003-BANK-ACCOUNT-FIT.md` |
| BC-Seite | Bank Accounts / Cash Receipt Journals / Payment Journals / Apply Entries |
| sichtbarer Text | `CHECKING`, `SAVINGS`, `Cash Receipt Journals`, `Payment Journals`, `Apply Entries`, `Post`, `Journal Check`, `PS-INV103297`, `108219` |
| Elementtyp | Bankkonto-Setup / Zahlungsjournal / Ausgleichspfad |
| erste Hypothese | Das Buchziel `BANK-RM-01` ist nicht automatisch in der CRONUS-USA-Laborcompany vorhanden. Vor einer Zahlungsbuchung muss entweder das Zielbankkonto eingerichtet oder ein vorhandenes CRONUS-Bankkonto bewusst als Laborersatz gewaehlt werden. |
| Recherchequelle | praktischer Playwright-Lauf `npm run fibu:payments:readiness`; `playwright/projects/fibu-book5/evidence/payments-002/README.md` |
| Testergebnis | `PAYMENTS-002` zeigte `CHECKING`/`SAVINGS`, aber nicht `BANK-RM-01`. `PAYMENTS-003` legte `BANK-RM-01` per BC-Standard-API an und zeigte das Konto danach in Bank Accounts. Cash Receipt Journal, Payment Journal und Apply Entries sind erreichbar. Es wurde keine Journalzeile erstellt, keine Zahlung gebucht und kein Ausgleich angewendet. |
| Entscheidung | Buch ergaenzen: Eine Payments-Anleitung braucht vor der Buchung einen Bankkonto-Readiness-Schritt. Der Bankkonto-Fit ist erledigt, aber die naechste Arbeit ist eine nicht buchende Zahlungsjournal-Readiness, nicht Zahlung. |
| Buchstelle | Kapitel 19 Debitoren/Kreditoren und Kapitel 20 Bank/Payments |

Bewertung:

Das ist ein wichtiger Stopppunkt. Die Bedienpfade fuer Journal und Apply Entries sind vorhanden, und `BANK-RM-01` ist jetzt als Laborbankkonto vorhanden. Fuer Anfaenger bedeutet das trotzdem: Ein sichtbarer `Post`-Button im Zahlungsjournal ist keine Buchungsfreigabe. Erst Journalfelder, Gegenkonto, Betrag, Ausgleichsbezug, Bank Account Posting Group/Sachkonto-Fit und Vorabkontrolle muessen passen.

## FIND-BC-PAY-001 OP-Ausgleich startet bei offenen Posten, nicht beim Bankkonto

| Feld | Wert |
|---|---|
| Status | erledigt als read-only Labor-Readiness |
| Projekt | fibu-book5 |
| Testfall | `PAYMENTS-001` |
| Screenshot | `playwright/projects/fibu-book5/img/payments-001-010-customer-ledger-entry-ps-inv103297.png`, `playwright/projects/fibu-book5/img/payments-001-020-vendor-ledger-entry-108219.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/payments-001/PAYMENTS-001-result.json`, `playwright/projects/fibu-book5/evidence/payments-001/PAYMENTS-001-OPEN-ENTRY-READINESS.md` |
| BC-Seite | Customer Ledger Entries / Vendor Ledger Entries |
| sichtbarer Text | `PS-INV103297`, `D10000`, `108219`, `K10000`, `Remaining Amount`, `Open`, `Due Date`, `Payment Method`, `Applied Entries`, `Related G/L Entries` |
| Elementtyp | OP-Ausgleich / Payments / offene Posten |
| erste Hypothese | Nach O2C und P2P sind Belege nicht einfach abgeschlossen. Fuer Zahlung und Ausgleich muss zuerst geklaert werden, welcher Debitoren- oder Kreditorenposten offen ist und welcher Restbetrag ausgeglichen werden soll. |
| Recherchequelle | praktischer Playwright-Lauf `npm run fibu:payments:open-entries`; `playwright/projects/fibu-book5/evidence/payments-001/README.md` |
| Testergebnis | Debitorenposten zur gebuchten Verkaufsrechnung `PS-INV103297` und Kreditorenposten zur gebuchten Einkaufsrechnung `108219` sind in `RM-DEMO` sichtbar. Payment-/Apply-Aktionen sind im Kontext sichtbar, wurden aber bewusst nicht ausgefuehrt. Keine Zahlung, kein Ausgleich, kein Zahlungsjournal und keine Bankabstimmung. |
| Entscheidung | Buch ergaenzen: Kapitel 19/20 sollen zuerst offene Posten, Restbetrag, Faelligkeit und Ausgleichslogik erklaeren. Bankkonto und Zahlungsjournal sind der naechste Readiness-Schritt, nicht schon bewiesene Wirkung. |
| Buchstelle | Kapitel 19 Debitoren/Kreditoren und Kapitel 20 Bank/Payments |

Bewertung:

Das ist ein zentraler Lernpunkt fuer Anfaenger. Eine gebuchte Rechnung erzeugt einen offenen Nebenbuchposten. Erst Zahlung und Ausgleich schliessen ihn. Das Buch sollte deshalb die Postenlisten als Kontrollpunkt vor der Zahlungsbuchung zeigen: Was ist offen, fuer wen, in welcher Waehrung, mit welchem Restbetrag und welcher Faelligkeit `PAYMENTS-001` beweist nur diesen Startpunkt. `PAYMENTS-002` muss Bank-/Journal-/Apply-Readiness pruefen, bevor eine einzelne Laborzahlung erlaubt wird.

## FIND-BC-INV-002 Item Journals sind der kontrollierte Bestandszugang

| Feld | Wert |
|---|---|
| Status | erledigt als CRONUS-USA-Laborbuchung |
| Projekt | fibu-book5 |
| Testfall | `INVENTORY-005`, `INVENTORY-006`, `INVENTORY-007`, `INVENTORY-008` |
| Screenshot | `playwright/projects/fibu-book5/img/inventory-005-010-item-journal-direct.png`, `playwright/projects/fibu-book5/img/inventory-006-010-target-journal-line-before-post.png`, `playwright/projects/fibu-book5/img/inventory-007-010-journal-check-no-issues.png`, `playwright/projects/fibu-book5/img/inventory-008-050-item-ledger-entry.png`, `playwright/projects/fibu-book5/img/inventory-008-091-inventory-valuation-preview.png` |
| BC-Seite | `Item Journals`, Page `40`, Tell-Me |
| sichtbarer Text | `Item Journals`, `Post`, `Positive Adjmt.`, `INV008-899959`, `RM-M100`, `FRA-ZL`, `Quantity 2`, `Unit Cost 42.000,00`, `Item Ledger Entries`, `Value Entries`, `G/L Entries`, `Inventory Valuation`, `Total Inventory Value 67.000,00` |
| Elementtyp | Inventory Journal / Trainingsbestand / Buchungsrisiko |
| erste Hypothese | Der negative `RM-M100`-Laborwert darf nicht ueber manuelle Sachposten korrigiert werden. Der naechste sichere Einstieg ist ein Artikeljournal, weil es Artikel-/Wertposten erzeugen kann. |
| Recherchequelle | praktische Playwright-Laeufe `npm run fibu:inventory:target-stock-readiness`, `npm run fibu:inventory:target-stock-draft`, `npm run fibu:inventory:journal-check`, `npm run fibu:inventory:post-target-stock`; `playwright/projects/fibu-book5/evidence/inventory-008/README.md` |
| Testergebnis | Page `40` oeffnet im Labor `Item Journals`; die Zielzeile `RM-M100 +2` in `FRA-ZL` kann vorbereitet, mit `PRODUCTLINE=MACHINE` geprueft und nach Journal-Check-/Current-line-Preflight genau einmal gebucht werden. `INVENTORY-008` erzeugte `INV008-899959`, Artikelposten, Wertposten, Sachposten mit `14140` und eine korrigierte Inventory Valuation. |
| Entscheidung | Buch ergaenzen: Vor einer positiven Bestandsbewegung muss der Leser Zielwerte, Dimension und Journal Check verstehen. Nach der Buchung muessen Artikelposten, Wertposten, Sachposten und Lagerbewertung zusammen gelesen werden. |
| Buchstelle | Kapitel 13 Inventory/Warehouse, Kapitel 23 Inventory Costing und Lagerbewertung |

Bewertung:

Das ist der praktische Anschluss an `INVENTORY-004`. Fuer Anfaenger ist wichtig: Ein Artikelbestand entsteht in BC ueber Artikelbewegungen, nicht ueber eine isolierte Fibu-Korrektur. Die Buchanleitung darf den positiven Bestand jetzt als CRONUS-USA-Laborbefund erklaeren, aber nicht als deutschen Finalwert oder Manufacturing-Output.

## FIND-BC-INV-001 Inventory Trace braucht Artikelposten, Wertposten und Sachposten zusammen

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `INVENTORY-001` |
| Screenshot | `playwright/projects/fibu-book5/img/inventory-001-010-o2c-item-ledger-entry-rm-m100.png`, `playwright/projects/fibu-book5/img/inventory-001-040-p2p-item-ledger-entry-raw-steel.png`, `playwright/projects/fibu-book5/img/inventory-001-060-p2p-gl-entries-inventory-ap.png` |
| BC-Seite | Item Ledger Entries / Value Entries / G/L Entries / Item Card / Locations |
| sichtbarer Text | `RM-M100`, `RAW-STEEL`, `FRA-ZL`, `Entry No. 792`, `Entry No. 793`, `14140`, `22100`, `25.000` |
| Elementtyp | Inventory / Postenspur / Screenshot-Layout |
| erste Hypothese | Ein einzelner Beleg oder eine einzelne Liste erklaert Lager nicht ausreichend; der Leser muss Menge, Wert und Kontenwirkung gemeinsam sehen. |
| Recherchequelle | praktischer Playwright-Lauf `npm run fibu:inventory:trace`, `evidence/inventory-001/INVENTORY-LAB-TRACE-result.json` |
| Testergebnis | O2C `PS-INV103297` ist ueber Wertposten mit Artikelposten `792` verbunden; P2P `108219` ist ueber Wertposten mit Artikelposten `793` verbunden. Artikelposten zeigen Artikel, Lagerort und Menge; Wertposten zeigen die Bewertungsbruecke; Sachposten zeigen `14140` und bei P2P auch `22100`. Der Lauf nutzt `Breites Layout umschalten`, und die Evidence protokolliert `wideLayoutActivated = true` fuer die gefilterten Tabellen. |
| Entscheidung | Buch ergaenzen: Inventory-Nachweise muessen Beleg, Artikelposten, Wertposten und Sachposten kombinieren. Breite Layoutansicht ist fuer Tabellen-Screenshots ein sinnvoller Standard, wenn sonst Spalten fehlen. Inventory Valuation bleibt ein eigener Zahlenbericht und wurde in diesem Lauf nur als Tell-Me-Einstieg belegt. |
| Buchstelle | Kapitel 13 Inventory/Warehouse, Kapitel 23 Inventory Costing und Lagerbewertung, Evidence Pack |

Bewertung:

Das ist ein Kernlernfall fuer Anfaenger. Artikelposten beantworten die Frage „Was wurde mengenmaessig an welchem Lagerort bewegt“. Wertposten beantworten „Welche Kosten-/Wertwirkung gehoert dazu“. Sachposten beantworten „Welche Konten wurden im Hauptbuch beruehrt“. Ein Buch-Screenshot sollte deshalb nicht nur eine gebuchte Rechnung zeigen, sondern die Spur bis zu diesen Postenarten erklaeren.

## FIND-BC-P2P-003 Vendor Invoice No. ist Pflicht vor P2P-Preview/Buchung

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `UAT-P2P-001` |
| Screenshot | `playwright/projects/fibu-book5/img/p2p-001-090-purchase-order-before-preview.png`, `playwright/projects/fibu-book5/img/p2p-001-095-preview-posting.png` |
| BC-Seite | Purchase Order / Error Messages / Posting Preview |
| sichtbarer Text | `Vendor Invoice No.`, `You need to enter the document number of the document from the vendor`, `Posting Preview` |
| Elementtyp | Pflichtfeld / Fehlerbild / Buchungsvorschau |
| erste Hypothese | Der erste P2P-Preview-Versuch ist nicht am Artikel oder an Posting Groups gescheitert, sondern an der fehlenden Lieferantenrechnungsnummer. |
| Recherchequelle | `playwright/projects/fibu-book5/evidence/p2p-001/095-preview-posting-page-text.txt`, `090-purchase-order-api-result.json`, ODataV4-Metadaten `purchaseDocuments.vendorInvoiceNumber` |
| Testergebnis | Ohne `Vendor Invoice No.` zeigt BC `Error Messages` und stoppt vor Preview/Buchung. Die v2.0-Standard-API `purchaseOrders` enthaelt das Feld nicht; ODataV4 `purchaseDocuments` enthaelt `vendorInvoiceNumber` und wurde fuer den Laborlauf genutzt. Danach erreichte Preview echte Vorschauarten und die kontrollierte Buchung `Receive and Invoice` erzeugte Einkaufsrechnung `108219`. |
| Entscheidung | Buch ergaenzen: Eine Eingangsrechnung braucht eine externe Belegnummer des Lieferanten. Fuer Automatisierung muss zwischen Standard-API und Page-/OData-Feldern unterschieden werden. |
| Buchstelle | Kapitel 12 P2P, Einkaufsbestellung, Eingangsrechnung, Evidence Pack |

## FIND-BC-P2P-004 P2P-Postenspur braucht Wertposten-Bruecke zum Artikelposten

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `UAT-P2P-001` |
| Screenshot | `playwright/projects/fibu-book5/img/p2p-001-150-value-entries.png`, `playwright/projects/fibu-book5/img/p2p-001-155-item-ledger-entry-by-entry-no.png` |
| BC-Seite | Value Entries / Item Ledger Entries |
| sichtbarer Text | `RAW-STEEL`, `Item Ledger Entry No. 793`, `Purchase Invoice 108219`, `FRA-ZL`, `Quantity 10` |
| Elementtyp | Postenspur / Inventory |
| erste Hypothese | Der direkte Filter `Item Ledger Entries` nach `Order No. = 106049` reicht nicht als Nachweis fuer den Wareneingang. |
| Recherchequelle | `playwright/projects/fibu-book5/evidence/p2p-001/140-item-ledger-entries-page-text.txt`, `150-value-entries-page-text.txt`, `160-posting-trace-summary.json` |
| Testergebnis | Der direkte Artikelpostenfilter blieb leer. Der Wertposten zur Einkaufsrechnung zeigt aber `Item Ledger Entry No. = 793`; ueber diesen Schluessel ist der Artikelposten sichtbar. |
| Entscheidung | Buch ergaenzen: Postenspur ist kein einzelner Listenfilter. Wenn ein direkter Filter leer bleibt, fuehrt die robuste Diagnose ueber Wertposten und deren Verknuepfung zum Artikelposten. |
| Buchstelle | Kapitel 12 P2P, Kapitel 13 Inventory, Evidence Pack |

## FIND-BC-P2P-001 Vendor Template schliesst K10000-Posting-Blocker

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `UAT-P2P-001` |
| Screenshot | `playwright/projects/fibu-book5/img/p2p-001-010-vendor-k10000.png` |
| BC-Seite | Vendor Card / Purchase Order Draft |
| sichtbarer Text | `K10000`, `Stahlwerk Ruhr GmbH`, `Apply Template`, `Payment Terms Code` |
| Elementtyp | Stammdaten-/Posting-Fit |
| erste Hypothese | Der P2P-Fall scheitert nicht am Klickpfad, sondern daran, dass ein neu angelegter Kreditor ohne Template keine tragfaehigen Einkaufs-/Posting-Vorgaben hat. |
| Recherchequelle | `playwright/projects/fibu-book5/evidence/p2p-001/P2P-READINESS.json`, `005-vendor-template-application-page-text.txt`, `P2P-READINESS.md` |
| Testergebnis | Nach Anwendung des Vendor Templates konnte fuer `K10000` ein temporaerer Purchase-Order-Entwurf mit `RAW-STEEL` angelegt und wieder geloescht werden. Die Standard-API zeigt nicht alle Postingfelder direkt; der Nachweis gilt deshalb als Labor-Readiness bis zur Entwurfszeile, nicht als finaler Buchungsnachweis. |
| Entscheidung | Buch ergaenzen: Wenn `Vendor Posting Group` oder Einkaufs-Postingdaten fehlen, ist das ein Stammdaten-/Template-Thema, kein Bedienfehler des Einkaeufers. |
| Buchstelle | Kapitel 12 P2P, Kreditorenstammdaten, Evidence Pack |

## FIND-BC-P2P-002 RAW-STEEL braucht Labor-Posting-Fit und Direct Unit Cost

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `UAT-P2P-001` |
| Screenshot | `playwright/projects/fibu-book5/img/p2p-001-020-item-raw-steel.png` |
| BC-Seite | Item Card / Purchase Order Line |
| sichtbarer Text | `RAW-STEEL`, `Unit Cost 2,500.00`, `Gen. Prod. Posting Group RETAIL`, `Tax Group Code FURNITURE`, `Inventory Posting Group RESALE` |
| Elementtyp | Artikel-/Zeilenlogik |
| erste Hypothese | Ein Artikel mit Nummer und Beschreibung reicht fuer P2P nicht; Kosten, Lagerort und Buchungsgruppen muessen eine Einkaufszeile tragen koennen. |
| Recherchequelle | `playwright/projects/fibu-book5/evidence/p2p-001/P2P-READINESS.json`, `020-item-raw-steel-page-text.txt`, `testdata/purchase/uat-p2p-001.json` |
| Testergebnis | `RAW-STEEL` wurde als Inventory-Artikel mit `Unit Cost = 2500` und CRONUS-Laborfit `RETAIL`/`RESALE`/`FURNITURE` nachgewiesen. Die Purchase-Order-Line-API verwendet `directUnitCost`; ein Setzen von `unitCost` ist fuer die Entwurfszeile nicht ausreichend. Nach Patch auf `directUnitCost = 2500` zeigte die Entwurfszeile `amountExcludingTax = 25000` und `Tax Percent = 0`. |
| Entscheidung | Buch ergaenzen: P2P-Zeilenwerte sind nicht nur Eingabefelder, sondern Ergebnis von Artikel, Postinggruppen, Kostenlogik, Lagerort und Steuer-/Tax-Setup. |
| Buchstelle | Kapitel 12 P2P, Artikelstammdaten, Einkaufszeile |

## FIND-BC-BOOK-002 O2C-/Reporting-Buchstand hinkt Evidence hinterher

| Feld | Wert |
|---|---|
| Status | recherchieren |
| Projekt | fibu-book5 |
| Testfall | `UAT-O2C-001`, `REPORTING-001`, `MASTERDATA-009` |
| Screenshot | `playwright/projects/fibu-book5/img/uat-o2c-001-080-posting-dialog-before-ok.png`, `playwright/projects/fibu-book5/img/uat-o2c-001-082-posted-sales-invoice.png`, `playwright/projects/fibu-book5/img/reporting-001-010-financial-reports.png` |
| BC-Seite | Sales Order, Posted Sales Invoice, Financial Reports |
| sichtbarer Text | `S-ORD101068`, `PS-INV103297`, `Financial Reports`, `Income Statement`, `Revenue` |
| Elementtyp | Buch-/Evidence-Drift |
| erste Hypothese | Mehrere Buchstellen beschreiben noch den frueheren Stand: O2C nur bis Kopf/Zeile oder Inventory-Posting-Setup-Diagnose; Reporting als Ziel, aber noch ohne Filter-/Summen-Evidence. |
| Recherchequelle | `playwright/projects/fibu-book5/BOOK-TO-EVIDENCE-AUDIT.md`, `080-posting-result.json`, `082-posting-entry-trace.json`, `reporting-001/010-financial-reports-open-result.json` |
| Testergebnis | O2C ist im CRONUS-USA-Labor bis Preview, genau einer Laborbuchung, gebuchter Verkaufsrechnung und Postenspur belegt. `PRODUCTLINE=MACHINE` ist im Belegdialog und am Artikelposten belegt, aber noch nicht in Sachposten oder Financial Reports. Deutsche `19 %` USt ist weiterhin offen. |
| Entscheidung | O2C-Buchstand wurde aktualisiert: `MASTERDATA-009`, `PS-INV103297`, CRONUS-USA-Laborgrenzen und Ziel-vs.-Labor-Tabelle sind eingearbeitet. Offen bleibt die Recherche/Pruefung fuer Sachposten- und Financial-Reports-Dimensionen. |
| Buchstelle | Foundation-Stand, Kapitel 10 Dimensionen/Reporting, Kapitel 11 O2C, Kapitel 25 Financial Reports |

## FIND-BC-SHOT-001 O2C-Zeilenbild beweist nicht alle Buchbehauptungen

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `UAT-O2C-001` |
| Screenshot | `playwright/projects/fibu-book5/img/uat-o2c-001-040-zeile-artikel-rm-m100.png`, `playwright/projects/fibu-book5/img/uat-o2c-001-041-zeile-betraege-steuer.png` |
| BC-Seite | `Sales Order`, Page `42` |
| sichtbarer Text | `RM-M100`, `Standardmaschine M100`, `FRA-ZL`, `68.000,00`; aktueller Laborlauf zeigt `EUR`, `FURNITURE`, `taxPercent = 0` |
| Elementtyp | Screenshot-/Evidence-Qualitaet |
| erste Hypothese | Das Bild `040` ist als Laborbild brauchbar, aber nicht als finales Buchbild, weil Menge, USt-/Tax-Gruppe, Waehrung und Dimension nicht sauber sichtbar sind. Ein zweites Bild nach gezieltem horizontalem Grid-Scroll koennte die Steuer-/Betragsspalten sichtbar machen. |
| Recherchequelle | visuelle Screenshot-Pruefung am 2026-06-07, `SCREENSHOT-QA.md` |
| Testergebnis | DOM-Scroll auf den BC-Container `freeze-pane-scrollbar` funktioniert. `041` zeigt `Unit Price Excl. Tax`, `Tax Group Code = FURNITURE` und `Line Amount Excl. Tax = 68.000,00`. `042` zeigt, dass Scroll ans rechte Ende andere spaete Spalten trifft. |
| Entscheidung | `041` als Laborbild fuer Steuer-/Betragsspalten behalten; `050` weist `PRODUCTLINE=MACHINE` im Zeilendimensionsdialog nach; fuer finale deutsche Buchbilder bleiben deutsche Sprache, 19-%-USt und Postennachweis offen |
| Buchstelle | `UAT-O2C-001`, Verkaufszeile, Evidence Pack |

## FIND-BC-SHOT-002 O2C-Listenbild zeigt CRONUS-Auftraege, nicht den Buchfall

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `UAT-O2C-001` |
| Screenshot | `playwright/projects/fibu-book5/img/uat-o2c-001-020-liste-verkaufsauftraege.png` |
| BC-Seite | `Sales Orders`, Page `9305` |
| sichtbarer Text | vorhandene CRONUS-Auftraege, `10000`, `Adatum Corporation` |
| Elementtyp | Screenshot-/Datensatz-Scope |
| erste Hypothese | Das Bild ist ein Navigationsbild, aber kein Prozessnachweis fuer `D10000`. |
| Recherchequelle | visuelle Screenshot-Pruefung am 2026-06-07, `SCREENSHOT-QA.md` |
| Testergebnis | `020` bleibt als Navigationsbild dokumentiert; `030` und folgende Bilder tragen den Prozessnachweis fuer `D10000`. |
| Entscheidung | im Buch nur als Navigationsbild verwenden; Prozessnachweis erfolgt ueber die erzeugte Auftragskarte und Evidence. |
| Buchstelle | `UAT-O2C-001`, Verkaufsauftragsliste |

## FIND-BC-SHOT-003 Redundanter Screenshot `030-neuer-verkaufsauftrag`

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `UAT-O2C-001` |
| Screenshot | `playwright/projects/fibu-book5/img/uat-o2c-001-030-neuer-verkaufsauftrag.png` |
| BC-Seite | `Sales Order`, Page `42` |
| sichtbarer Text | identisch zu `playwright/projects/fibu-book5/img/uat-o2c-001-030-kopf-debitor-d10000.png` |
| Elementtyp | Asset-Qualitaet |
| erste Hypothese | Der Test erstellt zwei Dateien zum selben Zustand; der Dateiname `neuer-verkaufsauftrag` suggeriert faelschlich einen leeren neuen Auftrag. |
| Recherchequelle | `Get-FileHash` am 2026-06-07, `SCREENSHOT-QA.md` |
| Testergebnis | beide Dateien hatten denselben Hash; die redundante PNG wurde entfernt und der Test erzeugt sie nicht mehr. |
| Entscheidung | nicht als eigenes Buchbild verwenden; der laufende Test erzeugt nur noch `030-kopf-debitor-d10000`. |
| Buchstelle | Screenshot-Konvention, `UAT-O2C-001` |

## FIND-BC-BOOK-001 Auslandsgesellschaft `RM-CH` vs. `RM-AT`

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | Build-Scope aus Buch |
| Screenshot | noch keiner |
| BC-Seite | nicht UI-bezogen |
| sichtbarer Text | Kapitel 6 nennt `RM-CH`; Kapitel 3 nennt `RM-AT GmbH` |
| Elementtyp | Buch-/Datenmodell-Fundstelle |
| erste Hypothese | Das Buch vermischt Drittland-/CH-Fall und EU-/AT-Fall. |
| Recherchequelle | Buchkapitel 3, 6, 18, 22 gegenprüft |
| Testergebnis | Buchmodell bereinigt: Company für EU-Ausland ist `RM-AT`; Drittland/CH bleibt als Debitor-/Steuerfall `D30000`/CH, nicht als eigene Company in Welle 1. |
| Entscheidung | Buch und Projektdaten auf `RM-AT` als Auslandsgesellschaft vereinheitlicht; CH als Drittland-Kunden-/Lieferfall dokumentieren. |
| Buchstelle | Konzernstruktur, Beispieldatenpaket, Ausland/USt/Intercompany |

Bewertung:

Für EU-B2B, Drittland, USt-ID, Exportnachweis und Intercompany ist es fachlich relevant, ob die Auslandsgesellschaft Schweiz oder Ã–sterreich ist. Entscheidung: `RM-AT` ist die Auslandsgesellschaft für EU-/Intercompany-Fälle; CH bleibt als Drittlandfall über Debitor `D30000 SwissTech AG` und Kreditor-/Importfälle erhalten.

## FIND-BC-UI-001 Tell-Me-Suche wählt nicht automatisch die richtige Seite

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | alle Such-basierten Playwright-Läufe |
| Screenshot | diverse `smoke-bc-*` und `masterdata-001-*` |
| BC-Seite | Tell-Me / Suche |
| sichtbarer Text | Suchergebnislisten mit Seiten, Aktionen, Berichten und Datenfundstellen |
| Elementtyp | Such-/Navigationsverhalten |
| erste Hypothese | Der oberste Treffer ist nicht zwingend die gewünschte BC-Seite. |
| Recherchequelle | praktischer Playwright-Lauf |
| Testergebnis | Blindes `first().click()` und `Enter` sind fachlich riskant. |
| Entscheidung | Playwright-Helfer darf keinen stillen Enter-Fallback verwenden; bei Mehrdeutigkeit Treffer explizit wählen. |
| Buchstelle | Bedienlogik, Suchlogik, Playwright-Klickanleitungen |

Bewertung:

Die Business-Central-Suche ist für Menschen hilfreich, aber für Automatisierung mehrdeutig. Eine Klickanleitung muss zeigen, welchen Treffer der Anwender wählen soll, nicht nur welchen Suchbegriff er eintippt.

Folgeentscheidung:

Für Audit- und Setup-Prüfungen verwendet Playwright nach Möglichkeit direkte BC-Seiten-URLs mit Page-ID. Tell-Me bleibt für Buchscreenshots und Anwenderschulung wichtig, darf aber nicht die einzige technische Navigation für kritische Prüfungen sein.

## FIND-BC-UI-003 Verkaufsauftrag: `Neu` und `Customer Name` sind für Anfänger erklärungsbedürftig

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `UAT-O2C-001` |
| Screenshot | `playwright/projects/fibu-book5/img/uat-o2c-001-020-liste-verkaufsauftraege.png`, `playwright/projects/fibu-book5/img/uat-o2c-001-030-kopf-debitor-d10000.png` |
| BC-Seite | `Sales Orders` / `Sales Order` |
| sichtbarer Text | `Neu`, `Customer Name`, `Customer No. D10000`, `Mueller Maschinenbau GmbH` |
| Elementtyp | Menü / Feld / FactBox |
| erste Hypothese | Die Buchanweisung „Debitor D10000 auswählen“ ist für die sichtbare Oberfläche zu knapp. |
| Recherchequelle | praktischer Playwright-Lauf am 2026-06-07 |
| Testergebnis | `Neu` ist in der Liste als Menüaktion gerendert. Im Auftragskopf ist zuerst `Customer Name` sichtbar; die Eingabe der Debitornummer in dieses Feld wurde nicht übernommen, die Eingabe des Kundennamens dagegen schon. Danach zeigt BC in Liste und FactBox `Customer No. D10000`. |
| Entscheidung | Buch ergänzen: sichtbares Feld, Eingabelogik und Prüfung von Nummer/Name erklären. |
| Buchstelle | `UAT-O2C-001`, Verkaufsauftrag Kopf |

Bewertung:

Für Anwender ist fachlich der Debitor `D10000` gemeint, in der Oberfläche kann die erste Pflichtauswahl aber über den Namen erfolgen. Eine gute Klickanleitung muss deshalb sagen, dass der Leser den Debitor über Name oder Lookup auswählt und anschlieÃŸend die Debitornummer `D10000` in FactBox, Liste oder Kopfkontext prüft.

## FIND-BC-TEST-003 BC-Text enthält alte Liste und aktuelle Karte gleichzeitig

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `UAT-O2C-001` |
| Screenshot | `playwright/projects/fibu-book5/img/uat-o2c-001-030-kopf-debitor-d10000.png` |
| BC-Seite | `Sales Orders` / `Sales Order` |
| sichtbarer Text | mehrere `S-ORD...` aus Liste und aktueller Karte |
| Elementtyp | Testqualitäts-Fundstelle |
| erste Hypothese | Nach `Neu` bleiben Listeninhalt und Karteninhalt im DOM; freier Seitentext ist kein sicherer Datensatz-Scope. |
| Recherchequelle | praktischer Playwright-Lauf am 2026-06-07 |
| Testergebnis | Eine erste Cleanup-Logik griff die erste Belegnummer aus dem Seitentext und damit einen alten Listendatensatz. Korrigiert: Für Screenshot-Cleanup wird die aktuelle Kartennummer aus dem späteren Kartenkontext bzw. der letzten Belegnummer im Seitentext verwendet. Offene Laborbelege für `D10000` wurden gezielt entfernt. |
| Entscheidung | Cleanup- und Evidence-Logik niemals gegen ungescopten Freitext bauen; Datensatznummern aus Kartenkontext, URL, API-Antwort oder eindeutigem Marker ermitteln. |
| Buchstelle | Playwright-Regeln, Evidence-Pack-Regeln |

Bewertung:

Business Central rendert häufig Liste, Karte, FactBox und Hintergrundkontext gleichzeitig. Für Screenshots ist das nützlich, für automatisierte Nachweise aber gefährlich. Tests müssen deshalb immer klären, welcher sichtbare Text wirklich zum aktuellen Beleg gehört.

## FIND-BC-TEST-004 Screenshot-Bereinigung darf BC-Fokuszustände nicht zerstören

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `UAT-O2C-001` |
| Screenshot | `playwright/projects/fibu-book5/img/uat-o2c-001-040-zeile-artikel-rm-m100.png` |
| BC-Seite | `Sales Order`, Page `42` |
| sichtbarer Text | `RM-M100`, `Standardmaschine M100`, `FRA-ZL`, `68.000,00` |
| Elementtyp | Testqualitäts-Fundstelle / Screenshot-Stabilisierung |
| erste Hypothese | Hilfekarten lassen sich vor Buchscreenshots pauschal mit `Escape` schlieÃŸen. |
| Recherchequelle | praktischer Playwright-Lauf am 2026-06-07 |
| Testergebnis | Die Hypothese ist falsch. `Escape` kann je nach Fokus einen BC-GröÃŸenänderungsmodus auslösen und danach den Seitentext für Evidence unbrauchbar machen. |
| Entscheidung | Keine globale `Escape`-Bereinigung. Finale Screenshots schlieÃŸen Hilfekarten nur gezielt über das sichtbare SchlieÃŸen-Element oder lassen sie im Laborbild bewusst stehen. |
| Buchstelle | Playwright-Regeln, Bildqualität und Wiederholbarkeit |

Bewertung:

Business Central ist kein statisches Webformular. Tastaturbefehle wirken immer im aktuellen Fokuskontext. Für Buchscreenshots ist deshalb eine fachliche Nachprüfung nach jedem UI-Cleanup Pflicht: Der Test muss erneut sehen, dass der richtige Auftrag, der richtige Debitor oder die richtige Zeile sichtbar ist.

## FIND-BC-TEST-001 MASTERDATA-001 war False Positive

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `MASTERDATA-001` |
| Screenshot | `playwright/projects/fibu-book5/img/masterdata-001-*` |
| BC-Seite | Role Center statt Zielseite |
| sichtbarer Text | Role-Center-Kacheln wie `Sales This Month`, `Ongoing Sales`, `Sales Orders` |
| Elementtyp | Testqualitäts-Fundstelle |
| erste Hypothese | Der Test hat nur geprüft, ob Begriffe irgendwo im Role Center vorkommen. |
| Recherchequelle | Evidence-Textdateien unter `playwright/projects/fibu-book5/evidence/masterdata-001/` |
| Testergebnis | Der grüne Audit war fachlich nicht belastbar. |
| Entscheidung | Audit auf direkte Page-ID-Navigation und Negativprüfung gegen Role-Center-Text umstellen. |
| Buchstelle | Test- und Evidence-Regeln |

Bewertung:

Ein bestandener Playwright-Test ist nur dann Evidence, wenn er die richtige Business-Central-Seite prüft. Für Buch und UAT muss die Seite selbst Teil des Akzeptanzkriteriums sein.

## FIND-BC-UI-002 Dimensionsseite vs. Dimension-Value-Liste

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `MASTERDATA-001` |
| Screenshot | `playwright/projects/fibu-book5/img/masterdata-001-dimensions.png` |
| BC-Seite | `Dimensions` / `Dimension Value List` |
| sichtbarer Text | `Dimensions`, `Dimension Value List` |
| Elementtyp | Seiten-/Navigations-Fundstelle |
| erste Hypothese | Page `560` zeigt Dimensionswerte, nicht die Dimensions-Hauptliste. |
| Recherchequelle | direkter BC-Test mit Page-IDs; Microsoft Learn zu Dimensions |
| Testergebnis | Page `536` öffnet `Dimensions`; Page `560` öffnet `Dimension Value List`. |
| Entscheidung | `MASTERDATA-001` nutzt Page `536`; Dimension Values werden erst im Aufbau je Dimension geöffnet. |
| Buchstelle | Foundation Setup, Dimensionen |

Bewertung:

Für das Anlegen einer Dimension braucht der Leser zuerst die Seite `Dimensions`. Dimension Values sind der zweite Schritt innerhalb einer bestehenden Dimension.

## FIND-BC-TEST-002 BC-Listen-Neuanlage braucht Scope auf die `Neu - ...`-Form

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `MASTERDATA-002` |
| Screenshot | `playwright/projects/fibu-book5/img/masterdata-002-dimensions-rhein-main.png` |
| BC-Seite | `Dimensions`, Page `536` |
| sichtbarer Text | `Neu`, `Liste bearbeiten`, `Neu - Dimensions`, `Gespeichert` |
| Elementtyp | Liste / Neuanlage / Grid-Fokus |
| erste Hypothese | Nach `Neu` existieren Hauptliste und Neuanlage-Form gleichzeitig; ein unspezifischer Locator schreibt in die falsche Liste oder gar nicht. |
| Recherchequelle | praktischer Playwright-Lauf |
| Testergebnis | Erfolgreich erst nach Scope auf `form "Neu - Dimensions"`; vorher wurde ein falscher Datensatz `LINE` erzeugt bzw. keine Zeile angelegt. |
| Entscheidung | BC-Grid-Neuanlagen immer auf die konkrete `Neu - <Seite>`-Form scopen und nach dem Speichern gegen den Seitentext prüfen. |
| Buchstelle | Stammdatenaufbau, Playwright-Regeln, Dimensionen |

Bewertung:

Business-Central-Listen verhalten sich anders als klassische Webformulare. Der Button `Neu` erzeugt einen eigenen Neuanlagekontext, während die alte Liste weiter sichtbar bleibt. Für Buchscreenshots ist das didaktisch wichtig: Der Leser muss erkennen, dass er nicht einfach irgendwo in die Tabelle tippt, sondern in der neu erzeugten Zeile arbeitet.

Folgeentscheidung:

Für `MASTERDATA-002` ist die richtige technische Regel: `Dimensions` öffnen, `Neu` klicken, innerhalb der Form `Neu - Dimensions` die Felder `Code` und `Name` erfassen, speichern lassen, danach den neuen Code in der Dimensionsliste nachweisen.

Zusatz-Learning:

Cleanup-Prüfungen dürfen nicht gegen freien Seitentext laufen. Der Text `Product Line` enthält fachlich das Wort `Line`, ist aber kein Dimensionscode `LINE`. Deshalb muss Cleanup eine konkrete Code-Zelle oder einen konkreten Datensatz-Locator prüfen.

## FIND-BC-API-001 Stammdaten per API sind noch kein Posting-Fit

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `MASTERDATA-005`, gelöst in `MASTERDATA-006` |
| Screenshot | `playwright/projects/fibu-book5/img/masterdata-005-items-after-api.png`, `playwright/projects/fibu-book5/img/masterdata-006-item-posting-fit.png` |
| BC-Seite | `Items` / `Item Card` |
| sichtbarer Text | `Base Unit of Measure`, `Gen. Prod. Posting Group`, `Inventory Posting Group` leer |
| Elementtyp | Feld / Stammdaten-/Buchungslogik |
| erste Hypothese | Die Standard-API legt den Artikel an, setzt aber nicht automatisch alle buchungsrelevanten BC-Felder. |
| Recherchequelle | praktischer Playwright-Lauf mit BC-API und Item Card |
| Testergebnis | `RM-M100` existierte zunächst mit Kosten `42.000,00` und Verkaufspreis `68.000,00`; Buchungsgruppen und Basiseinheit waren leer. `MASTERDATA-006` setzt `PCS`, `RETAIL`, `RESALE`, `FURNITURE` und beweist einen Sales-Order-Probelauf. |
| Entscheidung | `MASTERDATA-005` bleibt Existenz- und Screenshot-Nachweis; `MASTERDATA-006` ist der erste technische Posting-Fit. |
| Buchstelle | Stammdaten, Artikel, Posting-Fit, O2C-Vorbereitung |

Bewertung:

Das ist ein klassischer Beratungsfehler: Stammdaten sind nicht fertig, nur weil Name und Preis sichtbar sind. Für einen Verkaufsauftrag braucht der Artikel eine Basiseinheit, Produktbuchungsgruppe, Lagerbuchungsgruppe und passende Buchungsmatrix. Der erste O2C-Lauf darf deshalb erst nach `MASTERDATA-006` gebucht werden.

## FIND-BC-TAX-001 CRONUS-Technikfit ist noch kein deutscher Steuerfit

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `MASTERDATA-006` |
| Screenshot | `playwright/projects/fibu-book5/img/masterdata-006-customer-template-fit.png`, `playwright/projects/fibu-book5/img/masterdata-006-item-posting-fit.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/masterdata-006/api-result.json`, `playwright/projects/fibu-book5/evidence/uat-o2c-001/045-target-vs-labor-delta.md` |
| BC-Seite | `Customer Card`, `Item Card`, Standard-API `salesOrders` |
| sichtbarer/API-Text | frueher `currencyCode = USD`, nach MCP-Korrektur `Currency Code = EUR`; weiterhin `Tax Area Code` leer, `Tax Group Code = FURNITURE`, kein deutscher `19 %`-VAT-Nachweis |
| Elementtyp | Steuer-/Währungs-/Posting-Setup |
| erste Hypothese | Die aktuelle Spielwiese ist CRONUS USA. Sie kann den technischen Klickpfad tragen, bildet aber den deutschen Zielsteuerfall nicht automatisch ab. |
| Entscheidung | UI- und API-Lernen darf weitergehen; `EUR` ist am Debitor `D10000` geloest, endgueltige Buchscreenshots fuer `19 %` brauchen aber einen deutschen Lauf oder ein explizit konfiguriertes deutsches VAT-Setup. |
| Buchstelle | Foundation, Posting Groups, USt, O2C |

Bewertung:

Das ist fuer das Buch zentral: Ein gruener technischer Test ist nicht automatisch ein fachlich korrekter deutscher Steuerfall. Fuer die jetzige Spielwiese zaehlt `MASTERDATA-006` als Laufbarkeitsnachweis. MCP hat die Herkunft genauer gemacht: `RM-M100` liefert `Tax Group Code = FURNITURE`; `D10000` liefert `Tax Liable`, `Tax Area Code = leer`, `Gen. Bus. Posting Group = DOMESTIC`, `Customer Posting Group = DOMESTIC` und inzwischen `Currency Code = EUR`. Fuer den Buch-Endstand muessen deutsche USt-Logik und `19 %` separat nachgewiesen werden.

## FIND-BC-O2C-004 Preview Posting prueft Inventory Posting Setup

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `UAT-O2C-001` |
| Screenshot | `playwright/projects/fibu-book5/img/uat-o2c-001-060-buchungsvorschau.png`, `playwright/projects/fibu-book5/img/masterdata-008-inventory-posting-setup-fra-zl-resale.png`, `playwright/projects/fibu-book5/img/masterdata-009-inventory-posting-setup-fra-zl-resale-14140.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/uat-o2c-001/060-preview-posting-result.json`, `playwright/projects/fibu-book5/evidence/uat-o2c-001/060-preview-posting-learning.md`, `playwright/projects/fibu-book5/evidence/masterdata-008/013-diagnosis.json`, `playwright/projects/fibu-book5/evidence/masterdata-008/014-learning-note.md`, `playwright/projects/fibu-book5/evidence/masterdata-009/010-inventory-posting-setup-fit.json`, `playwright/projects/fibu-book5/evidence/masterdata-009/011-learning-note.md` |
| BC-Seite | `Sales Order`, `Posting Preview`, `Inventory Posting Setup` |
| sichtbarer/API-Text | Vor `MASTERDATA-009`: `Inventory Account is missing in Inventory Posting Setup Location Code: FRA-ZL, Invt. Posting Group Code: RESALE.` Nach `MASTERDATA-009`: `G/L Entry = 4`, `Cust. Ledger Entry = 1`, `Item Ledger Entry = 1`, `Detailed Cust. Ledg. Entry = 1`, `Value Entry = 1`. |
| Elementtyp | Buchungsvorschau / Setup-Wirkung / Buchungslogik |
| erste Hypothese | `Preview Posting` prueft vor dem Buchen nicht nur Debitor, Artikel und Steuer, sondern auch die Kontenfindung fuer Lagerort und Lagerbuchungsgruppe. |
| Recherchequelle | praktischer Playwright-Lauf `npm run fibu:uat:o2c`; Microsoft Learn `Preview Posting Results` in `MICROSOFT-DOC-VALIDATION.md` |
| Testergebnis | Der Test klickt den Dropdown-Teil von `Post...`, waehlt `Preview Posting` und oeffnet nach `MASTERDATA-009` eine echte Posting Preview. Der fruehere Inventory-Fehler ist nicht mehr vorhanden. Der normale Buchungsdialog `Ship / Invoice / Ship and Invoice` wurde nicht geoeffnet und der Test hat nicht gebucht. |
| Entscheidung | Buch ergaenzen: Preview Posting ist Pflicht vor dem Buchen; wenn BC auf `Inventory Posting Setup` stoppt, muss zuerst `FRA-ZL` + `RESALE` fachlich eingerichtet oder als Laborgrenze dokumentiert werden. Der CRONUS-Laborfit ist jetzt durch Folge-Preview bestaetigt. Offen bleiben deutsche 19-%-USt, bewusster Buchungsentscheid und finale Postenspur. |
| Buchstelle | `UAT-O2C-001`, Posting Groups, Inventory Posting Setup, Fehler-/Workaround-Kapitel |

Bewertung:

Das ist ein echter Lernfund fuer Anfaenger und Consultants. Ein Verkaufsauftrag kann technisch angelegt sein und trotzdem nicht buchungsfaehig sein. Die Buchungsvorschau macht diese Grenze sichtbar, bevor echte Posten entstehen. Der konkrete Inventory-Posting-Setup-Blocker ist im CRONUS-Labor mit `14140` geloest und durch Vorschauzeilen bestaetigt. Der naechste Block ist nicht direktes Buchen, sondern Verstehen der Preview-Arten und sauberes Trennen von Labor-Preview, deutscher USt und finaler Postenspur.

## FIND-BC-DIM-002 Standarddimensionen brauchen Daten- und UI-Nachweis

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `MASTERDATA-007` |
| Screenshot | `playwright/projects/fibu-book5/img/masterdata-007-default-dimensions-item-rm-m100.png`, `playwright/projects/fibu-book5/img/masterdata-007-default-dimensions-customer-d10000.png`, `playwright/projects/fibu-book5/img/masterdata-007-item-rm-m100-standarddimension.png`, `playwright/projects/fibu-book5/img/masterdata-007-customer-d10000-standarddimension.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/masterdata-007/api-result.json` |
| BC-Seite | `Default Dimensions`, `Item Card`, `Customer Card` |
| sichtbarer/API-Text | `PRODUCTLINE=MACHINE`, `CHANNEL=B2B`, `postingValidation=Same_x0020_Code` |
| Elementtyp | Standarddimension / Reporting- und Beleglogik |
| erste Hypothese | Standarddimensionen sind für das Buch fachlich wichtiger als ihr unscheinbarer UI-Ort vermuten lässt, weil sie spätere Beleg- und Sachpostendimensionen vorbereiten. |
| Recherchequelle | praktischer Playwright-Lauf mit BC-API |
| Testergebnis | Die Standarddimensionen wurden persistent gesetzt, per API nachgewiesen und per Page `540` als UI-Laborbild fotografiert. Die Dialogbilder zeigen `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` mit `Same Code`. |
| Entscheidung | Buch ergänzt: Standarddimensionen, `Same Code`, UI-Dialog und Laborgrenzen erklären. Finale deutsche Bilder später neu erzeugen. |
| Buchstelle | Kapitel 10 Dimensionen, Kapitel 11 O2C, Reporting nach `PRODUCTLINE` |

Bewertung:

Für den Verkaufsauftrag ist `PRODUCTLINE=MACHINE` nicht kosmetisch. Ohne diese Dimension kann der Erlös später zwar gebucht sein, aber im Produktlinienbericht fehlen oder falsch zugeordnet sein. `Same Code` ist deshalb die harte Lernregel: Der Artikel `RM-M100` soll nicht irgendeine Produktlinie zulassen, sondern genau `MACHINE`.

## FIND-BC-TEST-003 Dimensionswerte brauchen Persistenzprüfung über Grid-Werte

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `MASTERDATA-003` |
| Screenshot | `playwright/projects/fibu-book5/img/masterdata-003-dimension-values-rhein-main.png` |
| BC-Seite | `Dimension Values` aus `Dimensions` |
| sichtbarer Text | `Dimension Values - PRODUCTLINE`, `Nicht gespeichert`, `Gespeichert` |
| Elementtyp | Liste / Neuanlage / Speichern |
| erste Hypothese | Die Zeile lässt sich optisch füllen, aber reiner Seitentext ist kein belastbarer Persistenznachweis. |
| Recherchequelle | praktischer Playwright-Lauf; Microsoft Learn zu Dateneingabe und Keyboard Shortcuts |
| Testergebnis | `MACHINE`, `B2B`, `SALES`, `DIRECTED` sind nach erneutem Ã–ffnen über Grid-Werte nachweisbar. |
| Entscheidung | `MASTERDATA-003` prüft `input.value`/Grid-Werte statt nur `innerText`. Reload-/Neuöffnungsnachweis ist Pflicht. |
| Buchstelle | Dimensionen, vorbereitender Stammdatenaufbau |

Bewertung:

Ein Screenshot mit sichtbarem Wert reicht nicht als Evidence, wenn der Wert nach erneutem Ã–ffnen nicht nachweisbar ist. Für das Projekt gilt: Stammdatenaufbau ist erst erledigt, wenn der Datensatz nach Reload oder erneutem Ã–ffnen der Seite wiedergefunden wird.

Zusatz-Learning:

Business-Central-Grids geben Werte nicht immer über `innerText` aus. Sichtbare Zellwerte können in `input.value` liegen. Für Evidence muss der Test daher je Seite entscheiden, ob Text, ARIA, Input-Wert oder Screenshot der belastbare Nachweis ist.

## FIND-BC-DIM-004 Standard-API liest Dimensionen, legt sie aber nicht an

| Feld | Wert |
|---|---|
| Status | offen |
| Projekt | fibu-book5 |
| Testfall | `MASTERDATA-DIMENSIONS` |
| Screenshot | `playwright/projects/fibu-book5/img/masterdata-dimensions-010-book-standard-dimensions.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/masterdata-dimensions/010-dimension-foundation-result.json`, `playwright/projects/fibu-book5/evidence/masterdata-dimensions/011-dimension-foundation-summary.md` |
| BC-Seite/API | `Dimensions`, API v2.0 `dimensions`, `dimensionValues` |
| sichtbarer/API-Text | `DEPARTMENT`, `CHANNEL`, `PRODUCTLINE`, `LOCATION-GROUP` existieren; `COMPANY-GROUP` fehlt. `POST dimensions` und `POST dimensionValues` liefern `405 Entity does not support insert`. |
| Elementtyp | Dimension / Stammdatenanlage / API-Grenze |
| erste Hypothese | Die Standard-API eignet sich fuer Pruefung und Evidence, aber nicht fuer die Anlage der Dimensionsstammdaten. |
| Recherchequelle | praktischer Playwright-Lauf `npm run fibu:masterdata:dimension-foundation` |
| Testergebnis | Der Lauf wurde auf Read-only-/Delta-Evidence umgestellt. O2C-Kerndimensionen und Default Dimensions sind nachgewiesen. `MASTERDATA-010` hat danach die P1-Werte `PURCH`, `WHSE`, `SPARE` und `SIMPLE` per UI angelegt. Spaetere Service/Project/Shop/IC-Werte bleiben offen. |
| Entscheidung | Fuer weitere Buchstandard-Dimensionswerte braucht das Projekt einen gezielten UI-Setup-Lauf oder einen anderen freigegebenen Setup-Kanal. P2P/Inventory/Warehouse koennen jetzt mit P1-Dimensionsbasis vorbereitet werden, aber noch nicht ohne Stammdaten-/Posting-Fit laufen. |
| Buchstelle | Kapitel 10 Dimensionen, Stammdatenaufbau, Evidence Pack |

Bewertung:

Das ist ein wichtiger Automatisierungsbefund. Nicht jede BC-API-Ressource, die lesbar ist, ist auch fuer Stammdatenanlage beschreibbar. Fuer das Buch bedeutet das: Der Leser darf API-Evidence als Pruefnachweis verstehen, aber nicht als universellen Anlageweg. Fehlende Werte muessen bewusst ueber die BC-Oberflaeche oder einen projektspezifisch freigegebenen Setup-Kanal angelegt werden.

## FIND-BC-DIM-003 Auftragskopf-Dimension ist nicht automatisch Zeilendimension

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `UAT-O2C-001` |
| Screenshot | `playwright/projects/fibu-book5/img/uat-o2c-001-030-kopf-debitor-d10000.png`, `playwright/projects/fibu-book5/img/uat-o2c-001-041-zeile-betraege-steuer.png`, `playwright/projects/fibu-book5/img/uat-o2c-001-050-dimension-productline-machine.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/uat-o2c-001/040-zeile-artikel-rm-m100-api-result.json`, `playwright/projects/fibu-book5/evidence/uat-o2c-001/045-target-vs-labor-delta.md`, `playwright/projects/fibu-book5/evidence/uat-o2c-001/050-line-dimension-dialog-result.json` |
| BC-Seite/API | `Sales Order`, API-Navigation `salesOrders(...)/dimensionSetLines` |
| sichtbarer/API-Text | `CHANNEL=B2B`; `PRODUCTLINE=MACHINE` ist im Zeilendimensionsdialog sichtbar nachgewiesen |
| Elementtyp | Dimension / Belegkopf / Verkaufszeile / Reportingnachweis |
| erste Hypothese | Die Debitor-Standarddimension kommt am Auftragskopf an. Die Artikel-Standarddimension muss in der Zeile, im Dimensionsdialog oder nach dem Buchen separat nachgewiesen werden. |
| Recherchequelle | praktischer Playwright-Lauf; Microsoft Learn Sales Order API mit `dimensionSetLines` |
| Testergebnis | `orderDimensionSetLines` liefert `CHANNEL=B2B`. Der O2C-Test oeffnet danach `Line` -> `Related Information` -> `Dimensions`; Screenshot `050` und `050-line-dimension-dialog-result.json` weisen `PRODUCTLINE=MACHINE` nach. |
| Entscheidung | Beleg-Dimensionsnachweis im Labor ist erledigt. Finaler deutscher Screenshot und Nachweis in Posten/Reporting bleiben offen, weil noch nicht gebucht wird. |
| Buchstelle | Kapitel 10 Dimensionen, Kapitel 11 O2C, Reporting nach Produktlinie |

Bewertung:

Das ist ein sehr nuetzlicher Lernpunkt fuer Anfaenger: Eine Dimension kann korrekt am Kopf stehen und trotzdem muss die fachlich entscheidende Produktliniendimension in der Zeile geprueft werden. Fuer das Buch braucht der Leser deshalb drei Ebenen: Standarddimension vorbereiten, Dimension im Beleg pruefen, Dimension in Posten oder Bericht wiederfinden.

## FIND-BC-REPORT-005 Financial Reports zeigen Dimension Perspective, aber noch keine PRODUCTLINE-/CHANNEL-Auswertung

| Feld | Wert |
|---|---|
| Status | offen |
| Projekt | fibu-book5 |
| Testfall | `REPORTING-002`, `REPORTING-003`, `REPORTING-004`, `REPORTING-005`, `REPORTING-006`, `REPORTING-007`, `REPORTING-008`, `REPORTING-009`, `GOVERNANCE-006`, `REPORTING-011`, `REPORTING-012`, `GOVERNANCE-007`, `REPORTING-013`, `REPORTING-014` |
| Screenshot | `playwright/projects/fibu-book5/img/reporting-002-010-gl-entries-ps-inv103297.png`, `playwright/projects/fibu-book5/img/reporting-002-046-item-ledger-entry-792-dimensions.png`, `playwright/projects/fibu-book5/img/reporting-002-055-financial-reports-list.png`, `playwright/projects/fibu-book5/img/reporting-003-020-financial-reports-wide-layout.png`, `playwright/projects/fibu-book5/img/reporting-003-030-dimension-perspective-result.png`, `playwright/projects/fibu-book5/img/reporting-004-030-revenue-analysis-view-card.png`, `playwright/projects/fibu-book5/img/reporting-005-010-tell-me-dimensions-detail.png`, `playwright/projects/fibu-book5/img/reporting-005-020-dimensions-detail-request.png`, `playwright/projects/fibu-book5/img/reporting-006-010-gl-entries-before-analysis.png`, `playwright/projects/fibu-book5/img/reporting-006-020-gl-entries-after-analysis-attempt.png`, `playwright/projects/fibu-book5/img/reporting-007-010-tell-me-analysis-by-dimensions.png`, `playwright/projects/fibu-book5/img/reporting-007-020-analysis-by-dimensions-result.png`, `playwright/projects/fibu-book5/img/reporting-009-010-gl-entries-before-dimensions.png`, `playwright/projects/fibu-book5/img/reporting-009-020-gl-entry-dimensions-result.png`, `playwright/projects/fibu-book5/img/reporting-011-020-analysis-views-before-fit.png`, `playwright/projects/fibu-book5/img/reporting-011-030-analysis-views-after-fit.png`, `playwright/projects/fibu-book5/img/reporting-013-020-analysis-views-before-fieldmapping.png`, `playwright/projects/fibu-book5/img/reporting-013-030-analysis-views-fieldmapping-probe.png`, `playwright/projects/fibu-book5/img/reporting-013-040-analysis-views-after-fieldmapping.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/reporting-002/REPORTING-002-result.json`, `playwright/projects/fibu-book5/evidence/reporting-002/REPORTING-002-PRODUCTLINE-CHANNEL.md`, `playwright/projects/fibu-book5/evidence/reporting-003/REPORTING-003-result.json`, `playwright/projects/fibu-book5/evidence/reporting-003/REPORTING-003-DIMENSION-PERSPECTIVE.md`, `playwright/projects/fibu-book5/evidence/reporting-004/REPORTING-004-result.json`, `playwright/projects/fibu-book5/evidence/reporting-004/REPORTING-004-ANALYSIS-VIEWS.md`, `playwright/projects/fibu-book5/evidence/reporting-005/REPORTING-005-result.json`, `playwright/projects/fibu-book5/evidence/reporting-005/REPORTING-005-DIMENSIONS-DETAIL.md`, `playwright/projects/fibu-book5/evidence/reporting-006/REPORTING-006-result.json`, `playwright/projects/fibu-book5/evidence/reporting-006/REPORTING-006-GL-ENTRIES-DATA-ANALYSIS.md`, `playwright/projects/fibu-book5/evidence/reporting-007/REPORTING-007-result.json`, `playwright/projects/fibu-book5/evidence/reporting-007/REPORTING-007-ANALYSIS-BY-DIMENSIONS.md`, `playwright/projects/fibu-book5/evidence/reporting-008/REPORTING-008-ANALYSIS-VIEW-FIT-READINESS.md`, `playwright/projects/fibu-book5/evidence/reporting-009/REPORTING-009-result.json`, `playwright/projects/fibu-book5/evidence/reporting-009/REPORTING-009-GL-ENTRY-DIMENSIONS.md`, `playwright/projects/fibu-book5/evidence/governance-006/GOVERNANCE-006-NEXT-GATE-DECISION.md`, `playwright/projects/fibu-book5/evidence/reporting-011/REPORTING-011-result.json`, `playwright/projects/fibu-book5/evidence/reporting-011/REPORTING-011-ANALYSIS-VIEW-FIT.md`, `playwright/projects/fibu-book5/evidence/reporting-012/REPORTING-012-result.json`, `playwright/projects/fibu-book5/evidence/reporting-012/REPORTING-012-ANALYSIS-VIEW-BLOCKER-SYNC.md`, `playwright/projects/fibu-book5/evidence/governance-007/GOVERNANCE-007-result.json`, `playwright/projects/fibu-book5/evidence/governance-007/GOVERNANCE-007-REPORTING-NEXT-GATE-DECISION.md`, `playwright/projects/fibu-book5/evidence/reporting-013/REPORTING-013-result.json`, `playwright/projects/fibu-book5/evidence/reporting-013/REPORTING-013-ANALYSIS-VIEW-FIELDMAPPING-SETUP.md`, `playwright/projects/fibu-book5/evidence/reporting-014/REPORTING-014-result.json`, `playwright/projects/fibu-book5/evidence/reporting-014/REPORTING-014-ANALYSIS-VIEW-BOOK-GOVERNANCE-SYNC.md` |
| BC-Seite | `G/L Entries`, `Item Ledger Entries`, `Financial Reports` |
| sichtbarer Text | `PS-INV103297`, `Entry No. 792`, `PRODUCTLINE=MACHINE`, `CHANNEL=B2B`, `Dimension Perspective`, `Column Definition`, `REVENUE`, `AREA`, `DEPARTMENT`, `CUSTOMERGROUP`; `Dimensions - Detail` ist in `REPORTING-005` nicht sichtbar erreicht; `Analysis by Dimensions` ist in `REPORTING-007` als Tell-Me-Suchpfad sichtbar, aber nicht als Analysezustand mit Ziel-Dimensionen; `REPORTING-009` zeigt `Department Code`/`Customergroup Code` in `G/L Entries`, aber nicht `PRODUCTLINE`/`CHANNEL`; `REPORTING-013` zeigt `REVENUE`-Feldpositionen fuer Code/Name/Dimension 1/Dimension 2, aber keine angelegte `RM-PLCH`-View |
| Elementtyp | Reporting / Dimension / Postenspur |
| erste Hypothese | Eine Dimension kann am gebuchten Posten vorhanden sein, ohne im Financial Report sofort als sichtbarer Filter oder Summenachse aufzutauchen. |
| Recherchequelle | praktische Playwright-Laeufe `npm run fibu:reporting:productline-channel`, `npm run fibu:reporting:dimension-perspective`, `npm run fibu:reporting:analysis-views`; Microsoft Learn zu Analysis by Dimensions und Dimensions - Detail |
| Testergebnis | `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` sind am Artikelposten `792` sichtbar. In den gefilterten Sachposten und in Financial Reports wurden sie nicht als sichtbarer Filter/Summenbeweis gefunden. `REPORTING-003` bis `REPORTING-009` liefern belastbare Teil-/Negativbefunde fuer Financial Reports, Dimensionsberichte, Analysis by Dimensions und G/L Entries. `REPORTING-011` hat den ersten Analysis-View-Fit rejected. `REPORTING-013` hat das spaetere Feldmapping-Gate verbraucht: Die bestehende `REVENUE`-Karte belegt Feldpositionen fuer `Code`, `Name`, `Dimension 1 Code` und `Dimension 2 Code`, aber `RM-PLCH` wurde nicht angelegt oder geaendert, weil `New/Neu` in der BC-Shell global mehrdeutig ist und ein ungescopter Klick in den Role-Center-Kontext fallen kann. |
| Entscheidung | Buch ergaenzen: Postendimension und Reportingauswertung sind zwei Nachweisebenen. Fuer den finalen Reportingbeweis braucht es weiterhin entweder einen stabilen Analysis-View-Klickpfad fuer `PRODUCTLINE`/`CHANNEL` oder einen alternativen offiziellen Reporting-Einstieg. `REPORTING-013` ist verbraucht und `rejected`; `REPORTING-014` synchronisiert diese Sperre. Weiteres Analysis-View-Setup nur mit neuem Gate und gescoptem New-/Kartenaktionsmuster. |
| Buchstelle | Kapitel 10 Dimensionen, Kapitel 25 Reporting/Financial Reports |

Bewertung:

Das ist ein starker Anfaenger-Lernpunkt. Der Artikelposten beweist, dass die Dimension in der gebuchten Spur angekommen ist. Der Financial Report beweist damit aber noch nicht automatisch eine GuV-Auswertung nach Produktlinie oder Kanal. `REPORTING-003` verschaerft diese Regel: Auch ein sichtbarer Menuepunkt `Dimension Perspective` ist noch kein Klickpfad, solange der Folgezustand nicht die erwartete Dimensionsansicht zeigt. `REPORTING-004` zeigt zusaetzlich, dass eine vorhandene Revenue-Analysis-View andere Dimensionen haben kann als das Buchziel. `REPORTING-005` zeigt, dass auch ein plausibler Berichtssuchbegriff kein belastbarer Pfad ist, wenn der Zielbericht nicht sichtbar erreicht wird. `REPORTING-006` zeigt dasselbe fuer gefilterte Sachposten: Hauptbuchspur ist nicht automatisch Dimensionsreporting. `REPORTING-007` ergaenzt: Ein Tell-Me-Treffer `Analysis by Dimensions` reicht ebenfalls nicht; erst der sichtbare Analysezustand mit den Ziel-Dimensionen waere ein Buchbild. `REPORTING-009` macht die Differenz noch konkreter: Einzelne Shortcut-Dimensionsspalten koennen in Sachposten sichtbar sein, ohne dass die Buchziel-Dimensionen `PRODUCTLINE`/`CHANNEL` oder ein vollstaendiger Dimensionsdialog sichtbar sind. `REPORTING-013` ergaenzt: Selbst sichtbare Feldpositionen reichen nicht, wenn die Neuanlageaktion `New/Neu` nicht eindeutig auf die Analysis-View-Karte oder -Liste gescoped ist. Fuer das Buch muss deshalb der Reportingpfad selbst bebildert werden, statt die Postendimension als Berichtssumme umzudeuten.

## FIND-BC-INV-001 Inventory Valuation braucht Stichtag und erklaert die RM-M100-Laborbewertung

| Feld | Wert |
|---|---|
| Status | erledigt als Labor-Lernfall; positiver Trainingsbestand seit `INVENTORY-008` belegt; finaler deutscher Nachweis offen |
| Projekt | fibu-book5 |
| Testfall | `INVENTORY-002` |
| Screenshot | `playwright/projects/fibu-book5/img/inventory-002-020-inventory-valuation-request.png`, `playwright/projects/fibu-book5/img/inventory-002-030-inventory-valuation-preview.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/inventory-002/INVENTORY-VALUATION-result.json`, `playwright/projects/fibu-book5/evidence/inventory-002/INVENTORY-VALUATION.md`, `playwright/projects/fibu-book5/evidence/inventory-002/README.md`, `playwright/projects/fibu-book5/evidence/inventory-003/INVENTORY-NEGATIVE-RM-M100.md` |
| BC-Seite | `Inventory Valuation` |
| sichtbarer Text | vor `INVENTORY-008`: `RAW-STEEL = 25.000,00`, `RM-M100 = -42.000,00`, `Total Inventory Value = -17.000,00`; nach `INVENTORY-008`: `RM-M100 = 42.000,00`, `RAW-STEEL = 25.000,00`, `Total Inventory Value = 67.000,00` |
| Elementtyp | Lagerbewertung / Report Request Page / Report Viewer |
| erste Hypothese | Die Lagerbewertung ist eine Stichtagsauswertung aus Artikel-/Wertposten. Der negative `RM-M100`-Wert entsteht nicht im Bericht, sondern aus der Labor-Bewegungskette: Verkauf/Lieferung ohne vorher passend aufgebauten positiven Bestand im selben Filterkontext. |
| Recherchequelle | praktischer Playwright-Lauf `npm run fibu:inventory:valuation` |
| Testergebnis | Der Report rendert read-only mit Stichtag, Item- und Lagerortfilter. `INVENTORY-002` zeigt die negative Ausgangssumme; `INVENTORY-003` erklaert sie aus P2P-Zugang `RAW-STEEL = 25.000,00` und O2C-Abgang `RM-M100 = -42.000,00`. `INVENTORY-008` bucht danach den kontrollierten Trainings-/Opening-Balance-Zugang `RM-M100 +2` und belegt die korrigierte Laborbewertung `Total Inventory Value = 67.000,00`. |
| Entscheidung | Buch ergaenzt: Lagerbewertung braucht Stichtag und Filter. Negative Lagerwerte sind kein Screenshotfehler, sondern ein Hinweis auf Bestands-/Kostenkette, Anfangsbestand oder Reihenfolge der Bewegungen. Der positive Laborzugang ist jetzt belegt, bleibt aber Trainings-/Opening-Balance-Logik und kein Manufacturing-Output oder deutscher Finalabschluss. |
| Buchstelle | Kapitel 13 Inventory/Warehouse, Kapitel 23 Inventory Costing und Lagerbewertung |

Bewertung:

Das ist ein idealer Lernfall fuer Anfaenger: Der Bericht ist nicht falsch, sondern zeigt die Folge der gebuchten Laborposten. Wer Lagerbewertung versteht, muss Artikelposten, Wertposten, Stichtag, Lagerortfilter und Anfangsbestand zusammen lesen. Die erklaerende Kette ist jetzt dokumentiert und durch `INVENTORY-008` praktisch geschlossen: `RM-M100` hat im Labor einen belegten positiven Zugang. Der naechste Schritt ist nicht noch eine Inventory-Buchung, sondern didaktische Abrundung, Reporting-Dimensionswirkung oder Payments/OP-Ausgleich.

Folgeentscheidung aus `INVENTORY-004` bis `INVENTORY-008`: Der klar markierte Trainings-/Opening-Balance-Zugang `RM-M100 +2` in `FRA-ZL` war der kleinste kontrollierte Schritt und wurde genau einmal gebucht. Einkauf von `RM-M100` passt fachlich schlechter, Assembly gehoert in einen anderen Prozess, und Manufacturing/Output bleibt der spaetere echte End-to-End-Nachweis fuer Maschinenfertigung.

## FIND-BC-GOV-001 Autopilot-State und Gates verhindern Drift und Doppelbuchungen

| Feld | Wert |
|---|---|
| Status | erledigt als Governance-Sync |
| Projekt | fibu-book5 |
| Testfall | `GOVERNANCE-001-AUTOPILOT-STATE-GATES`, `WAREHOUSE-002` |
| Screenshot | keiner; Governance-/State-Sync ohne BC-Lauf |
| Evidence | `playwright/projects/fibu-book5/AUTOPILOT-STATE.json`, `playwright/projects/fibu-book5/POSTING-AND-SETUP-GATES.md`, `playwright/projects/fibu-book5/CURRENT-STATE.md`, `playwright/projects/fibu-book5/LAB-FIT-STATUS.md` |
| BC-Seite | keine |
| sichtbarer Text / Werte | O2C `PS-INV103297`, P2P `108219`, Inventory `INV008-899959`; gesperrte Gates fuer Payments, Reporting Analysis View, DE-VAT, Fixed Assets, Warehouse, Manufacturing, Service, Projects, neue Company und Wiederholungsbuchungen |
| Elementtyp | Governance / Handover / Autopilot-Sicherheit |
| erste Hypothese | Wiederholte Queue-Laeufe brauchen eine maschinenlesbare Wahrheit, sonst koennen alte Prompts versehentlich Zahlungen, Setup-Fits oder Doppelbuchungen ausloesen. |
| Recherchequelle | aktueller Repo-Stand und V2-Autopilot-Prompt |
| Testergebnis | `AUTOPILOT-STATE.json` haelt Sandbox, Company, letzte Laborbuchungen, Hard Locks und naechsten nicht freigabepflichtigen Schritt fest. `POSTING-AND-SETUP-GATES.md` definiert, welche Aktionen ohne ausdrueckliche Freigabe gesperrt sind. |
| Entscheidung | Folge-Agenten muessen vor Setup-Aenderungen, Buchungen, neuer Company oder Wiederholungen die Gate-Datei lesen. `FIXEDASSETS-008` und `WAREHOUSE-002` sind erledigt; ohne Freigabe bleiben Fixed Assets und Warehouse-Aktivierung gesperrt. Naechster praktischer Schritt ohne Gate ist ein anderer read-only Block, aktuell Manufacturing/Assembly-Readiness. |
| Buchstelle | Handover, Evidence Governance, alle Kapitel mit Buchung oder Setup-Aenderung |

Bewertung:

Das ist kein Business-Central-Fachnachweis, aber ein wichtiger Projektsicherheitsnachweis. Das Buchprojekt lernt durch echte Bedienung; damit diese Bedienung nicht chaotisch wird, muessen einmalige Laborbuchungen und freigabepflichtige Setup-Schritte explizit gesperrt sein.

## FIND-BC-INV-003 Item Journal kann Zielbestand vorbereiten, pruefen und buchen

| Feld | Wert |
|---|---|
| Status | erledigt als CRONUS-USA-Laborbuchung |
| Projekt | fibu-book5 |
| Testfall | `INVENTORY-006`, `INVENTORY-007`, `INVENTORY-008` |
| Screenshot | `playwright/projects/fibu-book5/img/inventory-006-010-target-journal-line-before-post.png`, `playwright/projects/fibu-book5/img/inventory-007-010-journal-check-no-issues.png`, `playwright/projects/fibu-book5/img/inventory-008-010-journal-line-before-post.png`, `playwright/projects/fibu-book5/img/inventory-008-050-item-ledger-entry.png`, `playwright/projects/fibu-book5/img/inventory-008-091-inventory-valuation-preview.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/inventory-006/README.md`, `playwright/projects/fibu-book5/evidence/inventory-006/INVENTORY-006-TARGET-STOCK-DRAFT-result.json`, `playwright/projects/fibu-book5/evidence/inventory-007/README.md`, `playwright/projects/fibu-book5/evidence/inventory-007/INVENTORY-007-JOURNAL-CHECK-result.json`, `playwright/projects/fibu-book5/evidence/inventory-008/README.md`, `playwright/projects/fibu-book5/evidence/inventory-008/INVENTORY-008-POSTING-result.json` |
| BC-Seite | `Item Journals`, Page `40` |
| sichtbarer Text / Werte | `Positive Adjmt.`, `INV008-899959`, `RM-M100`, `FRA-ZL`, Menge `2`, `PCS`, Unit Amount/Amount/Unit Cost `42.000,00`/`84.000,00`, `PRODUCTLINE=MACHINE` im Dimensionsdialog, `Journal Check`, `No issues found`, Artikelposten, Wertposten, Sachposten `14140`, Inventory Valuation `67.000,00` |
| Elementtyp | Inventory Journal / positiver Trainingsbestand / Vorabkontrolle |
| erste Hypothese | Der kleinste kontrollierte Weg zum positiven `RM-M100`-Bestand ist eine positive Anpassung im Item Journal, aber vor Buchung braucht es eine belastbare Kontrolle. |
| Recherchequelle | praktische Playwright-Laeufe `npm run fibu:inventory:target-stock-draft`, `npm run fibu:inventory:journal-check`, `npm run fibu:inventory:post-target-stock` |
| Testergebnis | Die Zielzeile kann vorbereitet werden, BC zieht Mengen-, Betrags- und Kostenwerte plausibel, `PRODUCTLINE=MACHINE` ist vor Buchung sichtbar. `Preview Posting` wurde im Item Journal nicht als nutzbare Aktion nachgewiesen. `INVENTORY-008` nutzt deshalb den belegten Journal-Check-/Current-line-Preflight und bucht genau einmal. Danach sind Artikelposten, Wertposten, Sachposten und Inventory Valuation sichtbar. |
| Entscheidung | Buch ergaenzen: Ein Journal-Draft und ein gruener Journal Check sind Vorabkontrollen; der Bestandsnachweis entsteht erst nach bewusster Buchung ueber Artikelposten, Wertposten, Sachposten und Lagerbewertung. Rechts liegende Felder wie `Applies-to Entry` duerfen nicht blind mit Kostenwerten gefuellt werden. |
| Buchstelle | Kapitel 13 Inventory/Warehouse, Kapitel 23 Inventory Costing und Lagerbewertung |

Bewertung:

Das ist ein sehr guter Anfaenger-Lernfall. Die Zeile sieht fachlich einfach aus, aber BC-Journale haben viele Spalten mit unterschiedlicher Bedeutung. `Unit Cost` ist eine Bewertungsinformation; `Applies-to Entry` ist eine Zuordnungs-/Ausgleichsspalte. Wer dort den Kostenwert eintraegt, erzeugt einen Zeilenfehler statt einer besseren Bewertung. `INVENTORY-008` hat die bewusste Laborbuchung umgesetzt. Fuer die naechste Arbeit braucht das Projekt keine weitere `INV008`-Buchung, sondern Buch-/Anfaengererklaerung und spaeter getrennte Reporting-, Warehouse- oder Manufacturing-Nachweise.

## FIND-BC-WH-001 Warehouse-Readiness ist nicht Warehouse-Aktivierung

| Feld | Wert |
|---|---|
| Status | erledigt als read-only Readiness und Buch-Sync; Aktivierung offen/gate-gesperrt |
| Quelle | `WAREHOUSE-001`, `WAREHOUSE-002` |
| BC-Seite | Locations / Tell-Me |
| sichtbarer Text / Werte | `FRA-ZL`, `Warehouse Receipts`, `Warehouse Put-aways`, `Warehouse Picks`, `Bins`; `Warehouse Shipments` nicht belastbar sichtbar |
| Elementtyp | Lagerort / Warehouse-Einstiegspfade |
| erste Hypothese | Nach Inventory-Postenspur und Lagerbewertung muss zuerst geklaert werden, ob `FRA-ZL` schon Warehouse-Logik traegt oder nur einfacher Lagerort ist. |
| Testergebnis | `WAREHOUSE-001` oeffnet `FRA-ZL` read-only als Location. Die typischen Warehouse-Marker `Bin Mandatory`, `Require Receive`, `Require Shipment`, `Require Put-away`, `Require Pick` und `Directed Put-away and Pick` sind nicht sichtbar. Tell-Me zeigt `Warehouse Receipts`, `Warehouse Put-aways`, `Warehouse Picks` und `Bins`; `Warehouse Shipments` wurde nicht belastbar sichtbar. Keine Bins, keine Warehouse-Aktivitaet, keine Setup-Aenderung, keine Buchung. |
| Entscheidung | Kapitel 13 stellt den aktuellen Laborstand jetzt nur als einfachen Lagerort plus Warehouse-Readiness dar. `WAREHOUSE-002` hat dafuer eine Statusbox ergaenzt: Buchziel, RM-DEMO-Labor, Warehouse-Readiness, Nichtbehauptungen, Gate und deutscher Finalnachweis sind getrennt. Ein gesteuerter Warehouse-Prozess braucht weiter ein eigenes Gate fuer Aktivierung, Bins und spaetere Prozess-Evidence. Naechster sicherer Schritt ohne Gate ist Manufacturing/Assembly-Readiness read-only. |
| Buchstelle | Kapitel 13 Inventory/Warehouse |

Fuer Anfaenger ist das wichtig, weil `Location Code = FRA-ZL` nicht automatisch bedeutet, dass BC schon Warehouse Receipts, Put-aways, Picks und Bins erzwingt. Ein Lagerort ist die Ortsdimension der Bewegung; Warehouse-Aktivierung ist zusaetzliches Setup, das den Prozesspfad aendert.

## FIND-BC-MFG-001 Manufacturing-Readiness ist nicht Produktionsfaehigkeit

| Feld | Wert |
|---|---|
| Status | erledigt als read-only Readiness und Buch-Sync; Setup und Buchung offen/gate-gesperrt |
| Quelle | `MANUFACTURING-001`, `MANUFACTURING-002` |
| BC-Seite | Tell-Me, Item Card Page `31` |
| sichtbarer Text / Werte | `Planning Worksheet`, `Production BOMs`, `Routings`, `Released Production Orders`, `Consumption Journal`, `Output Journal`; `RM-M100`, `RAW-STEEL`; `COMP-CTRL` und `KIT-MAINT` nicht sichtbar |
| Elementtyp | Planning-/Manufacturing-/Assembly-Einstiege und Artikel-Readiness |
| erste Hypothese | Nach Inventory/Warehouse muss zuerst geklaert werden, ob Kapitel 14 ueberhaupt die noetigen Einstiege und Zielartikel in `RM-DEMO` findet, bevor BOM/Routing, Fertigungsauftrag, Verbrauch oder Output geplant werden. |
| Testergebnis | `MANUFACTURING-001` findet die zentralen Manufacturing-Einstiege ueber Tell-Me, aber `Assembly Orders` nicht belastbar. `RM-M100` und `RAW-STEEL` sind als Artikel sichtbar; `COMP-CTRL` und `KIT-MAINT` sind nicht sichtbar. Auf den Artikelkarten wurden keine sichtbaren BOM-/Routing-/Manufacturing-Marker nachgewiesen. Keine Einrichtung, kein Fertigungsauftrag, kein Montageauftrag, kein Verbrauch, kein Output und keine Buchung. |
| Entscheidung | Kapitel 14 hat mit `MANUFACTURING-002` eine eigene Readiness-Statusbox bekommen: sichtbare Menueinstiege reichen nicht. Fuer einen belastbaren Manufacturing-Fall fehlen mindestens Komponenten-/Kit-Stammdaten, BOM/Routing- oder Assembly-Struktur, ein freigegebener Auftrag, Preview/Pruefung soweit verfuegbar und danach Postenspur. Der vorhandene Inventory-Zugang `INV008-899959` bleibt Trainingsbestand und kein Manufacturing-Output. |
| Buchstelle | Kapitel 14 Planning, Assembly und Manufacturing |

Fuer Anfaenger ist das der Kern: Business Central zeigt viele Produktionsseiten, aber Seitenzugriff ist noch kein Produktionsprozess. Erst wenn Stammdaten, Struktur, Auftrag, Verbrauch, Output und Kostenposten zusammenpassen, darf aus einem Navigationsbild ein Buchungsfall werden.

## FIND-BC-SRV-001 Service-Readiness ist nicht Servicefaehigkeit

| Feld | Wert |
|---|---|
| Status | erledigt als Buch-Sync; praktische Setup-/Buchungslinie gate-gesperrt |
| Quelle | `SERVICE-001` |
| Screenshot | `playwright/projects/fibu-book5/img/service-001-010-service-orders-tell-me.png`, `playwright/projects/fibu-book5/img/service-001-020-service-items-tell-me.png`, `playwright/projects/fibu-book5/img/service-001-030-resources-tell-me.png`, `playwright/projects/fibu-book5/img/service-001-080-service-item-rm-m100-sn1001.png`, `playwright/projects/fibu-book5/img/service-001-090-item-sp-pump-01.png`, `playwright/projects/fibu-book5/img/service-001-100-resource-res-tech.png`, `playwright/projects/fibu-book5/img/service-001-110-location-van-serv.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/service-001/SERVICE-001-result.json`, `playwright/projects/fibu-book5/evidence/service-001/SERVICE-001-READINESS.md`, `playwright/projects/fibu-book5/evidence/service-001/README.md` |
| BC-Seite | Tell-Me, Service Items, Resources, Customers, Items, Locations |
| sichtbarer Text / Werte | Tell-Me zeigt `Service Orders`, `Service Items`, `Resources`, `Service Management Setup`, `Service Contracts`, `Service Ledger Entries`; `D10000` ist sichtbar; `RM-M100-SN1001`, `SP-PUMP-01`, `RES-TECH`, `VAN-SERV` sind als konkrete Zielnummern nicht sichtbar |
| Elementtyp | Service-Readiness / Stammdatenluecke / Gate-Grenze |
| erste Hypothese | Ein Serviceauftrag braucht mehr als einen sichtbaren Menueeintrag: gewartetes Objekt, Servicekunde, Ersatzteil, Technikerressource, Technikerlager und Entscheidung ueber Faktura/Garantie/Kulanz muessen zusammenpassen. |
| Testergebnis | `SERVICE-001` laeuft read-only erfolgreich. Der Lauf erzeugt Navigationsevidence und Zielobjekt-Evidence, aber keine Einrichtung, keinen Serviceauftrag, keinen Ersatzteilverbrauch, keine Ressourcenerfassung, keine Rechnung und keine Buchung. |
| Entscheidung | Kapitel 15 hat mit `SERVICE-002` eine Readiness-Statusbox vor der Schrittfolge bekommen. Service-Seiten sind erreichbar, aber der Buchfall `SERV-4001` ist in `RM-DEMO` noch nicht servicefaehig, solange `RM-M100-SN1001`, `SP-PUMP-01`, `RES-TECH` und `VAN-SERV` nicht UI-first gefittet und belegt sind. |
| Buchstelle | Kapitel 15 Service |

Fuer Anfaenger ist das wichtig, weil Service mehrere Welten verbindet: Kundenmaschine, Ersatzteilbestand, Technikerzeit, Garantie-/Kulanzentscheidung und Finance-Wirkung. Ein sichtbarer `Service Orders`-Treffer ist nur die Tuer. Der Prozess beginnt erst, wenn die Zielobjekte vorhanden sind und vor jeder Buchung eine Preview-/Postenspur-Strategie feststeht.

## FIND-BC-PROJ-001 Project-Readiness ist nicht Projektfaehigkeit

| Feld | Wert |
|---|---|
| Status | erledigt als Buch-Sync; praktische Setup-/Buchungslinie gate-gesperrt |
| Quelle | `PROJECTS-001` |
| Screenshot | `playwright/projects/fibu-book5/img/projects-001-010-projects-tell-me.png`, `playwright/projects/fibu-book5/img/projects-001-020-project-planning-lines-tell-me.png`, `playwright/projects/fibu-book5/img/projects-001-030-project-journals-tell-me.png`, `playwright/projects/fibu-book5/img/projects-001-040-project-ledger-entries-tell-me.png`, `playwright/projects/fibu-book5/img/projects-001-050-project-statistics-tell-me.png`, `playwright/projects/fibu-book5/img/projects-001-060-project-wip-tell-me.png`, `playwright/projects/fibu-book5/img/projects-001-070-project-proj-5001.png`, `playwright/projects/fibu-book5/img/projects-001-080-customer-d10000.png`, `playwright/projects/fibu-book5/img/projects-001-090-resource-res-tech.png`, `playwright/projects/fibu-book5/img/projects-001-100-item-sp-sensor-02.png`, `playwright/projects/fibu-book5/img/projects-001-110-location-proj-lag.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/projects-001/PROJECTS-001-result.json`, `playwright/projects/fibu-book5/evidence/projects-001/PROJECTS-001-READINESS.md`, `playwright/projects/fibu-book5/evidence/projects-001/README.md`, `playwright/projects/fibu-book5/evidence/projects-002/PROJECTS-002-BOOK-SYNC.md`, `playwright/projects/fibu-book5/evidence/projects-002/PROJECTS-002-result.json` |
| BC-Seite | Tell-Me, Jobs/Projects, Customers, Resources, Items, Locations |
| sichtbarer Text / Werte | Tell-Me zeigt `Projects`, `Project Planning Lines`, `Project Journals`, `Project Ledger Entries`, `Project Statistics`, `Project WIP`; `D10000` ist sichtbar; `PROJ-5001`, `RES-TECH`, `SP-SENSOR-02`, `PROJ-LAG` sind als konkrete Zielnummern nicht sichtbar |
| Elementtyp | Project-Readiness / Stammdatenluecke / Gate-Grenze |
| erste Hypothese | Ein Projektfall braucht mehr als sichtbare Project-/Job-Seiten: Projekt, Aufgaben, Projektkunde, Ressource, Material, Projektlager, Planzeilen, Projektjournal, WIP-/Statistiklogik und Faktura muessen zusammenpassen. |
| Testergebnis | `PROJECTS-001` laeuft read-only erfolgreich. Der Lauf erzeugt Navigationsevidence und Zielobjekt-Evidence, aber keine Einrichtung, kein Projekt, keine Projektaufgaben, keine Planzeilen, kein Projektjournal, keine WIP-Berechnung, keine Rechnung und keine Buchung. |
| Entscheidung | Kapitel 16 wurde mit `PROJECTS-002` synchronisiert: Project-/Job-Seiten sind nur Readiness. Der Buchfall `PROJ-5001` ist in `RM-DEMO` noch nicht projektfaehig, solange Projekt, Projektaufgaben, Ressource, Material und Projektlager nicht UI-first gefittet und belegt sind. |
| Buchstelle | Kapitel 16 Projects |

Fuer Anfaenger ist das wichtig, weil Projects Kosten, Verbrauch, WIP-nahe Sicht und Faktura ueber Zeit verbindet. Ein sichtbarer `Projects`-Treffer ist nur der Einstieg. Der Prozess beginnt erst, wenn Stammdaten, Projektaufgaben, Projektjournal, WIP-/Statistikpruefung und Meilensteinrechnung als zusammenhaengende Kette belegt sind. `PROJECTS-002` hat diese Grenze ins Buch uebertragen; die praktische Setup-/Buchungslinie bleibt Gate-Folgearbeit.

## FIND-BC-DROP-001 Dropshipping-Readiness ist nicht Dropshipping-Prozess

| Feld | Wert |
|---|---|
| Status | erledigt als Buch-Sync; praktische Setup-/Buchungslinie gate-gesperrt |
| Quelle | `DROPSHIPPING-001` |
| Screenshot | `playwright/projects/fibu-book5/img/dropshipping-001-010-sales-orders-tell-me.png`, `playwright/projects/fibu-book5/img/dropshipping-001-020-purchase-orders-tell-me.png`, `playwright/projects/fibu-book5/img/dropshipping-001-030-requisition-worksheets-tell-me.png`, `playwright/projects/fibu-book5/img/dropshipping-001-040-drop-shipments-tell-me.png`, `playwright/projects/fibu-book5/img/dropshipping-001-050-purchasing-codes-tell-me.png`, `playwright/projects/fibu-book5/img/dropshipping-001-060-customer-d11000.png`, `playwright/projects/fibu-book5/img/dropshipping-001-070-vendor-k20000.png`, `playwright/projects/fibu-book5/img/dropshipping-001-080-item-sp-pump-01.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/dropshipping-001/DROPSHIPPING-001-result.json`, `playwright/projects/fibu-book5/evidence/dropshipping-001/DROPSHIPPING-001-READINESS.md`, `playwright/projects/fibu-book5/evidence/dropshipping-001/README.md`, `playwright/projects/fibu-book5/evidence/dropshipping-002/DROPSHIPPING-002-BOOK-SYNC.md`, `playwright/projects/fibu-book5/evidence/dropshipping-002/DROPSHIPPING-002-result.json` |
| BC-Seite | Tell-Me, Customers, Vendors, Items |
| sichtbarer Text / Werte | Tell-Me zeigt `Sales Orders`, `Purchase Orders`, `Requisition Worksheets` und `Purchasing Codes`; `Drop Shipments` ist nicht stabil sichtbar; `D11000`, `K20000`, `SP-PUMP-01` sind als konkrete Zielnummern nicht sichtbar |
| Elementtyp | Dropshipping-Readiness / Stammdatenluecke / Gate-Grenze |
| erste Hypothese | Nach Projects soll Kapitel 17 ohne Shopify-Scope als BC-Standard-Dropshipping-/Sonderverkauf geprueft werden, aber vor einem Beleglauf muessen Kunde, Lieferant, Artikel und Beschaffungspfad tragen. |
| Testergebnis | `DROPSHIPPING-001` laeuft read-only erfolgreich. Der Lauf erzeugt Navigationsevidence und Zielobjekt-Evidence, aber keine Einrichtung, keinen Verkaufsauftrag `DS-24001`, keine Einkaufsbestellung, keine Requisition-Worksheet-Aktion, keine Preview und keine Buchung. |
| Entscheidung | Kapitel 17 wurde mit `DROPSHIPPING-002` synchronisiert: sichtbare BC-Einstiege sind nur Readiness. Der Buchfall `DS-24001` ist in `RM-DEMO` noch nicht dropshippingfaehig, solange `D11000`, `K20000`, `SP-PUMP-01` und Drop-Shipment-/Purchasing-Code-Logik nicht UI-first gefittet und belegt sind. Shopify bleibt gestrichen. |
| Buchstelle | Kapitel 17 Dropshipping und Sonderverkauf |

Fuer Anfaenger ist das wichtig, weil Dropshipping wie ein normaler Verkauf beginnt, aber fachlich zwei Belegketten verbindet: Verkaufsauftrag und Einkaufsbestellung. Ein sichtbarer `Sales Orders`-Treffer beweist noch nicht, dass die direkte Lieferung, der Lieferant, die Beschaffung, die Marge, die Steuer und der Lager-Negativnachweis stimmen. `DROPSHIPPING-002` hat diese Grenze ins Buch uebertragen; die praktische Setup-/Buchungslinie bleibt Gate-Folgearbeit.

## FIND-BC-IC-001 Intercompany-Readiness ist nicht Intercompany-Prozess

| Feld | Wert |
|---|---|
| Status | Buch-Sync erledigt; praktische Setup-/Buchungslinie gate-gesperrt |
| Quelle | `INTERCOMPANY-001` |
| Screenshot | `playwright/projects/fibu-book5/img/intercompany-001-010-intercompany-setup-tell-me.png`, `playwright/projects/fibu-book5/img/intercompany-001-020-ic-partners-tell-me.png`, `playwright/projects/fibu-book5/img/intercompany-001-030-ic-inbox-tell-me.png`, `playwright/projects/fibu-book5/img/intercompany-001-040-ic-outbox-tell-me.png`, `playwright/projects/fibu-book5/img/intercompany-001-050-vat-entries-tell-me.png`, `playwright/projects/fibu-book5/img/intercompany-001-060-currencies-tell-me.png`, `playwright/projects/fibu-book5/img/intercompany-001-070-customer-d20000-eu.png`, `playwright/projects/fibu-book5/img/intercompany-001-080-customer-d30000-export.png`, `playwright/projects/fibu-book5/img/intercompany-001-090-customer-d90000-ic.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/intercompany-001/INTERCOMPANY-001-result.json`, `playwright/projects/fibu-book5/evidence/intercompany-001/INTERCOMPANY-001-READINESS.md`, `playwright/projects/fibu-book5/evidence/intercompany-001/README.md`, `playwright/projects/fibu-book5/evidence/intercompany-002/INTERCOMPANY-002-BOOK-SYNC.md` |
| BC-Seite | Tell-Me, Customers |
| sichtbarer Text / Werte | Tell-Me zeigt `Intercompany Setup`, `IC Partners`, `IC Inbox Transactions`, `IC Outbox Transactions`, `VAT Entries`; `Currencies` ist nicht stabil sichtbar; `D20000`, `D30000`, `D90000` sind als konkrete Zielnummern nicht sichtbar |
| Elementtyp | Intercompany-/Ausland-Readiness / Mehr-Company-Grenze / Stammdatenluecke |
| erste Hypothese | Kapitel 18 braucht vor IC-7001 zuerst den Nachweis, ob IC-Setup, IC-Partner, Inbox/Outbox, Auslandskunden, VAT und Waehrung in `RM-DEMO` ueberhaupt als Einstieg tragfaehig sind. |
| Testergebnis | `INTERCOMPANY-001` laeuft read-only erfolgreich. Der Lauf erzeugt Navigationsevidence und Zielobjekt-Evidence, aber keine neue Company, keinen Company-Wechsel, kein IC-Partner-Setup, keinen IC-Beleg, keine Inbox-/Outbox-Aktion, keine VAT-/Waehrungs-Aenderung und keine Buchung. |
| Entscheidung | `INTERCOMPANY-002` hat Kapitel 18 synchronisiert: sichtbare IC-Seiten sind nur Readiness. Der Buchfall `IC-7001` ist in `RM-DEMO` noch nicht intercompanyfaehig, solange Zielcompanies, IC-Partner, Zieldebitoren, Steuer-/Waehrungsfit und IC-Abstimmung nicht UI-first gefittet und belegt sind. |
| Buchstelle | Kapitel 18 Intercompany und Ausland |

Fuer Anfaenger ist das wichtig, weil Intercompany mehrere rechtliche Einheiten verbindet. Ein sichtbarer `IC Inbox`- oder `IC Outbox`-Treffer beweist noch nicht, dass Partner, Gegenbeleg, Steuerlogik, Waehrung, Abstimmung und Postenspur in beiden Companies tragen.

## FIND-BC-COMP-001 Compliance-Readiness ist kein E-Rechnungs-/GoBD-Finalnachweis

| Feld | Wert |
|---|---|
| Status | erledigt als Buch-Sync; praktische Setup-/Buchungslinie gate-gesperrt |
| Quelle | `COMPLIANCE-001` |
| Screenshot | `playwright/projects/fibu-book5/img/compliance-001-010-e-invoices-tell-me.png`, `playwright/projects/fibu-book5/img/compliance-001-020-vat-entries-tell-me.png`, `playwright/projects/fibu-book5/img/compliance-001-030-vat-posting-setup-tell-me.png`, `playwright/projects/fibu-book5/img/compliance-001-040-document-sending-profiles-tell-me.png`, `playwright/projects/fibu-book5/img/compliance-001-050-change-log-entries-tell-me.png`, `playwright/projects/fibu-book5/img/compliance-001-060-change-log-setup-tell-me.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/compliance-001/COMPLIANCE-001-result.json`, `playwright/projects/fibu-book5/evidence/compliance-001/COMPLIANCE-001-READINESS.md`, `playwright/projects/fibu-book5/evidence/compliance-001/README.md`, `playwright/projects/fibu-book5/evidence/compliance-002/COMPLIANCE-002-BOOK-SYNC.md` |
| BC-Seite | Tell-Me, Role Center |
| sichtbarer Text / Werte | `E-Rechnungen`, `VAT Entries`, `VAT Posting Setup`, `Document Sending Profiles`, `Change Log Entries`, `Change Log Setup`; Role-Center-Aktion `Warten auf Ka E-Rechnungen 0` |
| Elementtyp | Compliance-/E-Rechnungs-Readiness / Steuer- und Audit-Grenze |
| erste Hypothese | Kapitel 22 braucht vor finalen deutschen Nachweisen zuerst eine Orientierung, welche BC-Einstiege sichtbar sind und welche Einrichtungsschichten getrennt bleiben muessen. |
| Testergebnis | `COMPLIANCE-001` laeuft read-only erfolgreich. Der Lauf erzeugt Navigationsevidence und Screenshot-Kandidaten, aber keine VAT-Aenderung, keine E-Rechnungsvalidierung, keinen Versand, keinen Peppol-/Providerstatus, keine Change-Log-Aktivierung, kein Archiv und keine Buchung. |
| Entscheidung | Kapitel 22 wurde mit `COMPLIANCE-002` synchronisiert: sichtbare E-Rechnungs-/VAT-/Versandprofil-/Change-Log-Kontexte sind nur Readiness. Ein finaler deutscher Nachweis braucht eigenen UI-first Gate-Lauf mit Setupwerten, gebuchtem Beleg, USt-Posten, E-Dokument/Status und Audit-/Archivnachweis. |
| Buchstelle | Kapitel 22 USt, E-Rechnung und deutsche Nachweissicht |

Fuer Anfaenger ist das besonders wichtig, weil Business Central Compliance-Funktionen als viele einzelne Einstiegspunkte zeigt. Ein sichtbarer Button wie `Warten auf Ka E-Rechnungen 0` ist ein Hinweis, aber kein Beweis, dass eine Rechnung strukturiert erzeugt, validiert, versendet, archiviert und steuerlich korrekt nachgewiesen wurde. Diese Trennung steht jetzt in Kapitel 22; praktische Einrichtung bleibt gate-gesperrt.

## FIND-BC-SEC-001 Security-Readiness ist kein Berechtigungs-/SoD-Finalnachweis

| Feld | Wert |
|---|---|
| Status | erledigt als Buch-Sync; praktische Setup-Linie gate-gesperrt |
| Quelle | `SECURITY-001` |
| Screenshot | `playwright/projects/fibu-book5/img/security-001-010-users-tell-me.png`, `playwright/projects/fibu-book5/img/security-001-020-permission-sets-tell-me.png`, `playwright/projects/fibu-book5/img/security-001-030-profiles-roles-tell-me.png`, `playwright/projects/fibu-book5/img/security-001-040-security-groups-tell-me.png`, `playwright/projects/fibu-book5/img/security-001-050-user-setup-tell-me.png`, `playwright/projects/fibu-book5/img/security-001-060-job-queue-entries-tell-me.png`, `playwright/projects/fibu-book5/img/security-001-070-change-log-entries-tell-me.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/security-001/SECURITY-001-result.json`, `playwright/projects/fibu-book5/evidence/security-001/SECURITY-001-READINESS.md`, `playwright/projects/fibu-book5/evidence/security-001/README.md`, `playwright/projects/fibu-book5/evidence/security-002/SECURITY-002-BOOK-SYNC.md` |
| BC-Seite | Tell-Me, Role Center |
| sichtbarer Text / Werte | `Permission Sets`, `Profiles Roles`, `Security Groups`, `User Setup`, `Job Queue Entries`, `Change Log Entries`; `Users` nicht stabil sichtbar |
| Elementtyp | Security-/Admin-Readiness / Rechte- und Audit-Grenze |
| erste Hypothese | Kapitel 27 braucht vor jeder Admin-Aenderung zuerst eine Orientierung, welche BC-Kontexte fuer Benutzer, Rollen/Profile, Permission Sets, Security Groups, User Setup, Job Queue und Audit sichtbar sind. |
| Testergebnis | `SECURITY-001` laeuft read-only erfolgreich. Der Lauf erzeugt Navigations- und Screenshot-Evidence, aber keine Benutzeranlage, keine Permission-Set-Zuordnung, keine Profil-/Rollen-Aenderung, keine Security-Group-Aenderung, keine User-Setup-Aenderung, keine Job-Queue-Aenderung und keine Change-Log-Einrichtung. |
| Entscheidung | Kapitel 27 ist mit `SECURITY-002` synchronisiert: sichtbare Admin-/Security-Kontexte sind Readiness, aber kein Rechtekonzept, kein SoD-Test, kein Betriebsnachweis und kein deutscher Audit-Finalnachweis. Praktische Aenderungen nur mit Gate `SECURITY-002-USER-PERMISSION-SETUP`. |
| Buchstelle | Kapitel 27 Security, Rollen, Benutzer und Governance; Kapitel 39 Betrieb/Automatisierung |

Fuer Anfaenger ist diese Trennung zentral: Business Central zeigt Benutzer, Rollen/Profile, Berechtigungssaetze, Security Groups, User Setup, Job Queue und Change Log als getrennte Arbeitsorte. Wer nur einen Suchtreffer sieht, hat noch nicht bewiesen, dass ein Benutzer richtig berechtigt ist, dass Funktionstrennung eingehalten wird oder dass Aenderungen revisionssicher protokolliert werden.

## FIND-BC-MIG-001 Migration ist kein Import-Klick

| Feld | Wert |
|---|---|
| Status | erledigt als Buch-Sync; praktische Migration-/Opening-Balance-Linie gate-gesperrt |
| Quelle | `MIGRATION-001` |
| Screenshot | keine neuen Screenshots; Buch-/Readiness-Sync |
| Evidence | `playwright/projects/fibu-book5/evidence/migration-001/MIGRATION-001-READINESS.md`, `playwright/projects/fibu-book5/evidence/migration-001/MIGRATION-001-result.json`, `playwright/projects/fibu-book5/evidence/migration-001/README.md` |
| BC-Seite | nicht ausgefuehrt; Kapitel 28 Zielbild |
| sichtbarer Text / Werte | `Configuration Packages`, `Opening Balances`, `Cutover`, `INV008-899959` |
| Elementtyp | Migration-/Opening-Balance-Readiness / Gate-Grenze |
| erste Hypothese | Kapitel 28 darf nicht so wirken, als sei ein Import oder eine Saldenuebernahme nur ein technischer Klick. |
| Testergebnis | `MIGRATION-001` hat Kapitel 28 gegen den aktuellen Laborstand synchronisiert. Es gab keinen BC-Lauf, kein Konfigurationspaket, keinen Import, keine neue Company und keine Opening-Balance-Buchung. |
| Entscheidung | Kapitel 28 trennt jetzt Datenqualitaet/Migration, Opening-Balance-Buchungslogik und Cutover. `INV008-899959` bleibt Trainings-/Opening-Balance-Laborlogik und kein produktiver Migrationsendstand. |
| Buchstelle | Kapitel 28 Migration, Opening Balances und Cutover |

Fuer Anfaenger ist das wichtig, weil Migration sonst wie ein Excel-Upload wirkt. In Business Central muessen Stammdatenqualitaet, Buchungsgruppen, Dimensionen, Anfangssalden, Nebenbuecher, Lagerwerte und Freigaben zusammenpassen. Ein Importwerkzeug ersetzt keine fachliche Abstimmung.

## FIND-BC-PW-001 Playwright-Bilder muessen sichtbare fachliche Ziele beweisen

| Feld | Wert |
|---|---|
| Status | technischer Foundation-Finding; Patterns und Action Map aktualisiert |
| Quelle | `PLAYWRIGHT-BC-OPTIMIZATION-AUDIT` |
| Screenshot | keine neuen Screenshots; technischer Audit ohne BC-Lauf |
| Evidence | `playwright/projects/fibu-book5/PLAYWRIGHT-BC-OPTIMIZATION-AUDIT.md`, `playwright/projects/fibu-book5/BC-PLAYWRIGHT-PATTERNS.md`, `playwright/projects/fibu-book5/BC-PAGE-ACTION-MAP.json` |
| BC-Seite | nicht ausgefuehrt |
| sichtbarer Text / Werte | Audit zaehlt technische Risikomuster: viele feste Waits, Koordinatenklicks, `force: true`, `first/last/nth` |
| Elementtyp | Playwright-/Screenshot-QA-Finding |
| erste Hypothese | Technisch erzeugte Screenshots koennen unbrauchbar sein, wenn sie den eigentlichen Code, Betrag, Filter, Status, Dialog oder Zielwert nicht sichtbar zeigen. |
| Testergebnis | Kein neuer BC-Test. Der Audit hat die Regeln geschaerft: Screenshot-Kandidaten brauchen sichtbare fachliche Ziele; Action-Map-Eintraege nennen gefaehrliche Aktionen und empfohlene Helper; `bc-helpers.ts` enthaelt web-first Shell-/Seitentext-Helfer. |
| Entscheidung | Kuenftige Tests sollen vor Buch- oder Evidence-Screenshots pruefen, ob wirklich das beabsichtigte Lernziel sichtbar ist. Koordinaten-/Force-/Index-Fallbacks bleiben nur mit anschliessender Kontextpruefung akzeptabel. |
| Buchstelle | alle bebilderten Klickanleitungen, besonders Ledger-, Setup-, Journal-, Dialog- und Reporting-Screenshots |

Fuer Anfaenger ist das entscheidend, weil ein Bild nicht nur beweisen soll, dass Business Central offen war. Es soll zeigen, woran man fachlich erkennt, dass der Schritt stimmt: den Code, das Konto, die Dimension, den Betrag, die Buchungsoption, den Fehler oder den Reportwert.
