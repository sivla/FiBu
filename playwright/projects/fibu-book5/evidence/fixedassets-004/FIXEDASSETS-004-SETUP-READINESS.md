# FIXEDASSETS-004 Anlagen-Setup-Readiness

Status: `labor`, `read-only`, `setup-readiness`, `no-posting`, `no-setup-change`, `not-final`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Zielanlage | `FA-CNC-01` |
| Zielbetrag | `120.000 EUR` |
| Ziel-AfA-Buch | `HGB` |
| Ziel-Anlagenbuchungsgruppe | `MACHINES` |
| Zielkreditor | `K30000` |
| Buchung in diesem Lauf | nein |

## Ergebnis

| Pruefpunkt | Seite/Pfad | Zielwert sichtbar | Bedeutung |
|---|---|---:|---|
| Anlage | Fixed Assets / Page 5601 | nein | Stammdatum fuer die spaetere Aktivierung |
| AfA-Buch | Depreciation Books / Page 5611 | nein | Bewertungs-/Abschreibungslogik |
| Anlagenbuchungsgruppe | Tell-Me FA Posting Groups | nein | Kontenfindung fuer Anlagenzugang und AfA |
| Kreditor | Vendors / Page 27 | nein | Lieferant fuer Einkaufsrechnung |
| Einkaufsrechnungspfad | Purchase Invoices / Page 9308 | ja | moeglicher Zugangspfad; noch kein Beleg |

## Anfaenger-Lernwert

Anlagenbuchhaltung ist kein einzelner Button. Eine Anlage wird erst buchungsfaehig, wenn Stammdatum, AfA-Buch, Anlagenbuchungsgruppe, Zugangspfad und Kontenfindung zusammenpassen. Eine leere gefilterte Liste ist dabei kein technischer Fehler: Sie zeigt, dass das Zielobjekt noch nicht als Laborstammdatum existiert oder nicht ueber diesen Pfad sichtbar ist.

## Buchwirkung

Kapitel 21 braucht vor der ersten bebilderten Anlagenbuchung eine Setup-Checkliste: Zielanlage `FA-CNC-01`, AfA-Buch `HGB`, Anlagenbuchungsgruppe `MACHINES`, Kreditor `K30000`, Zugangsbetrag `120.000 EUR`, danach erst Einkaufsrechnung/Aktivierung und Postenspur. Dieser Lauf liefert Readiness-Evidence, aber noch kein finales Prozessbild.

## Grenzen

- CRONUS-USA-Labor, gemischte UI, kein deutscher HGB-/Kontenplan-Endstand.
- Keine Anlage, keine Einkaufsrechnung, keine Aktivierung, keine AfA und keine Buchung.
- Fehlende Zielwerte duerfen im Buch nicht als vorhanden behauptet werden.

## Naechster Schritt

FIXEDASSETS-005 als idempotenten UI-Setup-Fit nur vorbereiten oder ausfuehren, wenn fehlende Zielobjekte fachlich sicher angelegt werden sollen: zuerst FA-CNC-01 und K30000/Anlagenzugangsvoraussetzung, dann HGB/MACHINES-Kontenfindung, danach erst separater Buchungsfreigabe-Lauf.
