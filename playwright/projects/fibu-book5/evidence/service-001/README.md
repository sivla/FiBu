# SERVICE-001 Evidence-Index

Ziel: Service-Readiness fuer Kapitel 15 read-only pruefen, ohne Serviceauftrag, ohne Ersatzteilverbrauch, ohne Ressourcenerfassung, ohne Rechnung und ohne Buchung.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `SERVICE-001-result.json` | JSON-Ergebnis | Sandbox, Company, Gate, Tell-Me-Einstiege, Zielobjektbefunde, Sicherheitsgrenzen | keinen Serviceprozess und keine Buchung | labor, read-only |
| `SERVICE-001-READINESS.md` | Lernzusammenfassung | Warum Service zuerst Serviceartikel, Ersatzteil, Ressource und Lagerort braucht | keinen Serviceauftrag und keine Faktura | labor, gate-locked |
| `010-*` bis `060-*` | Tell-Me-Evidence | sichtbare oder verworfene Einstiegspfade fuer Service Orders, Service Items, Resources, Setup, Contracts und Service Ledger Entries | keinen geoeffneten Prozess und keine Buchung | navigation-evidence |
| `070-*` bis `110-*` | kompakter Objekt-Seitentext und Buttons | vorhandene oder fehlende Zielobjekte im Labor | keine Anlage und keinen Service-Endstand | object-readiness |
| `*.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen je Bild | keine eigenstaendige fachliche Wahrheit | mixed |

## Kernaussage

SERVICE-002 als Buch-/Evidence-Sync fuer Kapitel 15: Readiness-Befunde einarbeiten und danach nur mit ausdruecklichem Gate Serviceartikel, Ersatzteil, Ressource, Technikerlager und Serviceauftrag UI-first vorbereiten.
