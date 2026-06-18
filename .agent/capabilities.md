# Reproduzierbare Capabilities

Skills sind Arbeitsanweisungen. Capabilities sind reproduzierbare Faehigkeiten.

Dieses Projekt soll Business Central nicht nur irgendwie bedienen, sondern Playwright-Faehigkeiten aufbauen, die wiederholbar, pruefbar und fuer Buchscreenshots nutzbar sind.

## Rollen

| Ebene | Bedeutung |
|---|---|
| Skill | Menschlich lesbare Anleitung fuer einen Lauf |
| Capability | Reproduzierbare Faehigkeit mit Inputs, Outputs, Gates und Reifegrad |
| Playwright Touchpoint | Konkreter technischer Hebel in Tests, Helpern oder Evidence |
| Maturity | Stand der Wiederverwendbarkeit |

## Reifegrade

| Reifegrad | Bedeutung |
|---|---|
| `draft` | Idee oder erstes Muster, noch nicht stabil |
| `lab-reusable` | In der Sandbox nutzbar, aber noch Labor |
| `book-ready` | Fuer Buchscreenshots oder Buchtext als Kandidat geeignet |
| `final-proof-ready` | Fuer finalen deutschen Nachweis geeignet |

## Aktuelle Kernfaehigkeiten

- `bc_navigation_control`: gezielte BC-Navigation, keine blinden Tell-Me-Treffer.
- `posting_safety_gate`: Default locked fuer Preview, Post, Zahlung, Anlage, Setup.
- `screenshot_truth_gate`: Bild muss den behaupteten Beweis sichtbar zeigen.
- `evidence_pack_writer`: kompakte Evidence statt Rohdump.
- `bc_error_recovery_pattern`: Fehler werden Lern- und Fixmuster.
- `book_beginner_learning_check`: Buchtext aus Sicht eines Anfaengers pruefen.
- `next_case_selection`: genau einen naechsten sinnvollen Lauf waehlen.
- `state_compression`: Laufende in kompakten State ueberfuehren.
- `bc_scoped_action_click`: BC-Aktionen nur mit Scope und Erwartungsnachweis klicken.
- `bc_card_field_diagnostics`: Kartenfelder caption-nah diagnostizieren.
- `bc_dialog_gate`: Dialoge nur mit Textnachweis und Erwartung bestaetigen.
- `purchase_invoice_context_guard`: Einkaufsrechnungskontext vor Zielwerten hart pruefen.
- `bc_scoped_new_action`: `New/Neu` nur im richtigen Page-Scope ausloesen.
- `journal_line_control_snapshot`: Journal-Zeilencontrols vor dem Fuellen indexieren.

## Effizienzregel

Jede neue Capability muss beantworten:

- Was kann sie reproduzierbar?
- Welche Inputs braucht sie?
- Welche Outputs liefert sie?
- Welche Safety Gates verhindern falsche BC-Aktionen?
- Welche Playwright-Helfer oder Tests nutzen sie?
- Welcher Reifegrad gilt aktuell?

Nur so wird aus Erfahrung ein wiederverwendbares System.
