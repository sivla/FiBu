# Universaarl AL-/Objektanalyse-Roadmap

Aktive Zielwelt:

- Instanz: `playthru`
- Zielcompany: `UNIVERSAARL-DE`
- Musterfirma: `Universaarl GmbH`

Diese Roadmap legt fest, wann technische Objektanalyse dem Buch hilft. Sie ersetzt keine Business-Central-UI-Evidence. Sie ergaenzt nur, was ein Anwender spaeter sieht: Page, Tabelle, Feld, Action, Dialog, Request Page, Entry und Report.

## Grundsatz

Objektanalyse ist erlaubt, wenn sie eine konkrete UAT- oder Buchluecke aus `UNIVERSAARL-UAT-MATRIX.md` klaert:

- Welche Page steckt hinter einem Bildschirm?
- Welche Source Table erzeugt die Zeilen?
- Welche Felder sind Pflicht- oder Buchungsfelder?
- Welche Page Actions sind riskant?
- Welche Dialoge oder Request Pages brauchen eigene Screenshots?
- Welche Entries entstehen nach Preview/Post?
- Welche Reports oder Worksheets brauchen spaeter eigene Testfaelle?

Nicht erlaubt:

- AL-/Objektanalyse als Beweis, dass ein Prozess in `UNIVERSAARL-DE` funktioniert.
- Buchungswirkung aus Metadaten ableiten.
- fehlende UI-Screenshots durch technische Objektlisten ersetzen.
- Masseninventar ohne konkrete UAT-/Buchfrage.

## Objektanalyse-Level

| Level | Zweck | Beispiel | Reicht fuer Buchclaim? |
| --- | --- | --- | --- |
| `object-id-context` | Page ID, Page Name, Source Table, Table ID erfassen. | Page Inspection fuer `Mandanten` / Companies. | nur fuer technische Einordnung |
| `field-role-map` | Feldrolle beschreiben: Anzeige, Pflichtfeld, Lookup, Buchungsfeld, Filterfeld. | `Direct Unit Cost`, `Quantity`, `Posting Date`. | nur mit UI-Screenshot zusammen |
| `action-risk-map` | Actions klassifizieren: safe, write, setup, preview, post, external. | `Neu`, `Neues Unternehmen erstellen`, `Post`, `Preview Posting`. | ja, fuer Warn-/Buttonerklaerung |
| `entry-impact-map` | Erwartete Entries je Prozess definieren. | G/L Entry, VAT Entry, Item Ledger Entry, Value Entry. | erst nach Entry-Evidence |
| `report-request-map` | Request Page und Filterwirkung fuer Reports erfassen. | Financial Reports, VAT Statement. | erst nach Report-Screenshot |

## Roadmap nach UAT-Bereichen

| Bereich | UAT-Bezug | Objektanalyse-Frage | Benoetigte Artefakte | Status | Naechster Case |
| --- | --- | --- | --- | --- | --- |
| Companies / Mandanten | `UAT-W0-001`, `UAT-W0-002` | Welche Page/Actions gehoeren zu `Neu`, Pfeil neben `Neu`, `Neues Unternehmen erstellen`, `Kopieren`, `Testunternehmen`? | Page Inspection, Action Atlas, Screenshot QA | `ready-after-permission` | TARGET-009 nach Rechten |
| My Settings | `UAT-W0-003` | Welche Felder sind Benutzer-/Company-/Arbeitsdatumskontext und welche Action speichert? | Page Context, Field Map, Dialog Gate | `ready-after-company` | nach Company-Anlage erneut |
| Company Information | `UAT-W1-001` | Welche Felder sind rechtlicher Name, Adresse, Land/Region, USt-ID und welche wirken spaeter auf Belege? | Field Map, Before/After Screenshot | `blocked-until-company` | TARGET-COMPANY-INFO-001 |
| Number Series | `UAT-W1-002` | Welche Pages/Felder steuern Startnummer, letzte Nummer, manuelle Nummern und Beziehungen? | Page/Table Map, Field Role Map | `needs-foundation` | TARGET-005 |
| Posting Groups | `UAT-W1-003` | Welche Tabellen verbinden Business/Product Posting Groups mit G/L Accounts? | Matrix Map, Entry Impact Map | `needs-foundation` | TARGET-006 |
| VAT Setup | `UAT-W1-004` | Welche Felder sind VAT %, VAT Calculation Type, Sales/Purchase VAT Account und welche Entries entstehen? | Field Map, Preview/VAT Entry Plan | `needs-foundation` | TARGET-008 |
| Dimensions | `UAT-W1-005` | Welche Default-Dimension-Regeln wirken auf Stammdaten, Belege und Entries? | Dimension Field Map, Entry Impact Map | `needs-foundation` | TARGET-007 |
| O2C | `UAT-O2C-001` | Welche Sales Pages, Line Subforms, Actions und Entries muessen sichtbar werden? | Card/List/Worksheet Map, Dialog Gate, Entry Map | `needs-foundation` | TARGET-011 |
| P2P | `UAT-P2P-001` | Welche Purchase Line-Felder muessen robust editierbar und sichtbar sein? | Grid/Line Map, Action Risk Map | `needs-foundation` | TARGET-014 |
| Inventory | `UAT-INV-001` | Welche Journalfelder erzeugen Item Ledger, Value Entries und ggf. G/L Entries? | Journal Field Map, Entry Map | `needs-foundation` | TARGET-017 |
| Payments / Bank | `UAT-PAY-001`, `UAT-BANK-001` | Welche Apply-/Match-Actions aendern offene Posten und Bankposten? | Dialog Gate, Entry Impact Map | `needs-data-richness` | TARGET-021/TARGET-023 |
| Fixed Assets | `UAT-FA-001` | Welche FA-Journal- und Depreciation-Request-Pages erzeugen FA Ledger und G/L Entries? | Request Page Map, Entry Map | `needs-foundation` | TARGET-018 |
| Reporting | `UAT-REPORT-001` | Welche Reports/Analysis Views brauchen Request Pages und Filterevidence? | Report Request Map, Result Screenshot | `needs-data-richness` | TARGET-024 |
| Error Handling / Diagnostics | `UAT-ERR-001` | Welche Page Inspection-/Personalize-Daten helfen beim Fehler ohne Buchungsclaim? | Debugging Note, Error Atlas | `ongoing` | je Blocker |

## Stop-Regeln

Objektanalyse stoppt, wenn:

- keine konkrete UAT- oder Buchfrage vorhanden ist,
- eine technische Info als Prozessbeweis missverstanden werden koennte,
- eine Action nur durch Ausfuehrung klassifizierbar waere,
- ein Report/Entry erst nach Posting aussagekraeftig ist,
- ein Bereich in Shopify / Online Store fuehrt.

## Output je Objektanalyse

Jede spaetere Objektanalyse schreibt kompakt:

```json
{
  "page": "",
  "pageId": "",
  "sourceTable": "",
  "tableId": "",
  "fields": [],
  "actions": [],
  "dialogs": [],
  "requestPages": [],
  "entriesExpected": [],
  "supportsUatIds": [],
  "proves": [],
  "doesNotProve": [],
  "nextUiEvidenceNeeded": []
}
```

## Naechster Schritt

PREP-030 kann daraus eine Buch-/Usecase-Scorecard bauen: Ein Kapitel ist erst gut, wenn es Page, Felder, Actions, erwartete Wirkung, Evidence-Level und Anfaengerfrage zusammenbringt.
