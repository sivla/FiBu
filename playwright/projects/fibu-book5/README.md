# FiBu Buch 5 Playwright-Projekt

## Business-Central-Specialist-OS

Dieses Projekt wird als Business-Central-Durchspiel- und Buchproduktionssystem gefuehrt. Neue Laeufe sollen nicht nur einzelne Screenshots erzeugen, sondern Coverage, Atlas-Wissen, Evidence, Buchdrafts und Playwright-Faehigkeiten verbessern.

Zentrale Dateien:

| Datei | Zweck |
|---|---|
| `BC-REPO-INVENTORY.md` | Orientierung ueber State, Tests, Evidence, Screenshots, Drafts und Legacy-Risiken |
| `BC-COVERAGE-MATRIX.md` | Coverage-Level L0-L10 je Prozessbereich |
| `BC-PAGE-ATLAS.md` | belegte BC-Seiten und Page-Kontexte |
| `BC-FIELD-ATLAS.md` | belegte Felder, Spalten, Werte und Grenzen |
| `BC-ACTION-ATLAS.md` | Aktionen, Buttons, Menues und Guards |
| `BC-POSTING-IMPACT-ATLAS.md` | Preview-/Posting-/Ledger-Wirkung |
| `BC-SCREENSHOT-INVENTORY.md` | Screenshot-Gruppen, Buchnutzen und Grenzen |
| `BC-ERROR-BLOCKER-ATLAS.md` | wiederverwendbare Fehler-/Blockerlogik |
| `BC-PROCESS-COVERAGE-ROADMAP.md` | naechste Prozessstrecken statt Mikro-Gates |

Ein Gate ist kein Stoppsignal. Wenn ein Gate gruen ist, wird der naechste sichere Prozessschritt bestimmt und entweder ausgefuehrt oder als naechster Case vorbereitet. Mini-Cases sind nur dann sinnvoll, wenn sie Risiko isolieren, eine BC-/Playwright-Faehigkeit verbessern oder eine Buch-/Evidence-Luecke schliessen.

## Aktueller Einstieg

Neue Agents lesen zuerst:

```text
CURRENT-STATE.md
```

Diese Datei ist die kompakte Fortsetzungsanweisung fuer das Projekt.

Dieses Projekt enthält die Business-Central-Tests und Screenshots für `FiBu-Buch 5`.

## Ziel

Gelöste Fehler, technische Workarounds und bebilderte Stolperstellen stehen in `WORKAROUNDS-AND-ERRORS.md`. Diese Datei ist Pflichtlektüre, bevor ein Klickpfad erweitert wird, weil dort steht, welche BC-/Playwright-Probleme bereits gesehen und gelöst wurden.

Die Tests sollen die BC-Anleitungen im Buch praktisch durchspielen, fehlende Testdaten erzeugen oder prüfen und Screenshots für die bebilderten Klickanleitungen liefern.

Zusätzlich ist dieses Projekt eine Lernstrecke für Business Central. Beim Durchspielen sollen nicht nur die Buchschritte bestätigt werden. Wir beobachten auch, welche Business-Central-Funktionen sichtbar werden, welche Buttons und Menüs der Anwender sieht und welche Felder oder FactBoxes fachlich erklärt werden müssen.

Wenn ein Screenshot etwas zeigt, das im Buch noch nicht erklärt ist, wird daraus eine Fundstelle in `playwright/FINDINGS.md`. Relevante Fundstellen werden recherchiert, getestet und anschließend im Buch ergänzt.

Das Ziel ist praktisches Business-Central-Wissen. Am Ende soll dieses Projekt nicht nur wissen, welche Funktionen Business Central laut Dokumentation hat. Es soll die für das Buch relevanten Klickpfade, Buttons, Menüs und Funktionen real durchgespielt, fotografiert, verstanden und dokumentiert haben. Der Nachweis steht in `UI-INVENTORY.md`.

Die redaktionelle Abdeckung der bebilderten Klickanleitungen steht in `BOOK-CLICK-GUIDE-COVERAGE.md`.

