# Business-Central-Playwright-Patterns

Stand: 16.06.2026

Diese Datei sammelt wiederverwendbare Muster aus belegten Laeufen. Sie ist keine allgemeine Playwright-Dokumentation, sondern Projektwissen fuer Business Central in `MCP_1_20260210` / `RM-DEMO`.

## Grundprinzipien

- Das Projekt ist UI-first. Wenn ein Schritt im Buch als Klickanleitung erscheinen soll, muss er ueber die UI nachvollziehbar sein.
- Tests orientieren sich am sichtbaren Anwenderverhalten: Rollen, Labels, Texte, Dialogtitel, sichtbare Codes, Betraege, Konten, Dimensionen, Filter und Status.
- API-/Direktdatenwege sind nur Diagnose, historischer Laborfit oder technische Hilfsevidence. Sie ersetzen keinen Buch-Klickpfad.
- Jeder Screenshot braucht ein sichtbares Lernziel. Ein Bild ist nur brauchbar, wenn der behauptete Code, Betrag, Status, Button, Dialog, Filter, Fehler, Reportwert oder Postentyp wirklich sichtbar ist.
- CRONUS-USA-Labor, gemischte Sprache und deutsche Zielbilder werden immer getrennt.

## Tell-Me

- Tell-Me niemals mit blindem `Enter` bedienen, wenn mehrere Treffer moeglich sind.
- Erst Trefferkandidaten sammeln, fachlichen Treffer anklicken und danach Zielseitenkontext pruefen.
- Exakte Treffer koennen in BC als Ergebniszeile mit Zusatztext erscheinen, zum Beispiel `Customers Listen`. Helper muessen deshalb die Tell-Me-Ergebniszeile und nicht den gleichnamigen Hintergrund-Link treffen.
- Sichtbarer Suchtreffer beweist nur Navigation, nicht Prozessfaehigkeit.
- Bei gemischter deutscher/englischer UI beide Begriffe als Suchhilfe dokumentieren, aber die Buchsprache deutsch halten.
- Wenn Microsoft Learn oder Supportseiten im Browser aufpoppen, gilt das nicht als BC-Nachweis; Business-Central-Seiten muessen im BC-Kontext bleiben.

## Page-ID

- Direkte Page-ID ist fuer Labor- und Regressionseinstiege erlaubt, aber didaktisch nicht automatisch ein Buch-Klickpfad.
- Page-ID beweist den geoeffneten Kontext, nicht die fachliche Vollstaendigkeit.
- Neue Helper sollen `openBcPageById()` nutzen und danach erwarteten Seitentext pruefen.
- Fuer Buchbilder nach Moeglichkeit Tell-Me- oder Menuepfad separat nachziehen.

## Listen vs. Karten

- Eine Liste beweist, dass der Zielkontext erreichbar ist.
- Eine Karte beweist nur dann einen Zielstammsatz, wenn der Zielcode und relevante Felder sichtbar sind.
- Ein leeres Formular ist Formular-Preflight, kein Stammdaten-Nachweis.
- Zielobjekt-Nachweise brauchen konkrete sichtbare Werte, zum Beispiel `D10000`, `RM-M100`, `FA-CNC-01`, `K30000`.

## Action Bar

- Aktionen muessen an den Seitenkontext gebunden werden. `first()`/`last()` ist nur akzeptabel, wenn danach der Zielzustand geprueft wird.
- Neuer Helper-Baustein: `playwright/core/bc/actions.ts` mit `clickBcAction()` und `isBcActionVisible()`. Er sucht sichtbare `button`/`menuitem`/`link`-Aktionen ueber Page und Frames, kann optional Seitentext als Kontextanker verlangen und nach dem Klick einen erwarteten Zieltext pruefen.
- `New/Neu` ist global mehrdeutig. Kein Setup oder Stammdaten-Fit mit ungescoptem `New/Neu`.
- `REPORTING-013` ist der belegte Rejected Path: ungescopter `New/Neu` kann in den Role-Center-Kontext fallen.
- `FIXEDASSETS-012` zeigt nur leere Karten/Template-Dialoge; das ist kein Zielcode-Beweis.

## Post / Preview

- Nicht den Hauptteil von `Post...` klicken, wenn `Preview Posting` gemeint ist.
- `Preview Posting` ist der bevorzugte sichere Preflight vor Buchungen, wenn verfuegbar.
- Ein normaler Buchungsdialog ist die letzte Sicherheitsgrenze. Vor `OK` muss Screenshot/Evidence klaeren, welche Option gewaehlt wird.
- Belegte Optionen: O2C `Ship and Invoice`, P2P `Receive and Invoice`.
- Jede echte Buchung braucht Belegnummer, Postenspur und No-Repeat-Lock.

## Journale

- Journalzeile sichtbar ausfuellen reicht nicht.
- Nach Eingabe lokalisierte Zahlenformate pruefen, zum Beispiel `-68.000,00`.
- `Journal Check` oder gleichwertiger Preflight muss vor Buchung gelesen werden.
- FactBox sichtbar lassen, wenn sie selbst der Nachweis ist, etwa `Journal Check`.
- Bei Item Journals Kostenfelder nicht mit `Applies-to Entry` verwechseln.

## Tabellen / Grid

- Breiter Viewport und breite Layoutansicht sind erlaubt, wenn dadurch der fachliche Zielbereich sichtbar wird.
- Horizontalen Grid-Scroll gezielt am BC-Container nutzen und visuell pruefen, ob die Zielspalten sichtbar sind.
- Tabellenbilder muessen den Zielwert zeigen, nicht nur irgendeine Liste.
- Geometrie- und Koordinatenklicks sind nur begruendete Fallbacks; danach muss ein sichtbarer fachlicher Zustand nachgewiesen werden.

