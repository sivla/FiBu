# FIXEDASSETS-116 - Purchase Invoice line Type route decision

Status: `labor`, `local-review`, `no-bc-run`, `no-playwright-run`

## Ausgangspunkt

`FIXEDASSETS-115` blieb in `MCP_1_20260210` / `RM-DEMO`, erzeugte aber keinen belastbaren Nachweis fuer den Einkaufsrechnungs-Zeilentyp `Fixed Asset`/`Anlage`.

Belegt ist:

- `New/Neu` wurde im Kontext `Purchase Invoices` gescopt geklickt.
- Die Probe erreichte eine Einkaufsrechnung mit Zeilenkontext.
- Es wurden keine Zielwerte eingegeben: kein `K30000`, kein `FA-CNC-01`, kein Betrag.
- Es gab keine Preview, kein `Post`, keine Setup-Aenderung, keinen API-Shortcut und keinen Company-Wechsel.
- Kein persistenter Draft wurde erkannt; Cleanup war nicht noetig.

Nicht belegt ist:

- `Fixed Asset`/`Anlage` als auswählbare Zeilentyp-Option.
- Ein stabiler Dropdown- oder Lookup-Pfad fuer das Feld `Type`.
- Ein Zielbeleg fuer Anlagenzugang.

## Entscheidung

Der naechste Lauf soll **nicht** erneut blind den sichtbaren `Item`-Button anklicken. FA-115 zeigt, dass dieser Treffer wie ein Open-Record-/Kontextmenue-Pfad wirkt und nicht wie ein sicherer Wertelistenpfad.

Page Inspection ist fuer Page/Table-Nachweise nuetzlich, beantwortet aber nicht, wie der Anwender die Zeilenart in der aktuellen Subform stabil aendert. Personalisieren ist fuer Feld-/Spalten-Sichtbarkeit nuetzlich, beweist aber ebenfalls keine aktuelle Dropdown-Werteliste.

Deshalb bleibt die Einkaufsrechnungsroute erhalten, aber der naechste praktische Case muss enger sein:

`FIXEDASSETS-117-PURCHASE-INVOICE-LINE-TYPE-GRIDCELL-CONTROL-DIAGNOSIS`

Ziel von FA-117 ist nur, den editierbaren Control-/Gridcell-Pfad fuer `Type` zu finden:

- Type-Zelle als Gridcell fokussieren, nicht den `Item`-Open-Record-Button als Erfolg werten.
- Aktives Element, Rollen, `aria`-/Titelwerte und nahe Controls erfassen.
- Allenfalls F2/Alt+Down auf der fokussierten Zelle probieren, aber keine Option auswählen.
- Screenshot nur als Kandidat akzeptieren, wenn er echte Optionen oder einen klaren Control-Blocker zeigt.

## Buchwirkung

Fuer Kapitel 21 darf weiterhin nicht behauptet werden, dass der Anlagenkauf per Einkaufsrechnung bereits UI-first bewiesen ist. Die Buchanleitung braucht spaeter entweder:

- einen sichtbaren Zeilentypwechsel `Type = Fixed Asset`/`Anlage`, oder
- einen klar dokumentierten Alternativpfad fuer Anlagenzugang.

FA-115/FA-116 sind Lern- und Debugging-Evidence, keine finalen Buchbilder.

## Grenzen

- Kein deutscher Finalnachweis.
- Kein Anlagenzugang.
- Keine AfA.
- Keine Anlagenposten.
- Keine Aussage zur finalen deutschen Einkaufs-/USt-Logik.

## Naechster Schritt

`FIXEDASSETS-117`: kontrollierter UI-first Gridcell-/Control-Diagnoselauf fuer das Purchase-Invoice-Zeilenfeld `Type`; weiter ohne Zielwerte, ohne Preview, ohne Buchung und mit Draft-Cleanup-Pflicht.
