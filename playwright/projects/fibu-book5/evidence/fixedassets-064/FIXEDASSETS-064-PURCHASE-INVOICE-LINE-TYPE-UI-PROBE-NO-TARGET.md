# FIXEDASSETS-064 - Purchase-Invoice-Zeilentyp ohne Zielanlage

Status: `labor`, `ui-first`, `line-type-probe`, `no-target-entry`, `no-preview`, `no-posting`, `not-final`

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | line-type-fixed-asset-not-proven-cleaned-up |
| Draft | 107209 |
| Cleanup | cleaned-up nach separatem UI-Cleanup |
| Gebucht | nein |

## Ergebnis

Der Zeilentyp `Fixed Asset` wurde nicht belastbar im Purchase-Invoice-Zeilenkontext nachgewiesen. Das Rejected-Bild zeigt weiter `Type = Item` und einen Vendor-Registrierungsdialog fuer `Fixed Asset`; die Eingabe wurde also nicht als sauberer Zeilentypwechsel verarbeitet. Der Entwurf `107209` wurde danach in einem separaten UI-Cleanup-Lauf geloescht. Der Folgelauf darf `FA-CNC-01` weiterhin nicht eingeben.

## Lernwert

Bei einer Anlagen-Einkaufsrechnung ist nicht die Nummer der erste sichere Nachweis, sondern der Zeilentyp. Erst wenn die Zeile sichtbar `Fixed Asset` zeigt, gehoert die nachfolgende Nummernspalte fachlich zur Anlagenlogik. Bleibt `Type = Item`, kann dieselbe Eingabe in einen falschen Lookup- oder Kreditorenkontext fuehren.

## Buchwirkung

Kapitel 21 muss weiter warnen: Ohne sichtbaren Zeilentyp `Fixed Asset` ist jede Anlagen-Nr.-Eingabe ein falscher oder unbewiesener Pfad. Das Debugging-Kapitel sollte diesen Fall als Beispiel nutzen: Freitext in der Zeilentyp-/No.-Zone kann in eine Vendor-Registrierungslogik kippen.

## Grenzen

- Kein `K30000` und kein `FA-CNC-01` in diesem Lauf.
- Keine Preview, kein `Post`, kein Anlagenzugang und keine AfA.
- CRONUS-USA-Labor; kein deutscher HGB-/Kontenplan-/VAT-Finalnachweis.

## Naechster Schritt

FIXEDASSETS-065-PURCHASE-INVOICE-LINE-TYPE-HELPER-DIAGNOSIS: Zeilentyp-Auswahl robuster diagnostizieren, weiter ohne `FA-CNC-01`.
