# Workarounds und Fehlerjournal

Diese Datei dokumentiert technische Stolperstellen, Workarounds und gelöste Fehler aus den Business-Central-Playwright-Läufen für Buch 5.

Ziel ist nicht nur, dass der Test am Ende grün ist. Ziel ist, dass ein späterer Autor, Consultant oder Codex-Account versteht, was schiefging, wie es sichtbar wurde und welche Regel daraus entstanden ist.

## Dokumentationsregel

Jeder relevante Fehler oder Workaround bekommt:

| Feld | Bedeutung |
|---|---|
| Problem | Was ist passiert? |
| Sichtbarer Beleg | Screenshot, Trace, Evidence oder Seitentext |
| Ursache | Warum ist es passiert? |
| Lösung | Was wurde geändert? |
| Buchwirkung | Muss die Anleitung angepasst werden? |
| Künftige Regel | Was machen wir beim nächsten Lauf anders? |

Jeder Eintrag muss außerdem gegen die betroffene Buchstelle geprüft werden. Wenn der Workaround zeigt, dass der Buchtext zu knapp, falsch oder missverständlich ist, wird die Buchstelle im selben Arbeitsgang korrigiert oder als offene Buch-Fundstelle in `playwright/FINDINGS.md` markiert.

## WK-BC-O2C-001 Tell-Me-Suche als Screenshot, aber nicht als technische Navigation

| Feld | Wert |
|---|---|
| Problem | Die Suche `Alt+Q` / `Sales Orders` war als Anfängerpfad sichtbar, aber Playwright konnte den Suchtreffer nicht immer stabil öffnen. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/img/uat-o2c-001-010-suche-verkaufsauftraege.png` |
| Ursache | Business Central rendert Tell-Me-Suchergebnisse dynamisch und teils anders als klassische Web-Links. Außerdem kann der oberste Treffer fachlich falsch sein. |
| Lösung | Für Buchscreenshots bleibt die Suche sichtbar. Der technische Lauf öffnet die Verkaufsauftragsliste danach über Page-ID `9305`. |
| Buchwirkung | Die Anleitung muss weiterhin `Alt+Q` erklären, aber ausdrücklich sagen, welchen Treffer der Leser auswählt. |
| Künftige Regel | Suche für Anwenderschulung fotografieren; kritische Playwright-Prüfungen über stabile Page-IDs oder eindeutig gescopte UI-Elemente steuern. |

## WK-BC-O2C-002 `Neu` ist Menüaktion, kein klassischer Button

| Feld | Wert |
|---|---|
| Problem | Der Helper `clickButtonInAnyFrame` fand `Neu` nicht, obwohl die Aktion sichtbar war. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/img/uat-o2c-001-020-liste-verkaufsauftraege.png` |
| Ursache | BC rendert Aktionen in der Befehlsleiste häufig als `menuitem`, nicht als `button`. |
| Lösung | Der Helper sucht jetzt nach `button` und `menuitem`. Bei `menuitem` wird nach dem Klick zusätzlich `Enter` gesendet, weil BC die Aktion teils erst fokussiert. |
| Buchwirkung | Die Buchanleitung beschreibt `Neu` als Aktion in der Verkaufsauftragsliste, nicht als beliebigen Button. |
| Künftige Regel | BC-Befehlsleisten immer als Aktionsmenü behandeln; Playwright-Helper dürfen nicht nur Button-Rollen unterstützen. |

## WK-BC-O2C-003 Debitor `D10000` wird im sichtbaren Feld `Customer Name` gewählt

