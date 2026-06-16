# Business-Central-Playwright-Patterns

Stand: 16.06.2026

Diese Datei sammelt wiederverwendbare Muster aus belegten Laeufen. Sie ist keine allgemeine Playwright-Dokumentation, sondern Projektwissen fuer Business Central in `MCP_1_20260210` / `RM-DEMO`.

## Grundprinzipien

- Das Projekt ist UI-first. Wenn ein Schritt im Buch als Klickanleitung erscheinen soll, muss er ueber die UI nachvollziehbar sein.
- Tests orientieren sich am sichtbaren Anwenderverhalten: Rollen, Labels, Texte, Dialogtitel, sichtbare Codes, Betraege, Konten, Dimensionen, Filter und Status.
- API-/Direktdatenwege sind nur Diagnose, historischer Laborfit oder technische Hilfsevidence. Sie ersetzen keinen Buch-Klickpfad.
- Jeder Screenshot braucht ein sichtbares Lernziel. Ein Bild ist nur brauchbar, wenn der behauptete Code, Betrag, Status, Button, Dialog, Filter, Fehler, Reportwert oder Postentyp wirklich sichtbar ist.
- CRONUS-USA-Labor, gemischte Sprache und deutsche Zielbilder werden immer getrennt.
- Bei Fehlern zuerst Fehlerklasse bestimmen: Oberflaeche, Page/Tabelle, Berechtigung, Stammdaten, Prozessstatus, Posting Setup, Extension, Daten/Filter, Integration oder Performance. Details stehen in `BC-BUGFIXING-PLAYBOOK.md`.

## Tell-Me

- Tell-Me niemals mit blindem `Enter` bedienen, wenn mehrere Treffer moeglich sind.
- Erst Trefferkandidaten sammeln, fachlichen Treffer anklicken und danach Zielseitenkontext pruefen.
- Exakte Treffer koennen in BC als Ergebniszeile mit Zusatztext erscheinen, zum Beispiel `Customers Listen`. Helper muessen deshalb die Tell-Me-Ergebniszeile und nicht den gleichnamigen Hintergrund-Link treffen.
- `searchFor()` muss die sichtbare Tell-Me-Textbox gezielt befuellen. `GOVERNANCE-013` zeigte, dass reines Tastatur-Tippen bei offenem Suchdialog leer bleiben kann.
- Bei `Companies` ist der belegte Treffer `Companies Listen`; der nackte Text `Companies` ist zu breit und kann im Suchdialog oder Hintergrundkontext landen.
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
- `FIXEDASSETS-018` ist das aktuelle Anlagen-Beispiel: Die gefilterte Liste beweist, dass `FA-CNC-01` fehlt; die leere `Fixed Asset Card` beweist Kartenfelder/Pflichtfelder, aber nicht den Zielstammsatz. `FIXEDASSETS-019` haelt fest: Vor dem Speichern eines Stammsatzes muessen die relevanten Setup-Referenzfelder sichtbar/setzbar gemappt sein, hier `HGB` und `MACHINES`. `FIXEDASSETS-020` zeigt danach: kartennahe `Mehr anzeigen`-Kontrollen koennen `Depreciation Book Code` und `Posting Group` sichtbar machen; das ist Feldpfad-Evidence, aber noch kein Wertebeweis fuer `FA-CNC-01`, `HGB` oder `MACHINES`. `FIXEDASSETS-021` ergaenzt die Speicherregel: Sichtbarer Feldpfad ist keine Speicherfreigabe. `FIXEDASSETS-022` ergaenzt die Screenshot-QA-Regel: Lookup-Evidence zaehlt nur, wenn der richtige fachliche Dialog und der behauptete Code sichtbar sind. `FIXEDASSETS-023` ergaenzt die Locator-Regel: Page Inspection kann `Fixed Asset Card (5600)` und `Fixed Asset (5600)` technisch bestaetigen, waehrend ungescopte DOM-Suchen weiter Labels der Hintergrundliste finden. `FIXEDASSETS-024` war nur partiell, weil `Depreciation Book Code` und `Posting Group` nicht als aktive Controls gefunden wurden. `FIXEDASSETS-026` recovered diese Controls no-save durch Vordergrundkarten-Pruefung und echte kleine FastTab-/`Mehr anzeigen`-Buttons; damit ist Control-Erreichbarkeit belegt, aber noch kein Wertebeweis und kein Save-Gate. `FIXEDASSETS-027` belegt Lookupwerte fuer Klasse/Unterklasse, `HGB` und `MACHINES`, zeigt aber auch die Auto-Number-Falle: Der New-Card-Preflight erzeugte temporaer `FA000110`, der danach per UI geloescht und per Filter leer nachgewiesen wurde. `FIXEDASSETS-029-EXISTING` zeigt die Gegenprobe: Ein vorhandener Listencode `FA-CNC-01` ist noch kein Zielstammsatz, wenn die geoeffnete Karte Beschreibung, Klasse/Unterklasse, AfA-Buch, Posting Group und AfA-Daten leer zeigt. Ein Nummernserien-Dialog oder Listentreffer darf nicht als FA-Class/Subclass-/Stammdatenbeweis verwendet werden. Ein spaeteres Buchbild fuer die Anlage muss Zielcode, Beschreibung und relevante Setupwerte sichtbar zeigen.

