# FIXEDASSETS-035 - K30000 Vendor Readiness Decision

Status: `done-decision-no-bc-run`  
Instanz: `MCP_1_20260210`  
Company: `RM-DEMO`  
Datenbasis: `CRONUS USA`  
Modus: `vendor-readiness-decision`, `no-setup-change`, `no-posting`, `not-final`

## Entscheidung

`K30000` wird in diesem Lauf nicht angelegt. Der naechste erlaubte Schritt ist nur ein UI-first, read-only Kreditor-Preflight:

`FIXEDASSETS-036-K30000-VENDOR-PREFLIGHT-READONLY`

Dieser Folgelauf darf die Seite `Vendors` / `Kreditoren` oeffnen, in breiter Layoutansicht nach `K30000` suchen oder filtern, den vorhandenen Vendor-Template-/Kartenkontext pruefen und beweisen, ob `K30000` fehlt oder bereits vorhanden ist. Er darf keine Kreditorenkarte speichern, keine Einkaufsrechnung erfassen, keinen Anlagenzugang buchen und keine AfA ausloesen.

## Warum dieser Gate noetig ist

`FA-CNC-01` ist jetzt als Labor-Anlagenstamm tragfaehig, aber ein Anlagenzugang ueber Einkaufsrechnung braucht zusaetzlich einen Kreditor. In Business Central ist der Kreditor nicht nur eine Adresse. Die Kreditorenkarte kann Zahlungsbedingungen, Waehrung, Kreditorenbuchungsgruppe, Geschaeftsbuchungsgruppe, VAT/Tax-Gruppen, Sperrstatus und ggf. Dimensionen beeinflussen.

Wenn der Kreditor falsch oder unklar ist, kann eine Einkaufsrechnung fachlich an den falschen Lieferanten, die falsche Verbindlichkeitslogik oder die falsche Steuerlogik gebunden werden. Deshalb ist `K30000` ein eigener Klickpfad vor Einkaufsrechnung und Anlagenzugang.

## Eingangsnachweise

- `FIXEDASSETS-012` zeigte nur den Vendor-Template-Dialog. Das beweist einen moeglichen Erfassungskontext, aber nicht den Zielkreditor `K30000`.
- `FIXEDASSETS-033` plus `FIXEDASSETS-034` belegen die bestehende `FA-CNC-01`-Karte als CRONUS-USA-Labor-Stammdatensatz.
- Kapitel 21 nennt `K30000` als Buchziel fuer den Anlagenzugang, aber der aktuelle Laborstand zeigt noch keinen Kreditorennachweis.
- `POSTING-AND-SETUP-GATES.md` sperrt Einkaufsrechnung, Zugang, AfA und Buchung bis zum naechsten passenden Gate.

## Erlaubter naechster Scope

- `Vendors` / `Kreditoren` in `RM-DEMO` oeffnen.
- Breite Layoutansicht nutzen, damit Code, Name und relevante Spalten sichtbar sind.
- Nach `K30000` suchen oder filtern.
- Wenn `K30000` fehlt: nur dokumentieren, nicht anlegen.
- Wenn ein Template-Dialog sichtbar wird: Screenshot als Template-Kontext sichern und abbrechen.
- Optional Page Inspection / Seitenpruefung nutzen, wenn Seiten- oder Tabellenkontext unklar ist.

## Weiter gesperrt

- Kreditor `K30000` speichern oder aendern.
- Einkaufsrechnung anlegen.
- Einkaufsrechnung buchen.
- Anlagenzugang buchen.
- AfA berechnen oder buchen.
- Deutsche USt-/Kontenplan-/HGB-Finalitaet behaupten.

## Anfaenger-Lernwert

Ein Anlagenzugang beginnt nicht erst in der Einkaufsrechnung. Vorher muessen zwei Stammdatenstrukturen stimmen: die Anlagenkarte und der Kreditor. Die Anlagenkarte entscheidet ueber AfA und Anlagenkontenlogik; der Kreditor entscheidet ueber Lieferant, Zahlungs- und Verbindlichkeitslogik. Ein leeres Template oder ein sichtbarer `New`-Button ist deshalb kein Stammdatennachweis.

## Buchwirkung

Kapitel 21 darf nach `FA-CNC-01` nicht direkt zu Schritt `Einkaufsrechnung erfassen` springen. Die Klickanleitung braucht davor einen Kontrollpunkt:

1. Kreditorenliste oeffnen.
2. `K30000` suchen.
3. sichtbaren Befund dokumentieren.
4. erst danach entscheiden, ob ein separater UI-first Kreditor-Setup-Fit erlaubt ist.

## Naechster konkreter Schritt

`FIXEDASSETS-036-K30000-VENDOR-PREFLIGHT-READONLY`: Kreditorenliste in `RM-DEMO` read-only oeffnen, `K30000` pruefen, Screenshot/Evidence sichern, keine Anlage und keine Buchung.
