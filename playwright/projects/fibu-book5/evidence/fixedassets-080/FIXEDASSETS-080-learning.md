# FIXEDASSETS-080 - FA-CNC-01 Acquire Action Read-only Preflight

Status: `labor`, `ui-first`, `read-only`, `fixed-asset-card`, `no-posting`, `no-preview`, `not-final`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Anlage | FA-CNC-01 |
| Kartenkontext sichtbar | ja |
| Acquire/Anschaffungsaktion sichtbar | ja |
| HGB sichtbar | nein |
| Book Value sichtbar | ja |

## Ergebnis

FA-080 proved the existing FA-CNC-01 card context read-only and found an Acquire/Acquisition action signal. The next case may deliberately unlock only opening that action, not values or posting.

## Was man in BC lernt

Die Anlagenkarte ist ein fachlicher Kontrollpunkt vor dem Anlagenzugang: Man sieht dort den Stammdatensatz, das AfA-/Buchwertumfeld und je nach Rolle bzw. Page-Kontext auch Aktionen rund um Anschaffung, Buchwert oder AfA. Erst wenn die Karte den richtigen Kontext zeigt, lohnt sich der naechste kontrollierte Schritt.

## Buchwirkung

Kapitel 21 kann die Anlagenkarte als Einstieg vor dem Acquire-Wizard erklaeren. Der Screenshot-/Klickpfad darf aber erst nach einem eigenen Wizard-Preflight zeigen, was nach dem Klick passiert.

## Grenzen

- `Acquire` wurde nicht geklickt.
- Keine Eingabe von `K30000`, keinem Betrag und keiner Zielzeile.
- Keine Preview, keine Buchung, keine Setup-Aenderung.
- CRONUS-USA-Labor, kein deutscher Anlagen-/Steuer-/Kontenplan-Finalnachweis.

## Naechster Schritt

FIXEDASSETS-081-ACQUIRE-ACTION-WIZARD-PREFLIGHT: open the Acquire action in a guarded case only, then stop before values, Finish, Preview or Posting.
