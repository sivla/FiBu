# Business-Central-Playwright-Learnings

Stand: 01.07.2026

Dieses Logbuch sammelt technische und fachliche Erfahrungen aus den Business-Central-Läufen. Es ist bewusst praxisnah. Ziel ist nicht, Playwright allgemein zu erklären, sondern wiederverwendbares Wissen für Business-Central-Projekte aufzubauen.

Das Repository lernt Business Central anhand des Buchs und anhand echter Tests. Screenshots sind deshalb nicht nur Bildmaterial. Sie sind Fundstellen für Funktionen, Buttons, Felder, Dialoge und Hinweise, die verstanden und bei Relevanz im Buch erklärt werden müssen.

## Grundsatz

Die meisten Projekte in diesem Repository sind Business-Central-Projekte. Deshalb liegt die gemeinsame Logik in `playwright/core`. Projektspezifische Tests, Testdaten und Screenshots liegen unter `playwright/projects/<projekt>/`.

Das Repository soll auch von anderen Codex-Accounts übernommen werden können. Deshalb müssen technische Entscheidungen, Umgebungsbesonderheiten und Workarounds dokumentiert werden, nicht nur im Chatverlauf stehen.

## Was bisher gut funktioniert

| Thema | Befund | Wiederverwendbare Regel |
|---|---|---|
| Login-State | Manueller Entra-ID-Login mit anschliessendem `storageState` ist nur dann fuer Live-Tests nutzbar, wenn echte Business-Central-Shell-Signale validiert wurden. Microsoft-Sign-in oder Token-Kontext ist kein BC-Kontext. | `npm run auth:bc` attended bis Role Center/Search/My Settings sichtbar ist, dann `npm run auth:bc:check`; bei Sign-in-Haenger `npm run auth:bc:diagnose`. Session-Datei nie committen. |
| Fester Viewport | `1440 x 1000` liefert brauchbare Buchscreenshots. | Viewport projektweit stabil halten. |
| Direkte Company-URL | `company=UNIVERSAARL-DE` in der Projekt-URL ist die aktive Zielwelt fuer Buch 5. | Tests starten gezielt in `playthru / UNIVERSAARL-DE`; RM-/CRONUS-Bezuege sind nur Legacy-Evidence. |
| Tell-Me-Suche | Der Suchbutton `Suchen/Search` ist stabiler als reines `Alt+Q`. | In Playwright zuerst den Suchbutton anklicken, dann Suchbegriff tippen. |
| Englische Suchbegriffe | In gemischtsprachigen Umgebungen liefern englische Begriffe oft stabilere Treffer. | Technische Suche darf englisch sein, Buchtext bleibt deutsch. |
| Companies-Liste | `Companies` öffnet zuverlässig die Company-Verwaltung. | Foundation-Tests beginnen über `Companies`. |
| Company-Aufbau | Universaarl wird als eigene Zielcompany aufgebaut; Demodaten-/CRONUS-Kopien duerfen nicht als finale Buchwelt gelten. | Company-/Setup-Schritte muessen sichtbar, quellenbasiert und mit Reopen-Proof dokumentiert werden. |
| Unternehmensdaten | `Company Information` lässt sich per Playwright setzen. | Stammdatenwerte in JSON-Dateien versionieren. |
| Screenshot-Auswertung | Bilder werden im Buch verständlicher, wenn jedes Bild erklärt wird. | Pro Screenshot: Was du siehst, Feldlogik, Prüfhinweis, Evidence Pack. |
| Screenshot-Fundstellen | Screenshots zeigen oft Buttons oder Hinweise, die im Buch noch fehlen. | In `FINDINGS.md` erfassen, recherchieren, testen und bei Relevanz ins Buch übernehmen. |

## Was schwierig oder fragil ist

