# SERVICE-001 Readiness

Status: `labor`, `read-only`, `service-readiness`, `gate-locked`, `no-posting`, `no-setup-change`, `not-final`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Relevantes Gate | `SERVICE-001-POSTING` locked |
| Setup-Aenderung | nein |
| Buchung | nein |

## Gepruefte UI-Einstiege

| Tell-Me-Suche | Treffer sichtbar | Screenshot |
|---|---|---|
| Service Orders | ja | service-001-010-service-orders-tell-me.png |
| Service Items | ja | service-001-020-service-items-tell-me.png |
| Resources | ja | service-001-030-resources-tell-me.png |
| Service Management Setup | ja | service-001-040-service-management-setup-tell-me.png |
| Service Contracts | ja | service-001-050-service-contracts-tell-me.png |
| Service Ledger Entries | ja | service-001-060-service-ledger-entries-tell-me.png |

## Gepruefte Zielobjekte

| Objekt | Sichtbar | Rolle im Buchfall | Screenshot |
|---|---|---|---|
| D10000 | ja | Servicekunde / Faktura- oder Garantiekontext | service-001-070-customer-d10000.png |
| RM-M100-SN1001 | nein | geplantes gewartetes Objekt beim Kunden | service-001-080-service-item-rm-m100-sn1001.png |
| SP-PUMP-01 | nein | geplantes Ersatzteil fuer Serviceverbrauch | service-001-090-item-sp-pump-01.png |
| RES-TECH | nein | geplante Technikerzeit | service-001-100-resource-res-tech.png |
| VAN-SERV | nein | geplanter Lagerort fuer Technikerfahrzeug | service-001-110-location-van-serv.png |

## Anfaenger-Lernwert

Service startet nicht mit der Rechnung. Zuerst muss klar sein, welches gewartete Objekt beim Kunden existiert, welcher Debitor dazugehort, welches Ersatzteil verbraucht wird, aus welchem Lagerort das Ersatzteil kommt und welche Ressource die Technikerzeit darstellt. Wenn Serviceartikel, Ersatzteil, Technikerlager oder Ressource fehlen, ist ein Serviceauftrag noch nicht buchungsreif. Ein sichtbarer Serviceauftragspfad ist deshalb nur Readiness, kein Serviceprozess.

## Was bewiesen ist

- Service-Einstiege wurden in RM-DEMO read-only gesucht und als Navigationsevidence dokumentiert.
- D10000 wurde als vorhandener Servicekunde read-only geprueft.
- RM-M100-SN1001, SP-PUMP-01, RES-TECH und VAN-SERV wurden als Zielobjekte read-only geprueft; fehlende Sichtbarkeit ist ein Stammdaten-/Setup-Backlog-Befund.
- Kapitel 15 braucht vor dem Serviceprozess einen eigenen Service-Setup- und Stammdaten-Fit.

## Was nicht bewiesen ist

- Kein Serviceauftrag SERV-4001.
- Kein Serviceartikel-Fit fuer RM-M100-SN1001.
- Kein Ersatzteilverbrauch von SP-PUMP-01.
- Keine Ressourcenerfassung RES-TECH.
- Keine Garantie-, Kulanz- oder Vertragsentscheidung.
- Keine Preview Posting fuer Service.
- Keine Servicerechnung, keine Serviceposten, keine Artikel-/Wert-/Sachposten aus Service.
- Kein deutscher Finalnachweis.

## Buchwirkung

Kapitel 15 darf den aktuellen Stand nur als Service-Readiness behandeln. Die Zielschritte `SERV-4001`, Ersatzteilverbrauch und Faktura bleiben Gate-gesperrt, bis Serviceartikel, Ersatzteil, Ressource, Technikerlager, Garantie-/Kulanzentscheidung und Preview-/Postenspur vorbereitet sind.

## Naechster Schritt

SERVICE-002 als Buch-/Evidence-Sync fuer Kapitel 15: Readiness-Befunde einarbeiten und danach nur mit ausdruecklichem Gate Serviceartikel, Ersatzteil, Ressource, Technikerlager und Serviceauftrag UI-first vorbereiten.
