# Buch-zu-Evidence-Audit

Update nach `FIXEDASSETS-038`: `K30000` / `Zollspedition Nord GmbH` ist in `RM-DEMO` UI-first als Labor-Kreditor sichtbar. Kapitel 21 darf die Kreditorenanlage jetzt als belegten Labor-Stammdatenschritt beschreiben, muss aber die Auto-Number-Falle erklaeren: Business Central kann nach Vendor-Template-Auswahl einen Entwurf wie `V00030` erzeugen, der erst durch echte UI-Eingabe und sichtbaren Nachweis zum Zielcode `K30000` wird. `V00020` wurde als leerer versehentlicher Draft per UI geloescht. Keine Einkaufsrechnung, kein Zugang, keine AfA, keine Buchung und kein deutscher Finalnachweis.
Stand: 09.06.2026

Dieser Audit ist die harte Abgleichdatei zwischen Buch, `RM-DEMO`-Laborstand und Evidence. Er ersetzt keine Tests. Er sagt, welche Buchaussagen bereits praktisch tragen, welche nur im CRONUS-USA-Labor gelten und welche noch als offene These behandelt werden muessen.

Update nach O2C-Sync: Die zentralen O2C-Buchstellen wurden auf den Laborstand `S-ORD101068` -> `PS-INV103297` korrigiert. `MASTERDATA-009`, die geloeste Preview-Posting-Blockade, die Laborbuchung und die offene deutsche 19-%-USt sind im Buch jetzt getrennt markiert. Offen bleiben Sachposten-/Reportingdimensionen und der deutsche Finalnachweis.

Update nach `BOOK-O2C-FOUNDATION-DRIFT-SYNC`: Der nach `GOVERNANCE-009` geplante No-Approval-Buchsync ist erledigt. Die zentrale O2C-Stelle war bereits weitgehend synchron; nachgeschaerft wurden zwei Reporting-nahe Zielstellen, damit `UAT-K25-001`, `SO-1001`, `RM-GUV-MONAT`, Financial-Reports-Summenwirkung und deutsche `19 %` USt nicht als aktueller RM-DEMO-Beweis gelesen werden. Kein BC-Lauf, kein Setup, keine Buchung.

Update nach `BOOK-REPORTING-UAT-K25-SYNC`: Der Reporting-UAT-Block in Kapitel 25 ist jetzt direkt in der UAT-Tabelle synchronisiert. `UAT-K25-001` ist Ziel-UAT fuer den deutschen Reportingfall; aktueller RM-DEMO-Anker bleibt `PS-INV103297` plus Artikelposten `Entry No. 792`. `RM-GUV-MONAT`, `SO-1001`, Financial-Reports-Summenwirkung, Power BI, deutsche `19 %` USt und deutscher Kontenplan bleiben offen. Kein BC-Lauf, kein Setup, keine Buchung.

Update nach `GOVERNANCE-010`: Die nach `BOOK-REPORTING-UAT-K25-SYNC` offene No-Gate-Entscheidung ist erledigt. Es gab keinen BC-Lauf, kein Setup, keine Buchung, keine Zahlung, keine Bankabstimmung und keinen Company-Wechsel. Naechster No-Approval-Schritt ist `FIXEDASSETS-009-SETUP-GATE-READINESS`: Fixed-Assets-Evidence `FIXEDASSETS-001` bis `FIXEDASSETS-008` konsolidieren und ein eng gescoptes UI-first Setup-Gate fuer `MACHINES`, `HGB`, `FA-CNC-01` und `K30000` formulieren, ohne Einrichtung oder Buchung.

Update nach `FIXEDASSETS-009`: Die Fixed-Assets-Gate-Readiness ist erledigt. Es gab keinen BC-Lauf, kein Setup, keine Anlage, keine Einkaufsrechnung, keine Aktivierung, keine AfA, keine Buchung und keinen Company-Wechsel. `MACHINES`, `HGB`, `FA-CNC-01` und `K30000` bleiben missing/not-proven. Naechster No-Approval-Schritt ist `FIXEDASSETS-010-SETUP-PREFLIGHT-READONLY`, also nur UI-read-only Feld- und Aktionsmapping vor einem spaeteren ausdruecklichen Setup-Gate.

Update nach `FIXEDASSETS-013`: Der Fixed-Assets-Setup-Fit-Entscheid ist erledigt. Kein BC-Lauf, keine Setup-Aenderung und keine Buchung. Aus `FIXEDASSETS-012` folgt: `HGB` ist der einzige naechste enge UI-first Setup-Kandidat; `MACHINES`, `FA-CNC-01`, `K30000`, Zugang und AfA bleiben gesperrt. Kapitel 21 darf den Anlagenprozess deshalb weiter nur als Zielpfad beschreiben, bis `HGB` sichtbar gefittet und danach die weiteren Setup-Schichten belegt sind.

Update nach `FIXEDASSETS-014`: `HGB` ist in `RM-DEMO` UI-first als Depreciation Book angelegt und im Screenshot sichtbar (`HGB`, `HGB depreciation book`). Das ist ein CRONUS-USA-Labor-Setup-Proof fuer eine Voraussetzung in Kapitel 21, aber kein deutscher HGB-Endstand und kein Anlagenprozess. `MACHINES`, `FA-CNC-01`, `K30000`, Zugang, AfA und Anlagenpostenspur bleiben offen/gatepflichtig.

Update nach `FIXEDASSETS-015`: Die Kontenentscheidung fuer `MACHINES` ist ohne BC-Lauf erledigt. Aus `FIXEDASSETS-006` und Microsoft-Learn-Quellen folgt: `MACHINES` darf als naechster enger UI-first Setup-Fit nur als CRONUS-USA-Laboralias der bestehenden Gruppe `EQUIPMENT` entstehen. Das beweist keine deutsche Kontenplan- oder HGB-Finalwahrheit und erlaubt noch keine Anlage `FA-CNC-01`, keinen Kreditor `K30000`, keinen Zugang, keine AfA und keine Buchung.

Update nach `FIXEDASSETS-016`: `MACHINES` ist in `RM-DEMO` UI-first als FA Posting Group angelegt und sichtbar nachgewiesen. Das Nachherbild zeigt `MACHINES` mit `12210` und `82000`; damit ist die Anlagenbuchungsgruppe als CRONUS-USA-Labor-Prerequisite belegt. Das beweist weiterhin keine Anlage `FA-CNC-01`, keinen Kreditor `K30000`, keinen Zugang, keine AfA, keine Buchung und keinen deutschen Kontenplan-Endstand.

Update nach `FIXEDASSETS-018`: Der Anlagenkarten-Preflight ist praktisch gelaufen. `FA-CNC-01` ist im Listen-/Seitentext vor `New` nicht sichtbar; das Listenbild ist nur begrenzter Kontextnachweis, kein sauberer leerer Filterbeweis. Die leere `Fixed Asset Card` zeigt Pflichtfelder und AfA-Bereich, aber keinen gespeicherten Zielstammsatz. Kapitel 21 darf die Karte jetzt als Lern- und Feldmapping-Schritt erklaeren, aber noch nicht als angelegte Anlage, Einkaufsrechnung, Zugang, AfA oder deutschen Finalnachweis.

