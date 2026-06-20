# FIXEDASSETS-160 Write-Gate-Entscheidung

Status: `local-review`, `judge_work`, `no-bc-run`, `no-playwright-run`, `no-preview`, `no-posting`, `not-final`.

## Entscheidung

FA-159 hebt den reinen Sichtbarkeitsblocker teilweise auf: In der breiten `Fixed Asset G/L Journals`-Ansicht sind `Amount`, `Bal. Account Type` und die Spalte `Bal. Account No.` sichtbar. Das reicht fuer einen naechsten, streng gegateten UI-first Werte-Preflight.

Die Freigabe ist aber eng begrenzt:

- Erlaubt fuer den naechsten Fall: vorhandene Laborzeile `G05001` / `FA-CNC-01` kontrolliert oeffnen, Zielwerte `Amount = 68.000` und `Bal. Account No. = K30000` nur dann eintragen, wenn die Zielzellen eindeutig erreichbar sind.
- Weiter gesperrt: `Preview Posting`, `Post`, Cleanup, Loeschen, neue Zeile, Setup-Aenderung, API-Shortcut und Buchaenderung.
- Stop-Regel: Wenn die Zeile nicht eindeutig `G05001` / `FA-CNC-01` / `HGB` / `CNC Maschine FRA` zeigt oder Betrag/Gegenkonto nicht eindeutig feldlokal erreichbar sind, muss der Lauf ohne Aenderung abbrechen.
- Nachweis-Regel: Vorher/Nachher-Screenshot und JSON muessen klar trennen, ob Werte wirklich eingegeben wurden oder ob der Lauf blockiert wurde.

## Begruendung

FA-158 schuetzt die bestehende Laborzeile, weil sie den Zielkontext sichtbar enthaelt. FA-159 zeigt nun zusaetzlich die relevanten rechten Spalten, aber nur mit Laborwerten: `Amount = 0,00`, `Bal. Account Type = G/L Account`, `Bal. Account No.` leer. Daraus folgt keine Buchungsreife, aber ein enger Preflight ist besser als ein weiterer abstrakter Review.

## Buchwirkung

Fuer Kapitel 21 ist das ein guter Lernfall: In breiten Business-Central-Journalzeilen reicht es nicht, die Anlage links zu sehen. Betrag und Gegenkonto muessen ebenfalls sichtbar und eindeutig steuerbar sein, bevor ein Autor oder Key User ueber Vorschau oder Buchung nachdenkt.

## Naechster Schritt

`FIXEDASSETS-161-FA-GL-JOURNAL-GUARDED-VALUE-PREFLIGHT`: UI-first, eng gegatet, nur Werte-Preflight. Kein Preview Posting, kein Post.
