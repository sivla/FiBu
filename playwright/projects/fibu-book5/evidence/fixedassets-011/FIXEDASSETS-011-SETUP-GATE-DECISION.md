# FIXEDASSETS-011 Setup-Gate-Decision

Status: `labor`, `governance`, `setup-gate-decision`, `no-bc-run`, `no-setup-change`, `no-posting`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Datenbasis | CRONUS USA |
| Bezug | `FIXEDASSETS-010-SETUP-PREFLIGHT-READONLY` |
| BC-Lauf in dieser Session | nein |
| Setup-Aenderung | nein |
| Buchung | nein |

## Entscheidung

`FIXEDASSETS-010` ist als Seiten- und Kontextnachweis ausreichend, aber noch nicht als Freigabe fuer ein datenveraenderndes Fixed-Assets-Setup.

Der naechste Lauf soll deshalb kein `MACHINES`, `HGB`, `FA-CNC-01` oder `K30000` anlegen. Sinnvoll ist zuerst ein enger, cancel-sicherer Formular-Preflight:

`FIXEDASSETS-012-SCOPED-NEW-CARD-PREFLIGHT`

Dieser Lauf darf die vier Zielkontexte UI-first oeffnen und die seitenbezogenen `New/Neu`- oder Kartenformulare nur so weit inspizieren, dass Pflichtfelder, Feldnamen, Templates, sichtbare Defaults und der sichere Abbruchweg dokumentiert werden. Es darf nichts gespeichert, angelegt, gebucht oder aktiviert werden.

## Warum noch kein Setup-Fit?

| Zielobjekt | Was ist belegt | Was fehlt vor Anlage |
|---|---|---|
| `MACHINES` | `FA Posting Groups` ist sichtbar; vorhandene CRONUS-Konten wie `EQUIPMENT`, `PLANT`, `VEHICLES` sind read-only bekannt | gescoptes `New/Neu`-Formular, Pflichtfelder, sichere Kontenquelle und Abbruchlogik |
| `HGB` | `Depreciation Books` ist sichtbar; `COMPANY` existiert | gescoptes Formular, Pflichtfelder und Entscheidung, ob `HGB` als Labor-AfA-Buch wirklich angelegt oder `COMPANY` als CRONUS-Labormapping genutzt wird |
| `FA-CNC-01` | `Fixed Assets` ist sichtbar; bestehende Anlagenlisten zeigen CRONUS-Beispiele | Anlagenkarten-Formular, Pflichtfelder, No.-Serie/No.-Eingabe, AfA-Buch-/Buchungsgruppenfeld und Abbruchlogik |
| `K30000` | `Vendors` ist erreichbar und gefiltert; Zielkreditor fehlt | Vendor-Template-/Kartenfluss, Pflichtfelder, Posting-/Payment-Gruppen und Abbruchlogik |

## Freigegebener naechster enger Preflight

Erlaubt in `FIXEDASSETS-012`:

- nur Sandbox `MCP_1_20260210` und Company `RM-DEMO`,
- breite Layoutansicht nutzen,
- `FA Posting Groups`, `Depreciation Books`, `Fixed Assets` und `Vendors` oeffnen,
- zielseitige `New/Neu`- oder Kartenformulare nur cancel-safe oeffnen,
- Pflichtfelder, Feldlabels, sichtbare Defaults, Templates und Abbruch-/Schliessen-Pfad sichern,
- Screenshots und kompakte Evidence schreiben,
- sofort abbrechen, wenn `New/Neu` global/mehrdeutig ist oder ein Speichern nicht sicher vermeidbar ist.

Nicht erlaubt in `FIXEDASSETS-012`:

- `MACHINES`, `HGB`, `FA-CNC-01` oder `K30000` speichern/anlegen,
- bestehende CRONUS-Werte aendern,
- Einkaufsrechnung, Anlagenzugang, AfA, Journal oder Buchung starten,
- `Post`, `Receive`, `Invoice`, `Acquire` oder aehnliche Buchungsaktionen ausfuehren,
- einen deutschen HGB-/Kontenplan- oder Steuer-Endstand behaupten.

## Anfaenger-Lernwert

In Business Central ist der Button `Neu` keine fachliche Freigabe. Er zeigt nur, dass ein Datensatz angelegt werden koennte. Vor dem Speichern muss ein Anwender verstehen, welche Felder Pflicht sind, welche Vorbelegungen BC setzt, welche Templates verwendet werden und wie man ohne Datenveraenderung wieder herauskommt.

Gerade bei Anlagen ist das wichtig, weil eine falsche Anlagenbuchungsgruppe, ein falsches AfA-Buch oder ein ungeeigneter Kreditor spaeter falsche Sachposten, falsche Abschreibungslogik oder Buchungsblocker erzeugen kann.

## Buchwirkung

Kapitel 21 sollte den naechsten Bildblock nicht als Stammdatenanlage darstellen, sondern als sicheren Formular-Preflight: "Was passiert, wenn ich `Neu` oeffne, welche Felder erwartet BC, und woran erkenne ich, dass ich noch nicht speichern darf?"

Das ist ein sinnvoller Zwischenschritt fuer Anfaenger und fuer spaetere finale deutsche Screenshots.

## Naechster konkreter Schritt

`FIXEDASSETS-012-SCOPED-NEW-CARD-PREFLIGHT`: UI-first, cancel-safe Formulare fuer Anlagenbuchungsgruppen, AfA-Buecher, Anlagen und Kreditoren inspizieren; keine Datensatzanlage, keine Setup-Aenderung und keine Buchung.
