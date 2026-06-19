# FIXEDASSETS-082 - Acquire Disabled Diagnosis

Status: `labor`, `ui-first`, `read-only`, `disabled-action-diagnosis`, `no-posting`, `no-preview`, `not-final`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Anlage | FA-CNC-01 |
| Acquire sichtbar | ja |
| Acquire deaktiviert | ja |
| Book Value 0,00 sichtbar | ja |
| Spezifisches AfA-Buch sichtbar | nein |

## Ergebnis

FA-082 confirmed read-only that Acquire remains visible but disabled on FA-CNC-01. UI evidence shows Book Value 0,00 and no specific depreciation-book value such as HGB in this compact card view. The cause is not proven; the next case must decide between edit-mode/Page Inspection diagnosis or an alternate acquisition route.

## Was man in BC lernt

Eine sichtbare Aktion ist in Business Central nicht automatisch ausfuehrbar. Wenn eine Aktion deaktiviert ist, muss die Anleitung erst den Kontext klaeren: Datensatzstatus, Page-Modus, sichtbare Pflichtfelder, Setup-Zustand und alternative Prozessroute. Sonst wuerde das Buch einen Klickpfad versprechen, den ein Anfaenger im selben Zustand nicht ausfuehren kann.

## Diagnose aus sichtbarer UI

- The UI exposes Acquire, but Business Central marks the action disabled for the current card state.
- Book Value is visible as 0,00, so no acquisition value has been posted yet; this is evidence of state, not proof of the disablement cause.
- The Depreciation Book area is visible, but no specific book code such as HGB is visible in this compact card context.
- An Edit/Bearbeiten signal is visible; the disabled action may require a different card mode or further setup, but FA-082 did not enter edit mode.

## Buchwirkung

Kapitel 21 darf den Acquire-Weg noch nicht als ausfuehrbare Anschaffungsanleitung darstellen. Es braucht eine Erklaerung fuer deaktivierte Aktionen und eine bewusste naechste Route: edit-mode/Page-Inspection-Diagnose oder alternativer FA-G/L-Journal-Pfad.

## Grenzen

- Kein Klick auf `Acquire`.
- Kein Edit-Modus, keine Werteingabe, keine Setup-Aenderung.
- Keine Preview, keine Buchung, keine FA Ledger Entry Spur.
- CRONUS-USA-Labor, kein deutscher Anlagen-/Steuer-/Kontenplan-Finalnachweis.

## Naechster Schritt

FIXEDASSETS-083-ACQUIRE-ROUTE-DECISION: decide whether to unlock a controlled edit-mode/Page Inspection probe or switch to an alternate acquisition route such as Fixed Asset G/L Journal.
