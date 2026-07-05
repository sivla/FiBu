# Project Improvement Plan

Status: active freeze plan
Case: PROJECT-IMPROVEMENT-FREEZE-001
Created: 2026-07-05

## Zielbild fuer das Buch

Das Buch soll eine grosse fiktive Business-Central-Firma Schritt fuer Schritt aufbauen: Universaarl GmbH in `playthru` / `UNIVERSAARL-DE`. Die Firma ist keine Demo-Kopie und keine lose Screenshot-Sammlung. Sie ist die durchgehende Fallstudie fuer Einrichtung, Stammdaten, Belege, Buchungen, Posten, Berichte, Fehlerkorrektur und UAT.

Jedes Kapitel muss fuer Anfaenger direkt lesbar sein:

- Welche Seite ist offen?
- Warum ist diese Einrichtung fachlich notwendig?
- Welche Felder sind wichtig?
- Welche Aktionen sind harmlos, welche schreiben Daten?
- Welche Buchungsgruppen, Konten, Dimensionen oder Nummernserien beeinflussen spaetere Buchungen?
- Welche Posten entstehen nach Preview oder Posting?
- Woran erkennt man Erfolg?
- Welche typischen Fehler treten auf und wie korrigiert man sie?

Interne Begriffe wie Agent, Case, Evidence, Result JSON, Screenshot beweist oder spaeter muss gehoeren nicht in den Buchfliesstext. Diese Begriffe bleiben in State, Atlas, Evidence, Coverage und Review-Dateien.

## Quellenanker

Dieser Freeze-Plan nutzt offizielle Microsoft-Learn-Quellen als Produktlogik-Anker:

- MB-800 Study Guide: Business Central Functional Consultants konfigurieren Companies, Financial Management, Sales, Purchasing, Inventory und Fixed Assets; die Skills umfassen unter anderem Company Creation, Number Series, Dimensions, Posting Groups, Journals, Sales, Purchasing, Payments, Inventory und Fixed Assets.
  Quelle: https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/mb-800
- Setting up finance: Vor Finanztransaktionen kommen Chart of Accounts und Posting Groups; viele Finance-Setups muessen vor Buchungen erledigt sein.
  Quelle: https://learn.microsoft.com/en-us/dynamics365/business-central/finance-setup-finance
- Chart of Accounts: Sachkonten speichern Finanzdaten; Business Central erlaubt neue oder geaenderte G/L Accounts, Loeschungen sind bewusst begrenzt.
  Quelle: https://learn.microsoft.com/en-us/dynamics365/business-central/finance-setup-chart-accounts
- Posting Groups: Posting Groups mappen Kunden, Kreditoren, Artikel, Ressourcen und Dokumente auf Sachkonten; General, Specific und Tax Posting Groups haben unterschiedliche Rollen.
  Quelle: https://learn.microsoft.com/en-us/dynamics365/business-central/finance-posting-groups
- Dimensions: Dimensionen kategorisieren Belege, Journale und Posten fuer Analyse; Global und Shortcut Dimensions sind eigene Setupentscheidungen.
  Quelle: https://learn.microsoft.com/en-us/dynamics365/business-central/finance-dimensions

## Empfohlene fachliche Setup-Reihenfolge

1. Company und Kontext
   - Environment `playthru`, Company `UNIVERSAARL-DE`, Name `Universaarl GmbH`.
   - Company Information, Rolle, Sprache, Arbeitsdatum und Region sauber erklaeren.

2. Buchwelt und Organisationsmodell
   - Mehrere Firmen sind Zielbild, nicht optionaler Nachtrag.
   - `UNIVERSAARL-DE` ist die erste deutsche operative Company.
   - Weitere Universaarl-Companies spaeter fuer Ausland, Holding, Vertrieb, Produktion oder Intercompany.
   - Jede Company bekommt ihren passenden lokalen Kontenplan; fuer die deutsche Company ist SKR04-orientiert gesetzt.

3. Finanzbasis
   - General Ledger Setup und Accounting Periods.
   - SKR04-orientierter Starterkontenplan, aber klar begrenzt: nicht vollstaendiger SKR04, keine Steuerberaterfreigabe, keine final bewiesene Compliance.
   - Account Categories fuer Reporting erst nach sichtbarer Kontenbasis.

