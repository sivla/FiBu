# FIXEDASSETS-129 - Acquire Route Hold or Alternative Decision

Status: `labor`, `local-review`, `judge_work`, `no-bc-run`, `no-playwright-run`, `no-posting`, `not-final`.

## Kontext

- Instanz: `MCP_1_20260210`
- Company: `RM-DEMO`
- Anlage: `FA-CNC-01`
- Grundlage: `FIXEDASSETS-126`, `FIXEDASSETS-127`, `FIXEDASSETS-128`

## Bewertete Evidence

| Route | Befund | Entscheidung |
|---|---|---|
| `Acquire` auf Anlagenkarte | Sichtbar, aber in FA-126 und FA-128 deaktiviert. Der gezielte Edit-/Stift-Probe aus FA-128 hat `Acquire` nicht aktiv gemacht. | Route vorerst halten/blockieren; nicht ausfuehren. |
| Einkaufsrechnung | Fachlich weiterhin plausibel, aber der Zeilentyp `Fixed Asset`/`Anlage` ist in der aktuellen UI trotz vieler Diagnosen nicht als auswaehlbarer Zeilentyp bewiesen. | Nicht erneut blind ueber Type-Dropdown/Personalisieren probieren. |
| FA G/L Journal | Zielzeilen-Shell vorhanden, aber Betrag und Gegenkonto sind nicht sicher als editierbare Controls bewiesen. | Kein Wertschreib-, Preview- oder Posting-Lauf. |
| Assisted Fixed Asset Acquisition | Microsoft Learn beschreibt diese Seite als Weg, Journalzeilen fuer Anlagenzugang automatisch zu erstellen und zu buchen. Diese Route wurde im Labor noch nicht als eigene Page-/Wizard-Route geprueft. | Naechster praktischer Preflight. |

## Quellenlage

Microsoft Learn beschreibt fuer Business Central, dass der Anlagenzugang durch Buchen einer Anschaffungstransaktion erfasst wird und nennt dabei relevante Gegenkonten wie Sachkonto, Bankkonto oder Kreditor. Die Dokumentation nennt ausserdem die `Assisted Fixed Asset Acquisition` Page als Moeglichkeit, die notwendigen Buchungsblattzeilen automatisch zu erstellen und zu buchen.

Quelle: <https://learn.microsoft.com/en-us/dynamics365/business-central/fa-how-acquire>

Microsoft Learn hat zusaetzlich ein Trainingsmodul zum Einkauf von Anlagen, also bleibt der Einkaufsbeleg fachlich wichtig. Fuer dieses Projekt ist der Einkaufsbeleg aber erst wieder sinnvoll, wenn der Zeilentyp-Pfad UI-first stabil bewiesen ist.

Quelle: <https://learn.microsoft.com/en-us/training/modules/purchase-fixed-assets/>

## Entscheidung

Die Kartenaktion `Acquire` wird fuer die naechsten Laeufe als blockierte Route gehalten. Sie ist sichtbar, aber nicht ausfuehrbar; FA-128 hat die naheliegende Edit-Modus-Hypothese praktisch widerlegt.

Der naechste sinnvolle Anlagenzugangs-Hebel ist nicht ein weiterer Klick auf `Acquire`, nicht ein weiterer Einkaufsrechnungs-`Type`-Dropdown-Probe und nicht FA-G/L-Journal-Wertschreibung. Der naechste Case soll stattdessen die offiziell dokumentierte Assisted-Acquisition-Route als read-only/preflight Page-Kontext pruefen:

`FIXEDASSETS-130-ASSISTED-ACQUISITION-PAGE-PREFLIGHT-READONLY`

Der naechste Lauf darf Business Central oeffnen, in `MCP_1_20260210` / `RM-DEMO` bleiben und die Assisted-Acquisition-Page oder den zugehoerigen Suchtreffer nur als Page-/Wizard-Kontext pruefen. Er darf keine Werte eintragen, keinen Zielasset speichern, keinen Finish-/OK-/Post-/Preview-Schritt ausfuehren und keine Journalzeilen erzeugen.

## Buchwirkung

Kapitel 21 sollte `Acquire` nicht als funktionierenden Klickpfad behandeln, solange die Aktion auf `FA-CNC-01` deaktiviert ist. Fuer Anfaenger ist der Lernwert gerade die Unterscheidung:

- sichtbare Aktion heisst nicht automatisch ausfuehrbar,
- Anlagenzugang ist ein Buchungsvorgang mit Postenspur,
- vor einem Buchungsweg muss die Page-/Wizard-Grenze und die spaetere Postenspur verstanden werden.

## Grenzen

- Keine BC-Ausfuehrung in FA-129.
- Keine Page geoeffnet.
- Kein Wizard gestartet.
- Keine Anschaffung, keine Preview, keine Buchung.
- Kein deutscher Finalnachweis.

## Naechster Schritt

`FIXEDASSETS-130`: Assisted Fixed Asset Acquisition nur read-only/preflight als Page-/Wizard-Kontext pruefen, mit harten Stopps vor Wertangabe, Journalerzeugung, Preview oder Posting.

