# Microsoft-Doc-Validation fuer Business-Central-Laeufe

Diese Datei prueft Projektentscheidungen gegen Microsoft Learn. Sie soll verhindern, dass das Projekt aus CRONUS-Zufallsverhalten falsche allgemeine Business-Central-Regeln ableitet.

## Grundentscheidung

Der aktuelle Testmandant ist eine CRONUS-basierte Spielwiese. Er muss als technisches Labor funktionieren, aber er ist nicht automatisch der fachliche Zielmandant fuer deutsche Buchscreenshots.

Das Projekt unterscheidet deshalb drei Ebenen:

| Ebene | Zweck | Darf aus CRONUS uebernommen werden? |
|---|---|---|
| Bedienpfad | Seite finden, Auftrag oeffnen, Kopf/Zeile verstehen, Evidence schreiben | ja, wenn Seite und UI-Verhalten gleich sind |
| Technische Datenanlage | API fuer Sales Orders, Sales Order Lines, Default Dimensions, Cleanup | ja, wenn gegen Microsoft-API dokumentiert und idempotent |
| Fachlicher Zielnachweis | EUR, 19 % USt, deutsche Steuerlogik, deutsche Sprache, Postenspur | nein, muss im deutschen Mandanten erneut bewiesen werden |

## Abgleich mit Microsoft Learn

