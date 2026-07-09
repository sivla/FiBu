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

Aktuelle Folgeentscheidung nach dem Parken:

1. Die konkrete `U-VAT325-DISC`-Feldselektionsroute wird nicht erneut versucht. Der korrigierte Read-first-Beweis reicht nicht fuer eine sichere Feldselektion.
2. Konfigurationspakete bleiben als Implementierungsweg plausibel, aber nur ueber eine materiell andere Hypothese: andere Business-Central-Oberflaeche, bessere Feld-/Tabellenquelle, neuer Helper, andere Zielsetzung oder explizite Freigabe.
3. Der naechste Schritt ist lokal/no-live: eine alternative Foundation-Setup-Route aus Quelle, Feldkarte, Rejected-Route-Register und Foundation-Grenzen entscheiden. Erst danach darf ein neuer read-first- oder Write-Gate-Case vorbereitet werden.

Nach `FOUNDATION-SETUP-ALTERNATIVE-ROUTE-SOURCE-DECISION` ist die naechste Route nicht write-ready. Microsoft Learn stuetzt Konfigurationspakete fuer Erstsetup und strukturierte Datenuebernahme, verlangt aber passende Struktur, Feld-/Tabellenmapping, Validierung und Fehlerpruefung. Deshalb folgt zuerst `FOUNDATION-SETUP-SOURCE-TABLE-FIELD-REVIEW`, lokal/no-live.

Nach `FOUNDATION-SETUP-SOURCE-TABLE-FIELD-REVIEW` sind Table 252 und Table 325 nur Kandidaten fuer die weitere Planung. Page/Table 470 bleibt eine Quelle-/UI-Luecke. Die Route ist deshalb nicht read-first- oder write-ready. Der naechste Schritt ist `FOUNDATION-SETUP-VALUE-MAP-DECISION`, lokal/no-live: Zielwerte, Owner, Abhaengigkeiten, Validierungsregeln und Proof-Anforderungen werden entschieden, bevor ein Configuration-Worksheet-, Paket-, Import-/Apply- oder UI-Gate vorbereitet wird.

Nach `FOUNDATION-SETUP-VALUE-MAP-DECISION` sind die Zielwerte enger klassifiziert: `4400`/`5400` fuer Table 252 sind nur read-first-Ziele, keine Schreibfreigabe. Die USt-Zielwerte fuer Table 325 bleiben `needs-source-check-first`, weil `INLAND` als MwSt.-Geschaeftsbuchungsgruppe / Page/Table 470 nicht sauber source- und UI-bewiesen ist. Der naechste Schritt ist deshalb `FOUNDATION-SETUP-SOURCE-GAP-DECISION`, lokal/no-live.

Nach `FOUNDATION-SETUP-SOURCE-GAP-DECISION` ist die Produktquelle enger: Microsoft dokumentiert `VAT Business Posting Group` als Table 323 mit `Code` und `Description` sowie der Lookup-/Drilldown-Seite `VAT Business Posting Groups`. Das klaert die Objekt- und Feldquelle, beweist aber nicht, dass `INLAND` in `playthru / UNIVERSAARL-DE` lokal existiert. Der naechste Schritt ist deshalb `FOUNDATION-CONFIGURATION-WORKSHEET-FIELD-MAP-READFIRST`: read-first/no-write ueber Konfigurationsarbeitsblatt oder vergleichbare Tabellen-/Feldoberflaeche. Direkte Page-470-/Suchwiederholungen und die `U-VAT325-DISC`-Feldselektionsroute bleiben geparkt.

Nach `FOUNDATION-CONFIGURATION-WORKSHEET-FIELD-MAP-READFIRST` sind die Oberflaechen besser bewiesen: Das Konfigurationsarbeitsblatt ist als Vordergrund-Seitenpaneel sichtbar, die Seite Konfigurationspakete ist als Listenpage sichtbar, und die Bildkette unterscheidet Role Center, Seitenpaneel und Zielseite. Das ist ein guter Read-first-Nachweis fuer den Standardweg, aber noch keine Schreibfreigabe. Das sichtbare `325` stammt mindestens teilweise aus dem Paketcode `U-VAT325-DISC`; deshalb ist es kein belastbarer Beweis fuer eine echte Table-325-Zeile oder Feldliste. Table 323 und Table 252 sind in diesem Lauf ebenfalls nicht belastbar sichtbar. Der naechste Schritt ist deshalb nur eine lokale `FOUNDATION-SETUP-PACKAGE-WRITE-GATE-DECISION`: pruefen, ob ein enger weiterer Read-first- oder Metadata-Gate sinnvoll ist. Kein Setup-Write, kein Get Tables, keine Feldauswahl und kein Apply.

Nach `FOUNDATION-SETUP-PACKAGE-WRITE-GATE-DECISION` bleibt die Konfigurationspaket-Route fachlich plausibel, ist aber fuer Foundation-Setup aktuell geparkt. Die neue Bildkette beweist Oberflaechen, nicht Feldmapping. Ohne belastbaren Nachweis fuer Table 323, Table 252 und Table 325 gibt es keinen Paket-Write-Gate, kein `Get Tables`, keine Feldauswahl, keinen Import, kein Validate, kein Apply und keine Setup-Aenderung. Foundation Readiness muss diese Grenze als naechstes lokal/no-live konsumieren und danach eine materiell andere Route waehlen oder die Luecke bewusst parken.

## Read-first Ergebnis vom 2026-07-09

Status: `parked`

Der Case `FOUNDATION-SETUP-PACKAGE-FIELD-SELECTION-READFIRST` hat die Paketkarte `U-VAT325-DISC` in `playthru / UNIVERSAARL-DE` lesend geoeffnet. Die Paketkarte und Feldzaehlspalten sind sichtbar. Die visuelle Pruefung zeigt aber keine belastbar sichtbare Table-325-Zeile und keinen sicheren Feldauswahlkontext. Ein frueherer Treffer auf `325` darf nicht als Tabellenzeilenbeweis gelten, weil `325` auch im Paketcode und Paketnamen vorkommt.

Entscheidung: Die konkrete `U-VAT325-DISC`-Feldselektionsroute wird geparkt. Kein Field-Selection-Write-Gate, kein Import, kein Validate, kein Apply und kein Setup-Write darf daraus folgen, bis eine materiell neue Hypothese existiert. Foundation Readiness muss diesen Blocker konsumieren und danach entscheiden, ob Konfigurationspakete ueber eine andere Oberflaeche, ein anderes Paket, eine Quellen-/Tabellenanalyse oder eine manuelle UI-Route weiterverfolgt werden.

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

## Naechster lokaler Case

`FOUNDATION-READINESS-DECISION`

Ziel: Die geparkte Konfigurationspaket-Route in die Foundation-Readiness-Grenze uebernehmen. Master Data, O2C/P2P, Import/Apply, Setup-Write, Preview Posting und Posting bleiben gesperrt, bis eine materiell andere, belegbare Foundation-Route entschieden ist.
