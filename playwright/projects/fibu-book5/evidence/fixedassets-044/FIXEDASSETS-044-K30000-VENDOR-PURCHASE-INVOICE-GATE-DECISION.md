# FIXEDASSETS-044 - K30000 Vendor Purchase Invoice Gate Decision

Status: `labor`, `decision`, `no-bc-run`, `no-posting`, `no-setup-change`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Zielkreditor | K30000 / Zollspedition Nord GmbH |
| Input-Evidence | `FIXEDASSETS-043` |
| Entscheidung | kein Kaufbeleg-Preflight auf Basis des aktuellen Teilnachweises |
| Gebucht | nein |

## Entscheidung

Der Teilnachweis aus `FIXEDASSETS-043` ist fuer eine Einkaufsrechnung noch nicht ausreichend. Der Screenshot zeigt zwar den Kreditor `K30000`, den geoeffneten `Invoicing`-FastTab sowie `Tax Liable`, `Tax Area Code`, `Posting Details` und Withholding-Tax-Felder. Er zeigt aber nicht die fuer einen Kaufbeleg besonders wichtigen Defaults `Vendor Posting Group`, `Gen. Bus. Posting Group`, `Currency Code` und `VAT Bus. Posting Group`.

Deshalb bleibt der Anlagenkauf gesperrt. Der naechste sinnvolle Schritt ist keine Einkaufsrechnung, sondern eine read-only Diagnose:

1. `K30000` auf der Vendor Card in breiter Ansicht oeffnen.
2. Personalisieren beziehungsweise Seiteneinstellungen pruefen, ob die fehlenden Felder auf der Page verfuegbar, aber ausgeblendet sind.
3. Page Inspection nutzen, um Page, Source Table, Feldkontext und moegliche Extension-/Profilgrenzen zu dokumentieren.
4. Danach entscheiden, ob ein normaler Anwender-Screenshot mit sichtbaren Defaults moeglich ist oder ob ein eigenes Setup-/Default-Gate noetig wird.

## Warum Business Central so betrachtet wird

Eine Einkaufsrechnung zieht ihre Buchungslogik nicht nur aus der Belegzeile. Auf Kopf- und Kreditorenebene wirken Zahlungsbedingungen, Waehrung, Geschaeftsbuchungsgruppe, Kreditorenbuchungsgruppe und VAT-/Tax-Kontext zusammen. Wenn diese Felder im Buchbild nicht sichtbar sind, kann ein Anfaenger nicht erkennen, warum BC spaeter welche Konten, Steuerlogik oder Faelligkeit verwendet.

## Buchwirkung

Kapitel 21 darf `FIXEDASSETS-043` als Lernbild fuer FastTabs und sichtbare Invoicing-/Tax-Felder nutzen. Es darf aber nicht behaupten, dass `K30000` fuer den Anlagenkauf vollstaendig kaufbelegbereit ist. Die Klickanleitung braucht vor der Einkaufsrechnung einen expliziten Diagnose-/Gate-Schritt fuer nicht sichtbare Buchungsgruppen, Waehrung und VAT-Kontext.

## Naechster Schritt

`FIXEDASSETS-045-K30000-VENDOR-PERSONALIZE-PAGEINSPECTION-DIAGNOSIS-READONLY`: UI-first/read-only klaeren, ob die fehlenden K30000-Defaults auf der Vendor Card nur ausgeblendet sind oder technisch auf der Page/Tabelle anders zu diagnostizieren sind. Keine Einkaufsrechnung, kein Anlagenzugang, keine AfA, keine Buchung.