| Feld | Wert |
|---|---|
| Problem | Die Eingabe `D10000` im sichtbaren Feld wurde nicht übernommen; der Auftrag blieb ohne Debitor. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/img/uat-o2c-001-030-kopf-debitor-d10000.png`; die fruehere redundante Datei `playwright/projects/fibu-book5/img/uat-o2c-001-030-neuer-verkaufsauftrag.png` wurde entfernt. |
| Ursache | Im Auftragskopf ist zuerst `Customer Name` sichtbar. Der fachliche Debitorcode `D10000` erscheint nach Auswahl in Liste und FactBox, ist aber nicht zwingend das Eingabefeld, das der Anwender zuerst sieht. |
| Lösung | Der Test gibt den Kundennamen `Mueller Maschinenbau GmbH` ein und prüft danach `D10000` im Seitentext/FactBox-Kontext. |
| Buchwirkung | Die Anleitung wurde korrigiert: Debitor über Name oder Lookup auswählen und anschließend Nummer `D10000` prüfen. |
| Künftige Regel | Sichtbares Feld und fachlicher Schlüssel sind getrennt zu erklären. Für Anfänger immer sagen: welchen Wert eingeben, wo die Nummer danach geprüft wird. |

## WK-BC-O2C-004 Labor-Screenshotläufe dürfen Entwürfe nicht stehen lassen

| Feld | Wert |
|---|---|
| Problem | Jeder UI-Lauf über `Neu` legt einen echten Verkaufsauftrag an. Fehlläufe erzeugten leere oder unvollständige Entwürfe. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/evidence/uat-o2c-001/999-cleanup.json` |
| Ursache | Business Central speichert neue Belege früh automatisch. Ein Screenshot-Test ist damit nicht nur Betrachtung, sondern verändert Daten. |
| Lösung | `UAT-O2C-001` räumt Laboraufträge mit `customerNumber = D10000` nach dem Screenshot per API wieder weg. Zwischenläufe wurden ebenfalls gezielt bereinigt. |
| Buchwirkung | Im Buch steht jetzt die Regel: Labor-Screenshotläufe abbrechen/verwerfen/entfernen; echte Evidence-Läufe bewusst behalten oder buchen. |
| Künftige Regel | Jeder Test, der Belege erzeugt, braucht vorab eine Cleanup-Strategie. Cleanup darf nie ungescopten Seitentext verwenden. |

## WK-BC-O2C-005 Ungescopter Seitentext enthält Liste und Karte gleichzeitig

