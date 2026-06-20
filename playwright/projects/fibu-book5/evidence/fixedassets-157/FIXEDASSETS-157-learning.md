# FIXEDASSETS-157 Lernzusammenfassung

Status: `labor`, `read-only`, `line-ownership`, `no-value-entry`, `no-preview`, `no-posting`, `not-final`.

## Ergebnis

FA-157 zeigt visuell die aktuelle Zeilensituation im Fixed Asset G/L Journal, aber der DOM-/Text-Extractor hat nur den Business-Central-Shell-Text erfasst. Das Bild zeigt eine Zeile mit `G05001`, `Fixed Asset`, `FA-CNC-01`, `HGB` und `CNC Maschine FRA`; der Betrag `68.000` ist nicht sichtbar.

## Was man in Business Central lernt

Ein Anlagen-Fibu-Journal kann bereits eine sichtbare Zeilensituation enthalten. Bevor ein Anfaenger Werte eingibt, muss geklaert sein, ob diese Zeile zum aktuellen Laborfall gehoert, ob sie leer/ungefaehrlich ist oder ob sie aus einem frueheren Versuch stammt. Sonst wuerde man auf einer falschen Zeile weiterarbeiten.

## Warum das wichtig ist

Journalzeilen sind Arbeitsflaechen. Business Central unterscheidet nicht automatisch zwischen "meinem naechsten Laborbeleg" und "Rest einer frueheren Probe". Deshalb braucht der Klickpfad vor jeder Werteingabe einen Ownership-/Cleanup-Check.

Technisch lernt das Projekt zusaetzlich: Sichtbarer Grid-Inhalt kann im Screenshot vorhanden sein, obwohl die einfache DOM-/Textauswertung ihn nicht findet. Fuer solche Seiten braucht Playwright entweder bessere Grid-/Frame-Strategien oder eine explizite visuelle QA-Grenze.

## Grenzen

- Keine Zeile angelegt, geaendert oder geloescht.
- Keine Werteingabe.
- Keine Preview Posting.
- Keine Buchung.
- Kein deutscher Finalnachweis.

## Naechster Schritt

FIXEDASSETS-158: review FA-157 line ownership locally and decide whether the existing line can be kept, needs cleanup, or must be rebuilt before any value entry.
