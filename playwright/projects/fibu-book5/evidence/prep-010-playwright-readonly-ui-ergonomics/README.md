# PREP-010 Playwright Read-only UI Ergonomics

Status: `prep-done`, `helper-only`, `no-bc-run`, `no-playwright-run`.

## Zweck

Dieser Lauf macht die beobachteten Universaarl-UI-Fehler wiederverwendbar:

- Hauptbutton `Neu`, Pfeil neben `Neu` und Menueintrag `Neues Unternehmen erstellen` sind unterschiedliche Ziele.
- Tooltip oder Accessible Name muss vor mehrdeutigen Klicks gesichert werden.
- Screenshot-QA muss bestaetigen, was wirklich sichtbar ist.
- Karten, Listen und Zeilenbereiche duerfen erst als blockiert gelten, wenn Layoutwege wie Maximize, Fokusmodus, FastTabs, FactBox und Scrollen geprueft wurden.
- Ein falscher Zielzustand wird als `rejected-path` dokumentiert, nicht als Erfolg.

## Geaendert

- `.agent/BC-UI-LOOK-AND-FEEL-GUIDE.md`
- `playwright/projects/fibu-book5/UNIVERSAARL-PLAYWRIGHT-PATTERN-CONSOLIDATION.md`
- `playwright/projects/fibu-book5/BC-ACTION-ATLAS.md`
- `playwright/projects/fibu-book5/BC-SCREENSHOT-INVENTORY.md`
- `playwright/projects/fibu-book5/READY-FOR-SUPER-PERMISSIONS-CHECKLIST.md`

## Grenzen

- Keine Business-Central-Ausfuehrung.
- Kein Playwright-Lauf.
- Keine Company angelegt.
- Kein Setup, kein Preview, kein Posting.
- Keine Buchmaster-Aenderung.

## Naechster sinnvoller Schritt

`PREP-011-SCREENSHOT-EXPLANATION-QUALITY-GATE`: bestehende Universaarl-Screenshots mit den neuen PREP-010-Regeln nachschaerfen, bevor weitere Buch-/Clickguide-Bilder als Buchkandidaten gelten.
