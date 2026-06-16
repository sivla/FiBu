# BC Data Access Strategy

## Ziel

Business-Central-Debugging braucht mehrere Datenquellen. Keine einzelne Quelle beweist alles. Diese Strategie erklaert, wann UI, Page Inspection, API/OData/MCP, Telemetry und Logs genutzt werden.

## UI vs. technische Daten

| Frage | Besseres Werkzeug |
|---|---|
| Was sieht der User? | UI/Screenshot |
| Welche Page/Table steckt dahinter? | Page Inspection |
| Existiert der Datensatz wirklich? | API/OData/MCP |
| Welche Felder sind gespeichert? | API/OData/MCP |
| Welche Entries wurden erzeugt? | UI + API/OData |
| Warum kam ein Fehler? | Telemetry/Logs |
| Warum ist es langsam? | Telemetry |
| Welche Extension ist beteiligt? | Page Inspection + Telemetry + Extension Management |

## Page Inspection

Beweist Page Caption, Page Name, Page ID, Page Type, Source Table, Feld-/Filterkontext und sichtbare Extension-Hinweise. Beweist nicht, dass ein Feld fachlich richtig gepflegt ist, ein Datensatz gespeichert wurde oder eine Buchung korrekt waere.

## API/OData/MCP

Beweist Datensatzexistenz, gespeicherte Feldwerte, technische IDs, Dimension Set ID, Posting Groups und Entries, wenn passende Endpunkte verfuegbar sind. Beweist nicht, was der User gesehen hat oder ob ein Feld im aktuellen Profil sichtbar ist.

## Telemetry/Application Insights

Beweist AL Exceptions, API-Fehler, Permission Errors, langsame Operationen, Object IDs, Extension-Hinweise und Correlation IDs. Beweist nicht automatisch die fachliche Ursache.

## Job Queue Logs

Beweisen, welcher Hintergrundjob lief, ob er fehlschlug und welche Fehlertexte sichtbar waren. Sie beweisen nicht zwingend, ob ein externer Dienst erfolgreich verarbeitet hat.

## Change Log

Beweist protokollierte Feld-/Datenaenderungen, wenn Change Log vorher aktiv war. Beweist nicht die fachliche Richtigkeit der Aenderung.

## Permission Sets / Effective Permissions

Beweisen, ob ein User Objekt- oder Datenrechte haben sollte. Beweisen nicht, dass Prozessstatus, Setup oder Layout korrekt sind.

## Extension Management

Beweist installierte Apps/PTEs und Versionen. Beweist ohne Page Inspection, Telemetry oder Repro nicht die genaue Ursache.

## Evidence-Grenzen

- Screenshot: sichtbar, aber nicht zwingend gespeichert.
- API: gespeichert, aber nicht zwingend sichtbar.
- Telemetry: technischer Fehler, aber nicht zwingend fachliche Ursache.
- Page Inspection: Kontext, aber nicht Prozessbeweis.
- Log: Ereignis, aber nicht vollstaendige User-Story.

## Datenschutz und Zugriff

- Zugriff muss zur Umgebung und Rolle passen.
- Datenabfragen auf benoetigte Felder begrenzen.
- Personen-, Bank-, Steuer- und Kundendaten vor Commit anonymisieren.
- Production nur read-only.
- Logs und Telemetry koennen sensible Payloads enthalten; nur relevante Ausschnitte verwenden.
- MCP/API/OData-Ausgaben nicht als Rohdump versionieren, wenn sie mehr Daten enthalten als fuer die Ursache noetig.
