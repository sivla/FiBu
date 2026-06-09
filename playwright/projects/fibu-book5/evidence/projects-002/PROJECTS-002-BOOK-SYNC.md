# PROJECTS-002 Buch-Sync Kapitel 16

Status: `labor`, `book-sync`, `readiness-sync`, `gate-locked`, `no-bc-run`, `no-setup-change`, `no-posting`, `not-final`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Grundlage | `PROJECTS-001` Readiness |
| Geaenderte Buchstelle | Kapitel 16 `Projects: Installation und Meilensteinrechnung` |
| Setup-Aenderung | nein |
| Buchung | nein |

## Synchronisierte Wahrheit

`PROJECTS-001` beweist, dass die Project-/Job-Einstiege in `RM-DEMO` sichtbar sind:

- `Projects`
- `Project Planning Lines`
- `Project Journals`
- `Project Ledger Entries`
- `Project Statistics`
- `Project WIP`

Der Lauf beweist ausserdem: `D10000` ist als Kunde sichtbar. Die konkreten Zielobjekte `PROJ-5001`, `RES-TECH`, `SP-SENSOR-02` und `PROJ-LAG` sind nicht sichtbar. Daraus folgt: Kapitel 16 darf den Zielprozess beschreiben, aber der aktuelle Laborstand ist nur Readiness.

## Anfaenger-Lernwert

Ein sichtbarer Menuepunkt ist noch kein fertiger Prozess. Bei Projekten muessen mehrere Ebenen zusammenpassen:

- Projektkarte und Projektaufgaben strukturieren den Vorgang.
- Debitor bestimmt die Faktura-Seite.
- Ressource und Material bilden die geplante Leistung.
- Lagerort und Artikel entscheiden ueber Materialverbrauch.
- Projektjournal, WIP-/Statistikansichten und Rechnung erzeugen erst spaeter die Postenspur.

Wenn eines dieser Zielobjekte fehlt, reagiert Business Central nicht falsch. Es fehlt Einrichtung oder Stammdatenbasis.

## Buchwirkung

Kapitel 16 enthaelt jetzt vor der Schrittfolge eine Statusbox und einen Einsteigerhinweis:

- `PROJECTS-001` ist als read-only Laborbefund markiert.
- Die Schrittfolge `PROJ-5001` bleibt Zielpfad nach Setup-Fit.
- Keine aktuelle Formulierung verkauft sichtbare Seiten als Projektfaehigkeit.
- Deutscher Finalnachweis, WIP, Projektposten und Meilensteinrechnung bleiben offen.

## Grenzen

Keine neue Business-Central-Ausfuehrung in diesem Lauf. Keine Projektanlage, keine Projektaufgaben, keine Planzeilen, kein Projektjournal, keine WIP-Berechnung, keine Rechnung und keine Buchung.

## Naechster sinnvoller Schritt

Ohne Gate ist der naechste sichere Prozessblock ein read-only Buch-/Evidence- oder Readiness-Lauf fuer Kapitel 17 als Dropshipping/Sonderverkauf ohne Shopify-Connector-Scope. Mit Gate kann spaeter ein UI-first Projekt-Setup-Fit fuer `PROJ-5001`, Aufgaben, `RES-TECH`, `SP-SENSOR-02` und `PROJ-LAG` vorbereitet werden.
