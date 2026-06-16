# Playwright-BC-Optimization-Audit

Stand: 16.06.2026

Scope: technischer Foundation-Lauf fuer `MCP_1_20260210` / `RM-DEMO`. Es gab einen read-only BC-Smoke zur Helper-Validierung, aber keinen Fachprozesslauf, keine Buchung, keine Setup-Aenderung, keine Stammdatenanlage, keine Zahlung, keine Bankabstimmung und keine neue Company.

Ziel: Playwright so weiterentwickeln, dass Business-Central-Klickpfade fuer Buchbilder, Evidence und Lernwert stabiler werden. Das Projekt bleibt UI-first: Wenn ein Schritt im Buch als Klickanleitung erscheinen soll, muss der Klickpfad ueber die UI beherrscht werden. API-/Direktdatenwege sind nur Diagnose oder historischer Laborfit und ersetzen keinen Buch-Klickpfad.

## Audit-Matrix

| Bereich | Aktueller Stand | Problem | Empfehlung | Prioritaet | Umsetzung in diesem Lauf |
|---|---|---|---|---|---|
| Tell-Me | `searchFor()` und mehrere lokale Suchhelfer existieren; Treffer werden teils ueber Text und Index angeklickt. | BC-Suche ist dynamisch, gemischt DE/EN und oeffnet auch Learn-/Support-Kontexte; erster Treffer ist oft falsch; `GOVERNANCE-013` zeigte, dass Tastatur-Tippen den Tell-Me-Dialog leer lassen kann. | Treffer sichtbar sammeln, fachlichen Treffer anklicken, Zielseitenkontext danach mit Seitentext/Screenshot pruefen; sichtbare Tell-Me-Textbox gezielt `fill()`en; kein blinder Enter-Fallback. | P0 | `searchFor()` fuellt seit GOV-013 die sichtbare Tell-Me-Textbox direkt; `Companies Listen` ist als sicherer Companies-Pfad belegt. |
| Page-ID Navigation | Tests nutzen Page-IDs fuer Ledger, Journale und Setup-Kontexte. | Page-ID beweist Kontext, nicht Anfaenger-Klickpfad; kann Buchdidaktik verdecken. | Page-ID als stabile Labor-/Regressionseinstieg markieren, Tell-Me/Klickpfad separat fuer Buchbilder nachziehen. | P1 | `openBcPageById()` als zentraler Helper ergaenzt und in Patterns eingeordnet. |
| Frame Handling | Helper iterieren ueber `page.frames()` und lokale Tests duplizieren dieses Muster. | Frame-Wechsel erzeugen viele lokale Spezialhelfer und schwer lesbare Fallbacks. | Kleine BC-Komponenten statt grosser Page Objects: Shell, Tell-Me, Actions, Dialoge, Grids, Journale, Evidence. | P1 | Component-Start fuer `actions` und `dialogs` angelegt; keine Migration gefaehrlicher Fachtests in diesem Lauf. |
| Action Bar / Menu | Viele Tests suchen Buttons/Menuitems in allen Frames. | Gleiche Aktion kann mehrfach sichtbar sein; `first()` ist nicht immer fachlich richtig. | Aktion an Seitenkontext binden, danach Seitentext oder Dialogziel pruefen. | P0 | `playwright/core/bc/actions.ts` ergaenzt: `clickBcAction()` bindet Aktionen an sichtbare Rollen, optionale Kontexttexte und Zieltextpruefung. |
| Post / Preview | O2C/P2P/Payments/Inventory haben Sicherheitslogik, aber teils geometrische Dropdown-Klicks. | Hauptaktion `Post...` und `Preview Posting` liegen nah beieinander; falscher Klick kann Buchungsdialog oeffnen. | `Preview Posting` und `Post` als getrennte Helfer mit Pflichtnachweis, Dialog-Screenshot und No-Repeat-Lock. | P0 | Pattern und Action Map verschaerft; keine Buchung ausgefuehrt. |
| New / Neu | `REPORTING-013` hat global mehrdeutiges `New/Neu` als Rejected Path belegt; `FIXEDASSETS-012` zeigt nur leere Karten. | Unscoped `New/Neu` kann in Role Center oder falschen Kontext fallen. | Kein Daten-Setup ohne gescopten Seitenanker, sichtbare Karte, Pflichtfelder, Abbruchweg und Gate. | P0 | Audit und Patterns markieren `New/Neu` als P0-Sicherheitsgrenze. |
| Dialoge | Posting-, Template-, Apply-Entries- und Confirm-Dialoge werden fallweise behandelt. | Dialoge sind letzte Sicherheitsgrenze; falsches OK kann buchen oder speichern. | Zentrale Dialog-Regeln: Dialogtitel, Option, Zielbeleg, Screenshot, dann OK oder Abbruch. | P0 | `playwright/core/bc/dialogs.ts` ergaenzt: Dialogtext zuerst pruefen, dann gezielten Dialogbutton klicken. |
| Tabellen / Grids | Breite Ansicht und FactBox-Hide sind vorhanden; Grid-Scroll oft lokal. | Screenshots zeigen manchmal nicht den Zielcode oder Zielwert. | Vor Screenshot sichtbares Lernziel erzwingen: Code, Betrag, Konto, Dimension, Status, Filter oder Fehler. | P0 | Pattern verschaerft; `compactPageText()` fuer fokussierte Evidence ergaenzt. |
| FactBox | `hideFactBoxPane()` existiert; FactBox bleibt bei Journal Check absichtlich sichtbar. | Einklappen kann Beweis verdecken, sichtbar lassen kann Tabelle verdecken. | Vor Screenshot entscheiden: Tabelle braucht Platz, Journal Check braucht FactBox. | P1 | In Patterns und Audit klar getrennt. |
| Teaching Tips | `dismissTours()` existiert. | Teaching Tips verdecken Tabellen und koennen Screenshots entwerten. | Gezieltes Wegklicken dokumentieren; wenn Tip Lernwert hat, separat als UI-Fundstelle sichern. | P1 | Patterns bestaetigt; keine neue BC-Ausfuehrung. |
| Journal Check | Payments und Inventory haben Journal-Check-Evidence. | Journal Check kann asynchron aktualisieren und ist fachlich wichtiger als nur "Button gefunden". | Journal Check immer als Preflight lesen, Screenshot nur wenn Status/Issues sichtbar sind. | P0 | In Pattern-Datei ausgebaut. |
| Apply Entries | Payments nutzt Apply Entries als fachlichen Kontext. | OP-Ausgleich ist nicht nur UI-Auswahl, sondern Ledger-Wirkung. | Offenen Posten, Betrag, Apply-Bezug, Remaining Amount und Detailposten nachweisen. | P0 | In Pattern-Datei ausgebaut. |
| Screenshots | Metadaten werden neben PNGs geschrieben; QA-Regel existiert. | Ein Bild kann technisch existieren, aber Buchziel nicht sichtbar zeigen. | Screenshot nur als Kandidat, wenn sichtbares Ziel wirklich im Bild steht. | P0 | Audit wiederholt harte Bildregel; keine Bilder verschoben. |
| Evidence Writing | `evidence.ts`, `writeEvidenceText()` und lokale JSON/MD-Dateien existieren. | Lokale Rohtexte koennen lang werden; gleiche Kompaktlogik wird kopiert. | Kurze JSON-Ergebnisse, Markdown-Zusammenfassung, optional kompakter Seitentext mit Fokusbegriffen. | P1 | `compactPageText()` als wiederverwendbarer Helper ergaenzt. |
| Auth-State | `auth.setup.ts` speichert in `playwright/.auth/bc-user.json`. | Auth-State darf nie committed werden; MFA/Login bleibt menschliche Grenze. | Auth-Datei lokal halten, Login-Hilfen dokumentieren, keine Secrets oder `.env` committen. | P0 | Audit dokumentiert; keine Auth-Datei angefasst. |
| Fixed Waits | `rg` fand nach dem Helper-Patch 419 `waitForTimeout`-Vorkommen in Core/Tests. | Viele Waits sind BC-Render-Fallbacks, aber schwer wartbar und langsam. | Schrittweise durch web-first Assertions, `waitForPageText()` und gezielte Dialog-/Grid-Checks ersetzen. | P1 | `waitForBusinessCentralShell()` nutzt jetzt `waitForBcReady()` statt pauschal 10 Sekunden. |
| Locator Strategy | Viele `getByRole()`-Pfadteile, aber auch 17 `mouse.click`, 18 `force: true`, 182 `first/last/nth`-Vorkommen. | Index-/Koordinaten-/Force-Klicks koennen falsche UI treffen. | Nur als begruendeter Fallback; danach muss ein sichtbarer fachlicher Zustand geprueft werden. | P0 | Zahlen und Regel dokumentiert; Legacy-Koordinatenhelper kommentiert. |
| Page/Component Objects | Bisher flache Helper plus lokale Testhelfer. | Ein grosses BC-Page-Object waere unflexibel; lokale Duplikate wachsen. | Kleine Komponentenmodule vorbereiten: Shell, Tell-Me, Actions, Dialoge, Grids, Journals, Evidence. | P2 | Als naechster technischer Optimierungsschritt festgehalten. |
| JSON/Markdown Evidence | Struktur ist tragfaehig; `DOCUMENTATION-MAP.md` ordnet Rollen. | Nicht jede technische Evidence sagt klar, was sie nicht beweist. | Jede Evidence mit Status, Laborgrenze, sichtbarem Ziel, Buchwirkung, naechstem Schritt. | P1 | Audit-Datei und Current-State-Sync ergaenzt. |
| npm Scripts | Scripts sind fachlich breit, aber keine Typecheck- oder Helper-Audit-Scripts. | Helper-Aenderungen werden nicht automatisch typgeprueft. | Bei Helper-Aenderung `npx tsc --noEmit ...` oder spaeter eigenes `check:ts` einrichten. | P2 | TypeScript-Einzelcheck versucht; kein `tsconfig.json` vorhanden. |