| Thema | Problem | Aktueller Umgang |
|---|---|---|
| Gemischte Sprache | Oberfläche ist teilweise Deutsch, teilweise Englisch. | Tests technisch bilingual; finale Buchscreenshots später in deutschem Lauf ersetzen. |
| BC läuft in Frames | Viele sichtbare Inhalte liegen nicht im äußeren Browser-DOM. | `page.frames()` durchsuchen und im passenden Frame klicken/lesen. |
| Tell-Me-Trefferlisten | `Enter` oder der erste Treffer öffnet oft nicht die fachlich gewünschte Seite. | Kein Blindklick auf den ersten Treffer. Trefferindex oder Zielseite bewusst festlegen; Mehrdeutigkeit als Fundstelle behandeln. |
| Einführungs-Popups | BC zeigt „About ...“ oder Tour-Popups, die Screenshots stören. Der Schließen-Button kann je nach UI-Sprache auch `Verwerfen` heißen. | Für Probeläufe zulassen; für finale Buchbilder gezielt mit `dismissTours()` schließen oder Umgebung vorbereiten. |
| Rechte Infobox/FactBox | FactBoxes sind fachlich nützlich, nehmen bei Tabellenbildern aber Spaltenbreite weg. | Vor breiten Listen-/Zeilenbildern bewusst entscheiden: sichtbar lassen und erklären oder mit `hideFactBoxPane()` einklappen. |
| QuickInfo-Overlays | Klick auf Feldhilfe/Toggle kann eine QuickInfo öffnen und Buttons blockieren. | Bei bekannten Dialogen gezielte Koordinate oder `force` nutzen. |
| ARIA-Rollen | Schalter/Felder sind nicht immer zuverlässig als `role` auffindbar. | Rollen bevorzugen, aber BC-spezifische Fallbacks akzeptieren. |
| Listen-Neuanlage | Nach `Neu` bleiben Hauptliste und `Neu - ...`-Form gleichzeitig sichtbar. Unspezifische Locators treffen schnell die falsche Liste. | Bei Neuanlagen auf `form "Neu - <Seite>"` scopen, dann Felder erfassen und anschließend gegen Seitentext/Evidence prüfen. |
| Grid-Fokus | Blindes Tippen in BC-Grids kann Text in falsche Zellen schreiben oder gar nichts speichern. | Zelle/Form bewusst fokussieren, nach jedem Datensatz hart prüfen und Fehlversuche dokumentieren. |
| Grid-Evidence | Sichtbare Werte in Listen erscheinen nicht immer in `innerText`; bei `Dimension Values` liegen sie als `input.value` vor. | Persistenz über Neuöffnen der Seite und passende DOM-Werte prüfen, nicht nur über Seitentext. |
| Land/Region-Abhängigkeiten | `Country/Region Code = DE` verändert abhängige Adressfelder. | Land vor Ort/PLZ setzen und anschließend sichtbare Pflichtfelder prüfen. |
| Speichern-Zustand | Screenshots während `Wird gespeichert ...` sind nicht buchfähig. | Nach `Gespeichert/Saved` zusätzlich kurz warten. |
| Direkte Tabellenzeile | Neue Company durch freie Zeile verursachte Validierungsfehler. | Fuer Universaarl nur eine sichere UI-Route mit sichtbarem Wizard/Dialog und Screenshot-QA verwenden; keine blinde Freizeile. |

## Projektspezifisch: `fibu-book5`

### Umgebung

| Feld | Wert |
|---|---|
| Tenant/Environment | `playthru` |
| Startcompany | `UNIVERSAARL-DE` |
| Zielcompany | `UNIVERSAARL-DE` |
| Quelle | Universaarl-Zielaufbau, keine CRONUS-Finalclaims |
| Sprache | gemischt Deutsch/Englisch |

### Aktuelle Befehle

```powershell
npm run auth:bc
npm run auth:bc:check
npm run auth:bc:diagnose
npm run agent:preflight
npm run agent:context
npm run agent:run-plan
npm run fibu:target:playthru-context
```

### Aktueller Foundation-Stand

| Fall | Status | Ergebnis |
|---|---|---|
| `UAT-START-001` | bestanden | Orientierung in der Spielwiese und erste Screenshots |
| `TARGET-001` | bestanden | `playthru` read-only als Zielinstanz bestaetigt |
| `TARGET-002` bis `TARGET-010` | historisch/ueberholt | Universaarl-Company-Creation und Context wurden aufgebaut; alte RM-/CRONUS-Foundation ist nur Legacy |
| `BC-Smoke` | bestanden | Kernseiten öffnen: Customers, Vendors, Items, Sales Orders, Purchase Orders, Chart of Accounts |

### Getroffene Projektentscheidungen

1. `UNIVERSAARL-DE` ist die aktive Zielcompany fuer Buch-5-Screenshots.
2. RM-DEMO, Rhein-Main, MCP_1_20260210 und CRONUS bleiben nur Legacy-Laborreferenzen.
3. Stammdatenwerte werden als JSON unter `playwright/projects/fibu-book5/testdata/` versioniert.
4. Screenshots aus Universaarl duerfen Buchkandidaten sein, wenn sie den sichtbaren Schritt fachlich erklaeren und keine Login-/Secret-/Shell-Metadaten enthalten.
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

Jeder dieser Tests ist zugleich ein Lernlauf. Nach dem Test wird geprüft:

- Welche sichtbaren BC-Funktionen wurden nicht erklärt?
- Welche Buttons oder Menüs sind für Anwender relevant?
- Welche Felder haben Folgeeffekte für Buchung, Steuer, Dimension, Lager oder Bericht?
- Welche Fundstellen gehören in `FINDINGS.md`?
- Welche Erkenntnisse müssen ins Buch?

## Übergaberegel

Wenn ein neuer Codex-Account übernimmt, muss er ohne Chatverlauf arbeiten können. Deshalb gilt:

- Neue Workarounds werden in diesem Logbuch dokumentiert.
- Neue fachliche UI-Fundstellen werden in `FINDINGS.md` dokumentiert.
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
- Fundstellen halbautomatisch aus Screenshots und Seitentiteln erfassen.
- Recherchequellen pro Fundstelle dokumentieren.
