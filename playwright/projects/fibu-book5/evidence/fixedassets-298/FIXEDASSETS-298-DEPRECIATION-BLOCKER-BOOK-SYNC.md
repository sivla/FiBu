# FIXEDASSETS-298 AfA-Blocker Buch-Sync

Status: labor-sufficient-for-book-draft, labor-blocked, needs-german-final-rebuild

## Was wurde getan?

Der vorhandene AfA-Blocker-Stand aus `FIXEDASSETS-296` und `FIXEDASSETS-297` wurde lokal in Kapitel 21 und den Fixed-Assets-Labor-Draft synchronisiert. Es gab keine neue Business-Central- oder Playwright-Ausfuehrung.

## Was ist jetzt im Buch klarer?

- Der Anlagenzugang `G05001` zu `FA-CNC-01` bleibt als RM-DEMO-Labortrace verwertbar.
- Die AfA-Strecke bleibt blockiert: keine sichtbare AfA-Journalzeile, kein AfA-Preview, keine AfA-Buchung.
- `FADEP-267-OK` erklaert einen alten Datumsfehler: `30.06.2026` lag vor dem Zugang `01.01.2027`.
- `FADEP-295-OK` bleibt fachlich offen: Die genaue Ursache fuer die nicht sichtbare Journalzeile ist nicht feldsicher bewiesen.
- Der Zielpfad in Kapitel 21 ist als deutscher Final-Rebuild-Pfad markiert und darf nicht als bereits bewiesener RM-DEMO-Erfolg gelesen werden.

## Was wurde nicht getan?

- Kein Business Central.
- Kein Playwright.
- Kein `Calculate Depreciation -> OK`.
- Kein Preview Posting.
- Kein Post.
- Kein Setup Change.
- Kein Company Switch.
- Kein deutscher Finalnachweis.

## Buchwirkung

Kapitel 21 und der Fixed-Assets-Labor-Draft koennen den AfA-Blocker jetzt als Anfaenger-Lernpunkt nutzen: Ein Batch-`OK` ist kein Ergebnisnachweis. Nach `OK` muss eine konkrete Journalzeile sichtbar sein; ohne sichtbare Zeile duerfen Preview und Buchung nicht folgen.

## German-Final-Rebuild

In der deutschen Zielinstanz muessen Anlagenkarte, AfA-Buch, Anlagenbuchungsgruppe, Zugang, AfA-Journalzeile, AfA-Preview, gebuchte AfA-Posten, Sachposten und Anlagenspiegel neu erzeugt und neu bebildert werden. RM-DEMO bleibt Laborreferenz.

