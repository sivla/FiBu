# Business Central UI Look and Feel Guide

Ziel: Playwright soll Business Central so bedienen, wie ein guter Consultant oder Key User es tun wuerde. Ein Feld, Button, Grid oder Dialog gilt erst als blockiert, wenn die relevante Oberflaeche sinnvoll sichtbar gemacht und dokumentiert wurde.

## Grundregel

Vor einem UI-Blocker pruefen:

1. richtige Instanz und Company,
2. richtige Page,
3. relevante FastTabs,
4. FactBox/Infobox-Zweck,
5. Overlays, Hilfe, Tour, Coachmarks,
6. Tabellen-/Grid-Groesse,
7. Fokusmodus oder Layout-/Maximize-Button,
8. horizontales und vertikales Scrollen im richtigen Bereich,
9. Command-Bar-Overflow und Dropdowns,
10. Page Inspection, Personalisierung oder Quellencheck, wenn UI-Sichtbarkeit nicht reicht.

## Overlays und Hilfe

Hilfe unten links, Tour-Hinweise, Coachmarks, Help-Bubbles oder Copilot-/Help-Overlays duerfen geschlossen werden, wenn sie den aktuellen Beweis nicht betreffen und wichtige UI verdecken.

Regel:

- erst Zweck pruefen,
- wenn nicht relevant: schliessen,
- im Result oder Evidence notieren,
- Screenshot wiederholen, wenn vorher etwas verdeckt war.

## FactBox / Infobox

FactBoxes rechts sind weder immer stoerend noch immer wichtig.

- Wenn die FactBox Kontextdaten beweist: geoeffnet lassen und erklaeren.
- Wenn sie Tabelle, Felder oder Actions zu eng macht: ausblenden und dokumentieren.
- Wenn beides wichtig ist: zwei Screenshots, einmal mit FactBox, einmal ohne.

## FastTabs

Auf Karten und Belegen werden FastTabs bewusst behandelt.

Pro relevantem FastTab erfassen:

- Name,
- geoeffnet oder geschlossen,
- Zweck,
- wichtige Felder,
- warum auf- oder zugeklappt wurde.

Kein Feld gilt als nicht vorhanden, bevor der passende FastTab geprueft wurde.

## Listen, Worksheets, Journals und Grids

Ein Grid-Blocker ist erst belastbar, wenn geprueft wurde:

- Ist die Datenzeile vorhanden?
- Gibt es eine leere Eingabezeile?
- Ist die Page read-only oder im Edit-Modus?
- Gibt es Edit/List Edit/Pencil?
- Gibt es Line/Manage/Related/More options?
- Gibt es Fokusmodus, groessere Tabellenansicht oder Maximize?
- Gibt es horizontales Scrollen?
- Sind Spalten verdeckt oder ausgeblendet?
- Ist Personalisierung sinnvoll und sicher?

## Scrollbereiche

Business Central hat mehrere Scrollbereiche: Page, Grid, FastTab, Dialog, Request Page, FactBox, Dropdown. Der Agent dokumentiert bei schwierigen Seiten, welcher Bereich gescrollt wurde und ob die erwartete Spalte oder Action danach sichtbar wurde.

## Personalisierung

Personalisierung ist eine wirksame UI-Aenderung. Sie ist erlaubt, wenn ein Feld oder eine Spalte fachlich erwartet wird und andere Sichtbarkeitswege nicht reichen.

Vorher:

- Grund dokumentieren,
- minimal aendern,
- Screenshot,
- nach Bedarf zuruecksetzen oder als Schulungsansicht markieren.

## Page Inspection und Objektanalyse

Wenn UI-Sichtbarkeit nicht reicht:

- Page Inspection nutzen, falls moeglich,
- Page ID, Page Name, Source Table und relevante Felder erfassen,
- Microsoft Learn pruefen,
- erlaubte AL-/Objektanalyse nutzen, wenn weiterhin unklar.

## Dialoge und Request Pages

Kein OK, Ja, Finish, Erstellen, Post, Preview oder Delete ohne:

- sichtbaren Dialogtext,
- Zweck,
- Eingabefelder und Defaults,
- erwartete Wirkung,
- Risiko,
- Screenshotplan,
- Smart Decision Gate, wenn wirksam.

Wenn unklar: abbrechen, Screenshot/Evidence schreiben, Diagnose-Case erzeugen.

## Result JSON

UI-relevante Cases sollen dieses Objekt ergaenzen:

```json
{
  "uiErgonomics": {
    "helpOverlaySeen": false,
    "helpOverlayClosed": false,
    "factBoxSeen": false,
    "factBoxUsed": false,
    "factBoxHidden": false,
    "fastTabsChecked": [],
    "expandedFastTabs": [],
    "collapsedFastTabs": [],
    "gridExpandedOrFocused": false,
    "horizontalScrollUsed": false,
    "verticalScrollUsed": false,
    "columnsHiddenOrShown": [],
    "personalizationUsed": false,
    "pageInspectionUsed": false,
    "layoutReasoning": ""
  }
}
```

## Screenshot-Qualitaet

Vor Buch-Screenshot pruefen:

- stoert ein Overlay?
- ist die richtige Page sichtbar?
- ist die relevante Tabelle gross genug?
- sind Felder und Buttons lesbar?
- ist die FactBox Teil des Beweises oder stoert sie?
- versteht ein Anfaenger, was er sieht?

Wenn nein: Layout anpassen und Screenshot neu aufnehmen.
