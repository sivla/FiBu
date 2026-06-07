# Business Central durch Playwright lernen

Dieses Repository soll nicht nur Business-Central-Screenshots erzeugen. Es soll Business Central durch wiederholbare Nutzung erklären. Jeder automatisierte oder halbautomatisierte Klickpfad ist deshalb zugleich:

- ein technischer Playwright-Test
- eine fachliche BC-Übung
- ein Screenshot-Lieferant für das Buch
- ein Evidence-Pack-Baustein
- eine Lernspur für spätere Consultants, Key User und Autoren

FiBu Buch 5 ist der erste konkrete Lehrplan. Das Buch bestimmt, welche Prozesse zuerst geprüft werden. Business Central bestimmt im Gegentest, ob die Anleitung vollständig, korrekt und für Anfänger verständlich ist. Playwright ist das Werkzeug, mit dem diese Prüfung wiederholbar wird.

Der Arbeitsauftrag lautet:

1. Buchanleitung lesen.
2. Klickpfad in BC ausführen.
3. Fehlende Einrichtung oder Stammdaten herstellen und dokumentieren.
4. Screenshots erzeugen.
5. Sichtbare BC-Elemente fachlich erklären.
6. Fehler, Workarounds und offene Fragen dokumentieren.
7. Buchtext, Klickanleitung und Evidence Pack aktualisieren.
8. Den Lauf so hinterlassen, dass er später in einer neuen Umgebung wiederholt werden kann.

Das Projekt lernt Business Central aus zwei Quellen:

1. aus dem bestehenden Buch, das die fachliche Reihenfolge und den roten Faden vorgibt
2. aus echten Playwright-Läufen, die zeigen, welche Seiten, Schaltflächen, Felder, Hinweise und Fehlerzustände Business Central tatsächlich anzeigt

Wenn ein Screenshot eine Schaltfläche, Aktion, Infobox, Registerkarte, Feldgruppe oder Funktion zeigt, die im Buch noch nicht erklärt ist, ist das kein Randdetail. Es ist eine Fundstelle. Diese Fundstelle muss nachrecherchiert, fachlich bewertet und bei Relevanz im Buch ergänzt werden.

## Grundsatz

Ein Screenshot ist erst dann buchfähig, wenn er erklärt, was Business Central fachlich tut. Sichtbare Oberfläche allein reicht nicht.

Zu jedem relevanten Schritt werden deshalb fünf Fragen beantwortet:

| Frage | Zweck |
|---|---|
| Wo bin ich in Business Central? | Seite, Rolle, Company und fachlicher Kontext |
| Warum bin ich hier? | Prozesszweck aus Finance-, SCM- oder Projektperspektive |
| Welche Felder sind entscheidend? | Feldlogik, Pflichtfelder, abhängige Felder, Defaults |
| Was prüfe ich danach? | Kontrollliste, Posten, Bericht, Statistik oder Status |
| Was lernt der Anwender daraus? | BC-Konzept, Prozessregel oder typische Fehlerquelle |

## Anfänger-Perspektive

Der Leser wird als Anfänger gedacht. Er kennt Business Central noch nicht, verwechselt offene Belege mit gebuchten Belegen, weiß nicht, welche Felder automatisch aus Stammdaten kommen, und kann aus einem Screenshot nicht von selbst ableiten, welche Zahl später in welchem Posten landet. Genau diese Lücke muss das Buch schließen.

Jede Klickanleitung beantwortet deshalb drei Ebenen:

| Ebene | Anfängerfrage | Antwort im Buch |
|---|---|---|
| Bedienung | Was klicke oder tippe ich jetzt? | konkreter Pfad, sichtbarer Button, Feldname, Suchbegriff |
| Verständnis | Warum mache ich das? | Prozesszweck, Stammdatenlogik, Folgeeffekt |
| Kontrolle | Woran erkenne ich, dass es richtig war? | sichtbarer Wert, Status, Buchungsvorschau, Posten, Bericht, Evidence |

Wenn ein Schritt nur bedient, aber nicht erklärt wird, ist er für dieses Projekt noch nicht fertig.

## Button- und Funktionsinventar

Ein langfristiges Ziel ist, Business Central nicht nur pro Prozess zu bedienen, sondern die sichtbaren Funktionen schrittweise zu verstehen. Dazu wird aus den Klickpfaden ein Inventar aufgebaut:

| Element | Was dokumentiert wird |
|---|---|
| Seite | Name, Rolle, Prozesskontext und Aufrufweg |
| Schaltfläche/Aktion | sichtbarer Name, Menüpfad, Zweck, wann verwenden, wann nicht verwenden |
| Register/FastTab | welche Daten dort gepflegt oder geprüft werden |
| Feld | fachliche Bedeutung, Pflichtlogik, Default, Folgeeffekt |
| Infobox/FactBox | welche Zusatzinformation sie liefert |
| Benachrichtigung/Dialog | Ursache, Entscheidung, Risiko |
| Bericht/Liste | Prüfzweck und Evidence-Pack-Relevanz |