| Feld | Wert |
|---|---|
| Problem | Eine frühe Cleanup-Logik nahm die erste Belegnummer aus dem Seitentext und hätte dadurch einen alten Listendatensatz erwischen können. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/img/uat-o2c-001-030-kopf-debitor-d10000.png`, `playwright/FINDINGS.md` → `FIND-BC-TEST-003` |
| Ursache | BC hält Hintergrundliste, aktuelle Karte, FactBox und Hinweise gleichzeitig im DOM. `pageText()` ist Evidence-Material, aber kein eindeutiger Datensatz-Scope. |
| Lösung | Cleanup wurde auf API-Filter `customerNumber = D10000` umgestellt. Damit werden nur Laboraufträge aus unserem Szenario entfernt. |
| Buchwirkung | Evidence-Regeln wurden ergänzt: Nachweise müssen eindeutig sagen, welcher Beleg geprüft wird. |
| Künftige Regel | Datensatznummern aus Kartenkontext, API-Antwort, URL, eindeutigem Marker oder Filter ermitteln; niemals blind aus freiem Seitentext. |

## WK-BC-O2C-006 Breiter Viewport für Tabellen und Zeilen

| Feld | Wert |
|---|---|
| Problem | Bei `1440x1000` waren BC-Listen und Verkaufszeilen zu eng; viele Spalten lagen außerhalb des sichtbaren Bereichs. |
| Sichtbarer Beleg | ältere und neue `playwright/projects/fibu-book5/img/uat-o2c-001-020-liste-verkaufsauftraege.png`; neuer Lauf zeigt mehr Spalten bis Status/Beträge. |
| Ursache | Business Central-Listen sind breit und horizontal scrollbar. Standard-Viewport-Breiten erzeugen unnötig abgeschnittene Tabellenbilder. |
| Lösung | Playwright-Viewport wurde auf `1920x1080` erhöht. Zusaetzlich darf die breite Layoutansicht beziehungsweise eine vergroesserte Seiten-/Listenansicht genutzt werden, wenn BC dadurch relevante Spalten ohne irrefuehrenden Zuschnitt zeigt. |
| Buchwirkung | Laborbilder werden aussagekräftiger, weil mehr Tabellenkontext sichtbar ist. Der Buchtext muss aber benennen, ob das Bild im normalen Layout, mit eingeklappter FactBox oder in breiter Layoutansicht aufgenommen wurde. |
| Künftige Regel | Für BC-Listen und Belegzeilen standardmäßig `1920x1080` nutzen. Für finale Bilder zusätzlich prüfen, ob FactBox ein- oder ausgeblendet werden soll und ob breite Layoutansicht, horizontaler Scroll oder Detailansicht die fachlich bessere Darstellung liefert. |

## WK-BC-O2C-007 Hilfekarten und Popover sind Laborbefunde

| Feld | Wert |
|---|---|
| Problem | BC blendet Hilfekarten wie `About sales orders` oder `About sales order details` ein; Popover können Felder überlagern. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/img/uat-o2c-001-020-liste-verkaufsauftraege.png`, `playwright/projects/fibu-book5/img/uat-o2c-001-030-kopf-debitor-d10000.png` |
| Ursache | In neuen Rollen/Companies zeigt BC kontextuelle Hilfe und Touren. Bei Feldfokus können zusätzliche Kontakt-/Lookup-Popover erscheinen. |
| Lösung | Für den aktuellen Lernlauf werden Hilfekarten bewusst nicht entfernt, weil sie zeigen, was Anfänger sehen. Für finale Buchbilder wird später entschieden, ob sie geschlossen werden. |
| Buchwirkung | Hilfekarten können im Buch als Hinweis auf BC-Onboarding erwähnt werden, gehören aber vermutlich nicht in finale Prozessscreenshots. |
| Künftige Regel | Laborbilder dürfen Hilfekarten zeigen; finale Screenshots brauchen einen kontrollierten Zustand ohne verdeckende Popover. |

## WK-BC-O2C-008 `Escape` ist kein sicherer globaler Screenshot-Cleanup

| Feld | Wert |
|---|---|
| Problem | Ein Versuch, Hilfekarten vor Screenshots pauschal mit `Escape` zu schließen, brachte BC in einen Größenänderungsmodus. Danach enthielt der Seitentext nur noch Shell-/Skripttext statt den Verkaufsauftrag. |
| Sichtbarer Beleg | Fehlgeschlagener Lauf `UAT-O2C-001` am 2026-06-07; Playwright-Trace unter `test-results/.../trace.zip` während des Laborlaufs. |
| Ursache | Der Fokus lag offenbar auf einem Splitter/Resize-Element. In Business Central bedeutet `Escape` kontextabhängig nicht nur „Popover schließen“, sondern kann einen gestarteten UI-Zustand abbrechen oder verändern. |
| Lösung | `Escape` wurde aus `settleForBookScreenshot()` entfernt. Der Test wartet nur kurz und prüft vor dem Screenshot den fachlichen Seitentext. |
| Buchwirkung | Finale Buchscreenshots dürfen nicht durch ungezielte Tastaturbereinigung entstehen. Hilfekarten werden entweder bewusst als Lernbefund gezeigt oder gezielt über ihre eigene Schließen-Aktion entfernt. |
| Künftige Regel | Keine globalen Tastatur-Workarounds ohne anschließende fachliche Prüfung. Nach jeder UI-Bereinigung muss der Test erneut Auftrag, Debitor oder Zeile im aktuellen Kontext nachweisen. |

## WK-BC-O2C-008A Teaching Tips gezielt schliessen

