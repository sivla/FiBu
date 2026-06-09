# TAX-002-DE-VAT-GATE-READINESS

Stand: 2026-06-09

## Ergebnis

`TAX-002` wurde als Gate-Readiness abgeschlossen. Es gab keinen Business-Central-Lauf, keine Setup-Aenderung, keine Buchung, keinen Company-Wechsel und keinen deutschen VAT19-Finalnachweis.

Der praktische Lauf `TAX-002-DE-VAT-FIT` bleibt gesperrt. Er darf erst starten, wenn der Prompt oder `POSTING-AND-SETUP-GATES.md` ihn ausdruecklich fuer genau einen naechsten Lauf freigibt.

## Kontext

| Feld | Wert |
|---|---|
| Sandbox | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Datenbasis | CRONUS USA |
| Sprache | gemischt Deutsch/Englisch |
| Modus | `gate-readiness`, `no-bc-run`, `no-posting` |
| Referenzbelege | O2C `PS-INV103297`, P2P `108219` |
| aktueller Steuerbefund | CRONUS-USA-Labor mit `0 %`, kein deutscher `19 %`-Nachweis |

## Quellenbasis

- `evidence/tax-001/TAX-001-DE-VAT-READINESS.md`
- `evidence/governance-008/GOVERNANCE-008-NEXT-READINESS-DECISION.md`
- `evidence/uat-o2c-001/O2C-LAB-FINAL-SYNC.md`
- `evidence/p2p-001/`
- `evidence/compliance-001/`
- `evidence/compliance-002/`
- `POSTING-AND-SETUP-GATES.md`
- `AUTOPILOT-STATE.json`
- `CURRENT-STATE.md`

## Warum dieser Gate-Plan noetig ist

Die vorhandenen Laborbelege zeigen, dass Bedienpfad, Beleg, Preview, Buchung und Postenspur grundsaetzlich funktionieren. Sie zeigen aber keine deutsche Umsatzsteuer:

- O2C `PS-INV103297` bleibt CRONUS-USA-Labor mit `0 %`.
- P2P `108219` bleibt CRONUS-USA-Labor mit `0 %`.
- `Tax Group Code = FURNITURE` ist ein CRONUS-USA-Laborbefund und kein deutsches VAT-Produktsetup.
- `VAT Entries` sind als Einstieg sichtbar, aber noch kein deutscher VAT19-Postennachweis.

Fuer das Buch ist das ein eigener Lernfall: Steuer entsteht in Business Central nicht durch den Betrag auf dem Beleg, sondern durch die Kombination aus Steuer-/VAT-Gruppen, Posting Setup, Belegzeile, Preview und gebuchten Steuerposten.

## Freigabekriterien fuer spaeteres TAX-002-DE-VAT-FIT

Ein spaeterer praktischer Lauf darf nur starten, wenn alle Punkte im Prompt oder Gate genannt sind:

1. Richtige Umgebung: `MCP_1_20260210`.
2. Richtige Company: `RM-DEMO`.
3. UI-first: kein API-Shortcut fuer Setup oder Stammdaten.
4. Ziel klar: deutscher VAT19-Laborfit, kein deutscher Final-Endstand.
5. Zu pruefende Seiten sind benannt:
   - VAT Business Posting Groups
   - VAT Product Posting Groups
   - VAT Posting Setup
   - Sales/Purchase document line
   - Preview Posting
   - VAT Entries
6. Zielwerte sind vor der Aenderung als Testmodell beschrieben.
7. Keine echte Buchung, solange nur Setup-/Preview-Gate freigegeben ist.
8. Jede spaetere Buchung braucht ein eigenes Posting-Gate und vorher sichtbare Preview.

## Empfohlene Aufteilung

Der praktische VAT19-Nachweis sollte nicht in einem einzigen grossen Lauf erzwungen werden.

| Teilschritt | Zweck | Wirkung |
|---|---|---|
| `TAX-002A-DE-VAT-SETUP-PREFLIGHT` | UI-first Ist-Zustand der VAT-Gruppen und VAT Posting Setup lesen; Zielwerte bestaetigen | read-only oder minimaler Setup-Fit nur mit Gate |
| `TAX-002B-DE-VAT-PREVIEW` | O2C/P2P-Belegentwurf mit Zielgruppen und Preview pruefen | keine Buchung; erwartete VAT19-Wirkung nur als Preview |
| `TAX-002C-DE-VAT-LAB-POSTING` | nur mit ausdruecklichem Posting-Gate buchen und VAT Entries/Postenspur sichern | Laborbuchung; kein deutscher Finalnachweis |

## Stop-Kriterien

Der spaetere praktische Lauf muss abbrechen, wenn einer dieser Punkte eintritt:

- falsche Sandbox oder falsche Company
- UI zeigt nicht `RM-DEMO`
- VAT-Seiten sind nicht sicher ueber UI erreichbar
- Treffer in Tell-Me sind mehrdeutig und kein sicherer Seitenkontext ist erkennbar
- aktuelle Datenmodell-/Gruppenwerte sind unklar
- BC bleibt im US-Sales-Tax-Kontext und liefert keinen belastbaren VAT-Kontext
- `Preview Posting` ist nicht erreichbar oder zeigt keine pruefbare Steuerwirkung
- `VAT Entries` sind nicht sichtbar oder nicht auf den Zielbeleg filterbar
- fuer den Nachweis waere eine neue Company oder ein Environment-Wechsel noetig
- der Lauf muesste buchen, obwohl nur Setup-/Readiness erlaubt ist

## Erwarteter Nachweis nach Freigabe

Ein spaeterer Lauf darf erst dann als deutscher VAT19-Laborfit gelten, wenn Evidence mindestens zeigt:

- UI-Screenshot oder Seitentext der verwendeten VAT Business Posting Group.
- UI-Screenshot oder Seitentext der verwendeten VAT Product Posting Group.
- UI-Screenshot oder Seitentext der passenden VAT Posting Setup-Zeile mit Prozent-/Kontenwirkung.
- Belegzeile mit den Zielgruppen.
- Preview Posting mit sichtbarer Steuer-/VAT-Wirkung.
- Falls eine Buchung separat freigegeben wurde: VAT Entries und Sach-/Nebenbuchposten zum gebuchten Beleg.

## Buchwirkung

Kapitel 9, 11, 12 und 22 duerfen nach `TAX-002` Folgendes sagen:

- Der aktuelle CRONUS-USA-Laborlauf beweist Bedienpfade, Belege, Preview, Postenspur und Dimensionslogik.
- Deutsche `19 %` USt ist weiterhin offen.
- Die spaetere deutsche Steueranleitung braucht eigene Bilder fuer VAT-Gruppen, VAT Posting Setup, Preview und VAT Entries.
- Ein Anfaenger soll lernen: Ohne passendes Steuer-Setup ist ein technisch funktionierender Beleg noch kein deutscher Steuerbeleg.

Kapitel duerfen nicht sagen:

- `PS-INV103297` sei ein deutscher USt-Endstand.
- `108219` beweise deutsche Vorsteuer.
- CRONUS-USA-`FURNITURE` sei die deutsche Maschinen-USt-Gruppe.
- `TAX-002` habe etwas in Business Central eingerichtet.

## Naechster Schritt

Ohne Freigabe: keinen weiteren VAT-Setup-Lauf starten. Der naechste sichere Schritt ist eine neue Governance-Entscheidung oder ein Buch-/Evidence-Sync mit echtem Delta.

Mit Freigabe: `TAX-002A-DE-VAT-SETUP-PREFLIGHT` UI-first starten und nur die im Gate beschriebenen Seiten und Zielwerte pruefen.
