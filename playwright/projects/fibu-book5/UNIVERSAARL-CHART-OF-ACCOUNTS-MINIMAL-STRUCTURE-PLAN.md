# Universaarl Minimal Chart of Accounts Structure Plan

Status: `paused-for-skr04-source-correction`

Case: `TARGET-026H-SKR04-CHART-OF-ACCOUNTS-SOURCE-CORRECTION`

Instanz: `playthru`

Company: `UNIVERSAARL-DE`

## Ziel

Der Kontenplan ist die Grundlage fuer alle spaeteren Buchungen. In `UNIVERSAARL-DE` ist der Kontenplan erreichbar. TARGET-026F hat technisch bewiesen, dass ein Sachkonto ueber die Business-Central-UI angelegt, geoeffnet, korrigiert und nach dem erneuten Oeffnen sichtbar geprueft werden kann.

Diese Struktur ist ein Arbeitsplan fuer das Buchprojekt. Nach der SKR04-Zielentscheidung darf sie nicht mehr als aktive Anlage-Liste verwendet werden, bis die Kontonummern quellenbasiert bereinigt sind.

## TARGET-026F: fachliche Korrektur

TARGET-026F hat `1200 Bank Saarland` als Bilanzkonto angelegt. Das ist als UI- und Screenshot-QA-Lernen wertvoll, aber nicht als SKR04-Zielkonto fuer Bank weiterzufuehren. Die SKR04-Referenz zeigt `1200` im Bereich Forderungen aus Lieferungen und Leistungen; Bank liegt im SKR04-Referenzbereich `1700` bis `1800`, mit `1800 Bank`. Deshalb muss `1200 Bank Saarland` vor weiteren Kontenplan-Schritten klassifiziert werden.

- `1200 Bank Saarland` bleibt vorerst ein technischer Setup-/UI-Lernbeweis.
- Das Konto darf nicht in VAT Setup, Buchungsgruppen, Bankkonten, Zahlungen oder Buchungen verwendet werden.
- Der naechste Case muss entscheiden, ob das Konto umbenannt, fachlich umgewidmet, gesperrt oder spaeter bereinigt wird.
- Weitere Sachkonten werden erst angelegt, wenn die SKR04-Nummern je Kontenfamilie quellenbasiert feststehen.

## SKR04-Regel ab jetzt

Universaarl nutzt fuer den aktiven deutschen Zielpfad SKR04. Deshalb gilt:

- Keine gemischte SKR03/SKR04-Liste als aktive Setup-Liste.
- Keine Buchbehauptung wie "deutscher Kontenplan steht", solange die Konten nicht als SKR04-Kandidaten belegt und in Business Central sichtbar geprueft sind.
- Keine VAT- oder Posting-Group-Setup-Zeile, bevor die zugeordneten Sachkonten quellenbasiert und sichtbar vorhanden sind.
- Quellen-/Fachpruefung kommt vor weiteren UI-Schreibschritten.

SKR04 ist eine Regel fuer die deutschen Universaarl-Companies. Spaetere Auslandsgesellschaften bekommen nicht automatisch SKR04, sondern einen zur jeweiligen Lokalisierung passenden Kontenplan mit eigener Steuer- und Posting-Evidence. Intercompany wird erst belastbar, wenn jede beteiligte Company ihren eigenen Kontenplan sauber eingerichtet hat.

Quelle fuer diesen Stop: DATEV beschreibt den SKR04-Kontenrahmen als Standardkontenrahmen mit Kontenklassen und Funktionen; die SKR04-2026-Referenz weist `1200` Forderungen und `1800` Bank aus. Die Detailzuordnung wird im naechsten Case in eine kleine Universaarl-Kontenliste ueberfuehrt.

## Minimal benoetigte Kontenfamilien

