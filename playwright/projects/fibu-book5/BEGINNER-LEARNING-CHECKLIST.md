# Anfänger-Lerncheckliste Business Central

Diese Checkliste sorgt dafür, dass die Buchanleitungen Business Central erklären und nicht nur Klickfolgen sammeln.

## Definition: Anfänger versteht den Schritt

Ein Schritt gilt erst als verstanden, wenn der Leser beantworten kann:

| Frage | Erwartete Antwort |
|---|---|
| Wo bin ich? | Business-Central-Seite, Company, offener oder gebuchter Zustand |
| Was mache ich? | konkreter Klick, Feld, Aktion oder Filter |
| Warum mache ich das? | Prozesszweck und fachliche Wirkung |
| Welche Daten steuern den Schritt? | Stammdaten, Buchungsgruppen, Dimensionen, Lagerort, Preise |
| Was prüfe ich danach? | sichtbarer Wert, Status, Buchungsvorschau, Posten oder Bericht |
| Was kann schiefgehen? | typisches Fehlerbild, Ursache und Lösung |

## Mindestinhalt je Screenshot

Jeder Buch-Screenshot bekommt:

- `Was du im Bild siehst`
- `Warum das fachlich wichtig ist`
- `Feldlogik`
- `Prüfhinweis`
- `Typische Fehler`
- `Evidence Pack`

## Aktueller Lernfall: UAT-O2C-001

| Bereich | Gelernt |
|---|---|
| Suche | `Alt+Q` ist gut für Anfänger, aber Treffer müssen bewusst gewählt werden. |
| Offene Belege | `Sales Orders` sind bearbeitbare Aufträge; gebuchte Verkaufsrechnungen sind Nachweise nach der Buchung. |
| Auftragskopf | `Customer Name` ist sichtbar, fachlich muss Debitor `D10000` geprüft werden. |
| Auftragszeile | `RM-M100`, Menge, Lagerort, Einheit, Preis und Steuergruppe bestimmen die spätere Wirkung. |
| Setup-Lücke | Der aktuelle Laborauftrag liefert `EUR`, aber weiter `0 %` Tax; das ist kein Bedienfehler, sondern fehlender deutscher Steuerfit. |
| Inventory Posting Setup | `MASTERDATA-008` zeigt `FRA-ZL` + `RESALE` mit leerem `Inventory Account`; `MASTERDATA-009` setzt im CRONUS-Labor `14140`. Wenn `Preview Posting` auf Inventory Posting Setup stoppt, ist nicht der Auftrag kaputt, sondern die Kontenfindung fuer den Lagerwert fehlt. Nach dem Fit zeigt die Preview echte Vorschauarten: Sachposten, Debitorenposten, Artikelposten, detaillierte Debitorenposten und Wertposten. |
| Cleanup | Laboraufträge werden nach Screenshots entfernt, weil BC Entwürfe automatisch speichert. |

## Nächste Lernfragen

| Priorität | Frage |
|---:|---|
| 1 | Was bedeuten `G/L Entry`, `Cust. Ledger Entry`, `Item Ledger Entry`, `Detailed Cust. Ledg. Entry` und `Value Entry` in der O2C-Buchungsvorschau? |
| 2 | Welche Einrichtung macht aus dem CRONUS-Labor einen deutschen `19 %`-Fall? |
| 3 | Wie wird `PRODUCTLINE = MACHINE` nach dem Buchen in Sachposten, Wertposten oder Reporting wiedergefunden? |
| 4 | Welche Aktionen `Release`, `Post`, `Ship`, `Invoice` sieht der Anwender und wann darf er sie verwenden? |

## Regel für Fehler

Jeder Fehler wird als Lerninhalt dokumentiert:

1. Symptom: Was sieht der Anwender?
2. Ursache: Warum reagiert Business Central so?
3. Lösung: Welcher Klick, welches Stammdatum oder welches Setup behebt das Problem?
4. Prüfung: Woran sieht der Anfänger, dass es danach stimmt?
5. Buchwirkung: Muss die Anleitung ergänzt oder korrigiert werden?
