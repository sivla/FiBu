# TARGET-009 Hauptbutton Neu: Universaarl-Company anlegen

| Punkt | Ergebnis |
|---|---|
| Instanz | playthru |
| Seite | Mandanten / Companies, Page 357 |
| Zielcompany sichtbar | nein |
| Company vorher schon vorhanden | nein |
| Fehler sichtbar | nein |
| Copy/Test/CRONUS/API | nein |
| Company Switch | nein |

## Screenshot-QA

Das Nachher-Bild zeigt die Mandantenliste nach dem Anlageversuch ohne sichtbare Zielcompany. Der naechste Schritt ist Fehler-/Save-Diagnose, kein blinder Retry.

## Buchnotiz

Die direkte `Neu`-Route reicht erst dann als Buchpfad, wenn Business Central die neue Company sichtbar speichert oder eine konkrete Fehlermeldung zeigt.
