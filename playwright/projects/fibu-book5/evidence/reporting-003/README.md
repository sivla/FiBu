# REPORTING-003 Evidence-Index

Status: labor, read-only, no-posting.

Umgebung: `MCP_1_20260210`, Company `RM-DEMO`, CRONUS USA. Ausgangspunkt ist die bereits gebuchte O2C-Laborrechnung `PS-INV103297`; es wurde keine neue Buchung, keine neue Einrichtung und keine Stammdatenanlage ausgefuehrt.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `REPORTING-003-result.json` | JSON-Ergebnis | Financial Reports ist im breiten Viewport erreichbar; `Income Statement` und Menuepfad `Definitions -> Dimension Perspective` wurden versucht | sichtbare `PRODUCTLINE`-/`CHANNEL`-Auswertung | labor-negativ |
| `REPORTING-003-DIMENSION-PERSPECTIVE.md` | Lernzusammenfassung | fachliche Trennung zwischen Menuepunkt, Postendimension und echter Berichtsauswertung | finalen deutschen Buchtext oder Zahlenwirkung | labor |
| `010-tell-me-financial-reports-page-text.txt` | UI-Seitentext | Tell-Me findet Financial Reports | Reportingauswertung | labor |
| `020-financial-reports-wide-layout-page-text.txt` | UI-Seitentext | Financial Reports-Liste im breiten Viewport mit `Income Statement` und `Dimension Perspective` | Dimensionsergebnis | labor |
| `020-financial-reports-wide-layout-buttons.json` | UI-Aktionen | sichtbare Aktionen der Financial-Reports-Liste | fachliche Wirkung der Aktionen | labor |
| `030-dimension-perspective-result-page-text.txt` | UI-Seitentext | Nach dem Menuepfad ist kein sichtbarer Dimension-Perspective-Kontext vorhanden; der Lauf landet im Role Center | `PRODUCTLINE`/`CHANNEL` als Filter oder Achse | rejected |
| `030-dimension-perspective-result-buttons.json` | UI-Aktionen | im Ergebniszustand bleiben keine relevanten Reportingaktionen sichtbar | Financial-Reports-Bedienpfad | rejected |
| `reporting-003-020-financial-reports-wide-layout.screenshot.json` | Screenshot-Metadaten | Laborbild fuer Financial Reports im breiten Viewport | Dimensionsauswertung | labor |
| `reporting-003-030-dimension-perspective-result.screenshot.json` | Screenshot-Metadaten | rejected Bild: Aktion fuehrt nicht zum erwarteten Dimensionskontext | Buchbild oder Reportingbeweis | rejected |

## Kernaussage

`Financial Reports` ist erreichbar und zeigt im breiten Viewport die relevanten Berichtszeilen und Aktionen. Der Versuch `Definitions -> Dimension Perspective` liefert in diesem Lauf aber keinen sichtbaren `PRODUCTLINE`-/`CHANNEL`-Kontext, sondern endet im Role Center. Damit ist die Financial-Reports-Auswertung nach O2C-Dimensionen weiterhin offen.

## Naechster Schritt

Nicht erneut O2C buchen. Als naechstes read-only `Dimensions - Detail` oder `Analysis Views` pruefen, um herauszufinden, ob `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` dort als Auswertungsachse sichtbar werden.
