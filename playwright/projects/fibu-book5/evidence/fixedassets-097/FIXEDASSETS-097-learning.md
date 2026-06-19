# FIXEDASSETS-097 Lernnotiz

FA-097 did not prove Purchase Invoice Line Type = Fixed Asset; status=blocked-fixed-asset-not-visible, guard=blocked-item-line-type-visible. Cleanup status=not-created-or-draft-number-not-found.

Dieser Lauf beweist nur die Zeilentyp-Faehigkeit in einer Einkaufsrechnung. Er ist absichtlich vor Kreditor, Anlagen-Nr., Betrag, Buchungsvorschau und Buchung gestoppt. Fuer das Buch ist das wichtig, weil ein Anlagenzugang erst erklaert werden darf, wenn die Zeile wirklich auf `Fixed Asset`/`Anlage` gestellt werden kann.

Status: RM-DEMO-Labor, kein deutscher Finalnachweis.
