# TARGET-007 Mandantenliste: Pfeil neben Neu

| Punkt | Ergebnis |
|---|---|
| Instanz | playthru |
| Seite | Mandanten / Companies, Page 357 |
| Aktion | kleiner Pfeil neben `Neu` geoeffnet |
| Hauptbutton `Neu` geklickt | nein |
| Company erstellt | nein |
| Dropdown sichtbar | ja |
| Kopieren sichtbar | nein |
| Testunternehmen sichtbar | ja |
| Neues Unternehmen erstellen sichtbar | ja |

## Screenshot-QA

Das Bild zeigt die Seite `Mandanten` in der Instanz `playthru`. In der Aktionsleiste ist `Neu` sichtbar; der kleine Pfeil daneben ist geoeffnet. Im Dropdown sind `Neu` und `Neues Unternehmen erstellen` sichtbar. Das Bild zeigt keine gespeicherte neue Company und keine ausgewaehlte Dropdown-Aktion.

## Klickanleitung

1. Seite `Mandanten` oeffnen.
2. In der Aktionsleiste den Button `Neu` suchen.
3. Nicht auf den Hauptteil von `Neu` klicken, wenn nur die Alternativen erklaert werden sollen.
4. Den kleinen Pfeil rechts neben `Neu` anklicken.
5. Das Dropdown zeigt in diesem Kontext `Neu` und `Neues Unternehmen erstellen`. Diese Eintraege werden hier nur angesehen, nicht ausgefuehrt.

## Buchlogik

Der Hauptbutton `Neu` beginnt die Neuanlage direkt in der Liste. Der Pfeil daneben zeigt weitere Moeglichkeiten. Der sichtbare Eintrag `Neues Unternehmen erstellen` ist fachlich interessant, wird aber erst in einem eigenen sicheren Gate ausgefuehrt, weil er eine wirksame Anlage starten kann.

## Naechster Schritt

`TARGET-008-COMPANIES-NEW-ROW-FIELD-SAVE-GATE`: Hauptbutton `Neu` kontrolliert verwenden, Zielwerte eintragen und nur speichern, wenn die aktive neue Zeile eindeutig ist.
