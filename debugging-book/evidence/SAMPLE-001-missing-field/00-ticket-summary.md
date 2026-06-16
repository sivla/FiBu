# Ticket Summary

| Feld | Wert |
|---|---|
| Ticket-ID | SAMPLE-001 |
| Kurztitel | Missing Location Code column |
| Kunde | synthetischer Demo-Fall |
| Environment | unbekannt, als Beispiel ohne echten BC-Zugriff behandelt |
| Company | nicht genannt |
| User/Rolle | Sales User, nicht bestaetigt |
| Modul | Sales |
| Prozess | Sales Order erfassen |
| Page | Sales Order / Verkaufsauftrag, angenommen |
| Fehlermeldung | keine technische Fehlermeldung |
| User-Meldung | "Die Spalte Lagerortcode fehlt in den Verkaufszeilen. Ich kann den Auftrag nicht wie in der Anleitung erfassen." |
| Erwartung | User kann `Lagerortcode` in der Verkaufszeile sehen oder pflegen |
| Ist-Verhalten | Spalte ist im aktuellen Layout nicht sichtbar |
| Datenschutzstatus | keine echten Kundendaten |

## Kurzfazit

Der Fall ist ein ungefaehrlicher UI-/Layout-Debugging-Fall. Die fehlende Spalte beweist nicht, dass das Feld oder die Funktion fehlt. Zuerst sind Personalisieren, Profil/Rollenlayout und Page Inspection zu pruefen.
