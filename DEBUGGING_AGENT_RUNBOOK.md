# Debugging Agent Runbook

## 1. Ziel

Dieses Runbook fuehrt einen Consultant, Codex-Agenten oder Support-Mitarbeiter von einem Kundenticket zu einem belastbaren Evidence Pack und daraus zu Buchwissen. Es ist fuer Business Central gedacht, aber bewusst werkzeugoffen: UI, Page Inspection, API/OData/MCP, Telemetry, Logs und Playwright werden kombiniert.

Zentrales Denkmodell:

```text
Fehlermeldung -> Page -> Table -> Field -> Setup -> Posting Result -> Evidence -> Regressionstest -> Buchregel
```

## 2. Eingang: Was ein Ticket enthalten kann

Ein Ticket kann Tickettext, Screenshot, Video, Fehlermeldung, Company, User/Rolle, BC-Environment, Belegnummer, Zeitpunkt, Erwartung, Ist-Verhalten, Anhaenge, Logs oder Exportdateien enthalten.

Nicht jedes Ticket enthaelt alles. Fehlende Informationen werden als Rueckfrage markiert, nicht geraten.

## 3. Schritt 1: Ticket verstehen

1. Tickettext vollstaendig lesen.
2. Fehlermeldung exakt kopieren.
3. Sichtbare Page, Aktion und Prozess markieren.
4. Betroffene Daten notieren, aber sensible Daten anonymisieren.
5. Erwartung und Ist-Verhalten trennen.

Output: `00-ticket-summary.md`.

## 4. Schritt 2: Fakten, Hinweise, Hypothesen, Rueckfragen und Tests trennen

| Kategorie | Bedeutung | Beispiel |
|---|---|---|
| Fakt | steht sicher im Ticket, Screenshot oder Log | User sieht Sales Order |
| Sichtbarer Hinweis | aus UI/Screenshot ableitbar | Spalte `Location Code` ist nicht sichtbar |
| Hypothese | plausible, unbewiesene Ursache | Spalte ist personalisiert ausgeblendet |
| Rueckfrage | fehlt fuer sichere Einordnung | Welche Rolle nutzt der User? |
| Test | konkrete Pruefung | Page Inspection und Personalisieren pruefen |

Output: `02-hypotheses.md`.

## 5. Schritt 3: Fehlerklasse bestimmen

| Fehlerklasse | Typische Hinweise |
|---|---|
| Oberflaeche | Feld, Spalte, Aktion oder Filter fehlt |
| Berechtigung | Permission-, TableData- oder Execute-Fehler |
| Stammdaten | Debitor, Artikel, Kreditor, Ressource, Anlage oder Konto fehlerhaft |
| Setup | Posting Groups, Nummernserien, USt, Dimensionen, Lagerort, Bank |
| Status | Beleg ist freigegeben, gebucht, blockiert, storniert oder geschlossen |
| Extension | Feld/Aktion/Page gehoert nicht eindeutig zum Standard |
| Integration | API, OData, EDI, Power Automate, Webhook oder Connector beteiligt |
| Performance/Telemetry | langsam, Timeout, AL Exception, Job Queue Fehler |
| Datenqualitaet | Dubletten, falsche Codes, alte Migration, inkonsistente Werte |

## 6. Schritt 4: Sicherheitspruefung

Vor jeder Aktion:

1. Environment bestimmen.
2. Company bestimmen.
3. Zugriff und Rolle klaeren.
4. Datenschutz pruefen.
5. Risiko der naechsten Aktion bestimmen.
6. `SAFE_ACTION_POLICY.md` anwenden.

Wenn Environment, Freigabe oder Risiko unklar sind: stoppen und Rueckfrage stellen.

## 7. Schritt 5: Repro-Plan erstellen

Ein Repro-Plan enthaelt Startzustand, read-only Checks, Page Inspection, Datenchecks, Telemetry/Log-Checks, Sandbox-Repro, Stop-Kriterien und erwartete Evidence.

Output: `03-repro-plan.md`.

## 8. Schritt 6: Page Inspection / UI-Kontext pruefen

| Merkmal | Zweck |
|---|---|
| Page Caption | Was sieht der User? |
| Page Name / Page ID | technische Page |
| Page Type | List, Card, Document, Worksheet, Dialog |
| Source Table / Table ID | Datenherkunft |
| Aktive Filter | warum Werte fehlen koennen |
| Betroffene Felder | sichtbare und vermutete Felder |
| Extensions | moegliche App/PTE-Einfluesse |

