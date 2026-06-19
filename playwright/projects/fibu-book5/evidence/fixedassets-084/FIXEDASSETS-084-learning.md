# FIXEDASSETS-084 Lernzusammenfassung

Status: `labor`, `read-only`, `route-discovery`, `no-draft`, `no-preview`, `no-posting`, `not-final`.

## Ergebnis

FA-084 stayed read-only but did not prove the Fixed Asset G/L Journal route. Blocker: Error: Tell-Me Treffer /^Fixed Asset G\/L Journals$|^FA G\/L Journals$|^Anlagen Fibu Buch.-Bl.*tter$|^Anlagen Fibu Buchbl.*tter$/i wurde nicht gefunden. Kein Enter-Fallback, weil BC-Suche mehrdeutig ist..

## Was man in Business Central lernt

Ein Anlagenzugang kann ueber ein Anlagen-Fibu-Journal vorbereitet werden. Vor einer spaeteren Journalzeile muss aber zuerst klar sein, welche Felder sichtbar sind und welche Gate-Regeln gelten: Buchungsdatum, Belegnummer, Kontoart/Kontonummer, Anlagenpostenart, Anlagennummer, Betrag und Gegenkonto sind fachlich andere Pruefpunkte als eine Einkaufsbelegzeile.

## Buchwirkung

Kapitel 21 sollte den Journalpfad als eigenen, UI-first nachzuweisenden Anlagenzugangsweg behandeln. FA-084 beweist nur die Route und sichtbare Signale; es beweist noch keine Anschaffung, keine Posten und keinen deutschen Zielzustand.

## Grenzen

- Keine Journalzeile angelegt.
- Keine Werte eingegeben.
- Keine Preview Posting.
- Keine Buchung.
- Keine Setup-Aenderung.

## Naechster Schritt

Diagnose why the FA G/L Journal route did not open without using New/Edit/Post/Preview.
