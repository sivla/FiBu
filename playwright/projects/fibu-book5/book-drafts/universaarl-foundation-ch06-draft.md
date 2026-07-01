# Universaarl Foundation - Kapitel 6 Draft

Status: `bookdraft-foundation-partial`

Instanz: `playthru`

Zielcompany: `UNIVERSAARL-DE`

Die Company `UNIVERSAARL-DE` ist vorhanden. Die Universaarl GmbH wird in dieser Company aufgebaut. Die Foundation ist noch nicht buchungsbereit: Einige Bausteine sind vorhanden, andere bleiben bewusst offen, bis sie auf der passenden Seite sicher eingerichtet und danach wieder sichtbar geprueft werden koennen.

## Foundation: die Grundlage vor dem ersten Beleg

Bevor in Business Central ein Verkaufsauftrag, eine Einkaufsrechnung oder eine Zahlung gebucht wird, braucht die Company eine fachliche Grundlage. Diese Grundlage besteht nicht aus einem einzigen Schalter. Sie setzt sich aus Firmendaten, Kontenplan, Perioden, Nummernserien, Buchungsgruppen, USt-Setup, Dimensionen und wenigen Kontrollregeln zusammen.

Fuer die Universaarl GmbH entsteht diese Grundlage in der Company `UNIVERSAARL-DE`. Die Company wird nicht aus einer fertigen CRONUS-Demofirma als Zielwelt uebernommen. Demodaten sind zum Lernen einzelner Funktionen hilfreich, aber sie enthalten fremde Kunden, Artikel, Konten, Buchungsgruppen und Beispielbelege. Fuer eine durchgehende Buchfallstudie ist es sauberer, die Zielcompany kontrolliert aufzubauen.

Die Reihenfolge ist wichtig:

1. Company anlegen.
2. Company Information pflegen.
3. Kontenplan und Buchungsperioden pruefen.
4. Nummernserien einrichten.
5. Buchungsgruppen und Buchungsmatrix pruefen.
6. USt-Setup einrichten und abgrenzen.
7. Dimensionen und Dimensionswerte anlegen.
8. Erst danach Stammdaten und Belege anlegen.

Diese Reihenfolge verhindert typische Anfaengerfehler. Ein Debitor ohne Debitorenbuchungsgruppe kann spaeter nicht sauber Forderungen erzeugen. Ein Artikel ohne passende Produktbuchungsgruppe kann im Verkauf oder Einkauf eine falsche Kontenfindung ausloesen. Eine Nummernserie ohne klare Logik macht Belege schwer nachvollziehbar. Eine Dimension, die erst nach der Buchung eingefuehrt wird, fehlt auf alten Posten.

Der aktuelle Stand ist ein Zwischenstand. Die Company, die wichtigsten Starterkonten, mehrere Nummernserien, die Debitoren- und Kreditorenbuchungsgruppe `INLAND`, die Geschaeftsbuchungsgruppe `INLAND`, die Produktbuchungsgruppe `WAREN` sowie die Dimensionen `PRODUCTLINE`, `COSTCENTER` und `CHANNEL` sind als Grundlage sichtbar. Die Buchungsmatrix fuer `INLAND` + `WAREN`, die USt-Buchungsmatrix, Lagerbuchung, Bank, Anlagen, globale Dimensionen und Standarddimensionen sind noch keine fertigen Buchungsgrundlagen.

Das bedeutet fuer den naechsten Schritt: Kunden, Lieferanten, Artikel und Lagerorte werden noch nicht angelegt. Zuerst werden ihre Listen, Karten, Pflichtfelder und Vorlagen nur angesehen. So erkennt man, welche Felder spaeter beim Anlegen wichtig sind, ohne bereits einen unvollstaendigen Stammdatensatz zu erzeugen.

## Company Information

Die Seite `Unternehmensdaten` enthaelt den rechtlichen und organisatorischen Kontext der Company. Hier stehen Name, Adresse, Land/Region, Kommunikationsdaten und spaeter steuerliche Angaben. Diese Felder sind keine Buchung, aber sie beeinflussen Belege, Berichte und Ausgaben.

