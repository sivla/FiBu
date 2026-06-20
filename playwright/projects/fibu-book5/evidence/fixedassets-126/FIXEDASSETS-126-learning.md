# FIXEDASSETS-126 - Acquire Action Cause Diagnosis

Status: `labor`, `ui-first`, `read-only-diagnosis`, `no-acquire-execution`, `no-posting`, `no-preview`, `not-final`.

| Pruefpunkt | Befund |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Anlage | FA-CNC-01 |
| Acquire vorher sichtbar | ja |
| Acquire vorher deaktiviert | ja |
| Edit-Probe ohne Feldwert | nein |
| Acquire nach Edit aktiv | nein |
| Page Inspection geoeffnet | nein |

## Ergebnis

FA-126 kept Acquire as a disabled-action diagnosis. The action was visible on FA-CNC-01, but acquisition execution remains locked because the exact executable path and posting effect are not proven.

## Diagnosehinweise

- Acquire is visible but disabled before any edit-mode probe.
- Book Value 0,00 is visible: no acquisition value is posted yet, but that alone does not explain disabled Acquire.

## Buchwirkung

Kapitel 21 muss Acquire weiterhin als blockierten Diagnosepfad behandeln. Sichtbare, aber deaktivierte Aktionen brauchen Page-/Status-/Setup-Erklaerung, bevor sie als Klickanleitung genutzt werden.

## Grenzen

- `Acquire` wurde nicht ausgefuehrt.
- Keine Feldwerte wurden geaendert.
- Keine Preview, keine Buchung, keine Setup-Aenderung.
- Kein deutscher Finalnachweis.

## Naechster Schritt

FIXEDASSETS-127: local review of Acquire disabled cause before any new acquisition route or setup change.
