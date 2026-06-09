# MANUFACTURING-001 Readiness

Status: `labor`, `read-only`, `manufacturing-readiness`, `gate-locked`, `no-posting`, `no-setup-change`, `not-final`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Relevantes Gate | `MANUFACTURING-001-POSTING` locked |
| Setup-Aenderung | nein |
| Buchung | nein |

## Gepruefte UI-Einstiege

| Tell-Me-Suche | Treffer sichtbar | Screenshot |
|---|---|---|
| Planning Worksheet | ja | manufacturing-001-010-planning-worksheet-tell-me.png |
| Production BOMs | ja | manufacturing-001-020-production-boms-tell-me.png |
| Routings | ja | manufacturing-001-030-routings-tell-me.png |
| Released Production Orders | ja | manufacturing-001-040-released-production-orders-tell-me.png |
| Consumption Journal | ja | manufacturing-001-050-consumption-journal-tell-me.png |
| Output Journal | ja | manufacturing-001-060-output-journal-tell-me.png |
| Assembly Orders | nein | manufacturing-001-070-assembly-orders-tell-me.png |

## Gepruefte Zielartikel

| Artikel | Sichtbar | Rolle im Buchfall | Screenshot |
|---|---|---|---|
| RM-M100 | ja | Fertigerzeugnis / Maschinenzielartikel | manufacturing-001-080-item-rm-m100.png |
| RAW-STEEL | ja | Rohmaterial aus P2P-Labor | manufacturing-001-090-item-raw-steel.png |
| COMP-CTRL | nein | geplante Komponente | manufacturing-001-100-item-comp-ctrl.png |
| KIT-MAINT | nein | geplanter Assembly-/Service-Kit | manufacturing-001-110-item-kit-maint.png |

## Anfaenger-Lernwert

Fertigung startet nicht mit `Post`. Zuerst muss klar sein, ob Business Central die richtigen Einstiegsseiten kennt und ob die beteiligten Artikel als Zielartikel, Rohmaterial, Komponente oder Kit ueberhaupt vorhanden sind. Fuer eine Maschine braucht BC spaeter mindestens Artikel, Materialstruktur, Arbeitsplan oder Montage-/Fertigungslogik, Lagerort, Buchungsgruppen, Bestand und Kostenlogik. Wenn einer dieser Bausteine fehlt, scheitert die Produktion nicht am letzten Buchungsbutton, sondern schon an Stammdaten und Setup.

## Was bewiesen ist

- Manufacturing- und Assembly-Einstiege wurden in RM-DEMO read-only gesucht und als Navigationsevidence dokumentiert.
- RM-M100 und RAW-STEEL wurden als vorhandene Laborartikel read-only geprueft.
- COMP-CTRL und KIT-MAINT wurden als geplante Buchartikel read-only geprueft; falls nicht sichtbar, ist das ein Stammdaten-Backlog-Befund.
- Der vorhandene positive RM-M100-Bestand aus INVENTORY-008 bleibt als Trainingsbestand getrennt von Manufacturing-Output.

## Was nicht bewiesen ist

- Kein Production BOM BOM-RM-M100.
- Kein Routing ROUTE-M100.
- Kein Fertigungsauftrag PROD-3001.
- Kein Verbrauch von RAW-STEEL oder COMP-CTRL.
- Kein Output von RM-M100.
- Kein Montageauftrag fuer KIT-MAINT.
- Keine Fertigungsauftragsstatistik, keine Kapazitaets- oder Wertposten aus Produktion.
- Kein deutscher Finalnachweis.

## Buchwirkung

Kapitel 14 darf Manufacturing/Assembly jetzt als eigenen Readiness-Block behandeln: Navigation und Zielobjekte muessen vor einer Produktion belegt werden. Der bestehende Inventory-Zugang `INV008-899959` bleibt ein Trainingsbestand, kein Manufacturing-Output. Fuer einen echten Produktionsfall braucht das Buch einen separaten Gate-Lauf mit Production BOM/Routing oder Assembly-BOM und danach Postenspur.

## Naechster Schritt

MANUFACTURING-002 als Buch-/Evidence-Sync fuer Kapitel 14: Readiness-Befunde einarbeiten und danach nur mit ausdruecklichem Gate Production BOM/Routing/Assembly-Setup UI-first vorbereiten.
