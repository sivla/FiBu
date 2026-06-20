# FIXEDASSETS-125 - Anlagenzugangsroute nach Personalize auditieren

## Kontext

- Instanz: `MCP_1_20260210`
- Company: `RM-DEMO`
- Arbeitstyp: lokaler Evidence-Review
- Kein BC-Lauf
- Kein Playwright-Lauf
- Keine Buchung
- Keine Preview
- Keine Setup-Aenderung
- Keine Buchaenderung

## Bewertete Routen

| Route | Aktueller Belegstand | Nutzen fuer Buch/Lernen | Grenze | Entscheidung |
|---|---|---|---|---|
| Purchase Invoice | Card-/Lines-Kontext ist belegt; `Type` ist sichtbar; Personalisieren zeigt `Lines` und `Type` | Fachlich bester Anfaengerpfad fuer kreditorischen Anlagenzugang | `Fixed Asset`/`Anlage` wurde nicht als Zeilentyp-Option bewiesen | Vorerst stoppen |
| FA G/L Journal | Zielzeilen-Shell mit `G05001`, `Fixed Asset`, `FA-CNC-01`, `HGB`, `Bal. Account Type = G/L Account` sichtbar | Wertvoll fuer Journal-/Spaltenverstaendnis | Betrag `68000`, Gegenkonto `K30000` und stabile aktive Controls fehlen; Active-Cell-Probe verlor Kontext | Nicht fuer Werteingabe/Preview/Post |
| Acquire auf Anlagenkarte | Aktion auf `FA-CNC-01` sichtbar, aber disabled; Book Value `0,00` sichtbar | Bester Debugging-Hebel: Warum deaktiviert BC eine fachlich erwartete Aktion? | Ursache nicht bewiesen; kein Wizard, kein Zugang | Naechster praktischer Diagnose-Case |

## Entscheidung

Der naechste praktische Fixed-Assets-Schritt soll nicht noch einmal die Einkaufsrechnungszeile und nicht das FA-G/L-Journal bearbeiten. Stattdessen wird die deaktivierte `Acquire`-Aktion auf `FA-CNC-01` gezielt diagnostiziert.

Naechster Case:

`FIXEDASSETS-126-FA-CNC-01-ACQUIRE-ACTION-CAUSE-DIAGNOSIS-READONLY`

## Warum diese Entscheidung sinnvoll ist

1. Der Purchase-Invoice-Zeilentyp-Pfad hat zu viele wiederholte Negativbefunde. Weitere UI-Probes waeren teuer und wuerden wahrscheinlich denselben Blocker bestaetigen.
2. Der FA-G/L-Journal-Pfad enthaelt eine persistent wirkende Zielzeile; ohne sichere Werte-/Cleanup-Strategie ist jede weitere Wertprobe riskant.
3. Die `Acquire`-Aktion ist fuer Anfaenger didaktisch stark: Man sieht eine erwartete Aktion, aber Business Central sperrt sie. Das ist ein typischer Lern- und Fehleranalysefall.
4. Eine reine Ursache-Diagnose kann ohne Buchung, ohne Preview und ohne Wertaenderung laufen.

## Naechster Case - harte Grenzen

Erlaubt fuer FA-126:

- `FA-CNC-01` Fixed Asset Card oeffnen
- Instanz/Company pruefen
- `Acquire`/Anschaffung-Aktion sichtbar und enabled/disabled pruefen
- falls noetig Page Inspection nutzen
- falls noetig Edit-Modus nur zur Aktionszustandsdiagnose oeffnen, aber keine Feldwerte aendern
- Screenshot/Evidence nur an fachlich sichtbaren Kontrollpunkten

Gesperrt fuer FA-126:

- `Acquire` ausfuehren
- Preview Posting
- Post
- Setup Change
- Feldwerte aendern
- neue Anlage
- Einkaufsrechnung
- FA-G/L-Journal-Wertprobe
- Company-Wechsel
- API-Shortcut
- Buchaenderung

## Buchwirkung

Kapitel 21 sollte spaeter erklaeren, dass sichtbare Aktionen in Business Central nicht automatisch nutzbar sind. Eine deaktivierte Aktion ist kein Bedienfehler, sondern ein Signal: Der aktuelle Datensatz, Modus, Setup-Stand oder Prozesszustand erfuellt eine Bedingung nicht. FA-126 soll genau diesen Diagnosepunkt fuer `Acquire` belegen.
