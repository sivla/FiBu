# FIXEDASSETS-269 AfA-Eligibility- und Journal-Setup-Diagnose

Status: `labor`, `read-only`, `diagnosis`, `no-ok`, `no-preview`, `no-posting`, `not-final`.

## Ergebnis

- Instanz: `MCP_1_20260210`
- Company: `RM-DEMO`
- Anlage: `FA-CNC-01`
- AfA-Buch: `HGB`
- Klassifikation: `probable-target-date-before-acquisition`

## Gelesene Kontexte

- Anlagenkarte `FA-CNC-01`.
- Anlagenposten zu `FA-CNC-01`.
- HGB Depreciation Book Card.
- Fixed Asset G/L Journals.

## Hypothesen

- Target depreciation date 30.06.2026 is before the acquisition posting date 01.01.2027; Business Central plausibly generated no depreciation line because the asset was not acquired yet at the target date.
- Current Fixed Asset G/L Journal context still does not show either FADEP-267-OK or FADEP-20260627-2158; batch/filter context remains plausible.
- Acquisition and HGB context exist; the blocker is likely eligibility/range/journal-target visibility rather than missing acquisition basis.

## Grenzen

- Kein `OK` auf `Calculate Depreciation`.
- Kein Preview Posting.
- Keine Buchung.
- Kein Setup Change.
- Kein deutscher Finalnachweis.

## Buchwirkung

Die Anleitung sollte nach `Calculate Depreciation` nicht sofort zur Buchung springen. Wenn keine Zeile sichtbar ist, sind AfA-Faelligkeit, Datumslogik, Journalbatch und Filter erst als eigener Diagnoseblock zu pruefen.

## Naechster Schritt

FIXEDASSETS-270: locally review FA-269 read-only evidence and decide the next smallest safe AfA step; do not repeat OK, Preview Posting or Post yet.
