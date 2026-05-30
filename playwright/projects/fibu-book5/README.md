# FiBu Buch 5 Playwright-Projekt

Dieses Projekt enthält die Business-Central-Tests und Screenshots für `FiBu-Buch 5`.

## Ziel

Die Tests sollen die BC-Anleitungen im Buch praktisch durchspielen, fehlende Testdaten erzeugen oder prüfen und Screenshots für die bebilderten Klickanleitungen liefern.

## Umgebung

| Feld | Wert |
|---|---|
| Env-Prefix | `FIBU_BOOK5` |
| Trainingscompany | `RM-DEMO` |
| Quelle | `CRONUS USA, Inc.` |
| Startstand | CRONUS-Kopie |
| Sprache im aktuellen Lauf | gemischt Deutsch/Englisch |
| Finaler Buchlauf | später mit durchgängig deutscher Oberfläche |

## Testdaten

Testdaten liegen unter:

```text
playwright/projects/fibu-book5/testdata/
```

Aktuell:

```text
foundation/rm-demo-company.json
```

## Befehle

```powershell
npm run fibu:screenshots:start
npm run fibu:foundation:company
npm run fibu:foundation:company-info
npm run fibu:smoke:bc
```

## Redaktionsregel

Jeder Screenshot, der ins Buch kommt, braucht eine Auswertung:

- Was du im Bild siehst
- Feldlogik
- Prüfhinweis
- Evidence Pack

Screenshots aus gemischtsprachigen Probeläufen sind Arbeitsmaterial. Finale Buchscreenshots werden später ersetzt.
