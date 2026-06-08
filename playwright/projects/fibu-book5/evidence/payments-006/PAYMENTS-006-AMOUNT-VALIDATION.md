# PAYMENTS-006 Cash Receipt Journal Amount Validation

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | labor, ui-validation, no-payment, no-application, cleanup |
| Document No. | `PAY006-767166` |
| Ausgangsposten | `PS-INV103297` / `D10000` |
| Gegenkonto | `BANK-RM-01` |
| Betrag im Entwurf | `-68.000,00` als Cash-Receipt-Customer-Zeile |

## Ergebnis

| Pruefpunkt | Befund |
|---|---|
| Entwurfszeile in UI sichtbar | ja |
| Debitor sichtbar | ja |
| Gegenkonto sichtbar | ja |
| Rechnungsbezug sichtbar | ja |
| Betrag sichtbar | ja |
| Journal Check sichtbar | ja |
| Journal Check 0 Issues Total | nein |
| Journal Check 0 Lines with issues | nein |
| Current line: No issues found | nein |
| Journal Check Issues | 1 |
| Aktueller Issue | `'Bank Account Posting Group' ist nicht vorhanden. Identifizierende Felder und Werte: Code=''` |
| Amount-Issue geloest | ja |
| Bank Account Posting Group Issue | ja |
| Cleanup geloescht | ja |
| Zahlung gebucht | nein |
| OP ausgeglichen | nein |
| Bankabstimmung | nein |

## Gepruefte UI-Varianten

| Schritt | Eingabe | 0 Issues Total | 0 Lines with issues | Current line ok | Issue sichtbar |
|---|---|---|---|---|---|
| raw-negative-number | `-68000` | nein | nein | nein | ja |
| localized-negative-amount | `-68.000,00` | ja | nein | nein | nein |
| full-draft-before-refresh | `full line` | ja | ja | ja | nein |
| full-draft-after-refresh | `full line plus Refresh` | nein | nein | nein | ja |

## Anfaenger-Lernwert

Eine Zahlungsjournalzeile ist ein Entwurf, keine Zahlung. In diesem Lauf wurde die in `PAYMENTS-005` offene Amount-Validierung gezielt ueber die UI nachgeprueft: zuerst mit Rohzahl, dann mit lokalem Betragsformat und abschliessendem Refresh der Journal-Check-FactBox.

Der Lernpunkt ist nicht der Post-Button, sondern die Vorabkontrolle. Das lokale Betragsformat loest den urspruenglichen Amount-Fehler zwischenzeitlich. Nach `Refresh` meldet BC aber den naechsten Setup-Blocker: `Bank Account Posting Group` fehlt am Balance Account. Deshalb darf weiterhin nicht gebucht werden.

## Buchwirkung

Kapitel 19/20 kann jetzt den Unterschied zwischen sichtbar gefuellter Zeile, intern validierter Journalzeile und tatsaechlicher Zahlung erklaeren. Die Anleitung muss den rechten `Journal Check` als Pflichtkontrolle vor jeder Zahlung zeigen.

## Grenze

- CRONUS-USA-Labor, kein deutscher Finalnachweis.
- Keine Zahlung, kein OP-Ausgleich, keine Bankposten und keine Bankabstimmung.
- Keine deutsche Bank-/Compliance- oder Steuerlogik.
- `Preview Posting` war in `PAYMENTS-004` nicht sichtbar; dieser UI-Draft nutzt Journal Check als sichtbaren Preflight-Hinweis.
- Journal Check meldet weiter ein Issue; keine Zahlungsfreigabe. In diesem Lauf ist der Restblocker die fehlende Bank Account Posting Group.

## Naechster Schritt

PAYMENTS-007: Bankkonto BANK-RM-01 per UI auf Bank Account Posting Group/Sachkonto-Fit pruefen und erst danach denselben Cash-Receipt-Draft erneut ohne Buchung testen.
