# Universaarl Foundation Setup Field Map

Status: active-work  
Scope: lokale Vorbereitung, keine Business-Central-Ausfuehrung  
Company: `playthru / UNIVERSAARL-DE / Universaarl GmbH`

Diese Feldkarte ist kein Setup-Beweis. Sie trennt geplante Universaarl-Zielwerte von bereits sichtbarer Business-Central-Evidence. Erst ein spaeterer Write-/Import-Gate mit Screenshot-Bildkette und Reopen-Proof darf daraus gespeicherte Werte machen.

## Leitentscheidung

Fuer die offenen Foundation-Gaps wird zuerst eine Konfigurationspaket-/Excel-unterstuetzte Feldkarte vorbereitet. Das ist fuer ein echtes Kundenprojekt realistischer als weitere blinde Zellklicks in der Buchungsmatrix. Die manuelle Oberflaeche bleibt wichtig fuer Schulung und Einzelvalidierung, aber nicht als primaerer Masseneinrichtungsweg.

## Source-backed Route Decision

Status: `completed-local-decision`

Case: `FOUNDATION-SETUP-PACKAGE-TABLE-MAPPING-SOURCE-DECISION`

Konfigurationspakete sind fuer die Universaarl-Foundation der bevorzugte Implementierungsweg fuer wiederholbare Setupdaten. Microsoft beschreibt Konfigurationspakete als Werkzeug fuer groessere Einrichtungs- und Datenuebernahmen, besonders in leeren Companies und fuer wiederverwendbare Setupdaten. Fuer unser Buch bleibt die UI trotzdem sichtbar: Key User muessen verstehen, welche Seiten, Felder und Folgen hinter den Paketdaten stehen.

Die Entscheidung ist keine Schreibfreigabe. `U-VAT325-DISC` ist nicht mehr als leerer Paketkopf zu behandeln: Die Paketkarte zeigt inzwischen eine vorhandene Tabellenzeile fuer Table 325 / VAT Posting Setup. Das beweist nur Paketmetadaten, nicht USt-Setup. Das Paket wird nicht geloescht, nicht angewendet und nicht als aktive Foundation-Konfiguration wiederverwendet, bevor ein separater Read-first-/Write-Gate-Fall seine Felder, Werte, Validierungen, Cleanup-/Keep-Regel und Reopen-Proof festlegt.

Empfohlene naechste Route:

1. `FOUNDATION-SETUP-PACKAGE-FIELD-SELECTION-READFIRST`: Am bestehenden Paket `U-VAT325-DISC` nur lesend pruefen, ob die Table-325-Zeile eine klare Feld-/Auswahloberflaeche zeigt.
2. Danach separater Write-Gate fuer Feldselektion oder Paketwerte, falls der Read-first-Beweis die Felder eindeutig macht.
3. Erst spaeter Import/Validate/Apply, jeweils mit eigenem Gate, Screenshot-QA, Fehlerpfad und Reopen-Proof.

Nicht gewaehlt:

- weitere blinde UI-Zellversuche in Page 314 oder Page 472
- Sofort-Import oder Apply ohne Tabellen-/Feld-Read-first
- API-/AL-Shortcut fuer Foundation-Setup
- Wiederverwendung von `U-VAT325-DISC` fuer Setupwerte ohne vorherige Paketkarten- und Feldpruefung

## Minimaler Setup-Umfang

