# PLAYWRIGHT-STRICTNESS-001

Technischer Playwright-Qualitaetslauf fuer `FIXEDASSETS-023`.

- Migrierter Test: `playwright/projects/fibu-book5/tests/fixedassets-023-fa-cnc-01-card-technical-diagnosis.spec.ts`
- Neues Primaermuster: `clickBcAction()` mit `scopeText` und `expectedAfterClick`
- Beobachtung: `fallbackUsed = false`, Rolle `menuitem`
- Grenzen: keine Setup-Aenderung, keine Stammdatenanlage, kein Speichern, keine Buchung, kein Company-Wechsel.
- Validierung: migrierter Test, Encoding, Diff-Check und Helper-Load-Checks erfolgreich.