## FactBox und breite Layouts

- FactBox einklappen, wenn sie Tabellenfelder verdeckt.
- FactBox sichtbar lassen, wenn sie selbst der Nachweis ist.
- Breite Layoutansicht ist fuer Ledger, Setup-Listen, Analysis Views, Journal Check und Screenshot-QA oft besser als Standardansicht.
- Vor einem Buchbild pruefen: Sieht der Leser das konkrete, was er lernen soll?

## Teaching Tips

- Teaching Tips duerfen gezielt geschlossen werden, wenn sie das Lernziel verdecken.
- Wenn ein Teaching Tip selbst Lernwert hat, separat als UI-Fundstelle dokumentieren.
- Wegklicken ist kein Fehler, muss aber im Workaround-/Pattern-Wissen stehen, wenn es wiederkehrend ist.

## Dialoge

- Dialoge sind Sicherheitsgrenzen: Posting, Apply Entries, Templates, Confirm, Delete, OK/Cancel.
- Neuer Helper-Baustein: `playwright/core/bc/dialogs.ts` mit `expectBcDialog()`, `isBcDialogVisible()` und `clickBcDialogButton()`. Vor einem Buttonklick wird der erwartete Dialogtext als Sicherheitsanker gelesen.
- Vor `OK` oder `Ja/Yes` muessen Dialogtitel, Option und fachliches Ziel klar sein.
- Bei Setup-/Stammdaten-Preflight ist `Cancel/Abbrechen` der Standardabschluss.
- Template-Dialoge wie bei Vendor Cards sind eigener Nachweis: sie zeigen, dass Anlage nicht einfach "New und fertig" ist.

## Screenshots

- Screenshot-Typen: Navigation, Setup Before/After, Preflight, Posting Dialog, Posted Document, Ledger Trace, Report, Error, Rejected Path, Book Candidate.
- Buchkandidat nur, wenn das sichtbare Lernziel im Bild erkennbar ist.
- Metadaten muessen Status, Zweck, sichtbares Ziel, Labor/final-Grenze, Buchwirkung und Limitationen nennen.
- `pageText()` kann Screenshot-Kontext absichern, ersetzt aber keinen visuellen Beweis.

## Evidence

- Evidence muss kompakt und verwertbar bleiben: Markdown-Zusammenfassung, JSON-Ergebnis, wenige wichtige Screenshots.
- Jede Evidence beantwortet: Was wurde geprueft, wo, mit welchen Objekten, welches Ergebnis, welche Grenze, welche Buchwirkung, naechster Schritt.
- `compactPageText()` ist fuer fokussierte Seitentexte besser als lange Rohdumps.
- Keine `console-*.log`, `page-*.yml`, Traces, Reports, Auth-Dateien oder Secrets committen.

## Rejected Paths

- Ein gescheiterter UI-Pfad ist wertvoll, wenn Situation, Symptom, Ursache, BC-Logik, Loesung/Grenze und Buchwirkung dokumentiert sind.
- Rejected Path nicht wiederholen, solange kein neuer Hebel oder eine neue Freigabe existiert.
- Belegte Beispiele: Page `371` fuer Bankposten rejected, Analysis View `New/Neu` rejected, Financial-Reports-Dimensionswirkung fuer `PRODUCTLINE`/`CHANNEL` nicht belegt.

## Anti-Patterns

Stand Audit 16.06.2026:

- `waitForTimeout`: 419 Vorkommen in `playwright/core` und `playwright/projects/fibu-book5/tests`.
- `mouse.click`: 17 Vorkommen.
- `force: true`: 18 Vorkommen.
- `keyboard.press('Enter')`: 3 Vorkommen.
- `first/last/nth`: 182 Vorkommen.

Regeln:

- Feste Waits schrittweise durch `expect`, `expect.poll`, `waitForPageText()` oder sichtbare Dialog-/Grid-Ziele ersetzen.
- Koordinatenklicks nur als letzter Fallback und mit anschliessendem Zielnachweis.
- `force: true` nur mit Kommentar/Begruendung oder nach sichtbarer Elementdiagnose.
- `first/last/nth` nur mit fachlicher Trefferbegrenzung oder anschliessender Kontextpruefung.
- Kein ungescopter `New/Neu`, kein blinder Tell-Me-Enter, kein ungeprueftes `Post`.

## Wann API erlaubt ist

- Diagnose, kompakte Zustandspruefung, historische Laborfit-Klaerung oder maschinenlesbare Cross-Checks.
- Nur wenn klar markiert ist: API ist nicht Buch-Klickpfad.
- Keine API nutzen, um Setup fuer eine Klickanleitung "unsichtbar" herzustellen, ohne spaeteren UI-Nachziehpfad zu dokumentieren.

## Wann UI-first Pflicht ist

- Alles, was ein Anwender im Buch nachklicken soll.
- Stammdaten- und Setup-Fits, sobald daraus Screenshots, Lernwert oder Buchanleitung entstehen.
- Buchungen, Zahlungen, Ausgleich, Journale, Preview Posting, Posting Dialoge, Apply Entries und Fehlerbehebung.
- Jeder Schritt, bei dem ein Anfaenger verstehen soll: Was sehe ich, was tue ich, warum reagiert BC so, woran erkenne ich den Erfolg?
