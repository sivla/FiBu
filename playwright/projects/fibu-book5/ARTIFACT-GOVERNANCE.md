# Artefakt-Governance fuer FiBu Buch 5

Diese Datei klaert, welche Projektartefakte welchen Zweck haben. Sie soll verhindern, dass Buchbilder, Laborbilder, MCP-Rohdaten, Evidence Packs und Projektwissen unkontrolliert ineinanderlaufen.

## Grundentscheidung

Das Projekt braucht vier getrennte Sichtweisen:

| Sicht | Zweck | Typische Dateien |
|---|---|---|
| Buch | erklaert Business Central fuer Leser | `FiBu_Buch_BC_Standardprozesse_DE_Master_Blueprint.md`, `img/*.png` |
| Test | wiederholt Klickpfade und Datenanlage | `playwright/projects/fibu-book5/tests/*.spec.ts`, `testdata/**/*.json` |
| Evidence | belegt, was ein Lauf gezeigt oder erzeugt hat | `playwright/projects/fibu-book5/evidence/<fall>/` |
| Lernen | bewertet BC-Verhalten und Buchluecken | `FINDINGS.md`, `WORKAROUNDS-AND-ERRORS.md`, `UI-INVENTORY.md`, `MICROSOFT-DOC-VALIDATION.md` |

Keine dieser Sichten ersetzt die andere. Ein Screenshot ist kein fachlicher Beweis ohne Erklaerung. Ein API-Nachweis ist kein Buchbild. Ein MCP-Snapshot ist kein stabiler Test. Ein gruener Test ist kein deutscher Steuer-Endstand.

## Artefaktklassen

| Klasse | Committen? | Zweck | Regel |
|---|---|---|---|
| Finale Buchbilder | ja | Bilder, die in die Buchfassung sollen | muessen deutsch, fachlich korrekt und visuell geprueft sein |
| Laborbilder | ja, wenn sie Buch-/Projektlernen tragen | zeigen Klickpfad, Fehler, Setup-Luecken oder UI-Verhalten | immer als Laborbild kennzeichnen, nicht als final verkaufen |
| Kompakte Evidence | ja | JSON/Markdown/Text, der einen Testfall nachvollziehbar macht | muss parsbar bzw. lesbar sein und zum Testfall passen |
| MCP-Rohsnapshots | nein, ausser auf ausdrueckliche Begruendung | explorative Accessibility-/Page-Snapshots | nach Moeglichkeit verdichten; `console-*.log` und `page-*.yml` bleiben ignored |
| Playwright-Reports | nein | lokale Testauswertung | bleibt in `playwright-report/`, ist ignored |
| Test-Results/Traces | nein, ausser gezielt als Fehlerbeleg | lokale Debug-Artefakte | bleibt in `test-results/`, ist ignored |
| Auth/Secrets | nie | Login-State, Tokens, `.env` | bleibt lokal |

## Ordnerregeln

| Pfad | Inhalt | Nicht hinein |
|---|---|---|
| `img/` | Buch- und Labor-Screenshots, die im Markdown referenziert werden koennen | unbenannte Debugbilder |
| `playwright/core/` | projektuebergreifende BC-Mechanik | Debitoren, Artikel, Buchfalllogik |
| `playwright/projects/fibu-book5/tests/` | versionierte Playwright-Testfaelle | MCP-Wegwerfskripte |
| `playwright/projects/fibu-book5/testdata/` | fachliche Ziel- und Stammdaten | Laufprotokolle |
| `playwright/projects/fibu-book5/evidence/<fall>/` | Testfallnachweise | allgemeine Projektregeln |
| `playwright/projects/fibu-book5/evidence/mcp-*` | selektive MCP-Lernnachweise als Text, JSON, Markdown oder Screenshot | dauerhaftes Debug-Archiv fuer jeden Klick; keine `console-*.log` oder `page-*.yml` |
| `%TEMP%/bc-playwright-mcp-client` | temporaere MCP-Clientskripte | Repo-Code |

## MCP-Regel

MCP findet Wege. Das Repo beweist Wege.

