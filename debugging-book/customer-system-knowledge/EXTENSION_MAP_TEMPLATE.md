# Extension Map Template

## Ziel

Dieses Template dokumentiert installierte Apps, PTEs und kundenspezifische Erweiterungen. Es hilft, Tickets schneller zwischen Standard-BC, Setup, Kundenerweiterung und Bug einzuordnen.

## Extensions

| App/Extension | Publisher | Version | Typ | Betroffene Prozesse | Kritikalitaet | Code-Repo |
|---|---|---|---|---|---|---|
|  |  |  | AppSource / PTE / ISV / unbekannt |  | niedrig / mittel / hoch |  |

## Objekt-Hinweise

| Objekt | Typ | Extension | Zweck | Bekannte Risiken |
|---|---|---|---|---|
|  | Page/Table/Codeunit/Report/EventSubscriber |  |  |  |

## Diagnose-Regeln

- Wenn Telemetry eine Extension nennt: Code/Version und bekannte Issues pruefen.
- Wenn Standardverhalten abweicht: Extension-Hook oder EventSubscriber als Hypothese aufnehmen.
- Keine Extension-Daten oder Secrets committen.
