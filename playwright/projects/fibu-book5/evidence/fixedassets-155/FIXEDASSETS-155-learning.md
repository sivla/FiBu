# FIXEDASSETS-155 Lernzusammenfassung

Status: `labor`, `read-only`, `route-preflight`, `no-draft`, `no-preview`, `no-posting`, `not-final`.

## Ergebnis

FA-155 proved the Fixed Asset G/L Journal route read-only in RM-DEMO. 11 acquisition-route field signals were visible; no journal line, value, preview or posting was created by this run.

## Was man in Business Central lernt

Die Anlagenanschaffung per Journal beginnt nicht mit der Buchung, sondern mit der richtigen Journalroute. Auf der Seite `Fixed Asset G/L Journals` muessen vor einem spaeteren Schreibversuch die Zeilenfelder sichtbar und fachlich verstanden sein: Buchungsdatum, Belegnr., Kontoart/Kontonr., Anlagenpostenart, AfA-Buch, Betrag und Gegenkonto.

## Warum das wichtig ist

Wenn ein Feld nicht sichtbar oder nicht eindeutig erreichbar ist, wird ein automatisierter Schreibversuch fragil. FA-155 bleibt deshalb absichtlich read-only und prueft zuerst, ob die spaetere Anschaffungsroute ueberhaupt als Buch-Klickpfad erklaerbar ist.

## Grenzen

- Keine Journalzeile angelegt.
- Keine Werte eingegeben.
- Keine Preview Posting.
- Keine Buchung.
- Kein deutscher Finalnachweis.

## Naechster Schritt

FIXEDASSETS-156: review FA-155 journal-route evidence locally before deciding whether a guarded acquisition journal draft is safe.
