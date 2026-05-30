# Übergabe für neue Codex-Accounts

Dieses Repository soll von anderen Codex-Accounts weiterbearbeitet werden können. Der Fokus liegt auf Business-Central-Playwright-Automation für Buch- und Projektdokumentation.

## Ziel des Repositories

Das Repository enthält ein Markdown-Buchprojekt und eine Playwright-Automation, mit der Business-Central-Prozesse getestet, Testdaten erzeugt und Screenshots für bebilderte Klickanleitungen erstellt werden.

## Wichtigste Dateien

| Datei/Ordner | Bedeutung |
|---|---|
| `FiBu_Buch_BC_Standardprozesse_DE_Master_Blueprint.md` | aktuelles Buch 5 |
| `playwright/core/` | wiederverwendbare Business-Central-Helfer |
| `playwright/projects/fibu-book5/` | aktuelle Tests, Testdaten und Projektdoku für Buch 5 |
| `playwright/PROJECTS.md` | Register für mehrere Playwright-Projekte |
| `playwright/LEARNINGS.md` | projektübergreifende BC-Playwright-Erfahrungen |
| `playwright/ENVIRONMENTS.md` | Umgang mit verschiedenen BC-Umgebungen |
| `.env.example` | Vorlage für lokale Umgebungsvariablen |

## Erster Start auf einem neuen Rechner oder Account

```powershell
npm install
npx playwright install chromium
Copy-Item .env.example .env
```

Dann `.env` mit der konkreten Business-Central-URL füllen. Bei mehreren Projekten bevorzugt jedes Projekt eigene Prefix-Variablen, zum Beispiel:

```text
FIBU_BOOK5_BC_URL=https://businesscentral.dynamics.com/<tenant>/<environment>?company=RM-DEMO
FIBU_BOOK5_BC_LOCALE=de-DE
FIBU_BOOK5_BC_TIMEZONE=Europe/Berlin
```

Danach:

```powershell
npm run auth:bc
npm run fibu:screenshots:start
npm run fibu:foundation:company
npm run fibu:foundation:company-info
```

## Arbeitsweise

1. Neue BC-Anleitung im Buch identifizieren.
2. Prüfen, welche Testdaten fehlen.
3. Testdaten als JSON unter `playwright/projects/<projekt>/testdata/` dokumentieren.
4. Playwright-Test schreiben, der Daten erzeugt oder prüft.
5. Screenshots in `img/` erzeugen.
6. Im Buch jeden Screenshot erklären:
   - Was du im Bild siehst
   - Feldlogik
   - Prüfhinweis
   - Evidence Pack
7. Learnings in `playwright/LEARNINGS.md` ergänzen, wenn etwas BC-spezifisch neu ist.

## Wichtige Projektentscheidungen

- Die meisten Projekte werden Business-Central-Projekte sein.
- `playwright/core` bleibt projektübergreifend.
- Fachliche Tests liegen unter `playwright/projects/<projekt>/`.
- Jedes Projekt kann eine eigene Business-Central-Umgebung haben.
- Projektspezifische Umgebungen werden über Prefix-Variablen wie `FIBU_BOOK5_BC_URL` gesteuert.
- Neue Projekte werden in `playwright/PROJECTS.md` registriert.
- Ein Projekt ist fachlich definiert; die konkrete BC-Umgebung kann später wechseln.
- Übergabefähigkeit ist ein Ziel: Wissen gehört in Markdown-Dateien, nicht nur in Chatverläufe.
- Tests dürfen englische BC-Suchbegriffe verwenden.
- Buchtexte und finale Anleitungen bleiben deutsch.
- Finale Screenshots sollen später in möglichst deutscher Oberfläche neu erzeugt werden.
- Lokale Secrets, `.env` und `playwright/.auth/` werden nie committet.

## Aktueller Stand `fibu-book5`

| Fall | Status |
|---|---|
| `UAT-START-001` | läuft |
| `FOUNDATION-001` Company `RM-DEMO` aus CRONUS | läuft |
| `FOUNDATION-002` Unternehmensdaten setzen | läuft |
| BC-Seiten-Smoke-Test | läuft |

Aktuelle Trainingscompany:

```text
RM-DEMO
```

Aktuelle Quelle:

```text
CRONUS USA, Inc.
```

## Wichtige Warnung

Business Central ist UI-seitig nicht vollständig stabil wie eine klassische Web-App. Viele Inhalte liegen in Frames, manche Controls haben unzuverlässige ARIA-Rollen, und Einführungs-Popups stören Screenshots. Deshalb immer nach einem grünen Test mindestens einen Screenshot visuell prüfen.
