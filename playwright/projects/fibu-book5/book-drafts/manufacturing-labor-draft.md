# Manufacturing Labor Draft

Status: `labor-draft`, `direct-page-readiness`, `labor-sufficient-for-book-draft`, `needs-german-final-rebuild`

Quelle: `MANUFACTURING-001`, `MANUFACTURING-002`, `MANUFACTURING-003`

Sandbox: `MCP_1_20260210`

Company: `RM-DEMO`

## Was im Labor wirklich belegt ist

`MANUFACTURING-003` ersetzt die aeltere Tell-Me-/Such-Evidence fuer wichtige Manufacturing-Seiten durch direkte Page-URL-Navigation. In `RM-DEMO` wurden read-only geoeffnet:

| Seite | Page ID | Laborbefund |
|---|---:|---|
| `Production BOMs` | `99000786` | Seitenkontext sichtbar |
| `Routings` | `99000764` | Seitenkontext sichtbar |
| `Work Centers` | `99000754` | Seitenkontext sichtbar |
| `Released Production Orders` | `99000831` | Seitenkontext sichtbar |

Das ist ein besserer Klickpfad-Anker als eine Suche, weil die URL direkt in derselben Sandbox und Company landet. Fuer Anfaenger ist der Lernpunkt: Eine Seite kann sichtbar sein, ohne dass der Prozess bereits eingerichtet oder buchbar ist.

## Was nicht bewiesen ist

- Kein Production BOM fuer `RM-M100`.
- Kein Routing fuer `RM-M100`.
- Kein Fertigungsauftrag `PROD-3001`.
- Kein Verbrauch von `RAW-STEEL`.
- Kein Output von `RM-M100`.
- Keine Kapazitaetsposten, Artikelposten, Wertposten oder Sachposten aus Manufacturing.
- Kein deutscher Finalnachweis.

`INV008-899959` bleibt ein kontrollierter Item-Journal-Trainingsbestand. Er ist kein Manufacturing-Output.

## Buchwirkung fuer Kapitel 14

Kapitel 14 darf die direkten Seiten als Laboranker fuer den Zielpfad nennen. Der Text muss aber klar trennen:

- Laborstand: Seitenkontext und Readiness.
- Zielpfad: BOM/Routing/Produktionsauftrag/Verbrauch/Output.
- Finalnachweis: spaetere deutsche Zielinstanz mit deutschen Screenshots, deutschem Setup und Postenspur.

Der aktuelle Laborstand reicht fuer eine anfangerfreundliche Warnung vor der Schrittfolge: Vor `Plan berechnen`, `Fertigungsauftrag erzeugen`, `Verbrauch buchen` oder `Output buchen` muss die Stammdaten- und Setup-Kette belegt sein.

## Screenshot-Anker

| Screenshot | Buchnutzung | Grenze |
|---|---|---|
| `img/manufacturing-003-010-production-boms.png` | Seitenkontext fuer Fertigungsstuecklisten | kein BOM-Fit fuer `RM-M100` |
| `img/manufacturing-003-020-routings.png` | Seitenkontext fuer Arbeitsplaene | kein Routing-Fit fuer `RM-M100` |
| `img/manufacturing-003-030-work-centers.png` | Seitenkontext fuer Arbeitsplaetze/Kapazitaet | keine Kapazitaetsbuchung |
| `img/manufacturing-003-040-released-production-orders.png` | Seitenkontext fuer freigegebene Fertigungsauftraege | kein `PROD-3001`, kein Verbrauch/Output |

## German-Final-Rebuild

In der deutschen Zielinstanz muss dieser Block neu erzeugt werden:

1. Deutsche Seitenbegriffe und Oberflaeche pruefen.
2. `RM-M100`, `RAW-STEEL` und benoetigte Komponenten in der Zielcompany belegen.
3. Production BOM/Routing oder bewusste Assembly-Alternative UI-first einrichten.
4. Fertigungsauftrag erst nach Setup-Gate erzeugen.
5. Verbrauch, Output, Artikelposten, Wertposten, Kapazitaetsposten und Sachposten nachvollziehen.
6. Screenshots aus der deutschen Zielinstanz ersetzen die RM-DEMO-Laborbilder.

## Naechster Laborhebel

`MANUFACTURING-005`: Kapitel 14 klein bereinigen und den Labor-/Zielpfad sauberer trennen, insbesondere alte Suchpfade und fremde Fixed-Assets-Einschuebe im Manufacturing-Abschnitt. Noch kein Manufacturing-Setup und keine Buchung.