Nicht jedes UI-Element muss sofort vollständig erklärt werden. Aber jedes unbekannte relevante Element wird als offene Fundstelle erfasst.

## Recherche-Loop für Fundstellen

Wenn Playwright oder ein Screenshot etwas sichtbar macht, das im Buch noch nicht erklärt ist, gilt dieser Ablauf:

1. Fundstelle notieren: Screenshot, Seite, sichtbarer Text, Testfall, Zeitpunkt.
2. Erste Hypothese formulieren: Wofür könnte das Element fachlich stehen?
3. Primärquelle prüfen: bevorzugt Microsoft Learn, Business-Central-Hilfe oder offizielle Microsoft-Dokumentation.
4. In Business Central testen: anklicken, Folgefenster prüfen, Auswirkungen dokumentieren.
5. Entscheidung treffen: Buchergänzung, Projektnotiz, später prüfen oder bewusst ignorieren.
6. Buch aktualisieren, wenn das Element für Bedienung, Verständnis, Prüfung, Fehlerdiagnose oder Evidence Pack relevant ist.
7. Test erneut laufen lassen und Screenshot/Buchtext abgleichen.

Diese Regel ist wichtig: Das Buch folgt nicht blind dem vorhandenen Text. Es wird durch echte BC-Nutzung verbessert.

## Lernschichten je Klickanleitung

Jede bebilderte Klickanleitung soll diese Schichten enthalten:

| Schicht | Inhalt | Beispiel |
|---|---|---|
| Bedienung | konkreter Klickpfad | `Alt+Q` -> `Sales Orders` -> `New` |
| Fachlicher Zweck | warum der Schritt existiert | Auftrag ist der kaufmännische Ausgangspunkt im O2C-Prozess |
| Feldlogik | welche Werte BC ableitet oder verlangt | Debitor zieht Zahlungsbedingungen, Steuerlogik und Währung |
| Datenmodell | welche BC-Objekte betroffen sind | Sales Header, Sales Lines, Customer, Item, Dimensions |
| Buchungslogik | welche Posten später entstehen | Debitorenposten, Sachposten, USt-Posten, Artikel-/Wertposten |
| Prüfung | wie der Anwender richtig kontrolliert | Statistik, Buchungsvorschau, gebuchte Rechnung, Postenfilter |
| Fehlerdiagnose | woran ein falscher Schritt erkennbar ist | falsche USt-Gruppe, fehlende Dimension, Preisabweichung |
| Evidence | welcher Nachweis bleibt | Screenshot, Belegnummer, Postenexport, Bericht, Freigabe |

## Anfänger-Didaktik je BC-Objekt

Business Central wird im Buch nicht als Sammlung isolierter Masken erklärt, sondern als Kette aus Stammdaten, Belegen, Buchung und Posten. Jede Anleitung macht diese Kette sichtbar.

| BC-Objekt | Was Anfänger verstehen müssen |
|---|---|
| Stammdaten | Debitor, Artikel, Lagerort und Dimension sind nicht nur Listenwerte; sie steuern Felder, Konten, Steuer, Preise, Lager und Auswertungen. |
| Offener Beleg | Ein Verkaufsauftrag ist noch bearbeitbar. Er ist noch kein gebuchter Nachweis und noch keine Forderung. |
| Belegzeile | Die Zeile verbindet Artikel, Menge, Lagerort, Preis, Steuer- und Dimensionslogik. |
| Buchungsvorschau | Sie ist der sichere Halt vor dem Buchen: Was würde BC erzeugen, wenn ich jetzt buche? |
| Gebuchter Beleg | Nach dem Buchen ist der Vorgang dokumentiert; Korrekturen laufen über definierte Folgeprozesse. |
| Posten | Posten sind die prüfbare Wahrheit: Debitorenposten, Sachposten, USt-Posten, Artikelposten und Wertposten erklären die Wirkung. |
| Bericht | Berichte und Finanzberichte zeigen nur dann richtige Ergebnisse, wenn Buchung, Filter und Dimensionen stimmen. |

Die wichtigste Lernregel lautet: Ein Klick ist erst verstanden, wenn seine Folge in Beleg, Posten oder Bericht erklärt werden kann.

## Anfängerfehler als Lernmaterial

Fehler werden nicht versteckt. Sie sind besonders wertvoll, weil echte Anwender genau dort lernen.

Jeder relevante Fehler wird in vier Sätzen erklärt:

1. Was sieht der Anwender?
2. Warum passiert das in Business Central?
3. Welche Einrichtung, Stammdaten oder Bedienung fehlt?
4. Wie wird es gelöst und wie prüft man danach?

Typische Fehlerkategorien:

| Kategorie | Beispiel |
|---|---|
| falsche Seite | `Sales Orders` statt `Posted Sales Invoices`, oder umgekehrt |
| falscher Treffer | Tell-Me wählt den obersten, aber nicht den fachlich richtigen Treffer |
| fehlende Stammdaten | Artikel existiert, aber Basiseinheit oder Buchungsgruppe fehlt |
| fehlendes Setup | Auftrag läuft technisch, aber USt/Währung entsprechen nicht dem Zielmodell |
| verdeckte Feldlogik | sichtbares Feld heißt `Customer Name`, fachlich gemeint ist Debitor `D10000` |
| fehlende Dimension | Buchung ist möglich, aber Reporting nach `PRODUCTLINE` wird falsch |
| UI-Kontext | Liste, Karte, FactBox und Hilfekarte sind gleichzeitig sichtbar |

