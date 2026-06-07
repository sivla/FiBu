# Playwright-MCP-Workflow fuer Business Central

Diese Datei beschreibt, wie das Projekt Playwright MCP sinnvoll nutzt, ohne die Reproduzierbarkeit der Buchscreenshots zu verlieren.

## Entscheidung

Playwright MCP ist fuer dieses Projekt sinnvoll, aber nicht als alleiniger Produktionsweg.

| Zweck | Empfohlenes Werkzeug |
|---|---|
| unbekannte BC-Seite erkunden | Playwright MCP |
| Menues, Dialoge, Rollen, Labels und Frames live finden | Playwright MCP |
| Stammdaten- oder Setup-Pfad erstmalig ausprobieren | Playwright MCP, danach Playwright-Test |
| finale oder wiederholbare Buchscreenshots erzeugen | Playwright-Testskripte |
| Evidence Pack, Cleanup, Soll-Ist-Abgleich | Playwright-Testskripte |
| CI/CD, Repo-Umzug, anderer Codex-Account | Playwright-Testskripte |

Kurzregel:

> MCP findet den Weg. Das Repo beweist den Weg.

## Offizielle Einordnung

Primarquellen:

- Playwright-Dokumentation: https://playwright.dev/mcp/introduction
- Microsoft Learn fuer Playwright MCP in Power Platform Tests: https://learn.microsoft.com/en-us/power-platform/developer/playwright-samples/ai-mcp

Wichtige Punkte aus den Quellen:

- Playwright MCP ist ein Model-Context-Protocol-Server fuer Browserautomation mit Playwright.
- MCP arbeitet mit strukturierten Accessibility-Snapshots und Element-Referenzen.
- Es kann navigieren, klicken, tippen, Screenshots erzeugen, Storage State verwalten und Playwright-Code/Locatoren ableiten.
- Microsoft beschreibt MCP besonders als Hilfe, um echte DOM-Strukturen, Labels, Frames und Wartebedingungen zu erkennen und daraus bessere Tests zu schreiben.

## Aktueller Stand in dieser Codex-Sitzung

In dieser Sitzung ist kein Playwright-MCP-Tool als direkt aufrufbares Codex-Tool verfuegbar. Die Suche nach einem passenden Tool hat keine eingebaute MCP-Browsersteuerung geliefert.

Der offizielle MCP-Server kann aber lokal gestartet und ueber einen temporaeren MCP-Client angesprochen werden. Der Smoke-Test hat gezeigt:

| Pruefung | Ergebnis |
|---|---|
| `npx @playwright/mcp@latest --help` | erfolgreich |
| MCP-Toolliste | `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_take_screenshot`, `browser_evaluate` usw. verfuegbar |
| Business-Central-Login mit Storage State | erfolgreich nur mit `--isolated --storage-state` |
| Snapshot | zeigt `Dynamics 365 Business Central` und `Rhein-Main Demo GmbH` |
| Evidence | `playwright/projects/fibu-book5/evidence/mcp-smoke/mcp-bc-home-snapshot.txt` |

Ohne `--isolated` landete MCP trotz Storage State auf dem Microsoft-Entra-ID-Login. Das ist ein wichtiger technischer Befund fuer kuenftige MCP-Laeufe.

Trotzdem laufen die aktuellen Business-Central-Arbeiten weiterhin ueber normale Playwright-Testskripte:

```powershell
npm run fibu:uat:o2c
```

Diese Skripte erzeugen:

- Screenshots unter `img/`
- Screenshot-Metadaten unter `playwright/projects/fibu-book5/evidence/<testfall>/`
- API-/Text-/Delta-Evidence
- Cleanup-Nachweise fuer Laborbelege

## Warum MCP fuer Business Central trotzdem Sinn macht

Business Central ist fuer automatisierte Klickpfade anspruchsvoll:

- viele Aktionen liegen in verschachtelten Menues
- sichtbare deutsche und englische Begriffe koennen gemischt sein
- Rollencenter, Personalisierung und Sprache veraendern Treffer
- FactBoxes, Listen, Modale und Iframes erschweren naive Selektoren
- Tabellenwerte sind manchmal nicht sauber ueber `innerText` sichtbar
- Menues wie `Line` -> `Related Information` -> `Dimensions` sind schwer blind zu erraten

MCP kann hier schneller helfen als reines Trial-and-Error im Testskript:

