# Business-Central-Fundstellen

Diese Datei sammelt Dinge, die Playwright-Läufe, Screenshots oder manuelle Sichtprüfungen in Business Central sichtbar machen, die im Buch aber noch nicht ausreichend erklärt sind.

Eine Fundstelle ist keine Störung. Sie ist Lernmaterial.

## Statuswerte

| Status | Bedeutung |
|---|---|
| `offen` | gesehen, aber noch nicht recherchiert |
| `recherchieren` | braucht Microsoft Learn, BC-Hilfe oder praktischen Gegentest |
| `getestet` | Funktion wurde in BC ausprobiert |
| `buch-update` | Erkenntnis muss ins Buch eingearbeitet werden |
| `erledigt` | Buch/Doku/Test wurden aktualisiert |
| `ignoriert` | bewusst nicht relevant für das Buchziel |

## Vorlage

```markdown
## <ID> <kurzer Titel>

| Feld | Wert |
|---|---|
| Status | offen |
| Projekt | fibu-book5 |
| Testfall |  |
| Screenshot |  |
| BC-Seite |  |
| sichtbarer Text |  |
| Elementtyp | Button / Menü / Feld / FastTab / FactBox / Dialog / Hinweis / Bericht |
| erste Hypothese |  |
| Recherchequelle |  |
| Testergebnis |  |
| Entscheidung | Buch ergänzen / Projektnotiz / ignorieren |
| Buchstelle |  |
```

## Aktuelle Fundstellen

## FIND-BC-BOOK-001 Auslandsgesellschaft `RM-CH` vs. `RM-AT`

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | Build-Scope aus Buch |
| Screenshot | noch keiner |
| BC-Seite | nicht UI-bezogen |
| sichtbarer Text | Kapitel 6 nennt `RM-CH`; Kapitel 3 nennt `RM-AT GmbH` |
| Elementtyp | Buch-/Datenmodell-Fundstelle |
| erste Hypothese | Das Buch vermischt Drittland-/CH-Fall und EU-/AT-Fall. |
| Recherchequelle | Buchkapitel 3, 6, 18, 22 gegenprüft |
| Testergebnis | Buchmodell bereinigt: Company für EU-Ausland ist `RM-AT`; Drittland/CH bleibt als Debitor-/Steuerfall `D30000`/CH, nicht als eigene Company in Welle 1. |
| Entscheidung | Buch und Projektdaten auf `RM-AT` als Auslandsgesellschaft vereinheitlicht; CH als Drittland-Kunden-/Lieferfall dokumentieren. |
| Buchstelle | Konzernstruktur, Beispieldatenpaket, Ausland/USt/Intercompany |

Bewertung:

Für EU-B2B, Drittland, USt-ID, Exportnachweis und Intercompany ist es fachlich relevant, ob die Auslandsgesellschaft Schweiz oder Österreich ist. Entscheidung: `RM-AT` ist die Auslandsgesellschaft für EU-/Intercompany-Fälle; CH bleibt als Drittlandfall über Debitor `D30000 SwissTech AG` und Kreditor-/Importfälle erhalten.

## FIND-BC-UI-001 Tell-Me-Suche wählt nicht automatisch die richtige Seite

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | alle Such-basierten Playwright-Läufe |
| Screenshot | diverse `smoke-bc-*` und `masterdata-001-*` |
| BC-Seite | Tell-Me / Suche |
| sichtbarer Text | Suchergebnislisten mit Seiten, Aktionen, Berichten und Datenfundstellen |
| Elementtyp | Such-/Navigationsverhalten |
| erste Hypothese | Der oberste Treffer ist nicht zwingend die gewünschte BC-Seite. |
| Recherchequelle | praktischer Playwright-Lauf |
| Testergebnis | Blindes `first().click()` und `Enter` sind fachlich riskant. |
| Entscheidung | Playwright-Helfer darf keinen stillen Enter-Fallback verwenden; bei Mehrdeutigkeit Treffer explizit wählen. |
| Buchstelle | Bedienlogik, Suchlogik, Playwright-Klickanleitungen |

Bewertung:

Die Business-Central-Suche ist für Menschen hilfreich, aber für Automatisierung mehrdeutig. Eine Klickanleitung muss zeigen, welchen Treffer der Anwender wählen soll, nicht nur welchen Suchbegriff er eintippt.

Folgeentscheidung:

Für Audit- und Setup-Prüfungen verwendet Playwright nach Möglichkeit direkte BC-Seiten-URLs mit Page-ID. Tell-Me bleibt für Buchscreenshots und Anwenderschulung wichtig, darf aber nicht die einzige technische Navigation für kritische Prüfungen sein.