| Feld | Wert |
|---|---|
| Problem | Page `540` zeigte beim Standarddimensionsnachweis unten links die Karte `About default dimensions`; dadurch war der Screenshot technisch gueltig, aber als Buchbild unruhig. |
| Sichtbarer Beleg | Vorheriger Labor-Screenshot `playwright/projects/fibu-book5/img/masterdata-007-default-dimensions-item-rm-m100.png`; aktueller Lauf `npm run fibu:masterdata:default-dimensions` erzeugt die beiden Page-540-Bilder ohne Karte. |
| Ursache | Microsoft beschreibt solche Karten als Teaching Tips und Tours. In der aktuellen gemischten UI war der Schliessen-Button als `Verwerfen` beschriftet, nicht als `Close`. |
| Loesung | `dismissTours()` erkennt jetzt `Schliessen`, `Close`, `Dismiss`, `Discard` und `Verwerfen`. Der Helfer schliesst die Karte ueber ihre eigene Aktion statt global `Escape` zu druecken. |
| Buchwirkung | Teaching Tips duerfen als Lernbefund erklaert werden. Fuer Feld- und Tabellenbelege sollen sie geschlossen werden, wenn sie keine fachliche Aussage tragen. |
| Kuenftige Regel | Keine blinde globale Ausschaltung der Onboarding-Hilfe setzen. Fuer reproduzierbare Buchscreenshots Teaching Tips gezielt pro Lauf schliessen und danach den fachlichen Seitentext erneut pruefen. |

## WK-BC-O2C-009 CRONUS-Labor ist nicht automatisch deutscher Steuerfit

| Feld | Wert |
|---|---|
| Problem | Der Buchfall erwartet `EUR`, `19 %` USt, Steuerbetrag `12.920` und Bruttobetrag `80.920`. Der aktuelle Laborlauf erzeugt aber `USD`, `taxCode = FURNITURE`, `taxPercent = 0`, Steuerbetrag `0` und Bruttobetrag `68.000`. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/evidence/uat-o2c-001/045-target-vs-labor-delta.md`, `playwright/projects/fibu-book5/evidence/uat-o2c-001/040-zeile-artikel-rm-m100-api-result.json` |
| Ursache | Die Spielwiese basiert auf CRONUS USA. Die bisher gesetzten Werte `CUSTOMER COMPANY`, `RETAIL`, `RESALE` und `FURNITURE` machen den technischen Verkaufsauftrag lauffähig, bilden aber keine deutsche EUR-/19-%-USt-Logik ab. |
| Lösung | Der Playwright-Test erzeugt jetzt automatisch einen Ziel-vs.-Labor-Abweichungsnachweis. Der aktuelle Lauf bleibt gültig für Klickpfad, Stammdatenbedarf und Screenshot-Lernen; der deutsche Steuer-Endstand wird als eigene Setup-Aufgabe behandelt. |
| Buchwirkung | Das Buch muss zwischen Laborlauf und finalem Zielbild unterscheiden. Screenshots aus CRONUS dürfen nicht als Nachweis für `EUR` und `19 %` USt ausgegeben werden. |
| Künftige Regel | Wenn ein Buchfall fachliche Beträge, Steuer oder Währung erwartet, schreibt der Test einen Soll-Ist-Nachweis. Abweichungen werden als Setup-Lücke dokumentiert und nicht still übergangen. |

## WK-BC-O2C-009A Aktueller O2C-Laborstand: EUR geloest, Steuer offen

| Feld | Wert |
|---|---|
| Problem | Der aktuelle `UAT-O2C-001`-Lauf entspricht dem Buchziel bei Waehrung und Dimension inzwischen besser, aber noch nicht beim deutschen Steuerziel. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/evidence/uat-o2c-001/045-target-vs-labor-delta.md`, `046-o2c-lab-learning-summary.md`, `playwright/projects/fibu-book5/img/uat-o2c-001-040-zeile-artikel-rm-m100.png`, `playwright/projects/fibu-book5/img/uat-o2c-001-050-dimension-productline-machine.png`. |
| Ursache | `D10000` liefert jetzt `Currency Code = EUR`. Die CRONUS-USA-Spielwiese nutzt aber weiter Sales-Tax-Logik: Artikel `RM-M100` traegt `Tax Group = FURNITURE`, die Zeile liefert `taxPercent = 0`. |
| Loesung | Der Test klappt fuer breite Zeilenbilder die rechte FactBox ein, schreibt `039-factbox-hidden-result.json`, erzeugt eine kompakte Lernzusammenfassung und markiert den Steuer-Endstand weiter als Laborgrenze. |
| Buchwirkung | Die O2C-Anleitung darf jetzt sagen: EUR ist im Labor nachgewiesen. Sie darf nicht sagen: deutsche `19 %` USt ist nachgewiesen. Vor Buchung oder finalem Screenshot braucht es weiter deutschen VAT-Zielmandanten oder sauber dokumentiertes deutsches VAT-Setup. |
| Kuenftige Regel | Wenn ein frueherer Delta-Befund teilweise geloest wurde, muss der Test die neue Wahrheit neu schreiben und das Buch die alte Abweichung korrigieren. |

