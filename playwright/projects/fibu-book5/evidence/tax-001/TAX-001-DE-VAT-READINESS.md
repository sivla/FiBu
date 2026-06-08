# TAX-001 - Deutsche VAT-/USt-Readiness aus CRONUS-USA-Labor abgrenzen

Stand: 08.06.2026

## Einordnung

Dieser Lauf ist ein Buch-/Evidence-Sync ohne neue Business-Central-Ausfuehrung.

Status:

- Sandbox: `MCP_1_20260210`
- Company: `RM-DEMO`
- Modus: `labor`, `book-sync`, `tax-readiness`, `no-posting`, `no-setup`
- Basis: O2C-Laborrechnung `PS-INV103297`, P2P-Laborrechnung `108219`, vorhandene Tax-/VAT-Evidence und Microsoft-Doc-Validation

## Warum dieser Block jetzt wichtig ist

Coverage fuehrt den deutschen Steuerfit als naechste fehlende Klickanleitung mit Prioritaet 1. Gleichzeitig duerfen Reporting und Payments aktuell nur mit Freigabe weitergehen. Der Steuerblock ist deshalb der beste autonome Fortschritt: Er verhindert, dass spaetere Laeufe CRONUS-USA-Sales-Tax als deutschen `19 %`-VAT-Endstand missverstehen.

## Aktuelle Laborwahrheit

| Bereich | Beleg | Laborbefund | Zielbild |
|---|---|---|---|
| O2C | `PS-INV103297` | `68.000 EUR`, `totalTaxAmount = 0`, `taxPercent = 0`, `Tax Group Code = FURNITURE` | `68.000 EUR`, `19 %`, Steuer `12.920 EUR`, Brutto `80.920 EUR`, USt-Posten |
| P2P | `108219` | `25.000`, `totalTaxAmount = 0`, `Tax Percent = 0`, CRONUS-USA-Labor | `25.000 EUR`, `19 %` Vorsteuer `4.750 EUR`, Brutto `29.750 EUR`, Vorsteuerposten |
| Setup-Pfad | Page `472/473` | im Labor als `VAT Posting Setup` / `Tax Posting Setup` sichtbar, aber `VAT Calculation Type = Sales Tax` dokumentiert | deutsche VAT Business Posting Group, VAT Product Posting Group, VAT Posting Setup mit `19 %` |
| Steuerlogik | `mcp-tax-origin`, O2C/P2P Evidence | US-Sales-Tax-Kontext mit Tax Area/Tax Group/Tax Details | deutsche USt-/VAT-Logik mit VAT Entries und deutscher Nachweissicht |

## Was als Labor-Evidence gilt

- O2C beweist Bedienpfad, EUR, Verkaufsbeleg, Preview, Buchung, Postenspur und Dimension am Artikelposten.
- P2P beweist Einkaufsbeleg, Preview, Buchung und Postenspur.
- Beide Prozesse beweisen gerade nicht den deutschen Steuerendstand, weil die Steuerbetraege im Labor `0` sind.
- Die vorhandene CRONUS-Tax-Gruppe `FURNITURE` ist ein Technik-/Laborfit fuer die aktuelle Sandbox, keine deutsche Maschinen-USt-Gruppe.

## Microsoft-Learn-Abgleich

Die vorhandene `MICROSOFT-DOC-VALIDATION.md` verweist auf Microsoft Learn:

- VAT wird in Business Central ueber VAT Business Posting Groups, VAT Product Posting Groups und VAT Posting Setup berechnet.
- Business Central beschreibt Sales Tax als separaten Steuerpfad fuer passende Laender-/Regionenversionen.
- Fuer Deutschland braucht der finale Nachweis zusaetzlich deutsche Lokalisierung, deutsche Steuerberichte und ggf. ELSTER-/VAT-Advance-Notification-Kontext.

Konsequenz fuer dieses Projekt:

`Tax Group Code = FURNITURE` und `taxPercent = 0` duerfen nicht in `VAT19` oder deutsche USt umbenannt werden. Der naechste deutsche Steuerlauf braucht entweder eine passende deutsche Zielcompany oder eine ausdruecklich freigegebene, dokumentierte VAT-Setup-Strecke.

## Zielzustand fuer einen spaeteren DE-Finallauf

Vor einem deutschen O2C-/P2P-Finallauf muss mindestens geklaert und bebildert sein:

| Setupbereich | Erwartung |
|---|---|
| Company/Lokalisierung | deutsche Zielcompany oder ausdruecklich als DE-VAT-Setup freigegebene Laborstrecke |
| Debitor/Kreditor | VAT Business Posting Group fuer inlaendische Geschaefte |
| Artikel/Ressource/Sachkonto | VAT Product Posting Group fuer `19 %` |
| VAT Posting Setup | Kombination Business/Product mit `VAT % = 19`, passenden Sales-/Purchase-VAT-Konten und nicht blockiert |
| Belegzeile | Steuer-/VAT-Felder zeigen den erwarteten `19 %`-Kontext |
| Preview Posting | VAT-/USt-Wirkung vor Buchung sichtbar oder fachlich erklaert |
| Gebuchte Posten | VAT Entries/USt-Posten, G/L Entries, Nebenbuchposten und Belegsumme stimmen |
| Evidence Pack | Ziel vs. Labor, Screenshots, JSON, Buchwirkung, Limitationen |

## Buchwirkung

Das Buch darf im aktuellen Labor sagen:

- Die Bedienpfade fuer O2C und P2P funktionieren im CRONUS-USA-Labor.
- Steuer ist bewusst als offene Grenze markiert.
- Der Leser muss USt-Setup als eigene Einrichtungsebene verstehen, getrennt von Customer/Vendor Posting Groups, General Posting Setup und Inventory Posting Setup.

Das Buch darf noch nicht sagen:

- `UAT-O2C-001` sei als deutscher `19 %`-Fall gebucht.
- `UAT-P2P-001` sei als deutscher `19 %`-Vorsteuerfall gebucht.
- `Tax Group Code = FURNITURE` sei ein deutscher Maschinensteuer-Code.
- Page `472/473` im CRONUS-USA-Labor beweise deutsche VAT-Posting-Einrichtung.

## Naechster konkreter Schritt

Ohne Setup-Freigabe:

- Steuerkapitel und Coverage weiter synchron halten.
- Keine neue O2C-/P2P-Buchung fuer `19 %`.

Mit Freigabe:

1. DE-VAT-Setup-Readiness als UI-Klickpfad starten.
2. Debitor/Kreditor und Artikel auf VAT Business/Product Posting Groups pruefen.
3. VAT Posting Setup fuer Zielkombination pruefen.
4. Erst danach Preview und ggf. genau eine kontrollierte deutsche Laborbuchung.