Update nach `FIXEDASSETS-019`: Der Feldmapping-Entscheid ist ohne BC-Lauf erledigt. Die leere Anlagenkarte aus `FIXEDASSETS-018` reicht noch nicht fuer einen sicheren Setup-Fit, weil `HGB` und `MACHINES` nicht sichtbar/setzbar auf der Anlagenkarte belegt sind. Kapitel 21 muss deshalb vor dem Speichern von `FA-CNC-01` einen Zwischenkontrollpunkt setzen: `Mehr anzeigen`/Diagnose/Feldmapping, erst danach Stammdatenscreenshot. Keine Anlage, keine Einkaufsrechnung, kein Zugang, keine AfA und kein deutscher Finalnachweis.

Update nach `FIXEDASSETS-020`: Der UI-first Kartenlauf ist erledigt. Die leere `Fixed Asset Card` wurde ohne Speichern geoeffnet; kartennahe `Mehr anzeigen`-Kontrollen fuer `General` und `Depreciation Book` machen `No.`, `Description`, `FA Class Code`, `FA Subclass Code`, `Depreciation Book Code` und `Posting Group` sichtbar. Das beweist die Feldpfade fuer die naechste Klickanleitung, aber noch keine Zielwerte `FA-CNC-01`, `CNC Maschine FRA`, `HGB` oder `MACHINES`. Keine Anlage, keine Einkaufsrechnung, kein Zugang, keine AfA, kein Setup-Fit, keine Buchung und kein deutscher Finalnachweis.

Update nach `FIXEDASSETS-021`: Der Setup-Fit-Entscheid ist ohne BC-Lauf erledigt. Kapitel 21 darf nicht direkt vom sichtbaren Feldpfad zum gespeicherten Anlagenstamm springen. Vor dem ersten Stammdatenscreenshot muessen `HGB` und `MACHINES` als auswaehlbare oder gesetzte Kartenwerte sowie `FA Class Code`, `FA Subclass Code` und AfA-Daten geklaert werden. Naechster belegbarer Schritt ist daher nur ein no-save Lookup-/Werte-Preflight. Keine Anlage, keine Einkaufsrechnung, kein Zugang, keine AfA, kein Setup-Fit, keine Buchung und kein deutscher Finalnachweis.

Update nach `FIXEDASSETS-022`: Der no-save Lookup-/Werte-Preflight ist praktisch gelaufen, aber nur teilweise erfolgreich. Die leere Anlagenkarte ist als Kontextbild verwendbar; die konkreten Werte `HGB`, `MACHINES`, Anlagenklasse und Anlagenunterklasse wurden auf der Karte nicht sichtbar nachgewiesen. Ein frueherer falscher Lookup-Kontext wurde verworfen. Kapitel 21 ist deshalb mit einem Screenshot-Qualitaetskriterium synchronisiert: Ein Bild beweist nur, was im passenden BC-Kontext sichtbar ist. Naechster Schritt ist technische Diagnose mit Seitenpruefung, Personalisieren oder engerem Locator-Mapping. Keine Anlage, keine Einkaufsrechnung, kein Zugang, keine AfA, kein Setup-Fit, keine Buchung und kein deutscher Finalnachweis.

Update nach `FIXEDASSETS-023`: Die technische no-save Diagnose ist praktisch gelaufen. Page Inspection bestaetigt `Fixed Asset Card (5600, Document)` und Source Table `Fixed Asset (5600)`. Das ist ein starker Debugging- und Autoren-Nachweis fuer Page/Tabelle, aber noch kein Stammdatennachweis. Kapitel 21 darf nun erklaeren, warum ein finaler Screenshot die aktive Kartenansicht mit Zielwerten zeigen muss und warum ungescopte DOM-Locators die Hintergrundliste treffen koennen. Keine Anlage, keine Einkaufsrechnung, kein Zugang, keine AfA, kein Setup-Fit, keine Buchung und kein deutscher Finalnachweis.

Update nach `FIXEDASSETS-027`: Die Lookupwerte `HGB`, `MACHINES` sowie Klassen-/Unterklassenwerte sind im Anlagenkartenkontext sichtbar belegt. Gleichzeitig hat der Lauf gezeigt, dass ein New-Card-Preflight nicht automatisch no-save ist: Business Central erzeugte temporaer `FA000110`, der anschliessend per UI geloescht und per leerem Nachfilter bestaetigt wurde. Kapitel 21 darf daraus den Auto-Number-Lernfall und den naechsten Save-Gate-Kontrollpunkt ableiten, aber weiterhin keine gespeicherte Zielanlage `FA-CNC-01`, keinen Kreditor `K30000`, keine Einkaufsrechnung, keinen Zugang, keine AfA, keine Buchung und keinen deutschen Finalnachweis behaupten.

Update nach `FIXEDASSETS-028`: Die Save-Gate-Entscheidung ist ohne BC-Lauf erledigt. Kapitel 21 darf den naechsten Schritt jetzt als bewusstes Speichern des Zielstammsatzes `FA-CNC-01` beschreiben, aber nur mit Auto-Number-Kontrolle, sichtbaren Zielwerten und Stop-/Cleanup-Regel. Das Buch darf daraus noch keinen Anlagenzugang, keine AfA, keinen Kreditor `K30000`, keine Einkaufsrechnung, keine Buchung und keinen deutschen Finalnachweis ableiten.

Update nach `FIXEDASSETS-030`: Die Korrektur-Gate-Entscheidung ist ohne BC-Lauf erledigt. Kapitel 21 darf `FA-CNC-01` weiter als Zielcode verwenden, muss den aktuellen Stand aber als bestehende, unvollstaendige Karte erklaeren. Der naechste Buch-/Evidence-Schritt ist nicht Neuanlage unter anderem Code, sondern UI-first Korrektur der vorhandenen Karte mit Vorher/Nachher-Nachweis. Kein `K30000`, keine Einkaufsrechnung, kein Zugang, keine AfA, keine Buchung und kein deutscher Finalnachweis.

Update nach `FIXEDASSETS-031`: Der praktische Kartenkorrekturlauf ist nur teilweise erfolgreich. Kapitel 21 darf jetzt zeigen, dass auf der vorhandenen `FA-CNC-01`-Karte `HGB` und `MACHINES` sichtbar sind und `Book Value = 0,00` bleibt. Das ist ein Labor-Teilnachweis, kein fertiger Anlagenstammsatz: Beschreibung, Klasse/Unterklasse, AfA-Jahre und Datumslogik bleiben offen. Kein `K30000`, keine Einkaufsrechnung, kein Zugang, keine AfA, keine Buchung und kein deutscher Finalnachweis.

Update nach `FIXEDASSETS-032`: Der praktische Diagnose-/Teilkorrekturlauf ist teilweise erfolgreich. Kapitel 21 darf jetzt zeigen, dass auf der vorhandenen `FA-CNC-01`-Karte `HGB`, `MACHINES`, `Book Value = 0,00`, AfA-Start `01.01.2026`, Nutzungsdauer `8,00` und AfA-Ende `31.12.2033` sichtbar sind. Das bleibt ein Labor-Teilnachweis, kein fertiger Anlagenstammsatz: Beschreibung, `FA Class Code` und `FA Subclass Code` sind weiter leer oder nicht editierbar belegt. Kein `K30000`, keine Einkaufsrechnung, kein Zugang, keine AfA, keine Buchung und kein deutscher Finalnachweis.

