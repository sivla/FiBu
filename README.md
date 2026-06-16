# Business Central Debugging Book

Dieses Repository enthaelt das **Business Central Debugging Book & Evidence System**.

Der aktive Buchbereich liegt in:

```text
debugging-book/
```

Wichtige Regeln:

- Production ist grundsaetzlich read-only.
- Keine Buchungen, Stornos, Zahlungen, E-Mails, Job-Queue-Starts oder Integrationslaeufe ohne ausdrueckliche Freigabe.
- Evidence Packs liegen unter `debugging-book/evidence/`.
- Die Playwright-Grundstruktur im Root prueft Templates, Safe-Action-Policy und optionale read-only BC-Smokes.

Start:

```powershell
npm install
npm run check:debugging-book
npm run check:evidence
npm run check:safe-policy
npm run check:templates
npm run check:privacy
npm run check:runtime
npm run check:api
npm run check:scaffold
npm run new:evidence -- SAMPLE-002 "Permission error on posting preview"
```

## Automatische Checks

Lokale Checks ohne Business-Central-Zugriff:

- `npm run check:debugging-book` prueft Evidence Packs, Template-Sektionen, Privacy-Findings und vorhandene npm-Skripte.
- `npm run check:evidence` prueft Sample-Evidence-Packs inklusive Root Cause, Regressionstest und Page Inspection.
- `npm run check:safe-policy` prueft die maschinenlesbare Safe-Action-Policy.
- `npm run check:templates` prueft Pflichtabschnitte der Buch-Templates.
- `npm run check:privacy` prueft Scanner-Fixtures fuer saubere und problematische Inhalte.
- `npm run check:runtime` prueft sichere `.env`-/Runtime-Konfiguration ohne echte BC-Werte.
- `npm run check:api` prueft den mock-faehigen GET-only API/OData-Client.
- `npm run check:scaffold` prueft das Evidence-Pack-Scaffold.

BC-Zugriff bleibt getrennt:

```powershell
npm run bc:sample
```

Ohne `BC_URL` skippt der Live-Smoke. Production bleibt fuer Agenten read-only: Page oeffnen, Page Inspection und strukturierte Lesezugriffe sind erlaubt; Buchen, Senden, Zahlen, Job Queue, Integrationen, Setup-, Stammdaten- oder Berechtigungsaenderungen brauchen ausdrueckliche Freigabe mit Evidence- und Rollback-Plan.

Neue Evidence-Faelle entstehen unter `debugging-book/evidence/[ticket-id]-[kurztitel]/`. Mindestens die Dateien `00` bis `11` muessen gefuellt sein; `12` bis `14` sind empfohlen und erzeugen Warnungen, wenn sie fehlen.

Ein neuer Fall kann standardisiert erzeugt werden:

```powershell
npm run new:evidence -- SAMPLE-002 "Permission error on posting preview"
```

Runtime-Details stehen in `debugging-book/BC_RUNTIME_CONFIGURATION.md`. `.env`, Auth-State, Cookies und Tokens bleiben lokal und werden nicht committed.
