# Universaarl Chart of Accounts Setup-Fit Decision

Status: `source-backed-decision`

Case: `TARGET-026D-CHART-OF-ACCOUNTS-SETUP-FIT-DECISION`

Instanz: `playthru`

Company: `UNIVERSAARL-DE`

## Befund

`TARGET-026B` hat den Kontenplan in `playthru` / `UNIVERSAARL-DE` read-only geoeffnet. Die Seite ist erreichbar, aber die aktuelle Ansicht zeigt keine Sachkontenzeilen und keine USt-/VAT-Kontenkandidaten.

Das ist fuer eine leere Universaarl-Company plausibel, aber fachlich wichtig:

- USt-/VAT-Setup braucht spaeter Sachkonten fuer Sales VAT Account und Purchase VAT Account.
- Posting Groups brauchen Sachkonten fuer Debitoren, Kreditoren, Verkauf, Einkauf, Lager, Bank und spaeter Anlagen.
- Stammdaten duerfen nicht so angelegt werden, als waere die Kontenfindung bereits bereit.

## Quelle

Microsoft Learn beschreibt den Kontenplan als Verzeichnis der Finanzkonten und Kontonummern. Die Konten werden in der Finanzbuchhaltung als Struktur fuer Bilanz- und GuV-Konten verwendet. Business Central kann Standardkonten enthalten, aber eine Company kann angepasst und um Konten ergaenzt werden:

- https://learn.microsoft.com/en-us/dynamics365/business-central/finance-chart-of-accounts
- https://learn.microsoft.com/en-au/dynamics365/business-central/finance-setup-chart-accounts

## Entscheidung

Kein VAT-Setup-Write und keine erste Debitor-/Kreditor-/Artikelanlage, solange der Kontenplan nicht mindestens als Universaarl-Foundation geplant und danach kontrolliert angelegt oder sichtbar bestaetigt wurde.

Naechster Schritt:

`TARGET-026E-CHART-OF-ACCOUNTS-MINIMAL-STRUCTURE-PLAN`

Ziel dieses naechsten Schritts:

- eine minimale, buchfaehige Kontenstruktur fuer Universaarl planen,
- Kontenfamilien fuer Bilanz, GuV, Debitoren, Kreditoren, Bank, Umsatzsteuer/Vorsteuer, Verkauf, Einkauf, Lager und Anlagen abgrenzen,
- klar markieren, dass dies noch kein finaler deutscher SKR04-/Steuerberater-Kontenplan ist,
- danach erst einen kontrollierten UI-Setup-Gate fuer Sachkonten vorbereiten.

## Nicht behaupten

- Kein deutscher finaler Kontenplan ist bewiesen.
- Keine 19-Prozent-USt ist bewiesen.
- Keine Sales-/Purchase-VAT-Account-Zuweisung ist bewiesen.
- Keine G/L Entries, VAT Entries, Preview Posting oder Buchung sind bewiesen.

## Buchwirkung

Im Buch kann der Kontenplan jetzt als notwendige Grundlage erklaert werden: Ohne Sachkonten kann Business Central zwar Seiten anzeigen, aber viele spaetere Prozesse koennen nicht sinnvoll gebucht werden. Der Leser soll zuerst verstehen, dass Sachkonten die Zielkonten fuer Buchungen sind. Erst danach werden USt, Posting Groups und Stammdaten sinnvoll.
