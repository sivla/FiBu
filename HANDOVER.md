# Uebergabe fuer neue Codex-Accounts

## Zuerst lesen

Neue Agents, Projektleiter, Business-Central-Consultants und Solution Architects starten mit diesen Dateien:

```text
README.md
.agent/project-template/UNIVERSAARL-EXECUTION-ROADMAP.md
.agent/ACTIVE-ARTIFACT-CLASSIFICATION.md
.agent/project-template/PROJECT-DASHBOARD-DRAFT.md
.agent/state/current.json
```

Diese Dateien enthalten die aktive Projektwahrheit, die erlaubte naechste Aktion, die Freeze-/Resume-Grenzen und die Legacy-Grenze. Alte Chatverlaeufe, alte `latest*`-State-Bloecke und historische Playwright-Tests duerfen diese aktive Fuehrung nicht ueberstimmen.

## Aktive Zielwelt

- Business-Central-Instanz: `playthru`
- Zielcompany: `UNIVERSAARL-DE`
- Referenzfirma: Universaarl GmbH
- Fuehrende Projektsprache: Deutsch
- Geparkter Live-Case: `TARGET-073`
- Erster Resume-Pilot: `TARGET-075`, read-first und no-write

Legacy-Grenze:

- `RM-DEMO`, `MCP_1_20260210`, CRONUS, Rhein-Main und RM-* sind keine aktive Projektwahrheit.
- Historische Evidence bleibt als Trace erhalten, darf aber nicht als Universaarl-Beweis oder naechster Arbeitspfad genutzt werden.
- Wiederverwendbare Muster aus Legacy muessen neutralisiert oder fuer Universaarl neu aufgebaut werden.

## Aktueller Arbeitsmodus

Der Improvement Freeze ist aktiv, bis die Resume-Gates bewusst geprueft und der Live-Resume freigegeben sind. Business Central live, Playwright-Live-Cases, Setup, Stammdaten, Drafts, Preview Posting, Posting, Payment, Cleanup und Company-Wechsel bleiben waehrend des Freeze gesperrt.

Der naechste fachlich sinnvolle Live-Pilot nach Freeze-Lift ist:

```text
TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK
```

TARGET-075 darf nur lesen:

- `playthru` bestaetigen
- `UNIVERSAARL-DE` bestaetigen
- Kontenplan-/Foundation-Kontext oeffnen
- sichtbare Werte, Screenshots und kompakte Evidence erfassen
- keine Writes, keine Masterdaten, keine Drafts, kein Preview, kein Posting

## Lokaler Start

Auf einem neuen Rechner:

```powershell
npm install
npx playwright install chromium
Copy-Item .env.example .env
```

Danach `.env` lokal fuellen. Secrets, Auth-Dateien und echte Kundendaten werden nie committet.

Vor Live-Arbeit zuerst lokal pruefen:

```powershell
npm run auth:bc:check
npm run agent:preflight
npm run agent:resume:check
npm run agent:resume:check:overnight
npm run agent:freeze:status
npm run agent:foundation:decision:check
npm run check:encoding
git diff --check
```

TARGET-075 wird nicht direkt per `npx playwright test` gestartet, sondern ueber den Guard:

```powershell
npm run fibu:target:foundation-consistency-pilot -- --check
npm run fibu:target:foundation-consistency-pilot -- --list
```

Live-Ausfuehrung nur nach explizitem Freeze-Lift und gueltigem Gate.

Nach TARGET-075 erst `npm run agent:foundation:decision:write` verwenden, wenn das TARGET-075-Result vorhanden ist und validiert. Vorher bleibt `agent:foundation:decision:check` der sichere No-Write-Modus. Zielartefakt ist `FOUNDATION-READINESS-DECISION.md`.

## Arbeitsregel

Arbeite in kleinen, pruefbaren Batches:

1. Aktive Wahrheit lesen.
2. Kleinsten sinnvollen Fortschritt waehlen.
3. Legacy nicht als aktive Fuehrung nutzen.
4. Ergebnis als bewiesen, beobachtet, Annahme, blockiert, geparkt, verworfen oder `legacy-purge-source` klassifizieren.
5. Nur die Steuerdateien aktualisieren, deren Aussage sich wirklich geaendert hat.

Kein neues Framework, keine neue Methodikdatei und keine breite Aufraeumrunde, wenn ein kleiner State-, Guard-, Evidence-, UAT-, Training- oder Buchschritt den naechsten Projektfortschritt besser vorbereitet.

## Commit-/Push-Regel

Vor einem Commit:

- aktive Zielwelt bleibt `playthru / UNIVERSAARL-DE / Universaarl GmbH`
- Roadmap, Dashboard und State widersprechen sich nicht
- alte RM-/CRONUS-/MCP-Pfade fuehren nicht als normaler Einstieg
- neue Evidence, Screenshots oder Buchtexte haben klaren Zweck
- Rohartefakte, Reports, Traces, Auth-State, `.env`, Logs und Binaries bleiben uncommitted
- relevante Checks laufen gruen oder bekannte Grenzen sind klar dokumentiert

## Plattform und Encoding

Das Projekt wird fuer Windows und macOS gepflegt.

- Node/npm-Skripte plattformneutral halten.
- Pfade im Code ueber Node-`path` oder Playwright-Projektpfade bauen.
- Textdateien als UTF-8 pflegen.
- Playwright-Browser pro Rechner installieren: `npx playwright install chromium`.
- Auth und `.env` pro Rechner lokal erzeugen.
