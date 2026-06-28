# Codebase Map Template

## Ziel

Dieses Template beschreibt lokale Repositories, Branches und Codebereiche fuer kundenspezifische Erweiterungen. Es hilft dem Agenten, bei Bug-Hypothesen gezielt Code zu lesen.

## Repositories

| Repo | Zweck | Hauptsprache | Extension/App | Branch-Regel | Test-Hinweis |
|---|---|---|---|---|---|
|  |  | AL / TypeScript / PowerShell / anderes |  |  |  |

## Codebereiche

| Bereich | Objekte | Prozess | Bekannte Risiken |
|---|---|---|---|
|  | Pages/Tables/Codeunits/Reports |  |  |

## Diagnose-Regeln

- Code lesen ist read-only.
- Keine produktiven Daten in Tests einbauen.
- Bei Extension-Fehlern Telemetry-Objektbezug mit Code abgleichen.
- Fix erst nach reproduzierbarer Evidence oder klarer Root Cause.
