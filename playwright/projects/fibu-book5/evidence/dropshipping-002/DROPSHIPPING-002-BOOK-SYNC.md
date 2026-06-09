# DROPSHIPPING-002 Buch-Sync Kapitel 17

Status: `book-sync`, `labor`, `read-only-source`, `no-bc-run`, `no-setup-change`, `no-posting`, `gate-locked`, `not-final`.

## Quelle

`DROPSHIPPING-002` nutzt keine neue Business-Central-Ausfuehrung. Der Lauf synchronisiert Kapitel 17 mit der vorhandenen Evidence aus `DROPSHIPPING-001`.

| Feld | Wert |
|---|---|
| Umgebung | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Datenbasis | CRONUS USA |
| Quelle | `DROPSHIPPING-001` |
| Gate | `DROPSHIPPING-001-PROCESS` bleibt locked |
| Setup-Aenderung | nein |
| Buchung | nein |
| Shopify/Online Store | out of scope |

## Synchronisierte Buchwahrheit

Kapitel 17 beschreibt weiter das Zielbild eines Dropshipping-/Sonderverkaufsfalls `DS-24001`. In `RM-DEMO` ist dieses Zielbild noch nicht praktisch dropshippingfaehig belegt.

Praktisch belegt ist:

- `Sales Orders`, `Purchase Orders`, `Requisition Worksheets` und `Purchasing Codes` sind als BC-Standard-Einstiege sichtbar.
- `Drop Shipments` ist in diesem Lauf kein stabiler Tell-Me-Treffer.
- `D11000`, `K20000` und `SP-PUMP-01` sind in den gefilterten Listen nicht als konkrete Zielnummern sichtbar.

Nicht belegt ist:

- kein Verkaufsauftrag `DS-24001`;
- keine Einkaufsbestellung an `K20000`;
- kein gesetztes Dropshipping-Kennzeichen;
- kein Purchasing-Code-/Drop-Shipment-Setup-Endstand;
- keine Requisition-Worksheet-Aktion;
- keine Preview Posting;
- keine Verkaufs-/Einkaufsbuchung;
- keine Debitoren-, Kreditoren-, Sach-, USt-, Artikel- oder Wertposten aus dem Dropshipping-Fall;
- kein deutscher 19-%-USt-Finalnachweis;
- kein Shopify-/Online-Store-Scope.

## Anfaenger-Lernwert

Dropshipping beginnt fuer den Anwender wie ein normaler Verkauf, ist fachlich aber eine gekoppelte Verkaufs- und Einkaufsbelegkette. Ein sichtbarer Menuepunkt beweist nur, dass Business Central die Seite kennt. Er beweist nicht, dass der konkrete Kunde, Lieferant, Artikel, Beschaffungspfad, Einkaufsbezug, Steuerlogik und Lager-Negativnachweis tragen.

Wenn `D11000`, `K20000` oder `SP-PUMP-01` fehlen, ist der richtige naechste Schritt nicht `Buchen`, sondern ein UI-first Stammdaten- und Setup-Fit.

## Buchwirkung

Kapitel 17 enthaelt jetzt eine Statusbox:

- was `DROPSHIPPING-001` im Labor beweist;
- welche Zielobjekte fehlen;
- warum die Schrittfolge aktuell Zielpfad statt ausfuehrbarer RM-DEMO-Laborlauf ist;
- dass Verkaufsauftrag, Einkaufsbestellung, Preview und Buchung ohne Gate gesperrt bleiben;
- dass Shopify/Online Store out of scope bleibt.

Die Uebung und der UAT-Fall markieren den Prozess als Zielpfad nach Gate-Freigabe. Alte Shop-Begriffe im Kapitel wurden auf Dropshipping/Sonderverkauf umgestellt.

## Naechster Schritt

Ohne Gate ist Kapitel 17 nach diesem Sync vorerst abgeschlossen. Der naechste sichere Autopilot-Schritt ist ein anderer read-only oder Buch-Sync-Block, sofern `AUTOPILOT-STATE.json` keinen neuen Widerspruch zeigt.

Mit ausdruecklichem Gate waere der naechste Dropshipping-Schritt ein UI-first Setup-Fit fuer `D11000`, `K20000`, `SP-PUMP-01` und die Drop-Shipment-/Purchasing-Code-Logik, bevor `DS-24001`, eine Einkaufsbestellung oder eine Buchung geplant wird.
