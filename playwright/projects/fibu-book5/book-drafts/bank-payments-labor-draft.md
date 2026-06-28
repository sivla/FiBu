# Bank und Zahlungen - Labor-Draft

Status:
- Buchziel: Zahlungsjournal, OP-Ausgleich und Bank-/Sachpostenspur anfaengerfreundlich erklaeren.
- Mandant: `RM-DEMO` in `MCP_1_20260210`.
- Laborstand: `labor-sufficient-for-book-draft`.
- DE-Finalnachweis: offen, muss spaeter in einer deutschen Zielcompany neu erzeugt werden.
- Evidence Pack: `evidence/bank-020/`, `evidence/bank-021/`.
- Nicht behaupten: keine deutsche Bankabstimmung, keine deutsche Steuer-/Compliance-Finalwirkung, kein finaler deutscher Kontenplan.

## BANK-020/BANK-021: Kreditorenzahlung ueber Payment Journal

| Feld | Laborwert |
|---|---|
| Zahlungsbeleg | `BANK018-108205` |
| Rechnung / offener Posten | `108205` |
| Kreditor | `40000` / Wide World Importers |
| Bankgegenkonto | `BANK-RM-01` |
| Betrag | `3.123,37` |
| Buchungsart | kontrollierte UI-Buchung aus dem Payment Journal |
| Status | Laborbeweis, kein deutscher Finalnachweis |

### Was sehe ich in Business Central?

Im Zahlungsjournal steht eine Journalzeile fuer den Kreditor. Entscheidend sind nicht nur Belegnummer und Betrag, sondern die Kombination aus Kreditor, Bankgegenkonto und Bezug auf die Rechnung:

- `Account Type = Vendor` und Kreditor `40000`.
- `Document No. = BANK018-108205`.
- `Bal. Account No. = BANK-RM-01`.
- `Amount = 3.123,37`.
- `Applies-to Doc. No. = 108205`.
- `Journal Check` zeigt `0 Issues`.

Vor dem Buchen ist der Post-Dialog ein fachlicher Kontrollpunkt. Danach ist die Zahlung nicht mehr nur ein Journalentwurf, sondern erzeugt Posten:

- Kreditorenposten zur Zahlung `BANK018-108205`.
- Der urspruengliche Rechnungsposten `108205` zeigt im Review `Remaining Amount 0,00`.
- Detaillierte Kreditorenposten zeigen `Initial Entry` und `Application`.
- Bankposten zeigen die Bewegung auf `BANK-RM-01`.
- Sachposten zeigen die Wirkung auf `22100` und `18200`.

### Was muss ich tun?

1. Einen genau begrenzten Zahlungsjournal-Entwurf fuer den offenen Kreditorenposten anlegen.
2. Kreditor, Betrag, Bankgegenkonto und `Applies-to Doc. No.` sichtbar pruefen.
3. `Journal Check` ausfuehren und nur bei `0 Issues` weitergehen.
4. `Apply Entries` read-only oeffnen und pruefen, dass die richtige Rechnung betroffen ist.
5. Den Post-Dialog vor der Bestaetigung fotografisch sichern.
6. Genau einmal buchen.
7. Danach die Postenspur pruefen: Kreditorenposten, detaillierte Kreditorenposten, Bankposten und Sachposten.

### Warum muss ich das tun?

Eine Kreditorenzahlung gleicht keinen Einkauf automatisch "irgendwie" aus. Business Central muss wissen, welcher offene Posten bezahlt wird und welches Bankkonto die Gegenbuchung traegt. Erst der Bezug ueber `Applies-to Doc. No.` verbindet Zahlung und Rechnung fachlich sauber.

### Was passiert, wenn es falsch ist?

- Ohne richtigen Rechnungsbezug bleibt der falsche OP offen oder eine Zahlung wird falsch zugeordnet.
- Ohne Journal Check kann ein Setup- oder Pflichtfeldfehler erst beim Buchen sichtbar werden.
- Bei Mehrfachbuchung entsteht ein weiterer Zahlungsbeleg statt einer Korrektur.
- Bei fehlender Postenspur bleibt unklar, ob nur ein Erfolgstext sichtbar war oder ob Nebenbuch, Bank und Sachkonten wirklich betroffen sind.

### Wie korrigiere ich es?

Vor dem Buchen: Entwurf abbrechen oder bereinigen und die Journalzeile neu aufbauen. Nach dem Buchen: nicht erneut buchen. Erst die Ledger-Spur lesen und eine eigene Korrektur-/Storno- oder Unapply-Route planen. Eine gebuchte Laborzahlung ist Evidence und wird nicht heimlich geloescht.

### Woran erkenne ich danach, dass es stimmt?

Im Labor gilt BANK-020/BANK-021 als ausreichend fuer den Buchdraft, weil folgende Punkte sichtbar belegt sind:

| Kontrollpunkt | Evidence |
|---|---|
| Payment-Journal-Preflight | `img/bank-020-020-payment-journal-preflight.png` |
| Apply-Entries-Preflight | `img/bank-020-030-apply-entries-preflight.png` |
| Post-Dialog vor Bestaetigung | `img/bank-020-040-post-confirm-dialog.png` |
| Erfolg nach Buchung | `img/bank-020-050-post-result.png` |
| Kreditorenposten Rechnung `108205` | `evidence/bank-020/060-vendor-ledger-invoice-after-payment-page-text.txt` |
| Kreditorenposten Zahlung `BANK018-108205` | `img/bank-020-061-vendor-ledger-payment.png` |
| Detaillierte Kreditorenposten / Application | `img/bank-020-062-detailed-vendor-ledger-payment.png` |
| Bankposten `BANK-RM-01` | `img/bank-020-063-bank-account-ledger-payment.png` |
| Sachposten `22100` / `18200` | `img/bank-020-064-gl-entries-payment.png` |
| Review Restbetrag `0,00` | `evidence/bank-021/BANK-021-TRACE-REVIEW.md` |

