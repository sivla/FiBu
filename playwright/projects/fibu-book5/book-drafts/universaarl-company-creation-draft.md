# Universaarl Company Creation Draft

Status: `universaarl-draft`, `german-final-candidate`, `TARGET-001-proven`, `TARGET-002-gate`.

## Was ist ein Environment?

Ein Environment ist die Business-Central-Umgebung, in der Companies liegen. Fuer dieses Buch ist die aktive Zielinstanz `playthru`. Alte Umgebungen wie `MCP_1_20260210` bleiben nur historische Laborreferenz.

## Was ist eine Company?

Eine Company ist der Mandant innerhalb einer Business-Central-Instanz. Sie enthaelt Stammdaten, Buchungslogik, Belege, Posten, Einrichtung und Auswertungen. Fuer das Buch soll `UNIVERSAARL-DE` die deutsche Zielcompany der `Universaarl GmbH` werden.

## Warum eine eigene Company?

Eine eigene Company verhindert, dass das Buch wie ein Mix aus Demo-, CRONUS-, Rhein-Main- und Universaarl-Welt wirkt. Sie macht die spaetere Beweiskette sauber:

- gleiche Musterfirma,
- gleiche Stammdatenlogik,
- gleiche Buchkapitel,
- deutsche Ziel-Evidence,
- klare Trennung von Labor und Final.

## Warum keine CRONUS-Stammdaten?

CRONUS/Demo-Daten sind gut zum Lernen, aber nicht die Zielwelt des Buches. Sie enthalten Beispielkonten, Beispielartikel, Beispielsteuerlogik und Beispielbelege, die nicht automatisch zur Universaarl GmbH passen. Deshalb darf eine Demo-/Kopie-/Testunternehmen-Route nicht unbesehen als finaler Buchstart bestaetigt werden.

## TARGET-001 Befund

TARGET-001 hat bewiesen:

- `playthru` ist per direkter URL erreichbar.
- Companies Page `357` ist read-only erreichbar.
- `UNIVERSAARL-DE` war in der Companies-Liste nicht sichtbar.
- Sichtbare Aktionen wie `Neu`, `Kopieren` und `Testunternehmen` wurden nur inventarisiert.
- Keine Suche, kein New, kein Setup, kein Company-Wechsel.

Evidence: `playwright/projects/fibu-book5/evidence/target-001/`.

## TARGET-002 Entscheidungslogik

TARGET-002 darf die Company nur erstellen, wenn eine sichere UI-first Route sichtbar und fachlich geeignet ist:

- bevorzugt blank/setup-only/production ohne Sample Data,
- kein CRONUS-Kopieren,
- keine Demo-Stammdaten als Zielbasis,
- kein Finish/OK ohne sichtbare Zielwerte und klare Wirkung.

Wenn nur `Testunternehmen`, Demo, Copy/Kopieren oder CRONUS-nahe Optionen sichtbar sind, muss TARGET-002 stoppen und den Blocker dokumentieren.

## TARGET-002 Befund

TARGET-002 hat die Companies-Seite erneut direkt geoeffnet. `UNIVERSAARL-DE` war nicht sichtbar. Die Aktion `Neu` oeffnete eine leere, nicht gespeicherte Mandantenzeile. Es wurden keine Zielwerte eingegeben und kein Speichern, Finish oder OK bestaetigt.

Der Lauf wurde bewusst gestoppt, weil eine direkte Listenzeilen-Route zwar nach Blank Company aussieht, aber fachlich erst als separater Execute-Case abgesichert werden muss. Ein Anfaenger soll hier lernen: Eine sichtbare leere Zeile ist noch keine gespeicherte Company und kein finaler sauberer Buchstart.

Evidence: `playwright/projects/fibu-book5/evidence/target-002/`.

## Was Anfaenger Lernen Sollen

Eine Company ist kein Ordner und kein Projektname. Sie ist der Buchungsraum. Wer die falsche Company kopiert oder mit Demo-Daten startet, zieht die falsche Welt in alle spaeteren Prozesse: Kontenplan, USt, Stammdaten, Belege, Posten und Screenshots.

Der saubere Weg ist:

1. Environment pruefen.
2. Companies-Seite oeffnen.
3. Zielcompany suchen.
4. Create-/New-Option verstehen.
5. Erst dann Company anlegen.
6. Danach Company Information, Setup und erste Belege neu beweisen.
