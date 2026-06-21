# FIXEDASSETS-201 Entscheidung

Status: `labor`, `local-review`, `no-bc-run`, `no-playwright-run`, `no-posting`, `not-final`.

## Entscheidung

Der in FA-198/FA-199 identifizierte Blocker `FA Posting Type ist leer` ist durch FA-200 als behoben belegbar.

FA-200 zeigt:

- vorher: Ziel-Select `FA Posting Type` auf der Journalzeile `ASSETS / DEFAULT / 10000` hatte Wert `0` und keine ausgewählte Textoption.
- nach Korrektur: Ziel-Select wurde über den geschützten Select-Pfad auf Wert `1` / `Acquisition Cost` gesetzt.
- nach erneutem Öffnen: `Acquisition Cost` blieb ausgewählt.

## Freigabe

Freigegeben ist nur ein nächster, eng begrenzter `Preview Posting`-Retry:

1. Fixed Asset G/L Journals öffnen.
2. Instanz `MCP_1_20260210` und Company `RM-DEMO` prüfen.
3. Vor dem Preview-Klick erneut beweisen, dass `FA Posting Type = Acquisition Cost` ausgewählt ist.
4. Exakt den `Preview Posting`-Menüpunkt einmal klicken.
5. Entweder Vorschauzeilen oder unmittelbare Fehlermeldungen kompakt sichern.

## Nicht freigegeben

- Kein `Post`.
- Kein `Post and Print`.
- Keine Setup-Änderung.
- Keine Journalzeilenänderung.
- Kein Buch-Update.
- Kein deutscher Finalnachweis.

## Nächster Schritt

`FIXEDASSETS-202-FA-GL-JOURNAL-PREVIEW-POSTING-AFTER-FA-POSTING-TYPE`
