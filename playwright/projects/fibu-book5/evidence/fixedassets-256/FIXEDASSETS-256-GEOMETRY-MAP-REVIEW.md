# FIXEDASSETS-256 Geometry Map Review

Status: `labor`, `local-review`, `no-bc`, `no-playwright`, `no-value-write`, `no-ok`, `not-final`.

## Ziel

`FIXEDASSETS-255` hat die Request Page `Calculate Depreciation` ohne `OK` als Geometrie-/Label-Map erfasst. Dieser Review entscheidet, ob daraus schon ein no-OK Value-Preflight entstehen darf.

## Ergebnis

Noch nicht freigeben.

Die Map ist als Diagnose gut, aber die sichtbaren Zielwerte sind fachlich nicht konsistent genug:

| Feld | Mapping | Sichtbarer Wert | bisheriger Zielwert | Bewertung |
|---|---|---|---|---|
| `Depreciation Book` | stark, gleiche Zeile | `COMPANY` | `HGB` | Konflikt |
| `Posting Date` | stark, gleiche Zeile | `01.01.2027` | `06/27/2026` | Konflikt plus Datumsformat |
| `Document No.` | stark, gleiche Zeile | `FADEP-20260627-2158` | neue `FADEP-*` Nummer | spaeter nutzbar |
| `Fixed Asset No.` Filter | wahrscheinlich, Filtersektion | leer | `FA-CNC-01` | noch nicht ausreichend |

## Warum das blockiert

Der Anlagenzugang wurde bisher als Laborpostenspur mit `FA-CNC-01`, Beleg `G05001`, AfA-Buch `HGB` und `Acquisition Cost` gefuehrt. Wenn die Batch-Request-Page nun `COMPANY` zeigt, kann ein Anwender nicht sicher wissen, ob Business Central den gleichen Anlagenbuch-Kontext berechnet.

Beim Datum ist die Lage aehnlich: Die UI zeigt den Format-Hinweis `dd.MM.yyyy` und den Wert `01.01.2027`. Ein Wert wie `06/27/2026` ist fuer diese Oberflaeche kein sicherer Zielwert.

## Entscheidung

- Kein Zielwert-Preflight jetzt.
- Kein `OK`.
- Kein Preview Posting.
- Kein Post.
- Naechster Schritt: Zielparameter lokal klaeren, bevor wieder Business Central geoeffnet wird.

## Lernwert fuer die Klickanleitung

Eine Business-Central-Request-Page ist nicht nur ein Formular, sondern eine fachliche Grenze. Vor `OK` muss sichtbar und fachlich erklaert werden:

- welches AfA-Buch verwendet wird,
- welches Buchungsdatum im passenden UI-Format gemeint ist,
- welche Belegnummer den Testlauf eindeutig macht,
- ob der Anlagenfilter wirklich auf die Zielanlage begrenzt.

Vorbelegte Werte koennen aus vorherigen Laeufen oder Defaults stammen. Sie duerfen nicht ungeprueft als Buchziel uebernommen werden.

## Naechster Schritt

`FIXEDASSETS-257-FA-DEPRECIATION-TARGET-PARAMETER-DECISION`: lokal entscheiden, ob der Zielparameter `HGB` wirklich fuer die AfA-Request-Page gilt, welches Posting-Date-Format verwendet werden muss und wie der Anlagenfilter `FA-CNC-01` vor einem no-OK Value-Preflight bewertet wird.