## Kartencontrol-Diagnose

- Neuer Helper-Baustein: `playwright/core/bc/cards.ts` mit `collectActiveCardControlDiagnostics()`. Er bewertet sichtbare Feldcaptions, verwirft Grid-/Columnheader-Kandidaten und sucht editierbare Controls in derselben sichtbaren Kartenzeile.
- Der Helper ist Diagnose, keine Speicherfreigabe. Er beantwortet: "Treffe ich die Vordergrundkarte?" Nicht: "Ist der fachliche Zielwert bereits gesetzt?"
- Nach `FIXEDASSETS-026` ist das Muster fuer leere Karten: zuerst Kartenkontext beweisen, dann aktive Controls vollstaendig mappen, danach separat Werte/Lookups pruefen. Eine erfolgreiche Control-Recovery ist keine Speicherfreigabe und kein Nachweis fuer `HGB`, `MACHINES` oder `FA-CNC-01`.
- Nach `FIXEDASSETS-027` ist klar: New-Card-Lookup-Preflight ist nicht automatisch no-save. Tests muessen neben der Zielnummer auch automatisch erzeugte Nummern erkennen, Cleanup-Evidence sichern oder vor dem Lauf ein ausdrueckliches Save-Gate einholen.
- Nach `FIXEDASSETS-028` gilt fuer Anlagen: Der naechste Lauf ist kein weiterer Preflight, sondern ein kontrollierter Zielstammdaten-Save. Das Testziel muss enger sein als der Gesamtprozess: erst `FA-CNC-01` speichern und visuell pruefen, danach spaeter separat Kreditor, Einkauf, Zugang, AfA und Postenspur.
- Nach `FIXEDASSETS-029` gilt zusaetzlich: Ein sichtbarer Zielcode in der Liste ist ein Stop-Kriterium, aber kein fachlicher Stammdatenbeweis. Kartenfelder duerfen nicht ueber breite Ancestor-/Parent-Texte gefuellt werden, weil Business-Central-Cards viele Feldcaptions im gleichen DOM-Bereich enthalten. Fuer Werteingabe muss die Caption mit einem editierbaren Control derselben sichtbaren Kartenzeile verknuepft werden. Wenn ein Zielcode bereits existiert, wird nicht ueberschrieben; der naechste Lauf ist read-only Detailklassifizierung.
- Nach `FIXEDASSETS-029-EXISTING` gilt fuer bestehende Stammdaten: erst Karte oeffnen, FastTabs aufklappen, sichtbare Feldwerte extrahieren und gegen den fachlichen Zielzustand bewerten. `No.` allein ist kein Setup-Fit. Wenn Business-Central-Listenzellen nicht als normale Links klickbar sind, ist ein frame-aware Fokus-/Enter-/Doppelklick-Fallback erlaubt, aber nur mit Nachbedingung: die Zielkarte und der Zielcode muessen danach sichtbar sein.

