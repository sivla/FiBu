# FIXEDASSETS-167 - FA Balancing Account Setup-Fit Decision

Status: `labor`, `local-judge`, `no-bc-run`, `no-playwright-run`, `no-setup-change`, `no-posting`

## Ausgangspunkt

FA-164 hat die `FA Posting Group Card` fuer `MACHINES` sichtbar gemacht. Dort ist der Bereich `Balancing Account` und die Zeile `Acquisition Cost Bal. Acc.` sichtbar, aber ohne konkreten Wert.

FA-166 hat danach den Kontenplan read-only geoeffnet und zwei sichtbare Kandidaten aus dem Kontenplan dokumentiert:

| Konto | Sichtbarer Name | Bewertung |
|---|---|---|
| `14160` | `Advanced Payments for goods and services` | Nicht als Setup-Ziel freigegeben. Das Konto liegt sichtbar im Inventory-/Advance-Payments-Kontext und ist kein feldlokaler Nachweis fuer das Anlagen-Erwerbsgegenkonto. |
| `11400` | `Advanced Payments for Intangible Fixed Assets` | Nicht als Setup-Ziel freigegeben. Das Konto liegt sichtbar im Bereich intangible fixed assets und wirkt eher asset-/advance-payment-nah als allgemeines Erwerbs-Gegenkonto fuer `MACHINES`. |

## Quellen- und Evidence-Logik

Microsoft Learn beschreibt Fixed-Asset-Posting-Groups als die Stelle, an der Business Central die Sachkonten fuer Anlagenbuchungen definiert. Fuer automatische Gegenkonten beim `Insert FA Bal. Account`-Pfad verweist Learn auf die passenden Balancing-Account-Felder der FA Posting Group, nicht auf eine freie Kontenplanauswahl.

Quelle: [Set up general fixed assets information](https://learn.microsoft.com/en-us/dynamics365/business-central/fa-how-setup-general)

Microsoft Learn beschreibt ausserdem die manuelle Anlagenanschaffung ueber `Fixed Asset G/L Journals` mit `FA Posting Type = Acquisition Cost`; die eigentliche Buchungsreife entsteht aber erst durch korrekt gefuellte Journalfelder und passende Kontierung.

Quelle: [Acquire fixed assets](https://learn.microsoft.com/en-us/dynamics365/business-central/fa-how-acquire)

## Entscheidung

Keiner der in FA-166 sichtbaren Kandidaten wird als sicherer Wert fuer `MACHINES` / `Acquisition Cost Bal. Acc.` akzeptiert.

Gruende:

- FA-166 beweist Kontenplansichtbarkeit, aber nicht die feldlokale Auswahlbarkeit im Ziel-Feld.
- `14160` ist sichtbar als Inventory-/Advance-Payments-Konto und damit fachlich zu schwach fuer eine Maschinen-Anschaffung.
- `11400` gehoert sichtbar zum Bereich intangible fixed assets und passt nicht zum Maschinen-/Equipment-Zielbild.
- Ein Setup-Fit wuerde eine reale Kontenfindungsentscheidung erzeugen; dafuer reicht ein plausibel klingender Kontenname nicht.

## Buchwirkung

Kapitel 21 darf diesen Fall als Anfaengerfehler erklaeren:

> Ein Konto ist nicht richtig, nur weil es im Kontenplan sichtbar ist. Fuer Business Central zaehlt der konkrete Feldkontext: Welche Posting Group, welches Setupfeld und welcher spaetere Buchungspfad nutzen dieses Konto?

Das Bild aus FA-166 bleibt nuetzlich als Lernbild fuer Kontenplanlesen und Kandidatensuche. Es ist aber kein Setup-Fit-Bild und kein Buchungsfreigabe-Bild.

## Naechster sicherer Schritt

`FIXEDASSETS-168-FA-BALACCOUNT-FIELD-LOOKUP-READONLY`

Ziel:

- `FA Posting Group Card` fuer `MACHINES` oeffnen.
- Das Feld `Acquisition Cost Bal. Acc.` im richtigen Feldkontext read-only untersuchen.
- Wenn gefahrlos moeglich: Lookup/Feldliste nur oeffnen, keine Auswahl speichern.
- Alternativ oder ergaenzend: bestehende FA Posting Groups mit gefuellten Balancing-Account-Feldern read-only vergleichen.

Weiterhin gesperrt:

- Setup-Wert speichern
- `Amount` oder `Bal. Account No.` im FA G/L Journal eingeben
- Preview Posting
- Post
- deutscher Finalnachweis