Update nach `FIXEDASSETS-033`: Der praktische Feld-/Helper-Lauf ist teilweise erfolgreich. Kapitel 21 darf jetzt zeigen, dass auf der vorhandenen `FA-CNC-01`-Karte `Description = CNC Maschine FRA`, `FA Class Code = TANGIBLE`, `HGB`, `MACHINES`, `Book Value = 0,00`, AfA-Start `01.01.2026`, Nutzungsdauer `8,00` und AfA-Ende `31.12.2033` sichtbar sind. Das bleibt ein Labor-Teilnachweis, kein fertiger Anlagenstammsatz: `FA Subclass Code` ist weiter leer. Kein `K30000`, keine Einkaufsrechnung, kein Zugang, keine AfA, keine Buchung und kein deutscher Finalnachweis.

Update nach `FIXEDASSETS-034`: Der praktische Subclass-Lauf schliesst den letzten sichtbaren Karten-Stammdatenblocker auf der vorhandenen `FA-CNC-01`-Karte. Kapitel 21 darf jetzt als CRONUS-USA-Labor-Stammdatenstand aus `FIXEDASSETS-033` plus `FIXEDASSETS-034` zeigen: `Description = CNC Maschine FRA`, `FA Class Code = TANGIBLE`, `FA Subclass Code = EQUIPMENT`, `HGB`, `MACHINES`, `Book Value = 0,00`, AfA-Start `01.01.2026`, Nutzungsdauer `8,00` und AfA-Ende `31.12.2033`. Das bleibt kein Anschaffungs-, AfA-, Anlagenposten- oder deutscher HGB-Finalnachweis. Kein `K30000`, keine Einkaufsrechnung, kein Zugang, keine AfA und keine Buchung.

Update nach `FIXEDASSETS-035`: Die K30000-Readiness-Entscheidung ist ohne BC-Lauf erledigt. Kapitel 21 darf jetzt nicht vom Anlagenstammdatenfit direkt zur Einkaufsrechnung springen. `K30000` bleibt nicht nachgewiesen; der naechste Buch-/Evidence-Schritt ist nur ein UI-first read-only Vendor-Preflight in `RM-DEMO`. Keine Kreditoranlage, keine Einkaufsrechnung, kein Zugang, keine AfA, keine Anlagenposten und kein deutscher Finalnachweis.

Update nach `FIXEDASSETS-036`: Der UI-first Vendor-Preflight ist praktisch read-only gelaufen. `Vendors` Page `27` zeigt in `RM-DEMO` den Filter `No. = K30000` und eine leere Listenansicht; ein `K30000`-Kreditorendatensatz ist nicht sichtbar. Kapitel 21 darf daraus einen Anfaenger-Kontrollpunkt machen: Vor Anlagen-Einkaufsrechnung zuerst vorhandenen Kreditor suchen; wenn die gefilterte Liste leer ist, nicht zum Kaufbeleg springen, sondern Setup-Gate fuer Kreditoranlage klaeren. Keine Kreditorenkarte, keine Kreditoranlage, keine Einkaufsrechnung, kein Zugang, keine AfA, keine Anlagenposten und kein deutscher Finalnachweis.

Update nach `FIXEDASSETS-037`: Die Gate-Entscheidung nach dem negativen `K30000`-Preflight ist ohne BC-Lauf erledigt. Kapitel 21 darf jetzt genau einen engen UI-first Kreditoren-Setup-Fit als naechsten Labor-Klickpfad beschreiben: `K30000` / `Zollspedition Nord GmbH` in `Vendors` Page `27` anlegen oder bestaetigen und danach die Karten-Defaults lesen. Einkaufsrechnung, Anlagenzugang, AfA, Posting, Vendor-Bankdaten, API-Abkuerzungen und deutscher Finalnachweis bleiben gesperrt.

Update nach Stammdaten-Backlog: `MASTERDATA-BACKLOG.md` uebersetzt die Buchkapitel 3, 6 bis 18 und 19 bis 25 in priorisierte RM-DEMO-Testdaten- und Setup-Schritte. Der Audit bleibt die Buch-vs.-Evidence-Wahrheit; der Backlog entscheidet, welche Stammdaten/Setups als naechstes praktisch gebaut oder bewusst spaeter gehalten werden.

Update nach `REPORTING-009`/`REPORTING-010`: Der einfache read-only Sachposten-Dimensionspfad ist geprueft und nur teilweise/negativ belegt. `G/L Entries` zu `PS-INV103297` sind in breiter Ansicht sichtbar und zeigen Shortcut-Spalten `Department Code`/`Customergroup Code`; `PRODUCTLINE`/`CHANNEL` und ein belastbarer `Entry` -> `Dimensions`-Dialog sind dort nicht sichtbar. Financial Reports bleiben fuer `PRODUCTLINE`/`CHANNEL` offen. Der naechste echte Reporting-Hebel ist nur mit Freigabe ein Analysis-View-Fit oder ein anderer belegbarer Standardpfad.

Update nach `REPORTING-011`/`REPORTING-012`: Das einmalig freigegebene Analysis-View-Fit-Gate wurde verbraucht. `Analysis Views` ist in `RM-DEMO` erreichbar, aber `RM-PLCH` wurde nicht angelegt, weil keine sichere editierbare Feldzuordnung fuer Code, Name und Dimensionsfelder sichtbar war. `REPORTING-012` synchronisiert diesen Blocker. Ein neuer Analysis-View-Setup-Versuch braucht ein neues ausdrueckliches Feldmapping-/Setup-Gate.

Update nach `GOVERNANCE-007`: Genau dieses neue Feldmapping-/Setup-Gate ist fuer `REPORTING-013-ANALYSIS-VIEW-FIELDMAPPING-SETUP` freigegeben, aber nur fuer den unmittelbar naechsten Lauf. Setup ist erst erlaubt, wenn die UI-Feldzuordnung fuer `Code`, `Name`, `Dimension 1 Code` und `Dimension 2 Code` sicher dokumentiert ist; sonst muss der Lauf ohne Setup abbrechen.

Update nach `REPORTING-013`/`REPORTING-014`: Das Feldmapping-/Setup-Gate aus `GOVERNANCE-007` ist verbraucht und als `rejected` geschlossen. `REPORTING-013` belegt Feldpositionen auf der bestehenden `REVENUE`-Karte, legt `RM-PLCH` aber nicht an, weil `New/Neu` global mehrdeutig ist. `REPORTING-014` synchronisiert diese Wahrheit ohne BC-Lauf: weiteres Analysis-View-Setup bleibt gesperrt, bis ein neues Gate ein gescoptes New-/Kartenaktionsmuster vorgibt.

Update nach `TAX-001`: Die Steuergrenze ist jetzt als eigener Readiness-/Buch-Sync dokumentiert. O2C `PS-INV103297` und P2P `108219` sind Laborbelege mit `0 %` Tax; `Tax Group Code = FURNITURE` ist kein deutscher VAT19-Endstand. Praktischer deutscher `19 %`-Nachweis braucht eigene Setup-/Umgebungsfreigabe.

