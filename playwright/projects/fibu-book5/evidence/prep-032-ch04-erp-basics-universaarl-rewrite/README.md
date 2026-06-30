# PREP-032 - Chapter 4 Universaarl ERP Basics Rewrite

Status: `prep-done`, `book-rewrite`, `no-bc-run`, `no-playwright-run`

## Purpose

PREP-032 turns the PREP-031 Companies Page screenshot QA into actual beginner-facing Chapter 4 text. It removes the active Rhein-Main/RM-SHARED examples from the Chapter 4 beginner path and replaces them with Universaarl reader language.

## What Changed

- Chapter 4 now explains Environment, Company, Mandantenliste, the `Neu` main button, the arrow beside `Neu`, and `Neues Unternehmen erstellen`.
- The text does not claim that `UNIVERSAARL-DE` exists or was created.
- The PREP-031 screenshot is used only as a visible UI anchor for the split-button/dropdown pattern.

## Boundaries

- No Business Central execution.
- No Playwright execution.
- No company creation.
- No setup change.
- No preview posting.
- No posting.
- No API shortcut.
- No final German process proof.

## Next Step

PREP-033 should run a read-only My Settings context proof for company, role, language and no-save boundary while Company Creation remains parked until SUPER/company-create permissions are confirmed.
