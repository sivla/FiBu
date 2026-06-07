# Screenshot-QA fuer Buch 5

Diese Datei bewertet, ob erzeugte Business-Central-Screenshots bereits als Buchbilder taugen oder nur Labor-/Evidence-Material sind.

## Bewertungsregel

Ein Screenshot ist erst buchfaehig, wenn er:

1. den fachlich richtigen Datensatz zeigt
2. die im Buch behaupteten Felder sichtbar macht
3. keine irrefuehrenden CRONUS- oder Altdaten als Prozessnachweis zeigt
4. Stoerer wie Popover, Touren, Resize-Hinweise oder Copilot-Karten bewusst enthaelt oder gezielt entfernt
5. Sprache, Company, Waehrung, Steuerlogik und Testdaten zum erklaerten Ziel passen
6. durch Evidence ergaenzt wird, die denselben Zustand prueft

Laborbilder duerfen abweichen. Dann muessen Abweichung, Ursache und Buchwirkung dokumentiert sein.

Zu jedem automatisiert erzeugten O2C-Screenshot schreibt der Screenshot-Helper eine Metadatendatei unter `evidence/<testfall>/...screenshot.json`. Diese Datei enthaelt Status, Buchnutzung, Zweck, erwartete Werte im BC-Seitentext und bekannte Grenzen. Die PNG-Datei allein ist deshalb nicht mehr die ganze Wahrheit.

## `UAT-O2C-001` Screenshot Review

| Screenshot | Bewertung | Befund | Entscheidung |
|---|---|---|---|
| `img/uat-o2c-001-010-suche-verkaufsauftraege.png` | brauchbares Laborbild | Tell-Me zeigt `Sales Orders`, richtige Treffergruppe und mehrere aehnliche Treffer. Das ist didaktisch gut, weil es die Gefahr falscher Suchtreffer sichtbar macht. | Als Labor-/Toolbild behalten. Final mit deutschem Suchbegriff `Verkaufsauftraege` neu erzeugen. |
| `img/uat-o2c-001-020-liste-verkaufsauftraege.png` | nicht als O2C-Prozessnachweis geeignet | Liste zeigt vorhandene CRONUS-Auftraege und markiert `10000`/Adatum, nicht `D10000`. | Nur als Navigationsbild verwenden. Fuer Prozessnachweis nach Anlage auf den erzeugten Auftrag filtern oder direkt die Karte zeigen. |
| `img/uat-o2c-001-030-kopf-debitor-d10000.png` | gutes Laborbild mit Stoerern | Auftragsnummer, `Mueller Maschinenbau GmbH`, Status, Datum und FactBox mit `Customer No. D10000` sind sichtbar. Stoerer: Document-Check-Leiste und Copilot-Zusammenfassung. | Als Laborbild geeignet. Fuer finales Buchbild Stoerer gezielt schliessen oder im Text als Anfaengerbefund erklaeren. |
| `img/uat-o2c-001-030-neuer-verkaufsauftrag.png` | entfernt | Datei war identisch zum Kopf-Screenshot nach Debitoranlage. Sie zeigte keinen leeren neuen Auftrag. | Aus dem Lauf entfernt; der Test erzeugt nur noch `030-kopf-debitor-d10000`. |
| `img/uat-o2c-001-040-zeile-artikel-rm-m100.png` | nur eingeschraenkt geeignet | Zeile zeigt `Item`, `RM-M100`, Beschreibung, `FRA-ZL` und Betrag. Menge ist am rechten Rand/Seitentext nachgewiesen, aber im Bild kaum sichtbar; USt-/Tax-Spalte und Dimension fehlen. Unten liegt ein fremder Bildstreifen im Screenshot, offenbar aus einem geoeffneten lokalen/Browser-Overlay. | Nicht buchfaehig. Neu erzeugen mit sauberem Browserzustand, besserer horizontaler Position oder separatem Zeilendetail-/Dimensionsbild. |
| `img/uat-o2c-001-041-zeile-betraege-steuer.png` | brauchbares Laborbild | DOM-Scroll des BC-Containers `freeze-pane-scrollbar` zeigt `Unit Price Excl. Tax`, `Tax Group Code = FURNITURE` und `Line Amount Excl. Tax = 68.000,00`. | Als Laborbild fuer Steuer-/Betragsspalten nutzbar. Nicht als finales deutsches Buchbild, weil CRONUS-Steuergruppe/US-Waehrung und fehlende Dimension offen bleiben. |
| `img/uat-o2c-001-042-zeile-spaete-spalten.png` | verworfener Kontrollversuch | Scroll ans rechte Tabellenende zeigt Plan-/Shipment-/Department-Spalten. | Nicht im Buch verwenden; nur Nachweis, dass DOM-Scroll grundsaetzlich funktioniert. |
| `img/uat-o2c-001-050-dimension-productline-machine.png` | guter Labor-Kandidat | `Line` -> `Related Information` -> `Dimensions` oeffnet `Edit Dimension Set Entries`. Sichtbar sind `CHANNEL = B2B` und `PRODUCTLINE = MACHINE`. | Als Buchkandidat fuer Dimensionspruefung nutzbar. Final spaeter in deutscher Umgebung neu erzeugen. |