Update nach `TAX-002`: Die Freigabe- und Stop-Kriterien fuer einen spaeteren UI-first VAT19-Ziellauf sind dokumentiert. `TAX-002` hat keinen BC-Lauf, kein Setup, keine Buchung, keinen Company-Wechsel und keinen deutschen VAT19-Finalnachweis erzeugt. Der praktische `TAX-002-DE-VAT-FIT` bleibt gesperrt.

Update nach `POSTING-TRACE-002`: Die O2C-Postenspur ist im Buch nicht mehr nur als abstrakter Evidence-Pack-Punkt beschrieben. Kapitel 11 nutzt vorhandene O2C-Screenshotpfade, markiert `Preview Posting` nach `MASTERDATA-009` als erfolgreichen Laborzustand, nennt die Laborbuchung `PS-INV103297` und trennt Debitorenposten, Sachposten, Wertposten, Artikelposten, Reportinggrenze und deutsche VAT-Grenze als Kontrollfragen.

Update nach `MANUFACTURING-002`: Kapitel 14 ist mit der read-only Manufacturing-Readiness synchronisiert. Sichtbare Manufacturing-Einstiege und Artikel `RM-M100`/`RAW-STEEL` beweisen noch keine Produktionsfaehigkeit; `COMP-CTRL`, `KIT-MAINT`, BOM/Routing, `PROD-3001`, Verbrauch, Output und Postenspur bleiben offen/gate-gesperrt. `INV008-899959` ist Trainingsbestand und kein Manufacturing-Output.

Update nach `MIGRATION-001`: Kapitel 28 ist als Read-only-/Buch-Zielbild-Sync dokumentiert. Migration, Opening Balances und Cutover werden getrennt; es gab keinen BC-Lauf, kein Konfigurationspaket, keinen Import, keine neue Company und keine Opening-Balance-Buchung. `INV008-899959` bleibt Trainings-/Opening-Balance-Laborlogik, kein produktiver Migration- oder Cutover-Finalnachweis.

Update nach `INTEGRATIONS-001`: Kapitel 29 ist als Read-only-/Buch-Zielbild-Sync dokumentiert. Integrationen, Extensions, AppSource, APIs/Web Services, Power Platform und Power BI werden als Architektur-/UAT-Entscheidung getrennt; es gab keinen BC-Lauf, keine Extension, keinen Connector, kein API-/Web-Service-Setup, kein Power-Platform-/Power-BI-Setup und keinen produktiven Datenaustausch. Praktische Integration braucht Gate `INTEGRATIONS-002-SETUP-OR-CONNECTOR`.

Update nach `OPERATIONS-001`: Kapitel 30 ist als Read-only-/Buch-Zielbild-Sync dokumentiert. Betrieb, Monitoring und Hypercare werden als eigene Nachweisschicht getrennt; es gab keinen BC-Lauf, keine Job Queue, keinen Monitoring-Connector, keine Telemetrie-/Admin-Aenderung, keine Produktivumgebung und keine Buchung. Praktische Operations-Aenderungen brauchen Gate `OPERATIONS-002-JOB-QUEUE-OR-MONITORING-SETUP`.

Update nach `SOLUTIONARCHITECT-001`: Kapitel 31 ist als Read-only-/Buch-Zielbild-Sync dokumentiert. Solution-Architect-Denken wird als Entscheidungsrahmen aus Standardnachweis, Fit-Gap, UAT, Risiko, Owner, Rollback und Betriebsfolge getrennt; es gab keinen BC-Lauf, keine AL-/Extension-Entwicklung, keine AppSource-Installation, keine API-/Connector-/Power-Platform-/Power-BI-Einrichtung, keine produktive Architekturentscheidung, keine Setup-Aenderung und keine Buchung. Praktische Architekturentscheidungen brauchen Gate `SOLUTIONARCHITECT-002-ARCHITECTURE-DECISION-OR-ADR`.

Update nach `UAT-001`: Kapitel 32 ist als Read-only-/Buch-Zielbild-Sync dokumentiert. Die Master-UAT-Bibliothek ist jetzt gegen vorhandene Labor-Evidence eingeordnet: O2C, P2P und Inventory liefern CRONUS-USA-Laborbausteine; Payments, Reporting und mehrere Folgeprozesse bleiben Readiness, Teilbefund oder Gate-Folgearbeit. Es gab keinen BC-Lauf, keinen neuen praktischen UAT-Test, keinen Gesamt-UAT, keinen Sign-off, keine Setup-Aenderung und keine Buchung. Praktische UAT-Ausfuehrung braucht je nach Fall das passende Prozess-/Setup-/Posting-Gate.

Update nach `TRAINING-001`: Kapitel 33 ist als Read-only-/Buch-Zielbild-Sync dokumentiert. Uebungen und Loesungen sind jetzt gegen vorhandene Labor-Evidence eingeordnet: O2C, P2P und Inventory koennen als Labormuster fuer Loesungen dienen; Payments und Reporting bleiben Readiness beziehungsweise Teil-/Negativbefund. Es gab keinen BC-Lauf, keine praktische Uebungsausfuehrung, keine Schulungsabnahme, keine Setup-Aenderung und keine Buchung. Praktische Uebungslaeufe brauchen je nach Fall das passende Prozess-/Setup-/Posting-Gate.

Update nach `MB800-001`: Kapitel 34 ist als Read-only-/Buch-Zielbild-Sync dokumentiert. Die MB-800-Kompetenzmatrix ist gegen den Microsoft-Learn-Study-Guide und vorhandene Labor-Evidence eingeordnet. Der Audit trennt jetzt Lernabdeckung von Zertifizierungsnachweis, deutscher Final-Evidence und vollstaendiger praktischer Kompetenzabdeckung. Es gab keinen BC-Lauf, keine Pruefungssimulation, keine Setup-Aenderung und keine Buchung.

Update nach `LEARNPATH-001`: Kapitel 35 ist als Read-only-/Buch-Zielbild-Sync dokumentiert. Das Microsoft-Learn-Lernpfad-Mapping ist gegen offizielle Microsoft-Learn-Quellen, den MB-800-Study-Guide und vorhandene Evidence eingeordnet. Der Audit trennt jetzt Lernlandkarte, absolvierte Learn-Module, Zertifizierungsnachweis, deutsche Final-Evidence und praktische Prozessnachweise. Es gab keinen BC-Lauf, keine Setup-Aenderung und keine Buchung.

Update nach `EXAMTRAINING-001`: Kapitel 36 ist als Read-only-/Buch-Zielbild-Sync dokumentiert. Das MB-800-Pruefungstraining ist gegen Kapitel 34/35, den Microsoft-Learn-Study-Guide und vorhandene Evidence eingeordnet. Der Audit trennt jetzt Pruefungsfallen, Denkmodelle, Laboranker, offene Finalnachweise, Pruefungssimulation und Zertifizierung. Es gab keinen BC-Lauf, keine Setup-Aenderung, keine Buchung und keine Pruefungssimulation.

Update nach `GLOSSARY-001`: Kapitel 37 ist als Read-only-/Buch-Zielbild-Sync dokumentiert. Glossar, deutsche Buchsprache, englische Tell-Me-/Microsoft-Learn-Suchhilfen, praktisch belegte UI-Pfade und offene Zielbegriffe sind gegen UI-Inventar, Coverage und vorhandene Evidence eingeordnet. Es gab keinen BC-Lauf, keine Setup-Aenderung, keine Buchung und keine neuen Screenshots.

