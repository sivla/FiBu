# SECURITY-001 Readiness

Status: `labor`, `read-only`, `security-readiness`, `no-posting`, `no-setup-change`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Buchkapitel | Kapitel 27 Security, Rollen, SoD und Governance; Kapitel 39 Projektartefakte |
| Setup-Aenderung | nein |
| Stammdaten-Aenderung | nein |
| Buchung | nein |

## Gepruefte UI-Einstiege

| Tell-Me-Suche | Ergebnis | Bedeutung fuer Anfaenger | Screenshot |
|---|---|---|---|
| Users | nicht stabil sichtbar | Benutzer sind Identitaeten im System; ein sichtbarer Benutzer beweist noch nicht, welche Rechte fachlich korrekt sind. | security-001-010-users-tell-me.png |
| Permission Sets | sichtbar/kontextuell sichtbar | Berechtigungssaetze bestimmen, was ein Benutzer darf; sie sind die Rechteebene, nicht das Rollencenter. | security-001-020-permission-sets-tell-me.png |
| Profiles Roles | sichtbar/kontextuell sichtbar | Profile/Rollen formen die Oberflaeche; sie ersetzen keine Berechtigungssaetze. | security-001-030-profiles-roles-tell-me.png |
| Security Groups | sichtbar/kontextuell sichtbar | Security Groups koennen Zugriff organisatorisch buendeln; sichtbare Suche beweist noch keine Gruppenzuweisung. | security-001-040-security-groups-tell-me.png |
| User Setup | sichtbar/kontextuell sichtbar | User Setup kann fachliche Grenzen wie Buchungszeitraeume oder Genehmigerlogik beeinflussen; ohne Gate wird nichts geaendert. | security-001-050-user-setup-tell-me.png |
| Job Queue Entries | sichtbar/kontextuell sichtbar | Aufgabenwarteschlangen zeigen automatisierte Laeufe; sie sind Betriebsevidence, aber kein Benutzerrechte-Nachweis. | security-001-060-job-queue-entries-tell-me.png |
| Change Log Entries | sichtbar/kontextuell sichtbar | Aenderungsprotokollposten koennen kritische Aenderungen zeigen, wenn das Change Log passend eingerichtet ist. | security-001-070-change-log-entries-tell-me.png |

## Lernbefund

- Profil/Rolle steuert vor allem Oberflaeche und Rollencenter. Es ersetzt keine Berechtigung.
- Berechtigungssaetze steuern, was ein Benutzer darf. Sie sind nicht dasselbe wie ein sichtbares Menue.
- Security Groups und User Setup sind Governance-Kontexte. Sichtbarkeit ist nur Orientierung, kein SoD- oder Zugriffsnachweis.
- Change Log und Job Queue gehoeren in den Admin-/Betriebsnachweis, duerfen aber ohne Gate nicht aktiviert oder geaendert werden.

## Buchwirkung

- Kapitel 27 kann als Admin-/Security-Zielpfad gegen RM-DEMO vorbereitet werden.
- Die aktuellen Screenshots sind Kandidaten fuer Anfaengererklaerungen zu Rolle vs. Berechtigung vs. Governance.
- Finale deutsche Security-/SoD-Nachweise brauchen Zielrollen, Testbenutzer, Permission Sets, Security Groups und Review-Evidence.

## Naechster Schritt

SECURITY-002-BOOK-SYNC: Kapitel 27 mit SECURITY-001 synchronisieren; Rolle/Profil, Permission Sets, Security Groups, User Setup, Job Queue und Change Log als getrennte Prueffelder erklaeren. Ohne Gate keine Benutzer-, Berechtigungs-, Profil-, Security-Group-, User-Setup-, Change-Log- oder Job-Queue-Aenderung.
