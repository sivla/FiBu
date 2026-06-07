# UAT-O2C-001 Buchungsvorschau-Lernbefund

| Punkt | Befund |
|---|---|
| Auftrag | S-ORD101062 fuer D10000 / RM-M100. |
| Posting-Menue gefunden | ja |
| Preview Posting geklickt | ja |
| Preview-Pruefung erreicht | ja |
| Buchungsvorschau geoeffnet | nein |
| Normaler Buchungsdialog geoeffnet | nein |
| Blockierendes Fehlerbild | ja |
| Fehlerkern | Inventory Account is missing in Inventory Posting Setup Location Code: FRA-ZL, Invt. Posting Group Code: RESALE. |
| Evidence | `060-preview-posting-page-text.txt`, `060-visible-actions-before-preview.json`, `060-visible-actions-after-post-menu.json`, `060-preview-posting-result.json` |
| Fachliche Einordnung | Microsoft Learn beschreibt Preview Posting als Vorabpruefung der Eintraege, die beim Buchen entstehen. Im aktuellen Projekt ist das ein sicherer Zwischenschritt vor jeder echten Buchung. |
| Buchwirkung | Die Anleitung soll vor `Buchen` immer erst die Buchungsvorschau zeigen und erklaeren, welche Postenarten der Anwender plausibilisiert. Der deutsche 19-%-Endstand bleibt im Zielmandanten nachzuweisen. |

## Notizen

- BC erreicht die Preview-Posting-Pruefung, zeigt aber ein blockierendes Fehlerbild statt der Postenvorschau.
- Fehlerkern: Inventory Account is missing in Inventory Posting Setup Location Code: FRA-ZL, Invt. Posting Group Code: RESALE.
