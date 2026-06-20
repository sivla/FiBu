# FIXEDASSETS-162 Bal. Account Type Decision

## Kontext

`FIXEDASSETS-161` sollte genau einen streng gegateten Werte-Preflight fuer die bestehende `Fixed Asset G/L Journals`-Zeile vorbereiten. Der Lauf stoppte vor jeder Werteingabe.

Die sichtbare rechte Journalzone zeigt:

- `Amount = 0,00`
- `Bal. Account Type = G/L Account`
- `Bal. Account No.` leer

Der geplante Zielwert `K30000` stammt aus dem Kreditor-/Vendor-Kontext fuer den Anlagenkauf.

## Entscheidung

Der Befund wird als `journal-route-mismatch` und `target-data-mismatch` klassifiziert.

`K30000` darf nicht als naechster Schreibwert fuer eine FA-G/L-Journalzeile mit `Bal. Account Type = G/L Account` verwendet werden. In Business Central bestimmt der Gegenkonto-Typ, aus welchem fachlichen Nummernkreis das Gegenkonto stammt. Ein Kreditorcode gehoert nicht blind in ein Feld, das aktuell ein Sachkonto erwartet.

## Was dadurch bewiesen ist

- FA-161 war ein berechtigter Stop vor Werteingabe.
- Die Journalroute braucht vor jeder Eingabe eine eigene Entscheidung fuer ein gueltiges G/L- oder Bank-Gegenkonto.
- Die Kreditorroute mit `K30000` gehoert fachlich eher zur Einkaufsrechnungsroute, solange kein Vendor-Balancing-Pfad im Journal sichtbar und freigegeben ist.

## Was nicht bewiesen ist

- Kein gueltiges G/L-Gegenkonto fuer die Journalroute.
- Kein Betrag `68.000` in der Journalzeile.
- Kein `K30000` als gueltiges Gegenkonto im FA-G/L-Journal.
- Keine Preview Posting.
- Keine Anlagenbuchung.
- Keine Anlagenposten.
- Kein deutscher Finalnachweis.

## Buchwirkung

Kapitel 21 sollte diesen Lernpunkt spaeter in der Klickanleitung erklaeren:

Eine sichtbare Gegenkonto-Spalte reicht nicht. Vor der Eingabe muss der Anwender pruefen, ob `Bal. Account Type` und `Bal. Account No.` zusammenpassen. Sonst entsteht ein scheinbar kleiner Klickfehler, der fachlich eine falsche Buchungsroute bedeutet.

## Naechster Schritt

`FIXEDASSETS-163-FA-GL-JOURNAL-GL-BALACCOUNT-READONLY`

Ziel: read-only klaeren, welches G/L- oder Bank-Gegenkonto fuer eine manuelle FA-G/L-Journal-Anschaffung in `RM-DEMO` ueberhaupt als Laborziel in Frage kommt. Der Lauf darf keine Werte eingeben, kein Preview Posting oeffnen und nicht buchen.
