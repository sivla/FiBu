# MASTERDATA-008 Inventory Posting Setup Lernbefund

| Punkt | Befund |
|---|---|
| Sandbox / Company | `MCP_1_20260210`, Company `Rhein-Main Demo GmbH`, CRONUS-USA-Labor |
| Evidence-Status | Labor-Nachweis, `bookUse = evidence`; kein finaler deutscher Screenshot |
| Zielkombination | Location Code FRA-ZL, Invt. Posting Group Code RESALE |
| Fachlicher Zielzustand | Fuer den finalen O2C-Lauf muss diese Kombination ein fachlich freigegebenes `Inventory Account` besitzen, damit BC Artikelwerte auf ein Bestandskonto fortschreiben kann. |
| Situation | `UAT-O2C-001` erreicht Preview Posting, stoppt aber auf `Error Messages`. |
| Symptom | `Inventory Account is missing in Inventory Posting Setup Location Code: FRA-ZL, Invt. Posting Group Code: RESALE.` |
| Sichtbar nachgewiesen | Page `Inventory Posting Setup` zeigt die Zeile `FRA-ZL` + `RESALE`; die Spalten `Inventory Account` und `Inventory Account (Interim)` sind sichtbar. |
| Tatsaechlicher Befund | `Inventory Account` ist im Laborbild leer. |
| Warum BC so reagiert | Beim Buchen einer Artikelbewegung braucht BC nicht nur Debitor, Artikel und Preis, sondern auch eine Kontenfindung fuer Bestand. Diese kommt aus Inventory Posting Setup. |
| Laborstatus | Diagnose ausgefuehrt; Konto wurde bewusst nicht automatisch gesetzt. |
| Limitation | CRONUS-USA-Spielwiese mit gemischter UI; keine deutsche USt-/Finalumgebung; keine Kontenentscheidung; keine erneute Preview nach Fix. |
| Buchwirkung | Die Anleitung muss erklaeren, dass Lagerort und Lagerbuchungsgruppe buchungsrelevant sind. Preview Posting ist der sichere Ort, diese Luecke vor einer echten Buchung zu erkennen. |

## Pruefung nach Korrektur

Nach einer fachlich freigegebenen Kontenentscheidung das Bestandskonto fuer `FRA-ZL` + `RESALE` setzen und erneut `npm run fibu:uat:o2c` ausfuehren. Erwartung: `Preview Posting` zeigt dann eine echte Postenvorschau oder den naechsten echten Setup-Fehler.

## Naechster Schritt

Ein CRONUS-Labor-Bestandskonto fachlich aus vorhandenen Posting-Setups ableiten, die Entscheidung dokumentieren, setzen und den O2C-Lauf erneut pruefen. Deutsche `19 %` USt bleibt davon getrennt.
