# MANUFACTURING-002 - Kapitel-14-Sync nach Readiness

Status: `done-labor-book-sync`  
Sandbox: `MCP_1_20260210`  
Company: `RM-DEMO`  
Datenbasis: CRONUS USA  
Laufart: Buch-/Evidence-Sync ohne neuen BC-Lauf  
Buchung: nein  
Setup-Aenderung: nein  

## Ausgangspunkt

`MANUFACTURING-001` hat nur eine Readiness geprueft. Sichtbar sind die zentralen Manufacturing-Einstiege ueber Tell-Me: `Planning Worksheet`, `Production BOMs`, `Routings`, `Released Production Orders`, `Consumption Journal` und `Output Journal`. `Assembly Orders` war nicht belastbar sichtbar.

Bei den Artikeln sind `RM-M100` und `RAW-STEEL` sichtbar. `COMP-CTRL` und `KIT-MAINT` sind im Labor nicht sichtbar. Auf den Artikelkarten wurden keine sichtbaren BOM-/Routing-/Manufacturing-Marker nachgewiesen.

## Synchronisierte Buchwahrheit

Kapitel 14 beschreibt fachlich weiterhin das Zielbild:

- `PROD-3001` fuer `RM-M100`
- Menge `3`
- Lagerort `FRA-ZL`
- Production BOM `BOM-RM-M100`
- Routing `ROUTE-M100`
- Verbrauch von `RAW-STEEL` und Komponenten
- Output von `RM-M100`
- danach Artikelposten, Wertposten, Kapazitaetsposten, Sachposten und Fertigungsauftragsstatistik

Dieses Zielbild ist in `RM-DEMO` noch nicht praktisch ausgefuehrt. Der aktuelle Laborbefund ist nur Readiness, kein Produktionsnachweis.

## Anfaenger-Lernwert

In Business Central ist ein sichtbarer Menuepunkt noch kein funktionierender Prozess. Fertigung braucht zuerst Stammdaten und Struktur:

1. Fertigartikel und Komponenten muessen existieren.
2. Stueckliste oder Montage-/Fertigungsstruktur muss definiert sein.
3. Ein Arbeitsplan oder eine passende Produktionslogik muss vorhanden sein, wenn Kapazitaeten bewertet werden sollen.
4. Erst danach darf ein Auftrag erzeugt, Verbrauch gebucht und Output gemeldet werden.
5. Der Nachweis entsteht erst ueber Posten und Statistik, nicht ueber die sichtbare Seite allein.

`INV008-899959` bleibt deshalb ein kontrollierter Trainings-/Opening-Balance-Zugang im Item Journal. Er ist kein Manufacturing-Output und ersetzt keinen Fertigungsauftrag.

## Gate-Grenze

Gate `MANUFACTURING-001-POSTING` bleibt gesperrt. Ohne ausdrueckliche Freigabe gilt:

- keine Production BOM anlegen oder aendern
- kein Routing anlegen oder aendern
- keine Assembly-Struktur anlegen
- keinen Fertigungsauftrag erzeugen
- keinen Montageauftrag erzeugen
- keinen Verbrauch buchen
- keinen Output buchen
- keine Fertigungs-/Montagebuchung

## Buchwirkung

Kapitel 14 wurde so angepasst, dass Leser das Zielbild und den aktuellen Laborstand nicht verwechseln. Die Schrittfolge bleibt als fachliches Ziel erhalten, aber vor die Schrittfolge ist eine Readiness-Pruefung gestellt. Die UAT-Erwartung markiert nun klar, dass der Produktionsfall im aktuellen Labor noch offen ist.

## Naechster Schritt

Ohne Gate: `SERVICE-001-READINESS` als read-only Pruefung fuer Kapitel 15.  
Mit Gate: UI-first Manufacturing-Setup-Readiness fuer fehlende Komponenten, BOM/Routing oder Assembly-Struktur, weiterhin vor jeder Buchung.
