# FIXEDASSETS-107 - FA G/L Journal Line Ownership Decision

Status: `labor`, `local-review`, `no-bc-run`, `no-playwright-run`

## Entscheidung

Die aktuelle FA-G/L-Journalzeile wird nicht bereinigt und nicht neu aufgebaut. Sie ist eine nuetzliche Zielzeilen-Shell, aber noch keine komplette Anschaffungsbuchungszeile.

Der naechste praktische Schritt ist:

`FIXEDASSETS-108-FA-GL-JOURNAL-FULL-LINE-CONTROL-MAP-READONLY`

## Warum

`FIXEDASSETS-106` belegt read-only, dass die aktuelle Zeile bereits fachlich wichtige Zielwerte als Control-Werte enthaelt:

- `Document No. = G05001`
- `Account Type = Fixed Asset`
- `Account No. = FA-CNC-01`
- `Depreciation Book Code = HGB`
- `Bal. Account Type = G/L Account`

Gleichzeitig sind zwei entscheidende Werte nicht sichtbar belegt:

- Betrag `68000`
- Gegenkonto / `Bal. Account No.`

Die Balance zeigt `Number of Lines / Balance / Total Balance = 1 / 0,00 / 0,00`. Damit ist die Zeile nicht buchungsreif und auch nicht preview-reif. Sie ist aber wertvoll genug, um nicht blind geloescht oder neu erzeugt zu werden.

## Nicht freigegeben

- keine Betragserfassung
- kein Gegenkonto-Fix
- kein Cleanup
- keine Preview Posting
- kein `Post`
- keine Setup-Aenderung
- keine Anlagenzugangsbehauptung

## Freigegeben fuer FA-108

- `Fixed Asset G/L Journals` read-only oeffnen
- aktuelle Zielzeile anhand `G05001` / `FA-CNC-01` pruefen
- alle sichtbaren Input-/Select-Controlwerte der Zeile kompakt erfassen
- bei Bedarf horizontal scrollen, aber nichts eingeben
- klaeren, ob `Amount` und `Bal. Account No.` als Controls erreichbar/sichtbar sind
- erst danach entscheiden, ob ein enger Werte-Fit sinnvoll ist

## Buchwirkung

Fuer das Buch ist der Lernpunkt wichtig: In Business Central koennen Gridwerte technisch sichtbar sein, obwohl sie im normalen Seitentext nicht auftauchen. Ein Anfänger muss lernen, dass ein Journal erst dann buchungsreif ist, wenn Betrag, Buchungsart, Konto, Gegenkonto und Balance zusammen plausibel sichtbar sind.
