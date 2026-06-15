# GOVERNANCE-013 Company List Read-only

Status: `labor`, `read-only`, `company-context`, `no-company-switch`, `no-company-created`, `no-setup-change`, `no-posting`, `not-final`.

## Zweck

Dieser Lauf prueft die Companies-Liste innerhalb der Business-Central-Instanz `MCP_1_20260210`, ohne Company zu wechseln, eine Company anzulegen oder Setup zu aendern.

## Ergebnis

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Startcompany | RM-DEMO |
| Modus | read-only-ui-company-list-no-company-switch-no-company-created |
| Sichtbare bekannte Registry-Companies | `RM-DEMO`, `CRONUS USA, Inc.`, `My Company` |
| Nicht sichtbar im Seitentext | `RM-PROD`, `RM-SALES`, `RM-SERVICE`, `RM-SHARED`, `RM-AT` |

## Was bewiesen ist

- Die Companies-Seite wurde ueber die Business-Central-UI read-only geoeffnet.
- Die Pruefung blieb in `MCP_1_20260210` und startete aus `RM-DEMO`.
- Es wurde kein `New`, `Copy`, `Create`, `Switch` oder aehnlicher datenveraendernder Company-Schritt ausgefuehrt.

## Was nicht bewiesen ist

- Es wurde keine Zielcompany angelegt.
- Es wurde nicht in eine andere Company gewechselt.
- Es wurde kein deutsches VAT19-, Kontenplan- oder Finalbild erzeugt.
- Die Seitentext-Erkennung beweist nur sichtbare bekannte Namen, keine vollstaendige Company-Metadatenanalyse.

## Limitationen

- RM-DEMO ist im Companies-Seitentext sichtbar und bleibt die aktive Laborcompany.
- Geplante Zielcompanies werden nur dann als sichtbar markiert, wenn ihr Code im UI-Seitentext vorkommt.
- Keine Company wurde angelegt, kopiert, geloescht oder geoeffnet.

## Buchwirkung

Kapitel zu Intercompany, Migration, Zielmandanten und Handover duerfen jetzt zwischen geplanter Registry und live sichtbarer Companies-Liste unterscheiden. Anfaenger lernen: Erst pruefen, in welcher Instanz und Company man arbeitet, dann Company-Aktionen planen.

## Naechster Schritt

COMPANY-REGISTRY.md/json mit actual-visible/not-visible synchronisieren und danach den fachlich besten naechsten Lauf waehlen.
