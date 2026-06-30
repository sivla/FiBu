# Universaarl Implementation Guide Mapping

Status: `prep-027-done`

Instanz: `playthru`

Zielcompany: `UNIVERSAARL-DE` (`planned-not-yet-created`)

Company Creation bleibt bis zur bestaetigten Rechtefreigabe geparkt. Diese Datei ordnet die offiziellen Dynamics-365-Implementation-Guide-Quellen den naechsten Universaarl-Artefakten zu. Sie ersetzt keine Business-Central-Evidence.

## Quellen

| Quelle | Nutzbar fuer | Nicht nutzbar fuer |
| --- | --- | --- |
| [Success by Design](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/success-by-design) | Phasenlogik, Risiko-/Review-Denken, Projektgovernance, Living-Solution-Blueprint-Idee | konkrete BC-Seite, Feld, Button, Company-Existenz, Posting |
| [Process-focused solution](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/process-focused-solution) | Buchkapitel nach Geschaeftsprozessen schneiden, nicht nach Menues allein | Beweis, dass ein Universaarl-Prozess funktioniert |
| [Fit-to-standard and fit-gap analysis](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/process-focused-solution-fit-to-standard-fit-gap-analysis) | Standard zuerst, Abweichungen bewusst bewerten, Anpassungen begruenden | automatische Freigabe fuer Customizing, Extension oder API |
| [Testing strategy](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/testing-strategy) | Teststrategie, Rollen, Testumgebungen, Entry-/Exit-Kriterien | bestandener UAT, konkrete Testergebnisse |
| [Create a test plan](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/testing-strategy-planning) | Testplanstruktur, Scope, Testtypen, Testzyklen, Outcomes, Verantwortlichkeit | fertige Universaarl-Testfaelle ohne Prozess-Evidence |
| [Types of tests](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/testing-strategy-test-types) | Process Testing, End-to-End Testing, UAT, Daten- und Integrationsbedarf | Beweis, dass ein einzelner Klickpfad abnahmefaehig ist |

## Universaarl-Umsetzung

| Implementation-Guide-Prinzip | Universaarl-Regel | Naechstes Artefakt |
| --- | --- | --- |
| Success by Design arbeitet phasenorientiert und risikobewusst. | Jeder Lauf schreibt eine Next-Step Decision Card und prueft 3-5 Folgeschritte. | `.agent/state/last_run_summary.json`, Case-Result-JSON |
| Prozesse sind die Sprache des Projekts. | Der Full-Playthrough-Katalog bleibt prozessbasiert: Company, Foundation, O2C, P2P, Inventory, Payments, Reporting, UAT. | `BC-FULL-PLAYTHROUGH-CATALOG.md` |
| Fit-to-standard kommt vor Fit-gap. | Business-Central-Standardpfad wird zuerst beobachtet und erklaert; Abweichungen brauchen Grund, Risiko, Alternative und Test. | `BC-IMPLEMENTATION-BEST-PRACTICES.md`, spaeter Prozess-Decision-Cards |
| Testen wird frueh geplant und ueber mehrere Zyklen gedacht. | Jeder Buchprozess bekommt vor Ausfuehrung Entry Criteria, Testdaten, erwartetes Ergebnis, Fehlerfall und Exit Criteria. | `PREP-028-TESTING-STRATEGY-AND-UAT-MATRIX` |
| Testplan enthaelt Scope, Rollen, Umgebung, Testfaelle, Expected Outcomes und Tracking. | UAT-Faelle duerfen nicht nur "Klickpfad gruen" sein; sie brauchen Buchwirkung, Postenspur oder klaren Read-only-Zweck. | `UNIVERSAARL-UAT-MATRIX.md` spaeter |
| End-to-End-Tests brauchen reale Datenmuster. | Universaarl braucht Datenreichtum: mehrere Kunden, Lieferanten, Artikel, Monate, offene/geschlossene Posten und Dimensionen. | `UNIVERSAARL-DATASET-BLUEPRINT.md`, `BC-FULL-PLAYTHROUGH-CATALOG.md` |

