# FIXEDASSETS-060 Purchase-Invoice-Card-Kontext-Preflight

Status: `labor`, `ui-first`, `context-preflight`, `no-target-entry`, `no-preview`, `no-posting`, `not-final`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | card-lines-context-proven-no-target-entry |
| Zielwerte eingegeben | nein |
| Gebucht | nein |

## Ergebnis

Nach New/Neu sind ein singularer Purchase-Invoice-Titel, Pflichtfelder und Lines-/Gridspalten sichtbar. Es wurden bewusst keine Zielwerte eingegeben.

## Lernwert

Nach `Neu` muss Business Central nicht nur eine Aktion bestaetigen, sondern einen eindeutigen fachlichen Zielbereich zeigen. Fuer den Anlagenkauf reicht ein Listen- oder Inline-Zeilenkontext nicht. Erst ein sichtbarer Belegkopf mit Pflichtfeldern und ein sichtbarer Lines-/Gridbereich waeren die Grundlage fuer spaetere Zielwerte.

## Buchwirkung

Kapitel 21 kann als naechsten Gate-Schritt entscheiden, ob ein enger Zielwerte-Preflight erlaubt wird. Das Bild bleibt Preflight, kein Anlagenkauf.

## Screenshot-QA

`fixedassets-060-030-after-new-context-preflight.png` ist ein Labor-/Preflight-Kandidat. Das Bild zeigt den aktiven Einkaufsrechnungskontext, Pflichtfelder und Lines/Grid, aber keine fachlichen Zielwerte. Die FactBox ist rechts noch sichtbar und die erste Zeile steht default auf `Item`; deshalb darf das Bild nur erklaeren, wo Kopf und Zeilenbereich liegen, nicht wie ein Anlagenkauf ausgefuellt oder gebucht wird.

## Grenzen

- Keine Eingabe von `K30000`, `Vendor Invoice No.` oder `FA-CNC-01`.
- Keine Preview, kein `Post`, kein Anlagenzugang, keine AfA und keine Anlagenposten.
- CRONUS-USA-Labor; kein deutscher HGB-/Kontenplan-/VAT-Finalnachweis.

## Naechster Schritt

FIXEDASSETS-061-K30000-FA-CNC-01-TARGET-FIELD-MAPPING-GATE: ohne BC-Lauf entscheiden, ob Zielwerte in einem neuen kontrollierten Lauf gesetzt werden duerfen.
