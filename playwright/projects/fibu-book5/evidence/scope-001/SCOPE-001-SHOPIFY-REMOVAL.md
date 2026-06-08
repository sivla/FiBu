# SCOPE-001 - Shopify aus Buch-5-Lernscope gestrichen

Status: `scope-decision`

Datum: 08.06.2026

## Entscheidung

Shopify/Online Store ist fuer `FiBu Buch 5` aus dem aktiven Lern-, Playwright- und Evidence-Scope gestrichen.

Der Prozessblock Kapitel 17 bleibt fachlich erhalten, aber als:

- Dropshipping
- Sonderverkauf
- Verkaufsauftrag
- verknuepfte Einkaufsbestellung
- Postenspur, USt-Zielbild und Marge

Nicht mehr Teil des aktuellen Projekts:

- Shopify-Connector einrichten
- Shopify-Auftraege importieren
- Shopify-Produkte oder Mapping testen
- `WEB-24001` als Shopauftrag
- Dimension `CHANNEL=SHOP` als aufzubauender Zielwert
- Shop-Abstimmung oder Payment-Provider-Reconciliation als Buch-5-Pflichtpfad

## Begründung

Das Projekt soll Business Central ueber UI-Klickpfade lernen und Buchanleitungen mit Screenshots belegen. Shopify wuerde einen eigenen Connector-, Mapping-, Integrations- und Payment-Provider-Scope erzeugen. Das wuerde den aktuellen BC-Standardprozesspfad verwässern.

Dropshipping bleibt sinnvoll, weil es als Business-Central-Prozess ueber Verkaufsauftrag und Einkaufsbestellung praktisch nachklickbar ist.

## Buchwirkung

Kapitel 17 wurde auf `Dropshipping und Sonderverkauf` umgestellt. Der alte Shopfall `WEB-24001` wurde in den Testdaten durch `DS-24001` ersetzt.

Die Buchstellen duerfen Shopify nur noch als bewusst gestrichenes Out-of-Scope-Thema nennen. Historische Evidence oder BC-Oberflaechentexte koennen weiterhin Shopify-Woerter enthalten, wenn Business Central sie in der Standardoberflaeche zeigt; daraus folgt keine Projektpflicht.

## Naechster Schritt

Wenn Kapitel 17 praktisch bearbeitet wird, dann als neuer UI-first Dropshipping-Lauf:

1. Debitor `D11000` pruefen oder per UI anlegen.
2. Artikel `SP-PUMP-01` pruefen oder per UI anlegen.
3. Kreditor `K20000` pruefen oder per UI anlegen.
4. Verkaufsauftrag `DS-24001` vorbereiten.
5. Einkaufsbestellung verknuepfen.
6. Preview Posting pruefen.
7. Nur mit ausdruecklicher Freigabe buchen.