## Claim-Grenzen

| Aussage im Buch | Erlaubt nach PREP-027? | Benoetigt fuer finale Aussage |
| --- | --- | --- |
| "Ein Prozess wird zuerst als Standardprozess verstanden." | ja, als Projektvorgehen | spaeter Fit-to-standard-Evidence je Prozess |
| "Eine Abweichung vom Standard braucht Begruendung." | ja, als Vorgehensregel | Decision Card mit Risiko, Alternative, Test |
| "Ein UAT-Fall braucht erwartetes Ergebnis und Abnahmekriterium." | ja, als UAT-Regel | konkrete Universaarl-UAT-Matrix |
| "`UNIVERSAARL-DE` ist angelegt." | nein | sichtbare Company in `playthru` nach Rechtefreigabe |
| "O2C/P2P/Inventory sind abnahmefaehig." | nein | Universaarl-Prozesslauf mit Setup, Stammdaten, Preview/Posting oder begruendetem Read-only-Ziel und Ergebnis |
| "Das Buch ist final deutsch belegt." | nein | deutsche Universaarl-Evidence, Steuer-/VAT-/Posting-Nachweise, Screenshots und ggf. amtliche Quellen |

## Buchwirkung

Das Buch soll Business Central wie ein Prozesshandbuch erklaeren:

1. Standardweg zeigen.
2. Pflichtfelder und Wirkung erklaeren.
3. Vor wirksamen Aktionen kontrollieren.
4. Ergebnis mit Posten, Folgeobjekten oder sichtbarem Status pruefen.
5. Fehlerfall und Korrekturweg nennen.
6. Abweichungen vom Standard nur begruendet und getestet aufnehmen.

## Next-Step Decision Card

```json
{
  "currentCase": "PREP-027-IMPLEMENTATION-GUIDE-BEST-PRACTICE-MAPPING",
  "plannedNextCaseBeforeReview": "PREP-027-IMPLEMENTATION-GUIDE-BEST-PRACTICE-MAPPING",
  "lastEvidenceSummary": "PREP-034 proved the read-only Role Center shell in playthru and selected source-backed implementation mapping as next PREP step.",
  "isPlannedNextCaseStillSensible": true,
  "reason": "Implementation Guide mapping is the best next non-effective step because PREP-028 UAT matrix needs source-backed rules before it can define tests.",
  "lookaheadReviewed": [
    {
      "caseId": "PREP-028-TESTING-STRATEGY-AND-UAT-MATRIX",
      "status": "ready-next",
      "reason": "PREP-027 now defines the source-backed structure for test scope, entry/exit criteria and expected outcomes."
    },
    {
      "caseId": "PREP-029-AL-OBJECT-ANALYSIS-ROADMAP",
      "status": "ready-after-current",
      "reason": "Object analysis should serve source/evidence gaps, not replace UI evidence."
    },
    {
      "caseId": "PREP-030-BOOK-USECASE-QUALITY-SCORECARD",
      "status": "ready-after-current",
      "reason": "The scorecard can use the Implementation Guide gates for beginner-ready chapters."
    },
    {
      "caseId": "TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE",
      "status": "blocked",
      "reason": "Still parked until SUPER/company-create permissions are confirmed."
    }
  ],
  "queueChangesMade": [
    "Mark PREP-027 done.",
    "Select PREP-028 as next prep case.",
    "Keep TARGET-009 parked until permissions are available."
  ],
  "selectedNextCase": "PREP-028-TESTING-STRATEGY-AND-UAT-MATRIX",
  "whySelectedNextCaseIsBest": "PREP-028 converts the source-backed project rules into concrete UAT/test-matrix structure for the Universaarl book.",
  "risksBeforeNextCase": [
    "Do not turn source guidance into a passed UAT claim.",
    "Do not reactivate Company Creation without explicit SUPER permission confirmation."
  ],
  "requiredPreparation": [
    "Use only official Microsoft Implementation Guide sources for UAT structure.",
    "Keep Shopify excluded.",
    "Keep Universaarl company creation parked."
  ]
}
```