1. aktuelle Seite oeffnen
2. Accessibility-Snapshot lesen
3. relevante Buttons, Tabs, Menues und Dialoge identifizieren
4. Klickpfad live ausprobieren
5. Locator-Idee oder Aktionsfolge ins Playwright-Testskript ueberfuehren

## Arbeitsmodus mit MCP

### 1. Exploration starten

Beispielprompt an einen Codex-/IDE-Agenten mit verfuegbarem Playwright-MCP:

```text
Nutze Playwright MCP. Oeffne Business Central mit dem gespeicherten Storage State oder melde dich an.
Navigiere zum Verkaufsauftrag UAT-O2C-001. Erzeuge einen Snapshot.
Finde den Pfad zum Dimensionsdialog der Verkaufszeile und notiere die sichtbaren Aktionen.
```

### 2. Beobachtung dokumentieren

Jede MCP-Exploration bekommt eine kurze Notiz in:

- `playwright/FINDINGS.md`
- `playwright/projects/fibu-book5/UI-INVENTORY.md`
- bei Fehlern: `playwright/projects/fibu-book5/WORKAROUNDS-AND-ERRORS.md`

Pflichtangaben:

| Feld | Inhalt |
|---|---|
| Seite | z. B. `Sales Order`, Page `42` |
| Kontext | z. B. Verkaufszeile mit `RM-M100` |
| gefundener Pfad | z. B. `Line` -> `Related Information` -> `Dimensions` |
| sichtbare Zielwerte | z. B. `PRODUCTLINE = MACHINE` |
| Risiko | z. B. Sprache/Role Center/Personalisierung |
| naechster Skriptschritt | welcher Playwright-Test erweitert wird |

### 3. In Playwright-Test ueberfuehren

Eine MCP-Exploration gilt erst als projektverwertbar, wenn daraus ein Testskript entsteht.

Beispiel aus dem aktuellen O2C-Lauf:

| MCP-/Explorationsbefund | Playwright-Testumsetzung |
|---|---|
| `Line` oeffnet Zeilenaktionen | `clickFirstVisibleAction(page, /^Line$/i)` |
| `Related Information` enthaelt `Dimensions` | `clickFirstVisibleAction(page, /^Related Information$/i)` |
| Dialog `Edit Dimension Set Entries` zeigt Werte | Screenshot `uat-o2c-001-050-dimension-productline-machine.png` und Evidence `050-line-dimension-dialog-result.json` |

### 4. Evidence erzeugen

Ad-hoc-MCP-Klicks reichen nicht als Evidence Pack.

Fuer Buch und UAT zaehlt erst:

- PNG-Screenshot
- Screenshot-Metadaten
- Page-Text oder API-Evidence
- Soll-Ist-Abgleich
- Cleanup
- Markdown-Erklaerung im Buch oder Projekt

## Beispiel: O2C-Dimension mit MCP erkunden

Ziel:

`PRODUCTLINE = MACHINE` im Verkaufsauftrag fuer `D10000` / `RM-M100` sichtbar nachweisen.

Erwarteter MCP-Explorationspfad:

1. Verkaufsauftrag oeffnen.
2. Verkaufszeile `RM-M100` fokussieren.
3. Aktion `Line` oeffnen.
4. `Related Information` oeffnen.
5. `Dimensions` waehlen.
6. Dialog `Edit Dimension Set Entries` pruefen.
7. Werte `CHANNEL = B2B` und `PRODUCTLINE = MACHINE` notieren.

Danach muss der Pfad im Testskript liegen. Der aktuelle O2C-Test tut das bereits.

## Beispiel: Waehrung `EUR` erkunden

Der naechste MCP-geeignete Fall ist die Waehrung:

Fragestellung:

- Warum erzeugt CRONUS-USA den Auftrag mit `currencyCode = USD`?
- Kann der Verkaufsauftrag im Kopf auf `EUR` gestellt werden?
- Gibt es am Debitor `D10000` einen Waehrungscode?
- Ist `EUR` als Currency eingerichtet?
- Welche UI-Felder zeigen die Belegwaehrung sichtbar?

MCP kann hier zuerst die UI finden:

1. Auftragskopf oeffnen.
2. `Mehr anzeigen` im Bereich `General` nutzen.
3. Feld `Currency Code` / `Waehrungscode` suchen.
4. Falls nicht sichtbar: Personalisierung oder weitere FastTabs pruefen.
5. Danach Playwright-Test oder API-Helfer anpassen.

Wichtig:

Auch wenn MCP die Einstellung findet, muss der finale Nachweis als Testskript laufen und `045-target-vs-labor-delta.md` aktualisieren.

