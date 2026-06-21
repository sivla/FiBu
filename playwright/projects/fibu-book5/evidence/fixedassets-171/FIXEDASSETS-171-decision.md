# FIXEDASSETS-171 - FA Balancing Account Setup-Fit Review

Status: `labor`, `local-evidence-review`, `no-bc-run`, `no-playwright-run`, `no-posting`.

## Ausgangspunkt

`FIXEDASSETS-170` hat auf der `FA Posting Group Card` fuer `MACHINES` den bisher leeren Wert `Acquisition Cost Bal. Acc.` kontrolliert auf `82000` gesetzt. Der Lauf belegt:

- Instanz: `MCP_1_20260210`
- Company: `RM-DEMO`
- Seite: `FA Posting Group Card`
- Zielgruppe: `MACHINES`
- Zielfeld: `Acquisition Cost Bal. Acc.`
- Vorher: leer
- Nachher: `82000`
- keine Journalwerte
- keine Preview Posting
- kein `Post`
- kein Draft
- kein Company-Wechsel
- kein API-Shortcut
- keine Buchaenderung

## Entscheidung

FA-170 wird als ausreichender CRONUS-USA-Labor-Setup-Fit akzeptiert. Der vorherige Setup-Blocker `MACHINES / Acquisition Cost Bal. Acc. leer` ist fuer den Laborpfad geloest.

Die Entscheidung schaltet aber nur einen sehr engen naechsten Schritt frei: einen spaeteren `Fixed Asset G/L Journal`-Preflight, der prueft, ob die vorhandene geschuetzte Laborzeile mit dem Setup-Gegenkonto `82000` als `G/L Account` vorbereitet werden kann.

## Warum nicht sofort Preview oder Post?

Der Nachweis belegt nur die Anlagenbuchungsgruppe, nicht die Journalzeile und nicht die Buchungswirkung. Noch offen sind:

- ob die bestehende Journalzeile weiterhin eindeutig `G05001` / `FA-CNC-01` / `HGB` / `Acquisition Cost` zeigt
- ob `Amount` und `Bal. Account No.` im selben Zielkontext sicher bearbeitbar sind
- ob `Insert FA Bal. Account` oder die manuelle Gegenkonto-Eingabe wirklich `82000` erzeugt
- ob danach ein Journal Check oder Preview Posting fachlich sauber waere
- welche Sachposten und Anlagenposten entstehen wuerden

## Wichtige Grenze zu `K30000`

`K30000` bleibt fuer den aktuellen FA-G/L-Journalpfad gesperrt. FA-161/FA-162 haben gezeigt: Die sichtbare Journalzone erwartet `Bal. Account Type = G/L Account`. `K30000` ist ein Kreditor-/Vendor-Zielwert und gehoert zur Einkaufsrechnungsroute. Ein erneuter Versuch mit `K30000` in `Bal. Account No.` waere keine Optimierung, sondern Wiederholung eines fachlichen Fehlers.

## Naechster freigegebener Schritt

`FIXEDASSETS-172-FA-GL-JOURNAL-BALACCOUNT-82000-PREFLIGHT`

Erlaubt nur:

- BC/Playwright innerhalb `MCP_1_20260210` / `RM-DEMO`
- bestehende `Fixed Asset G/L Journals`-Zeile identifizieren
- Zielkontext `G05001` / `FA-CNC-01` / `HGB` / `Acquisition Cost` pruefen
- `Amount`, `Bal. Account Type` und `Bal. Account No.` sichtbar machen
- nur wenn Zielkontext eindeutig ist: das Setup-Gegenkonto `82000` als G/L-Gegenkonto pruefen oder ueber `Insert FA Bal. Account` vorbereiten
- Ergebnis beweisen und stoppen

Weiter verboten:

- Preview Posting
- `Post`
- neue Journalzeilen
- Cleanup/Loeschen
- Company-Wechsel
- API-Shortcut
- Buchaenderung
- deutscher Finalnachweis

## Buchwirkung

Kapitel 21 kann spaeter erklaeren: Anlagenbuchungsgruppen steuern nicht nur Anlagen- und Gegenkonten, sondern koennen bei der Journalroute auch ein Balancing-Account-Gap verursachen. Fuer Anfaenger ist wichtig: Erst Setup-Feld sichtbar nachweisen, dann Journalwerte pruefen; ein sichtbares Konto im Kontenplan reicht nicht.
