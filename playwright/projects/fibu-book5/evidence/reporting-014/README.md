# REPORTING-014 Evidence Index

Status: `labor`, `book-governance-sync`, `read-only`, `no-bc-run`, `no-setup`, `no-posting`

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `REPORTING-014-ANALYSIS-VIEW-BOOK-GOVERNANCE-SYNC.md` | Markdown-Evidence | `REPORTING-013` ist verbraucht/rejected und als Setup-Sperre in Buch-/Projektsteuerung synchronisiert | keine Financial-Reports-Zahlenwirkung, kein neuer UI-Klickpfad, kein `RM-PLCH`-Setup | final fuer diesen Sync |
| `REPORTING-014-result.json` | JSON-Ergebnis | maschinenlesbar: kein BC-Lauf, kein Setup, keine Buchung, naechster No-Gate-Schritt ist Governance-/Readiness-Entscheidung | keine sichtbaren BC-Daten, keine neuen Screenshots | final fuer diesen Sync |

## Aktuelle Reporting-Wahrheit

`REPORTING-013` hat die bestehende `REVENUE`-Karte als Feldpositionsbeleg genutzt. Sichtbar waren Feldpositionen fuer `Code`, `Name`, `Dimension 1 Code` und `Dimension 2 Code`. `RM-PLCH` wurde nicht angelegt oder geaendert, weil `New/Neu` in der Business-Central-Shell global mehrdeutig ist und ein ungescopter Klick in den Role-Center-Kontext fallen kann.

Damit ist der Feldmapping-/Setup-Hebel aus `GOVERNANCE-007` verbraucht und als `rejected` geschlossen. Ein weiterer Analysis-View-Setup-Versuch braucht ein neues explizites Gate mit gescoptem New-/Kartenaktionsmuster oder einen alternativen offiziellen Reportingpfad.