Update nach `PAGESINDEX-001`: Kapitel 38 ist als Read-only-/Buch-Zielbild-Sync dokumentiert. Seitenindex, Prozesskatalog und Qualitaetssicherung sind gegen Coverage, UI-Inventar, Screenshot-QA, Autopilot-State, Gates und vorhandene Evidence eingeordnet. Ein Indexeintrag, eine Prozessliste oder eine Reifegradbewertung ist kein praktischer Klickpfad- oder Finalnachweis. Es gab keinen BC-Lauf, keine Setup-Aenderung, keine Buchung und keine neuen Screenshots.

Update nach `ARTIFACTS-001`: Kapitel 39 ist als Read-only-/Buch-Zielbild-Sync dokumentiert. Projektartefakte, Templates, Handover-Dateien und Repo-QA sind gegen Evidence-Struktur, Autopilot-State, Gates und Artefakt-Governance eingeordnet. Ein Template, ein Handover-Dokument oder ein Evidence-Pack-Platzhalter ist kein praktischer BC-Nachweis; belastbar wird es erst durch konkrete Screenshots, Seitentexte, JSON-Ergebnisse, Belege, Posten, Berichte oder Fehlerbilder. Es gab keinen BC-Lauf, keine Setup-Aenderung, keine Buchung und keine neuen Screenshots.

## Leitentscheidung

`RM-DEMO` bleibt der konsolidierte Lern- und Labor-Mandant in Sandbox `MCP_1_20260210`. Die Ziel-Companies `RM-PROD`, `RM-SALES`, `RM-SERVICE`, `RM-SHARED` und `RM-AT` sind Buchziel fuer einen spaeteren Mehr-Company-/Greenfield-Block. Sie werden nicht als naechster Reflex angelegt. Zuerst werden Buchanforderungen, aktuelle Evidence und RM-DEMO-Setup synchronisiert.

## Extrahierte Buchanforderungen

| Anforderung | Buchkapitel | benoetigte Objekte / Werte | Reihenfolge / Abhaengigkeit |
|---|---|---|---|
| Konsolidierter Einstieg `RM-DEMO` | 6, 8 | Company aus CRONUS, Unternehmensdaten, Sprache/URL, Testbenutzer | zuerst, bevor Mehr-Company-Komplexitaet kommt |
| Ziel-Companies | 3, 6 | `RM-PROD`, `RM-SALES`, `RM-SERVICE`, `RM-SHARED`, `RM-AT` | spaeterer Mehr-Company-Block, nicht Startpunkt |
| Dimensionen | 7, 10 | `PRODUCTLINE`, `CHANNEL`, `DEPARTMENT`, `LOCATION-GROUP`, spaeter `PROJECT`, `COMPANY-GROUP` | vor O2C/P2P/Reporting |
| Dimensionswerte | 7, 10 | `MACHINE`, `SPARE`, `SERVICE`, `PROJECT`, `RENTAL`, `B2B`, `SHOP`, `SALES`, `DIRECTED` | nach Dimensionen, vor Belegen |
| Debitoren | 7, 11, 19, 22 | `D10000`, `D11000`, `D12000-EU`, `D13000-US`, `D30000` | `D10000` zuerst fuer O2C |
| Kreditoren | 7, 12, 19, 20 | `K10000`, `K11000`, `K20000`, `K30000`, `K40000` | vor P2P und Zahlung |
| Artikel | 7, 11, 12, 13, 23 | `RM-M100`, `SP-PUMP-01`, `RAW-STEEL` | `RM-M100` zuerst; RAW-/SP-Faelle spaeter |
| Ressourcen / Projekte / Anlagen | 7, 15, 16, 21 | `RES-TECH`, `PROJ-5001`, `FA-CNC-01` | spaeter nach Kern-Finance/O2C |
| Lagerorte | 7, 13 | `FRA-ZL`, `MZ-EINFACH`, `VAN-SERV`, `PROJ-LAG` | `FRA-ZL` einfach zuerst; Warehouse spaeter |
| Posting Groups | 9, 11, 12, 13 | Debitoren-, Kreditoren-, General-, Product-, Inventory-Posting-Groups | vor Preview/Buchung |
| USt / Tax | 9, 11, 22 | deutsches `19 %` VAT-Setup, USt-Posten, Steuergruppen | nicht aus CRONUS-USA ableiten |
| Nummernserien | 8, 11, 12, 21 | Verkaufs-, Einkaufs-, Anlagen-, Projektbelege | vor systematischem Greenfield |
| Journale | 19, 20, 21, 24 | Zahlungsjournal, Zahlungsabstimmung, FA Journal, General Journal | nach gebuchten Belegen |
| Reports | 10, 25 | `Financial Reports`, GuV/Bilanz, Dimensionsfilter, Drilldown | nach gebuchten und dimensionierten Posten |
| Evidence Packs | alle Prozesskapitel | Beleg, gebuchter Beleg, Nebenbuchposten, Sachposten, USt-/Tax-Posten, Artikelposten, Wertposten, Reporting | je Prozess nach Preview/Buchung |

## Buchanforderung vs. RM-DEMO-Stand

