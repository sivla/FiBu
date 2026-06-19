# FIXEDASSETS-113 Review

Status: `labor`, `local-evidence-review`, `no-bc-run`, `no-playwright-run`.

## Entscheidung

Der aktuelle FA-G/L-Journal-Wertpfad bleibt gesperrt und wird fuer Werteingabe verworfen.

Grund: `FIXEDASSETS-110` zeigt zwar die Header `Amount` und `Bal. Account No.`, aber keine konkreten Controls. `FIXEDASSETS-112` zeigt danach, dass ein Fokus-/Klickversuch keine aktiven Controls beweist und sogar Page-/Zielzeilen-Signale verliert. Das ist ein Blocker, nicht ein Freigabegrund.

## Lernwert

Ein BC-Grid kann optisch eine Spalte zeigen, ohne dass Playwright dadurch einen sicheren Eingabepfad hat. Header-Sichtbarkeit, Seitentext und Koordinatenfokus sind keine Buchungs- oder Schreibreife.

## Buchwirkung

Kapitel 21 darf den FA-G/L-Journal-Pfad noch nicht als bebilderte Wertkorrektur oder Anlagenzugang beschreiben. Fuer Einsteiger muss erklaert werden: Erst ein stabiler Feld-/Zeilenkontext, dann Wert, danach Preflight/Preview, danach Buchung.

## Naechster Schritt

`FIXEDASSETS-114`: lokal eine alternative Anlagen-Zugangsroute planen. Keine weitere FA-G/L-Journal-Koordinatenprobe, keine Werteingabe, kein Preview Posting, kein Post.