Output: `04-page-inspection.md`.

## 9. Schritt 7: Daten pruefen

UI beweist, was sichtbar ist. API/OData/MCP beweist gespeicherte Werte besser. Pruefe Existenz, Feldwerte, Dimension Set ID, Posting Groups, Entries, Filter und Statuswerte.

Output: `05-data-checks.md`.

## 10. Schritt 8: Telemetry pruefen

Telemetry ist besonders nuetzlich bei AL Exceptions, Permission Errors, API Calls, langsamen Pages, Job Queue Fehlern, Extension-Problemen und Correlation IDs.

Output: `06-telemetry.md`.

## 11. Schritt 9: Repro in Sandbox

Nur wenn sicher:

1. Sandbox/Testumgebung bestaetigen.
2. Testdaten anonym oder synthetisch halten.
3. Erst read-only nachstellen.
4. Schreibende Schritte nur mit Freigabe.
5. Playwright fuer reproduzierbare Klickpfade und Screenshots nutzen.
6. Keine Buchung, Zahlung, E-Mail, Job Queue oder Integration ohne eigenes Gate.

Output: `07-repro-steps.md`.

## 12. Schritt 10: Root Cause bestaetigen

Eine Ursache ist erst bestaetigt, wenn sie alle beobachteten Fakten erklaert und alternative Hypothesen begruendet ausgeschlossen sind.

Output: `08-root-cause.md` mit bestaetigter Ursache, Evidence, technischer Erklaerung, fachlicher Erklaerung, ausgeschlossenen Hypothesen, betroffenen BC-Objekten und moeglichen Nebenwirkungen.

## 13. Schritt 11: Workaround / Fix beschreiben

| Typ | Bedeutung |
|---|---|
| Workaround | hilft kurzfristig, beseitigt Ursache nicht zwingend |
| Fix | korrigiert Ursache |
| Projektentscheidung | fachliche Wahl, zum Beispiel Konto, Prozess oder Rolle |
| Nicht tun | scheinbar einfache, aber riskante Abkuerzung |

Output: `09-fix-or-workaround.md`.

## 14. Schritt 12: Regressionstest formulieren

Ein Regressionstest sagt, welcher alte Fehler nicht wieder auftreten darf, welcher Zustand erwartet wird, welche Evidence entsteht, ob gebucht wird und welche Stop-Kriterien gelten.

Output: `10-regression-test.md`.

## 15. Schritt 13: Buchregel ableiten

Aus jedem wiederverwendbaren Fall entsteht mindestens eine Regel im `FEHLERJOURNAL.md`, eine Checkliste, ein Kapitelbaustein, ein Playwright-Pattern oder eine Safe-Action-Ergaenzung.

Output: `11-book-chapter-draft.md`.

## 16. Output-Formate

Pflichtformat fuer Evidence Packs:

```text
00-ticket-summary.md
01-screenshot-analysis.md
02-hypotheses.md
03-repro-plan.md
04-page-inspection.md
05-data-checks.md
06-telemetry.md
07-repro-steps.md
08-root-cause.md
09-fix-or-workaround.md
10-regression-test.md
11-book-chapter-draft.md
```

Fuer Ticketantworten gilt `TICKETANALYSE_TEMPLATE.md`.

## 17. Abbruchbedingungen

Sofort abbrechen, wenn Environment unklar ist, Production mehr als read-only erfordern wuerde, Freigabe fehlt, Kundendaten nicht anonymisiert werden koennen, ein Locator mehrere kritische Treffer hat, Setupwerte geraten werden muessten oder ein Klick Buchung, Zahlung, Versand, Job Queue oder Integration ausloesen koennte.

## 18. Was der Agent niemals tun darf

- Nie Production veraendern.
- Nie `Post`, `Release`, `Send`, `Apply`, `Start`, `OK` oder aehnliche Wirkungsklicks generisch klicken.
- Nie echte Kundendaten unnoetig in Buchtexte uebernehmen.
- Nie behaupten, ein Screenshot beweise mehr, als sichtbar ist.
- Nie Hypothesen als Ursache formulieren.
- Nie Setupwerte raten.
- Nie einen Fix ohne Regressionstest oder Testplan abschliessen.