## WK-BC-O2C-009B Preview Posting erreicht, aber Inventory Posting Setup blockiert

| Feld | Wert |
|---|---|
| Problem | `Preview Posting` wird im O2C-Labor erreicht, aber Business Central zeigt `Error Messages` statt einer Postenvorschau. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/img/uat-o2c-001-060-buchungsvorschau.png`, `playwright/projects/fibu-book5/evidence/uat-o2c-001/060-preview-posting-result.json`, `playwright/projects/fibu-book5/evidence/uat-o2c-001/060-preview-posting-learning.md`, `playwright/projects/fibu-book5/img/masterdata-008-inventory-posting-setup-fra-zl-resale.png`, `playwright/projects/fibu-book5/evidence/masterdata-008/013-diagnosis.json`, `playwright/projects/fibu-book5/img/masterdata-009-inventory-posting-setup-fra-zl-resale-14140.png`, `playwright/projects/fibu-book5/evidence/masterdata-009/010-inventory-posting-setup-fit.json` |
| Situation | Verkaufsauftrag `UAT-O2C-001` ist technisch angelegt und erreicht die Buchungsvorschau-Pruefung. Danach oeffnet BC die Fehlerliste. |
| Symptom | `Error Messages` nennt `Inventory Account is missing in Inventory Posting Setup Location Code: FRA-ZL, Invt. Posting Group Code: RESALE.` |
| Ursache | Die Fehlermeldung lautet: `Inventory Account is missing in Inventory Posting Setup Location Code: FRA-ZL, Invt. Posting Group Code: RESALE.` BC prueft damit nicht nur Debitor, Artikel und Steuer, sondern auch die Lagerbuchungsmatrix fuer die Kombination aus Lagerort und Lagerbuchungsgruppe. |
| Warum BC so reagiert | Beim Buchen einer Artikelbewegung muss BC nicht nur Menge und Umsatz verarbeiten, sondern auch Bestandswerte auf Sachkonten fortschreiben. Dafuer braucht die Kombination aus Lagerort und Inventory Posting Group ein Bestandskonto. |
| Loesung | Nicht buchen und nicht mit `OK` im normalen Buchungsdialog weitergehen. `MASTERDATA-008` zeigt die Zielzeile `FRA-ZL` + `RESALE` auf Page `5826` mit leerem `Inventory Account`. `MASTERDATA-009` setzt fuer den CRONUS-Laborfit `Inventory Account = 14140`, weil vorhandene CRONUS-RESALE-Zeilen dieses Konto verwenden. |
| Pruefung nach Korrektur | `npm run fibu:uat:o2c` erneut ausfuehren. Erwartung: Die bisherige Meldung zu `Inventory Account is missing... FRA-ZL, RESALE` erscheint nicht mehr. Danach zeigt BC entweder eine echte Postenvorschau oder den naechsten fachlichen Setup-Fehler. |
| Buchwirkung | Die O2C-Anleitung braucht vor dem Buchungsschritt einen Fehler-/Pruefhinweis: Wenn die Buchungsvorschau auf `Inventory Posting Setup` stoppt, fehlt nicht der Auftrag, sondern eine Kontenfindung fuer Bestand. Leser lernen dadurch, warum Lagerort und Lagerbuchungsgruppe buchungsrelevant sind. |
| Status | Laborfix gesetzt: Ursache praktisch diagnostiziert und `Inventory Account = 14140` gesetzt; erneuter Preview-Posting-Nachweis offen |
| Kuenftige Regel | `Preview Posting` ist Pflicht vor jeder echten Buchung. Ein Preview-Fehler wird als Lernbild dokumentiert und erst fachlich geloest; er wird nicht durch zufaelliges Wegklicken oder direkte Buchung umgangen. |

## WK-BC-O2C-010 Dimension im Auftrag ist eigener Nachweis, nicht nur Stammdatenannahme

| Feld | Wert |
|---|---|
| Problem | Das Zielmodell erwartet `PRODUCTLINE = MACHINE`. `MASTERDATA-007` setzt diese Standarddimension am Artikel `RM-M100`, aber `UAT-O2C-001` weist diesen Dimensionswert im konkreten Verkaufsauftrag noch nicht nach. Gleichzeitig weist der Auftrag am Kopf `CHANNEL = B2B` nach. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/evidence/uat-o2c-001/045-target-vs-labor-delta.md` enthaelt `Dimension PRODUCTLINE: erwartet MACHINE, Labor liefert nicht nachgewiesen` und `Dimension CHANNEL: nicht im Zielvergleich, Labor liefert B2B`. Die API-Evidence `040-zeile-artikel-rm-m100-api-result.json` enthaelt `orderDimensionSetLines` mit `CHANNEL = B2B`. |
| Ursache | Eine Standarddimension am Artikel ist eine Vorgabe. Der Auftragskopf kann Debitor-/Kopfdimensionen tragen, waehrend die Artikel-/Produktliniendimension in der Zeile, im Dimensionsdialog oder spaeter in Posten nachgewiesen werden muss. |
| Loesung | Die zentrale Evidence-Logik vergleicht erwartete Dimensionen und zeigt jetzt auch Ist-Dimensionen, die nicht im Zielvergleich stehen. Der naechste O2C-Ausbau muss den Dimensionsdialog der Verkaufszeile oder eine geeignete Beleg-/Postenansicht fotografieren. |
| Buchwirkung | Das Buch muss klar trennen: Standarddimension vorbereiten, Dimension im Beleg pruefen, Dimension nach Buchung in Posten/Reporting nachweisen. |
| Kuenftige Regel | Keine Dimension gilt nur deshalb als prozessual bewiesen, weil sie an Stammdaten gesetzt wurde. Jeder Prozessfall braucht einen eigenen Dimensionsnachweis im Beleg oder in den gebuchten Posten. |