Fuer Universaarl werden diese Daten erst gepflegt, nachdem `UNIVERSAARL-DE` sichtbar existiert. Vorher wird kein Beleg erstellt und kein Setup abgeschlossen.

Wichtige Felder:

| Feld | Warum es wichtig ist |
| --- | --- |
| Name | Erscheint in Belegen, Ausgaben und Berichten. |
| Adresse / PLZ / Ort | Bildet den Unternehmenssitz fuer Belege und Berichte ab. |
| Land/Region Code | Beeinflusst landesspezifische Logik und Steuerkontext. |
| VAT Registration No. / USt-IdNr. | Wird erst gesetzt, wenn die steuerliche Zielbasis klar ist. |
| Bankdaten | Werden erst im Bank- und Zahlungsblock gepflegt. |

Screenshot-Ziel:

- Company Information vor der Pflege.
- Company Information nach der Pflege mit sichtbarem Speichern-Status.
- Keine Zwischenbilder mit `Wird gespeichert ...` als fertiger Beleg.

## Kontenplan und Buchungsperioden

Der Kontenplan ist die Struktur des Hauptbuchs. Er enthaelt Sachkonten fuer Forderungen, Verbindlichkeiten, Umsatz, Aufwand, Bank, Anlagen, Lager und Steuern. Ein Konto ist nicht dasselbe wie ein Debitor oder Kreditor. Debitoren und Kreditoren sind Nebenbuchstammdaten; die Buchungsgruppen verbinden sie spaeter mit Sachkonten.

Buchungsperioden legen fest, welche Zeitraeume im System fachlich bebuchbar sind. Fuer die ersten Uebungen muss klar sein, welches Arbeitsdatum verwendet wird und ob dieses Datum in einer offenen Periode liegt.

Vor dem ersten Posting muss mindestens klar sein:

- welches Arbeitsdatum genutzt wird,
- ob die Periode offen ist,
- welche Sachkonten fuer die wichtigsten Prozesse bereitstehen,
- ob direkte Buchung auf ein Konto erlaubt ist oder nur ueber Nebenbuchprozesse erfolgen soll.

## Nummernserien

Nummernserien erzeugen nachvollziehbare Nummern fuer Stammdaten, Belege und Journale. Eine Verkaufsrechnung, eine Einkaufsrechnung, ein Artikel oder eine Anlagenkarte sollte nicht zufaellig benannt werden. Die Nummer hilft spaeter beim Suchen, Abstimmen und Erklaeren.

Typische Nummernserien fuer die Universaarl-Grundlage:

| Bereich | Beispielhafte Logik | Warum |
| --- | --- | --- |
| Debitoren | `CUST-...` oder fachlich deutsche Codes | Kunden eindeutig wiederfinden. |
| Kreditoren | `VEND-...` | Lieferanten und OP-Ausgleich nachvollziehen. |
| Artikel | `ITEM-...` | Lager, Verkauf, Einkauf und Fertigung verbinden. |
| Verkaufsbelege | eigene Serien fuer Auftrag/Rechnung/Gutschrift | Belegfamilien getrennt halten. |
| Einkaufsbelege | eigene Serien fuer Bestellung/Rechnung/Gutschrift | P2P-Spur nachvollziehbar machen. |
| Journale | Dokumentnummern je Buchungsfamilie | G/L Entries spaeter erklaeren. |

Auf der Seite `Nummernserien` sind besonders wichtig:

- Code,
- Startnummer,
- Endnummer,
- letzte verwendete Nummer,
- Standardnummern erlaubt ja/nein,
- manuelle Nummern erlaubt ja/nein,
- Beziehungen zwischen Nummernserien.

Bevor ein Prozesskapitel Belege erzeugt, muss die passende Nummernserie sichtbar und erklaerbar sein.