| Buchanforderung | Buchkapitel | aktueller RM-DEMO-Stand | Evidence vorhanden? | Test vorhanden? | Screenshot vorhanden? | Status | naechster Schritt |
|---|---|---|---|---|---|---|---|
| `RM-DEMO` als konsolidierte Trainingscompany | 6, 8 | Company existiert, CRONUS-USA-basiert | ja, Foundation | ja | ja | done-labor | bei DE-Finalumgebung neu belegen |
| Mehr-Company-Zielstruktur | 3, 6 | nur als Buchmodell, nicht praktisch aufgebaut | nein | nein | nein | later-multicompany | erst nach RM-DEMO-Lernlauf als eigener Block |
| Dimensionen `PRODUCTLINE`, `CHANNEL`, `LOCATION-GROUP`; `DEPARTMENT` wiederverwenden | 7, 10 | angelegt/geprueft | ja, `masterdata-002/003` | ja | ja | done-labor | spaeter globale/Shortcut-Dimensionen in DE pruefen |
| Dimensionswerte `MACHINE`, `B2B`, `SALES`, `DIRECTED` | 7, 10 | angelegt/geprueft | ja | ja | ja | done-labor | weitere Werte fuer P2P/Service/Projekt spaeter |
| Debitor `D10000` | 7, 11 | existiert mit EUR, Adresse, Posting-/Tax-Laborfit | ja | ja | ja | done-labor | Debitor-Setup fuer DE-VAT spaeter |
| Artikel `RM-M100` | 7, 11, 13 | existiert mit Preis/Kosten, `PCS`, `RETAIL`, `RESALE`, `FURNITURE` | ja | ja | ja | done-labor | deutscher Product/VAT/Inventory-Fit offen |
| Lagerort `FRA-ZL` | 7, 13 | einfacher Lagerort existiert | ja | ja | ja | done-labor | Warehouse-Logik spaeter |
| Inventory Posting Setup `FRA-ZL` + `RESALE` | 9, 11, 13 | Laborfit `Inventory Account = 14140` gesetzt | ja, `masterdata-008/009` | ja | ja | done-labor | Buchstelle aktualisieren; kein DE-Kontenplan behaupten |
| O2C Verkaufsauftrag mit `D10000`, `RM-M100`, Menge 1, `FRA-ZL`, `68.000 EUR` | 11 | praktisch belegt | ja | ja | ja | done-labor | nicht erneut buchen |
| O2C deutsche `19 %` USt, Brutto `80.920 EUR` | 9, 11, 22 | nicht erreicht; CRONUS-USA zeigt Tax 0 %; `TAX-001` dokumentiert DE-VAT-Readiness; `TAX-002` dokumentiert Freigabe- und Stop-Kriterien | ja als Negativ-/Delta-Evidence und `tax-001`/`tax-002` | ja | Tax-Spalten-Laborbild | missing-setup / fit-locked | praktischen DE-VAT-Ziellauf nur mit Freigabe starten; `TAX-002` nicht wiederholen |
| O2C Preview Posting | 11 | echte Vorschauzeilen erreicht | ja, `060/061` | ja | ja | done-labor | Betragsspalten in G/L-Preview optional verbessern |
| O2C Laborbuchung | 11 | genau einmal `Ship and Invoice`: `S-ORD101068` -> `PS-INV103297` | ja, `080` | ja | ja | done-labor | keine zweite Buchung ohne neuen Readiness-Grund |
| Debitorenposten zu `PS-INV103297` | 11, 19 | sichtbar, Betrag `68.000`, Kunde `D10000` | ja, `082` Trace | ja | ja | done-labor | Zahlungs-/Ausgleichsblock spaeter |
| Sachposten zu `PS-INV103297` | 9, 11, 24 | sichtbar, Konto `14140`, Betragstexte; `REPORTING-009` zeigt in breiter Ansicht `Department Code`/`Customergroup Code`, aber nicht `PRODUCTLINE`/`CHANNEL` und keinen belastbaren Dimensionsdialog | ja | ja | ja | partial-negativ | nicht erneut denselben Pfad suchen; Reporting-Setup nur mit neuem Feldmapping-/Setup-Gate |
| Artikelposten zu `RM-M100` | 11, 13, 23 | direkter Filter leer; ueber Value Entry `Item Ledger Entry No. = 792` gefunden | ja | ja | ja | done-labor | Lernfall im Buch/Inventar halten |
| Wertposten zu `PS-INV103297` | 11, 13, 23 | sichtbar, fuehrt zum Artikelposten | ja | ja | ja | done-labor | Wert-/Kostenlogik spaeter vertiefen |
| Detailed Cust. Ledger Entry | 11, 19 | in Preview/Find Entries als Postenart sichtbar, Detailseite noch nicht einzeln belegt | teilweise | teilweise | teilweise | partial | read-only Detailnachweis spaeter |
| USt-/VAT-Posten | 11, 22 | kein deutscher VAT Entry; CRONUS-Sales-Tax-Labor 0 % | Negativ-Evidence | ja als Delta | nein final | missing-setup | DE-Finalblock |
| `PRODUCTLINE=MACHINE` im Verkaufsauftrag | 10, 11 | Zeilendimensionsdialog zeigt Wert | ja, `050` | ja | ja | done-labor | final DE neu fotografieren |
| `PRODUCTLINE=MACHINE` in gebuchter Verkaufsrechnung | 10, 11 | nicht sichtbar belegt | nein | nein | nein | missing-evidence | Dimensionen auf gebuchter Rechnung suchen |
| `PRODUCTLINE=MACHINE` in Sachposten | 10, 11, 25 | `REPORTING-009` zeigt den Sachpostenkontext read-only: Shortcut-Spalten sichtbar, `PRODUCTLINE`/`CHANNEL` nicht sichtbar, `Entry` -> `Dimensions` nicht belastbar erreicht | ja als Negativ-/Teilbefund | ja | ja | partial-negativ | als Laborgrenze erklaeren; fuer Reporting naechsten freigegebenen Hebel nutzen |
| `PRODUCTLINE=MACHINE` in Debitorenposten | 10, 19 | nicht sichtbar belegt | nein | nein | nein | missing-evidence | nur pruefen, falls fachlich sinnvoll |
| `PRODUCTLINE=MACHINE` in Artikelposten | 10, 13, 23 | `Entry` -> `Dimensions` auf Item Ledger Entry `792` zeigt `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` | ja | ja | ja | done-labor | als harter Laborbeweis nutzen |
| `PRODUCTLINE=MACHINE` in Wertposten | 10, 23 | Wertposten sichtbar, Dimension dort nicht belegt | nein | nein | nein | missing-evidence | ggf. Value Entry Dimensions pruefen |
| Financial Reports Seite | 10, 25 | read-only geoeffnet, Liste sichtbar; weitere Reportingpfade `REPORTING-002` bis `REPORTING-013` liefern keine belastbare Summenwirkung nach `PRODUCTLINE`/`CHANNEL`; `REPORTING-013` zeigt `Analysis Views` und Feldpositionen auf `REVENUE`, legt `RM-PLCH` aber wegen global mehrdeutigem `New/Neu` nicht an | ja, `reporting-001` bis `reporting-013`, `governance-007` | ja | ja | partial-negativ / gate-rejected / setup-locked | `REPORTING-014`: Buch-/Governance-Sync; weiteres Setup nur mit neuem Gate und gescoptem New-/Kartenaktionsmuster |
| Financial Reports nach `PRODUCTLINE=MACHINE` | 10, 25 | nicht belegt; vorhandene `REVENUE` Analysis View nutzt nicht `PRODUCTLINE`/`CHANNEL`; eigener Fit `RM-PLCH` ist rejected | ja als Negativ-/Readinessbefund | ja | ja | missing-final-evidence | nur mit neuem Gate: Analysis-View-Feldmapping/Fit oder anderer Standardpfad |
| P2P-Stammdaten/Kreditoren | 7, 12 | Kreditor `K10000`, Artikel `RAW-STEEL`, Einkaufslaborbuchung `106049` -> `108219` und Postenspur sind belegt; deutsche Vorsteuer offen | ja, `p2p-001` | ja | ja | done-labor / VAT offen | keine zweite P2P-Buchung; deutsche VAT-/Kontenplan-Grenze spaeter |
| Bank/Payments | 19, 20 | `PAYMENTS-001` bis `PAYMENTS-010` belegen offene Posten, Cash-Receipt-Draft, `BANK-RM-01`, Journal Check, Apply Entries und Post-Dialog mit Abbruch; keine Zahlung | ja, `payments-001` bis `payments-010` | ja | ja | readiness-labor | `PAYMENTS-011` nur mit ausdruecklicher Zahlungsfreigabe |
| Anlagen/Projekte/Service/Manufacturing | 14-16, 21 | Fixed Assets/Warehouse/Manufacturing/Service sind als Readiness bzw. Buch-Sync teilweise belegt; Fixed Assets hat `HGB` und `MACHINES` als Labor-Setup-Prerequisites sichtbar, `FIXEDASSETS-033` plus `FIXEDASSETS-034` zeigen die vorhandene `FA-CNC-01`-Karte mit `Description = CNC Maschine FRA`, `FA Class Code = TANGIBLE`, `FA Subclass Code = EQUIPMENT`, `HGB`, `MACHINES`, `Book Value = 0,00`, AfA-Start `01.01.2026`, `8,00` Jahre und AfA-Ende `31.12.2033`; `FIXEDASSETS-036` zeigt `K30000` als nicht sichtbaren Zielkreditor im gefilterten Vendor-Kontext; `FIXEDASSETS-037` entscheidet danach den engen UI-first Kreditoren-Setup-Fit als naechsten Schritt; Projects ist mit `PROJECTS-001` als Readiness gestartet und mit `PROJECTS-002` im Buch synchronisiert | teilweise | teilweise | teilweise | partial-readiness / fixedassets-labor-masterdata-fit / vendor-setup-fit-approved-next / posting-locked | `FIXEDASSETS-038-K30000-VENDOR-SETUP-FIT`: genau `K30000` als Labor-Kreditor anlegen/bestaetigen und Karten-Defaults lesen; Einkaufsrechnung/Zugang/AfA nur mit spaeterem Gate |

