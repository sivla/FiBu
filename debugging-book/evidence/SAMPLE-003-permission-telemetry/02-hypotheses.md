# hypotheses

| Hypothese | Wahrscheinlichkeit | Test | Ergebnis | Status |
|---|---:|---|---|---|
| Fehlendes Permission Set | hoch | Permission Sets und Effective Permissions read-only pruefen | offen | offen |
| Fehlendes Execute-Recht | hoch | Telemetry/Object-Kontext und Permission Matrix pruefen | offen | offen |
| TableData-Recht fehlt | mittel | betroffene Tabelle und Permission Type read-only dokumentieren | offen | offen |
| Security Filter blockiert Datensatz | mittel | Security Filter read-only pruefen | offen | offen |
| Extension-Codeunit braucht zusaetzliches Recht | mittel | Extension/Object-ID aus Telemetry oder Fehlermeldung ableiten | offen | offen |
| Rolle/Profile-Verwechslung | niedrig | UI-Profil vs. Berechtigung trennen | offen | offen |