Auf der Nummernserienseite reichen Startnummer und Endnummer allein nicht immer aus. Die Checkbox `Standardnr.` steuert, ob Business Central automatisch die naechste Nummer aus dieser Serie vergeben darf. Die Checkbox `Manuelle Anz.` steuert, ob der Benutzer eine Nummer selbst eingeben darf. Fuer Kreditoren ist das wichtig: Wenn `U-VEND` zwar als Nummernserie im Einkaufssetup steht, aber weder automatische noch manuelle Nummernvergabe sauber erlaubt ist, kann eine neue Kreditorenkarte schon beim Speichern blockieren.

Bei Listen mit Checkboxen muss man besonders genau arbeiten. Die markierte Zeile, die sichtbare Checkbox und der tatsaechlich gespeicherte Feldwert muessen zusammenpassen. Ein Klick auf eine scheinbar passende Checkbox ist kein Erfolg, solange die Seite nach erneutem Oeffnen nicht denselben Wert zeigt. Fuer `U-VEND` bleibt deshalb zuerst die sichere Routenfrage offen: Die Standardnummern sollen erst aktiviert werden, wenn klar ist, ob die Aenderung ueber die Liste, eine Karte, Personalisierung oder Seitenueberpruefung eindeutig dem Kreditoren-Nummernserienkopf zugeordnet werden kann.

Business Central hilft bei solchen Fragen mit zwei einfachen Mitteln. Wenn man mit der Maus ueber eine Spaltenueberschrift oder einen Button faehrt, erscheint oft ein Tooltip. Bei `Manuelle Anz.` beschreibt der Tooltip, dass Nummern manuell eingegeben werden koennen, statt automatisch aus der Nummernserie zu kommen. Fuer technische Kontrolle gibt es die Seitenueberpruefung mit `Strg + Alt + F1`. Dort sieht man zur Seite `Nummernserie` die Page `No. Series`, die Tabelle `No. Series` und technische Felder wie `Default Nos.` und `Manual Nos.`. Diese Ansicht hilft beim Verstehen der Oberflaeche. Sie ersetzt aber nicht die fachliche Kontrolle: Nach einer Aenderung muss die Nummernserie erneut geoeffnet werden, und derselbe Wert muss in derselben Zeile wieder sichtbar sein.

Bei Zeilenmenues ist besondere Vorsicht noetig. Ein Menue kann sich oeffnen, waehrend Business Central den Fokus auf eine andere Zeile setzt. Dann sieht man zwar ein Menue, aber nicht zwingend das Menue zur Zeile, die man eigentlich bearbeiten wollte. Deshalb gehoert zu jeder Nummernserien-Aenderung ein sichtbarer Vorher-Zustand, ein sichtbarer Nachher-Zustand und ein erneuter Oeffnungsnachweis.

Fuer die Universaarl GmbH werden die ersten Stammdaten mit lesbaren Codes aufgebaut. Ein Lieferant kann zum Beispiel `U-VEND-100` heissen. Damit Business Central so eine Nummer akzeptiert, muss die Nummernserie `U-VEND` manuelle Nummern erlauben. Dafuer ist die Spalte `Manuelle Anz.` zustaendig. Die automatische Vergabe ist ein anderes Prinzip: Dann wuerde Business Central selbst die naechste Nummer aus der Serie ziehen, und dafuer waere `Standardnr.` wichtig. Beide Wege sind moeglich, aber sie sollten nicht vermischt werden. Fuer den ersten Lieferanten ist zuerst die manuelle Nummernvergabe der passende Schritt.

## Buchungsgruppen und Buchungsmatrix

Buchungsgruppen beantworten die Frage: Auf welche Sachkonten bucht Business Central, wenn ein Beleg gebucht wird?

Business Central verwendet dafuer mehrere Ebenen:

