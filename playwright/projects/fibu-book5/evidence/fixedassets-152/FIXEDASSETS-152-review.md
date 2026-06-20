# FIXEDASSETS-152 - Acquire-Readiness-Review nach MACHINES

Status: `local-review`, `labor`, `no-bc-run`, `no-playwright-run`, `no-acquire-click`, `no-preview`, `no-posting`, `not-final`.

## Bewertete Evidence

- `FIXEDASSETS-151-result.json`
- Screenshot `fixedassets-151-020-fa-cnc-01-acquire-readiness-after-machines.png`
- Screenshot-Metadaten aus `fixedassets-151-020-fa-cnc-01-acquire-readiness-after-machines.screenshot.json`
- Microsoft Learn: `https://learn.microsoft.com/en-us/dynamics365/business-central/fa-how-acquire`

## Entscheidung

FA-151 wird als brauchbarer Readiness-Nachweis akzeptiert, aber nicht als Erwerbsfreigabe.

Belegt ist:

- `FA-CNC-01` ist in `MCP_1_20260210` / `RM-DEMO` auf der `Fixed Asset Card` sichtbar.
- `Posting Group = MACHINES` ist als sichtbarer Kartenfeldwert belegt.
- `Book Value = 0,00` ist sichtbar.
- `Acquire` ist sichtbar, aber deaktiviert.
- Es gab keinen Klick auf `Acquire`, keine Werteingabe, keine Preview und keine Buchung.

Nicht belegt ist:

- warum `Acquire` deaktiviert ist,
- ob die Assisted Fixed Asset Acquisition in dieser Sandbox nutzbar ist,
- ob ein Erwerb ueber Fixed Asset G/L Journal oder Purchase Invoice aktuell stabiler waere,
- irgendeine Anlagenpostenspur,
- ein deutscher Finalnachweis.

## Fachliche Einordnung

Microsoft Learn beschreibt den Anlagenzugang so: Nach Anlage und AfA-Buch-Zuordnung muss die Anlage erworben werden; der Erwerb wird als Anschaffungstransaktion erfasst. Der beschriebene Kartenpfad nutzt die Aktion `Acquire`, die zur Assisted Fixed Asset Acquisition fuehrt. Alternativ ist ein manueller Erwerb ueber `Fixed Asset G/L Journal` mit `FA Posting Type = Acquisition Cost` moeglich.

Damit ist `MACHINES` nur eine notwendige Setup-/Kontierungs-Voraussetzung. Es ist nicht dasselbe wie ein Anlagenzugang. Ein sichtbarer, deaktivierter `Acquire`-Button ist ein eigener Lernfall: Business Central zeigt die fachliche Aktion, laesst sie aber in diesem Zustand nicht ausfuehren.

## Warum kein Acquire-Klick

Der Button ist im DOM als deaktivierter `menuitem` erfasst. Ein Klick waere fachlich und technisch unsauber, weil kein aktiver Ausfuehrungspfad belegt ist. Ein erzwungener Klick koennte keine bessere Evidence liefern und wuerde die Guard-Regel verletzen.

## Naechster sicherer Schritt

`FIXEDASSETS-153-FA-CNC-01-ACQUIRE-DISABLED-EDITMODE-DIAGNOSIS`

Ziel: `FA-CNC-01` erneut oeffnen, Kartenkontext und `MACHINES` pruefen, gezielt nur den sicheren Edit-/Stift-Zustand beziehungsweise Aktionsstatus diagnostizieren und danach erneut dokumentieren, ob `Acquire` deaktiviert bleibt.

Weiterhin gesperrt:

- `Acquire` klicken oder ausfuehren,
- Betrag erfassen,
- Einkaufsrechnung oder Journalzeile erzeugen,
- Preview Posting,
- Post,
- Setup-Aenderung,
- deutscher Finalnachweis.
