# PAYMENTS-008 Amount Diagnostic

Status: erledigt als CRONUS-USA-Labor-Diagnose, UI-only, keine Zahlung, kein OP-Ausgleich, Cleanup.

Diese Datei dient als Kompatibilitaets- und Uebergabenotiz fuer Queue-Prompts, die noch vom offenen Amount-Blocker nach `PAYMENTS-007` ausgehen. Der Blocker ist nicht mehr offen: `PAYMENTS-008` hat ihn isoliert und im Labor geloest. Der aktuelle Folgeschritt ist nicht noch eine Amount-Diagnose, sondern der bereits gelaufene `PAYMENTS-009`-Apply-Readiness-Nachweis beziehungsweise danach ein separater Zahlungsfreigabecheck.

## Ausgangspunkt

| Feld | Wert |
|---|---|
| Sandbox | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Datenbasis | CRONUS USA |
| Debitor | `D10000` |
| offene/gebuchte Verkaufsrechnung | `PS-INV103297` |
| Laborbankkonto | `BANK-RM-01` |
| Bank Acc. Posting Group | `CHECKING` seit `PAYMENTS-007` |
| Journal | Cash Receipt Journal |
| Zahlungsbetrag im Labor | `-68.000,00` |
| Zahlung gebucht | nein |
| OP ausgeglichen | nein |
| Bankabstimmung | nein |

## Vorherige Befunde

| Testfall | Befund |
|---|---|
| `PAYMENTS-005` | UI-Draft mit `D10000`, `BANK-RM-01`, `PS-INV103297` und Betrag vorbereitet; Journal Check meldete ein `Amount`-Issue. |
| `PAYMENTS-006` | Rohzahl `-68000` erzeugte weiter ein Amount-Problem; lokales Format `-68.000,00` loeste Amount teilweise, danach wurde `Bank Account Posting Group` als naechster Blocker sichtbar. |
| `PAYMENTS-007` | `BANK-RM-01` wurde per UI auf `Bank Acc. Posting Group = CHECKING` gefittet; der Bank-Posting-Group-Fehler war weg, aber der Amount-Check blieb als Folgefrage offen. |
| `PAYMENTS-008` | Amount-Feld und `Amount ($)` wurden in breiter Ansicht getrennt; nach erneutem Fokus auf das eigentliche Amount-Feld, `Enter`/`Tab` und `Refresh` zeigte `Journal Check = 0 Issues`. |

## Gepruefte Amount-Variante

Der belastbare Laborpfad ist:

1. Cash Receipt Journal oeffnen.
2. Draft mit `Document Type = Payment`, `Account Type = Customer`, `Account No. = D10000`, `Bal. Account Type = Bank Account`, `Bal. Account No. = BANK-RM-01`, `Applies-to Doc. Type = Invoice`, `Applies-to Doc. No. = PS-INV103297` vorbereiten.
3. Betrag im lokalen Format in das eigentliche `Amount`-Feld schreiben: `-68.000,00`.
4. Das Amount-Feld erneut fokussieren und mit `Enter`/`Tab` verlassen.
5. Rechts `Journal Check` per `Refresh` aktualisieren.

Ergebnis:

| Pruefpunkt | Befund |
|---|---|
| `Amount` | `-68.000,00` |
| `Amount ($)` | `-67.673,60` |
| `Journal Check` | `1 Lines checked`, `0 Lines with issues`, `0 Issues Total`, `Current line: No issues found` |
| Cleanup | Draft geloescht |

## Was geloest ist

- Das fruehere Amount-Issue ist in `PAYMENTS-008` nicht mehr offen.
- Der alte Bank-Posting-Group-Blocker ist seit `PAYMENTS-007` weg.
- Der nicht buchende Zahlungsjournal-Draft kann im Labor mit `Journal Check = 0 Issues` vorbereitet werden.

## Was nicht bewiesen ist

- Keine Zahlung wurde gebucht.
- Kein OP wurde ausgeglichen.
- Keine Bankposten oder detaillierten Debitorenposten aus einer Zahlung wurden erzeugt.
- Keine Bankabstimmung wurde gestartet.
- Kein deutscher Bank-, Steuer- oder Compliance-Finalnachweis.
- Es wurde nicht bewiesen, dass alle denkbaren Amount-Varianten funktionieren; bewiesen ist der stabile UI-Pfad mit lokalem Betrag `-68.000,00`.

## Folgebefund aus PAYMENTS-009

`PAYMENTS-009` hat auf diesem geloesten Amount-Zustand aufgebaut:

- derselbe Draft wurde erneut zahlungsreif vorbereitet,
- `Applies-to Doc. No. = PS-INV103297` wurde dokumentiert,
- `Apply Entries` wurde read-only geoeffnet,
- der Apply-Kontext zeigte Rechnungs-/Betragsinformationen,
- `Preview Posting` war im Cash Receipt Journal nicht direkt sichtbar,
- der Draft wurde geloescht,
- keine Zahlung und kein Ausgleich wurden gebucht.

## Naechster sicherer Schritt

Nicht `PAYMENTS-008` wiederholen. Der naechste sinnvolle Payments-Schritt ist `PAYMENTS-010` als nicht buchender Zahlungsfreigabecheck:

- Buchungsdialog-/Preview-Risiko klaeren,
- genaue Sicherheitskriterien fuer eine spaetere einzelne Laborzahlung formulieren,
- erst nach ausdruecklicher Freigabe buchen.