- allgemeine Geschaeftsbuchungsgruppen fuer Debitoren und Kreditoren,
- allgemeine Produktbuchungsgruppen fuer Artikel, Ressourcen und Sachkontozeilen,
- Debitoren- und Kreditorenbuchungsgruppen fuer Forderungen und Verbindlichkeiten,
- Lagerbuchungsgruppen fuer Lagerwert,
- Bankkontobuchungsgruppen fuer Bankbuchungen,
- Anlagenbuchungsgruppen fuer Anlagevermoegen,
- USt-Geschaefts- und USt-Produktbuchungsgruppen fuer Umsatzsteuer/Vorsteuer.

Die allgemeine Buchungsmatrix verbindet Geschaefts- und Produktseite. Erst diese Kombination bestimmt viele Ertrags-, Aufwands- und Wareneinsatzkonten.

Ein typischer Fehler ist, nur den Debitor oder Artikel anzulegen und dann direkt zu buchen. Der Beleg kann dann in der Vorschau oder beim Buchen scheitern, weil eine Kombination in der Buchungsmatrix fehlt.

Vor dem ersten Verkaufs- oder Einkaufsbeleg muss deshalb sichtbar sein:

- welche Geschaeftsbuchungsgruppe der Kunde oder Lieferant hat,
- welche Produktbuchungsgruppe der Artikel hat,
- welche Matrixzeile beide Gruppen verbindet,
- welche Sachkonten dort eingetragen sind.

## USt-Setup

USt wird in Business Central nicht durch einen freien Prozentwert auf der Belegzeile geloest. Die Steuerlogik entsteht aus USt-Geschaeftsbuchungsgruppe, USt-Produktbuchungsgruppe und der USt-Buchungsmatrix.

Fuer deutsche 19 Prozent darf das Buch erst dann einen belastbaren Zielnachweis formulieren, wenn alle folgenden Punkte in `UNIVERSAARL-DE` sichtbar sind:

- USt-Geschaeftsbuchungsgruppe,
- USt-Produktbuchungsgruppe,
- USt-Buchungsmatrix mit Prozent, Berechnungsart und Konten,
- Belegvorschau,
- USt-Posten,
- Sachposten.

Vorher bleibt die Aussage allgemein: Business Central kann USt ueber Posting Groups und VAT Posting Setup berechnen und buchen. Ob die Universaarl-Company korrekt fuer deutsche 19 Prozent eingerichtet ist, entscheidet erst der spaetere Setup- und Posting-Nachweis.

## Dimensionen

Dimensionen sind Auswertungsachsen. Sie ersetzen keine Sachkonten. Ein Sachkonto sagt, welche Art von Wert gebucht wurde. Eine Dimension sagt, aus welcher fachlichen Perspektive der Wert ausgewertet werden soll.

Fuer Universaarl sind als erste Dimensionen sinnvoll:

| Dimension | Zweck |
| --- | --- |
| `PRODUCTLINE` | Produktlinie oder Leistungsart auswerten. |
| `CHANNEL` | Vertriebskanal oder Prozesskanal trennen. |
| `COSTCENTER` | Kostenstellen und Verantwortungsbereiche abbilden. |

Dimensionen koennen auf Stammdaten, Belegen, Journalzeilen und Posten wirken. Fuer das Buch ist wichtig, nicht nur die Dimension anzulegen, sondern spaeter zu zeigen, wo sie im gebuchten Posten sichtbar wird.

## Journale: Check, Preview und Post

Journale sind Arbeitsblaetter fuer Buchungen. Je nach Journalart entstehen andere Posten. Ein allgemeines Journal kann Sachposten erzeugen. Ein Zahlungsjournal kann Bank-, Debitoren- oder Kreditorenposten betreffen. Ein Artikeljournal beeinflusst Artikel- und Wertposten. Ein Anlagenjournal betrifft Anlagenposten und Sachposten.

Drei Aktionen muessen getrennt verstanden werden:

| Aktion | Wirkung |
| --- | --- |
| Check / Pruefen | Sucht Fehler, ohne zu buchen. |
| Preview Posting / Buchungsvorschau | Zeigt erwartete Posten, ohne zu buchen. |
| Post / Buchen | Erzeugt echte Posten und veraendert den Datenbestand. |