Der blockuebergreifende Lab-Fit-Status steht in `LAB-FIT-STATUS.md`. Diese Datei enthaelt historische Laborbefunde und wird schrittweise durch Universaarl-Evidence ersetzt. Alte CRONUS-/RM-DEMO-Befunde sind nur Legacy-Referenz, keine aktive Zielwahrheit.

Die Anfänger-Didaktik steht in `BEGINNER-LEARNING-CHECKLIST.md`. Diese Checkliste ist vor allem für neue Codex-Accounts, Autoren und Consultants wichtig: Ein Klickpfad ist erst fertig, wenn Bedienung, Verständnis, Kontrolle, Fehlerbild und Lösung erklärt sind.

Die Bildfreigabe steht in `SCREENSHOT-QA.md`. Ein grüner Playwright-Lauf bedeutet noch nicht automatisch, dass der Screenshot buchfähig ist. Jedes Bild wird darauf geprüft, ob es den richtigen Datensatz, die richtigen Felder, passende Sprache/Währung/Steuerlogik und keine irreführenden Laborstörer zeigt.

Technische Projektstandards stehen in `TECHNICAL-OPTIMIZATIONS.md`. Dort wird festgehalten, welche Helper, Evidence-Regeln und Screenshot-Regeln für spätere Projekte und andere Business-Central-Umgebungen wiederverwendet werden.

Der Abgleich gegen Microsoft Learn steht in `MICROSOFT-DOC-VALIDATION.md`. Diese Datei trennt allgemeine Business-Central-Regeln, Legacy-Laborbefunde und Universaarl-Zielnachweise.

Die Portabilitätsregeln für andere Mandanten und spätere deutsche Umgebungen stehen in `ENVIRONMENT-PORTABILITY.md`.

Der Playwright-MCP-Arbeitsmodus steht in `PLAYWRIGHT-MCP-WORKFLOW.md`. MCP wird als Explorer fuer unbekannte Business-Central-Seiten, Menues und Setup-Pfade verstanden. Der belastbare Nachweis bleibt aber ein versionierter Playwright-Test mit Screenshots, Evidence und Cleanup.

## Umgebung

| Feld | Wert |
|---|---|
| Env-Prefix | `FIBU_BOOK5` |
| Zielinstanz | `playthru` |
| Zielcompany | `UNIVERSAARL-DE` |
| Musterfirma | `Universaarl GmbH` |
| Quelle | Universaarl-Zielaufbau, keine CRONUS-Finalclaims |
| Legacy | `RM-DEMO`, Rhein-Main, `MCP_1_20260210` und CRONUS nur als historische Evidence |
| Sprache im aktuellen Lauf | gemischt Deutsch/Englisch |
| Playwright-Viewport | `1920x1080` |
| Finaler Buchlauf | Universaarl-Evidence ersetzt alte Laborbilder Schritt fuer Schritt |

## Testdaten

Testdaten liegen unter:

```text
playwright/projects/fibu-book5/testdata/
```

Aktuell:

```text
masterdata/companies.json
masterdata/dimensions.json
masterdata/locations.json
masterdata/customers.json
masterdata/vendors.json
masterdata/items.json
sales/uat-o2c-001.json
purchase/uat-p2p-001.json
```

Dateien mit `rm-` im Namen bleiben historische Labor-Testdaten, bis sie durch Universaarl-Testdaten ersetzt oder archiviert sind.

## Befehle

```powershell
npm run auth:bc
npm run auth:bc:check
npm run auth:bc:diagnose
npm run agent:preflight
npm run agent:context
npm run agent:dry-run
npm run agent:run-plan
npm run fibu:target:playthru-context
```

Live-Universaarl-Tests duerfen erst laufen, wenn `npm run auth:bc:check` gruen ist. Bei rotem Auth-Gate ist Business Central tabu; dann werden nur lokale State-, Doku-, Queue- oder Helper-Fixes gemacht.

