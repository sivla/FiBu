# FIXEDASSETS-235 - AfA Preview-only Plan

Status: `local-plan`, `no-bc-run`, `no-playwright-run`, `no-journal-line`, `no-preview`, `no-posting`

## Ausgangspunkt

Die bisherige Evidence reicht fuer eine fachliche Voraussetzung, aber noch nicht fuer eine sichere AfA-Preview-Ausfuehrung:

- `FIXEDASSETS-226`/`227`: Die Anschaffung fuer `FA-CNC-01` ist als CRONUS-USA-Laborbuchung belegt.
- `FIXEDASSETS-229`: Die Anlagenkarte und die Anschaffungsspur wurden read-only geprueft.
- `FIXEDASSETS-231`: HGB `G/L Integration - Acq. Cost` war sichtbar an; `G/L Integration - Depreciation` war damals aus.
- `FIXEDASSETS-233`/`234`: HGB `G/L Integration - Depreciation` wurde UI-first gefittet und lokal akzeptiert.

## Entscheidung

Ein direkter AfA-Preview-only-Lauf waere noch zu frueh.

Grund: Es ist noch nicht evidence-basiert geklaert, welche UI-Route fuer die AfA verwendet werden soll:

- vorhandenes `Fixed Asset G/L Journal` manuell mit `FA Posting Type = Depreciation`,
- Aktion `Calculate Depreciation` / Abschreibung berechnen,
- ein anderer BC-Standardpfad fuer AfA-Vorschlagszeilen.

Ohne diese Routen-Evidence waere eine Journalzeile oder Berechnungsaktion zu schnell. Der naechste praktische Lauf muss daher nur die Route sichtbar machen und Stop-Kriterien pruefen.

## Geplanter naechster Case

`FIXEDASSETS-236-FA-DEPRECIATION-JOURNAL-ROUTE-READONLY`

Ziel:

- Business Central in `MCP_1_20260210` / `RM-DEMO` oeffnen.
- Keine Company wechseln.
- `Fixed Asset G/L Journals` oder den belegten Anlagenjournal-Kontext read-only oeffnen.
- Sichtbar pruefen:
  - Batch/Journal-Kontext,
  - ob `Calculate Depreciation` / AfA berechnen sichtbar ist,
  - ob `Preview Posting` sichtbar, aber nicht geklickt wird,
  - ob vorhandene Zeilen bestehen oder der Batch leer ist,
  - ob gefaehrliche Aktionen wie `Post`/`Post and Print` sichtbar und gesperrt bleiben.

Nicht erlaubt:

- keine Journalzeile einfuegen,
- keine Werte eingeben,
- keine Berechnungsaktion ausfuehren,
- kein Preview Posting,
- kein Post,
- keine Setup-Aenderung.

## Warum das fuer das Buch wichtig ist

Fuer Anfaenger ist AfA kein einzelner Button. Vor der Vorschau muss sichtbar sein, wo Business Central die AfA-Zeile erzeugt oder erwartet. Das Buch soll nicht nur sagen "AfA buchen", sondern zeigen:

- welche Seite benutzt wird,
- welche Aktion eine Vorschlagszeile erzeugen koennte,
- welche Buchungsgrenze sichtbar ist,
- warum vorher Setup und Anschaffungsspur stimmen muessen.

## Laborgrenze

Alles bleibt CRONUS-USA-Labor in `RM-DEMO`. Es gibt keinen deutschen Finalnachweis, keine deutsche Steuer-/Abschlussaussage und keine AfA-Postenspur.

