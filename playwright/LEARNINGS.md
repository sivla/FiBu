# Business-Central-Playwright-Learnings

Stand: 30.05.2026

Dieses Logbuch sammelt technische Erfahrungen aus den Business-Central-Läufen. Es ist bewusst praxisnah. Ziel ist nicht, Playwright allgemein zu erklären, sondern wiederverwendbares Wissen für Business-Central-Projekte aufzubauen.

## Grundsatz

Die meisten Projekte in diesem Repository sind Business-Central-Projekte. Deshalb liegt die gemeinsame Logik in `playwright/core`. Projektspezifische Tests, Testdaten und Screenshots liegen unter `playwright/projects/<projekt>/`.

Das Repository soll auch von anderen Codex-Accounts übernommen werden können. Deshalb müssen technische Entscheidungen, Umgebungsbesonderheiten und Workarounds dokumentiert werden, nicht nur im Chatverlauf stehen.

## Was bisher gut funktioniert

| Thema | Befund | Wiederverwendbare Regel |
|---|---|---|
| Login-State | Manueller Entra-ID-Login mit anschließendem `storageState` funktioniert zuverlässig. | `npm run auth:bc` nutzen, Session-Datei nie committen. |
| Fester Viewport | `1440 x 1000` liefert brauchbare Buchscreenshots. | Viewport projektweit stabil halten. |
| Direkte Company-URL | `company=RM-DEMO` in der URL öffnet die gewünschte Company. | Tests starten gezielt in der benötigten Company. |
| Tell-Me-Suche | Der Suchbutton `Suchen/Search` ist stabiler als reines `Alt+Q`. | In Playwright zuerst den Suchbutton anklicken, dann Suchbegriff tippen. |
| Englische Suchbegriffe | In gemischtsprachigen Umgebungen liefern englische Begriffe oft stabilere Treffer. | Technische Suche darf englisch sein, Buchtext bleibt deutsch. |
| Companies-Liste | `Companies` öffnet zuverlässig die Company-Verwaltung. | Foundation-Tests beginnen über `Companies`. |
| Company-Kopie | `Copy` aus `CRONUS USA, Inc.` nach `RM-DEMO` ist der richtige Foundation-Weg. | Keine Company-Zeile frei eintippen, sondern CRONUS kopieren. |
| Unternehmensdaten | `Company Information` lässt sich per Playwright setzen. | Stammdatenwerte in JSON-Dateien versionieren. |
| Screenshot-Auswertung | Bilder werden im Buch verständlicher, wenn jedes Bild erklärt wird. | Pro Screenshot: Was du siehst, Feldlogik, Prüfhinweis, Evidence Pack. |

## Was schwierig oder fragil ist

| Thema | Problem | Aktueller Umgang |
|---|---|---|
| Gemischte Sprache | Oberfläche ist teilweise Deutsch, teilweise Englisch. | Tests technisch bilingual; finale Buchscreenshots später in deutschem Lauf ersetzen. |
| BC läuft in Frames | Viele sichtbare Inhalte liegen nicht im äußeren Browser-DOM. | `page.frames()` durchsuchen und im passenden Frame klicken/lesen. |
| Tell-Me-Trefferlisten | `Enter` öffnet nicht immer den fachlich gewünschten Treffer. | Wenn nötig gezielt Treffer im Frame anklicken oder bei fester Auflösung Koordinaten nutzen. |
| Einführungs-Popups | BC zeigt „About ...“ oder Tour-Popups, die Screenshots stören. | Für Probeläufe zulassen; für finale Buchbilder gezielt schließen oder Umgebung vorbereiten. |
| QuickInfo-Overlays | Klick auf Feldhilfe/Toggle kann eine QuickInfo öffnen und Buttons blockieren. | Bei bekannten Dialogen gezielte Koordinate oder `force` nutzen. |
| ARIA-Rollen | Schalter/Felder sind nicht immer zuverlässig als `role` auffindbar. | Rollen bevorzugen, aber BC-spezifische Fallbacks akzeptieren. |
| Land/Region-Abhängigkeiten | `Country/Region Code = DE` verändert abhängige Adressfelder. | Land vor Ort/PLZ setzen und anschließend sichtbare Pflichtfelder prüfen. |
| Speichern-Zustand | Screenshots während `Wird gespeichert ...` sind nicht buchfähig. | Nach `Gespeichert/Saved` zusätzlich kurz warten. |
| Direkte Tabellenzeile | Neue Company durch freie Zeile verursachte Validierungsfehler. | Nicht verwenden; `Copy Company` ist der dokumentierte Weg im Projekt. |