Ein Anfaenger sollte nie aus Gewohnheit auf `Buchen` klicken. Der sichere Weg ist: Pflichtfelder pruefen, Fehler lesen, Vorschau ansehen, erwartete Posten verstehen, erst dann bewusst buchen.

## Einstiegskontrolle vor dem ersten Prozess

Vor dem ersten O2C-, P2P-, Inventory-, Payment- oder Fixed-Assets-Prozess braucht die Universaarl-Company eine klare Einstiegskontrolle:

| Kontrollpunkt | Erwartung |
| --- | --- |
| Company | `UNIVERSAARL-DE` ist sichtbar und aktiv. |
| Company Information | Universaarl GmbH ist gepflegt. |
| Nummernserien | relevante Serien fuer Stammdaten und Belege sind sichtbar. |
| Kontenplan | benoetigte Sachkonten sind vorhanden und erklaerbar. |
| Buchungsgruppen | Debitor/Kreditor/Artikel/Bank/Anlage koennen auf Konten finden. |
| USt-Setup | steuerliche Kombinationen sind sichtbar; 19 Prozent erst nach Nachweis. |
| Dimensionen | erste Auswertungsachsen sind angelegt. |
| Screenshot-QA | Bild zeigt nicht nur einen Code, sondern den fachlich wichtigen Bereich. |

Diese Kontrolle ist noch nicht vollstaendig bestanden. Fuer Universaarl sind einzelne Bausteine schon sichtbar, aber die Company ist noch nicht bereit fuer Belegvorschau oder Buchung. Die Buchungsmatrix `INLAND` + `WAREN` ist noch nicht gespeichert, die USt-Buchungsmatrix ist noch nicht korrekt belegt, und Standarddimensionen gehoeren erst auf konkrete Stammdaten. Vorher entsteht bei einem Beleg oft nur ein technischer Fehler, der fuer den Leser schwer einzuordnen ist.

## Zielbilder fuer die spaeteren Screenshots

Die Foundation-Screenshots sollen nicht nur zeigen, dass eine Seite offen war. Sie muessen zeigen, was der Leser erkennen soll.

| Screenshot | Wichtiger sichtbarer Bereich |
| --- | --- |
| Mandantenliste | `UNIVERSAARL-DE`, `Neu`, Pfeil neben `Neu`, `Neues Unternehmen erstellen` im Dropdown. |
| Company Information | Name, Adresse, Land/Region, Speicherstatus. |
| Nummernserien | Code, Startnummer, letzte Nummer, manuelle Nummern. |
| Buchungsmatrix | Geschaeftsgruppe, Produktgruppe, Sachkonten. |
| USt-Buchungsmatrix | USt-Gruppen, Prozent, Berechnungsart, Konten. |
| Dimensionen | Dimension Code und Werte. |
| Journalvorschau | erwartete Postenarten vor dem Buchen. |

Wenn ein Screenshot nur eine schmale Code-Spalte zeigt und die fachlich entscheidenden Felder fehlen, ist er fuer das Buch nicht ausreichend. Dann muss die Karte vergroessert, ein FastTab aufgeklappt, ein FactBox-Bereich geoeffnet oder ein neuer Screenshot mit besserem Ausschnitt erstellt werden.

## UAT-Verknuepfung

Die Foundation-Strecke bereitet diese UAT-Faelle vor:

- `UAT-W1-001`: Company Information.
- `UAT-W1-002`: Nummernserien.
- `UAT-W1-003`: Buchungsgruppen.
- `UAT-W1-004`: USt/VAT.
- `UAT-W1-005`: Dimensionen.

Diese UAT-Faelle werden erst ausfuehrbar, wenn `UNIVERSAARL-DE` existiert und der jeweilige Setup-Schritt in Business Central sichtbar bearbeitet werden kann.