`MASTERDATA-005` nutzt Playwright nicht nur für Klicks und Screenshots, sondern auch als authentifizierten technischen Träger für die Business-Central-API. Der Webclient liefert den gültigen Session-Token; die API erzeugt die Stammdaten idempotent. Danach öffnet Playwright die BC-Seiten und erzeugt die Buchscreenshots.

Wichtig: Diese API-Anlage ersetzt nicht den fachlichen Posting-Fit. Sichtbar leere Buchungsgruppen oder Basiseinheiten bleiben Findings für `MASTERDATA-006`.

`MASTERDATA-006` setzt für die aktuelle CRONUS-Spielwiese einen technischen Posting-Fit: Customer Template, `PCS`, `RETAIL`, `RESALE`, `FURNITURE`. Danach beweist eine API-Probe, dass ein Sales Order mit `D10000`, `RM-M100`, Menge `1`, Preis `68.000` und Lagerort `FRA-ZL` angelegt werden kann. Das ist bewusst noch kein deutscher `EUR`-/`19 %`-USt-Nachweis.

`UAT-O2C-001` erzeugt aktuell Labor-Screenshots bis zum Verkaufsauftragskopf mit Debitor `D10000`. Reine Screenshot-Läufe dürfen die Spielwiese nicht unnötig mit Entwürfen füllen: Der Test ermittelt deshalb die erzeugte Auftragsnummer und entfernt den Entwurf nach dem Screenshot wieder. Finale Evidence-Läufe für Buchungsvorschau, Buchung und Postenspur werden später bewusst als eigene Nachweisläufe behandelt.

## Playwright MCP

Playwright MCP ist fuer dieses Projekt als Explorationswerkzeug sinnvoll, wenn der jeweilige Codex-/IDE-Client es bereitstellt. Es hilft besonders beim Finden von BC-Aktionen, Menues, Labels und Dialogen, etwa bei verschachtelten Pfaden wie `Line` -> `Related Information` -> `Dimensions`.

Projektregel:

- MCP darf Klickpfade live finden.
- MCP darf Setup-Pfade ausprobieren.
- MCP darf Locator-Ideen liefern.
- MCP ersetzt keine versionierten Tests.
- Jede MCP-Erkenntnis wird danach in Test, Evidence und Markdown ueberfuehrt.

Aktueller Sitzungsstand: In dieser Codex-Sitzung ist kein Playwright-MCP-Tool direkt verfuegbar. Der offizielle MCP-Server wurde aber lokal ueber einen temporaeren Node-MCP-Client erfolgreich getestet. Wichtig fuer Business Central: Storage State funktionierte im Smoke-Test mit `--isolated --storage-state`. Die regulaeren BC-Tests laufen weiterhin ueber normale Playwright-Skripte.

## Redaktionsregel

Aktueller O2C-Stand: `UAT-O2C-001` erzeugt Labor-Screenshots bis zur Verkaufszeile mit Debitor `D10000`, Artikel `RM-M100`, Menge `1`, Lagerort `FRA-ZL` und Preis `68.000`. Zusätzlich schreibt der Test `evidence/uat-o2c-001/045-target-vs-labor-delta.md`. Diese Datei vergleicht den Buch-Zielfall `EUR` / `19 %` / `80.920` mit dem aktuellen CRONUS-Labor. Solange dort `labor-delta` steht, ist der Klickpfad als Lern- und Screenshotlauf gültig, aber noch kein finaler deutscher Steuer- und Währungsnachweis.

Vor jedem neuen Klickpfad wird zuerst die relevante Buchstelle gelesen. Der Lauf prüft dann nicht nur, ob Business Central bedienbar ist, sondern ob der Buchtext fachlich und didaktisch stimmt. Wenn die Oberfläche anders funktioniert, ein Feld anders heißt, ein zusätzlicher Einrichtungsschritt fehlt oder ein Screenshot mehr zeigt als der Text erklärt, wird der Buchtext im selben Arbeitsgang aktualisiert.

Jeder Screenshot, der ins Buch kommt, braucht eine Auswertung:

- Was du im Bild siehst
- Warum das fachlich wichtig ist
- Feldlogik
- Prüfhinweis
- Typische Fehler
- Evidence Pack