## Veraltete oder irrefuehrende Buchstellen

| Datei | Abschnitt | aktueller Text/Kernaussage | Problem | vorgeschlagene Korrektur | benoetigte Evidence |
|---|---|---|---|---|---|
| `FiBu_Buch_BC_Standardprozesse_DE_Master_Blueprint.md` | `Bebilderte Klickanleitungen: aktueller Foundation-Stand` | `MASTERDATA-008` geprueft als Labor-Diagnose; Kontoentscheidung offen | Der Evidence-Stand war weiter: `MASTERDATA-009` hat `14140` gesetzt und Preview danach bestaetigt | erledigt: `MASTERDATA-009` als eigene Zeile aufgenommen; `MASTERDATA-008` historisch als Diagnose markiert | `evidence/masterdata-009/010-inventory-posting-setup-fit.json`, Screenshot `masterdata-009-*` |
| `FiBu_Buch_BC_Standardprozesse_DE_Master_Blueprint.md` | gleiche Tabelle, O2C-Zeile | O2C nur Kopf/Zeile, Auftrag wird danach bereinigt | Inzwischen gab es Preview, Laborbuchung und Postenspur; nur Preview-Auftrag wurde bereinigt | erledigt: O2C-Zeile auf Preview, Laborbuchung `PS-INV103297` und offene 19-%-USt aktualisiert | `080-posting-result.json`, `082-posting-entry-trace.json`, `O2C-LAB-FINAL-SYNC.md` |
| `FiBu_Buch_BC_Standardprozesse_DE_Master_Blueprint.md` | O2C-Zielmodell / Buchungsspur | deutsche USt `19 %`, Brutto `80.920`, USt-Posten als Erwartung | fachlich als Ziel korrekt, aber nicht als RM-DEMO-Laborergebnis belegt | erledigt: Tabelle `Zielbild fuer deutsche Endumgebung` vs. `aktueller CRONUS-USA-Laborstand` ergaenzt | `045-target-vs-labor-delta.*`, `080-posting-result.json`, `O2C-LAB-FINAL-SYNC.md` |
| `FiBu_Buch_BC_Standardprozesse_DE_Master_Blueprint.md` | Kapitel 10/25 Reporting | Financial Reports nach `PRODUCTLINE`, `CHANNEL`, `DEPARTMENT` filtern | Buchziel ist noch nicht durch Evidence belegt; `REPORTING-001` bis `REPORTING-013` zeigen Einstieg, Artikelposten-Dimension, mehrere Negativpfade, abgelehnte Analysis-View-Fits und den global mehrdeutigen `New/Neu`-Kontext | Abschnitt als Ziel-/Laborgrenze markieren; `REPORTING-014` haelt fest: kein weiterer Setup-Versuch ohne neues Gate und gescoptes New-/Kartenaktionsmuster | `reporting-001` bis `reporting-014`, `governance-007` |
| `playwright/projects/fibu-book5/UI-INVENTORY.md` | `Naechste Inventarziele` | Preview/Postenspur und G/L-Dimensionspfad als offene Ziele | veraltet; Preview, Buchung, Postenspur und `REPORTING-009`-Sachpostenprobe sind bereits erfolgt | erledigt: Naechste Inventarziele markieren den Sachposten-Dimensionspfad jetzt als abgeschlossenen Teil-/Negativbefund; Reporting-Setup nur mit Freigabe | `060`, `080`, `082`, `089`, `reporting-009`, `reporting-010` |
| `playwright/projects/fibu-book5/BOOK-CLICK-GUIDE-COVERAGE.md` | abgedeckte Klickanleitungen | Reporting fehlt trotz `REPORTING-001` | Coverage nennt Reporting nur als naechste fehlende Anleitung | Reporting-001 als teilweise gestarteten Laborblock aufnehmen | `reporting-001` Evidence |

## O2C-Synchronisationsbefund

| Pruefpunkt | Ergebnis | Evidence | Buchauswirkung |
|---|---|---|---|
| Verkaufsauftrag | Laborauftrag `S-ORD101068`, vorher Preview-Auftrag `S-ORD101067` | `080-posting-result.json`, `999-cleanup.json` | Buch muss zwischen bereinigtem Preview-Auftrag und gebuchtem Laborbeleg unterscheiden |
| Verkaufszeile | `RM-M100`, Menge `1`, `FRA-ZL`, `68.000 EUR` | `040-zeile-artikel-rm-m100-api-result.json`, Screenshots `040/041` | als Labor belegt |
| Waehrung | `EUR` | `045-target-vs-labor-delta.*`, `080-posting-result.json` | frueherer USD-Befund ist erledigt |
| Steuer | `taxPercent = 0`, `totalTaxAmount = 0` | `045`, `080` | deutsche `19 %` bleibt offen |
| Preview Posting | echte Vorschauarten sichtbar | `060-preview-posting-result.json`, Screenshot `060` | alter Inventory-Fehler geloest |
| Buchung | genau einmal `Ship and Invoice` | `080-posting-result.json`, Screenshot `080` | Laborbuchung belegt, keine zweite Buchung |
| Gebuchte Verkaufsrechnung | `PS-INV103297` | `080`, `082` | O2C-Buchtext muss diese Nummer als Labor-Evidence kennen |
| Debitorenposten | sichtbar | `082-posting-entry-trace.json`, Screenshot `083` | Labor-Postenspur belegt |
| Sachposten | sichtbar | `082`, Screenshot `084` | Dimensionen dort noch offen |
| Artikelposten | ueber Value Entry `Item Ledger Entry No. = 792` sichtbar | `082`, Screenshots `086/088` | Lernfall: direkter Filter nach Order No. reicht nicht |
| Wertposten | sichtbar | `082`, Screenshot `086` | Labor-Postenspur belegt |
| Detailed Cust. Ledger Entries | Preview/Find Entries zeigt Postenart, Detailpruefung fehlt | `060`, `087` | fuer vollstaendige Postenspur spaeter vertiefen |
| VAT/Sales-Tax-Posten | kein deutscher VAT-Nachweis | `045`, `080` | nicht als erledigt markieren |
| Reporting | Financial Reports Seite offen; `REPORTING-002` bis `REPORTING-013` zeigen Artikelposten-Dimension, vorhandene Analysis-View-Grenze, negative/teilweise Sachposten-/Analysepfade, abgelehnte Fits und den unsicheren `New/Neu`-Kontext; Filter/Summenwirkung bleibt offen | `reporting-001` bis `reporting-014`, `governance-007` | kein gleicher Wiederholungslauf; weiteres Setup nur mit neuem Gate und gescoptem New-/Kartenaktionsmuster |