## Strictness-Migration nach `FIXEDASSETS-023`

Dieser technische Lauf hat genau einen cancel-safe Test migriert: `playwright/projects/fibu-book5/tests/fixedassets-023-fa-cnc-01-card-technical-diagnosis.spec.ts`. Es gab keine Setup-Aenderung, keine Stammdatenanlage, keine Buchung, keine Zahlung, keine Bankabstimmung, keine neue Company und kein Speichern von `FA-CNC-01`.

| Datei | Altes Muster | Neues Muster | Warum besser | Validierung |
| ----- | ------------ | ------------ | ------------ | ----------- |
| `playwright/projects/fibu-book5/tests/fixedassets-023-fa-cnc-01-card-technical-diagnosis.spec.ts` | Direkter Page-URL-Aufruf fuer die Fixed-Assets-Liste | `openBcPageById(page, 5601, expectedText)` fuer den Standardkontext | Zentraler BC-Page-Einstieg mit Shell-/Seitentextcheck statt lokalem Page-Goto | `npm run fibu:fixedassets:fa-cnc-01-card-technical-diagnosis` passed |
| `playwright/projects/fibu-book5/tests/fixedassets-023-fa-cnc-01-card-technical-diagnosis.spec.ts` | Lokaler DOM-Buttonscan fuer `New/Neu` als erster Pfad | `clickBcAction()` mit `scopeText = Fixed Assets` und `expectedAfterClick = Fixed Asset Card / FA Class Code / Depreciation Book` | Der Klick beweist jetzt nicht nur "geklickt", sondern den erwarteten Kartenzustand; lokaler Titel-Icon-Fallback bleibt dokumentiert, wurde aber nicht genutzt | Strictness-Evidence `evidence/playwright-strictness-001/PLAYWRIGHT-STRICTNESS-001-result.json` zeigt `helper = clickBcAction`, `role = menuitem`, `fallbackUsed = false` |
| `playwright/projects/fibu-book5/tests/fixedassets-023-fa-cnc-01-card-technical-diagnosis.spec.ts` | Feste `waitForTimeout` nach Page Open, New, Show More und Page Inspection | `waitForPageText()` beziehungsweise `expect.poll(pageText)` mit konkreten Zieltexten | Wartet auf fachlichen BC-Zustand statt Zeitablauf; reduziert Flakiness und Laufzeit | Testlauf passed in ca. 12,5 s |

