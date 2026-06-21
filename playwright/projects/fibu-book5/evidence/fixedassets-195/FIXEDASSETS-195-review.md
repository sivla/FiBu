# FIXEDASSETS-195 Review: Preview Posting fuehrt zu Error Messages

Status: `labor`, `local-review`, `no-bc-run`, `no-playwright-run`, `no-posting`, `not-final`.

## Geprueft

Review der FA-194-Evidence:

- `FIXEDASSETS-194-result.json`
- `010-preview-posting-menuitem-attempt.json`
- `020-preview-posting-result-text.txt`
- `FIXEDASSETS-194-learning.md`

## Befund

FA-194 hat den gefaehrlichen breiten `Post`-Pfad erfolgreich vermieden:

- nur Splitbutton `Verwandte Aktionen fuer Post` geklickt,
- genau einen `Preview Posting`-Menuepunkt gefunden,
- nur diesen Preview-Menuepunkt geklickt,
- kein `Post`, kein `Post and Print`, kein `OK`/`Yes`,
- keine Journalzeile angelegt, geaendert oder geloescht.

Business Central oeffnete danach die Seite `Error Messages`. Die bisherige Text-Evidence zeigt nur, dass die Liste `Error Messages` einen Artikel hat. Die eigentliche Fehlermeldung ist noch nicht lesbar nachgewiesen.

## Entscheidung

FA-194 ist als Preview-Error-Evidence akzeptiert, aber nicht als Postenvorschau und nicht als Posting-Nachweis.

Der naechste Schritt darf kein Setup-Fit und keine Buchung sein. Zuerst muss die Fehlerliste read-only ausgelesen werden, damit klar ist:

- welche konkrete BC-Fehlermeldung entstanden ist,
- ob die Ursache ein fehlendes Setup, fehlende Journalwerte, Datenqualitaet oder ein UI-/Automationspfad ist,
- welche Einrichtung im Buch fuer Anfaenger erklaert werden muss.

## Grenzen

- Keine neue BC-Ausfuehrung in FA-195.
- Kein Playwright-Lauf in FA-195.
- Keine Fehlerursache im Detail belegt.
- Keine Setup-Aenderung.
- Keine Buchung.
- Kein deutscher Finalnachweis.

## Naechster sicherer Schritt

`FIXEDASSETS-196` darf read-only die Seite `Error Messages` bzw. die nach FA-194 erreichte Fehlermeldung auslesen:

1. In `MCP_1_20260210` / `RM-DEMO` bleiben.
2. Nur Error-Messages-/Fehlerlisten-Kontext oeffnen oder auslesen.
3. Keine Journalwerte aendern.
4. Keine Setup-Aenderung.
5. Keine Buchung, kein Preview-Retry.
6. Fehlertext, betroffene Tabelle/Seite/Feldhinweise kompakt sichern.
