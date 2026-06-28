# FIXEDASSETS-261 Navigation-Blocker-Review

Status: `labor`, `local-review`, `navigation-review`, `no-bc-run`, `no-playwright-run`, `not-final`.

## Befund

FA-260 blieb sicher, erreichte aber die `Calculate Depreciation` Request Page nicht. Der Lauf fand keinen nutzbaren Tell-Me-/Search-Kandidaten; die kompakte Evidence zeigte nur `Account No.`.

## Einordnung

Der Blocker ist ein Playwright-Navigations-/Suchzustandsblocker. FA-258 und FA-245 zeigen, dass der Pfad grundsaetzlich erreichbar ist. FA-245 hatte zusaetzlich einen exakten Text-Fallback auf `Calculate Depreciation`, den FA-260 nicht mehr nutzte.

## Entscheidung

Ein weiterer no-OK Retry ist erst nach Navigationsverfeinerung sinnvoll: zuerst Aufgaben-Zeile wie FA-258, danach genau ein sichtbarer exakter Texttreffer wie FA-245. Weiterhin nicht freigegeben sind `OK`, Preview Posting, Post, Setup Change, Company Switch und API-Abkuerzung.

## Naechster Schritt

`FIXEDASSETS-262`: Navigation verfeinern, Kandidaten besser sichern und genau einen no-OK Zielwert-Preflight mit weiter gesperrtem `OK` ausfuehren.
