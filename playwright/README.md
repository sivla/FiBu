# Playwright-Automation und Business-Central-Lernen

Dieses Verzeichnis ist projektübergreifend angelegt. Die wiederverwendbaren Business-Central-Helfer liegen in `playwright/core`. Buch- oder mandantenspezifische Tests liegen unter `playwright/projects/<projekt>/`.

Playwright dient hier nicht nur zur Automatisierung. Es ist ein Lernwerkzeug für Business Central. Tests öffnen Seiten, durchlaufen Prozesse, erzeugen Screenshots und machen sichtbar, welche Buttons, Felder, Menüs, Dialoge und FactBoxes das Buch erklären muss.

Die laufenden Business-Central-Erfahrungen werden in `playwright/LEARNINGS.md` dokumentiert. Offene UI- und Funktionsfundstellen stehen in `playwright/FINDINGS.md`. Das Lernmodell steht in `playwright/BC-LEARNING-MODEL.md`. Der Umgang mit mehreren Umgebungen steht in `playwright/ENVIRONMENTS.md`. Das Projektregister steht in `playwright/PROJECTS.md`.

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

## Lernprinzip

- Das Buch gibt die fachlichen Prozesse vor.
- Playwright testet diese Prozesse in Business Central.
- Screenshots zeigen, was Anwender wirklich sehen.
- Sichtbare, aber unerklärte Funktionen werden in `FINDINGS.md` erfasst.
- Relevante Fundstellen werden recherchiert und im Buch ergänzt.
- Ziel ist, Business Central schrittweise vollständig zu verstehen: Seiten, Buttons, Funktionen, Feldlogik, Posten, Berichte und Evidence Packs.

## Konvention

- `core` enthält keine fachlichen FiBu-Testdaten.
- `projects/fibu-book5` enthält die aktuellen Buch-5-Szenarien und Screenshots.
- Neue Bücher, Kunden oder Umgebungen bekommen eigene Projektordner unter `projects/`.
- Zugangsdaten, `.env` und `playwright/.auth/` werden nicht committet.
- Projektspezifische Workarounds werden im jeweiligen Projekt dokumentiert; projektübergreifende BC-Learnings kommen in `LEARNINGS.md`.
- Fachlich relevante UI-Fundstellen kommen in `FINDINGS.md`, bis sie recherchiert und im Buch verarbeitet sind.

## Aktuelle Befehle

```powershell
npm run auth:bc
npm run auth:bc:diagnose
npm run auth:bc:check
npm run fibu:screenshots:start
npm run fibu:foundation:company
npm run fibu:foundation:company-info
npm run fibu:smoke:bc
```