### Laborbefund oder finaler Nachweis?

Dieser Abschnitt ist Laborbefund. Er darf als Clickguide- und Buchdraft-Substanz genutzt werden, weil der Prozess in `RM-DEMO` praktisch belegt ist. Fuer die deutsche Finalfassung muessen spaeter in der deutschen Zielcompany neue Screenshots, neue Belegnummern, deutsche Bank-/Sachkonten, deutsche Zahlungs-/OP-Logik und ein deutscher Ledger-Trace erzeugt werden.

German-Final-Rebuild:
- denselben Ablauf mit deutschem Kreditor und deutschem Bankkonto neu aufbauen,
- Post-Dialog und Ledger-Spur neu fotografieren,
- Restbetrag, Application, Bankposten und Sachposten erneut nachweisen,
- erst danach deutsche Buchclaims formulieren.

## BANK-023: Grenze zur Bankabstimmung

Status:
- Laborstand: Route-Entscheidung, keine neue BC-Ausfuehrung.
- Bewiesen: Payment-Journal-Zahlung und Postenspur sind als Laborprozess belegt.
- Nicht bewiesen: Bankkontoabstimmung, Kontoauszugszeile, Match/Apply in der Bankabstimmung, Posten nach Bankabstimmung.

Anfaengerfalle: Nach einer gebuchten Zahlung klingt `Payment Reconciliation` oder `Post Payments Only` wie ein naheliegender naechster Klick. Im Labor war diese Route aber zu breit: alte und neue Treffer konnten sichtbar sein, ohne dass eine einzelne Zielzeile sicher isoliert war. Deshalb ist die fachlich sichere Regel:

1. Payment Journal beweist Zahlung und OP-Ausgleich.
2. Bank Account Reconciliation ist ein eigener Prozessblock.
3. Erst wenn Bankkonto, Kontoauszugszeile, Zielposten und erwartete Postenspur eindeutig sind, darf eine Bankabstimmung als eigener Case weitergefuehrt werden.

Fuer das Buch bedeutet das: Die Laborzahlung darf erklaert werden. Die Bankabstimmung bleibt offen und braucht spaeter eigene Screenshots und eigene Evidence, besonders in der deutschen Zielcompany.

## BANK-024: Bankkontoabstimmung read-only sichtbar

Status:
- Laborstand: read-only Scout, keine neue Statement-Zeile, kein Match/Apply, kein Post.
- Sichtbar: `Bank Account Reconciliations` Liste und `Bank Acc. Reconciliation - CHECKING 24`.
- Grenze: Post-Button ist sichtbar, wurde aber nicht geklickt; daraus folgt keine Buchungsreife.

Im Labor wurde die Bankkontoabstimmungsroute lesend sichtbar:

| Kontrollpunkt | Laborbefund |
|---|---|
| Seite Liste | `Bank Account Reconciliations`, Page `388` |
| Seite Karte | `Bank Acc. Reconciliation - CHECKING 24`, Page `379` |
| Bankkonto | `CHECKING` / World Wide Bank |
| Statement No. | `24` |
| Statement Date | `31.01.2026` |
| Statement Ending Balance | `11.573,18` |
| Statement Lines | sichtbar, 3 Zeilen im kompakten Page-Text |
| Bank Account Ledger Entries | sichtbar, 4 Zeilen im kompakten Page-Text |
| Riskante Aktion | `Post` sichtbar, nicht geklickt |

Anfaengerregel: Ein sichtbarer Abstimmungsbeleg ist noch keine abgeschlossene Bankabstimmung. Vor einer echten Abstimmungsbuchung muss separat klar sein, ob die Zeilen passen, welche Bankposten angewendet sind, ob eine Differenz bleibt, welcher Post-Dialog erscheint und welche Bank-/Sachposten danach entstehen.

## BANK-025: Warum `CHECKING 24` nicht gebucht wird

Status:
- Laborstand: Gate-Entscheidung, keine BC-Ausfuehrung.
- Entscheidung: kein no-post Preflight und keine Buchung fuer `CHECKING 24`, solange Differenz und Match-/Apply-Zustand nicht fachlich geklaert sind.

Der read-only Page-Text aus BANK-024 zeigt zwar Statement Lines und Bank Account Ledger Entries, aber auch `Total Difference 11.573,18`. Das ist die entscheidende Warnung: Ein sichtbarer `Post`-Button ist kein Nachweis, dass die Bankkontoabstimmung korrekt oder buchungsreif ist.

Fuer Anfaenger ist die Trennung wichtig:

| Sichtbar | Bedeutung |
|---|---|
| `CHECKING 24` | Es gibt einen vorhandenen Labor-Abstimmungskontext |
| Statement Lines | Es gibt Kontoauszugszeilen oder Vergleichszeilen |
| Bank Account Ledger Entries | Interne Bankposten sind sichtbar |
| `Post` | Aktion ist vorhanden, aber nicht automatisch sicher |
| `Total Difference 11.573,18` | Vor einer Buchung muss die Differenz fachlich geklaert werden |

Buchregel: Dieser Laborblock darf im Buch als Navigations- und Fehlervermeidungsbeispiel verwendet werden. Er darf nicht als Bankabstimmungsbuchung, nicht als korrekter Ausgleich und nicht als deutscher Finalnachweis formuliert werden.
