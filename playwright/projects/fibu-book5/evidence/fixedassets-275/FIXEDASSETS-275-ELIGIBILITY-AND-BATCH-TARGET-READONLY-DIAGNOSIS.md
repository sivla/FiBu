# FIXEDASSETS-275 AfA-Eligibility- und Batch-/Output-Target-Diagnose

Status: `labor`, `read-only`, `diagnosis`, `no-ok`, `no-preview`, `no-posting`, `not-final`.

## Ergebnis

- Instanz: `MCP_1_20260210`
- Company: `RM-DEMO`
- Anlage: `FA-CNC-01`
- AfA-Buch: `HGB`
- Klassifikation: `post-acquisition-journal-line-still-not-visible-after-readonly-diagnosis`

## Gelesene Kontexte

- Anlagenkarte `FA-CNC-01`.
- Anlagenposten zu `FA-CNC-01`.
- HGB Depreciation Book Card.
- Fixed Asset G/L Journals.

## Hypothesen

- Target depreciation date 31.01.2027 is after acquisition posting date 01.01.2027; the old pre-acquisition-date explanation is not sufficient for FADEP-273-OK.
- Current Fixed Asset G/L Journal context does not show FADEP-273-OK or comparison document FADEP-267-OK; batch/filter/output-target context remains plausible.
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

FIXEDASSETS-276: locally review FA-275 read-only evidence and decide whether the next step is output-target diagnosis, a setup-fit plan, or a guarded Preview-only gate if a real journal line is found.
