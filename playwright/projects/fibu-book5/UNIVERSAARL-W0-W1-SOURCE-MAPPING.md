# Universaarl W0/W1 Source Mapping - PREP-026

Status: `prep-done`

Instanz: `playthru`

Zielcompany: `UNIVERSAARL-DE` (`planned-not-yet-created`)

Modus: Quellen- und Claim-Mapping ohne Business-Central-Ausfuehrung

## Ziel

Dieses Mapping begrenzt die ersten Universaarl-Claims auf W0/W1:

- W0 Company Context,
- Company Creation,
- My Settings / Company-Kontext,
- Company Information,
- Assisted Setup / Manual Setup,
- Number Series,
- Posting Groups,
- VAT Setup,
- Dimensions.

Microsoft Learn darf hier Produkt- und Setup-Aussagen stuetzen. Es beweist nicht, dass `UNIVERSAARL-DE` in `playthru` existiert, eingerichtet ist oder Daten enthaelt.

## Quellenentscheidungen

| Bereich | Quelle | Darf stuetzen | Darf nicht stuetzen | Universaarl-Evidence bleibt noetig fuer |
| --- | --- | --- | --- | --- |
| Company / Environment | Microsoft Learn: Create new companies in Business Central | Company als Container fuer Geschaeftsdaten; Company vs Environment; SUPER-Permission; Templates `Evaluation - Sample Data`, `Production - Setup Data Only`, `Create New - No Data`; Copy Company als eigener Weg | dass `UNIVERSAARL-DE` existiert; welche Option in `playthru` sichtbar war; dass eine Option deutsch/final geeignet ist | Mandantenliste, `UNIVERSAARL-DE`-Nichtvorhandensein/Anlage, Dropdown `Neu`, `Neues Unternehmen erstellen`, gewaehlte Datenbasis |
| My Settings | Microsoft Learn: Change basic settings | My Settings als Ort fuer persoenliche Einstellungen, Rolle und Work Date; Aenderungen betreffen den eigenen Workspace | gespeicherte Universaarl-Company-Auswahl; allgemeingueltige Sicht fuer alle Benutzer | sichtbarer Company-/Rollen-/Sprachkontext in `playthru`, keine Speicherung im read-only Lauf |
| Company Information / Setup | Microsoft Learn: Overview of tasks to set up Business Central | Jede Company braucht Company Information und Setupdaten; Assisted Setup und manuelles Setup als Setup-Werkzeuge | konkrete Universaarl-Firmendaten; Pflichtfelder in `playthru`; Setup-Erfolg | Company Information Page, sichtbare Felder, Vorher/Nachher-Setup, Setup-Entscheidung |
| Number Series | Microsoft Learn: Create number series | Nummernserien identifizieren Datensaetze, Konten, Belege und Journalzeilen; lueckenlose Nummerierung ist auditrelevant | konkrete Nummernserien in `UNIVERSAARL-DE`; deutsche Rechtsfinalitaet ohne amtliche Quelle | No. Series Page, Zeilen, Start-/Endnummern, letzte Nummer, Belegnummernwirkung |
| Posting Groups | Microsoft Learn: Posting group setup | General Business/Product Posting Groups, General Posting Setup und spezifische Posting Groups steuern Kontenfindung; Fehlersetup kann Postingfehler ausloesen | konkrete Kontenfindung in Universaarl; dass ein Beleg preview-/postingfaehig ist | sichtbare Buchungsmatrix, Kombinationen, G/L-Konten, Preview Posting und G/L Entries |
| VAT Setup | Microsoft Learn: Set up VAT | VAT Business/Product Posting Groups und VAT Posting Setup kombinieren Markt, Artikel/Ressource, Prozent, Berechnungsart und Konten | deutsche 19-Prozent-USt als erfuellt; VAT Entries oder korrekte deutsche Meldung | Universaarl VAT Setup, Preview Posting, VAT Entries, G/L Entries plus amtliche Quelle fuer Rechtsclaim |
| Dimensions | Microsoft Learn: Work with dimensions | Dimensionen kategorisieren Eintraege und unterstuetzen Analyse; Global/Shortcut Dimensions und Default Dimensions erklaeren Setup-/Analysewirkung | dass Universaarl-Dimensionen existieren; dass Belege korrekt dimensioniert sind | Dimensions, Dimension Values, Default Dimensions, Dimension Set Entries, Beleg-/Postenbeweis |

## W0/W1 Claim-Gates

| Claim | Erlaubt ab jetztss | Gate |
| --- | --- | --- |
| Eine Company ist in Business Central ein Container fuer Geschaeftsdaten einer Einheit. | ja | Produktclaim mit Microsoft-Learn-Quelle |
| Fuer neue Companies kann SUPER noetig sein. | ja | Produkt-/Permission-Claim mit Microsoft-Learn-Quelle |
| `UNIVERSAARL-DE` wurde angelegt. | nein | erst nach `TARGET-009` mit sichtbarer Mandantenliste |
| `Production - Setup Data Only` enthaelt Setupdaten ohne Sampledaten. | ja als Produktoption | fuer Universaarl erst nach sichtbarer Auswahl und Anlage |
| `Create New - No Data` ist eine Blank-Option. | ja als Produktoption | fuer Universaarl erst nach sichtbarer Auswahl und Anlage |
| `Copy Company` ist ein eigener Weg und keine Standard-Zielbasis fuer Universaarl. | ja | Produktclaim plus Projektentscheidung |
| Jede Company braucht Company Information und Setupdaten. | ja | Produkt-/Setupclaim |
| Universaarl hat bestimmte Company-Information-Felder. | nein | erst nach Company Context und Page Evidence |
| Nummernserien sind vor Belegen relevant. | ja | Produkt-/Setupclaim |
| Universaarl-Belegnummern funktionieren. | nein | erst nach Setup und Beleg-/Journal-Evidence |
| Posting Groups steuern Kontenfindung. | ja | Produkt-/Setupclaim |
| Universaarl bucht auf bestimmte Konten. | nein | erst nach Preview/Posting/Entries |
| VAT Setup berechnet/postet VAT aus Kombinationen. | ja | Produkt-/Setupclaim |
| Deutsche 19 Prozent USt ist final eingerichtet. | nein | erst nach BC-Evidence plus amtlicher Quelle |
| Dimensionen dienen Analyse und koennen auf Dokumente/Journale/Entries wirken. | ja | Produkt-/Setupclaim |
| Universaarl-Posten enthalten die geplanten Dimensionen. | nein | erst nach Buchungs- und Entry-Trace |

## Naechster Case

`PREP-031-COMPANIES-PAGE-READONLY-PLAYWRIGHT`

Die Quellenbasis ist fuer W0/W1 ausreichend eng. Der naechste praktische Schritt soll die Companies Page read-only beobachten: Hauptbutton `Neu`, Pfeil neben `Neu`, Dropdown-Eintrag `Neues Unternehmen erstellen`, `Kopieren`, `Testunternehmen`, Tooltips und Stopplisten.

## Quellen

- https://learn.microsoft.com/en-us/dynamics365/business-central/about-new-company
- https://learn.microsoft.com/en-us/dynamics365/business-central/setup
- https://learn.microsoft.com/en-us/dynamics365/business-central/ui-change-basic-settings
- https://learn.microsoft.com/en-us/dynamics365/business-central/ui-create-number-series
- https://learn.microsoft.com/en-us/dynamics365/business-central/finance-posting-groups
- https://learn.microsoft.com/en-us/dynamics365/business-central/finance-setup-vat
- https://learn.microsoft.com/en-us/dynamics365/business-central/finance-dimensions
