# SOURCES-001 Evidence Index

Status: `book-sync`, `readiness`, `no-bc-run`, `no-posting`, `not-final`

Dieser Ordner dokumentiert den Kapitel-40-Sync zum Quellenverzeichnis. Der Lauf erzeugt keine neue Business-Central-Evidence, sondern ordnet Quellenarten, Primaerquellenlogik, Microsoft-Learn-Bezug, Vendor-Dokumentation, amtliche Quellen und den gestrichenen Shopify-Scope gegen die vorhandene Projektwahrheit ein.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `SOURCES-001-READINESS.md` | Markdown-Evidence | Kapitel 40 ist als Quellen- und Evidence-Regel eingeordnet | keinen Live-URL-Audit, keinen BC-Klickpfad, keine Buchung, keinen deutschen Finalnachweis | `book-sync` |
| `SOURCES-001-result.json` | JSON-Ergebnis | Umgebung, Company, Scope, Quellenklassen, Grenzen und naechsten Schritt des Syncs | keine UI-Sichtbarkeit, keine Screenshot-Qualitaet, keine Prozessausfuehrung | `readiness` |
| `FiBu_Buch_BC_Standardprozesse_DE_Master_Blueprint.md` | Buch-Sync | Kapitel 40 trennt Quelle, Labor-Evidence und deutschen Finalnachweis | keine inhaltliche Neubewertung jeder einzelnen externen Quelle | `book-synced` |

## Einordnung

Quellen stützen Zielbild, Fachregel und Recherchepfad. Sie ersetzen keine RM-DEMO-Evidence. Fuer das Buch gilt deshalb: Eine Quelle kann erklaeren, warum Business Central ein Feature, eine Einrichtung oder einen Standardpfad anbietet; der Projektbeweis entsteht erst durch konkrete Evidence wie Screenshot, Seitentext, JSON-Ergebnis, Beleg, Posten, Bericht oder Fehlerfall.

## Naechster Schritt

Ohne Gate ist der naechste sichere Schritt `GOVERNANCE-005-AUTONOMOUS-POSTING-POLICY-SYNC`: Den erweiterten Autopilot-V2.2-Hinweis auf autonome Buchungen gegen die aktuellen Repo-Gates synchronisieren. Bis dahin bleiben praktische Buchungen, Zahlungen, Setup-Aenderungen und neue Companies gesperrt, sofern kein Gate ausdruecklich freigegeben ist.
