# Smart Decision Gate

Zweck: Vor jeder wirksamen Business-Central- oder Buchaktion muss der Autopilot kurz begruenden, warum der Schritt fachlich sinnvoll, quellen- oder evidence-gestuetzt und fuer das Universaarl-Buch erklaerbar ist.

## Aktive Zielwelt

- Instanz: `playthru`
- Zielcompany: `UNIVERSAARL-DE`
- Musterfirma: `Universaarl GmbH`
- Legacy: `MCP_1_20260210`, `RM-DEMO`, Rhein-Main/RM-* und CRONUS nur als `legacy-labor-reference`
- Shopify / Online Store bleibt ausgeschlossen.

## Wirksame Aktionen

Eine Smart Decision Card ist Pflicht vor:

- Company erstellen oder wechseln
- Setup aendern
- Stammdaten anlegen oder aendern
- Beleg/Draft erstellen oder aendern
- Dialog bestaetigen
- Wizard abschliessen
- Preview Posting, Posting, Ship, Invoice, Payment
- Cleanup, Loeschen, Reversal oder Korrektur
- Buchmaster fachlich umschreiben
- Coverage/Atlas als final, proven oder superseded markieren

Wenn keine Smart Decision Card existiert, wird die Aktion auf read-only Diagnose reduziert oder blockiert.

## Pflichtfragen

Vor der Aktion beantwortet der Autopilot kompakt:

- Warum braucht Universaarl diesen Schritt?
- Welcher Buchprozess oder spaetere Nachweis haengt davon ab?
- Ist der Schritt Standard Business Central, Projektentscheidung oder UI-Abkuerzung?
- Welche Alternativen gibt es?
- Welche Option ist fuer eine saubere Universaarl-Musterfirma am besten?
- Welche Quelle oder eigene Evidence stuetzt den Schritt?
- Was passiert nach Klick, Speichern, Finish oder Buchen?
- Welches Risiko, welche Korrektur und welcher Fallback existieren?
- Welcher Screenshot oder welches Result wird danach gebraucht?
- Wie wird der Schritt spaeter anfaengerfreundlich erklaert?

## Smart Decision Card Schema

```json
{
  "decisionId": "",
  "caseId": "",
  "actionCandidate": "",
  "businessQuestion": "",
  "bookPurpose": "",
  "currentContext": {
    "instance": "playthru",
    "company": "",
    "page": "",
    "record": ""
  },
  "sourcesChecked": [
    "book-master-or-draft",
    "source-registry",
    "microsoft-learn-if-needed",
    "existing-evidence",
    "atlas-or-coverage"
  ],
  "existingEvidenceChecked": [],
  "alternatives": [
    {
      "option": "",
      "benefit": "",
      "risk": "",
      "bookFit": "",
      "decision": "reject|prefer|investigate"
    }
  ],
  "selectedOption": "",
  "whyThisIsTheMostSensibleNextStep": "",
  "whyNotOtherOptions": "",
  "expectedEffect": "",
  "risk": "",
  "correctionOrFallbackPath": "",
  "screenshotPlan": "",
  "bookExplanationPlan": "",
  "decision": "proceed|block|investigate-readonly-first"
}
```

Die Card gehoert in Result JSON, Evidence README oder Case JSON. Bei groesseren wirksamen Aktionen darf sie in allen drei Ebenen gespiegelt werden.

## Book-First und Source-First

Vor fachlichen Aktionen werden zuerst passende Buch-/Projektdateien und Quellen geprueft:

- Buchmaster oder Buchdrafts
- `TARGET-SANDBOX-REBUILD-PLAN.md`
- `UNIVERSAARL-FINAL-TRACK-PLAN.md`
- `BC-FULL-PLAYTHROUGH-CATALOG.md`
- Coverage, Atlas, Roadmap und vorhandene Evidence
- `BC-SOURCE-REGISTRY.md` und `BC-SOURCE-CLAIM-RULES.md`
- Microsoft Learn oder amtliche Quellen, wenn ein Claim davon abhaengt

Ohne Quelle oder eigene Evidence wird kein finaler Buchclaim geschrieben.

## Company Creation Spezialregel

`UNIVERSAARL-DE` wird nicht erstellt, nur weil `Neu` sichtbar ist. Vor `Finish`, `OK`, Speichern oder anderer wirksamer Erstellung muessen die Optionen bewertet werden:

- `Blank` / `No Data`: bevorzugt, wenn sichtbar und fachlich verstanden.
- `Setup Data Only` / `Production Setup`: erlaubt, wenn keine Sample-Stammdaten entstehen und die Setupwirkung erklaert werden kann.
- `Copy Company`: nicht als Universaarl-Zielbasis verwenden, ausser eine leere saubere Vorlage ist belegbar.
- `Testunternehmen`: nicht verwenden, wenn Demo- oder Sampledaten entstehen.
- CRONUS-Kopie: keine Universaarl-Buchbasis.

Ist die Route unklar, wird kein Finish ausgefuehrt. Stattdessen: read-only Wizard-Diagnose, Quellencheck, Blocker und naechster sicherer Case.

## Result-Erweiterung

Kuenftige Result JSONs sollen fuer wirksame Aktionen diese Felder nutzen:

```json
{
  "smartDecisionCards": [],
  "effectiveActionsTaken": [],
  "effectiveActionsBlocked": [],
  "whyActionsWereSafeOrBlocked": [],
  "bookReasoning": [],
  "sourceBasis": [],
  "nextSensibleStep": ""
}
```

## Leitregel

Das Gate soll nicht laehmen. Wenn der Schritt sinnvoll, belegt, erklaerbar und sicher ist, wird er ausgefuehrt und sauber nachgewiesen. Wenn er unklar ist, wird zuerst read-only untersucht und die bessere Route gewaehlt.

## Zero-Open-Questions-Pruefung

Jede Smart Decision Card muss nennen, ob die Aktion eine offene Objekt-, Feld-, Action-, Dialog-, Tabellen- oder Buchungsfrage schliesst oder eine neue Frage erzeugt. Neue Fragen werden nicht als lose Notiz behalten, sondern in `.agent/state/open_questions_register.json` eingetragen oder direkt mit einem finalen Status aus `playwright/projects/fibu-book5/BC-ZERO-OPEN-QUESTIONS-POLICY.md` klassifiziert.

Eine wirksame Aktion darf nicht als Buch- oder Coverage-Abschluss gewertet werden, wenn ihre zentralen Felder, Buttons, Dialoge oder Postenwirkungen noch unverstanden sind.

## Verbindung zum Next-Step-Gate

Vor einer Smart Decision Card muss der geplante naechste Case gegen `.agent/NEXT-STEP-DECISION-GATE.md` geprueft werden. Wenn der naechste Case noch nicht vorbereitet ist, wird zuerst Source Check, UI Discovery, Setup-Fit, Buchkontext oder Queue-Anpassung erledigt.
