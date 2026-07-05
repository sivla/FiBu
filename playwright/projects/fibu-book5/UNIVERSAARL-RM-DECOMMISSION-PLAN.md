# Universaarl RM Decommission Plan

Aktive Buchwelt:

- Instanz: `playthru`
- Zielcompany: `UNIVERSAARL-DE`
- Musterfirma: `Universaarl GmbH`

Alte Referenzen wie `RM-DEMO`, Rhein-Main, `RM-*`, `MCP_1_20260210` und CRONUS bleiben kurzfristig nur als historische Labor- und Evidence-Quelle erhalten. Sie duerfen nicht mehr als aktive Zielwahrheit, Fallstudienwelt oder finaler deutscher Nachweis verwendet werden.

## Ziel

Das finale Buch soll wie ein einheitliches Universaarl-Buch wirken. Alte Rhein-Main-/RM-DEMO-/CRONUS-Bezuege werden Prozess fuer Prozess ersetzt, sobald Universaarl-Evidence vorhanden ist.

Nicht blind loeschen:

- alte Result JSONs,
- Screenshots,
- Evidence READMEs,
- gebuchte Laborbelege,
- historische Case-Dateien,
- Fehler- und Helper-Lernpunkte.

Diese Dateien bleiben zunaechst Beweiskette und Lernarchiv.

## Klassifikation

| Status | Bedeutung | Typische Aktion |
| --- | --- | --- |
| `active-must-replace-now` | Aktive Buch- oder State-Wahrheit nutzt noch Rhein-Main/RM als Zielwelt. | Sofort auf Universaarl umstellen oder als Legacy markieren. |
| `replace-with-universaarl-evidence` | Inhalt ist fachlich wertvoll, braucht aber neuen Universaarl-Nachweis. | Nach passendem Universaarl-Prozess ersetzen. |
| `convert-to-generic-helper` | RM-Bezug ist nur Testdatenname in Helper/Pattern. | Spaeter generisch machen. |
| `external-archive-later` | Historische Evidence/Result/Screen bleibt Archiv. | Nicht aktiv verwenden; spaeter archivieren. |
| `ready-for-removal` | Datei/Referenz hat keine aktive Beweiskettenfunktion mehr. | Nach Review entfernen. |
| `removed-from-active-repo` | Bereits aus aktiver Projektwahrheit entfernt. | Keine Aktion. |
| `false-positive` | Treffer ist kein alter Zielweltbezug. | Behalten. |

## Aktueller Audit-Befund

| Bereich | Befund | Klassifikation | Naechste Aktion |
| --- | --- | --- | --- |
| PREP-009 Active-Scan vom 30.06.2026 | Aktive Zielwelt ist `playthru` / `UNIVERSAARL-DE`; Company Creation bleibt wegen fehlender Rechte geparkt. Der aktive Katalog und State duerfen keine alten Execute-Ziele als naechste Wahrheit fuehren. | `active-must-replace-now` fuer veraltete Next-Step-Saetze, `replace-with-universaarl-evidence` fuer Prozessinhalte | `BC-FULL-PLAYTHROUGH-CATALOG.md` auf aktuelle PREP-009/010/011/012-Reihenfolge umgestellt; TARGET-009 bleibt bis Rechtefreigabe blockiert. |
| Buchmaster Kapitel 4/5/7/8 | Meta-Formulierungen wie "Dieses Kapitel erklaert" wurden in direkten Lesertext umgeschrieben. | `removed-from-active-repo` fuer diese Meta-Treffer | Bei weiteren Buchpatches denselben Stil anwenden. |
| Buchmaster Kapitel 23 Inventory Costing | Rhein-Main stand als aktive Abschlusswelt. | `active-must-replace-now` | Einstieg auf Universaarl-Zielwelt umgestellt; Detailbeispiele spaeter mit Universaarl-Evidence ersetzen. |
| Buchmaster insgesamt | Viele RM-/Rhein-Main-/CRONUS-Bezuege bleiben in Fallstudien-, Labor- und Prozessabschnitten. | `replace-with-universaarl-evidence` | Prozess fuer Prozess ersetzen, nicht per Massensuche. |
| `BC-COMPANY-USECASE.md` | Alte Referenzen sind bereits als Legacy-Laborarchiv markiert. | `removed-from-active-repo` fuer aktive Zielwahrheit, `external-archive-later` fuer alte Evidence | Behalten und weiter als Governance nutzen. |
| `CURRENT-STATE.md` | Sehr viele historische RM-DEMO/MCP Updates. | `external-archive-later` | Nicht als aktive Wahrheit lesen; spaeter verdichten/archivieren. |
| Coverage-/Atlas-Dateien | Alte Evidence wird oft als Lernquelle oder Laborreferenz genannt. | `replace-with-universaarl-evidence` | Sobald Universaarl-Prozess bewiesen ist: Coverage auf `superseded-by-universaarl`. |
| `.agent/state/current.json` | Aktive Wahrheit ist Universaarl; viele historische `latest*` Blocks bleiben. | `external-archive-later` | Spaeter State komprimieren, historische Blocks in Archivstate auslagern. |
| `.agent/state/cases/*` | Viele alte Case-Dateien enthalten RM-DEMO/MCP. | `external-archive-later` | Nicht loeschen; als historische Case-Evidence behalten. |
| npm-Scripts fuer `foundation-company-rm-demo` und `rm-de-lab-*` | Alte Laborcompany-Routen konnten direkt per npm gestartet werden. | `removed-from-active-repo` fuer aktive Ausfuehrung, `external-archive-later` fuer Testdateien | Scripts sind jetzt durch `legacy-script-blocked.mjs` gesperrt; Testdateien bleiben als historische Musterquelle erhalten. |
| Tests mit `rm-de-lab-*` | Alte Laborcompany-Routen. | `convert-to-generic-helper` oder `external-archive-later` | Nicht direkt aus package scripts starten; nach Universaarl-Company-Creation-Route generisch machen oder archivieren. |
| Evidence-Dateien | Viele RM-/CRONUS-Treffer in Result JSONs und Screenshots. | `external-archive-later` | Nicht veraendern, weil Beweiskette. |

