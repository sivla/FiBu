# Ticketanalyse: [Kurztitel]

## 1. Kurzfazit

## 2. Was aus dem Ticket sicher erkennbar ist

| Kategorie | Ergebnis |
|---|---|
| Kunde / Mandant |  |
| Environment | Production / Sandbox / unbekannt |
| Company |  |
| User / Rolle |  |
| Modul | Finance / Sales / Purchase / Inventory / Warehouse / Service / Projects / Manufacturing / Admin / Integration |
| Prozess |  |
| Page |  |
| Fehlermeldung |  |
| Zeitpunkt |  |
| Erwartung |  |
| Ist-Verhalten |  |
| Betroffene Daten |  |
| Datenschutzstatus |  |

## Datenschutzpruefung

| Pruefpunkt | Ergebnis |
|---|---|
| Personenbezogene Daten sichtbar? | nein / ja / unbekannt |
| Bank-/Zahlungsdaten sichtbar? | nein / ja / unbekannt |
| Steuer-/Compliance-Daten sichtbar? | nein / ja / unbekannt |
| Screenshot/Log anonymisiert? | nein / ja / nicht noetig |
| Darf Material ins Buch/Evidence Pack? | nein / ja / nur anonymisiert |

## Environment-Risiko

| Punkt | Ergebnis |
|---|---|
| Environment | Production / Sandbox / Test / Local / unbekannt |
| Company |  |
| Risiko der naechsten Aktion | niedrig / mittel / hoch / sehr hoch |
| Safe-Action-Policy geprueft? | nein / ja |

## Freigabestatus

| Aktion | Status |
|---|---|
| read-only Analyse | erlaubt / unklar |
| Personalisierung | erlaubt / braucht Freigabe / verboten |
| Stammdaten/Setup-Aenderung | braucht Freigabe / verboten |
| Buchung/Zahlung/E-Mail/Job/Integration | braucht ausdrueckliche Freigabe / verboten |

## Was darf ich jetzt sicher tun?

- [ ] Tickettext auswerten.
- [ ] Screenshots anonymisiert analysieren.
- [ ] Page-/Datenkontext read-only pruefen.
- [ ] Rueckfragen stellen.
- [ ] Keine schreibende Aktion ohne Freigabe.

## 3. Screenshot-/Textanalyse

| Hinweis | Fakt oder Hypothese | Bedeutung |
|---|---|---|
|  |  |  |

## 4. Betroffener BC-Bereich

## 5. Wahrscheinliche Fehlerklasse

| Klasse | Wahrscheinlichkeit | Warum |
|---|---:|---|
| Oberflaeche | niedrig |  |
| Berechtigung | niedrig |  |
| Stammdaten | niedrig |  |
| Setup | niedrig |  |
| Status | niedrig |  |
| Extension | niedrig |  |
| Integration | niedrig |  |
| Performance/Telemetry | niedrig |  |
| Datenqualitaet | niedrig |  |

## 6. Hypothesenmatrix

| Hypothese | Wahrscheinlichkeit | Warum | Wie pruefen? | Risiko | Status |
|---|---:|---|---|---|---|
|  | niedrig |  |  | niedrig | offen |

Statuswerte:

- offen
- bestaetigt
- widerlegt
- teilweise bestaetigt
- nicht testbar
- braucht Kundenzugriff
- braucht Entwicklerpruefung
- blockiert wegen Sicherheitsregel

## 7. Sicherer Repro-Plan

1. Environment und Company identifizieren.
2. Read-only Informationen sammeln.
3. Page Inspection ausfuehren.
4. Relevante Daten ueber UI/API/MCP pruefen.
5. Falls moeglich, in Sandbox nachstellen.
6. Screenshots erzeugen.
7. Logs/Telemetry abgleichen.
8. Ursache bestaetigen oder Hypothesen anpassen.
9. Fix oder Workaround beschreiben.
10. Regressionstest formulieren.

## 8. Welche Daten ich pruefen wuerde

## 9. Welche Screenshots/Evidence ich erzeugen wuerde

## 10. Welche Telemetry/MCP/API-Abfragen sinnvoll waeren

## 11. Moegliche Ursache

## 12. Sofort-Workaround

## 13. Dauerhafte Loesung

## 14. Regressionstest

## 15. Buchwissen: Welche Regel lernen wir daraus?
