# TARGET-027C VAT Groups Controlled Write Retry

Instanz: `playthru`
Company: `UNIVERSAARL-DE`

## Ergebnis

`INLAND` und `VAT19` sind nach Reopen sichtbar:

- Page 470 `MwSt.-Geschaeftsbuchungsgruppen`: `INLAND` / `Inland Deutschland`
- Page 471 `MwSt.-Produktbuchungsgruppen`: `VAT19` / `USt 19 Prozent`

Der rohe Playwright-Result blieb zunaechst `blocked`, weil `pageText()`/`innerText` aktive Business-Central-Gridwerte nicht zuverlaessig ausgelesen hat. Die akzeptierte Evidenz ist deshalb `TARGET-027C-RETRY-screenshot-reviewed-result.json` mit visueller Screenshot-QA.

## Grenzen

- Keine MwSt.-Buchungsmatrix-Zeile wurde angelegt.
- Keine Stammdaten wurden angelegt.
- Keine Belege, keine Preview Posting, keine Buchung.
- Keine deutsche 19-Prozent-USt ist final bewiesen.

## Playwright-Learning

- Nach einem Tell-Me-Treffer nicht direkt `Escape` druecken; das kann die geoeffnete Zielseite wieder schliessen.
- BC-Gridwerte koennen im Screenshot sichtbar sein, obwohl der Text-Extractor sie nicht sieht.
- Vor einem erneuten Write immer Reopen pruefen, damit vorhandene Werte nicht als fehlend behandelt und doppelt eingegeben werden.
