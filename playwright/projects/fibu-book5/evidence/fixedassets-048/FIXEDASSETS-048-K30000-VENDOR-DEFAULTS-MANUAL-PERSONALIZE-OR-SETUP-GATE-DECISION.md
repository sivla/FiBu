# FIXEDASSETS-048 - K30000 Vendor Defaults Manual Personalize or Setup Gate Decision

Status: `done-decision-no-bc-run`, `labor`, `ui-first`, `no-posting`, `purchase-invoice-locked`, `setup-fit-not-approved`, `de-final-open`.

## Ausgangslage

`FIXEDASSETS-047` hat die `K30000`-Kreditorenkarte in `RM-DEMO` read-only ueber `Vendor Card` Page `26` geoeffnet. Sichtbar waren:

- `K30000`
- `Zollspedition Nord GmbH`
- `Tax Area Code`
- `Tax Liable`
- `Payment Terms Code = 1M(8D)`
- `Payment Method Code = BANK`

Nicht sichtbar belegt waren weiterhin:

- `Vendor Posting Group`
- `Gen. Bus. Posting Group`
- `Currency Code`
- `VAT Bus. Posting Group`

Der fokussierte Seitentext und die aktive Kartenfelddiagnose haben diese kritischen Captions ebenfalls nicht gefunden.

## Entscheidung

Ein enger UI-first Default-/Setup-Fit fuer `K30000` wird jetzt nicht freigegeben.

Grund: Es gibt weiterhin keinen sichtbaren Nachweis, welche Werte in den kritischen Defaults stehen oder stehen sollen. Ein Setup-Fit wuerde an dieser Stelle Werte raten. Das waere fuer die spaetere Anlagen-Einkaufsrechnung, fuer Buchscreenshots und fuer die Wiederholung in einer deutschen Zielumgebung zu riskant.

Der naechste erlaubte praktische Lauf ist deshalb:

`FIXEDASSETS-049-K30000-VENDOR-PERSONALIZE-FIELD-AVAILABILITY-READONLY`

Dieser Lauf darf:

- die `K30000`-Kreditorenkarte in `RM-DEMO` oeffnen,
- `Personalisieren` als Diagnosemodus oeffnen,
- nach den vier kritischen Feldern suchen,
- Screenshots nur dann als Beleg verwenden, wenn Feldname oder Zielwert wirklich sichtbar ist,
- dokumentieren, ob die Felder personalisierbar, nicht personalisierbar oder im aktuellen Profil nicht erreichbar sind.

Dieser Lauf darf nicht:

- Kreditorenwerte aendern,
- Setupwerte setzen,
- eine Einkaufsrechnung anlegen,
- Anlagenzugang, AfA oder Buchung starten,
- gespeicherte Personalisierung still als Standardansicht verkaufen,
- API-/Direktdatenwege als Ersatz fuer den UI-Klickpfad nutzen.

Wenn Business Central fuer die Diagnose zwingend eine gespeicherte Personalisierung verlangt, muss der Lauf stoppen und eine neue Gate-Entscheidung schreiben. Ein gespeicherter personalisierter Screenshot waere fuer das Buch nur mit deutlichem Hinweis `nutzerpersonalisierte Ansicht` verwendbar.

## Warum Business Central so behandelt wird

Business Central trennt Anwendersicht, Personalisierung, Rollen-/Profilansicht, Page-Felder und darunterliegende Tabellenlogik. Ein Feld kann vorhanden, aber ausgeblendet sein. Es kann auch gar nicht auf der Page personalisierbar sein. Beides ist fuer Klickanleitungen relevant, aber keines davon beweist automatisch fachlich richtige Buchungsdefaults.

Fuer den Anlagenkauf ist der Kreditor buchungsrelevant: Buchungsgruppen, Waehrung und VAT/Tax-Kontext beeinflussen spaetere Kreditoren-, Sach- und Steuerposten. Daher darf die Anleitung nicht von sichtbaren Zahlungsbedingungen auf Kaufbeleg-Readiness schliessen.

## Buchwirkung

Kapitel 21 bleibt vor Einkaufsrechnung und Anlagenzugang gegated. Die Anfaengererklaerung soll lauten:

- Sichtbare Zahlungsbedingungen sind nur ein Teil der Kreditorenpruefung.
- Unsichtbare Buchungsgruppen- und Steuerfelder sind ein Diagnosefall, kein Freifahrtschein.
- `Personalisieren` kann helfen, ausgeblendete Page-Felder sichtbar zu machen.
- Ein Buchscreen muss markieren, ob er Standardansicht oder personalisierte Ansicht zeigt.
- Kein Kaufbeleg wird vorbereitet, solange die kritischen Defaults nicht sichtbar, technisch erklaert oder bewusst gefittet sind.

## Offene Punkte

- Sind die vier kritischen Felder in `Personalisieren` verfuegbar?
- Falls ja: lassen sie sich sichtbar machen, ohne die Buchsicht irrefuehrend zu personalisieren?
- Falls nein: braucht `K30000` einen engen UI-first Default-/Setup-Fit?
- Erst danach kann ein no-posting Einkaufsrechnungs-Preflight entschieden werden.

## Naechster Schritt

`FIXEDASSETS-049-K30000-VENDOR-PERSONALIZE-FIELD-AVAILABILITY-READONLY`.

Kein Kaufbeleg, kein Anlagenzugang, keine AfA, keine Buchung und kein Default-/Setup-Fit vor diesem Diagnosepfad.
