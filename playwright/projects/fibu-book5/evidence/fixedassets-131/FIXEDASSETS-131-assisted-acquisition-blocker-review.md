# FIXEDASSETS-131 - Assisted-Acquisition-Blocker-Review

Status: `local-evidence-review`, `judge_work`, `no-bc-run`, `no-playwright-run`, `no-posting`, `not-final`.

## Situation

`FIXEDASSETS-130` hat in `MCP_1_20260210` / `RM-DEMO` read-only nach `Assisted Fixed Asset Acquisition` und `Acquire Fixed Assets` gesucht. Die Suche lieferte keinen verifizierbaren Page-/Wizard-Treffer. Der Screenshot ist deshalb korrekt `rejected/do-not-use-as-page-proof`.

## Microsoft-Learn-Abgleich

Microsoft Learn beschreibt den fachlichen Ablauf anders als eine frei suchbare Seite:

- Vor dem Erwerb muss die Anlage angelegt und ein AfA-Buch zugeordnet sein.
- Nach dem Ausfuellen der erforderlichen Felder erscheint eine Meldung, dass die Anlage erworben werden kann.
- Der Einstieg in die Assisted Fixed Asset Acquisition erfolgt ueber die Aktion `Acquire` auf der Anlagenkarte.
- Alternativ sind Purchase Order/Invoice oder Fixed Asset G/L Journal fachliche Routen, aber beide sind in diesem Labor aktuell aus separaten Evidence-Gruenden blockiert.

Quellen:

- https://learn.microsoft.com/en-us/dynamics365/business-central/fa-how-acquire
- https://learn.microsoft.com/en-us/training/modules/purchase-fixed-assets/

## Entscheidung

`Assisted Fixed Asset Acquisition` wird nicht weiter ueber Tell-Me wiederholt. Der FA-130-Blocker ist kein Navigationsproblem allein, sondern ein Hinweis auf den falschen Einstieg: Die Assisted-Route haengt am Anlagenkarten-/Acquire-Kontext.

Der naechste sichere praktische Schritt ist daher:

`FIXEDASSETS-132-FA-CNC-01-ACQUISITION-READINESS-CARD-READONLY`

Ziel: `FA-CNC-01` auf der `Fixed Asset Card` read-only oeffnen und pruefen, ob die Voraussetzungen fuer `ready to acquire` sichtbar sind:

- Zielanlage `FA-CNC-01`
- Beschreibung / Klasse / Unterklasse
- AfA-Buch `HGB`
- FA Posting Group `MACHINES`
- `Book Value = 0,00`
- sichtbare oder fehlende Ready-to-acquire-Meldung
- Status der Aktion `Acquire`

## Warum nicht Purchase Invoice oder FA G/L Journal?

Purchase Invoice bleibt fachlich laut Microsoft Learn valide, aber im Labor ist der Zeilentyp `Fixed Asset`/`Anlage` nicht stabil bewiesen. FA G/L Journal bleibt fachlich valide, aber Betrag-/Gegenkonto-Controls sind nicht ausreichend belegt. Beide Routen wuerden aktuell wieder in alte Blocker laufen.

## Buchwirkung

Kapitel 21 darf `Assisted Fixed Asset Acquisition` noch nicht als klickbare Suchseite zeigen. Fuer Anfaenger ist wichtiger:

1. Eine Anlage muss auf der Karte fachlich erwerbsbereit sein.
2. `Acquire` ist der Kontext-Einstieg, nicht zwingend ein Tell-Me-Seitentreffer.
3. Ein Suchoverlay-Screenshot ist Debugging-Evidence, kein Buchbild fuer den Prozess.

## Grenzen

- Kein neuer BC-Lauf.
- Kein neuer Screenshot.
- Kein Anlagenzugang.
- Keine Journalzeile.
- Keine Preview.
- Kein `Post`.
- Kein deutscher Finalnachweis.

## Naechster Schritt

`FIXEDASSETS-132`: read-only Anlagenkarten-Readiness pruefen. Kein Klick auf `Acquire`, keine Werteingabe, keine Preview, kein `Post`.
