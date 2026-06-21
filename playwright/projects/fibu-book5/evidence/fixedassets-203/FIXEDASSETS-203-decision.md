# FIXEDASSETS-203 Entscheidung

Status: `labor`, `local-review`, `no-bc-run`, `no-playwright-run`, `not-final`.

## Entscheidung

FA-202 beweist, dass der alte Blocker aus FA-198/FA-199 geloest ist: `FA Posting Type` ist nicht mehr leer, sondern vor dem Preview-Klick als `Acquisition Cost` nachgewiesen.

FA-202 beweist aber keine Preview-Posten. Business Central oeffnet erneut `Error Messages` und meldet jetzt:

`FA Posting Type Acquisition Cost must be posted in the FA journal in Gen. Journal Line Journal Template Name='ASSETS',Journal Batch Name='DEFAULT',Line No.='10000'.`

Das ist fachlich ein neuer Blocker. Er spricht nicht gegen den Wert `Acquisition Cost` selbst, sondern gegen den verwendeten Journal-/Integrationsweg.

## Fachliche Einordnung

Microsoft Learn beschreibt zwei Routen fuer Anlagenbuchungen: `Fixed Asset G/L Journal` und `Fixed Asset Journal`. Die Route haengt am AfA-Buch bzw. an der `G/L Integration`: Wenn eine Aktivitaet in der G/L-Integration des AfA-Buchs aktiviert ist, wird dafuer das `Fixed Asset G/L Journal` verwendet. Ohne diesen Integrationsnachweis kann ein Fehler wie in FA-202 bedeuten, dass die Aktivitaet ueber das `FA Journal` laufen muss oder dass die Integration fuer `Acquisition Cost` im HGB-Labor-AfA-Buch fehlt.

Quellen:

- Microsoft Learn: [Set up fixed asset depreciation](https://learn.microsoft.com/en-us/dynamics365/business-central/fa-how-setup-depreciation)
- Microsoft Learn: [Acquire fixed assets](https://learn.microsoft.com/en-us/dynamics365/business-central/fa-how-acquire)

## Was jetzt belegt ist

- Instanz: `MCP_1_20260210`
- Company: `RM-DEMO`
- Seite: `Fixed Asset G/L Journals`
- Zielzeile: `ASSETS / DEFAULT / 10000`
- `FA Posting Type = Acquisition Cost` vor Preview belegt
- exakter `Preview Posting`-Menuepunkt geklickt
- kein `Post`, kein `Post and Print`, kein `OK`/`Yes`
- neuer Fehlerkontext: `Acquisition Cost must be posted in the FA journal`

## Was nicht belegt ist

- keine Preview-Postenzeilen
- keine Anlagenposten
- keine Sachposten
- keine Buchung
- kein deutscher Finalnachweis
- kein Nachweis, ob `HGB` die G/L-Integration fuer `Acquisition Cost` aktiviert hat

## Naechster kleiner Schritt

`FIXEDASSETS-204-HGB-GL-INTEGRATION-READONLY`: AfA-Buch `HGB` read-only oeffnen und die `Integration`/`G/L Integration`-Felder pruefen, insbesondere ob `Acquisition Cost` fuer das `Fixed Asset G/L Journal` aktiviert ist. Keine Setup-Aenderung.
