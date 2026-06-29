# FIXEDASSETS-297 AfA-Ursachenpruefung read-only

Status: labor-blocked, needs-german-final-rebuild

## Was wurde geprueft?

Zwei vorhandene read-only Diagnosepfade wurden erneut ausgefuehrt und als aktueller FA-297-Befund zusammengefuehrt:

- FA-269: AfA-Faelligkeit / Journal-Kontext fuer den alten Beleg FADEP-267-OK.
- FA-277: FA-CNC-01 Buchwert-/Page-Inspection-Kontext und Journal-Recheck.

## Was ist bewiesen?

- Instanz und Company blieben MCP_1_20260210 / RM-DEMO.
- FADEP-267-OK hatte plausibel das alte Datumsproblem: Ziel-AfA-Datum 30.06.2026 lag vor Zugang 01.01.2027.
- FA-CNC-01 hat weiterhin sichtbaren Zugangskontext G05001 und Buchwertkontext 120.000.
- In den geprueften Fixed Asset G/L Journal Kontexten war keine erzeugte FADEP-Zeile sichtbar.

## Was ist nicht bewiesen?

- Keine exakte Ursache fuer die spaetere fehlende FADEP-295-OK-Zeile nach 31.01.2027.
- Kein AfA-Preview-Posting.
- Keine AfA-Buchung.
- Kein deutscher Finalnachweis.

## Entscheidung

Die AfA-OK-Wiederholung fuer FA-CNC-01 wird geparkt. Ein weiterer OK-/Preview-/Post-Versuch ist erst sinnvoll, wenn eine neue, nicht wiederholte Hypothese den Ausgabekontext oder die AfA-Berechtigung feldsicher erklaert.

## Sicherheitsstatus

- Kein Calculate-Depreciation-OK.
- Kein Preview Posting.
- Kein Post.
- Kein Setup Change.
- Kein Company Switch.
- Kein API Shortcut.

## Naechster praktischer Schritt

P2P-036 soll den bereits gebuchten P2P032-Laborbeleg read-only besser aufklappen und die Postenarten, Betraege und Konten sichtbarer dokumentieren.