## Action Bar

- Aktionen muessen an den Seitenkontext gebunden werden. `first()`/`last()` ist nur akzeptabel, wenn danach der Zielzustand geprueft wird.
- Neuer Helper-Baustein: `playwright/core/bc/actions.ts` mit `clickBcAction()` und `isBcActionVisible()`. Er sucht sichtbare `button`/`menuitem`/`link`-Aktionen ueber Page und Frames, kann optional Seitentext als Kontextanker verlangen und nach dem Klick einen erwarteten Zieltext pruefen.
- `New/Neu` ist global mehrdeutig. Kein Setup oder Stammdaten-Fit mit ungescoptem `New/Neu`.
- `REPORTING-013` ist der belegte Rejected Path: ungescopter `New/Neu` kann in den Role-Center-Kontext fallen.
- `FIXEDASSETS-012` zeigt nur leere Karten/Template-Dialoge; das ist kein Zielcode-Beweis.
- `FIXEDASSETS-016` zeigt das Gegenmuster: Auf der `FA Posting Group Card` ist `New/Neu` als titelbasierter Icon-Button sichtbar (`Erstellen Sie einen neuen Eintrag.`), nicht zwingend als Textlabel. Der Helper muss solche titelbasierten Aktionskandidaten bewerten und danach den Zielzustand sichtbar pruefen.
- `FIXEDASSETS-020` zeigt ein zweites Scoping-Muster: `Mehr anzeigen` nicht als jedes `aria-expanded=false` klicken. Nur explizite, kartennahe `Mehr anzeigen`-/`Show more`-Labels mit Feldkontext sind akzeptabel; globale Navigation, Agentenleisten oder Shell-Controls gehoeren nicht zum Kartenfeldmapping.
- Strictness-Migration nach `FIXEDASSETS-023`: `New/Neu` auf der Anlagenliste kann mit `clickBcAction()` genutzt werden, wenn `scopeText` den Listen-/Seitenkontext bindet und `expectedAfterClick` den Kartenkontext beweist. Der lokale Titel-Icon-Fallback bleibt nur Ausnahme; im migrierten Lauf wurde er nicht mehr gebraucht.
- `FIXEDASSETS-026` zeigt die strengere Nachbedingung: Ein geklickter `New/Neu`-Kandidat reicht nicht, wenn der erwartete Vordergrundkarten-Zustand nicht sichtbar erreicht wird. Der Fallback muss danach `Fixed Asset Card` und die erwarteten Feldbereiche beweisen. Fuer `Mehr anzeigen` duerfen keine grossen Kartencontainer als Button akzeptiert werden; nur kleine, sichtbare FastTab-nahe Controls mit passendem `aria-label`/`title` zaehlen.
- `FIXEDASSETS-027` zeigt die Auto-Number-Nachbedingung: Sobald eine neue Stammdatenkarte eine Nummer zieht oder `Gespeichert` zeigt, muss der Lauf das als Datensatzwirkung behandeln. Danach braucht es bewussten Cleanup oder ein Save-Gate; eine reine Zielnummern-Negativpruefung reicht nicht.

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
- Bei bestehenden Listendatensaetzen reicht der Listentreffer nicht. Fuer Buch-/Setup-Reife immer die Karte oder Detailseite oeffnen und die Werte pruefen, die der Screenshot behauptet.

## Personalisieren und Einstellungen

