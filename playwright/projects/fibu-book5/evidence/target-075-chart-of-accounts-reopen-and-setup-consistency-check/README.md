# TARGET-075 Chart of Accounts / Foundation Consistency Check

Instanz: playthru
Company: UNIVERSAARL-DE

## Ergebnis

Read-only Foundation consistency pilot needs review before any next live write.

## Ziel- und Auth-Grenze

- Erwartete Instanz: playthru
- Erwartete Company: UNIVERSAARL-DE
- Auth-Ziel passt zum State: true
- Auth-Ziel aus aktuellem State aufgebaut: true

## Was dieser Lauf nicht tut

- Kein Setup schreiben.
- Keine Stammdaten anlegen.
- Kein Belegentwurf.
- Keine Buchungsvorschau.
- Keine Buchung.
- Keine API-Abkuerzung.

## Buchwirkung

Dieser Lauf liefert die Foundation-Grenze: Was ist vor Stammdaten und Buchungen sichtbar, und welche Setup-Aussagen bleiben noch offen?

## Foundation-Readiness-Handoff

- Nach dem Lauf `FOUNDATION-READINESS-DECISION.md` erstellen oder aktualisieren.
- Kontenplan-Sichtbarkeit nicht als vollstaendigen SKR04- oder Buchungsfaehigkeitsnachweis werten.
- Buchungsgruppen- und MwSt.-Seiten nur als sichtbaren Setup-Kontext werten, nicht als Korrektheitsnachweis.
- Master Data erst nach angenommener Foundation-Readiness starten.

## Evidence-QA

- Alle Foundation-Pages brauchen beobachtete Page-Evidence.
- Jede Page braucht Textauszug, Screenshot und Screenshot-Metadaten.
- Rejected oder blocked Pages halten Master Data geparkt.

## Evidence-Dateien

- playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/TARGET-075-result.json
- playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/README.md
- playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-001-chart-of-accounts.txt
- playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-001-chart-of-accounts.png
- playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-001-chart-of-accounts.screenshot.json
- playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-002-general-business-posting-groups.txt
- playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-002-general-business-posting-groups.png
- playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-002-general-business-posting-groups.screenshot.json
- playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-003-general-product-posting-groups.txt
- playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-003-general-product-posting-groups.png
- playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-003-general-product-posting-groups.screenshot.json
- playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-004-general-posting-setup.txt
- playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-004-general-posting-setup.png
- playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-004-general-posting-setup.screenshot.json
- playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-005-vat-posting-setup.txt
- playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-005-vat-posting-setup.png
- playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/target-075-005-vat-posting-setup.screenshot.json

## UAT- und Trainingswirkung

- Key User sehen, wo Kontenplan und Setup-Kontext geprueft werden.
- Der Lauf liefert eine Uebung fuer den Foundation-Checkpoint vor Stammdaten.
- Unklare Dialoge, Edit-Modus oder falsche Company blockieren den naechsten Schritt.