Fazit: O2C ist als CRONUS-USA-Laborprozess fachlich weitgehend synchronisiert, aber nicht als deutscher Finalprozess. Keine weitere O2C-Buchung ist aktuell gerechtfertigt. Der Engpass ist nicht mehr der Verkaufsauftrag, sondern Dimensionswirkung in Sachposten/Reporting und deutscher Tax/VAT-Finalnachweis.

Update nach `SOURCES-001`: Kapitel 40 ist als Quellen-/Readiness-Sync dokumentiert. Quellen sind als Microsoft-Learn-/Standardreferenzen, amtliche Steuer-/Compliance-Quellen, Vendor-Dokumentation, gestrichene Scope-Hinweise oder konkrete Projekt-Evidence eingeordnet. Eine Quelle stuetzt eine Regel oder ein Zielbild, beweist aber keinen RM-DEMO-Klickpfad, keine Postenspur, keine Buchung und keinen deutschen Finalnachweis. Es gab keinen BC-Lauf, keinen Live-URL-Audit, keine Setup-Aenderung, keine Buchung und keine neuen Screenshots.

Update nach `GOVERNANCE-005`: Autopilot V2.2 ist gegen State und Gates synchronisiert. `PAYMENTS-011-LAB-PAYMENT` war der erste autonome Kandidat und ist inzwischen erledigt: `PAY011-PS103297` wurde genau einmal fuer `D10000` / `PS-INV103297` gebucht. Dieser Governance-Lauf selbst hat keine BC-Ausfuehrung, keine Zahlung, keine Setup-Aenderung und keine neue Company erzeugt.

## PRODUCTLINE=MACHINE harter Pruefstand

| Wo gesucht | Ergebnis | Screenshot/Evidence | fachliche Bedeutung | Buchauswirkung |
|---|---|---|---|---|
| Standarddimension Artikel `RM-M100` | gefunden, `Same Code` | `masterdata-007`, Screenshot `masterdata-007-default-dimensions-item-rm-m100.png` | Stammdatenvorgabe existiert | Vorbereitung belegt, kein Prozessnachweis allein |
| Verkaufszeile / Dimensionsdialog | gefunden | `050-line-dimension-dialog-result.json`, Screenshot `uat-o2c-001-050-dimension-productline-machine.png` | Dimension kam im konkreten Beleg an | O2C-Belegdimenion als Labor belegt |
| Gebuchte Verkaufsrechnung | nicht belegt | keine | unklar, ob auf gebuchtem Beleg sichtbar erreichbar | Buch nicht behaupten |
| Sachposten | `REPORTING-009` zeigt G/L Entries zu `PS-INV103297` in breiter Ansicht; `Department Code`/`Customergroup Code` sichtbar, `PRODUCTLINE`/`CHANNEL` nicht sichtbar | `082-posting-entry-trace.json`, Screenshot `084`, `reporting-009` | G/L-Sachposten-Dimensionswirkung fuer Zielwerte bleibt offen/negativ | nicht als Buchnachweis behaupten |
| Debitorenposten | nicht belegt | keine | fuer Forderung evtl. nicht wichtigste Reportingebene | nicht behaupten |
| Artikelposten | gefunden ueber `Entry` -> `Dimensions` auf Entry `792` | `089-item-ledger-entry-dimensions-page-text.txt`, Screenshot `089` | Dimension hat mindestens den Artikelposten erreicht | starker Laborbeweis |
| Wertposten | nicht belegt | `086` zeigt Wertposten ohne Dimension | Kosten-/Wert-Reportingdimension offen | spaeter pruefen |
| Financial Reports | Seite offen; mehrere read-only Pfade sowie `REPORTING-011` und `REPORTING-013` ohne Ziel-Summenwirkung; `REPORTING-013` schliesst das Feldmapping-Gate als rejected | `reporting-001` bis `reporting-014`, `governance-007` | Reportingfilter/Summenwirkung offen; `RM-PLCH` nicht angelegt | keinen Setup-Versuch wiederholen; nur neues Gate mit gescoptem New-/Kartenaktionsmuster oder alternativer offizieller Standardpfad |

## Prioritaeten

1. Payment-Folgeentscheidung: `PAYMENTS-011-LAB-PAYMENT` ist erledigt und darf nicht wiederholt werden; `PAYMENTS-012`, `PAYMENTS-013` und `PAYMENTS-014` sind erledigt. Offen bleibt die gesperrte Bankabstimmung und eine bewusste Entscheidung, welcher Gate-Hebel als naechstes fachlich lohnt.
2. Reporting-Freigabeentscheidung: Analysis-View-Fit fuer `PRODUCTLINE`/`CHANNEL` nur mit neuem ausdruecklichem Feldmapping-/Setup-Gate; ohne Freigabe keinen gleichen read-only oder rejected Setup-Pfad wiederholen.
2. `MASTERDATA-BACKLOG.md` als Pflichtquelle nutzen, bevor P2P, Inventory, Warehouse, Manufacturing, Service, Project-Setup, Payments oder Reporting-Finallogik praktisch gestartet werden.
3. `UAT-O2C-001` nicht erneut buchen; Sachposten-Dimensionspfad aus `REPORTING-009` als Laborgrenze nutzen.
4. DE-VAT-Readiness ist mit `TAX-001` geplant und mit `TAX-002` als Gate-Kriterienpaket konkretisiert; praktische Umsetzung nicht in CRONUS-USA improvisieren, sondern nur mit Freigabe.
5. Erst danach P2P-Stammdaten und Kreditorenprozess starten.

## Naechster sinnvoller Queue-Prompt

```text
Arbeite auf Branch codex/playwright-bc-screenshot-foundation.
Lies AUTOPILOT-STATE.json, POSTING-AND-SETUP-GATES.md, CURRENT-STATE.md, BOOK-TO-EVIDENCE-AUDIT.md, LAB-FIT-STATUS.md, AUTOPILOT-PROMPT-V2.md und evidence/governance-005/.
`FIXEDASSETS-020-FA-CNC-01-CARD-MORE-FIELDS-MAPPING` ist erledigt: Die leere Anlagenkarte zeigt nach kartennahem `Mehr anzeigen` die Feldpfade `Depreciation Book Code` und `Posting Group`, aber noch keine Zielwerte `FA-CNC-01`, `HGB` oder `MACHINES`. Fuehre als naechsten Schritt `FIXEDASSETS-021-FA-CNC-01-SETUP-FIT-DECISION` aus: Entscheide eng evidence-basiert, ob und wie `FA-CNC-01` UI-first auf der Anlagenkarte angelegt werden darf. Keine Einkaufsrechnung, kein Zugang, keine AfA, keine Buchung und keine deutsche Finalbehauptung.
```

## Grenzen

- Kein deutscher `19 %`-USt-Endstand in `RM-DEMO`.
- Kein deutscher Kontenplan-Endstand aus Konto `14140` ableiten.
- `RM-DEMO` ist Lern-/Laborcompany, nicht finale deutsche Zielcompany.
- Mehr-Company-Aufbau bleibt spaeterer Block.
- Dieser Audit erzeugt keine neue BC-Evidence; er synchronisiert Buch-, Projekt- und Evidence-Wahrheit.