- Personalisieren ist ein UI-Diagnosewerkzeug: Es zeigt, welche Felder, Spalten oder Aktionen auf einer Page verfuegbar, aber aktuell ausgeblendet sind.
- Wenn ein erwartetes Feld, eine Spalte oder eine Aktion in einer Klickanleitung fehlt, zuerst pruefen, ob sie ueber `Personalisieren`, Ansichten, Seiteneinstellungen oder Roll-/Profilanpassung sichtbar gemacht werden kann.
- Personalisierung ist nutzer-, rollen- und profilabhaengig. Screenshots muessen deshalb markieren, ob sie Standardansicht, Nutzer-Personalisierung oder Profilanpassung zeigen.
- Personalisieren beweist keine Tabellen-, Posting- oder Steuerlogik. Es beweist nur, dass ein UI-Element fuer diese Page verfuegbar gemacht werden kann.
- Personalisierungsmodus nur als Debug-/Lernbild fotografieren. Fuer Buchbilder danach in die normale Ansicht zurueckkehren und erneut pruefen, ob das fachliche Ziel sichtbar ist.

## Page Inspection / Seitenpruefung

- `Ctrl+Alt+F1` oeffnet laut Microsoft die Page Inspection. Alternativ: `?` / Help & Support / `Inspect pages and data`.
- Page Inspection ist ein technisches Diagnosewerkzeug: Page Name, Page ID, Page Type, Source Table, Table ID, Felder, Filter und Extensions helfen zu klaeren, auf welcher BC-Page ein Klickpfad wirklich steht.
- Fuer Klickanleitungen Page Inspection nutzen, wenn Seitenname, Page-ID, Tabellenbezug, Feldherkunft oder Extension-Einfluss unklar sind.
- Page Inspection ist besonders nuetzlich fuer Bugfixing: falsche Page, falscher ListPart, andere Tabelle, Extension-Feld oder versteckter Filter lassen sich schneller erkennen.
- Page-Inspection-Screenshots sind Debug-/Evidence-Bilder, aber keine finalen Prozessbilder. Fuer Buchbilder danach wieder die normale Anwendersicht zeigen.
- `FIXEDASSETS-023` zeigt den praktischen Nutzen: Page Inspection bestaetigt die Vordergrundpage `Fixed Asset Card (5600)`, obwohl die Hintergrundliste noch DOM-Treffer liefern kann. Deshalb ist Page Inspection ein Diagnoseanker, aber kein Ersatz fuer einen sauber gescopten Karten-Locator.
- Manche Browser, Remote-Desktop- oder Windows-Konfigurationen koennen `Ctrl+Alt+F1` abfangen. Dann den Help-&-Support-Pfad oder die BC-Suche nach `Page Inspection` / `Seitenpruefung` pruefen.

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
- `FIXEDASSETS-016` ist ein positives Beispiel: Das Nachherbild zeigt nicht nur den Seitenkontext, sondern `MACHINES` plus `12210`/`82000` im sichtbaren Kartenbereich.
- `FIXEDASSETS-020` ist ein gutes Zwischenbild: Es beweist sichtbare Anlagenkartenfelder nach `Mehr anzeigen`, aber nicht die fertige Anlage. Solche Bilder muessen als Feldmapping-/Preflight-Kandidaten markiert werden.
- `FIXEDASSETS-022` ist ein Rejected-QA-Beispiel: Ein Bild, das nicht den behaupteten Code oder sogar den falschen Dialog zeigt, muss geloescht oder als `rejected/do-not-use` dokumentiert werden. Seitentext-Treffer allein reichen nicht, wenn das sichtbare Bild den Wert nicht zeigt.
- `FIXEDASSETS-023` ist ein Debug-Bild-Beispiel: Die Page-Inspection-Aufnahme darf fuer technische Nachweisfuehrung und Bugfixing genutzt werden, aber nicht als finales Anwenderbild fuer die Anlage.
- `FIXEDASSETS-029-EXISTING` ist ein Error-/Learning-Bild: Die Karte zeigt `FA-CNC-01`, aber die relevanten Anlagenfelder sind leer. Es ist deshalb kein Zielbild fuer Kapitel 21, sondern ein gutes Bild fuer "Code vorhanden, Stammdatensatz fachlich unvollstaendig".
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
