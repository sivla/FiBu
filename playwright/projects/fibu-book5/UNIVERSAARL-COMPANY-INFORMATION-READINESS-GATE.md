# Universaarl Company Information Readiness Gate

Status: `prep-done`

Instanz: `playthru`

Zielcompany: `UNIVERSAARL-DE` (`planned-not-yet-created`)

Quelle: Microsoft Learn `Company information overview` und `Set up Business Central`.

Dieses Gate gilt fuer den ersten Schritt nach erfolgreicher sichtbarer Company Creation. Es ersetzt keine Business-Central-Evidence. Es legt fest, welche Fragen vor der Pflege der Seite `Unternehmensinformationen` beantwortet werden muessen.

## Warum dieser Schritt direkt nach der Company kommt

Eine neue Company ist zuerst nur ein eigener Buchungsraum. Bevor Stammdaten oder Belege entstehen, braucht sie eigene Unternehmensdaten. Dazu gehoeren Name, Adresse, Kommunikation und je nach Land/Region weitere Felder. Business Central fuehrt diese Daten auf der Seite `Company Information` beziehungsweise `Unternehmensinformationen`.

Microsoft Learn ordnet die Company Information zum Grundsetup je Company ein. Die sichtbaren Felder und FastTabs koennen je Land/Region variieren. Deshalb darf das Buch nicht vorab behaupten, welche Felder in `UNIVERSAARL-DE` konkret sichtbar oder pflichtig sind. Das muss nach der Company-Anlage in `playthru` beobachtet werden.

## Startbedingung

Dieser Gate wird erst ausgefuehrt, wenn:

- `UNIVERSAARL-DE` sichtbar in der Mandantenliste steht,
- die Herkunft/Datenbasis der Company dokumentiert ist,
- die aktive Company eindeutig `UNIVERSAARL-DE` ist oder der Case den Wechsel dokumentiert erlaubt,
- der Lauf keine Setup-, Stammdaten-, Preview- oder Posting-Aktion ueberspringt.

Wenn `UNIVERSAARL-DE` noch nicht existiert, bleibt zuerst `TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE` aktiv.

## Read-only Vorpruefung

Vor jeder Pflege wird die Seite erst gelesen:

| Pruefung | Erwartung | Stop wenn |
| --- | --- | --- |
| Page-Kontext | Seite `Company Information` / `Unternehmensinformationen` ist sichtbar. | falsche Seite oder unklarer Dialog |
| Company-Kontext | `UNIVERSAARL-DE` ist im Shell-/My-Settings-/URL-Kontext eindeutig. | andere Company oder unklarer Kontext |
| FastTabs | sichtbare FastTabs und Feldgruppen werden notiert. | relevante Bereiche sind eingeklappt, verdeckt oder nicht geprueft |
| Felder | sichtbare Felder und Pflicht-/Validierungshinweise werden erfasst. | Pflichtfeldwirkung unklar |
| Actions | Speichern/Zurueck/Refresh/Personalisieren/weitere Aktionen werden klassifiziert. | Aktion koennte Daten aendern und ist nicht freigegeben |

## Feldgruppen fuer Universaarl

Die konkrete UI entscheidet spaeter. Fuer den ersten Blick sind diese Gruppen fachlich relevant:

| Gruppe | Zweck im Buch | Erwartete Universaarl-Daten |
| --- | --- | --- |
| Name und Adresse | Belegkopf, Firmenkontext, Fallstudie | Universaarl GmbH, Adresse, PLZ, Ort, Land/Region |
| Kommunikation | Telefon, E-Mail, Web, Kontakt | nur mit definierten Musterwerten |
| Steuer-/Registrierungsdaten | USt, E-Rechnung, Laenderbezug | erst nach Quellen- und USt-Gate final pflegen |
| Bank-/Zahlungsdaten | spaetere Zahlungs- und Belegdaten | erst nach Bank-/Payment-Gate |
| Logo/Bilder | spaetere Belegausgabe und Buchscreenshots | nicht vor eigenem Medien-/Beleg-Gate |

## Schreib-Gate

Company Information ist eine wirksame Aenderung. Sie darf erst gepflegt werden, wenn ein eigener Execute-Case es erlaubt.

Vor dem Speichern braucht der Case:

- Vorher-Screenshot der Seite,
- sichtbare aktive Company,
- konkrete Zielwerte,
- Feldliste mit Pflichtfeldern,
- Entscheidung, welche Felder bewusst leer bleiben,
- Screenshot nach Speichern,
- Result JSON mit Vorher/Nachher und Buchgrenze.

## Buchtext-Regel

Im Buch wird spaeter nicht geschrieben, dass ein Case etwas beweist. Der Lesertext erklaert direkt:

- Die Seite `Unternehmensinformationen` enthaelt die Grunddaten der Company.
- Diese Daten erscheinen spaeter in Belegen, Auswertungen oder Kommunikationsdaten.
- Die Werte muessen zur Musterfirma passen.
- Erst nach sichtbarem Speichern gilt der Schritt als erledigt.

Solange `UNIVERSAARL-DE` nicht existiert, bleibt diese Passage ein vorbereiteter Buchpfad und kein finaler Nachweis.

## Naechster Case nach Company Creation

Nach erfolgreichem TARGET-009:

```text
TARGET-COMPANY-INFO-001-COMPANY-INFORMATION-READONLY
```

Danach:

```text
TARGET-COMPANY-INFO-002-COMPANY-INFORMATION-CONTROLLED-FIT
```

Nur wenn TARGET-COMPANY-INFO-001 die Seite, Felder und aktive Company eindeutig zeigt, darf TARGET-COMPANY-INFO-002 Werte speichern.
