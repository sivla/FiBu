# BC Action Atlas

Status: `labor-reference`.

| Action | Bereich | Status | Belegte Nutzung | Evidence | Guard |
|---|---|---|---|---|---|
| `Verwandte Aktionen fuer Neu` / `Weitere Optionen` auf Companies | Universaarl Company | `blocked` | TARGET-004 oeffnet scoped Command-Bar-Menues ohne Suche und ohne Datenaenderung; keine exakte sichere `Create New Company`-Aktion wird sichtbar | `evidence/target-004-company-creation-scoped-action-discovery/TARGET-004-result.json` | keine Auswahl von `Kopieren`, `Testunternehmen`, Demo/CRONUS, kein Wizard-Finish; naechster Case braucht source-backed Alternative Route |
| `Create New Company` / Assisted Setup | Universaarl Company | `blocked` | TARGET-003 sucht die exakte Aktion auf Page `357`, findet sie aber nicht sichtbar/klickbar; keine Company erstellt | `evidence/target-003/TARGET-003-result.json` | direkte Mandanten-Listenzeile, `Kopieren`, `Testunternehmen`, CRONUS und Wizard-Finish bleiben gesperrt; naechster Case braucht scoped Action/Menu Discovery |
| `Neu` auf Companies / Mandanten | Universaarl Company | `rejected-as-book-path` | TARGET-002 oeffnet nur eine unsaved blank row; TARGET-003 verwirft direkte Listenzeile als Universaarl-Buchpfad | `evidence/target-002/`, `evidence/target-003/` | nicht speichern; nur UI-Befund, bis offizieller Create-New-Company-/Assisted-Setup-Pfad sichtbar ist |
| `New` auf Purchase Orders | P2P | `labor-proven` | oeffnet Draft `106002` | `evidence/p2p-004/` | nur nach Listen-/Page-Kontext, nicht ungescoped global |
| `Preview Posting` | P2P | `labor-proven` fuer UAT-P2P-001 | Vorschauarten vor Rechnung `108219` | `evidence/p2p-001/095-preview-posting-result.json` | default-locked, P2P-005 noch ohne Preview |
| `New` auf Purchase Orders | P2P | `labor-proven` fuer P2P-005 Fallback | erzeugt kontrollierten Draft, wenn vorhandener Draft nicht als Basis taugt | `evidence/p2p-005/P2P-005-result.json` | nur case-gesteuert; Draft `106051` bleibt Labor-Blocker-Draft |
| `Breite Layoutansicht anzeigen` | P2P/Playwright | `labor-reusable` | vergrössert die Purchase Order Page/Karte vor Grid-Diagnose | `evidence/p2p-006/P2P-006-result.json`, `img/p2p-006-010-draft-open-wide.png` | sicher als read-only Layoutaktion; beweist keine Werte |
| `Fokusmodus umschalten` auf Lines | P2P/Playwright | `labor-reusable` | vergrössert Purchase Order Lines und macht Spalten wie `Qty. to Receive` sichtbar | `evidence/p2p-006/020-grid-control-snapshot.json`, `img/p2p-006-020-lines-focus-mode.png` | sicher als read-only Layoutaktion; wenn keine Datenzeile sichtbar ist, bleibt Werteingabe blockiert |
| `Select items...` auf Purchase Order Lines | P2P | `labor-proven` | oeffnet Item-Auswahl und erzeugt/revealt `RAW-STEEL` als echte Zeile in Purchase Order `106051` | `evidence/p2p-007/P2P-007-result.json`, `img/p2p-007-020-after-select-items-route.png` | erzeugt Zeile, aber setzt nicht automatisch `FRA-ZL`, Menge `4` oder `Qty. to Receive 2` |
| Grid-Zelle per Koordinate/F2/Tab bearbeiten | P2P/Playwright | `labor-blocked` | P2P-008 findet Frame-1-Gridgeometrie und Zellkoordinaten, bestaetigt aber Zielwerte nicht sichtbar | `evidence/p2p-008/P2P-008-result.json` | kein Buchungs-/Preview-Schritt, naechster Helper braucht stabilen Bearbeiten-/Cell-Edit-Modus |
| Purchase-Lines Cell-Edit-Routen `Single Click/Enter`, `Double Click`, `F2` | P2P/Playwright | `labor-blocked` | P2P-009 fokussiert sichtbare Display-Textboxes, aber `FRA-ZL`, Menge `4` und `Qty. to Receive 2` werden nicht sichtbar persistiert | `evidence/p2p-009/P2P-009-result.json`, `evidence/p2p-009/020-after-grid-geometry.json` | `Direct Unit Cost 2.500,00` sichtbar; Preview/Receive bleibt gesperrt |
| `Select items...` ohne Suche, wenn Artikel schon sichtbar | P2P | `labor-blocked` | P2P-010 waehlte `RAW-STEEL` direkt aus sichtbarem Select-items-Kontext; die Suche wurde nicht mehr geoeffnet | `evidence/p2p-010/P2P-010-result.json` | erzeugt/zeigt Artikelkontext, aber setzt nicht `FRA-ZL`, Menge `4`, `Qty. to Receive 2` oder Unit Cost `2500` |
| `More options` / `Line` Action Discovery | P2P/Playwright | `labor-blocked`, `helper-evidence-captured` | P2P-011 inventarisiert sichere Menues im Purchase-Order-Lines-Kontext auf Draft `106054` | `evidence/p2p-011/P2P-011-result.json`, `evidence/p2p-011/021-menu-attempts.json` | keine direkte sichere `Edit`/`Edit List`-Route fuer Zeilenwerte gefunden; Item Tracking ist kein Werteingabe-Beweis |
| Direct Page Route Comparison | P2P/Inventory | `labor-route-comparison` | P2P-012 oeffnet Purchase Journal, Item Journal, Purchase Invoices und Requisition Worksheet direkt per Page-ID statt Tell-Me/Suche | `evidence/p2p-012/P2P-012-result.json` | keine Werteingabe; Route-Auswahl ist Readiness, kein Posting- oder Ledger-Beweis |
| `Receive and Invoice` | P2P | `labor-proven` | genau eine Laborbuchung `108219` | `evidence/p2p-001/100-purchase-posting-result.json` | nicht wiederholen ohne neuen Case |
| `Post` im Payment Journal | P2P Payment | `labor-proven` | Zahlung `PAYP2P-108219` | `evidence/p2p-002/` | default-locked |
| `Apply Entries` | P2P Payment | `labor-proven` | Bezug Zahlung/Rechnung | `evidence/p2p-002/`, `p2p-003/` | read-only pruefen vor Post |
| `Post` im FA G/L Journal | Fixed Assets | `labor-proven` | Zugang `G05001` | `evidence/fixedassets-225/` | genau dokumentierte Laborbuchung, nicht wiederholen |
| `Calculate Depreciation` | Fixed Assets | `labor-blocked` | OK ausgefuehrt, keine sichtbare Journalzeile im geprueften Kontext | `evidence/fixedassets-291/` | kein weiterer OK ohne neuen Gate-Plan |
| Page Inspection `Ctrl+Alt+F1` | Debugging | `labor-reusable` | technische Page/Table-Diagnose | `fixedassets-051` und Patterns | Werte muessen separat sichtbar sein |
| Personalize | Debugging | `labor-reusable` | Feldverfuegbarkeit diagnostizieren | `fixedassets-049` | kein stilles Buchscreen-/Setup-Ersatzbild |

## Universaarl Action-Regel

Alte RM-DEMO-/CRONUS-Tests liefern weiterhin wertvolle Action-Muster, aber keine aktive Zielwahrheit. Fuer Universaarl gilt: Jede neue Action-Evidence benennt Page-/Card-/Line-Kontext, Capability-ID und Nachbedingung. `Neu`, `Kopieren`, `Testunternehmen`, `Post`, `Preview`, `Finish`, `OK`, `Delete` und aehnliche wirksame Aktionen duerfen nicht aus alten Tests uebernommen werden, sondern brauchen im `playthru`-/Universaarl-Kontext einen neuen Gate-Nachweis.

## Zero-Open-Questions-Regel

Jede nicht verstandene Action erzeugt entweder einen Eintrag in `.agent/state/open_questions_register.json` oder bekommt einen finalen Status aus `BC-ZERO-OPEN-QUESTIONS-POLICY.md`.

## UI-Look-and-Feel-Regel

Actions werden nach Kontext erfasst: Page, Karte, Zeile, FactBox, Dropdown oder Command-Bar-Overflow. Vor riskanten Actions gilt Smart Decision Gate; ungefaehrliche Navigationsactions brauchen trotzdem sichtbaren Kontext.
