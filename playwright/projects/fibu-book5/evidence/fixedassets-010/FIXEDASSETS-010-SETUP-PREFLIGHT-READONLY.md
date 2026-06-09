# FIXEDASSETS-010 Setup-Preflight read-only

Status: `labor`, `read-only`, `setup-preflight`, `gate-locked`, `no-posting`, `no-setup-change`, `not-final`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Arbeitsmodus | Nur UI lesen; keine Stammdatenanlage, kein Setup, keine Buchung |
| Breite Layoutansicht | 2400 x 1300; FactBox soweit moeglich ausgeblendet |
| Gate | `FIXEDASSETS-004-SETUP-OR-POSTING` bleibt geschlossen |

## Ergebnis

| Seite | Oeffnung | Kontext sichtbar | Zielwert sichtbar | New/Neu nur Kandidat | Bedeutung |
|---|---|---:|---:|---:|---|
| FA Posting Groups | tell-me:FA Posting Groups | ja | nein | ja | Kontenfindung fuer Anlagenzugang, AfA und Anlagenabgang |
| Depreciation Books | page:5611 | ja | nein | ja | Bewertungs- und Abschreibungslogik fuer die Zielanlage |
| Fixed Assets | page:5601 | ja | nein | ja | Anlagenstamm fuer die spaetere CNC-Anlage |
| Vendors | page:27:filtered | ja | nein | ja | Kreditor fuer die spaetere Anlagen-Einkaufsrechnung |

## Was damit praktisch nachgewiesen ist

- Die relevanten Fixed-Assets-Setup-Kontexte koennen in der UI getrennt angesteuert werden.
- `New/Neu` ist weiterhin ein zu schuetzender Schritt: sichtbar heisst noch nicht freigegeben. Fuer den naechsten Setup-Lauf muss jede Anlageaktion seitenbezogen und idempotent erfolgen.
- Die breite Ansicht verbessert Tabellen-Screenshots, ersetzt aber keine fachliche Pruefung der Feldwerte.

## Was nicht nachgewiesen ist

- `MACHINES`, `HGB`, `FA-CNC-01` und `K30000` wurden nicht angelegt.
- Kein Anlagenzugang, keine Einkaufsrechnung, keine Abschreibung und keine Buchung wurden erzeugt.
- Es gibt keinen deutschen HGB-/Kontenplan-Endstand und keinen deutschen Finalnachweis.

## Anfaenger-Lernwert

Vor einer Anlagenbuchung muessen vier Dinge getrennt verstanden werden: die Anlage als Stammdatum, das AfA-Buch als Bewertungslogik, die Anlagenbuchungsgruppe als Kontenfindung und der Kreditor als Einkaufsgegenpartei. Business Central reagiert spaeter mit Buchungsfehlern oder falscher Kontierung, wenn eine dieser Ebenen fehlt oder geraten wird.

## Buchwirkung

Kapitel 21 sollte den Setup-Preflight als eigenen bebilderten Abschnitt behalten: Leser sehen zuerst die Listen und Feldbereiche, bevor sie `New/Neu` verwenden. Das verhindert, dass Anfaenger eine Anlagenkarte anlegen, ohne AfA-Buch, Buchungsgruppe, Kreditor und Zugangspfad verstanden zu haben.

## Naechster Schritt

FIXEDASSETS-011-SETUP-GATE-DECISION: aus dieser Preflight-Evidence eine explizite, eng begrenzte Setup-Freigabe fuer MACHINES/HGB/FA-CNC-01/K30000 ableiten oder fehlende UI-Mappings nachschaerfen; weiterhin keine Buchung ohne separaten Posting-Gate.