Aktueller MCP-Befund vom 2026-06-07:

| Pruefung | Ergebnis |
|---|---|
| Seite `Currencies` | per Tell-Me mit englischem Suchwort `Currencies` gefunden |
| Deutsche Suche `Waehrungen` | in der gemischten UI nicht verlaesslich fuer diese Seite |
| `EUR` in Waehrungsliste | vorhanden, Beschreibung `Euro`, Symbol `€` |
| Debitor `D10000` | `Currency Code` war zunaechst leer |
| Funktionsfaehiger UI-Pfad | `Customer Card` -> Stift `Aenderungen auf der Seite vornehmen` -> `Invoicing` -> `Mehr anzeigen` -> `Prices and Discounts` -> `Currency Code = EUR` |
| Technischer Stolperpunkt | Im Edit-Modus heisst der FastTab wegen Pflichtfeldhinweis nicht nur `Invoicing`, sondern `Invoicing, Diese Gruppe enthaelt mindestens ein Pflichtfeld...`; Automatisierung darf nicht nur auf den exakten FastTab-Text pruefen. |
| Persistenznachweis | `playwright/projects/fibu-book5/evidence/mcp-currency/verify-customer-currency-persisted-summary.json` |

Die MCP-Exploration hat hier einen echten Setup-Fehler gefunden und geloest. Fuer den naechsten produktiven O2C-Lauf muss der normale Playwright-Test pruefen, ob neue Verkaufsauftraege fuer `D10000` jetzt `EUR` ziehen und ob `045-target-vs-labor-delta.md` entsprechend kleiner wird.

Direkter MCP-Gegencheck:

- Neuer Verkaufsauftrag `S-ORD101051` fuer `D10000` / `Mueller Maschinenbau GmbH` wurde angelegt.
- Snapshot `playwright/projects/fibu-book5/evidence/mcp-o2c-eur-check/040-general-show-more-currency-check.txt` zeigt `Currency Code: EUR` und Summenfelder mit `(EUR)`.
- Der Laborauftrag wurde danach per UI geloescht; Snapshot `050-after-delete-attempt.txt` zeigt die Liste wieder mit 7 statt 8 Eintraegen und ohne `S-ORD101051`.
- Damit ist fachlich bestaetigt: Der Waehrungsfehler im ersten O2C-Lauf war am Debitor-Stammdatensatz behebbar. Die USt-Abweichung bleibt offen.

## Beispiel: Steuerlogik mit MCP abgrenzen

Nach der EUR-Korrektur wurde ein weiterer MCP-Laborauftrag `S-ORD101052` angelegt und wieder geloescht.

MCP-Befund:

| Pruefung | Ergebnis |
|---|---|
| Auftrag | `S-ORD101052`, Debitor `D10000`, Artikel `RM-M100`, Menge `1` |
| Waehrung | `Currency Code: EUR` sichtbar |
| Zeilensteuerkontext | `Tax Area Code` leer, `Tax Group Code = FURNITURE` |
| Geoeffnete Sales-Tax-Seiten | `Tax Groups` Page 467, `Tax Details` Page 468, `Tax Areas` Page 469 |
| Geoeffnete VAT-Seiten | `VAT Business Posting Groups` Page 470, `VAT Product Posting Groups` Page 471 |
| Direkter VAT-Posting-Quercheck | Page 472 oeffnet `VAT Posting Setup` / `Tax Posting Setup`; Card Page 473 zeigt `VAT Calculation Type = Sales Tax` |
| Sichtbarer Setup-Befund | `Tax Details` enthaelt US-Sales-Tax-Werte wie GA/FURNITURE mit `Tax Below Maximum 3,0`; kein deutscher `19 %`-Zielzustand |

Microsoft Learn bestaetigt die fachliche Trennung:

- VAT wird ueber VAT Business Posting Groups, VAT Product Posting Groups und VAT Posting Setup berechnet: https://learn.microsoft.com/en-us/dynamics365/business-central/finance-setup-vat
- Sales Tax ist ein eigener Steuerkontext fuer Laender/Regionen mit Sales Tax: https://learn.microsoft.com/en-us/dynamics365/business-central/sales-tax-concept

Projektregel:

MCP darf Sales-Tax-Seiten als Laborbefund zeigen. Fuer finale deutsche Buchscreenshots darf das Projekt aber nicht versuchen, `19 %` durch irgendeinen US-Tax-Area-Workaround zu simulieren. `19 %` braucht deutschen Zielmandanten oder explizit dokumentiertes deutsches VAT-Setup.

