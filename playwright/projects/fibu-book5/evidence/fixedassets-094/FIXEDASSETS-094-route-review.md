# FIXEDASSETS-094 - Acquisition Route Review

Status: labor, local decision, no BC run, no Playwright run, no posting

## Entscheidung

Der naechste sinnvolle Anlagenzugangsweg ist nicht `Acquire` und nicht sofort `Fixed Asset G/L Journals`, sondern eine read-only Diagnose der Einkaufsrechnungszeilen.

Ausgewaehlter naechster Case:

`FIXEDASSETS-095-PURCHASE-INVOICE-LINE-TYPE-CAPABILITY-DIAGNOSIS-READONLY`

## Vergleich der Routen

| Route | Stand | Nutzen | Grenze | Entscheidung |
|---|---|---|---|---|
| Purchase Invoice | Page-/New-Kontext und Cleanup-Signale aus FA-053/FA-077 vorhanden | Fachlich naheliegend fuer Anschaffung ueber Kreditor | `Type = Fixed Asset` in Zeilen ist noch nicht bewiesen | Naechste read-only Diagnose |
| Acquire auf Anlagenkarte | Sichtbar, aber deaktiviert | Guter Lernfall fuer deaktivierte Aktionen | Kein Wizard, keine Werteingabe, Ursache nicht bewiesen | Zurueckstellen |
| Fixed Asset G/L Journal | Page, Spalten und Aktionen sichtbar | Gut fuer Journal-/Spalten-Screenshots | Kein Delete/Cleanup, kein Keep-Draft genehmigt | Werteingabe bleibt gesperrt |

## Warum Purchase Invoice jetzt wieder sinnvoll ist

Die Einkaufsrechnung passt fachlich besser zum Buchziel "Anlagenzugang ueber Kreditor" als ein freies Journal. Sie hat ausserdem bessere Cleanup-Signale: Auf Einkaufsbelegen wurden `Delete` bzw. `Zeile loeschen` bereits sichtbar, waehrend beim FA G/L Journal kein sauberer Delete-Pfad nachgewiesen wurde.

Der Fehler im bisherigen Einkaufsbeleg-Weg war nicht die Fachlogik, sondern die UI-Faehigkeit: Der Zeilentyp `Fixed Asset` wurde nicht sichtbar/selectable nachgewiesen. Genau das soll FA-095 klaeren, ohne einen neuen Beleg anzulegen.

## Buchwirkung

Kapitel 21 sollte den Zugang noch nicht als gebucht darstellen. Es kann aber bereits erklaeren:

- Warum ein Anlagenzugang ueber Kreditor fachlich naheliegt.
- Warum sichtbare/deaktivierte Aktionen nicht automatisch ausfuehrbar sind.
- Warum Journale ohne Cleanup-Regel fuer Lernlaeufe riskant sind.
- Warum die Zeilenart in Einkaufsbelegen ein kritischer Kontrollpunkt ist.

## Naechster Schritt

FA-095 soll read-only pruefen:

- Welche Einkaufsrechnungszeilen-/Subform-Kontexte sichtbar sind.
- Ob `Type = Fixed Asset` als Option, Spalte, Personalisierungsfeld oder Page-Metadatum auffindbar ist.
- Ob Page Inspection oder Personalisieren als Debugging-/Buchkapitel-Hebel hilft.
- Ohne `New`, ohne Edit, ohne Werteingabe, ohne Preview, ohne Posting.
