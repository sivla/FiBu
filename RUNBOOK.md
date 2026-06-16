# Runbook fuer Agenten

Dieses Runbook beschreibt den Weg vom Ticket zum Evidence Pack und von dort zum Buchwissen.

## 0. Vor dem Start

1. Arbeitsbaum pruefen: `git status --short --branch`.
2. Aktuellen Branch pruefen.
3. Ticket, Screenshots und Anhaenge lokal sichern.
4. Environment klaeren: Production, Sandbox, Test oder unbekannt.
5. Safe-Action-Policy lesen: `SAFE_ACTION_POLICY.md`.

## 1. Ticket anlegen

1. Kurztitel und Case-ID bilden: `ticket-id-kurztitel`.
2. Evidence-Ordner anlegen: `evidence/[case-id]/`.
3. Dateien aus `EVIDENCE_PACK_TEMPLATE.md` erzeugen.
4. `00-ticket-summary.md` ausfuellen.
5. Fakten, sichtbare Hinweise, Hypothesen, Rueckfragen und Tests getrennt notieren.

## 2. Erste Analyse

1. Modul bestimmen: Finance, Sales, Purchase, Inventory, Warehouse, Service, Projects, Manufacturing, Admin oder Integration.
2. Prozess bestimmen.
3. Page und Fehlermeldung extrahieren.
4. Hypothesenmatrix in `02-hypotheses.md` schreiben.
5. Sicheren Repro-Plan in `03-repro-plan.md` schreiben.

## 3. Read-only Evidence sammeln

1. Screenshot analysieren und in `01-screenshot-analysis.md` dokumentieren.
2. Wenn BC-Zugriff vorhanden ist: Page read-only oeffnen.
3. Page Inspection dokumentieren: Page Caption, Page Name, Page ID, Source Table, Filter, Extensions.
4. Datenwerte read-only ueber UI/API/MCP pruefen.
5. Telemetry- und Log-Hinweise sammeln, falls verfuegbar.

## 4. Reproduktion planen

1. Repro nur in Sandbox/Testumgebung ausfuehren.
2. Schreibende Aktionen gegen `SAFE_ACTION_POLICY.md` pruefen.
3. Bei jedem Risiko vorab entscheiden: erlaubt, Freigabe noetig oder stoppen.
4. Playwright-Test nur dann schreiben, wenn Ziel, Startzustand und Stop-Kriterien klar sind.

## 5. Playwright nutzen

1. Abhaengigkeiten installieren: `npm install`.
2. Evidence-Struktur pruefen: `npm run check:evidence`.
3. Safe-Policy pruefen: `npm run check:safe-policy`.
4. Optionaler BC-Smoke, nur mit `.env` und Auth-State: `npm run bc:sample`.

## 6. Ursache bestaetigen

1. Root Cause in `08-root-cause.md` nur schreiben, wenn Evidence die Ursache traegt.
2. Andere Hypothesen begruendet ausschliessen.
3. Technische und fachliche Erklaerung trennen.
4. Betroffene BC-Objekte und Daten nennen.

## 7. Fix oder Workaround

1. Kein Setup-Feld raten.
2. Workaround klar als temporaer markieren.
3. Dauerhafte Loesung mit Risiko und Owner beschreiben.
4. Regressionstest in `10-regression-test.md` formulieren.

## 8. Buchwissen ableiten

1. Wiederkehrendes Muster in `FEHLERJOURNAL.md` ergaenzen.
2. Kapitelentwurf in `11-book-chapter-draft.md` schreiben.
3. Hauptmanuskript `DEBUGGING_BUCH.md` nur aktualisieren, wenn die Regel allgemein genug ist.

## 9. Abschluss

1. `npm run check:evidence` ausfuehren.
2. `npm run check:safe-policy` ausfuehren.
3. `git diff --check` ausfuehren.
4. Commit mit knappem Titel.
5. Push auf Remote-Branch.
