# ARTIFACTS-001 - Projektartefakte, Handover und Repo-QA

Datum: 2026-06-09

Umgebung: `MCP_1_20260210`

Company: `RM-DEMO`

Arbeitsart: `book-sync` / `readiness`

Status: `labor-governance`, `no-bc-run`, `no-setup-change`, `no-posting`, `not-final`, `de-final-open`

## Ziel

Kapitel 39 beschreibt Projektartefakte: Fit-Gap-Matrix, Prozessaufnahme, Stammdaten-Template, Migration-Mapping, UAT-Testfall, Klickanleitungs-Template, Rollen-/Berechtigungsmatrix, Change Requests, ADRs und Checklisten. Dieser Lauf ordnet diese Artefakte gegen den aktuellen Projektstand ein.

## Gepruefte Projektwahrheit

- `AUTOPILOT-STATE.json` und `POSTING-AND-SETUP-GATES.md` sind die fuehrenden Ausfuehrungs- und Sperrdateien fuer autonome Laeufe.
- `CURRENT-STATE.md`, `LAB-FIT-STATUS.md`, `MASTERDATA-BACKLOG.md`, `BOOK-CLICK-GUIDE-COVERAGE.md`, `UI-INVENTORY.md`, `SCREENSHOT-QA.md`, `WORKAROUNDS-AND-ERRORS.md` und `FINDINGS.md` bilden die Handover- und QA-Schicht.
- Evidence-Ordner unter `playwright/projects/fibu-book5/evidence/` dokumentieren konkrete Laborlaeufe, Buch-Syncs oder Readiness-Befunde.
- Bilder liegen projektbezogen unter `playwright/projects/fibu-book5/img/`.

## Ergebnis

Kapitel 39 ist jetzt als Artefakt- und Handover-Schicht markiert. Die Templates sind Arbeitsmittel fuer Consultants, Key User, Autoren und spaetere Codex-Agenten. Sie sind kein eigenstaendiger Beweis dafuer, dass ein Business-Central-Prozess bereits geklickt, gebucht, fotografiert oder im deutschen Zielmandanten final nachgewiesen wurde.

Ein Evidence Pack braucht immer mindestens eine konkrete Quelle:

- sichtbarer UI-Zustand oder Screenshot,
- kompakter Seitentext,
- JSON-Ergebnis aus dem Lauf,
- gebuchter oder vorbereiteter Beleg,
- Nebenbuchposten, Sachposten, Artikelposten, Wertposten oder Bericht,
- Fehlerbild mit Ursache, Loesung und Buchwirkung.

## Gate-Hinweis

Der zuletzt gelesene Autopilot-V2.2-Prompt beschreibt erweiterte autonome Buchungsmoeglichkeiten. Fuer diesen Lauf bleiben aber die Repo-Dateien massgeblich: `AUTOPILOT-STATE.json` und `POSTING-AND-SETUP-GATES.md` sperren Zahlungen, OP-Ausgleich, Analysis-View-Setup, DE-VAT-Setup, Security, Migration, Integrationen, Operations, neue Companies und Wiederholungsbuchungen weiterhin, solange kein konkretes Gate freigegeben ist.

## Anfaenger-Lernwert

Ein Anfaenger soll verstehen: Eine Vorlage ist eine Checkliste, kein Nachweis. Wenn in einem Artefakt steht "Sachposten pruefen", ist der Nachweis erst erbracht, wenn die passende BC-Seite mit dem richtigen Beleg, der richtigen Company, den richtigen Posten und der richtigen Labor-/Final-Kennzeichnung dokumentiert ist.

## Buchwirkung

Kapitel 39 erhaelt eine Statusbox und eine klare Regel: Projektartefakte machen das Buch reproduzierbar und uebergabefaehig, aber sie ersetzen keine Klickanleitung und kein Evidence Pack. Jede Anleitung muss weiterhin Business-Central-Bedienung, Feldlogik, Pruefhinweis, Fehlerbild und Nachweis verbinden.

## Grenzen

- Kein Business-Central-Lauf.
- Keine Screenshots.
- Keine Setup- oder Stammdaten-Aenderung.
- Keine Buchung.
- Kein deutscher Finalnachweis.
- Keine Aussage, dass alle Templates praktisch angewendet oder abgenommen wurden.

## Naechster sinnvoller Schritt

`SOURCES-001-READINESS`: Kapitel 40 Quellenverzeichnis gegen Primaerquellenlogik, Microsoft-Learn-Bezug, Quellen-/Evidence-Regeln und den gestrichenen Shopify-Scope synchronisieren. Auch dieser Schritt ist ohne Gate ein Buch-/Readiness-Sync ohne BC-Ausfuehrung.
