# FIXEDASSETS-089 Lernzusammenfassung

Status: `labor`, `local-decision`, `draft-gate`, `no-bc-run`, `no-preview`, `no-posting`, `not-final`.

## Ergebnis

FA-089 gibt den Anlagen-Fibu-Journal-Draft noch nicht frei. FA-088 beweist zwar die Seite `Fixed Asset G/L Journals`, den Batch `DEFAULT` und die relevanten Felder, aber noch keinen sicheren Weg, eine angelegte Journalzeile wieder zu entfernen oder bewusst als Labor-Draft zu behalten.

## Was man in Business Central lernt

Ein Journal ist gefaehrlicher als eine reine Karte: Sobald Werte in eine Zeile eingetragen werden, kann eine persistente Buchblattzeile entstehen. Deshalb braucht eine Klickanleitung vor der ersten Werteingabe eine klare Regel: Wird die Zeile geloescht, oder bleibt sie bewusst mit Belegnummer, Zweck und Folgeaufgabe stehen?

## Buchwirkung

Kapitel 21 sollte den Unterschied zwischen Journal-Kontext, Draft-Zeile, Buchungsvorschau und echter Buchung ausdruecklich erklaeren. Ein sichtbares `Post` beweist keine Buchung und ist fuer Anfaenger ein Warnsignal.

## Naechster Schritt

`FIXEDASSETS-090`: Fixed Asset G/L Journals read-only oeffnen und Manage/Line/Page-Aktionen inventarisieren, um einen Cleanup- oder Keep-Draft-Pfad zu belegen.
