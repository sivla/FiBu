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