## Projektspezifisch: `fibu-book5`

### Umgebung

| Feld | Wert |
|---|---|
| Tenant/Environment | `MCP_1_20260210` |
| Startcompany | `My Company` |
| Trainingscompany | `RM-DEMO` |
| Quelle | `CRONUS USA, Inc.` |
| Sprache | gemischt Deutsch/Englisch |

### Aktuelle Befehle

```powershell
npm run auth:bc
npm run fibu:screenshots:start
npm run fibu:foundation:company
npm run fibu:foundation:company-info
npm run fibu:smoke:bc
```

### Aktueller Foundation-Stand

| Fall | Status | Ergebnis |
|---|---|---|
| `UAT-START-001` | bestanden | Orientierung in der Spielwiese und erste Screenshots |
| `FOUNDATION-001` | bestanden | `RM-DEMO` aus CRONUS kopiert oder bestätigt |
| `FOUNDATION-002` | bestanden | Unternehmensdaten in `RM-DEMO` gesetzt |
| `BC-Smoke` | bestanden | Kernseiten öffnen: Customers, Vendors, Items, Sales Orders, Purchase Orders, Chart of Accounts |

### Getroffene Projektentscheidungen

1. `RM-DEMO` ist die Arbeitscompany für Buch-5-Screenshots.
2. `CRONUS USA, Inc.` bleibt Quelle für Setup und Demodaten.
3. Stammdatenwerte werden als JSON unter `playwright/projects/fibu-book5/testdata/` versioniert.
4. Screenshots im aktuellen Lauf sind technische Probeläufe. Finale Bilder werden später in einer deutsch konsistenten Umgebung neu erzeugt.
5. Jeder Screenshot im Buch bekommt eine Bildauswertung. Das Bild allein reicht nicht.

## Standards für neue Business-Central-Projekte

Neue BC-Projekte sollen diese Struktur verwenden:

```text
playwright/projects/<projektname>/
  README.md
  project.ts
  tests/
  testdata/
  evidence/
  screenshots/
```

Neue Projekte werden zusätzlich in `playwright/PROJECTS.md` registriert. Der Projektslug bleibt stabil, auch wenn sich die konkrete Business-Central-Umgebung ändert.

Empfohlene erste Tests:

1. `start` oder `orientation`: Umgebung, Company, Rolle, Suche.
2. `foundation-company`: Company öffnen oder erzeugen.
3. `company-information`: Unternehmensdaten setzen.
4. `page-smoke`: zentrale BC-Seiten öffnen.
5. Erster Fachprozess ohne Buchung.
6. Erster Fachprozess mit Buchung und Evidence Pack.

## Übergaberegel

Wenn ein neuer Codex-Account übernimmt, muss er ohne Chatverlauf arbeiten können. Deshalb gilt:

- Neue Workarounds werden in diesem Logbuch dokumentiert.
- Neue Umgebungen werden nach `ENVIRONMENTS.md` beschrieben.
- Neue Projektszenarien bekommen ein eigenes Projekt-README.
- Jeder Testdatenwert, der für Screenshots gebraucht wird, wird als Datei versioniert.

## Offene Verbesserungen

- Projektkonfiguration aus JSON laden statt Werte in Tests zu verteilen.
- Screenshot-Index automatisch erzeugen.
- Popups zentral erkennen und schließen.
- Koordinatenklicks weiter reduzieren.
- Deutsche Suchbegriffe im finalen Lauf erzwingen.
- Nach jedem Test automatisch eine Markdown-Bildauswertung vorbereiten.
