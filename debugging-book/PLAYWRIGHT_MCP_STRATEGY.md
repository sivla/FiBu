# Playwright MCP Strategy

## Ziel

Playwright MCP soll Agenten beim sicheren Erkunden von Business-Central-Oberflaechen helfen. Es ist ein Explorationswerkzeug, kein Ersatz fuer stabile Tests oder Freigaben.

## Was Playwright MCP im Debugging leistet

- UI-Struktur und Accessibility Snapshots lesen.
- sichtbare Pages, Dialoge, Buttons und Felder einordnen.
- Hypothesen fuer Page/Layout/Permission-Probleme bilden.
- sichere read-only Navigation vorbereiten.
- Hinweise fuer spaetere Playwright-Tests und Evidence Packs sammeln.

## Unterschied zu normalem Playwright

| Thema | Playwright | Playwright MCP |
|---|---|---|
| Reproduzierbarkeit | hoch | mittel |
| Exploration | mittel | hoch |
| Agenten-Navigation | mittel | hoch |
| Regressionstest | hoch | niedrig/mittel |
| Buch-Screenshot | hoch | nur vorbereitend |

## Workflow

1. MCP exploriert UI.
2. Agent sammelt Hypothesen.
3. Normales Playwright reproduziert stabil.
4. Evidence Pack dokumentiert.
5. Regressionstest entsteht.

## Sicherheitsregeln

- MCP darf keine kritischen Aktionen ohne Safe Action Check anstossen.
- MCP-Ergebnisse sind keine Root Cause Evidence allein.
- Kritische Buttons sind tabu ohne Freigabe.
- Production bleibt read-only.
- Explorative Ergebnisse muessen in Evidence Packs oder normalen Playwright-Tests nachvollziehbar werden.

## Wann MCP nicht genutzt wird

- Wenn ein normaler Playwright-Test stabiler ist.
- Wenn ein API/OData-Datencheck reicht.
- Wenn Telemetry die Ursache direkter zeigt.
- Wenn der naechste UI-Schritt eine Buchung, Zahlung, E-Mail, Job Queue, Integration oder Aenderung ausloesen koennte.