| ID | Setup-Objekt | BC-Seite / Tabelle | Geplanter Schluessel | Geplante Felder | Bereits bewiesen | Nicht bewiesen | Abhaengigkeit | Route Candidate | UAT-/Training-Wirkung | Screenshot-/Evidence-Bedarf | Stop-Regel | Naechste Aktion |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FS-001 | Allgemeine Buchungsmatrix (General Posting Setup) | Buchungsmatrix Einrichtung / Page 314; Tabelle `General Posting Setup (252)` | `INLAND` + `WAREN` | `Sales Account = 4400`; `Purch. Account = 5400` | Page-/Table-252-Kontext; `INLAND`/`WAREN`/`4400` als Teilstand; Konten `4400` und `5400` im Kontenplan sichtbar | `5400` nicht persistiert in der Matrix; keine Posting-Reife | Geschaeftsbuchungsgruppe `INLAND`, Produktbuchungsgruppe `WAREN`, Starterkonten | Konfigurationspaket-/Excel-assisted Feldkarte; spaeter gated Write/Import oder stabiler UI-Reopen-Proof | Erklaert Kontenfindung fuer Verkauf/Einkauf; noch kein O2C/P2P-UAT | Vorher: Page 314/252 oder Paketfeldliste; Nachher nur bei Write: Zielzeile mit `4400` und `5400` nach Reopen | Stop, wenn Tabelle/Feld nicht eindeutig ist oder ein Apply/Import ohne Gate erforderlich waere | Read-first Discovery fuer Konfigurationspaket-/Tabellenroute |
| FS-002 | MwSt.-Buchungsmatrix (VAT Posting Setup) | MwSt.-Buchungsmatrix / Page 472; Tabelle `VAT Posting Setup (325)` | `INLAND` + `VAT19` | `VAT % = 19`; Berechnungsart normale MwSt.; Umsatzsteuerkonto `3806`; Vorsteuerkonto `1406` | Page 472 und Table 325 sichtbar; `VAT19` als MwSt.-Produktbuchungsgruppe sichtbar; Konten `3806` und `1406` im Kontenplan sichtbar | keine gespeicherte `INLAND/VAT19`-Zeile; Page 470 bleibt als sichtbarer UI-Nachweis blockiert; keine VAT Entries | MwSt.-Geschaeftsbuchungsgruppe `INLAND`, MwSt.-Produktbuchungsgruppe `VAT19`, USt-Konten | Konfigurationspaket-/Excel-assisted Feldkarte; spaeter gated Write/Import; UI nur mit stabiler Zeilenroute | Erklaert USt-Setup fuer Anfaenger; noch kein deutscher Steuerfinalclaim | Vorher: Page 472/325 oder Paketfeldliste; Nachher nur bei Write: Zielzeile mit Gruppe, Prozent, Konten nach Reopen | Stop, wenn Page 470/Business Group oder Table-325-Feldzuordnung unklar ist | Read-first Discovery fuer Paketfeldliste und Pflichtfelder |
| FS-003 | MwSt.-Geschaeftsbuchungsgruppe (VAT Business Posting Group) | Page 470 aktuell nicht belastbar; Tabelle noch nicht lokal bewiesen | `INLAND` | Code und Beschreibung fuer Inlandsgeschaeft | Produktlogik durch Microsoft Learn; indirekter Kontext ueber Debitor/Fakturierung und VAT-Setup-Read-first | sichtbare Page-470-Zielseite und gespeicherte Gruppe nicht aktuell bewiesen | benoetigt fuer FS-002 und spaetere Debitoren-/Kreditorenlogik | Source-backed Read-first oder Konfigurationspaket-Discovery; kein Write ohne sichtbare Feld-/Tabellenbasis | Erklaert Partnerlogik in der USt; noch keine steuerliche Freigabe | Aktuelle Bildkette muss echte Zielseite, Feldliste oder Paket-Tabellenzeile zeigen | Stop, wenn nur Role Center, Suchkontext oder Page Inspection ohne Zielobjekt sichtbar ist | In der Discovery als Abhaengigkeit markieren, nicht blind anlegen |
| FS-004 | Allgemeine Geschaefts-/Produktbuchungsgruppen | Geschaeftsbuchungsgruppen / Produktbuchungsgruppen | `INLAND`; `WAREN` | Code, Beschreibung, ggf. Default-Verknuepfungen | Gruppen-Kontext read-first sichtbar; Artikel `U-ITEM-HW100` nutzt `WAREN` | nicht als vollstaendige Prozessfreigabe; keine Eintraege/Preview | benoetigt fuer FS-001 und Master Data | Validieren, nicht neu schreiben; nur bei Abweichung separater Gate | Erklaert warum Partner und Produkt zusammen Konten bestimmen | Screenshot der Gruppen und ggf. Karten-/Page-Inspection-Kontext | Stop, wenn eine Gruppe fehlt oder anders bedeutet als angenommen | Nur als Dependency in Field Map fuehren |

## Nicht im Umfang

- kein Konfigurationspaket erstellen, importieren, validieren oder anwenden
- keine Setup-Aenderung
- keine Stammdatenanlage
- kein Beleg, kein Journal, keine Buchungsvorschau, keine Buchung
- kein finaler SKR04-, USt-, HGB-, GoBD- oder AO-Claim
- keine vertraulichen echten Kundendaten

## Naechster no-write Case

`FOUNDATION-SETUP-PACKAGE-FIELD-SELECTION-READFIRST`

Ziel: In `playthru / UNIVERSAARL-DE` nur lesend pruefen, ob die vorhandene Table-325-Zeile in `U-VAT325-DISC` eine Feld-/Auswahloberflaeche sichtbar und verstaendlich macht. Der Lauf darf kein Paket erstellen, keine Felder toggeln oder auswaehlen, nichts anwenden, importieren, validieren, exportieren oder Setupwerte speichern.