## WK-BC-O2C-011 Debitorwaehrung `EUR` ist Stammdatenlogik, nicht nur globale Waehrung

| Feld | Wert |
|---|---|
| Problem | Der Buchfall erwartet `EUR`, der CRONUS-Laborauftrag lief aber zuerst mit `USD`. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/evidence/mcp-currency/100-currencies-page.txt`, `playwright/projects/fibu-book5/evidence/mcp-currency/160-customer-invoicing-show-more.txt`, `playwright/projects/fibu-book5/evidence/mcp-currency/370-verify-persisted-show-more.txt` |
| Ursache | `EUR` war in der Waehrungsliste vorhanden. Am Debitor `D10000` war unter `Invoicing` -> `Mehr anzeigen` -> `Prices and Discounts` das Feld `Currency Code` jedoch leer. In CRONUS-USA bedeutet leer fuer Verkaufsbelege praktisch lokale Mandantenwaehrung, also USD. |
| Loesung | Per Playwright MCP wurde die Debitorenkarte `D10000` geoeffnet, der Stift `Aenderungen auf der Seite vornehmen` aktiviert, der FastTab `Invoicing` trotz Pflichtfeldhinweis geoeffnet, `Mehr anzeigen` gewaehlt und `Currency Code` als Combobox auf `EUR` gesetzt. Ein frischer Reload bestaetigt den persistenten Wert. |
| Buchwirkung | Das Buch muss im Stammdatenkapitel erklaeren, dass die Zielwaehrung fuer den O2C-Fall am Debitor gepflegt oder im Auftrag bewusst gesetzt werden muss. Nur eine vorhandene Waehrung `EUR` reicht nicht. |
| Kuenftige Regel | Bei jedem Zielwert wie Waehrung, USt oder Dimension unterscheiden: globale Einrichtung vorhanden, Stammdatenwert gepflegt, Wert im konkreten Beleg nachgewiesen. |

## WK-BC-O2C-012 `19 %` USt ist in CRONUS-USA kein einfacher Feldwert

| Feld | Wert |
|---|---|
| Problem | Nach der EUR-Korrektur zeigt ein neuer Auftrag fuer `D10000` zwar `Currency Code: EUR`, aber weiterhin keinen deutschen `19 %`-USt-Zustand. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/evidence/mcp-o2c-vat-check/060-after-price-and-tax-check.txt`, `playwright/projects/fibu-book5/evidence/mcp-tax-setup-open/01-opened-Tax-Areas.txt`, `02-opened-Tax-Groups.txt`, `03-opened-Tax-Details.txt`, `04-opened-VAT-Product-Posting-Groups.txt`, `05-opened-VAT-Business-Posting-Groups.txt`, `playwright/projects/fibu-book5/evidence/mcp-vat-posting-setup/vat-posting-setup-mcp-summary.json`, `playwright/projects/fibu-book5/evidence/mcp-tax-origin/tax-origin-mcp-summary.json` |
| Ursache | Der Auftrag zeigt Sales-Tax-Felder: `Tax Area Code` leer und `Tax Group Code = FURNITURE`. Die geoeffneten Setup-Seiten sind `Tax Areas` Page 469, `Tax Groups` Page 467 und `Tax Details` Page 468. Dort existieren US-Steuerlogiken wie GA/FL und FURNITURE, z. B. GA/FURNITURE mit `Tax Below Maximum 3,0`. Die VAT-Gruppenseiten Page 470/471 sind zwar vorhanden; Page 472 zeigt `VAT Posting Setup`, die Card Page 473 aber `VAT Calculation Type = Sales Tax`. Damit gibt es im aktuellen Labor keine belastbare deutsche 19-%-Kombination. |
| Loesung | Fuer den aktuellen MCP-Lernlauf wird die USt-Abweichung nicht durch ein willkuerliches US-Steuerfeld kaschiert. Zusaetzlich wurde die Herkunft dokumentiert: `RM-M100` liefert `Tax Group Code = FURNITURE`; `D10000` liefert `Tax Liable = checked`, `Tax Area Code = leer`, `Gen. Bus. Posting Group = DOMESTIC`, `Customer Posting Group = DOMESTIC` und `Currency Code = EUR`. Das Projekt dokumentiert: EUR ist geloest, deutsche USt bleibt Zielmandant-/VAT-Setup-Aufgabe. |
| Buchwirkung | Das Buch muss erklaeren, dass `19 %` nicht durch Eingabe eines Betrags entsteht. Fuer deutsche Zielbilder braucht der Leser VAT Business Posting Group, VAT Product Posting Group und VAT Posting Setup oder eine deutsche lokalisierte Company mit passendem Setup. |
| Kuenftige Regel | In CRONUS-USA keine finalen deutschen Steuerbilder erzeugen. Sales-Tax-Felder duerfen als Lernbefund gezeigt werden; finale USt-Screenshots brauchen deutschen Mandanten oder explizit dokumentiertes deutsches VAT-Setup. |
