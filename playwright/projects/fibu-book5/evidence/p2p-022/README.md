# P2P-022 Purchase Invoice Draft Cleanup Diagnosis

Status: `labor`, `cleanup-diagnosis`, `no-preview`, `no-post`, `helper-only`, `needs-german-final-rebuild`.

Target draft: `107229`

## Ergebnis

P2P-022 did not clean Purchase Invoice draft 107229; beforeVisible=true, deleteTriggered=true, confirmed=false, afterVisible=true.

## Warum das wichtig ist

Ein kontrollierter Laborbeleg darf nicht einfach liegen bleiben, wenn er nur ein Preflight-Draft war. Vor jeder weiteren P2P-Route muss klar sein, ob der Draft geloescht wurde oder bewusst als Trace behalten wird.

## Grenzen

- Keine Preview Posting.
- Keine Buchung.
- Kein Setup Change.
- Kein deutscher Finalnachweis.