4. Nummernserien
   - Nummernserienkoepfe, Linien, relevante Checkboxen und Zuweisungen.
   - Manuelle Nummern, Standardnummern und Belegnummern muessen im Buch erklaert werden, bevor Master Data und Belege entstehen.

5. Buchungsgruppen und Kontenfindung
   - Customer/Vendor Posting Groups.
   - General Business/Product Posting Groups.
   - General Posting Setup.
   - Inventory Posting Groups und Inventory Posting Setup.
   - Bank/FA Posting Groups spaeter pro Modul.

6. VAT/USt
   - VAT Business Posting Groups, VAT Product Posting Groups, VAT Posting Setup.
   - Erst Setup und Reopen-Proof, dann Preview, VAT Entries, G/L Entries und Bericht.
   - Keine deutsche USt-Endaussage ohne Preview/Posten/Quelle.

7. Dimensionen
   - Dimensionen und Werte.
   - Global/Shortcut Dimensions.
   - Default Dimensions erst an konkreten Master-Data-Zielen.
   - Dimension Set Entries erst nach Belegen oder Journalen.

8. Journale und Bankbasis
   - Journal Templates/Batches, Bankkonten, Payment Methods, Payment Terms.
   - Preview/Posting nur mit Eintragsziel und Trace-Plan.

9. Stammdaten
   - Debitoren, Kreditoren, Artikel, Lagerorte, Einheiten, Preise.
   - Stammdaten erst, wenn Nummernserien, Posting Groups, VAT und Dimensionen bewusst ready oder bewusst begrenzt sind.

10. Prozessketten
   - O2C, P2P, Inventory, Payments, Fixed Assets, Bank Reconciliation.
   - Danach Warehouse, Manufacturing, Service, Projects, Reporting, Security, Workflows, Change Log, Job Queue, Configuration Packages, Migration/Cutover, Intercompany, Corrections, UAT.

## MB-800/Learn-orientierte Kapitelachsen

| Buchachse | Learn-/MB-800-Bezug | Buchkonsequenz |
| --- | --- | --- |
| Company und Core Setup | Create and configure a company, core functionality | Nicht als Admin-Randthema behandeln; das ist Kapitelstart. |
| Financial Foundation | Configure financials, GL setup, COA | SKR04-orientierte Konten muessen vor Posting-Groups und VAT erklaert werden. |
| Posting Groups | General, specific, tax posting groups | Eigene Grundlagenkapitel noetig, weil hier Kontenfindung entsteht. |
| Dimensions | Dimension values, global/shortcut/default dimensions | Vor Reporting und Prozessbuchungen einfuehren, aber Default Dimensions erst mit konkreten Stammdaten. |
| Journals/Bank | Journal templates, batches, bank accounts | Als Querschnitt erklaeren, nicht erst bei Payments. |
| Sales/Purchase | Customer/vendor/item setup, documents, entries | Erst nach Foundation, dann mit Preview/Posten-Spur. |
| Inventory | Items, locations, item/value entries | Muss eigene Prozessfamilie sein, nicht nur Nebenwirkung von P2P/O2C. |
| Fixed Assets | FA setup, acquisition, depreciation, disposal | Wiederaufbau mit Universaarl-Evidence, alte RM-Laborstrecke nur Archiv. |
| Operations | Filters, page inspection, analysis mode, posted document correction | Look-and-feel/Fehlerkapitel braucht echte Daten und Screenshots. |

## Kritische Bewertung des aktuellen Wegs

TARGET-073 ist fachlich korrekt gestoppt worden. Das Problem ist nicht mehr "noch einmal besser klicken", sondern ein systemisches Playwright-Pattern: BC-Gitter, List-Edit und aktive Editoren sind nicht stabil genug als wiederholbare Grundlage.

Der aktuelle Foundation-Weg ist fachlich zu kleinteilig geworden. Die Nummernserien-, VAT- und General-Posting-Setup-Kette hat wertvolle Learnings erzeugt, aber zu viele Micro-Cases ohne Buchsubstanz. Der naechste Fortschritt darf nicht "noch eine Page-472-Editorprobe" sein. Besser ist ein Foundation-Checkpoint, der entscheidet:

