# Book Chapter Stimmigkeit Audit - PREP-023

Status: `prep-done`

Instanz: `playthru`

Zielcompany: `UNIVERSAARL-DE` (`planned-not-yet-created`)

Aktive Buchwelt: Universaarl GmbH

## Zweck

Der Buchmaster hat mit Kapitel 3 einen Universaarl-Anker, faellt in den folgenden Kapiteln aber noch oft in die alte Rhein-Main-/RM-DEMO-Welt zurueck. Dieser Audit trennt deshalb drei Dinge:

- direkter Lesertext, der schon fuer Universaarl taugt,
- alte Laborstrecken, die nur noch als Struktur- oder Fehlerquelle dienen,
- Kapitel, die erst nach neuer Universaarl-Evidence sinnvoll ersetzt werden.

Es wurde keine Business-Central-Aktion ausgefuehrt und kein Playwright-Test gestartet. `UNIVERSAARL-DE` wurde nicht angelegt.

## Buchstil-Regel

Aktiver Buchtext soll wie ein Schulungsbuch lesen:

- welche Seite in Business Central geoeffnet wird,
- welcher Button oder welches Feld wichtig ist,
- welche Aktion Daten aendert,
- welche Aktion nur liest,
- was nach Speichern, Vorschau oder Buchen passiert,
- welche Posten oder Berichte den Schritt kontrollieren,
- welche Fehler typisch sind und wie man sie korrigiert.

Interne Begriffe wie Case, Evidence, Result JSON, Repo, Agent oder Proof gehoeren in Evidence, Atlas, Coverage und State-Dateien. Im Buchmaster erscheinen sie nur, wenn ein interner Anhang oder ein klar abgegrenzter Laborhinweis wirklich noetig ist.

## Kapitelbefund

| Bereich | Aktueller Befund | Status | Naechste Aktion |
| --- | --- | --- | --- |
| Kapitel 3 `Die Universaarl GmbH als durchgehende Fallstudie` | Der Einstieg spricht bereits ueber Universaarl, Environment, Company und die Abgrenzung zu CRONUS. | `universaarl-draft-anchor` | Nach Rechtefreigabe mit echter Company-Creation-Evidence und sichtbarer Mandantenliste ersetzen/ergaenzen. |
| Kapitel 4 ERP-Grundlagen | Enthalt noch Rhein-Main-Beispiele als aktive ERP-Welt. | `active-must-replace-now` | In einem kleinen Buchpatch auf Universaarl-Beispiele umstellen, ohne Prozessclaims zu erfinden. |
| Kapitel 5 Lernpfad/Orientierung | Nutzt noch CRONUS/RM-DEMO als ersten Trainingspfad. | `replace-with-universaarl-evidence` | Nach Company Creation: Playthru/Universaarl-Orientierung als Startpfad schreiben; alte CRONUS-Strecke als Legacy-Labor entfernen oder archivieren. |
| Kapitel 6 Greenfield/Company/Foundation | Groesster Bruch: CRONUS nach RM-DEMO kopieren, Rhein-Main-Masterplan und RM-* Companies stehen noch als aktiver Ablauf. | `p0-book-rewrite-needed` | Nach `TARGET-009`: neues Universaarl-Company-Creation-Kapitel schreiben. Bis dahin keine weiteren final klingenden Foundation-Claims. |
| Kapitel 7/8 Setup/Posting Groups/VAT | Struktur ist wertvoll, aber Beispiele und Zielwelt sind gemischt. | `needs-universaarl-rebuild` | Erst nach W1-Foundation mit Number Series, Posting Groups, VAT und Dimensionen ersetzen. |
| Kapitel 9/10/11/12 O2C/P2P/Dimensionen | Viele RM-DEMO-/Rhein-Main-Prozessbeispiele sind laborbelegt, aber nicht Universaarl-final. | `legacy-labor-scaffold` | Als Lernstruktur behalten, spaeter Prozess fuer Prozess durch Universaarl-O2C/P2P ersetzen. |
| Kapitel 13 Inventory/Warehouse | Enthalt gute Laborgrenzen, aber RM-M100/RAW-STEEL/FRA-ZL sind alte Welt. | `legacy-labor-scaffold` | Erst nach Universaarl-Artikel, Lagerort und erstem Inventory-Prozess ersetzen. |
| Kapitel 14 Manufacturing | Labor-Direct-Page-Wissen ist nuetzlich; Prozess selbst ist nicht final. | `legacy-labor-scaffold` | Nach Universaarl-Item/BOM/Routing-Rebuild neu schreiben. |
| Kapitel 20 Bank/Payments | Laborprozess ist buchdraft-tauglich, aber Bankkonto, Belege und Konten sind RM-DEMO/CRONUS. | `needs-universaarl-rebuild` | Spaeter mit Universaarl-Bankkonto und offenen Posten neu beweisen. |
| Kapitel 21 Fixed Assets | Laborblock und Zielpfad sind besser getrennt, aber alle Belege bleiben RM-DEMO-Labor. | `labor-sufficient-for-book-draft` | Spaeter mit Universaarl-Anlagen, HGB/DE-Setup und deutscher Postenspur neu aufbauen. |
| Kapitel 22 VAT/USt | Deutsche USt darf nicht aus RM-DEMO/CRONUS abgeleitet werden. | `source-and-target-evidence-required` | Vor Buchclaim: Microsoft/amtliche Quelle plus Universaarl VAT Setup, Preview, VAT Entries, Sachposten. |
| Kapitel 25 Reporting | Reporting ist als Konzept wertvoll, aber alte Dimensionen/Analysis-Views sind nur Labor. | `needs-universaarl-postings-first` | Erst nach echten Universaarl-Posten und Dimensionen finalisieren. |

