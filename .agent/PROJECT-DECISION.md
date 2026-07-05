# Project Decision

Status: active
Date: 2026-07-05
Scope: Consolidated decision from strategy, sandbox operating model, repo cleanup, book quality and live-queue resume reviews.

## 1. Gemeinsames Zielbild

Das Projektziel ist ein anfaengerfreundliches, fachlich kuratiertes Business-Central-Buch, das die Universaarl GmbH als grosse fiktive Fallstudienfirma in `playthru` / `UNIVERSAARL-DE` einrichtet, Prozesse ausfuehrt, Posten nachweist und die Ergebnisse verstaendlich erklaert.

Ein gutes Buch bedeutet:

- Es liest sich wie ein Fachbuch, nicht wie ein Testprotokoll.
- Es erklaert Seiten, Felder, Entscheidungen, Buchungsgruppen, Konten, Dimensionen, Belege, Posten und Korrekturen in sinnvoller Reihenfolge.
- Es trennt Produktlogik, lokale Ausfuehrung und Steuer-/Compliance-Aussagen.
- Es nutzt Screenshots nur, wenn sie fuer Anfaenger etwas erklaeren und intern wirklich belegen, was behauptet wird.
- Es fuehrt Universaarl als zusammenhaengende Buchwelt; RM-DEMO, Rhein-Main und CRONUS bleiben historische Laborquellen.
- Es begruendet Einrichtung und Prozesse aus der Firma heraus: Rechtsform, Deutschland/EUR, Geschaeftsjahr, SKR04-orientierter Kontenplan, USt, Abteilungen, Standorte, Dimensionen, Einkaufs-/Verkaufs-/Lager-/Zahlungsprozesse und spaetere Auswertungen.

Ein Business-Central-Spezialist-Agent bedeutet:

- Er denkt zuerst fachlich und didaktisch, nicht queue-getrieben.
- Er bewertet jeden Schritt als Business-Central-Consultant: Ist das fuer eine realistische Firma robust, wartbar, pruefbar und im Buch erklaerbar?
- Er handelt in der Sandbox mit Superrechten, wenn Zweck, Wirkung, Evidence, Reopen-/Trace-Proof und Korrekturpfad klar sind.
- Er stoppt nicht aus Angst vor wirksamen Aktionen, aber er tippt, klickt, postet oder raeumt nie blind.
- Er recherchiert offizielle Quellen, wenn Produktlogik oder Buchclaim nicht sicher ist.
- Er macht wiederholte UI-Blocker zu Helpern, Skills, Capabilities oder rejected paths.

## 2. Konsolidierte Prinzipien

### Buch

- Buchtext ist Lesertext. Keine Agenten-, Case-, Evidence- oder Repo-Metasprache im Fliesstext.
- Buchclaims brauchen lokale Universaarl-Evidence, Microsoft-Learn-Produktlogik oder amtliche/Fachquellen.
- Labor- oder Legacy-Evidence darf Buchlernen inspirieren, aber keine aktive Universaarl-Finalwahrheit ersetzen.
- Kapitel folgen grob MB-800 und Microsoft Learn: Company/Core Setup, Financials, Chart of Accounts, Posting Groups, Dimensions, Sales, Purchasing, Inventory, Fixed Assets und Operations.

### Evidence

- Lokale Evidence beweist UI, konkrete Werte, ausgefuehrte Aktionen, Reopen-Proof und Posten in unserer Umgebung.
- Microsoft Learn erklaert Business-Central-Produktlogik und empfohlene Einrichtung.
- Amtliche oder verlaessliche Fachquellen sind Pflicht fuer Steuer-, GoBD-, E-Rechnungs- und Compliance-Aussagen.
- Kein Setup/Stammdaten-`done` ohne Reopen-Proof.
- Kein Posting-`done` ohne relevante Entry-/Ledger-Spur.

### Playwright

- Neue Live-Specs muessen Page Context, Company, Instance und Screenshot-Zweck pruefen.
- Kein Tippen ohne `bc_active_editor_diagnosis` oder gleichwertigen aktiven Editorbeweis.
- Kein unscoped `Neu`, `OK`, `Ja`, `Post`, `Preview`, `Loeschen`, `Starten`.
- `force: true`, Koordinatenklicks, harte Waits und direkte alte `storageState`-Nutzung sind nicht global verboten, aber in neuen Live-Cases begruendungspflichtig und sollen ueber Helper ersetzt werden.

### Sandbox-Superrechte

- Superrechte sollen Handlungsfreiheit schaffen, nicht Laehmung.
- Setup, Stammdaten, Companies, Dokumente, Preview, Posting, Korrektur und Cleanup sind erlaubt, wenn der aktive Case sie ausdruecklich freigibt und Evidence-/Korrekturpfad klar sind.
- Die Sandbox ist Werkstatt und Beweisraum. Sie ist nicht produktiv, aber auch kein Ort fuer unerklaerte Zufallsaktionen.

## 3. Gates

### Echte Stopps

- falsche Instanz oder Instanz unklar
- Company unklar oder falsche Company
- Secret/Auth sichtbar oder commitgefaehrdet
- Dialogwirkung unklar
- Page-Kontext nur Suchoverlay, Role Center oder generischer Text
- aktiver Editor nicht bewiesen, aber Wert soll getippt werden
- Aktion wuerde externe Systeme oder Produktivdaten beruehren
- Buchclaim ohne Evidence/Quelle
- TARGET-073 erneut als Live-Editorprobe ohne neue Helper-/Quellenbasis