| Familie | Zweck im Buch | Bisheriger Kandidat | Status | Naechste Entscheidung |
| --- | --- | --- | --- | --- |
| Eigenkapital / Opening | Start- und Abgrenzungsbuchungen erklaeren | `0800` | `needs-skr04-source-check` | SKR04-Kandidat bestaetigen oder ersetzen |
| Bank | Zahlungen, Bankabstimmung | `1200` | `rejected-as-bank-for-skr04-target` | Korrekte SKR04-Banknummer quellenbasiert waehlen; bestehendes `1200 Bank Saarland` nicht verwenden |
| Forderungen | Debitorenbuchhaltung | `1400` | `needs-skr04-source-check` | Forderungs-/Sammelkonto fuer Debitoren quellenbasiert pruefen |
| Vorsteuer | Einkaufs-USt | `1576` | `needs-skr04-source-check` | Vorsteuerkonto erst nach USt-Quellen-/BC-Setup-Pruefung anlegen |
| Verbindlichkeiten | Kreditorenbuchhaltung | `1600` | `needs-skr04-source-check` | Kreditoren-/Verbindlichkeitenkonto quellenbasiert pruefen |
| Umsatzsteuer | Verkaufs-USt | `1776` | `needs-skr04-source-check` | Umsatzsteuerkonto erst nach USt-Quellen-/BC-Setup-Pruefung anlegen |
| Umsatzerloese | Verkaufserloese | `4400` | `needs-skr04-source-check` | Erloeskonto quellenbasiert pruefen |
| Wareneinsatz | Einkaufs-/Materialaufwand | `5400` | `needs-skr04-source-check` | Aufwands-/Wareneinsatzkonto quellenbasiert pruefen |
| Bestand | Lagerbewertung | `3980` | `needs-skr04-source-check` | Bestandskonto quellenbasiert pruefen |
| Anlagen | Anlagevermoegen | `0700` | `needs-skr04-source-check` | Anlagenkonto quellenbasiert pruefen |
| Abschreibung | AfA-Aufwand | `6220` | `needs-skr04-source-check` | AfA-Aufwandskonto quellenbasiert pruefen |
| Rundung / Differenz | kontrollierte Kleinabweichungen | `6990` | `needs-skr04-source-check` | Sonstiges Aufwandskonto nur bei echtem Prozessbedarf anlegen |

## Setup-Grenzen

Der Plan unlockt aktuell keinen weiteren Schreibvorgang. Der naechste UI-Case muss zuerst die SKR04-Entscheidung dokumentieren:

- Quelle/Referenz fuer SKR04-Kandidaten ist dokumentiert.
- Bereits angelegtes `1200 Bank Saarland` ist als nicht verwendbarer Bank-Zielkandidat markiert.
- Der naechste Schreibcase darf nur die quellenbasiert freigegebene, kleine Kontenliste bearbeiten.
- Keine VAT Posting Setup, Posting Groups oder Stammdaten werden im selben Schritt still mitgeaendert.

## Buchwirkung

Im Buch kann dieser Abschnitt spaeter als einfache Einfuehrung dienen, aber erst nach der SKR04-Bereinigung:

Eine Buchung braucht immer ein Zielkonto. Wenn Business Central einen Verkaufsbeleg bucht, landet der Nettoerloes auf einem Erloeskonto, die Umsatzsteuer auf einem Umsatzsteuerkonto und die Forderung auf einem Debitorensammelkonto. Beim Einkauf entstehen entsprechend Aufwand, Vorsteuer und Verbindlichkeit. Der Kontenplan macht diese Zielkonten sichtbar.

## Naechster Case

`TARGET-026H-SKR04-CHART-OF-ACCOUNTS-SOURCE-CORRECTION`

Dieser Case darf keine weiteren Konten blind anlegen. Er muss die SKR04-Zielnummern klaeren, `1200 Bank Saarland` als technischen Fehl-/Lernpfad behandeln und erst danach einen neuen kontrollierten Setup-Case freigeben.
