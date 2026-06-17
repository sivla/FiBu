# FIXEDASSETS-037 - K30000 Vendor Setup Gate Decision

Status: `done-decision-no-bc-run`  
Instanz: `MCP_1_20260210`  
Company: `RM-DEMO`  
Datenbasis: `CRONUS USA`  
Modus: `vendor-setup-gate-decision`, `no-setup-change`, `no-posting`, `not-final`

## Entscheidung

`K30000` wurde in diesem Lauf nicht angelegt. Der naechste praktische Schritt darf genau ein enger UI-first Kreditor-Setup-Fit sein:

`FIXEDASSETS-038-K30000-VENDOR-SETUP-FIT`

Der Folgelauf darf `Vendors` / `Kreditoren` in `RM-DEMO` oeffnen, erneut `No. = K30000` filtern und, wenn der Kreditor weiterhin fehlt, genau die Kreditorenkarte fuer `K30000` vorbereiten oder anlegen. Danach muss die Karte read-only geprueft werden. Einkaufsrechnung, Anlagenzugang, AfA und jede Buchung bleiben gesperrt.

## Warum diese Freigabe jetzt sinnvoll ist

`FIXEDASSETS-036` zeigt den aktiven Filter `No. = K30000` und eine leere Kreditorenliste. Damit ist der Zielkreditor im Labor nicht sichtbar. Gleichzeitig ist `FA-CNC-01` nach `FIXEDASSETS-033` und `FIXEDASSETS-034` als Anlagenstammdatum sichtbar gefittet. Der naechste Blocker ist also nicht mehr die Anlagenkarte, sondern der Kreditor.

Microsoft Learn beschreibt die Kreditoranlage ueber Template-Auswahl und anschliessende Kreditorenkarte. Erst die fertige Kreditorenkarte kann auf Einkaufsbelegen genutzt werden. Posting Groups sind dabei nicht kosmetisch: Sie verbinden Stammdaten und Belege mit Sachkonten. Und beim Anlagenzugang kann Business Central den Zugang gegen einen Kreditor buchen. Daraus folgt fuer das Buch: Vor einer Einkaufsrechnung fuer `FA-CNC-01` muss `K30000` als eigener Stammdaten-Klickpfad sichtbar tragen.

Quellen:

- Microsoft Learn: `Register a new vendor - Business Central`  
  https://learn.microsoft.com/en-us/dynamics365/business-central/purchasing-how-register-new-vendors
- Microsoft Learn: `Posting group setup - Business Central`  
  https://learn.microsoft.com/en-au/dynamics365/business-central/finance-posting-groups
- Microsoft Learn: `Acquire fixed assets - Business Central`  
  https://learn.microsoft.com/en-us/dynamics365/business-central/fa-how-acquire

## Erlaubter naechster Scope

- `Vendors` / `Kreditoren` Page `27` in `RM-DEMO` oeffnen.
- Vorher erneut `No. = K30000` filtern.
- Wenn `K30000` sichtbar ist: nicht neu anlegen, sondern Karte oeffnen und Stammdaten lesen.
- Wenn `K30000` fehlt: `New/Neu` nur aus dem Vendor-Listen-Kontext starten.
- Template-Dialog nur nutzen, wenn sichtbar und eindeutig im Kreditoren-Kontext.
- Zielwerte:
  - `No. = K30000`
  - `Name = Zollspedition Nord GmbH`
- Sichtbare Defaults nach dem Speichern lesen und dokumentieren:
  - Vendor Posting Group
  - Gen. Bus. Posting Group
  - Payment Terms Code
  - Currency Code
  - Tax/VAT-Kontext
  - Blocked-Status
- Vorher-, Template-/Karten-, Nachher- und finale Kartenbilder sichern.

## Stop-Kriterien

Der Folgelauf muss abbrechen und Evidence schreiben, wenn:

- Business Central nicht `MCP_1_20260210` zeigt.
- Company nicht `RM-DEMO` ist.
- `New/Neu` in einen falschen oder global mehrdeutigen Kontext springt.
- der Template-Dialog nicht eindeutig zur Kreditoranlage gehoert.
- `No. = K30000` nicht setzbar ist oder ein anderer Datensatz die Nummer schon nutzt.
- Pflichtfelder leer bleiben und nicht sichtbar/default sicher erklaerbar sind.
- ein Einkaufsrechnungs-, Buchungs-, Anlagenzugangs- oder AfA-Dialog erscheint.

## Weiter gesperrt

- Einkaufsrechnung anlegen.
- Einkaufsrechnung buchen.
- Anlagenzugang buchen.
- AfA berechnen oder buchen.
- Kreditor-Bankdaten anlegen.
- Deutsche `19 %` USt, deutscher Kontenplan oder deutscher HGB-Endstand behaupten.
- Kreditoranlage per API shortcut.

## Anfaenger-Lernwert

Ein leerer Filter in der Kreditorenliste ist kein kleiner Bedienfehler. Er bedeutet: Der Lieferant steht fuer den Prozess noch nicht als Stammdatum bereit. In Business Central haengen an der Kreditorenkarte Zahlungsbedingungen, Verbindlichkeitslogik, Buchungsgruppen und Steuer-/Tax-Kontext. Wenn dieser Schritt uebersprungen wird, kann eine Einkaufsrechnung spaeter fachlich falsch oder gar nicht buchbar sein.

## Buchwirkung

Kapitel 21 darf nach der gefitteten Anlagenkarte nicht direkt zur Einkaufsrechnung springen. Die Klickanleitung braucht davor einen eigenen Kontroll- und Setupblock:

1. Kreditorenliste oeffnen.
2. `K30000` filtern.
3. Falls leer: Kreditoren-Setup-Fit ausfuehren.
4. Kreditorenkarte mit sichtbaren Defaults pruefen.
5. Erst danach Einkaufsrechnung oder Anlagenzugang vorbereiten.

## Naechster konkreter Schritt

`FIXEDASSETS-038-K30000-VENDOR-SETUP-FIT`: UI-first `K30000` als Kreditor anlegen oder bestaetigen, die Karte sichtbar pruefen, keine Einkaufsrechnung, kein Zugang, keine AfA und keine Buchung.
