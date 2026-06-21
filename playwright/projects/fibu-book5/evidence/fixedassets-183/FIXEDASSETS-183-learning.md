# FIXEDASSETS-183 - Lernnotiz zum Gegenkonto-Nachweis

## Situation

FA-182 hat `82000` im Feld `Bal. Account No.` der bestehenden `Fixed Asset G/L Journals`-Zeile sichtbar gemacht. Damit ist die technische Frage "Treffen wir das richtige Journalfeld?" fuer diesen Laborzustand beantwortet.

## Warum trotzdem nicht sofort buchen?

Ein sichtbarer Journalwert beweist nur den Beleg-/Journalzustand. Er beweist noch nicht, welche Sachposten, Anlagenposten oder Fehler Business Central beim Buchen erzeugen wuerde. Vor einer Buchung braucht es mindestens eine Preview-Posting-Evidence.

## Entscheidung

FA-182 erlaubt einen schmalen Preview-only-Folgelauf. Der naechste Lauf darf keine Werte mehr neu setzen, keine neue Zeile erzeugen und nicht buchen. Er darf nur die bestehende Zeile erneut pruefen und die Vorschau oeffnen.

## Buchwirkung

Fuer Kapitel 21 ist das ein guter Zwischen-Screenshot: Er zeigt, dass ein Anlagenjournal nicht nur "irgendeine Tabelle" ist, sondern dass Gegenkonto, Gegenkontotyp und Posting Type vor der Vorschau fachlich kontrolliert werden muessen. Als finales Buchungsbild reicht er noch nicht.
