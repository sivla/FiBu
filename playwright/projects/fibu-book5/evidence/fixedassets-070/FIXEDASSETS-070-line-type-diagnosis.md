# FIXEDASSETS-070 - Line Type Selection Diagnosis

Status: `local-analysis`, `labor`, `no-bc-run`, `no-playwright-run`, `not-final`

## Befund

`FIXEDASSETS-066` hat den Einkaufsrechnungs- und Zeilenkontext erreicht, aber die Zeile blieb sichtbar auf `Item`. Der Guard hat deshalb korrekt mit `blocked-item-line-type-visible` gestoppt.

Das ist fachlich richtig: Solange `Type = Fixed Asset` nicht sichtbar im Zeilenkontext nachgewiesen ist, waeren `K30000` oder `FA-CNC-01` keine belastbare Anlagenkauf-Evidence.

## Warum das wichtig ist

Eine Einkaufsrechnung kann je nach Zeilentyp sehr unterschiedliche fachliche Wirkung haben. `Item` prueft Artikel-/Lagerlogik; `Fixed Asset` prueft Anlagenlogik. Fuer Kapitel 21 muss zuerst sichtbar bewiesen werden, dass die Zeile wirklich eine Anlagenzeile ist.

## Naechster sicherer Schritt

Read-only Diagnose:

- Page Inspection fuer Purchase Invoice / Lines Kontext
- Personalize oder Action Inventory, um zu klaeren, ob `Type`/`Fixed Asset` verfuegbar oder ausgeblendet ist
- keine Zielwerte, kein `New/Neu`, kein `Edit`, kein `Delete`

Ein weiterer draft-faehiger Zeilentyp-Auswahllauf braucht wieder ausdrueckliche Freigabe.
