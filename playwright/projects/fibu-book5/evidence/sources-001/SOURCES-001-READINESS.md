# SOURCES-001 - Quellenverzeichnis und Primaerquellenlogik

Datum: 2026-06-09

Umgebung: `MCP_1_20260210`

Company: `RM-DEMO`

Arbeitsart: `book-sync` / `readiness`

Status: `source-governance`, `no-bc-run`, `no-setup-change`, `no-posting`, `not-final`, `de-final-open`

## Ziel

Kapitel 40 enthaelt das Quellenverzeichnis. Dieser Lauf ordnet das Verzeichnis gegen die aktuelle Projektwahrheit ein: Primaerquellen bevorzugen, Microsoft Learn fuer Business-Central-Standardpfade verwenden, amtliche Quellen fuer deutsche Steuer-/Compliance-Regeln trennen, Vendor-Dokumentation nur fuer optionale Add-ons nutzen und gestrichenen Shopify-Scope nicht wieder als Projektziel aktivieren.

## Gepruefte Projektwahrheit

- `ARTIFACTS-001` hat Kapitel 39 als Kontroll- und Uebergabeschicht synchronisiert.
- `LEARNPATH-001`, `MB800-001` und `EXAMTRAINING-001` haben Microsoft-Learn-/MB-800-Bezug bereits als Lern- und Readiness-Schicht eingeordnet.
- `SCOPE-001` hat Shopify/Online Store aus dem aktiven Buch-5-Lernscope gestrichen.
- `AUTOPILOT-STATE.json` und `POSTING-AND-SETUP-GATES.md` bleiben fuehrend fuer praktische Laeufe.
- Historische Seitentexte koennen Shopify als sichtbaren BC-UI-Begriff enthalten. Daraus folgt kein aktiver Shopify-Testauftrag.

## Quellenklassen

| Quellenklasse | Verwendung im Buch | Grenze |
|---|---|---|
| Microsoft Learn / Business-Central-Produktdokumentation | Standardfunktionen, Seiten, Prozesse, Training und MB-800-Lernbezug | ersetzt keine RM-DEMO-Screenshots und keine Postenspur |
| Amtliche Quellen / EU / deutsche Rechtsquellen | USt, Aufbewahrung, GoBD, VAT-/Compliance-Zielbild | ersetzt keine Business-Central-Einrichtung, keine VAT Entries und keinen deutschen Finalbeleg |
| Vendor-Dokumentation | optionale Add-ons wie Continia oder COSMO als Architektur-/Integrationskandidaten | kein Nachweis fuer BC-Standard und kein Projektauftrag ohne Integrationsgate |
| Gestrichene Quellen | Scope-Abgrenzung, z. B. Shopify/Online Store als bewusst nicht aktiver Buch-5-Scope | darf nicht als Klickpfad, Testdatenmodell oder Evidence-Ziel reaktiviert werden |
| Projekt-Evidence | konkrete RM-DEMO-Befunde, Screenshots, JSON, Posten, Berichte, Fehlerfaelle | Laborbefund bleibt Laborbefund und ist kein deutscher Finalnachweis |

## Ergebnis

Kapitel 40 ist jetzt als Quellen- und Evidence-Regel markiert. Quellen stuetzen fachliche Aussagen, aber sie beweisen nicht automatisch, dass der jeweilige Klickpfad in `RM-DEMO` funktioniert, dass ein Beleg gebucht wurde, dass Posten sichtbar sind oder dass ein deutscher Zielmandant final abgenommen ist.

`Q10` bleibt als gestrichener Shopify-Hinweis nur Scope-Abgrenzung. Er ist keine aktive Quelle fuer neue Shopify-Klickpfade, `CHANNEL=SHOP`, `WEB-24001`, Connector-Setup oder Online-Store-Testdaten.

## Kein Live-URL-Audit

Dieser Lauf hat keine externen URLs live validiert und keine neuen Microsoft-Learn-Behauptungen recherchiert. Er synchronisiert die Quellenlogik im Buch gegen vorhandene Projekt-Evidence. Ein spaeterer echter Quellen-Audit kann URL-Erreichbarkeit, Sprachversionen, Veröffentlichungsdatum und Microsoft-Learn-Aenderungen separat pruefen.

## Anfaenger-Lernwert

Ein Anfaenger soll unterscheiden: Eine Dokumentationsquelle erklaert, wie Business Central gedacht ist. Evidence zeigt, was im konkreten Mandanten sichtbar, eingerichtet, gebucht oder blockiert war. Beides gehoert zusammen, aber keines ersetzt das andere.

## Buchwirkung

Kapitel 40 enthaelt nun vor der Quellenliste eine Regel: Microsoft Learn und amtliche Quellen sind bevorzugte Referenzen, Vendor-Dokumente sind optionale Add-on-Quellen, gestrichene Quellen bleiben Scope-Hinweise, und jede praktische Aussage im Buch braucht weiterhin Evidence-Bezug.

## Grenzen

- Kein Business-Central-Lauf.
- Keine Screenshots.
- Keine Setup- oder Stammdaten-Aenderung.
- Keine Buchung.
- Kein Live-URL-Audit.
- Kein deutscher Finalnachweis.
- Keine Aussage, dass jede Quelle fachlich vollstaendig oder aktuell neu geprueft wurde.

## Naechster sinnvoller Schritt

`GOVERNANCE-005-AUTONOMOUS-POSTING-POLICY-SYNC`: Der aktuelle Autopilot-V2.2-Prompt spricht von erweiterten autonomen Buchungsmoeglichkeiten. Die Repo-Gates sperren aber weiterhin Zahlungen, Wiederholungsbuchungen, Setup-Aenderungen und neue Companies ohne ausdrueckliche Freigabe. Der naechste sichere Lauf sollte diese Policy sauber synchronisieren, bevor wieder praktische Buchungs- oder Setup-Laeufe geplant werden.
