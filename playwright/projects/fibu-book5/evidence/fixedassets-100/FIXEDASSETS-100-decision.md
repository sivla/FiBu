# FIXEDASSETS-100 - Purchase Invoice Type Dropdown Review

Status: observed, local review, no BC execution, no Playwright execution.

## Ergebnis

FA-099 beweist nicht, dass `Type = Fixed Asset` auf Einkaufsrechnungszeilen sichtbar oder auswaehlbar ist. Der Lauf hat den kleineren `Item`-Button in der Type-Zelle gezielt getroffen. Danach blieben `Item` sichtbar und `Fixed Asset` unsichtbar, auch nach `Alt+ArrowDown` und `F4`.

Die wichtigste neue Einordnung: Der gefundene Button wirkt laut Titel wie ein Drilldown auf den aktuellen Datensatz `Item`, nicht wie eine gesicherte Type-Auswahlliste. Ein weiterer nahezu gleicher Purchase-Invoice-Type-Probe waere deshalb wahrscheinlich nur Wiederholung.

## Entscheidung

Die Purchase-Invoice-Type-Route wird fuer den Moment geschlossen.

Nicht wiederholen ohne neues UI-Pattern:

- Type-Zelle mittig anklicken
- kleinen `Item`-Button in der Type-Zelle anklicken
- `Alt+ArrowDown` oder `F4` auf derselben Type-Zelle erneut probieren

## Naechster sinnvoller Schritt

Der naechste Case ist `FIXEDASSETS-101-FA-GL-JOURNAL-OWNERSHIP-GATE`.

Ziel ist noch keine Journalwert-Eingabe. Zuerst muss lokal entschieden werden, ob der Fixed Asset G/L Journal-Weg mit einem explizit kontrollierten Entwurf wieder geoeffnet werden darf:

- genau ein kontrollierter Journalentwurf,
- klare Cleanup- oder Keep-Trace-Regel,
- kein Preview Posting,
- kein Posting,
- keine Setup-Aenderung.

## Grenze

Das ist CRONUS/RM-DEMO-Laborwahrheit. Es ist kein deutscher Finalnachweis und kein Beweis, dass eine deutsche Umgebung `Type = Fixed Asset` auf Einkaufsrechnungszeilen grundsaetzlich nicht anbietet.