## FIND-BC-TEST-001 MASTERDATA-001 war False Positive

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `MASTERDATA-001` |
| Screenshot | `img/masterdata-001-*` |
| BC-Seite | Role Center statt Zielseite |
| sichtbarer Text | Role-Center-Kacheln wie `Sales This Month`, `Ongoing Sales`, `Sales Orders` |
| Elementtyp | Testqualitäts-Fundstelle |
| erste Hypothese | Der Test hat nur geprüft, ob Begriffe irgendwo im Role Center vorkommen. |
| Recherchequelle | Evidence-Textdateien unter `playwright/projects/fibu-book5/evidence/masterdata-001/` |
| Testergebnis | Der grüne Audit war fachlich nicht belastbar. |
| Entscheidung | Audit auf direkte Page-ID-Navigation und Negativprüfung gegen Role-Center-Text umstellen. |
| Buchstelle | Test- und Evidence-Regeln |

Bewertung:

Ein bestandener Playwright-Test ist nur dann Evidence, wenn er die richtige Business-Central-Seite prüft. Für Buch und UAT muss die Seite selbst Teil des Akzeptanzkriteriums sein.

## FIND-BC-UI-002 Dimensionsseite vs. Dimension-Value-Liste

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `MASTERDATA-001` |
| Screenshot | `img/masterdata-001-dimensions.png` |
| BC-Seite | `Dimensions` / `Dimension Value List` |
| sichtbarer Text | `Dimensions`, `Dimension Value List` |
| Elementtyp | Seiten-/Navigations-Fundstelle |
| erste Hypothese | Page `560` zeigt Dimensionswerte, nicht die Dimensions-Hauptliste. |
| Recherchequelle | direkter BC-Test mit Page-IDs; Microsoft Learn zu Dimensions |
| Testergebnis | Page `536` öffnet `Dimensions`; Page `560` öffnet `Dimension Value List`. |
| Entscheidung | `MASTERDATA-001` nutzt Page `536`; Dimension Values werden erst im Aufbau je Dimension geöffnet. |
| Buchstelle | Foundation Setup, Dimensionen |

Bewertung:

Für das Anlegen einer Dimension braucht der Leser zuerst die Seite `Dimensions`. Dimension Values sind der zweite Schritt innerhalb einer bestehenden Dimension.

## FIND-BC-TEST-002 BC-Listen-Neuanlage braucht Scope auf die `Neu - ...`-Form

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `MASTERDATA-002` |
| Screenshot | `img/masterdata-002-dimensions-rhein-main.png` |
| BC-Seite | `Dimensions`, Page `536` |
| sichtbarer Text | `Neu`, `Liste bearbeiten`, `Neu - Dimensions`, `Gespeichert` |
| Elementtyp | Liste / Neuanlage / Grid-Fokus |
| erste Hypothese | Nach `Neu` existieren Hauptliste und Neuanlage-Form gleichzeitig; ein unspezifischer Locator schreibt in die falsche Liste oder gar nicht. |
| Recherchequelle | praktischer Playwright-Lauf |
| Testergebnis | Erfolgreich erst nach Scope auf `form "Neu - Dimensions"`; vorher wurde ein falscher Datensatz `LINE` erzeugt bzw. keine Zeile angelegt. |
| Entscheidung | BC-Grid-Neuanlagen immer auf die konkrete `Neu - <Seite>`-Form scopen und nach dem Speichern gegen den Seitentext prüfen. |
| Buchstelle | Stammdatenaufbau, Playwright-Regeln, Dimensionen |

Bewertung:

Business-Central-Listen verhalten sich anders als klassische Webformulare. Der Button `Neu` erzeugt einen eigenen Neuanlagekontext, während die alte Liste weiter sichtbar bleibt. Für Buchscreenshots ist das didaktisch wichtig: Der Leser muss erkennen, dass er nicht einfach irgendwo in die Tabelle tippt, sondern in der neu erzeugten Zeile arbeitet.

Folgeentscheidung:

Für `MASTERDATA-002` ist die richtige technische Regel: `Dimensions` öffnen, `Neu` klicken, innerhalb der Form `Neu - Dimensions` die Felder `Code` und `Name` erfassen, speichern lassen, danach den neuen Code in der Dimensionsliste nachweisen.

Zusatz-Learning:

Cleanup-Prüfungen dürfen nicht gegen freien Seitentext laufen. Der Text `Product Line` enthält fachlich das Wort `Line`, ist aber kein Dimensionscode `LINE`. Deshalb muss Cleanup eine konkrete Code-Zelle oder einen konkreten Datensatz-Locator prüfen.

