# Hypotheses

| Hypothese | Wahrscheinlichkeit | Test | Ergebnis | Status |
|---|---:|---|---|---|
| Spalte ist im User-Layout ausgeblendet | hoch | Personalisieren / Spalte hinzufuegen pruefen | synthetischer Fall, noch nicht getestet | offen |
| Profil/Rollenlayout blendet die Spalte aus | mittel | Profilanpassung oder anderer User vergleichen | synthetischer Fall, noch nicht getestet | offen |
| Feld existiert auf Page/Line, ist aber nicht sichtbar | hoch | Page Inspection auf Sales Line / Field `Location Code` | synthetischer Fall, noch nicht getestet | offen |
| Berechtigung verhindert Sichtbarkeit | niedrig/mittel | Permission Sets / Effective Permissions pruefen | keine Permission-Meldung im Ticket | offen |
| Funktion fehlt im System | niedrig | Page Inspection und Tabellenfeld pruefen | Screenshot allein beweist das nicht | offen |

## Arbeitsannahme

Die wahrscheinlichste Ursache ist UI-Sichtbarkeit, nicht fehlende Business-Central-Funktion.
