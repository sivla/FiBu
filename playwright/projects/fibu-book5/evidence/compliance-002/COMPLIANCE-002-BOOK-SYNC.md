# COMPLIANCE-002 - Kapitel 22 mit Readiness-Evidence synchronisieren

Stand: 09.06.2026

## Einordnung

`COMPLIANCE-002` ist ein Buch-Sync-Lauf ohne neue Business-Central-Ausfuehrung.

Die praktische Grundlage ist `COMPLIANCE-001`. Dort wurden in `RM-DEMO` read-only die Einstiegspunkte fuer Kapitel 22 geprueft:

- `E-Rechnungen`
- `VAT Entries`
- `VAT Posting Setup`
- `Document Sending Profiles`
- `Change Log Entries`
- `Change Log Setup`
- Role-Center-Kontext `Warten auf Ka E-Rechnungen 0`

## Was jetzt im Buch geaendert wurde

Kapitel 22 enthaelt jetzt einen eigenen Evidence-Stand fuer `RM-DEMO`. Der Abschnitt trennt:

- deutsches Zielbild im Buch
- aktuelles CRONUS-USA-Labor
- nachgewiesene Navigationseinstiege
- nicht nachgewiesene Compliance-Endzustaende
- Gate-Pflicht fuer Setup und finale Nachweise

Zusaetzlich wurde vor der Feldlogik ein Laborhinweis ergaenzt: Die Schrittfolge ist in `RM-DEMO` noch kein abgeschlossener Compliance-Nachweis. Erst ein freigegebener Setup-/Ziellauf darf USt-/VAT-Setup, E-Documents, Versandprofile oder Change Log praktisch aendern.

## Fachliche Wahrheit

Der aktuelle Laborstand beweist nur, dass ein Anfaenger die relevanten BC-Einstiege finden kann.

Er beweist nicht:

- deutsche `19 %` USt
- Peppol-/Providerstatus
- E-Rechnungsvalidierung
- E-Rechnungsversand
- Archivnachweis
- aktive Change-Log-Tabellen
- GoBD- oder DE-Finalkonformitaet

## Anfaenger-Lernwert

Business Central zeigt Compliance-Funktionen als mehrere getrennte Einstiegspunkte. Ein sichtbarer Button oder Tell-Me-Treffer ist nur Orientierung. Ein Nachweis entsteht erst, wenn Beleg, Steuerposten, E-Dokumentstatus, Versand-/Validierungsspur und Audit-/Archivspur zusammenpassen.

## Gate

Praktische Einrichtung bleibt gesperrt:

- `COMPLIANCE-002-EINVOICE-SETUP`
- `TAX-002-DE-VAT-FIT`

Ohne ausdrueckliche Freigabe darf daraus kein Setup-, Versand-, Validierungs- oder Buchungslauf werden.

## Naechster sinnvoller Schritt ohne Freigabe

`SECURITY-001`, `SECURITY-002`, `MIGRATION-001` und `INTEGRATIONS-001` sind inzwischen erledigt. Naechster Schritt ohne Gate: `OPERATIONS-001-READINESS`, Kapitel 30 als read-only/Buch-Zielbild-Sync vorbereiten. Keine Job Queue anlegen oder starten, kein Monitoring-Connector einrichten, keine Telemetrie-/Admin-Aenderung und keine Produktivumgebung anfassen.