## Kapitel-3-/Company-Prioritaet

Kapitel 3 bleibt der erste aktive Umbaupunkt. Die Universaarl-Zielcompany existiert noch nicht. Deshalb darf das Buch keine fertige deutsche Company-Anlage behaupten.

Naechste Buch-/Evidence-Reihenfolge:

1. `TARGET-005-COMPANY-CREATION-SOURCE-BACKED-ALTERNATIVE-ROUTE` ausfuehren.
2. Sichere Company-Creation-Route belegen oder sauber blockieren.
3. `UNIVERSAARL-DE` nur anlegen, wenn Blank/Setup-only/saubere Datenbasis sichtbar und verstanden ist.
4. Danach Kapitel 3 als echten Lesertext schreiben: Environment, Company, Mandantenliste, Neu/Kopieren/Testunternehmen, Datenbasis, Erfolgskontrolle.
5. Alte Rhein-Main-Fallstudienabschnitte erst ersetzen, wenn Universaarl-Basis steht.

## Buchstil-Regel

Aktiver Buchtext spricht direkt zum Thema, nicht ueber die Agentenarbeit.

Nicht verwenden:

- "Dieses Kapitel erklaert ..."
- "Der Leser soll verstehen ..."
- "Evidence zeigt ..."
- "Dieser Screenshot beweist ..."
- "Spaeter muss ..."
- "Der Case zeigt ..."
- "Der Agent hat ..."

Stattdessen:

- Welche Seite sieht man?
- Welcher Button ist relevant?
- Welches Feld ist wichtig?
- Warum ist der Schritt fachlich noetig?
- Was passiert nach Speichern oder Buchen?
- Welche Posten entstehen?
- Woran erkennt man Erfolg?
- Wie korrigiert man Fehler?

## Decommission-Reihenfolge

1. Aktive Steuerdateien duerfen keine erledigten PREP- oder alten RM-Execute-Cases als naechsten Schritt fuehren.
2. Aktive Buchmaster-Abschnitte auf Universaarl-Zielwelt umstellen, aber nur dort, wo keine falsche Finalbehauptung entsteht.
3. Company-/Foundation-Kapitel mit Universaarl-Evidence neu schreiben, sobald `UNIVERSAARL-DE` wirklich existiert.
4. Prozesskapitel nach Universaarl-Proof ersetzen.
5. Coverage/Atlas auf `superseded-by-universaarl` setzen, sobald ein konkreter Universaarl-Prozess den alten Laborprozess ersetzt.
6. Historische RM-DEMO-State-Bloecke in Archivstate verdichten.
7. Alte Tests/Helper generisch machen oder als Archiv markieren.
8. Erst danach nicht mehr benoetigte aktive RM-Dateien entfernen.

## Aktiver Script-Guard vom 06.07.2026

`package.json` darf alte RM-/MCP-/CRONUS-Routen nicht mehr als normale aktive Ausfuehrung anbieten. Deshalb wurden die folgenden Scripts auf einen lokalen Blocker umgestellt:

- `fibu:foundation:company`
- `fibu:company:rm-de-lab-create`
- `fibu:company:rm-de-lab-save-error`
- `fibu:company:rm-de-lab-create-new-company-route`

