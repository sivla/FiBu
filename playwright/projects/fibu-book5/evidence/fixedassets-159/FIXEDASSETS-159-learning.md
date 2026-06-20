# FIXEDASSETS-159 Lernzusammenfassung

Status: `labor`, `read-only`, `grid-visibility`, `no-value-entry`, `no-preview`, `no-posting`, `not-final`.

## Ergebnis

FA-159 captured FA G/L Journal Amount/Bal. Account visibility read-only. Amount header visible: true; Bal. Account header visible: true; amount 68000 visible: false; K30000 visible: false; screenshot captured: true.

## Was man in Business Central lernt

Breite Tabellen in Business Central zeigen nicht automatisch alle fachlich wichtigen Spalten. Bei Journalzeilen muss vor jeder Eingabe geklaert werden, ob Betrag und Gegenkonto wirklich sichtbar sind oder ob der Benutzer erst horizontal scrollen, Spalten einblenden oder einen anderen Nachweispfad nutzen muss.

## Warum das wichtig ist

Ein Screenshot ist nur dann ein gutes Buchbild, wenn er den fachlichen Kontrollpunkt sichtbar macht. Eine Zeile mit Anlage und AfA-Buch allein beweist noch nicht, dass Betrag und Gegenkonto korrekt oder ueberhaupt sichtbar sind.

## Grenzen

- Keine Werteingabe.
- Keine Zeile angelegt, geaendert oder geloescht.
- Keine Preview Posting.
- Keine Buchung.
- Kein deutscher Finalnachweis.

## Naechster Schritt

FIXEDASSETS-160: decide locally whether the FA G/L Journal line has enough visible Amount/Bal. Account evidence for a guarded write/preflight case, or remains blocked.
