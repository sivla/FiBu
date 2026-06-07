# Technische Optimierungen

Diese Datei dokumentiert technische Verbesserungen am Playwright-/Business-Central-Projekt und erklärt, warum sie für Buch, Lernen und Wiederholbarkeit wichtig sind.

## OPT-BC-001 Wiederverwendbarer Business-Central-API-Helper

| Feld | Wert |
|---|---|
| Problem | `UAT-O2C-001` enthielt mehrfach dieselbe Logik für Access Token, Tenant/Environment, Company-Suche und BC-API-Requests. |
| Risiko | Künftige Tests würden diese Logik kopieren. Fehler in Cleanup, Company-Auswahl oder API-Filterung könnten sich wiederholen. |
| Optimierung | Die wiederverwendbaren API-Operationen liegen jetzt in `playwright/core/bc-api.ts`. |
| Aktueller Einsatz | `UAT-O2C-001` nutzt den Helper für Verkaufsauftrag anlegen, Verkaufszeile anlegen und Laboraufträge bereinigen. |
| Lernwirkung | API-Helper dienen nur der reproduzierbaren Datenanlage, Evidence und Bereinigung. Die UI bleibt der führende Lern- und Screenshot-Ort. |
| Regel | API darf die Buch-Klickanleitung nicht ersetzen. Jede fachlich relevante Datenanlage wird anschließend in Business Central geöffnet, geprüft und fotografiert. |

## Warum das wichtig ist

Das Projekt soll Business Central lernen, nicht nur Tests bestehen. Deshalb trennen wir:

| Ebene | Zweck |
|---|---|
| API | reproduzierbare Daten, schnelle Vorbereitung, Cleanup, technische Evidence |
| UI | Anfängerführung, Screenshots, sichtbare Feldlogik, Bedienverständnis |
| Buch | Erklärung von Zweck, Fehlerbild, Prüfung und Business-Wirkung |

Diese Trennung verhindert zwei schlechte Extreme:

- nur UI klicken, aber instabile und langsame Wiederholungsläufe bekommen
- nur API nutzen, aber keine echte Business-Central-Bedienung und keine anfängertauglichen Screenshots lernen

## OPT-BC-002 Einheitliche Evidence-Dateien

| Feld | Wert |
|---|---|
| Problem | `UAT-O2C-001` schrieb Evidence-Dateien direkt mit `fs.writeFile` und wiederholte Pfade wie `playwright/projects/fibu-book5/evidence/uat-o2c-001/...`. |
| Risiko | Künftige Tests könnten Evidence uneinheitlich ablegen, JSON unterschiedlich formatieren oder Ordner nicht zuverlässig erzeugen. |
| Optimierung | `playwright/core/evidence.ts` enthält jetzt `evidencePath`, `writeJsonEvidence` und `writeTextEvidence`. |
| Aktueller Einsatz | `UAT-O2C-001` nutzt diese Helper für API-Ergebnis, Seitentext, Ziel-vs.-Labor-Delta und Cleanup. |
| Lernwirkung | Evidence ist nicht nur technische Ablage, sondern Teil der Erklärung: Der Leser sieht, welcher Nachweis zu welchem Screenshot gehört. |
| Regel | Jeder neue Testfall legt Evidence unter `playwright/projects/<projekt>/evidence/<testfall>/` ab und nutzt sprechende Dateinamen mit Schrittpräfix. |

## Zielstruktur je Testfall

| Dateiart | Beispiel | Zweck |
|---|---|---|
| API-Ergebnis | `030-kopf-debitor-d10000-api-result.json` | technische Datenbasis und eindeutige Datensatznummern |
| Seitentext | `030-kopf-debitor-d10000-page-text.txt` | sichtbare UI-Evidence für Screenshot und Assertions |
| Abweichung | `045-target-vs-labor-delta.md` | verständliche Erklärung von Soll-Ist-Unterschieden |
| Cleanup | `999-cleanup.json` | Nachweis, dass Laborbelege nicht liegen bleiben |

## OPT-BC-003 Zentrale Ziel-vs.-Labor-Auswertung