## Active-Card-Control-Helper nach `FIXEDASSETS-024` / Gate-Stop nach `FIXEDASSETS-025`

Dieser technische/fachliche Lauf hat genau einen no-save Karten-Diagnosefall ergaenzt: `playwright/projects/fibu-book5/tests/fixedassets-024-fa-cnc-01-active-card-control-diagnosis.spec.ts`. Es gab keine Setup-Aenderung, keine Stammdatenanlage, keine Buchung, keine Zahlung, keine Bankabstimmung, keine neue Company und kein Speichern von `FA-CNC-01`.

Nachtraegliche Projektsynchronisierung in `FIXEDASSETS-025`: Die committed `FIXEDASSETS-024`-Evidence ist nur partiell. `FA Class Code`, `FA Subclass Code` und AfA-Datumsfelder werden aktiv erkannt; `Depreciation Book Code` und `Posting Group` sind `caption-not-visible`. Der Helper ist damit wertvoll fuer Debugging und Scope-Trennung, aber noch kein vollstaendiger Save-Gate-Nachweis.

Nachtraegliche Control-Recovery in `FIXEDASSETS-026`: Der fehlende Teil wurde no-save recovered. Wichtiges Playwright-Learning: `clickBcAction()` darf nicht nur den Klick melden, sondern braucht eine nachweisbare Ziel-Nachbedingung; wenn diese nicht erreicht wird, muss der Fallback ebenfalls den Vordergrundkarten-Zustand beweisen. Fuer `Mehr anzeigen` muessen grosse Kartencontainer verworfen werden; nur kleine FastTab-nahe Buttons mit passendem `aria-label`/`title` sind valide. Das Ergebnis ist 6/6 aktive Controls, aber weiterhin kein Werte- oder Save-Gate.

