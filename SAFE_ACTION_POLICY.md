# Safe Action Policy

## Ziel

Diese Policy ist die Leitplanke fuer autonome Agentenlaeufe in Business Central. Read-only kommt zuerst. Schreibende, buchende, zahlende, versendende, planende oder integrierende Aktionen brauchen eine explizite Freigabe mit Evidence-Plan.

## Environment-Klassen

| Environment | Standardverhalten |
|---|---|
| Production | read-only |
| Sandbox | kontrollierte Tests |
| Test/Training | kontrollierte Schreibtests |
| Local/Mock | frei testbar |

## Aktionsklassen

| Aktion | Risiko | Erlaubt ohne Freigabe? | Beispiele |
|---|---|---|---|
| Lesen | niedrig | ja | Page oeffnen, Screenshot, Page Inspection |
| Strukturierte Daten lesen | niedrig/mittel | ja, wenn Zugriff erlaubt | API/OData/MCP GET |
| Personalisieren | niedrig/mittel | nur gezielt | Feld einblenden |
| Stammdaten aendern | mittel | nein | Debitor, Artikel, Posting Group |
| Beleg erfassen | mittel/hoch | nein | Sales Order, Purchase Order |
| Buchen/Posten | hoch | nie ohne Freigabe | Post, Receive and Invoice |
| Zahlung/E-Mail/Job Queue | sehr hoch | nie ohne Freigabe | Payment Export, Send Email, Job starten |
| Integration ausloesen | sehr hoch | nie ohne Freigabe | EDI, Webhook, Power Automate |

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

## Freigabe-Mindestinhalt

Eine Freigabe fuer eine riskante Aktion muss konkret sein:

| Feld | Muss geklaert sein |
|---|---|
| Environment | Production, Sandbox, Test/Training oder Local/Mock |
| Company | genaue Company |
| Aktion | konkrete Page, Funktion, Beleg oder Setup-Stelle |
| Zweck | warum die Aktion noetig ist |
| Risiko | fachliche und technische Nebenwirkungen |
| Evidence-Plan | welche Vorher/Nachher-Nachweise entstehen |
| Rueckfall | wie abgebrochen oder zurueckgerollt wird |

## Abbruchregeln

Sofort stoppen und Evidence schreiben, wenn:

- Environment nicht sicher identifiziert ist.
- Freigabe unklar ist.
- Production sichtbar ist und eine Aktion mehr als read-only waere.
- echte Zahlungs-, Steuer-, Kunden-, Bank- oder Personendaten sichtbar sind und nicht anonymisiert werden koennen.
- eine Aktion Buchung, Versand, Zahlung oder externe Integration ausloesen koennte.
- Telemetry oder Logs sensible Daten enthalten und nicht anonymisiert sind.
- ein Button `Post`, `OK`, `Send`, `Start`, `Process`, `Apply`, `Release` oder vergleichbar sichtbar wird und der naechste Klick Wirkung haette.
- ein Test einen Zielwert nicht sicher erkennt.
- ein Locator mehrere kritische Treffer hat.
- ein Setup-Feld geraten werden muesste.

## Maschinenlesbare Umsetzung

Die TypeScript-Funktion `decideSafeAction()` in `playwright/core/safe-actions.ts` bildet diese Grundregeln fuer Tests und Agent-Checks ab.
