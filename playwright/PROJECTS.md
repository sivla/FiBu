# Playwright-Projektregister

Dieses Register beschreibt, wie mehrere Projekte in diesem Repository parallel gepflegt werden. Es enthält keine Secrets, keine Passwörter und keine personenbezogenen Zugangsdaten.

## Grundmodell

Ein Projekt ist eine fachlich oder organisatorisch getrennte Automationsstrecke. Das kann ein Buch, ein Kunde, eine Sandbox, ein UAT-Zyklus oder eine spätere produktnahe Testumgebung sein.

Jedes Projekt bekommt:

- einen stabilen Projektslug, zum Beispiel `fibu-book5`
- einen eigenen Ordner unter `playwright/projects/<projektslug>/`
- ein eigenes Env-Prefix, zum Beispiel `FIBU_BOOK5`
- eigene Testdaten unter `testdata/`
- eigene Tests unter `tests/`
- ein eigenes `README.md` mit Umgebung, Ziel, Status und Besonderheiten
- projektspezifische Learnings im Projekt-README
- Fundstellen zu sichtbaren, aber noch nicht erklärten BC-Funktionen in `FINDINGS.md`

Gemeinsame Business-Central-Mechanik liegt dagegen in `playwright/core/`.

## Gemeinsames Projektziel

Alle Business-Central-Projekte in diesem Repository verfolgen neben der konkreten Testaufgabe ein gemeinsames Lernziel:

- Business Central durch echte Nutzung verstehen.
- Sichtbare Funktionen systematisch kennenlernen.
- Buttons, Menüs, Felder, Dialoge, FactBoxes und Berichte fachlich einordnen.
- Lücken zwischen Buchtext und tatsächlicher Oberfläche erkennen.
- Relevante Lücken recherchieren und in Buch oder Projektdokumentation zurückspielen.

Das gilt besonders für Buchprojekte: Ein Screenshot darf keine fachlich relevanten ungeklärten Elemente enthalten.

## Projektstruktur

```text
playwright/
  core/
    auth.setup.ts
    bc-helpers.ts
  projects/
    <projektslug>/
      README.md
      project.ts
      tests/
      testdata/
      evidence/
      screenshots/
```

Der Ordner `img/` im Repository bleibt aktuell der Buchausgabe vorbehalten. Für neue Projekte kann zusätzlich ein projektnaher Screenshot-Ordner verwendet werden. Entscheidend ist, dass die Markdown-Dateien immer auf die final verwendeten Bilder zeigen.

## Namensregeln

| Element | Regel | Beispiel |
|---|---|---|
| Projektslug | klein, sprechend, bindestrichgetrennt | `fibu-book5` |
| Env-Prefix | groß, underscore-getrennt | `FIBU_BOOK5` |
| Testfall | fachlicher Code + Kurzname | `uat-o2c-001-sales-order.spec.ts` |
| Testdaten | fachlicher Bereich + Objekt | `sales/o2c-001.json` |
| Screenshots | Testfall + Schritt + Kurztext | `uat-o2c-001-030-debitor-ausgewaehlt.png` |

Dateinamen bleiben ASCII-freundlich. Umlaute werden in Dateinamen vermieden, damit Git, Markdown, CI und spätere Buchpipelines stabil bleiben.

## Aktuelles Projekt

| Projekt | Zweck | Env-Prefix | Status |
|---|---|---|---|
| `fibu-book5` | Business-Central-Screenshots und Validierung für Buch 5 | `FIBU_BOOK5` | aktiv |

## Regel für neue Projekte

Ein neues Projekt wird erst angelegt, wenn mindestens diese drei Dinge bekannt sind:

1. Ziel der Automationsstrecke
2. Business-Central-URL oder Umgebungsbeschreibung
3. gewünschte Company beziehungsweise Startcompany

Danach wird ein Projektordner angelegt und die lokale `.env` um projektspezifische Variablen ergänzt.

```text
<PREFIX>_BC_URL=https://businesscentral.dynamics.com/<tenant>/<environment>?company=<company>
<PREFIX>_BC_LOCALE=de-DE
<PREFIX>_BC_TIMEZONE=Europe/Berlin
```

## Was in `core` darf

In `playwright/core/` gehören nur Dinge, die für mehrere Business-Central-Projekte wiederverwendbar sind:

- Login und `storageState`
- Navigation über Tell-Me/Search
- Frame-Suche
- Screenshot-Helfer
- stabile Wartefunktionen
- generische BC-Feld- und Dialog-Helfer

Nicht in `core` gehören:

- konkrete Debitoren, Artikel oder Preise
- projektspezifische Companies
- Buchkapitel-Logik
- kunden- oder mandantenspezifische Workarounds

## Übergabefähigkeit

Jedes Projekt muss so dokumentiert sein, dass ein anderer Codex-Account ohne Chatverlauf weiterarbeiten kann. Dafür gilt:

- Umgebung und Company im Projekt-README dokumentieren.
- Testdaten als Dateien versionieren.
- fragile Klicks und BC-Eigenheiten sofort dokumentieren.
- Screenshots im Buch oder in der Projekt-Doku erklären.
- unerklärte UI-Elemente in `FINDINGS.md` erfassen.
- neue allgemeine BC-Erfahrungen in `playwright/LEARNINGS.md` übernehmen.
