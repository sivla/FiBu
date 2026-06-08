# INVENTORY-006 Target Stock Draft

Status: Labor-Vorlauf, kontrollierte Journalzeile, keine Buchung.

## Ziel

Dieser Lauf prueft den naechsten Schritt nach `INVENTORY-005`: Kann eine Ziel-Journalzeile fuer `RM-M100 +2` in `FRA-ZL` praktisch vorbereitet werden, und sind Dimension/Preview vor einer Buchung tragfaehig nachweisbar?

## Ergebnis

| Pruefpunkt | Ergebnis |
|---|---|
| Sandbox | MCP_1_20260210 |
| Company | RM-DEMO |
| Journalzeile mit Zielwerten sichtbar | ja |
| Unit Cost sichtbar | ja |
| Dimension PRODUCTLINE=MACHINE vor Buchung sichtbar | ja |
| Preview Posting sichtbar | nein |
| Gebucht | nein |
| Cleanup Zielentwurf | ja |

## Lernbefund

Das Item Journal ist der richtige Einstieg fuer eine kontrollierte Bestandsbewegung. Der Lauf zeigt aber auch, warum vor einer Buchung nicht nur `Post` sichtbar sein darf: Fuer Buch-Evidence muessen Zielzeile, Dimension und eine Preview- oder gleichwertige Kontrolle nachvollziehbar sein. Wenn Preview oder Dimension vor der Buchung nicht sichtbar sind, ist Nicht-Buchen der richtige Beratungsentscheid.

Wichtig fuer Anfaenger: Rechts neben `Unit Cost` liegt `Applies-to Entry`. Dieses Feld dient nicht zur Kostenpflege. Ein frueher Probeversuch mit `42000` in `Applies-to Entry` erzeugte einen Zeilenfehler. Der stabile Lauf laesst dieses Feld leer und belegt `Unit Amount`, `Amount` und `Unit Cost` ueber die BC-Automatik.

Cleanup erfolgt nicht per globalem `Escape` oder `Ctrl+Delete`, sondern ueber das Zeilenmenue `Weitere Optionen anzeigen` -> `Zeile loeschen`.

## Buchwirkung

Kapitel 13/23 kann jetzt genauer erklaeren, dass ein positiver Trainingsbestand zuerst als Journalzeile sichtbar vorbereitet wird. Die Buchanleitung darf aber noch keinen positiven Bestand oder korrigierte Lagerbewertung behaupten, solange `INVENTORY-006` nicht gebucht wurde.

## Grenze

Keine Artikelposten, Wertposten, Sachposten und keine neue Lagerbewertung aus diesem Lauf. CRONUS-USA-Labor; kein deutscher Kontenplan, keine deutsche USt, kein Manufacturing-Nachweis.

## Naechster Schritt

Dimension/Preview-Pfad im Item Journal weiter klaeren oder alternativen kontrollierten Bestandszugang suchen, bevor gebucht wird.
