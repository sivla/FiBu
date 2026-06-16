# FIXEDASSETS-019 Evidence-Index

Status: `labor`, `readiness-decision`, `field-mapping-decision`, `no-bc-run`, `no-setup-change`, `no-posting`, `not-final`, `de-final-open`.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-019-result.json` | JSON-Ergebnis | Entscheidung, Begruendung, erlaubten Folgepfad und Sperren | keine gespeicherte Anlage und keine UI-Feldsetzung | labor |
| `FIXEDASSETS-019-FA-CNC-01-CARD-FIELD-MAPPING-DECISION.md` | Lernzusammenfassung | warum `FA-CNC-01` noch nicht gespeichert werden darf und welcher Mapping-Schritt fehlt | keinen Stammdatennachweis und keine Anlagenbuchung | labor |

## Kernaussage

`FIXEDASSETS-018` reicht noch nicht fuer einen sicheren UI-first Setup-Fit von `FA-CNC-01`. Die leere Anlagenkarte zeigt wichtige Grundfelder, Pflichtfelder und den AfA-Bereich, aber sie zeigt noch nicht sichtbar und belegbar, wo `AfA-Buchcode = HGB` und `Anlagenbuchungsgruppe = MACHINES` gesetzt werden. Deshalb bleibt das Speichern der Anlage gesperrt.

Der naechste kleinste Fortschritt ist `FIXEDASSETS-020-FA-CNC-01-CARD-MORE-FIELDS-MAPPING`: die Anlagenkarte erneut ohne Speichern oeffnen, `Mehr anzeigen` im Bereich `Depreciation Book` beziehungsweise relevante Diagnosewerkzeuge nutzen und nur dann einen spaeteren Setup-Fit freigeben, wenn `No.`, `Description`, Klasse/Unterklasse, AfA-Buch und Anlagenbuchungsgruppe eindeutig sichtbar/setzbar sind.