## Naechste praktische Reihenfolge

1. Masterdata-Seiten nur lesend oeffnen: Debitoren, Kreditoren, Artikel und Lagerorte.
2. Pruefen, welche Karten, Vorlagen, FastTabs und Pflichtfelder Business Central anbietet.
3. Keine neuen Stammdaten speichern, solange Pflichtfelder, Vorlagenlogik und Abbruchweg nicht klar sind.
4. Danach entscheiden, welcher erste Datensatz kontrolliert angelegt werden darf.
5. Belegvorschau und Buchung bleiben gesperrt, bis Stammdaten, Buchungsmatrix, USt und Postenspur vorbereitet sind.

## Erste Sicht auf Stammdatenlisten

Nach der Foundation-Pruefung oeffnen wir die wichtigsten Stammdatenbereiche zunaechst nur lesend: Debitoren, Kreditoren, Artikel und Lagerorte. Diese Seiten sind die Einstiegspunkte fuer Kunden, Lieferanten, Produkte und Lagerstruktur.

Die Listen sind in `UNIVERSAARL-DE` noch leer. Das ist fuer eine frisch aufgebaute Company normal. Business Central zeigt oben jeweils die Aktion `Neu`, daneben weitere Befehle und in der Mitte die leere Liste. Bei Debitoren, Kreditoren und Artikeln erscheint ausserdem ein Hinweis zur Datenmigration. Dieser Hinweis bedeutet nicht, dass Daten fehlen, die sofort importiert werden muessen. Er erinnert nur daran, dass Business Central Stammdaten auch aus anderen Quellen uebernehmen kann.

Auf den Seiten sieht man schon wichtige Unterschiede:

| Seite | Woran man sie erkennt | Warum sie wichtig ist |
| --- | --- | --- |
| Debitoren | Spalten wie `Nr.`, `Name`, `Lagerortcode`, `Telefonnr.`, `Kontakt` und eine FactBox mit Verkaufsstatistik | Debitoren sind Kunden. Ueber sie entstehen spaeter Forderungen, Verkaufsbelege und Debitorenposten. |
| Kreditoren | Spalten wie `Nr.`, `Name`, `Suchbegriff`, Salden und eine FactBox mit Einkaufsstatistik | Kreditoren sind Lieferanten. Ueber sie entstehen spaeter Verbindlichkeiten, Einkaufsbelege und Kreditorenposten. |
| Artikel | Spalten wie `Nr.`, `Beschreibung`, `Art`, Lagerbestand, Basiseinheit, Einstandspreis und VK-Preis | Artikel verbinden Verkauf, Einkauf, Lager, Planung und spaeter Fertigung oder Service. |
| Lagerorte | Spalten `Code` und `Name` | Lagerorte trennen Bestandsorte. Sie werden spaeter fuer Wareneingang, Versand, Umlagerung und Lagerbewertung wichtig. |

Die Aktion `Neu` ist auf allen vier Seiten sichtbar. Sie wird noch nicht verwendet. Ein neuer Datensatz sollte erst angelegt werden, wenn klar ist, welche Vorlage Business Central anbietet, welche Felder Pflichtfelder sind und welche Buchungsgruppen spaeter die Kontenfindung steuern. Sonst entsteht schnell ein unvollstaendiger Kunde, Lieferant oder Artikel, der beim ersten Beleg einen schwer verstaendlichen Fehler ausloest.

Die eingeblendeten Info-Karten und Teaching-Tips sind hilfreich fuer die Orientierung. Fuer ein endgueltiges Buchbild sollten sie aber entweder bewusst erklaert oder vor dem Screenshot geschlossen werden, damit wichtige Spalten und Felder nicht verdeckt werden.

Der erste einfache Stammdatensatz ist ein Lagerort. Ein Lagerort trennt Bestandsorte, ohne sofort einen Kunden, Lieferanten oder Artikel mit Vorlagen- und Buchungsgruppenlogik anzulegen. Fuer die Universaarl GmbH wird zuerst `SAAR-HL` mit dem Namen `Saarbruecken Hauptlager` angelegt.

