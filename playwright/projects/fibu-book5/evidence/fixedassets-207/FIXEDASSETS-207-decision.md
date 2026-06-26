# FIXEDASSETS-207 HGB Page Inspection Result Review

Status: `labor`, `local-review`, `judge_work`, `no-business-central`, `no-playwright`, `no-preview`, `no-posting`, `no-setup-change`, `not-final`.

| Feld | Wert |
|---|---|
| Case | FIXEDASSETS-207-HGB-PAGEINSPECTION-RESULT-REVIEW |
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Quelle | FA-202, FA-203, FA-204, FA-205, FA-206 |
| Entscheidung | kontrollierter UI-first Setup-Fit als naechster Case |

## Befund

FA-202 hat im Fixed Asset G/L Journal nach dem korrigierten `FA Posting Type = Acquisition Cost` keinen Preview-Posting-Erfolg gebracht. Business Central meldete stattdessen, dass `FA Posting Type Acquisition Cost` im FA Journal gebucht werden muss.

FA-203 hat diesen Fehler als Journal-Route- oder G/L-Integration-Problem eingeordnet. FA-204 und FA-206 haben danach auf der HGB Depreciation Book Card read-only nachgewiesen:

- HGB ist das relevante Depreciation Book.
- Die Karte ist Page `Depreciation Book Card (5610)`.
- Die Source Table ist `Depreciation Book (5611)`.
- Das Boolean-Feld `G/L Integration - Acq. Cost (3, Boolean)` existiert.
- Der konkrete Feldwert wurde weder auf der Karte noch in Page Inspection eindeutig sichtbar.

## Entscheidung

Ein weiterer reiner Page-Inspection-Lauf hat geringen Zusatznutzen, weil FA-206 bereits Page, Tabelle und Feld beweist, aber nicht den Wert. Der naechste sinnvolle Schritt ist deshalb ein enger, idempotenter UI-first Setup-Fit:

`FIXEDASSETS-208-HGB-ACQ-COST-GL-INTEGRATION-SETUP-FIT`

Der Fit darf nur versuchen, `G/L Integration - Acq. Cost` auf `on` zu setzen, wenn der Checkbox-Zustand in der UI sicher adressierbar ist. Wenn der Zustand nicht sicher lesbar oder nicht sicher setzbar ist, muss der Lauf blockieren und Evidence schreiben.

## Warum kein Preview/Post

FA-207 entsperrt keine Buchung. Der bisherige Preview-Fehler zeigt nur, dass die aktuelle Journalroute fachlich blockiert ist. Erst nach einem sauberen Setup-Fit darf ein separater Preview-Posting-only Case entscheiden, ob der Blocker verschwunden ist.

## Nicht tun

- Kein Preview Posting.
- Kein Post.
- Kein FA Journal oder FA G/L Journal buchen.
- Kein anderer Depreciation-Book-Schalter.
- Kein Company Switch.
- Keine deutsche HGB-/Steuer-/Kontenplan-Finalbehauptung.

## Anfaenger-Lernwert

Ein AfA-Buch ist nicht nur Beschreibung, sondern steuert, welche Anlagenaktivitaeten mit der Finanzbuchhaltung integriert sind. Wenn `Acquisition Cost` nicht integriert ist, passt ein Fixed Asset G/L Journal nicht zur erwarteten Buchungsroute. Der sichere Lernpfad ist: Fehler lesen, Einrichtung finden, Feld technisch identifizieren, Setup gezielt fitten, danach erst Preview Posting erneut pruefen.

## Naechster Schritt

`FIXEDASSETS-208-HGB-ACQ-COST-GL-INTEGRATION-SETUP-FIT`: HGB Depreciation Book Card oeffnen, Instanz/Company pruefen, `G/L Integration - Acq. Cost` idempotent auf `on` setzen, Vorher/Nachher-Evidence schreiben, kein Preview und kein Post.
