# Data Checks

## UI-Checks

| Pruefung | Zweck | Status |
|---|---|---|
| Verkaufszeilen sichtbar | Kontext pruefen | offen |
| Spalte `Location Code` sichtbar | Symptom bestaetigen | offen |
| Personalisieren zeigt Feld als verfuegbar | UI-Sichtbarkeit pruefen | offen |
| anderer User/Profil zeigt Feld | Profil-/Rollenlayout pruefen | offen |

## Strukturierte Datenchecks

| Pruefung | Werkzeug | Status |
|---|---|---|
| Sales Line enthaelt Feld `Location Code` | Page Inspection/API/OData/MCP | offen |
| vorhandene Zeile hat gespeicherten Lagerortwert | API/OData/MCP | offen |
| Berechtigungen erlauben Lesen/Aendern | Effective Permissions | offen |

## Evidence-Grenze

Ein API-Wert beweist gespeicherte Daten, aber nicht, dass der User die Spalte sieht. Ein Screenshot beweist Sichtbarkeit, aber nicht zwingend gespeicherte Werte.
