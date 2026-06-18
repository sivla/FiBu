# FIXEDASSETS-055 - K30000/FA-CNC-01 Purchase Invoice Field Mapping ohne Buchung

Status: `rejected`, `labor`, `ui-first`, `anti-pattern`, `field-mapping-blocked`, `cleanup-done`, `no-preview`, `no-posting`, `no-setup-change`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Zielkreditor | K30000 / Zollspedition Nord GmbH |
| Zielanlage | FA-CNC-01 / CNC Maschine FRA |
| Labor-Vendor-Invoice-No. | FA055-10766475 |
| Feldmapping-Status | rejected-wrong-vendor-card-context-cleaned-up-no-posting |
| Gebucht | nein |
| Preview Posting geklickt | nein |
| Draft-Cleanup | `107222` Purchase-Invoice-Draft geloescht; `V00040` Vendor-Draft geloescht |

## Ergebnis

Der Field-Mapping-Lauf ist als Anti-Pattern rejected. Der Kopf-/Zeilenversuch blieb nicht stabil im richtigen Einkaufsrechnungs-Zeilenkontext: BC zeigte einen Vendor-Registrierungsdialog und danach einen falschen `Vendor Card - V00040 - FA-CNC-01`-Kontext. Das beweist keinen Anlagenkauf und keine `FA-CNC-01`-Einkaufsrechnungszeile. Die erzeugten Artefakte wurden anschliessend ueber die UI bereinigt: Purchase-Invoice-Draft `107222` und Vendor-Draft `V00040` sind in gefilterten Listen nicht mehr sichtbar.

## Was man in Business Central sieht

- Die Einkaufsrechnung ist ein Auto-Save-naher Belegkontext: Schon Kopf- oder Zeilenwerte koennen einen Entwurf erzeugen.
- Der Kreditor gehoert in den Kopf. Erst danach ist fachlich sinnvoll, die Zeile auf den passenden Typ fuer Anlagen umzustellen.
- Eine Anlagenzeile ist nur belastbar, wenn der Zeilentyp und die Anlagen-Nr. gleichzeitig sichtbar sind.
- `Post` und `Preview Posting` bleiben in diesem Lauf nur Gefahrengrenzen; sie wurden nicht geklickt.
- `FA-CNC-01` in einer `Vendor Card` ist kein Anlagenzeilenbeweis. Das Bild ist als Fehlkontext zu verwerfen.
- Ein Vendor-Registrierungsdialog beim Eingeben einer Vendor-Invoice-No. ist ein Stop-Kriterium: Der aktuelle Fokus ist nicht dort, wo der Test ihn vermutet.

## Buchwirkung

Kapitel 21 darf den Anlagenkauf noch nicht als durchgaengige Klickanleitung darstellen. Der Lauf gehoert in Kapitel 21 und in das Debugging-/Nachweiskapitel als Lernfall: Screenshots muessen nicht nur den Zielcode zeigen, sondern den fachlich richtigen Kontext. `FA-CNC-01` auf einer Vendor Card ist ein falscher Kontext und darf nicht als Anlagenzeile erklaert werden.

## Grenzen

- Keine Vorschau, keine Buchung, kein Anlagenzugang, keine AfA und keine Anlagenposten.
- Keine deutsche VAT-/Kontenplan-/HGB-Finalbehauptung.
- `107222` und `V00040` waren versehentliche Laborartefakte und wurden ueber UI-Cleanup entfernt.
- Die 055-Zielbilder `030` und `050` sind rejected/do-not-use fuer Buchscreenshots.

## Naechster Schritt

FIXEDASSETS-056-PURCHASE-INVOICE-FIELD-MAPPING-BLOCKER-DIAGNOSIS: vor jedem neuen Mapping einen sicheren Zeilenkontext-Helper bauen, Vendor-Registrierungsdialoge als Stop-Kriterium behandeln und erst danach einen neuen no-posting Feldmapping-Lauf erlauben.
