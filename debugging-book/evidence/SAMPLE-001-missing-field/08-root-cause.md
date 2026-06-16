# Root Cause

## Bestaetigte Ursache

Die Spalte ist im aktuellen Layout nicht sichtbar. Das beweist nicht, dass das Feld oder die Funktion fehlt. Zuerst Personalisieren, Profile/Rollenlayout und Page Inspection pruefen.

## Beleg

Der synthetische Tickettext meldet eine fehlende Spalte, aber keine Fehlermeldung, keinen Permission-Fehler und keinen Beleg fuer fehlende Tabellenlogik.

## Technische Erklaerung

Business Central kann Felder je nach Page-Design, Profil, Personalisierung, Rolle, Berechtigung, Sprache und Extension unterschiedlich anzeigen. Eine nicht sichtbare Spalte ist deshalb zuerst ein UI-/Layout-Befund.

## Fachliche Erklaerung

Der Lagerortcode steuert, von welchem Lagerort eine Verkaufszeile verarbeitet werden soll. Wenn der User die Spalte nicht sieht, kann er der Anleitung nicht folgen. Das heisst aber noch nicht, dass der Prozess fachlich unmoeglich ist.

## Ausgeschlossene Hypothesen

- Fehlende Funktion: durch Screenshot allein nicht belegt.
- Posting-Setup-Fehler: keine Buchungsfehlermeldung vorhanden.
- Berechtigungsfehler: keine Permission-Meldung vorhanden.

## Betroffene BC-Objekte

- Sales Order Page, Annahme
- Sales Line, Annahme
- Feld `Location Code` / `Lagerortcode`, Annahme

## Moegliche Nebenwirkungen

Eine globale Profilanpassung kann mehrere User betreffen. Eine User-Personalisierung betrifft nur den User, kann aber Schulungsscreenshots von Standardansichten abweichen lassen.
