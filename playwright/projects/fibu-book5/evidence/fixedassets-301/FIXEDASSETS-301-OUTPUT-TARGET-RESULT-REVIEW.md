# FIXEDASSETS-301 Output-Target-Review

Status: `labor-blocked`, `labor-sufficient-for-book-draft`, `needs-german-final-rebuild`.

## Entscheidung

FA-300 wird als UI-/Route-Nachweis akzeptiert: Page `5629` zeigt im Labor `Fixed Asset Journals` und unterscheidet sich von `Fixed Asset G/L Journals` Page `5628`.

FA-300 wird nicht als AfA-Ausgabe- oder Posting-Nachweis akzeptiert: Weder `FADEP-291-OK` noch `FADEP-295-OK`, generisches `FADEP-`, `FA-CNC-01` oder `HGB` waren auf Page `5629` sichtbar.

## Gate-Folge

- Kein Preview Posting freigeben.
- Keine AfA-Buchung freigeben.
- Kein weiteres `Calculate Depreciation OK` ohne neue, nicht wiederholte Hypothese.
- Fixed-Assets-AfA bleibt im RM-DEMO-Labor blockiert, aber der Lernpunkt ist buchdraft-faehig.

## Lernpunkt fuer Anfaenger

`Fixed Asset Journals` zu finden reicht nicht. Nach `Calculate Depreciation` muss eine konkrete Journalzeile sichtbar sein. Fehlt die Zeile, ist das kein versteckter Erfolg, sondern ein Stoppsignal: erst Ausgabeziel, Filter, Batch, AfA-Faelligkeit und Setup klaeren, dann ueber Preview/Post nachdenken.

## Naechster Schritt

FA-302 soll die AfA-Strecke bewusst parken oder einen wirklich neuen Prozesshebel waehlen. Nicht weiter blind `OK`, `Preview Posting` oder `Post` versuchen.