## Harte Findings aus dem Review

### QA-O2C-001 Listenbild zeigt nicht den Buchfall

Das Listenbild `020` darf nicht als Beleg fuer den Auftrag `D10000` gelesen werden. Es ist ein Navigationsbild. Fuer den Buchfall muss der erzeugte Auftrag entweder in der Karte oder in einer gefilterten Liste sichtbar sein.

### QA-O2C-002 Zeilenbild zeigt nicht alle behaupteten Pruefpunkte

Das aktuelle Zeilenbild beweist Artikel, Beschreibung, Lagerort und Betrag. Es beweist nicht gut genug Menge, USt und Waehrung. Die Dimension wurde inzwischen separat ueber den Zeilendialog `Edit Dimension Set Entries` nachgewiesen.

### QA-O2C-003 Stoerer im Screenshot muessen aktiv entschieden werden

Document Check, Copilot Summary, FactBoxes, Hilfe- und Tourkarten koennen fuer Anfaenger lehrreich sein. Fuer finale Prozessbilder muessen sie aber entweder entfernt oder im Begleittext erklaert werden.

### QA-O2C-004 Evidence-Text enthaelt UI-Resize-/Skriptartefakte

`040-zeile-artikel-rm-m100-page-text.txt` enthaelt nach dem fachlichen Seitentext auch Resize-Hinweise und Skripttext. `pageText()` ist deshalb als Roh-Evidence nuetzlich, aber nicht als sauberer Buchauszug. Fuer Assertions und Evidence braucht das Projekt kuenftig gescopte Extraktion aus Karten-, Listen- oder FactBox-Bereichen.

### QA-O2C-005 Seitentext ist kein Sichtbarkeitsnachweis

Die Scrollversuche zeigen: Werte koennen im BC-DOM beziehungsweise Seitentext vorhanden sein, ohne im Screenshot wirklich sichtbar zu sein. Screenshot-Metadaten verwenden deshalb den Begriff `expectedPageText`, nicht `expectedVisible`. Finale Buchfreigabe braucht visuelle Pruefung oder einen gezielt gescopten Screenshot.

### QA-O2C-006 Horizontaler Grid-Scroll ist moeglich, aber kontrollpflichtig

Business Central nutzt fuer das Verkaufszeilengrid einen horizontal scrollbaren Container `freeze-pane-scrollbar`. DOM-Scroll auf diesen Container funktioniert besser als Mauskoordinaten. Der mittlere Scrollwert liefert ein brauchbares Laborbild fuer Steuer- und Betragsspalten. Fuer finale Buchbilder muss der Zielbereich aber bewusst gewaehlt und visuell geprueft werden.

## Verbesserungsregeln fuer die naechsten Laeufe

- Vor jedem Screenshot muss der Test pruefen, ob der Zielwert im Seitentext vorhanden ist; die visuelle Buchfreigabe erfolgt zusaetzlich ueber Screenshot-QA.
- Screenshots bekommen einen Status: `labor`, `candidate`, `final`, `rejected`.
- Screenshot-Metadaten gehoeren zum Evidence Pack und muessen vor Buchverwendung gelesen werden.
- Redundante Screenshots werden nicht ins Buch referenziert.
- Tabellenbilder brauchen eine definierte Spaltenstrategie: breiter Viewport, horizontaler Scroll, Zeilendetail, Personalisierung oder mehrere Detailbilder.
- Fuer Dimensionen reicht kein Stammdatenbild. Der O2C-Lauf nutzt jetzt `Line` -> `Related Information` -> `Dimensions` als Belegnachweis; spaetere Buchungslaufe muessen die Dimension zusaetzlich in Posten oder Reporting wiederfinden.
- Rohes `pageText()` wird nicht ungefiltert als redaktionelle Wahrheit verwendet.
