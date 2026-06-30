# Universaarl Next-10 Case Plan - PREP-025

Status: `prep-done`

Instanz: `playthru`

Zielcompany: `UNIVERSAARL-DE` (`planned-not-yet-created`)

Modus: PREP-/Read-only-Arbeit bis SUPER-/Company-Create-Rechte vorhanden sind

## Entscheidung

Company Creation bleibt geparkt. Der nächste Fortschritt ist nicht ein weiterer Klickversuch, sondern eine verdichtete Reihenfolge aus Quellenbasis, read-only UI-Beobachtung und Buchsubstanz.

PREP-024 hat die W0/W1-Seiten als Discovery-Pack vorbereitet. Damit ist klar: Ein Live-read-only-Test auf der Mandantenliste ist wertvoll, aber vorher sollten die Quellen- und Claim-Regeln für die ersten Buchseiten enger an die konkreten W0/W1-Seiten gebunden werden. So entstehen später keine Buchclaims aus Screenshots allein.

## Mini-Checkpoint

| Frage | Ergebnis |
| --- | --- |
| Harte Instanzgrenze | `playthru` bleibt aktiv. |
| Company Creation | weiter `parked-until-super-permissions`. |
| Aktiver wirksamer Company-Case | keiner; `TARGET-009` bleibt geparkt. |
| Bester PREP-Fortschritt | Quellen-/Claim-Mapping fuer W0/W1, danach read-only Companies Page. |
| Buch-Meta-Risiko | Kapitel 4 und 6 bleiben priorisiert; keine neuen finalen Claims ohne Universaarl-Evidence. |
| RM/Rhein-Main als Zielwelt | bleibt Decommission-Aufgabe; keine Massenersetzung. |
| Screenshot-/Atlas-Risiko | PREP-024 hat Screenshot-QA und Stopplisten vorbereitet. |

## Next 10

| Reihenfolge | Case | Status | Warum jetzt |
| ---: | --- | --- | --- |
| 1 | `PREP-026-MICROSOFT-LEARN-SOURCE-MAPPING` | `ready-next` | Die W0/W1-Seiten aus PREP-024 brauchen eine klare Quellen-/Claim-Grenze: Company, Setup, Nummernserien, Buchungsgruppen, USt, Dimensionen. |
| 2 | `PREP-031-COMPANIES-PAGE-READONLY-PLAYWRIGHT` | `ready-after-current` | Danach kann `RO-W0-COMPANIES-357` live read-only beobachtet werden: Hauptbutton `Neu`, Pfeil, Dropdown, Tooltips und Zielzustände. |
| 3 | `PREP-032-CH04-ERP-BASICS-UNIVERSAARL-REWRITE` | `ready-after-current` | Kapitel 4 kann ohne BC-Änderung von Rhein-Main-Beispielen auf Universaarl-Grundbegriffe umgestellt werden. |
| 4 | `PREP-027-IMPLEMENTATION-GUIDE-BEST-PRACTICE-MAPPING` | `ready-after-current` | Projekt-/UAT-/Governance-Regeln werden an den konkreten Universaarl-Aufbau angeschlossen. |
| 5 | `PREP-028-TESTING-STRATEGY-AND-UAT-MATRIX` | `ready-after-current` | Die UAT-Matrix soll aus W0/W1, Quellenregeln und Screenshot-QA entstehen, nicht aus alten RM-Durchläufen. |
| 6 | `PREP-033-MY-SETTINGS-READONLY-CONTEXT` | `ready-after-current` | My Settings erklärt Company-/Rollen-/Sprache-Kontext und verhindert spätere Verwechslungen. |
| 7 | `PREP-034-ROLE-CENTER-READONLY-SHELL-MAP` | `ready-after-current` | Role Center, Suche, Navigationsleiste und Arbeitsbereiche sind Grundlage fuer Anfänger-Klickanleitungen. |
| 8 | `PREP-029-AL-OBJECT-ANALYSIS-ROADMAP` | `ready-after-current` | Objektanalyse darf nur als erlaubter, sparsamer Klärungsweg dienen, nicht als Ersatz für UI-Evidence. |
| 9 | `PREP-030-BOOK-USECASE-QUALITY-SCORECARD` | `ready-after-current` | Vor größeren Buchpatches braucht jedes Kapitel eine kurze Anfänger-Checkliste. |
| 10 | `TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE` | `blocked` | Erst nach Nutzerfreigabe mit SUPER-/Company-Create-Rechten reaktivieren. |

