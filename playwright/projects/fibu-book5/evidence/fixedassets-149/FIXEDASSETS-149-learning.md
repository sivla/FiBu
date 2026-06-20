# FIXEDASSETS-149 - FA-CNC-01 Posting Group field-local assignment fit

Status: `changed-labor-posting-group-fit`, `ui-first`, `setup-fit`, `no-acquire`, `no-preview`, `no-posting`, `not-final`.

| Pruefpunkt | Befund |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Anlage | FA-CNC-01 |
| Vorher Posting Group | EQUIPMENT |
| Nachher Posting Group | MACHINES |
| Datenaenderung | ja, nur Posting Group |
| Acquire / Preview / Posting | nein |

## Ergebnis

FA-149 changed FA-CNC-01 Posting Group from EQUIPMENT to MACHINES through the field-local UI selector and confirmed the value after reopening the card.

## Anfaenger-Lernwert

- Die Anlagenbuchungsgruppe auf der Anlagenkarte ist Stammdaten-/Setup-Kontext, keine Anschaffung.
- Ein Feld mit Linktext kann zu einer verwandten Karte fuehren; fuer eine Wertauswahl braucht man den feldlokalen Auswahlknopf.
- `MACHINES` gilt erst, wenn der Wert nach Neuoeffnen der Karte sichtbar ist.
- Ein normal sichtbarer `Acquire`-Button ist noch keine ausgefuehrte Anschaffung; riskant waere erst das bewusste Klicken oder ein Buchungs-/Bestaetigungsdialog.
- Ein Screenshot ist nur belastbar, wenn er den Zielwert wirklich sichtbar zeigt und zur JSON-Evidence passt.

## Grenzen

- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher Finalnachweis.
- Keine Anschaffung, keine Preview Posting, keine Buchung.
- Kein Kreditor, keine Einkaufsrechnung, keine FA Ledger Entries in diesem Lauf.

## Naechster Schritt

FIXEDASSETS-150: review FA-149 field-local assignment evidence before unlocking any acquisition route.
