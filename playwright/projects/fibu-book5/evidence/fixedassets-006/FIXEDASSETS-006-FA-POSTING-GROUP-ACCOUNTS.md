# FIXEDASSETS-006 FA Posting Groups Konten read-only

Status: `labor`, `read-only`, `setup-preparation`, `gate-locked`, `no-posting`, `no-setup-change`, `not-final`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Gepruefte Seite | `FA Posting Groups` |
| Gate | `FIXEDASSETS-004-SETUP-OR-POSTING` locked |
| Setup-Aenderung | nein |
| Buchung | nein |

## Sichtbare CRONUS-Gruppen und Konten

| Gruppe | sichtbar gelesene Konten |
|---|---|
| EQUIPMENT | 12210, 82000 |
| GOODWILL | 11300 |
| PLANT | 12110, 81000 |
| PROPERTY | 12130, 81000 |
| VEHICLES | 12230, 82000 |

## Fachliche Einordnung

Business Central nutzt Anlagenbuchungsgruppen als Kontenfindung fuer Anlagenzugang, Buchwert, Abschreibung, Gewinne/Verluste bei Abgang und Wartungsaufwand. Der spaetere Buchwert einer Anlage haengt deshalb nicht nur an der Anlagenkarte, sondern auch an diesen Kontenfeldern.

Dieser Lauf liest vorhandene CRONUS-Gruppen, damit ein spaeterer `MACHINES`-Fit nicht geraten wird. `MACHINES` wird hier bewusst nicht angelegt, weil das Gate fuer Fixed-Assets-Setup und -Buchung gesperrt ist.

## Buchwirkung

Kapitel 21 kann ergaenzen: Vor der Anlage `FA-CNC-01` muss die Anlagenbuchungsgruppe fachlich verstanden werden. Ein Screenshot der Tabelle erklaert, dass BC mehrere Sachkonten aus einer Gruppe ableitet und warum das Setzen eines einzelnen beliebigen Kontos nicht reicht.

## Grenzen

- CRONUS-USA-Labor, kein deutscher HGB-/Kontenplan-Endstand.
- Sichtbare Konten sind nur Laborreferenz fuer die naechste Entscheidung.
- `MACHINES`, `FA-CNC-01`, `HGB` und `K30000` bleiben nicht angelegt.
- Keine Einkaufsrechnung, keine Aktivierung, keine AfA und keine Anlagenposten.

## Naechster Schritt

Without gate: Buch-/Evidence-Sync fuer Kapitel 21 oder Fixed-Assets-Readiness fortsetzen. With gate: idempotenten UI-Setup-Fit fuer MACHINES planen, aber die Zielkonten fachlich aus CRONUS-Gruppen ableiten und als Labor, nicht DE-Final, markieren.
