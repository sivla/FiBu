# PREP-045 - Bookmaster Foundation UAT Universaarl Cleanup

Status: `prep-done`

Instanzgrenze: `playthru`

Zielcompany: `UNIVERSAARL-DE` (`planned-not-yet-created`)

## Zweck

Nach PREP-044 war Kapitel 6 am Anfang auf den Universaarl-Zielpfad ausgerichtet. Direkt darunter standen aber noch eine Foundation-UAT-Übung mit alter Debitorlogik und ein Greenfield-Masterplan mit Rhein-Main-/RM-Companies als aktive Zielwelt. Dieser Lauf bereinigt genau diesen Anschlussbereich.

## Geändert

- Die Foundation-UAT-Übung verwendet jetzt `UNIVERSAARL-DE` und einen späteren Universaarl-B2B-Debitor statt `D10000` als aktive Zielübung.
- Die Übung beschreibt klar: Pflichtdimension prüfen, Fehler lesen, Dimension korrigieren, danach Sachposten und Dimension am Posten prüfen.
- Der Greenfield-Masterplan heißt jetzt `Greenfield-Masterplan der Universaarl GmbH`.
- Die Company-Tabelle beginnt mit `UNIVERSAARL-DE` und markiert weitere Companies als spätere Ausbaupfade.
- Shopify bleibt ausgeschlossen.

## Nicht gemacht

- Keine Business-Central-Ausführung.
- Kein Playwright.
- Keine Company Creation.
- Kein Setup.
- Keine Stammdaten.
- Kein Preview Posting.
- Kein Posting.

## Nächster sinnvoller Schritt

`TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE` bleibt nach Rechtefreigabe der erste Live-Schritt. Bis dahin können weitere aktive Kapitel-6-/Kapitel-7-RM-Zielweltstellen schrittweise auf Universaarl vorbereitet werden.
