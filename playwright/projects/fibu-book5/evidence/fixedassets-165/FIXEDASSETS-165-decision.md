# FIXEDASSETS-165 FA Balancing-Account Setup Decision

Status: `local-review`, `judge_work`, `no-bc-run`, `no-playwright-run`, `no-setup-change`, `no-preview`, `no-posting`, `not-final`.

## Ausgangslage

FA-163 zeigte in `Fixed Asset G/L Journals`, dass die aktuelle Journalzeile `Bal. Account Type = G/L Account` erwartet und `K30000` deshalb nicht als Gegenkonto-Wert taugt.

FA-164 erreichte `FA Posting Group Card` fuer `MACHINES` read-only. Das Bild zeigt den Bereich `Balancing Account` und das Feld `Acquisition Cost Bal. Acc.`, aber keinen konkreten Kontowert in diesem Feld.

## Microsoft-Learn-Abgleich

- Microsoft Learn beschreibt die manuelle Anschaffung ueber `Fixed Asset G/L Journals`: In der Journalzeile wird `FA Posting Type = Acquisition Cost` gesetzt, danach werden die weiteren Felder gefuellt und gebucht. Quelle: `https://learn.microsoft.com/en-us/dynamics365/business-central/fa-how-acquire`.
- Microsoft Learn beschreibt `FA Posting Groups` als Kontierungslogik: Posting Groups gruppieren Anlagen, deren Posten auf dieselben Sachkonten laufen. Quelle: `https://learn.microsoft.com/en-au/dynamics365/business-central/fa-how-setup-general`.
- Microsoft Learn beschreibt fuer verwandte FA-G/L-Journal-Automatik, dass `Insert FA Bal. Account` nur funktioniert, wenn die passenden Konten in der `FA Posting Group Card` gepflegt sind. Quelle: `https://learn.microsoft.com/en-us/dynamics365/business-central/fa-how-revalue`.

## Entscheidung

Die leere `Acquisition Cost Bal. Acc.` darf nicht durch sichtbare andere Konten wie `12210` oder `82000` ersetzt werden. Diese Konten stehen in anderen Feldern und beweisen kein Erwerbs-Gegenkonto.

Die FA-G/L-Journalroute bleibt fuer Werteingabe, Preview Posting und Posting gesperrt.

Ein direkter Setup-Fit ist noch nicht freigegeben, weil kein fachlich begruendeter Zielkontowert belegt ist. Der naechste sinnvolle Lauf ist deshalb ein read-only Kandidatenlauf:

`FIXEDASSETS-166-FA-BALACCOUNT-CANDIDATE-READONLY`

## Naechster Lauf

Ziel des naechsten Laufs:

- Business Central nur read-only oeffnen.
- In `MCP_1_20260210` / `RM-DEMO` bleiben.
- Moegliche G/L-Konten fuer ein acquisition-cost balancing account aus bestehenden CRONUS-/RM-DEMO-Konten sichtbar machen.
- Keine Setup-Aenderung.
- Keine Werteingabe im FA G/L Journal.
- Keine Preview Posting.
- Kein `Post`.

Erst wenn ein Zielkonto fachlich plausibel und sichtbar belegt ist, darf ein separater Setup-Fit-Case vorbereitet werden.

## Buchwirkung

Kapitel 21 kann den Lernfall erklaeren: Eine Setupseite kann viele Konten zeigen, aber nur das konkrete Feld/Wert-Paar zaehlt. Ein leeres `Acquisition Cost Bal. Acc.` ist kein versteckter Freibrief fuer die Journalwerteingabe.
