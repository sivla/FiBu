# BANK-012 Bankabstimmungs-Route nach BANK-009/BANK-011

Status: `labor-sufficient-for-book-draft`, `route-decision`, `needs-german-final-rebuild`

## Entscheidung

`BANK009-108204` bleibt ein sauberer Laboranker fuer Zahlungsausgang, OP-Ausgleich, Bankposten und Sachposten. Er ist aber kein sicherer weiterer Bankabstimmungs- oder `Post Payments Only`-Kandidat.

Nach `BANK-011` gilt:

- Die alte Rechnung `108204` ist im `Payment Reconciliation Journal` weiterhin sichtbar.
- Die Zahlung `BANK009-108204` ist gleichzeitig ueber Vendor Ledger, Bank Account Ledger und G/L Entries belegt.
- Daraus folgt: Die alte Reconciliation-Sicht darf nicht blind weitergebucht werden.

## Warum das wichtig ist

Eine Reconciliation-Zeile kann fachlich veraltet wirken, wenn der offene Posten bereits ueber einen anderen kontrollierten Weg bezahlt wurde. Fuer Anfaenger ist das ein wichtiger Unterschied:

- Ein Bankposten beweist eine gebuchte Bankbewegung.
- Ein geschlossener Kreditorenposten beweist den OP-Ausgleich.
- Eine sichtbare Reconciliation-Zeile beweist noch nicht, dass ein weiterer Klick auf `Post Payments Only` fachlich richtig ist.
- Eine Bankabstimmung braucht einen eigenen Kontoauszugs-/Bankposten-Kontext.

## Buchwirkung

Kapitel 20 darf die BANK-009/BANK-011-Kette als Laborwarnung nutzen:

> Nach einer Einzelzahlung muss der Zahlungsabstimmungs-Kontext neu gegen Ledger gelesen werden. Sichtbare alte Rechnungsnummern sind kein Freifahrtschein fuer eine weitere Zahlung oder Bankabstimmung.

## Nicht behaupten

- keine Bankabstimmung gebucht
- kein `Post Payments Only`
- kein `Accept Applications`
- kein Preview Posting
- kein Kontoauszugsimport
- kein deutscher Bank-/Compliance-Finalnachweis

## German-Final-Rebuild

In einer deutschen Zielcompany muss die Bankabstimmung neu aufgebaut werden:

1. deutsches Bankkonto und Bankkonto-Buchungsgruppe pruefen
2. frischen Kontoauszug oder Bank Statement Line definieren
3. eindeutigen offenen Posten oder bereits gebuchten Bankposten festlegen
4. vor jedem Posting die erwarteten Bankposten, Sachposten und OP-Wirkung dokumentieren
5. erst danach Bankabstimmung oder Zahlungsabstimmung buchen

## Naechster Schritt

Nur wenn ein neuer klarer Zielbeleg mit eigener Statement Line existiert, darf ein `BANK-013`-Execute-Case geplant werden. Sonst ist Bankabstimmung in RM-DEMO ausreichend als `needs-german-final-rebuild` klassifiziert und der Autopilot sollte zu einem anderen hohen Buchnutzen-Prozess wechseln.
