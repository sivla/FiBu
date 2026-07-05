# Book Writing Rules

Das Buch ist kein Bericht ueber Agentenarbeit. Es ist ein Schulungsbuch fuer Business Central.

## Lesertext

Buchtext beschreibt direkt:

- welche Seite Business Central zeigt,
- warum die Seite fachlich wichtig ist,
- welche Felder der Anfaenger sieht,
- welche Felder Pflicht oder buchungsrelevant sind,
- welche Buttons ungefaehrlich sind,
- welche Buttons Daten aendern,
- was nach Speichern passiert,
- was nach Preview oder Buchen passiert,
- welche Posten entstehen,
- woran ein erfolgreicher Schritt erkennbar ist,
- welcher Fehler typisch ist,
- wie der Fehler korrigiert wird.

## Nicht in den Buchfliesstext

Nicht in finalen Buchtext schreiben:

- "Dieses Kapitel soll ..."
- "Der Leser soll verstehen ..."
- "Evidence zeigt ..."
- "Dieser Screenshot beweist ..."
- "Der Agent hat ..."
- "Der Case zeigt ..."
- interne Repo-Pfade als Erklaertext
- offene Recherche-To-dos im Fliesstext

Solche Informationen gehoeren in Result JSON, Evidence README, Atlas, Coverage, Source Registry oder State.

## Quellen im Buch

Fachliche Aussagen brauchen Quelle oder eigene Universaarl-Evidence:

- UI-Schritte: Screenshot/Evidence aus `playthru`.
- BC-Produktfunktionen: Microsoft Learn.
- Releaseabhaengige Features: Microsoft Release Plan oder What's New.
- Projektmethodik: Dynamics 365 Implementation Guide / Success by Design.
- Rechts-, Steuer-, GoBD- und E-Rechnungs-Aussagen: amtliche Quellen.

Wenn Quelle und eigene UI-Evidence voneinander abweichen, wird im Buch vorsichtig formuliert. Die genaue Abweichung steht in Evidence oder Atlas.

## Vor wirksamen Buchaenderungen

Bevor der Buchmaster oder ein finaler Buchdraft fachlich umgeschrieben wird, muss intern eine Smart Decision Card existieren. Sie erklaert, welche Buchfrage geloest wird, welche Quelle oder Universaarl-Evidence den Abschnitt stuetzt, welche alte Legacy-Stelle ersetzt wird und warum der Text fuer Anfaenger jetzt hilfreicher ist. Diese Card bleibt in Case, Result, Evidence oder State; der Buchtext selbst bleibt direkter Lesertext ohne Agenten-Meta.

## Stil fuer Screenshots

Nicht schreiben:

`Der Screenshot beweist, dass die Company fehlt.`

Schreiben:

`Auf der Seite Mandanten stehen die vorhandenen Companies. Wenn UNIVERSAARL-DE dort nicht erscheint, wird die Company neu angelegt.`

## Universaarl-Regel

Neue Buchabschnitte werden auf Universaarl geschrieben. Rhein-Main, RM-DEMO und CRONUS bleiben nur dort stehen, wo ein historischer Vergleich noch nicht ersetzt wurde. Jeder neue Prozessabschnitt soll die Universaarl-Welt staerken statt die alte Laborwelt fortzuschreiben.

## Zero Open Questions im Buch

Das Buch enthaelt keine internen Open-Question-Listen. Wenn ein Feld, Button, Dialog, Report, Setup-Schalter oder Entry noch nicht verstanden ist, wird die Frage intern in `.agent/state/open_questions_register.json` oder im passenden Atlas gefuehrt. Im Buch steht erst die fertige Erklaerung: Was sieht der Anfaenger, warum ist es wichtig, was wird ausgefuellt, welcher Button aendert Daten und was passiert danach.

Kein Buchabschnitt wird als fertig behandelt, solange seine zentralen Business-Central-Objekte nicht durch Universaarl-Evidence, Microsoft Learn, erlaubte Objektanalyse oder einen finalen Status aus `BC-ZERO-OPEN-QUESTIONS-POLICY.md` erklaert sind.

## Lokaler Stilcheck

Vor groesseren Buchpatches hilft `npm run agent:book-style:check`. Der Check durchsucht den Buchmaster und die finalen Buchdrafts nach typischer Agenten-, Evidence- und Repo-Metasprache. Er ist ein Reviewer, kein Massenaenderungsautomat: Treffer werden beim naechsten fachlich passenden Abschnitt bereinigt, nicht blind ueber alte Legacy-Kapitel ersetzt.

## Look and Feel im Buch

Das Buch erklaert Business Central so, wie ein Anfaenger die Oberflaeche sieht: Command Bar, FastTabs, FactBoxes, Listen, Karten, Worksheets, Journals, Dialoge und Request Pages. Screenshots werden erst als Buchbilder genutzt, wenn relevante Felder, Buttons und Tabellen lesbar sind.

Wenn ein Zeilenbereich zu eng ist, erklaert der Text, dass man FactBox ausblenden, FastTabs einklappen, den Tabellenbereich vergroessern, Fokusmodus nutzen oder horizontal scrollen kann. Interne UI-Diagnose bleibt in Evidence und Atlas; der Buchtext bleibt direkte Anleitung.

## Keine Agenten- oder Evidence-Meta im Buch

Finaler Buchtext spricht nicht ueber Cases, Agenten oder Evidence-Dateien. Er erklaert Business Central direkt fuer den Leser.

Nicht in den Buchfliesstext:

- "Dieses Kapitel erklaert ..."
- "Der Leser soll verstehen ..."
- "Evidence zeigt ..."
- "Dieser Screenshot beweist ..."
- "Spaeter muss ..."
- "Der Case zeigt ..."
- "Der Agent hat ..."

Stattdessen beschreibt der Text die Seite, den Button, das Feld, die fachliche Wirkung, die entstehenden Posten, die Erfolgskontrolle und den Korrekturweg.

## RM-Decommission im Buch

Universaarl ist die aktive Fallstudie. Rhein-Main, `RM-DEMO`, `RM-*`, `MCP_1_20260210` und CRONUS bleiben nur historische Labor- oder Archivreferenzen. Neue Buchabschnitte werden nicht mehr auf Rhein-Main geschrieben. Alte Abschnitte werden Prozess fuer Prozess durch Universaarl-Evidence ersetzt; bis dahin duerfen sie nicht als aktive Zielwahrheit erscheinen.

## Datenreichtum vor Filterkapiteln

Listen-, Filter-, Such-, Analysis-Mode- und Reportingkapitel werden erst final geschrieben, wenn Universaarl genug sinnvolle Daten enthaelt. Eine leere Liste erklaert nur die Oberflaeche. Sie erklaert noch nicht, wie ein Anfaenger mit vielen Kunden, offenen Posten, mehreren Buchungsdaten, Dimensionen und gebuchten Belegen arbeitet.

Der Buchtext darf die Bedienlogik bereits einfach beschreiben, aber konkrete Beispiele, Screenshots und Erfolgskontrollen muessen aus `playthru` / `UNIVERSAARL-DE` kommen.
