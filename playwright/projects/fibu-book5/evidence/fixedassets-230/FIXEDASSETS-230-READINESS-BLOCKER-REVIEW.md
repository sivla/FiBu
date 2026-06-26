# FIXEDASSETS-230 - AfA-Readiness-Blocker lokal bewertet

Status: labor, local-evidence-review, no-bc-run, no-playwright-run, no-posting.

## Geprueft

Dieser Lauf hat keine neue Business-Central-Session gestartet. Bewertet wurden vorhandene Evidence-Packs aus:

- FIXEDASSETS-229: Anlagenkarte, HGB-AfA-Buchliste und Anlagenposten read-only.
- FIXEDASSETS-204: HGB Depreciation Book Card/Listenkontext mit sichtbarem G/L-Integration-Wording.
- FIXEDASSETS-206: Page Inspection auf der HGB Depreciation Book Card.

## Entscheidung

Die Abschreibungs-Readiness wird nicht freigegeben.

FA-229 beweist den Zugang und den Buchwert: Auf der Anlagenkarte ist FA-CNC-01 mit Book Value 120.000,00 sichtbar; die gebuchten Anlagenposten zeigen G05001, FA-CNC-01, HGB, Acquisition Cost und Betragssignal. Das reicht fuer den Nachweis: Die Anschaffung ist im Labor angekommen.

Es reicht aber nicht fuer den naechsten AfA-Preflight. FA-204 und FA-206 beweisen HGB-Kontext, G/L-Integration-Bereich und technische Feldcaptions wie G/L Integration - Acq. Cost. Sie beweisen nicht den konkreten Wert der Checkbox oder des Feldes. Eine Feldcaption in Page Inspection ist Feldexistenz, nicht automatisch Feldwert.

## Warum das fuer Anfaenger wichtig ist

Business Central trennt drei Dinge, die im Alltag leicht vermischt werden:

1. Anlagenkarte: zeigt Stammdaten und Buchwert der Anlage.
2. AfA-Buch: steuert Abschreibungs- und Integrationslogik.
3. Anlagenposten/Sachposten: zeigen, was tatsaechlich gebucht wurde.

Ein sichtbarer Book Value bedeutet: Der Zugang hat Wirkung auf der Anlage. Er bedeutet nicht: Die Abschreibung ist technisch und fachlich buchungsreif. Vor einer AfA-Journalzeile muss mindestens das HGB-AfA-Buch mit den relevanten Integrationswerten belastbar sichtbar oder technisch auslesbar sein.

## Buchwirkung

Kapitel 21 darf die Anschaffung FA-CNC-01/G05001 als CRONUS-USA-Laborzugang erklaeren. Es darf aber noch keinen AfA-Preflight, keine AfA-Buchung und keinen deutschen Finalnachweis freigeben. Fuer das Debugging-Kapitel ist der Lernfall wertvoll: Page Inspection ist stark, aber Feldnamen sind kein Wertnachweis.

## Naechster sicherer Schritt

FIXEDASSETS-231 soll rein read-only in Business Central pruefen, ob auf der HGB Depreciation Book Card der Wert fuer G/L Integration - Acq. Cost und idealerweise G/L Integration - Depreciation belastbar sichtbar oder per Page Inspection eindeutig als Wert nachweisbar ist. Keine Journalzeile, kein Preview Posting, kein Setup und keine Buchung.
