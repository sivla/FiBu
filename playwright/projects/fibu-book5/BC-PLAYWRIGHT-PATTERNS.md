# Business-Central-Playwright-Patterns

Stand: 15.06.2026

Diese Datei sammelt wiederverwendbare Muster aus belegten Laeufen. Sie ist keine allgemeine Playwright-Dokumentation, sondern Projektwissen fuer Business Central in `MCP_1_20260210` / `RM-DEMO`.

## Suchpfade und Tell-Me

- Tell-Me niemals mit blindem `Enter` bedienen, wenn mehrere Treffer moeglich sind.
- Erst Trefferkandidaten sammeln, fachlichen Treffer anklicken und danach den Zielseitenkontext pruefen.
- Sichtbarer Suchtreffer beweist nur Navigation, nicht Prozessfaehigkeit.
- Bei gemischter deutscher/englischer UI beide Begriffe als Suchhilfe dokumentieren, aber die Buchsprache deutsch halten.
- Wenn Microsoft Learn oder Supportseiten im Browser aufpoppen, gilt das nicht als BC-Nachweis; Business-Central-Seiten muessen im BC-Kontext bleiben.

## Page-ID, Suche und Kontext

- Direkte Page-ID kann stabil sein, beweist aber nur den geoeffneten Kontext.
- Tell-Me ist didaktisch gut fuer Anfaenger, braucht aber gezielte Trefferwahl.
- Seitentitel wie `Items`, `Vendors`, `Service Items` beweisen nicht, dass der gefilterte Zielcode sichtbar ist.
- Zielobjekt-Nachweise brauchen den konkreten sichtbaren Wert, zum Beispiel `D10000`, `RM-M100`, `FA-CNC-01`, `K30000`.

## New/Neu sicher verwenden

- `New`/`Neu` ist in Business Central global mehrdeutig.
- Kein ungescopter `New/Neu`-Klick fuer Setup oder Stammdaten.
- Zuerst Seitenanker, Liste/Karte und Feldpositionen belegen.
- Wenn nur ein leeres Formular sichtbar ist, ist das Formular-Preflight, kein Zielstammdaten-Nachweis.
- Belegte Beispiele: `REPORTING-013` rejected wegen global mehrdeutigem `New/Neu`; `FIXEDASSETS-012` beweist leere Karten und Vendor-Template-Dialog, aber keine Zielcodes.

## Post, Preview Posting und Buchungsdialoge

- Nicht den Hauptteil von `Post...` klicken, wenn `Preview Posting` gemeint ist.
- Preview Posting ist der bevorzugte sichere Preflight vor Buchungen, wenn verfuegbar.
- Ein normaler Buchungsdialog ist die letzte Sicherheitsgrenze. Vor `OK` muss Screenshot/Evidence klaeren, welche Option gewaehlt wird.
- Belegte Optionen: O2C `Ship and Invoice`, P2P `Receive and Invoice`.
- Jede echte Buchung braucht Belegnummer, Postenspur und No-Repeat-Lock.

## Tabellen, breite Ansicht und FactBox

- Breiter Viewport und breite Layoutansicht sind erlaubt, wenn dadurch der fachliche Zielbereich sichtbar wird.
- FactBox einklappen, wenn sie Tabellenfelder verdeckt.
- FactBox sichtbar lassen, wenn sie selbst der Nachweis ist, etwa `Journal Check`.
- Horizontalen Grid-Scroll gezielt am BC-Container nutzen und visuell pruefen, ob die Zielspalten sichtbar sind.
- Screenshot nur als Buchkandidat markieren, wenn der Leser das behauptete Lernziel im Bild erkennt.

## Screenshots und Metadaten

- Jeder notwendige Screenshot braucht einen Zweck: Navigation, Setup Before/After, Preflight, Posting Dialog, Posted Document, Ledger Trace, Report, Error, Rejected Path oder Book Candidate.
- `pageText()` ist Roh-Evidence, aber kein visueller Beweis.
- Metadaten muessen mindestens Status, sichtbares Ziel, Labor/final-Grenze und Buchwirkung nennen.
- Harte Regel: Das Bild muss zeigen, was man sehen will. Das kann Code, Name, Betrag, Waehrung, Steuer, Status, Buchungsoption, Postenart, Konto, Dimension, Filter, Fehler, Reportzeile, Dialogauswahl oder Pflichtfeld sein.

## Journale und Amount-Format

- Journalzeile sichtbar ausfuellen reicht nicht.
- Nach Eingabe lokalisierte Zahlenformate pruefen, zum Beispiel `-68.000,00`.
- `Journal Check` oder gleichwertiger Preflight muss vor Buchung gelesen werden.
- Bei Item Journals Kostenfelder nicht mit `Applies-to Entry` verwechseln.
- Cleanup in Journalen gezielt ueber Zeilenmenue oder bekannte UI-Aktion, nicht ueber globale Tastatur-Hoffnung.

## Apply Entries und OP-Ausgleich

- Apply Entries ist ein eigener fachlicher Kontext, nicht nur ein Klick vor `Post`.
- Zahlung/Ausgleich erst buchen, wenn offener Posten, Betrag, Gegenkonto, Posting Group, Apply-Bezug und Preflight passen.
- Nach Zahlung Debitorenposten, Detailed Customer Ledger Entries, G/L Entries und Bank Account Ledger Entries getrennt nachweisen.

## Postenspur finden

- Belegnummer allein reicht nicht fuer jede Postenart.
- `Find entries...`, Related Entries, Ledger-Entry-Seiten und Value Entries koennen unterschiedliche Wege liefern.
- O2C-Artikelposten wurde ueber Value Entry und Item Ledger Entry No. gefunden, nicht direkt ueber Order No.
- Bank Account Ledger Entries waren ueber Page `372` sichtbar; Page `371` bleibt rejected.

## Setup-Fit statt Shortcut

- Setup- und Stammdatenfuelle muessen UI-first erfolgen, wenn daraus eine Buch-Klickanleitung entstehen soll.
- API-Evidence kann Laborfit oder Diagnose sein, ersetzt aber keinen Klickpfad.
- Wenn ein API-Laborfit historisch existiert, im Buch als Voraussetzung oder offener UI-Nachziehpfad markieren.

