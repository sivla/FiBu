# PREP-043 Permission Docs Route Text Cleanup

Status: `prep-done`

Instanz: `playthru`

Zielcompany: `UNIVERSAARL-DE` (`planned-not-yet-created`)

## Was verbessert wurde

Die permissionnahen Startdokumente wurden auf denselben Zielpfad gebracht wie Buchdraft, Action Atlas und Screenshot-QA-Gate:

```text
Mandanten -> Pfeil neben Neu -> Neues Unternehmen erstellen
```

Die alte Kurzform `Neu / Neues Unternehmen erstellen` wurde entfernt, weil sie den Hauptbutton `Neu` und den Menüeintrag `Neues Unternehmen erstellen` zu leicht vermischt.

Außerdem wurden sichtbare deutsche Ersatzschreibungen in den beiden Dokumenten reduziert, damit die Startcheckliste für den Rechte-Lauf besser lesbar ist.

## Grenzen

- Keine Business-Central-Ausführung.
- Kein Playwright.
- Keine Company erstellt.
- Kein Setup.
- Keine Stammdaten.
- Kein Preview Posting.
- Kein Posting.

## Nächster Schritt

`TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE` bleibt bis zur Rechtefreigabe geparkt. Nach der Freigabe muss der Lauf die PREP-040-Screenshotkette verwenden.