## Priorisierte Buchpatch-Reihenfolge

1. `BOOK-UNIVERSAARL-CH04-ERP-BASICS-REWRITE`
   - Ziel: Rhein-Main-Beispiele im ERP-Grundlagenkapitel auf Universaarl umstellen.
   - Sicher vor Company Creation, weil es nur Konzepttext betrifft.
   - Keine Behauptung, dass UNIVERSAARL-DE schon existiert.

2. `TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE`
   - Ziel: Mandantenliste, Pfeil neben `Neu`, `Neues Unternehmen erstellen`, Datenbasis und Rechtegrenze sauber beweisen.
   - Bleibt blockiert bis SUPER/company-create-Rechte verfuegbar sind.

3. `BOOK-UNIVERSAARL-CH06-COMPANY-CREATION-REWRITE`
   - Ziel: altes CRONUS-nach-RM-DEMO-Kapitel durch echte Universaarl-Company-Creation-Strecke ersetzen.
   - Erst nach sichtbarer, verstandener Company-Creation-Route.

4. `TARGET-COMPANY-INFO-001`
   - Ziel: Company Information als erste Karte der Universaarl GmbH belegen.
   - Danach kann das Buch erklaeren, welche Firmendaten spaeter Belege, USt und Reports beeinflussen.

5. `TARGET-FOUNDATION-001` bis `TARGET-DIMENSIONS-001`
   - Ziel: Foundation, Number Series, Posting Groups, VAT und Dimensionen als echte Universaarl-Basis aufbauen.
   - Danach koennen O2C/P2P/Inventory-Kapitel ersetzt werden.

## Umgang mit Bookdrafts

| Draft | Befund | Entscheidung |
| --- | --- | --- |
| `universaarl-company-creation-draft.md` | Guter Lesertext fuer Company, Mandantenliste, Datenbasis und Rechtegrenze. | Aktiv fuer Kapitel 3/6, aber erst nach TARGET-009 als finaler Buchabschnitt. |
| `universaarl-look-and-feel-filtering-draft.md` | Geeignet als eigener Anfaengerblock fuer Suche, Filter, Listen, Karten und Request Pages. | Aktiv halten; spaeter mit Universaarl-Screenshots fuellen. |
| `p2p-labor-draft.md` | Gute Laborerklaerung, aber RM-DEMO/CRONUS/alte Belege. | Nicht als Universaarl-Finaltext verwenden; spaeter als Strukturquelle nutzen. |
| `inventory-labor-draft.md` | Gute Erklaerung von Artikeljournal, Wertposten und Reporting-Grenzen. | Strukturquelle; Universaarl-Artikel und Posten spaeter neu belegen. |
| `bank-payments-labor-draft.md` | Gute Zahlung/OP/Buchungslogik, aber alte Bank und Belege. | Strukturquelle; Universaarl-Bank und OP-Ausgleich spaeter neu erstellen. |
| `fixedassets-labor-draft.md` | Labor- und Zielpfad sind getrennt. | Fuer Kapitel 21 als Vorproduktionsstoff geeignet, kein deutscher Finalnachweis. |
| `warehouse-labor-draft.md` | Erklaert Blocker und Lagergrenze. | Als Fehler-/Boundary-Quelle behalten, nicht final. |
| `manufacturing-labor-draft.md` | Read-only Page-Kontext und Zielpfad sind wertvoll. | Als Strukturquelle fuer spaetere Universaarl-Fertigung. |

