# FIXEDASSETS-008 - Book Sync Kapitel 21

Status: `labor`, `book-sync`, `read-only`, `no-posting`, `not-final`, `de-final-open`

## Geprueft

Dieser Lauf hat keine neue Business-Central-Ausfuehrung gestartet. Er synchronisiert Kapitel 21 mit der vorhandenen Fixed-Assets-Evidence aus `FIXEDASSETS-005` bis `FIXEDASSETS-007`.

## Belegter Laborstand

| Bereich | Laborbefund | Evidence |
|---|---|---|
| FA Posting Groups | UI-Pfad erreichbar; vorhandene CRONUS-Gruppen sichtbar; `MACHINES` fehlt | `evidence/fixedassets-005/`, `evidence/fixedassets-006/` |
| CRONUS-FA-Konten | `EQUIPMENT`, `GOODWILL`, `PLANT`, `PROPERTY`, `VEHICLES` und Konten wurden read-only gelesen | `evidence/fixedassets-006/FIXEDASSETS-006-result.json` |
| Depreciation Books | `COMPANY = Company Book` sichtbar; `HGB` nicht sichtbar | `evidence/fixedassets-007/FIXEDASSETS-007-result.json` |
| FA Classes | `FINANCIAL`, `INTANGIBLE`, `TANGIBLE` sichtbar | `evidence/fixedassets-007/FIXEDASSETS-007-result.json` |
| Zielobjekte | `FA-CNC-01`, `MACHINES`, `HGB`, `K30000` nicht als eingerichtete Zielkette belegt | `evidence/fixedassets-004/` bis `evidence/fixedassets-007/` |

## Buchwirkung

Kapitel 21 trennt jetzt klarer zwischen Buchziel und aktuellem RM-DEMO-Laborstand. Vor dem Schritt-fuer-Schritt-Teil steht eine Checkliste, die Anfaengern erklaert:

- welche Einrichtung vor einem Anlagenzugang zusammenpassen muss,
- warum Anlagenklasse, AfA-Buch und Anlagenbuchungsgruppe unterschiedliche Rollen haben,
- warum `MACHINES` und `HGB` nicht geraten oder stillschweigend ersetzt werden duerfen,
- warum noch keine Anlage, kein Zugang und keine AfA gebucht wurden.

## Grenzen

- Kein BC-Lauf in dieser Session.
- Kein Setup-Fit.
- Keine Anlage.
- Keine Einkaufsrechnung.
- Keine Aktivierung.
- Keine AfA.
- Kein deutscher Kontenplan-Endstand.
- Kein deutscher HGB-/USt-Finalnachweis.

## Naechster Schritt

Ohne ausdrueckliche Freigabe bleibt Fixed Assets gesperrt fuer Setup und Buchung. Der naechste sichere Lauf sollte einen anderen read-only- oder Buch-Sync-Block waehlen, zum Beispiel Warehouse-Readiness ohne Warehouse-Aktivierung. Mit Freigabe kann spaeter ein UI-first Setup-Fit fuer `HGB`, `MACHINES`, `FA-CNC-01` und `K30000` geplant werden.