| Datei | Neues Muster | Warum besser | Validierung |
|---|---|---|---|
| `playwright/core/bc/cards.ts` | `collectActiveCardControlDiagnostics()` bewertet Feldcaptions, aktive Kartenzeilen, nahe Controls und verworfene Grid-/Columnheader-Kandidaten | Trennt Vordergrundkarte von Hintergrundliste; verhindert, dass ein sichtbarer Spaltenkopf als Kartenfeld gilt | `npx tsx playwright/core/bc/cards.ts` passed |
| `playwright/projects/fibu-book5/tests/fixedassets-024-fa-cnc-01-active-card-control-diagnosis.spec.ts` | No-save Diagnose fuer `FA Class Code`, `FA Subclass Code`, `Depreciation Book Code`, `Posting Group` und AfA-Datumsfelder | Belegt Scope-Trennung und 4/6 aktive Kartencontrols; `Depreciation Book Code` und `Posting Group` fehlen in der aktuellen Diagnose | `npm run fibu:fixedassets:fa-cnc-01-active-card-controls` passed, Ergebnis fachlich partial |
| `playwright/projects/fibu-book5/tests/fixedassets-026-fa-cnc-01-depreciation-book-control-recovery.spec.ts` | No-save Recovery mit Vordergrundkarten-Pruefung, gescopter `New`-Fallback und kleinen FastTab-`Mehr anzeigen`-Buttons | Recovered `Depreciation Book Code` und `Posting Group` als aktive Kartencontrols und verhindert False-Positive-Screenshots, die nur den Listen- oder Containerkontext zeigen | `npm run fibu:fixedassets:fa-cnc-01-depreciation-control-recovery` passed, Ergebnis 6/6 Controls, `FA-CNC-01` nicht gespeichert |
| `playwright/projects/fibu-book5/evidence/fixedassets-024/030-active-card-control-diagnosis.json` | Strukturierte Kandidaten- und Hintergrundtreffer-Evidence | Macht sichtbar, was der Helper beweist und was nicht: 4 aktive Controls ja, Zielwerte nein, fehlende Controls ja | JSON-Validierung vor Commit |
| `playwright/projects/fibu-book5/evidence/fixedassets-026/050-active-card-control-recovery.json` | Strukturierte Recovery-Evidence fuer alle sechs Zielcaptions | Belegt Control-Erreichbarkeit auf der aktiven Karte, aber trennt sie weiterhin von Wertebeweis, Speichern, Setup und Buchung | JSON-Validierung vor Commit |

## Sofort umgesetzte Helper-Aenderungen

- `waitForBcReady(page, options)`: wartet web-first auf BC-Shell und erwartbaren Seitentext.
- `waitForBusinessCentralShell(page)`: nutzt jetzt `waitForBcReady()` statt einer pauschalen 10-Sekunden-Wartezeit.
- `waitForPageText(page, expected)`: kapselt `expect.poll()` fuer BC-Seitentext.
- `openBcPageById(page, pageId, options)`: zentraler Page-ID-Einstieg mit Shell-Check und Teaching-Tip-Cleanup.
- `openSearchResult(page, label, options)`: zaehlt Tell-Me-Treffer jetzt ueber Locator statt Body-Text, ueberspringt nicht klickbare Hintergrundtreffer und kann BC-Ergebniszeilen wie `Customers Listen` anklicken.
- `searchFor(page, term)`: fuellt seit `GOVERNANCE-013` die sichtbare Tell-Me-Textbox direkt; Tastatur-Tippen bleibt nur Fallback, wenn kein sichtbares Suchfeld gefunden wird.
- `compactPageText(page, options)`: fokussiert Roh-Seitentext fuer kompakte Evidence.
- `collectActiveCardControlDiagnostics(page, captions)`: fokussiert aktive Kartencontrols und dokumentiert verworfene Hintergrundlisten-Treffer.
- `openSecondSearchBlockResult()` ist als Legacy-Koordinatenfallback markiert.

## Nachtrag: Actions-/Dialog-Helper

