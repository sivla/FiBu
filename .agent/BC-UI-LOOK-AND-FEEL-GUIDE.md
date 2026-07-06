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

## Consultant-Leseregel fuer BC-Oberflaechen

Der Agent bewertet eine Business-Central-Oberflaeche wie ein Consultant im Kundenprojekt, nicht wie ein reiner DOM-Tester. Vor einer fachlichen Aussage muss er zuerst beschreiben koennen:

- welche Page oder Karte der Nutzer wirklich sieht,
- welcher Bereich der Page aktiv ist,
- ob ein Button, Pfeil, Menueintrag, FastTab, Grid, FactBox oder Dialog gemeint ist,
- welche sichtbare Reaktion Business Central nach der Aktion zeigt,
- welche fachliche Bedeutung die Reaktion fuer Setup, Stammdaten, Prozess oder Buchung hat.

DOM-Text, ARIA-Namen, Page-Inspection-Seitenleisten und Suchtreffer sind Diagnosehilfen. Sie ersetzen nicht den sichtbaren Hauptbereich der Business-Central-Seite. Wenn Diagnose und Screenshot auseinanderlaufen, gewinnt die Screenshot-QA: Der Pfad ist `blocked` oder `rejected-path`, bis die sichtbare Oberflaeche den Claim traegt.

Jeder UI-Blocker erzeugt eine kurze Lernnotiz im Result, README, Atlas oder aktiven Decision-File: Was wurde falsch oder unvollstaendig gelesen, was ist die neue Regel, und welcher naechste Versuch ist wirklich anders? Ohne diese Lernnotiz darf derselbe Klickpfad nicht wiederholt werden.

## PREP-010: Splitbuttons, Tooltips und sichtbarer Zielbeweis

Business Central zeigt viele Aktionen als Kombi aus Hauptbutton, kleinem Pfeil und Menueintraegen. Diese drei Ziele duerfen nie gleichgesetzt werden.

Pflichtregel:

- Hauptbutton, Pfeil und Menueintrag getrennt behandeln.
- Vor mehrdeutigen Aktionen den Button hovern und Tooltip oder Accessible Name erfassen.
- Nach dem Klick pruefen, ob wirklich der erwartete Zielzustand sichtbar ist.
- Wenn der falsche Zielzustand erscheint, den Schritt als `rejected-path` oder `blocked` dokumentieren, nicht als Erfolg.
- Bei wirksamen Actions den Tooltip oder Accessible Name nur als Vorbeweis verwenden. Der eigentliche Beweis ist der sichtbare Nachzustand der Page oder des Dialogs.

Beispiel `Mandanten`:

- `Neu` als Hauptbutton kann eine neue Listenzeile oeffnen.
- Der Pfeil neben `Neu` kann ein Dropdown oeffnen.
- `Neues Unternehmen erstellen` im Dropdown ist ein eigener Menueintrag.

Fuer die Buchroute darf deshalb nicht nur stehen, dass `Neu` geklickt wurde. Es muss sichtbar sein, welcher konkrete UI-Teil getroffen wurde und was danach tatsaechlich auf dem Bildschirm passiert ist.

## Layout-Eskalation vor Blocker

Ein Feld, Code, Button oder eine Spalte gilt erst als nicht sichtbar, wenn die sinnvollen Layoutwege versucht und dokumentiert wurden:

1. Stoerende Overlays schliessen, wenn sie nicht Teil des Beweises sind.
2. Karte oder Liste ueber die Pfeile rechts oben vergroessern, wenn der relevante Bereich zu eng ist.
3. Relevante FastTabs oeffnen.
4. FactBox ausblenden, wenn sie die Haupttabelle verdeckt.
5. Fokusmodus fuer Listen-/Zeilenbereiche pruefen.
6. Horizontal und vertikal im richtigen Bereich scrollen.
7. Command-Bar-Overflow und Dropdown-Pfeile getrennt pruefen.
8. Erst danach Personalisierung oder Page Inspection als Diagnose verwenden.

Ein DOM-Treffer, ARIA-Name oder unsichtbarer Text reicht nicht. Screenshot-QA muss bestaetigen, dass ein Anfaenger den behaupteten Button, Code, Wert oder Dialog im Bild wirklich erkennen kann.

## Screenshot-QA vor Abschluss

Jeder UI-Lauf braucht vor dem Abschluss eine kurze Screenshot-QA:

- Welche Page ist sichtbar?
- Welche Company oder welcher Company-Kontext ist sichtbar?
- Welcher konkrete Button, Pfeil, Menueintrag, Feldbereich oder Dialog ist sichtbar?
- Was beweist das Bild?
- Was beweist das Bild ausdruecklich nicht?
- Ist der Screenshot Buchkandidat, Debugging-Kontext, rejected path oder nur interner Nachweis?
- Welche UI-Lernregel folgt daraus fuer den naechsten Lauf?

Wenn ein Screenshot nur zeigt, dass "irgendwo Text im DOM existiert", aber der relevante UI-Bereich nicht sichtbar ist, ist er kein Buchkandidat.

## Surface-Truth-Gate vor Editor- oder Schreibbeweis

Ein Business-Central-Lauf darf erst von einer Page, Zeile oder einem Editor sprechen, wenn die sichtbare Oberflaeche dazu passt.

Pflichtbeweise:

1. Shell/Instanz/Company sind richtig.
2. Tell-Me/Search-Overlay ist entweder bewusst der Beweisgegenstand oder geschlossen.
3. Der Screenshot zeigt die Zielpage selbst, nicht nur Role Center, Navigation, Suchtreffer oder versteckten DOM-Text.
4. Bei Listen/Grids ist der Zielbereich gross genug: FactBox/Infobox, Fokusmodus, Maximize, horizontales/vertikales Scrollen und sichtbare Spalten wurden sinnvoll behandelt.
5. Die Zielzeile und Zielspalte sind getrennt bewiesen.
6. Ein aktiver Editor zaehlt nur, wenn das fokussierte Control sichtbar, enabled, nicht readonly, im Vordergrund und zeilen-/feldgebunden ist.

Wenn einer dieser Punkte fehlt, ist das Ergebnis `blocked` oder `rejected-path`. Dann darf der Test nicht behaupten, das Feld sei nicht vorhanden oder eine Schreibroute sei fachlich bereit.

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
