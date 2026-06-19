# FIXEDASSETS-095 Learning

## Situation

Der Anlagenzugang ueber Einkaufsrechnung bleibt fachlich interessant, weil Business Central Anlagen grundsaetzlich ueber Einkaufsbelege anschaffen kann. Vor einem neuen Draft musste aber erst geklaert werden, ob die Purchase-Invoice-Seite read-only genug Signale fuer den Zeilentyp liefert.

## Ergebnis

Der read-only Kontext beweist `Type = Fixed Asset` nicht. Ohne Draft ist die editierbare Zeile mit Dropdown-Werten nicht sichtbar.

## Warum Business Central so reagiert

Die Einkaufsrechnungsliste zeigt Kopf-/Listen- und Aktionskontext. Die eigentlichen Zeilenfelder liegen erst im Dokument/Subform-Kontext. Deshalb kann ein Listenlauf die fachliche Dropdown-Faehigkeit nur begrenzt nachweisen.

## Buchwirkung

Das Buch darf fuer diesen Punkt noch nicht behaupten, dass der Anlagenzugang per Einkaufsrechnung in RM-DEMO durchgespielt ist. Es darf aber erklaeren, warum vor einem Anlagenzugang erst Zeilentyp, Kreditor, Anlagenkarte und Posting-Setup sauber nachgewiesen werden muessen.

## Naechster Schritt

`FIXEDASSETS-096` soll lokal entscheiden, ob ein eng begrenzter Draft-Line-Type-Proof mit Cleanup/Keep-Regel freigegeben wird.
