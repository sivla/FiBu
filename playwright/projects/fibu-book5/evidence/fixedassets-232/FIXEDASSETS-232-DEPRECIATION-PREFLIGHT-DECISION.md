# FIXEDASSETS-232 - AfA-Preflight-Entscheidung nach HGB-Integrationswerten

Status: `labor`, `local-decision`, `no-bc`, `no-playwright`, `no-setup-change`, `no-preview`, `no-posting`, `not-final`.

## Entscheidung

Der AfA-Preflight wird noch nicht freigegeben.

FA-231 hat den HGB-AfA-Buch-Kontext technisch staerker gemacht: `G/L Integration - Acq. Cost` ist als Checkbox-Control sichtbar `an`, `G/L Integration - Depreciation` ist als Checkbox-Control sichtbar `aus`.

Damit passt die HGB-Konfiguration zur bereits gebuchten Anschaffungsspur, aber noch nicht zur geplanten Abschreibungsspur. Fuer einen FiBu-relevanten AfA-Lernfall soll die Abschreibung nicht nur als Anlagennebenbuch-Signal erscheinen, sondern kontrolliert in die Finanzbuchhaltung fuehren. Solange `G/L Integration - Depreciation=false` ist, waere ein AfA-Journal- oder Preview-Schritt fachlich missverstaendlich.

## Anfaenger-Lernwert

Anschaffung und Abschreibung sind verschiedene Anlagenbuchungsarten. Dass die Anschaffungskostenintegration aktiv ist, bedeutet nicht automatisch, dass auch Abschreibungen in die Sachbuchhaltung integriert werden. Genau deshalb muss man im AfA-Buch nicht nur die Page oder Feldnamen sehen, sondern den konkreten Wert des Schalters pruefen.

## Buchwirkung

Die Klickanleitung darf nach FA-231/FA-232 nicht sagen: "AfA ist bereit". Sie soll erklaeren:

- Wertnachweis ist besser als reine Feldcaption.
- `Acq. Cost=true` erklaert die gebuchte Anschaffung.
- `Depreciation=false` ist ein Setup-Gate vor AfA-Journal, Preview Posting oder Buchung.
- Der naechste Fall muss erst das Setup kontrolliert fitten oder bewusst als Laborgrenze dokumentieren.

## Naechster sicherer Schritt

`FIXEDASSETS-233-HGB-DEPRECIATION-INTEGRATION-SETUP-FIT`: HGB-AfA-Buch read-only oeffnen, aktuellen Wert erneut pruefen und nur bei ausdruecklichem Case-Gate `G/L Integration - Depreciation` kontrolliert aktivieren. Danach Vorher/Nachher-Evidence sichern. Keine AfA-Journalzeile, kein Preview Posting, keine Buchung.