- Welche Foundation-Bausteine sind wirklich vorhanden?
- Welche sind bewusst geparkt?
- Reicht der Stand fuer einen begrenzten Lernpfad ohne Finalclaim?
- Welche fehlenden Bausteine muessen zuerst durch Helper/Skill verbessert werden?

## Fehlende Playwright-Faehigkeiten

Der Quality-Audit meldet:

- `waitForTimeout`: 2320 Treffer
- `force: true`: 349 Treffer
- Koordinaten-/Mouse-Clicks: 155 Treffer
- direkte `storageState`-Verwendung: 433 Treffer
- unscoped `.nth(...)`: 273 Treffer
- direkte `goto`: 576 Treffer
- `tsconfig.json` prueft nur 5 Dateien bei 449 TypeScript-Dateien

Daraus folgen diese Pflichtfaehigkeiten vor weiteren riskanten Live-Schritten:

1. Auth Freshness Gate
   - Vor Live-Spec pruefen, ob Login/Storage-State zur Zielinstanz und Zielcompany passt.
   - Direkte Storage-State-Verwendung in neuen Specs verbieten oder wrapperpflichtig machen.

2. BC Page Context Guard
   - Page, Company, Instance, sichtbarer Titel und optional Page Inspection vor Aktion.
   - Role-Center- oder Suchoverlay-Treffer duerfen nicht als Zielseite gelten.

3. Active Editor Diagnosis
   - Kein Tippen ohne row-/card-/field-scoped Editorbeweis.
   - Muss aus TARGET-073 als Helper/Capability konkretisiert werden.

4. Scoped Action Click
   - `Neu`, `Liste bearbeiten`, `Zeilen`, `Kopieren`, `Loeschen`, `Starten`, `OK` nur mit Scope, Kandidatenliste und erwarteter Wirkung.

5. Dialog Gate
   - Dialogtext erfassen, Risiko klassifizieren, nur erlaubten Button klicken.
   - Default bei riskanten Dialogen: abbrechen oder blockieren.

6. Screenshot Truth Gate
   - Jeder Screenshot braucht Page, Company, Schritt, sichtbare Werte, Buchnutzen, interne Grenze.
   - Falsche Seite, Suchoverlay oder generischer Text = rejected.

7. Evidence Writer
   - Einheitliche Result-Felder fuer SetupChanged, MasterDataChanged, DraftCreated, PreviewPosting, Posted, ApiShortcut, Screenshots, Proved, NotProved, NextStepDecision.

8. TypeScript Coverage Gate
   - `tsc --noEmit` ist aktuell kein belastbarer Projekthealth-Check, solange nur 5 von 449 TS-Dateien im tsconfig liegen.
   - Freeze-Resume darf tsc nur als Zusatzsignal nutzen, nicht als "alles typisiert".

## Naechste Skills/Capabilities

Prioritaet 1:

- `bc-active-editor`
  - Zweck: BC-Gitter/Kartenfelder nur beschreiben, wenn ein echter Editor bewiesen ist.
  - Anlass: TARGET-071/TARGET-073 und fruehere Nummernserien-/P2P-/VAT-Blocker.
  - Output: editor diagnosis JSON mit `safeToType`.

- `bc-source-research`
  - Zweck: Produkt-/Setup-/Compliance-Claims vor Buchtext pruefen.
  - Anlass: Company Creation, SKR04, VAT, Posting Groups, MB-800-Struktur.
  - Output: Claim Card mit allowed/notAllowed/source/bookBoundary.

Prioritaet 2:

- `book-claim-auditor`
  - Zweck: Buchtext auf Agenten-Meta, falsche Finalclaims und fehlende Anfaengerfuehrung pruefen.
  - Output: Patchplan, nicht automatisch Massenersetzung.

- `bc-helper-consolidator`
  - Zweck: wiederholte wait/force/mouse/nth/direct-goto-Muster in erlaubte Helper oder rejected paths ueberfuehren.
  - Output: Helper extraction plan.

Prioritaet 3:

- `bc-live-run-freeze-review`
  - Zweck: Resume/Reorder-Entscheidung nach Freeze erzwingen.
  - Output: Resume Decision Card.

## Aufraeumen und Zusammenfuehren

1. Capabilities konsolidieren
   - `bc_scoped_new_action` als Spezialfall von `bc_scoped_action_click` fuehren.
   - `bc_page_context_guard`, `screenshot_truth_gate` und `evidence_pack_writer` als Pflichtkette fuer neue Universaarl-Specs.
   - `bc_active_editor_diagnosis` in neuen Setup-/Grid-Specs verpflichtend referenzieren.

