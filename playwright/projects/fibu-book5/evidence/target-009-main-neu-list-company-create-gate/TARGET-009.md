# TARGET-009 Pfeil neben Neu: Neues Unternehmen erstellen

| Punkt | Ergebnis |
|---|---|
| Instanz | playthru |
| Seite | Mandanten / Companies, Page 357 |
| Zielcompany sichtbar | ja |
| Company vorher schon vorhanden | im letzten Verifikationslauf ja; zuvor ueber Assistent angelegt |
| Fehler sichtbar | nein |
| Copy/Test/CRONUS/API | nein |
| Company Switch | nein |
| Datenbasis | Neu erstellen - Keine Daten |
| Setup/Posting | nein |

## Screenshot-QA

Die Bildkette zeigt den fachlich wichtigen UI-Pfad:

1. `target-009-010-before-neu-dropdown-create.png`: Mandantenliste vor der Aktion.
2. `target-009-015-neu-dropdown-open-create-new-company-visible.png`: Pfeil neben `Neu` ist geoeffnet, `Neues Unternehmen erstellen` ist sichtbar.
3. `target-009-019-wizard-expanded-welcome.png`: Der Assistent ist geoeffnet und vergroessert.
4. `target-009-021-wizard-after-weiter.png`: Der Assistent zeigt die Eingabe-/Datenbasis-Seite.
5. `target-009-022-wizard-name-entered-no-data-selected.png`: `UNIVERSAARL-DE` ist eingetragen und `Neu erstellen - Keine Daten` ist sichtbar.
6. `target-009-024-wizard-after-third-weiter.png`: Der Abschlusszustand des Assistenten vor/um `Fertig stellen`.
7. `target-009-010-before-neu-dropdown-create.png` im Abschlusslauf: `UNIVERSAARL-DE` ist in der Mandantenliste sichtbar.

Die Bilder beweisen die Anlage-/Sichtbarkeitsstrecke. Sie beweisen noch keine Company Information, kein Foundation Setup, keine Nummernserie, keine Buchungsgruppe und keine Buchung.

## Buchnotiz

Die neue Company wird ueber `Mandanten`, den Pfeil neben `Neu` und den Eintrag `Neues Unternehmen erstellen` angelegt. Im Assistenten wird `UNIVERSAARL-DE` eingetragen und die Datenbasis `Neu erstellen - Keine Daten` verwendet. Dadurch entsteht keine CRONUS-Kopie, keine Testcompany und keine Company mit Beispieldaten.

Nach `Fertig stellen` wird die Mandantenliste erneut geprueft. Erst wenn `UNIVERSAARL-DE` sichtbar ist, geht es mit dem Wechsel in die Company und der Company Information weiter.