Auf der Seite `Lagerorte` sind dafuer nur zwei Felder wichtig:

| Feld | Bedeutung |
| --- | --- |
| `Code` | Kurzbezeichnung des Lagerorts. Dieser Code erscheint spaeter in Artikel-, Einkaufs-, Verkaufs- und Lagerzeilen. |
| `Name` | Lesbarer Name des Lagerorts. Er hilft, den Code im Alltag zu verstehen. |

Andere Felder auf der Lagerortkarte koennen spaeter wichtig werden, zum Beispiel fuer Wareneingang, Warenausgang, Lagerplaetze oder erweiterte Warehouse-Prozesse. Sie werden beim ersten Lagerort noch nicht veraendert. So bleibt der erste Stammdatensatz klein und kontrollierbar.

Nach dem erneuten Oeffnen der Seite `Lagerorte` ist `SAAR-HL` in der Liste sichtbar. Damit ist der Lagerort als einfacher Stammdatensatz vorhanden. Das reicht fuer eine erste Orientierung in Lager- und Artikelprozessen, aber noch nicht fuer Warehouse-Prozesse. Wareneingangspflicht, Warenausgangspflicht, Lagerplatzpflicht, Lagerbuchungseinrichtung und Artikelbewegungen werden in eigenen Schritten eingerichtet und geprueft.

Debitoren, Kreditoren und Artikel folgen erst danach. Dort koennen Vorlagen, Buchungsgruppen, USt-Gruppen und weitere Pflichtfelder sofort fachliche Wirkung haben. Deshalb werden diese Stammdaten zuerst mit einer eigenen Vorlagen- und Pflichtfeldpruefung vorbereitet.

Bei Debitoren, Kreditoren und Artikeln fuehrt `Neu` nicht zu einer einfachen Listenzeile. Business Central oeffnet jeweils eine Karte. Auf der Debitorenkarte und der Kreditorenkarte sieht man oben die Aktion `Vorlage anwenden`. Im Bereich `Allgemein` stehen `Nr.` und `Name`; beim Namen ist ein roter Stern sichtbar. Der Stern zeigt: Ohne Name ist der Stammdatensatz nicht vollstaendig.

Die Artikelkarte ist umfangreicher. Neben `Nr.` und `Beschreibung` sieht man `Basiseinheit`, `Art`, Lagerbestandsfelder und mehrere FastTabs wie `Einstandspreise und Buchung`, `Beschaffung`, `Planung`, `Artikelverfolgung`, `Lager` und `Indirekte Steuer`. Deshalb ist ein Artikel fachlich riskanter als ein einfacher Kunde: Schon die Basiseinheit, die Artikelart und spaetere Buchungsgruppen beeinflussen Einkauf, Verkauf, Lager und Wertposten.

Fuer den ersten gespeicherten Debitor wird deshalb zuerst eine sehr kleine Feldliste festgelegt. `Vorlage anwenden` wird nicht nebenbei geklickt. Wenn eine Vorlage verwendet wird, muss vorher klar sein, welche Felder sie setzt und welche Buchungsgruppen oder Zahlungsbedingungen dadurch entstehen. Kreditoren und Artikel bleiben bis dahin gesperrt.

Der erste Debitor der Universaarl GmbH heisst `U-CUST-100` mit dem Namen `Universaarl Kunde 100`. Auf der Seite `Debitoren` wird zuerst `Neu` gewaehlt. Business Central oeffnet die Debitorenkarte. Im Bereich `Allgemein` werden nur `Nr.` und `Name` gefuellt. Die Aktion `Vorlage anwenden` bleibt unberuehrt.