| Feld | Wert |
|---|---|
| Problem | Der erste O2C-Lauf musste fachlich erklaeren, warum der Klickpfad funktioniert, aber das CRONUS-Labor nicht dem deutschen Zielbild `EUR` / `19 %` / `80.920` entspricht. Diese Auswertung darf nicht pro Testfall neu formuliert werden. |
| Risiko | Ohne Standard wuerden spaetere Laeufe Steuer-, Waehrungs- oder Betragsabweichungen uneinheitlich bewerten oder versehentlich als gruenen Fachnachweis behandeln. |
| Optimierung | `playwright/core/evidence.ts` enthaelt jetzt `buildFinancialTargetVsLaborDelta` und `renderFinancialTargetVsLaborDeltaMarkdown`. |
| Aktueller Einsatz | `UAT-O2C-001` schreibt `045-target-vs-labor-delta.json` und `045-target-vs-labor-delta.md` ueber die zentrale Logik. |
| Lernwirkung | Der Leser lernt nicht nur den Klickpfad, sondern auch den Unterschied zwischen Bediennachweis, Laborumgebung und fachlichem Zielmodell. |
| Regel | Jeder Buchfall mit erwarteten Betraegen, Steuer, Waehrung oder Dimensionen braucht einen Soll-Ist-Nachweis. `labor-delta` ist kein Testfehler, sondern ein dokumentierter Setup-Befund, solange der Bedienpfad nachweislich funktioniert. |

## OPT-BC-004 Screenshot-QA vor Buchfreigabe

| Feld | Wert |
|---|---|
| Problem | Gruene Tests koennen Screenshots erzeugen, die fachlich nicht als Buchbild taugen: falscher Listendatensatz, abgeschnittene Spalten, Stoerer, Laborwaehrung oder fehlende Dimension. |
| Risiko | Das Buch wuerde einen Klickpfad scheinbar bebildern, aber der Screenshot beweist nicht den behaupteten fachlichen Zustand. |
| Optimierung | `playwright/projects/fibu-book5/SCREENSHOT-QA.md` bewertet Bilder explizit als Laborbild, Kandidat, Finalbild oder ungeeignet. |
| Aktueller Befund | `UAT-O2C-001` ist als Bedienpfad gruen. `010` ist gutes Such-Laborbild, `020` nur Navigationsbild, `030` gutes Kopf-Laborbild mit Stoerern, `040` noch nicht buchfaehig. |
| Implementierung | Der zentrale `screenshot`-Helper schreibt optional `.screenshot.json` unter `evidence/<testfall>/`. Darin stehen Status, Buchnutzung, erwartete Werte im BC-Seitentext und bekannte Grenzen. |
| Regel | Kein Screenshot wird im Buch als finales Bild genutzt, bevor er gegen die sichtbaren Buchbehauptungen geprueft wurde. |
| Naechster technischer Ausbau | Screenshot-Helper soll optional Stoerer schliessen und Tabellenbilder mit definierter Spaltenposition erzeugen. Der O2C-Test hat dafuer bereits gelernt, dass der BC-Container `freeze-pane-scrollbar` per DOM-Scroll steuerbar ist. |

## OPT-BC-005 Playwright-MCP als Explorer, Playwright-Skripte als Produktionsweg

| Feld | Wert |
|---|---|
| Frage | Soll das Projekt Playwright-MCP fuer Business-Central-Klickpfade nutzen? |
| Aktueller Stand | Diese Codex-Sitzung stellt kein Playwright-MCP-Tool direkt bereit. Der offizielle MCP-Server wurde aber lokal ueber einen temporaeren Node-MCP-Client gestartet und konnte Business Central mit `--isolated --storage-state` angemeldet oeffnen. |
| Entscheidung | MCP macht fuer Business Central Sinn, aber als Explorer- und Setup-Helfer. Fuer Buchscreenshots und Evidence bleibt der Skriptweg fuehrend: `npm run fibu:uat:o2c` erzeugt reproduzierbare Screenshots, JSON-/Text-Evidence und Cleanup. |
| Rolle von MCP | MCP ist ideal, um unbekannte BC-Seiten live zu inspizieren, Menues wie `Line` -> `Related Information` -> `Dimensions` schneller zu finden, Rollen-/Sprachunterschiede zu erkunden und daraus bessere Locator-Ideen abzuleiten. |
| Grenze von MCP | MCP-Interaktionen sind dialogisch und zustandsabhaengig. Was fuer Buch, Wiederholung, Repo-Umzug und CI zaehlt, muss danach als Playwright-Test, Testdaten, Evidence und Markdown abgelegt werden. |
| Lernwirkung | Erst MCP-Exploration, dann Skript. So lernt das Projekt schneller Business Central, ohne die Reproduzierbarkeit zu verlieren. |
| Smoke-Evidence | `playwright/projects/fibu-book5/evidence/mcp-smoke/mcp-bc-home-snapshot.txt` |
