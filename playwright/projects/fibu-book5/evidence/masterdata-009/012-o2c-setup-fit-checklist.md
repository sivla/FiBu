# O2C Setup-Fit nach MASTERDATA-009

Stand: CRONUS-USA-Labor, Sandbox `MCP_1_20260210`, Company `Rhein-Main Demo GmbH`.

| Bereich | Benoetigt fuer `UAT-O2C-001` | Aktueller Laborstatus | Evidence | Naechster Schritt |
|---|---|---|---|---|
| Stammdaten Debitor | `D10000` / Mueller Maschinenbau GmbH | vorhanden, `Currency Code = EUR` gesetzt | `masterdata-005`, `UAT-O2C-001` | im DE-Finallauf erneut pruefen |
| Stammdaten Artikel | `RM-M100`, Menge `1`, Preis `68.000` | vorhanden, technisch verkaufsfaehig | `masterdata-005`, `masterdata-006`, `UAT-O2C-001` | im DE-Finallauf erneut pruefen |
| Posting Groups Debitor/Artikel | Debitoren-, Geschaefts-, Produkt- und Lagerbuchungsgruppen | CRONUS-Technikfit vorhanden; Inventory Posting Setup fuer `FRA-ZL` + `RESALE` jetzt `14140` | `masterdata-006`, `masterdata-008`, `masterdata-009` | `Preview Posting` erneut ausfuehren |
| Tax/VAT/Sales Tax | Ziel waere deutsche `19 %` USt | nicht geloest; Labor bleibt CRONUS-Sales-Tax mit `FURNITURE` / `0 %` | `045-target-vs-labor-delta.md`, Microsoft-Doc-Validation | nicht erzwingen; DE-Finalnachweis separat |
| Dimensionen | `PRODUCTLINE = MACHINE`, `CHANNEL = B2B` | Standarddimensionen gesetzt und im O2C-Dimensionsdialog sichtbar | `masterdata-007`, `uat-o2c-001-050-*` | spaeter in Posten/Reporting wiederfinden |
| Waehrung | `EUR` am Debitor und Auftrag | geloest im Labor | `UAT-O2C-001`, `CURRENT-STATE.md` | im DE-Finallauf erneut pruefen |
| Lager/Location | `FRA-ZL` als einfacher Lagerort | vorhanden; Warehouse bewusst noch nicht aktiviert | `masterdata-004`, `UAT-O2C-001` | Warehouse erst spaeter separat |
| Nummernserien / Beleganlage | Verkaufsauftrag muss reproduzierbar entstehen | API erzeugt Laborauftrag; BC vergibt Belegnummer | `UAT-O2C-001` API-Evidence | fuer finale Screenshots weiter API + UI-Nachweis nutzen |
| Cleanup | Laborauftraege duerfen Spielwiese nicht fuellen | Cleanup nach O2C-Lauf vorhanden | `evidence/uat-o2c-001/999-cleanup.json` | nach jedem O2C-Lauf beibehalten |
| Buchungsvorschau / Posten | Preview Posting vor echter Buchung | alter Blocker vorbereitet, aber Folge-Preview offen | `masterdata-009` | `npm run fibu:uat:o2c` erneut laufen lassen |

## Setup-Fit-Entscheidung

Der zuletzt blockierende Setup-Punkt ist im Labor vorbereitet: `Inventory Account = 14140` fuer `FRA-ZL` + `RESALE`. Diese Entscheidung ist aus vorhandenen CRONUS-RESALE-Zeilen abgeleitet und deshalb fuer die Spielwiese vertretbar.

Das ist kein finaler deutscher Nachweis. Steuer/VAT, deutsche Oberflaeche, echter Postenlauf und Buchungsspur bleiben offen.