Ein MCP-Lauf ist projektwertvoll, wenn mindestens eine dieser Bedingungen gilt:

- Er findet einen neuen stabilen Klickpfad.
- Er erklaert ein BC-Feld, eine Seite oder eine Setup-Abhaengigkeit.
- Er belegt ein Fehlerbild, das Leser spaeter ebenfalls treffen koennen.
- Er widerlegt eine Buchannahme.

Ein MCP-Lauf ist nicht commit-wuerdig, wenn er nur Zwischenklicks, Fehlversuche ohne Erkenntnis oder technische Wiederholungen enthaelt.

Rohdateien aus MCP-/Browser-Explorationen werden nicht dauerhaft versioniert:

- `console-*.log`
- `page-*.yml`
- `page-*.yaml`

Wenn ein Rohsnapshot wirklich fachlich wichtig ist, wird er in eine kompakte Markdown-, Text- oder JSON-Evidence ueberfuehrt. Dadurch kann ein neuer Agent den Befund lesen, ohne hunderte technische Zwischenzustaende durchsuchen zu muessen.

## Evidence-Regel

Jeder fachliche Testfall soll am Ende diese Mindestnachweise haben:

| Nachweis | Beispiel |
|---|---|
| Screenshot-Metadaten | `uat-o2c-001-040-zeile-artikel-rm-m100.screenshot.json` |
| fachlicher Seitentext oder API-Beleg | `040-zeile-artikel-rm-m100-api-result.json` |
| Soll-Ist-Abgleich | `045-target-vs-labor-delta.md` |
| Cleanup-Nachweis | `999-cleanup.json` |
| Buchwirkung | Eintrag in Buch, Coverage oder Findings |

JSON-Dateien muessen gueltiges JSON sein. Textdateien duerfen frei sein, sollen aber sprechende Namen tragen.

## Buchbild-Regel

Ein Bild wird erst dann als finales Buchbild markiert, wenn:

1. der richtige Mandant sichtbar ist,
2. die Sprache zur Buchfassung passt,
3. die fachlich relevanten Felder sichtbar sind,
4. keine Stoerer wie Hilfekarten oder Popover die Aussage verdecken,
5. Waehrung, USt, Dimension, Preis und Datenstand zum Zielmodell passen,
6. der Buchtext erklaert, was im Bild zu sehen ist.

Bis dahin ist das Bild ein Laborbild.

## Commit-Regel

Kleine Commits sind besser als Sammelcommits. Trotzdem duerfen zusammengehoerende Pakete gemeinsam committed werden:

- Test + Screenshot + Evidence + Buchupdate
- MCP-Befund + Workaround + Microsoft-Doc-Validation
- Helper-Aenderung + betroffener Test + Nachweis

Nicht zusammengehoerend:

- neue BC-Funktion und unrelated Formatierung
- Evidence-Rohmasse ohne Buch- oder Testwirkung
- geheime oder lokale Auth-Artefakte

Jeder Commit/Push ist zugleich eine Uebergabe. Deshalb muss vor jedem Push gelten:

1. `CURRENT-STATE.md` beschreibt den tatsaechlichen Stand.
2. Der naechste sinnvolle Arbeitsschritt ist fuer einen neuen Agenten eindeutig.
3. Relevante Fehler, Workarounds und Buchwirkungen sind dokumentiert.
4. Das Repo enthaelt nur projektwertvolle Artefakte.
5. Die Arbeitskopie ist nach dem Push sauber.

## Aktueller Aufraeumbefund

Stand 07.06.2026:

- `UAT-O2C-001` ist ein wertvoller Laborlauf, aber kein finaler deutscher Steuerlauf.
- `EUR` ist am Debitor `D10000` geloest und per MCP nachgewiesen.
- `19 %` deutsche USt ist in der aktuellen CRONUS-USA-Spielwiese nicht geloest.
- Die MCP-Evidence wurde bereinigt: Roh-Logs und Page-YAMLs wurden entfernt; kompakte Text-/JSON-/Screenshot-Nachweise bleiben erhalten.
- Finale deutsche Buchbilder werden spaeter in einer konsistent deutschen Umgebung neu erzeugt.
