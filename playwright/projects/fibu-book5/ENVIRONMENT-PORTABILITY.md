# Environment-Portabilitaet

Diese Datei beantwortet die Frage: Was muss im aktuellen Testmandant funktionieren, damit derselbe Buchfall spaeter in einer komplett deutschen Business-Central-Umgebung sauber wiederholt werden kann?

## Ziel

Der aktuelle Mandant ist ein CRONUS-Labor. Er dient zum Lernen, Automatisieren und Fehlersuchen. Der spaetere deutsche Mandant dient fuer finale Buchscreenshots, deutsche USt, deutsche Sprache und fachlichen Endnachweis.

Deshalb muss jeder Testfall in zwei Modi gedacht werden:

| Modus | Zweck | Ergebnis |
|---|---|---|
| `labor-cronus` | Klickpfad, Datenbedarf, UI-Verhalten, API- und Cleanup-Strategie lernen | Laborbilder, Findings, Workarounds, `labor-delta` |
| `target-de` | finale deutsche Buchstrecke pruefen | finale Screenshots, USt-/EUR-/Posten-Evidence |

## Was portabel bleiben muss

| Bereich | Aktuelle Umsetzung | Portabilitaetsbewertung |
|---|---|---|
| Environment-URL | `.env` mit `FIBU_BOOK5_BC_URL` | gut; spaeter je Projekt eigener Prefix |
| Company | `project.defaultCompany = RM-DEMO` | ok fuer Buch 5; spaeter pro Projekt konfigurierbar halten |
| Testdaten | JSON unter `testdata/` | gut; Zielwerte `EUR`/`19 %` stehen bereits getrennt vom CRONUS-Ist |
| API-Anlage | `playwright/core/bc-api.ts` | gut; basiert auf dokumentierter BC API v2.0 |
| Screenshot-Metadaten | `.screenshot.json` je Bild | gut; trennt Labor/Kandidat/Final/Rejected |
| Evidence Delta | `buildFinancialTargetVsLaborDelta` | gut; macht Abweichungen explizit statt Tests schoenzufaerben |

## Was nicht blind portabel ist

| Risiko | Warum kritisch | Regel |
|---|---|---|
| Suchbegriff fuer Verkaufsauftraege | deutscher Mandant kann `Verkaufsauftraege` als besseren Treffer zeigen | Suchbegriffe projekt-/sprachbezogen in Testdaten oder Projektkonfig ablegen |
| Page-ID Navigation | Page IDs sind stabiler als Text, aber Erweiterungen/Rollen koennen Sichtbarkeit veraendern | Page IDs weiter nutzen, aber UI-Text danach pruefen |
| Koordinaten-Scroll | Abhaengig von Viewport, FactBoxes, Zoom, Personalisierung | nur Labor-Workaround; keine finale Strategie |
| CRONUS-Gruppen `RETAIL`, `RESALE`, `FURNITURE` | US-/CRONUS-spezifisch, kein deutscher Steuerfit | nur in `labor-cronus` verwenden und immer als Laborgrenze dokumentieren |
| `USD` im Labor | resultiert aus CRONUS-USA-Setup | nie als Zielwert akzeptieren, wenn Buch `EUR` verlangt |
| `pageText()` | enthaelt DOM-/Skript-/verdeckte Werte | nur Roh-Evidence; keine visuelle Buchfreigabe |

## Konkrete aktuelle Code-Befunde

| Befund | Status | Massnahme |
|---|---|---|
| Cleanup in `UAT-O2C-001` war hart auf `D10000` codiert | korrigiert | nutzt jetzt `data.customerNo` |
| O2C-Suchbegriff fuer Verkaufsauftraege kommt aus Testdaten | erledigt | `testdata/sales/uat-o2c-001.json` enthaelt `searchTerms.salesOrders`; aktueller Laborlauf nutzt `Sales Orders`, spaeterer DE-Lauf kann `Verkaufsauftraege` priorisieren |
| Page `9305` und `42` sind hart codiert | akzeptiert | als technische Navigation ok, solange Screenshot/Evidence Seiteninhalt pruefen |
| Koordinaten-Scroll fuer `041` | verworfen | bleibt als Finding; fuer finale Bilder neue Strategie |
| `FURNITURE` im Screenshot-Check | bewusst Labor | nur `rejected`/`do-not-use`, kein Buchbild |

## Mindestcheck fuer neuen deutschen Mandanten

Vor dem ersten deutschen Finalbild muss laufen:

1. Auth neu erzeugen: `npm run auth:bc`.
2. Projekt-URL/Company in `.env` und `project.ts` pruefen.
3. Sprache und Region pruefen: Deutsch/Deutschland.
4. Testdaten idempotent anlegen oder importieren.
5. Debitor `D10000`, Artikel `RM-M100`, Lagerort `FRA-ZL`, Dimensionen und Standarddimensionen pruefen.
6. VAT/Posting Setup fuer `EUR` und `19 %` pruefen.
7. `UAT-O2C-001` laufen lassen.
8. `045-target-vs-labor-delta.md` muss fuer Zielwerte `target-fit` oder eine erklaerte Zielabweichung zeigen.
9. Screenshots duerfen erst dann `final` werden, wenn `SCREENSHOT-QA.md` sie freigibt.

## Microsoft-Learn-Pflicht

Fachliche Aussagen werden nicht aus CRONUS geraten. Wenn der Buchtext eine allgemeine BC-Regel behauptet, wird sie gegen `MICROSOFT-DOC-VALIDATION.md` und die dort verlinkten Microsoft-Learn-Quellen geprueft.
