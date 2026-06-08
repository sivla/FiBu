# FIXEDASSETS-002 Zielwerte und Suchpfade

Status: `labor-candidate`, `read-only`, `no-posting`, `no-setup-change`, `not-final`.

## Zweck

Dieser Lauf klaert den naechsten Anlagen-Schritt, ohne Stammdaten oder Setup zu veraendern. Er gleicht Kapitel 21 gegen die vorhandenen Testdaten ab und prueft deutsche/BC-nahe Suchpfade fuer die spaetere Klickanleitung.

## Zielwertabgleich

| Feld | Buch Kapitel 21 | Testdaten | Status |
|---|---:|---:|---|
| Zugangsbetrag | 120000 | 120000 | konsistent |

Weitere Buchzielwerte: `FA-CNC-01`, `HGB`, `Linear`, `8 Jahre`, `MACHINES`, `K30000`, AfA bis `30.06.2026`.

## Suchpfade

| Suchbegriff | Status | Beweist | Beweist nicht |
|---|---|---|---|
| Anlagen | labor-candidate | Tell-Me-/Suchkontext in `RM-DEMO` | Seite nicht geoeffnet, keine Einrichtung, keine Buchung |
| AfA | labor-candidate | Tell-Me-/Suchkontext in `RM-DEMO` | Seite nicht geoeffnet, keine Einrichtung, keine Buchung |
| Anlagenbuchungsgruppen | labor-candidate | Tell-Me-/Suchkontext in `RM-DEMO` | Seite nicht geoeffnet, keine Einrichtung, keine Buchung |
| Einkaufsrechnungen | labor-candidate | Tell-Me-/Suchkontext in `RM-DEMO` | Seite nicht geoeffnet, keine Einrichtung, keine Buchung |
| Anlagenposten | labor-candidate | Tell-Me-/Suchkontext in `RM-DEMO` | Seite nicht geoeffnet, keine Einrichtung, keine Buchung |

## Buchwirkung

- Kapitel 21 darf noch nicht als praktisch belegt gelten.
- Der Zugangsbetrag ist jetzt auf das Buchziel `120.000 EUR` harmonisiert.
- Suchbegriffe muessen fuer deutsche/gemischtsprachige Oberflaechen stabiler formuliert werden als nur mit englischen Namen.
- Die spaetere Klickanleitung braucht getrennte Bilder fuer Anlagenkarte, AfA-Buch, Anlagenbuchungsgruppe, Einkaufsrechnung, Preview/Buchung, Anlagenposten, Sachposten und Anlagenspiegel.

## Naechster Schritt

FIXEDASSETS-003 nur nach Zielwertentscheidung: entweder Buch/Testdaten auf 120.000 harmonisieren und dann UI-Seitenoeffnungen fuer Anlagenkarte, AfA-Buch und FA Posting Group gezielt nachweisen, oder bewusst den Testdatenwert 250.000 ins Buchmodell uebernehmen.
