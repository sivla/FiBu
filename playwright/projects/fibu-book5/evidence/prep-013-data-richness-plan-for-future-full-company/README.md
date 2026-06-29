# PREP-013 - Data Richness Plan for Future Full Company

Status: `prep-done`, `no-bc-run`, `no-playwright-run`, `needs-universaarl-evidence`

## Zweck

PREP-013 konkretisiert die spaetere Universaarl-Datenwelt. Das Ziel ist, nach der Rechtefreigabe keine leere oder zufaellige Company aufzubauen, sondern eine kleine, erklaerbare und filterfaehige Musterfirma.

## Kontext

- Instanz: `playthru`
- Zielcompany: `UNIVERSAARL-DE`
- Company-Status: noch nicht angelegt
- Permission-Status: Company Creation bleibt bis SUPER/company-create-Rechten geparkt

## Ergebnis

- `UNIVERSAARL-DATASET-BLUEPRINT.md` enthaelt jetzt Datenpakete, Namensschema, Mindestsets fuer Debitoren/Kreditoren/Artikel, Dimensionseinsatz, Zeitplan und Screenshot-/Filterfaelle.
- `UNIVERSAARL-DATA-RICHNESS-PLAN.md` enthaelt Mindestmengen und eine Reihenfolge nach Company Creation.
- `BC-FULL-PLAYTHROUGH-CATALOG.md` markiert PREP-013 als erledigt und setzt PREP-014 als naechsten sinnvollen PREP-Schritt.
- `open_questions_register.json` aktualisiert OQ-0001 auf den aktuellen geparkten TARGET-009-Pfad.

## Grenzen

PREP-013 erzeugt keine Daten in Business Central. Alle Namen, Codes und Mengen sind Planwerte. Sie werden erst zu Projektwahrheit, wenn `UNIVERSAARL-DE` existiert und die jeweiligen Stammdaten-/Setup-/Posting-Cases sie belegen.

## Naechster sinnvoller Schritt

`PREP-014-ZERO-OPEN-QUESTIONS-REGISTER-CLEANUP`

Nach dem Datenplan sollten offene Fragen neu klassifiziert werden, damit keine veralteten Follow-ups, falschen Zielcases oder unklare Datenabhaengigkeiten in State und Atlas bleiben.