Dieser technische Nachtrag hat keine BC-Ausfuehrung, keine Setup-Aenderung, keine Stammdatenanlage, keine Buchung, keine Zahlung und keine Bankabstimmung ausgefuehrt.

- `playwright/core/bc/actions.ts` legt `clickBcAction()` und `isBcActionVisible()` an. Der Helper durchsucht Page und Frames nach sichtbaren Rollen (`button`, `menuitem`, `link`), kann einen Seitentextanker verlangen und nach dem Klick einen erwarteten Zieltext pruefen.
- `playwright/core/bc/dialogs.ts` legt `expectBcDialog()`, `isBcDialogVisible()` und `clickBcDialogButton()` an. Der Buttonklick erfolgt erst nach nachgewiesenem Dialogtext.
- Zweck: gefaehrliche lokale Muster wie ungescopte Actions, `first()` ohne Nachpruefung, Koordinatenklicks und direkte Dialog-OKs schrittweise ersetzen.
- Grenze: Die Helper sind noch nicht in einen Fachtest migriert. Vor Migration in `Post`, `Apply Entries`, `New/Neu` oder Journal-Kontexte muss je Test ein fachlicher Zielzustand und ein Abbruch-/No-Repeat-Gate definiert werden.

## Nicht umgesetzt in diesem Lauf

- Keine Migration bestehender Fachtests auf neue Helper.
- Keine neue BC-Ausfuehrung und kein Screenshot-Neulauf.
- Keine Migration der neuen Component-Helper in bestehende Fachtests.
- Keine Bereinigung aller `waitForTimeout`-Vorkommen.
- Keine Aenderung historischer API-/Direktdatenpfade; diese bleiben als Labor-/Legacy-Pfade zu bewerten.
- Kein erfolgreicher TypeScript-Compilerlauf: es gibt kein `tsconfig.json` und kein `typescript`-DevDependency; `npx tsc` traf deshalb nicht den echten TypeScript-Compiler.

## Validierung in diesem Lauf

- JSON-Validierung fuer `AUTOPILOT-STATE.json` und `BC-PAGE-ACTION-MAP.json`: erfolgreich.
- `npm run check:encoding`: erfolgreich.
- `git diff --check`: erfolgreich.
- `npx tsx playwright/core/bc-helpers.ts`: erfolgreich als Syntax-/Load-Check.
- `npx tsc --noEmit ...`: nicht verwertbar, weil `typescript` nicht installiert und kein `tsconfig.json` vorhanden ist.
- `npm run fibu:smoke:bc`: zunaechst fehlgeschlagen, weil `openSearchResult()` exakte Treffer gegen den gesamten Body pruefte und danach einen Hintergrund-Link statt der Tell-Me-Zeile traf. Nach Helper-Fix: 6/6 read-only Smoke-Tests erfolgreich.
- Nachtrag Actions/Dialoge: `npx tsx playwright/core/bc/actions.ts` und `npx tsx playwright/core/bc/dialogs.ts` erfolgreich als Syntax-/Load-Check.
- Nachtrag Actions/Dialoge: JSON-Validierung fuer `AUTOPILOT-STATE.json` und `BC-PAGE-ACTION-MAP.json` erfolgreich; `npm run check:encoding` und `git diff --check` erfolgreich.
- Nachtrag Actions/Dialoge: `npx --no-install tsc --noEmit` weiterhin nicht verwertbar, weil kein echter TypeScript-Compiler installiert ist.
- Nachtrag `GOVERNANCE-013`: `npm run fibu:governance:company-list` erfolgreich; der Lauf bestaetigt `searchFor()` mit direktem Tell-Me-Textbox-`fill()` und den Companies-Einstieg ueber `Companies Listen` / Page `357`.

## Naechster technischer Optimierungsschritt

Genau einen bestehenden read-only Test auf `clickBcAction()`/`expectBcDialog()` migrieren, bevorzugt einen Cancel-safe Fixed-Assets- oder Reporting-Preflight. Danach erst gefaehrlichere Kontexte wie `Preview Posting`, `Post`, `Apply Entries`, `Journal Check` oder `New/Neu` anfassen.

## Naechster fachlicher Autopilot-Schritt

Der fachliche No-Approval-Schritt ist nach `FIXEDASSETS-014` jetzt `FIXEDASSETS-015-MACHINES-ACCOUNT-MAPPING-DECISION`: keine Einrichtung, sondern Kontenentscheidung fuer eine spaetere Anlagenbuchungsgruppe; keine Anlage, kein Kreditor und keine Buchung.