## Geänderte Reihenfolge

`PREP-026` bleibt der nächste Case. Ein sofortiger read-only Playwright-Lauf wäre möglich, aber Quellen-/Claim-Mapping hat knapp höheren Wert, weil es die spätere Buchsprache absichert. Danach wird `PREP-031` als konkreter read-only Companies-Page-Test eingefügt.

## Stopps

- Keine Company erstellen.
- Kein Wizard-Finish.
- Kein Setup ändern.
- Keine Stammdaten anlegen.
- Kein Preview Posting.
- Kein Posting.
- Kein API-Shortcut.
- Keine finalen deutschen Claims aus alten RM-/CRONUS-Laborquellen.

## Next Step Decision Card

```json
{
  "currentCase": "PREP-025-NEXT-10-CASES-REPLANNING",
  "plannedNextCaseBeforeReview": "PREP-025-NEXT-10-CASES-REPLANNING",
  "lastEvidenceSummary": "PREP-024 created a W0/W1 read-only discovery pack with page/action/field/request-page atlas targets.",
  "isPlannedNextCaseStillSensible": true,
  "reason": "The queue needed to decide between immediate read-only Playwright discovery and source-backed book preparation. Source mapping now goes first; read-only Companies Page follows directly.",
  "lookaheadReviewed": [
    {
      "caseId": "PREP-026-MICROSOFT-LEARN-SOURCE-MAPPING",
      "status": "ready-next",
      "reason": "Sources must define which claims need Microsoft Learn, Universaarl Evidence, both, or later German/legal proof."
    },
    {
      "caseId": "PREP-031-COMPANIES-PAGE-READONLY-PLAYWRIGHT",
      "status": "ready-after-current",
      "reason": "PREP-024 made this executable without writes."
    },
    {
      "caseId": "PREP-032-CH04-ERP-BASICS-UNIVERSAARL-REWRITE",
      "status": "ready-after-current",
      "reason": "Chapter 4 can safely become Universaarl reader text without claiming that the company exists."
    },
    {
      "caseId": "PREP-027-IMPLEMENTATION-GUIDE-BEST-PRACTICE-MAPPING",
      "status": "ready-after-current",
      "reason": "Implementation guidance should follow the source map."
    },
    {
      "caseId": "TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE",
      "status": "blocked",
      "reason": "Still waiting for SUPER/company-create permissions."
    }
  ],
  "queueChangesMade": [
    "Marked PREP-025 done.",
    "Kept PREP-026 as ready-next.",
    "Inserted PREP-031, PREP-032, PREP-033 and PREP-034 as concrete follow-up cases.",
    "Kept TARGET-009 parked until permission unblock."
  ],
  "selectedNextCase": "PREP-026-MICROSOFT-LEARN-SOURCE-MAPPING",
  "whySelectedNextCaseIsBest": "It prevents later book text from overclaiming what read-only screenshots or old RM evidence can prove.",
  "risksBeforeNextCase": [
    "Do not spend the source-mapping run as a broad web research detour.",
    "Do not claim Universaarl setup exists.",
    "Do not skip the Companies Page read-only test after mapping."
  ],
  "requiredPreparation": [
    "Use PREP-024 discovery IDs.",
    "Map only W0/W1 claims first.",
    "Keep Shopify excluded."
  ]
}
```
