# COMPLIANCE-001 Evidence Index

Status: `labor`, `read-only`, `compliance-readiness`, `no-posting`, `no-setup-change`, `not-final`, `de-final-open`.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `COMPLIANCE-001-result.json` | JSON-Ergebnis | Umgebung `MCP_1_20260210`, Company `RM-DEMO`, gelaufene Tell-Me-Suchen, Screenshotdateien und Safety Flags | deutsches VAT19-Setup, Peppol-/Provider-Versand, E-Rechnungsvalidierung, GoBD-Finalnachweis | labor |
| `COMPLIANCE-001-READINESS.md` | Lernzusammenfassung | Compliance wird in BC in getrennte Prueffelder zerlegt: Steuerposten, Steuer-Setup, E-Rechnung/E-Documents, Versandprofile und Change Log | finale deutsche Compliance-Freigabe | labor |
| `010-e-invoices-page-text.txt` / `010-e-invoices-buttons.json` | kompakter UI-Kontext | `E-Rechnungen` ist als Such-/Role-Center-Kontext sichtbar; `Warten auf Ka E-Rechnungen 0` ist ein sichtbarer Hinweis | E-Rechnungsprozess, Format, Versandstatus, Archivierung | candidate |
| `020-vat-entries-page-text.txt` / `020-vat-entries-buttons.json` | kompakter UI-Kontext | `VAT Entries` ist als Suchkontext sichtbar und bleibt der spaetere Nachweispfad fuer Steuerposten | deutsche `19 %` USt oder UStVA | candidate |
| `030-vat-posting-setup-page-text.txt` / `030-vat-posting-setup-buttons.json` | kompakter UI-Kontext | `VAT Posting Setup` ist als Suchkontext sichtbar und bleibt die gesperrte Setup-Schicht | dass die aktuelle CRONUS-USA-Company deutsches VAT19 fertig eingerichtet hat | candidate |
| `040-document-sending-profiles-page-text.txt` / `040-document-sending-profiles-buttons.json` | kompakter UI-Kontext | `Document Sending Profiles` ist als Suchkontext sichtbar | E-Rechnungsvalidierung oder Peppol-Providerstatus | candidate |
| `050-change-log-entries-page-text.txt` / `050-change-log-entries-buttons.json` | kompakter UI-Kontext | `Change Log Entries` ist als Suchkontext sichtbar | dass kritische Tabellen bereits richtig protokolliert werden | candidate |
| `060-change-log-setup-page-text.txt` / `060-change-log-setup-buttons.json` | kompakter UI-Kontext | `Change Log Setup` ist als Suchkontext sichtbar und bleibt eine Setup-Aenderung | Aktivierung oder GoBD-Finalkonzept | candidate |
| `compliance-001-*.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Grenzen der sechs Screenshots | finale Buchfreigabe ohne visuelle QA | candidate |

## Aktuelle Wahrheit

`COMPLIANCE-001` hat keine Seiten eingerichtet, keine E-Rechnung gesendet, keine Steuerlogik geaendert und nichts gebucht. Der Lauf beweist nur, dass Kapitel 22 als Readiness-/Orientierungspfad in `RM-DEMO` vorbereitet werden kann. Sichtbare Role-Center-Elemente wie `Warten auf Ka E-Rechnungen 0` sind Lernhinweise, aber kein E-Rechnungs-Ende-zu-Ende-Nachweis.

## Naechster Schritt

`COMPLIANCE-002` ist erledigt. Kapitel 22 trennt diese Evidence jetzt vom deutschen Zielbild. VAT-, E-Documents-, Versandprofil- und Change-Log-Setup bleiben ohne ausdrueckliches Gate gesperrt. `SECURITY-001` ist inzwischen read-only erledigt; ohne Gate ist der naechste sichere Schritt `SECURITY-002-BOOK-SYNC` als Buch-/Anfaenger-Sync fuer Admin-/Security-Kontexte.
