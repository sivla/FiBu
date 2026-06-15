# FIXEDASSETS-015 MACHINES Account Mapping Decision

Status: `labor`, `decision`, `setup-preparation`, `no-bc-run`, `no-posting`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Zielobjekt | FA Posting Group / Anlagenbuchungsgruppe `MACHINES` |
| Entscheidung | enger Folge-Setup-Fit freigegeben |
| Buchung | nein |
| Setup geaendert | nein |

## Genutzte Evidence

- `FIXEDASSETS-006` liest vorhandene CRONUS-FA-Posting-Groups read-only.
- Sichtbare Gruppen: `EQUIPMENT`, `GOODWILL`, `PLANT`, `PROPERTY`, `VEHICLES`.
- `MACHINES` ist in `RM-DEMO` nicht sichtbar und wurde nicht angelegt.
- `FIXEDASSETS-014` hat nur das AfA-Buch `HGB` erstellt.

## Quellenabgleich

Microsoft Learn beschreibt `FA Posting Groups` als Gruppen von Anlagen, deren Posten auf dieselben Sachkonten laufen. Die Seite `FA Posting Groups` bzw. `FA Posting Group Card` verwaltet G/L Accounts fuer verschiedene Arten von Kosten und Aufwendungen, darunter Anschaffungskosten, kumulierte Abschreibung, Abschreibungsaufwand, Wartung sowie Gewinn/Verlust bei Abgang.

Quellen:

- https://learn.microsoft.com/en-au/dynamics365/business-central/fa-how-setup-general
- https://learn.microsoft.com/en-us/dynamics365/business-central/application/base-application/page/microsoft.fixedassets.fixedasset.fa-posting-groups
- https://learn.microsoft.com/en-us/dynamics365/business-central/application/base-application/page/microsoft.fixedassets.fixedasset.fa-posting-group-card
- https://learn.microsoft.com/en-us/dynamics365/business-central/fa-how-acquire

## Entscheidung

Ein enger `MACHINES`-Setup-Fit ist fuer den naechsten Lauf vertretbar, wenn er strikt als CRONUS-USA-Laboralias zur bestehenden Gruppe `EQUIPMENT` ausgefuehrt wird.

Begruendung:

- Eine CNC-Maschine ist fachlich naeher an `EQUIPMENT` als an `GOODWILL`, `PROPERTY`, `PLANT` oder `VEHICLES`.
- `FIXEDASSETS-006` zeigt fuer `EQUIPMENT` das sichtbare Kontenmuster `12210` und `82000`.
- Der kompakte Seitentext zeigt die relevanten FA-Posting-Group-Felder, darunter `Acquisition Cost Account`, `Accum. Depreciation Account`, `Acq. Cost Acc. on Disposal`, `Accum. Depr. Acc. on Disposal`, `Gains Acc. on Disposal`, `Losses Acc. on Disposal`, `Maintenance Expense Account`, `Acquisition Cost Bal. Acc.` und `Depreciation Expense Acc.`.
- Der neue Code `MACHINES` ist fuer das Buch didaktisch sinnvoll, weil er die Kontenfindung als eigene Setup-Schicht sichtbar macht.

## Erlaubter naechster Lauf

`FIXEDASSETS-016-MACHINES-FA-POSTING-GROUP-FIT`

Erlaubt:

- in `MCP_1_20260210` und `RM-DEMO` bleiben
- `FA Posting Groups` UI-first oeffnen
- pruefen, ob `MACHINES` bereits sichtbar ist
- wenn `MACHINES` fehlt, genau eine Anlagenbuchungsgruppe `MACHINES` anlegen
- das sichtbare `EQUIPMENT`-Kontenmuster uebernehmen
- Vorher/Nachher-Evidence und Screenshot sichern, wobei das Nachher-Bild `MACHINES` und die relevanten Konten sichtbar zeigen muss

Nicht erlaubt:

- keine Anlage `FA-CNC-01`
- kein Kreditor `K30000`
- keine Einkaufsrechnung
- kein Anlagenzugang
- keine AfA-Berechnung
- keine Buchung
- kein deutscher Kontenplan- oder HGB-Finalnachweis

## Anfaenger-Lernwert

Eine Anlagenbuchungsgruppe ist keine Kategorie fuer die Anzeige. Sie ist Kontenfindung. Wenn `MACHINES` fehlt oder falsch gemappt ist, kann Business Central zwar eine Anlage zeigen, aber der Zugang oder die Abschreibung wuerden spaeter auf falsche oder fehlende Sachkonten laufen. Deshalb kommt `MACHINES` nach dem AfA-Buch `HGB`, aber vor der Anlagenkarte `FA-CNC-01`.

## Buchwirkung

Kapitel 21 darf `MACHINES` jetzt als naechsten Labor-Setup-Baustein beschreiben. Der Text muss weiter klar sagen: Das `EQUIPMENT`-Kontenmuster ist nur CRONUS-USA-Laborreferenz. Ein deutscher Zielmandant braucht eine eigene Kontenplanentscheidung und spaetere Buchungsvorschau/Postenspur.

## Naechster Schritt

`FIXEDASSETS-016-MACHINES-FA-POSTING-GROUP-FIT`: UI-first und idempotent `MACHINES` pruefen/anlegen, aber noch keine Anlage, keinen Kreditor und keine Buchung starten.
