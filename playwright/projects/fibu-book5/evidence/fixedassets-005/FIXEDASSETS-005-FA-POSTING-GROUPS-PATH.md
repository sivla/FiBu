# FIXEDASSETS-005 FA Posting Groups UI-Pfad

Status: `labor`, `read-only`, `ui-path`, `no-posting`, `no-setup-change`, `not-final`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Zielseite | `FA Posting Groups` / Anlagenbuchungsgruppen |
| Zielwert | `MACHINES` |
| Setup-Aenderung | nein |
| Buchung | nein |

## Ergebnis

| Frage | Befund |
|---|---|
| Tell-Me zeigt FA Posting Groups | ja |
| Treffer wurde per UI geklickt | ja |
| Klickmethode | dom-click |
| Anlagenbuchungsgruppen-Kontext sichtbar | ja |
| MACHINES sichtbar | nein |
| Vorhandene CRONUS-Gruppen sichtbar | GOODWILL, PLANT, PROPERTY, VEHICLES |
| Neu-Aktion sichtbar | ja |
| Bearbeiten-Aktion sichtbar | ja |

## Anfaenger-Lernwert

Anlagenbuchungsgruppen sind die Kontenfindungsschicht der Anlagenbuchhaltung. Eine Anlage kann zwar als Stammdatensatz existieren, aber ohne passende Anlagenbuchungsgruppe weiss Business Central nicht sicher, welche Sachkonten fuer Zugang, Buchwert, Gewinn/Verlust oder Abschreibung genutzt werden sollen.

Dieser Lauf ist deshalb absichtlich nur ein Pfadnachweis. Er klaert, ob der Leser und der Playwright-Agent die richtige Einrichtungsseite ueber die Oberflaeche erreichen koennen, bevor `MACHINES` eingerichtet oder eine Anlage gekauft wird.

## Buchwirkung

Kapitel 21 kann den UI-Pfad zu `FA Posting Groups` als Labor-Kandidat aufnehmen. `MACHINES` bleibt aber offen, solange die Gruppe nicht angelegt und ihre Konten nicht fachlich geprueft sind.

## Grenzen

- CRONUS-USA-Labor, gemischte UI, kein deutscher HGB-/Kontenplan-Endstand.
- Keine Anlagenbuchungsgruppe wurde angelegt oder bearbeitet.
- Keine Einkaufsrechnung, keine Aktivierung, keine AfA und keine Anlagenposten.

## Naechster Schritt

FIXEDASSETS-006: idempotenten UI-Setup-Fit fuer MACHINES vorbereiten; vorher CRONUS-Konten aus vorhandenen Gruppen lesen, kein Konto raten.
