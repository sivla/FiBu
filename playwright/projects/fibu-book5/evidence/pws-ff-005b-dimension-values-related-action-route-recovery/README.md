# PWS-FF-005B Dimension Values Related-Action Route Recovery

Dieser Lauf prueft lesend, ob ein Key User von der Dimensionen-Liste ueber die Aktion Dimension zu den passenden Dimensionswerten gelangt.

Instanz: playthru
Company: UNIVERSAARL-DE

## Ergebnis

4/4 Routen-/Seitenkontexte wurden als read-only beobachtet.

## UI-Learning

- Dimensionen sind keine Buchung und keine Stammdatenkarte, sondern Auswertungsachsen.
- Dimensionswerte muessen im richtigen Dimensionskontext gelesen werden; ein Suchdialog, Role Center oder Intercompany-Zuordnungsseite reicht nicht als Beweis.
- Dieser Lauf verwendet bewusst keinen Tell-Me-Fallback fuer Dimensionswerte, weil PWS-FF-005 gezeigt hat, dass die Suche einen falschen Seitenkontext oeffnen kann.
- Globale Dimensionen und Standarddimensionen sind eigene Setup-Entscheidungen und wurden nicht geaendert.
- Sichtbare Aktionen wie Neu, Liste bearbeiten oder Loeschen sind nur Screenshot-Kontext, keine ausgefuehrten Aktionen.

## Nicht enthalten

- Keine Dimension wurde angelegt oder geaendert.
- Kein Dimensionswert wurde angelegt oder geaendert.
- Keine globale Dimension wurde gesetzt.
- Keine Standarddimension wurde zugeordnet.
- Keine Stammdaten, kein Beleg, kein Draft.
- Keine Buchungsvorschau.
- Keine Buchung.
- Keine API-Abkuerzung.

## Evidence-Dateien

- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/PWS-FF-005B-result.json
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/README.md
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-001-dimensions-list.txt
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-001-dimensions-list.png
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-001-dimensions-list.screenshot.json
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-002-productline-values.txt
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-002-productline-values.png
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-002-productline-values.screenshot.json
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-003-costcenter-values.txt
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-003-costcenter-values.png
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-003-costcenter-values.screenshot.json
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-004-channel-values.txt
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-004-channel-values.png
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-004-channel-values.screenshot.json
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-route-productline-010-dimensions-list-before-row-select.png
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-route-productline-010-dimensions-list-before-row-select.screenshot.json
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-route-productline-020-dimension-row-selected.png
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-route-productline-020-dimension-row-selected.screenshot.json
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-route-productline-030-dimension-action-opened.png
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-route-productline-030-dimension-action-opened.screenshot.json
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-route-productline-040-dimension-values-action-clicked.png
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-route-productline-040-dimension-values-action-clicked.screenshot.json
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-route-costcenter-010-dimensions-list-before-row-select.png
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-route-costcenter-010-dimensions-list-before-row-select.screenshot.json
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-route-costcenter-020-dimension-row-selected.png
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-route-costcenter-020-dimension-row-selected.screenshot.json
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-route-costcenter-030-dimension-action-opened.png
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-route-costcenter-030-dimension-action-opened.screenshot.json
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-route-costcenter-040-dimension-values-action-clicked.png
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-route-costcenter-040-dimension-values-action-clicked.screenshot.json
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-route-channel-010-dimensions-list-before-row-select.png
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-route-channel-010-dimensions-list-before-row-select.screenshot.json
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-route-channel-020-dimension-row-selected.png
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-route-channel-020-dimension-row-selected.screenshot.json
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-route-channel-030-dimension-action-opened.png
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-route-channel-030-dimension-action-opened.screenshot.json
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-route-channel-040-dimension-values-action-clicked.png
- playwright/projects/fibu-book5/evidence/pws-ff-005b-dimension-values-related-action-route-recovery/pws-ff-005b-route-channel-040-dimension-values-action-clicked.screenshot.json
