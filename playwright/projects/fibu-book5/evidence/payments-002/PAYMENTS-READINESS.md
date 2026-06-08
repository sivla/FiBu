# PAYMENTS-002 Payment/OP Governance Readiness

| Feld | Wert |
|---|---|
| Umgebung | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Status | labor, governance-gate, read-only, no-payment, no-application |
| Datenbasis | CRONUS USA |
| Ausgangsposten Debitor | gebuchte Verkaufsrechnung `PS-INV103297` / Debitor `D10000` |
| Ausgangsposten Kreditor | gebuchte Einkaufsrechnung `108219` / Kreditor `K10000` |
| Zielbankkonto laut Buch/Testdaten | `BANK-RM-01` |

## Governance-Entscheidung

Vor einer Zahlung oder einem OP-Ausgleich ist der Payments-Block nicht buchungsbereit.

Der Lauf `PAYMENTS-002` beweist, dass die Bedienorte erreichbar sind: Bank Accounts, Cash Receipt Journal, Payment Journal sowie Apply Entries aus Debitoren- und Kreditorenposten. Er beweist aber nicht, dass eine Zahlung fachlich freigegeben ist. Der zentrale Sperrpunkt ist das fehlende Zielbankkonto `BANK-RM-01`.

## Gepruefte offene Posten

| Richtung | Beleg | Konto | Nachweis | Status |
|---|---|---|---|---|
| Zahlungseingang | `PS-INV103297` | `D10000` | Debitorenposten und Apply-Entries-Pfad aus `PAYMENTS-001`/`PAYMENTS-002` sichtbar | offen, nicht ausgeglichen |
| Zahlungsausgang | `108219` | `K10000` | Kreditorenposten und Apply-Entries-Pfad aus `PAYMENTS-001`/`PAYMENTS-002` sichtbar | offen, nicht ausgeglichen |

## Sichtbare Zahlungs- und Ausgleichswege

| Weg | Befund | Bedeutung fuer das Buch | Freigabe |
|---|---|---|---|
| Bank Accounts | Seite erreichbar; CRONUS-Bankkonten `CHECKING`/`SAVINGS` sichtbar; `BANK-RM-01` nicht sichtbar | Bankkonto muss vor Zahlungsuebung bewusst eingerichtet oder als Laborersatz entschieden werden | nein |
| Cash Receipt Journal | erreichbar; Felder und Post-Aktion sichtbar | geeigneter Bedienpfad fuer spaetere Debitorenzahlung | noch keine Zahlung |
| Payment Journal | erreichbar; Felder und Post-Aktion sichtbar | geeigneter Bedienpfad fuer spaetere Kreditorenzahlung | noch keine Zahlung |
| Apply Entries Debitor | aus Debitorenposten erreichbar | zeigt, wo Ausgleich vorbereitet wird | kein `Set Applies-to ID`, kein `Post Application` |
| Apply Entries Kreditor | aus Kreditorenposten erreichbar | zeigt, wo Ausgleich vorbereitet wird | kein `Set Applies-to ID`, kein `Post Application` |

## Naechster fachlich sinnvoller Lauf

Der naechste Schritt ist `PAYMENTS-003` als idempotenter Bankkonto-Fit oder Bankkonto-Entscheid:

- Option A: `BANK-RM-01` kontrolliert als Laborbankkonto anlegen/fitten, falls das Testdatenmodell das verlangt.
- Option B: ein vorhandenes CRONUS-Bankkonto, z. B. `CHECKING` oder `SAVINGS`, bewusst als Laborersatz dokumentieren.

Erst danach darf eine einzelne Laborzahlung geplant werden. Eine Zahlung, ein OP-Ausgleich oder eine Bankabstimmung ist in `PAYMENTS-003` weiterhin nicht freigegeben.

## Risiken und Grenzen

- CRONUS-USA-Labor, kein deutscher Bank-/Steuer-/Compliance-Finalnachweis.
- Deutsche 19-%-USt/Vorsteuer ist fuer diesen Block nicht geloest.
- Sichtbare `Post`-Aktionen in Journalen sind UI-Bedienorte, keine fachliche Buchungsfreigabe.
- Apply-Entries-Dialoge duerfen fuer Screenshots geoeffnet werden, aber ohne Setzen von Ausgleichskennzeichen.

## Evidence-Anbindung

- Strukturierter Befund: `PAYMENTS-002-result.json`
- Lernzusammenfassung: `PAYMENTS-002-READINESS.md`
- Offene Ausgangsposten: `../payments-001/`
- Screenshots/Metadaten: `payments-002-*.screenshot.json`