Diese Fehler gehören in `WORKAROUNDS-AND-ERRORS.md`, relevante Buchabweichungen zusätzlich in das Buch.

## Redaktionsmuster für jeden Screenshot

Für jeden Screenshot im Buch wird dieses Mini-Muster verwendet:

```markdown
![Kurzer Alt-Text](img/<dateiname>.png)

Was du im Bild siehst:
<sichtbare Seite, sichtbare Aktion, sichtbare Werte>

Warum das fachlich wichtig ist:
<BC-Konzept und Prozesszweck>

Feldlogik:
<welche Felder steuern welchen Folgeeffekt>

Prüfhinweis:
<wie der Anwender erkennt, dass der Schritt richtig war>

Typische Fehler:
<ein bis drei realistische Fehlerbilder>

Evidence Pack:
<welcher Nachweis für UAT, Revision oder Buchprojekt abgelegt wird>
```

## Playwright-Test als Lernobjekt

Ein Playwright-Test soll nicht nur `click()` und `screenshot()` enthalten. Für Buch- und UAT-Fälle dokumentiert der Testfall zusätzlich:

- Testfall-ID, zum Beispiel `UAT-O2C-001`
- Prozess, zum Beispiel Order-to-Cash
- Zielrolle, zum Beispiel Sachbearbeitung Verkauf oder Finance Review
- verwendete Company
- verwendete Testdaten
- erwartetes fachliches Ergebnis
- erzeugte Screenshots
- offene BC-Beobachtungen

Wenn Playwright beim Durchspielen eine Hürde findet, wird diese Hürde nicht nur technisch gelöst. Sie wird fachlich eingeordnet:

- Ist der Klickpfad im Buch unvollständig?
- Fehlen Testdaten?
- Ist ein BC-Setup noch nicht vorhanden?
- Ist die Oberfläche sprachlich anders als erwartet?
- Ist das ein echtes Anwenderproblem, das im Buch erklärt werden muss?
- Zeigt der Screenshot eine Funktion, die im Buch noch fehlt?
- Muss diese Funktion recherchiert und als Lerninhalt ergänzt werden?

## Beispiel: `UAT-O2C-001`

Fachlicher Zweck:

Ein Verkaufsauftrag für Debitor `D10000`, Artikel `RM-M100`, Menge `1`, Preis `68.000 EUR`, USt `19 %` und Dimension `PRODUCTLINE = MACHINE` zeigt den Standardablauf von Auftragserfassung bis prüfbarer Steuer- und Dimensionslogik.

Was dabei gelernt werden soll:

- Debitoren steuern Zahlungsbedingungen, Steuerlogik und Rechnungsempfänger.
- Artikel steuern Beschreibung, Basiseinheit, Lager- und Erlöskontenlogik.
- Menge und Preis steuern Zeilenbetrag, Statistik und spätere Buchungswerte.
- USt ergibt sich aus Kombinationen von Debitor, Artikel und Buchungsmatrix.
- Dimensionen machen Erlöse, Kosten und Berichte auswertbar.
- Vor dem Buchen muss geprüft werden, ob Betrag, USt, Dimension und Verfügbarkeit plausibel sind.

Mindestens zu erklärende Screenshots:

| Screenshot | Lernziel |
|---|---|
| Auftrag leer | Unterschied zwischen Kopf und Zeilen verstehen |
| Debitor ausgewählt | automatische Kopfdaten und Debitorenlogik sehen |
| Artikelzeile erfasst | Menge, Preis, Artikelbeschreibung und Zeilenbetrag verstehen |
| Dimension gesetzt | Dimensionspflicht und Berichtbarkeit verstehen |
| Statistik/Buchungsvorschau | Kontrolle vor Buchung lernen |
| Gebuchter Nachweis | Beleg- und Postenspur verstehen |

## Zielbild

Am Ende soll ein Leser nicht nur wissen, welche Schaltfläche er anklicken muss. Er soll verstehen:

- welche Business-Central-Seite welchen Zweck hat
- welche Stammdatenwerte Folgeeffekte auslösen
- welche Fehler früh sichtbar sind
- welche Posten und Berichte nach der Buchung relevant sind
- welche Nachweise ein Evidence Pack vollständig machen

Für das Projekt selbst gilt dieselbe Messlatte: Eine BC-Funktion gilt nicht als verstanden, nur weil sie im Buch oder in Microsoft Learn steht. Sie gilt als verstanden, wenn sie in der Sandbox sichtbar war, mit Playwright oder im dokumentierten Lauf durchgespielt wurde, und ihre Wirkung im Buch oder Projekt erklärt ist.

Damit wird das Buch kein Screenshot-Album, sondern ein nachvollziehbares Business-Central-Lern- und Projektmanual.
