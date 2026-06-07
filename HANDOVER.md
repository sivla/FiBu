# Übergabe für neue Codex-Accounts

## Zuerst Lesen

Neue Agents lesen zuerst:

```text
playwright/projects/fibu-book5/CURRENT-STATE.md
```

Diese Datei enthält den aktuellen fachlichen Stand, harte Projektentscheidungen, offene Grenzen und den nächsten sinnvollen Schritt. Ohne diese Datei besteht die Gefahr, alte Chatlogik zu wiederholen oder CRONUS-Laborbefunde als deutsche Zielnachweise zu missverstehen.

Dieses Repository soll von anderen Codex-Accounts weiterbearbeitet werden können. Der Fokus liegt auf Business-Central-Playwright-Automation, Business-Central-Lernen und Buch-/Projektdokumentation.

## Ziel des Repositories

Das Repository enthält ein Markdown-Buchprojekt und eine Playwright-Automation, mit der Business-Central-Prozesse getestet, Testdaten erzeugt und Screenshots für bebilderte Klickanleitungen erstellt werden.

Das übergeordnete Ziel ist, Business Central durch Nutzung systematisch zu lernen. Das Buch liefert die fachliche Route. Playwright prüft diese Route in einer echten BC-Umgebung. Was Business Central zusätzlich sichtbar macht, wird als Lern- und Recherchematerial behandelt.

## Wichtigste Dateien

| Datei/Ordner | Bedeutung |
|---|---|
| `FiBu_Buch_BC_Standardprozesse_DE_Master_Blueprint.md` | aktuelles Buch 5 |
| `playwright/core/` | wiederverwendbare Business-Central-Helfer |
| `playwright/projects/fibu-book5/` | aktuelle Tests, Testdaten und Projektdoku für Buch 5 |
| `playwright/BC-LEARNING-MODEL.md` | Lernmodell für Business Central durch Playwright-Nutzung |
| `playwright/FINDINGS.md` | offene Fundstellen aus Screenshots und Tests |
| `playwright/projects/fibu-book5/UI-INVENTORY.md` | Nachweis der gesehenen, geklickten und verstandenen BC-Funktionen |
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
6. Sichtbare, aber unerklärte BC-Funktionen in `playwright/FINDINGS.md` erfassen.
7. Relevante Fundstellen recherchieren, bevorzugt mit Microsoft Learn, BC-Hilfe und eigenem Gegentest.
8. Im Buch jeden Screenshot erklären:
   - Was du im Bild siehst
   - Warum das fachlich wichtig ist
   - Feldlogik
   - Prüfhinweis
   - Typische Fehler
   - Evidence Pack
9. Learnings in `playwright/LEARNINGS.md` ergänzen, wenn etwas BC-spezifisch neu ist.
10. Buch aktualisieren, wenn eine gefundene Funktion für Prozess, Prüfung, Fehlerdiagnose oder Evidence Pack relevant ist.

## Commit-/Push-Regel

Jeder Commit und jeder Push muss eine arbeitsfähige Übergabe garantieren. Vor dem Commit gilt:

- `playwright/projects/fibu-book5/CURRENT-STATE.md` ist aktuell.
- Der nächste sinnvolle Schritt ist konkret benannt.
- Bekannte fachliche Grenzen, Workarounds und offene Fehler sind dokumentiert.
- Neue Screenshots, Evidence und Buchänderungen sind miteinander verknüpft.
- Rohartefakte wie Playwright-Reports, Test-Traces, Auth-State, `.env`, `console-*.log` und `page-*.yml` bleiben uncommitted.
- `npm run check:encoding` und `git diff --check` laufen ohne Fehler, wenn Textdateien geändert wurden.
- `git status --short` ist nach dem Push sauber.

Wenn ein Commit diese Punkte nicht erfüllt, ist er noch kein vollständiger Projektstand.

## Wichtige Projektentscheidungen

- Die meisten Projekte werden Business-Central-Projekte sein.
- `playwright/core` bleibt projektübergreifend.
- Fachliche Tests liegen unter `playwright/projects/<projekt>/`.
- Jedes Projekt kann eine eigene Business-Central-Umgebung haben.
- Projektspezifische Umgebungen werden über Prefix-Variablen wie `FIBU_BOOK5_BC_URL` gesteuert.
- Neue Projekte werden in `playwright/PROJECTS.md` registriert.
- Ein Projekt ist fachlich definiert; die konkrete BC-Umgebung kann später wechseln.
- Übergabefähigkeit ist ein Ziel: Wissen gehört in Markdown-Dateien, nicht nur in Chatverläufe.
- Das Projekt lernt Business Central anhand des Buchs und anhand eigener Tests.
- Ziel ist, sichtbare Business-Central-Funktionen schrittweise zu kennen und fachlich einzuordnen.
- Eine Funktion gilt erst als verstanden, wenn sie praktisch gesehen, geklickt oder bewusst nicht ausgeführt, geprüft und dokumentiert wurde.
- Unbekannte oder im Buch fehlende Funktionen werden als Fundstellen dokumentiert und nachrecherchiert.
- Relevante Erkenntnisse werden ins Buch zurückgespielt.
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

## Encoding-Warnung

Dieses Repository nutzt UTF-8 fuer Markdown, JSON, TypeScript und Evidence-Textdateien.

Vor groesseren Doku-Aenderungen:

```powershell
npm run check:encoding
```

Wenn PowerShell deutsche Umlaute sichtbar falsch ausgibt, zuerst die aktuelle Konsole auf UTF-8 stellen:

```powershell
. .\scripts\Use-Utf8Console.ps1
```

Unter macOS/Linux:

```bash
. ./scripts/use-utf8-console.sh
```

Nicht blind "Mojibake reparieren", bevor geprueft wurde, ob die Datei selbst oder nur die Konsolenausgabe betroffen ist.

## Plattformregel

Das Projekt wird fuer Windows und macOS gepflegt.

- Keine neuen projektrelevanten Skripte nur als Windows-PowerShell bereitstellen, wenn eine Node- oder Shell-Variante sinnvoll moeglich ist.
- `package.json`-Skripte sollen ohne Windows-spezifische Pfadtrenner funktionieren.
- Lokale Auth-Dateien und `.env` werden pro Rechner neu erzeugt.
- Playwright-Browser muessen pro Rechner installiert werden: `npx playwright install chromium`.