## FIND-BC-API-001 Stammdaten per API sind noch kein Posting-Fit

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `MASTERDATA-005`, gelöst in `MASTERDATA-006` |
| Screenshot | `img/masterdata-005-items-after-api.png`, `img/masterdata-006-item-posting-fit.png` |
| BC-Seite | `Items` / `Item Card` |
| sichtbarer Text | `Base Unit of Measure`, `Gen. Prod. Posting Group`, `Inventory Posting Group` leer |
| Elementtyp | Feld / Stammdaten-/Buchungslogik |
| erste Hypothese | Die Standard-API legt den Artikel an, setzt aber nicht automatisch alle buchungsrelevanten BC-Felder. |
| Recherchequelle | praktischer Playwright-Lauf mit BC-API und Item Card |
| Testergebnis | `RM-M100` existierte zunächst mit Kosten `42.000,00` und Verkaufspreis `68.000,00`; Buchungsgruppen und Basiseinheit waren leer. `MASTERDATA-006` setzt `PCS`, `RETAIL`, `RESALE`, `FURNITURE` und beweist einen Sales-Order-Probelauf. |
| Entscheidung | `MASTERDATA-005` bleibt Existenz- und Screenshot-Nachweis; `MASTERDATA-006` ist der erste technische Posting-Fit. |
| Buchstelle | Stammdaten, Artikel, Posting-Fit, O2C-Vorbereitung |

Bewertung:

Das ist ein klassischer Beratungsfehler: Stammdaten sind nicht fertig, nur weil Name und Preis sichtbar sind. Für einen Verkaufsauftrag braucht der Artikel eine Basiseinheit, Produktbuchungsgruppe, Lagerbuchungsgruppe und passende Buchungsmatrix. Der erste O2C-Lauf darf deshalb erst nach `MASTERDATA-006` gebucht werden.

## FIND-BC-TAX-001 CRONUS-Technikfit ist noch kein deutscher Steuerfit

| Feld | Wert |
|---|---|
| Status | offen |
| Projekt | fibu-book5 |
| Testfall | `MASTERDATA-006` |
| Screenshot | `img/masterdata-006-customer-template-fit.png`, `img/masterdata-006-item-posting-fit.png` |
| Evidence | `playwright/projects/fibu-book5/evidence/masterdata-006/api-result.json` |
| BC-Seite | `Customer Card`, `Item Card`, Standard-API `salesOrders` |
| sichtbarer/API-Text | `currencyCode = USD`, `taxCode = FURNITURE`, `taxPercent = 0` |
| Elementtyp | Steuer-/Währungs-/Posting-Setup |
| erste Hypothese | Die aktuelle Spielwiese ist CRONUS USA. Sie kann den technischen Klickpfad tragen, bildet aber den deutschen Zielsteuerfall nicht automatisch ab. |
| Entscheidung | UI- und API-Lernen darf weitergehen; endgültige Buchscreenshots für `EUR` und `19 %` brauchen einen deutschen Lauf oder ein explizit konfiguriertes deutsches Setup. |
| Buchstelle | Foundation, Posting Groups, USt, O2C |

Bewertung:

Das ist für das Buch zentral: Ein grüner technischer Test ist nicht automatisch ein fachlich korrekter deutscher Steuerfall. Für die jetzige Spielwiese zählt `MASTERDATA-006` als Laufbarkeitsnachweis. Für den Buch-Endstand müssen `EUR`, deutsche USt-Logik und `19 %` separat nachgewiesen werden.

## FIND-BC-TEST-003 Dimensionswerte brauchen Persistenzprüfung über Grid-Werte

| Feld | Wert |
|---|---|
| Status | erledigt |
| Projekt | fibu-book5 |
| Testfall | `MASTERDATA-003` |
| Screenshot | `img/masterdata-003-dimension-values-rhein-main.png` |
| BC-Seite | `Dimension Values` aus `Dimensions` |
| sichtbarer Text | `Dimension Values - PRODUCTLINE`, `Nicht gespeichert`, `Gespeichert` |
| Elementtyp | Liste / Neuanlage / Speichern |
| erste Hypothese | Die Zeile lässt sich optisch füllen, aber reiner Seitentext ist kein belastbarer Persistenznachweis. |
| Recherchequelle | praktischer Playwright-Lauf; Microsoft Learn zu Dateneingabe und Keyboard Shortcuts |
| Testergebnis | `MACHINE`, `B2B`, `SALES`, `DIRECTED` sind nach erneutem Öffnen über Grid-Werte nachweisbar. |
| Entscheidung | `MASTERDATA-003` prüft `input.value`/Grid-Werte statt nur `innerText`. Reload-/Neuöffnungsnachweis ist Pflicht. |
| Buchstelle | Dimensionen, vorbereitender Stammdatenaufbau |

Bewertung:

Ein Screenshot mit sichtbarem Wert reicht nicht als Evidence, wenn der Wert nach erneutem Öffnen nicht nachweisbar ist. Für das Projekt gilt: Stammdatenaufbau ist erst erledigt, wenn der Datensatz nach Reload oder erneutem Öffnen der Seite wiedergefunden wird.

Zusatz-Learning:

Business-Central-Grids geben Werte nicht immer über `innerText` aus. Sichtbare Zellwerte können in `input.value` liegen. Für Evidence muss der Test daher je Seite entscheiden, ob Text, ARIA, Input-Wert oder Screenshot der belastbare Nachweis ist.