Nach dem erneuten Oeffnen der Debitorenliste ist `U-CUST-100` sichtbar. Damit ist der erste Kunde als Stammdatensatz vorhanden. Das bedeutet noch nicht, dass schon eine Verkaufsrechnung gebucht werden kann. Auf der Debitorenkarte bleiben die Bereiche `Fakturierung` und `Zahlungen` eigene Kontrollpunkte: Dort gehoeren spaeter Buchungsgruppe, Geschaeftsbuchungsgruppe, USt-Gruppe und Zahlungsbedingungen hin. Erst wenn diese Felder bewusst gesetzt und mit einer Belegvorschau geprueft sind, kann aus dem Debitor ein sauberer O2C-Prozess entstehen.

Beim ersten Kreditor zeigt Business Central eine wichtige Nummernserienregel. Die Kreditorenkarte oeffnet sich ueber `Neu`, aber die Nummer kann nicht beliebig verwendet werden. Wenn in der Nummernserie `U-VEND` die Option fuer manuelle Nummern nicht aktiv ist, darf `U-VEND-100` nicht direkt in das Feld `Nr.` eingetragen werden. Wenn die Option fuer Standardnummern nicht aktiv ist, vergibt Business Central auch nicht automatisch die naechste Nummer.

Darum ist die Kreditoranlage an dieser Stelle noch kein Stammdaten-Erfolg, sondern ein sauberer Setup-Hinweis: Vor dem ersten Lieferanten muss die Nummernserie `U-VEND` so eingestellt sein, dass sie zur gewuenschten Arbeitsweise passt. Fuer eine automatische Vergabe braucht die Serie eine Standardnummernlogik. Fuer bewusst lesbare Buchcodes wie `U-VEND-100` muss die manuelle Nummernvergabe erlaubt sein. Erst danach wird der erste Kreditor erneut angelegt und wieder ueber die Kreditorenliste geprueft.

Fuer Anfaenger ist diese Stelle wichtig, weil der Fehler nicht auf der Kreditorenkarte geloest wird. Die Karte zeigt nur die Folge: Die Nummer kann nicht gespeichert werden. Die Ursache liegt in der Nummernserie. Der richtige Weg ist deshalb: erst Nummernserie pruefen, dann Kreditor anlegen, danach die Liste erneut oeffnen und den gespeicherten Kreditor sichtbar kontrollieren.

Auf der Seite `Nummernserie` sieht man bei `U-VEND` die Start- und Endnummern fuer Lieferanten. Daneben stehen eigene Kontrollkaestchen. `Standardnr.` steuert, ob Business Central automatisch die naechste Nummer vergibt. `Manuelle Anz.` steuert, ob man eine Nummer selbst eintippen darf. Beide Felder gehoeren zur Nummernserie selbst, nicht zur Kreditorenkarte.

Eine Aenderung an diesen Kontrollkaestchen zaehlt erst dann als erledigt, wenn sie nach erneutem Oeffnen der Nummernserie noch sichtbar ist. Fuer den geplanten Kreditor `U-VEND-100` ist vor allem `Manuelle Anz.` wichtig, weil die Nummer bewusst eingetippt werden soll. In der aktuellen Universaarl-Ansicht ist diese Option fuer `U-VEND` noch nicht verlaesslich aktiv. Deshalb bleibt der erste Kreditor gesperrt, bis diese Nummernserienroute sauber kontrolliert wurde. Das ist ein guter Sicherheitsmechanismus: Business Central verhindert so, dass Stammdaten mit einer unklaren Nummernlogik entstehen.

Solange diese Option nicht nach erneutem Oeffnen sichtbar aktiv ist, wird kein Lieferant angelegt. Die Stammdatenbasis wird zuerst sortiert: Der Lagerort `SAAR-HL` ist vorhanden, der Debitor `U-CUST-100` ist vorhanden, der erste Kreditor wartet auf eine saubere Nummernserie, und Artikel brauchen wegen Basiseinheit, Artikelart, Lager- und Buchungsfeldern einen eigenen Kontrollschritt. So bleibt die Einrichtung nachvollziehbar und es entstehen keine Stammdaten, deren spaetere Buchungswirkung unklar ist.