## Nicht massenhaft ersetzen

Der Bookmaster enthaelt viele alte Referenzen. Eine Massensuche auf `RM-` oder `Rhein-Main` wuerde auch historische Laborgrenzen, Dateinamen, Belegnummern und Erklaerungen beschaedigen. Die richtige Route ist:

1. Zielkapitel waehlen.
2. Pruefen, ob Universaarl-Evidence schon existiert.
3. Direkten Lesertext schreiben.
4. Alte Laborstelle entweder ersetzen oder klar in interne Evidence/Archiv verschieben.
5. Coverage auf `superseded-by-universaarl` setzen, sobald neuer Proof vorhanden ist.

## Next Step Decision Card

```json
{
  "currentCase": "PREP-023-BOOK-CHAPTER-STIMMIGKEIT-AUDIT",
  "plannedNextCaseBeforeReview": "PREP-023-BOOK-CHAPTER-STIMMIGKEIT-AUDIT",
  "lastEvidenceSummary": "PREP-022 classified atlas quality and set active Universaarl priorities for W0/W1.",
  "isPlannedNextCaseStillSensible": true,
  "reason": "The bookmaster has a Universaarl chapter-3 anchor, but later chapters still use Rhein-Main/RM-DEMO as active flow. A chapter-flow audit is needed before more book patches.",
  "lookaheadReviewed": [
    {
      "caseId": "PREP-024-READONLY-PAGE-DISCOVERY-PACK",
      "status": "ready-next",
      "reason": "Read-only page discovery can use the chapter audit to focus on pages needed for real Universaarl reader flow."
    },
    {
      "caseId": "PREP-025-NEXT-10-CASES-REPLANNING",
      "status": "ready-after-current",
      "reason": "The next ten cases should account for the P0 chapter-6 rewrite dependency and the parked company-creation gate."
    },
    {
      "caseId": "PREP-026-MICROSOFT-LEARN-SOURCE-MAPPING",
      "status": "ready-after-current",
      "reason": "Source mapping should prioritize Company, Number Series, Posting Groups, VAT, Dimensions and Entries."
    },
    {
      "caseId": "PREP-027-IMPLEMENTATION-GUIDE-BEST-PRACTICE-MAPPING",
      "status": "ready-after-current",
      "reason": "Implementation guidance is useful after book and source priorities are clearer."
    },
    {
      "caseId": "TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE",
      "status": "blocked",
      "reason": "Still waiting for SUPER/company-create permissions."
    }
  ],
  "queueChangesMade": [
    "Marked PREP-023 done.",
    "Selected PREP-024 as next safe prep case.",
    "Recorded BOOK-UNIVERSAARL-CH04-ERP-BASICS-REWRITE as a high-value book patch candidate, but did not insert it ahead of PREP-024 yet."
  ],
  "selectedNextCase": "PREP-024-READONLY-PAGE-DISCOVERY-PACK",
  "whySelectedNextCaseIsBest": "The next useful step is to prepare read-only discovery packs for the exact pages the book will need once permissions allow company creation and foundation setup.",
  "risksBeforeNextCase": [
    "Do not run an effective BC action while company creation is permission-blocked.",
    "Do not present RM-DEMO screenshots as Universaarl final screenshots.",
    "Do not use read-only page discovery as proof that setup or records exist."
  ],
  "requiredPreparation": [
    "Use BC-ATLAS-COVERAGE-QUALITY-AUDIT.md and this chapter audit.",
    "Focus read-only discovery on W0/W1 pages first: Companies, Company Information, Assisted Setup, Number Series, Posting Groups, VAT, Dimensions."
  ]
}
```