Nach jedem Lauf werden drei Dinge abgeglichen:

- Buchstelle: Stimmen Schrittfolge, Begriffe, Felder und Prüfhinweise?
- Projektartefakte: Sind Test, Screenshot, Evidence und Workaround-Journal aktuell?
- Datenmodell: Fehlen Stammdaten, Einrichtung oder Bereinigungsregeln für Wiederholungsläufe?

Screenshots aus gemischtsprachigen Probeläufen sind Arbeitsmaterial. Finale Buchscreenshots werden später ersetzt.

Für wiederholbare Laborläufe gilt: Entwurfsbelege nach dem benötigten Screenshot abbrechen, verwerfen oder gezielt entfernen. Nur Belege, die Teil eines fachlichen Evidence Packs sind, bleiben bestehen oder werden gebucht.

Für Business-Central-Listen und Belegzeilen wird ein breiter Screenshot-Viewport genutzt. `1920x1080` zeigt deutlich mehr Spalten als `1440x1000` und reduziert horizontales Scrollen in Tabellen. Für finale Buchbilder kann zusätzlich entschieden werden, ob FactBoxes ein- oder ausgeblendet werden sollen.

## Laborbilder und Finalbilder

Fehlerregel: Wenn ein Lauf eine Abweichung zeigt, werden Symptom, Ursache, Lösung und Buchwirkung dokumentiert. Ein Fehler ist erst erledigt, wenn klar ist, ob er durch fehlende Einrichtung, falsche Buchanweisung, unpassende Testdaten, UI-Verhalten oder Playwright-Technik entstanden ist.

Die aktuelle CRONUS-Spielwiese erzeugt Laborbilder. Diese Bilder sind wichtig, weil sie Klickpfade, Felder, Datenbedarf, Fehlermeldungen und BC-Verhalten sichtbar machen. Sie sind aber nicht automatisch finale Buchbilder.

Für jedes Laborbild gilt:

- Es darf ins Projekt und in Evidence Packs.
- Es darf zur Buchkritik und zur fachlichen Erklärung genutzt werden.
- Es muss offenlegen, wenn Umgebung, Sprache, Währung, Steuerlogik oder Datenmodell vom Zielbild abweichen.
- Es wird später durch finale deutsche Buchscreenshots ersetzt, sobald eine passende deutsche Umgebung bereitsteht.

Der wichtigste redaktionelle Auftrag bleibt: Das Buch kritisch prüfen. Jeder Lauf beantwortet nicht nur, ob ein Klick funktioniert, sondern auch was Business Central zeigt, warum der Schritt fachlich nötig ist, welche Felder eine Wirkung haben und ob der Buchtext die richtige fachliche Absicht erklärt.

## Lernregel

Das Projekt behandelt jeden Leser als Business-Central-Anfänger. Eine Anleitung ist deshalb erst fertig, wenn sie nicht nur den Klick nennt, sondern auch erklärt, warum der Klick nötig ist und woran der Leser erkennt, dass Business Central den richtigen Zustand erreicht hat.

Jeder neue oder geänderte Klickpfad beantwortet:

- Bedienung: Was klicke oder tippe ich?
- Verständnis: Warum ist dieser Schritt im BC-Prozess nötig?
- Kontrolle: Welcher sichtbare Wert, Status, Posten oder Bericht beweist das Ergebnis?
- Fehlerbild: Was passiert typischerweise, wenn Stammdaten, Setup oder Bedienung falsch sind?
- Lösung: Wie behebt ein Anfänger den Fehler und wie prüft er danach?

Jeder Testlauf beantwortet zusätzlich diese Fragen:

- Welche BC-Seite wurde geöffnet?
- Welche Buttons, Menüs, Register und FactBoxes sind sichtbar?
- Welche davon sind für den Prozess relevant?
- Welche davon fehlen noch im Buch?
- Welche Funktion muss nachrecherchiert werden?
- Welche Erkenntnis gehört in Buchtext, Testdaten oder Evidence Pack?
