# FiBu Buch 5 Playwright-Projekt

Dieses Projekt enthält die Business-Central-Tests und Screenshots für `FiBu-Buch 5`.

## Ziel

Die Tests sollen die BC-Anleitungen im Buch praktisch durchspielen, fehlende Testdaten erzeugen oder prüfen und Screenshots für die bebilderten Klickanleitungen liefern.

Zusätzlich ist dieses Projekt eine Lernstrecke für Business Central. Beim Durchspielen sollen nicht nur die Buchschritte bestätigt werden. Wir beobachten auch, welche Business-Central-Funktionen sichtbar werden, welche Buttons und Menüs der Anwender sieht und welche Felder oder FactBoxes fachlich erklärt werden müssen.

Wenn ein Screenshot etwas zeigt, das im Buch noch nicht erklärt ist, wird daraus eine Fundstelle in `playwright/FINDINGS.md`. Relevante Fundstellen werden recherchiert, getestet und anschließend im Buch ergänzt.

Das Ziel ist praktisches Business-Central-Wissen. Am Ende soll dieses Projekt nicht nur wissen, welche Funktionen Business Central laut Dokumentation hat. Es soll die für das Buch relevanten Klickpfade, Buttons, Menüs und Funktionen real durchgespielt, fotografiert, verstanden und dokumentiert haben. Der Nachweis steht in `UI-INVENTORY.md`.

Die redaktionelle Abdeckung der bebilderten Klickanleitungen steht in `BOOK-CLICK-GUIDE-COVERAGE.md`.

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
masterdata/dimensions.json
masterdata/locations.json
masterdata/customers.json
masterdata/items.json
sales/uat-o2c-001.json
```

## Befehle

```powershell
npm run fibu:screenshots:start
npm run fibu:foundation:company
npm run fibu:foundation:company-info
npm run fibu:audit:data
npm run fibu:masterdata:dimensions
npm run fibu:masterdata:dimension-values
npm run fibu:masterdata:locations
npm run fibu:masterdata:customer-item
npm run fibu:masterdata:posting-fit
npm run fibu:masterdata:default-dimensions
npm run fibu:smoke:bc
```

`MASTERDATA-005` nutzt Playwright nicht nur für Klicks und Screenshots, sondern auch als authentifizierten technischen Träger für die Business-Central-API. Der Webclient liefert den gültigen Session-Token; die API erzeugt die Stammdaten idempotent. Danach öffnet Playwright die BC-Seiten und erzeugt die Buchscreenshots.

Wichtig: Diese API-Anlage ersetzt nicht den fachlichen Posting-Fit. Sichtbar leere Buchungsgruppen oder Basiseinheiten bleiben Findings für `MASTERDATA-006`.

`MASTERDATA-006` setzt für die aktuelle CRONUS-Spielwiese einen technischen Posting-Fit: Customer Template, `PCS`, `RETAIL`, `RESALE`, `FURNITURE`. Danach beweist eine API-Probe, dass ein Sales Order mit `D10000`, `RM-M100`, Menge `1`, Preis `68.000` und Lagerort `FRA-ZL` angelegt werden kann. Das ist bewusst noch kein deutscher `EUR`-/`19 %`-USt-Nachweis.

## Redaktionsregel

Jeder Screenshot, der ins Buch kommt, braucht eine Auswertung:

- Was du im Bild siehst
- Warum das fachlich wichtig ist
- Feldlogik
- Prüfhinweis
- Typische Fehler
- Evidence Pack

Screenshots aus gemischtsprachigen Probeläufen sind Arbeitsmaterial. Finale Buchscreenshots werden später ersetzt.

## Laborbilder und Finalbilder

Die aktuelle CRONUS-Spielwiese erzeugt Laborbilder. Diese Bilder sind wichtig, weil sie Klickpfade, Felder, Datenbedarf, Fehlermeldungen und BC-Verhalten sichtbar machen. Sie sind aber nicht automatisch finale Buchbilder.

Für jedes Laborbild gilt:

- Es darf ins Projekt und in Evidence Packs.
- Es darf zur Buchkritik und zur fachlichen Erklärung genutzt werden.
- Es muss offenlegen, wenn Umgebung, Sprache, Währung, Steuerlogik oder Datenmodell vom Zielbild abweichen.
- Es wird später durch finale deutsche Buchscreenshots ersetzt, sobald eine passende deutsche Umgebung bereitsteht.

Der wichtigste redaktionelle Auftrag bleibt: Das Buch kritisch prüfen. Jeder Lauf beantwortet nicht nur, ob ein Klick funktioniert, sondern auch was Business Central zeigt, warum der Schritt fachlich nötig ist, welche Felder eine Wirkung haben und ob der Buchtext die richtige fachliche Absicht erklärt.

## Lernregel

Jeder Testlauf beantwortet zusätzlich diese Fragen:

- Welche BC-Seite wurde geöffnet?
- Welche Buttons, Menüs, Register und FactBoxes sind sichtbar?
- Welche davon sind für den Prozess relevant?
- Welche davon fehlen noch im Buch?
- Welche Funktion muss nachrecherchiert werden?
- Welche Erkenntnis gehört in Buchtext, Testdaten oder Evidence Pack?
