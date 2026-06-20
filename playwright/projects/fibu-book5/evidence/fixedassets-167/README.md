# FIXEDASSETS-167 Evidence Index

Case: `FIXEDASSETS-167-FA-BALACCOUNT-SETUP-FIT-DECISION`

Status: `labor`, `local-judge`, `no-bc-run`, `no-playwright-run`, `no-setup-change`, `no-posting`

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-167-decision.md` | Entscheidung | Die sichtbaren Konten `14160` und `11400` aus FA-166 reichen nicht als sichere Zielwerte fuer `Acquisition Cost Bal. Acc.` | Keine UI-Auswahl, kein Setup-Fit, keine Werteingabe, keine Preview, keine Buchung | accepted |
| `FIXEDASSETS-167-result.json` | normalisierbares Result | State-/Coverage-Folge: naechster Case soll feldlokale Lookup-/Muster-Evidence liefern | Keine neue BC-Evidence und kein deutscher Finalnachweis | accepted |

## Kurzbefund

FA-166 beweist, dass `Chart of Accounts` in `MCP_1_20260210` / `RM-DEMO` sichtbar ist und die Kontozeilen `14160` sowie `11400` enthalten sind. FA-167 bewertet diese Kontozeilen nur fachlich und lokal.

Entscheidung: Kein Kandidat wird fuer einen Setup-Fit freigegeben. Ein spaeterer UI-first Schreibfall waere erst vertretbar, wenn der Wert im feldlokalen Kontext von `FA Posting Group Card` -> `MACHINES` -> `Acquisition Cost Bal. Acc.` oder durch ein vorhandenes vergleichbares FA-Posting-Group-Muster belegt ist.

## Naechster Schritt

`FIXEDASSETS-168-FA-BALACCOUNT-FIELD-LOOKUP-READONLY`: read-only pruefen, welche Werte der konkrete Feld-/Lookup-Kontext von `Acquisition Cost Bal. Acc.` anbietet oder welche bestehenden FA Posting Groups ihre Balancing-Account-Felder nutzen. Kein Wert auswaehlen, nichts speichern, keine Werteingabe, keine Preview und kein Post.
