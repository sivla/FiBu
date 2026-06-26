# FIXEDASSETS-227 - Posted FA Ledger Trace Review

Status: `read-only`, `posting-trace`, `no-posting`, `no-preview`, `no-setup-change`, `not-final`.

| Feld | Wert |
|---|---|
| Instanz | MCP_1_20260210 |
| Company | RM-DEMO |
| Dokument | `G05001` |
| Anlage | `FA-CNC-01` |
| Anlagenposten sichtbar | ja |
| Bester Pfad | 010-fa-ledger-page-5604-fa-no |

## Proben

| Probe | Page | Status | Kontext | Signale | Leerbild |
|---|---:|---|---:|---:|---:|
| 010-fa-ledger-page-5604-fa-no | 5604 | labor | ja | ja | nein |
| 020-fa-ledger-page-5604-document-no | 5604 | labor | ja | ja | nein |
| 030-rejected-page-5606-document-no | 5606 | rejected | ja | nein | ja |

## Lernwert

Nach einer Buchung reicht die Sachpostenspur nicht aus. Fuer Anlagen muss Business Central zusaetzlich ueber die gebuchten Anlagenposten nachvollziehbar machen, welche Anlage, welches AfA-Buch und welcher Anlagenbuchungstyp betroffen sind. FA-227 prueft deshalb den posted Ledger read-only und trennt ihn vom vorherigen Preview-Pfad.

## Grenzen

- CRONUS-USA-Labor in RM-DEMO, kein deutscher Finalnachweis.
- Keine neue Buchung und kein Preview Posting.
- Keine Abschreibungsbuchung.

## Naechster Schritt

FIXEDASSETS-228: sync Chapter 21 and coverage with posted FA acquisition evidence; no new posting.
