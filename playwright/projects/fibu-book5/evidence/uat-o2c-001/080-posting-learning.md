# UAT-O2C-001 Laborbuchung Lernbefund

| Punkt | Befund |
|---|---|
| Auftrag | S-ORD101068 |
| Buchungsoption | Ship and Invoice |
| Genau einmal bestaetigt | ja |
| Gebucht | ja |
| Gebuchte Verkaufsrechnung | PS-INV103297 |
| Warum diese Option | Der O2C-Laborfall soll Lieferung und Fakturierung in einem Schritt zeigen. Deshalb ist `Ship and Invoice` fachlich passend. |
| Warum BC vorher Preview braucht | Die Preview beweist vor dem Buchen, dass BC Sach-, Debitoren-, Artikel- und Wertposten bilden kann und dass der Inventory-Setup-Blocker nicht mehr greift. |
| Steuergrenze | Tax bleibt im CRONUS-USA-Labor 0 %. Das ist bewusst kein deutscher 19-%-USt-Nachweis. |
| Buchwirkung | Das Buch kann diesen Lauf als Laborbeispiel fuer kontrolliertes Buchen und nachgelagerte Postenspur nutzen, aber finale deutsche Screenshots muessen spaeter neu entstehen. |

## Naechster Schritt

Die gebuchte Verkaufsrechnung und die entstandenen Posten wurden anschliessend read-only in `082-posting-entry-trace.json` nachgewiesen. Sichtbar sind gebuchte Verkaufsrechnung, Debitorenposten, Sachposten und Wertposten; die direkte Artikelpostenliste blieb mit dem getesteten Filter leer und braucht einen gezielten Folgecheck ueber `Find entries...` oder die gebuchte Lieferung.