### Entscheidungsstuetzen, keine Dauerstopps

- Smart Decision Gate
- Screenshot Truth Gate
- Page Context Guard
- Active Editor Diagnosis
- Quality Audit
- MB-800-/Microsoft-Learn-Abgleich
- Next-Step-/Lookahead-Gate

Diese Gates sollen entscheiden, begrenzen oder umordnen. Sie sollen nicht automatisch jede wirksame Aktion verhindern.

## 4. Priorisierte Arbeitspakete

### Sofort

1. Diese Projektentscheidung als zentrale Referenz nutzen.
2. Freeze nicht durch weitere Reviews verlaengern.
3. TARGET-073 eingefroren/geparkt lassen.
4. TARGET-074 als lokalen Foundation-Checkpoint abgeschlossen halten.
5. TARGET-075 als kleinen, read-first Foundation-Pilot mit expliziten Capability-Verweisen nutzen.

### Als naechstes

1. TARGET-075 vorbereiten oder ausfuehren, sobald der Freeze bewusst geliftet wird: Chart of Accounts und Foundation-Kontext read-only pruefen.
2. Danach entscheiden, ob `TARGET-075-FIRST-VENDOR-CARD-CONTROLLED-FIT` fachlich reif ist.
3. VAT Page 472 erst wieder anfassen, wenn eine neue, nicht wiederholende Editor-/Helper-Hypothese existiert.

### Spaeter

1. Case-Registry/Runner fuer neue Cases.
2. Auth-Freshness-Gate fuer Live-Specs.
3. TypeScript-Checks in `core` und `active` aufteilen.
4. Evidence-Index fuer active Universaarl, legacy RM-DEMO, rejected paths und book candidates.
5. Helper-Konsolidierung fuer Active Editor, Scoped Action, Dialog Gate und Screenshot Truth.

### Nicht anfassen / vermeiden

- keine Massenloeschung alter Tests
- keine Massenverschiebung alter Evidence
- keine vollstaendige `package.json`-Bereinigung in einem Schritt
- kein globales TypeScript-Strict-Refactoring
- keine weitere Subagent-/Framework-Architektur als Selbstzweck
- keine Wiederholung von TARGET-073 ohne neue Hypothese

## 5. Erste konkrete Umsetzung

Dieses Dokument war das erste Umsetzungspaket. Der aktuelle lokale Anschluss ist TARGET-074 als abgeschlossener Foundation-Checkpoint und TARGET-075 als vorbereiteter Resume-Pilot.

Zweck:

- Die fuenf Planungs-/Review-Laeufe werden in eine einzige Projektentscheidung ueberfuehrt.
- Der naechste Agent bekommt eine klare Resume-Entscheidung.
- Widerspruch wird aufgeloest: Superrechte bleiben nutzbar, aber TARGET-073 bleibt geparkt.

Keine Business-Central-Live-Ausfuehrung, kein Playwright-Live-Test und keine wirksame BC-Aktion gehoeren zu diesem Paket.

## 6. Entscheidung zur Live-Queue

TARGET-073 bleibt eingefroren und wird nicht als naechster Live-Case wiederholt.

Der wahrscheinlich beste Resume-Pfad ist:

1. `TARGET-074-W1-FOUNDATION-CHECKPOINT-AFTER-VAT-EDITOR-PARK`
   - erledigt als lokaler Checkpoint
   - klassifiziert Foundation als `limited-learning-path-only`
   - parkt TARGET-073 als Wiederholungsroute ohne neue Helper-Hypothese

2. Aktueller Resume-Pilot:
   - `TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK`
   - read-first, kein Setup-Write, keine Stammdaten, kein Preview/Post
   - prueft `playthru / UNIVERSAARL-DE`, Kontenplan und Setup-Grenzen als Buch- und Evidence-Basis

3. Danach moeglicher Stammdaten-Pilot:
   - `TARGET-075-FIRST-VENDOR-CARD-CONTROLLED-FIT`
   - nur wenn der Foundation-Checkpoint keine neuen Blocker zeigt und Nummernserie/Kreditorenbuchungsgruppe ausreichend geklaert sind

Vor Resume muessen erfuellt sein:

- `npm run agent:preflight` gruen
- `npm run check:encoding` gruen
- `npm run agent:quality:audit` gelesen und in der Case-Entscheidung adressiert
- naechster Case nennt relevante Capabilities:
  - `bc_page_context_guard`
  - `bc_active_editor_diagnosis`
  - `bc_scoped_action_click`
  - `bc_dialog_gate`
  - `screenshot_truth_gate`
  - `evidence_pack_writer`
  - `bc_source_research`, wenn Produktlogik oder Buchclaim nicht sicher ist

## 7. Knapp begruendete Konfliktentscheidung

Fruehere Empfehlungen schwankten zwischen "hart einfrieren" und "Superrechte mutig nutzen". Die konsolidierte Entscheidung lautet:

Superrechte werden genutzt, aber nicht fuer denselben blockierten Grid-Pfad. Die Live-Queue wird nicht pauschal gesperrt; sie wird ueber TARGET-074 bewusst wieder geoeffnet. Der erste Pilot soll das neue Betriebsmodell an einem fachlich nuetzlichen, korrigierbaren und buchwirksamen Schritt pruefen.
