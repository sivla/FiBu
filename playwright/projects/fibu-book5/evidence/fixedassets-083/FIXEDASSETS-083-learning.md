# FIXEDASSETS-083 - Acquire Route Decision

Status: `labor`, `local-decision`, `no-bc-execution`, `no-posting`, `not-final`.

## Ergebnis

FA-083 selected the Fixed Asset G/L Journal route as the next route to discover read-only. FA-082 proved Acquire is visible but disabled; edit-mode and Page Inspection remain useful diagnostics, but the journal route is the most direct next step toward a controlled acquisition process and posting trace.

## Bewertung

| Route | Entscheidung | Score | Begruendung |
|---|---|---:|---|
| edit-mode-readonly-probe | defer | 11 | Could test whether Acquire depends on card edit mode, but it unlocks Edit and still does not prove the standard acquisition posting route. |
| page-inspection-probe | defer | 12 | Useful for the debugging chapter, but unlikely to produce the next executable acquisition path by itself. |
| fixed-asset-gl-journal-route | selected | 18 | Most directly advances the book goal: find a standard UI-first acquisition route after Purchase Invoice line type and card Acquire are blocked. |

## Was man in BC lernt

Wenn ein sichtbarer Button deaktiviert ist, muss man nicht sofort immer tiefer in denselben Button hineinbohren. Fuer eine belastbare Buchanleitung ist oft wichtiger, den naechsten standardnahen Prozesspfad zu finden. Der deaktivierte `Acquire`-Button bleibt ein Debugging-/Lernfall; die Anschaffungsroute wird als separater, kontrollierter Klickpfad weiter untersucht.

## Buchwirkung

Kapitel 21 sollte den deaktivierten Acquire-Button als Lernfall behalten, aber den naechsten Klickpfad fuer die Anschaffung ueber eine separate Fixed-Asset-G/L-Journal-Route pruefen, bevor eine Anschaffungsbuchung beschrieben wird.

## Grenzen

- Kein BC-Lauf in FA-083.
- Keine Page Inspection, kein Edit-Modus, keine Journal-Seite geoeffnet.
- Keine Werteingabe, keine Preview, keine Buchung.
- Kein deutscher Finalnachweis.

## Naechster Schritt

FIXEDASSETS-084-FA-GL-JOURNAL-ROUTE-READONLY-DISCOVERY: open the Fixed Asset G/L Journal route read-only, prove page/context/actions, and stop before any new line, value entry, preview or posting.
