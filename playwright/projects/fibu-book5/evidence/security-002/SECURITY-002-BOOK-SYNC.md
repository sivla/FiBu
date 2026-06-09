# SECURITY-002 Book Sync

Status: `book-sync`, `labor`, `read-only-evidence-based`, `no-posting`, `no-setup-change`, `not-final`, `de-final-open`, `gate-locked`.

## Grundlage

`SECURITY-001` hat Kapitel-27-/Admin-Kontexte in `MCP_1_20260210`, Company `RM-DEMO`, Datenbasis CRONUS USA, read-only geprueft.

Nachgewiesen:

- `Permission Sets` sichtbar/kontextuell sichtbar
- `Profiles Roles` sichtbar/kontextuell sichtbar
- `Security Groups` sichtbar/kontextuell sichtbar
- `User Setup` sichtbar/kontextuell sichtbar
- `Job Queue Entries` sichtbar/kontextuell sichtbar
- `Change Log Entries` sichtbar/kontextuell sichtbar
- `Users` in diesem Tell-Me-Lauf nicht stabil sichtbar

Nicht nachgewiesen:

- Benutzeranlage
- Permission-Set-Zuweisung
- Profil-/Rollen-Aenderung
- Security-Group-Zuweisung
- User-Setup-Aenderung
- Job-Queue-Aenderung oder Jobstart
- Change-Log-Aktivierung
- SoD-Finalnachweis
- deutscher Security-/Audit-Finalnachweis

## Buchaenderung

Kapitel 27 hat jetzt eine Statusbox `Status des Labor-Nachweises in RM-DEMO`. Sie trennt:

- Buchziel
- RM-DEMO-Labor
- DE-Finalnachweis
- Buchung/Setup
- Evidence Pack
- offene Grenzen
- Nichtbehauptungen

Zusaetzlich erklaert das Kapitel fuer Anfaenger:

- Profil/Rolle steuert Oberflaeche und Rollencenter.
- Permission Sets steuern Rechte.
- Security Groups buendeln Zugriff organisatorisch.
- User Setup kann fachliche Grenzen wie Buchungszeitraeume oder Genehmigerlogik beeinflussen.
- Job Queue Entries gehoeren zum Betriebsnachweis.
- Change Log Entries sind nur mit passendem Change-Log-Setup ein belastbarer Audit-Nachweis.

## Buchwirkung

Kapitel 27 verkauft sichtbare Admin-Seiten nicht mehr als fertiges Rechtekonzept. Der Leser lernt zuerst die getrennten Prueffelder und sieht, warum ein echter Benutzer-/Rechte-/SoD-Lauf eine eigene Freigabe braucht.

## Gate

Praktische Aenderungen bleiben gesperrt unter `SECURITY-002-USER-PERMISSION-SETUP`.

Ohne Gate:

- keine Benutzeranlage
- keine Berechtigungszuweisung
- keine Profil-/Rollen-Aenderung
- keine Security-Group-Aenderung
- keine User-Setup-Aenderung
- keine Job-Queue-Aenderung
- keine Change-Log-Aktivierung

## Naechster Schritt

Ohne Freigabe: `MIGRATION-001` ist erledigt. Naechster sicherer Schritt ist `INTEGRATIONS-001-READINESS` fuer Kapitel 29 als read-only/Buch-Zielbild-Sync. Keine Extension installieren, keine API-/Connector-Einrichtung, kein Power-Platform-/Power-BI-Setup und kein produktiver Integrationslauf.

Mit Freigabe: `SECURITY-002-USER-PERMISSION-SETUP` als UI-first Admin-Lauf mit Testbenutzer, Rollen-/Permission-Set-/Security-Group-Matrix, SoD-Review und Audit-Evidence.
