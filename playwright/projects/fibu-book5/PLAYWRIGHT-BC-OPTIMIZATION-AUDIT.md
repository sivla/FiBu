# Playwright-BC-Optimization-Audit

Stand: 16.06.2026

Scope: technischer Foundation-Lauf fuer `MCP_1_20260210` / `RM-DEMO`. Es gab einen read-only BC-Smoke zur Helper-Validierung, aber keinen Fachprozesslauf, keine Buchung, keine Setup-Aenderung, keine Stammdatenanlage, keine Zahlung, keine Bankabstimmung und keine neue Company.

Ziel: Playwright so weiterentwickeln, dass Business-Central-Klickpfade fuer Buchbilder, Evidence und Lernwert stabiler werden. Das Projekt bleibt UI-first: Wenn ein Schritt im Buch als Klickanleitung erscheinen soll, muss der Klickpfad ueber die UI beherrscht werden. API-/Direktdatenwege sind nur Diagnose oder historischer Laborfit und ersetzen keinen Buch-Klickpfad.

## Audit-Matrix

| Bereich | Aktueller Stand | Problem | Empfehlung | Prioritaet | Umsetzung in diesem Lauf |
|---|---|---|---|---|---|
| Tell-Me | `searchFor()` und mehrere lokale Suchhelfer existieren; Treffer werden teils ueber Text und Index angeklickt. | BC-Suche ist dynamisch, gemischt DE/EN und oeffnet auch Learn-/Support-Kontexte; erster Treffer ist oft falsch. | Treffer sichtbar sammeln, fachlichen Treffer anklicken, Zielseitenkontext danach mit Seitentext/Screenshot pruefen; kein blinder Enter-Fallback. | P0 | Als Pattern verschaerft; bestehender `openSearchResult()` bleibt ohne Enter-Fallback. |
| Page-ID Navigation | Tests nutzen Page-IDs fuer Ledger, Journale und Setup-Kontexte. | Page-ID beweist Kontext, nicht Anfaenger-Klickpfad; kann Buchdidaktik verdecken. | Page-ID als stabile Labor-/Regressionseinstieg markieren, Tell-Me/Klickpfad separat fuer Buchbilder nachziehen. | P1 | `openBcPageById()` als zentraler Helper ergaenzt und in Patterns eingeordnet. |
| Frame Handling | Helper iterieren ueber `page.frames()` und lokale Tests duplizieren dieses Muster. | Frame-Wechsel erzeugen viele lokale Spezialhelfer und schwer lesbare Fallbacks. | Kleine BC-Komponenten statt grosser Page Objects: Shell, Tell-Me, Actions, Dialoge, Grids, Journale, Evidence. | P1 | Strategie dokumentiert; keine riskante Ordner-Extraktion in diesem Lauf. |
| Action Bar / Menu | Viele Tests suchen Buttons/Menuitems in allen Frames. | Gleiche Aktion kann mehrfach sichtbar sein; `first()` ist nicht immer fachlich richtig. | Aktion an Seitenkontext binden, danach Seitentext oder Dialogziel pruefen. | P0 | Pattern dokumentiert; Audit markiert `first/last/nth` als kontrollpflichtig. |
| Post / Preview | O2C/P2P/Payments/Inventory haben Sicherheitslogik, aber teils geometrische Dropdown-Klicks. | Hauptaktion `Post...` und `Preview Posting` liegen nah beieinander; falscher Klick kann Buchungsdialog oeffnen. | `Preview Posting` und `Post` als getrennte Helfer mit Pflichtnachweis, Dialog-Screenshot und No-Repeat-Lock. | P0 | Pattern und Action Map verschaerft; keine Buchung ausgefuehrt. |
| New / Neu | `REPORTING-013` hat global mehrdeutiges `New/Neu` als Rejected Path belegt; `FIXEDASSETS-012` zeigt nur leere Karten. | Unscoped `New/Neu` kann in Role Center oder falschen Kontext fallen. | Kein Daten-Setup ohne gescopten Seitenanker, sichtbare Karte, Pflichtfelder, Abbruchweg und Gate. | P0 | Audit und Patterns markieren `New/Neu` als P0-Sicherheitsgrenze. |
| Dialoge | Posting-, Template-, Apply-Entries- und Confirm-Dialoge werden fallweise behandelt. | Dialoge sind letzte Sicherheitsgrenze; falsches OK kann buchen oder speichern. | Zentrale Dialog-Regeln: Dialogtitel, Option, Zielbeleg, Screenshot, dann OK oder Abbruch. | P0 | Dokumentiert; keine Dialoghelper-Extraktion in diesem Lauf. |
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

## Sofort umgesetzte Helper-Aenderungen

- `waitForBcReady(page, options)`: wartet web-first auf BC-Shell und erwartbaren Seitentext.
- `waitForBusinessCentralShell(page)`: nutzt jetzt `waitForBcReady()` statt einer pauschalen 10-Sekunden-Wartezeit.
- `waitForPageText(page, expected)`: kapselt `expect.poll()` fuer BC-Seitentext.
- `openBcPageById(page, pageId, options)`: zentraler Page-ID-Einstieg mit Shell-Check und Teaching-Tip-Cleanup.
- `openSearchResult(page, label, options)`: zaehlt Tell-Me-Treffer jetzt ueber Locator statt Body-Text, ueberspringt nicht klickbare Hintergrundtreffer und kann BC-Ergebniszeilen wie `Customers Listen` anklicken.
- `compactPageText(page, options)`: fokussiert Roh-Seitentext fuer kompakte Evidence.
- `openSecondSearchBlockResult()` ist als Legacy-Koordinatenfallback markiert.

## Nicht umgesetzt in diesem Lauf

- Keine Migration bestehender Fachtests auf neue Helper.
- Keine neue BC-Ausfuehrung und kein Screenshot-Neulauf.
- Keine neue Component-Object-Ordnerstruktur.
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

## Naechster technischer Optimierungsschritt

Genau einen kleinen Komponentenblock extrahieren, bevorzugt `actions` oder `dialogs`, weil dort die groessten Sicherheitsfolgen liegen: `Preview Posting`, `Post`, `Apply Entries`, `Journal Check`, `New/Neu` und Confirm-/Template-Dialoge. Danach einen bestehenden read-only Test auf diesen Helper migrieren.

## Naechster fachlicher Autopilot-Schritt

Der fachliche No-Approval-Schritt bleibt `FIXEDASSETS-013-SETUP-FIT-DECISION`: ohne BC-Lauf entscheiden, ob genau ein kleiner idempotenter UI-first Setup-Fit fuer einen Anlagen-Zielwert sicher und gatefaehig ist.
