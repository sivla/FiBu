# SERVICE-002 Book Sync

Status: `book-sync`, `labor`, `read-only-source`, `no-bc-run`, `no-setup-change`, `no-posting`, `gate-locked`, `not-final`.

## Quelle

`SERVICE-002` nutzt keine neue Business-Central-Ausfuehrung. Der Lauf synchronisiert Kapitel 15 mit der vorhandenen Evidence aus `SERVICE-001`.

| Feld | Wert |
|---|---|
| Umgebung | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Datenbasis | CRONUS USA |
| Quelle | `SERVICE-001` |
| Gate | `SERVICE-001-POSTING` bleibt locked |
| Setup-Aenderung | nein |
| Buchung | nein |

## Synchronisierte Buchwahrheit

Kapitel 15 beschreibt weiter das Zielbild eines Servicefalls `SERV-4001`. In `RM-DEMO` ist dieses Zielbild noch nicht praktisch servicefaehig belegt.

Praktisch belegt ist:

- `Service Orders`, `Service Items`, `Resources`, `Service Management Setup`, `Service Contracts` und `Service Ledger Entries` sind als Service-Einstiege sichtbar.
- `D10000` ist als Kunde sichtbar.
- Die Zielobjekte `RM-M100-SN1001`, `SP-PUMP-01`, `RES-TECH` und `VAN-SERV` sind im gefilterten Laborlauf nicht als konkrete Nummern sichtbar.

Nicht belegt ist:

- kein Serviceauftrag `SERV-4001`;
- kein Serviceartikel-Fit;
- kein Ersatzteilverbrauch;
- keine Ressourcenerfassung;
- keine Service-Preview;
- keine Servicerechnung;
- keine Servicepostenspur;
- kein deutscher Finalnachweis.

## Anfaenger-Lernwert

Ein sichtbarer Menuepunkt beweist nur, dass Business Central die Seite kennt. Er beweist nicht, dass der konkrete Serviceprozess eingerichtet ist. Fuer einen Servicefall muessen gewartetes Objekt, Debitor, Ersatzteil, Technikerressource, Lagerort, Faktura-/Garantieentscheidung und spaetere Postenspur zusammenpassen.

Wenn eines dieser Objekte fehlt, ist der richtige naechste Schritt nicht `Buchen`, sondern Setup- und Stammdaten-Readiness.

## Buchwirkung

Kapitel 15 enthaelt jetzt vor der Schrittfolge eine Statusbox:

- was `SERVICE-001` im Labor beweist;
- welche Zielobjekte fehlen;
- warum die Schrittfolge aktuell Zielpfad statt ausfuehrbarer RM-DEMO-Laborlauf ist;
- dass Service-Setup und Servicebuchung ohne Gate gesperrt bleiben.

## Naechster Schritt

Ohne Gate ist Service nach diesem Sync vorerst abgeschlossen. Der naechste sichere Autopilot-Schritt ist `PROJECTS-001-READINESS` read-only.

Mit ausdruecklichem Gate waere der naechste Service-Schritt ein UI-first Setup-Fit fuer `RM-M100-SN1001`, `SP-PUMP-01`, `RES-TECH` und `VAN-SERV`, bevor ein Serviceauftrag oder eine Buchung geplant wird.
