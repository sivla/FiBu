# Playwright-Automation für Business Central

Dieses Verzeichnis ist projektübergreifend angelegt. Die wiederverwendbaren Business-Central-Helfer liegen in `playwright/core`. Buch- oder mandantenspezifische Tests liegen unter `playwright/projects/<projekt>/`.

Die laufenden Business-Central-Erfahrungen werden in `playwright/LEARNINGS.md` dokumentiert. Dieses Logbuch ist Teil der Projektarbeit, weil die meisten Automationen in diesem Repository Business-Central-Projekte betreffen. Der Umgang mit mehreren Umgebungen steht in `playwright/ENVIRONMENTS.md`. Das Projektregister steht in `playwright/PROJECTS.md`.

## Struktur

```text
playwright/
  core/
    auth.setup.ts
    bc-helpers.ts
  projects/
    fibu-book5/
      README.md
      project.ts
      tests/
      testdata/
      evidence/
      screenshots/
```

## Mehrprojekt-Prinzip

Dieses Repository ist kein einzelner Testordner für ein einzelnes Buch. Es ist ein gemeinsamer Playwright-Arbeitsplatz für mehrere Business-Central-Projekte.

- `core` enthält nur wiederverwendbare Business-Central-Mechanik.
- Jedes Projekt unter `projects/` hat eigene Umgebung, Testdaten, Tests und Dokumentation.
- Jedes Projekt definiert ein eigenes Env-Prefix, zum Beispiel `FIBU_BOOK5`.
- Gemeinsame Learnings kommen in `LEARNINGS.md`.
- Projektspezifische Erfahrungen bleiben im jeweiligen Projekt-README.
- Neue Projekte werden zusätzlich in `PROJECTS.md` eingetragen.

## Konvention

- `core` enthält keine fachlichen FiBu-Testdaten.
- `projects/fibu-book5` enthält die aktuellen Buch-5-Szenarien und Screenshots.
- Neue Bücher, Kunden oder Umgebungen bekommen eigene Projektordner unter `projects/`.
- Zugangsdaten, `.env` und `playwright/.auth/` werden nicht committet.
- Projektspezifische Workarounds werden im jeweiligen Projekt dokumentiert; projektübergreifende BC-Learnings kommen in `LEARNINGS.md`.

## Aktuelle Befehle

```powershell
npm run auth:bc
npm run fibu:screenshots:start
npm run fibu:foundation:company
npm run fibu:foundation:company-info
npm run fibu:smoke:bc
```
