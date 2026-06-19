# FIXEDASSETS-081 - Acquire Action Wizard Preflight

Status: `labor`, `ui-first`, `guarded-acquire-click`, `no-posting`, `no-preview`, `not-final`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Anlage | FA-CNC-01 |
| Acquire geklickt | nein |
| Wizard-/Dialogkontext sichtbar | nein |
| Riskanter Sofortdialog | nein |
| Cancel/Close versucht | nein |

## Ergebnis

FA-081 proved that the scoped Acquire action is visible on FA-CNC-01 but disabled. No wizard opened and no values/posting were touched.

## Was man in BC lernt

Business Central kann Aktionen sichtbar anzeigen und trotzdem deaktivieren. Das ist fachlich wichtig: Die Page zeigt dem Anwender, dass die Funktion grundsaetzlich existiert, aber der aktuelle Datensatz oder Setup-Zustand die Ausfuehrung noch nicht erlaubt. Fuer das Buch ist das ein eigener Diagnosepunkt, bevor Werte eingegeben oder gebucht werden duerfen.

## Buchwirkung

Kapitel 21 muss erklaeren, dass BC Aktionen sichtbar, aber kontextabhaengig deaktiviert anzeigen kann. Die Ursache muss vor der Anschaffungsbuchung diagnostiziert werden.

## Grenzen

- Keine Eingabe von Kreditor, Betrag, Datum oder Anlage in einen Beleg/ein Journal.
- Kein `Finish`, kein `OK`, kein `Yes`, keine Preview, keine Buchung.
- CRONUS-USA-Labor, kein deutscher Anlagen-/Steuer-/Kontenplan-Finalnachweis.

## Naechster Schritt

FIXEDASSETS-082-ACQUIRE-ACTION-DISABLED-DIAGNOSIS: diagnose why Acquire is disabled on FA-CNC-01 before any value entry or posting.
