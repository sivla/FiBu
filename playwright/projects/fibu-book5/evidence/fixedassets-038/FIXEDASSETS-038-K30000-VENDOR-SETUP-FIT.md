# FIXEDASSETS-038 - K30000 Vendor Setup Fit

Status: `labor`, `ui-first`, `setup-proof`, `vendor-masterdata`, `no-posting`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Zielkreditor | K30000 / Zollspedition Nord GmbH |
| Aktion | created-k30000-then-idempotent-confirmed |
| Status | fit-visible-cleanup-done |
| Gebucht | nein |

## Ergebnis

`K30000` ist in `RM-DEMO` sichtbar. Der erste erfolgreiche UI-first Lauf hat einen von Business Central automatisch erzeugten Kreditorenentwurf `V00030` auf den Zielkreditor `K30000` / `Zollspedition Nord GmbH` umgesetzt. Der finale Wiederholungslauf hat den Zielkreditor idempotent bestaetigt und den frueher versehentlich entstandenen Entwurf `V00020` ueber die UI geloescht.

## Was man in Business Central sieht

- Die Kreditorenliste ist der richtige Stammdatenkontext fuer `K30000`.
- Wenn `K30000` fehlt, muss zuerst eine Kreditorenkarte entstehen oder der Lauf muss sauber abbrechen.
- Nach dem Speichern zaehlen nur sichtbare Karten-/Listenwerte: Nummer, Name und die Defaults, die Business Central fuer Zahlungs- und Buchungslogik vorgibt.
- Der Vendor-Template-Dialog kann sofort einen Auto-Number-Draft erzeugen. Fuer Playwright und Buchbilder gilt deshalb: nicht der Template-Dialog ist der Nachweis, sondern der sichtbare Zielkreditor nach Save/Neuoeffnen.
- Direkte DOM-Wertsetzung ist in BC-Karten kein belastbarer Weg; die korrigierte Route nutzt echte Playwright-Eingaben und bestaetigt den BC-Dialog zur Aenderung verbundener Datensaetze.

## Buchwirkung

Kapitel 21 kann die Kreditorenanlage als eigene Einrichtungsschicht vor der Anlagen-Einkaufsrechnung fuehren. Ein fertiger Anlagenstamm plus fehlender Kreditor ist noch kein buchungsfaehiger Anlagenprozess.

Der Lernfall gehoert ausserdem in die technische Nachweisfuehrung: Nummernserien und Vorlagen koennen bei `New/Neu` bereits Datensaetze erzeugen. Anfänger sollen nach einem abgebrochenen oder fehlgeschlagenen Lauf immer pruefen, ob ein leerer Auto-Number-Entwurf entstanden ist, und diesen nur dann loeschen, wenn er eindeutig aus dem Laborlauf stammt und keine Posten/Belege traegt.

## Grenzen

- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher Finalnachweis.
- Keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.
- Keine Vendor-Bankdaten und kein API-Shortcut.
- Karten-Defaults wurden in diesem Lauf noch nicht vollstaendig fachlich bewertet und muessen vor einer spaeteren Einkaufsrechnung read-only geprueft werden.

## Naechster Schritt

FIXEDASSETS-039-K30000-VENDOR-CARD-DEFAULTS-READONLY: `K30000`-Kreditorenkarte read-only oeffnen und Vendor Posting Group, Gen. Bus. Posting Group, Payment Terms Code, Currency Code, Tax/VAT-Kontext und Blocked-Status sichtbar dokumentieren; noch keine Einkaufsrechnung, kein Zugang, keine AfA und keine Buchung.
