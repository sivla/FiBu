# FiBu-Buch 5: Business Central (BC) – Standardprozesse Deutschland als systematisches Greenfield-Durchspielbuch

Stand: `28.05.2026`
Hinweis: Dieses Buch ist ein quellenbasiertes Lern-, Schulungs-, Projekt- und Implementierungsbuch für Microsoft Dynamics 365 Business Central im deutschen Unternehmenskontext. Es ersetzt keine individuelle Rechts-, Steuer- oder Implementierungsberatung.

**Verlässlichkeitsstandard und Rechtsstand**
- Rechtsstand und Link-Prüfung der Primärquellen: `28.05.2026`.
- Fachlicher Fokus: Business Central Standard, deutsche Umsatzsteuer (USt), GoBD, E-Rechnung, HGB-nahe Finanzprozesse, Lager, Fertigung, Service, Projekte, Onlineshop, Intercompany und Reporting.
- BC-Funktionsumfang, Seitenbezeichnungen und Lokalisierungen können je Release Wave, Mandant, Lizenz, Sprache, Berechtigung und aktivierter Funktion abweichen.
- In diesem Buch ist die deutsche Business-Central-Oberfläche führend. Englische Microsoft-Learn-/Tell-Me-Begriffe stehen nur als Klammerzusatz, Suchhilfe oder Quellenbegriff daneben.
- Bei Abweichungen zwischen diesem Buch und Normtext oder Microsoft Learn gilt immer die aktuelle Primärquelle.
- Dieses Skript verwendet für Quellenangaben nur Primärquellen: Microsoft Learn, Gesetze im Internet, BMF, BZSt und amtliche EU-Quellen.

## Inhaltsverzeichnis nach sechs Teilen

**Teil A — Orientierung und Fallstudie**
1. Was dieses Buch ist
2. Wie man dieses Buch nutzt
3. Die Rhein-Main Industriegruppe als durchgehende Fallstudie
4. ERP und Business Central für absolute Einsteiger
5. Wie Business Central denkt

**Teil B — Grundlage: Firma, Daten, Setup**
6. Companies, Organisation und Mandantenlogik
7. Stammdaten der Fallstudie
8. Foundation Setup
9. Buchungslogik und Posting Groups
10. Dimensionen und Reportingachsen

**Teil C — Operative End-to-End-Prozesse**
11. Order-to-Cash: Maschine verkaufen
12. Procure-to-Pay: Rohmaterial einkaufen
13. Inventory und Warehouse: Ware bewegen und bewerten
14. Planning, Assembly und Manufacturing: Maschine produzieren
15. Service: Wartung, Garantie und Ersatzteilverbrauch
16. Projects: Installation und Meilensteinrechnung
17. Shopify, Dropshipping und Sonderverkauf
18. Intercompany und Ausland

**Teil D — Finance, Kontrolle und Abschluss**
19. Debitoren, Kreditoren und OP-Ausgleich
20. Bank, Payments und Bankabstimmung
21. Fixed Assets
22. USt, E-Rechnung und deutsche Nachweissicht
23. Inventory Costing und Lagerbewertung im Abschluss
24. Monatsabschluss / Record-to-Report
25. Reporting, Controlling, Financial Reports und Power BI

**Teil E — Projekt, Architektur und Betrieb**
26. Fit-Gap und Standard-first Design
27. Security, Rollen, SoD und Governance
28. Migration, Opening Balances und Cutover
29. Integrationen
30. Betrieb, Monitoring und Hypercare
31. Business Central Solution Architect Pfad

**Teil F — Training, Prüfung und Nachschlagen**
32. UAT-Testbibliothek
33. Übungen und Lösungen
34. MB-800-Kompetenzmatrix
35. Microsoft-Learn-Lernpfad-Mapping
36. MB-800-Prüfungstraining
37. Glossar Deutsch / Englisch / Tell-Me
38. Seitenindex, Prozesskatalog und Qualitätssicherung
39. Projektartefakte
40. Quellenverzeichnis

---


## Teil A — Orientierung und Fallstudie

Teil A führt in Ziel, Quellenlogik, Lernpfade und Fallstudie ein. Der Leser versteht zuerst die Firma und die ERP-Grundbegriffe, bevor er operative Prozesse bucht.

## 1. Was dieses Buch ist [Q1][Q2]

Dieses Buch erklärt Business Central nicht als Sammlung einzelner Masken. Es erklärt Business Central als Unternehmenssystem: Mitarbeiter legen Stammdaten an, kaufen ein, lagern ein, fertigen, verkaufen, liefern, fakturieren, kassieren, zahlen, melden Steuern, schließen Perioden und weisen alles prüfbar nach. Nach diesem Buch kannst du einen Greenfield-Trainingsmandanten aufbauen und die Standardprozesse Ende-zu-Ende durchspielen.

Ziel:
- Du kannst alle relevanten BC-Standardprozessbereiche fachlich einordnen und anhand eines deutschen Musterkonzerns bedienen. [Q1][Q2]
- Du erkennst, welche Prozesse direkt im Standard abbildbar sind und wo Miet-, Finanzierungs- oder Spezialmodelle Prozessdesign, Extension oder Customizing brauchen. [Q2]
- Du kannst je Abteilung sagen, was der Mitarbeiter in BC macht, welche Seite er öffnet, welche Felder er pflegt und welche Entries entstehen. [Q1]
- Du kannst Schulungen durchführen, weil Prozesskapitel Beispieldaten, Klickpfade, Übungen und einen Lösungsanhang enthalten.

### Was „alle Standardprozesse“ in diesem Buch bedeutet [Q2]

Business Central deckt nach Microsofts offizieller Prozesslandkarte Finance, Sales, Purchasing, Inventory, Warehouse Management, Online Store mit Shopify, Fixed Assets, Planning, Assembly, Manufacturing, Project Management, Service Management, Relationship Management, Human Resources, Reporting, Admin, Workflows und Integrationen ab. Dieses Buch nimmt diese Prozessgruppen als Mindestumfang. [Q1][Q2]

| BC-Prozessbereich | Wird in diesem Buch behandelt als | Trainingsziel |
|---|---|---|
| Finance | Hauptbuch, Nebenbücher, Bank, USt, Anlagen, Abschluss | Buchungsspur und Abschlussfähigkeit verstehen |
| Sales | Angebot, Auftrag, Lieferung, Rechnung, Retoure, Mahnung | O2C mit Abweichungen bedienen |
| Purchasing | Anfrage, Bestellung, Wareneingang, Eingangsrechnung, Rücksendung | P2P und 3-Way-Match erklären |
| Inventory | Artikel, Lagerorte, Varianten, Bewertung, Inventur | Mengen- und Wertfluss abstimmen |
| Warehouse | Put-away, Pick, Bins, gesteuerte Lagerorte | einfache und gesteuerte Lagerlogik unterscheiden |
| Shopify/Online Store | Kunden-, Artikel- und Auftragsfluss aus dem Shop | Onlineshop-Aufträge in BC verarbeiten |
| Planning | Forecast, MPS, MRP, Planungsarbeitsblatt | Bedarf in Beschaffung/Fertigung übersetzen |
| Assembly | Montageauftrag, Assemble-to-Order, Kits | Baugruppen ohne volle Fertigung abbilden |
| Manufacturing | Stückliste, Arbeitsplan, Fertigungsauftrag, Verbrauch, Output | Produktionskosten und Abweichungen verstehen |
| Projects | Projektaufgaben, Ressourcen, Verbrauch, WIP, Faktura | Projektwertschöpfung abrechnen |
| Service | Serviceartikel, Serviceauftrag, Vertrag, Garantie | After-Sales-Prozesse steuern |
| Relationship Management | Kontakte, Verkaufschancen, Segmente | Vorvertrieb und Kundenbeziehung pflegen |
| Human Resources | Mitarbeiter, Abwesenheiten | Basis-HR im BC-Standard zeigen |
| Admin/Reporting | Rollen, Berechtigungen, Change Log, Job Queue, Analyse | Betrieb und Nachweis sichern |


### Standard, Pflicht, Best Practice und Projektentscheidung

Dieses Buch trennt vier Ebenen:

| Ebene | Bedeutung | Beispiel |
|---|---|---|
| Standard laut Quelle | Funktion ist in Microsoft Learn beschrieben | `Verkaufsaufträge (Sales Orders)`, `Einkaufsbestellungen (Purchase Orders)`, `Fertigungsaufträge (Production Orders)` |
| Deutsche Pflicht/Compliance | Rechtliche oder steuerliche Anforderung | § 147 AO, UStG, GoBD, E-Rechnung |
| BC-Best-Practice | robuste Projektpraxis, nicht automatisch Gesetz | Vier-Augen-Freigabe für USt-Setup |
| Projektentscheidung der Musterfirma | bewusst konstruiertes Trainingsdesign | ein gesteuertes Lager und ein einfaches Lager parallel |

> Merksatz: Best Practice ist keine Rechtsquelle. Sie ist die fachlich begründete Art, den Standard so zu nutzen, dass Prozesse stabil, prüfbar und schulbar werden.

### Sprachregel: deutsches Business Central zuerst

Dieses Buch schult auf einem deutschen Business-Central-Mandanten. Deshalb steht der deutsche Funktions- und Seitenbegriff immer im Vordergrund. Der englische Begriff bleibt nur dort stehen, wo er für Microsoft Learn, Tell Me, Fehlersuche, internationale Projekte oder technische Tabellenbezeichnungen nützlich ist.

Schreibweise:
- deutscher BC-Begriff zuerst: `Verkaufsaufträge (Sales Orders)`.
- deutscher Postenbegriff zuerst: `Sachposten (G/L Entries)`.
- deutsche Funktion zuerst: `Buchungsvorschau (Preview Posting)`.
- englischer Begriff nur als Suchhilfe, Quellenbegriff oder technischer Tabellen-/Objektname.

Praxisregel:
- Mitarbeiter lernen die deutsche Oberfläche. Key User und Admins lernen zusätzlich die englischen Begriffe, weil Dokumentation, AppSource, Fehlermeldungen und Partnerkommunikation häufig englisch sind.

Beispiel:
- Ein Verkäufer sucht im deutschen BC nach `Verkaufsaufträge`. Wenn die Suche nichts findet oder die Umgebung englisch dokumentiert ist, nutzt er zusätzlich `Sales Orders`.

---

### Quellen-, Pflicht- und Best-Practice-Schicht

Das Buch ist quellenbasiert. Jede wesentliche BC-Funktion wird auf Microsoft Learn zurückgeführt. Jede deutsche Steuer- oder Nachweisaussage wird auf Gesetz, BMF oder BZSt gestützt. Best Practices werden separat benannt.

### Quellenlogik

| Aussageart | Primärquelle | Beispiel |
|---|---|---|
| BC-Standardfunktion | Microsoft Learn | Warehouse, Manufacturing, Service, Projects |
| deutsche USt | UStG, BZSt, BMF | Rechnung, UStVA, ZM, Reverse Charge |
| Aufbewahrung und Datenzugriff | AO, GoBD/BMF | § 147 AO, Z3, Verfahrensdokumentation |
| E-Rechnung | UStG, BMF, Microsoft Learn E-Documents | XML, Validierung, Archivierung |
| EU-Bezug | EUR-Lex, EU-Richtlinien | Mehrwertsteuer-Systemrichtlinie |

### Best-Practice-Katalog der Musterfirma

| Best Practice | Zweck | Nicht verwechseln mit |
|---|---|---|
| Change Request für Buchungsgruppen | systematische Falschbuchungen vermeiden | gesetzlicher Einzelpflicht |
| Vier-Augen-Prüfung bei Bankdaten | Betrugsprävention | vollständiger Payment-Approval-Lösung |
| Periodensperre nach Monatsabschluss | Vorperiodenbuchungen verhindern | Jahresabschlussprüfung |
| Evidence Pack je Steuerfall | Tax Review reproduzierbar machen | bloßer Belegablage |
| getrennte Lagerorte je Prozesslogik | Lagerbedienung schulbar halten | zwingender BC-Vorgabe |
| Rollenprofile nach Abteilung | Bedienung vereinfachen | alleiniger Berechtigungskontrolle |
| Testdatenkatalog | Schulungen wiederholbar machen | produktiver Migration |

Prüfungsfalle:
- In Projekten wird „Microsoft kann das“ häufig mit „unser Prozess ist prüfbar eingerichtet“ verwechselt. Die Funktion ist nur der Werkzeugkasten. Die Nachweislogik entsteht durch Setup, Rollen, Kontrolle und Dokumentation.

---


## 2. Wie man dieses Buch nutzt: Lernpfade und Reifegrad

Dieses Kapitel zeigt dir, wie du das Buch je nach Rolle durcharbeitest. Die Kapitel 1 bis 40 bleiben dieselbe Landkarte; nur Reihenfolge, Tempo und Übungstiefe ändern sich.

### Lernpfad für Einsteiger: 7 Tage

Der Einsteigerpfad setzt kein ERP-Wissen voraus. Er führt von der Firma über Grundbegriffe zu den ersten Buchungen und Nachweisen.

| Tag | Kapitel | Ergebnis |
|---|---|---|
| 1 | 1 bis 5 | Buchziel, Rhein-Main-Fallstudie, ERP-Grundbegriffe und BC-Denkweise verstehen |
| 2 | 6 bis 8 | Companies, Stammdaten und Foundation Setup sicher einordnen |
| 3 | 9 bis 10 | Buchungsgruppen, Kontenfindung, Dimensionen und Reportingachsen verstehen |
| 4 | 11 bis 12 | Verkauf/O2C und Einkauf/P2P mit Belegen, Posten und Kontrollberichten durchführen |
| 5 | 13 bis 18 | Lager, Fertigung, Service, Projekte, Shopify, Dropshipping, Ausland und Intercompany als Prozesskette lesen |
| 6 | 19 bis 25 | OP-Ausgleich, Bank, Anlagen, USt, Lagerbewertung, Monatsabschluss und Reporting prüfen |
| 7 | 32, 33, 37 und 38 | UAT-Fälle ausführen, Lösungen nachvollziehen, Begriffe nachschlagen und Prozesskatalog nutzen |

Praxisregel:
- Einsteiger lesen zuerst die Geschichte der Rhein-Main Industriegruppe. Danach werden Seiten, Felder und Posten leichter verständlich, weil jeder Klick einen geschäftlichen Grund hat.

### Lernpfad für Buchhaltung

| Phase | Kapitel | Fokus |
|---|---|---|
| Grundlagen | 6 bis 10 | Company, Stammdaten, Buchungsgruppen, USt-Matrix und Dimensionen |
| Tagesgeschäft | 11, 12, 19 und 20 | Verkaufs- und Einkaufsbelege, OP-Ausgleich, Zahlungsjournale und Bankabstimmung |
| Anlagen und Steuer | 21 und 22 | Anlagenzugang, AfA, USt-Posten, E-Rechnung und deutsche Nachweissicht |
| Abschluss | 23 bis 25 | Lagerbewertung, Monatsabschluss, GuV, Bilanz, Finanzberichte und Power BI |
| Nachweis und Prüfung | 32 bis 38 | UAT, Übungen, MB-800-Abdeckung, Prüfungstraining, Glossar und Seitenindex |

### Lernpfad für Key User

Key User verbinden Fachprozess und Systembedienung. Sie lesen Kapitel 3 bis 5 für die Fallstudie, Kapitel 7 bis 10 für Daten und Setup, danach die eigenen Prozesskapitel aus 11 bis 25. UAT, Übungen, Glossar, Seitenindex und Projektartefakte stehen in Kapitel 32, 33, 37, 38 und 39.

Typische Reihenfolge:
1. Rhein-Main-Fallstudie und BC-Denkweise: Kapitel 3 bis 5.
2. Stammdaten, Buchungsgruppen und Dimensionen: Kapitel 7 bis 10.
3. Eigener Fachbereich: passende Prozesskapitel 11 bis 25.
4. UAT und Schulungsfähigkeit: Kapitel 32 und 33.
5. Nachschlagen und Projektarbeit: Kapitel 37 bis 39.

### Lernpfad für Junior Functional Consultants

Junior Consultants bearbeiten zuerst die Grundlagenkapitel 1 bis 10. Danach führen sie alle operativen und Finance-Prozesse in Kapitel 11 bis 25 mit Testdaten durch. Teil E mit Kapitel 26 bis 31 ergänzt Fit-Gap, Security, Migration, Integrationen, Betrieb und Solution-Architect-Denken. Teil F mit Kapitel 32 bis 39 liefert UAT, Übungen, MB-800, Microsoft Learn, Glossar, Seitenindex und Projektartefakte.

Prüfungstipp:
- Ein Junior Consultant gilt erst dann als projektsicher, wenn er einen gebuchten Beleg bis in Nebenbuch, Sachposten, USt-Posten, Artikelposten, Wertposten und Bericht erklären kann.

### Lernpfad für Solution Architects

Solution Architects arbeiten stärker entscheidungsorientiert. Sie starten mit Kapitel 3, 6, 9 und 10, weil Company-Struktur, Buchungsgruppen und Dimensionen die Architektur prägen. Danach folgen die Architektur- und Projektkapitel 26 bis 31. Die Prozesskapitel 11 bis 25 werden nicht nur geklickt, sondern auf Standardgrenze, Extension-Kandidat, UAT-Nachweis und Betriebsfolge geprüft. Kapitel 35, 38 und 39 dienen als Quellen-, Prozess- und Artefakt-Nachweis.

### MB-800-Lernplan 14 Tage

| Tag | Fokus | Kapitel |
|---|---|---|
| 1 | Study Guide, Buchlogik, Oberfläche, ERP-Grundlagen | 1 bis 5, 34 |
| 2 | Companies, Assisted Setup, Konfigurationspakete, Opening Balances | 6, 8 und 28 |
| 3 | Benutzer, Profile, Berechtigungssätze, Security Groups, Security Filters | 27 |
| 4 | Nummernserien, Dimensionen, Workflows und Genehmigungen | 8, 10 und 27 |
| 5 | Hauptbuch, Perioden, Zahlungsbedingungen, Währungen, Posting Groups | 9 und 24 |
| 6 | Kontenplan, Finanzberichte, Buchungsgruppen, Dimensionen im Reporting | 9, 10 und 25 |
| 7 | Debitoren, Kreditoren, OP-Ausgleich und Zahlungen | 19 und 20 |
| 8 | Anlagen, AfA-Bücher, Zugang, Abschreibung und Abgang | 21 |
| 9 | Artikel, Lagerorte, Kostenmethoden, Artikelposten und Wertposten | 13 und 23 |
| 10 | Einkauf, Wareneingang, Eingangsrechnung, Rücksendung, Gutschrift | 12 |
| 11 | Verkauf, Lieferung, Rechnung, Retoure, Gutschrift, Vorauszahlung | 11 |
| 12 | Shopify, Dropshipping, Ausland, USt und E-Rechnung | 17, 18 und 22 |
| 13 | Bankabstimmung, Journale, Ausgleich, Währungen und Korrekturen | 19, 20 und 24 |
| 14 | UAT, Übungen, MB-800-Matrix und Prüfungstraining | 32 bis 36 |

### MB-800-Lernplan 30 Tage

Der 30-Tage-Plan nutzt dieselbe Reihenfolge wie der 14-Tage-Plan. Jeder Themenblock bekommt zusätzlich einen Übungstag aus Kapitel 33, einen UAT-Tag aus Kapitel 32 und einen Prüfungstag aus Kapitel 36. Die letzten vier Tage bestehen aus Rhein-Main-Gesamtfall, Kompetenzmatrix in Kapitel 34, Microsoft-Learn-Mapping in Kapitel 35 und Wiederholung der Prüfungsfallen.

### In 5 Minuten merken

- 5 wichtigste Begriffe: Company, Rolle, Beleg, Posten, Buchungsgruppe.
- 5 wichtigste Seiten: `Verkaufsaufträge`, `Einkaufsbestellungen`, `Sachposten`, `Dimensionen`, `Finanzberichte`.
- 3 häufigste Fehler: falsche Company, falsche Dimension, falsche USt-Gruppe.
- 3 Prüfungsfallen: Personalisieren vs. Anpassen, Allgemeine Buchungsmatrix Einrichtung vs. USt-Buchungsmatrix Einrichtung, Artikelposten vs. Wertposten.
- 1 Praxisregel: Erst Setup und Stammdaten verstehen, dann Prozesse buchen und die Posten nachweisen.

---


## 3. Die Rhein-Main Industriegruppe als durchgehende Fallstudie

Die Musterfirma ist bewusst breit konstruiert. Sie soll Business Central nicht minimal abbilden, sondern als Trainingsuniversum möglichst vollständig auslösen.

### Die Fallstudie in einfachen Worten

Die Rhein-Main Industriegruppe baut Maschinen, verkauft Ersatzteile, betreibt einen Onlineshop, schickt Servicetechniker zum Kunden, wickelt Projekte ab und führt mehrere Gesellschaften in einer Unternehmensgruppe. Genau deshalb braucht sie ein ERP-System. Ohne ERP würden Vertrieb, Einkauf, Lager, Fertigung, Service und Buchhaltung mit getrennten Listen arbeiten. Dann weiß der Vertrieb nicht sicher, ob Ware verfügbar ist. Der Einkauf sieht zu spät, welches Material fehlt. Das Lager kennt Mengen, aber nicht immer Werte. Finance erkennt Fehler erst im Monatsabschluss.

Business Central verbindet diese Abteilungen. Ein Verkaufsauftrag ist nicht nur ein Formular für den Kunden. Er beeinflusst Lager, Umsatz, Umsatzsteuer, Forderungen, Wareneinsatz, Dimensionen und Reporting. Eine Einkaufsbestellung ist nicht nur eine Bestellung beim Lieferanten. Sie beeinflusst Materialverfügbarkeit, Lagerwert, Kreditorenposten, Vorsteuer und Fertigungsfähigkeit. Die Fallstudie führt diese Zusammenhänge durch das gesamte Buch.

Die Gruppe verdient Geld über mehrere Erlösquellen:

| Erlösquelle | Beispiel | Warum BC relevant ist |
|---|---|---|
| Maschinenverkauf | `RM-M100` | Verkauf, Lager, Fertigung, Finance |
| Sondermaschinen | `RM-X500` | Projekt, Fertigung, Meilensteinrechnung |
| Ersatzteile | `SP-PUMP-01` | Lager, Shop, Service |
| Service | Wartung und Reparatur | Serviceauftrag, Ressource, Ersatzteil |
| Projekte | Installation | Projektposten, WIP, Faktura |
| Miete | Mietmaschine | Abgrenzung, Standardgrenze |
| Intercompany | RM-PROD an RM-SALES | IC-Belege, Abstimmung |

Vor Business Central hatte die Gruppe typische Probleme:
- Vertrieb verkaufte Artikel ohne belastbare Verfügbarkeitsprüfung.
- Einkaufspreise und Verkaufsmargen wurden zu spät verglichen.
- Lagerbestand stimmte mengenmäßig, aber nicht immer wertmäßig.
- Finance erkannte USt-Fehler erst im Monatsabschluss.
- Service verbrauchte Ersatzteile, ohne jeden Fall sauber zu fakturieren.
- Projektkosten wurden zu spät sichtbar.
- Intercompany-Abstimmung erfolgte manuell.
- Management erhielt keine verlässliche GuV nach Produktlinie.
- Excel-Listen erzeugten Dubletten und falsche Stammdaten.
- Berechtigungen waren unklar.
- Belege und Nachweise waren schwer auffindbar.

Business Central wird eingeführt, damit dieselben Stammdaten und Buchungsregeln in allen Abteilungen gelten. Der Standard-first-Ansatz bedeutet: Zuerst wird geprüft, ob Business Central Standard den Prozess tragen kann. Erst danach wird über Extension, Integration oder Customizing entschieden.

### Konzernstruktur

| Company in BC | Rolle im Konzern | Hauptprozesse |
|---|---|---|
| `RM-PROD GmbH` | Produktion und Zentrallager | Fertigung, gesteuertes Lager, Einkauf, Intercompany-Verkauf |
| `RM-SALES GmbH` | Vertrieb und Onlineshop | B2B, B2C, Shopify, Dropshipping, Debitoren |
| `RM-SERVICE GmbH` | Wartung, Miete, Finanzierungsvorbereitung | Service, Mietfälle, Projekte, Anlagen-/Serviceartikel |
| `RM-SHARED GmbH` | Shared Services | Einkauf, Stammdaten, Zahlungsverkehr, Reporting |
| `RM-AT GmbH` | EU-Auslandsgesellschaft | Intercompany, EU-USt, Intrastat-nahe Fälle |

```mermaid
flowchart LR
    PROD["RM-PROD GmbH\nFertigung + Zentrallager"] --> SALES["RM-SALES GmbH\nVertrieb + Onlineshop"]
    PROD --> SERVICE["RM-SERVICE GmbH\nService + Miete"]
    SHARED["RM-SHARED GmbH\nEinkauf + Stammdaten"] --> PROD
    SHARED --> SALES
    SALES --> AT["RM-AT GmbH\nEU-Vertrieb"]
    SERVICE --> SALES
```

### Standorte und Lagerlogik

| Lagerort | Company | Lagerart | BC-Logik | Trainingszweck |
|---|---|---|---|---|
| `FRA-ZL` | RM-PROD | Zentrallager | gesteuerte Einlagerung/Kommissionierung mit Bins | Warehouse Receipt, Put-away, Pick, Shipment |
| `MZ-EINFACH` | RM-SALES | Außenlager | einfache Lagerbuchung ohne gesteuerte Einlagerung | einfacher Wareneingang und Verkauf |
| `HH-FUL` | RM-SALES | Onlineshop-Fulfillment | Pick/Shipment vereinfacht | Shop-Auftrag bis Versand |
| `VAN-01` | RM-SERVICE | Servicefahrzeug | Lagerort für Techniker | Ersatzteilverbrauch im Service |
| `PROJ-BER` | RM-SERVICE | Projektlager | Projektbezogenes Lager | Projektmaterial und Baustelle |
| `DROP` | RM-SALES | Dropshipping | kein eigener Bestand | Direktlieferung Lieferant an Kunde |

### Geschäftsmodelle

| Modell | Use Case | BC-Schwerpunkt | Standardgrenze |
|---|---|---|---|
| Eigenfertigung | Standardmaschine `RM-M100` | Manufacturing | vollständig im Standard demonstrierbar |
| Variantenfertigung | Sondermaschine `RM-X500` | BOM/Routing/Projekt/Fertigung | Variantenlogik braucht klare Stammdaten |
| Handelsware | Ersatzteil `SP-PUMP-01` | O2C/P2P/Inventory | Standard |
| Onlineshop | Webshop-Verkauf Ersatzteile | Shopify Connector / Sales Orders | abhängig von Connector-Setup |
| Service | Wartung beim Kunden | Service Management | Standard |
| Miete | Mietmaschine 12 Monate | Service/Projects/Deferrals/Fixed Assets | Standard nur mit Prozessdesign |
| Finanzierung | Kunde finanziert Maschine über Bank | Sales/Receivables/Deferrals | komplexe Finanzierungslogik nicht vollständig Standard |
| Intercompany | PROD verkauft an SALES | Intercompany | Standard mit IC-Setup |
| Dropshipping | Lieferant liefert direkt an Kunden | Sales + Purchase Link | Standard |

---

### Erzählerischer Zusammenhang der Use Cases

Die Rhein-Main Industriegruppe verdient ihr Geld nicht mit einem einzigen Prozess. Ein Maschinenverkauf beginnt im Vertrieb, löst Verfügbarkeitsprüfung aus, kann Fertigung anstoßen, bewegt Lagerwerte und endet in Forderung, Zahlung und GuV. Ein Servicefall beginnt beim Kundenproblem, verbraucht Ersatzteile, erzeugt Technikerzeiten und entscheidet zwischen Rechnung, Garantie und Kulanz. Ein Projekt verbindet Sondermaschine, Fremdleistung, Material, Ressourcen und Meilensteinrechnung.

Mehrere Companies sind deshalb kein Selbstzweck. RM-PROD zeigt Produktion und Materialfluss. RM-SALES zeigt Markt, Kunden, Preise und Onlineshop. RM-SERVICE zeigt laufende Kundenbetreuung. RM-SHARED bündelt Finance, USt, Bank, Reporting und Administration. RM-AT macht EU- und Auslandsszenarien sichtbar. Business Central löst damit reale Probleme: weniger Dubletten, bessere Verfügbarkeit, nachvollziehbare Steuerlogik, abgestimmte Posten, belastbare GuV nach Produktlinie und klare Verantwortlichkeiten.


## 4. ERP und Business Central für absolute Einsteiger

Dieses Kapitel erklärt Business Central ohne ERP-Vorkenntnisse. Du lernst, warum Unternehmen ein integriertes System brauchen, wie aus Stammdaten Belege entstehen und warum Posten nach dem Buchen wichtiger sind als die ursprüngliche Bildschirmmaske.

### Das Grundprinzip in einfachen Worten

Ein ERP-System (Enterprise Resource Planning) ist das zentrale Arbeitssystem eines Unternehmens. Es verbindet Verkauf, Einkauf, Lager, Fertigung, Service, Projekte, Bank und Buchhaltung. Ohne ERP arbeiten Abteilungen oft mit Excel-Listen, E-Mails und einzelnen Programmen. Dann stimmen Kunden, Artikel, Preise, Lagerbestände und offene Posten nicht zuverlässig überein.

Business Central ist das ERP-System der Rhein-Main Industriegruppe. Ein Verkaufsauftrag ist dort nicht nur ein Formular. Er verbindet Debitor, Artikel, Preis, Liefertermin, Lagerort, USt und Dimensionen. Wenn der Auftrag geliefert und fakturiert wird, entstehen gebuchte Belege und Posten. Diese Posten zeigen Finance, Lager und Controlling, was wirklich passiert ist.

Beispiel Verkauf: Kunde `D10000` bestellt eine Pumpe `SP-PUMP-01`. Business Central erzeugt daraus einen Verkaufsauftrag. Beim Buchen entstehen Forderung, Erlös, USt, Lagerabgang und Wertposten. Deshalb prüft RM-SHARED nach dem Buchen nicht nur die Rechnung, sondern auch Debitorenposten, Sachposten, Artikelposten, Wertposten und USt-Posten.

Beispiel Einkauf: RM-PROD kauft Stahl `RAW-STEEL` bei `K10000`. Beim Wareneingang steigt der Bestand. Bei der Eingangsrechnung entsteht eine Verbindlichkeit und Vorsteuer. Einkauf, Lager und Buchhaltung arbeiten also am gleichen Vorgang, aber aus unterschiedlichen Perspektiven.

Beispiel Zahlung: Wenn der Kunde die Rechnung bezahlt, wird die Zahlung mit dem offenen Debitorenposten ausgeglichen. Erst dann ist die Forderung erledigt. Ein Kontoauszug allein genügt nicht; Business Central muss wissen, welche Rechnung mit welcher Zahlung zusammengehört.

Praxisregel:
- In Business Central zählt nach dem Buchen die Postenspur: Beleg, gebuchter Beleg, Nebenbuchposten, Sachposten, USt-Posten, Artikelposten, Wertposten und Bericht müssen zusammenpassen.

### Rollen, Abteilungen und Bedienlogik in BC

Ein vollständiges Schulungsbuch muss zeigen, wie Mitarbeiter arbeiten. Deshalb beschreibt jedes Prozesskapitel fachliche Aufgabe, Role Center, Tell-Me-Suche, Seiten, Felder und Folgebelege.

#### Rollenmatrix

| Rolle | Abteilung | Typische BC-Seiten | Was macht der Mitarbeiter? |
|---|---|---|---|
| Verkäuferin | Vertrieb | `Sales Quotes`, `Sales Orders`, `Customers`, `Contacts` | Angebot erstellen, Auftrag erfassen, Verfügbarkeit prüfen, Rechnung auslösen |
| E-Commerce-Sachbearbeiter | Onlineshop | `Shopify Shops`, `Sales Orders`, `Items`, `Customers` | Shop-Aufträge synchronisieren, Fehler klären, Versand anstoßen |
| Einkäufer | Einkauf | `Vendors`, `Purchase Orders`, `Purchase Invoices` | Bestellung auslösen, Preise prüfen, Wareneingang/Rechnung abstimmen |
| Lagerist einfaches Lager | Lager MZ | `Item Journals`, `Sales Shipments`, `Purchase Receipts` | Ware annehmen, Bestand prüfen, Lieferung buchen |
| Lagerist gesteuertes Lager | FRA-ZL | `Warehouse Receipts`, `Put-aways`, `Picks`, `Warehouse Shipments` | Einlagern, kommissionieren, versenden |
| Produktionsplanerin | Fertigung | `Planning Worksheet`, `Production Orders`, `BOMs`, `Routings` | Bedarf planen, Fertigungsaufträge erstellen, Termine prüfen |
| Meister | Fertigung | `Released Production Orders`, `Consumption Journal`, `Output Journal` | Verbrauch und Output melden, Ausschuss dokumentieren |
| Servicetechniker | Service | `Service Orders`, `Service Items`, `Item Journals` | Serviceauftrag bearbeiten, Ersatzteile verbrauchen, Zeiten erfassen |
| Projektleiter | Projekte | `Projects`, `Project Tasks`, `Project Journals` | Budget, Verbrauch, Fortschritt und Faktura steuern |
| Debitorenbuchhalterin | Finance | `Customer Ledger Entries`, `Payment Reconciliation Journal`, `Reminders` | Zahlung ausgleichen, mahnen, offene Posten prüfen |
| Kreditorenbuchhalter | Finance | `Vendor Ledger Entries`, `Payment Journals`, `Purchase Invoices` | Eingangsrechnungen prüfen, Zahlungen vorbereiten |
| Anlagenbuchhalterin | Finance | `Fixed Assets`, `FA Journals`, `Calculate Depreciation` | Zugänge, AfA und Abgänge buchen |
| Controller | Controlling | `Analysis Views`, `Financial Reports`, `Dimensions` | Auswertungen und Abweichungen analysieren |
| BC-Admin | IT/Finance Operations | `Users`, `Permission Sets`, `Change Log Setup`, `Job Queue Entries` | Rollen, Automatisierung und Audit Trail verwalten |

#### Bedienmuster

1. **Role Center prüfen:** Der Mitarbeiter startet im passenden Arbeitsbereich.
2. **Tell Me nutzen:** Er sucht stabile Seitenbegriffe, nicht lange Menüpfade.
3. **Belegkopf prüfen:** Kunde/Lieferant, Datum, Standort, Währung, Dimension, USt-Gruppe.
4. **Zeilen pflegen:** Artikel, Ressource, Sachkonto, Menge, Preis, Lagerort, Projekt.
5. **Vorschau/Prüfung:** Posting Preview, Verfügbarkeit, Freigabe, Pflichtfelder.
6. **Buchen:** Post/Release/Register.
7. **Nachweis prüfen:** Entries, Belegkette, Attachments, Reports.

Praxisregel:
- Schulungen beginnen mit Rollen und Aufgaben, nicht mit Menüs. Ein Einkäufer muss wissen, warum er eine Bestellung auslöst; die Seite ist erst der zweite Schritt.

---


## 5. Wie Business Central denkt

Dieses Kapitel erklärt die Denkweise hinter Business Central und liefert danach die Trainingsdaten der Fallstudie. Du lernst zuerst, welche Datenarten es gibt, und nutzt anschließend dieselben Debitoren, Kreditoren, Artikel, Ressourcen, Anlagen und Belege in allen Prozesskapiteln.

### Das Datenmodell für Einsteiger

Stammdaten sind dauerhafte Grunddaten. Dazu gehören Debitoren, Kreditoren, Artikel, Ressourcen, Anlagen, Lagerorte, Zahlungsbedingungen, Buchungsgruppen und Dimensionen. Bewegungsdaten entstehen aus Geschäftsvorfällen. Dazu gehören Angebote, Aufträge, Wareneingänge, Rechnungen, Zahlungen, Lagerbewegungen, Serviceaufträge und Journalzeilen.

Ein Beleg ist ein noch bearbeitbarer Vorgang, zum Beispiel ein Verkaufsauftrag. Ein gebuchter Beleg ist das Ergebnis einer Buchung, zum Beispiel eine gebuchte Verkaufsrechnung. Nach dem Buchen entstehen Posten. Posten sind die prüfbare Wahrheit in Business Central, weil sie Mengen, Werte, Steuern, offene Posten und Sachkonten nachvollziehbar speichern.

Ein Journal ist eine Erfassungsmaske für Buchungen, die nicht aus einem operativen Beleg kommen oder bewusst direkt gebucht werden. Beispiele sind allgemeine Buchungsblätter, Zahlungsbuchungsblätter, Anlagenbuchungsblätter oder Artikel Buch.-Blätter. Der Unterschied ist wichtig: Ein Verkaufsauftrag erzeugt eine Belegkette mit Lieferung und Rechnung; ein Journal bucht direkter und braucht deshalb stärkere Kontrolle.

Eine Buchungsgruppe ist eine Stammdaten-Eigenschaft, die Business Central später zur Kontenfindung nutzt. Eine Buchungsmatrix verbindet Geschäftspartnerart und Produktart. Sie entscheidet, welche Sachkonten bei Verkauf, Einkauf, Lager oder USt angesprochen werden. Eine Dimension ist eine Auswertungsachse, etwa Produktlinie, Abteilung oder Standort.

Ein Kontrollbericht ist eine Auswertung, mit der der Fachbereich prüft, ob das Ergebnis stimmt. Ein Evidence Pack (Nachweispaket) ist die Sammlung aus Belegnummern, Posten, Berichten, Exporten und Freigaben, die einen Prozess prüfbar macht. UAT (User Acceptance Testing) bedeutet fachlicher Benutzerabnahmetest: Die Fachabteilung führt echte Testfälle aus und bestätigt, dass der Prozess alltagstauglich funktioniert.

Praxisregel:
- Erst Stammdaten verstehen, dann Belege buchen, danach Posten und Berichte prüfen. Wer diese Reihenfolge beherrscht, versteht Business Central.



## Teil B — Grundlage: Firma, Daten, Setup

Teil B richtet den Trainingsmandanten fachlich ein. Hier entstehen Companies, Stammdaten, Nummernserien, Buchungsgruppen, Dimensionen und grundlegende Bedienlogik.

## 6. Companies, Organisation und Mandantenlogik [Q3][Q4][Q5][Q6]

Foundation-Prozesse tragen alle Fachprozesse. Fehler in Nummernserien, Dimensionen, Buchungsgruppen oder Berechtigungen wirken wie ein Multiplikator.

### Quelle und Zweck

Standard laut Quelle:
- Business Central unterstützt mehrere Companies, Benutzer, Berechtigungen, Workflows, Job Queues, Change Log und Einrichtung für Geschäftsprozesse. [Q3][Q4][Q5][Q6]

Deutsche Pflicht/Compliance:
- Für steuerrelevante Systeme sind Nachvollziehbarkeit, Vollständigkeit, Richtigkeit, Unveränderbarkeit und Datenzugriff im GoBD-Kontext relevant. [Q21][Q22]

BC-Best-Practice:
- Setup-Änderungen an Posting Groups, VAT Posting Setup, Nummernserien und Dimensionen laufen über Change Request, Testnachweis und Freigabe.

### Mitarbeiterbedienung

| Rolle | Aufgabe | Tell Me / Seite | Was wird getan? |
|---|---|---|---|
| BC-Admin | Company anlegen | `Companies` | Trainingscompanies erstellen |
| Finance-Leitung | Buchungsperioden steuern | `General Ledger Setup`, `Accounting Periods` | Buchungsfenster festlegen |
| Stammdaten-Team | Dimensionen pflegen | `Dimensions`, `Dimension Values` | Pflichtdimensionen anlegen |
| Admin | Change Log aktivieren | `Change Log Setup` | kritische Tabellen überwachen |
| Prozessowner | Workflow prüfen | `Workflows`, `Approval User Setup` | Freigaben für Einkauf/Verkauf definieren |

### E2E-Setupfluss

```mermaid
flowchart LR
    A["Company"] --> B["Users / Permission Sets"]
    B --> C["No. Series"]
    C --> D["Dimensions"]
    D --> E["Posting Groups"]
    E --> F["VAT Posting Setup"]
    F --> G["Workflows"]
    G --> H["Test Posting"]
```

### UAT-Schulung Foundation

Aufgabe:
1. Lege Dimension `CHANNEL` mit Werten `B2B`, `SHOP`, `IC`, `SERVICE`, `PROJECT` an.
2. Setze `CHANNEL` als Pflichtdimension für Debitor `D10000`.
3. Buche eine Verkaufsrechnung ohne `CHANNEL`.
4. Korrigiere den Fehler und buche erneut.

Erwartete Lösung:
- Die Buchung ohne Pflichtdimension wird verhindert oder als Fehler markiert.
- Die korrigierte Buchung erzeugt `G/L Entries` mit Dimension `CHANNEL = B2B`.

Kontrollfrage:
- Warum ist eine Pflichtdimension eher ein Prozesskontrollinstrument als eine reine Reporting-Einstellung?

---

### Greenfield-Einführung: Konzern von null aufbauen

Dieses Kapitel ordnet das Buch neu aus Greenfield-Sicht. Wir beginnen nicht mit einzelnen Funktionen, sondern mit einem leeren Mandanten. Danach entstehen Companies, Rollen, Konten, Dimensionen, Steuerlogik, Lagerorte, Stammdaten, Prozesse, Berichte und Betrieb. So lernt der Leser, Business Central nicht nur zu bedienen, sondern aufzubauen.

### Sinnvolle Buchstruktur von Grund auf

Die bisherige Struktur deckt die Themen fachlich ab. Für Lernen und Einführung ist diese Reihenfolge didaktisch sinnvoller:

| Phase | Buchlogik | Warum diese Reihenfolge? |
|---|---|---|
| 1 | Zielbild, Quellen, Sprachregel | Leser versteht Standard, Pflicht und deutsche Oberfläche |
| 2 | Musterkonzern und Rollen | Leser weiß, wer im System arbeitet |
| 3 | Greenfield-Grundeinrichtung | Mandant, Companies, Konten, USt, Dimensionen, Nummernserien entstehen |
| 4 | Stammdaten und Trainingsdaten | Debitoren, Kreditoren, Artikel, Ressourcen, Projekte, Anlagen |
| 5 | Kernprozesse | Verkauf, Einkauf, Lager, Fertigung, Service, Projekte, Finance |
| 6 | Postenlogik und Reporting | Leser versteht, was Buchungen auslösen |
| 7 | Admin, Governance, Monitoring | System bleibt stabil |
| 8 | Übungen, Lösungen, UAT | Wissen wird praktisch geprüft |

Korrektur zur bisherigen Fassung:
- Kapitel dürfen nicht wie eine Sammlung einzelner Erweiterungen wirken. Der rote Faden ist jetzt: **Greenfield → Setup → Stammdaten → Prozess → Posten → Bericht → Betrieb → Übungslösung**.

### Greenfield-Masterplan der Rhein-Main Industriegruppe

| Schritt | Ergebnis | Deutsche BC-Seiten |
|---|---|---|
| 1 | Firmenstruktur steht | `Unternehmen (Companies)` |
| 2 | Basisdaten je Company gepflegt | `Unternehmensdaten (Company Information)` |
| 3 | Kontenplan steht | `Kontenplan (Chart of Accounts)` |
| 4 | Buchungsgruppen und USt-Logik stehen | `Buchungsmatrix Einrichtung`, `USt-Buchungsmatrix Einrichtung` |
| 5 | Dimensionen stehen | `Dimensionen`, `Standarddimensionen` |
| 6 | Nummernserien stehen | `Nummernserien (No. Series)` |
| 7 | Lagerstruktur steht | `Lagerorte (Locations)`, `Lagerplätze (Bins)` |
| 8 | Benutzer/Rollen stehen | `Benutzer`, `Berechtigungssätze`, `Profile/Rollen` |
| 9 | Stammdaten stehen | `Debitoren`, `Kreditoren`, `Artikel`, `Ressourcen`, `Anlagen`, `Projekte` |
| 10 | Workflows und Kontrollen stehen | `Workflows`, `Genehmigungsanforderungen` |
| 11 | Berichte stehen | `Finanzberichte`, `Analyseansichten` |
| 12 | Betrieb steht | `Aufgabenwarteschlangenposten`, `Änderungsprotokoll`, `Erweiterungsverwaltung` |

### Beispieldatenpaket für den Start

Companies:

| Company | Zweck | Besonderheit |
|---|---|---|
| `RM-PROD` | Produktion | Fertigung, gesteuertes Lager |
| `RM-SALES` | Vertrieb/Onlineshop | Verkauf, Shopify, Dropshipping |
| `RM-SERVICE` | Service/Miete | Serviceaufträge, Wartung, Mietlogik |
| `RM-SHARED` | Einkauf/Shared Services | zentrale Kreditoren, Umlagen |
| `RM-CH` | Ausland/Intercompany | Drittland-/CH-Bezug |

Dimensionen:

| Dimension | Werte |
|---|---|
| `DEPARTMENT` | `SALES`, `PURCH`, `WH`, `PROD`, `SERV`, `FIN`, `ADMIN` |
| `PRODUCTLINE` | `MACHINE`, `SPARE`, `SERVICE`, `PROJECT`, `RENTAL` |
| `CHANNEL` | `B2B`, `SHOP`, `IC`, `EXPORT` |
| `LOCATION-GROUP` | `FRA`, `MZ`, `DA`, `VAN`, `PROJECT` |

Artikel:

| Artikel | Art | Kosten | Verkaufspreis | Prozess |
|---|---|---:|---:|---|
| `RM-M100` | Maschine | 18.000 | 32.000 | Fertigung/Verkauf |
| `SP-PUMP-01` | Ersatzteil | 180 | 320 | Lager/Verkauf |
| `SP-SENSOR-02` | Ersatzteil | 75 | 149 | Shop/Service |
| `RAW-STEEL` | Rohmaterial | 2.500 | - | Einkauf/Fertigung |
| `KIT-MAINT` | Wartungskit | 240 | 450 | Montage/Service |

Debitoren:

| Debitor | Land | Typ | Zahlungsbedingung | Steuerfall |
|---|---|---|---|---|
| `D10000` | DE | B2B | 14 Tage 2 %, 30 Tage netto | Inland |
| `D20000` | FR | EU-B2B | 30 Tage netto | EU-Lieferung |
| `D30000` | CH | Drittland | Vorkasse | Export |
| `D40000` | DE | B2C-Shop | sofort | Onlineshop |

Kreditoren:

| Kreditor | Land | Zweck | Steuerfall |
|---|---|---|---|
| `K10000` | DE | Rohmaterial | Inland |
| `K20000` | NL | Handelsware | EU-Erwerb |
| `K30000` | CH | Spezialteile | Import/Drittland |
| `K40000` | DE | Fremdarbeit | Inland/Fertigung |

### Reihenfolge der praktischen Einrichtung im Buch

1. Company `RM-PROD` anlegen.
2. Unternehmensdaten pflegen.
3. Kontenplan und Sachkontokategorien prüfen.
4. Buchungsgruppen und USt-Buchungsmatrix einrichten.
5. Dimensionen und Pflichtdimensionen einrichten.
6. Nummernserien einrichten.
7. Lagerorte `FRA-ZL`, `MZ-EINFACH`, `VAN-SERV`, `PROJ-LAG` anlegen.
8. für `FRA-ZL` Lagerplätze und gesteuerte Lagerlogik aktivieren.
9. Benutzer und Rollenprofile anlegen.
10. Debitoren, Kreditoren, Artikel, Ressourcen, Projekte und Anlagen anlegen.
11. Verkaufspreislisten und Einkaufspreislisten aktivieren.
12. Workflows für Einkauf, Bankdaten und USt-Setup aktivieren.
13. Beleglayouts, E-Mail-Szenarien und Berichtsauswahl einrichten.
14. Job Queue und Change Log aktivieren.
15. UAT-Basisszenarien buchen.

### Greenfield-UAT mit Lösungserwartung

| Test | Aufgabe | Lösungserwartung |
|---|---|---|
| GF-001 | Company `RM-PROD` anlegen | Company ist sichtbar, Unternehmensdaten gepflegt |
| GF-002 | Dimension `PRODUCTLINE` mit Pflichtwert anlegen | Buchung ohne Dimension wird blockiert |
| GF-003 | Artikel `SP-PUMP-01` anlegen | Artikel hat Buchungsgruppen, Einheit, Kosten, Preis |
| GF-004 | Lagerort `FRA-ZL` als gesteuertes Lager einrichten | Wareneingang läuft über Lagereingang und Einlagerung |
| GF-005 | Debitor D10000 anlegen | Debitor hat Zahlungsbedingung, USt-Logik, Dimension |
| GF-006 | Verkaufsauftrag buchen | Debitorenposten, Sachposten, Artikelposten, USt-Posten entstehen |
| GF-007 | Finanzbericht prüfen | GuV zeigt Erlös und Wareneinsatz nach Dimension |

Merksatz:
- Auf der grünen Wiese zählt die Reihenfolge. Falsche Grundlagen erzeugen später richtige Klicks mit falschem Ergebnis.

---


## 7. Stammdaten der Fallstudie

### Dimensionen

| Dimension | Werte | Zweck |
|---|---|---|
| `COMPANY-GROUP` | PROD, SALES, SERVICE, SHARED, AT | Konzerninterne Auswertung |
| `DEPARTMENT` | SALES, PURCH, WHSE, PROD, SERV, FIN, ADMIN | Rollen- und Kostenstellenlogik |
| `CHANNEL` | B2B, SHOP, IC, SERVICE, PROJECT | Vertriebskanal |
| `PRODUCTLINE` | MACHINE, SPARE, RENTAL, SERVICE | Produktlinie |
| `LOCATION-GROUP` | DIRECTED, SIMPLE, VAN, PROJECT, DROP | Lagerlogik |

### Debitoren

| Nr. | Name | Land | Typ | USt-Logik | Trainingsfall |
|---|---|---|---|---|---|
| `D10000` | Müller Maschinenbau GmbH | DE | B2B | Inland 19 % | Standardverkauf Maschine |
| `D11000` | Handwerk24 Onlinekunde | DE | B2C | Inland 19 % | Onlineshop-Ersatzteil |
| `D20000` | Alpha Machines SAS | FR | EU-B2B | innergemeinschaftlich | EU-Lieferung |
| `D30000` | SwissTech AG | CH | Drittland | Export | Ausfuhrlieferung |
| `D90000` | RM-SALES GmbH IC | DE | Intercompany | Inland/IC | IC-Verkauf PROD an SALES |

### Kreditoren

| Nr. | Name | Land | Typ | Trainingsfall |
|---|---|---|---|---|
| `K10000` | Stahlwerk Ruhr GmbH | DE | Material | Rohmaterial Einkauf |
| `K11000` | Elektro Parts GmbH | DE | Komponenten | Elektronik Einkauf |
| `K20000` | Dropship Europe BV | NL | Dropshipping | Direktlieferung |
| `K30000` | Zollspedition Nord GmbH | DE | Spedition/Zoll | Import/EUSt |
| `K40000` | Lohnfertiger Süd GmbH | DE | Fremdarbeit | Subcontracting |

### Artikel, Ressourcen und Anlagen

| Nr. | Beschreibung | Typ | Lager/Prozess | Standardkosten/Preis |
|---|---|---|---|---:|
| `RM-M100` | Standardmaschine M100 | Fertigerzeugnis | Fertigung/Verkauf | 42.000 / 68.000 |
| `RM-X500` | Sondermaschine X500 | Projekt/Fertigung | Projekt + Fertigung | 90.000 / 145.000 |
| `SP-PUMP-01` | Ersatzteil Pumpe | Lagerartikel | Einkauf/Shop/Service | 180 / 320 |
| `SP-SENSOR-02` | Sensor Set | Lagerartikel mit Seriennr. | Shop/Service | 75 / 149 |
| `RAW-STEEL` | Stahlträger | Rohmaterial | Fertigung | 2.500 / - |
| `COMP-CTRL` | Steuerungseinheit | Komponente | Fertigung | 3.200 / - |
| `KIT-MAINT` | Wartungskit | Montageartikel | Assembly/Service | 240 / 450 |
| `RES-TECH` | Servicetechniker Stunde | Ressource | Service/Projekt | 65 / 115 |
| `FA-CNC-01` | CNC-Anlage | Anlage | Anlagenbuchhaltung | 250.000 |

### Beispielbelege

| Fall | Beleg | Daten | Erwarteter Prozess |
|---|---|---|---|
| S-001 | Sales Order `SO-1001` | D10000 kauft `RM-M100`, 1 Stück | Fertigung → Lieferung → Rechnung |
| S-002 | Shop Order `WEB-24001` | D11000 kauft `SP-PUMP-01`, 2 Stück | Shopify → Fulfillment → Zahlung |
| S-003 | Drop Shipment `SO-1003` | D10000 kauft Handelsware von K20000 | Verkaufsauftrag ↔ Einkaufsbestellung |
| P-001 | Purchase Order `PO-2001` | RAW-STEEL 10 Stück | Wareneingang gesteuertes Lager |
| M-001 | Production Order `PROD-3001` | `RM-M100`, 3 Stück | Verbrauch + Output |
| SV-001 | Service Order `SERV-4001` | Wartung D10000 | Techniker + Ersatzteil |
| J-001 | Project `PROJ-5001` | Installation Sondermaschine | Ressourcen + Material + Faktura |
| F-001 | FA Journal `FA-6001` | CNC-Zugang | Anlage aktivieren + AfA |

---

### Datenqualität, Migration und Stammdaten-Governance

Business Central ist nur so gut wie seine Stammdaten. Falsche Debitoren, Kreditoren, Artikel, Buchungsgruppen oder Dimensionen erzeugen falsche Buchungen, schlechte Berichte und unnötige Korrekturen.

### Stammdaten-Governance

| Stammdatenobjekt | Data Owner | Pflichtprüfung |
|---|---|---|
| Debitor | Vertrieb + Finance | Adresse, USt-ID, Zahlungsbedingung, Buchungsgruppe |
| Kreditor | Einkauf + Finance | Bankdaten, USt, Zahlungsbedingung, Buchungsgruppe |
| Artikel | Stammdaten-Team | Einheit, Kostenmethode, Buchungsgruppen, Lagerlogik |
| Sachkonto | Finance | Direktbuchung, Kategorie, Abschlusslogik |
| Dimension | Controlling | Pflichtwert, erlaubte Werte, Berichtsnutzen |
| Ressource | Projekt/Service | Kosten, Preis, Einheit |
| Anlage | Finance | Anlagenbuchungsgruppe, AfA-Buch |

### Migrationslogik

Microsoft Learn beschreibt Konfigurationspakete als Werkzeug, um Tabellen und Daten für Einrichtung und Migration zu nutzen. [Q80]

Schrittfolge:
1. Datenobjekte festlegen.
2. Datenowner je Objekt benennen.
3. Altbestand exportieren.
4. Dubletten bereinigen.
5. Pflichtfelder definieren.
6. Buchungsgruppen und Dimensionen mappen.
7. Testimport über `Konfigurationspakete (Configuration Packages)`.
8. Fehlerliste bereinigen.
9. Testbuchung mit migrierten Daten durchführen.
10. Produktivimport freigeben.

Stolpersteine:

| Fehler | Wirkung | Lösung |
|---|---|---|
| Debitor ohne USt-Logik | falsche Rechnung | Pflichtfeldprüfung |
| Artikel ohne Kostenmethode | falsche Lagerbewertung | Artikelvorlagen |
| Dimensionen nicht gemappt | Reporting leer | Migrationsmapping |
| alte Dubletten übernommen | OP und Auswertungen unsauber | Dublettenbereinigung |
| Bankdaten ungeprüft | Zahlungsrisiko | Vier-Augen-Freigabe |

Merksatz:
- Migration ist kein technischer Import. Migration ist fachliche Datenqualität mit technischem Werkzeug.

---


## 8. Foundation Setup

### Deutsche BC-Oberfläche: Begriffe, Seiten und Suchlogik

Dieses Kapitel übersetzt die wichtigsten Business-Central-Begriffe in die deutsche Bedienwelt. Es ist bewusst praktisch: Ein Mitarbeiter soll wissen, welchen deutschen Begriff er sieht, welchen englischen Begriff Microsoft Learn verwendet und was die Seite fachlich bedeutet.

### Grundsatz für Schulungen

Schulungen, Arbeitsanweisungen und Screenshots verwenden die deutsche Oberfläche. Englische Begriffe werden in Klammern ergänzt, weil Suchfunktion, Partnerdokumentation und Microsoft Learn teilweise englische Namen verwenden.

| Regel | Anwendung |
|---|---|
| Deutsch zuerst | `Verkaufsaufträge (Sales Orders)` |
| Abkürzungen erklären | `Sachposten (G/L Entries)` |
| Posten immer fachlich erklären | `Debitorenposten = offene und ausgeglichene Kundenforderungen` |
| Tell-Me-Suche zweisprachig schulen | erst deutsch suchen, dann englischen Begriff versuchen |
| Screenshots/Schulungsmandant deutsch | Sprache/Region im Nutzerprofil auf Deutsch/Deutschland setzen |

### Deutsche Seitenbegriffe für Verkauf, Einkauf und Finance

| Deutscher Begriff in der Schulung | Englischer Begriff / Microsoft Learn | Zweck |
|---|---|---|
| Debitoren | Customers | Kundenstammdaten |
| Kreditoren | Vendors | Lieferantenstammdaten |
| Artikel | Items | Material, Ware, Handelsartikel |
| Verkaufsangebote | Sales Quotes | Angebot an Kunden |
| Verkaufsaufträge | Sales Orders | Auftrag, Lieferung, Rechnung |
| Gebuchte Verkaufsrechnungen | Posted Sales Invoices | Nachweis gebuchter Ausgangsrechnungen |
| Verkaufsgutschriften | Sales Credit Memos | Korrektur/Gutschrift im Verkauf |
| Verkaufsreklamationen / Verkaufsreklamationsaufträge | Sales Return Orders | Rücknahmeprozess |
| Einkaufsbestellungen | Purchase Orders | Bestellung beim Lieferanten |
| Einkaufsrechnungen | Purchase Invoices | Eingangsrechnung |
| Gebuchte Einkaufsrechnungen | Posted Purchase Invoices | Nachweis gebuchter Eingangsrechnungen |
| Einkaufsgutschriften | Purchase Credit Memos | Korrektur/Gutschrift im Einkauf |
| Erinnerungen/Mahnungen | Reminders | Mahnprozess |
| Zahlungsjournale | Payment Journals | Zahlungsläufe |
| Zahlungsabstimmungsjournale | Payment Reconciliation Journals | Bank-/Zahlungsabgleich |
| Sachkontenplan | Chart of Accounts | Kontenübersicht |
| Sachposten | General Ledger Entries / G/L Entries | Hauptbuchbuchungen |
| Debitorenposten | Customer Ledger Entries | Forderungen und Ausgleich |
| Kreditorenposten | Vendor Ledger Entries | Verbindlichkeiten und Ausgleich |
| USt-Posten | VAT Entries | Umsatzsteuer/Vorsteuer |
| Finanzberichte | Financial Reports | GuV, Bilanz, Auswertungen |

### Deutsche Seitenbegriffe für Lager, Fertigung, Projekte und Service

| Deutscher Begriff in der Schulung | Englischer Begriff / Microsoft Learn | Zweck |
|---|---|---|
| Lagerorte | Locations | physische oder logische Lager |
| Lagerplätze | Bins | Plätze innerhalb eines Lagerorts |
| Artikelposten | Item Ledger Entries | Mengenbewegungen |
| Wertposten | Value Entries | Wertbewegungen und Kosten |
| Artikeljournale | Item Journals | Bestandskorrekturen |
| Inventurjournale | Physical Inventory Journals | Inventur |
| Lagereinlagerungen | Warehouse Put-aways | gesteuerte Einlagerung |
| Lagerkommissionierungen | Warehouse Picks | gesteuerte Kommissionierung |
| Lagereingänge | Warehouse Receipts | Wareneingänge im Lager |
| Lagerausgänge / Lagerlieferungen | Warehouse Shipments | Versand aus dem Lager |
| Umlagerungsaufträge | Transfer Orders | Bewegung zwischen Lagerorten |
| Montageaufträge | Assembly Orders | Montage/Kits |
| Fertigungsstücklisten | Production BOMs | Materialstruktur |
| Arbeitspläne | Routings | Arbeitsgänge |
| Fertigungsaufträge | Production Orders | Produktion |
| Projekte | Projects / Jobs | Projektgeschäft |
| Projektposten | Project Ledger Entries / Job Ledger Entries | Projektverbrauch/Faktura |
| Ressourcen | Resources | Mitarbeiter/Maschinen/Dienstleistungen |
| Serviceartikel | Service Items | zu wartende Objekte |
| Serviceaufträge | Service Orders | Reparatur/Wartung |
| Serviceverträge | Service Contracts | Wartungsverträge |

### Deutsche Admin- und Superuser-Begriffe

| Deutscher Begriff in der Schulung | Englischer Begriff / Microsoft Learn | Zweck |
|---|---|---|
| Benutzer | Users | Anwender im Mandanten |
| Berechtigungssätze | Permission Sets | Rechtepakete |
| Profile/Rollen | Profiles (Roles) | Rollencenter und Oberfläche |
| Rollencenter | Role Center | Startseite je Rolle |
| Aufgabenwarteschlangenposten | Job Queue Entries | geplante/automatische Läufe |
| Änderungsprotokoll | Change Log | Nachweis von Stammdaten-/Setupänderungen |
| Änderungsprotokollposten | Change Log Entries | konkrete protokollierte Änderung |
| Erweiterungsverwaltung | Extension Management | installierte Apps/Extensions |
| unterstützte Einrichtung | Assisted Setup | Einrichtungsassistenten |
| Konfigurationspakete | Configuration Packages | Datenmigration/Setup-Import |
| Nummernserien | No. Series | Beleg- und Stammdatennummern |
| Buchhaltungsperioden | Accounting Periods | Geschäftsjahr/Perioden |
| Dimensionen | Dimensions | Kostenstellen, Produktlinien, Kanäle |
| Standarddimensionen | Default Dimensions | automatische Dimensionsvorgaben |
| Buchungsgruppen | Posting Groups | Kontenfindung |
| USt-Buchungsmatrix | VAT Posting Setup | Steuerfindung |

### Deutsche Bedienanweisungen: Formulierungsmuster

Falsch für dieses Buch:
- „Open `Sales Orders` and post the invoice.“

Richtig:
- „Öffne über `Alt+Q` die Seite `Verkaufsaufträge (Sales Orders)`. Öffne den Auftrag. Prüfe Debitor, Buchungsdatum, Lagerort, Preis, USt-Produktbuchungsgruppe und Dimensionen. Wähle anschließend `Buchen`.“

Richtig bei Admin-Themen:
- „Öffne `Benutzer (Users)`, prüfe den Benutzer und weise passende `Berechtigungssätze (Permission Sets)` zu. Prüfe danach das `Profil/Rollencenter (Profiles (Roles))`.“

### Mindest-Glossar für jeden Abschnitt

Jeder BC-Abschnitt verwendet diese Struktur:

| Element | Pflicht |
|---|---|
| Seite | deutscher Name plus englischer Suchbegriff |
| Feld | deutscher Feldname, wenn bekannt; englischer Feldname nur als Klammer |
| Aktion | deutsche Aktion, z. B. `Buchen`, `Freigeben`, `Ausgleichen` |
| Posten | deutscher Postenbegriff plus englischer Tabellen-/Learn-Begriff |
| Bericht | deutscher Berichtstitel plus englischer Quellenbegriff |
| Fehlerbild | deutsche Anwendersprache |
| Admin-Hinweis | deutsche Oberfläche und englischer Quellenbegriff |

Merksatz:
- Ein deutsches Schulungsbuch darf englische BC-Begriffe erklären. Es darf sie aber nicht zur Hauptsprache machen.

---

---



## 9. Buchungslogik und Posting Groups

Dieses Kapitel erklärt die Kontenfindung in Business Central so, dass auch Einsteiger verstehen, warum ein Verkaufsauftrag automatisch Forderung, Erlös, Umsatzsteuer, Lagerabgang und Wareneinsatz buchen kann. Danach kannst du eine Buchung nicht nur ausführen, sondern ihre Konten, Nebenbücher und Fehlerquellen erklären.

### Für absolute Einsteiger: Warum braucht Business Central Buchungsgruppen?

Business Central soll nicht bei jeder Rechnung fragen, welches Sachkonto für Forderungen, Erlöse, Verbindlichkeiten, Vorsteuer, Lagerbestand oder Wareneinsatz verwendet werden soll. Das wäre fehleranfällig und für Anwender kaum beherrschbar. Deshalb nutzt Business Central Buchungsgruppen. Eine Buchungsgruppe ist eine Stammdateninformation, die später bei der Buchung die richtigen Konten findet.

Das Grundprinzip ist einfach: Der Debitor sagt, auf welches Forderungskonto gebucht wird. Der Artikel sagt, welche Produktlogik gilt. Der Lagerort und die Lagerbuchungsgruppe sagen, welches Bestandskonto betroffen ist. Die USt-Buchungsgruppen sagen, welche Steuerlogik gilt. Die Buchungsmatrizen verbinden diese Informationen zu einer konkreten Buchung.

Praxisregel:
- Anwender erfassen Belege. Key User und Finance sorgen dafür, dass Buchungsgruppen und Buchungsmatrizen vorher richtig eingerichtet sind.

### Warum entstehen aus Stammdaten später Sachkonten?

Business Central trennt Bedienung und Buchungslogik. Der Verkäufer wählt im Verkaufsauftrag den Debitor und den Artikel. Er wählt normalerweise kein Forderungskonto, kein Erlöskonto, kein USt-Konto und kein Lagerbestandskonto. Diese Konten entstehen aus den Stammdaten, weil Debitor, Artikel, Lagerort, Bank und Buchungsmatrizen vorher fachlich eingerichtet wurden.

Das ist der Kern der Kontenfindung: Stammdaten liefern Gruppen. Buchungsmatrizen übersetzen diese Gruppen in Sachkonten. Die Buchung erzeugt daraus Sachposten, Nebenbuchposten, USt-Posten, Artikelposten und Wertposten.

| Eingabe im Beleg | Stammdatenlogik | Ergebnis in der Buchung |
|---|---|---|
| Debitor `D10000` | Debitorenbuchungsgruppe und Geschäftsbuchungsgruppe | Forderungskonto und Marktlogik |
| Artikel `RM-M100` | Produktbuchungsgruppe, Lagerbuchungsgruppe, USt-Produktbuchungsgruppe | Erlös, Wareneinsatz, Bestand und Steuerprodukt |
| Lagerort `FRA-ZL` | Lagerort plus Lagerbuchungsmatrix | Bestandskonto |
| USt-Gruppen | USt-Buchungsmatrix | USt-Konto, Steuersatz und Steuerart |
| Bankkonto | Bankkontobuchungsgruppe | Bank-Sachkonto |

### Welche Buchungsgruppen kommen woher?

| Herkunft | Buchungsgruppe | Was steuert sie? | Rhein-Main-Beispiel |
|---|---|---|---|
| Debitor | Debitorenbuchungsgruppe (Customer Posting Group) | Forderungskonto | `D10000` → Forderungen Inland |
| Kreditor | Kreditorenbuchungsgruppe (Vendor Posting Group) | Verbindlichkeitskonto | `K10000` → Verbindlichkeiten Inland |
| Bankkonto | Bankkontobuchungsgruppe (Bank Account Posting Group) | Bank-Sachkonto | Hausbank RM-SHARED |
| Artikel | Produktbuchungsgruppe (General Product Posting Group) | Erlös-, Aufwands- und Wareneinsatzlogik | `RM-M100` → Maschinen |
| Debitor/Kreditor | Geschäftsbuchungsgruppe (General Business Posting Group) | Markt-/Partnerlogik | Inland, EU, Drittland |
| Artikel | Lagerbuchungsgruppe (Inventory Posting Group) | Bestandskonto | Fertigerzeugnisse Maschinen |
| Debitor/Kreditor | USt-Geschäftsbuchungsgruppe (VAT Business Posting Group) | steuerliche Partnerlogik | Inland 19 %, EU-B2B, Drittland |
| Artikel/Sachkonto | USt-Produktbuchungsgruppe (VAT Product Posting Group) | steuerliche Produktlogik | Voller Satz, steuerfrei, Reverse Charge |

### Was machen die drei Matrizen?

Die Allgemeine Buchungsmatrix Einrichtung (General Posting Setup) verbindet Geschäftsbuchungsgruppe und Produktbuchungsgruppe. Sie entscheidet zum Beispiel, welches Erlöskonto und welches Wareneinsatzkonto bei einem Verkauf verwendet werden.

Die USt-Buchungsmatrix Einrichtung (VAT Posting Setup) verbindet USt-Geschäftsbuchungsgruppe und USt-Produktbuchungsgruppe. Sie entscheidet, ob 19 Prozent Umsatzsteuer, Vorsteuer, steuerfrei, innergemeinschaftlich oder ein anderer Steuerfall gebucht wird.

Die Lagerbuchungsmatrix Einrichtung (Inventory Posting Setup) verbindet Lagerort und Lagerbuchungsgruppe. Sie entscheidet, welches Bestandskonto für den Lagerwert verwendet wird.

| Matrix | Kombiniert | Ergebnis |
|---|---|---|
| Allgemeine Buchungsmatrix Einrichtung | Wer handelt? + was wird gehandelt? | Erlös, Aufwand, Wareneinsatz |
| USt-Buchungsmatrix Einrichtung | steuerlicher Partner + steuerliches Produkt | USt-/Vorsteuerkonto, Steuersatz, Steuerart |
| Lagerbuchungsmatrix Einrichtung | Lagerort + Lagerbuchungsgruppe | Bestandskonto |

### Rhein-Main-Komplettfall: `D10000` kauft `RM-M100`

RM-SALES verkauft eine Standardmaschine `RM-M100` an Debitor `D10000`.

Testdaten:

| Feld | Wert |
|---|---|
| Debitor | `D10000` Müller Maschinenbau GmbH |
| Artikel | `RM-M100` Standardmaschine |
| Menge | `1` |
| Verkaufspreis netto | `68.000 EUR` |
| angenommener Lagerwert / Kosten | `42.000 EUR` |
| USt | `19 %` = `12.920 EUR` |
| Bruttobetrag | `80.920 EUR` |
| Lagerort | `FRA-ZL` |
| Dimension | `PRODUCTLINE = MACHINE`, `CHANNEL = B2B` |

Buchungsgruppen im Fall:

| Quelle | Wertbeispiel | Wirkung |
|---|---|---|
| Debitor `D10000` | Debitorenbuchungsgruppe `INLAND` | Forderung Inland |
| Debitor `D10000` | Geschäftsbuchungsgruppe `DE-INLAND` | inländischer Verkauf |
| Debitor `D10000` | USt-Geschäftsbuchungsgruppe `DE-INLAND` | deutsche USt-Logik |
| Artikel `RM-M100` | Produktbuchungsgruppe `MACHINE` | Erlöskonto Maschinen und Wareneinsatz Maschinen |
| Artikel `RM-M100` | USt-Produktbuchungsgruppe `VAT19` | voller deutscher Steuersatz |
| Artikel `RM-M100` | Lagerbuchungsgruppe `FG-MACHINE` | Bestand Fertigerzeugnisse Maschinen |
| Lagerort `FRA-ZL` | Lagerortcode | Bestandskonto über Lagerbuchungsmatrix |

Buchungsspur:

| Ebene | Erwartete Wirkung | Wo prüfen? |
|---|---|---|
| Verkaufsauftrag | `D10000`, `RM-M100`, Menge `1`, Preis `68.000 EUR` | `Verkaufsaufträge (Sales Orders)` |
| Debitorenposten | Forderung `80.920 EUR` | `Debitorenposten (Customer Ledger Entries)` |
| Sachposten Forderung | Soll Forderungen `80.920 EUR` | `Sachposten (G/L Entries)` |
| Sachposten Erlös | Haben Umsatzerlöse Maschinen `68.000 EUR` | `Sachposten (G/L Entries)` |
| USt-Posten | Steuerbasis `68.000 EUR`, USt `12.920 EUR` | `USt-Posten (VAT Entries)` |
| Artikelposten | Mengenabgang `1` Stück `RM-M100` | `Artikelposten (Item Ledger Entries)` |
| Wertposten | Kostenabgang `42.000 EUR` | `Wertposten (Value Entries)` |
| Sachposten Wareneinsatz | Soll Wareneinsatz Maschinen `42.000 EUR` | `Sachposten (G/L Entries)` |
| Sachposten Bestand | Haben Bestand Fertigerzeugnisse `42.000 EUR` | `Sachposten (G/L Entries)` |
| Bericht | Erlös und Wareneinsatz nach `PRODUCTLINE = MACHINE` | `Finanzberichte (Financial Reports)` |

### Was passiert bei falscher Buchungsgruppe?

| Fehler | Symptom | Ursache | Diagnosepfad | Korrektur |
|---|---|---|---|---|
| falsche Produktbuchungsgruppe am Artikel | Erlös landet auf falschem Konto | Artikel `RM-M100` als Handelsware statt Maschine gepflegt | Artikelkarte → Buchungsgruppen → Sachposten | Stammdaten korrigieren, gebuchten Beleg fachlich gutschreiben und neu buchen |
| falsche USt-Produktbuchungsgruppe | USt-Posten falsch | Artikel steuerlich falsch klassifiziert | Verkaufsbeleg → USt-Posten → USt-Buchungsmatrix | Steuerlich freigegebene Korrektur über Gutschrift/Neubuchung |
| fehlende Lagerbuchungsmatrix | Buchung bricht ab oder Bestandkonto fehlt | Kombination Lagerort `FRA-ZL` und Lagerbuchungsgruppe fehlt | Fehlermeldung → Lagerbuchungsmatrix Einrichtung | Matrix ergänzen, Buchung erneut starten |
| falsche Debitorenbuchungsgruppe | Forderung auf falschem Sammelkonto | Debitorenkarte falsch eingerichtet | Debitorenposten → Sachposten Forderung | Debitor korrigieren; bestehende Buchung nur über freigegebenen Korrekturweg berichtigen |

Übung:
1. Öffne `Artikel (Items)` und prüfe `RM-M100`.
2. Notiere Produktbuchungsgruppe, Lagerbuchungsgruppe und USt-Produktbuchungsgruppe.
3. Öffne `Debitoren (Customers)` und prüfe `D10000`.
4. Notiere Debitorenbuchungsgruppe, Geschäftsbuchungsgruppe und USt-Geschäftsbuchungsgruppe.
5. Öffne `Allgemeine Buchungsmatrix Einrichtung (General Posting Setup)`.
6. Prüfe die Kombination aus Geschäftsbuchungsgruppe und Produktbuchungsgruppe.
7. Öffne `USt-Buchungsmatrix Einrichtung (VAT Posting Setup)`.
8. Prüfe die Steuerkombination.
9. Öffne `Lagerbuchungsmatrix Einrichtung (Inventory Posting Setup)`.
10. Prüfe die Kombination aus `FRA-ZL` und Lagerbuchungsgruppe.

Lösungsskizze:
- Die Forderung kommt aus der Debitorenbuchungsgruppe.
- Der Erlös und Wareneinsatz kommen aus der Allgemeinen Buchungsmatrix.
- Die USt kommt aus der USt-Buchungsmatrix.
- Der Lagerbestand kommt aus der Lagerbuchungsmatrix.
- Die Dimensionen erklären nicht das Konto, sondern die Auswertung.

UAT-Fall:

| Feld | Inhalt |
|---|---|
| ID | `UAT-SETUP-POSTING-001` |
| Ziel | Kontenfindung für Verkauf `RM-M100` nachweisen |
| Rolle | Finance Key User |
| Voraussetzung | Debitor `D10000`, Artikel `RM-M100`, Lagerort `FRA-ZL`, Buchungsmatrizen gepflegt |
| Testdaten | Preis `68.000 EUR`, Kosten `42.000 EUR`, USt `19 %` |
| Schrittfolge | Stammdaten prüfen, Buchungsvorschau aus Verkaufsauftrag starten, Posten kontrollieren |
| Erwartete Posten | Debitorenposten, Sachposten, Artikelposten, Wertposten, USt-Posten |
| Kontrollbericht | `Finanzberichte (Financial Reports)` und `Lagerbewertung (Inventory Valuation)` |
| Akzeptanzkriterium | Forderung, Erlös, USt, Bestand und Wareneinsatz werden auf erwartete Konten gebucht |

### In 5 Minuten merken

* 5 wichtigste Begriffe: Debitorenbuchungsgruppe, Produktbuchungsgruppe, Allgemeine Buchungsmatrix, USt-Buchungsmatrix, Lagerbuchungsmatrix.
* 5 wichtigste Seiten: `Debitoren`, `Artikel`, `Allgemeine Buchungsmatrix Einrichtung`, `USt-Buchungsmatrix Einrichtung`, `Lagerbuchungsmatrix Einrichtung`.
* 3 häufigste Fehler: falsche Produktbuchungsgruppe, fehlende Lagerbuchungsmatrix, falsche USt-Gruppe.
* 3 Prüfungsfallen: Buchungsgruppe ist nicht Dimension, USt-Matrix ist nicht allgemeine Buchungsmatrix, Artikelposten zeigen Menge und Wertposten zeigen Wert.
* 1 Praxisregel: Vor Go-live werden Buchungsgruppen mit Buchungsvorschau und Testposten geprüft, nicht erst im Monatsabschluss.

### Bilanz, GuV, Nebenbücher und Postenlogik verstehen

Dieses Kapitel erklärt, wie Business Central finanziell „denkt“. Wer BC bedienen will, muss Belege, Buchungen, Posten (Entries), Nebenbücher und Hauptbuch unterscheiden. Danach kannst du aus einer Rechnung die Wirkung auf Bilanz, GuV, offene Posten, Lagerwert und Controlling nachvollziehen.

### Das Grundbild: Beleg, Buchung, Posten, Bericht

| Ebene | Einsteiger-Erklärung | Beispiel |
|---|---|---|
| Beleg | fachliches Dokument vor oder nach Buchung | Verkaufsauftrag, Einkaufsrechnung |
| Buchung (Posting) | Aktion, die aus einem Beleg verbindliche Einträge erzeugt | `Post`, `Post and Send` |
| Posten (Entry) | gespeicherte Buchungsspur in Tabellen | `G/L Entry`, `Customer Ledger Entry` |
| Nebenbuch | Detailbuch für Debitoren, Kreditoren, Artikel, Anlagen | Kundenposten, Artikelposten |
| Hauptbuch | finanzielle Gesamtsicht über Sachkonten | Bilanz und GuV |
| Bericht | Auswertung aus Posten und Stammdaten | Financial Report, Lagerbewertung |

Merksatz:
- Der Beleg erzählt, was passieren sollte. Die Posten zeigen, was tatsächlich gebucht wurde.

### Die wichtigsten Postenarten

| Postenart | Deutsch | Wofür? | Typische Frage |
|---|---|---|---|
| `G/L Entries` | Sachposten | Hauptbuch, Bilanz, GuV | Welches Konto wurde bebucht? |
| `Customer Ledger Entries` | Debitorenposten | Forderungen, offene Kundenposten | Zahlt der Kunde noch? |
| `Vendor Ledger Entries` | Kreditorenposten | Verbindlichkeiten, offene Lieferantenposten | Müssen wir noch zahlen? |
| `VAT Entries` | USt-Posten | Umsatzsteuer/Vorsteuer | Welche Steuer wurde gemeldet? |
| `Item Ledger Entries` | Artikelposten | Mengenbewegung | Wie viele Stück sind wo? |
| `Value Entries` | Wertposten | Lagerwert und Wareneinsatz | Welcher Wert hängt an der Menge? |
| `FA Ledger Entries` | Anlagenposten | Anlagenbuchhaltung | Anschaffung, AfA, Abgang |
| `Project Ledger Entries` | Projektposten | Projektverbrauch und Faktura | Was wurde auf Projekt gebucht? |

Microsoft Learn beschreibt das Hauptbuch und den Kontenplan als Speicher der Finanzdaten. Finanzberichte nutzen diese Daten, um Bilanz, GuV und Analysen zu erstellen. [Q61][Q48]

### Beispiel: Verkauf mit Lagerartikel

Use Case:
- RM-SALES verkauft `10` Stück `SP-PUMP-01` für `285 EUR` netto je Stück an D10000.
- Kosten je Stück: `180 EUR`.
- USt: `19 %`.

Wirkung:

| Bereich | Wirkung |
|---|---|
| Debitor | Forderung `3.391,50 EUR` |
| Erlös | Umsatzerlös `2.850,00 EUR` |
| USt | Umsatzsteuer `541,50 EUR` |
| Lager | Bestand sinkt um `10` Stück |
| GuV | Wareneinsatz `1.800,00 EUR` |
| Marge | Rohertrag `1.050,00 EUR` |

Postenspur:
1. `Sales Order` buchen.
2. `Posted Sales Invoice` öffnen.
3. `Customer Ledger Entries` prüfen: Forderung.
4. `G/L Entries` prüfen: Forderung, Erlös, USt, Wareneinsatz, Bestandskonto.
5. `Item Ledger Entries` prüfen: Mengenabgang.
6. `Value Entries` prüfen: Wertabgang und Kosten.
7. `VAT Entries` prüfen: Steuerbasis und Steuerbetrag.
8. `Financial Reports` prüfen: GuV-Auswirkung.

Prüfungsfalle:
- Viele Einsteiger suchen den Wareneinsatz in der Verkaufsrechnung. Der Wareneinsatz ergibt sich aus Artikel-/Wertposten und der Lagerbuchhaltung. Er muss mit dem Hauptbuch abgestimmt werden.

### Bilanz und GuV in BC lesen

| Geschäftsvorfall | Bilanzwirkung | GuV-Wirkung |
|---|---|---|
| Warenkauf auf Rechnung | Vorräte steigen, Verbindlichkeit steigt | keine GuV, solange Lagerbestand bleibt |
| Warenverkauf | Forderung steigt, Vorräte sinken | Erlös und Wareneinsatz |
| Zahlungseingang | Bank steigt, Forderung sinkt | keine neue GuV-Wirkung |
| Anlagenkauf | Anlagevermögen steigt, Bank/Kreditor sinkt/steigt | keine sofortige GuV außer Nebenkostenlogik |
| Abschreibung | Anlagevermögen sinkt | Abschreibungsaufwand |
| Eingangsrechnung Dienstleistung | Verbindlichkeit steigt | Aufwand steigt |

BC-Best-Practice:
- Jeder Controller lernt Rückwärtsnavigation: Financial Report → G/L Entry → Source Document → Nebenbuch → Stammdaten.
- Jeder Buchhalter lernt Vorwärtsnavigation: Beleg → Posting Preview → gebuchter Beleg → Entries → Bericht.

### Kostenlogik, Lagerwert und GuV

Microsoft Learn beschreibt, dass Lagerkosten regelmäßig angepasst und ins Hauptbuch übertragen werden müssen. Costing Methods bestimmen, wie Abgänge bewertet werden; Cost Adjustment aktualisiert Wareneinsatz und Lagerwerte, wenn spätere Einkaufskosten zugeordnet werden. [Q62][Q63]

Einsteigerbild:
- `Item Ledger Entries` beantworten „wie viel?“
- `Value Entries` beantworten „welcher Wert?“
- `G/L Entries` beantworten „welches Konto?“

Stolpersteine:

| Fehler | Auswirkung | Lösung |
|---|---|---|
| Kostenregulierung nicht gelaufen | Marge und Lagerwert sind vorläufig | `Adjust Cost - Item Entries` / Job Queue prüfen |
| Einkauf nur geliefert, nicht fakturiert | erwartete Kosten können von endgültigen Kosten abweichen | Wareneingang und Rechnung abstimmen |
| falsche Bewertungsmethode | Lagerwert und COGS falsch | Artikelsetup vor Go-Live prüfen |
| direkte Sachkontobuchung auf Lagerkonto | Nebenbuch passt nicht zum Hauptbuch | Lagerkonten nur über Warenprozesse bebuchen |
| Inventur ohne Wertkontrolle | Menge stimmt, Wert bleibt unklar | Lagerbewertung und Value Entries prüfen |

### UAT-Übung: Eine Rechnung bis zur Bilanz verfolgen

Aufgabe:
1. Erstelle Verkaufsauftrag D10000 mit `SP-PUMP-01`, Menge `10`.
2. Nutze `Preview Posting`, wenn verfügbar.
3. Buche Lieferung und Rechnung.
4. Öffne `Posted Sales Invoice`.
5. Prüfe `Customer Ledger Entries`.
6. Prüfe `G/L Entries`.
7. Prüfe `Item Ledger Entries`.
8. Prüfe `Value Entries`.
9. Öffne `Financial Reports` und filtere den Monat.
10. Erkläre, welche Zeilen Bilanz betreffen und welche Zeilen GuV betreffen.

Merksatz:
- Wer BC verstehen will, folgt nicht nur dem Beleg. Er folgt der Postenkette.

---

## 10. Dimensionen und Reportingachsen

Dimensionen sind die Auswertungsachsen der Rhein-Main Industriegruppe. Nach diesem Kapitel kannst du erklären, warum Dimensionen keine Konten und keine Companies sind, wie sie in Belege gelangen und wie Controller eine GuV nach Produktlinie, Vertriebskanal und Abteilung prüfen.

### Kapitelbox

| Feld | Inhalt |
|---|---|
| Zielgruppe | Einsteiger, Key User, Consultant, Architect |
| Schwierigkeit | Basic bis Intermediate |
| Prozessbereich | Foundation, Reporting, R2R |
| Betroffene Companies | RM-SALES, RM-PROD, RM-SERVICE, RM-SHARED |
| MB-800-Relevanz | Ja: Dimensions, Dimension Values, Default Dimensions, Dimension Correction Tool |
| Solution-Architect-Relevanz | Ja: Reportingmodell, Pflichtdimensionen, Company-vs.-Dimension-Entscheidung |
| Benötigte Vorkenntnisse | Belege, Sachposten, Buchungsgruppen aus Kapitel 9 |
| Ergebnis nach dem Kapitel | Du kannst Dimensionen einrichten, in Belegen prüfen, in Sachposten nachweisen und Reportingfehler korrigieren. |

### Für absolute Einsteiger: Was ist eine Dimension?

Eine Dimension ist ein Auswertungsmerkmal. Sie ist kein Sachkonto und keine Company. Das Sachkonto entscheidet, ob etwas Forderung, Erlös, Aufwand, Bestand oder Bank ist. Die Company entscheidet, in welcher rechtlichen Einheit gebucht wird. Die Dimension ergänzt diese Buchung um eine fachliche Sicht, zum Beispiel Produktlinie, Vertriebskanal, Abteilung oder Standortgruppe.

Beispiel: Der Verkauf von `RM-M100` bucht Erlös auf ein Erlöskonto. Mit der Dimension `PRODUCTLINE = MACHINE` erkennt Controlling zusätzlich, dass der Erlös zur Maschinenlinie gehört. Mit `CHANNEL = B2B` erkennt Vertrieb, dass der Verkauf aus dem B2B-Kanal kam. Das Konto bleibt gleich; die Auswertung wird genauer.

Praxisregel:
- Konten beantworten „Was ist es bilanziell?“. Companies beantworten „Welche rechtliche Einheit?“. Dimensionen beantworten „Wofür, wo, über welchen Kanal und für welche Produktlinie?“.

### Warum braucht Rhein-Main diesen Prozess?

Rhein-Main braucht eine GuV nicht nur für die gesamte Company, sondern nach Produktlinie, Kanal, Abteilung und Lagerlogik. Ohne Dimensionen wüsste die Geschäftsführung zwar, wie hoch der Gesamtumsatz ist, aber nicht, ob Maschinen, Ersatzteile, Service, Projekte oder Miete profitabel sind. Auch Standort- und Lagerentscheidungen wären kaum belastbar.

### Warum Dimensionen keine Konten und keine Companies sind

Ein Konto ist Bestandteil der Finanzbuchhaltung. Es entscheidet, ob ein Betrag als Forderung, Erlös, Aufwand, Bestand, USt oder Bank erscheint. Eine Company ist die buchende rechtliche Einheit. Eine Dimension ist eine zusätzliche Auswertungsachse innerhalb derselben Buchung.

| Begriff | Entscheidet über | Rhein-Main-Beispiel | Typischer Fehler |
|---|---|---|---|
| Company | rechtliche Einheit | `RM-SALES GmbH` verkauft an Kunde | eine Produktlinie als eigene Company anlegen |
| Sachkonto | Bilanz-/GuV-Position | Erlöskonto Maschinenverkauf | Dimension als Konto missbrauchen |
| Dimension | Analyse und Steuerung | `PRODUCTLINE = MACHINE` | Dimension vergessen und GuV nach Produktlinie leer erhalten |

| Dimension | Warum Rhein-Main sie nutzt | Typische Frage |
|---|---|---|
| `PRODUCTLINE` | Maschinen, Ersatzteile, Service, Projekte und Miete trennen | Welche Produktlinie verdient Geld? |
| `CHANNEL` | B2B, Onlineshop, Intercompany und Service unterscheiden | Welcher Vertriebskanal erzeugt Marge? |
| `DEPARTMENT` | Vertrieb, Einkauf, Lager, Fertigung, Service, Finance trennen | Welche Abteilung verursacht Kosten? |
| `LOCATION-GROUP` | gesteuertes Lager, einfaches Lager, Fahrzeuglager, Projektlager trennen | Welche Lagerlogik bindet Wert und Aufwand? |

### Dimensionsmodell der Rhein-Main Industriegruppe

| Dimension | Werte | Zweck |
|---|---|---|
| `COMPANY-GROUP` | PROD, SALES, SERVICE, SHARED, AT | Konzerninterne Auswertung |
| `DEPARTMENT` | SALES, PURCH, WHSE, PROD, SERV, FIN, ADMIN | Rollen- und Kostenstellenlogik |
| `CHANNEL` | B2B, SHOP, IC, SERVICE, PROJECT | Vertriebskanal |
| `PRODUCTLINE` | MACHINE, SPARE, RENTAL, SERVICE | Produktlinie |
| `LOCATION-GROUP` | DIRECTED, SIMPLE, VAN, PROJECT, DROP | Lagerlogik |

Praktisch nutzt Rhein-Main `PRODUCTLINE` und `DEPARTMENT` als globale Dimensionen, weil diese beiden Achsen fast jede GuV-Frage beantworten. `CHANNEL` und `LOCATION-GROUP` werden als Shortcut-Dimensionen sichtbar gemacht, damit Vertriebskanal und Lagerlogik im Alltag sichtbar bleiben.

### Konkrete BC-Schritte mit Alt+Q

1. Öffne `Alt+Q` und suche `Dimensionen (Dimensions)`.
2. Prüfe die Werte für `PRODUCTLINE`, `DEPARTMENT`, `CHANNEL` und `LOCATION-GROUP`.
3. Öffne `Standarddimensionen (Default Dimensions)` am Debitor, Kreditor, Artikel oder Sachkonto.
4. Öffne `Finanzbuchhaltung Einrichtung (General Ledger Setup)` und prüfe die globalen Dimensionen.
5. Öffne `Dimensionskombinationen (Dimension Combinations)` und prüfe gesperrte Kombinationen.
6. Prüfe vor dem Buchen, ob Pflichtdimensionen vorhanden sind.
7. Öffne nach dem Buchen `Sachposten (G/L Entries)` und blende die Dimensionen ein.
8. Öffne `Finanzberichte (Financial Reports)` und filtere die GuV nach `PRODUCTLINE`, `CHANNEL` und `DEPARTMENT`.

### Wo Dimensionen gepflegt werden

| Ort | Zweck | Beispiel |
|---|---|---|
| `Dimensionen (Dimensions)` | Dimension und Dimensionswerte anlegen | `PRODUCTLINE`, Wert `MACHINE` |
| `Standarddimensionen (Default Dimensions)` | Vorschlag oder Pflicht an Stammdaten setzen | Artikel `RM-M100` bekommt `PRODUCTLINE = MACHINE` |
| Debitorenkarte | Kundenspezifische Dimensionen | `D10000` bekommt `CHANNEL = B2B` |
| Artikelkarte | Artikelbezogene Dimensionen | `SP-PUMP-01` bekommt `PRODUCTLINE = SPARE` |
| Sachkontokarte | Kontenbezogene Pflichtdimensionen | Marketingaufwand braucht `DEPARTMENT` |
| Belegzeile | Dimension im konkreten Vorgang prüfen oder ergänzen | Verkaufszeile `RM-M100` |
| `Sachposten (G/L Entries)` | Dimension nach dem Buchen kontrollieren | Erlös mit `PRODUCTLINE = MACHINE` |

Pflichtdimensionen wirken wie eine fachliche Schranke. Wenn für ein Sachkonto, einen Artikel oder einen Debitor eine Dimension zwingend ist, verhindert Business Central die Buchung oder meldet einen Fehler, solange der Dimensionswert fehlt oder unzulässig ist.

### Dimensionen nach dem Buchen prüfen

1. Öffne `Alt+Q`.
2. Suche `Sachposten (G/L Entries)`.
3. Filtere auf die Belegnummer der gebuchten Verkaufsrechnung.
4. Blende die Spalten für `PRODUCTLINE`, `CHANNEL`, `DEPARTMENT` und `LOCATION-GROUP` ein.
5. Prüfe, ob Erlös, Wareneinsatz, Forderung und USt die erwarteten Dimensionen tragen.
6. Öffne `Finanzberichte (Financial Reports)` und filtere nach `PRODUCTLINE = MACHINE`.
7. Vergleiche, ob die Summe mit den Sachposten übereinstimmt.

### Standarddimensionen, globale Dimensionen, Shortcut-Dimensionen und Dimensionskombinationen

Standarddimensionen sind Vorschläge oder Pflichtwerte an Stammdaten. Sie sorgen dafür, dass der Anwender nicht jedes Mal neu überlegen muss. Eine Standarddimension kann als Vorschlag wirken oder eine Buchung blockieren, wenn der Wert fehlt.

Globale Dimensionen sind die zwei wichtigsten Dimensionen einer Company. Sie sind besonders stark in Auswertungen, Filtern und Berichten verankert. Rhein-Main nutzt dafür typischerweise `PRODUCTLINE` und `DEPARTMENT`, weil diese beiden Achsen fast jede GuV-Frage beantworten. Eine Änderung globaler Dimensionen ist kein Alltagsvorgang und wird vor Go-live entschieden.

Shortcut-Dimensionen sind zusätzliche Dimensionen, die Anwender schnell auf Belegen sehen und pflegen können. Sie helfen im Alltag, ersetzen aber keine fachliche Pflichtprüfung. Rhein-Main nutzt `CHANNEL` und `LOCATION-GROUP` als praktische Zusatzachsen, damit Vertriebskanal und Lagerlogik in Belegen sichtbar bleiben.

Dimensionskombinationen verhindern fachlich unsinnige Kombinationen. Beispiel: `CHANNEL = SHOP` passt nicht zu einem Intercompany-Verkauf, und `LOCATION-GROUP = VAN` passt nicht zu einer normalen Fertigungseinlagerung. Solche Regeln schützen die Auswertung vor scheinbar kleinen Eingabefehlern.

| Konzept | Einsteigerbild | Rhein-Main-Beispiel |
|---|---|---|
| globale Dimension | wichtigste Auswertungsachse | `PRODUCTLINE`, `DEPARTMENT` |
| Shortcut-Dimension | schnell sichtbares Eingabefeld | `CHANNEL`, `LOCATION-GROUP` |
| Standarddimension | automatischer Vorschlag oder Pflichtwert | Artikel `RM-M100` schlägt `MACHINE` vor |
| Dimensionskombination | erlaubte oder verbotene Kombination | `SHOP` nicht mit `IC` kombinieren |

### Rhein-Main-Komplettfall: Verkauf `RM-M100` mit Reportingdimensionen

RM-SALES verkauft eine Standardmaschine `RM-M100` an `D10000`. Der Verkaufspreis beträgt `68.000 EUR`. Die Dimensionen lauten:

| Dimension | Wert | Herkunft |
|---|---|---|
| `PRODUCTLINE` | `MACHINE` | Standarddimension am Artikel `RM-M100` |
| `CHANNEL` | `B2B` | Standarddimension am Debitor `D10000` oder Belegkopf |
| `DEPARTMENT` | `SALES` | Rolle/Belegkopf des Vertriebs |
| `LOCATION-GROUP` | `DIRECTED` | Lagerort für gesteuertes Lager |

Diese Dimensionen laufen mit der Buchung in die Sachposten. Für den Controller zählt besonders der Erlösposten. Er muss im Finanzbericht für `PRODUCTLINE = MACHINE`, `CHANNEL = B2B` und `DEPARTMENT = SALES` erscheinen. Artikelposten und Wertposten zeigen die Mengen- und Kostenwirkung; Sachposten zeigen Erlös, Forderung, USt und Wareneinsatz mit Dimensionen.

### Prüfung in Sachposten und GuV

| Prüfung | Seite | Erwartung |
|---|---|---|
| Erlösdimension | `Sachposten (G/L Entries)` | Erlösposten trägt `PRODUCTLINE = MACHINE`, `CHANNEL = B2B`, `DEPARTMENT = SALES` |
| Forderung | `Debitorenposten (Customer Ledger Entries)` | Forderung gegen `D10000` ist offen oder später ausgeglichen |
| USt | `USt-Posten (VAT Entries)` | Steuerbetrag gehört zum gebuchten Verkaufsbeleg |
| Lagerwirkung | `Artikelposten (Item Ledger Entries)` und `Wertposten (Value Entries)` | Lagerabgang und Kostenabgang zu `RM-M100` sind vorhanden |
| GuV | `Finanzberichte (Financial Reports)` | Umsatz erscheint im Filter `PRODUCTLINE = MACHINE`, `CHANNEL = B2B` und `DEPARTMENT = SALES` |

Kontrollfrage:
- Stimmt die Gesamt-GuV, aber die GuV nach Produktlinie nicht, liegt der Fehler häufig nicht im Konto, sondern in der Dimension.

### Dimension Correction Tool: Was es kann und was nicht

Das Dimension Correction Tool kann Dimensionen auf Sachposten korrigieren, wenn eine Buchung fachlich richtig war, aber die Auswertungsdimension falsch oder unvollständig ist. Es ersetzt keine Gutschrift, keine Stornobuchung und keine Korrektur in Nebenbüchern.

| Situation | Dimension Correction sinnvoll? | Begründung |
|---|---|---|
| Erlös wurde auf richtiges Konto gebucht, aber `PRODUCTLINE` fehlt | Ja, nach Freigabe | Auswertung falsch, Buchung selbst fachlich korrekt |
| falscher Debitor wurde fakturiert | Nein | Beleg und Nebenbuch sind falsch |
| falsche USt-Gruppe wurde genutzt | Nein | Steuerposten und Sachposten sind falsch |
| Artikel wurde aus falschem Lagerort geliefert | Nein | Artikelposten und Lagerlogik sind falsch |
| Kostenstelle fehlt auf Sachbuchung | Ja, wenn fachlich eindeutig | Reportingdimension korrigierbar |

### Fehlerdiagnose: Dimension fehlt oder falscher Wert

Fall: Verkaufsauftrag `SO-1001` für `RM-M100` wurde korrekt an `D10000` gebucht. Der Erlös beträgt `68.000 EUR`. Auf der Verkaufszeile fehlt jedoch `PRODUCTLINE = MACHINE`; stattdessen steht `PRODUCTLINE = SPARE`.

Symptom:
- Die Gesamt-GuV stimmt.
- Die GuV nach Produktlinie zeigt zu wenig Maschinenumsatz und zu viel Ersatzteilumsatz.
- Debitorenposten, USt-Posten und Betrag sind korrekt.

Diagnose:
1. Öffne `Finanzberichte (Financial Reports)` und filtere nach `PRODUCTLINE = MACHINE`.
2. Vergleiche mit dem Verkaufsbericht für `RM-M100`.
3. Öffne `Sachposten (G/L Entries)` und filtere auf die Belegnummer.
4. Prüfe die Dimensionswerte auf Erlös- und Wareneinsatzposten.
5. Entscheide, ob nur die Dimension falsch ist oder auch Beleg, Konto, USt oder Lager betroffen sind.

Korrektur:
- Wenn nur die Dimension falsch ist, nutzt Finance nach Freigabe das Dimension Correction Tool.
- Wenn Konto, Debitor, USt oder Lager falsch sind, wird nicht per Dimension Correction korrigiert. Dann braucht es Gutschrift, Storno, Neubuchung oder fachliche Korrekturbuchung.

| Fehler | Symptom | Ursache | Diagnosepfad | Korrekturweg | Was man nicht tun darf |
|---|---|---|---|---|---|
| `PRODUCTLINE` fehlt | GuV nach Produktlinie zeigt zu wenig Umsatz | Standarddimension am Artikel fehlt | Artikelkarte, Belegzeile, Sachposten prüfen | vor Buchung in Belegzeile korrigieren; nach Buchung Dimension Correction prüfen | gebuchte Rechnung direkt ändern wollen |
| `CHANNEL` ist falsch | Shop- und B2B-Umsatz sind vertauscht | Debitor oder Belegkopf liefert falschen Wert | Debitorenkarte und Sachposten vergleichen | Standarddimension korrigieren, gebuchte Sachposten nur bei reinem Reportingfehler korrigieren | Steuer- oder Debitorenfehler über Dimension Correction lösen |
| `DEPARTMENT` fehlt | Kostenstellenbericht ist unvollständig | Sachkonto verlangt keine Pflichtdimension | Sachkontokarte und Dimensionswertbuchung prüfen | Pflichtdimension setzen und Prozess erneut testen | alte Fehler ohne Freigabe massenhaft ändern |

Übung:
1. Öffne `Verkaufsaufträge (Sales Orders)` und erfasse `D10000`, Artikel `RM-M100`, Menge `1`.
2. Setze auf der Zeile `PRODUCTLINE = SPARE`, obwohl es eine Maschine ist.
3. Nutze `Buchungsvorschau (Preview Posting)` und prüfe die Dimensionen.
4. Korrigiere vor dem Buchen auf `PRODUCTLINE = MACHINE`.
5. Buche den Auftrag.
6. Öffne `Sachposten (G/L Entries)` und kontrolliere die Dimension.
7. Öffne `Finanzberichte (Financial Reports)` und filtere auf `PRODUCTLINE = MACHINE`, `CHANNEL = B2B` und `DEPARTMENT = SALES`.

Lösungsskizze:
- Vor dem Buchen wird die falsche Dimension direkt in der Belegzeile korrigiert.
- Nach dem Buchen wird zuerst geprüft, ob nur die Dimension falsch ist.
- Das Dimension Correction Tool ist nur dann zulässig, wenn Betrag, Konto, Debitor, Artikel, Lager und USt korrekt sind.
- Die Lösung ist korrekt, wenn die Sachposten die erwarteten Dimensionen tragen und der Finanzbericht den Maschinenumsatz im Dimensionsfilter zeigt.

UAT-Fall:

| Feld | Inhalt |
|---|---|
| ID | `UAT-DIM-001` |
| Ziel | Pflichtdimension und Reportingdimension für Maschinenverkauf nachweisen |
| Rolle | Controller, Finance Key User |
| Voraussetzung | Dimension `PRODUCTLINE`, Wert `MACHINE`, Standarddimension am Artikel `RM-M100` |
| Testdaten | `D10000`, `RM-M100`, Preis `68.000 EUR`, `PRODUCTLINE = MACHINE`, `CHANNEL = B2B`, `DEPARTMENT = SALES`, `LOCATION-GROUP = DIRECTED` |
| Schrittfolge | Auftrag erfassen, Dimension prüfen, buchen, Sachposten und Finanzbericht kontrollieren |
| Erwartete Posten | Sachposten mit `PRODUCTLINE = MACHINE`, Debitorenposten, USt-Posten, Artikelposten, Wertposten |
| Negativfall | `PRODUCTLINE` fehlt oder ist `SPARE` |
| Akzeptanzkriterium | GuV nach Produktlinie zeigt Maschinenumsatz korrekt |
| Evidence Pack | Belegnummer, Sachpostenfilter, Finanzbericht, Screenshot der Dimensionen, Freigabe der Korrektur falls nötig |

Praxisregel:
- Eine Dimension ist keine Company und kein Konto. Sie ergänzt die Auswertung, ersetzt aber keine rechtliche Einheit und keine Buchungslogik.

### In 5 Minuten merken

* 5 wichtigste Begriffe: Dimension, Dimensionswert, Standarddimension, Pflichtdimension, Dimension Correction Tool.
* 5 wichtigste Seiten: `Dimensionen`, `Standarddimensionen`, `Sachposten`, `Finanzberichte`, `Analyseansichten`.
* 3 häufigste Fehler: Dimension fehlt, falscher Wert gewinnt, Dimension wird mit Company verwechselt.
* 3 Prüfungsfallen: Dimension ist kein Konto, Dimension Correction korrigiert keine falsche USt, globale Dimensionen sind besonders kritisch.
* 1 Praxisregel: Dimensionen werden vor dem Buchen geprüft und nach dem Buchen in Sachposten und Berichten nachgewiesen.



## Teil C — Operative End-to-End-Prozesse

Teil C führt die operativen Rhein-Main-Prozesse Ende-zu-Ende durch. Jedes Kapitel erklärt Zweck, Rolle, Bedienpfad, Buchungsspur, Fehler, Lösung und UAT.

## 11. Order-to-Cash: Maschine verkaufen [Q7][Q8][Q9][Q10]

O2C beginnt beim Kontakt oder Angebot und endet erst, wenn Lieferung, Rechnung, Forderung, Zahlung, USt und Nachweis geschlossen sind.

| Feld | Inhalt |
|---|---|
| Zielgruppe | Einsteiger, Verkauf, Lager, Debitorenbuchhaltung, Consultant, Architect |
| Schwierigkeit | Basic bis Intermediate |
| Prozessbereich | Verkauf/O2C |
| Betroffene Companies | RM-SALES, RM-PROD, RM-SHARED |
| MB-800-Relevanz | Ja: Verkauf, Debitoren, Preise, Gutschriften, Zahlungsausgleich |
| Solution-Architect-Relevanz | Ja: Preislogik, Lagerlogik, USt, IC und Shop-Integration |
| Benötigte Vorkenntnisse | Debitor, Artikel, Lagerort, Beleg, Posten |
| Ergebnis nach dem Kapitel | Leser kann einen Verkaufsfall erfassen, buchen, prüfen und korrigieren |

### Für absolute Einsteiger: Was du hier gerade tust

Ein Kunde bestellt eine Maschine oder ein Ersatzteil. In Business Central wird daraus zuerst ein Verkaufsbeleg. Dieser Beleg enthält Kunde, Artikel, Menge, Preis, Liefertermin, Lagerort, USt und Dimensionen. Wenn die Ware geliefert und fakturiert wird, entstehen Forderung, Erlös, Umsatzsteuer, Lagerabgang und Wareneinsatz. Deshalb ist ein Verkaufsauftrag nicht nur ein Formular. Er ist der Start einer Buchungskette, die Vertrieb, Lager, Finance und Controlling verbindet.

### Warum braucht die Rhein-Main Industriegruppe diesen Prozess?

RM-SALES verkauft Maschinen, Ersatzteile und Handelsware. Ohne sauberen Verkaufsprozess wüsste das Lager nicht, was geliefert werden muss, Finance hätte keine verlässliche Forderung und Controlling könnte Erlöse nicht nach Produktlinie auswerten. Business Central bündelt Angebot, Auftrag, Lieferung, Rechnung und Zahlung. Am Ende erwartet die Gruppe gebuchte Verkaufsbelege, Debitorenposten, Sachposten, USt-Posten, Artikelposten, Wertposten und einen Finanzbericht nach `PRODUCTLINE`.

### Standard laut Quelle

Business Central unterstützt Verkaufsangebote, Verkaufsaufträge, Lieferungen, Rechnungen, Retouren, Gutschriften und Dropshipping. Der Shopify-Bereich synchronisiert Onlineshop-Daten je Einrichtung mit Business Central. [Q7][Q8][Q9][Q10]

### Mitarbeiterrollen

| Rolle | Bedienhandlung | Seite | Ergebnis |
|---|---|---|---|
| Verkäuferin | Angebot für `RM-M100` erstellen | `Sales Quotes` | Angebot mit Preis und Liefertermin |
| Vertriebsinnendienst | Angebot in Auftrag umwandeln | `Sales Orders` | `SO-1001` |
| Lagerist | Lieferung kommissionieren | `Warehouse Picks` oder `Sales Orders` | gebuchte Lieferung |
| Debitorenbuchhalterin | Rechnung und Zahlung prüfen | `Customer Ledger Entries` | offener oder geschlossener Posten |
| E-Commerce-Sachbearbeiter | Shop-Auftrag prüfen | `Shopify Orders` / `Sales Orders` | Webauftrag in BC |

### Standardpfad B2B-Verkauf

```mermaid
flowchart LR
    A["Contact / Customer"] --> B["Sales Quote"]
    B --> C["Sales Order"]
    C --> D["Pick / Shipment"]
    D --> E["Posted Sales Invoice"]
    E --> F["Customer Ledger Entry"]
    E --> G["VAT Entry"]
    F --> H["Payment Application"]
```

#### Schritt-für-Schritt in der deutschen Oberfläche

1. Öffne die Suche mit `Alt+Q`.
2. Suche nach `Verkaufsaufträge (Sales Orders)`.
3. Öffne die Seite `Verkaufsaufträge`.
4. Wähle `Neu`.
5. Wähle im Feld `Debitorennr.` den Kunden `D10000`.
6. Prüfe `Buchungsdatum`, `Belegdatum`, `Fälligkeitsdatum`, `Währungscode` und `Zahlungsbedingungscode`.
7. Wechsle in die Zeilen.
8. Wähle in der Spalte `Art` den Wert `Artikel`.
9. Wähle in der Spalte `Nr.` den Artikel `RM-M100`.
10. Trage in `Menge` den Wert `1` ein.
11. Prüfe `Lagerortcode = FRA-ZL`, Verkaufspreis, USt-Geschäftsbuchungsgruppe, USt-Produktbuchungsgruppe und Dimension `PRODUCTLINE = MACHINE`.
12. Wähle `Buchungsvorschau (Preview Posting)`, wenn verfügbar.
13. Prüfe, ob Debitorenposten, Sachposten, USt-Posten, Artikelposten und Wertposten entstehen würden.
14. Wähle `Freigeben (Release)`, falls der Prozess Freigabe nutzt.
15. Bei gesteuertem Lager erstellt der Lagerist die `Lagerkommissionierung (Warehouse Pick)`.
16. Wähle `Buchen`.
17. Wähle `Liefern und fakturieren`, wenn Lieferung und Rechnung gleichzeitig gebucht werden.
18. Öffne `Gebuchte Verkaufsrechnungen (Posted Sales Invoices)`.
19. Öffne `Debitorenposten (Customer Ledger Entries)` und filtere auf `D10000`.
20. Öffne `Sachposten (G/L Entries)` und filtere auf die Belegnummer.
21. Öffne `Artikelposten (Item Ledger Entries)` für `RM-M100`.
22. Öffne `Wertposten (Value Entries)` und prüfe den Kostenabgang.
23. Öffne `USt-Posten (VAT Entries)` und prüfe Steuerbasis und Steuerbetrag.
24. Öffne `Finanzberichte (Financial Reports)` und prüfe Erlös und Wareneinsatz.

#### Buchungsspur

| Ebene | Beispiel | Wo prüfen? |
|---|---|---|
| Beleg | Verkaufsauftrag `SO-1001` | `Verkaufsaufträge (Sales Orders)` |
| Gebuchter Beleg | gebuchte Verkaufsrechnung | `Gebuchte Verkaufsrechnungen (Posted Sales Invoices)` |
| Debitorenposten | Forderung gegen D10000 | `Debitorenposten (Customer Ledger Entries)` |
| Sachposten | Forderung, Erlös, USt, Wareneinsatz, Bestand | `Sachposten (G/L Entries)` |
| Artikelposten | Mengenabgang `RM-M100` | `Artikelposten (Item Ledger Entries)` |
| Wertposten | Kostenabgang | `Wertposten (Value Entries)` |
| USt-Posten | USt aus Verkauf | `USt-Posten (VAT Entries)` |
| Bericht | GuV nach Produktlinie | `Finanzberichte (Financial Reports)` |

Die Buchungsspur zeigt, dass ein Verkaufsauftrag mehr ist als ein Vertriebsformular. Der gleiche Vorgang erzeugt eine Forderung, einen Erlös, USt, Lagerbewegung, Kostenabgang und Auswertungsdaten für Controlling. Finance prüft deshalb nicht nur die Rechnung, sondern die gesamte Kette vom Auftrag bis zum Posten.

#### Fehlerdiagnose und Korrektur

| Fehler | Symptom | Ursache | Diagnosepfad | Korrekturweg | Was man nicht tun darf |
|---|---|---|---|---|---|
| falscher Lagerort | Bestand stimmt nicht | falscher Lagerortcode im Auftrag | Verkaufsrechnung → Artikelposten → Lagerort | Gutschrift/Neubuchung oder Lagerkorrektur nach Freigabe | gebuchte Posten löschen wollen |
| falscher Preis | Marge falsch | falsche Preisliste oder manuelle Änderung | Verkaufszeile → Preisfindung → Finanzbericht | Preislisten korrigieren, Beleg fachlich korrigieren | Preis im gebuchten Beleg überschreiben wollen |
| falsche USt | USt-Posten falsch | falsche USt-Buchungsgruppe | Debitor/Artikel → USt-Buchungsmatrix Einrichtung → USt-Posten | Gutschrift und Neuberechnung nach Steuerfreigabe | USt nur im Bericht manuell korrigieren |

Praxisregel:
- Ein gebuchter Verkaufsbeleg wird fachlich korrigiert, nicht technisch gelöscht. Der Korrekturweg muss den ursprünglichen Fehler, den neuen Beleg und die betroffenen Posten nachvollziehbar verbinden.

### Beispieldaten und Buchung

Fall `S-001`: Debitor `D10000` kauft `RM-M100`, 1 Stück, netto `68.000 EUR`, USt `12.920 EUR`.

| Buchung | Soll | Haben |
|---|---:|---:|
| Forderungen D10000 | 80.920 | |
| Umsatzerlöse Maschinen | | 68.000 |
| Umsatzsteuer 19 % | | 12.920 |

Mitarbeiterbedienung:
1. Verkäuferin: Tell Me → `Sales Quotes` → New → `Sell-to Customer No. = D10000`.
2. Zeile: `Type = Item`, `No. = RM-M100`, `Quantity = 1`, `Location Code = FRA-ZL`.
3. Aktion: `Make Order`.
4. Lagerist: Tell Me → `Warehouse Picks` → Pick erstellen und registrieren.
5. Vertrieb: `Post` → Ship and Invoice, wenn Lieferung abgeschlossen ist.
6. Buchhaltung: Tell Me → `Customer Ledger Entries` → Posten D10000 prüfen.

### Abweichungen und Sonderfälle

| Use Case | BC-Mechanik | Mitarbeiter | Risiko | Evidence Pack |
|---|---|---|---|---|
| Teillieferung | `Qty. to Ship` | Lager/Vertrieb | Rechnung über falsche Menge | Shipment ↔ Invoice |
| Retoure | `Sales Return Order` | Vertrieb/Lager | USt-Korrektur fehlt | Bezug zur Ursprungsrechnung |
| Gutschrift | `Sales Credit Memo` | Debitorenbuchhaltung | falsches Erlöskonto | Credit Memo + VAT Entry |
| Vorauszahlung | `Prepayment Invoice` | Vertrieb/Finance | falsche Steuerperiode | Prepayment VAT |
| Dropshipping | Sales Order ↔ Purchase Order | Vertrieb/Einkauf | Liefernachweis fehlt | Lieferantenbeleg + Kundenrechnung |
| Shopify | Shop Order → Sales Order | E-Commerce | falsche Kundenzuordnung | Shop-ID + BC-Beleg |
| EU-B2B | VAT Bus. Posting Group EU | Vertrieb/Finance | USt-IdNr. fehlt | USt-IdNr., ZM |
| Drittland | Export-VAT-Clause | Vertrieb/Finance | Ausfuhrnachweis fehlt | Exportnachweis |

BC-Best-Practice:
- Verkäufer dürfen Preise und Rabatte erfassen, aber nicht USt-Buchungsgruppen ändern.
- Onlineshop-Aufträge laufen durch eine tägliche Fehlerliste: unbekannte Artikel, fehlende Kunden, Zahlungsabweichungen.

Schulungsübung:
- Erstelle `SO-1003` als Dropshipment für Debitor `D10000` und Kreditor `K20000`. Verknüpfe Verkaufs- und Einkaufsbeleg. Prüfe, warum kein eigener Lagerbestand entsteht.

UAT-Fall:

| Feld | Inhalt |
|---|---|
| ID | `UAT-O2C-001` |
| Ziel | Standardmaschine Ende-zu-Ende verkaufen |
| Rolle | Vertrieb, Lager, Debitorenbuchhaltung |
| Voraussetzung | Debitor `D10000`, Artikel `RM-M100`, Lagerort `FRA-ZL`, gültige USt- und Buchungsgruppen |
| Testdaten | Menge `1`, Verkaufspreis `68.000 EUR`, Dimension `PRODUCTLINE = MACHINE` |
| Schrittfolge | Angebot optional erstellen, Verkaufsauftrag erfassen, Buchungsvorschau prüfen, liefern und fakturieren, Posten prüfen |
| Erwartete Belege | Verkaufsauftrag, gebuchte Verkaufslieferung, gebuchte Verkaufsrechnung |
| Erwartete Posten | Debitorenposten, Sachposten, USt-Posten, Artikelposten, Wertposten |
| Kontrollbericht | `Finanzberichte (Financial Reports)`, `Lagerbewertung (Inventory Valuation)` |
| Negativfall | falscher Lagerort oder falsche USt-Gruppe |
| Akzeptanzkriterium | Forderung, Erlös, USt, Lagerabgang, Kostenabgang und Dimension stimmen |
| Evidence Pack | Belegnummern, Postenexport, Buchungsvorschau, Berichtsexport, Testergebnis |
| Lösungshinweis | Fehler werden über Gutschrift/Neubuchung oder fachlich freigegebene Korrektur gebucht, nicht durch manuelle Postenänderung |

### In 5 Minuten merken

* 5 wichtigste Begriffe: Verkaufsauftrag, gebuchte Verkaufsrechnung, Debitorenposten, USt-Posten, Wertposten.
* 5 wichtigste Seiten: `Verkaufsaufträge`, `Gebuchte Verkaufsrechnungen`, `Debitorenposten`, `Sachposten`, `Artikelposten`.
* 3 häufigste Fehler: falscher Lagerort, falscher Preis, falsche USt-Gruppe.
* 3 Prüfungsfallen: Angebot ist noch keine Buchung, Lieferung ist nicht immer Rechnung, Gutschrift ist nicht dasselbe wie Postenlöschung.
* 1 Praxisregel: Vor dem Buchen immer Buchungsvorschau, Lagerort, Preis, USt und Dimension prüfen.

---


## 12. Procure-to-Pay: Rohmaterial einkaufen [Q11][Q12][Q13]

P2P beginnt beim Bedarf und endet mit abgestimmter Verbindlichkeit, Zahlung und Vorsteuer. Der Einkauf erzeugt nicht nur Belege, sondern steuert Preis-, Mengen-, Liefer- und Betrugsrisiken.

| Feld | Inhalt |
|---|---|
| Zielgruppe | Einsteiger, Einkauf, Lager, Kreditorenbuchhaltung, Consultant |
| Schwierigkeit | Basic bis Intermediate |
| Prozessbereich | Einkauf/P2P |
| Betroffene Companies | RM-PROD, RM-SHARED |
| MB-800-Relevanz | Ja: Kreditoren, Einkaufsbestellungen, Wareneingänge, Eingangsrechnungen, Zahlungen |
| Solution-Architect-Relevanz | Ja: 3-Way-Match, E-Rechnung, Genehmigungen, Lagerintegration |
| Benötigte Vorkenntnisse | Kreditor, Artikel, Lagerort, Bestellung, Rechnung |
| Ergebnis nach dem Kapitel | Leser kann Rohmaterial beschaffen, Wareneingang buchen, Rechnung prüfen und Posten kontrollieren |

### Für absolute Einsteiger: Was du hier gerade tust

Die Firma kauft Stahl, damit später Maschinen produziert werden können. In Business Central beginnt das mit einer Einkaufsbestellung. Beim Wareneingang steigt der Lagerbestand. Bei der Eingangsrechnung entsteht eine Verbindlichkeit gegenüber dem Lieferanten und gegebenenfalls Vorsteuer. Einkauf verbindet also Bedarf, Lager und Buchhaltung.

### Warum braucht die Rhein-Main Industriegruppe diesen Prozess?

RM-PROD benötigt Rohmaterial `RAW-STEEL`, damit Fertigungsaufträge für `RM-M100` starten können. Ohne Einkaufsbestellung wären Preis, Menge, Liefertermin, Lagerort und spätere Rechnung nicht sauber verbunden. Business Central stellt sicher, dass Wareneingang, Eingangsrechnung, Kreditorenposten, Artikelposten, Wertposten und Sachposten zusammenpassen.

### Mitarbeiterrollen

| Rolle | Bedienhandlung | Seite | Ergebnis |
|---|---|---|---|
| Einkäufer | Bestellung aus Planungsbedarf erstellen | `Purchase Orders` | `PO-2001` |
| Lagerist | Wareneingang buchen | `Warehouse Receipts` oder `Purchase Orders` | Bestand steigt |
| Kreditorenbuchhalter | Eingangsrechnung prüfen | `Purchase Invoices` / `Incoming Documents` | Verbindlichkeit |
| Finance-Leitung | Zahlung freigeben | `Payment Journals` | Zahlungsvorschlag |

### Prozessfluss

```mermaid
flowchart LR
    A["Bedarf / Requisition"] --> B["Purchase Order"]
    B --> C["Receipt"]
    C --> D["Purchase Invoice"]
    D --> E["Vendor Ledger Entry"]
    D --> F["VAT Entry"]
    E --> G["Payment Journal"]
    G --> H["Closed Vendor Entry"]
```

#### Schritt-für-Schritt in der deutschen Oberfläche

1. Öffne die Suche mit `Alt+Q`.
2. Suche nach `Einkaufsbestellungen (Purchase Orders)`.
3. Öffne die Seite `Einkaufsbestellungen`.
4. Wähle `Neu`.
5. Wähle im Feld `Kreditorennr.` den Lieferanten `K10000`.
6. Prüfe `Buchungsdatum`, `Belegdatum`, `Kred.-Rechnungsnr.`, `Zahlungsbedingungscode` und Währung.
7. Erfasse in den Zeilen `Art = Artikel`, `Nr. = RAW-STEEL`, `Menge = 10`, `Lagerortcode = FRA-ZL`.
8. Prüfe Einkaufspreis, USt-Geschäftsbuchungsgruppe, USt-Produktbuchungsgruppe und Dimension `PRODUCTLINE = MACHINE`.
9. Wähle `Buchungsvorschau (Preview Posting)`, wenn die Eingangsrechnung bereits gebucht werden soll.
10. Buche zunächst `Empfangen`, wenn Ware und Rechnung getrennt eintreffen.
11. Öffne `Gebuchte Einkaufslieferungen (Posted Purchase Receipts)` und prüfe Menge und Lagerort.
12. Öffne `Artikelposten (Item Ledger Entries)` für `RAW-STEEL`.
13. Öffne die Bestellung erneut und erfasse die externe Rechnungsnummer des Lieferanten.
14. Wähle `Buchen` und danach `Fakturieren`.
15. Öffne `Gebuchte Einkaufsrechnungen (Posted Purchase Invoices)`.
16. Öffne `Kreditorenposten (Vendor Ledger Entries)` und filtere auf `K10000`.
17. Öffne `Sachposten (G/L Entries)` und filtere auf die Belegnummer.
18. Öffne `USt-Posten (VAT Entries)` und prüfe Vorsteuerbasis und Vorsteuerbetrag.
19. Öffne `Wertposten (Value Entries)` und prüfe den Zugangswert.
20. Dokumentiere Bestellnummer, Wareneingang, Eingangsrechnung, Posten und Kontrollbericht im Evidence Pack.

#### Buchungsspur

| Ebene | Beispiel | Wo prüfen? |
|---|---|---|
| Beleg | Einkaufsbestellung `PO-2001` | `Einkaufsbestellungen (Purchase Orders)` |
| Gebuchter Wareneingang | gebuchte Einkaufslieferung | `Gebuchte Einkaufslieferungen (Posted Purchase Receipts)` |
| Gebuchte Rechnung | gebuchte Einkaufsrechnung | `Gebuchte Einkaufsrechnungen (Posted Purchase Invoices)` |
| Kreditorenposten | Verbindlichkeit gegen `K10000` | `Kreditorenposten (Vendor Ledger Entries)` |
| Sachposten | Vorrat, Vorsteuer, Verbindlichkeit | `Sachposten (G/L Entries)` |
| Artikelposten | Mengenzugang `RAW-STEEL` | `Artikelposten (Item Ledger Entries)` |
| Wertposten | Zugangswert Rohmaterial | `Wertposten (Value Entries)` |
| USt-Posten | Vorsteuer aus Einkauf | `USt-Posten (VAT Entries)` |

### Beispieldaten und Buchung

Fall `P-001`: Einkauf `RAW-STEEL`, 10 Stück à `2.500 EUR`, netto `25.000 EUR`, Vorsteuer `4.750 EUR`.

| Buchung | Soll | Haben |
|---|---:|---:|
| Vorräte Rohmaterial | 25.000 | |
| Vorsteuer 19 % | 4.750 | |
| Verbindlichkeiten K10000 | | 29.750 |

Bedienung:
1. Einkäufer: Tell Me → `Purchase Orders` → New → `Buy-from Vendor No. = K10000`.
2. Zeile: `Type = Item`, `No. = RAW-STEEL`, `Quantity = 10`, `Location Code = FRA-ZL`.
3. Lagerist: gesteuertes Lager → `Warehouse Receipt` erstellen und buchen.
4. Kreditorenbuchhalter: Eingangsrechnung mit Bestellung abgleichen.
5. Finance: Zahlungsvorschlag erstellen und ausführen.

### Abweichungen

| Use Case | BC-Mechanik | Kontrolle |
|---|---|---|
| Teil-Wareneingang | mehrere Receipts | `Qty. Received` vs. `Qty. Invoiced` |
| Preisabweichung | Rechnungspreis abweichend | Freigabe vor Buchung |
| Rücksendung | `Purchase Return Order` | Bezug zur Ursprungslieferung |
| E-Rechnung | E-Documents / Incoming Documents | XML und Validierung |
| Fremdarbeit | Subcontracting / Purchase Service | Fertigungsauftragbezug |
| Lieferantenbank geändert | Vendor Bank Account | Vier-Augen-Prüfung |

BC-Best-Practice:
- Externe Belegnummer ist Pflicht.
- Bankdatenänderungen werden nicht im Zahlungslauf geändert, sondern vorher freigegeben.
- Mengen- und Preisabweichungen erhalten eigene Freigaberegeln.

Schulungsübung:
- Buche eine Bestellung mit Teil-Wareneingang 6/10 Stück. Buche anschließend eine Rechnung über 10 Stück und erkläre den Fehler.

Lösungsskizze:
1. Öffne `Einkaufsbestellungen (Purchase Orders)` und erfasse Bestellung `PO-2001` mit `K10000`, `RAW-STEEL`, Menge `10`.
2. Buche im Feld `Zu empfangen` nur `6` und wähle `Buchen` → `Empfangen`.
3. Öffne `Artikelposten (Item Ledger Entries)` und prüfe den Zugang von `6` Stück.
4. Erfasse die Eingangsrechnung über `10` Stück und starte `Buchungsvorschau (Preview Posting)`.
5. Die Differenz zeigt, dass empfangene und fakturierte Menge nicht zusammenpassen. Korrigiere die Rechnungsmenge auf `6` oder buche den restlichen Wareneingang nach, wenn die Ware tatsächlich eingetroffen ist.
6. Prüfe danach `Kreditorenposten`, `Sachposten`, `Artikelposten`, `Wertposten` und `USt-Posten`.

### In 5 Minuten merken

* 5 wichtigste Begriffe: Einkaufsbestellung, Wareneingang, gebuchte Einkaufsrechnung, Kreditorenposten, Vorsteuer.
* 5 wichtigste Seiten: `Einkaufsbestellungen`, `Gebuchte Einkaufslieferungen`, `Gebuchte Einkaufsrechnungen`, `Kreditorenposten`, `Artikelposten`.
* 3 häufigste Fehler: fehlende externe Rechnungsnummer, falscher Lagerort, Rechnung über nicht empfangene Menge.
* 3 Prüfungsfallen: Empfangen ist nicht Fakturieren, Kreditorenposten ist nicht Sachposten, Vorsteuer hängt an der USt-Buchungsmatrix.
* 1 Praxisregel: Einkauf prüft Preis und Menge, Lager prüft Wareneingang, Finance prüft Rechnung und Posten.

---


## 13. Inventory und Warehouse: Ware bewegen und bewerten [Q14][Q15][Q65][Q66][Q67][Q68]

### Kapitelbox

| Feld | Inhalt |
|---|---|
| Zielgruppe | Einsteiger, Key User, Consultant, Architect |
| Schwierigkeit | Basic bis Advanced |
| Prozessbereich | Inventory/Warehouse |
| Betroffene Companies | RM-PROD, RM-SALES, RM-SERVICE |
| MB-800-Relevanz | Ja: Artikel, Lagerorte, Artikelposten, Wertposten, Lageraktivitäten |
| Solution-Architect-Relevanz | Ja: einfache Lagerlogik vs. gesteuertes Lager, Lagerbewertung, Kostenfluss |
| Benötigte Vorkenntnisse | Belege, Posten, Stammdaten, Buchungsgruppen, Dimensionen |
| Ergebnis nach dem Kapitel | Leser kann den Prozess mit Rhein-Main-Testdaten ausführen, Posten prüfen, Fehler diagnostizieren und UAT nachweisen |

### Beteiligte Rollen

| Rolle | Aufgabe | Ergebnis |
|---|---|---|
| Fachanwender | Prozess ausführen und Belegdaten prüfen | fachlich korrekter Vorgang |
| Key User | Stammdaten, Setup und Fehlerfälle prüfen | stabiler Prozess |
| Finance/Controlling | Buchungsspur, Bericht und Evidence Pack prüfen | abgestimmter Nachweis |
| Solution Architect | Standardgrenze und Betriebsfolge bewerten | tragfähiges Prozessdesign |

### Benötigte Stammdaten

Artikel `SP-PUMP-01`, `RAW-STEEL`, Lagerorte `FRA-ZL`, `MZ-EINFACH`, Lagerplätze, Einheiten, Kostenmethode. Diese Daten müssen vor dem Test gepflegt sein, sonst erzeugt der richtige Klick später falsche Posten oder unvollständige Berichte.

### Benötigtes Setup

`Lager Einrichtung (Inventory Setup)`, `Lagerorte (Locations)`, Lagerplätze, Lagerbuchungsmatrix, Nummernserien, Lageraktivitäten. Das Setup wird nicht während der Buchung improvisiert, sondern vorab durch Key User und Finance freigegeben.

### Deutsche BC-Seiten mit englischer Suchhilfe

`Lagerorte (Locations)`, `Artikel (Items)`, `Artikelposten (Item Ledger Entries)`, `Wertposten (Value Entries)`, `Lagereingänge (Warehouse Receipts)`, `Lagerkommissionierungen (Warehouse Picks)`. Suche die Seiten über `Alt+Q`; wenn der deutsche Begriff nicht gefunden wird, nutze den englischen Klammerbegriff.

### Happy Path mit Rhein-Main-Testdaten

Testfall: `SP-PUMP-01`, Menge `10`, Lagerort `FRA-ZL`, Lagerplatz `PICK-01`. Der Happy Path ist bestanden, wenn der gebuchte Beleg, die Nebenbuchposten, die Sachposten, der Kontrollbericht und das Evidence Pack übereinstimmen.

### Kontrollbericht

`Lagerbewertung (Inventory Valuation)`, `Artikelposten`, `Wertposten`, Lagerplatzinhalt. Der Kontrollbericht ist die fachliche Gegenprobe zur Buchung. Er beantwortet nicht nur, ob gebucht wurde, sondern ob Menge, Wert, Steuer, Dimension und Zeitraum stimmen.

### Korrekturweg

1. Fehlerbild aus Anwendersicht festhalten.
2. Belegnummer, Datum, Stammdaten und Dimensionen prüfen.
3. Buchungsspur bis zu Nebenbuchposten und Sachposten verfolgen.
4. Entscheiden, ob vor Buchung korrigiert, nach Buchung gutgeschrieben, storniert, ausgeglichen, umgebucht oder per zulässigem Korrekturwerkzeug korrigiert wird.
5. Korrektur mit Beleg, Posten und Bericht dokumentieren.

### Evidence Pack

Wareneingangs-/Ausgangsbeleg, Artikelposten, Wertposten, Lageraktivität, Lagerbewertung. Das Evidence Pack wird im UAT und später im Betrieb genutzt, damit Fachbereich, Finance und Prüfung dieselbe Spur nachvollziehen können.

Lager in Business Central ist nicht einheitlich. Die Mustergruppe nutzt bewusst zwei Extreme: ein einfaches Lager und ein gesteuertes Zentrallager.

| Feld | Inhalt |
|---|---|
| Zielgruppe | Einsteiger, Lager, Einkauf, Verkauf, Controlling, Consultant |
| Schwierigkeit | Basic bis Advanced |
| Prozessbereich | Inventory/Warehouse |
| Betroffene Companies | RM-PROD, RM-SALES, RM-SERVICE |
| MB-800-Relevanz | Ja: Artikel, Lagerorte, Artikelposten, Wertposten, Kostenmethoden |
| Solution-Architect-Relevanz | Ja: einfaches Lager vs. gesteuerte Lagerlogik |
| Benötigte Vorkenntnisse | Artikel, Lagerort, Wareneingang, Lieferung |
| Ergebnis nach dem Kapitel | Leser kann erklären, warum Menge, Lagerplatz und Wert getrennt geprüft werden |

### Für absolute Einsteiger: Was du hier gerade tust

Lager bedeutet nicht nur „Ware liegt irgendwo“. Business Central unterscheidet, welche Ware vorhanden ist, wo sie liegt, ob sie schon eingelagert ist und welchen Wert sie hat. Wenn ein Wareneingang gebucht wird, entsteht eine Mengenbewegung. Wenn Kosten gebucht und reguliert werden, entsteht die Wertlogik. Deshalb prüft man Artikelposten für Mengen und Wertposten für Werte.

### Warum braucht die Rhein-Main Industriegruppe diesen Prozess?

RM-PROD lagert Rohmaterial und fertige Maschinen im gesteuerten Lager `FRA-ZL`. RM-SALES nutzt einfache Lager für Ersatzteile und Versand. RM-SERVICE nutzt Fahrzeuglager für Techniker. Ohne saubere Lagerlogik verkauft der Vertrieb nicht belastbar, die Fertigung startet mit falschem Bestand und Finance bewertet den Lagerwert falsch. Business Central verbindet Wareneingang, Einlagerung, Kommissionierung, Lieferung, Artikelposten, Wertposten und Lagerbewertung.

### Lagerlogik im Vergleich

| Merkmal | Einfaches Lager `MZ-EINFACH` | Gesteuertes Lager `FRA-ZL` |
|---|---|---|
| Wareneingang | direkt aus Bestellung | Warehouse Receipt + Put-away |
| Versand | direkt aus Verkaufsauftrag | Warehouse Shipment + Pick |
| Bins | optional/vereinfacht | verbindlich |
| Mitarbeiter | Sachbearbeiter/Lagerist | Lagerrolle mit Aufgabenliste |
| Schulungsziel | schneller Standardpfad | vollständige Warehouse-Steuerung |

### Prozessfluss gesteuertes Lager

```mermaid
flowchart LR
    A["Purchase Order"] --> B["Warehouse Receipt"]
    B --> C["Posted Receipt"]
    C --> D["Put-away"]
    D --> E["Bin Bestand"]
    E --> F["Warehouse Pick"]
    F --> G["Warehouse Shipment"]
    G --> H["Sales Shipment"]
```

### Mitarbeiterbedienung

| Rolle | Seite | Tätigkeit |
|---|---|---|
| Lagerist Wareneingang | `Warehouse Receipts` | Lieferung erfassen, Menge prüfen |
| Einlagerer | `Warehouse Put-aways` | Bin vorschlagen, Ware einlagern |
| Kommissionierer | `Warehouse Picks` | Pickliste abarbeiten |
| Lagerleitung | `Items by Location`, `Inventory Valuation` | Bestände und Werte prüfen |

### Abweichungen

| Use Case | BC-Reaktion | Risiko |
|---|---|---|
| falscher Bin | Korrektur über Warehouse Journal | Bestand physisch falsch |
| Seriennummer fehlt | Buchung blockiert oder Tracking-Fehler | Rückverfolgbarkeit fehlt |
| Inventurdifferenz | Physical Inventory Journal | Ergebniswirkung |
| Umlagerung | Transfer Order | Bestand im Transit |
| negativer Bestand | je Setup möglich/verhindert | COGS unsicher |

Schulungsübung einfaches Lager:
- Buche Einkauf `SP-PUMP-01` nach `MZ-EINFACH`, verkaufe 2 Stück und prüfe Item Ledger Entries.

Schulungsübung gesteuertes Lager:
- Buche `RAW-STEEL` nach `FRA-ZL`, erstelle Put-away, danach Pick für Fertigung oder Verkauf.

---

### Lagerlogiken im Vergleich

Lager ist in Business Central kein einzelner Prozess. Die Einrichtung des Lagerorts entscheidet, ob der Mitarbeiter direkt aus Bestellung und Auftrag bucht oder mit Wareneingang, Einlagerung, Kommissionierung, Lagerplatz und gesteuerten Aktivitäten arbeitet. Dieses Kapitel macht die Unterschiede und Auswirkungen sichtbar.

### Die drei Verständnisebenen

| Ebene | Erklärung | Typischer Ort in der Musterfirma |
|---|---|---|
| Einfaches Lager | Belege buchen direkt Menge und Wert | kleines Ersatzteillager `MZ-WH2` |
| Basic Warehouse | einfache Lageraktivitäten wie Inventory Put-away/Pick | Service- und Projektlager |
| Advanced Warehouse | Warehouse Receipt, Warehouse Put-away, Pick, Bins, Directed Put-away and Pick | Hauptlager `FRA-WH1` |

Microsoft Learn beschreibt verschiedene Methoden für Wareneingang und Einlagerung: direkt aus Belegen, über Inventory Put-away, über Warehouse Receipt oder über getrennte Warehouse Receipt und Warehouse Put-away. [Q65][Q66]

### Einrichtungsmatrix Lagerort

| Feld/Option | Einfach | Basic | Advanced |
|---|---|---|---|
| `Require Receive` | nein | optional | ja |
| `Require Put-away` | nein | ja nach Prozess | ja |
| `Require Shipment` | nein | optional | ja |
| `Require Pick` | nein | ja nach Prozess | ja |
| `Bin Mandatory` | optional | häufig ja | ja |
| `Directed Put-away and Pick` | nein | nein | ja |
| typische Dokumente | Purchase Order, Sales Order | Inventory Put-away/Pick | Warehouse Receipt, Put-away, Pick |
| Komplexität | niedrig | mittel | hoch |
| Schulungsbedarf | niedrig | mittel | hoch |

Achtung:
- Mehr Lagersteuerung bedeutet mehr Kontrolle, aber auch mehr Prozessschritte. Ein kleines Lager wird durch Advanced Warehouse nicht automatisch besser. Es wird nur komplexer.

### Unterschiedliche Auswirkungen

| Thema | Einfaches Lager | Gesteuertes Lager |
|---|---|---|
| Wareneingang | Einkauf bucht Eingang direkt | Lager bucht Warehouse Receipt, Einlagerung folgt |
| Verfügbarkeit | nach Belegbuchung sichtbar | abhängig von Receive/Put-away-Status |
| Fehlerquelle | falscher Lagerort/Menge | zusätzlich falscher Bin, offene Aktivität, nicht registrierter Pick |
| Verantwortung | Einkauf/Verkauf näher an Buchung | Lagerrolle stärker getrennt |
| Nachweis | gebuchter Beleg und Artikelposten | zusätzliche Warehouse-Dokumente |
| Tempo | schneller | kontrollierter |
| Eignung | kleine Lager, einfache Waren | große Lager, viele Bins, Chargen, Wegeoptimierung |

### Schrittfolge einfaches Lager

Wareneingang:
1. Tell Me → `Purchase Orders`.
2. Bestellung öffnen.
3. `Location Code` prüfen.
4. `Qty. to Receive` prüfen.
5. `Post` → `Receive`.
6. `Item Ledger Entries` prüfen.

Verkauf:
1. Tell Me → `Sales Orders`.
2. Auftrag öffnen.
3. `Location Code` und Verfügbarkeit prüfen.
4. `Qty. to Ship` prüfen.
5. `Post` → `Ship` oder `Ship and Invoice`.
6. Artikelposten und Sachposten prüfen.

### Schrittfolge gesteuertes Lager

Wareneingang:
1. Tell Me → `Warehouse Receipts`.
2. neues Warehouse Receipt erstellen.
3. `Get Source Documents` ausführen.
4. Bestellzeilen übernehmen.
5. Mengen physisch prüfen.
6. `Post Receipt` buchen.
7. Tell Me → `Warehouse Put-aways`.
8. Put-away öffnen.
9. Take-/Place-Zeilen prüfen.
10. `Register Put-away`.
11. Bin Content und Item Ledger Entries prüfen.

Auslieferung:
1. Tell Me → `Warehouse Shipments`.
2. Source Documents holen.
3. Shipment erstellen.
4. Pick erzeugen.
5. Tell Me → `Warehouse Picks`.
6. Pick registrieren.
7. Warehouse Shipment buchen.
8. Posted Shipment, Item Ledger Entries und Value Entries prüfen.

### Typische Lagerfehler und Lösungen

| Fehler | Symptom | Ursache | Korrektur |
|---|---|---|---|
| Ware ist physisch da, aber nicht verfügbar | Verkauf kann nicht liefern | Put-away nicht registriert | Warehouse Put-away abschließen |
| Ware liegt im falschen Bin | Pick schlägt falschen Platz vor | Einlagerung falsch | Movement oder Umlagerung |
| Bestellung ist geliefert, aber nicht fakturiert | Lagerwert vorläufig | Rechnung fehlt | Eingangsrechnung buchen |
| Verkauf kann nicht buchen | offene Warehouse-Aktivität | Pick/Shipment nicht abgeschlossen | Lagerdokument prüfen |
| Bestand negativ | falsche Reihenfolge oder Setup | Lieferung vor Eingang | Negative Inventory prüfen und Prozess sperren |
| Charge fehlt | Buchung blockiert | Item Tracking nicht gepflegt | Chargennummer erfassen |
| Inventur differiert | Mengenabweichung | physische Bewegung ohne BC-Buchung | Inventurprozess mit Freigabe |

### Welche Lagerlogik passt?

Entscheidungsregel:
- Einfaches Lager für wenige Artikel, wenige Lagerplätze und klare Verantwortlichkeiten.
- Basic Warehouse für einfache Trennung zwischen Büro und Lager.
- Advanced Warehouse für viele Lagerplätze, mehrere Mitarbeiter, hohe Mengen, Chargen/Serien, Wegeoptimierung und strikte Prozesskontrolle.

Schulungsübung:
1. Buche denselben Wareneingang einmal in `MZ-WH2` direkt aus der Bestellung.
2. Buche ihn in `FRA-WH1` über Warehouse Receipt und Put-away.
3. Vergleiche Anzahl Schritte, beteiligte Rollen, Fehlerquellen und Nachweise.
4. Erkläre, warum `FRA-WH1` kontrollierter, aber langsamer ist.

---

### Praxisfall Rhein-Main: Inventory und Warehouse

### Für absolute Einsteiger: Was du hier gerade tust

Du bildest eine reale Unternehmenshandlung in Business Central ab: Ware einlagern, kommissionieren, umlagern und bewerten. Der Bildschirm ist nur der Startpunkt. Entscheidend ist, dass Beleg, gebuchter Beleg, Posten, Bericht und Evidence Pack zusammenpassen.

### Warum braucht die Rhein-Main Industriegruppe diesen Prozess?

Die Rhein-Main Industriegruppe braucht diesen Prozess, weil operative Arbeit sonst nicht zuverlässig in Finance, Lager, Steuer und Reporting ankommt. Der Prozess nutzt `Lagerorte (Locations)`, `Artikelposten (Item Ledger Entries)`, `Wertposten (Value Entries)`. Beteiligt ist vor allem die Rolle Lagerist. Am Ende erwartet die Fachabteilung einen prüfbaren Beleg, passende Posten, einen Kontrollbericht und einen UAT-Nachweis.

### Rollen

| Rolle | Aufgabe | Ergebnis |
|---|---|---|
| Fachbereich | Vorgang fachlich auslösen | korrekter Ausgangsbeleg |
| Key User | Stammdaten und Pflichtfelder prüfen | buchbarer Vorgang |
| Finance/Controlling | Posten und Bericht prüfen | abgestimmtes Ergebnis |

### Schritt-für-Schritt in der deutschen BC-Oberfläche

1. Öffne die Suche mit `Alt+Q`.
2. Suche nach `Lagerorte (Locations)`, `Artikelposten (Item Ledger Entries)`, `Wertposten (Value Entries)`.
3. Öffne die passende Seite und lege den Vorgang für `SP-PUMP-01` an oder filtere darauf.
4. Prüfe Buchungsdatum, Belegdatum, Company, Lagerort, Dimensionen und Buchungsgruppen.
5. Erfasse Menge, Preis, Ressource, Sachkonto oder Projektbezug entsprechend dem Fall.
6. Wähle `Buchungsvorschau (Preview Posting)`, wenn der Vorgang eine Buchung auslöst.
7. Führe die fachliche Aktion aus: freigeben, registrieren, buchen, fakturieren oder ausgleichen.
8. Öffne den gebuchten Beleg oder die entstandenen Postenlisten.
9. Filtere nach Belegnummer, Artikel, Debitor, Kreditor, Projekt oder Anlage.
10. Öffne den Kontrollbericht `Lagerbewertung (Inventory Valuation)` und vergleiche Menge, Wert, Steuer und Dimension.
11. Speichere Belegnummern, Postenfilter und Bericht als Evidence Pack.

### Buchungsspur

| Ebene | Was prüfen? | Wo prüfen? |
|---|---|---|
| Ausgangsbeleg | fachlicher Vorgang und Pflichtfelder | Startseite des Prozesses |
| Gebuchter Beleg | gebuchte Lieferung, Rechnung, Zahlung, Journal oder Projektbuchung | gebuchte Belege/Postenlisten |
| Nebenbuch | Debitor, Kreditor, Artikel, Bank, Anlage oder Projekt | passende Postenliste |
| Sachposten | Hauptbuchwirkung | `Sachposten (G/L Entries)` |
| USt/Wert | Steuer, Lagerwert oder Kostenwirkung | `USt-Posten`, `Wertposten`, Bericht |
| Bericht | fachliche Kontrolle | `Lagerbewertung (Inventory Valuation)` |

### Zahlenbeispiel

Rhein-Main nutzt `SP-PUMP-01` mit einem Beispielwert von `10.000 EUR`. Die Buchung muss zeigen, welche Menge bewegt wird, welcher Wert entsteht, welche Dimension mitläuft und welcher Bericht das Ergebnis bestätigt.

### Abweichungen

| Abweichung | Risiko | Kontrolle |
|---|---|---|
| falsche Stammdaten | falsche Konten, Steuer oder Dimension | Stammdatenkarte und Buchungsvorschau |
| falsche Menge oder falscher Wert | Bestand, Marge oder Abschluss stimmt nicht | Postenliste und Kontrollbericht |
| Prozessschritt übersprungen | Belegkette unvollständig | gebuchte Belege und Evidence Pack |

### Fehlerdiagnose

| Fehler | Symptom | Ursache | Diagnosepfad | Korrekturweg | Was man nicht tun darf |
|---|---|---|---|---|---|
| falsche Dimension | Bericht zeigt Wert nicht | Pflichtdimension fehlt oder ist falsch | Beleg → Posten → Dimension | Dimension Correction Tool oder fachliche Korrekturbuchung | Bericht manuell überschreiben |
| falsche Buchungsgruppe | falsches Konto oder falsche USt | Stammdaten falsch gepflegt | Stammdatenkarte → Posting Setup → Sachposten | Stammdaten korrigieren, Beleg fachlich stornieren/neubuchen | gebuchte Posten löschen |
| falscher Status | Beleg kann nicht gebucht werden | Freigabe, Lageraktivität oder Pflichtfeld fehlt | Belegstatus → Fehlermeldung → Einrichtung | Status zurücksetzen, Pflichtfeld ergänzen, Prozessschritt nachholen | Warnungen ignorieren |

### Übung

Führe den Fall für `SP-PUMP-01` in der Trainingscompany aus. Dokumentiere Startbeleg, gebuchten Beleg, Posten, Kontrollbericht und eine typische Abweichung.

### Lösungsskizze

1. Öffne `Lagerorte (Locations)`, `Artikelposten (Item Ledger Entries)`, `Wertposten (Value Entries)` über `Alt+Q`.
2. Erfasse oder filtere den Vorgang für `SP-PUMP-01`.
3. Prüfe Datum, Lagerort, Buchungsgruppen und Dimensionen.
4. Nutze `Buchungsvorschau (Preview Posting)`, wenn eine Buchung erfolgt.
5. Buche oder registriere den Vorgang.
6. Prüfe Sachposten, Nebenbuchposten und `Lagerbewertung (Inventory Valuation)`.
7. Dokumentiere das Evidence Pack.

### UAT-Fall

| Feld | Inhalt |
|---|---|
| ID | `UAT-WHSE-001` |
| Ziel | Inventory und Warehouse fachlich abnehmen |
| Rolle | Lagerist |
| Voraussetzung | Stammdaten, Buchungsgruppen, Dimensionen und Berechtigungen sind eingerichtet |
| Testdaten | `SP-PUMP-01`, Beispielwert `10.000 EUR` |
| Erwartete Posten | Sachposten und passende Nebenbuchposten |
| Kontrollbericht | `Lagerbewertung (Inventory Valuation)` |
| Negativfall | falsche Dimension oder falsche Buchungsgruppe |
| Akzeptanzkriterium | Beleg, Posten, Bericht und Evidence Pack stimmen überein |

### In 5 Minuten merken

* 5 wichtigste Begriffe: Beleg, gebuchter Beleg, Posten, Dimension, Evidence Pack.
* 5 wichtigste Seiten: `Lagerorte (Locations)`, `Artikelposten (Item Ledger Entries)`, `Wertposten (Value Entries)`, `Sachposten`, passende Nebenbuchposten, Kontrollbericht, gebuchte Belege.
* 3 häufigste Fehler: falsche Stammdaten, falsche Dimension, übersprungener Prozessschritt.
* 3 Prüfungsfallen: Bildschirm ist nicht Buchung, Beleg ist nicht Posten, Bericht ersetzt keine Abstimmung.
* 1 Praxisregel: Erst Beleg verstehen, dann buchen, dann Posten und Bericht prüfen.


## 14. Planning, Assembly und Manufacturing: Maschine produzieren [Q16][Q17][Q18]

### Kapitelbox

| Feld | Inhalt |
|---|---|
| Zielgruppe | Einsteiger, Key User, Consultant, Architect |
| Schwierigkeit | Basic bis Advanced |
| Prozessbereich | Planning/Assembly/Manufacturing |
| Betroffene Companies | RM-PROD |
| MB-800-Relevanz | Ja: Planung, Stücklisten, Arbeitspläne, Fertigungsaufträge, Verbrauch, Output |
| Solution-Architect-Relevanz | Ja: Planungsparameter, Make-or-Buy, Fremdarbeit, Kostenregulierung |
| Benötigte Vorkenntnisse | Belege, Posten, Stammdaten, Buchungsgruppen, Dimensionen |
| Ergebnis nach dem Kapitel | Leser kann den Prozess mit Rhein-Main-Testdaten ausführen, Posten prüfen, Fehler diagnostizieren und UAT nachweisen |

### Beteiligte Rollen

| Rolle | Aufgabe | Ergebnis |
|---|---|---|
| Fachanwender | Prozess ausführen und Belegdaten prüfen | fachlich korrekter Vorgang |
| Key User | Stammdaten, Setup und Fehlerfälle prüfen | stabiler Prozess |
| Finance/Controlling | Buchungsspur, Bericht und Evidence Pack prüfen | abgestimmter Nachweis |
| Solution Architect | Standardgrenze und Betriebsfolge bewerten | tragfähiges Prozessdesign |

### Benötigte Stammdaten

Artikel `RM-M100`, `RAW-STEEL`, `COMP-CTRL`, Stückliste, Arbeitsplan, Arbeitsplatzgruppe, Lagerort `FRA-ZL`. Diese Daten müssen vor dem Test gepflegt sein, sonst erzeugt der richtige Klick später falsche Posten oder unvollständige Berichte.

### Benötigtes Setup

Produktionssetup, Planungspolitik, Fertigungsstücklisten, Arbeitspläne, Kapazitäten, Lagerbuchung. Das Setup wird nicht während der Buchung improvisiert, sondern vorab durch Key User und Finance freigegeben.

### Deutsche BC-Seiten mit englischer Suchhilfe

`Planungsarbeitsblatt (Planning Worksheet)`, `Fertigungsaufträge (Production Orders)`, `Verbrauch Buch.-Blatt (Consumption Journal)`, `Istmeldung Buch.-Blatt (Output Journal)`. Suche die Seiten über `Alt+Q`; wenn der deutsche Begriff nicht gefunden wird, nutze den englischen Klammerbegriff.

### Happy Path mit Rhein-Main-Testdaten

Testfall: Fertigungsauftrag `PROD-3001` für `RM-M100`, Menge `3`. Der Happy Path ist bestanden, wenn der gebuchte Beleg, die Nebenbuchposten, die Sachposten, der Kontrollbericht und das Evidence Pack übereinstimmen.

### Kontrollbericht

Fertigungsauftragsstatistik, Artikelposten, Wertposten, Kapazitätsposten. Der Kontrollbericht ist die fachliche Gegenprobe zur Buchung. Er beantwortet nicht nur, ob gebucht wurde, sondern ob Menge, Wert, Steuer, Dimension und Zeitraum stimmen.

### Korrekturweg

1. Fehlerbild aus Anwendersicht festhalten.
2. Belegnummer, Datum, Stammdaten und Dimensionen prüfen.
3. Buchungsspur bis zu Nebenbuchposten und Sachposten verfolgen.
4. Entscheiden, ob vor Buchung korrigiert, nach Buchung gutgeschrieben, storniert, ausgeglichen, umgebucht oder per zulässigem Korrekturwerkzeug korrigiert wird.
5. Korrektur mit Beleg, Posten und Bericht dokumentieren.

### Evidence Pack

Planungsvorschlag, freigegebener Fertigungsauftrag, Verbrauch, Output, Abweichungsanalyse. Das Evidence Pack wird im UAT und später im Betrieb genutzt, damit Fachbereich, Finance und Prüfung dieselbe Spur nachvollziehen können.

Die Mustergruppe produziert mehrere Produkte. Damit lassen sich Planung, Montage und Fertigung sauber unterscheiden.

### Für absolute Einsteiger: Was du hier gerade tust

Fertigung bedeutet: Aus eingekauften Materialien und Arbeitszeit entsteht ein neues Produkt. Business Central braucht dafür eine Stückliste, einen Arbeitsplan und einen Fertigungsauftrag. Die Stückliste sagt, welches Material verbraucht wird. Der Arbeitsplan sagt, welche Arbeitsschritte nötig sind. Der Fertigungsauftrag verbindet Verbrauch, Output und Kosten. Am Ende sieht Finance, welche Material- und Arbeitskosten in der Maschine stecken.

### Warum braucht die Rhein-Main Industriegruppe diesen Prozess?

RM-PROD produziert die Standardmaschine `RM-M100`. Ohne Fertigungsauftrag könnte das Unternehmen zwar Material entnehmen, aber nicht sauber beweisen, welcher Verbrauch zu welcher Maschine gehört. Business Central zeigt, ob die Fertigung mehr Material verbraucht als geplant, ob Output gebucht wurde und wie die Kosten in Lagerbewertung und GuV wirken.

### Produktstruktur

| Produkt | Prozess | Bestandteile |
|---|---|---|
| `KIT-MAINT` | Assembly | Pumpe + Sensor + Dichtung |
| `RM-M100` | Manufacturing Standard | Stahl, Steuerung, Montagezeit |
| `RM-X500` | Project + Manufacturing | kundenspezifische BOM, Projektressourcen |
| `SP-SENSOR-02` | Handels-/Serienartikel | Einkauf, Seriennummer |

### Fertigungsfluss

```mermaid
flowchart LR
    A["Sales Forecast / Sales Order"] --> B["Planning Worksheet"]
    B --> C["Firm Planned Production Order"]
    C --> D["Released Production Order"]
    D --> E["Consumption Journal"]
    D --> F["Output Journal"]
    E --> G["Value Entries"]
    F --> G
    G --> H["Finished Goods Inventory"]
```

### Mitarbeiterbedienung

| Rolle | Seite | Tätigkeit |
|---|---|---|
| Produktionsplanerin | `Planning Worksheet` | Bedarf berechnen, Vorschläge prüfen |
| Arbeitsvorbereitung | `Production BOMs`, `Routings` | Struktur und Arbeitsgänge pflegen |
| Meister | `Released Production Orders` | Auftrag starten, Material prüfen |
| Werker/Meister | `Consumption Journal`, `Output Journal` | Verbrauch und Output melden |
| Controller | `Production Order Statistics` | Abweichungen analysieren |

### Abweichungen

| Use Case | BC-Mechanik | Best Practice |
|---|---|---|
| Ausschuss | Mehrverbrauch oder Output-Differenz | Ausschussgrund dokumentieren |
| Ersatzkomponente | Komponentenänderung im Auftrag | Freigabe durch Arbeitsvorbereitung |
| Fremdarbeit | Subcontracting/Purchase | Bestellung mit Fertigungsbezug |
| Nacharbeit | zusätzlicher Arbeitsgang | Kosten separat auswerten |
| Eilauftrag | manuelle Produktionsorder | Planungsabweichung markieren |
| Teilfertigmeldung | Output kleiner Planmenge | Rest-WIP prüfen |

Schulungsübung:
- Erstelle Fertigungsauftrag `PROD-3001` für 3 Stück `RM-M100`. Melde 5 % Mehrverbrauch `RAW-STEEL` und erkläre die Abweichung in Value Entries.

---

### Praxisfall Rhein-Main: Planning, Assembly und Manufacturing

### Für absolute Einsteiger: Was du hier gerade tust

Du bildest eine reale Unternehmenshandlung in Business Central ab: Bedarf planen, Material verbrauchen und Output melden. Der Bildschirm ist nur der Startpunkt. Entscheidend ist, dass Beleg, gebuchter Beleg, Posten, Bericht und Evidence Pack zusammenpassen.

### Warum braucht die Rhein-Main Industriegruppe diesen Prozess?

Die Rhein-Main Industriegruppe braucht diesen Prozess, weil operative Arbeit sonst nicht zuverlässig in Finance, Lager, Steuer und Reporting ankommt. Der Prozess nutzt `Fertigungsaufträge (Production Orders)`, `Planungsarbeitsblatt (Planning Worksheet)`. Beteiligt ist vor allem die Rolle Produktionsplanerin und Meister. Am Ende erwartet die Fachabteilung einen prüfbaren Beleg, passende Posten, einen Kontrollbericht und einen UAT-Nachweis.

### Rollen

| Rolle | Aufgabe | Ergebnis |
|---|---|---|
| Fachbereich | Vorgang fachlich auslösen | korrekter Ausgangsbeleg |
| Key User | Stammdaten und Pflichtfelder prüfen | buchbarer Vorgang |
| Finance/Controlling | Posten und Bericht prüfen | abgestimmtes Ergebnis |

### Schritt-für-Schritt in der deutschen BC-Oberfläche

1. Öffne die Suche mit `Alt+Q`.
2. Suche nach `Fertigungsaufträge (Production Orders)`, `Planungsarbeitsblatt (Planning Worksheet)`.
3. Öffne die passende Seite und lege den Vorgang für `RM-M100` an oder filtere darauf.
4. Prüfe Buchungsdatum, Belegdatum, Company, Lagerort, Dimensionen und Buchungsgruppen.
5. Erfasse Menge, Preis, Ressource, Sachkonto oder Projektbezug entsprechend dem Fall.
6. Wähle `Buchungsvorschau (Preview Posting)`, wenn der Vorgang eine Buchung auslöst.
7. Führe die fachliche Aktion aus: freigeben, registrieren, buchen, fakturieren oder ausgleichen.
8. Öffne den gebuchten Beleg oder die entstandenen Postenlisten.
9. Filtere nach Belegnummer, Artikel, Debitor, Kreditor, Projekt oder Anlage.
10. Öffne den Kontrollbericht `Wertposten (Value Entries)` und Fertigungsauftragsstatistik und vergleiche Menge, Wert, Steuer und Dimension.
11. Speichere Belegnummern, Postenfilter und Bericht als Evidence Pack.

### Buchungsspur

| Ebene | Was prüfen? | Wo prüfen? |
|---|---|---|
| Ausgangsbeleg | fachlicher Vorgang und Pflichtfelder | Startseite des Prozesses |
| Gebuchter Beleg | gebuchte Lieferung, Rechnung, Zahlung, Journal oder Projektbuchung | gebuchte Belege/Postenlisten |
| Nebenbuch | Debitor, Kreditor, Artikel, Bank, Anlage oder Projekt | passende Postenliste |
| Sachposten | Hauptbuchwirkung | `Sachposten (G/L Entries)` |
| USt/Wert | Steuer, Lagerwert oder Kostenwirkung | `USt-Posten`, `Wertposten`, Bericht |
| Bericht | fachliche Kontrolle | `Wertposten (Value Entries)` und Fertigungsauftragsstatistik |

### Zahlenbeispiel

Rhein-Main nutzt `RM-M100` mit einem Beispielwert von `10.000 EUR`. Die Buchung muss zeigen, welche Menge bewegt wird, welcher Wert entsteht, welche Dimension mitläuft und welcher Bericht das Ergebnis bestätigt.

### Abweichungen

| Abweichung | Risiko | Kontrolle |
|---|---|---|
| falsche Stammdaten | falsche Konten, Steuer oder Dimension | Stammdatenkarte und Buchungsvorschau |
| falsche Menge oder falscher Wert | Bestand, Marge oder Abschluss stimmt nicht | Postenliste und Kontrollbericht |
| Prozessschritt übersprungen | Belegkette unvollständig | gebuchte Belege und Evidence Pack |

### Fehlerdiagnose

| Fehler | Symptom | Ursache | Diagnosepfad | Korrekturweg | Was man nicht tun darf |
|---|---|---|---|---|---|
| falsche Dimension | Bericht zeigt Wert nicht | Pflichtdimension fehlt oder ist falsch | Beleg → Posten → Dimension | Dimension Correction Tool oder fachliche Korrekturbuchung | Bericht manuell überschreiben |
| falsche Buchungsgruppe | falsches Konto oder falsche USt | Stammdaten falsch gepflegt | Stammdatenkarte → Posting Setup → Sachposten | Stammdaten korrigieren, Beleg fachlich stornieren/neubuchen | gebuchte Posten löschen |
| falscher Status | Beleg kann nicht gebucht werden | Freigabe, Lageraktivität oder Pflichtfeld fehlt | Belegstatus → Fehlermeldung → Einrichtung | Status zurücksetzen, Pflichtfeld ergänzen, Prozessschritt nachholen | Warnungen ignorieren |

### Übung

Führe den Fall für `RM-M100` in der Trainingscompany aus. Dokumentiere Startbeleg, gebuchten Beleg, Posten, Kontrollbericht und eine typische Abweichung.

### Lösungsskizze

1. Öffne `Fertigungsaufträge (Production Orders)`, `Planungsarbeitsblatt (Planning Worksheet)` über `Alt+Q`.
2. Erfasse oder filtere den Vorgang für `RM-M100`.
3. Prüfe Datum, Lagerort, Buchungsgruppen und Dimensionen.
4. Nutze `Buchungsvorschau (Preview Posting)`, wenn eine Buchung erfolgt.
5. Buche oder registriere den Vorgang.
6. Prüfe Sachposten, Nebenbuchposten und `Wertposten (Value Entries)` und Fertigungsauftragsstatistik.
7. Dokumentiere das Evidence Pack.

### UAT-Fall

| Feld | Inhalt |
|---|---|
| ID | `UAT-MFG-001` |
| Ziel | Planning, Assembly und Manufacturing fachlich abnehmen |
| Rolle | Produktionsplanerin und Meister |
| Voraussetzung | Stammdaten, Buchungsgruppen, Dimensionen und Berechtigungen sind eingerichtet |
| Testdaten | `RM-M100`, Beispielwert `10.000 EUR` |
| Erwartete Posten | Sachposten und passende Nebenbuchposten |
| Kontrollbericht | `Wertposten (Value Entries)` und Fertigungsauftragsstatistik |
| Negativfall | falsche Dimension oder falsche Buchungsgruppe |
| Akzeptanzkriterium | Beleg, Posten, Bericht und Evidence Pack stimmen überein |

### In 5 Minuten merken

* 5 wichtigste Begriffe: Beleg, gebuchter Beleg, Posten, Dimension, Evidence Pack.
* 5 wichtigste Seiten: `Fertigungsaufträge (Production Orders)`, `Planungsarbeitsblatt (Planning Worksheet)`, `Sachposten`, passende Nebenbuchposten, Kontrollbericht, gebuchte Belege.
* 3 häufigste Fehler: falsche Stammdaten, falsche Dimension, übersprungener Prozessschritt.
* 3 Prüfungsfallen: Bildschirm ist nicht Buchung, Beleg ist nicht Posten, Bericht ersetzt keine Abstimmung.
* 1 Praxisregel: Erst Beleg verstehen, dann buchen, dann Posten und Bericht prüfen.


## 15. Service: Wartung, Garantie und Ersatzteilverbrauch [Q19][Q25][Q26]

### Kapitelbox

| Feld | Inhalt |
|---|---|
| Zielgruppe | Einsteiger, Key User, Consultant, Architect |
| Schwierigkeit | Basic bis Advanced |
| Prozessbereich | Service |
| Betroffene Companies | RM-SERVICE, RM-SHARED |
| MB-800-Relevanz | Ja: Serviceartikel, Serviceauftrag, Garantie, Kulanz, Ersatzteilverbrauch, Ressource |
| Solution-Architect-Relevanz | Ja: BC Service vs. Field Service, Garantie-/Kulanzdesign, Ersatzteillager |
| Benötigte Vorkenntnisse | Belege, Posten, Stammdaten, Buchungsgruppen, Dimensionen |
| Ergebnis nach dem Kapitel | Leser kann den Prozess mit Rhein-Main-Testdaten ausführen, Posten prüfen, Fehler diagnostizieren und UAT nachweisen |

### Beteiligte Rollen

| Rolle | Aufgabe | Ergebnis |
|---|---|---|
| Fachanwender | Prozess ausführen und Belegdaten prüfen | fachlich korrekter Vorgang |
| Key User | Stammdaten, Setup und Fehlerfälle prüfen | stabiler Prozess |
| Finance/Controlling | Buchungsspur, Bericht und Evidence Pack prüfen | abgestimmter Nachweis |
| Solution Architect | Standardgrenze und Betriebsfolge bewerten | tragfähiges Prozessdesign |

### Benötigte Stammdaten

Serviceartikel für `RM-M100`, Debitor `D10000`, Artikel `SP-PUMP-01`, Ressource `RES-TECH`, Fahrzeuglager. Diese Daten müssen vor dem Test gepflegt sein, sonst erzeugt der richtige Klick später falsche Posten oder unvollständige Berichte.

### Benötigtes Setup

Serviceeinrichtung, Serviceartikel, Servicevertragslogik, Ressourcen, Lagerort `VAN-SERV`, Buchungsgruppen. Das Setup wird nicht während der Buchung improvisiert, sondern vorab durch Key User und Finance freigegeben.

### Deutsche BC-Seiten mit englischer Suchhilfe

`Serviceaufträge (Service Orders)`, `Serviceartikel (Service Items)`, `Ressourcen (Resources)`, `Artikelposten (Item Ledger Entries)`. Suche die Seiten über `Alt+Q`; wenn der deutsche Begriff nicht gefunden wird, nutze den englischen Klammerbegriff.

### Happy Path mit Rhein-Main-Testdaten

Testfall: Serviceauftrag `SERV-4001`, Ersatzteil `SP-PUMP-01`, 2 Technikerstunden. Der Happy Path ist bestanden, wenn der gebuchte Beleg, die Nebenbuchposten, die Sachposten, der Kontrollbericht und das Evidence Pack übereinstimmen.

### Kontrollbericht

Serviceposten, Artikelposten, Debitorenposten, Sachposten. Der Kontrollbericht ist die fachliche Gegenprobe zur Buchung. Er beantwortet nicht nur, ob gebucht wurde, sondern ob Menge, Wert, Steuer, Dimension und Zeitraum stimmen.

### Korrekturweg

1. Fehlerbild aus Anwendersicht festhalten.
2. Belegnummer, Datum, Stammdaten und Dimensionen prüfen.
3. Buchungsspur bis zu Nebenbuchposten und Sachposten verfolgen.
4. Entscheiden, ob vor Buchung korrigiert, nach Buchung gutgeschrieben, storniert, ausgeglichen, umgebucht oder per zulässigem Korrekturwerkzeug korrigiert wird.
5. Korrektur mit Beleg, Posten und Bericht dokumentieren.

### Evidence Pack

Serviceauftrag, Technikerzeiten, Ersatzteilverbrauch, Garantie-/Kulanzentscheidung, Rechnung oder Nachweis. Das Evidence Pack wird im UAT und später im Betrieb genutzt, damit Fachbereich, Finance und Prüfung dieselbe Spur nachvollziehen können.

Service Management ist Standard. Miet- und Finanzierungsmodelle sind je Ausprägung Standard, Prozessdesign oder Erweiterung. Dieses Buch zeigt zuerst den Standard und markiert danach Grenzen.

### Für absolute Einsteiger: Was du hier gerade tust

Nach dem Verkauf einer Maschine endet die Kundenbeziehung nicht. Ein Kunde meldet einen Fehler, ein Techniker fährt zum Kunden, verbraucht ein Ersatzteil und erfasst Arbeitszeit. Business Central bündelt diese Informationen im Serviceauftrag. Je nach Fall wird daraus eine Rechnung, ein Garantiefall oder Kulanz. Service verbindet also Kunde, Maschine, Ersatzteil, Ressource, Lager und Finance.

### Warum braucht die Rhein-Main Industriegruppe diesen Prozess?

RM-SERVICE verdient Geld mit Wartung und Reparaturen, muss aber auch Garantiekosten kontrollieren. Ohne Serviceprozess würden Ersatzteile verschwinden, Technikerzeiten nicht fakturiert und Garantieentscheidungen nicht nachweisbar. Business Central erzeugt Servicebelege, Artikelbewegungen, Sachposten, Debitorenposten oder Kulanznachweise.

### Service-Standard

```mermaid
flowchart LR
    A["Service Item"] --> B["Service Order"]
    B --> C["Service Lines"]
    C --> D["Item / Resource Consumption"]
    D --> E["Service Invoice"]
    E --> F["Customer Ledger Entry"]
```

Mitarbeiterbedienung:
1. Servicedisponent: Tell Me → `Service Orders` → neuen Auftrag für D10000 anlegen.
2. Techniker: Serviceartikel auswählen, Fehlerbeschreibung erfassen.
3. Techniker: Ersatzteil `SP-PUMP-01` und Ressource `RES-TECH` erfassen.
4. Serviceabrechnung: Auftrag fakturieren oder als Garantie/Kulanz markieren.

### Mietmodell im BC-Standardgrenzbereich

| Modell | Standardabbildung | Grenze |
|---|---|---|
| Kurzzeitmiete mit Rechnung | Sales Invoice / Project / Service | Verfügbarkeitskalender nicht vollwertig |
| Wartungspauschale | Service Contract | Vertragslogik standardnah |
| Mietmaschine als Anlage | Fixed Asset + Service Item | komplexe Mietabrechnung braucht Design |
| monatliche Abgrenzung | Deferrals | Vertragsänderungen separat steuern |

BC-Best-Practice:
- Mietfälle erhalten eigene Produktlinie `RENTAL`, eigene Dimension und eigenes Evidence Pack.
- Wenn Verfügbarkeitskalender, automatische Verlängerung, variable Nutzung oder komplexe Indexierung nötig sind, wird Extension/Customizing geprüft.

### Finanzierung im Standardgrenzbereich

| Use Case | Standardabbildung | Hinweis |
|---|---|---|
| Kunde zahlt in Raten | Zahlungsbedingungen / Teilzahlungen | einfache Raten möglich |
| externe Bank finanziert | Verkauf an Kunden, Zahlung durch Bank | Abtretung/Vertrag separat dokumentieren |
| Leasingähnlicher Verkauf | Vertragliche Prüfung erforderlich | nicht als bloßer Verkaufsauftrag behandeln |

Schulungsübung:
- Lege einen Mietfall für `RM-M100` über 12 Monate an. Nutze Dimension `PRODUCTLINE = RENTAL`, erstelle Monatsrechnung und erkläre, warum dies keine vollständige Mietverwaltungssoftware ersetzt.

---

### Praxisfall Rhein-Main: Service

### Für absolute Einsteiger: Was du hier gerade tust

Du bildest eine reale Unternehmenshandlung in Business Central ab: Wartung durchführen, Ersatzteil verbrauchen und Rechnung oder Kulanz buchen. Der Bildschirm ist nur der Startpunkt. Entscheidend ist, dass Beleg, gebuchter Beleg, Posten, Bericht und Evidence Pack zusammenpassen.

### Warum braucht die Rhein-Main Industriegruppe diesen Prozess?

Die Rhein-Main Industriegruppe braucht diesen Prozess, weil operative Arbeit sonst nicht zuverlässig in Finance, Lager, Steuer und Reporting ankommt. Der Prozess nutzt `Serviceaufträge (Service Orders)`. Beteiligt ist vor allem die Rolle Servicedisponent und Techniker. Am Ende erwartet die Fachabteilung einen prüfbaren Beleg, passende Posten, einen Kontrollbericht und einen UAT-Nachweis.

### Rollen

| Rolle | Aufgabe | Ergebnis |
|---|---|---|
| Fachbereich | Vorgang fachlich auslösen | korrekter Ausgangsbeleg |
| Key User | Stammdaten und Pflichtfelder prüfen | buchbarer Vorgang |
| Finance/Controlling | Posten und Bericht prüfen | abgestimmtes Ergebnis |

### Schritt-für-Schritt in der deutschen BC-Oberfläche

1. Öffne die Suche mit `Alt+Q`.
2. Suche nach `Serviceaufträge (Service Orders)`.
3. Öffne die passende Seite und lege den Vorgang für `SP-PUMP-01` und `RES-TECH` an oder filtere darauf.
4. Prüfe Buchungsdatum, Belegdatum, Company, Lagerort, Dimensionen und Buchungsgruppen.
5. Erfasse Menge, Preis, Ressource, Sachkonto oder Projektbezug entsprechend dem Fall.
6. Wähle `Buchungsvorschau (Preview Posting)`, wenn der Vorgang eine Buchung auslöst.
7. Führe die fachliche Aktion aus: freigeben, registrieren, buchen, fakturieren oder ausgleichen.
8. Öffne den gebuchten Beleg oder die entstandenen Postenlisten.
9. Filtere nach Belegnummer, Artikel, Debitor, Kreditor, Projekt oder Anlage.
10. Öffne den Kontrollbericht `Serviceposten`, `Artikelposten`, `Debitorenposten` und vergleiche Menge, Wert, Steuer und Dimension.
11. Speichere Belegnummern, Postenfilter und Bericht als Evidence Pack.

### Buchungsspur

| Ebene | Was prüfen? | Wo prüfen? |
|---|---|---|
| Ausgangsbeleg | fachlicher Vorgang und Pflichtfelder | Startseite des Prozesses |
| Gebuchter Beleg | gebuchte Lieferung, Rechnung, Zahlung, Journal oder Projektbuchung | gebuchte Belege/Postenlisten |
| Nebenbuch | Debitor, Kreditor, Artikel, Bank, Anlage oder Projekt | passende Postenliste |
| Sachposten | Hauptbuchwirkung | `Sachposten (G/L Entries)` |
| USt/Wert | Steuer, Lagerwert oder Kostenwirkung | `USt-Posten`, `Wertposten`, Bericht |
| Bericht | fachliche Kontrolle | `Serviceposten`, `Artikelposten`, `Debitorenposten` |

### Zahlenbeispiel

Rhein-Main nutzt `SP-PUMP-01` und `RES-TECH` mit einem Beispielwert von `10.000 EUR`. Die Buchung muss zeigen, welche Menge bewegt wird, welcher Wert entsteht, welche Dimension mitläuft und welcher Bericht das Ergebnis bestätigt.

### Abweichungen

| Abweichung | Risiko | Kontrolle |
|---|---|---|
| falsche Stammdaten | falsche Konten, Steuer oder Dimension | Stammdatenkarte und Buchungsvorschau |
| falsche Menge oder falscher Wert | Bestand, Marge oder Abschluss stimmt nicht | Postenliste und Kontrollbericht |
| Prozessschritt übersprungen | Belegkette unvollständig | gebuchte Belege und Evidence Pack |

### Fehlerdiagnose

| Fehler | Symptom | Ursache | Diagnosepfad | Korrekturweg | Was man nicht tun darf |
|---|---|---|---|---|---|
| falsche Dimension | Bericht zeigt Wert nicht | Pflichtdimension fehlt oder ist falsch | Beleg → Posten → Dimension | Dimension Correction Tool oder fachliche Korrekturbuchung | Bericht manuell überschreiben |
| falsche Buchungsgruppe | falsches Konto oder falsche USt | Stammdaten falsch gepflegt | Stammdatenkarte → Posting Setup → Sachposten | Stammdaten korrigieren, Beleg fachlich stornieren/neubuchen | gebuchte Posten löschen |
| falscher Status | Beleg kann nicht gebucht werden | Freigabe, Lageraktivität oder Pflichtfeld fehlt | Belegstatus → Fehlermeldung → Einrichtung | Status zurücksetzen, Pflichtfeld ergänzen, Prozessschritt nachholen | Warnungen ignorieren |

### Übung

Führe den Fall für `SP-PUMP-01` und `RES-TECH` in der Trainingscompany aus. Dokumentiere Startbeleg, gebuchten Beleg, Posten, Kontrollbericht und eine typische Abweichung.

### Lösungsskizze

1. Öffne `Serviceaufträge (Service Orders)` über `Alt+Q`.
2. Erfasse oder filtere den Vorgang für `SP-PUMP-01` und `RES-TECH`.
3. Prüfe Datum, Lagerort, Buchungsgruppen und Dimensionen.
4. Nutze `Buchungsvorschau (Preview Posting)`, wenn eine Buchung erfolgt.
5. Buche oder registriere den Vorgang.
6. Prüfe Sachposten, Nebenbuchposten und `Serviceposten`, `Artikelposten`, `Debitorenposten`.
7. Dokumentiere das Evidence Pack.

### UAT-Fall

| Feld | Inhalt |
|---|---|
| ID | `UAT-SERV-001` |
| Ziel | Service fachlich abnehmen |
| Rolle | Servicedisponent und Techniker |
| Voraussetzung | Stammdaten, Buchungsgruppen, Dimensionen und Berechtigungen sind eingerichtet |
| Testdaten | `SP-PUMP-01` und `RES-TECH`, Beispielwert `10.000 EUR` |
| Erwartete Posten | Sachposten und passende Nebenbuchposten |
| Kontrollbericht | `Serviceposten`, `Artikelposten`, `Debitorenposten` |
| Negativfall | falsche Dimension oder falsche Buchungsgruppe |
| Akzeptanzkriterium | Beleg, Posten, Bericht und Evidence Pack stimmen überein |

### In 5 Minuten merken

* 5 wichtigste Begriffe: Beleg, gebuchter Beleg, Posten, Dimension, Evidence Pack.
* 5 wichtigste Seiten: `Serviceaufträge (Service Orders)`, `Sachposten`, passende Nebenbuchposten, Kontrollbericht, gebuchte Belege.
* 3 häufigste Fehler: falsche Stammdaten, falsche Dimension, übersprungener Prozessschritt.
* 3 Prüfungsfallen: Bildschirm ist nicht Buchung, Beleg ist nicht Posten, Bericht ersetzt keine Abstimmung.
* 1 Praxisregel: Erst Beleg verstehen, dann buchen, dann Posten und Bericht prüfen.


## 16. Projects: Installation und Meilensteinrechnung [Q27]

### Kapitelbox

| Feld | Inhalt |
|---|---|
| Zielgruppe | Einsteiger, Key User, Consultant, Architect |
| Schwierigkeit | Basic bis Advanced |
| Prozessbereich | Projects |
| Betroffene Companies | RM-SERVICE, RM-SHARED |
| MB-800-Relevanz | Ja: Projekte, Projektaufgaben, Ressourcen, Material, Fremdleistung, WIP/Faktura |
| Solution-Architect-Relevanz | Ja: Projektstruktur, WIP-Methode, Meilensteinrechnung, Projektmarge |
| Benötigte Vorkenntnisse | Belege, Posten, Stammdaten, Buchungsgruppen, Dimensionen |
| Ergebnis nach dem Kapitel | Leser kann den Prozess mit Rhein-Main-Testdaten ausführen, Posten prüfen, Fehler diagnostizieren und UAT nachweisen |

### Beteiligte Rollen

| Rolle | Aufgabe | Ergebnis |
|---|---|---|
| Fachanwender | Prozess ausführen und Belegdaten prüfen | fachlich korrekter Vorgang |
| Key User | Stammdaten, Setup und Fehlerfälle prüfen | stabiler Prozess |
| Finance/Controlling | Buchungsspur, Bericht und Evidence Pack prüfen | abgestimmter Nachweis |
| Solution Architect | Standardgrenze und Betriebsfolge bewerten | tragfähiges Prozessdesign |

### Benötigte Stammdaten

Projekt `PROJ-5001`, Sondermaschine `RM-X500`, Ressource `RES-TECH`, Artikel `SP-SENSOR-02`, Kreditor Fremdleistung. Diese Daten müssen vor dem Test gepflegt sein, sonst erzeugt der richtige Klick später falsche Posten oder unvollständige Berichte.

### Benötigtes Setup

Projektsetup, Projektbuchungsgruppen, Ressourcen, WIP-Methode, Nummernserien, Dimension `PROJECT`. Das Setup wird nicht während der Buchung improvisiert, sondern vorab durch Key User und Finance freigegeben.

### Deutsche BC-Seiten mit englischer Suchhilfe

`Projekte (Projects)`, `Projektaufgaben (Project Tasks)`, `Projekt Buch.-Blätter (Project Journals)`, `Projektplanzeilen (Project Planning Lines)`. Suche die Seiten über `Alt+Q`; wenn der deutsche Begriff nicht gefunden wird, nutze den englischen Klammerbegriff.

### Happy Path mit Rhein-Main-Testdaten

Testfall: Projekt `PROJ-5001`, 20 Stunden, Material `SP-SENSOR-02`, Meilenstein `40 %`. Der Happy Path ist bestanden, wenn der gebuchte Beleg, die Nebenbuchposten, die Sachposten, der Kontrollbericht und das Evidence Pack übereinstimmen.

### Kontrollbericht

Projektposten, Projektstatistik, Sachposten, unfakturierte Leistungen. Der Kontrollbericht ist die fachliche Gegenprobe zur Buchung. Er beantwortet nicht nur, ob gebucht wurde, sondern ob Menge, Wert, Steuer, Dimension und Zeitraum stimmen.

### Korrekturweg

1. Fehlerbild aus Anwendersicht festhalten.
2. Belegnummer, Datum, Stammdaten und Dimensionen prüfen.
3. Buchungsspur bis zu Nebenbuchposten und Sachposten verfolgen.
4. Entscheiden, ob vor Buchung korrigiert, nach Buchung gutgeschrieben, storniert, ausgeglichen, umgebucht oder per zulässigem Korrekturwerkzeug korrigiert wird.
5. Korrektur mit Beleg, Posten und Bericht dokumentieren.

### Evidence Pack

Projektkarte, Budget/Ist, Projektposten, Meilensteinrechnung, Margenbericht. Das Evidence Pack wird im UAT und später im Betrieb genutzt, damit Fachbereich, Finance und Prüfung dieselbe Spur nachvollziehen können.

Projects bilden mehrperiodige Leistungserbringung ab. Die Mustergruppe nutzt Projekte für Installation, Sondermaschinen und Kundenschulungen.

### Für absolute Einsteiger: Was du hier gerade tust

Ein Projekt ist ein Kundenauftrag, der nicht mit einer einzigen Lieferung erledigt ist. Es gibt Aufgaben, Zeiten, Material, Fremdleistungen, Meilensteine und Rechnungen. Business Central sammelt diese Werte auf Projektaufgaben. Dadurch sieht die Projektleitung, ob Budget, Istkosten, fakturierte Beträge und offene Leistungen zusammenpassen.

### Warum braucht die Rhein-Main Industriegruppe diesen Prozess?

RM-SERVICE installiert Sondermaschinen beim Kunden. Dafür werden Technikerstunden, Material und Fremdleistungen verbraucht. Ohne Projektmodul wären Kosten in verschiedenen Belegen verteilt und die Marge zu spät sichtbar. Business Central erzeugt Projektposten, Sachposten, Verkaufsrechnungen und Projektberichte.

### Prozessfluss

```mermaid
flowchart LR
    A["Project Card"] --> B["Project Tasks"]
    B --> C["Planning Lines"]
    C --> D["Usage: Item / Resource / G/L"]
    D --> E["Project Ledger Entries"]
    E --> F["WIP / Billing"]
    F --> G["Sales Invoice"]
```

### Mitarbeiterbedienung

| Rolle | Seite | Tätigkeit |
|---|---|---|
| Projektleiter | `Projects` | Projekt und Aufgaben anlegen |
| Einkauf | `Purchase Orders` | Projektbezogene Fremdleistung bestellen |
| Lager | `Item Journals` / Projektverbrauch | Material auf Projekt buchen |
| Consultant/Techniker | `Project Journals` | Zeit erfassen |
| Finance | `Create Project Sales Invoice` | Faktura erstellen |

### Abweichungen

| Use Case | Risiko | Kontrolle |
|---|---|---|
| Festpreis | Istkosten überschreiten Erlös | Budget/Ist-Bericht |
| Time & Material | Zeiten nicht fakturiert | Unbilled-Auswertung |
| Meilenstein | Erlös vor Leistung | Abgrenzung |
| Fremdleistung | Kosten ohne Projektbezug | Bestellzeile mit Projekt |
| Projektlager | Material bleibt im falschen Lager | Location `PROJ-BER` |

Schulungsübung:
- Projekt `PROJ-5001`: Installiere `RM-X500`, buche 20 Technikerstunden, Material `SP-SENSOR-02`, Fremdleistung und eine Meilensteinrechnung.

---

### Praxisfall Rhein-Main: Projects

### Für absolute Einsteiger: Was du hier gerade tust

Du bildest eine reale Unternehmenshandlung in Business Central ab: Projektaufgaben planen, Material und Ressourcen buchen, Meilenstein fakturieren. Der Bildschirm ist nur der Startpunkt. Entscheidend ist, dass Beleg, gebuchter Beleg, Posten, Bericht und Evidence Pack zusammenpassen.

### Warum braucht die Rhein-Main Industriegruppe diesen Prozess?

Die Rhein-Main Industriegruppe braucht diesen Prozess, weil operative Arbeit sonst nicht zuverlässig in Finance, Lager, Steuer und Reporting ankommt. Der Prozess nutzt `Projekte (Projects)`, `Projekt Buch.-Blätter (Project Journals)`. Beteiligt ist vor allem die Rolle Projektleiter. Am Ende erwartet die Fachabteilung einen prüfbaren Beleg, passende Posten, einen Kontrollbericht und einen UAT-Nachweis.

### Rollen

| Rolle | Aufgabe | Ergebnis |
|---|---|---|
| Fachbereich | Vorgang fachlich auslösen | korrekter Ausgangsbeleg |
| Key User | Stammdaten und Pflichtfelder prüfen | buchbarer Vorgang |
| Finance/Controlling | Posten und Bericht prüfen | abgestimmtes Ergebnis |

### Schritt-für-Schritt in der deutschen BC-Oberfläche

1. Öffne die Suche mit `Alt+Q`.
2. Suche nach `Projekte (Projects)`, `Projekt Buch.-Blätter (Project Journals)`.
3. Öffne die passende Seite und lege den Vorgang für `PROJ-5001` an oder filtere darauf.
4. Prüfe Buchungsdatum, Belegdatum, Company, Lagerort, Dimensionen und Buchungsgruppen.
5. Erfasse Menge, Preis, Ressource, Sachkonto oder Projektbezug entsprechend dem Fall.
6. Wähle `Buchungsvorschau (Preview Posting)`, wenn der Vorgang eine Buchung auslöst.
7. Führe die fachliche Aktion aus: freigeben, registrieren, buchen, fakturieren oder ausgleichen.
8. Öffne den gebuchten Beleg oder die entstandenen Postenlisten.
9. Filtere nach Belegnummer, Artikel, Debitor, Kreditor, Projekt oder Anlage.
10. Öffne den Kontrollbericht `Projektposten (Project Ledger Entries)` und Projektstatistik und vergleiche Menge, Wert, Steuer und Dimension.
11. Speichere Belegnummern, Postenfilter und Bericht als Evidence Pack.

### Buchungsspur

| Ebene | Was prüfen? | Wo prüfen? |
|---|---|---|
| Ausgangsbeleg | fachlicher Vorgang und Pflichtfelder | Startseite des Prozesses |
| Gebuchter Beleg | gebuchte Lieferung, Rechnung, Zahlung, Journal oder Projektbuchung | gebuchte Belege/Postenlisten |
| Nebenbuch | Debitor, Kreditor, Artikel, Bank, Anlage oder Projekt | passende Postenliste |
| Sachposten | Hauptbuchwirkung | `Sachposten (G/L Entries)` |
| USt/Wert | Steuer, Lagerwert oder Kostenwirkung | `USt-Posten`, `Wertposten`, Bericht |
| Bericht | fachliche Kontrolle | `Projektposten (Project Ledger Entries)` und Projektstatistik |

### Zahlenbeispiel

Rhein-Main nutzt `PROJ-5001` mit einem Beispielwert von `10.000 EUR`. Die Buchung muss zeigen, welche Menge bewegt wird, welcher Wert entsteht, welche Dimension mitläuft und welcher Bericht das Ergebnis bestätigt.

### Abweichungen

| Abweichung | Risiko | Kontrolle |
|---|---|---|
| falsche Stammdaten | falsche Konten, Steuer oder Dimension | Stammdatenkarte und Buchungsvorschau |
| falsche Menge oder falscher Wert | Bestand, Marge oder Abschluss stimmt nicht | Postenliste und Kontrollbericht |
| Prozessschritt übersprungen | Belegkette unvollständig | gebuchte Belege und Evidence Pack |

### Fehlerdiagnose

| Fehler | Symptom | Ursache | Diagnosepfad | Korrekturweg | Was man nicht tun darf |
|---|---|---|---|---|---|
| falsche Dimension | Bericht zeigt Wert nicht | Pflichtdimension fehlt oder ist falsch | Beleg → Posten → Dimension | Dimension Correction Tool oder fachliche Korrekturbuchung | Bericht manuell überschreiben |
| falsche Buchungsgruppe | falsches Konto oder falsche USt | Stammdaten falsch gepflegt | Stammdatenkarte → Posting Setup → Sachposten | Stammdaten korrigieren, Beleg fachlich stornieren/neubuchen | gebuchte Posten löschen |
| falscher Status | Beleg kann nicht gebucht werden | Freigabe, Lageraktivität oder Pflichtfeld fehlt | Belegstatus → Fehlermeldung → Einrichtung | Status zurücksetzen, Pflichtfeld ergänzen, Prozessschritt nachholen | Warnungen ignorieren |

### Übung

Führe den Fall für `PROJ-5001` in der Trainingscompany aus. Dokumentiere Startbeleg, gebuchten Beleg, Posten, Kontrollbericht und eine typische Abweichung.

### Lösungsskizze

1. Öffne `Projekte (Projects)`, `Projekt Buch.-Blätter (Project Journals)` über `Alt+Q`.
2. Erfasse oder filtere den Vorgang für `PROJ-5001`.
3. Prüfe Datum, Lagerort, Buchungsgruppen und Dimensionen.
4. Nutze `Buchungsvorschau (Preview Posting)`, wenn eine Buchung erfolgt.
5. Buche oder registriere den Vorgang.
6. Prüfe Sachposten, Nebenbuchposten und `Projektposten (Project Ledger Entries)` und Projektstatistik.
7. Dokumentiere das Evidence Pack.

### UAT-Fall

| Feld | Inhalt |
|---|---|
| ID | `UAT-PROJ-001` |
| Ziel | Projects fachlich abnehmen |
| Rolle | Projektleiter |
| Voraussetzung | Stammdaten, Buchungsgruppen, Dimensionen und Berechtigungen sind eingerichtet |
| Testdaten | `PROJ-5001`, Beispielwert `10.000 EUR` |
| Erwartete Posten | Sachposten und passende Nebenbuchposten |
| Kontrollbericht | `Projektposten (Project Ledger Entries)` und Projektstatistik |
| Negativfall | falsche Dimension oder falsche Buchungsgruppe |
| Akzeptanzkriterium | Beleg, Posten, Bericht und Evidence Pack stimmen überein |

### In 5 Minuten merken

* 5 wichtigste Begriffe: Beleg, gebuchter Beleg, Posten, Dimension, Evidence Pack.
* 5 wichtigste Seiten: `Projekte (Projects)`, `Projekt Buch.-Blätter (Project Journals)`, `Sachposten`, passende Nebenbuchposten, Kontrollbericht, gebuchte Belege.
* 3 häufigste Fehler: falsche Stammdaten, falsche Dimension, übersprungener Prozessschritt.
* 3 Prüfungsfallen: Bildschirm ist nicht Buchung, Beleg ist nicht Posten, Bericht ersetzt keine Abstimmung.
* 1 Praxisregel: Erst Beleg verstehen, dann buchen, dann Posten und Bericht prüfen.


## 17. Shopify, Dropshipping und Sonderverkauf [Q10][Q73][Q74]

### Kapitelbox

| Feld | Inhalt |
|---|---|
| Zielgruppe | Einsteiger, Key User, Consultant, Architect |
| Schwierigkeit | Basic bis Advanced |
| Prozessbereich | Shopify/Dropshipping/Sonderverkauf |
| Betroffene Companies | RM-SALES, RM-SHARED |
| MB-800-Relevanz | Ja: Shopify-Aufträge, Artikelmapping, Zahlungen, Dropshipping, Steuerlogik |
| Solution-Architect-Relevanz | Ja: Shop-Integration, Mapping, Steuergrenzen, Dropship-Prozessdesign |
| Benötigte Vorkenntnisse | Belege, Posten, Stammdaten, Buchungsgruppen, Dimensionen |
| Ergebnis nach dem Kapitel | Leser kann den Prozess mit Rhein-Main-Testdaten ausführen, Posten prüfen, Fehler diagnostizieren und UAT nachweisen |

### Beteiligte Rollen

| Rolle | Aufgabe | Ergebnis |
|---|---|---|
| Fachanwender | Prozess ausführen und Belegdaten prüfen | fachlich korrekter Vorgang |
| Key User | Stammdaten, Setup und Fehlerfälle prüfen | stabiler Prozess |
| Finance/Controlling | Buchungsspur, Bericht und Evidence Pack prüfen | abgestimmter Nachweis |
| Solution Architect | Standardgrenze und Betriebsfolge bewerten | tragfähiges Prozessdesign |

### Benötigte Stammdaten

Debitor `D11000`, Artikel `SP-PUMP-01`, Kreditor `K20000`, Shopify-Shop, Einkaufscode Dropshipping. Diese Daten müssen vor dem Test gepflegt sein, sonst erzeugt der richtige Klick später falsche Posten oder unvollständige Berichte.

### Benötigtes Setup

Shopify-Shop, Kunden-/Artikelmapping, Verkaufseinrichtung, Einkaufscode, USt-Buchungsmatrix, Zahlungsabgleich. Das Setup wird nicht während der Buchung improvisiert, sondern vorab durch Key User und Finance freigegeben.

### Deutsche BC-Seiten mit englischer Suchhilfe

`Shopify-Shops (Shopify Shops)`, `Shopify-Aufträge (Shopify Orders)`, `Verkaufsaufträge (Sales Orders)`, `Einkaufsbestellungen (Purchase Orders)`. Suche die Seiten über `Alt+Q`; wenn der deutsche Begriff nicht gefunden wird, nutze den englischen Klammerbegriff.

### Happy Path mit Rhein-Main-Testdaten

Testfall: Shop-Auftrag `WEB-24001`, Menge `2`, Dropship-Fall mit `K20000`. Der Happy Path ist bestanden, wenn der gebuchte Beleg, die Nebenbuchposten, die Sachposten, der Kontrollbericht und das Evidence Pack übereinstimmen.

### Kontrollbericht

Shop-Abstimmung, Debitorenposten, USt-Posten, Marge, Liefernachweis. Der Kontrollbericht ist die fachliche Gegenprobe zur Buchung. Er beantwortet nicht nur, ob gebucht wurde, sondern ob Menge, Wert, Steuer, Dimension und Zeitraum stimmen.

### Korrekturweg

1. Fehlerbild aus Anwendersicht festhalten.
2. Belegnummer, Datum, Stammdaten und Dimensionen prüfen.
3. Buchungsspur bis zu Nebenbuchposten und Sachposten verfolgen.
4. Entscheiden, ob vor Buchung korrigiert, nach Buchung gutgeschrieben, storniert, ausgeglichen, umgebucht oder per zulässigem Korrekturwerkzeug korrigiert wird.
5. Korrektur mit Beleg, Posten und Bericht dokumentieren.

### Evidence Pack

Shop-ID, Verkaufsauftrag, Zahlungsreferenz, Liefernachweis, verknüpfte Einkaufsbestellung. Das Evidence Pack wird im UAT und später im Betrieb genutzt, damit Fachbereich, Finance und Prüfung dieselbe Spur nachvollziehen können.

### Inland, Ausland, Dropshipping und Steuerlogiken

Steuerlogik in BC entsteht aus Partner, Artikel/Leistung, Land, USt-Registrierung, Lieferweg und Buchungsgruppen. Dieses Kapitel zeigt die wichtigsten Inland-/Ausland- und Dropshipping-Fälle als Bedien- und Denkmodell. Es ersetzt keine Steuerberatung, macht aber die BC-Logik prüfbar.

### Grundmodell der USt-Findung

Business Central nutzt VAT Business Posting Groups und VAT Product Posting Groups, um Steuerberechnung und Steuerposten zu bestimmen. Microsoft Learn beschreibt, dass die Steuer unter anderem davon abhängt, wer kauft oder verkauft und was gekauft oder verkauft wird. [Q23]

| Dimension | Frage | BC-Stammdaten |
|---|---|---|
| Partner | Inland, EU, Drittland, Unternehmer, Privatkunde? | Debitor/Kreditor, Land, USt-ID |
| Gegenstand | Ware, Dienstleistung, Anlage, Charge? | Artikel, Sachkonto, Ressource |
| Bewegung | Lieferung, Leistung, Dropshipment, IC? | Beleg, Ship-to, Location |
| Steuerregel | Inlandsteuer, Reverse Charge, steuerfrei, Export? | VAT Posting Setup |
| Nachweis | Rechnung, Gelangensnachweis, Ausfuhr, USt-ID? | Evidence Pack |

### Fallmatrix Verkauf

| Fall | Beispiel | Typische Steuerlogik | BC-Prüfpunkte |
|---|---|---|---|
| Inland B2B | DE an DE-Unternehmer | deutsche USt | VAT Bus./Prod. Posting Group |
| Inland B2C | DE an Privatkunde | deutsche USt | Preis brutto/netto, Rechnung |
| EU B2B | DE an FR-Unternehmer mit USt-ID | innergemeinschaftliche Lieferung/Reverse-Charge-nahe Meldelogik | USt-ID, ZM, VAT Entries |
| EU B2C | DE an Privatkunde EU | besondere Fernverkaufs-/OSS-Prüfung außerhalb einfacher Standardannahme | Steuerentscheidung dokumentieren |
| Drittland Export | DE an CH/US | Ausfuhrnachweis, steuerfreie Exportlogik möglich | Land, Zoll-/Ausfuhrnachweis |
| Intercompany EU | DE an EU-Konzerngesellschaft | IC-Prozess plus USt-/ZM-Prüfung | IC-Partner, VAT Setup |

Achtung:
- Die BC-Buchungsgruppe ist keine steuerliche Begründung. Sie ist die technische Abbildung einer steuerlich geprüften Entscheidung.

### Fallmatrix Einkauf

| Fall | Beispiel | Typische Steuerlogik | BC-Prüfpunkte |
|---|---|---|---|
| Inland Einkauf | DE kauft bei DE | Vorsteuer | Kreditor, VAT Prod. Posting Group |
| EU-Erwerb | DE kauft Ware aus NL | Erwerbsteuer/Vorsteuer-Logik | Reverse Charge VAT, VAT Entries |
| Drittland Import | DE importiert aus CH/CN | Einfuhrumsatzsteuer/Zoll außerhalb reiner Standardbuchung prüfen | Importbelege, separate Nachweise |
| Dienstleistung EU | Beratung aus AT | Reverse Charge möglich | Leistungsortprüfung |
| Fremdarbeit Ausland | Produktionsleistung Ausland | Steuer- und Zollprüfung | Sachverhalt dokumentieren |

### Dropshipping Inland

Microsoft Learn beschreibt Drop Shipment als Versand direkt vom Lieferanten an den Kunden. In BC wird die Verkaufszeile als Drop Shipment markiert und mit einer Einkaufsbestellung verbunden. [Q73]

Schrittfolge:
1. Tell Me → `Sales Orders`.
2. Verkaufsauftrag für Kunden anlegen.
3. Artikelzeile erfassen.
4. Feld `Drop Shipment` oder `Purchasing Code` sichtbar machen.
5. Zeile als Drop Shipment markieren.
6. Aktion `Create Purchase Orders` oder Requisition/Planning Worksheet nutzen.
7. Lieferant prüfen.
8. Einkaufsbestellung erzeugen.
9. Ship-to auf Kundenadresse prüfen.
10. Nach Liefermeldung Verkaufsauftrag liefern/buchen.
11. Einkaufsseite empfangen und fakturieren.
12. Verkaufsrechnung und Einkaufsrechnung abstimmen.

Inlandsauswirkung:
- Physisch geht Ware nicht durch eigenes Lager.
- BC erzeugt trotzdem eine verknüpfte Einkaufs-/Verkaufslogik.
- Steuerlich muss geklärt sein, wer an wen liefert und welche Rechnungskette vorliegt.

### Dropshipping Ausland

Auslands-Dropshipping ist fachlich riskanter, weil Lieferweg, Rechnungskette, Eigentumsübergang, Lieferland, Steuerregistrierung, Zoll und Nachweise auseinanderfallen können.

Beispiele:

| Fall | Sachverhalt | Risiko |
|---|---|---|
| DE-Kunde, DE-Lieferant | Inland-Dropshipment | relativ einfacher Nachweis |
| DE-Kunde, EU-Lieferant | Ware kommt aus EU nach DE | Erwerb/Lieferlogik prüfen |
| EU-Kunde, DE-Lieferant | Ware geht DE → EU-Kunde | USt-ID und innergemeinschaftliche Lieferung prüfen |
| CH-Kunde, DE-Lieferant | Export | Ausfuhrnachweis/Zoll |
| DE-Kunde, CH-Lieferant | Import nach DE | Einfuhrumsatzsteuer/Zoll/Importeurrolle |
| EU-Kunde, EU-Lieferant, DE-Verkäufer | Reihengeschäftsrisiko | steuerliche Prüfung zwingend |

BC-Best-Practice:
- Für Auslands-Dropshipping wird kein Standardprozess ohne Steuerfreigabe produktiv geschult.
- Jede Variante bekommt ein eigenes TaxScenario mit Debitor, Kreditor, Ship-to, VAT Setup, Nachweis und Testbuchung.
- Wenn Standardfelder und Belege den Nachweis nicht tragen, braucht es Prozessanpassung, Extension oder individuelle Dokumentation.

### Wo endet BC-Standard bei Steuerlogiken?

| Situation | Standard reicht oft | Zusatz nötig |
|---|---|---|
| einfache Inland-USt | ja | sauberes VAT Setup |
| EU-B2B mit USt-ID | oft ja | USt-ID-Prüfung, ZM, Nachweise |
| Drittlandexport | teilweise | Zoll-/Ausfuhrnachweise außerhalb BC |
| OSS/Fernverkauf | projektspezifisch | Steuerberatung, ggf. Extension/Prozess |
| komplexes Reihengeschäft | selten allein | steuerliche Analyse und Spezialprozess |
| Import mit EUSt/Zoll | teilweise | Importbelege, Zollkonten, ggf. Extension |
| globale Tax Engine | nein | externe Steuerlösung/Extension |

### UAT-Steuerfälle

1. DE-Verkauf an DE-Kunde mit `19 %`.
2. DE-Verkauf an EU-Unternehmer mit geprüfter USt-ID.
3. DE-Verkauf an CH-Kunden mit Exportnachweis.
4. Einkauf DE bei DE-Kreditor mit Vorsteuer.
5. Einkauf aus EU mit Reverse-Charge-/Erwerbsteuerlogik.
6. Dropshipping DE-Lieferant an DE-Kunde.
7. Dropshipping EU-Lieferant an DE-Kunde.
8. Dropshipping DE-Lieferant an CH-Kunde.
9. Intercompany-Verkauf zwischen zwei Companies.
10. Fehlerfall: falsche VAT Business Posting Group und Korrektur über Gutschrift/Korrekturbuchung.

Evidence Pack:
- Belegkette Verkauf/Einkauf.
- USt-ID-Prüfung, soweit EU-B2B.
- Liefer-/Ausfuhrnachweis.
- VAT Entries.
- G/L Entries.
- ZM-/UStVA-Abstimmung, soweit relevant.
- Steuerfreigabe bei komplexen Fällen.

Merksatz:
- Bei Ausland und Dropshipping ist die Adresse nicht genug. Entscheidend sind Rechnungskette, Lieferbewegung, Steuerstatus, Nachweis und technische VAT-Einrichtung.

---

### Praxisfall Rhein-Main: Shopify und Dropshipping

### Für absolute Einsteiger: Was du hier gerade tust

Ein Kunde bestellt nicht immer direkt beim Vertrieb. Bei Rhein-Main kauft `D11000` Ersatzteile im Onlineshop. Business Central muss daraus einen verwertbaren Verkaufsauftrag machen. Bei Dropshipping verkauft RM-SALES eine Ware an den Kunden, aber der Lieferant liefert direkt. Der wichtigste Unterschied: Beim Onlineshop kommt der Auftrag aus einem externen Kanal; beim Dropshipping entsteht eine verknüpfte Verkaufs- und Einkaufslogik ohne eigenen Lagerzugang.

### Warum braucht die Rhein-Main Industriegruppe diesen Prozess?

RM-SALES verkauft Ersatzteile wie `SP-PUMP-01` über Shopify und Handelsware per Dropshipping. Ohne sauberen Prozess wären Kundenzuordnung, Artikelmapping, USt, Zahlung, Lieferstatus und Marge nicht zuverlässig. Business Central muss Shop-Auftrag, Verkaufsauftrag, Zahlung, Lieferung, Rechnung, USt-Posten und Evidence Pack zusammenführen. Beim Dropshipping muss zusätzlich die Einkaufsbestellung mit dem Verkaufsauftrag verknüpft sein.

### Konkrete Testdaten

| Fall | Wert |
|---|---|
| Shop-Kunde | `D11000` Handwerk24 Onlinekunde |
| Artikel | `SP-PUMP-01` |
| Menge | `2` |
| Verkaufspreis netto | `320 EUR` je Stück |
| USt | `19 %` |
| Dropshipping-Kreditor | `K20000` Dropship Europe BV |
| Dimension | `CHANNEL = SHOP`, `PRODUCTLINE = SPARE` |

### Schritt-für-Schritt in der deutschen BC-Oberfläche

1. Öffne `Alt+Q`.
2. Suche `Shopify-Shops (Shopify Shops)` und öffne den eingerichteten Shop.
3. Prüfe Kunden-, Artikel- und Steuerzuordnung.
4. Suche `Shopify-Aufträge (Shopify Orders)` oder die synchronisierten `Verkaufsaufträge (Sales Orders)`.
5. Öffne den Auftrag für `D11000`.
6. Prüfe Debitor, Artikel `SP-PUMP-01`, Menge `2`, Preis, USt-Gruppen und Dimension `CHANNEL = SHOP`.
7. Wähle bei lagernder Ware `Buchen` und danach `Liefern und fakturieren`.
8. Öffne `Gebuchte Verkaufsrechnungen (Posted Sales Invoices)`.
9. Prüfe `Debitorenposten`, `Sachposten`, `Artikelposten`, `Wertposten` und `USt-Posten`.
10. Für Dropshipping öffne den Verkaufsauftrag und setze den passenden Einkaufscode für Direktlieferung.
11. Erzeuge oder öffne die verknüpfte `Einkaufsbestellung (Purchase Order)` an `K20000`.
12. Prüfe, dass Verkaufs- und Einkaufsbeleg zusammengehören.
13. Buche Lieferung/Rechnung erst, wenn der Liefernachweis des Lieferanten vorliegt.
14. Dokumentiere Shop-ID, BC-Belegnummer, Zahlungsreferenz, Liefernachweis und Posten im Evidence Pack.

### Buchungsspur

| Ebene | Shopify | Dropshipping |
|---|---|---|
| Ausgang | Shop-Auftrag | Verkaufsauftrag mit Einkaufscode |
| Verkaufsbeleg | Verkaufsauftrag / gebuchte Verkaufsrechnung | Verkaufsauftrag / gebuchte Verkaufsrechnung |
| Einkaufsbeleg | meist keiner | verknüpfte Einkaufsbestellung |
| Debitorenposten | Forderung oder bezahlter Shop-Posten | Forderung gegen Kunden |
| Kreditorenposten | keiner, wenn Lagerware | Verbindlichkeit gegenüber Lieferant |
| Artikelposten | Lagerabgang bei Lagerware | kein eigener Bestand, wenn echte Direktlieferung |
| USt-Posten | USt aus Verkauf | USt je Liefer- und Rechnungskette prüfen |
| Kontrollbericht | Shop-Abstimmung, GuV, USt | Marge, Liefernachweis, USt, IC/Drop-Nachweis |

### Fehlerdiagnose

| Fehler | Symptom | Ursache | Diagnosepfad | Korrektur |
|---|---|---|---|---|
| Artikelmapping falsch | Shop-Auftrag erzeugt falschen Artikel | Shopify-Artikel nicht sauber zugeordnet | Shopify-Auftrag → Artikelkarte → Verkaufszeile | Mapping korrigieren, Auftrag neu synchronisieren oder fachlich korrigieren |
| USt falsch | USt-Posten passt nicht | falsche Kundengruppe oder Lieferlandlogik | Debitor → USt-Buchungsmatrix → USt-Posten | vor Buchung korrigieren, nach Buchung Gutschrift/Neubuchung |
| Dropship-Verknüpfung fehlt | Einkauf und Verkauf laufen getrennt | Einkaufscode nicht gesetzt | Verkaufszeile → Einkaufsbestellung | Belege vor Buchung verknüpfen oder Prozess neu aufsetzen |

Übung:
1. Synchronisiere oder erfasse Shop-Auftrag `WEB-24001` für `D11000`.
2. Prüfe Artikel `SP-PUMP-01`, Menge `2`, Preis und Dimension `CHANNEL = SHOP`.
3. Buche Lieferung und Rechnung.
4. Prüfe Debitorenposten, Sachposten, Artikelposten, Wertposten und USt-Posten.
5. Erfasse zusätzlich einen Dropshipping-Fall mit `K20000` und dokumentiere, warum kein eigener Lagerbestand entsteht.

Lösungsskizze:
- Der Shop-Fall erzeugt einen normalen Verkaufsfluss mit Shop-Referenz.
- Der Dropshipping-Fall braucht eine verknüpfte Einkaufsbestellung.
- Die Kontrolle erfolgt über Verkaufsbeleg, Zahlungsreferenz, Liefernachweis, USt-Posten und Marge.

UAT-Fall:

| Feld | Inhalt |
|---|---|
| ID | `UAT-SHOP-DROP-001` |
| Ziel | Shopify-Auftrag und Dropshipping-Fall abnehmen |
| Rolle | E-Commerce, Vertrieb, Einkauf, Finance |
| Testdaten | `D11000`, `SP-PUMP-01`, Menge `2`, `K20000` für Dropshipping |
| Erwartete Belege | Shop-Auftrag, Verkaufsauftrag, gebuchte Verkaufsrechnung, verknüpfte Einkaufsbestellung bei Dropshipping |
| Erwartete Posten | Debitorenposten, Sachposten, USt-Posten, Artikel-/Wertposten bei Lagerware, Kreditorenposten bei Dropshipping |
| Kontrollbericht | Shop-Abstimmung, Finanzbericht, USt-Posten, Marge |
| Akzeptanzkriterium | Shop-ID, BC-Beleg, Zahlung, Lieferung, USt und Marge sind nachvollziehbar |

### In 5 Minuten merken

* 5 wichtigste Begriffe: Shopify-Auftrag, Artikelmapping, Einkaufscode, Dropshipping, Liefernachweis.
* 5 wichtigste Seiten: `Shopify-Shops`, `Shopify-Aufträge`, `Verkaufsaufträge`, `Einkaufsbestellungen`, `USt-Posten`.
* 3 häufigste Fehler: falsches Mapping, falsche USt, fehlende Dropship-Verknüpfung.
* 3 Prüfungsfallen: Shop-Auftrag ist nicht automatisch geprüft, Dropshipping ist kein normaler Lagerabgang, Zahlungsanbieter ersetzt keinen Debitorenabgleich.
* 1 Praxisregel: Kein Shop- oder Dropshipping-Fall ohne Abgleich von Auftrag, Zahlung, Lieferung, Steuer und Evidence Pack.

---

### Praxisfall Rhein-Main: Intercompany und Ausland

### Für absolute Einsteiger: Was du hier gerade tust

Du bildest eine reale Unternehmenshandlung in Business Central ab: IC-Verkauf, EU-Lieferung oder Drittlandexport nachweisbar abwickeln. Der Bildschirm ist nur der Startpunkt. Entscheidend ist, dass Beleg, gebuchter Beleg, Posten, Bericht und Evidence Pack zusammenpassen.

### Warum braucht die Rhein-Main Industriegruppe diesen Prozess?

Die Rhein-Main Industriegruppe braucht diesen Prozess, weil operative Arbeit sonst nicht zuverlässig in Finance, Lager, Steuer und Reporting ankommt. Der Prozess nutzt `Intercompany-Ausgangstransaktionen`, `USt-Buchungsmatrix Einrichtung`. Beteiligt ist vor allem die Rolle Finance und Vertrieb. Am Ende erwartet die Fachabteilung einen prüfbaren Beleg, passende Posten, einen Kontrollbericht und einen UAT-Nachweis.

### Rollen

| Rolle | Aufgabe | Ergebnis |
|---|---|---|
| Fachbereich | Vorgang fachlich auslösen | korrekter Ausgangsbeleg |
| Key User | Stammdaten und Pflichtfelder prüfen | buchbarer Vorgang |
| Finance/Controlling | Posten und Bericht prüfen | abgestimmtes Ergebnis |

### Schritt-für-Schritt in der deutschen BC-Oberfläche

1. Öffne die Suche mit `Alt+Q`.
2. Suche nach `Intercompany-Ausgangstransaktionen`, `USt-Buchungsmatrix Einrichtung`.
3. Öffne die passende Seite und lege den Vorgang für `RM-M100` an oder filtere darauf.
4. Prüfe Buchungsdatum, Belegdatum, Company, Lagerort, Dimensionen und Buchungsgruppen.
5. Erfasse Menge, Preis, Ressource, Sachkonto oder Projektbezug entsprechend dem Fall.
6. Wähle `Buchungsvorschau (Preview Posting)`, wenn der Vorgang eine Buchung auslöst.
7. Führe die fachliche Aktion aus: freigeben, registrieren, buchen, fakturieren oder ausgleichen.
8. Öffne den gebuchten Beleg oder die entstandenen Postenlisten.
9. Filtere nach Belegnummer, Artikel, Debitor, Kreditor, Projekt oder Anlage.
10. Öffne den Kontrollbericht `USt-Posten`, `Sachposten`, Abstimmung IC-Konto und vergleiche Menge, Wert, Steuer und Dimension.
11. Speichere Belegnummern, Postenfilter und Bericht als Evidence Pack.

### Buchungsspur

| Ebene | Was prüfen? | Wo prüfen? |
|---|---|---|
| Ausgangsbeleg | fachlicher Vorgang und Pflichtfelder | Startseite des Prozesses |
| Gebuchter Beleg | gebuchte Lieferung, Rechnung, Zahlung, Journal oder Projektbuchung | gebuchte Belege/Postenlisten |
| Nebenbuch | Debitor, Kreditor, Artikel, Bank, Anlage oder Projekt | passende Postenliste |
| Sachposten | Hauptbuchwirkung | `Sachposten (G/L Entries)` |
| USt/Wert | Steuer, Lagerwert oder Kostenwirkung | `USt-Posten`, `Wertposten`, Bericht |
| Bericht | fachliche Kontrolle | `USt-Posten`, `Sachposten`, Abstimmung IC-Konto |

### Zahlenbeispiel

Rhein-Main nutzt `RM-M100` mit einem Beispielwert von `10.000 EUR`. Die Buchung muss zeigen, welche Menge bewegt wird, welcher Wert entsteht, welche Dimension mitläuft und welcher Bericht das Ergebnis bestätigt.

### Abweichungen

| Abweichung | Risiko | Kontrolle |
|---|---|---|
| falsche Stammdaten | falsche Konten, Steuer oder Dimension | Stammdatenkarte und Buchungsvorschau |
| falsche Menge oder falscher Wert | Bestand, Marge oder Abschluss stimmt nicht | Postenliste und Kontrollbericht |
| Prozessschritt übersprungen | Belegkette unvollständig | gebuchte Belege und Evidence Pack |

### Fehlerdiagnose

| Fehler | Symptom | Ursache | Diagnosepfad | Korrekturweg | Was man nicht tun darf |
|---|---|---|---|---|---|
| falsche Dimension | Bericht zeigt Wert nicht | Pflichtdimension fehlt oder ist falsch | Beleg → Posten → Dimension | Dimension Correction Tool oder fachliche Korrekturbuchung | Bericht manuell überschreiben |
| falsche Buchungsgruppe | falsches Konto oder falsche USt | Stammdaten falsch gepflegt | Stammdatenkarte → Posting Setup → Sachposten | Stammdaten korrigieren, Beleg fachlich stornieren/neubuchen | gebuchte Posten löschen |
| falscher Status | Beleg kann nicht gebucht werden | Freigabe, Lageraktivität oder Pflichtfeld fehlt | Belegstatus → Fehlermeldung → Einrichtung | Status zurücksetzen, Pflichtfeld ergänzen, Prozessschritt nachholen | Warnungen ignorieren |

### Übung

Führe den Fall für `RM-M100` in der Trainingscompany aus. Dokumentiere Startbeleg, gebuchten Beleg, Posten, Kontrollbericht und eine typische Abweichung.

### Lösungsskizze

1. Öffne `Intercompany-Ausgangstransaktionen`, `USt-Buchungsmatrix Einrichtung` über `Alt+Q`.
2. Erfasse oder filtere den Vorgang für `RM-M100`.
3. Prüfe Datum, Lagerort, Buchungsgruppen und Dimensionen.
4. Nutze `Buchungsvorschau (Preview Posting)`, wenn eine Buchung erfolgt.
5. Buche oder registriere den Vorgang.
6. Prüfe Sachposten, Nebenbuchposten und `USt-Posten`, `Sachposten`, Abstimmung IC-Konto.
7. Dokumentiere das Evidence Pack.

### UAT-Fall

| Feld | Inhalt |
|---|---|
| ID | `UAT-IC-001` |
| Ziel | Intercompany und Ausland fachlich abnehmen |
| Rolle | Finance und Vertrieb |
| Voraussetzung | Stammdaten, Buchungsgruppen, Dimensionen und Berechtigungen sind eingerichtet |
| Testdaten | `RM-M100`, Beispielwert `10.000 EUR` |
| Erwartete Posten | Sachposten und passende Nebenbuchposten |
| Kontrollbericht | `USt-Posten`, `Sachposten`, Abstimmung IC-Konto |
| Negativfall | falsche Dimension oder falsche Buchungsgruppe |
| Akzeptanzkriterium | Beleg, Posten, Bericht und Evidence Pack stimmen überein |

### In 5 Minuten merken

* 5 wichtigste Begriffe: Beleg, gebuchter Beleg, Posten, Dimension, Evidence Pack.
* 5 wichtigste Seiten: `Intercompany-Ausgangstransaktionen`, `USt-Buchungsmatrix Einrichtung`, `Sachposten`, passende Nebenbuchposten, Kontrollbericht, gebuchte Belege.
* 3 häufigste Fehler: falsche Stammdaten, falsche Dimension, übersprungener Prozessschritt.
* 3 Prüfungsfallen: Bildschirm ist nicht Buchung, Beleg ist nicht Posten, Bericht ersetzt keine Abstimmung.
* 1 Praxisregel: Erst Beleg verstehen, dann buchen, dann Posten und Bericht prüfen.


## 18. Intercompany und Ausland [Q29][Q30][Q31]

### Kapitelbox

| Feld | Inhalt |
|---|---|
| Zielgruppe | Einsteiger, Key User, Consultant, Architect |
| Schwierigkeit | Basic bis Advanced |
| Prozessbereich | Intercompany/Ausland |
| Betroffene Companies | RM-PROD, RM-SALES, RM-AT, RM-SHARED |
| MB-800-Relevanz | Ja: Intercompany, EU-B2B, Drittland, Fremdwährung, USt-Nachweise |
| Solution-Architect-Relevanz | Ja: Company-Struktur, IC-Konten, Steuerfallklassifikation, Auslandslieferung |
| Benötigte Vorkenntnisse | Belege, Posten, Stammdaten, Buchungsgruppen, Dimensionen |
| Ergebnis nach dem Kapitel | Leser kann den Prozess mit Rhein-Main-Testdaten ausführen, Posten prüfen, Fehler diagnostizieren und UAT nachweisen |

### Beteiligte Rollen

| Rolle | Aufgabe | Ergebnis |
|---|---|---|
| Fachanwender | Prozess ausführen und Belegdaten prüfen | fachlich korrekter Vorgang |
| Key User | Stammdaten, Setup und Fehlerfälle prüfen | stabiler Prozess |
| Finance/Controlling | Buchungsspur, Bericht und Evidence Pack prüfen | abgestimmter Nachweis |
| Solution Architect | Standardgrenze und Betriebsfolge bewerten | tragfähiges Prozessdesign |

### Benötigte Stammdaten

IC-Partner RM-SALES, Debitor `D20000`, Debitor `D30000`, Artikel `RM-M100`, USt-ID, Liefernachweise. Diese Daten müssen vor dem Test gepflegt sein, sonst erzeugt der richtige Klick später falsche Posten oder unvollständige Berichte.

### Benötigtes Setup

Intercompany-Einrichtung, IC-Partner, USt-Buchungsmatrix, Währungen, Dimensionen, Nummernserien. Das Setup wird nicht während der Buchung improvisiert, sondern vorab durch Key User und Finance freigegeben.

### Deutsche BC-Seiten mit englischer Suchhilfe

`Intercompany-Einrichtung (Intercompany Setup)`, `IC-Ausgangstransaktionen`, `Verkaufsaufträge`, `USt-Posten`. Suche die Seiten über `Alt+Q`; wenn der deutsche Begriff nicht gefunden wird, nutze den englischen Klammerbegriff.

### Happy Path mit Rhein-Main-Testdaten

Testfall: RM-PROD verkauft `RM-M100` an RM-SALES und EU-Fall an `D20000`. Der Happy Path ist bestanden, wenn der gebuchte Beleg, die Nebenbuchposten, die Sachposten, der Kontrollbericht und das Evidence Pack übereinstimmen.

### Kontrollbericht

IC-Abstimmung, Sachposten, USt-Posten, Debitoren-/Kreditorenposten. Der Kontrollbericht ist die fachliche Gegenprobe zur Buchung. Er beantwortet nicht nur, ob gebucht wurde, sondern ob Menge, Wert, Steuer, Dimension und Zeitraum stimmen.

### Korrekturweg

1. Fehlerbild aus Anwendersicht festhalten.
2. Belegnummer, Datum, Stammdaten und Dimensionen prüfen.
3. Buchungsspur bis zu Nebenbuchposten und Sachposten verfolgen.
4. Entscheiden, ob vor Buchung korrigiert, nach Buchung gutgeschrieben, storniert, ausgeglichen, umgebucht oder per zulässigem Korrekturwerkzeug korrigiert wird.
5. Korrektur mit Beleg, Posten und Bericht dokumentieren.

### Evidence Pack

IC-Ausgang/Eingang, Gegenbeleg, USt-ID-Prüfung, Liefer-/Ausfuhrnachweis. Das Evidence Pack wird im UAT und später im Betrieb genutzt, damit Fachbereich, Finance und Prüfung dieselbe Spur nachvollziehen können.

Intercompany und Ausland verbinden mehrere Prozesswelten. Ein Intercompany-Verkauf erzeugt bei einer Company O2C und bei der anderen P2P.

### Intercompany-Fluss

```mermaid
flowchart LR
    A["RM-PROD Sales Order"] --> B["IC Outbox"]
    B --> C["RM-SALES IC Inbox"]
    C --> D["RM-SALES Purchase Order"]
    D --> E["Receipt / Invoice"]
    A --> F["Shipment / Sales Invoice"]
    E --> G["IC Reconciliation"]
```

### Sonderfallmatrix

| Use Case | Prozessbereiche | Mitarbeiter | Hauptrisiko |
|---|---|---|---|
| IC-Verkauf PROD an SALES | O2C + P2P | Vertrieb/Einkauf/Finance | Gegenbeleg fehlt |
| EU-Lieferung nach FR | Sales + VAT | Vertrieb/Steuer | USt-IdNr./ZM |
| Drittland Export CH | Sales + Zoll + VAT | Vertrieb/Finance | Ausfuhrnachweis |
| Import aus CH | Purchase + Zoll + VAT | Einkauf/Finance | EUSt falsch |
| Reihengeschäft | Sales/Purchase/VAT | Tax/Finance | bewegte Lieferung |
| Fremdwährung USD | Sales/Purchase/R2R | Finance | Kursbewertung |
| Konsignationsnähe | Inventory/VAT | Logistik/Tax | Eigentumsübergang |

BC-Best-Practice:
- Jeder Sonderfall bekommt ein `TaxScenario` oder ein gleichwertiges Klassifikationsfeld in der Prozessdokumentation.
- Kein 0 %-Fall ohne Evidence Pack.

Schulungsübung:
- RM-PROD verkauft `RM-M100` an RM-SALES. Erzeuge IC-Belegkette und stimme Forderung/Verbindlichkeit ab.

---

### Praxisfall Rhein-Main: Intercompany und Ausland

### Für absolute Einsteiger: Was du hier gerade tust

Du bildest eine reale Unternehmenshandlung in Business Central ab: IC-Verkauf, EU-Lieferung oder Drittlandexport nachweisbar abwickeln. Der Bildschirm ist nur der Startpunkt. Entscheidend ist, dass Beleg, gebuchter Beleg, Posten, Bericht und Evidence Pack zusammenpassen.

### Warum braucht die Rhein-Main Industriegruppe diesen Prozess?

Die Rhein-Main Industriegruppe braucht diesen Prozess, weil operative Arbeit sonst nicht zuverlässig in Finance, Lager, Steuer und Reporting ankommt. Der Prozess nutzt `Intercompany-Ausgangstransaktionen`, `USt-Buchungsmatrix Einrichtung`. Beteiligt ist vor allem die Rolle Finance und Vertrieb. Am Ende erwartet die Fachabteilung einen prüfbaren Beleg, passende Posten, einen Kontrollbericht und einen UAT-Nachweis.

### Rollen

| Rolle | Aufgabe | Ergebnis |
|---|---|---|
| Fachbereich | Vorgang fachlich auslösen | korrekter Ausgangsbeleg |
| Key User | Stammdaten und Pflichtfelder prüfen | buchbarer Vorgang |
| Finance/Controlling | Posten und Bericht prüfen | abgestimmtes Ergebnis |

### Schritt-für-Schritt in der deutschen BC-Oberfläche

1. Öffne die Suche mit `Alt+Q`.
2. Suche nach `Intercompany-Ausgangstransaktionen`, `USt-Buchungsmatrix Einrichtung`.
3. Öffne die passende Seite und lege den Vorgang für `RM-M100` an oder filtere darauf.
4. Prüfe Buchungsdatum, Belegdatum, Company, Lagerort, Dimensionen und Buchungsgruppen.
5. Erfasse Menge, Preis, Ressource, Sachkonto oder Projektbezug entsprechend dem Fall.
6. Wähle `Buchungsvorschau (Preview Posting)`, wenn der Vorgang eine Buchung auslöst.
7. Führe die fachliche Aktion aus: freigeben, registrieren, buchen, fakturieren oder ausgleichen.
8. Öffne den gebuchten Beleg oder die entstandenen Postenlisten.
9. Filtere nach Belegnummer, Artikel, Debitor, Kreditor, Projekt oder Anlage.
10. Öffne den Kontrollbericht `USt-Posten`, `Sachposten`, Abstimmung IC-Konto und vergleiche Menge, Wert, Steuer und Dimension.
11. Speichere Belegnummern, Postenfilter und Bericht als Evidence Pack.

### Buchungsspur

| Ebene | Was prüfen? | Wo prüfen? |
|---|---|---|
| Ausgangsbeleg | fachlicher Vorgang und Pflichtfelder | Startseite des Prozesses |
| Gebuchter Beleg | gebuchte Lieferung, Rechnung, Zahlung, Journal oder Projektbuchung | gebuchte Belege/Postenlisten |
| Nebenbuch | Debitor, Kreditor, Artikel, Bank, Anlage oder Projekt | passende Postenliste |
| Sachposten | Hauptbuchwirkung | `Sachposten (G/L Entries)` |
| USt/Wert | Steuer, Lagerwert oder Kostenwirkung | `USt-Posten`, `Wertposten`, Bericht |
| Bericht | fachliche Kontrolle | `USt-Posten`, `Sachposten`, Abstimmung IC-Konto |

### Zahlenbeispiel

Rhein-Main nutzt `RM-M100` mit einem Beispielwert von `10.000 EUR`. Die Buchung muss zeigen, welche Menge bewegt wird, welcher Wert entsteht, welche Dimension mitläuft und welcher Bericht das Ergebnis bestätigt.

### Abweichungen

| Abweichung | Risiko | Kontrolle |
|---|---|---|
| falsche Stammdaten | falsche Konten, Steuer oder Dimension | Stammdatenkarte und Buchungsvorschau |
| falsche Menge oder falscher Wert | Bestand, Marge oder Abschluss stimmt nicht | Postenliste und Kontrollbericht |
| Prozessschritt übersprungen | Belegkette unvollständig | gebuchte Belege und Evidence Pack |

### Fehlerdiagnose

| Fehler | Symptom | Ursache | Diagnosepfad | Korrekturweg | Was man nicht tun darf |
|---|---|---|---|---|---|
| falsche Dimension | Bericht zeigt Wert nicht | Pflichtdimension fehlt oder ist falsch | Beleg → Posten → Dimension | Dimension Correction Tool oder fachliche Korrekturbuchung | Bericht manuell überschreiben |
| falsche Buchungsgruppe | falsches Konto oder falsche USt | Stammdaten falsch gepflegt | Stammdatenkarte → Posting Setup → Sachposten | Stammdaten korrigieren, Beleg fachlich stornieren/neubuchen | gebuchte Posten löschen |
| falscher Status | Beleg kann nicht gebucht werden | Freigabe, Lageraktivität oder Pflichtfeld fehlt | Belegstatus → Fehlermeldung → Einrichtung | Status zurücksetzen, Pflichtfeld ergänzen, Prozessschritt nachholen | Warnungen ignorieren |

### Übung

Führe den Fall für `RM-M100` in der Trainingscompany aus. Dokumentiere Startbeleg, gebuchten Beleg, Posten, Kontrollbericht und eine typische Abweichung.

### Lösungsskizze

1. Öffne `Intercompany-Ausgangstransaktionen`, `USt-Buchungsmatrix Einrichtung` über `Alt+Q`.
2. Erfasse oder filtere den Vorgang für `RM-M100`.
3. Prüfe Datum, Lagerort, Buchungsgruppen und Dimensionen.
4. Nutze `Buchungsvorschau (Preview Posting)`, wenn eine Buchung erfolgt.
5. Buche oder registriere den Vorgang.
6. Prüfe Sachposten, Nebenbuchposten und `USt-Posten`, `Sachposten`, Abstimmung IC-Konto.
7. Dokumentiere das Evidence Pack.

### UAT-Fall

| Feld | Inhalt |
|---|---|
| ID | `UAT-IC-001` |
| Ziel | Intercompany und Ausland fachlich abnehmen |
| Rolle | Finance und Vertrieb |
| Voraussetzung | Stammdaten, Buchungsgruppen, Dimensionen und Berechtigungen sind eingerichtet |
| Testdaten | `RM-M100`, Beispielwert `10.000 EUR` |
| Erwartete Posten | Sachposten und passende Nebenbuchposten |
| Kontrollbericht | `USt-Posten`, `Sachposten`, Abstimmung IC-Konto |
| Negativfall | falsche Dimension oder falsche Buchungsgruppe |
| Akzeptanzkriterium | Beleg, Posten, Bericht und Evidence Pack stimmen überein |

### In 5 Minuten merken

* 5 wichtigste Begriffe: Beleg, gebuchter Beleg, Posten, Dimension, Evidence Pack.
* 5 wichtigste Seiten: `Intercompany-Ausgangstransaktionen`, `USt-Buchungsmatrix Einrichtung`, `Sachposten`, passende Nebenbuchposten, Kontrollbericht, gebuchte Belege.
* 3 häufigste Fehler: falsche Stammdaten, falsche Dimension, übersprungener Prozessschritt.
* 3 Prüfungsfallen: Bildschirm ist nicht Buchung, Beleg ist nicht Posten, Bericht ersetzt keine Abstimmung.
* 1 Praxisregel: Erst Beleg verstehen, dann buchen, dann Posten und Bericht prüfen.



## Teil D — Finance, Kontrolle und Abschluss

Teil D zeigt, wie operative Vorgänge in Nebenbüchern, Hauptbuch, Bank, USt, Anlagen, Lagerbewertung, Abschluss und Reporting sichtbar werden.

## 19. Debitoren, Kreditoren und OP-Ausgleich [Q20][Q21][Q22][Q23][Q24][Q28]

### Kapitelbox

| Feld | Inhalt |
|---|---|
| Zielgruppe | Einsteiger, Key User, Consultant, Architect |
| Schwierigkeit | Basic bis Advanced |
| Prozessbereich | Debitoren/Kreditoren/OP |
| Betroffene Companies | RM-SHARED |
| MB-800-Relevanz | Ja: Offene Posten, Ausgleich, Mahnung, Zahlung, Skonto, Teilzahlung |
| Solution-Architect-Relevanz | Ja: OP-Design, Zahlungsbedingungen, Nebenbuchabstimmung |
| Benötigte Vorkenntnisse | Belege, Posten, Stammdaten, Buchungsgruppen, Dimensionen |
| Ergebnis nach dem Kapitel | Leser kann den Prozess mit Rhein-Main-Testdaten ausführen, Posten prüfen, Fehler diagnostizieren und UAT nachweisen |

### Beteiligte Rollen

| Rolle | Aufgabe | Ergebnis |
|---|---|---|
| Fachanwender | Prozess ausführen und Belegdaten prüfen | fachlich korrekter Vorgang |
| Key User | Stammdaten, Setup und Fehlerfälle prüfen | stabiler Prozess |
| Finance/Controlling | Buchungsspur, Bericht und Evidence Pack prüfen | abgestimmter Nachweis |
| Solution Architect | Standardgrenze und Betriebsfolge bewerten | tragfähiges Prozessdesign |

### Benötigte Stammdaten

Debitor `D10000`, Kreditor `K10000`, Rechnungen `SO-1001`, `PO-2001`, Zahlungsbedingungen. Diese Daten müssen vor dem Test gepflegt sein, sonst erzeugt der richtige Klick später falsche Posten oder unvollständige Berichte.

### Benötigtes Setup

Debitoren-/Kreditorenbuchungsgruppen, Zahlungsbedingungen, Mahnmethoden, Skonto, Nummernserien. Das Setup wird nicht während der Buchung improvisiert, sondern vorab durch Key User und Finance freigegeben.

### Deutsche BC-Seiten mit englischer Suchhilfe

`Debitorenposten (Customer Ledger Entries)`, `Kreditorenposten (Vendor Ledger Entries)`, `Ausgleich (Apply Entries)`, `Mahnungen (Reminders)`. Suche die Seiten über `Alt+Q`; wenn der deutsche Begriff nicht gefunden wird, nutze den englischen Klammerbegriff.

### Happy Path mit Rhein-Main-Testdaten

Testfall: Kundenzahlung zu `SO-1001`, Teilzahlung und Skonto. Der Happy Path ist bestanden, wenn der gebuchte Beleg, die Nebenbuchposten, die Sachposten, der Kontrollbericht und das Evidence Pack übereinstimmen.

### Kontrollbericht

OP-Listen, detaillierte Debitoren-/Kreditorenposten, Sachposten. Der Kontrollbericht ist die fachliche Gegenprobe zur Buchung. Er beantwortet nicht nur, ob gebucht wurde, sondern ob Menge, Wert, Steuer, Dimension und Zeitraum stimmen.

### Korrekturweg

1. Fehlerbild aus Anwendersicht festhalten.
2. Belegnummer, Datum, Stammdaten und Dimensionen prüfen.
3. Buchungsspur bis zu Nebenbuchposten und Sachposten verfolgen.
4. Entscheiden, ob vor Buchung korrigiert, nach Buchung gutgeschrieben, storniert, ausgeglichen, umgebucht oder per zulässigem Korrekturwerkzeug korrigiert wird.
5. Korrektur mit Beleg, Posten und Bericht dokumentieren.

### Evidence Pack

Rechnung, Zahlung, Ausgleichseinträge, OP-Auszug, Mahn-/Zahlungsnachweis. Das Evidence Pack wird im UAT und später im Betrieb genutzt, damit Fachbereich, Finance und Prüfung dieselbe Spur nachvollziehen können.

Finance ist die Klammer aller Prozesse. Jeder operative Vorgang muss sich in Hauptbuch, Nebenbuch, Steuer, Bank und Abschluss wiederfinden.

| Feld | Inhalt |
|---|---|
| Zielgruppe | Einsteiger, Buchhaltung, Controller, Key User, Consultant, Architect |
| Schwierigkeit | Basic bis Advanced |
| Prozessbereich | R2R, Finance, Abschluss |
| Betroffene Companies | RM-SHARED, alle operativen Companies |
| MB-800-Relevanz | Ja: Finanzbuchhaltung, Journale, Debitoren, Kreditoren, Anlagen, Bank, USt, Abschluss |
| Solution-Architect-Relevanz | Ja: Kontenplan, Posting Groups, Dimensionen, Abschlussarchitektur, Evidence Pack |
| Benötigte Vorkenntnisse | Belege, Posten, Nebenbücher, Dimensionen |
| Ergebnis nach dem Kapitel | Leser kann operative Buchungen bis zu Sachposten, Nebenbuch, USt und Finanzbericht verfolgen |

### Für absolute Einsteiger: Was du hier gerade tust

Finanzbuchhaltung sammelt nicht einfach Zahlen. Sie übersetzt Geschäftsprozesse in nachvollziehbare Buchungen. Wenn RM-SALES eine Maschine verkauft, entsteht eine Forderung. Wenn RM-PROD Stahl einkauft, entsteht eine Verbindlichkeit und Lagerwert. Wenn RM-SHARED eine Zahlung bucht, wird ein offener Posten ausgeglichen. Business Central verbindet diese Vorgänge über Posten. Deshalb prüft Finance nach dem Buchen immer, ob Beleg, gebuchter Beleg, Nebenbuch, Sachposten, USt-Posten und Bericht zusammenpassen.

### Warum braucht die Rhein-Main Industriegruppe diesen Prozess?

RM-SHARED verantwortet Finance, Bank, USt, Anlagen, Abschluss und Managementauswertungen für die Gruppe. Ohne Record-to-Report-Prozess wären Erlöse, Wareneinsatz, Lagerwert, offene Posten und Steuer nicht belastbar. Business Central liefert dafür `Sachposten (G/L Entries)`, `Debitorenposten (Customer Ledger Entries)`, `Kreditorenposten (Vendor Ledger Entries)`, `USt-Posten (VAT Entries)`, Anlagenposten und Finanzberichte. Das Evidence Pack besteht aus Buchungsjournalen, offenen Posten, Abstimmberichten, USt-Auswertungen, Lagerbewertung, Anlagenübersicht und Abschlussfreigabe.

### Finance-Prozesslandkarte

```mermaid
flowchart TB
    A["Sales / Customer Ledger"] --> G["General Ledger"]
    B["Purchasing / Vendor Ledger"] --> G
    C["Inventory / Value Entries"] --> G
    D["FA Ledger Entries"] --> G
    E["Bank Ledger Entries"] --> G
    F["VAT Entries"] --> G
    G --> H["Financial Reports"]
    H --> I["Period Close"]
```

### Mitarbeiterbedienung

| Rolle | Seite | Tätigkeit |
|---|---|---|
| Debitorenbuchhalterin | `Customer Ledger Entries`, `Reminders` | OP prüfen, Zahlungen ausgleichen, mahnen |
| Kreditorenbuchhalter | `Vendor Ledger Entries`, `Payment Journals` | Rechnungen prüfen, Zahlungslauf |
| Anlagenbuchhalterin | `Fixed Assets`, `FA Journals` | Zugang, AfA, Abgang |
| Buchhalter | `General Journals` | Abgrenzungen, Umbuchungen, Rückstellungen |
| Steuerverantwortliche | `VAT Entries`, `VAT Statements`, VAT Reports | USt-Abstimmung |
| Finance-Leitung | `Financial Reports`, `Accounting Periods` | Abschluss und Periodensperre |

### Abweichungen

| Use Case | BC-Mechanik | Evidence |
|---|---|---|
| Teilzahlung | Apply Entries teilweise | Restposten |
| Skonto | Payment Discount | Steuerkorrektur prüfen |
| Bankdifferenz | Payment Reconciliation Journal | Klärposten |
| Anlagenabgang | FA Disposal | Buchwert/Erlös |
| Abgrenzung | Deferrals / General Journal | Abgrenzungsplan |
| USt-Korrektur | Credit Memo / VAT Entry | Bezug zur Rechnung |

Deutsche Pflicht/Compliance:
- Steuerlich relevante Unterlagen müssen nach § 147 AO aufbewahrt werden. [Q21]
- GoBD konkretisiert Anforderungen an Nachvollziehbarkeit, Unveränderbarkeit und Datenzugriff. [Q22]
- USt-relevante Prozesse müssen mit UStG und Meldelogik abgestimmt sein. [Q20][Q24]

Schulungsübung:
- Importiere einen Bankauszug mit drei Zeilen: Vollzahlung, Teilzahlung, unbekannte Zahlung. Gleiche zwei Posten aus und buche den dritten auf Klärung.

---

### OP-Ausgleich als Lernfall

Offene Posten sind Forderungen oder Verbindlichkeiten, die noch nicht durch Zahlung, Gutschrift oder Ausgleich erledigt sind. RM-SHARED prüft täglich `Debitorenposten (Customer Ledger Entries)` und `Kreditorenposten (Vendor Ledger Entries)`. Eine Zahlung wird nicht nur auf dem Bankkonto gebucht, sondern mit dem offenen Posten verknüpft.

### Praxisfall Rhein-Main: Bank, Payments und OP-Ausgleich

### Für absolute Einsteiger: Was du hier gerade tust

Du bildest eine reale Unternehmenshandlung in Business Central ab: Zahlung importieren, offenen Posten ausgleichen und Bank abstimmen. Der Bildschirm ist nur der Startpunkt. Entscheidend ist, dass Beleg, gebuchter Beleg, Posten, Bericht und Evidence Pack zusammenpassen.

### Warum braucht die Rhein-Main Industriegruppe diesen Prozess?

Die Rhein-Main Industriegruppe braucht diesen Prozess, weil operative Arbeit sonst nicht zuverlässig in Finance, Lager, Steuer und Reporting ankommt. Der Prozess nutzt `Zahlungs Buch.-Blätter (Payment Journals)`, `Zahlungsabstimmungs Buch.-Blatt (Payment Reconciliation Journal)`. Beteiligt ist vor allem die Rolle Debitoren- und Kreditorenbuchhaltung. Am Ende erwartet die Fachabteilung einen prüfbaren Beleg, passende Posten, einen Kontrollbericht und einen UAT-Nachweis.

### Rollen

| Rolle | Aufgabe | Ergebnis |
|---|---|---|
| Fachbereich | Vorgang fachlich auslösen | korrekter Ausgangsbeleg |
| Key User | Stammdaten und Pflichtfelder prüfen | buchbarer Vorgang |
| Finance/Controlling | Posten und Bericht prüfen | abgestimmtes Ergebnis |

### Schritt-für-Schritt in der deutschen BC-Oberfläche

1. Öffne die Suche mit `Alt+Q`.
2. Suche nach `Zahlungs Buch.-Blätter (Payment Journals)`, `Zahlungsabstimmungs Buch.-Blatt (Payment Reconciliation Journal)`.
3. Öffne die passende Seite und lege den Vorgang für `D10000` und Rechnung `SO-1001` an oder filtere darauf.
4. Prüfe Buchungsdatum, Belegdatum, Company, Lagerort, Dimensionen und Buchungsgruppen.
5. Erfasse Menge, Preis, Ressource, Sachkonto oder Projektbezug entsprechend dem Fall.
6. Wähle `Buchungsvorschau (Preview Posting)`, wenn der Vorgang eine Buchung auslöst.
7. Führe die fachliche Aktion aus: freigeben, registrieren, buchen, fakturieren oder ausgleichen.
8. Öffne den gebuchten Beleg oder die entstandenen Postenlisten.
9. Filtere nach Belegnummer, Artikel, Debitor, Kreditor, Projekt oder Anlage.
10. Öffne den Kontrollbericht `Debitorenposten`, `Kreditorenposten`, `Bankkontoposten` und vergleiche Menge, Wert, Steuer und Dimension.
11. Speichere Belegnummern, Postenfilter und Bericht als Evidence Pack.

### Buchungsspur

| Ebene | Was prüfen? | Wo prüfen? |
|---|---|---|
| Ausgangsbeleg | fachlicher Vorgang und Pflichtfelder | Startseite des Prozesses |
| Gebuchter Beleg | gebuchte Lieferung, Rechnung, Zahlung, Journal oder Projektbuchung | gebuchte Belege/Postenlisten |
| Nebenbuch | Debitor, Kreditor, Artikel, Bank, Anlage oder Projekt | passende Postenliste |
| Sachposten | Hauptbuchwirkung | `Sachposten (G/L Entries)` |
| USt/Wert | Steuer, Lagerwert oder Kostenwirkung | `USt-Posten`, `Wertposten`, Bericht |
| Bericht | fachliche Kontrolle | `Debitorenposten`, `Kreditorenposten`, `Bankkontoposten` |

### Zahlenbeispiel

Rhein-Main nutzt `D10000` und Rechnung `SO-1001` mit einem Beispielwert von `10.000 EUR`. Die Buchung muss zeigen, welche Menge bewegt wird, welcher Wert entsteht, welche Dimension mitläuft und welcher Bericht das Ergebnis bestätigt.

### Abweichungen

| Abweichung | Risiko | Kontrolle |
|---|---|---|
| falsche Stammdaten | falsche Konten, Steuer oder Dimension | Stammdatenkarte und Buchungsvorschau |
| falsche Menge oder falscher Wert | Bestand, Marge oder Abschluss stimmt nicht | Postenliste und Kontrollbericht |
| Prozessschritt übersprungen | Belegkette unvollständig | gebuchte Belege und Evidence Pack |

### Fehlerdiagnose

| Fehler | Symptom | Ursache | Diagnosepfad | Korrekturweg | Was man nicht tun darf |
|---|---|---|---|---|---|
| falsche Dimension | Bericht zeigt Wert nicht | Pflichtdimension fehlt oder ist falsch | Beleg → Posten → Dimension | Dimension Correction Tool oder fachliche Korrekturbuchung | Bericht manuell überschreiben |
| falsche Buchungsgruppe | falsches Konto oder falsche USt | Stammdaten falsch gepflegt | Stammdatenkarte → Posting Setup → Sachposten | Stammdaten korrigieren, Beleg fachlich stornieren/neubuchen | gebuchte Posten löschen |
| falscher Status | Beleg kann nicht gebucht werden | Freigabe, Lageraktivität oder Pflichtfeld fehlt | Belegstatus → Fehlermeldung → Einrichtung | Status zurücksetzen, Pflichtfeld ergänzen, Prozessschritt nachholen | Warnungen ignorieren |

### Übung

Führe den Fall für `D10000` und Rechnung `SO-1001` in der Trainingscompany aus. Dokumentiere Startbeleg, gebuchten Beleg, Posten, Kontrollbericht und eine typische Abweichung.

### Lösungsskizze

1. Öffne `Zahlungs Buch.-Blätter (Payment Journals)`, `Zahlungsabstimmungs Buch.-Blatt (Payment Reconciliation Journal)` über `Alt+Q`.
2. Erfasse oder filtere den Vorgang für `D10000` und Rechnung `SO-1001`.
3. Prüfe Datum, Lagerort, Buchungsgruppen und Dimensionen.
4. Nutze `Buchungsvorschau (Preview Posting)`, wenn eine Buchung erfolgt.
5. Buche oder registriere den Vorgang.
6. Prüfe Sachposten, Nebenbuchposten und `Debitorenposten`, `Kreditorenposten`, `Bankkontoposten`.
7. Dokumentiere das Evidence Pack.

### UAT-Fall

| Feld | Inhalt |
|---|---|
| ID | `UAT-BANK-001` |
| Ziel | Bank, Payments und OP-Ausgleich fachlich abnehmen |
| Rolle | Debitoren- und Kreditorenbuchhaltung |
| Voraussetzung | Stammdaten, Buchungsgruppen, Dimensionen und Berechtigungen sind eingerichtet |
| Testdaten | `D10000` und Rechnung `SO-1001`, Beispielwert `10.000 EUR` |
| Erwartete Posten | Sachposten und passende Nebenbuchposten |
| Kontrollbericht | `Debitorenposten`, `Kreditorenposten`, `Bankkontoposten` |
| Negativfall | falsche Dimension oder falsche Buchungsgruppe |
| Akzeptanzkriterium | Beleg, Posten, Bericht und Evidence Pack stimmen überein |

### In 5 Minuten merken

* 5 wichtigste Begriffe: Beleg, gebuchter Beleg, Posten, Dimension, Evidence Pack.
* 5 wichtigste Seiten: `Zahlungs Buch.-Blätter (Payment Journals)`, `Zahlungsabstimmungs Buch.-Blatt (Payment Reconciliation Journal)`, `Sachposten`, passende Nebenbuchposten, Kontrollbericht, gebuchte Belege.
* 3 häufigste Fehler: falsche Stammdaten, falsche Dimension, übersprungener Prozessschritt.
* 3 Prüfungsfallen: Bildschirm ist nicht Buchung, Beleg ist nicht Posten, Bericht ersetzt keine Abstimmung.
* 1 Praxisregel: Erst Beleg verstehen, dann buchen, dann Posten und Bericht prüfen.


## 20. Bank, Payments und Bankabstimmung

### Kapitelbox

| Feld | Inhalt |
|---|---|
| Zielgruppe | Einsteiger, Key User, Consultant, Architect |
| Schwierigkeit | Basic bis Advanced |
| Prozessbereich | Bank/Payments |
| Betroffene Companies | RM-SHARED |
| MB-800-Relevanz | Ja: Zahlungsjournal, Zahlungseingang, Bankabstimmung, unbekannte Zahlung |
| Solution-Architect-Relevanz | Ja: Bankintegration, Klärposten, Vier-Augen-Prinzip |
| Benötigte Vorkenntnisse | Belege, Posten, Stammdaten, Buchungsgruppen, Dimensionen |
| Ergebnis nach dem Kapitel | Leser kann den Prozess mit Rhein-Main-Testdaten ausführen, Posten prüfen, Fehler diagnostizieren und UAT nachweisen |

### Beteiligte Rollen

| Rolle | Aufgabe | Ergebnis |
|---|---|---|
| Fachanwender | Prozess ausführen und Belegdaten prüfen | fachlich korrekter Vorgang |
| Key User | Stammdaten, Setup und Fehlerfälle prüfen | stabiler Prozess |
| Finance/Controlling | Buchungsspur, Bericht und Evidence Pack prüfen | abgestimmter Nachweis |
| Solution Architect | Standardgrenze und Betriebsfolge bewerten | tragfähiges Prozessdesign |

### Benötigte Stammdaten

Bankkonto Hausbank, Debitor `D10000`, Kreditor `K10000`, Kontoauszugszeilen. Diese Daten müssen vor dem Test gepflegt sein, sonst erzeugt der richtige Klick später falsche Posten oder unvollständige Berichte.

### Benötigtes Setup

Bankkonten, Bankkontobuchungsgruppen, Zahlungsarten, Zahlungsjournale, Bankabstimmung. Das Setup wird nicht während der Buchung improvisiert, sondern vorab durch Key User und Finance freigegeben.

### Deutsche BC-Seiten mit englischer Suchhilfe

`Zahlungs Buch.-Blätter (Payment Journals)`, `Zahlungsabstimmungs Buch.-Blatt (Payment Reconciliation Journal)`, `Bankkontoabstimmung (Bank Account Reconciliation)`. Suche die Seiten über `Alt+Q`; wenn der deutsche Begriff nicht gefunden wird, nutze den englischen Klammerbegriff.

### Happy Path mit Rhein-Main-Testdaten

Testfall: Vollzahlung, Teilzahlung, unbekannte Zahlung. Der Happy Path ist bestanden, wenn der gebuchte Beleg, die Nebenbuchposten, die Sachposten, der Kontrollbericht und das Evidence Pack übereinstimmen.

### Kontrollbericht

Bankkontoposten, Sachposten, OP-Ausgleich, Bankabstimmungsbericht. Der Kontrollbericht ist die fachliche Gegenprobe zur Buchung. Er beantwortet nicht nur, ob gebucht wurde, sondern ob Menge, Wert, Steuer, Dimension und Zeitraum stimmen.

### Korrekturweg

1. Fehlerbild aus Anwendersicht festhalten.
2. Belegnummer, Datum, Stammdaten und Dimensionen prüfen.
3. Buchungsspur bis zu Nebenbuchposten und Sachposten verfolgen.
4. Entscheiden, ob vor Buchung korrigiert, nach Buchung gutgeschrieben, storniert, ausgeglichen, umgebucht oder per zulässigem Korrekturwerkzeug korrigiert wird.
5. Korrektur mit Beleg, Posten und Bericht dokumentieren.

### Evidence Pack

Kontoauszug, Zahlungsjournal, Ausgleich, Bankabstimmung, Klärpostenliste. Das Evidence Pack wird im UAT und später im Betrieb genutzt, damit Fachbereich, Finance und Prüfung dieselbe Spur nachvollziehen können.

### Praxisfall Rhein-Main: Bank, Payments und OP-Ausgleich

### Für absolute Einsteiger: Was du hier gerade tust

Du bildest eine reale Unternehmenshandlung in Business Central ab: Zahlung importieren, offenen Posten ausgleichen und Bank abstimmen. Der Bildschirm ist nur der Startpunkt. Entscheidend ist, dass Beleg, gebuchter Beleg, Posten, Bericht und Evidence Pack zusammenpassen.

### Warum braucht die Rhein-Main Industriegruppe diesen Prozess?

Die Rhein-Main Industriegruppe braucht diesen Prozess, weil operative Arbeit sonst nicht zuverlässig in Finance, Lager, Steuer und Reporting ankommt. Der Prozess nutzt `Zahlungs Buch.-Blätter (Payment Journals)`, `Zahlungsabstimmungs Buch.-Blatt (Payment Reconciliation Journal)`. Beteiligt ist vor allem die Rolle Debitoren- und Kreditorenbuchhaltung. Am Ende erwartet die Fachabteilung einen prüfbaren Beleg, passende Posten, einen Kontrollbericht und einen UAT-Nachweis.

### Rollen

| Rolle | Aufgabe | Ergebnis |
|---|---|---|
| Fachbereich | Vorgang fachlich auslösen | korrekter Ausgangsbeleg |
| Key User | Stammdaten und Pflichtfelder prüfen | buchbarer Vorgang |
| Finance/Controlling | Posten und Bericht prüfen | abgestimmtes Ergebnis |

### Schritt-für-Schritt in der deutschen BC-Oberfläche

1. Öffne die Suche mit `Alt+Q`.
2. Suche nach `Zahlungs Buch.-Blätter (Payment Journals)`, `Zahlungsabstimmungs Buch.-Blatt (Payment Reconciliation Journal)`.
3. Öffne die passende Seite und lege den Vorgang für `D10000` und Rechnung `SO-1001` an oder filtere darauf.
4. Prüfe Buchungsdatum, Belegdatum, Company, Lagerort, Dimensionen und Buchungsgruppen.
5. Erfasse Menge, Preis, Ressource, Sachkonto oder Projektbezug entsprechend dem Fall.
6. Wähle `Buchungsvorschau (Preview Posting)`, wenn der Vorgang eine Buchung auslöst.
7. Führe die fachliche Aktion aus: freigeben, registrieren, buchen, fakturieren oder ausgleichen.
8. Öffne den gebuchten Beleg oder die entstandenen Postenlisten.
9. Filtere nach Belegnummer, Artikel, Debitor, Kreditor, Projekt oder Anlage.
10. Öffne den Kontrollbericht `Debitorenposten`, `Kreditorenposten`, `Bankkontoposten` und vergleiche Menge, Wert, Steuer und Dimension.
11. Speichere Belegnummern, Postenfilter und Bericht als Evidence Pack.

### Buchungsspur

| Ebene | Was prüfen? | Wo prüfen? |
|---|---|---|
| Ausgangsbeleg | fachlicher Vorgang und Pflichtfelder | Startseite des Prozesses |
| Gebuchter Beleg | gebuchte Lieferung, Rechnung, Zahlung, Journal oder Projektbuchung | gebuchte Belege/Postenlisten |
| Nebenbuch | Debitor, Kreditor, Artikel, Bank, Anlage oder Projekt | passende Postenliste |
| Sachposten | Hauptbuchwirkung | `Sachposten (G/L Entries)` |
| USt/Wert | Steuer, Lagerwert oder Kostenwirkung | `USt-Posten`, `Wertposten`, Bericht |
| Bericht | fachliche Kontrolle | `Debitorenposten`, `Kreditorenposten`, `Bankkontoposten` |

### Zahlenbeispiel

Rhein-Main nutzt `D10000` und Rechnung `SO-1001` mit einem Beispielwert von `10.000 EUR`. Die Buchung muss zeigen, welche Menge bewegt wird, welcher Wert entsteht, welche Dimension mitläuft und welcher Bericht das Ergebnis bestätigt.

### Abweichungen

| Abweichung | Risiko | Kontrolle |
|---|---|---|
| falsche Stammdaten | falsche Konten, Steuer oder Dimension | Stammdatenkarte und Buchungsvorschau |
| falsche Menge oder falscher Wert | Bestand, Marge oder Abschluss stimmt nicht | Postenliste und Kontrollbericht |
| Prozessschritt übersprungen | Belegkette unvollständig | gebuchte Belege und Evidence Pack |

### Fehlerdiagnose

| Fehler | Symptom | Ursache | Diagnosepfad | Korrekturweg | Was man nicht tun darf |
|---|---|---|---|---|---|
| falsche Dimension | Bericht zeigt Wert nicht | Pflichtdimension fehlt oder ist falsch | Beleg → Posten → Dimension | Dimension Correction Tool oder fachliche Korrekturbuchung | Bericht manuell überschreiben |
| falsche Buchungsgruppe | falsches Konto oder falsche USt | Stammdaten falsch gepflegt | Stammdatenkarte → Posting Setup → Sachposten | Stammdaten korrigieren, Beleg fachlich stornieren/neubuchen | gebuchte Posten löschen |
| falscher Status | Beleg kann nicht gebucht werden | Freigabe, Lageraktivität oder Pflichtfeld fehlt | Belegstatus → Fehlermeldung → Einrichtung | Status zurücksetzen, Pflichtfeld ergänzen, Prozessschritt nachholen | Warnungen ignorieren |

### Übung

Führe den Fall für `D10000` und Rechnung `SO-1001` in der Trainingscompany aus. Dokumentiere Startbeleg, gebuchten Beleg, Posten, Kontrollbericht und eine typische Abweichung.

### Lösungsskizze

1. Öffne `Zahlungs Buch.-Blätter (Payment Journals)`, `Zahlungsabstimmungs Buch.-Blatt (Payment Reconciliation Journal)` über `Alt+Q`.
2. Erfasse oder filtere den Vorgang für `D10000` und Rechnung `SO-1001`.
3. Prüfe Datum, Lagerort, Buchungsgruppen und Dimensionen.
4. Nutze `Buchungsvorschau (Preview Posting)`, wenn eine Buchung erfolgt.
5. Buche oder registriere den Vorgang.
6. Prüfe Sachposten, Nebenbuchposten und `Debitorenposten`, `Kreditorenposten`, `Bankkontoposten`.
7. Dokumentiere das Evidence Pack.

### UAT-Fall

| Feld | Inhalt |
|---|---|
| ID | `UAT-BANK-001` |
| Ziel | Bank, Payments und OP-Ausgleich fachlich abnehmen |
| Rolle | Debitoren- und Kreditorenbuchhaltung |
| Voraussetzung | Stammdaten, Buchungsgruppen, Dimensionen und Berechtigungen sind eingerichtet |
| Testdaten | `D10000` und Rechnung `SO-1001`, Beispielwert `10.000 EUR` |
| Erwartete Posten | Sachposten und passende Nebenbuchposten |
| Kontrollbericht | `Debitorenposten`, `Kreditorenposten`, `Bankkontoposten` |
| Negativfall | falsche Dimension oder falsche Buchungsgruppe |
| Akzeptanzkriterium | Beleg, Posten, Bericht und Evidence Pack stimmen überein |

### In 5 Minuten merken

* 5 wichtigste Begriffe: Beleg, gebuchter Beleg, Posten, Dimension, Evidence Pack.
* 5 wichtigste Seiten: `Zahlungs Buch.-Blätter (Payment Journals)`, `Zahlungsabstimmungs Buch.-Blatt (Payment Reconciliation Journal)`, `Sachposten`, passende Nebenbuchposten, Kontrollbericht, gebuchte Belege.
* 3 häufigste Fehler: falsche Stammdaten, falsche Dimension, übersprungener Prozessschritt.
* 3 Prüfungsfallen: Bildschirm ist nicht Buchung, Beleg ist nicht Posten, Bericht ersetzt keine Abstimmung.
* 1 Praxisregel: Erst Beleg verstehen, dann buchen, dann Posten und Bericht prüfen.


## 21. Fixed Assets

### Kapitelbox

| Feld | Inhalt |
|---|---|
| Zielgruppe | Einsteiger, Key User, Consultant, Architect |
| Schwierigkeit | Basic bis Advanced |
| Prozessbereich | Fixed Assets |
| Betroffene Companies | RM-SHARED, RM-PROD |
| MB-800-Relevanz | Ja: Anlage, Zugang, Aktivierung, AfA, Abgang |
| Solution-Architect-Relevanz | Ja: AfA-Bücher, Anlagenklassen, Komponenten, Monatsabschluss |
| Benötigte Vorkenntnisse | Belege, Posten, Stammdaten, Buchungsgruppen, Dimensionen |
| Ergebnis nach dem Kapitel | Leser kann den Prozess mit Rhein-Main-Testdaten ausführen, Posten prüfen, Fehler diagnostizieren und UAT nachweisen |

### Beteiligte Rollen

| Rolle | Aufgabe | Ergebnis |
|---|---|---|
| Fachanwender | Prozess ausführen und Belegdaten prüfen | fachlich korrekter Vorgang |
| Key User | Stammdaten, Setup und Fehlerfälle prüfen | stabiler Prozess |
| Finance/Controlling | Buchungsspur, Bericht und Evidence Pack prüfen | abgestimmter Nachweis |
| Solution Architect | Standardgrenze und Betriebsfolge bewerten | tragfähiges Prozessdesign |

### Benötigte Stammdaten

Anlage `FA-CNC-01`, Kreditor `K30000`, Anschaffung `250.000 EUR`, AfA-Buch. Diese Daten müssen vor dem Test gepflegt sein, sonst erzeugt der richtige Klick später falsche Posten oder unvollständige Berichte.

### Benötigtes Setup

Anlageneinrichtung, AfA-Bücher, Anlagenbuchungsgruppen, Anlagenklassen, Nummernserien. Das Setup wird nicht während der Buchung improvisiert, sondern vorab durch Key User und Finance freigegeben.

### Deutsche BC-Seiten mit englischer Suchhilfe

`Anlagen (Fixed Assets)`, `Anlagen Buch.-Blätter (FA Journals)`, `AfA berechnen (Calculate Depreciation)`, `Anlagenposten (FA Ledger Entries)`. Suche die Seiten über `Alt+Q`; wenn der deutsche Begriff nicht gefunden wird, nutze den englischen Klammerbegriff.

### Happy Path mit Rhein-Main-Testdaten

Testfall: CNC-Anlage kaufen, aktivieren, Monats-AfA buchen. Der Happy Path ist bestanden, wenn der gebuchte Beleg, die Nebenbuchposten, die Sachposten, der Kontrollbericht und das Evidence Pack übereinstimmen.

### Kontrollbericht

Anlagenposten, Sachposten, Anlagenbuchwert, AfA-Bericht. Der Kontrollbericht ist die fachliche Gegenprobe zur Buchung. Er beantwortet nicht nur, ob gebucht wurde, sondern ob Menge, Wert, Steuer, Dimension und Zeitraum stimmen.

### Korrekturweg

1. Fehlerbild aus Anwendersicht festhalten.
2. Belegnummer, Datum, Stammdaten und Dimensionen prüfen.
3. Buchungsspur bis zu Nebenbuchposten und Sachposten verfolgen.
4. Entscheiden, ob vor Buchung korrigiert, nach Buchung gutgeschrieben, storniert, ausgeglichen, umgebucht oder per zulässigem Korrekturwerkzeug korrigiert wird.
5. Korrektur mit Beleg, Posten und Bericht dokumentieren.

### Evidence Pack

Eingangsrechnung, Anlagenkarte, Anlagenposten, AfA-Lauf, Sachposten. Das Evidence Pack wird im UAT und später im Betrieb genutzt, damit Fachbereich, Finance und Prüfung dieselbe Spur nachvollziehen können.

### Praxisfall Rhein-Main: Fixed Assets

### Für absolute Einsteiger: Was du hier gerade tust

Du bildest eine reale Unternehmenshandlung in Business Central ab: Anlage kaufen, aktivieren, abschreiben und im Abschluss prüfen. Der Bildschirm ist nur der Startpunkt. Entscheidend ist, dass Beleg, gebuchter Beleg, Posten, Bericht und Evidence Pack zusammenpassen.

### Warum braucht die Rhein-Main Industriegruppe diesen Prozess?

Die Rhein-Main Industriegruppe braucht diesen Prozess, weil operative Arbeit sonst nicht zuverlässig in Finance, Lager, Steuer und Reporting ankommt. Der Prozess nutzt `Anlagen (Fixed Assets)`, `Anlagen Buch.-Blätter (FA Journals)`. Beteiligt ist vor allem die Rolle Anlagenbuchhalterin. Am Ende erwartet die Fachabteilung einen prüfbaren Beleg, passende Posten, einen Kontrollbericht und einen UAT-Nachweis.

### Rollen

| Rolle | Aufgabe | Ergebnis |
|---|---|---|
| Fachbereich | Vorgang fachlich auslösen | korrekter Ausgangsbeleg |
| Key User | Stammdaten und Pflichtfelder prüfen | buchbarer Vorgang |
| Finance/Controlling | Posten und Bericht prüfen | abgestimmtes Ergebnis |

### Schritt-für-Schritt in der deutschen BC-Oberfläche

1. Öffne die Suche mit `Alt+Q`.
2. Suche nach `Anlagen (Fixed Assets)`, `Anlagen Buch.-Blätter (FA Journals)`.
3. Öffne die passende Seite und lege den Vorgang für `FA-CNC-01` an oder filtere darauf.
4. Prüfe Buchungsdatum, Belegdatum, Company, Lagerort, Dimensionen und Buchungsgruppen.
5. Erfasse Menge, Preis, Ressource, Sachkonto oder Projektbezug entsprechend dem Fall.
6. Wähle `Buchungsvorschau (Preview Posting)`, wenn der Vorgang eine Buchung auslöst.
7. Führe die fachliche Aktion aus: freigeben, registrieren, buchen, fakturieren oder ausgleichen.
8. Öffne den gebuchten Beleg oder die entstandenen Postenlisten.
9. Filtere nach Belegnummer, Artikel, Debitor, Kreditor, Projekt oder Anlage.
10. Öffne den Kontrollbericht `Anlagenposten (FA Ledger Entries)` und Anlagenbuchwert und vergleiche Menge, Wert, Steuer und Dimension.
11. Speichere Belegnummern, Postenfilter und Bericht als Evidence Pack.

### Buchungsspur

| Ebene | Was prüfen? | Wo prüfen? |
|---|---|---|
| Ausgangsbeleg | fachlicher Vorgang und Pflichtfelder | Startseite des Prozesses |
| Gebuchter Beleg | gebuchte Lieferung, Rechnung, Zahlung, Journal oder Projektbuchung | gebuchte Belege/Postenlisten |
| Nebenbuch | Debitor, Kreditor, Artikel, Bank, Anlage oder Projekt | passende Postenliste |
| Sachposten | Hauptbuchwirkung | `Sachposten (G/L Entries)` |
| USt/Wert | Steuer, Lagerwert oder Kostenwirkung | `USt-Posten`, `Wertposten`, Bericht |
| Bericht | fachliche Kontrolle | `Anlagenposten (FA Ledger Entries)` und Anlagenbuchwert |

### Zahlenbeispiel

Rhein-Main nutzt `FA-CNC-01` mit einem Beispielwert von `10.000 EUR`. Die Buchung muss zeigen, welche Menge bewegt wird, welcher Wert entsteht, welche Dimension mitläuft und welcher Bericht das Ergebnis bestätigt.

### Abweichungen

| Abweichung | Risiko | Kontrolle |
|---|---|---|
| falsche Stammdaten | falsche Konten, Steuer oder Dimension | Stammdatenkarte und Buchungsvorschau |
| falsche Menge oder falscher Wert | Bestand, Marge oder Abschluss stimmt nicht | Postenliste und Kontrollbericht |
| Prozessschritt übersprungen | Belegkette unvollständig | gebuchte Belege und Evidence Pack |

### Fehlerdiagnose

| Fehler | Symptom | Ursache | Diagnosepfad | Korrekturweg | Was man nicht tun darf |
|---|---|---|---|---|---|
| falsche Dimension | Bericht zeigt Wert nicht | Pflichtdimension fehlt oder ist falsch | Beleg → Posten → Dimension | Dimension Correction Tool oder fachliche Korrekturbuchung | Bericht manuell überschreiben |
| falsche Buchungsgruppe | falsches Konto oder falsche USt | Stammdaten falsch gepflegt | Stammdatenkarte → Posting Setup → Sachposten | Stammdaten korrigieren, Beleg fachlich stornieren/neubuchen | gebuchte Posten löschen |
| falscher Status | Beleg kann nicht gebucht werden | Freigabe, Lageraktivität oder Pflichtfeld fehlt | Belegstatus → Fehlermeldung → Einrichtung | Status zurücksetzen, Pflichtfeld ergänzen, Prozessschritt nachholen | Warnungen ignorieren |

### Übung

Führe den Fall für `FA-CNC-01` in der Trainingscompany aus. Dokumentiere Startbeleg, gebuchten Beleg, Posten, Kontrollbericht und eine typische Abweichung.

### Lösungsskizze

1. Öffne `Anlagen (Fixed Assets)`, `Anlagen Buch.-Blätter (FA Journals)` über `Alt+Q`.
2. Erfasse oder filtere den Vorgang für `FA-CNC-01`.
3. Prüfe Datum, Lagerort, Buchungsgruppen und Dimensionen.
4. Nutze `Buchungsvorschau (Preview Posting)`, wenn eine Buchung erfolgt.
5. Buche oder registriere den Vorgang.
6. Prüfe Sachposten, Nebenbuchposten und `Anlagenposten (FA Ledger Entries)` und Anlagenbuchwert.
7. Dokumentiere das Evidence Pack.

### UAT-Fall

| Feld | Inhalt |
|---|---|
| ID | `UAT-FA-001` |
| Ziel | Fixed Assets fachlich abnehmen |
| Rolle | Anlagenbuchhalterin |
| Voraussetzung | Stammdaten, Buchungsgruppen, Dimensionen und Berechtigungen sind eingerichtet |
| Testdaten | `FA-CNC-01`, Beispielwert `10.000 EUR` |
| Erwartete Posten | Sachposten und passende Nebenbuchposten |
| Kontrollbericht | `Anlagenposten (FA Ledger Entries)` und Anlagenbuchwert |
| Negativfall | falsche Dimension oder falsche Buchungsgruppe |
| Akzeptanzkriterium | Beleg, Posten, Bericht und Evidence Pack stimmen überein |

### In 5 Minuten merken

* 5 wichtigste Begriffe: Beleg, gebuchter Beleg, Posten, Dimension, Evidence Pack.
* 5 wichtigste Seiten: `Anlagen (Fixed Assets)`, `Anlagen Buch.-Blätter (FA Journals)`, `Sachposten`, passende Nebenbuchposten, Kontrollbericht, gebuchte Belege.
* 3 häufigste Fehler: falsche Stammdaten, falsche Dimension, übersprungener Prozessschritt.
* 3 Prüfungsfallen: Bildschirm ist nicht Buchung, Beleg ist nicht Posten, Bericht ersetzt keine Abstimmung.
* 1 Praxisregel: Erst Beleg verstehen, dann buchen, dann Posten und Bericht prüfen.


## 22. USt, E-Rechnung und deutsche Nachweissicht [Q20][Q21][Q22][Q23][Q24][Q75][Q76][Q77][Q78]

### Kapitelbox

| Feld | Inhalt |
|---|---|
| Zielgruppe | Einsteiger, Key User, Consultant, Architect |
| Schwierigkeit | Basic bis Advanced |
| Prozessbereich | USt/E-Rechnung/Nachweise |
| Betroffene Companies | RM-SHARED, alle operativen Companies |
| MB-800-Relevanz | Ja: USt-Posten, UStVA, E-Rechnung, EU/Drittland, Nachweise |
| Solution-Architect-Relevanz | Ja: Steuerlogik, Compliance, E-Rechnung, Evidence Pack |
| Benötigte Vorkenntnisse | Belege, Posten, Stammdaten, Buchungsgruppen, Dimensionen |
| Ergebnis nach dem Kapitel | Leser kann den Prozess mit Rhein-Main-Testdaten ausführen, Posten prüfen, Fehler diagnostizieren und UAT nachweisen |

### Beteiligte Rollen

| Rolle | Aufgabe | Ergebnis |
|---|---|---|
| Fachanwender | Prozess ausführen und Belegdaten prüfen | fachlich korrekter Vorgang |
| Key User | Stammdaten, Setup und Fehlerfälle prüfen | stabiler Prozess |
| Finance/Controlling | Buchungsspur, Bericht und Evidence Pack prüfen | abgestimmter Nachweis |
| Solution Architect | Standardgrenze und Betriebsfolge bewerten | tragfähiges Prozessdesign |

### Benötigte Stammdaten

Debitor `D10000`, `D20000`, `D30000`, Kreditor `K10000`, E-Rechnungsdatei. Diese Daten müssen vor dem Test gepflegt sein, sonst erzeugt der richtige Klick später falsche Posten oder unvollständige Berichte.

### Benötigtes Setup

USt-Gruppen, USt-Buchungsmatrix, E-Belege, Beleglayouts, Nummernserien, Archiv-/Nachweisprozess. Das Setup wird nicht während der Buchung improvisiert, sondern vorab durch Key User und Finance freigegeben.

### Deutsche BC-Seiten mit englischer Suchhilfe

`USt-Posten (VAT Entries)`, `USt-Abrechnung (VAT Statement)`, `E-Belege (E-Documents)`, `Gebuchte Verkaufsrechnungen`. Suche die Seiten über `Alt+Q`; wenn der deutsche Begriff nicht gefunden wird, nutze den englischen Klammerbegriff.

### Happy Path mit Rhein-Main-Testdaten

Testfall: DE-Verkauf 19 %, EU-B2B, Drittlandexport, Eingangsrechnung mit Vorsteuer. Der Happy Path ist bestanden, wenn der gebuchte Beleg, die Nebenbuchposten, die Sachposten, der Kontrollbericht und das Evidence Pack übereinstimmen.

### Kontrollbericht

USt-Posten, USt-Abrechnung, ZM soweit relevant, E-Rechnungsstatus. Der Kontrollbericht ist die fachliche Gegenprobe zur Buchung. Er beantwortet nicht nur, ob gebucht wurde, sondern ob Menge, Wert, Steuer, Dimension und Zeitraum stimmen.

### Korrekturweg

1. Fehlerbild aus Anwendersicht festhalten.
2. Belegnummer, Datum, Stammdaten und Dimensionen prüfen.
3. Buchungsspur bis zu Nebenbuchposten und Sachposten verfolgen.
4. Entscheiden, ob vor Buchung korrigiert, nach Buchung gutgeschrieben, storniert, ausgeglichen, umgebucht oder per zulässigem Korrekturwerkzeug korrigiert wird.
5. Korrektur mit Beleg, Posten und Bericht dokumentieren.

### Evidence Pack

Rechnung, XML/E-Rechnung, USt-ID-Prüfung, Liefernachweis, USt-Posten. Das Evidence Pack wird im UAT und später im Betrieb genutzt, damit Fachbereich, Finance und Prüfung dieselbe Spur nachvollziehen können.

### Dokumente, E-Mail, Beleglayouts und Ausgabeprozesse

Ein Business-Central-Prozess endet für den Kunden, Lieferanten oder Prüfer oft nicht mit der Buchung. Er endet mit einem verständlichen, richtigen und nachweisbaren Dokument. Deshalb gehören E-Mail-Einrichtung, Beleglayouts, Berichtsauswahl und Versandprofile in jedes vollständige BC-Schulungsbuch.

### Warum das wichtig ist

| Thema | Auswirkung |
|---|---|
| falsches Rechnungslayout | Kunde erhält unvollständige Pflichtangaben |
| falsche Absenderadresse | Dokument wirkt unprofessionell oder landet im Spam |
| falscher Bericht | falscher Belegtyp oder falsche Anlage |
| kein Versandprofil | Mitarbeiter wählen jedes Mal manuell und uneinheitlich |
| fehlgeschlagene E-Mail | Rechnung gilt intern als erledigt, kommt aber nicht an |

Microsoft Learn beschreibt, dass Business Central Dokumente wie Verkaufs- und Einkaufsbelege direkt per E-Mail senden kann. Administratoren richten E-Mail-Konten und E-Mail-Szenarien ein; Dokumente können als PDF-Anhang gesendet werden. [Q75][Q77]

### Grundeinrichtung Dokumentversand

Schrittfolge:
1. Öffne `E-Mail-Konten (Email Accounts)`.
2. Richte das zentrale Konto ein, z. B. `rechnung@rhein-main-industrie.de`.
3. Öffne `E-Mail-Szenariozuordnungen (Email Scenario Assignment)`.
4. Ordne Verkauf, Einkauf, Service und Mahnwesen passenden Absendern zu.
5. Öffne `Berichtsauswahl - Verkauf (Report Selection - Sales)`.
6. Prüfe, welcher Bericht für Angebot, Auftrag, Lieferung, Rechnung und Gutschrift verwendet wird.
7. Öffne `Berichtslayouts (Report Layouts)`.
8. Lege das gewünschte Standardlayout je Company fest.
9. Prüfe Testversand an interne Adresse.
10. Prüfe `Gesendete E-Mails (Sent Emails)` und `E-Mail-Ausgang (Email Outbox)`.

BC-Best-Practice:
- Jede Company bekommt eigene Beleglayouts mit korrektem Logo, Adresse, USt-ID, Bankdaten und Pflichttexten.
- E-Mail-Szenarien werden zentral eingerichtet. Mitarbeiter sollen nicht frei entscheiden, ob Rechnungen von privaten Nutzeradressen versendet werden.

### Deutsche Belegausgabe-Matrix

| Prozess | Deutsche Seite | Einrichtung | Prüfpunkte |
|---|---|---|---|
| Verkaufsrechnung senden | `Gebuchte Verkaufsrechnungen (Posted Sales Invoices)` | Berichtsauswahl Verkauf, E-Mail-Szenario | PDF, Empfänger, Betreff, Pflichtangaben |
| Verkaufsangebot senden | `Verkaufsangebote (Sales Quotes)` | Berichtsauswahl Verkauf | Gültigkeit, Preis, Ansprechpartner |
| Einkaufsbestellung senden | `Einkaufsbestellungen (Purchase Orders)` | Berichtsauswahl Einkauf | Lieferadresse, Liefertermin |
| Servicebeleg senden | `Serviceaufträge (Service Orders)` | Berichtsauswahl Service | Serviceadresse, Gerät, Leistung |
| Mahnung senden | `Mahnungen (Reminders)` | Mahnmethoden, Berichtsauswahl | Fälligkeit, Gebühren, Tonalität |

Stolperstein:
- Ein Berichtslayout kann je Company unterschiedlich sein. Ein Layouttest in `RM-SALES` beweist nicht automatisch, dass `RM-SERVICE` korrekt eingerichtet ist. [Q76]

### UAT-Test Dokumente

1. Gebuchte Verkaufsrechnung öffnen.
2. `Drucken/Senden` wählen.
3. PDF prüfen.
4. E-Mail-Text prüfen.
5. Empfänger und Absender prüfen.
6. Versand auslösen.
7. `Gesendete E-Mails` prüfen.
8. Fehlerfall mit ungültiger E-Mail-Adresse testen und `E-Mail-Ausgang` prüfen.

Merksatz:
- Ein gebuchter Beleg ist fachlich wichtig. Ein korrekt versendeter und nachweisbarer Beleg ist operativ entscheidend.

---

### Praxisfall Rhein-Main: USt, E-Rechnung und Nachweissicht

### Für absolute Einsteiger: Was du hier gerade tust

Du bildest eine reale Unternehmenshandlung in Business Central ab: Steuerlogik prüfen, E-Rechnung verarbeiten und Nachweise sichern. Der Bildschirm ist nur der Startpunkt. Entscheidend ist, dass Beleg, gebuchter Beleg, Posten, Bericht und Evidence Pack zusammenpassen.

### Warum braucht die Rhein-Main Industriegruppe diesen Prozess?

Die Rhein-Main Industriegruppe braucht diesen Prozess, weil operative Arbeit sonst nicht zuverlässig in Finance, Lager, Steuer und Reporting ankommt. Der Prozess nutzt `USt-Posten (VAT Entries)`, `USt-Abrechnung (VAT Statement)`, `E-Belege (E-Documents)`. Beteiligt ist vor allem die Rolle Steuerverantwortliche. Am Ende erwartet die Fachabteilung einen prüfbaren Beleg, passende Posten, einen Kontrollbericht und einen UAT-Nachweis.

### Rollen

| Rolle | Aufgabe | Ergebnis |
|---|---|---|
| Fachbereich | Vorgang fachlich auslösen | korrekter Ausgangsbeleg |
| Key User | Stammdaten und Pflichtfelder prüfen | buchbarer Vorgang |
| Finance/Controlling | Posten und Bericht prüfen | abgestimmtes Ergebnis |

### Schritt-für-Schritt in der deutschen BC-Oberfläche

1. Öffne die Suche mit `Alt+Q`.
2. Suche nach `USt-Posten (VAT Entries)`, `USt-Abrechnung (VAT Statement)`, `E-Belege (E-Documents)`.
3. Öffne die passende Seite und lege den Vorgang für `D20000`, `D30000`, `K10000` an oder filtere darauf.
4. Prüfe Buchungsdatum, Belegdatum, Company, Lagerort, Dimensionen und Buchungsgruppen.
5. Erfasse Menge, Preis, Ressource, Sachkonto oder Projektbezug entsprechend dem Fall.
6. Wähle `Buchungsvorschau (Preview Posting)`, wenn der Vorgang eine Buchung auslöst.
7. Führe die fachliche Aktion aus: freigeben, registrieren, buchen, fakturieren oder ausgleichen.
8. Öffne den gebuchten Beleg oder die entstandenen Postenlisten.
9. Filtere nach Belegnummer, Artikel, Debitor, Kreditor, Projekt oder Anlage.
10. Öffne den Kontrollbericht `USt-Abrechnung`, `USt-Posten`, Zusammenfassende Meldung falls relevant und vergleiche Menge, Wert, Steuer und Dimension.
11. Speichere Belegnummern, Postenfilter und Bericht als Evidence Pack.

### Buchungsspur

| Ebene | Was prüfen? | Wo prüfen? |
|---|---|---|
| Ausgangsbeleg | fachlicher Vorgang und Pflichtfelder | Startseite des Prozesses |
| Gebuchter Beleg | gebuchte Lieferung, Rechnung, Zahlung, Journal oder Projektbuchung | gebuchte Belege/Postenlisten |
| Nebenbuch | Debitor, Kreditor, Artikel, Bank, Anlage oder Projekt | passende Postenliste |
| Sachposten | Hauptbuchwirkung | `Sachposten (G/L Entries)` |
| USt/Wert | Steuer, Lagerwert oder Kostenwirkung | `USt-Posten`, `Wertposten`, Bericht |
| Bericht | fachliche Kontrolle | `USt-Abrechnung`, `USt-Posten`, Zusammenfassende Meldung falls relevant |

### Zahlenbeispiel

Rhein-Main nutzt `D20000`, `D30000`, `K10000` mit einem Beispielwert von `10.000 EUR`. Die Buchung muss zeigen, welche Menge bewegt wird, welcher Wert entsteht, welche Dimension mitläuft und welcher Bericht das Ergebnis bestätigt.

### Abweichungen

| Abweichung | Risiko | Kontrolle |
|---|---|---|
| falsche Stammdaten | falsche Konten, Steuer oder Dimension | Stammdatenkarte und Buchungsvorschau |
| falsche Menge oder falscher Wert | Bestand, Marge oder Abschluss stimmt nicht | Postenliste und Kontrollbericht |
| Prozessschritt übersprungen | Belegkette unvollständig | gebuchte Belege und Evidence Pack |

### Fehlerdiagnose

| Fehler | Symptom | Ursache | Diagnosepfad | Korrekturweg | Was man nicht tun darf |
|---|---|---|---|---|---|
| falsche Dimension | Bericht zeigt Wert nicht | Pflichtdimension fehlt oder ist falsch | Beleg → Posten → Dimension | Dimension Correction Tool oder fachliche Korrekturbuchung | Bericht manuell überschreiben |
| falsche Buchungsgruppe | falsches Konto oder falsche USt | Stammdaten falsch gepflegt | Stammdatenkarte → Posting Setup → Sachposten | Stammdaten korrigieren, Beleg fachlich stornieren/neubuchen | gebuchte Posten löschen |
| falscher Status | Beleg kann nicht gebucht werden | Freigabe, Lageraktivität oder Pflichtfeld fehlt | Belegstatus → Fehlermeldung → Einrichtung | Status zurücksetzen, Pflichtfeld ergänzen, Prozessschritt nachholen | Warnungen ignorieren |

### Übung

Führe den Fall für `D20000`, `D30000`, `K10000` in der Trainingscompany aus. Dokumentiere Startbeleg, gebuchten Beleg, Posten, Kontrollbericht und eine typische Abweichung.

### Lösungsskizze

1. Öffne `USt-Posten (VAT Entries)`, `USt-Abrechnung (VAT Statement)`, `E-Belege (E-Documents)` über `Alt+Q`.
2. Erfasse oder filtere den Vorgang für `D20000`, `D30000`, `K10000`.
3. Prüfe Datum, Lagerort, Buchungsgruppen und Dimensionen.
4. Nutze `Buchungsvorschau (Preview Posting)`, wenn eine Buchung erfolgt.
5. Buche oder registriere den Vorgang.
6. Prüfe Sachposten, Nebenbuchposten und `USt-Abrechnung`, `USt-Posten`, Zusammenfassende Meldung falls relevant.
7. Dokumentiere das Evidence Pack.

### UAT-Fall

| Feld | Inhalt |
|---|---|
| ID | `UAT-VAT-001` |
| Ziel | USt, E-Rechnung und Nachweissicht fachlich abnehmen |
| Rolle | Steuerverantwortliche |
| Voraussetzung | Stammdaten, Buchungsgruppen, Dimensionen und Berechtigungen sind eingerichtet |
| Testdaten | `D20000`, `D30000`, `K10000`, Beispielwert `10.000 EUR` |
| Erwartete Posten | Sachposten und passende Nebenbuchposten |
| Kontrollbericht | `USt-Abrechnung`, `USt-Posten`, Zusammenfassende Meldung falls relevant |
| Negativfall | falsche Dimension oder falsche Buchungsgruppe |
| Akzeptanzkriterium | Beleg, Posten, Bericht und Evidence Pack stimmen überein |

### In 5 Minuten merken

* 5 wichtigste Begriffe: Beleg, gebuchter Beleg, Posten, Dimension, Evidence Pack.
* 5 wichtigste Seiten: `USt-Posten (VAT Entries)`, `USt-Abrechnung (VAT Statement)`, `E-Belege (E-Documents)`, `Sachposten`, passende Nebenbuchposten, Kontrollbericht, gebuchte Belege.
* 3 häufigste Fehler: falsche Stammdaten, falsche Dimension, übersprungener Prozessschritt.
* 3 Prüfungsfallen: Bildschirm ist nicht Buchung, Beleg ist nicht Posten, Bericht ersetzt keine Abstimmung.
* 1 Praxisregel: Erst Beleg verstehen, dann buchen, dann Posten und Bericht prüfen.


## 23. Inventory Costing und Lagerbewertung im Abschluss

### Kapitelbox

| Feld | Inhalt |
|---|---|
| Zielgruppe | Einsteiger, Key User, Consultant, Architect |
| Schwierigkeit | Basic bis Advanced |
| Prozessbereich | Inventory Costing |
| Betroffene Companies | RM-PROD, RM-SHARED |
| MB-800-Relevanz | Ja: Kostenmethode, Wertposten, erwartete/fakturierte Kosten, Lagerwertabschluss |
| Solution-Architect-Relevanz | Ja: Kostenregulierung, Hauptbuchabgleich, Bewertungsmethode |
| Benötigte Vorkenntnisse | Belege, Posten, Stammdaten, Buchungsgruppen, Dimensionen |
| Ergebnis nach dem Kapitel | Leser kann den Prozess mit Rhein-Main-Testdaten ausführen, Posten prüfen, Fehler diagnostizieren und UAT nachweisen |

### Beteiligte Rollen

| Rolle | Aufgabe | Ergebnis |
|---|---|---|
| Fachanwender | Prozess ausführen und Belegdaten prüfen | fachlich korrekter Vorgang |
| Key User | Stammdaten, Setup und Fehlerfälle prüfen | stabiler Prozess |
| Finance/Controlling | Buchungsspur, Bericht und Evidence Pack prüfen | abgestimmter Nachweis |
| Solution Architect | Standardgrenze und Betriebsfolge bewerten | tragfähiges Prozessdesign |

### Benötigte Stammdaten

Artikel `RAW-STEEL`, `RM-M100`, Einkauf `PO-2001`, Fertigung `PROD-3001`. Diese Daten müssen vor dem Test gepflegt sein, sonst erzeugt der richtige Klick später falsche Posten oder unvollständige Berichte.

### Benötigtes Setup

Kostenmethode, Lager Einrichtung, automatische Kostenbuchung, Kostenregulierung, Lagerbuchungsmatrix. Das Setup wird nicht während der Buchung improvisiert, sondern vorab durch Key User und Finance freigegeben.

### Deutsche BC-Seiten mit englischer Suchhilfe

`Wertposten (Value Entries)`, `Kostenregulierung Artikelposten (Adjust Cost - Item Entries)`, `Lagerwert (Inventory Valuation)`. Suche die Seiten über `Alt+Q`; wenn der deutsche Begriff nicht gefunden wird, nutze den englischen Klammerbegriff.

### Happy Path mit Rhein-Main-Testdaten

Testfall: Wareneingang, spätere Eingangsrechnung, Kostenregulierung, Lagerbewertung. Der Happy Path ist bestanden, wenn der gebuchte Beleg, die Nebenbuchposten, die Sachposten, der Kontrollbericht und das Evidence Pack übereinstimmen.

### Kontrollbericht

Lagerbewertung, Wertposten, Sachposten, Abstimmung Bestand/Wareneinsatz. Der Kontrollbericht ist die fachliche Gegenprobe zur Buchung. Er beantwortet nicht nur, ob gebucht wurde, sondern ob Menge, Wert, Steuer, Dimension und Zeitraum stimmen.

### Korrekturweg

1. Fehlerbild aus Anwendersicht festhalten.
2. Belegnummer, Datum, Stammdaten und Dimensionen prüfen.
3. Buchungsspur bis zu Nebenbuchposten und Sachposten verfolgen.
4. Entscheiden, ob vor Buchung korrigiert, nach Buchung gutgeschrieben, storniert, ausgeglichen, umgebucht oder per zulässigem Korrekturwerkzeug korrigiert wird.
5. Korrektur mit Beleg, Posten und Bericht dokumentieren.

### Evidence Pack

Artikelposten, Wertposten, Kostenregulierungslauf, Lagerbewertung, Hauptbuchabgleich. Das Evidence Pack wird im UAT und später im Betrieb genutzt, damit Fachbereich, Finance und Prüfung dieselbe Spur nachvollziehen können.

### Praxisfall Rhein-Main: Inventory und Warehouse

### Für absolute Einsteiger: Was du hier gerade tust

Du bildest eine reale Unternehmenshandlung in Business Central ab: Ware einlagern, kommissionieren, umlagern und bewerten. Der Bildschirm ist nur der Startpunkt. Entscheidend ist, dass Beleg, gebuchter Beleg, Posten, Bericht und Evidence Pack zusammenpassen.

### Warum braucht die Rhein-Main Industriegruppe diesen Prozess?

Die Rhein-Main Industriegruppe braucht diesen Prozess, weil operative Arbeit sonst nicht zuverlässig in Finance, Lager, Steuer und Reporting ankommt. Der Prozess nutzt `Lagerorte (Locations)`, `Artikelposten (Item Ledger Entries)`, `Wertposten (Value Entries)`. Beteiligt ist vor allem die Rolle Lagerist. Am Ende erwartet die Fachabteilung einen prüfbaren Beleg, passende Posten, einen Kontrollbericht und einen UAT-Nachweis.

### Rollen

| Rolle | Aufgabe | Ergebnis |
|---|---|---|
| Fachbereich | Vorgang fachlich auslösen | korrekter Ausgangsbeleg |
| Key User | Stammdaten und Pflichtfelder prüfen | buchbarer Vorgang |
| Finance/Controlling | Posten und Bericht prüfen | abgestimmtes Ergebnis |

### Schritt-für-Schritt in der deutschen BC-Oberfläche

1. Öffne die Suche mit `Alt+Q`.
2. Suche nach `Lagerorte (Locations)`, `Artikelposten (Item Ledger Entries)`, `Wertposten (Value Entries)`.
3. Öffne die passende Seite und lege den Vorgang für `SP-PUMP-01` an oder filtere darauf.
4. Prüfe Buchungsdatum, Belegdatum, Company, Lagerort, Dimensionen und Buchungsgruppen.
5. Erfasse Menge, Preis, Ressource, Sachkonto oder Projektbezug entsprechend dem Fall.
6. Wähle `Buchungsvorschau (Preview Posting)`, wenn der Vorgang eine Buchung auslöst.
7. Führe die fachliche Aktion aus: freigeben, registrieren, buchen, fakturieren oder ausgleichen.
8. Öffne den gebuchten Beleg oder die entstandenen Postenlisten.
9. Filtere nach Belegnummer, Artikel, Debitor, Kreditor, Projekt oder Anlage.
10. Öffne den Kontrollbericht `Lagerbewertung (Inventory Valuation)` und vergleiche Menge, Wert, Steuer und Dimension.
11. Speichere Belegnummern, Postenfilter und Bericht als Evidence Pack.

### Buchungsspur

| Ebene | Was prüfen? | Wo prüfen? |
|---|---|---|
| Ausgangsbeleg | fachlicher Vorgang und Pflichtfelder | Startseite des Prozesses |
| Gebuchter Beleg | gebuchte Lieferung, Rechnung, Zahlung, Journal oder Projektbuchung | gebuchte Belege/Postenlisten |
| Nebenbuch | Debitor, Kreditor, Artikel, Bank, Anlage oder Projekt | passende Postenliste |
| Sachposten | Hauptbuchwirkung | `Sachposten (G/L Entries)` |
| USt/Wert | Steuer, Lagerwert oder Kostenwirkung | `USt-Posten`, `Wertposten`, Bericht |
| Bericht | fachliche Kontrolle | `Lagerbewertung (Inventory Valuation)` |

### Zahlenbeispiel

Rhein-Main nutzt `SP-PUMP-01` mit einem Beispielwert von `10.000 EUR`. Die Buchung muss zeigen, welche Menge bewegt wird, welcher Wert entsteht, welche Dimension mitläuft und welcher Bericht das Ergebnis bestätigt.

### Abweichungen

| Abweichung | Risiko | Kontrolle |
|---|---|---|
| falsche Stammdaten | falsche Konten, Steuer oder Dimension | Stammdatenkarte und Buchungsvorschau |
| falsche Menge oder falscher Wert | Bestand, Marge oder Abschluss stimmt nicht | Postenliste und Kontrollbericht |
| Prozessschritt übersprungen | Belegkette unvollständig | gebuchte Belege und Evidence Pack |

### Fehlerdiagnose

| Fehler | Symptom | Ursache | Diagnosepfad | Korrekturweg | Was man nicht tun darf |
|---|---|---|---|---|---|
| falsche Dimension | Bericht zeigt Wert nicht | Pflichtdimension fehlt oder ist falsch | Beleg → Posten → Dimension | Dimension Correction Tool oder fachliche Korrekturbuchung | Bericht manuell überschreiben |
| falsche Buchungsgruppe | falsches Konto oder falsche USt | Stammdaten falsch gepflegt | Stammdatenkarte → Posting Setup → Sachposten | Stammdaten korrigieren, Beleg fachlich stornieren/neubuchen | gebuchte Posten löschen |
| falscher Status | Beleg kann nicht gebucht werden | Freigabe, Lageraktivität oder Pflichtfeld fehlt | Belegstatus → Fehlermeldung → Einrichtung | Status zurücksetzen, Pflichtfeld ergänzen, Prozessschritt nachholen | Warnungen ignorieren |

### Übung

Führe den Fall für `SP-PUMP-01` in der Trainingscompany aus. Dokumentiere Startbeleg, gebuchten Beleg, Posten, Kontrollbericht und eine typische Abweichung.

### Lösungsskizze

1. Öffne `Lagerorte (Locations)`, `Artikelposten (Item Ledger Entries)`, `Wertposten (Value Entries)` über `Alt+Q`.
2. Erfasse oder filtere den Vorgang für `SP-PUMP-01`.
3. Prüfe Datum, Lagerort, Buchungsgruppen und Dimensionen.
4. Nutze `Buchungsvorschau (Preview Posting)`, wenn eine Buchung erfolgt.
5. Buche oder registriere den Vorgang.
6. Prüfe Sachposten, Nebenbuchposten und `Lagerbewertung (Inventory Valuation)`.
7. Dokumentiere das Evidence Pack.

### UAT-Fall

| Feld | Inhalt |
|---|---|
| ID | `UAT-WHSE-001` |
| Ziel | Inventory und Warehouse fachlich abnehmen |
| Rolle | Lagerist |
| Voraussetzung | Stammdaten, Buchungsgruppen, Dimensionen und Berechtigungen sind eingerichtet |
| Testdaten | `SP-PUMP-01`, Beispielwert `10.000 EUR` |
| Erwartete Posten | Sachposten und passende Nebenbuchposten |
| Kontrollbericht | `Lagerbewertung (Inventory Valuation)` |
| Negativfall | falsche Dimension oder falsche Buchungsgruppe |
| Akzeptanzkriterium | Beleg, Posten, Bericht und Evidence Pack stimmen überein |

### In 5 Minuten merken

* 5 wichtigste Begriffe: Beleg, gebuchter Beleg, Posten, Dimension, Evidence Pack.
* 5 wichtigste Seiten: `Lagerorte (Locations)`, `Artikelposten (Item Ledger Entries)`, `Wertposten (Value Entries)`, `Sachposten`, passende Nebenbuchposten, Kontrollbericht, gebuchte Belege.
* 3 häufigste Fehler: falsche Stammdaten, falsche Dimension, übersprungener Prozessschritt.
* 3 Prüfungsfallen: Bildschirm ist nicht Buchung, Beleg ist nicht Posten, Bericht ersetzt keine Abstimmung.
* 1 Praxisregel: Erst Beleg verstehen, dann buchen, dann Posten und Bericht prüfen.

### Praxisfall Rhein-Main: Monatsabschluss / Record-to-Report

### Für absolute Einsteiger: Was du hier gerade tust

Du bildest eine reale Unternehmenshandlung in Business Central ab: Nebenbücher abstimmen, Perioden prüfen und Abschlussnachweis erstellen. Der Bildschirm ist nur der Startpunkt. Entscheidend ist, dass Beleg, gebuchter Beleg, Posten, Bericht und Evidence Pack zusammenpassen.

### Warum braucht die Rhein-Main Industriegruppe diesen Prozess?

Die Rhein-Main Industriegruppe braucht diesen Prozess, weil operative Arbeit sonst nicht zuverlässig in Finance, Lager, Steuer und Reporting ankommt. Der Prozess nutzt `Sachposten (G/L Entries)`, `Finanzberichte (Financial Reports)`, `Buchhaltungsperioden (Accounting Periods)`. Beteiligt ist vor allem die Rolle Finance-Leitung. Am Ende erwartet die Fachabteilung einen prüfbaren Beleg, passende Posten, einen Kontrollbericht und einen UAT-Nachweis.

### Rollen

| Rolle | Aufgabe | Ergebnis |
|---|---|---|
| Fachbereich | Vorgang fachlich auslösen | korrekter Ausgangsbeleg |
| Key User | Stammdaten und Pflichtfelder prüfen | buchbarer Vorgang |
| Finance/Controlling | Posten und Bericht prüfen | abgestimmtes Ergebnis |

### Schritt-für-Schritt in der deutschen BC-Oberfläche

1. Öffne die Suche mit `Alt+Q`.
2. Suche nach `Sachposten (G/L Entries)`, `Finanzberichte (Financial Reports)`, `Buchhaltungsperioden (Accounting Periods)`.
3. Öffne die passende Seite und lege den Vorgang für `2026-05` an oder filtere darauf.
4. Prüfe Buchungsdatum, Belegdatum, Company, Lagerort, Dimensionen und Buchungsgruppen.
5. Erfasse Menge, Preis, Ressource, Sachkonto oder Projektbezug entsprechend dem Fall.
6. Wähle `Buchungsvorschau (Preview Posting)`, wenn der Vorgang eine Buchung auslöst.
7. Führe die fachliche Aktion aus: freigeben, registrieren, buchen, fakturieren oder ausgleichen.
8. Öffne den gebuchten Beleg oder die entstandenen Postenlisten.
9. Filtere nach Belegnummer, Artikel, Debitor, Kreditor, Projekt oder Anlage.
10. Öffne den Kontrollbericht `Finanzberichte`, OP-Listen, Lagerbewertung, USt-Abrechnung und vergleiche Menge, Wert, Steuer und Dimension.
11. Speichere Belegnummern, Postenfilter und Bericht als Evidence Pack.

### Buchungsspur

| Ebene | Was prüfen? | Wo prüfen? |
|---|---|---|
| Ausgangsbeleg | fachlicher Vorgang und Pflichtfelder | Startseite des Prozesses |
| Gebuchter Beleg | gebuchte Lieferung, Rechnung, Zahlung, Journal oder Projektbuchung | gebuchte Belege/Postenlisten |
| Nebenbuch | Debitor, Kreditor, Artikel, Bank, Anlage oder Projekt | passende Postenliste |
| Sachposten | Hauptbuchwirkung | `Sachposten (G/L Entries)` |
| USt/Wert | Steuer, Lagerwert oder Kostenwirkung | `USt-Posten`, `Wertposten`, Bericht |
| Bericht | fachliche Kontrolle | `Finanzberichte`, OP-Listen, Lagerbewertung, USt-Abrechnung |

### Zahlenbeispiel

Rhein-Main nutzt `2026-05` mit einem Beispielwert von `10.000 EUR`. Die Buchung muss zeigen, welche Menge bewegt wird, welcher Wert entsteht, welche Dimension mitläuft und welcher Bericht das Ergebnis bestätigt.

### Abweichungen

| Abweichung | Risiko | Kontrolle |
|---|---|---|
| falsche Stammdaten | falsche Konten, Steuer oder Dimension | Stammdatenkarte und Buchungsvorschau |
| falsche Menge oder falscher Wert | Bestand, Marge oder Abschluss stimmt nicht | Postenliste und Kontrollbericht |
| Prozessschritt übersprungen | Belegkette unvollständig | gebuchte Belege und Evidence Pack |

### Fehlerdiagnose

| Fehler | Symptom | Ursache | Diagnosepfad | Korrekturweg | Was man nicht tun darf |
|---|---|---|---|---|---|
| falsche Dimension | Bericht zeigt Wert nicht | Pflichtdimension fehlt oder ist falsch | Beleg → Posten → Dimension | Dimension Correction Tool oder fachliche Korrekturbuchung | Bericht manuell überschreiben |
| falsche Buchungsgruppe | falsches Konto oder falsche USt | Stammdaten falsch gepflegt | Stammdatenkarte → Posting Setup → Sachposten | Stammdaten korrigieren, Beleg fachlich stornieren/neubuchen | gebuchte Posten löschen |
| falscher Status | Beleg kann nicht gebucht werden | Freigabe, Lageraktivität oder Pflichtfeld fehlt | Belegstatus → Fehlermeldung → Einrichtung | Status zurücksetzen, Pflichtfeld ergänzen, Prozessschritt nachholen | Warnungen ignorieren |

### Übung

Führe den Fall für `2026-05` in der Trainingscompany aus. Dokumentiere Startbeleg, gebuchten Beleg, Posten, Kontrollbericht und eine typische Abweichung.

### Lösungsskizze

1. Öffne `Sachposten (G/L Entries)`, `Finanzberichte (Financial Reports)`, `Buchhaltungsperioden (Accounting Periods)` über `Alt+Q`.
2. Erfasse oder filtere den Vorgang für `2026-05`.
3. Prüfe Datum, Lagerort, Buchungsgruppen und Dimensionen.
4. Nutze `Buchungsvorschau (Preview Posting)`, wenn eine Buchung erfolgt.
5. Buche oder registriere den Vorgang.
6. Prüfe Sachposten, Nebenbuchposten und `Finanzberichte`, OP-Listen, Lagerbewertung, USt-Abrechnung.
7. Dokumentiere das Evidence Pack.

### UAT-Fall

| Feld | Inhalt |
|---|---|
| ID | `UAT-R2R-001` |
| Ziel | Monatsabschluss / Record-to-Report fachlich abnehmen |
| Rolle | Finance-Leitung |
| Voraussetzung | Stammdaten, Buchungsgruppen, Dimensionen und Berechtigungen sind eingerichtet |
| Testdaten | `2026-05`, Beispielwert `10.000 EUR` |
| Erwartete Posten | Sachposten und passende Nebenbuchposten |
| Kontrollbericht | `Finanzberichte`, OP-Listen, Lagerbewertung, USt-Abrechnung |
| Negativfall | falsche Dimension oder falsche Buchungsgruppe |
| Akzeptanzkriterium | Beleg, Posten, Bericht und Evidence Pack stimmen überein |

### In 5 Minuten merken

* 5 wichtigste Begriffe: Beleg, gebuchter Beleg, Posten, Dimension, Evidence Pack.
* 5 wichtigste Seiten: `Sachposten (G/L Entries)`, `Finanzberichte (Financial Reports)`, `Buchhaltungsperioden (Accounting Periods)`, `Sachposten`, passende Nebenbuchposten, Kontrollbericht, gebuchte Belege.
* 3 häufigste Fehler: falsche Stammdaten, falsche Dimension, übersprungener Prozessschritt.
* 3 Prüfungsfallen: Bildschirm ist nicht Buchung, Beleg ist nicht Posten, Bericht ersetzt keine Abstimmung.
* 1 Praxisregel: Erst Beleg verstehen, dann buchen, dann Posten und Bericht prüfen.


## 24. Monatsabschluss / Record-to-Report [Q25][Q84][Q85]

### Kapitelbox

| Feld | Inhalt |
|---|---|
| Zielgruppe | Einsteiger, Key User, Consultant, Architect |
| Schwierigkeit | Basic bis Advanced |
| Prozessbereich | Monatsabschluss/R2R |
| Betroffene Companies | RM-SHARED |
| MB-800-Relevanz | Ja: Nebenbuchabstimmung, Perioden, USt, Bank, Anlagen, Lager, GuV, Bilanz |
| Solution-Architect-Relevanz | Ja: Abschlusskalender, Periodensperre, Evidence Pack |
| Benötigte Vorkenntnisse | Belege, Posten, Stammdaten, Buchungsgruppen, Dimensionen |
| Ergebnis nach dem Kapitel | Leser kann den Prozess mit Rhein-Main-Testdaten ausführen, Posten prüfen, Fehler diagnostizieren und UAT nachweisen |

### Beteiligte Rollen

| Rolle | Aufgabe | Ergebnis |
|---|---|---|
| Fachanwender | Prozess ausführen und Belegdaten prüfen | fachlich korrekter Vorgang |
| Key User | Stammdaten, Setup und Fehlerfälle prüfen | stabiler Prozess |
| Finance/Controlling | Buchungsspur, Bericht und Evidence Pack prüfen | abgestimmter Nachweis |
| Solution Architect | Standardgrenze und Betriebsfolge bewerten | tragfähiges Prozessdesign |

### Benötigte Stammdaten

Monat `2026-05`, offene Posten, Bankauszug, USt-Posten, Lagerbewertung, AfA-Lauf. Diese Daten müssen vor dem Test gepflegt sein, sonst erzeugt der richtige Klick später falsche Posten oder unvollständige Berichte.

### Benötigtes Setup

Buchhaltungsperioden, Buchungsdatumsgrenzen, wiederkehrende Buchungen, Abgrenzungen, Berichte. Das Setup wird nicht während der Buchung improvisiert, sondern vorab durch Key User und Finance freigegeben.

### Deutsche BC-Seiten mit englischer Suchhilfe

`Buchhaltungsperioden (Accounting Periods)`, `Sachposten`, `Finanzberichte`, `USt-Abrechnung`, `Lagerbewertung`. Suche die Seiten über `Alt+Q`; wenn der deutsche Begriff nicht gefunden wird, nutze den englischen Klammerbegriff.

### Happy Path mit Rhein-Main-Testdaten

Testfall: Monatsabschluss Mai 2026 mit OP, Bank, USt, Lager, Anlagen, GuV. Der Happy Path ist bestanden, wenn der gebuchte Beleg, die Nebenbuchposten, die Sachposten, der Kontrollbericht und das Evidence Pack übereinstimmen.

### Kontrollbericht

Abschlusscheckliste, Finanzberichte, Nebenbuchabstimmungen, Evidence Pack. Der Kontrollbericht ist die fachliche Gegenprobe zur Buchung. Er beantwortet nicht nur, ob gebucht wurde, sondern ob Menge, Wert, Steuer, Dimension und Zeitraum stimmen.

### Korrekturweg

1. Fehlerbild aus Anwendersicht festhalten.
2. Belegnummer, Datum, Stammdaten und Dimensionen prüfen.
3. Buchungsspur bis zu Nebenbuchposten und Sachposten verfolgen.
4. Entscheiden, ob vor Buchung korrigiert, nach Buchung gutgeschrieben, storniert, ausgeglichen, umgebucht oder per zulässigem Korrekturwerkzeug korrigiert wird.
5. Korrektur mit Beleg, Posten und Bericht dokumentieren.

### Evidence Pack

OP-Listen, Bankabstimmung, USt-Abstimmung, Lagerwert, Anlagenliste, GuV/Bilanz. Das Evidence Pack wird im UAT und später im Betrieb genutzt, damit Fachbereich, Finance und Prüfung dieselbe Spur nachvollziehen können.

### Wiederkehrende Finance-Prozesse, Abgrenzungen und Umlagen

Viele Finance-Prozesse wiederholen sich: Mieten, Wartungen, Versicherungen, Umlagen, Abgrenzungen, wiederkehrende Journale und periodische Rechnungen. Wer diese Prozesse manuell pflegt, erzeugt vermeidbare Fehler.

### Wiederkehrende Buchungen

Business Central unterstützt wiederkehrende Journale und Umlageschlüssel. Umlageschlüssel können verwendet werden, um Beträge in wiederkehrenden Fibu Buch.-Blättern zu verteilen. [Q85]

Use Case:
- RM-SHARED zahlt Büromiete `30.000 EUR` und verteilt sie nach Fläche auf drei Standorte.

| Standort | Anteil | Betrag |
|---|---:|---:|
| Frankfurt | 50 % | 15.000 |
| Mainz | 30 % | 9.000 |
| Darmstadt | 20 % | 6.000 |

Schrittfolge:
1. Öffne `Wiederkehrende Fibu Buch.-Blätter (Recurring General Journals)`.
2. Lege Buchungszeile für Mietaufwand an.
3. Definiere Wiederholungsmethode und Intervall.
4. Hinterlege Dimension `LOCATION-GROUP`.
5. Richte Umlageschlüssel ein.
6. Prüfe Buchungsvorschau.
7. Buche und prüfe Sachposten.

### Abgrenzungen

Microsoft Learn beschreibt Abgrenzungen als Funktion, um Erlöse und Aufwendungen über Perioden zu verteilen. [Q25]

Beispiel:
- Versicherung `12.000 EUR` für `12` Monate wird im Januar bezahlt.
- Monatlicher Aufwand: `1.000 EUR`.

BC-Best-Practice:
- Wiederkehrende Kosten und Abgrenzungen werden nicht über Excel „nach Gefühl“ gebucht.
- Finance definiert Vorlagen, Perioden, Dimensionen und Kontrollbericht.

### Wiederkehrende Erlöse

Microsoft Learn beschreibt wiederkehrende Erlöse in Business Central, unter anderem für periodische Abrechnungsszenarien. [Q84]

Use Case:
- RM-SERVICE berechnet monatlich Wartungspauschalen.

Prüfpunkte:
- Vertragsdaten vollständig?
- Leistungszeitraum korrekt?
- USt-Logik korrekt?
- Abgrenzung nötig?
- Rechnungslauf kontrolliert?
- Debitorenposten und Erlöskonto geprüft?

Merksatz:
- Wiederholung ist kein Grund für weniger Kontrolle. Wiederholung ist ein Grund für bessere Vorlagen.

---

### Praxisfall Rhein-Main: Monatsabschluss / Record-to-Report

### Für absolute Einsteiger: Was du hier gerade tust

Du bildest eine reale Unternehmenshandlung in Business Central ab: Nebenbücher abstimmen, Perioden prüfen und Abschlussnachweis erstellen. Der Bildschirm ist nur der Startpunkt. Entscheidend ist, dass Beleg, gebuchter Beleg, Posten, Bericht und Evidence Pack zusammenpassen.

### Warum braucht die Rhein-Main Industriegruppe diesen Prozess?

Die Rhein-Main Industriegruppe braucht diesen Prozess, weil operative Arbeit sonst nicht zuverlässig in Finance, Lager, Steuer und Reporting ankommt. Der Prozess nutzt `Sachposten (G/L Entries)`, `Finanzberichte (Financial Reports)`, `Buchhaltungsperioden (Accounting Periods)`. Beteiligt ist vor allem die Rolle Finance-Leitung. Am Ende erwartet die Fachabteilung einen prüfbaren Beleg, passende Posten, einen Kontrollbericht und einen UAT-Nachweis.

### Rollen

| Rolle | Aufgabe | Ergebnis |
|---|---|---|
| Fachbereich | Vorgang fachlich auslösen | korrekter Ausgangsbeleg |
| Key User | Stammdaten und Pflichtfelder prüfen | buchbarer Vorgang |
| Finance/Controlling | Posten und Bericht prüfen | abgestimmtes Ergebnis |

### Schritt-für-Schritt in der deutschen BC-Oberfläche

1. Öffne die Suche mit `Alt+Q`.
2. Suche nach `Sachposten (G/L Entries)`, `Finanzberichte (Financial Reports)`, `Buchhaltungsperioden (Accounting Periods)`.
3. Öffne die passende Seite und lege den Vorgang für `2026-05` an oder filtere darauf.
4. Prüfe Buchungsdatum, Belegdatum, Company, Lagerort, Dimensionen und Buchungsgruppen.
5. Erfasse Menge, Preis, Ressource, Sachkonto oder Projektbezug entsprechend dem Fall.
6. Wähle `Buchungsvorschau (Preview Posting)`, wenn der Vorgang eine Buchung auslöst.
7. Führe die fachliche Aktion aus: freigeben, registrieren, buchen, fakturieren oder ausgleichen.
8. Öffne den gebuchten Beleg oder die entstandenen Postenlisten.
9. Filtere nach Belegnummer, Artikel, Debitor, Kreditor, Projekt oder Anlage.
10. Öffne den Kontrollbericht `Finanzberichte`, OP-Listen, Lagerbewertung, USt-Abrechnung und vergleiche Menge, Wert, Steuer und Dimension.
11. Speichere Belegnummern, Postenfilter und Bericht als Evidence Pack.

### Buchungsspur

| Ebene | Was prüfen? | Wo prüfen? |
|---|---|---|
| Ausgangsbeleg | fachlicher Vorgang und Pflichtfelder | Startseite des Prozesses |
| Gebuchter Beleg | gebuchte Lieferung, Rechnung, Zahlung, Journal oder Projektbuchung | gebuchte Belege/Postenlisten |
| Nebenbuch | Debitor, Kreditor, Artikel, Bank, Anlage oder Projekt | passende Postenliste |
| Sachposten | Hauptbuchwirkung | `Sachposten (G/L Entries)` |
| USt/Wert | Steuer, Lagerwert oder Kostenwirkung | `USt-Posten`, `Wertposten`, Bericht |
| Bericht | fachliche Kontrolle | `Finanzberichte`, OP-Listen, Lagerbewertung, USt-Abrechnung |

### Zahlenbeispiel

Rhein-Main nutzt `2026-05` mit einem Beispielwert von `10.000 EUR`. Die Buchung muss zeigen, welche Menge bewegt wird, welcher Wert entsteht, welche Dimension mitläuft und welcher Bericht das Ergebnis bestätigt.

### Abweichungen

| Abweichung | Risiko | Kontrolle |
|---|---|---|
| falsche Stammdaten | falsche Konten, Steuer oder Dimension | Stammdatenkarte und Buchungsvorschau |
| falsche Menge oder falscher Wert | Bestand, Marge oder Abschluss stimmt nicht | Postenliste und Kontrollbericht |
| Prozessschritt übersprungen | Belegkette unvollständig | gebuchte Belege und Evidence Pack |

### Fehlerdiagnose

| Fehler | Symptom | Ursache | Diagnosepfad | Korrekturweg | Was man nicht tun darf |
|---|---|---|---|---|---|
| falsche Dimension | Bericht zeigt Wert nicht | Pflichtdimension fehlt oder ist falsch | Beleg → Posten → Dimension | Dimension Correction Tool oder fachliche Korrekturbuchung | Bericht manuell überschreiben |
| falsche Buchungsgruppe | falsches Konto oder falsche USt | Stammdaten falsch gepflegt | Stammdatenkarte → Posting Setup → Sachposten | Stammdaten korrigieren, Beleg fachlich stornieren/neubuchen | gebuchte Posten löschen |
| falscher Status | Beleg kann nicht gebucht werden | Freigabe, Lageraktivität oder Pflichtfeld fehlt | Belegstatus → Fehlermeldung → Einrichtung | Status zurücksetzen, Pflichtfeld ergänzen, Prozessschritt nachholen | Warnungen ignorieren |

### Übung

Führe den Fall für `2026-05` in der Trainingscompany aus. Dokumentiere Startbeleg, gebuchten Beleg, Posten, Kontrollbericht und eine typische Abweichung.

### Lösungsskizze

1. Öffne `Sachposten (G/L Entries)`, `Finanzberichte (Financial Reports)`, `Buchhaltungsperioden (Accounting Periods)` über `Alt+Q`.
2. Erfasse oder filtere den Vorgang für `2026-05`.
3. Prüfe Datum, Lagerort, Buchungsgruppen und Dimensionen.
4. Nutze `Buchungsvorschau (Preview Posting)`, wenn eine Buchung erfolgt.
5. Buche oder registriere den Vorgang.
6. Prüfe Sachposten, Nebenbuchposten und `Finanzberichte`, OP-Listen, Lagerbewertung, USt-Abrechnung.
7. Dokumentiere das Evidence Pack.

### UAT-Fall

| Feld | Inhalt |
|---|---|
| ID | `UAT-R2R-001` |
| Ziel | Monatsabschluss / Record-to-Report fachlich abnehmen |
| Rolle | Finance-Leitung |
| Voraussetzung | Stammdaten, Buchungsgruppen, Dimensionen und Berechtigungen sind eingerichtet |
| Testdaten | `2026-05`, Beispielwert `10.000 EUR` |
| Erwartete Posten | Sachposten und passende Nebenbuchposten |
| Kontrollbericht | `Finanzberichte`, OP-Listen, Lagerbewertung, USt-Abrechnung |
| Negativfall | falsche Dimension oder falsche Buchungsgruppe |
| Akzeptanzkriterium | Beleg, Posten, Bericht und Evidence Pack stimmen überein |

### In 5 Minuten merken

* 5 wichtigste Begriffe: Beleg, gebuchter Beleg, Posten, Dimension, Evidence Pack.
* 5 wichtigste Seiten: `Sachposten (G/L Entries)`, `Finanzberichte (Financial Reports)`, `Buchhaltungsperioden (Accounting Periods)`, `Sachposten`, passende Nebenbuchposten, Kontrollbericht, gebuchte Belege.
* 3 häufigste Fehler: falsche Stammdaten, falsche Dimension, übersprungener Prozessschritt.
* 3 Prüfungsfallen: Bildschirm ist nicht Buchung, Beleg ist nicht Posten, Bericht ersetzt keine Abstimmung.
* 1 Praxisregel: Erst Beleg verstehen, dann buchen, dann Posten und Bericht prüfen.


## 25. Reporting, Controlling, Financial Reports und Power BI [Q48][Q49][Q50][Q51]

### Kapitelbox

| Feld | Inhalt |
|---|---|
| Zielgruppe | Einsteiger, Key User, Consultant, Architect |
| Schwierigkeit | Basic bis Advanced |
| Prozessbereich | Reporting/Controlling/Power BI |
| Betroffene Companies | RM-SHARED, alle Companies |
| MB-800-Relevanz | Ja: Finanzberichte, Analysemodus, Analyseansichten, Power BI, GuV nach Dimension |
| Solution-Architect-Relevanz | Ja: Reportingarchitektur, Dimensionenmodell, Datenmodell, Power-BI-Grenzen |
| Benötigte Vorkenntnisse | Belege, Posten, Stammdaten, Buchungsgruppen, Dimensionen |
| Ergebnis nach dem Kapitel | Leser kann den Prozess mit Rhein-Main-Testdaten ausführen, Posten prüfen, Fehler diagnostizieren und UAT nachweisen |

### Beteiligte Rollen

| Rolle | Aufgabe | Ergebnis |
|---|---|---|
| Fachanwender | Prozess ausführen und Belegdaten prüfen | fachlich korrekter Vorgang |
| Key User | Stammdaten, Setup und Fehlerfälle prüfen | stabiler Prozess |
| Finance/Controlling | Buchungsspur, Bericht und Evidence Pack prüfen | abgestimmter Nachweis |
| Solution Architect | Standardgrenze und Betriebsfolge bewerten | tragfähiges Prozessdesign |

### Benötigte Stammdaten

Dimension `PRODUCTLINE = MACHINE`, `CHANNEL = B2B`, Zeitraum `2026-05`. Diese Daten müssen vor dem Test gepflegt sein, sonst erzeugt der richtige Klick später falsche Posten oder unvollständige Berichte.

### Benötigtes Setup

Finanzberichte, Sachkontokategorien, Dimensionen, Analyseansichten, Datenanalysemodus, Power-BI-Dataset. Das Setup wird nicht während der Buchung improvisiert, sondern vorab durch Key User und Finance freigegeben.

### Deutsche BC-Seiten mit englischer Suchhilfe

`Finanzberichte (Financial Reports)`, `Analysemodus (Analysis Mode)`, `Analyseansichten (Analysis Views)`, `Sachposten`. Suche die Seiten über `Alt+Q`; wenn der deutsche Begriff nicht gefunden wird, nutze den englischen Klammerbegriff.

### Happy Path mit Rhein-Main-Testdaten

Testfall: GuV nach Produktlinie und Standort für Mai 2026. Der Happy Path ist bestanden, wenn der gebuchte Beleg, die Nebenbuchposten, die Sachposten, der Kontrollbericht und das Evidence Pack übereinstimmen.

### Kontrollbericht

Finanzbericht, Sachpostenfilter, Analyseansicht, Power-BI-Abgleich. Der Kontrollbericht ist die fachliche Gegenprobe zur Buchung. Er beantwortet nicht nur, ob gebucht wurde, sondern ob Menge, Wert, Steuer, Dimension und Zeitraum stimmen.

### Korrekturweg

1. Fehlerbild aus Anwendersicht festhalten.
2. Belegnummer, Datum, Stammdaten und Dimensionen prüfen.
3. Buchungsspur bis zu Nebenbuchposten und Sachposten verfolgen.
4. Entscheiden, ob vor Buchung korrigiert, nach Buchung gutgeschrieben, storniert, ausgeglichen, umgebucht oder per zulässigem Korrekturwerkzeug korrigiert wird.
5. Korrektur mit Beleg, Posten und Bericht dokumentieren.

### Evidence Pack

Berichtsexport, Filterdefinition, Sachpostenabgleich, Freigabe Controlling. Das Evidence Pack wird im UAT und später im Betrieb genutzt, damit Fachbereich, Finance und Prüfung dieselbe Spur nachvollziehen können.

Controlling in Business Central beginnt nicht mit einem Bericht. Es beginnt mit richtigem Setup: Kontenplan, Kontenkategorien, Dimensionen, Buchungsgruppen und saubere Belegprozesse. Ein Financial Report ist nur so gut wie die Buchungen, die er auswertet.

### Einsteigerbild: Was will ein Controller sehen?

| Frage | Bericht/Analyse | Benötigte Datenqualität |
|---|---|---|
| Verdienen wir Geld? | GuV / Income Statement | Erlöse und Aufwände richtig gebucht |
| Welche Produktlinie verdient Geld? | GuV nach `PRODUCTLINE` | Dimension auf jeder Buchung |
| Welcher Standort ist teuer? | Kosten nach `LOCATION-GROUP` | Lager-/Standortdimension |
| Wie entwickelt sich Marge? | Erlöse minus Wareneinsatz | Artikelkosten und COGS stimmen |
| Welche Kunden zahlen spät? | Debitorenfälligkeit | OP-Ausgleich sauber |
| Wie hoch ist Liquidität? | Cash Flow / Bankberichte | Bankabstimmung und Zahlungsbedingungen |
| Welche Projekte laufen aus dem Ruder? | Project Ledger / WIP | Projektverbrauch vollständig |

### Standard laut Quelle

Microsoft Learn beschreibt Financial Reports als Funktion, um Finanzdaten aus dem Kontenplan zu analysieren, Hauptbucheinträge mit Budgeteinträgen zu vergleichen und Berichte wie Income Statement und Balance Sheet zu nutzen oder anzupassen. Financial Reports können Dimensionen nutzen und ohne Entwickler erstellt werden. [Q48]

Dimensionen kategorisieren Einträge, damit sie für Analysezwecke gruppiert werden können. Microsoft nennt als Beispiele Abteilung, Projekt, Region, Verkäufer oder Kundengruppe. [Q49]

### GuV sinnvoll einrichten

Use Case:
- Die RM-Gruppe will monatlich eine GuV nach Produktlinie und Abteilung sehen: Maschinen, Ersatzteile, Service, Projekte, Miete.

Einrichtungslogik:
1. Kontenplan prüfen: Erlöse, Wareneinsatz, Personal, Fremdleistungen, Lagerabweichungen, Servicekosten, Projektkosten.
2. G/L Account Categories pflegen.
3. Dimensionen definieren: `DEPARTMENT`, `PRODUCTLINE`, `CHANNEL`, `LOCATION-GROUP`.
4. Pflichtdimensionen auf Debitoren, Artikel, Ressourcen, Projekte und Sachkonten setzen.
5. Financial Report `RM-GUV-MONAT` anlegen.
6. Zeilenstruktur definieren: Umsatzerlöse, Wareneinsatz, Rohertrag, operative Kosten, EBITDA-nahe Kennzahl.
7. Spaltenstruktur definieren: Ist Monat, Ist kumuliert, Budget, Abweichung absolut, Abweichung %.
8. Filter nach Dimension testen.
9. Bericht für Controller-Rolle bookmarken.

Beispiel-GuV:

| Zeile | Formel/Quelle | März 2026 |
|---|---|---:|
| Umsatzerlöse Maschinen | Erlöskonten `MACHINE` | 340.000 |
| Umsatzerlöse Ersatzteile | Erlöskonten `SPARE` | 85.000 |
| Serviceerlöse | Erlöskonten `SERVICE` | 42.000 |
| Wareneinsatz | COGS-Konten | -210.000 |
| Rohertrag | Umsatzerlöse + Wareneinsatz | 257.000 |
| Personal/Fremdleistung | Aufwandskonten | -96.000 |
| Sonstige Kosten | Aufwandskonten | -48.000 |
| Ergebnis vor Abschreibung | Zwischensumme | 113.000 |

### Berichte für Controller

| Bericht | Zweck | Tell Me / Seite |
|---|---|---|
| GuV Monat | Ergebnis je Monat | `Financial Reports` |
| Bilanz | Vermögens-/Kapitalstruktur | `Financial Reports` |
| Cash Flow | Liquiditätsblick | `Cash Flow Forecast` |
| Debitorenfälligkeit | Zahlungsverzug | `Aged Accounts Receivable` |
| Kreditorenfälligkeit | Zahlungsplanung | `Aged Accounts Payable` |
| Lagerbewertung | Bestand und Wert | `Inventory Valuation` |
| Dimensionsdetail | Analyse nach Dimensionen | `Dimensions - Detail` |
| Projektbericht | Budget/Ist/Unbilled | `Projects`, Project Reports |
| Produktionsabweichung | Kostenabweichungen | `Production Order Statistics` |

BC-Best-Practice:
- Controller bekommen ein eigenes Rollenprofil mit gebookmarkten Seiten: `Financial Reports`, `G/L Entries`, `Analysis Views`, `Dimensions`, `Inventory Valuation`, `Customer Ledger Entries`, `Vendor Ledger Entries`, `Projects`.
- Controller dürfen analysieren, aber nicht jedes Setup ändern. Setup-Änderungen an Konten, Dimensionen und Reports erfolgen kontrolliert.

### Stolpersteine und Korrekturen

| Fehler | Symptom | Ursache | Korrektur |
|---|---|---|---|
| GuV stimmt nicht | Erlöse fehlen | falsches Erlöskonto in Posting Setup | General Posting Setup prüfen, Korrekturbuchung |
| Produktlinienbericht leer | Dimension fehlt | Pflichtdimension nicht gesetzt | Dimension korrigieren, Analysis View aktualisieren |
| Marge falsch | Wareneinsatz fehlt/spät | Lagerkosten nicht fakturiert oder Adjust Cost offen | Kostenregulierung prüfen |
| Budgetvergleich unsinnig | Budget auf anderer Dimension | Budgetdimensionen passen nicht | Budgetstruktur angleichen |
| Bericht nicht auffindbar | Controller findet Seite nicht | kein Bookmark/Rollenprofil | Seite bookmarken, Profile anpassen |
| falsche Periodenzahlen | Buchungen in falschem Datum | Posting Date/Document Date verwechselt | Periodenfilter und Buchungsdatum prüfen |
| Analyseansicht alt | Zahlen fehlen | Analysis View nicht aktualisiert | Analysis View Update ausführen |

Prüfungstipp:
- Bei jeder GuV-Abweichung zuerst klären: Ist die Buchung falsch, die Dimension falsch, der Zeitraum falsch oder der Bericht falsch?

Schulungsübung:
1. Erstelle Financial Report `RM-GUV-MONAT`.
2. Filtere auf `PRODUCTLINE = SPARE`.
3. Vergleiche März `2026` mit Budget.
4. Finde eine Buchung ohne Dimension und beschreibe die Korrektur.

---

### Berichtswesen, Administration, Aufgabenwarteschlange, Änderungsprotokoll, Datenexport

Reporting und Admin sind keine Nebenthemen. Sie entscheiden, ob die Organisation Business Central stabil betreiben und prüfen kann.

### Standardbereiche

| Bereich | BC-Seiten | Schulungsziel |
|---|---|---|
| Financial Reports | `Financial Reports`, `Account Schedules` | GuV/Bilanznahe Auswertung |
| Analysis Views | `Analysis Views` | Dimensionale Analyse |
| Power BI-nahe Auswertung | Power BI Integration | Management Reporting |
| Change Log | `Change Log Setup`, `Change Log Entries` | Stammdatenänderungen nachweisen |
| Job Queue | `Job Queue Entries` | Automatisierung überwachen |
| Berechtigungen | `Users`, `Permission Sets` | Rollen und SoD abbilden |
| Datenexport | Datenzugriff/Reports/API | Betriebsprüfung und Migration |

Mitarbeiterbedienung:
- Controller erstellt Auswertung nach `DEPARTMENT` und `PRODUCTLINE`.
- Admin prüft fehlgeschlagene Job Queue Entries.
- Finance Operations exportiert Prüfungsdaten und dokumentiert Zeitraum, Filter und Verantwortlichen.

Schulungsübung:
- Aktiviere Change Log für Vendor Bank Accounts, ändere IBAN bei `K10000`, prüfe Change Log Entry und erkläre den Nachweiswert.

---

Teil F bündelt Schulungen, UAT, Lösungen, MB-800, Microsoft-Learn-Mapping, Glossar, Seitenindex, Praxisfallen und Projektartefakte. Dieser Teil macht das Buch als Trainings- und Nachschlagewerk nutzbar.

### Praxisfall Rhein-Main: Reporting, Controlling und Power BI

### Für absolute Einsteiger: Was du hier gerade tust

Du bildest eine reale Unternehmenshandlung in Business Central ab: GuV, Bilanz und Managementsicht nach Dimensionen auswerten. Der Bildschirm ist nur der Startpunkt. Entscheidend ist, dass Beleg, gebuchter Beleg, Posten, Bericht und Evidence Pack zusammenpassen.

### Warum braucht die Rhein-Main Industriegruppe diesen Prozess?

Die Rhein-Main Industriegruppe braucht diesen Prozess, weil operative Arbeit sonst nicht zuverlässig in Finance, Lager, Steuer und Reporting ankommt. Der Prozess nutzt `Finanzberichte (Financial Reports)`, `Analyseansichten (Analysis Views)`, `Datenanalysemodus (Data Analysis Mode)`. Beteiligt ist vor allem die Rolle Controller. Am Ende erwartet die Fachabteilung einen prüfbaren Beleg, passende Posten, einen Kontrollbericht und einen UAT-Nachweis.

### Rollen

| Rolle | Aufgabe | Ergebnis |
|---|---|---|
| Fachbereich | Vorgang fachlich auslösen | korrekter Ausgangsbeleg |
| Key User | Stammdaten und Pflichtfelder prüfen | buchbarer Vorgang |
| Finance/Controlling | Posten und Bericht prüfen | abgestimmtes Ergebnis |

### Schritt-für-Schritt in der deutschen BC-Oberfläche

1. Öffne die Suche mit `Alt+Q`.
2. Suche nach `Finanzberichte (Financial Reports)`, `Analyseansichten (Analysis Views)`, `Datenanalysemodus (Data Analysis Mode)`.
3. Öffne die passende Seite und lege den Vorgang für `PRODUCTLINE = MACHINE` an oder filtere darauf.
4. Prüfe Buchungsdatum, Belegdatum, Company, Lagerort, Dimensionen und Buchungsgruppen.
5. Erfasse Menge, Preis, Ressource, Sachkonto oder Projektbezug entsprechend dem Fall.
6. Wähle `Buchungsvorschau (Preview Posting)`, wenn der Vorgang eine Buchung auslöst.
7. Führe die fachliche Aktion aus: freigeben, registrieren, buchen, fakturieren oder ausgleichen.
8. Öffne den gebuchten Beleg oder die entstandenen Postenlisten.
9. Filtere nach Belegnummer, Artikel, Debitor, Kreditor, Projekt oder Anlage.
10. Öffne den Kontrollbericht `GuV nach Produktlinie`, Analyseansicht, Power-BI-Dataset und vergleiche Menge, Wert, Steuer und Dimension.
11. Speichere Belegnummern, Postenfilter und Bericht als Evidence Pack.

### Buchungsspur

| Ebene | Was prüfen? | Wo prüfen? |
|---|---|---|
| Ausgangsbeleg | fachlicher Vorgang und Pflichtfelder | Startseite des Prozesses |
| Gebuchter Beleg | gebuchte Lieferung, Rechnung, Zahlung, Journal oder Projektbuchung | gebuchte Belege/Postenlisten |
| Nebenbuch | Debitor, Kreditor, Artikel, Bank, Anlage oder Projekt | passende Postenliste |
| Sachposten | Hauptbuchwirkung | `Sachposten (G/L Entries)` |
| USt/Wert | Steuer, Lagerwert oder Kostenwirkung | `USt-Posten`, `Wertposten`, Bericht |
| Bericht | fachliche Kontrolle | `GuV nach Produktlinie`, Analyseansicht, Power-BI-Dataset |

### Zahlenbeispiel

Rhein-Main nutzt `PRODUCTLINE = MACHINE` mit einem Beispielwert von `10.000 EUR`. Die Buchung muss zeigen, welche Menge bewegt wird, welcher Wert entsteht, welche Dimension mitläuft und welcher Bericht das Ergebnis bestätigt.

### Abweichungen

| Abweichung | Risiko | Kontrolle |
|---|---|---|
| falsche Stammdaten | falsche Konten, Steuer oder Dimension | Stammdatenkarte und Buchungsvorschau |
| falsche Menge oder falscher Wert | Bestand, Marge oder Abschluss stimmt nicht | Postenliste und Kontrollbericht |
| Prozessschritt übersprungen | Belegkette unvollständig | gebuchte Belege und Evidence Pack |

### Fehlerdiagnose

| Fehler | Symptom | Ursache | Diagnosepfad | Korrekturweg | Was man nicht tun darf |
|---|---|---|---|---|---|
| falsche Dimension | Bericht zeigt Wert nicht | Pflichtdimension fehlt oder ist falsch | Beleg → Posten → Dimension | Dimension Correction Tool oder fachliche Korrekturbuchung | Bericht manuell überschreiben |
| falsche Buchungsgruppe | falsches Konto oder falsche USt | Stammdaten falsch gepflegt | Stammdatenkarte → Posting Setup → Sachposten | Stammdaten korrigieren, Beleg fachlich stornieren/neubuchen | gebuchte Posten löschen |
| falscher Status | Beleg kann nicht gebucht werden | Freigabe, Lageraktivität oder Pflichtfeld fehlt | Belegstatus → Fehlermeldung → Einrichtung | Status zurücksetzen, Pflichtfeld ergänzen, Prozessschritt nachholen | Warnungen ignorieren |

### Übung

Führe den Fall für `PRODUCTLINE = MACHINE` in der Trainingscompany aus. Dokumentiere Startbeleg, gebuchten Beleg, Posten, Kontrollbericht und eine typische Abweichung.

### Lösungsskizze

1. Öffne `Finanzberichte (Financial Reports)`, `Analyseansichten (Analysis Views)`, `Datenanalysemodus (Data Analysis Mode)` über `Alt+Q`.
2. Erfasse oder filtere den Vorgang für `PRODUCTLINE = MACHINE`.
3. Prüfe Datum, Lagerort, Buchungsgruppen und Dimensionen.
4. Nutze `Buchungsvorschau (Preview Posting)`, wenn eine Buchung erfolgt.
5. Buche oder registriere den Vorgang.
6. Prüfe Sachposten, Nebenbuchposten und `GuV nach Produktlinie`, Analyseansicht, Power-BI-Dataset.
7. Dokumentiere das Evidence Pack.

### UAT-Fall

| Feld | Inhalt |
|---|---|
| ID | `UAT-REP-001` |
| Ziel | Reporting, Controlling und Power BI fachlich abnehmen |
| Rolle | Controller |
| Voraussetzung | Stammdaten, Buchungsgruppen, Dimensionen und Berechtigungen sind eingerichtet |
| Testdaten | `PRODUCTLINE = MACHINE`, Beispielwert `10.000 EUR` |
| Erwartete Posten | Sachposten und passende Nebenbuchposten |
| Kontrollbericht | `GuV nach Produktlinie`, Analyseansicht, Power-BI-Dataset |
| Negativfall | falsche Dimension oder falsche Buchungsgruppe |
| Akzeptanzkriterium | Beleg, Posten, Bericht und Evidence Pack stimmen überein |

### In 5 Minuten merken

* 5 wichtigste Begriffe: Beleg, gebuchter Beleg, Posten, Dimension, Evidence Pack.
* 5 wichtigste Seiten: `Finanzberichte (Financial Reports)`, `Analyseansichten (Analysis Views)`, `Datenanalysemodus (Data Analysis Mode)`, `Sachposten`, passende Nebenbuchposten, Kontrollbericht, gebuchte Belege.
* 3 häufigste Fehler: falsche Stammdaten, falsche Dimension, übersprungener Prozessschritt.
* 3 Prüfungsfallen: Bildschirm ist nicht Buchung, Beleg ist nicht Posten, Bericht ersetzt keine Abstimmung.
* 1 Praxisregel: Erst Beleg verstehen, dann buchen, dann Posten und Bericht prüfen.



## Teil E — Projekt, Architektur und Betrieb

Teil E macht aus Prozesswissen projektfähige Architektur: Fit-Gap, Security, Migration, Integrationen, Betrieb und Solution-Architect-Entscheidungen.

## 26. Fit-Gap und Standard-first Design [Q1][Q2][Q35]

Dieses Kapitel ist die Entscheidungsstelle zwischen Standard, Prozessdesign, Extension und Programmierung. Business Central deckt viele Geschäftsprozesse im Standard ab. Der Standard endet aber dort, wo ein Unternehmen spezielle Automatisierung, Branchenlogik, rechtliche Zusatzanforderungen, Massendatenlogik oder tiefe externe Integration verlangt.

### Vier-Stufen-Modell

| Stufe | Bedeutung | Entscheidung |
|---|---|---|
| **1. Standard direkt** | Prozess ist mit Standardseiten, Standardsetup und Standardbelegen abbildbar. | Kein Add-on. Schulung und Einrichtung reichen. |
| **2. Standard mit Prozessdesign** | Prozess ist möglich, braucht aber klare Rollen, Dimensionen, Workflows, Deferrals oder Evidence Packs. | Kein Code, aber strenges Design. |
| **3. AppSource/Extension** | Standard kann den Prozess nur mühsam oder nicht kontrollsicher automatisieren. | geprüfte Extension evaluieren. |
| **4. Individualprogrammierung** | Keine passende Standardfunktion oder Extension; Wettbewerbsvorteil/Branchenspezifik ist hoch. | AL-Extension mit Spezifikation, Tests und Upgrade-Konzept. |

Praxisregel:
- Erst Standard beweisen, dann Extension prüfen, dann programmieren. Wer sofort programmiert, verliert oft Upgradefähigkeit und Prozessklarheit.

### Standardgrenzen je Prozessbereich

| Prozessbereich | Standard reicht typischerweise für | Grenze des Standards | Typische Lösung |
|---|---|---|---|
| Verkauf/O2C | Angebot, Auftrag, Lieferung, Rechnung, Retoure, Dropshipping | hochautomatisierte Preis-/Rabattlogik, komplexe Portalprozesse, Spezial-EDI | Erweiterung oder Integration |
| Shopify/Onlineshop | Shop-Synchronisation und Auftragsübernahme | Marktplatzmix, Retourenportale, Payment-Reconciliation über viele Provider | Connector/Custom Integration |
| Einkauf/P2P | Bestellung, WE, Eingangsrechnung, Zahlung | OCR, automatischer 3-Way-Match, Vertragsprüfung, Eingangsarchiv | Document Capture / AP-Automation |
| E-Rechnung | E-Documents-Grundlogik | Peppol-Netzwerk, lokale Formate, Massenvalidierung, Lieferanten-Onboarding | E-Document Provider / Extension |
| Inventory | Artikel, Lagerorte, Serien/Chargen, Inventur | mobile Scanner, hochautomatisierte Lagerprozesse, Versanddienstleister | WMS-/Scanner-/Shipping-App |
| Warehouse | Pick, Put-away, Bins, Receipts, Shipments | Funkterminalprozesse, Wegeoptimierung, Packplätze, Gefahrgut | Extension oder Spezial-WMS |
| Manufacturing | BOM, Routing, Fertigungsauftrag, Verbrauch, Output | Feinplanung, MES, Betriebsdatenerfassung, Maschinenanbindung | MES/APS/Custom |
| Projects | Projektaufgaben, Ressourcen, Verbrauch, Faktura | komplexes Vertragsmanagement, Earned Value, Bau-/Anlagenbau-Spezifika | Branchenextension |
| Service | Serviceartikel, Serviceauftrag, Vertrag | Field-Service-Dispatching, mobile Techniker-App, SLA-Automation | Field-Service-App/Custom |
| Miete | Rechnung, Deferral, Anlage/Serviceartikel, Dimension | Verfügbarkeitskalender, Mietpark, automatische Verlängerung, Verbrauchsabrechnung | Rental-Extension |
| Finanzierung | Zahlungsbedingungen, Teilzahlungen, externe Zahlung | Kreditvertrag, Tilgungsplan, Effektivzins, regulatorische Speziallogik | Speziallösung/Custom |
| Finance/Bank | Journale, Zahlungen, Bankabstimmung | EBICS, Zahlungsavise, erweiterte OP-Verarbeitung, Zahlungsverkehr DACH | OPplus/Banking-Extension |
| Anlagen | Standardanlagen und AfA | Anlageninventur, Komponentenansatz, besondere DACH-Funktionen | Finance-/FA-Extension |
| Reporting | Financial Reports, Analyseansichten, Power BI | Management-Konsolidierung, KPI-Cockpits, Data Warehouse | Power BI/Data Platform |
| Intercompany | IC-Dokumente und Journale | konzernweite IC-Automation, Transferpreise, Multi-ERP | Prozessdesign/Custom |

### Entscheidungsmatrix Extension oder Programmierung

| Prüffrage | Wenn Ja | Wenn Nein |
|---|---|---|
| Gibt es eine offizielle BC-Standardfunktion? | Standard konfigurieren und schulen. | AppSource prüfen. |
| Gibt es eine etablierte AppSource-App mit Dokumentation? | Extension evaluieren. | Custom-Konzept prüfen. |
| Ist der Prozess branchenspezifischer Wettbewerbsvorteil? | Custom kann sinnvoll sein. | Standard/Extension bevorzugen. |
| Betrifft der Prozess Steuer, Bank, Archiv oder Massendaten? | Upgrade- und Auditfähigkeit besonders prüfen. | schlankes Custom möglich. |
| Muss der Prozess releasefähig bleiben? | AppSource/Standard bevorzugen. | Custom nur mit Testautomatisierung. |

BC-Best-Practice:
- Jede Extension bekommt vor Einführung eine `EXT-ID`, Zweckbeschreibung, Prozessowner, Datenobjekte, Testfälle, Rollback-Plan und Upgrade-Verantwortlichen.
- Jede Individualprogrammierung bekommt zusätzlich technische Spezifikation, Berechtigungsmodell, Event-/Subscriber-Konzept, Telemetrie und Regressionstest.

### Schulungsübung Standardgrenze

Fall:
- Die RM-SERVICE GmbH will Maschinen vermieten. Kunden sollen online Verfügbarkeit sehen, Mietverträge verlängern, Schäden dokumentieren und Verbrauchsstunden abrechnen.

Aufgabe:
1. Markiere, was im BC-Standard abbildbar ist.
2. Markiere, was mit Prozessdesign möglich ist.
3. Markiere, wo eine Rental-Extension oder Custom-Lösung sinnvoll wird.

Lösungsskizze:
- Standard: Debitor, Artikel/Anlage, Verkaufsrechnung, Deferrals, Dimension `PRODUCTLINE = RENTAL`.
- Prozessdesign: Mietvertrag als Projekt/Servicefall, Evidence Pack, manuelle Verfügbarkeitsprüfung.
- Extension/Custom: Online-Verfügbarkeitskalender, automatische Vertragsverlängerung, Schadensworkflow, nutzungsabhängige Abrechnung.

---

### Qualitätssicherung der Standardentscheidung

Fit-Gap gehört in Teil E, weil hier nicht mehr die Bedienung im Vordergrund steht, sondern die Projektentscheidung. Die Detailprüfung der Buchqualität, der Seitenindex und der vollständige Prozesskatalog stehen in Kapitel 38. Die wiederverwendbaren Projektvorlagen stehen in Kapitel 39.

| Entscheidung | Wo im Buch nachweisen? | Praktischer Nachweis |
|---|---|---|
| Standard reicht | Prozesskapitel 11 bis 25 | Happy Path, Buchungsspur, UAT-Fall |
| Setup reicht | Kapitel 8 bis 10 | Einrichtung, Stammdaten, Buchungsvorschau |
| Extension prüfen | Kapitel 26 und 31 | Fit-Gap, Architekturentscheidung, UAT-Nachweis |
| Custom prüfen | Kapitel 26, 29 und 31 | Integrations-/Custom-Entscheidung, Risiko, Betriebsfolge |
| Projektartefakt erstellen | Kapitel 39 | Fit-Gap-Matrix, Extension-Evaluierung, Architecture Decision Record |

Merksatz:
- Eine Standardgrenze ist erst belegt, wenn der Standardprozess mit Testdaten, Posten, Bericht und UAT-Nachweis wirklich ausprobiert wurde.


## 27. Security, Rollen, SoD und Governance [Q5][Q79]

Business Central lebt nicht nur durch operative Buchungen. Das System bleibt nur stabil, wenn Admins und Superuser Rollen, Rechte, Stammdaten, Jobs, Erweiterungen, Profile, Schnittstellen und Änderungen steuern. Dieses Kapitel trennt Grundeinrichtung und laufenden Betrieb.

### Admin, Superuser und Key User

| Rolle | Aufgabe | Darf nicht passieren |
|---|---|---|
| BC Admin | Umgebung, Benutzer, Rechte, Apps, technische Einstellungen | operative Fachentscheidungen allein treffen |
| Superuser Finance | Konten, Buchungsgruppen, USt, Abschlusslogik fachlich prüfen | Setup ohne Test und Freigabe ändern |
| Key User Verkauf | Vertriebsprozesse testen, Schulung unterstützen | Preise/Steuern ohne Governance ändern |
| Key User Lager | Lagerprozesse und Scanner-/Bin-Logik prüfen | Lagerkorrekturen ohne Ursache buchen |
| Data Owner | Stammdatenqualität verantworten | Dubletten und unklare Nummernkreise zulassen |

Microsoft Learn beschreibt Admin-Aufgaben wie Benutzer, Berechtigungen, UI-Anpassung, Setup Guides, Job Queues, Datenmigration und Troubleshooting. [Q69]

### Grundeinrichtung: Reihenfolge

1. Companies anlegen.
2. Sprache, Region, Währung und Basisdaten prüfen.
3. Kontenplan und Buchungsgruppen einrichten.
4. USt-Logik einrichten.
5. Nummernserien definieren.
6. Dimensionen und Pflichtdimensionen definieren.
7. Lagerorte, Bins und Lagerlogik einrichten.
8. Artikel, Debitoren, Kreditoren, Ressourcen und Anlagen anlegen.
9. Rollenprofile und Permission Sets zuweisen.
10. Workflows, Genehmigungen und Job Queue einrichten.
11. Change Log für kritische Tabellen aktivieren.
12. Beleglayouts und E-Mail-Szenarien prüfen.
13. Schnittstellen und Extensions testen.
14. UAT mit echten End-to-End-Fällen durchführen.
15. Go-Live-Sperren und Startposten abstimmen.

Praxisregel:
- Buchungsgruppen, USt-Setup, Dimensionen und Lagerlogik sind Fundament. Wer sie später unkontrolliert ändert, gefährdet historische Vergleichbarkeit.

### Userverwaltung und Berechtigungen

Microsoft Learn beschreibt, dass Benutzer über Microsoft 365 Admin Center angelegt und in Business Central synchronisiert werden. Berechtigungen werden über Permission Sets und Sicherheitsgruppen gesteuert. [Q70][Q71]

Schrittfolge neuer Mitarbeiter:
1. Microsoft-365-Benutzer anlegen.
2. passende Lizenz zuweisen.
3. Benutzer nach BC synchronisieren.
4. Company-Zugriff prüfen.
5. Permission Sets zuweisen.
6. Rolle/Profile zuweisen.
7. Personalisierung/Bookmarks für Schulung vorbereiten.
8. Testlogin durchführen.
9. Onboarding-Aufgabe aus Kapitel 22 durchführen lassen.

Least-Privilege-Regel:
- Ein Nutzer bekommt nur Rechte, die er für seine Aufgabe braucht. `SUPER` bleibt streng begrenzt. Microsoft beschreibt spezielle Permission Sets wie `SUPER` und deren weitreichende Wirkung. [Q72]

### Laufender Betrieb: Admin-Kalender

| Rhythmus | Aufgabe |
|---|---|
| täglich | Job Queue prüfen, Fehlermeldungen prüfen, Schnittstellenstatus prüfen |
| wöchentlich | neue Nutzer/Rechte prüfen, offene Workflows prüfen, Change Log stichproben |
| monatlich | Periodensperren, Lagerkostenlauf, USt-Abstimmung, GuV-Abstimmung |
| quartalsweise | Berechtigungsreview, Rollenprofile, Extensions, Performance, Schulungsbedarf |
| jährlich | Geschäftsjahr/Accounting Periods, Abschlussprozesse, Archiv-/Aufbewahrung, Notfalltests |

### Superuser-Checklisten

Finance-Superuser:
- USt-Setup nur mit Testfall ändern.
- Buchungsgruppenänderung nur mit Change Request.
- Periodensperren nach Abschluss setzen.
- Financial Reports gegen Sachposten abstimmen.
- Dimension Correction nur mit Begründung und Berechtigung.

Lager-Superuser:
- Lagerortsetup dokumentieren.
- Bins, Pick, Put-away und Inventurprozesse testen.
- Item Tracking pflegen.
- Negative Bestände überwachen.
- Kostenregulierung mit Finance abstimmen.

Vertriebs-Superuser:
- Preislisten testen.
- Shop-/BC-Mapping prüfen.
- Retourenursachen auswerten.
- Kundengruppen und Zahlungsbedingungen prüfen.

### Stolpersteine im Admin-Bereich

| Fehler | Auswirkung | Lösung |
|---|---|---|
| zu viele Nutzer mit `SUPER` | Setup und Daten gefährdet | Adminrechte begrenzen und reviewen |
| keine Testcompany | Änderungen treffen Produktion | Sandbox/Testcompany verpflichtend |
| keine Pflichtdimensionen | Reporting bricht | Default Dimensions und Value Posting pflegen |
| Job Queue unbeobachtet | Kosten, E-Mails, Schnittstellen laufen nicht | Monitoring und Verantwortliche |
| Extensions unkontrolliert installiert | Prozesse ändern sich unerkannt | AppSource-Prozess mit Test und Freigabe |
| Rollenprofile nicht gepflegt | Nutzer finden Seiten nicht | Profile zentral anpassen |
| Change Log fehlt | Änderungen nicht prüfbar | kritische Tabellen definieren |

Merksatz:
- Operative Exzellenz entsteht nicht im Auftrag. Sie entsteht in sauberer Einrichtung, stabilen Rollen und kontrolliertem Betrieb.

---

### Genehmigungen, Kontrollen, SoD und Prozesssicherheit

Genehmigungen schützen Business Central vor unkontrollierten Stammdaten, Preisen, Bestellungen und Zahlungen. Sie ersetzen kein Vertrauen. Sie sorgen dafür, dass kritische Entscheidungen nachvollziehbar und prüfbar bleiben.

### Was genehmigt werden sollte

| Objekt | Warum? | Beispielregel |
|---|---|---|
| neuer Debitor | Kreditrisiko, USt, Stammdatenqualität | Finance prüft vor erster Rechnung |
| neuer Kreditor | Betrugsrisiko, Bankdaten | Vier-Augen-Prüfung der IBAN |
| Einkaufsbestellung | Budget und Bedarf | ab `5.000 EUR` Genehmigung Einkaufsleitung |
| Verkaufspreisänderung | Marge und Vertragsbindung | Freigabe durch Vertriebsleitung |
| Zahlungslauf | Liquidität und Betrugsprävention | Finance-Leitung genehmigt |
| USt-Setup | steuerliches Risiko | nur Steuerverantwortliche plus Admin |
| Buchungsgruppe | Hauptbuchwirkung | Change Request zwingend |

Microsoft Learn beschreibt Genehmigungsworkflows, mit denen Datensätze oder Dokumente zur Genehmigung gesendet, genehmigt oder abgelehnt werden können. [Q79]

### Schrittfolge Einkaufsbestellung genehmigen

1. Admin öffnet `Workflows`.
2. Workflow-Vorlage für Einkaufsbestellgenehmigung auswählen.
3. Genehmigergruppe definieren.
4. Betragsschwelle festlegen.
5. Benachrichtigung/E-Mail prüfen.
6. Workflow aktivieren.
7. Einkäufer erstellt `Einkaufsbestellung (Purchase Order)`.
8. Einkäufer wählt `Genehmigungsanforderung senden`.
9. Genehmiger prüft Preis, Lieferant, Budget, Dimension.
10. Genehmiger wählt `Genehmigen` oder `Ablehnen`.
11. Nach Genehmigung wird Bestellung freigegeben.

### SoD-Matrix (Segregation of Duties)

| Kombination | Risiko | Empfehlung |
|---|---|---|
| Kreditor anlegen + Zahlung freigeben | Zahlungsbetrug | trennen |
| Bankdaten ändern + Zahlungslauf buchen | Manipulation | Vier-Augen-Prüfung |
| USt-Setup ändern + UStVA melden | Steuerfehler | Steuerrolle trennen |
| Preis ändern + Auftrag buchen | Margenmanipulation | Preisfreigabe |
| Lagerbestand korrigieren + Inventur genehmigen | Bestandsverschleierung | Lagerleitung prüft |
| Berechtigungen vergeben + operative Buchung | Adminmissbrauch | Adminrechte begrenzen |

Merksatz:
- Gute Berechtigungen verhindern nicht jede Fehlbuchung. Gute Berechtigungen verhindern, dass eine Person kritische Fehler allein erzeugen und verdecken kann.

---


## 28. Migration, Opening Balances und Cutover [Q69][Q80]

Business Central ist nur so gut wie seine Stammdaten. Falsche Debitoren, Kreditoren, Artikel, Buchungsgruppen oder Dimensionen erzeugen falsche Buchungen, schlechte Berichte und unnötige Korrekturen.

### Stammdaten-Governance

| Stammdatenobjekt | Data Owner | Pflichtprüfung |
|---|---|---|
| Debitor | Vertrieb + Finance | Adresse, USt-ID, Zahlungsbedingung, Buchungsgruppe |
| Kreditor | Einkauf + Finance | Bankdaten, USt, Zahlungsbedingung, Buchungsgruppe |
| Artikel | Stammdaten-Team | Einheit, Kostenmethode, Buchungsgruppen, Lagerlogik |
| Sachkonto | Finance | Direktbuchung, Kategorie, Abschlusslogik |
| Dimension | Controlling | Pflichtwert, erlaubte Werte, Berichtsnutzen |
| Ressource | Projekt/Service | Kosten, Preis, Einheit |
| Anlage | Finance | Anlagenbuchungsgruppe, AfA-Buch |

### Migrationslogik

Microsoft Learn beschreibt Konfigurationspakete als Werkzeug, um Tabellen und Daten für Einrichtung und Migration zu nutzen. [Q80]

Schrittfolge:
1. Datenobjekte festlegen.
2. Datenowner je Objekt benennen.
3. Altbestand exportieren.
4. Dubletten bereinigen.
5. Pflichtfelder definieren.
6. Buchungsgruppen und Dimensionen mappen.
7. Testimport über `Konfigurationspakete (Configuration Packages)`.
8. Fehlerliste bereinigen.
9. Testbuchung mit migrierten Daten durchführen.
10. Produktivimport freigeben.

Stolpersteine:

| Fehler | Wirkung | Lösung |
|---|---|---|
| Debitor ohne USt-Logik | falsche Rechnung | Pflichtfeldprüfung |
| Artikel ohne Kostenmethode | falsche Lagerbewertung | Artikelvorlagen |
| Dimensionen nicht gemappt | Reporting leer | Migrationsmapping |
| alte Dubletten übernommen | OP und Auswertungen unsauber | Dublettenbereinigung |
| Bankdaten ungeprüft | Zahlungsrisiko | Vier-Augen-Freigabe |

Merksatz:
- Migration ist kein technischer Import. Migration ist fachliche Datenqualität mit technischem Werkzeug.

---


## 29. Integrationen [Q35][Q36][Q37][Q38][Q39][Q40][Q41][Q42]

Dieses Kapitel ist kein Produktkatalog und keine Kaufempfehlung. Es zeigt, welche Extension-Klassen in DACH-Projekten häufig geprüft werden, warum sie helfen und wie sie grundsätzlich in Business Central eingeführt werden. Die konkrete Auswahl hängt von Lizenz, Land, Prozessreife, Datenschutz, GoBD-Anforderung und Partnerkompetenz ab.

### AppSource-Grundlogik

Standard laut Quelle:
- Business Central kann AppSource-Apps über die Seite `Microsoft AppSource Apps` suchen und verwalten. Dort lassen sich Apps nach Name, Publisher, Installationsstatus, Popularität, Bewertung und Änderungsdatum filtern. [Q35]

Einrichtungslogik:
1. Prozesslücke dokumentieren.
2. AppSource und Herstellerdokumentation prüfen.
3. Testcompany verwenden.
4. Extension installieren.
5. Assisted Setup oder Setup-Seiten ausführen.
6. Berechtigungen und Role Center prüfen.
7. Stammdaten/Mapping konfigurieren.
8. UAT mit Happy Path und Abweichungen durchführen.
9. GoBD-/DSGVO-/Archivwirkung dokumentieren.
10. Produktivsetzung mit Rollback- und Supportpfad freigeben.

### Extension-Klassen

| Klasse | Typischer Bedarf | Beispiel-Extensions | Was sie bringen |
|---|---|---|---|
| AP Automation / Document Capture | Eingangsrechnungen, OCR, Freigabe, Archiv | Continia Document Capture | Import, OCR, Registrierung, Approval, Order Matching, Archiv |
| Expense Management | Reisekosten, Belege, Firmenkarten, Genehmigung | Continia Expense Management | mobile Belegerfassung, Expense Reports, Mileage, Per Diem, Approval |
| Banking / OP-Verarbeitung | Zahlungsverkehr, Bankauszüge, Zahlungsavise | Continia OPplus | Zahlungs-/Bankfunktionen, OP-Komfort, Raten, erweiterte Auswertungen |
| E-Documents / Peppol | E-Rechnung und Netzwerkanbindung | E-Document Provider, Continia eDocuments | Versand/Empfang strukturierter Dokumente |
| Anzahlungen | Projekt-/Bau-/Maschinenbau-Anzahlungen | COSMO Advance Payment | Anzahlungsanforderungen, Anzahlungsrechnungen, Schlussrechnung |
| DATEV/Steuerberater | Übergabe an Kanzlei | DATEV-Extensions, Partnerlösungen | Buchungs-/Belegübergabe, Konten-/Steuerberaterprozess |
| Shipping / Carrier | Versandlabels, Tracking, Packplatz | Shipping-Apps | Label, Carrier, Tracking, Versandstatus |
| WMS / Scanner | mobiles Lager, Barcode, Packplatz | Scanner-/WMS-Apps | mobile Datenerfassung, Lagerqualität |
| Rental / Subscription | Mietpark, wiederkehrende Abrechnung | Rental-/Subscription-Apps | Vertragslogik, Verfügbarkeit, Verlängerung |
| Reporting / BI | Management Reporting, Data Warehouse | Power BI/Data-Apps | KPIs, Dashboards, Datenmodell |

### Continia Document Capture (Klasse: AP Automation) [Q36][Q37]

Use Case:
- Die RM-SHARED GmbH verarbeitet monatlich `2.500` Eingangsrechnungen. BC Standard kann Purchase Invoices und Incoming Documents verarbeiten. Die Grenze liegt bei OCR, automatischem Abgleich, Genehmigungsrouting und revisionsnaher Dokumentenverarbeitung in Masse.

Nutzen:
- Import und OCR-Verarbeitung von Eingangsrechnungen.
- Registrierung und Weiterleitung in Genehmigungsflüsse.
- Order Matching gegen Bestellungen und Wareneingänge.
- Archivierung und Nachvollziehbarkeit des Rechnungsprozesses.

Einrichtungslogik:
1. App in Testcompany installieren.
2. Assisted Setup starten.
3. Kreditoren, Templates, Dokumentkategorien und Freigaben konfigurieren.
4. Purchase Order Matching testen.
5. E-Rechnung/XML und PDF-Verarbeitung testen.
6. Evidence Pack und Archivzugriff dokumentieren.

BC-Best-Practice:
- Document Capture ersetzt nicht den fachlichen P2P-Prozess. Es automatisiert Eingang, Erkennung, Matching, Approval und Archivierung. Der fachliche 3-Way-Match bleibt Prozesspflicht.

### Continia Expense Management (Klasse: Travel & Expense) [Q38][Q39]

Use Case:
- Servicetechniker und Projektleiter reichen Hotel, Fahrtkosten, Bewirtung und Kilometer ein. BC Standard kann Sachkonten und Kreditoren buchen, bildet aber mobile Belegerfassung, Genehmigung und Firmenkartenabgleich nicht komfortabel vollständig ab.

Nutzen:
- Mobile Belegerfassung.
- Expense Reports, Kilometer und Pauschalen.
- Genehmigungsflows.
- Buchung auf Sachkonten, Dimensionen und ggf. Projekte.

Einrichtungslogik:
1. App installieren und aktivieren.
2. Expense User, Genehmiger und Dimensionen einrichten.
3. Ausgabenkategorien auf Sachkonten mappen.
4. Firmenkartenimport testen.
5. Projekt- und Service-Dimensionen prüfen.

Schulungsfall:
- Techniker bucht Hotel `180 EUR`, Kilometer `220 km`, Parken `18 EUR`. Manager genehmigt. Finance prüft Buchung auf Projekt `PROJ-5001`.

### Continia OPplus (Klasse: Banking/Payments/Finance) [Q40][Q41]

Use Case:
- Die RM-SALES GmbH hat viele Zahlungseingänge, Zahlungsavise, Ratenzahlungen und Bankdateien. BC Standard kann Zahlungen und Bankabstimmung verarbeiten. Die Grenze liegt bei DACH-Komfort, Massenzahlungen, erweiterten OP-Funktionen und Spezialfällen.

Nutzen:
- Unterstützung wichtiger Finanzbuchhaltungsaufgaben.
- Komfort bei eingehenden und ausgehenden Zahlungen.
- Module wie Multiple Payments, Installments, Extended Fixed Assets und Extended Analysis laut Herstellerdokumentation.

Einrichtungslogik:
1. OPplus aktivieren.
2. Module auswählen.
3. Bank- und Zahlungsparameter konfigurieren.
4. Berechtigungen setzen.
5. Zahlungsimport, Avis und Ratenfall testen.

Best Practice:
- OPplus nicht als „mehr Finance“ einführen, sondern für konkrete Schmerzpunkte: Zahlungsavise, Massenausgleich, Raten, Bankformate, OP-Transparenz.

### COSMO Advance Payment (Klasse: Anzahlungen) [Q42]

Use Case:
- Maschinenbau und Projektgeschäft verlangen Anzahlungen: `30 %` bei Auftrag, `40 %` bei Meilenstein, `30 %` bei Abnahme. BC Standard kennt Vorauszahlungen, aber komplexe Anzahlungslogik in Bau-/Projekt-/Maschinenbauprozessen kann mehr Struktur brauchen.

Nutzen:
- strukturierte Anzahlungsprozesse.
- bessere Abbildung von Anzahlungsanforderungen und Schlussrechnungen.
- Unterstützung projekt- oder auftragsnaher Anzahlungslogik.

Einrichtungslogik:
1. AppSource/Herstellerinstallation prüfen.
2. Anzahlungsarten definieren.
3. Konten und Steuerlogik mappen.
4. Verkaufsauftrag mit Anzahlungsplan testen.
5. Schlussrechnung und USt-Abstimmung prüfen.

Prüfungsfalle:
- Anzahlungslogik ist steuerlich sensibel. Extension-Komfort ersetzt nicht die Prüfung von Steuerentstehung, Rechnungstext, USt-Ausweis und Schlussrechnungslogik.

### DATEV-/Steuerberater-Übergabe (Klasse: DACH Accounting)

Use Case:
- Die RM-SHARED GmbH will Monatsdaten, Belege und Buchungen an den Steuerberater übergeben. BC Standard kann Daten exportieren und Reports liefern. DACH-Projekte verlangen häufig standardisierte Kanzleiübergaben, Kontenmapping und Belegverknüpfung.

Nutzen:
- strukturierter Export.
- weniger manuelle Überleitung.
- bessere Abstimmung mit Steuerberaterprozessen.

Einrichtungslogik:
1. Zielprozess klären: Buchungsstapel, Belegbilder, Stammdaten, Salden oder vollständige Prüfungsexporte?
2. Kontenrahmen und Steuerkennzeichen mappen.
3. Testmonat exportieren.
4. Import beim Steuerberater validieren.
5. Fehlerliste und Monatsroutine dokumentieren.

Hinweis:
- Konkrete DATEV-Lösung und Hersteller hängen stark von Partner, Land, Kontenrahmen und Prozess ab. Deshalb wird im Buch nur die Prozessklasse beschrieben und nicht eine einzelne Lösung als Standard gesetzt.

### Wann Individualprogrammierung sinnvoll ist

Individualprogrammierung ist sinnvoll, wenn mindestens einer dieser Punkte erfüllt ist:

| Kriterium | Beispiel |
|---|---|
| kein passender Standard und keine passende Extension | Spezialmietpark mit IoT-Verbrauchsdaten |
| Wettbewerbsvorteil | eigener Konfigurator für Sondermaschinen |
| tiefe Integration | Maschinen-/MES-Daten in Fertigungsrückmeldung |
| klare stabile Regel | automatischer TaxScenario-Validator |
| hoher Volumenprozess | Massenerzeugung projektspezifischer Serviceaufträge |

Mindestanforderungen:
- Fachkonzept.
- Datenmodell.
- Berechtigungskonzept.
- Testfälle.
- Upgrade-Konzept.
- Telemetrie und Fehlerlogging.
- Dokumentation im Evidence Pack.

### Schulungsübung Extension-Auswahl

Fall:
- Die RM-SHARED GmbH hat `2.500` Eingangsrechnungen pro Monat, `180` Reisekostenabrechnungen, `4` Banken, viele Zahlungsavise und Maschinenbau-Anzahlungen.

Aufgabe:
1. Ordne jeden Schmerzpunkt einer Extension-Klasse zu.
2. Entscheide, ob Standard, Extension oder Custom die Startlösung ist.
3. Definiere je Klasse einen UAT-Test.

Lösungsskizze:
- Eingangsrechnungen: Document Capture/AP Automation.
- Reisekosten: Expense Management.
- Banken/Zahlungsavise: OPplus/Banking.
- Anzahlungen: COSMO Advance Payment oder Standard-Vorauszahlung plus Prozessdesign.
- Custom nur, wenn die Extension den spezifischen Prozess nicht abdeckt.

---


## 30. Betrieb, Monitoring und Hypercare [Q32][Q69][Q81][Q82][Q83]

Nach dem Go-Live beginnt die eigentliche Bewährungsprobe. Business Central muss überwacht, erklärt, korrigiert und stabilisiert werden. Hypercare ist die Phase, in der kleine Fehler noch schnell sichtbar werden, bevor sie Monatsabschluss oder Tagesgeschäft gefährden.

### Hypercare-Plan

| Zeitraum | Fokus | tägliche Fragen |
|---|---|---|
| Woche 1 | Buchungen möglich? | Können Verkauf, Einkauf, Lager, Finance buchen? |
| Woche 2 | Fehlerhäufung | Wo entstehen die meisten Tickets? |
| Woche 3 | Reporting | Stimmen OP, Lagerwert, GuV, USt? |
| Woche 4 | Stabilisierung | Welche Workarounds müssen in echte Prozesse überführt werden? |
| Monat 2 | Optimierung | Welche Rollen, Felder, Filter, Berichte fehlen? |

### Monitoring-Matrix

| Objekt | Deutsche Seite | Was prüfen? |
|---|---|---|
| Aufgabenwarteschlange | `Aufgabenwarteschlangenposten (Job Queue Entries)` | Fehler, letzte Ausführung, nächste Ausführung |
| E-Mail | `E-Mail-Ausgang (Email Outbox)` | fehlgeschlagene Sendungen |
| Änderungsprotokoll | `Änderungsprotokollposten (Change Log Entries)` | kritische Setupänderungen |
| Workflows | `Workflows`, `Genehmigungsanforderungen` | hängende Freigaben |
| Benutzer | `Benutzer (Users)` | falsche Rollen/Rechte |
| Telemetrie | Application Insights / Power BI Apps | Fehler, Nutzung, Performance |

Microsoft Learn beschreibt Telemetrie als Möglichkeit, Aktivitäten und Zustand von Umgebungen und Apps zu analysieren. [Q81]

### Performance und Support

Microsoft Learn empfiehlt für Performanceprobleme, Telemetrie und Application Insights zu nutzen, um Ursachen systematisch zu untersuchen. [Q83]

Prüfpfad:
1. Problem konkretisieren: Seite, Nutzer, Uhrzeit, Company, Aktion.
2. Prüfen, ob alle Nutzer betroffen sind.
3. Prüfen, ob Job Queue oder Integration parallel läuft.
4. Telemetrie prüfen.
5. Browser/Client/Netzwerk ausschließen.
6. Extension-Verdacht prüfen.
7. Microsoft/Partner-Support mit Belegpaket einbinden.

Evidence Pack Support:
- Screenshot der Fehlermeldung.
- Uhrzeit mit Zeitzone.
- Benutzer und Company.
- betroffene Seite.
- Reproduktionsschritte.
- letzte Setup-/Extension-Änderung.
- Telemetriehinweis.

Merksatz:
- „BC ist langsam“ ist kein Fehlerbild. Ein gutes Fehlerbild nennt Seite, Aktion, Uhrzeit, Nutzer, Company und Wiederholbarkeit.

---


## 31. Business Central Solution Architect Pfad

Dieses Kapitel vermittelt, wie ein Business Central Solution Architect Standardlösungen entwirft, bewertet, dokumentiert, testet und projektfähig macht. Es ist kein AL-Developer-Handbuch. Es ist Architektur auf Basis von Business Central Standard, Setup, Prozessdesign, Datenmodell, Sicherheit, Integrationen, Migration, UAT, Betrieb und Erweiterungsentscheidungen.

### Rolle und Denkweise

Ein BC Solution Architect sorgt dafür, dass fachliche Anforderungen mit Standardfunktionen, Setup, Prozessdesign, Erweiterungen und Integrationen tragfähig umgesetzt werden. Er schützt Upgradefähigkeit, Datenqualität, Nachweisfähigkeit und Bedienbarkeit.

### Architektur-Kompetenzmatrix

| Architekturkompetenz | BC-Standardthema | Buchkapitel | Praxisfall | Entscheidungskriterium | Nachweis |
|---|---|---|---|---|---|
| Requirements | Prozessaufnahme und Zielbild | 3, 26, 38, 39 | Maschinenverkauf | fachlicher Nutzen | Fit-Gap-Matrix |
| Fit-Gap | Standard vs. Lücke | 26 und 31 | Mietmodell | Standardfähigkeit | Fit-Gap-Protokoll |
| Solution Blueprint | Prozessarchitektur | 11 bis 25, 31, 38 | Greenfield-Durchspiel | E2E-Abdeckung | Blueprint und Prozesskatalog |
| Company-Architektur | Mandanten/Companies | 3 und 6 | RM-Gruppe | rechtlich/prozessual | Company-Konzept |
| Intercompany | IC-Flüsse | 18 und 31 | RM-PROD an RM-SALES | Gegenbelege | IC-Abstimmung |
| Datenqualität | Stammdaten | 7, 28 und 39 | Artikel/Debitor | Pflichtfelder | Data Owner Matrix |
| Nummernserien | Beleglogik | 8 | Verkaufs- und Einkaufsbelege | Nachvollziehbarkeit | Nummernserienkonzept |
| Dimensionen | Reporting | 10, 25 und 38 | GuV nach Produktlinie | Steuerungsnutzen | Dimensionskonzept |
| Posting/VAT | Kontenfindung | 9, 22 und 38 | USt-Fall | korrekte Buchung | Posting-Matrix |
| Security | Rollen/SoD | 27 und 39 | Zahlungslauf | Risikotrennung | Rollenmatrix |
| Workflow | Genehmigung | 8 und 27 | Einkaufsfreigabe | Kontrollbedarf | Workflow-Test |
| Integration | APIs, Microsoft 365, Power Platform | 17, 29, 31 und 35 | Shopify/Power BI | Standardconnector | Integrationsdesign |
| Migration | Opening Balances | 28 | Startsaldo | Abstimmung | Migrationsprotokoll |
| Testing | UAT/Regression | 32, 33 und 39 | Master-UAT | Akzeptanz | Testprotokoll |
| Go-live | Cutover | 28, 30 und 39 | Produktivstart | Bereitschaft | Cutover-Plan |
| Betrieb | Job Queue/Telemetry | 30 und 31 | Hypercare | Stabilität | Monitoring-Log |
| Extension | AppSource/Custom | 26, 29 und 31 | Rental/WMS/OCR | TCO/Upgrade | Architecture Decision Record |

### Architekturentscheidung

| Feld | Leitfrage |
|---|---|
| Standardlösung | Welche BC-Standardfunktion erfüllt den Kernbedarf? |
| Setup-Option | Welche Einrichtung entscheidet über das Verhalten? |
| Prozessdesign | Welche Rollen, Freigaben und Nachweise braucht der Prozess? |
| Extension-Kandidat | Welche AppSource-Lösung passt, wenn Standard nicht reicht? |
| Custom nur wenn | Welche Anforderung ist weder Standard noch Extension-fähig? |
| Risiken | Welche Steuer-, GoBD-, Security-, Performance- oder Upgrade-Risiken entstehen? |
| UAT-Nachweis | Welcher Test beweist die Entscheidung? |
| Betriebsfolge | Was muss im laufenden Betrieb überwacht werden? |
| Empfehlung | Standard, Extension, Custom oder Prozessänderung? |

### Mini-Cases mit Lösung

Fall 1: Mietmodell.
- Standardlösung: Verkaufsrechnung, wiederkehrende Erlöse, Abgrenzung.
- Lücke: Objektverwaltung, Rückgabe, Laufzeitänderung, Zustand.
- Empfehlung: Standard für Training, Rental-Extension für produktive Mietverwaltung.

Fall 2: OCR-Eingangsrechnung.
- Standardlösung: Einkaufsrechnung und E-Documents.
- Lücke: OCR, Match-Automation, Freigabestrecke mit Belegbild.
- Empfehlung: AP-Automation-Extension.

Fall 3: Power BI Controlling.
- Standardlösung: Finanzberichte und Analysemodus.
- Lücke: Management-Cockpit über mehrere Companies.
- Empfehlung: Power BI Datenmodell mit Dimensionen und kontrollierter Datenquelle.

---



## Teil F — Training, Prüfung und Nachschlagen

Teil F enthält Testbibliothek, Lösungen, MB-800-Abdeckung, Lernpfade, Glossar, Seitenindex, Projektartefakte und Quellen.

## 32. UAT-Testbibliothek

### Master-UAT

| ID | Prozess | Fall | Rolle | Erwarteter Nachweis |
|---|---|---|---|---|
| UAT-001 | Foundation | Pflichtdimension blockiert Buchung | Stammdaten-Team | Fehlermeldung + korrigierte Buchung |
| UAT-002 | Sales | B2B-Verkauf Maschine | Vertrieb | Sales Invoice + Customer Ledger |
| UAT-003 | Sales | Retoure mit Gutschrift | Vertrieb/Finance | Credit Memo + VAT Entry |
| UAT-004 | Shopify | Webshop-Auftrag | E-Commerce | Shop-ID + Sales Order |
| UAT-005 | Dropshipping | Direktlieferung | Vertrieb/Einkauf | verknüpfte Sales/Purchase Belege |
| UAT-006 | Purchasing | Teil-WE | Einkauf/Lager | offene Restmenge |
| UAT-007 | P2P | E-Rechnung | Kreditorenbuchhaltung | XML + Buchungsbezug |
| UAT-008 | Warehouse | Put-away/Pick | Lager | Warehouse Entries |
| UAT-009 | Inventory | Inventurdifferenz | Lagerleitung | Item/Value Entries |
| UAT-010 | Planning | MRP-Vorschlag | Produktionsplanung | Planning Worksheet Lines |
| UAT-011 | Manufacturing | Mehrverbrauch | Meister/Controlling | Fertigungsabweichung |
| UAT-012 | Assembly | Wartungskit montieren | Lager/Service | Assembly Order |
| UAT-013 | Service | Garantieauftrag | Service | Kosten ohne Erlös/Kulanznachweis |
| UAT-014 | Rental | Monatsmiete | Service/Finance | Rechnung + Abgrenzungslogik |
| UAT-015 | Project | Meilensteinrechnung | Projektleitung | Project Ledger + Sales Invoice |
| UAT-016 | Bank | Teilzahlung | Debitorenbuchhaltung | Restposten |
| UAT-017 | Fixed Assets | Zugang + AfA | Anlagenbuchhaltung | FA Ledger Entries |
| UAT-018 | VAT | EU-Lieferung | Steuerverantwortliche | USt-IdNr./VAT Entry/ZM-Logik |
| UAT-019 | Intercompany | IC-Verkauf | Finance | Gegenbeleg + Abstimmung |
| UAT-020 | Reporting | Financial Report | Controlling | Bericht nach Dimension |

### Abweichungsmatrix

| Abweichung | Betroffene Prozesse | Diagnosepfad |
|---|---|---|
| falsche USt-Gruppe | Sales, Purchase, VAT | Beleg → VAT Entry → VAT Posting Setup → Stammdaten |
| falscher Lagerort | Sales, Purchase, Warehouse | Belegzeile → Item Ledger Entry → Location |
| fehlende Dimension | alle Buchungen | G/L Entry → Dimension Set |
| nicht ausgeglichener OP | Sales/Purchase/Bank | Customer/Vendor Ledger Entry → Detailed Entries |
| Bestand stimmt nicht | Inventory/Warehouse | Item Ledger Entry → Warehouse Entry → Physische Zählung |
| Fertigungskosten falsch | Manufacturing | Production Order → Consumption/Output → Value Entries |
| Projekt nicht fakturiert | Projects | Project Ledger Entries → Planning Lines → Sales Invoice |
| IC nicht abgestimmt | Intercompany/R2R | IC Inbox/Outbox → Customer/Vendor Ledger |

> Abschluss-Merksatz: Business Central ist vollständig verstanden, wenn der Leser denselben Geschäftsvorfall aus Sicht des Mitarbeiters, des Belegs, der Buchung, der Steuer und des Nachweises erklären kann.

---


## 33. Übungen und Lösungen

Dieses Kapitel bündelt die Trainingspfade. Jede Schulung nutzt dieselbe Datenwelt.

### Einkaufsschulung

Ziel:
- Einkäufer kann Lieferanten, Bestellung, Wareneingang, Eingangsrechnung und Abweichung verstehen.

Übung:
1. Bestellung `PO-2001` für `RAW-STEEL` anlegen.
2. Wareneingang im gesteuerten Lager buchen.
3. Rechnung mit Preisabweichung erfassen.
4. Abweichung freigeben und buchen.

Kontrollfrage:
- Warum ist der Wareneingang fachlich nicht dasselbe wie die Eingangsrechnung?

### Verkaufsschulung

Übung:
1. Angebot an D10000 erstellen.
2. Auftrag erzeugen.
3. Lieferung aus gesteuertem Lager anstoßen.
4. Rechnung buchen.
5. Zahlung ausgleichen.

Kontrollfrage:
- Welche Entries beweisen, dass Umsatz, Forderung und Steuer entstanden sind?

### Lagerschulung einfaches Lager

Übung:
- Kaufe `SP-PUMP-01` nach `MZ-EINFACH`, verkaufe 2 Stück, buche Inventurdifferenz 1 Stück.

Kontrollfrage:
- Warum ist das einfache Lager schneller, aber weniger prozessgeführt?

### Lagerschulung gesteuertes Lager

Übung:
- Warehouse Receipt, Put-away, Pick und Shipment für `FRA-ZL` durchspielen.

Kontrollfrage:
- Welche Dokumente entstehen zusätzlich gegenüber einfachem Lager?

### Fertigungsschulung

Übung:
- Fertigungsauftrag `PROD-3001` erstellen, Verbrauch buchen, Output melden, Abweichung analysieren.

Kontrollfrage:
- Warum braucht Fertigung sowohl Mengen- als auch Wertposten?

### Serviceschulung

Übung:
- Serviceauftrag `SERV-4001` mit Garantieentscheidung und Ersatzteilverbrauch buchen.

Kontrollfrage:
- Wann entsteht Erlös, wann nur Aufwand?

### Projektschulung

Übung:
- Projekt `PROJ-5001` mit Ressourcen, Material, Fremdleistung und Meilensteinrechnung abbilden.

Kontrollfrage:
- Was ist der Unterschied zwischen Projektverbrauch und Projektfaktura?

### Buchhaltungsschulung

Übung:
- Zahlungslauf, Bankabstimmung, USt-Abstimmung, Anlagen-AfA und Periodensperre durchführen.

Kontrollfrage:
- Warum ist die SUSA ohne Nebenbuchabstimmung nicht ausreichend?

### Admin-/Stammdatenschulung

Übung:
- Benutzerrolle anlegen, Permission Set zuweisen, Change Log aktivieren, Nummernserie prüfen.

Kontrollfrage:
- Warum ist Berechtigung keine rein technische Aufgabe?

### Abschluss- und Reporting-Schulung

Übung:
- Monatsabschluss für März `2026` durchführen: Debitoren, Kreditoren, Bank, Lager, Anlagen, USt, Financial Report.

Kontrollfrage:
- Welche Nachweise gehören in das Abschluss-Evidence-Pack?

---

### Lösungsanhang zu Übungen und UAT-Fällen

Dieses Kapitel enthält die Lösungsschicht zu den Übungen. Jede Übung wird entweder direkt im Kapitel oder hier im Lösungsanhang beantwortet. Die Lösung beschreibt nicht nur das Ergebnis, sondern auch den Weg in der deutschen Business-Central-Oberfläche.

### Lösungsmuster für jede Übung

Jede Lösung folgt diesem Schema:

1. **Startseite:** Welche deutsche BC-Seite wird geöffnet?
2. **Stammdaten:** Welche Daten müssen vorhanden sein?
3. **Eingabe:** Welche Felder werden gepflegt?
4. **Buchung:** Welche Aktion wird ausgeführt?
5. **Posten:** Welche Posten entstehen?
6. **Kontrolle:** Welcher Bericht oder welche Liste beweist das Ergebnis?
7. **Fehlerfall:** Was wäre typisch falsch?
8. **Korrektur:** Wie wird fachlich sauber korrigiert?

### Lösung: Foundation und Pflichtdimension

Aufgabe:
- Lege Dimension `CHANNEL` mit Wert `B2B` an und erzwinge sie für ein Erlöskonto.

Lösung:
1. Öffne `Dimensionen (Dimensions)`.
2. Lege Dimension `CHANNEL` an.
3. Öffne `Dimensionswerte (Dimension Values)`.
4. Lege Wert `B2B` an.
5. Öffne `Kontenplan (Chart of Accounts)`.
6. Wähle das Erlöskonto für Maschinenverkauf.
7. Öffne `Standarddimensionen (Default Dimensions)`.
8. Setze `CHANNEL` mit Wertbuchung `Code erforderlich`.
9. Erstelle eine Testbuchung ohne `CHANNEL`.
10. Erwartung: BC blockiert die Buchung.
11. Ergänze `CHANNEL = B2B`.
12. Buche erneut.
13. Prüfe `Sachposten (G/L Entries)` mit Dimension `CHANNEL`.

### Lösung: Verkauf O2C mit Lagerartikel

Aufgabe:
- Verkaufe `10` Stück `SP-PUMP-01` an D10000.

Lösung:
1. Öffne `Verkaufsaufträge (Sales Orders)`.
2. Wähle `Neu`.
3. Debitor `D10000` eintragen.
4. Buchungsdatum und Belegdatum prüfen.
5. Zeile `Artikel`, Nr. `SP-PUMP-01`, Menge `10` eintragen.
6. Lagerort `FRA-ZL` oder `MZ-EINFACH` setzen.
7. Preis prüfen: bei D10000 ab 10 Stück erwarteter Preis `285 EUR`.
8. Dimension `PRODUCTLINE = SPARE`, `CHANNEL = B2B` prüfen.
9. Bei einfachem Lager `Buchen` → `Liefern und fakturieren`.
10. Bei gesteuertem Lager zuerst Lagerkommissionierung durchführen.
11. Öffne `Gebuchte Verkaufsrechnungen`.
12. Prüfe `Debitorenposten`: Forderung.
13. Prüfe `Sachposten`: Forderung, Erlös, USt, Wareneinsatz, Bestand.
14. Prüfe `Artikelposten`: Mengenabgang.
15. Prüfe `Wertposten`: Kostenabgang.

Typischer Fehler:
- falscher Lagerort. Korrektur erfolgt nicht durch Löschen gebuchter Posten, sondern über Gutschrift, Neubuchung oder Lagerkorrektur nach Freigabe.

### Lösung: Einkauf P2P mit Wareneingang und Rechnung

Aufgabe:
- Kaufe `RAW-STEEL` bei K10000, buche Wareneingang und Eingangsrechnung.

Lösung:
1. Öffne `Einkaufsbestellungen (Purchase Orders)`.
2. Neue Bestellung für Kreditor `K10000`.
3. Zeile `Artikel`, Nr. `RAW-STEEL`, Menge `10`.
4. Einkaufspreis, Einheit, Lieferdatum und Lagerort prüfen.
5. Bei einfachem Lager `Buchen` → `Empfangen`.
6. Bei gesteuertem Lager `Lagereingänge (Warehouse Receipts)` öffnen, Quelldokument holen, Wareneingang buchen und Einlagerung registrieren.
7. Eingangsrechnung aus Bestellung buchen.
8. Prüfe `Kreditorenposten`: Verbindlichkeit.
9. Prüfe `Artikelposten`: Mengenzugang.
10. Prüfe `Wertposten`: Wertzugang.
11. Prüfe `Sachposten`: Bestand/Verbindlichkeit/Vorsteuer.

### Lösung: Lagerlogik einfach vs. gesteuert

Aufgabe:
- Buche denselben Artikel einmal in `MZ-EINFACH` und einmal in `FRA-ZL`.

Lösung:
1. Für `MZ-EINFACH`: Bestellung öffnen und direkt `Empfangen` buchen.
2. Prüfen: Artikelposten entsteht sofort mit Lagerort `MZ-EINFACH`.
3. Für `FRA-ZL`: `Lagereingänge (Warehouse Receipts)` öffnen.
4. `Quelldokumente holen`.
5. Wareneingang buchen.
6. `Lagereinlagerungen (Warehouse Put-aways)` öffnen.
7. Einlagerung registrieren.
8. Prüfen: Ware ist erst nach Einlagerung am Lagerplatz verfügbar.
9. Ergebnis erklären: einfaches Lager ist schneller; gesteuertes Lager ist kontrollierter und erzeugt zusätzliche Lageraktivitäten.

### Lösung: Fertigung mit Mehrverbrauch

Aufgabe:
- Fertige `RM-M100` und buche 5 % Mehrverbrauch `RAW-STEEL`.

Lösung:
1. Öffne `Fertigungsaufträge (Production Orders)`.
2. Lege freigegebenen Fertigungsauftrag für `RM-M100` an.
3. Prüfe Fertigungsstückliste und Arbeitsplan.
4. Buche Materialverbrauch im Verbrauchsjournal.
5. Erfasse `RAW-STEEL` mit 5 % Mehrmenge.
6. Buche Output.
7. Prüfe `Artikelposten`: Verbrauch und Zugang.
8. Prüfe `Wertposten`: Fertigungskosten.
9. Prüfe Produktionsstatistik.
10. Controlling dokumentiert Abweichung: Ausschuss, Nacharbeit oder falsche Stückliste.

### Lösung: Service, Mietfall und Standardgrenze

Aufgabe:
- Lege Mietfall `RM-M100` über 12 Monate an und erkläre die Standardgrenze.

Lösung:
1. Lege Debitor und Artikel/Ressource für monatliche Miete an.
2. Erfasse wiederkehrende Rechnung oder periodischen Verkaufsprozess.
3. Setze Dimension `PRODUCTLINE = RENTAL`.
4. Prüfe, ob Erlösabgrenzung nötig ist.
5. Buche Monatsrechnung.
6. Prüfe Debitorenposten, Sachposten und Finanzbericht.
7. Erkläre Standardgrenze: BC kann Rechnung, Debitor, Erlös und Abgrenzung abbilden. Vertragsverwaltung mit Laufzeiten, Rückgaben, Zustandsprüfung, Mietobjektakte, Verlängerung und komplexer Bewertung braucht Extension oder Customizing.

### Lösung: Projekt mit Meilensteinrechnung

Aufgabe:
- Projektaufwand erfassen und Meilenstein fakturieren.

Lösung:
1. Öffne `Projekte (Projects/Jobs)`.
2. Lege Projekt für D10000 an.
3. Lege Projektaufgaben an.
4. Erfasse Ressource und Fremdleistung.
5. Prüfe Projektposten.
6. Erstelle Verkaufsrechnung aus abrechenbarer Projektzeile.
7. Buche Rechnung.
8. Prüfe Projektposten, Debitorenposten und Sachposten.
9. Prüfe Projektanalyse: Budget, Ist, fakturiert, offen.

### Lösung: Finance, Bank und Zahlungsausgleich

Aufgabe:
- Gleiche Teilzahlung eines Debitors aus.

Lösung:
1. Öffne `Zahlungsabstimmungsjournale (Payment Reconciliation Journals)` oder `Fibu Buch.-Blätter (General Journals)`.
2. Erfasse Zahlungseingang mit Bankkonto und Debitor.
3. Wende Zahlung auf offene Rechnung an.
4. Bei Teilzahlung bleibt Restposten offen.
5. Buche Journal.
6. Prüfe `Debitorenposten`: Rechnung teilweise ausgeglichen.
7. Prüfe `Sachposten`: Bank und Forderung.
8. Fehlerfall: falsche Rechnung ausgeglichen.
9. Korrektur: Ausgleich lösen (`Ausgleich aufheben / Unapply Entries`) und korrekt neu ausgleichen.

### Lösung: USt, EU, Drittland und Dropshipping

Aufgabe:
- Prüfe einen Inlandfall, EU-B2B-Fall, Drittlandexport und Dropshipping-Fall.

Lösung:
1. Prüfe Debitor/Kreditor: Land, USt-ID, Buchungsgruppen.
2. Prüfe Artikel/Sachkonto: USt-Produktbuchungsgruppe.
3. Prüfe `USt-Buchungsmatrix Einrichtung (VAT Posting Setup)`.
4. Inland: deutsche USt-Posten erwarten.
5. EU-B2B: USt-ID prüfen und ZM-/Nachweislogik dokumentieren.
6. Drittland: Exportnachweis/Zollnachweis dokumentieren.
7. Dropshipping: Verkaufsauftrag mit Einkauf verknüpfen.
8. Prüfe, ob Lieferbewegung und Rechnungskette steuerlich zusammenpassen.
9. Prüfe `USt-Posten (VAT Entries)` und `Sachposten`.
10. Bei komplexem Reihengeschäft: Steuerfreigabe vor Produktivbuchung.

### Lösung: Admin, Benutzer, Rechte und Change Log

Aufgabe:
- Lege neuen Nutzer an, weise Rechte zu und aktiviere Änderungsprotokoll.

Lösung:
1. Benutzer in Microsoft 365 anlegen und Lizenz zuweisen.
2. In BC `Benutzer (Users)` öffnen.
3. Benutzer synchronisieren oder öffnen.
4. Company-Zugriff prüfen.
5. `Berechtigungssätze (Permission Sets)` passend zur Rolle zuweisen.
6. `Profile/Rollen (Profiles (Roles))` setzen.
7. Testlogin durchführen.
8. `Änderungsprotokoll Einrichtung (Change Log Setup)` öffnen.
9. Kritische Tabellen aktivieren, z. B. Kreditor-Bankkonten, Buchungsgruppen, USt-Setup.
10. Teständerung durchführen.
11. `Änderungsprotokollposten (Change Log Entries)` prüfen.

### Lösung: Dokumentversand und Beleglayout

Aufgabe:
- Sende eine gebuchte Verkaufsrechnung per E-Mail.

Lösung:
1. Öffne `E-Mail-Konten`.
2. Prüfe eingerichtetes Konto.
3. Öffne `E-Mail-Szenariozuordnungen`.
4. Prüfe Szenario Verkauf.
5. Öffne `Berichtsauswahl - Verkauf`.
6. Prüfe Bericht und Layout für Rechnung.
7. Öffne `Gebuchte Verkaufsrechnungen`.
8. Wähle Rechnung.
9. Wähle `Drucken/Senden` → `Per E-Mail senden`.
10. Prüfe Empfänger, Betreff, PDF-Anhang und Text.
11. Senden.
12. Prüfe `Gesendete E-Mails` oder bei Fehler `E-Mail-Ausgang`.

### Lösung: Monitoring und Hypercare

Aufgabe:
- Prüfe morgens den BC-Betrieb.

Lösung:
1. Öffne `Aufgabenwarteschlangenposten`.
2. Prüfe Fehler, letzte Ausführung und nächste Ausführung.
3. Öffne `E-Mail-Ausgang`.
4. Prüfe fehlgeschlagene E-Mails.
5. Öffne `Genehmigungsanforderungen`.
6. Prüfe hängende Freigaben.
7. Öffne `Änderungsprotokollposten`.
8. Prüfe kritische Änderungen seit gestern.
9. Prüfe offene Tickets und wiederkehrende Fehlermuster.
10. Dokumentiere Maßnahmen im Hypercare-Protokoll.

Merksatz:
- Eine Übung ist erst vollständig, wenn der Lernende den Klickweg, das Ergebnis, die Postenspur, den Kontrollbericht und den Korrekturweg erklären kann.

### Zuordnung aller Übungen zu Lösungen

| Übung im Buch | Lösung im Anhang |
|---|---|
| Kapitel 6 Foundation/Pflichtdimension | 37.2 |
| Kapitel 7 Verkauf/O2C | 37.3 |
| Kapitel 8 Einkauf/P2P | 37.4 |
| Kapitel 9 einfaches und gesteuertes Lager | 37.5 |
| Kapitel 10 Fertigung/Mehrverbrauch | 37.6 |
| Kapitel 11 Mietmodell/Standardgrenze | 37.7 |
| Kapitel 12 Projekte/Meilenstein | 37.8 |
| Kapitel 13 Bank/OP/Finance | 37.9 |
| Kapitel 14 Intercompany/Ausland | 37.10 und 37.11 |
| Kapitel 15 Admin/Change Log/Job Queue | 37.11 und 37.13 |
| Kapitel 16 Abteilungsschulungen | jeweilige Prozesslösung 37.2 bis 37.13 |
| Kapitel 17 Master-UAT | jeweilige Prozesslösung 37.2 bis 37.13 |
| Kapitel 18 Standardgrenze | 37.7 und Kapitel 18.4 |
| Kapitel 19 Erweiterungsauswahl | Kapitel 19.9 und 37.13 |
| Kapitel 20 Preise/Margen | 37.3 und 37.4 |
| Kapitel 21 GuV/Controlling | 37.3, 37.9 und Kapitel 21.5 |
| Kapitel 22 Onboarding | 37.11 und 37.13 |
| Kapitel 23 Tipps/Filter/Korrektur | 37.9 und 37.13 |
| Kapitel 24 Postenlogik | 37.3 |
| Kapitel 25 Lagerlogiken | 37.5 |
| Kapitel 26 Admin/Betrieb | 37.11 und 37.13 |
| Kapitel 27 Steuer/Dropshipping | 37.10 |
| Kapitel 31 Greenfield-UAT | 37.2 bis 37.13 |
| Kapitel 32 Dokumentversand | 37.12 |
| Kapitel 33 Genehmigungen/SoD | 37.11 |
| Kapitel 34 Migration/Stammdaten | 37.2 und 37.11 |
| Kapitel 35 Monitoring/Hypercare | 37.13 |
| Kapitel 36 Wiederkehrende Finance-Prozesse | 37.9 und Kapitel 36.1 bis 36.3 |

---


## 34. MB-800-Kompetenzmatrix [Q86][Q87][Q88]

Dieses Kapitel weist die MB-800-Abdeckung nach. Die offiziellen Skills measured seit `17.12.2025` umfassen vier Skill Areas: Business Central einrichten, Finanzen konfigurieren, Verkauf/Einkauf konfigurieren und Business-Central-Operationen durchführen. [Q86]

| MB-800 Skill Area | Objective | Sub-Skill | Prüfungsgewichtung | Microsoft-Learn-Modul/Unit | Buchkapitel | Praxisübung | UAT-Fall | Prüfungsfalle | Status |
|---|---|---|---|---|---|---|---|---|---|
| Set up Business Central | Company erstellen | Companies, Assisted Setup, Configuration Worksheet, Configuration Packages, Opening Balances, Data Migration | 25–30 % | MB-800 Study Guide, Get started path | 6, 31, 34, 40 | Greenfield Setup | GF-001 | Assisted Setup vs. Manual Setup | abgedeckt |
| Set up Business Central | Security verwalten | Users, Profiles, Permission Sets, Security Groups, Security Filters, Security Auditing | 25–30 % | MB-800 Study Guide | 26, 30, 33, 40, 44 | Nutzer anlegen | UAT Admin | Rolle vs. Berechtigungssatz | abgedeckt |
| Set up Business Central | Core Functionality | Company Information, Report Layouts, Job Queues, Email Accounts, Number Series | 25–30 % | MB-800 Study Guide | 6, 15, 26, 32, 35 | Dokumentversand | UAT Dokumente | Report Layout vs. Financial Report | abgedeckt |
| Set up Business Central | Dimensions | Dimension Values, Global, Shortcut, Default, Combinations, Correction Tool, Priorities | 25–30 % | MB-800 Study Guide | 5, 6, 21, 24, 43 | Pflichtdimension | UAT-001 | Global vs. Shortcut Dimension | abgedeckt |
| Set up Business Central | Workflows | Workflows, Notifications, Approval Users, Workflow User Groups | 25–30 % | MB-800 Study Guide | 6, 32, 33 | Einkaufsfreigabe | UAT Approval | Approval vs. Permission | abgedeckt |
| Set up Business Central | Integrationen | Microsoft 365, Excel, OneDrive, Outlook, Teams, Word, Power Platform | 25–30 % | Get started path, BC docs | 15, 31, 32, 41 | Edit in Excel | UAT Integration | Integration vs. Extension | abgedeckt |
| Configure financials | Finanzmanagement | General Ledger Setup, Accounting Periods, Payment Terms, Deferrals, Currencies, Payment Methods | 30–35 % | MB-800 Study Guide | 13, 24, 35, 36, 43 | Abgrenzung | UAT Finance | Deferrals vs. Recurring Journals | abgedeckt |
| Configure financials | Kontenplan | G/L Accounts, Account Categories, Financial Reports | 30–35 % | Finance modules | 13, 21, 24, 43 | GuV | UAT-020 | Sachkonto vs. Buchungsgruppe | abgedeckt |
| Configure financials | Buchungsgruppen | Bank, Customer, Vendor, Inventory, General Posting Setup, Inventory Posting Setup | 30–35 % | Finance modules | 13, 24, 43 | Posting Setup | UAT Posting | General vs. VAT Posting | abgedeckt |
| Configure financials | Journale und Bank | Bank Accounts, Journal Templates, Batches, Recurring Journals | 30–35 % | Finance modules | 13, 35, 36, 43 | Zahlung | UAT-016 | Payment Journal vs. Cash Receipt Journal | abgedeckt |
| Configure financials | Kreditoren | Vendors, Vendor Ledger, Detailed Entries, Payment Journals | 30–35 % | Finance modules | 8, 13, 24, 43 | P2P | UAT-006 | Vendor Ledger vs. Detailed Vendor Ledger | abgedeckt |
| Configure financials | Debitoren | Customers, Customer Ledger, Detailed Entries, Cash Receipts, Payment Registration | 30–35 % | Finance modules | 7, 13, 24, 43 | O2C | UAT-002 | Payment Registration vs. Journal | abgedeckt |
| Configure financials | Anlagen | Depreciation Books, FA Classes, FA Posting Groups, Components, Methods | 30–35 % | Finance modules | 13, 24, 43 | Anlagenzugang | UAT-017 | Purchase Invoice vs. FA Journal | abgedeckt |
| Configure sales and purchasing | Inventory Setup | Item Categories, Attributes, Units, Variants, Locations, SKU, Costing Methods | 10–15 % | Inventory modules | 5, 9, 25, 43 | Lagerbewertung | UAT-009 | Item Ledger vs. Value Entries | abgedeckt |
| Configure sales and purchasing | Master Data | Customer shipping, Vendor order address, Lead Time, Locations | 10–15 % | Sales/Purchasing modules | 5, 7, 8, 20 | Stammdaten | UAT O2C/P2P | Customer Posting Group vs. Gen. Bus. Group | abgedeckt |
| Configure sales and purchasing | Preise/Rabatte | Purchase Prices, Line Discounts, Invoice Discounts, Sales Prices | 10–15 % | Pricing modules | 20 | Preisübung | UAT Pricing | Zeilenrabatt vs. Rechnungsrabatt | abgedeckt |
| Perform operations | Basic Tasks | Personalizing, Customizing, Designing, Filters, Related Entries, Inspect Pages, Edit in Excel, OneDrive, Analysis Mode | 25–30 % | Get started path | 22, 23, 30, 41, 44 | Onboarding | UAT Basic | Personalisieren vs. Anpassen | abgedeckt |
| Perform operations | Purchases | Quotes, Orders, Receipts, Over-Receipt, Reverse Receipt, Invoices, Recurring Lines, Blanket Orders, Deferrals | 25–30 % | Purchasing modules | 8, 36, 40, 44 | Einkaufsübung | UAT-006 | Receive vs. Invoice | abgedeckt |
| Perform operations | Sales | Quotes, Orders, Availability, Shipments, Reverse Shipment, Invoices, Recurring Lines, Blanket Orders, Deferrals | 25–30 % | Sales modules | 7, 20, 36, 40, 44 | Verkaufsübung | UAT-002 | Shipment reversal vs. Credit Memo | abgedeckt |
| Perform operations | Financial Documents | Purchase/Sales Invoices, Credit Memos, Combine Shipments/Receipts, Correct Posted Invoices, Release/Reopen, Prepayments | 25–30 % | Operations modules | 7, 8, 13, 18, 44 | Gutschrift | UAT-003 | Reverse Journal vs. Credit Memo | abgedeckt |
| Perform operations | Payments/Journals | Payment Journals, Cash Receipt Journals, Payment Registration, Apply/Unapply, Reverse Journals, Bank Reconciliation, Allocations, Exchange Rates | 25–30 % | Finance operations modules | 13, 35, 36, 43 | Bankausgleich | UAT-016 | Apply vs. Unapply | abgedeckt |
| Perform operations | Fixed Assets | Acquisition, Depreciation, Disposal | 25–30 % | Fixed Assets modules | 13, 24, 43 | Anlage | UAT-017 | Acquisition vs. Depreciation | abgedeckt |

---


## 35. Microsoft-Learn-Lernpfad-Mapping [Q1][Q2][Q87][Q88][Q89]

Dieses Kapitel bildet MB-800 und die Business-Central-Produktlandkarte auf das Buch ab. Microsoft Learn bleibt die Primärquelle für BC-Standardfunktionen; dieses Buch übersetzt die Lerninhalte in deutsche Prozess-, Projekt- und Übungslogik.

| Microsoft-Learn-Bereich | Lernpfad/Modul/Unit | BC-Thema | Buchkapitel | Übung | UAT-Fall | Tiefe |
|---|---|---|---|---|---|---|
| MB-800 | Study Guide | alle Skills measured | 34 | Übungen aus 33 | Master-UAT aus 32 | tief |
| Zertifizierung | Functional Consultant Associate | Rolle und Exam-Kontext | 34 und 36 | MB-800-Lernplan | UAT-Matrix | tief |
| Get started | Trial, Einführung, Anpassen | Einstieg, Oberfläche, Suche | 2, 4, 5 und 37 | Onboarding | Basic UAT | tief |
| Produktdokumentation | Business functionality | BC-Standardlandkarte | 11 bis 25, 35 und 38 | Prozesskatalog | E2E-UAT | tief |
| Implementierung | Companies, Setup, Migration | Greenfield | 6, 8, 28 und 39 | GF-UAT | GF-001 bis GF-007 | tief |
| Security/Compliance | User Access, Audit Changes | Rollen, Rechte, Change Log | 27, 30 und 39 | Adminübung | UAT Admin | tief |
| Finance | General Ledger, VAT, Bank, Fixed Assets | R2R | 9, 19 bis 25 und 38 | Abschluss | UAT Finance | tief |
| Sales | Quotes, Orders, Invoices, Returns | O2C | 11 und 36 | Verkauf | UAT Sales | tief |
| Purchasing | Orders, Receipts, Invoices | P2P | 12 und 36 | Einkauf | UAT Purchasing | tief |
| Inventory | Items, Costing, Valuation | Lagerwert | 13, 23 und 38 | Inventur | UAT Inventory | tief |
| Warehouse | Basic/Advanced Warehouse | Lagersteuerung | 13 | Lagerübung | UAT Warehouse | tief |
| Shopify | Connector | Onlineshop | 17, 29 und 35 | Shopauftrag | UAT Shopify | mittel |
| Fixed Assets | FA Setup/Transactions | Anlagen | 21 | Anlage | UAT-017 | tief |
| Planning | Planning Worksheet | Planung | 14 | MRP | UAT-010 | mittel |
| Assembly | Assembly Orders | Montage | 14 | Wartungskit | UAT-012 | mittel |
| Manufacturing | Production Orders | Fertigung | 14 | Mehrverbrauch | UAT-011 | mittel |
| Projects | Projects/Jobs | Projektgeschäft | 16 | Meilenstein | UAT-015 | tief |
| Service | Service Management | Serviceauftrag | 15 | Garantie | UAT-013 | mittel |
| Relationship Management | Kontakte/Opportunities | Vorvertrieb | 38 | Kontaktfall | UAT optional | Überblick |
| Human Resources | Employees/Absences | Basis-HR | 38 | Mitarbeiter | UAT optional | Überblick |
| Copilot | Copilot-Funktionen | Produktivität | 29, 31 und 35 | Architekturfrage | UAT optional | Überblick |
| Workspace Settings | Personalisieren/Profile | Oberfläche | 4, 8, 27 und 37 | Onboarding | Basic UAT | tief |
| Teams/OneDrive | M365 Integration | Zusammenarbeit | 29 und 35 | Dokument | UAT Integration | mittel |
| BI/Reporting | Analysis Mode, Power BI | Controlling | 25, 35 und 38 | GuV | UAT Reporting | tief |
| Environments/Updates | Betrieb | Admin/Betrieb | 30 und 31 | Hypercare | UAT Betrieb | mittel |
| Telemetry | Monitoring | Performance/Fehler | 30 und 31 | Supportfall | UAT Monitoring | mittel |
| Customization | Extension/AppSource | Standardgrenzen | 26 und 31 | Fit-Gap | UAT Extension | tief |
| AL/APIs | AL, OData, SOAP, APIs | Architekturverständnis | 29 und 31 | Integrationsentscheidung | UAT Integration | Überblick |
| MB-820-Light | Extensions, ALM, APIs, Telemetry | Architect-Verständnis | 29, 30 und 31 | Architekturcase | Architecture Review | Überblick |
| Power Platform | Power Automate, Power Apps, Dataverse, Power BI, Copilot Studio | Erweiterung/Integration | 25, 29, 31 und 35 | Fit-Gap | UAT Integration | Überblick |
| Dynamics 365 Sales/Field Service | CRM vs. BC, Field Service vs. BC Service | Abgrenzung | 15, 29 und 31 | Architekturfrage | Fit-Gap | Überblick |

---


## 36. MB-800-Prüfungstraining

| Falle | Erklärung | Praxisbeispiel | MB-800-Relevanz | typische falsche Antwort | richtige Denkweise |
|---|---|---|---|---|---|
| Personalisieren vs. Anpassen vs. Design | persönlicher Arbeitsbereich, Profilanpassung, Entwickler-/Designänderung | Feld nur für einen Nutzer sichtbar | hoch | alles ist Customizing | Wirkungskreis unterscheiden |
| Profile/Rollen vs. Berechtigungssätze | Oberfläche vs. Rechte | Nutzer sieht Seite, darf aber nicht buchen | hoch | Profil gibt Rechte | Rechte kommen aus Permission Sets |
| Permission Sets vs. Security Groups vs. Security Filters | Rechtepaket, Gruppenzuweisung, Datenfilter | Nutzer darf nur bestimmte Daten sehen | hoch | Security Group filtert automatisch Daten | Filter gesondert prüfen |
| Default vs. Global vs. Shortcut Dimensions | Vorgabe, Hauptachsen, Eingabefelder | GuV nach Produktlinie | hoch | alle Dimensionen sind gleich | Zweck unterscheiden |
| Dimension Correction vs. Nebenbuchkorrektur | Sachpostendimension korrigieren | Reporting falsch | hoch | korrigiert alles | Nebenbücher prüfen |
| General Posting Groups vs. VAT Posting Groups | Erlös/Aufwand vs. Steuer | Konto richtig, USt falsch | hoch | eine Matrix löst alles | beide Matrizen prüfen |
| Customer Posting Group vs. General Business Posting Group | Forderungskonto vs. Marktlogik | falsches Forderungskonto | hoch | beide sind Debitorlogik | Nebenbuch vs. GuV trennen |
| Inventory Posting Setup vs. General Posting Setup | Bestandkonto vs. Wareneinsatz/Erlös | Lagerwert falsch | hoch | eine Lagergruppe reicht | Wertfluss differenzieren |
| Item Ledger vs. Value vs. G/L Entries | Menge, Wert, Hauptbuch | Bestand stimmt, Wert nicht | hoch | Artikelposten zeigen Wert vollständig | Postenarten kombinieren |
| Customer Ledger vs. Detailed Customer Ledger | OP vs. Ausgleichsdetails | Teilzahlung | mittel | nur Customer Ledger prüfen | Detailed Entries ansehen |
| Payment Journal vs. Cash Receipt Journal vs. Payment Registration | Zahlungsausgang, Zahlungseingang, vereinfachter Ausgleich | Kundenzahlung | hoch | jedes Journal ist gleich | Zahlungsrichtung prüfen |
| Reverse Journal vs. Credit Memo vs. Correct Posted Invoice | Hauptbuchstorno, kaufmännische Gutschrift, Belegkorrektur | falsche Rechnung | hoch | Journalstorno für alles | Belegart entscheidet |
| Deferrals vs. Recurring Journals | Periodenverteilung vs. Wiederholung | Versicherung vs. Miete | hoch | beides ist monatlich | Zweck prüfen |
| Blanket Order vs. Quote vs. Order | Rahmen, Angebot, Auftrag | Jahresmenge | mittel | Rahmenauftrag ist Auftrag | Verbindlichkeit prüfen |
| Receive vs. Invoice | Ware vs. Rechnung | Wareneingang offen | hoch | Empfang bucht Aufwand endgültig | Menge und Wert trennen |
| Shipment reversal vs. Sales Credit Memo | Lieferstorno vs. Wertkorrektur | falsche Lieferung | hoch | Gutschrift korrigiert Lager immer | Warenbewegung prüfen |
| Over-Receipt vs. Quantity Change | Mehrlieferung vs. Mengenänderung | Lieferant liefert mehr | mittel | Menge einfach erhöhen | Prozessregel prüfen |
| Opening Balances vs. Migration Packages | Startsaldo vs. Importwerkzeug | Go-live | hoch | Package ist Saldo | Inhalt vs. Werkzeug |
| Assisted Setup vs. Manual Setup | Assistent vs. direkte Einrichtung | neue Company | mittel | Assistent löst alles | Setup prüfen |
| Report Layouts vs. Financial Reports | Beleglayout vs. Finanzanalyse | Rechnung vs. GuV | hoch | Layout ist Bericht | Ausgabe vs. Analyse |
| Workflow Approval vs. Permission Restriction | Freigabeprozess vs. Recht | Bestellung > 5.000 EUR | hoch | Genehmigung ersetzt Recht | beides getrennt |
| Extension vs. Configuration vs. Customizing | App, Setup, Individualänderung | Mietlösung | hoch | alles ist Custom | Upgradefähigkeit prüfen |
| Company vs. Dimension | rechtlicher Mandant vs. Auswertungsachse | Standortanalyse | hoch | jeder Standort braucht Company | rechtliche Pflicht prüfen |
| Testcompany vs. Sandbox Environment | Company im System vs. getrennte Umgebung | UAT | mittel | Testcompany schützt alles | Umgebung trennen |

---


## 37. Glossar Deutsch / Englisch / Tell-Me

Dieses Kapitel ist für Mitarbeiter gedacht, die noch nie mit ERP gearbeitet haben. Der wichtigste Satz lautet: Business Central speichert nicht „irgendeinen Bildschirm“, sondern Geschäftsvorfälle. Jede Eingabe kann Belege, Posten, Berichte und Rechte beeinflussen.

### Was ist ERP?

Ein ERP-System (Enterprise Resource Planning (Unternehmensressourcenplanung)) verbindet Abteilungen. Verkauf, Einkauf, Lager, Fertigung, Service und Buchhaltung arbeiten auf denselben Daten. Wenn der Einkauf eine Bestellung bucht, sieht das Lager den Wareneingang. Wenn der Vertrieb eine Rechnung bucht, sieht die Buchhaltung eine Forderung. Wenn das Lager Ware verkauft, sieht das Controlling den Wareneinsatz.

Merksatz:
- In BC ist eine Eingabe selten nur lokal. Sie kann Folgeprozesse auslösen.

### Wie finde ich Dinge in Business Central?

Standard laut Quelle:
- Business Central hat die Suche `Tell Me`, die über `Alt+Q` oder das Suchsymbol erreichbar ist. Darüber lassen sich Seiten und Informationen finden. [Q52]
- Nutzer können Seiten bookmarken und ihren Arbeitsbereich personalisieren. Personalisierung betrifft den eigenen Arbeitsbereich; Profilanpassungen durch Administratoren betreffen Rollen/Profile. [Q53][Q54]

Bedienlogik:

| Ziel | So findet man es | Beispiel |
|---|---|---|
| Seite öffnen | `Alt+Q` → Suchbegriff | `Sales Orders` |
| eigene Favoriten setzen | Bookmark-Symbol | Sales Orders ins Role Center |
| Spalte anzeigen | Personalisieren | `Location Code` sichtbar machen |
| Rollenlayout für alle ändern | `Profiles (Roles)` | Controller-Rolle anpassen |
| Listen eingrenzen | Filter | Debitor D10000, März 2026 |
| Hilfetext nutzen | Feldhilfe/Tooltip | Bedeutung eines Feldes prüfen |

Einsteiger-Best-Practice:
- Nie raten. Erst Suchbegriff, Seite, Feldhilfe, dann Buchung.
- Wenn eine Seite fehlt, liegt es oft an Rolle, Berechtigung, Sprache, Lizenz, Company oder Personalisierung.

### Was muss man einstellen, damit Mitarbeiter Dinge finden?

| Thema | Einstellung | Warum wichtig |
|---|---|---|
| Rolle/Profile | passende Role Center | Mitarbeiter sehen relevante Kacheln |
| Berechtigungen | Permission Sets | Seiten sind zugänglich |
| Bookmarks | Seiten anheften | häufige Seiten schnell erreichbar |
| Personalisierung | unnötige Felder ausblenden | Anfänger werden nicht überfordert |
| Profilanpassung | Admin passt Seiten für Rolle an | einheitliche Schulungsoberfläche |
| Sprache | Deutsch als UI-Sprache, soweit gewünscht | Begriffe konsistent |
| Firmenauswahl | richtige Company | Buchungen landen im richtigen Mandanten |
| Suchbegriffe | Schulungstabelle mit deutschen/englischen Begriffen | Tell Me findet oft englische Seitennamen |

Suchworttabelle:

| Aufgabe | Suchbegriff in Tell Me |
|---|---|
| Verkaufsauftrag | `Sales Orders` |
| Einkaufsbestellung | `Purchase Orders` |
| Debitorenposten | `Customer Ledger Entries` |
| Kreditorenposten | `Vendor Ledger Entries` |
| Artikelposten | `Item Ledger Entries` |
| Sachposten | `G/L Entries` |
| USt-Posten | `VAT Entries` |
| Dimensionen | `Dimensions` |
| Financial Reports | `Financial Reports` |
| Zahlungsabstimmungsjournal | `Payment Reconciliation Journal` |
| Change Log | `Change Log Entries` |
| Profile/Rollen | `Profiles (Roles)` |

### Die zehn wichtigsten Anfängerfehler

| Fehler | Warum gefährlich? | Lösung |
|---|---|---|
| falsche Company | Buchung im falschen Mandanten | Company oben prüfen, vor Buchung stoppen |
| falsches Datum | falsche Periode/USt | Posting Date und Document Date bewusst prüfen |
| falscher Debitor/Kreditor | OP bei falschem Partner | Stammdatenname, Nummer, Land prüfen |
| falscher Lagerort | Bestand am falschen Ort | `Location Code` sichtbar machen |
| Menge mit Einheit verwechselt | Bestand/Preis falsch | Einheit und Menge prüfen |
| Preis manuell überschrieben | Marge/Vertrag falsch | Preisursache prüfen, Änderung dokumentieren |
| USt-Gruppe geändert | systematischer Steuerfehler | nur berechtigte Rollen dürfen USt-Setup ändern |
| ohne Dimension gebucht | Reporting unbrauchbar | Pflichtdimensionen einrichten |
| Beleg statt Posten gesucht | Nachweis nicht gefunden | Posted Documents und Entries unterscheiden |
| Korrektur durch Löschen versucht | Audit Trail beschädigt | Storno/Gutschrift/Korrekturbuchung nutzen |

### Fehler korrigieren: Grundlogik

| Fehlerart | Korrekturweg | Nicht tun |
|---|---|---|
| noch nicht gebuchter Beleg falsch | Belegzeile korrigieren oder löschen | falschen Beleg buchen |
| gebuchte Verkaufsrechnung falsch | Sales Credit Memo oder Korrekturprozess | gebuchte Rechnung „ändern“ wollen |
| gebuchte Einkaufsrechnung falsch | Purchase Credit Memo / Korrekturbuchung | Vorsteuer unbeachtet lassen |
| falsche Dimension | Dimension Correction, soweit verfügbar und zulässig | Reporting manuell über Excel reparieren |
| falsches Konto | Umbuchung/Storno mit Begründung | Direkt im Hauptbuch ohne Nachweis korrigieren |
| falscher Lagerbestand | Item Journal / Inventurprozess | Bestand „irgendwo“ ausgleichen |
| falscher Zahlungsausgleich | Unapply Entries, neu ausgleichen | OP doppelt ausgleichen |

BC-Best-Practice:
- Jede Korrektur braucht drei Antworten: Was war falsch? Wie wird korrigiert? Welcher Nachweis zeigt die Korrektur?

### Onboarding-Pfad für jeden Mitarbeiter

| Tag | Inhalt | Ergebnis |
|---|---|---|
| 1 | Was ist BC? Company, Role Center, Suche, Belege, Posten | Mitarbeiter findet Seiten |
| 2 | Stammdaten lesen, nicht ändern | Mitarbeiter versteht Kunden, Lieferanten, Artikel |
| 3 | eigene Abteilungsprozesse | Einkauf/Verkauf/Lager/Fertigung/Finance |
| 4 | Fehler und Korrekturen | Mitarbeiter erkennt typische Fehler |
| 5 | Nachweise und Reports | Mitarbeiter versteht, warum sauber gearbeitet wird |

Schulungsübung:
1. Öffne per `Alt+Q` die Seite `Sales Orders`.
2. Bookmarke sie.
3. Öffne `Customer Ledger Entries`.
4. Filtere auf Debitor `D10000`.
5. Blende über Personalisierung die Spalte `External Document No.` ein.
6. Erkläre, warum du diese Spalte im Alltag brauchst.

Merksatz:
- Ein guter BC-Anwender muss nicht alles wissen. Er muss wissen, wo er sucht, was er prüft, wann er stoppt und wen er fragt.

---

### Tipps und Tricks

Dieses Kapitel ist das praktische Werkzeugfach für den Arbeitsalltag. Es sammelt Routinen, Tastenkürzel, Suchlogik, Filtertechnik, Kontrollgriffe und Korrekturwege. Ziel ist nicht Geschwindigkeit um jeden Preis, sondern sicheres Arbeiten mit prüfbarer Spur.

### Die wichtigste Grundregel

> Erst finden, dann filtern, dann prüfen, dann buchen.

Einsteiger machen Fehler oft nicht, weil sie die Fachlogik nicht verstehen. Sie machen Fehler, weil sie zu schnell buchen, auf der falschen Company arbeiten, einen Filter übersehen oder eine englische Seitenbezeichnung nicht kennen. Business Central unterstützt Suche, Filter, Personalisierung, Rollenprofile und Tastenkürzel. Diese Funktionen müssen bewusst geschult werden. [Q52][Q53][Q54][Q56][Q57]

### Tastenkürzel und Bediengriffe für jeden Mitarbeiter

| Ziel | Bediengriff | Warum wichtig |
|---|---|---|
| Seite oder Bericht finden | `Alt+Q` | zentrale Suche `Tell Me` öffnen |
| in Liste suchen | `F3` | Datensatz in Liste schnell finden |
| Filter setzen | Filterbereich öffnen und Feldfilter setzen | große Listen kontrollierbar machen |
| Seite als Favorit speichern | Bookmark-Symbol | tägliche Seiten im Role Center sichtbar machen |
| Hilfetext öffnen | Feldhilfe/Microsoft-Learn-Hilfe | Feldbedeutung prüfen |
| Seite personalisieren | Einstellungen → `Personalize` | wichtige Felder sichtbar machen |
| Liste nach Excel prüfen | `Open in Excel` / Export, sofern berechtigt | Abstimmung und Analyse unterstützen |
| Beleg vor Buchung prüfen | `Preview Posting`, wenn verfügbar | erwartete Posten vor Buchung kontrollieren |

BC-Best-Practice:
- Tastenkürzel werden nicht nur als Liste verteilt. Jeder Mitarbeiter übt sie mit echten Aufgaben: Auftrag finden, Debitor filtern, Posten öffnen, Belegspur verfolgen.

### Suchbegriffe: Deutsch denken, englisch finden

Viele deutschsprachige Nutzer suchen nach „Verkaufsauftrag“, „Debitorenposten“ oder „Sachposten“. In BC sind Seiten je nach Sprache, Übersetzung und Mandant trotzdem oft unter englischen Begriffen schneller auffindbar. Deshalb bekommt jede Schulung eine Suchwortliste.

| Fachlicher Wunsch | Häufig guter Suchbegriff | Typischer Nutzer |
|---|---|---|
| Kundenauftrag bearbeiten | `Sales Orders` | Verkauf |
| gebuchte Verkaufsrechnung finden | `Posted Sales Invoices` | Verkauf/Buchhaltung |
| Kundenzahlungen prüfen | `Customer Ledger Entries` | Buchhaltung |
| Lieferantenbestellung erfassen | `Purchase Orders` | Einkauf |
| gebuchte Einkaufsrechnung finden | `Posted Purchase Invoices` | Einkauf/Buchhaltung |
| Wareneingang prüfen | `Warehouse Receipts` / `Posted Purchase Receipts` | Lager/Einkauf |
| Artikelbewegung prüfen | `Item Ledger Entries` | Lager/Controlling |
| Wertbewegung prüfen | `Value Entries` | Controlling/Buchhaltung |
| Sachkontobuchungen prüfen | `General Ledger Entries` | Buchhaltung/Controlling |
| USt prüfen | `VAT Entries` | Buchhaltung |
| GuV aufrufen | `Financial Reports` | Controlling |
| Analyse nach Dimension | `Analysis Views` / `Dimensions - Detail` | Controlling |
| Dimension korrigieren | `Dimension Corrections` | Finance/Admin |
| Perioden schließen | `Accounting Periods` | Finance-Leitung |

Prüfungsfalle:
- Wenn ein Mitarbeiter eine Seite nicht findet, ist nicht automatisch die Funktion nicht vorhanden. Häufig sind Rolle, Berechtigung, Sprache, Suchbegriff oder Personalisierung die Ursache.

### Filtertechnik: der unterschätzte Produktivitätshebel

Microsoft Learn beschreibt Suche, Sortierung und Filter als zentrale Mechanismen, um Listen, Berichte und Datenmengen einzugrenzen. In Listen kann gesucht, sortiert und gefiltert werden; bei Berichten werden Filter verwendet, um die Auswertung zu begrenzen. [Q57]

Arbeitsroutine:
1. Liste öffnen.
2. Filterbereich anzeigen.
3. zuerst Zeitraum filtern.
4. dann Partner, Artikel, Konto oder Dimension filtern.
5. Filter laut vorlesen: „Ich sehe März 2026, Debitor D10000, Company RM-SALES.“
6. erst danach analysieren oder exportieren.

Beispiel:

| Frage | Filter |
|---|---|
| Welche Rechnungen an D10000 sind offen? | `Customer No. = D10000`, `Open = Yes` |
| Welche Artikelbewegungen gab es in Frankfurt? | `Location Code = FRA-WH1`, Datum `01.03.2026..31.03.2026` |
| Welche Erlöse gehören zum Onlineshop? | Dimension `CHANNEL = SHOP` |
| Welche Buchungen fehlen in der GuV? | Zeitraum, Sachkonto, Dimension `PRODUCTLINE` |

Stolperstein:
- Ein alter Filter bleibt aktiv. Der Mitarbeiter sieht „keine Daten“ und glaubt, der Beleg sei weg. Lösung: Filterbereich prüfen und Filter zurücksetzen.

### Persönliche Oberfläche sinnvoll einrichten

Personalisierung ist kein Kosmetikthema. Sie entscheidet, ob Anfänger die richtigen Felder sehen und ob Fehler früh auffallen. Microsoft unterscheidet persönliche Anpassungen des Nutzers und Profilanpassungen durch Administratoren. [Q53][Q54]

| Rolle | Sichtbar machen | Ausblenden/vermeiden |
|---|---|---|
| Verkauf | `External Document No.`, `Location Code`, `Shipment Date`, `Payment Terms Code` | seltene technische Felder |
| Einkauf | `Vendor Item No.`, `Expected Receipt Date`, `Location Code`, `Direct Unit Cost` | unnötige Finance-Felder |
| Lager | `Location Code`, `Bin Code`, `Quantity`, `Qty. to Handle`, Charge/Serie | Preisfelder, wenn nicht benötigt |
| Buchhaltung | `Posting Date`, `Document Date`, `VAT Bus. Posting Group`, `VAT Prod. Posting Group`, Dimensionen | operative Felder ohne Buchungsbezug |
| Controlling | Dimensionen, Konten, Beträge, Entry No., Source Type | Bearbeitungsaktionen ohne Analysezweck |

BC-Best-Practice:
- Schulungsoberflächen werden rollenbasiert vorbereitet. Anfänger sollen die Felder sehen, die sie prüfen müssen, nicht alle Felder, die technisch existieren.

### Buchungsroutine: die 10-Sekunden-Prüfung vor jedem Posting

Vor jeder Buchung wird kurz gestoppt. Diese Routine verhindert die meisten Anfängerfehler.

1. Richtige Company?
2. Richtiger Belegtyp?
3. Richtiger Kunde, Lieferant, Artikel oder Konto?
4. Richtiges Buchungsdatum?
5. Richtiger Leistungs-/Lieferzeitraum?
6. Richtiger Lagerort und Bin?
7. Richtige Menge und Einheit?
8. Richtiger Preis oder Rabatt?
9. Richtige USt-Logik?
10. Pflichtdimensionen gesetzt?

Beispiel:
- Ein Verkäufer bucht eine Rechnung über `10` Stück `SP-PUMP-01` an D10000. Vor `Post` prüft er Company `RM-SALES`, Datum `31.03.2026`, Lagerort `FRA-WH1`, Preis `285 EUR`, Dimension `PRODUCTLINE = SPARE` und USt-Logik Deutschland. Erst dann wird gebucht.

Merksatz:
- Eine Buchung ist schnell. Eine falsche Buchung ist langsam.

### Fehler sauber korrigieren

Business Central arbeitet mit gebuchten Posten. Gebuchte Daten werden fachlich korrigiert, nicht „unsichtbar repariert“. Microsoft beschreibt unter anderem das Stornieren von Journalbuchungen über Umkehrbuchungen und das Korrigieren von Dimensionen auf Sachposten. [Q58][Q59]

| Fehler | Richtiger Weg | Nachweis |
|---|---|---|
| falsche Journalbuchung | Reverse/Storno und richtige Buchung neu erfassen | ursprünglicher Posten, Storno, neue Buchung |
| falsche Dimension auf Sachposten | Dimension Correction prüfen und durchführen | Historie der Dimension Correction |
| falsche gebuchte Verkaufsrechnung | Gutschrift/Korrekturbeleg | Rechnung, Gutschrift, neue Rechnung |
| falscher Zahlungsausgleich | Ausgleich lösen und korrekt neu ausgleichen | Customer/Vendor Ledger Entries |
| falscher Lagerbestand | Inventur, Artikeljournal oder Lagerkorrektur nach Freigabe | Item Ledger Entries, Value Entries |
| falsche Periode | Buchungsdatum prüfen, Periodensperre beachten, Korrektur dokumentieren | G/L Entries, Abschlussnachweis |

Achtung:
- Dimension Correction ändert nach Microsoft die Dimensionen auf Sachposten. Sie ändert nicht automatisch die Dimensionen in allen Nebenbüchern derselben Transaktion. Deshalb muss Finance prüfen, ob Reporting, Nebenbuch und Nachweislogik zusammenpassen. [Q59]

### Tipps für Controller

Controller arbeiten nicht nur mit fertigen Berichten. Sie prüfen, ob die Daten für Berichte überhaupt belastbar sind.

Tagesroutine:
1. `Financial Reports` öffnen.
2. GuV für aktuellen Monat und kumuliert prüfen.
3. Dimension `PRODUCTLINE` filtern.
4. auffällige Abweichung identifizieren.
5. über Sachposten auf Belege zurückgehen.
6. Nebenbuch prüfen: Debitor, Kreditor, Artikel, Projekt oder Anlage.
7. Ursache dokumentieren: Preis, Menge, Datum, Dimension, Kostenlauf oder Korrektur.

Typische Controller-Fragen:

| Frage | Prüfpunkte |
|---|---|
| Warum ist die Marge gefallen? | Verkaufspreis, Rabatt, Einkaufskosten, Wareneinsatz, Dimension |
| Warum fehlt Umsatz? | Rechnung nicht gebucht, falsches Datum, falsches Konto |
| Warum ist Lagerwert hoch? | Wareneingang ohne Rechnung, Überbestand, Kostenregulierung |
| Warum passt GuV nicht zum operativen Gefühl? | Dimensionen fehlen, Periodenabgrenzung fehlt, Buchungen im falschen Monat |
| Warum ist Projektmarge falsch? | Ressourcenverbrauch, WIP, Fremdleistungen, Faktura |

Best Practice:
- Jeder Monatsabschluss bekommt eine Abweichungsliste mit Ursache, Verantwortlichem und Korrekturstatus. Ohne Ursache ist eine Abweichung noch keine Analyse.

### Tipps für Einkauf, Verkauf und Lager

Einkauf:
- Nutze Lieferantenartikelnummern konsequent.
- Prüfe `Expected Receipt Date`, damit Planung und Lager nicht falsche Verfügbarkeiten sehen.
- Prüfe Preis, Währung, Einheit und Mindestmenge vor Freigabe.
- Bei Preisabweichung nie nur die Bestellung ändern. Kläre, ob die Einkaufspreisliste falsch ist.

Verkauf:
- Prüfe vor Zusage Lagerort, Verfügbarkeit, Lieferdatum und Zahlungsbedingungen.
- Nutze Preislisten statt manueller Zeilenpreise.
- Bei Retouren zuerst Ursache klären: falsche Ware, Qualität, Preis, Kunde oder Lieferung.
- Bei Shopaufträgen prüfen, ob Kunde, Steuerlogik und Artikelmapping stimmen.

Lager:
- Scanne oder prüfe Artikelnummer, Charge, Seriennummer und Lagerplatz.
- Verwechsle nie `Quantity`, `Qty. to Receive`, `Qty. to Ship` und `Qty. to Handle`.
- Melde Abweichungen sofort. Nachträgliche Lagerkorrekturen sind schwieriger als saubere Klärung vor Buchung.

### Tipps für Admins und Key User

Admins und Key User schützen das System vor schleichender Unordnung.

| Thema | Tipp | Risiko bei Vernachlässigung |
|---|---|---|
| Rollen | je Abteilung eigenes Profil | Nutzer sehen zu viel oder zu wenig |
| Berechtigungen | Least Privilege | Setup wird versehentlich geändert |
| Stammdaten | Änderungsprozess mit Vier-Augen-Prinzip | falsche Buchungsgruppen, falsche USt |
| Nummernserien | sprechend, aber nicht überladen | Belege werden schwer nachvollziehbar |
| Dimensionen | Pflichtdimensionen und Value Posting nutzen | Reporting unbrauchbar |
| Change Log | für kritische Tabellen aktivieren | Änderungen nicht prüfbar |
| Job Queue | Verantwortlichen und Monitoring definieren | automatische Prozesse bleiben unbemerkt stehen |
| Testcompany | Änderungen zuerst testen | Produktivdaten werden Trainingsfeld |

### Wenn etwas nicht stimmt: Diagnosebaum

```mermaid
flowchart TD
    A[Problem erkannt] --> B{Ist der Beleg schon gebucht?}
    B -- Nein --> C[Beleg prüfen und korrigieren]
    B -- Ja --> D{Betrifft es nur Reporting?}
    D -- Ja --> E[Dimension, Filter, Analysis View, Financial Report prüfen]
    D -- Nein --> F{Betrifft es Bestand oder Wert?}
    F -- Bestand --> G[Item Ledger Entries und Lagerprozess prüfen]
    F -- Wert --> H[Value Entries, Kostenregulierung und Sachposten prüfen]
    F -- Weder noch --> I[Debitor/Kreditor/Sachkonto/USt prüfen]
    E --> J[Nachweis dokumentieren]
    G --> J
    H --> J
    I --> J
```

Praxisregel:
- Nie direkt „korrigieren“, bevor die Ursache benannt ist. Sonst entsteht aus einem Fehler ein zweiter Fehler.

### Mini-Spickzettel für den Schreibtisch

| Situation | Erst prüfen | Dann tun |
|---|---|---|
| Ich finde eine Seite nicht | `Alt+Q`, englischen Begriff, Rolle | Bookmark setzen |
| Ich sehe keine Daten | Filter, Company, Zeitraum | Filter zurücksetzen |
| Preis stimmt nicht | Preislistenzeile, Datum, Menge, Gruppe | Belegzeile neu validieren |
| USt stimmt nicht | Debitor/Kreditorgruppe, Artikelgruppe, VAT Posting Setup | nicht manuell übersteuern |
| GuV stimmt nicht | Zeitraum, Konto, Dimension, gebuchte Belege | Sachposten zurückverfolgen |
| Lagerbestand stimmt nicht | Item Ledger Entries, Lagerort, Bin, Charge | Inventur-/Korrekturprozess nutzen |
| Dimension fehlt | Default Dimensions, Pflichtdimension, Korrekturberechtigung | Dimension Correction prüfen |
| Periode falsch | Posting Date, Accounting Periods, Sperren | Finance-Leitung einbinden |

Schulungsübung:
1. Öffne `Sales Orders` mit `Alt+Q`.
2. Setze einen Filter auf Debitor `D10000`.
3. Öffne einen gebuchten Verkaufsbeleg.
4. Springe zu `Customer Ledger Entries`.
5. Öffne die zugehörigen `G/L Entries`.
6. Erkläre die Buchungsspur.
7. Blende eine fehlende Spalte über Personalisierung ein.
8. Bookmarke die Seite.
9. Dokumentiere einen absichtlich gesetzten falschen Filter und setze ihn zurück.
10. Beschreibe, welche Korrektur zulässig wäre, wenn der Beleg bereits gebucht ist.

Merksatz:
- Gute BC-Arbeit ist wiederholbar: gleiche Suche, gleiche Prüfung, gleicher Nachweis, gleiche Korrekturlogik.

---

### Deutsche Such- und Seitenlogik

Dieses Kapitel übersetzt die wichtigsten Business-Central-Begriffe in die deutsche Bedienwelt. Es ist bewusst praktisch: Ein Mitarbeiter soll wissen, welchen deutschen Begriff er sieht, welchen englischen Begriff Microsoft Learn verwendet und was die Seite fachlich bedeutet.

### Grundsatz für Schulungen

Schulungen, Arbeitsanweisungen und Screenshots verwenden die deutsche Oberfläche. Englische Begriffe werden in Klammern ergänzt, weil Suchfunktion, Partnerdokumentation und Microsoft Learn teilweise englische Namen verwenden.

| Regel | Anwendung |
|---|---|
| Deutsch zuerst | `Verkaufsaufträge (Sales Orders)` |
| Abkürzungen erklären | `Sachposten (G/L Entries)` |
| Posten immer fachlich erklären | `Debitorenposten = offene und ausgeglichene Kundenforderungen` |
| Tell-Me-Suche zweisprachig schulen | erst deutsch suchen, dann englischen Begriff versuchen |
| Screenshots/Schulungsmandant deutsch | Sprache/Region im Nutzerprofil auf Deutsch/Deutschland setzen |

### Deutsche Seitenbegriffe für Verkauf, Einkauf und Finance

| Deutscher Begriff in der Schulung | Englischer Begriff / Microsoft Learn | Zweck |
|---|---|---|
| Debitoren | Customers | Kundenstammdaten |
| Kreditoren | Vendors | Lieferantenstammdaten |
| Artikel | Items | Material, Ware, Handelsartikel |
| Verkaufsangebote | Sales Quotes | Angebot an Kunden |
| Verkaufsaufträge | Sales Orders | Auftrag, Lieferung, Rechnung |
| Gebuchte Verkaufsrechnungen | Posted Sales Invoices | Nachweis gebuchter Ausgangsrechnungen |
| Verkaufsgutschriften | Sales Credit Memos | Korrektur/Gutschrift im Verkauf |
| Verkaufsreklamationen / Verkaufsreklamationsaufträge | Sales Return Orders | Rücknahmeprozess |
| Einkaufsbestellungen | Purchase Orders | Bestellung beim Lieferanten |
| Einkaufsrechnungen | Purchase Invoices | Eingangsrechnung |
| Gebuchte Einkaufsrechnungen | Posted Purchase Invoices | Nachweis gebuchter Eingangsrechnungen |
| Einkaufsgutschriften | Purchase Credit Memos | Korrektur/Gutschrift im Einkauf |
| Erinnerungen/Mahnungen | Reminders | Mahnprozess |
| Zahlungsjournale | Payment Journals | Zahlungsläufe |
| Zahlungsabstimmungsjournale | Payment Reconciliation Journals | Bank-/Zahlungsabgleich |
| Sachkontenplan | Chart of Accounts | Kontenübersicht |
| Sachposten | General Ledger Entries / G/L Entries | Hauptbuchbuchungen |
| Debitorenposten | Customer Ledger Entries | Forderungen und Ausgleich |
| Kreditorenposten | Vendor Ledger Entries | Verbindlichkeiten und Ausgleich |
| USt-Posten | VAT Entries | Umsatzsteuer/Vorsteuer |
| Finanzberichte | Financial Reports | GuV, Bilanz, Auswertungen |

### Deutsche Seitenbegriffe für Lager, Fertigung, Projekte und Service

| Deutscher Begriff in der Schulung | Englischer Begriff / Microsoft Learn | Zweck |
|---|---|---|
| Lagerorte | Locations | physische oder logische Lager |
| Lagerplätze | Bins | Plätze innerhalb eines Lagerorts |
| Artikelposten | Item Ledger Entries | Mengenbewegungen |
| Wertposten | Value Entries | Wertbewegungen und Kosten |
| Artikeljournale | Item Journals | Bestandskorrekturen |
| Inventurjournale | Physical Inventory Journals | Inventur |
| Lagereinlagerungen | Warehouse Put-aways | gesteuerte Einlagerung |
| Lagerkommissionierungen | Warehouse Picks | gesteuerte Kommissionierung |
| Lagereingänge | Warehouse Receipts | Wareneingänge im Lager |
| Lagerausgänge / Lagerlieferungen | Warehouse Shipments | Versand aus dem Lager |
| Umlagerungsaufträge | Transfer Orders | Bewegung zwischen Lagerorten |
| Montageaufträge | Assembly Orders | Montage/Kits |
| Fertigungsstücklisten | Production BOMs | Materialstruktur |
| Arbeitspläne | Routings | Arbeitsgänge |
| Fertigungsaufträge | Production Orders | Produktion |
| Projekte | Projects / Jobs | Projektgeschäft |
| Projektposten | Project Ledger Entries / Job Ledger Entries | Projektverbrauch/Faktura |
| Ressourcen | Resources | Mitarbeiter/Maschinen/Dienstleistungen |
| Serviceartikel | Service Items | zu wartende Objekte |
| Serviceaufträge | Service Orders | Reparatur/Wartung |
| Serviceverträge | Service Contracts | Wartungsverträge |

### Deutsche Admin- und Superuser-Begriffe

| Deutscher Begriff in der Schulung | Englischer Begriff / Microsoft Learn | Zweck |
|---|---|---|
| Benutzer | Users | Anwender im Mandanten |
| Berechtigungssätze | Permission Sets | Rechtepakete |
| Profile/Rollen | Profiles (Roles) | Rollencenter und Oberfläche |
| Rollencenter | Role Center | Startseite je Rolle |
| Aufgabenwarteschlangenposten | Job Queue Entries | geplante/automatische Läufe |
| Änderungsprotokoll | Change Log | Nachweis von Stammdaten-/Setupänderungen |
| Änderungsprotokollposten | Change Log Entries | konkrete protokollierte Änderung |
| Erweiterungsverwaltung | Extension Management | installierte Apps/Extensions |
| unterstützte Einrichtung | Assisted Setup | Einrichtungsassistenten |
| Konfigurationspakete | Configuration Packages | Datenmigration/Setup-Import |
| Nummernserien | No. Series | Beleg- und Stammdatennummern |
| Buchhaltungsperioden | Accounting Periods | Geschäftsjahr/Perioden |
| Dimensionen | Dimensions | Kostenstellen, Produktlinien, Kanäle |
| Standarddimensionen | Default Dimensions | automatische Dimensionsvorgaben |
| Buchungsgruppen | Posting Groups | Kontenfindung |
| USt-Buchungsmatrix | VAT Posting Setup | Steuerfindung |

### Deutsche Bedienanweisungen: Formulierungsmuster

Falsch für dieses Buch:
- „Open `Sales Orders` and post the invoice.“

Richtig:
- „Öffne über `Alt+Q` die Seite `Verkaufsaufträge (Sales Orders)`. Öffne den Auftrag. Prüfe Debitor, Buchungsdatum, Lagerort, Preis, USt-Produktbuchungsgruppe und Dimensionen. Wähle anschließend `Buchen`.“

Richtig bei Admin-Themen:
- „Öffne `Benutzer (Users)`, prüfe den Benutzer und weise passende `Berechtigungssätze (Permission Sets)` zu. Prüfe danach das `Profil/Rollencenter (Profiles (Roles))`.“

### Mindest-Glossar für jeden Abschnitt

Jeder BC-Abschnitt verwendet diese Struktur:

| Element | Pflicht |
|---|---|
| Seite | deutscher Name plus englischer Suchbegriff |
| Feld | deutscher Feldname, wenn bekannt; englischer Feldname nur als Klammer |
| Aktion | deutsche Aktion, z. B. `Buchen`, `Freigeben`, `Ausgleichen` |
| Posten | deutscher Postenbegriff plus englischer Tabellen-/Learn-Begriff |
| Bericht | deutscher Berichtstitel plus englischer Quellenbegriff |
| Fehlerbild | deutsche Anwendersprache |
| Admin-Hinweis | deutsche Oberfläche und englischer Quellenbegriff |

Merksatz:
- Ein deutsches Schulungsbuch darf englische BC-Begriffe erklären. Es darf sie aber nicht zur Hauptsprache machen.

---


## 38. Seitenindex, Prozesskatalog und Qualitätssicherung

### Qualitätsprinzipien und Vollständigkeitslogik

Dieses Buch ist ein vollumfängliches Business-Central-Einführungs-, Schulungs-, Projekt-, Nachschlage- und Architekturhandbuch für den deutschen Unternehmenskontext. Es verbindet BC-Standardprozesse, deutsche Finance-/Compliance-Perspektive, praktische Bedienung, Buchungsspur, Fehlerdiagnose, UAT, Evidence Packs, MB-800-Abdeckung, Microsoft-Learn-Lernpfade und Solution-Architect-Denken in einer einheitlichen Lern- und Projektstruktur.

Vollständigkeit bedeutet in diesem Buch:
- Alle relevanten BC-Standardbereiche werden fachlich erklärt und praktisch durchgespielt.
- Jeder Prozess enthält Zweck, Rolle, Setup, Stammdaten, Bedienpfad, Happy Path, Abweichungen, Diagnose, Korrektur, Buchungsspur, Bericht, Evidence Pack, Übung, Lösung und UAT-Fall.
- Jede wichtige Buchung wird über Beleg, gebuchten Beleg, Posten, Nebenbuch, Sachposten, USt-Posten, Artikelposten, Wertposten oder Bericht nachvollziehbar gemacht.
- Die deutsche BC-Oberfläche ist führend; englische Microsoft-Learn-/Tell-Me-Begriffe stehen als Such- und Quellenhilfe daneben.
- Alle MB-800-relevanten Skills sind über eine Kompetenzmatrix abgebildet.
- Der offizielle Microsoft-Learn-Vorbereitungspfad zur MB-800-Zertifizierung ist über Lernpfad-, Modul- und Unit-Mapping eingebunden.
- Die offizielle Business-Central-Produktdokumentation von Microsoft Learn dient zusätzlich als Vollständigkeits-Overlay für alle BC-Standardbereiche.
- Relevante Lernpfade und Kompetenzbereiche außerhalb von MB-800 werden als Architektur- und Projektkompetenz integriert, soweit sie für Business Central Standard, Integrationen, Power Platform, Reporting, Betrieb oder Solution Architecture sinnvoll sind.
- Standard, Pflicht, Best Practice, Projektentscheidung, Extension und Customizing werden sauber getrennt.

| Buchschicht | Was das Buch liefert | Praktischer Nachweis |
|---|---|---|
| BC-Prozesslandkarte | alle relevanten Standardbereiche Ende-zu-Ende | Prozesskapitel und E2E-Fälle |
| Einsteigerpfad | Oberfläche, Suche, Rollen, Belege, Posten, Filter, Korrekturen | Onboarding- und Bedienkapitel |
| Prozessmodule | Zweck, Setup, Stammdaten, Bedienpfad, Happy Path, Abweichungen | Kapitelstruktur je Prozess |
| Buchungsspur | Beleg, gebuchter Beleg, Entries, Nebenbuch, Sachposten, Bericht | Postenlogik und Evidence Pack |
| Finance/R2R | Hauptbuch, Nebenbücher, Bank, Anlagen, USt, Abschluss, Reporting | Finance-Kapitel und Abschlussfall |
| Operative Prozesse | Sales, Purchasing, Inventory, Warehouse, Planning, Assembly, Manufacturing, Service, Projects | UAT- und Schulungsfälle |
| Fehlerdiagnose | typische Fehler, Ursache, Diagnosepfad, Korrekturweg | Diagnosematrizen |
| UAT | Happy Path, Abweichung, Akzeptanzkriterien | Master-UAT und Testskripte |
| MB-800-Abdeckung | alle aktuellen Skills measured | MB-800-Kompetenzmatrix |
| Microsoft-Learn-Lernpfad | Lernpfade, Module und Units | Lernpfad-Mapping |
| BC-Produktlandkarte | alle relevanten Standardbereiche aus Microsoft Learn | Produktlandkarten-Mapping |
| Solution Architecture | Standard-first, Fit-Gap, Datenmodell, Security, Integration, Migration, Betrieb | Solution-Architect-Kapitel |
| Projektfähigkeit | Fit-Gap, Standardgrenzen, Extensions, Go-live, Hypercare | Consultant- und Projektkapitel |

Jedes relevante Prozesskapitel folgt dieser Struktur:
1. Zweck und Prozesskontext.
2. Warum braucht die Rhein-Main Industriegruppe diesen Prozess?
3. Quelle und Standardeinordnung.
4. MB-800-Zuordnung, falls relevant.
5. Microsoft-Learn-Lernpfad-/Modul-/Unit-Zuordnung, falls relevant.
6. Beteiligte Rollen.
7. Setup-Voraussetzungen.
8. Stammdaten.
9. Schritt-für-Schritt-Bedienpfad.
10. Happy Path mit Beispieldaten.
11. Abweichungen.
12. Diagnosepfad.
13. Korrekturweg.
14. Buchungsspur und Postenlogik.
15. Kontrollbericht.
16. Evidence Pack.
17. Typische Anfängerfehler.
18. MB-800-Prüfungsfallen, falls relevant.
19. Solution-Architect-Box, falls relevant.
20. Wiederholungsfragen.
21. Szenariofragen.
22. Praktische Übung.
23. Lösungsskizze.
24. UAT-Testfall.
25. Akzeptanzkriterien.
26. Standardgrenze und Erweiterungsentscheidung.


Dieses Kapitel ist der vollständige Arbeitskatalog für Business Central. Es verbindet alle Prozessbereiche mit der Frage: Wo finde ich es, was richte ich ein, was macht der Mitarbeiter, welche Posten entstehen, welcher Bericht kontrolliert das Ergebnis und welche Fehler sind typisch? Damit wird aus dem Buch ein Bedien- und Schulungssystem.

### Das Universal-Pattern für jeden BC-Prozess

Jeder Prozess wird nach demselben Muster geschult:

1. **Ziel verstehen:** Was soll fachlich passieren?
2. **Seite finden:** `Alt+Q` nutzen und Suchbegriff eingeben.
3. **Setup prüfen:** Buchungsgruppen, Nummernserien, Dimensionen, Rollen, Lagerort, Steuerlogik.
4. **Stammdaten prüfen:** Kunde, Lieferant, Artikel, Ressource, Sachkonto, Projekt, Anlage.
5. **Beleg erfassen:** Kopf, Zeilen, Datum, Menge, Preis, Steuer, Dimension.
6. **Vor Buchung prüfen:** Company, Datum, Partner, Betrag, USt, Lagerort, Dimension.
7. **Buchen:** passende Aktion wählen.
8. **Posten prüfen:** Nebenbuch und Hauptbuch öffnen.
9. **Bericht prüfen:** Financial Report, Lagerbewertung, OP-Liste, Projektbericht oder Analyse.
10. **Fehler korrigieren:** nie löschen, sondern fachlich stornieren, gutschreiben, umbuchen oder korrigieren.
11. **Evidence Pack sichern:** Beleg, Entries, Bericht, Freigabe, Nachweis.

Merksatz:
- Ein vollständiger BC-Prozess endet nicht mit `Post`. Er endet mit Kontrolle, Nachweis und verständlicher Buchungsspur.

### Vollständige Prozesslandkarte

| Prozessbereich | Deutsche Hauptseiten mit englischer Suchhilfe | Setup | Mitarbeiteraktion | Posten/Nachweis | Kontrollbericht |
|---|---|---|---|---|---|
| Company & Foundation | `Unternehmen (Companies)`, `Unternehmensdaten (Company Information)`, `Unterstützte Einrichtung (Assisted Setup)` | Mandant, Region, Währung, Nummernserien | Mandant anlegen und prüfen | Setup-Protokoll | Setup-Checkliste |
| Benutzer & Rollen | `Benutzer (Users)`, `Berechtigungssätze (Permission Sets)`, `Profile/Rollen (Profiles (Roles))` | Lizenz, Berechtigungssätze, Profile | Nutzer berechtigen | Benutzerkarte, Berechtigungssätze | Berechtigungsreview |
| Dimensionen | `Dimensionen (Dimensions)`, `Standarddimensionen (Default Dimensions)` | globale Dimensionen, Shortcut-Dimensionen, Wertbuchung | Dimensionen zuweisen | Sachposten (G/L Entries) mit Dimension | Dimensionen - Detail |
| Kontenplan | `Kontenplan (Chart of Accounts)`, `Sachkontokategorien (G/L Account Categories)` | Konten, Kategorien, Direktbuchung | Konto pflegen und sperren | Sachposten (G/L Entries) | Finanzberichte |
| USt | `USt-Buchungsmatrix (VAT Posting Setup)`, `USt-Posten (VAT Entries)` | USt-Geschäftsbuchungsgruppen, USt-Produktbuchungsgruppen | Steuerlogik buchen und prüfen | USt-Posten (VAT Entries) | USt-Abstimmung |
| O2C | `Verkaufsangebote (Sales Quotes)`, `Verkaufsaufträge (Sales Orders)`, `Gebuchte Verkaufsrechnungen (Posted Sales Invoices)` | Verkaufseinrichtung, Debitoren, Preise | Angebot/Auftrag/Rechnung | Debitorenposten, Sachposten, USt-Posten | OP-Liste, GuV |
| Retouren | `Verkaufsreklamationsaufträge (Sales Return Orders)`, `Verkaufsgutschriften (Sales Credit Memos)` | Retourengründe, Lagerort | Ware zurücknehmen/gutschreiben | Artikelposten, Debitorenposten | Retourenliste |
| Mahnwesen | `Mahnungen (Reminders)`, `Debitorenposten (Customer Ledger Entries)` | Mahnmethoden, Zahlungsbedingungen | offene Posten mahnen | Mahnung, Debitorenposten | Debitorenfälligkeit |
| P2P | `Einkaufsbestellungen (Purchase Orders)`, `Gebuchte Einkaufsrechnungen (Posted Purchase Invoices)` | Einkaufseinrichtung, Kreditoren | bestellen, empfangen, fakturieren | Kreditorenposten, Sachposten, USt-Posten | Kreditorenfälligkeit |
| Einkaufspreise | `Einkaufspreislisten (Purchase Price Lists)` | Preislisten, Kreditorartikel | Preise pflegen | Belegzeilen, Margenprüfung | Einkaufsanalyse |
| Verkaufspreise | `Verkaufspreislisten (Sales Price Lists)` | Preisgruppen, Rabatte | Preise pflegen | Belegzeilen, Erlöse | Margenanalyse |
| Lager/Bestand | `Artikel (Items)`, `Artikeljournale (Item Journals)`, `Artikelposten (Item Ledger Entries)` | Artikel, Einheiten, Kostenmethode | Bestand buchen/korrigieren | Artikelposten, Wertposten | Lagerbewertung |
| Basislager | `Lagereinlagerungen (Inventory Put-aways)`, `Lagerkommissionierungen (Inventory Picks)` | Lagerort, Lagerplatzpflicht | einlagern/kommissionieren | Lageraktivität, Artikelposten | Lagerbewegungen |
| Gesteuertes Lager | `Lagereingänge (Warehouse Receipts)`, `Lagereinlagerungen (Warehouse Put-aways)`, `Lagerkommissionierungen (Warehouse Picks)` | Wareneingang/Kommissionierung erforderlich, gesteuerte Einlagerung | empfangen, einlagern, kommissionieren | Lagerposten, Artikelposten | Lagerplatzinhalt |
| Inventur | `Inventurjournale (Physical Inventory Journals)` | Inventurzyklen, Lagerorte | zählen und buchen | Artikelposten, Wertposten | Inventurdifferenzen |
| Planung | `Planungsarbeitsblätter (Planning Worksheets)`, `Bestellarbeitsblätter (Requisition Worksheets)` | Planungspolitik, Absatzplanung | Bedarf berechnen | Vorschlagszeilen | Planungsarbeitsblatt |
| Montage | `Montageaufträge (Assembly Orders)` | Montagestückliste, Artikel | Kit montieren | Montage-/Artikelposten | Montagekosten |
| Fertigung | `Fertigungsstücklisten (Production BOMs)`, `Arbeitspläne (Routings)`, `Fertigungsaufträge (Production Orders)` | Stücklisten, Arbeitspläne, Kapazitäten | Verbrauch und Output buchen | Artikel-/Kapazitäts-/Wertposten | Produktionsstatistik |
| Fremdarbeit | `Fremdarbeitsarbeitsblätter (Subcontracting Worksheets)`, Einkauf | Arbeitsgänge, Kreditor | Fremdleistung beschaffen | Einkaufs-, Kapazitäts-, Wertposten | Fertigungsabweichung |
| Service | `Serviceartikel (Service Items)`, `Serviceaufträge (Service Orders)`, `Serviceverträge (Service Contracts)` | Serviceeinrichtung, Verträge | Reparatur/Wartung erfassen | Serviceposten, Sachposten | Serviceberichte |
| Projekte | `Projekte (Projects/Jobs)`, `Projektjournale (Project Journals)`, `Projektplanzeilen (Project Planning Lines)` | Projektsetup, WIP-Methode | Aufwand, Budget, Faktura | Projektposten, Sachposten | Projektanalyse |
| Anlagen | `Anlagen (Fixed Assets)`, `Anlagenjournale (FA Journals)` | Anlagenbuchungsgruppen, AfA-Bücher | Zugang, AfA, Abgang | Anlagenposten, Sachposten | Anlagenliste |
| Bank & Zahlungen | `Zahlungsjournale (Payment Journals)`, `Zahlungsabstimmungsjournale (Payment Reconciliation Journals)` | Bankkonten, Zahlungsarten | zahlen, abstimmen | Bank-/Sachposten, Debitoren-/Kreditorenposten | Bankabstimmung |
| Abschluss | `Buchhaltungsperioden (Accounting Periods)`, `Fibu Buch.-Blätter (General Journals)`, `Finanzberichte (Financial Reports)` | Perioden, Sperren, Abschlusskonten | abgrenzen, schließen, berichten | Sachposten | Bilanz/GuV |
| Intercompany | `Intercompany-Einrichtung (Intercompany Setup)`, IC-Buch.-Blätter | IC Partner, IC Konten | IC-Belege senden/empfangen | IC-Posten, Sachposten | IC-Abstimmung |
| Shopify/Online | `Shopify Shops`, `Verkaufsaufträge (Sales Orders)` | Shop, Mapping, Steuer | Shopaufträge verarbeiten | Verkaufs-, Debitoren-, USt-Posten | Shop-Abstimmung |
| Dropshipping | `Verkaufsaufträge (Sales Orders)`, `Einkaufsbestellungen (Purchase Orders)` | Einkaufscode (Purchasing Code), Lieferant | Direktlieferung steuern | verknüpfte Verkaufs-/Einkaufsposten | Marge, Steuer, Liefernachweis |
| Reporting | `Finanzberichte (Financial Reports)`, `Analysemodus (Analysis Mode)`, `Analyseansichten (Analysis Views)` | Dimensionen, Reports | auswerten und filtern | Sachposten, Dimensionen | GuV, Bilanz, Analyse |
| Administration | `Aufgabenwarteschlangenposten (Job Queue Entries)`, `Änderungsprotokoll (Change Log)`, `Erweiterungsverwaltung (Extension Management)` | Jobs, Protokollierung, Apps | Betrieb überwachen | Protokolle, Änderungsprotokoll | Admin-Kalender |

### Vollständige Schrittfolge Grundeinrichtung

Diese Reihenfolge gilt für einen neuen Trainingsmandanten. Sie ist bewusst streng, weil spätere Korrekturen an Fundamentdaten teuer werden.

1. `Unternehmen (Companies)` öffnen und Company `RM-PROD` anlegen.
2. `Unternehmensdaten (Company Information)` pflegen: Name, Adresse, USt-ID, Bankdaten.
3. `Finanzbuchhaltung Einrichtung (General Ledger Setup)` prüfen: Währung, Buchungsdatum, Rundung, Dimensionslogik.
4. `Buchhaltungsperioden (Accounting Periods)` für das Geschäftsjahr anlegen.
5. `Kontenplan (Chart of Accounts)` importieren oder pflegen.
6. `Sachkontokategorien (G/L Account Categories)` für Bilanz und GuV zuordnen.
7. `Allgemeine Buchungsmatrix Einrichtung (General Posting Setup)` für Geschäftsbuchungsgruppen und Produktbuchungsgruppen pflegen.
8. `USt-Buchungsmatrix Einrichtung (VAT Posting Setup)` für Inland, EU und Drittland pflegen.
9. `Debitorenbuchungsgruppen (Customer Posting Groups)` und `Kreditorenbuchungsgruppen (Vendor Posting Groups)` definieren.
10. `Lagerbuchungsmatrix Einrichtung (Inventory Posting Setup)` und Lagerkonten definieren.
11. `Dimensionen (Dimensions)` anlegen: `DEPARTMENT`, `PRODUCTLINE`, `CHANNEL`, `LOCATION-GROUP`, `PROJECT`.
12. `Standarddimensionen (Default Dimensions)` an Debitoren, Kreditoren, Artikeln, Ressourcen und Sachkonten pflegen.
13. `Nummernserien (No. Series)` für Debitoren, Kreditoren, Artikel, Belege, Anlagen, Projekte definieren.
14. `Verkauf & Marketing Einrichtung (Sales & Receivables Setup)` prüfen.
15. `Einkauf & Kreditoren Einrichtung (Purchases & Payables Setup)` prüfen.
16. `Lager Einrichtung (Inventory Setup)` prüfen.
17. Lagerorte in `Locations` anlegen: einfaches Lager, Basic Warehouse, Advanced Warehouse.
18. Bins und Lagerplatzlogik für gesteuertes Lager anlegen.
19. Debitoren und Kreditoren anlegen.
20. Artikel, Einheiten, Varianten, Item Tracking und Preise anlegen.
21. Ressourcen, Projekte, Anlagen, Serviceartikel anlegen.
22. Workflows und Genehmigungen einrichten.
23. `Benutzer (Users)`, `Berechtigungssätze (Permission Sets)`, `Profile/Rollen (Profiles (Roles))` einrichten.
24. `Aufgabenwarteschlangenposten (Job Queue Entries)` für Kostenregulierung, Reports, Schnittstellen prüfen.
25. `Änderungsprotokoll Einrichtung (Change Log Setup)` für kritische Tabellen aktivieren.
26. Extensions installieren und dokumentieren.
27. Testdaten laden.
28. UAT nach Kapitel 32 durchführen und Projektartefakte aus Kapitel 39 nutzen.
29. Go-Live-Checkliste unterschreiben.
30. Produktivbetrieb mit Admin-Kalender starten.

Prüfungsfalle:
- Stammdaten können schnell angelegt werden. Das Setup darunter entscheidet aber, ob die späteren Buchungen richtig in Bilanz, GuV, USt, Lager und Reporting landen.

### Vollständige operative Tagesroutine nach Rolle

| Rolle | Tagesstart | operative Arbeit | Tagesende |
|---|---|---|---|
| Verkauf | offene Angebote/Aufträge prüfen | Auftrag, Preis, Verfügbarkeit, Lieferung, Rechnung | gebuchte Rechnungen und offene Lieferungen prüfen |
| Einkauf | Bestellvorschläge und offene Bestellungen prüfen | Bestellung, Wareneingang, Eingangsrechnung | Preis-/Mengenabweichungen klären |
| Lager einfach | offene Eingänge/Ausgänge prüfen | direkt empfangen, liefern, zählen | Item Ledger und Differenzen prüfen |
| Lager gesteuert | Warehouse Receipts, Put-aways, Picks prüfen | Receive, Put-away, Pick, Ship | offene Warehouse-Aktivitäten schließen |
| Fertigung | offene Fertigungsaufträge prüfen | Material, Output, Ausschuss, Nacharbeit | Verbrauch/Output und Abweichung prüfen |
| Service | offene Serviceaufträge prüfen | Diagnose, Ersatzteil, Ressource, Faktura | Servicekosten und Vertragsfälle prüfen |
| Projektleitung | Projektaufgaben prüfen | Ressourcen, Einkauf, WIP, Rechnung | Budget/Ist prüfen |
| Buchhaltung | offene Posten und Journale prüfen | Rechnungen, Zahlungen, USt, Anlagen | OP, Bank, Fehlerjournal prüfen |
| Controlling | GuV und Abweichungen prüfen | Drilldown, Dimensionen, Margen | Ursachenliste aktualisieren |
| Admin/Superuser | Job Queue, Fehler, Nutzer prüfen | Rechte, Setup, Change Requests | kritische Änderungen dokumentieren |

### Vollständige Fehler- und Korrekturmatrix

| Bereich | typischer Fehler | zuerst prüfen | Korrekturweg |
|---|---|---|---|
| Stammdaten | falsche Buchungsgruppe | Karte, Posting Setup, Testbuchung | Stammdaten ändern, Altbelege fachlich korrigieren |
| Verkauf | falscher Preis | Price List, Menge, Datum, Kunde | Belegzeile neu validieren oder Gutschrift |
| Einkauf | falscher Kreditor | Bestellung, Rechnung, OP | stornieren/gutschreiben und neu erfassen |
| USt | falsche VAT Group | Debitor/Kreditor, Artikel, VAT Setup | Steuerkorrektur mit Finance-Freigabe |
| Lager | falscher Lagerort | Item Ledger, Location, Bin | Umlagerung oder Korrekturjournal |
| Warehouse | offene Aktivität | Warehouse Entries, Put-away/Pick | Aktivität abschließen oder korrigieren |
| Fertigung | falscher Verbrauch | Production Order, Item Ledger | Verbrauch korrigieren, Kostenlauf |
| Projekt | falsche Aufgabe | Project Ledger Entries | Umbuchung/Korrekturjournal |
| Bank | falscher Ausgleich | Ledger Entries, Applies-to ID | Unapply und neu ausgleichen |
| Dimension | fehlende Dimension | G/L Entries, Dimension Set | Dimension Correction, wenn zulässig |
| Abschluss | falsche Periode | Posting Date, Accounting Periods | Storno und korrekte Periode |
| Reporting | falscher Filter | Filter, Analysis View, Dimension | Filter korrigieren, Analysis View aktualisieren |

### Vollständige Berichtsmatrix

| Bericht | Ziel | Mindestfilter | Nutzer |
|---|---|---|---|
| Financial Reports GuV | Ergebnis sehen | Datum, Company, Dimension | Controller, Finance |
| Financial Reports Bilanz | Vermögen/Schulden sehen | Datum, Company | Finance-Leitung |
| General Ledger Entries | Buchungsspur prüfen | Konto, Datum, Belegnr. | Buchhaltung |
| Customer Ledger Entries | Forderungen prüfen | Kunde, offen, Fälligkeit | Debitorenbuchhaltung |
| Vendor Ledger Entries | Verbindlichkeiten prüfen | Kreditor, offen, Fälligkeit | Kreditorenbuchhaltung |
| VAT Entries | Steuer prüfen | Datum, VAT Bus./Prod. Group | Steuerteam |
| Inventory Valuation | Lagerwert prüfen | Datum, Lagerort, Artikel | Controlling |
| Item Ledger Entries | Menge prüfen | Artikel, Lagerort, Datum | Lager |
| Value Entries | Wert prüfen | Artikel, Beleg, Datum | Controlling/Finance |
| Aged Accounts Receivable | überfällige Kunden | Stichtag | Debitoren |
| Aged Accounts Payable | Zahlungsplanung | Stichtag | Kreditoren |
| Dimensions - Detail | Reportingdimension prüfen | Dimension, Datum | Controller |
| Project Reports | Projektmarge prüfen | Projekt, Aufgabe | Projektleitung |
| Production Order Statistics | Fertigungskosten prüfen | Auftrag | Fertigung/Controlling |
| Change Log Entries | Setupänderung prüfen | Tabelle, Nutzer, Datum | Admin/Audit |

### Was im Standard bewusst nicht vollständig gelöst wird

| Thema | Warum nicht vollständig Standard? | Entscheidung |
|---|---|---|
| komplexes Mietmodell | Laufzeit, Vertragsänderungen, Rückgabe, Bewertung | Extension oder Customizing prüfen |
| Finanzierung/Leasing | rechtliche und bilanzielle Varianten | Fachkonzept plus Extension |
| globale Steuerberechnung | länderspezifische Regeln, OSS, Reihengeschäfte | Tax Engine/Steuerberatung |
| komplexes WMS | Scanner, Touren, Packstraßen, Gefahrgut | WMS-Extension |
| EDI | partnerabhängige Formate | EDI-Extension |
| DATEV-Tiefe | Kanzleiprozesse, Kontierungslogik | DACH-Extension |
| Konzernkonsolidierung | Eliminierung, IFRS, Konzernabschluss | Zusatzlösung/Reporting |
| Payroll | Lohn ist nicht BC-Kernstandard | externe Lohnlösung |

Merksatz:
- Vollständigkeit heißt nicht, alles im Standard zu erzwingen. Vollständigkeit heißt, Standard, Extension und Individualentwicklung sauber zu unterscheiden.

---

### Rollenbasierte Abschlussprüfung

Dieses Kapitel ist der Abschlusstest. Wer diese Punkte praktisch durchführen kann, ist kein reiner Leser mehr, sondern kann in Business Central arbeiten, Fehler erkennen und mit Key Usern sprechen.

### Mindestkompetenz nach Rollen

| Rolle | Muss nach dem Buch können |
|---|---|
| Einsteiger | suchen, filtern, Company prüfen, Belege/Posten unterscheiden |
| Verkauf | Auftrag erfassen, Preise prüfen, Lieferung/Rechnung buchen, Retoure verstehen |
| Einkauf | Bestellung erfassen, Wareneingang/Rechnung prüfen, Preisabweichung klären |
| Lager | einfaches und gesteuertes Lager bedienen, Bins und offene Aktivitäten prüfen |
| Fertigung | Stückliste, Arbeitsplan, Auftrag, Verbrauch, Output und Abweichung erklären |
| Service | Serviceartikel, Auftrag, Vertrag, Garantie/Kulanz einordnen |
| Projektleitung | Projektaufgaben, Ressourcen, WIP, Faktura und Marge prüfen |
| Buchhaltung | OP, Journal, Bank, USt, Anlagen, Abschluss und Korrekturwege bedienen |
| Controller | GuV, Bilanz, Dimensionen, Marge, Lagerwert und Drilldown analysieren |
| Admin | Nutzer, Rechte, Profile, Job Queue, Change Log, Extensions und Setup kontrollieren |
| Superuser | Prozessdesign, UAT, Fehleranalyse, Evidence Pack und Standardgrenzen führen |

### Praktische Abschlussprüfung

Der Leser muss folgende End-to-End-Fälle im Trainingsmandanten durchführen:

1. neuen Debitor mit Dimension und USt-Logik anlegen.
2. neuen Kreditor mit Einkaufspreis anlegen.
3. Artikel mit Einheit, Kostenmethode, Verkaufspreis und Lagerort anlegen.
4. B2B-Verkaufsauftrag erstellen, liefern, fakturieren und Posten prüfen.
5. Einkaufsbestellung erstellen, Wareneingang buchen, Rechnung buchen und OP prüfen.
6. Ware im einfachen Lager direkt empfangen und liefern.
7. Ware im gesteuerten Lager über Receipt, Put-away, Pick und Shipment bewegen.
8. Inventurdifferenz buchen und Lagerwert prüfen.
9. Fertigungsauftrag mit Verbrauch und Output buchen.
10. Serviceauftrag mit Ersatzteil und Arbeitszeit fakturieren.
11. Projektaufwand erfassen und abrechnen.
12. Bankzahlung ausgleichen und Unapply-Fall erklären.
13. Anlage kaufen, aktivieren und Abschreibung buchen.
14. USt-Inlandfall buchen und VAT Entries prüfen.
15. EU-B2B-Fall mit USt-ID-Prüfung erklären.
16. Drittlandexport als Nachweisfall erklären.
17. Dropshipping-Inlandsfall buchen.
18. Dropshipping-Auslandsfall als TaxScenario dokumentieren.
19. Intercompany-Fall zwischen zwei Companies abstimmen.
20. Financial Report GuV mit Dimension filtern und Abweichung erklären.
21. falsche Dimension korrigieren oder Korrekturweg begründen.
22. gebuchte falsche Verkaufsrechnung über Gutschrift korrigieren.
23. Permission Set und Rollenprofil für neuen Nutzer zuweisen.
24. Job Queue und Change Log prüfen.
25. Evidence Pack für einen Prozess vollständig zusammenstellen.

### Vollständigkeitsdefinition für dieses Buch

Das Buch gilt für den Trainingszweck als vollständig, wenn jeder Prozessbereich diese Elemente enthält:

| Element | Mindestanforderung |
|---|---|
| Quelle | Microsoft Learn oder amtliche Primärquelle |
| Zweck | fachlicher Nutzen in Einsteigersprache |
| Setup | relevante Einrichtung und Stammdaten |
| Bedienung | Seite/Suchbegriff und Schrittfolge |
| Beispiel | konkrete Musterfirma mit Zahlen/Daten |
| Posten | betroffene Entries und Hauptbuchwirkung |
| Bericht | Kontrollbericht oder Auswertung |
| Fehler | typische Stolpersteine |
| Korrektur | fachlicher Korrekturweg |
| Evidence | Nachweispaket |
| Standardgrenze | Standard, Extension oder Programmierung |
| UAT | mindestens Happy Path und Abweichung |

### Prozessvarianten im Prüf- und Schulungsumfang

Die Prozesslandkarte enthält die prüf- und schulungsrelevanten Varianten je Prozessbereich. Die Varianten werden über Prozesskapitel, UAT-Fälle, Lösungsanhang und MB-800-Kompetenzmatrix nachgewiesen.

| Prozessbereich | Varianten im Buch |
|---|---|
| Verkauf/O2C | Vorauszahlung, Teillieferung, Retoure, Mahnung, Auslandsverkauf, Dropshipping |
| Einkauf/P2P | 3-Way-Match, E-Rechnung, Teillieferung, Preisabweichung, Rücksendung, wiederkehrende Einkaufszeilen |
| Lager/Warehouse | Charge, Serie, Umlagerung, Inventur, falscher Lagerplatz, gesteuerte und einfache Lagerlogik |
| Fertigung | Ausschuss, Nacharbeit, Fremdarbeit, Kostenabweichung, Verbrauch und Output |
| Finance/R2R | Abgrenzung, Bank, UStVA, Anlagen, Abschluss, OP-Ausgleich, Korrekturen |
| Administration | neuer Nutzer, Rechteänderung, Extension-Test, Job-Fehler, Change Log, Monitoring |

Merksatz:
- Dieses Buch ist ein systematisches Durchspielbuch: Es verbindet Greenfield-Einrichtung, Standardprozess, Abweichung, Korrektur, UAT und Evidence Pack.

---

### Struktur- und Konsistenzprüfung

Die Qualitätssicherung liegt in Teil F, damit der Hauptfluss nicht durch Meta-Erklärungen unterbrochen wird. Sie prüft die sechs Teile, die fortlaufende Nummerierung, die Prozessvollständigkeit und die Nachweisfähigkeit der Kapitel.

| Prüffeld | Sollzustand | Nachweis im Buch |
|---|---|---|
| Struktur | sechs Teile, Kapitel 1 bis 40 | Inhaltsverzeichnis und Kapitelüberschriften |
| Grundlagen | Teil B enthält Companies, Stammdaten, Foundation, Buchungsgruppen und Dimensionen | Kapitel 6 bis 10 |
| Operative Prozesse | jeder Prozess enthält Bedienpfad, Testdaten, Buchungsspur, Fehlerdiagnose, Übung, Lösung und UAT | Kapitel 11 bis 18 |
| Finance und Abschluss | OP, Bank, Anlagen, USt, Lagerbewertung, Abschluss und Reporting sind prüfbar | Kapitel 19 bis 25 |
| Projekt und Betrieb | Fit-Gap, Security, Migration, Integration, Betrieb und Architektur sind entscheidungsfähig | Kapitel 26 bis 31 |
| Training und Nachschlagen | UAT, Übungen, MB-800, Microsoft Learn, Glossar, Seitenindex, Artefakte und Quellen sind auffindbar | Kapitel 32 bis 40 |

Merksatz:
- Qualität im BC-Buch bedeutet nicht mehr Kapitel, sondern verlässliche Kapitel: Zweck, Bedienung, Posten, Fehler, Korrektur, UAT und Nachweis.
### Fachliche Praxisanker: Buchungslogik, Dimensionen, Posten, Kosten, Anlagen und Bank

Dieses Kapitel bündelt die fachlichen Kernmodelle, die jeder Consultant und Key User sicher beherrschen muss.

### Buchungslogik in BC: Posting Groups und Posting Setup

| Einrichtung | Deutsche Bedeutung | Wirkung |
|---|---|---|
| Debitorenbuchungsgruppen (Customer Posting Groups) | Forderungskonten | Debitoren-Nebenbuch auf Bilanzkonto |
| Kreditorenbuchungsgruppen (Vendor Posting Groups) | Verbindlichkeitskonten | Kreditoren-Nebenbuch auf Bilanzkonto |
| Bankkontobuchungsgruppen (Bank Account Posting Groups) | Bankkontenfindung | Bankkonto im Hauptbuch |
| Lagerbuchungsgruppen (Inventory Posting Groups) | Bestandkonten nach Lager/Artikel | Vorratskonten |
| Geschäftsbuchungsgruppen (General Business Posting Groups) | Wer kauft/verkauft? | Partner-/Marktlogik |
| Produktbuchungsgruppen (General Product Posting Groups) | Was wird verkauft/gekauft? | Erlös-/Aufwandslogik |
| Allgemeine Buchungsmatrix Einrichtung (General Posting Setup) | Kombination Geschäft/Produkt | Erlös, Aufwand, Wareneinsatz |
| USt-Geschäftsbuchungsgruppen (VAT Business Posting Groups) | steuerliche Partnerlogik | USt-Sachverhalt |
| USt-Produktbuchungsgruppen (VAT Product Posting Groups) | steuerliche Produktlogik | Steuersatz/Steuerart |
| USt-Buchungsmatrix Einrichtung (VAT Posting Setup) | Steuerkombination | USt-/Vorsteuerkonten |
| Lagerbuchungsmatrix Einrichtung (Inventory Posting Setup) | Lagerwertkonten | Bestand nach Lagerort |

Diagnosepfad:
1. Beleg öffnen.
2. Debitor/Kreditor/Artikel prüfen.
3. Buchungsgruppen prüfen.
4. Buchungsmatrix prüfen.
5. Buchungsvorschau prüfen.
6. Gebuchte Posten prüfen.


### Buchungsspur-Atlas

| Vorgang | Hauptposten |
|---|---|
| Verkaufsrechnung | Debitorenposten, Sachposten, USt-Posten, Artikelposten, Wertposten |
| Einkaufsrechnung | Kreditorenposten, Sachposten, USt-Posten, Artikel-/Wertposten |
| Zahlung | Debitoren-/Kreditorenposten, detaillierte Posten, Bank-/Sachposten |
| Bankabstimmung | Bankposten, Sachposten, Ausgleichsnachweis |
| Anlagenzugang | Anlagenposten, Sachposten |
| Abschreibung | Anlagenposten, Sachposten |
| Lagerbewegung | Artikelposten, Wertposten |
| Fertigung Output | Artikelposten, Kapazitätsposten, Wertposten |
| Serviceverbrauch | Serviceposten, Artikelposten, Sachposten |
| Projektverbrauch | Projektposten, Sachposten |
| Abgrenzung | Sachposten über Perioden |
| Vorauszahlung | Vorauszahlungsrechnung, Debitor/Kreditor, USt, Sachposten |
| Gutschrift | Gegenposten zu Rechnung, USt-Korrektur |
| Journalstorno | Umkehrposten im Hauptbuch |

### Inventory Costing und Lagerbewertung

Lagerbewertung verbindet Artikelposten, Wertposten und Sachposten. Die monatliche Kontrolle nutzt Lagerbewertung, Kostenregulierung und Abgleich mit dem Hauptbuch.

| Thema | Prüfung |
|---|---|
| Kostenmethode | FIFO, Durchschnitt, Standard etc. |
| erwartete Kosten | Wareneingang ohne Rechnung |
| fakturierte Kosten | endgültige Rechnungskosten |
| Kostenregulierung | Adjust Cost - Item Entries |
| Lagerwert ins Hauptbuch | Post Inventory Cost to G/L |
| negative Bestände | Prozess- und Bewertungsrisiko |
| Wareneinsatz | COGS gegen Erlöse |

### Anlagen

| Bereich | Setup/Prozess |
|---|---|
| Anlagen Einrichtung | Nummern, Buchungslogik |
| AfA-Bücher | handels-/steuernahe Logik |
| Anlagenklassen/-unterklassen | Struktur |
| Anlagenbuchungsgruppen | Kontenfindung |
| Hauptanlagen/Komponenten | Anlagenstruktur |
| Zugang | Einkaufsrechnung oder Anlagenjournal |
| Abschreibung | AfA-Lauf |
| Abgang | Verkauf/Verschrottung |
| Nachweis | Anlagenposten und Sachposten |

### Bank, Payments und OP-Ausgleich

| Funktion | Zweck |
|---|---|
| Zahlungsjournal | Kreditorenzahlungen |
| Zahlungseingangsjournal | Debitorenzahlungen |
| Zahlungsregistrierung | vereinfachter Ausgleich |
| Posten ausgleichen | Rechnung und Zahlung verbinden |
| Ausgleich aufheben | falschen Ausgleich korrigieren |
| Bankkontoabstimmung | Bank gegen Buchhaltung abstimmen |
| Teilzahlung | Restposten bleibt offen |
| Skonto | Zahlungsbedingung reduziert Betrag |
| Überzahlung | Klärung/Restposten |
| unbekannte Zahlung | Klärposten |

### Fehlerdiagnose nach Symptom

| Symptom | Erst prüfen | Korrektur |
|---|---|---|
| Rechnung bucht nicht | Pflichtfeld, Freigabe, Dimension, USt | Beleg korrigieren |
| USt falsch | VAT Posting Setup, Partner, Artikel | Gutschrift/Korrektur |
| Marge falsch | Preis, Kosten, Rabatt, Kostenlauf | Preis/Kostenlauf prüfen |
| Lagerwert falsch | Value Entries, Kostenregulierung | Adjust Cost und Abstimmung |
| GuV leer nach Dimension | Dimension, Filter, Analysis View | Dimension Correction/Update |
| Zahlung gleicht nicht aus | Applies-to, Währung, Restbetrag | Unapply und neu ausgleichen |
| User sieht Seite nicht | Profil, Berechtigung, Lizenz | Permission Set/Rolle |
| Job Queue läuft nicht | Fehler, Benutzer, nächste Ausführung | Job korrigieren/neustarten |
| Integration hängt | Queue, Token, Mapping | Monitoring/Support |
| Analysis View ist alt | Aktualisierung | Analysis View Update |
| Beleg ist gebucht | gebuchter Beleg nicht direkt ändern | Gutschrift/Storno/Korrektur |

---

## 39. Projektartefakte

Dieses Kapitel liefert direkt nutzbare Templates.

### Fit-Gap-Matrix

| Anforderung | Standard | Setup | Prozessdesign | Extension | Custom | Entscheidung | UAT |
|---|---|---|---|---|---|---|---|
|  | Ja/Nein |  |  |  |  |  |  |

### Prozessaufnahme-Template

| Prozess | Rolle | Trigger | Eingabe | Aktion | Beleg | Posten | Bericht | Fehler | Nachweis |
|---|---|---|---|---|---|---|---|---|---|

### Stammdaten-Template

| Objekt | Pflichtfeld | Datenowner | Quelle | Validierung | Freigabe | Fehlerregel |
|---|---|---|---|---|---|---|

### Migration-Mapping

| Altfeld | BC-Feld | Tabelle/Seite | Transformation | Pflicht | Testfall | Freigabe |
|---|---|---|---|---|---|---|

### UAT-Testfall-Template

| Feld | Inhalt |
|---|---|
| ID |  |
| Ziel |  |
| Prozess |  |
| Rolle |  |
| Voraussetzung |  |
| Testdaten |  |
| Schrittfolge |  |
| erwartete Belege |  |
| erwartete Posten |  |
| Kontrollbericht |  |
| Negativfall |  |
| Akzeptanzkriterium |  |
| Evidence Pack |  |
| Ergebnis |  |
| Lösungshinweis |  |

### Rollen-/Berechtigungsmatrix

| Rolle | Profil | Permission Sets | Companies | kritische Rechte | SoD-Konflikt | Review |
|---|---|---|---|---|---|---|

### Security-/SoD-Matrix

| Konflikt | Risiko | Rolle A | Rolle B | Kontrolle | Freigabe |
|---|---|---|---|---|---|

### Change-Request-Template

| CR-ID | Änderung | Grund | Risiko | Test | Freigabe | Rollback | Go-live |
|---|---|---|---|---|---|---|---|

### Extension-Evaluierung

| Extension | Prozess | Standardlücke | Hersteller | Test | Kosten | Risiko | Empfehlung |
|---|---|---|---|---|---|---|---|

### Architecture Decision Record

| Feld | Inhalt |
|---|---|
| Entscheidung |  |
| Kontext |  |
| Optionen | Standard / Extension / Custom / Prozessänderung |
| Entscheidungskriterien |  |
| UAT-Nachweis |  |
| Betriebsfolge |  |
| Verantwortlich |  |

### Checklisten

| Checkliste | Kernpunkte |
|---|---|
| Go-live | Stammdaten, Salden, Rollen, Schnittstellen, UAT, Support |
| Cutover | Freeze, Export, Import, Salden, Validierung, Freigabe |
| Hypercare Issue Log | ID, Symptom, Ursache, Workaround, Fix, Owner |
| Evidence Pack | Beleg, Posten, Bericht, Freigabe, Nachweis |
| Release Wave | Release Notes, Testplan, Extensions, Rollen, Training |
| Job Queue | Fehler, Laufzeit, Verantwortlicher, Neustart |
| Monatsabschluss | OP, Bank, Lagerwert, USt, Anlagen, GuV |
| USt-Abstimmung | VAT Entries, Sachkonten, UStVA, ZM, Nachweise |
| Lagerwert | Item Ledger, Value Entries, Inventory Valuation, G/L |
| Berechtigungsreview | Nutzer, Rollen, Permission Sets, SoD, SUPER |

---


## 40. Quellenverzeichnis

- [Q1] Microsoft Learn: Business Central documentation: https://learn.microsoft.com/en-us/dynamics365/business-central/
- [Q2] Microsoft Learn: Business functionality supported by Business Central: https://learn.microsoft.com/en-us/dynamics365/business-central/across-business-functionality
- [Q3] Microsoft Learn: Set up companies: https://learn.microsoft.com/en-us/dynamics365/business-central/about-new-company
- [Q4] Microsoft Learn: Users and permissions: https://learn.microsoft.com/en-us/dynamics365/business-central/ui-how-users-permissions
- [Q5] Microsoft Learn: Workflows in Business Central: https://learn.microsoft.com/en-us/dynamics365/business-central/across-workflow
- [Q6] Microsoft Learn: Auditing changes: https://learn.microsoft.com/en-us/dynamics365/business-central/across-log-changes
- [Q7] Microsoft Learn: Manage sales: https://learn.microsoft.com/en-us/dynamics365/business-central/sales-manage-sales
- [Q8] Microsoft Learn: Sell products with sales orders: https://learn.microsoft.com/en-us/dynamics365/business-central/sales-how-sell-products
- [Q9] Microsoft Learn: Process sales returns or cancellations: https://learn.microsoft.com/en-us/dynamics365/business-central/sales-how-process-sales-returns-cancellations
- [Q10] Microsoft Learn: Shopify connector overview: https://learn.microsoft.com/en-us/dynamics365/business-central/shopify/get-started
- [Q11] Microsoft Learn: Manage purchasing: https://learn.microsoft.com/en-us/dynamics365/business-central/purchasing-manage-purchasing
- [Q12] Microsoft Learn: Record purchases: https://learn.microsoft.com/en-us/dynamics365/business-central/purchasing-how-record-purchases
- [Q13] Microsoft Learn: Use e-documents in purchase process: https://learn.microsoft.com/en-us/dynamics365/business-central/finance-how-use-edocuments-purchase
- [Q14] Microsoft Learn: Setting up inventory: https://learn.microsoft.com/en-us/dynamics365/business-central/inventory-setup-inventory
- [Q15] Microsoft Learn: Warehouse management overview: https://learn.microsoft.com/en-us/dynamics365/business-central/warehouse-manage-warehouse
- [Q16] Microsoft Learn: Supply planning: https://learn.microsoft.com/en-us/dynamics365/business-central/production-planning
- [Q17] Microsoft Learn: Assembly management: https://learn.microsoft.com/en-us/dynamics365/business-central/assembly-assemble-items
- [Q18] Microsoft Learn: Production orders: https://learn.microsoft.com/en-us/dynamics365/business-central/production-about-production-orders
- [Q19] Microsoft Learn: Service management setup: https://learn.microsoft.com/en-us/dynamics365/business-central/service-setup-service
- [Q20] Umsatzsteuergesetz (UStG): https://www.gesetze-im-internet.de/ustg_1980/
- [Q21] Abgabenordnung (AO) § 147 Aufbewahrung: https://www.gesetze-im-internet.de/ao_1977/__147.html
- [Q22] BMF-Schreiben vom 14.07.2025: GoBD, 2. Änderung: https://www.bundesfinanzministerium.de/Content/DE/Downloads/BMF_Schreiben/Weitere_Steuerthemen/Abgabenordnung/2025-07-14-GoBD-2-aenderung.pdf
- [Q23] Microsoft Learn: Set up VAT: https://learn.microsoft.com/en-us/dynamics365/business-central/finance-setup-vat
- [Q24] BZSt: Umsatzsteuer und Zusammenfassende Meldung: https://www.bzst.de/DE/Unternehmen/Umsatzsteuer/umsatzsteuer_node.html
- [Q25] Microsoft Learn: Defer revenues and expenses: https://learn.microsoft.com/en-us/dynamics365/business-central/finance-how-defer-revenue-expenses
- [Q26] Microsoft Learn: Manage fixed assets: https://learn.microsoft.com/en-us/dynamics365/business-central/fa-manage
- [Q27] Microsoft Learn: Create projects: https://learn.microsoft.com/en-us/dynamics365/business-central/projects-how-create-jobs
- [Q28] Microsoft Learn: Financial reports and analysis: https://learn.microsoft.com/en-us/dynamics365/business-central/finance-reports
- [Q29] Microsoft Learn: Set up intercompany transactions: https://learn.microsoft.com/en-us/dynamics365/business-central/intercompany-how-setup
- [Q30] EUR-Lex: Richtlinie 2006/112/EG Mehrwertsteuer-Systemrichtlinie: https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32006L0112
- [Q31] Microsoft Learn: Currencies in Business Central: https://learn.microsoft.com/en-us/dynamics365/business-central/finance-currencies
- [Q32] Microsoft Learn: Job queue: https://learn.microsoft.com/en-us/dynamics365/business-central/admin-job-queues-schedule-tasks
- [Q33] Microsoft Learn: Analyze data in Business Central: https://learn.microsoft.com/en-us/dynamics365/business-central/analysis-mode
- [Q34] Microsoft Learn: Business Central APIs and web services: https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/webservices/web-services
- [Q35] Microsoft Learn: Manage AppSource apps: https://learn.microsoft.com/en-gb/dynamics365/business-central/admin-manage-appsource-apps
- [Q36] Continia Docs: Document Capture business functionality: https://docs.continia.com/en-us/continia-document-capture/getting-started/business-functionality
- [Q37] Continia Docs: Getting started with Document Capture: https://docs.continia.com/en-us/continia-document-capture/getting-started/overview
- [Q38] Continia Docs: Getting started with Expense Management: https://docs.continia.com/en-us/continia-expense-management/getting-started/overview
- [Q39] Continia Docs: Expense Management overview: https://docs.continia.com/en-us/continia-expense-management/
- [Q40] Continia Docs: Continia OPplus overview: https://docs.continia.com/en-us/continia-opplus
- [Q41] Continia Docs: Overview of setting up OPplus: https://docs.continia.com/en-us/continia-opplus/setting-up-opplus/overview-of-setting-up-opplus/
- [Q42] COSMO Docs: COSMO Advance Payment installation: https://docs.cosmoconsult.com/en-us/business-central/project-manufacturing-pack/getting-started/install-reg-apt/install-apt.html
- [Q43] Microsoft Learn: Set up prices and discounts: https://learn.microsoft.com/en-gb/dynamics365/business-central/across-prices-and-discounts
- [Q44] Microsoft Learn Training: Manage sales prices in Business Central: https://learn.microsoft.com/en-us/training/modules/manage-sales-prices-dynamics-365-business-central/
- [Q45] Microsoft Learn: Set up customer price groups: https://learn.microsoft.com/en-gb/dynamics365/business-central/sales-how-to-set-up-customer-price-groups
- [Q46] Microsoft Learn: Record special purchase prices and discounts: https://learn.microsoft.com/en-us/dynamics365/business-central/purchasing-how-record-purchase-price-discount-payment-agreements
- [Q47] Microsoft Learn: Setting up sales: https://learn.microsoft.com/en-us/dynamics365/business-central/sales-setup-sales
- [Q48] Microsoft Learn: Prepare financial reporting with financial data and account categories: https://learn.microsoft.com/en-us/dynamics365/business-central/bi-how-work-account-schedule
- [Q49] Microsoft Learn: Work with dimensions: https://learn.microsoft.com/en-us/dynamics365/business-central/finance-dimensions
- [Q50] Microsoft Learn: Dimensions - Detail report: https://learn.microsoft.com/en-us/dynamics365/business-central/reports/report-28
- [Q51] Microsoft Learn: Financial reports and analysis: https://learn.microsoft.com/en-us/dynamics365/business-central/finance-reports
- [Q52] Microsoft Learn: Finding pages and information with Tell Me: https://learn.microsoft.com/en-us/dynamics365/business-central/ui-search
- [Q53] Microsoft Learn: Personalize your workspace: https://learn.microsoft.com/en-us/dynamics365/business-central/ui-personalization-user
- [Q54] Microsoft Learn: Customize pages for profiles: https://learn.microsoft.com/en-us/dynamics365/business-central/ui-personalization-manage
- [Q55] Microsoft Learn: Manage users and roles: https://learn.microsoft.com/en-us/dynamics365/business-central/admin-users-profiles-roles
- [Q56] Microsoft Learn: Keyboard shortcuts in Business Central: https://learn.microsoft.com/en-gb/dynamics365/business-central/keyboard-shortcuts
- [Q57] Microsoft Learn: Sort, search, and filter data in lists, reports, or XMLports: https://learn.microsoft.com/en-us/dynamics365/business-central/ui-enter-criteria-filters
- [Q58] Microsoft Learn: Undo a posting using a reversing entry: https://learn.microsoft.com/en-us/dynamics365/business-central/finance-how-reverse-journal-posting
- [Q59] Microsoft Learn: Troubleshoot and correct dimensions: https://learn.microsoft.com/en-us/dynamics365/business-central/finance-troubleshooting-correcting-dimensions
- [Q60] Microsoft Learn: Close accounting periods for a fiscal year: https://learn.microsoft.com/en-us/dynamics365/business-central/year-close-account-periods
- [Q61] Microsoft Learn: Understand the general ledger and Chart of Accounts: https://learn.microsoft.com/en-us/dynamics365/business-central/finance-general-ledger
- [Q62] Microsoft Learn: Managing inventory costs: https://learn.microsoft.com/en-us/dynamics365/business-central/finance-set-up-inventory-valuation-and-costing
- [Q63] Microsoft Learn: Track item cost adjustments: https://learn.microsoft.com/en-us/dynamics365/business-central/finance-track-inventory-costs
- [Q64] Microsoft Learn: General Ledger Entries report: https://learn.microsoft.com/en-gb/dynamics365/business-central/finance-powerbi-general-ledger-entries
- [Q65] Microsoft Learn: Walkthrough receiving and putting away in basic warehousing: https://learn.microsoft.com/en-us/dynamics365/business-central/walkthrough-receiving-and-putting-away-in-basic-warehousing
- [Q66] Microsoft Learn: Walkthrough receiving and putting away in advanced warehousing: https://learn.microsoft.com/en-us/dynamics365/business-central/walkthrough-receiving-and-putting-away-in-advanced-warehousing
- [Q67] Microsoft Learn: Design details warehouse setup: https://learn.microsoft.com/en-us/dynamics365/business-central/design-details-warehouse-setup
- [Q68] Microsoft Learn: Put items away: https://learn.microsoft.com/en-gb/dynamics365/business-central/warehouse-put-away-items
- [Q69] Microsoft Learn: Administration tasks in Business Central: https://learn.microsoft.com/en-us/dynamics365/business-central/admin-setup-and-administration
- [Q70] Microsoft Learn: Create users according to licenses: https://learn.microsoft.com/en-us/dynamics365/business-central/ui-how-users-permissions
- [Q71] Microsoft Learn: Define granular permissions: https://learn.microsoft.com/en-us/dynamics365/business-central/ui-define-granular-permissions
- [Q72] Microsoft Learn: Special permission sets: https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/administration-special-permission-sets
- [Q73] Microsoft Learn: Make drop shipments: https://learn.microsoft.com/en-us/dynamics365/business-central/sales-how-drop-shipment
- [Q74] Microsoft Learn: Validate VAT registration numbers: https://learn.microsoft.com/en-gb/dynamics365/business-central/finance-how-validate-vat-registration-number
- [Q75] Microsoft Learn: Set up email: https://learn.microsoft.com/en-us/dynamics365/business-central/admin-how-setup-email
- [Q76] Microsoft Learn: Set the layout used by a report: https://learn.microsoft.com/en-us/dynamics365/business-central/ui-set-report-layout
- [Q77] Microsoft Learn: Send documents and emails: https://learn.microsoft.com/en-us/dynamics365/business-central/ui-how-send-documents-email
- [Q78] Microsoft Learn: Report selection for documents in Business Central: https://learn.microsoft.com/en-us/dynamics365/business-central/across-report-selections
- [Q79] Microsoft Learn: Approve or reject documents in workflows: https://learn.microsoft.com/en-us/dynamics365/business-central/across-how-use-approval-workflows
- [Q80] Microsoft Learn: Use Excel to import data with configuration packages: https://learn.microsoft.com/en-ca/dynamics365/business-central/across-import-data-configuration-packages
- [Q81] Microsoft Learn: Monitoring and analyzing telemetry: https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/telemetry-overview
- [Q82] Microsoft Learn: Analyze job queue lifecycle trace telemetry: https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/administration/telemetry-job-queue-lifecycle-trace
- [Q83] Microsoft Learn: How to work with a performance problem: https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/performance/performance-work-perf-problem
- [Q84] Microsoft Learn: Work with recurring revenue in Business Central: https://learn.microsoft.com/en-us/dynamics365/business-central/finance-recurring-invoicing
- [Q85] Microsoft Learn: Use allocation keys in general journals: https://learn.microsoft.com/en-us/dynamics365/business-central/ui-how-use-allocation-keys-general-journals
- [Q86] Microsoft Learn: Study guide for Exam MB-800: Microsoft Dynamics 365 Business Central Functional Consultant: https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/mb-800
- [Q87] Microsoft Learn: Microsoft Certified: Dynamics 365 Business Central Functional Consultant Associate: https://learn.microsoft.com/en-us/credentials/certifications/d365-business-central-functional-consultant-associate/
- [Q88] Microsoft Learn: Get started with Microsoft Dynamics 365 Business Central: https://learn.microsoft.com/en-us/training/paths/get-started-dynamics-365-business-central/
- [Q89] Microsoft Learn: Microsoft Dynamics 365 Business Central training: https://learn.microsoft.com/en-us/training/dynamics365/business-central
