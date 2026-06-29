# Next Step Decision Gate

Dieses Gate verhindert, dass der Autopilot blind den naechsten Queue-Eintrag ausfuehrt.

Vor jedem praktischen Schritt muss der Autopilot pruefen:

1. aktueller State,
2. letzte wirklich bewiesene Evidence,
3. aktuelle Company-, Page- und Setup-Situation,
4. ob der geplante Queue-Case noch logisch ist,
5. ob vorher eine Abhaengigkeit erledigt werden muss,
6. ob neue Evidence die Reihenfolge aendert,
7. ob der Schritt fachlich sinnvoll ist,
8. ob der Schritt fuer das Buch sinnvoll ist,
9. ob Quelle, Evidence und Smart Decision ausreichend vorbereitet sind,
10. ob die naechsten 3 bis 5 Folgeschritte danach noch sinnvoll sind.

Die Queue ist ein Arbeitsplan, kein Dogma. Sie darf angepasst werden, wenn Evidence, Quelle, Blocker oder Buchlogik eine bessere Reihenfolge zeigen.

## Lookahead-Status

| Status | Bedeutung |
| --- | --- |
| `ready-next` | Sinnvollster unmittelbarer naechster Case. |
| `ready-after-current` | Sinnvoll, sobald der aktuelle Case erledigt ist. |
| `needs-setup-first` | Setup oder Stammdaten fehlen. |
| `needs-source-check-first` | Quelle oder Best-Practice-Entscheidung fehlt. |
| `needs-ui-discovery-first` | UI-/Page-/Action-/Field-Route ist noch nicht belegt. |
| `needs-book-context-first` | Buch-/Clickguide-Kontext muss zuerst geklaert werden. |
| `blocked` | Aktuell nicht ausfuehrbar. |
| `obsolete` | Durch neue Evidence ueberholt. |
| `replace-with-better-case` | Soll durch besseren Case ersetzt oder ergaenzt werden. |

## Next-Step Decision Card

Jeder Lauf schreibt eine kompakte Card in Result JSON, Run Summary oder Case-State:

```json
{
  "currentCase": "",
  "plannedNextCaseBeforeReview": "",
  "lastEvidenceSummary": "",
  "isPlannedNextCaseStillSensible": true,
  "reason": "",
  "lookaheadReviewed": [
    {
      "caseId": "",
      "status": "ready-next",
      "reason": ""
    }
  ],
  "queueChangesMade": [],
  "selectedNextCase": "",
  "whySelectedNextCaseIsBest": "",
  "risksBeforeNextCase": [],
  "requiredPreparation": []
}
```

## Queue-Aenderungen

Wenn ein Folgeschritt nicht mehr sinnvoll ist, wird die Queue angepasst:

- Abhaengigkeit einfuegen,
- Case ersetzen,
- Reihenfolge aendern,
- Blocker oder Fallback dokumentieren,
- obsolete Case markieren.

## Abschlussbericht

Jeder Abschlussbericht nennt:

- welcher naechste Case vorher geplant war,
- ob er noch sinnvoll ist,
- ob die Queue angepasst wurde,
- welche 3 bis 5 Folgeschritte geprueft wurden,
- welcher naechste Case jetzt aktiv ist,
- warum genau dieser Case der beste naechste Schritt ist.
