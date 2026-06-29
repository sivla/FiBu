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
| Buchmaster Kapitel 4/5/7/8 | Meta-Formulierungen wie "Dieses Kapitel erklaert" wurden in direkten Lesertext umgeschrieben. | `removed-from-active-repo` fuer diese Meta-Treffer | Bei weiteren Buchpatches denselben Stil anwenden. |
| Buchmaster Kapitel 23 Inventory Costing | Rhein-Main stand als aktive Abschlusswelt. | `active-must-replace-now` | Einstieg auf Universaarl-Zielwelt umgestellt; Detailbeispiele spaeter mit Universaarl-Evidence ersetzen. |
| Buchmaster insgesamt | Viele RM-/Rhein-Main-/CRONUS-Bezuege bleiben in Fallstudien-, Labor- und Prozessabschnitten. | `replace-with-universaarl-evidence` | Prozess fuer Prozess ersetzen, nicht per Massensuche. |
| `BC-COMPANY-USECASE.md` | Alte Referenzen sind bereits als Legacy-Laborarchiv markiert. | `removed-from-active-repo` fuer aktive Zielwahrheit, `external-archive-later` fuer alte Evidence | Behalten und weiter als Governance nutzen. |
| `CURRENT-STATE.md` | Sehr viele historische RM-DEMO/MCP Updates. | `external-archive-later` | Nicht als aktive Wahrheit lesen; spaeter verdichten/archivieren. |
| Coverage-/Atlas-Dateien | Alte Evidence wird oft als Lernquelle oder Laborreferenz genannt. | `replace-with-universaarl-evidence` | Sobald Universaarl-Prozess bewiesen ist: Coverage auf `superseded-by-universaarl`. |
| `.agent/state/current.json` | Aktive Wahrheit ist Universaarl; viele historische `latest*` Blocks bleiben. | `external-archive-later` | Spaeter State komprimieren, historische Blocks in Archivstate auslagern. |
| `.agent/state/cases/*` | Viele alte Case-Dateien enthalten RM-DEMO/MCP. | `external-archive-later` | Nicht loeschen; als historische Case-Evidence behalten. |
| Tests mit `rm-de-lab-*` | Alte Laborcompany-Routen. | `convert-to-generic-helper` oder `external-archive-later` | Nach Universaarl-Company-Creation-Route generisch machen oder archivieren. |
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

1. Aktive Buchmaster-Abschnitte auf Universaarl-Zielwelt umstellen.
2. Company-/Foundation-Kapitel mit Universaarl-Evidence neu schreiben.
3. Prozesskapitel nach Universaarl-Proof ersetzen.
4. Coverage/Atlas auf `superseded-by-universaarl` setzen.
5. Historische RM-DEMO-State-Bloecke in Archivstate verdichten.
6. Alte Tests/Helper generisch machen oder als Archiv markieren.
7. Erst danach nicht mehr benoetigte aktive RM-Dateien entfernen.

## Harte Grenzen

- Keine alte Evidence massenhaft umbenennen.
- Keine gebuchten Laborbelege aus der Beweiskette loeschen.
- Keine Universaarl-Claims ohne Universaarl-Evidence.
- Keine CRONUS-Daten als Universaarl-Buchdaten ausgeben.
- Kein Mischbuch: Universaarl ist aktive Fallstudie, Rhein-Main ist Legacy.
