# Safe-Action-Policy

Diese Policy ist die Leitplanke fuer autonome Agentenlaeufe in Business Central.

## Grundsatz

Read-only zuerst. Schreibende, buchende, zahlende, versendende, planende oder integrierende Aktionen brauchen eine explizite Freigabe mit Evidence-Plan.

## Action-Klassen

| Klasse | Beispiele | Ohne Freigabe erlaubt? |
|---|---|---|
| `read-only` | Page oeffnen, Seitentext lesen, Page Inspection, Screenshot | ja, wenn Datenschutz beachtet wird |
| `ui-navigation` | Suche, Filter, Ansichten wechseln | ja, wenn keine Daten geaendert werden |
| `data-export` | Logs, Tabellenwerte, API-Auszug | nur anonymisiert oder freigegeben |
| `setup-change` | Posting Setup, Dimensionen, Nummernserien, Profile | nein |
| `posting` | Belege buchen, Journale buchen, Storno | nein |
| `payment` | Zahlungsjournal, Zahlungsdatei, OP-Ausgleich | nein |
| `email` | Belegversand, Erinnerungen, E-Mail-Ausgang | nein |
| `job-queue` | Job starten, planen, reaktivieren | nein |
| `integration` | API/Web Service/Connector aktivieren, Power Automate starten | nein |
| `company-change` | Company anlegen, kopieren, wechseln mit Setup-Folge | nein |

## Production

Production ist standardmaessig read-only. In Production darf ein Agent ohne ausdrueckliche Freigabe:

- Seiten oeffnen
- sichtbare Informationen dokumentieren
- Page Inspection lesen
- Permission-/Setup-Hinweise read-only erfassen
- anonymisierte Evidence schreiben

Nicht erlaubt:

- speichern
- buchen
- stornieren
- zahlen
- E-Mails senden
- Job Queue starten
- Integrationen anwerfen
- Setup aendern

## Stop-Kriterien

Sofort stoppen und Evidence schreiben, wenn:

- Environment nicht sicher identifiziert ist
- Production sichtbar ist und eine Aktion mehr als read-only waere
- echte Kunden-, Bank-, Steuer- oder Personendaten sichtbar sind und nicht anonymisiert werden koennen
- ein Button `Post`, `OK`, `Send`, `Start`, `Process`, `Apply`, `Release` oder vergleichbar sichtbar wird und der naechste Klick Wirkung haette
- ein Test einen Zielwert nicht sicher erkennt
- ein Locator mehrere kritische Treffer hat
- ein Setup-Feld geraten werden muesste

## Maschinenlesbare Umsetzung

Die TypeScript-Funktion `decideSafeAction()` in `playwright/core/safe-actions.ts` bildet diese Grundregeln fuer Tests und Agent-Checks ab.