2. Tests klassifizieren
   - Legacy RM-/CRONUS-Tests nicht als aktive Zieltests behandeln.
   - Neue Universaarl-Tests muessen `capabilitiesUsed` oder README-Bezug enthalten.
   - Alte Tests mit vielen force/mouse/wait-Treffern zuerst als Musterquelle, nicht als Vorbild verwenden.

3. Buchstruktur
   - Kapitel 3/4: Company, Environment, Mandantenliste, Universaarl-Fallstudie.
   - Danach eigenes Foundation-Kapitel: SKR04-orientierter Starterkontenplan, Nummernserien, Posting Groups, VAT, Dimensionen.
   - Erst danach Master Data und Prozesskapitel.
   - Intercompany ist spaeter Pflichtbestandteil der Fallstudie, nicht optionaler Anhang.

4. State/Queue
   - Freeze bleibt aktiv.
   - TARGET-073 nicht weiter ausfuehren.
   - TARGET-074 bleibt Resume-Kandidat, aber nur als lokaler Foundation-Checkpoint.
   - Keine O2C/P2P/Master-Data-Livefaelle, solange Foundation nicht bewusst freigegeben ist.

## Resume-Bedingung

Die Live-Queue darf erst wieder aufgenommen werden, wenn alle Punkte erfuellt sind:

1. `npm run agent:preflight` gruen.
2. `npm run check:encoding` gruen.
3. `npm run agent:quality:audit` wurde gelesen und die Risiken sind in der naechsten Case-Entscheidung adressiert.
4. Der naechste Live- oder Local-Case referenziert explizit relevante Skills/Capabilities:
   - mindestens `bc_active_editor_diagnosis` fuer Grid/Edit-Schritte,
   - `bc_page_context_guard`,
   - `screenshot_truth_gate`,
   - `evidence_pack_writer`,
   - bei Buchclaim `bc_source_research` oder lokale Evidence.
5. `current.json` zeigt nicht mehr Freeze als aktiv, sondern eine explizite Resume Decision Card.
6. TARGET-073 bleibt geschlossen/geparkt; keine weitere Page-472-Editorprobe ohne neuen Helper oder neue Quelle.

## Fachlich sinnvoller Resume-Case

Der beste naechste Case nach dem Freeze ist nicht TARGET-073 und nicht ein weiterer VAT-Write-Versuch.

Empfohlen:

`TARGET-074-W1-FOUNDATION-CHECKPOINT-AFTER-VAT-EDITOR-PARK`

Charakter:

- lokal oder read-only, keine BC-Live-Mutation
- Foundation-Stand klassifizieren
- offene Foundation-Blocker als bewusst geparkt oder zwingend markieren
- entscheiden, ob ein begrenzter Lernpfad mit klaren Claim-Grenzen erlaubt ist
- naechsten echten Live-Case nur waehlen, wenn er mit Skills/Capabilities reproduzierbar ist

Danach gibt es zwei saubere Pfade:

1. Helper-first:
   - `bc-active-editor` aus TARGET-073 und Nummernserien-/VAT-Blockern in `playwright/core/bc` konkretisieren.
   - Ein kleiner non-live Selftest prueft Editor-Klassifikation.

2. Foundation-checkpoint-first:
   - TARGET-074 erstellt ein klares Bild: Foundation `ready`, `limited-learning-path-only` oder `blocked`.
   - Wenn `limited-learning-path-only`, darf das Buch mit klarer Grenze erklaeren, welche Foundation fehlt und warum noch keine finalen Buchungsclaims entstehen.

## Harte Kritik

Das Projekt hat genug Evidence dafuer gesammelt, dass Business Central komplex ist. Der naechste Qualitaetssprung entsteht nicht durch noch mehr Micro-Screenshots, sondern durch bessere Kuratierung:

- weniger isolierte Cases,
- mehr fachliche Setup-Landkarte,
- weniger direkte Playwright-Tricks,
- mehr wiederverwendbare Guard-Helper,
- mehr echte Buchabschnitte,
- klare Trennung zwischen Produktlogik, lokaler UI-Evidence und Buchclaim.
