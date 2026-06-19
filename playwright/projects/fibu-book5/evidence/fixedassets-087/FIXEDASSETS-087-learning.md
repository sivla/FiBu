# FIXEDASSETS-087 Lernzusammenfassung

Status: `labor`, `local-decision`, `judge_work`, `no-bc-run`, `no-draft`, `no-preview`, `no-posting`, `not-final`.

## Ergebnis

FA-087 entscheidet konservativ: Der Anlagen-Fibu-Journalpfad ist durch FA-086 gefunden, aber eine Journalzeile ist noch nicht reif fuer Werteingabe. Die sichtbaren Spalten reichen fuer einen Navigationsnachweis, aber noch nicht fuer einen sicheren Entwurf.

## Was man in Business Central lernt

Ein Journal ist kein Formular, in das man sofort Werte tippt. Vor einer Anlagenanschaffung ueber das Anlagen-Fibu-Journal muessen mindestens Batch, Buchungsdatum, Belegnummer, Kontoart/Kontonummer, Anlagenpostenart, Anlagennummer, Betrag und Gegenkonto fachlich verstanden und technisch kontrollierbar sein.

Dass `Post` sichtbar ist, ist kein Freibrief. Es ist ein Risikoindikator: Ab diesem Punkt braucht der Klickpfad klare Gates.

## Entscheidung

- Noch keine Zielwerte eingeben.
- Noch keine Journalzeile erzeugen.
- Noch keine Vorschau.
- Keine Buchung.
- Naechster Schritt: read-only Journal-Control-Snapshot.

## Buchwirkung

Kapitel 21 kann den Anlagen-Fibu-Journalpfad als gefundene Route nennen, aber noch nicht als durchgebuchte Anschaffung. Fuer Anfaenger muss die Anleitung erklaeren, warum vor der ersten Zeile ein Kontrollpunkt kommt: Journalzeilen koennen buchungswirksam werden, wenn sie spaeter gepostet werden.

## Grenzen

- Keine editierbare Zeile nachgewiesen.
- Kein Batch-/Blank-Line-Sicherheitsnachweis.
- Keine Werte, keine Vorschau, keine Posten.
- Kein deutscher Finalnachweis.

## Naechster Schritt

FA-088: `Fixed Asset G/L Journals` read-only oeffnen und Batch-, Zeilen- und Control-Kontext sichern, bevor irgendein Zielwert eingegeben wird.