Der Blocker oeffnet kein Business Central und startet kein Playwright. Er erklaert, dass die aktive Wahrheit `playthru / UNIVERSAARL-DE / Universaarl GmbH` ist und dass ein alter RM-/MCP-Pfad zuerst portiert oder als `legacy-purge-source` klassifiziert werden muss.

Der neue Check `agent:legacy:active-check` ist Teil von `agent:preflight`. Er verhindert, dass neue package scripts ungebremst auf alte RM-/MCP-/CRONUS-Routen zeigen.

Erweiterung vom 06.07.2026: Der Check liest zusaetzlich die Playwright-Zieldateien aus `package.json`-Scripts. Direkte alte Scriptnamen oder Commands bleiben ein harter Fehler, wenn sie nicht ueber `legacy-script-blocked.mjs` gesperrt sind. Legacy-Begriffe innerhalb historischer oder noch nicht portierter Playwright-Specs werden dagegen als `legacy-target-file-reference` inventarisiert und nur als Warnung ausgegeben. Aktueller Befund: 433 Playwright-Zieldateien wurden geprueft, 431 enthalten noch alte RM-/MCP-/CRONUS-/Rhein-Main-Bezuege. Diese Treffer sind Migrationsarbeit: portieren, blockieren oder archivieren, aber nicht massenhaft historische Evidence ueberschreiben.

## PREP-009 Trefferklassifikation vom 30.06.2026

Die aktive Suche wurde auf Buchmaster, zentrale Kataloge/Atlanten und aktive State-Dateien begrenzt. Evidence-Ordner und Screenshots wurden nicht massenhaft bearbeitet.

| Datei / Bereich | Treffer grob | Klassifikation | Entscheidung |
| --- | ---: | --- | --- |
| `FiBu_Buch_BC_Standardprozesse_DE_Master_Blueprint.md` | 564 | `replace-with-universaarl-evidence` | Nicht massenhaft ersetzen. Kapitelweise durch Universaarl-Kapitel ersetzen, sobald Evidence vorhanden ist. |
| `.agent/state/current.json` | 209 | `external-archive-later` | Historische `latest*`-Bloecke bleiben vorerst Trace. Spaeter in Archivstate auslagern. |
| `BC-SCREENSHOT-INVENTORY.md` | 5 | `replace-with-universaarl-evidence` / `keep-as-warning` | CRONUS-Kontext bleibt als Nicht-Final-Warnung erlaubt; keine finalen Screenshots daraus ableiten. |
| `BC-COVERAGE-MATRIX.md` | 6 | `replace-with-universaarl-evidence` | Alte Prozesscoverage bleibt bis Universaarl-Ersatz als Laborstatus markiert. |
| `BC-FULL-PLAYTHROUGH-CATALOG.md` | 5 | `active-must-replace-now` fuer veraltete Next-Step-Planung | Naechste Case-Auswahl wurde auf PREP-009 ff. aktualisiert. |
| `BC-COMPANY-USECASE.md` | 5 | `removed-from-active-repo` fuer Zielwelt, `legacy-labor-reference` fuer Historie | Behalten; Datei trennt aktive Universaarl-Welt bereits sauber. |
| `BC-PAGE-ATLAS.md`, `BC-ACTION-ATLAS.md` | 2-4 | `replace-with-universaarl-evidence` | Behalten, bis Universaarl-Page-/Action-Evidence die alten Hinweise ersetzt. |
| `.agent/state/marathon_queue.json` | 8 | `false-positive` / aktive Queue-Namen | Behalten; PREP-009 ist der aktive Decommission-Case. |

## Naechste Decommission-Arbeit

1. `PREP-010` soll UI-/Tooltip-/Splitbutton-Regeln als Helper/Pattern schaerfen, damit neue Universaarl-Evidence besser wird.
2. `PREP-011` soll Screenshot-Erklaerungen pruefen, besonders dort, wo CRONUS-Shellkontext sichtbar ist.
3. `PREP-012` soll Look-and-Feel-/Filtertext vorbereiten, aber ohne alte RM-Daten als Zielwelt.
4. Nach Rechtefreigabe ersetzt `TARGET-009` die geparkte Company-Creation-Strecke durch echte Universaarl-Evidence.

## Harte Grenzen

- Keine alte Evidence massenhaft umbenennen.
- Keine gebuchten Laborbelege aus der Beweiskette loeschen.
- Keine Universaarl-Claims ohne Universaarl-Evidence.
- Keine CRONUS-Daten als Universaarl-Buchdaten ausgeben.
- Kein Mischbuch: Universaarl ist aktive Fallstudie, Rhein-Main ist Legacy.