| Projektthema | Microsoft-Doku | Konsequenz fuer das Projekt |
|---|---|---|
| Sales Order API | Microsoft beschreibt `salesOrder` als Business-Central-API-Ressource mit `GET`, `POST`, `PATCH`, `DELETE` und Navigation zu `salesOrderLines`, `dimensionSetLines`, `currency`, `customer` usw. Quelle: [salesOrder resource type](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/api-reference/v2.0/resources/dynamics_salesorder). | Unsere API-gestuetzte Anlage und Cleanup-Strategie ist fachlich vertretbar, solange die UI danach den Auftrag sichtbar prueft. |
| Sales Order Lines API | Microsoft dokumentiert `salesOrderLines` mit Feldern wie `lineType`, `lineObjectNumber`, `quantity`, `unitPrice`, `taxCode`, `taxPercent`, `amountExcludingTax`, `totalTaxAmount` und `amountIncludingTax`. Quelle: [Get salesOrderLines](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/api-reference/v2.0/api/dynamics_salesorderline_get). | Unsere Evidence darf Tax/Betrag aus der API lesen. Das ersetzt aber kein Buchbild, wenn die Spalten im Screenshot nicht sichtbar sind. |
| Default Dimensions API | Microsoft dokumentiert `defaultDimension` mit `parentType`, `dimensionCode`, `dimensionValueCode` und `postingValidation` mit Werten wie `Same_Code`. Quelle: [defaultDimension resource type](https://learn.microsoft.com/es-es/dynamics365/business-central/dev-itpro/api-reference/v2.0/resources/dynamics_defaultdimension). | `MASTERDATA-007` ist als API-Nachweis fuer Standarddimensionen legitim. Der Prozessnachweis bleibt offen, bis die Dimension im Auftrag, in der Buchungsvorschau oder in Posten sichtbar ist. |
| Default Dimensions Page | Microsoft dokumentiert Page `540` als `Default Dimensions` mit Source Table `Default Dimension`. Quelle: [Page "Default Dimensions"](https://learn.microsoft.com/fr-fr/dynamics365/business-central/application/base-application/page/microsoft.finance.dimension.default-dimensions). | Der direkte Page-540-Laboraufruf ist als UI-Nachweis fuer den Standarddimensionen-Dialog vertretbar. Der Parent-Datensatz wird ueber Filter, Testziel und API-Evidence belegt; final wird das Bild in deutscher Umgebung erneuert. |
| Posting Groups | Microsoft erklaert, dass Posting Groups Entitaeten wie Customers, Items, Resources und Dokumente auf Sachkonten abbilden; General Business/Product Posting Groups bestimmen unter anderem Erlos- und Wareneinsatzkonten, Customer Posting Groups Forderungskonten, Inventory Posting Groups Bestandskonten. Quelle: [Set up posting groups](https://learn.microsoft.com/en-us/dynamics365/business-central/finance-posting-groups). | Unser Buch muss Debitor, Artikel, Lagerort, Buchungsgruppen und Steuerlogik als Voraussetzungen erklaeren. Ein gruener Klickpfad ohne Posting-Fit ist kein fachlicher Buchungsnachweis. |
| Preview Posting | Microsoft beschreibt `Preview Posting` als Funktion, mit der auf buchbaren Belegen und Buch.-Blaettern vor dem Buchen geprueft wird, welche Eintraege entstehen wuerden. Quelle: [Preview Entries Before You Post a Document or Journal](https://learn.microsoft.com/en-us/dynamics365/business-central/ui-how-preview-post-results). | Unser O2C-Labor nutzt `Preview Posting` bewusst als nicht buchenden Sicherheits- und Lernschritt. Wenn BC dabei `Error Messages` zeigt, ist das ein echter Setup-Befund, kein Testabbruch ohne Erkenntnis. |
| VAT Setup | Microsoft empfiehlt fuer VAT das Assisted Setup und danach die Pruefung der VAT Posting Setup Page; VAT haengt davon ab, wem man verkauft/kauft und was man verkauft/kauft. Quelle: [Set up calculations and posting methods for value-added tax](https://learn.microsoft.com/en-us/dynamics365/business-central/finance-setup-vat). | Die CRONUS-USA-Steuerlogik `FURNITURE`/`0 %` darf nicht als deutscher Zielzustand gelten. `EUR`/`19 %` braucht deutschen Mandanten oder explizites deutsches VAT-Setup. |
| Sales Tax vs. VAT | Microsoft unterscheidet Business-Central-Laender/Regionen, die Sales Tax verwenden, von solchen, die VAT verwenden. Quelle: [Sales tax in the default version](https://learn.microsoft.com/en-us/dynamics365/business-central/sales-tax-concept). Microsoft beschreibt fuer VAT die Kombination aus VAT Business Posting Groups, VAT Product Posting Groups und VAT Posting Setup. Quelle: [Set up VAT](https://learn.microsoft.com/en-us/dynamics365/business-central/finance-setup-vat). | Der MCP-Befund passt zur Doku: Die aktuelle Spielwiese zeigt Sales-Tax-Seiten (`Tax Areas`, `Tax Groups`, `Tax Details`) und im Auftrag `Tax Area Code` / `Tax Group Code`. Das ist kein Beweis fuer deutsches `19 %`-VAT-Setup. |
| VAT Posting Setup im Labor | Microsoft beschreibt, dass VAT-Betraege in Business Central aus Kombinationen von VAT Business Posting Groups und VAT Product Posting Groups in den VAT Posting Setups entstehen. Quelle: [Set up VAT](https://learn.microsoft.com/en-us/dynamics365/business-central/finance-setup-vat). | MCP oeffnet Page 472 als `VAT Posting Setup` / `Tax Posting Setup`; die Card Page 473 zeigt im aktuellen CRONUS-Labor aber `VAT Calculation Type = Sales Tax`. Deshalb darf Page 472 nicht vorschnell als deutscher USt-Nachweis gelesen werden. |
| Deutschland-Lokalisierung | Microsoft dokumentiert fuer Deutschland unter anderem Sales VAT Advance Notifications und ELSTER-VAT-Lokalisierung. Quelle: [Set up and export sales VAT advance notifications](https://learn.microsoft.com/en-us/dynamics365/business-central/localfunctionality/germany/how-to-set-up-and-export-sales-vat-advance-notifications). | Fuer finale deutsche Buchscreenshots reicht generisches VAT-Setup nicht. Deutsche Lokalisierung, deutsche Sprache, deutsche Steuerberichte und ggf. ELSTER-Funktion muessen separat geprueft werden. |

## Aktueller Dimensionsbefund aus `UAT-O2C-001`

Der Sales-Order-API-Vertrag erlaubt die Navigation auf `dimensionSetLines`. Der aktuelle Laborlauf nutzt diese Navigation und weist am erzeugten Auftrag `CHANNEL = B2B` nach. Das ist ein echter Auftragskopfnachweis, aber noch kein Nachweis fuer die erwartete Artikeldimension `PRODUCTLINE = MACHINE`.

Konsequenz fuer das Buch: `CHANNEL` darf als Laborbefund am Auftrag beschrieben werden. `PRODUCTLINE` bleibt offen, bis der Dimensionsdialog der Verkaufszeile, eine Buchungsvorschau oder die gebuchten Posten den Wert zeigen.

## Bewertung: Macht unser aktueller Weg Sinn?

Ja, mit einer harten Einschraenkung.

Der Weg macht Sinn, weil:

- wir echte BC-Seiten und echte Belege verwenden
- wir API nur fuer reproduzierbare Datenanlage, Evidence und Cleanup nutzen
- wir Abweichungen nicht verstecken, sondern als `labor-delta` dokumentieren
- wir lernen, welche UI-Elemente ein Anfaenger wirklich sieht
- wir bereits erkannt haben, dass Screenshots nur mit QA buchfaehig werden

Der Weg waere falsch, wenn:

- CRONUS-Laborbilder als finale deutsche Buchbilder verkauft wuerden
- API-Evidence als sichtbarer Screenshot-Nachweis ausgegeben wuerde
- `pageText()` als Beweis fuer sichtbare Bildinhalte behandelt wuerde
- wir wegen eines gruenen Tests buchen, obwohl Steuer/Waehrung/Dimension nicht passen

## Portabilitaetsregeln fuer neue deutsche Umgebung

Wenn spaeter eine komplett deutsche Umgebung bereitsteht, muss jeder Testfall diese Checkliste bestehen:

| Pruefpunkt | Muss im deutschen Zielmandanten neu geprueft werden? | Warum |
|---|---|---|
| Login/Auth/Storage State | ja | Tenant, Environment, MFA und Benutzer koennen anders sein |
| Company-Auswahl | ja | Company-Name, Sprache, Rollen und Berechtigungen koennen abweichen |
| Page IDs | teilweise | Page IDs sind stabiler als Suchtexte, aber Erweiterungen/Rollen koennen UI veraendern |
| Suchbegriffe | ja | Deutsch/Englisch und Lokalisierung beeinflussen Tell-Me-Treffer |
| Stammdaten `D10000`, `RM-M100`, `FRA-ZL` | ja | Daten muessen im Zielmandanten existieren oder idempotent erzeugt werden |
| Default Dimensions | ja | Standarddimensionen muessen am Zielstammdatensatz haengen |
| Dimension im Beleg/Posten | ja | Stammdimension ist kein Prozessnachweis |
| VAT/Posting Setup | ja | Ziel `EUR`/`19 %` ist mandanten- und lokalisierungsabhaengig |
| Screenshots | ja | Finale Bilder brauchen deutsche Oberflaeche, saubere Stoerer-Strategie und sichtbare Zielwerte |
| Evidence Pack | ja | API-/UI-/Posten-Nachweise muessen denselben Zielzustand zeigen |

## Projektstandard ab jetzt

Jede neue oder geaenderte Business-Central-Regel bekommt eine Herkunft:

| Herkunft | Verwendung |
|---|---|
| Microsoft Learn | allgemeine BC-Regel oder API-Vertrag |
| aktueller CRONUS-Lauf | Laborbefund, Bedienverhalten, Screenshot-QA |
| deutscher Ziellauf | finale Buchscreenshots, Steuer-/Waehrungs-/Postennachweise |
| Buchannahme | Hypothese, bis durch Microsoft-Doku oder BC-Lauf bestaetigt |

Wenn Quelle und Labor voneinander abweichen, gewinnt nicht die bequemere Aussage. Dann wird die Abweichung als Finding dokumentiert und der Buchtext trennt Laborbefund und Zielzustand.
