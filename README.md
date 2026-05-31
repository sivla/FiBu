# Business-Central-Lern- und Screenshot-Projekt

Dieses Repository ist ein Arbeitsprojekt, um Microsoft Dynamics 365 Business Central systematisch zu lernen, zu testen und für ein Buchprojekt mit bebilderten Klickanleitungen zu dokumentieren.

Der erste konkrete Anwendungsfall ist `FiBu-Buch 5`. Das langfristige Ziel ist jedoch größer: Das Projekt soll Business Central durch reale Nutzung erschließen. Playwright klickt Prozesse durch, erzeugt Screenshots, entdeckt sichtbare Funktionen und hilft dabei, das Buch fachlich zu verbessern.

## Projektziele

1. Business-Central-Prozesse aus dem Buch praktisch durchspielen.
2. Fehlende Testdaten in BC anlegen und versioniert dokumentieren.
3. Screenshots für bebilderte Klickanleitungen erzeugen.
4. Jedes sichtbare UI-Element fachlich verstehen: Seiten, Buttons, Menüs, Felder, FastTabs, FactBoxes, Dialoge und Hinweise.
5. Dinge, die im Screenshot sichtbar sind, aber im Buch fehlen, als Fundstelle erfassen.
6. Fundstellen mit Microsoft-Dokumentation, BC-Hilfe und eigenen Tests nachrecherchieren.
7. Das Buch aktualisieren, wenn eine Funktion für Bedienung, Prozessverständnis, Prüfung, Fehlerdiagnose oder Evidence Pack relevant ist.
8. Learnings so dokumentieren, dass ein anderer Codex-Account oder ein anderes Projekt später weiterarbeiten kann.
9. Klickpfade, Buttons und Funktionen nicht nur theoretisch kennen, sondern durch Playwright-Läufe praktisch durchspielen und nachweisen.

## Arbeitsprinzip

Das Buch gibt den roten Faden vor. Business Central selbst korrigiert und erweitert diesen roten Faden durch echte Nutzung.

Wenn Playwright beim Testen etwas findet, das nicht erklärt ist, wird es nicht ignoriert. Es wird geprüft:

- Ist es nur Navigation oder fachlich relevant?
- Muss der Leser den Button oder das Feld verstehen?
- Hat das Element Auswirkungen auf Buchung, Steuer, Dimension, Lager, Bericht oder Evidence Pack?
- Fehlt dem Buch dazu eine Erklärung?
- Braucht der Test zusätzliche Stammdaten oder Setup-Schritte?

## Zentrale Dokumente

| Datei/Ordner | Zweck |
|---|---|
| `FiBu_Buch_BC_Standardprozesse_DE_Master_Blueprint.md` | aktuelles Buchmanuskript |
| `playwright/README.md` | technische Playwright-Struktur |
| `playwright/BC-LEARNING-MODEL.md` | Lernmodell: Business Central durch Nutzung verstehen |
| `playwright/FINDINGS.md` | offene Fundstellen aus Screenshots und Tests |
| `playwright/projects/fibu-book5/UI-INVENTORY.md` | Inventar der gesehenen, geklickten und verstandenen BC-Funktionen |
| `playwright/LEARNINGS.md` | wiederverwendbare BC-Playwright-Erfahrungen |
| `playwright/PROJECTS.md` | Register für mehrere Projekte |
| `playwright/ENVIRONMENTS.md` | Regeln für Umgebungen und `.env` |
| `HANDOVER.md` | Übergabe an andere Codex-Accounts |

## Erste Projektlinie

Aktives Projekt:

```text
playwright/projects/fibu-book5/
```

Aktueller Fokus:

- nackige Spielwiese mit CRONUS einrichten
- Trainingscompany `RM-DEMO` aufbauen
- Buchanleitungen praktisch testen
- Screenshots erzeugen
- sichtbare BC-Funktionen erklären
- Buchtext bei Lücken ergänzen

## Definition von fertig

Ein getesteter Buchabschnitt ist erst dann fertig, wenn:

- der Klickpfad in Business Central funktioniert
- benötigte Testdaten dokumentiert sind
- Screenshots erzeugt und geprüft wurden
- jedes fachlich relevante sichtbare Element erklärt ist
- relevante Buttons und Funktionen im UI-Inventar erfasst sind
- offene Funktionen in `playwright/FINDINGS.md` erfasst oder erledigt sind
- das Buch die Erkenntnisse enthält
- Evidence-Pack-Hinweise vorhanden sind
