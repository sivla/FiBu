# PWS-FF-005 Dimensions Read-first

Dieser Lauf liest Dimensionen, Dimensionswerte und den Dimensionskontext der Finanzbuchhaltung-Einrichtung.

Instanz: playthru
Company: UNIVERSAARL-DE

## Ergebnis

1/5 Seitenkontexte wurden als read-only beobachtet.

Die Dimensionsliste wurde ueber Tell-Me sichtbar und als read-only Kontext akzeptiert. Die Dimensionswerte-Route und der Dimensionskontext der Finanzbuchhaltung-Einrichtung wurden noch nicht als Zielseite akzeptiert. Der naechste sinnvolle Schritt ist deshalb `PWS-FF-005B-DIMENSION-VALUES-RELATED-ACTION-ROUTE-RECOVERY`, nicht Master Data und keine globale Dimensionsaenderung.

## UI-Learning

- Dimensionen sind keine Buchung und keine Stammdatenkarte, sondern Auswertungsachsen.
- Dimensionswerte muessen im richtigen Dimensionskontext gelesen werden; ein Suchdialog oder Role Center reicht nicht als Beweis.
- Globale Dimensionen und Standarddimensionen sind eigene Setup-Entscheidungen und wurden nicht geaendert.
- Sichtbare Aktionen wie Neu, Bearbeiten oder Globale Dimensionen aendern sind nur Screenshot-Kontext, keine ausgefuehrten Aktionen.
- Direkte Page-URLs koennen im Webclient auf das Rollencenter zurueckfallen; ein akzeptierter Screenshot braucht sichtbare Zielseiten-Signale.
- Die Suchroute fuer Dimensionswerte findet in dieser Oberflaeche zuerst `Zuordnung der Intercompany-Dimensionswerte`; das ist nicht die gewuenschte Dimensionswerte-Seite.

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

- playwright/projects/fibu-book5/evidence/pws-ff-005-dimensions-readfirst/PWS-FF-005-result.json
- playwright/projects/fibu-book5/evidence/pws-ff-005-dimensions-readfirst/README.md
- playwright/projects/fibu-book5/evidence/pws-ff-005-dimensions-readfirst/pws-ff-005-001-dimensions-list.txt
- playwright/projects/fibu-book5/evidence/pws-ff-005-dimensions-readfirst/pws-ff-005-001-dimensions-list.png
- playwright/projects/fibu-book5/evidence/pws-ff-005-dimensions-readfirst/pws-ff-005-001-dimensions-list.screenshot.json
- playwright/projects/fibu-book5/evidence/pws-ff-005-dimensions-readfirst/pws-ff-005-002-productline-values.txt
- playwright/projects/fibu-book5/evidence/pws-ff-005-dimensions-readfirst/pws-ff-005-002-productline-values.png
- playwright/projects/fibu-book5/evidence/pws-ff-005-dimensions-readfirst/pws-ff-005-002-productline-values.screenshot.json
- playwright/projects/fibu-book5/evidence/pws-ff-005-dimensions-readfirst/pws-ff-005-003-costcenter-values.txt
- playwright/projects/fibu-book5/evidence/pws-ff-005-dimensions-readfirst/pws-ff-005-003-costcenter-values.png
- playwright/projects/fibu-book5/evidence/pws-ff-005-dimensions-readfirst/pws-ff-005-003-costcenter-values.screenshot.json
- playwright/projects/fibu-book5/evidence/pws-ff-005-dimensions-readfirst/pws-ff-005-004-channel-values.txt
- playwright/projects/fibu-book5/evidence/pws-ff-005-dimensions-readfirst/pws-ff-005-004-channel-values.png
- playwright/projects/fibu-book5/evidence/pws-ff-005-dimensions-readfirst/pws-ff-005-004-channel-values.screenshot.json
- playwright/projects/fibu-book5/evidence/pws-ff-005-dimensions-readfirst/pws-ff-005-005-general-ledger-dimension-context.txt
- playwright/projects/fibu-book5/evidence/pws-ff-005-dimensions-readfirst/pws-ff-005-005-general-ledger-dimension-context.png
- playwright/projects/fibu-book5/evidence/pws-ff-005-dimensions-readfirst/pws-ff-005-005-general-ledger-dimension-context.screenshot.json