### Steuerherkunft am Stammdatensatz pruefen

Nach der Setup-Seiten-Exploration wurde per MCP geprueft, welche Stammdatenfelder den O2C-Auftrag konkret speisen.

| Stammdatensatz | Seite | MCP-Befund | Bedeutung |
|---|---|---|---|
| Artikel `RM-M100` | `Item Card`, Bereich `Costs & Posting` | `Gen. Prod. Posting Group = RETAIL`, `Tax Group Code = FURNITURE`, `Inventory Posting Group = RESALE` | Der Artikel liefert Produkt-, Lager- und Sales-Tax-Produktlogik fuer die Verkaufszeile. |
| Debitor `D10000` | `Customer Card`, Bereich `Invoicing` | `Tax Liable` aktiv, `Tax Area Code` leer, `Gen. Bus. Posting Group = DOMESTIC`, `Customer Posting Group = DOMESTIC`, `Currency Code = EUR` | Der Debitor liefert Geschaefts-/Debitorenbuchungslogik und Waehrung. Die leere `Tax Area Code` verhindert aber keinen Auftrag; sie zeigt nur, dass hier kein deutscher VAT-Fall bewiesen ist. |

Evidence:

- `playwright/projects/fibu-book5/evidence/mcp-tax-origin/010-item-rm-m100-card-initial.txt`
- `playwright/projects/fibu-book5/evidence/mcp-tax-origin/120-customer-after-Invoicing-more.txt`
- `playwright/projects/fibu-book5/evidence/mcp-tax-origin/tax-origin-mcp-summary.json`
- `playwright/projects/fibu-book5/evidence/mcp-vat-posting-setup/vat-posting-setup-mcp-summary.json`

Didaktische Regel fuer das Buch:

Ein Anfaenger darf bei `FURNITURE` nicht haengen bleiben und glauben, das sei die deutsche Steuerlogik fuer eine Maschine. In dieser CRONUS-Spielwiese ist `FURNITURE` ein vorhandener Sales-Tax-Code, der den technischen Probelauf moeglich macht. Fuer die finale Rhein-Main-Anleitung muss spaeter sichtbar werden, welche VAT Business Posting Group, VAT Product Posting Group und VAT Posting Setup-Kombination die `19 %` erzeugt.

## Sicherheits- und Betriebsregeln

- MCP nur gegen Sandbox- oder Testumgebungen nutzen.
- Keine Produktivmandanten fuer Exploration.
- Testbenutzer mit begrenzten Rechten nutzen.
- Keine Zugangsdaten oder Tokens in Markdown schreiben.
- Storage State nur lokal und bewusst verwenden.
- MFA/Login-Probleme als Workaround dokumentieren, nicht umgehen.
- Jede Datenanlage braucht Cleanup oder eindeutige Testdatenkonvention.

## Installationshinweis

Wenn der zukuenftige Codex-/IDE-Client MCP-Server konfigurieren kann, ist der offizielle Startpunkt:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

Alternativ nennt Microsoft Learn:

```powershell
npx @playwright/mcp
```

oder globale Installation:

```powershell
npm install -g @playwright/mcp
```

Fuer Business Central mit vorhandenem Playwright-Storage-State hat sich im Smoke-Test diese Startlogik bewaehrt:

```powershell
npx @playwright/mcp@latest `
  --headless `
  --isolated `
  --storage-state C:\Pfad\zum\Repo\playwright\.auth\bc-user.json `
  --viewport-size 1920x1080 `
  --output-dir C:\Pfad\zum\Repo\playwright\projects\fibu-book5\evidence\mcp-smoke
```

Die konkrete Einbindung haengt vom Client ab. Fuer dieses Repository gilt: MCP-Konfiguration gehoert nicht blind ins Projekt, wenn sie nur lokal fuer einen Agenten gilt. Projektweit dokumentieren wir Workflow, nicht private Token oder persoenliche Clientpfade.

## Projektstandard

1. MCP fuer schnelle Exploration nutzen, wenn verfuegbar.
2. Jede Erkenntnis in `FINDINGS.md`, `UI-INVENTORY.md` oder `WORKAROUNDS-AND-ERRORS.md` dokumentieren.
3. Danach einen Playwright-Test oder Helper bauen.
4. Evidence Pack erzeugen.
5. Buchtext aktualisieren.

Nur Schritt 1 ist optional. Schritte 2 bis 5 sind Pflicht, damit das Projekt Business Central wirklich lernt.
