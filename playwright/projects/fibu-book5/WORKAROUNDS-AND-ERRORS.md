# Workarounds und Fehlerjournal

Diese Datei dokumentiert technische Stolperstellen, Workarounds und gelöste Fehler aus den Business-Central-Playwright-Läufen für Buch 5.

Ziel ist nicht nur, dass der Test am Ende grün ist. Ziel ist, dass ein späterer Autor, Consultant oder Codex-Account versteht, was schiefging, wie es sichtbar wurde und welche Regel daraus entstanden ist.

## Dokumentationsregel

Jeder relevante Fehler oder Workaround bekommt:

| Feld | Bedeutung |
|---|---|
| Problem | Was ist passiert? |
| Sichtbarer Beleg | Screenshot, Trace, Evidence oder Seitentext |
| Ursache | Warum ist es passiert? |
| Lösung | Was wurde geändert? |
| Buchwirkung | Muss die Anleitung angepasst werden? |
| Künftige Regel | Was machen wir beim nächsten Lauf anders? |

Jeder Eintrag muss außerdem gegen die betroffene Buchstelle geprüft werden. Wenn der Workaround zeigt, dass der Buchtext zu knapp, falsch oder missverständlich ist, wird die Buchstelle im selben Arbeitsgang korrigiert oder als offene Buch-Fundstelle in `playwright/FINDINGS.md` markiert.

## WK-BC-PAY-001 Zielbankkonto `BANK-RM-01` fehlt vor Zahlungsbuchung

| Feld | Wert |
|---|---|
| Problem | `PAYMENTS-002` konnte Bank Accounts, Cash Receipt Journal, Payment Journal und Apply Entries oeffnen, aber das Zielbankkonto `BANK-RM-01` war in der Bankkontenliste nicht sichtbar. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/img/payments-002-010-bank-accounts.png`, `playwright/projects/fibu-book5/img/payments-003-010-bank-accounts-bank-rm-01-fit.png`, `playwright/projects/fibu-book5/evidence/payments-002/PAYMENTS-002-result.json`, `playwright/projects/fibu-book5/evidence/payments-003/PAYMENTS-003-result.json`, `playwright/projects/fibu-book5/evidence/payments-003/PAYMENTS-003-BANK-ACCOUNT-FIT.md` |
| Ursache | `BANK-RM-01` ist ein Buch-/Rhein-Main-Zielwert. Die aktuelle CRONUS-USA-Laborcompany `RM-DEMO` enthaelt stattdessen vorhandene CRONUS-Bankkonten wie `CHECKING` und `SAVINGS`. |
| Loesung | `PAYMENTS-003` hat `BANK-RM-01` idempotent per BC-Standard-API angelegt und danach in Bank Accounts sichtbar geprueft. Das bleibt Laborhistorie und keine Buch-Klickanleitung. Fuer das Buch muss eine Bankkontoanlage entweder als UI-Klickpfad nachgezogen oder als vorbereitete Voraussetzung dokumentiert werden. Es wurde bewusst nicht gezahlt, nicht ausgeglichen und keine Bankabstimmung gestartet. |
| Buchwirkung | Kapitel 19/20 muss Bankkonto-Readiness vor der ersten Zahlung nennen. Ein sichtbares Zahlungsjournal reicht nicht; das Gegenkonto und der Bankkontext muessen fachlich passen. |
| Kuenftige Regel | Keine Zahlungsbuchung nur wegen vorhandenem Bankkonto. `Post` im Journal ist sichtbar, aber bis Journalfelder, Gegenkonto `BANK-RM-01`, Betrag, Ausgleichsbezug, Bank Account Posting Group/Sachkonto-Fit und Vorabkontrolle passen, bleibt die Buchung gesperrt. |

## WK-BC-SRV-001 Seitentitel ist kein Zielobjekt-Nachweis

| Feld | Wert |
|---|---|
| Status | geloest im Test `SERVICE-001`; als kuenftige Evidence-Regel behalten |
| Testfall | `SERVICE-001` |
| Situation | Der erste Service-Readiness-Lauf pruefte Zielobjekte wie `RM-M100-SN1001`, `RES-TECH` und `VAN-SERV` ueber gefilterte BC-Listen. |
| Symptom | Seitentitel wie `Service Items`, `Resources` oder `Locations` waren sichtbar. Eine zu breite Regex haette daraus faelschlich `targetVisible = true` abgeleitet, obwohl die konkrete Zielnummer nicht im Seitentext stand. |
| Ursache | Business Central zeigt auch bei leerem oder nicht treffendem Filter den Seitenkontext und Aktionen wie `Neu`. Das beweist die Seite, aber nicht den gesuchten Datensatz. |
| Warum BC so reagiert | Listen und Karten sind UI-Kontexte. Ein gefilterter Listenaufruf kann eine leere Liste, eine vorhandene Seite oder einen Shell-Zustand zeigen, ohne dass der Zielwert geladen wurde. |
| Loesung | `SERVICE-001` prueft Zielobjekte jetzt streng auf die konkrete Nummer (`RM-M100-SN1001`, `SP-PUMP-01`, `RES-TECH`, `VAN-SERV`) und filtert Auth-/Shell-Rauschen aus kompakten Evidence-Auszugen. Der Nachlauf zeigt die korrekte Wahrheit: Service-Einstiege sichtbar, Zielobjekte bis auf `D10000` nicht sichtbar. |
| Buchwirkung | Kapitel 15 darf Service-Seiten nicht als Serviceprozessfaehigkeit ausgeben. Ein Buchbild fuer Stammdaten muss die konkrete Nummer zeigen oder die Luecke klar als Stammdatenbefund markieren. |
| Kuenftige Regel | Bei gefilterten BC-Listen immer zwischen Seitenkontext und Zielwert unterscheiden. Status `labor` nur, wenn die konkrete Nummer sichtbar ist; sonst `rejected`/Datenluecke. |

## WK-BC-PAY-003 Sichtbarer Cash-Receipt-Draft hat noch Amount-Issue

| Feld | Wert |
|---|---|
| Status | geloest als Amount-Format-Lernfall; Folgeblocker Bankkonto-Postinggruppe offen; keine Buchung |
| Testfall | `PAYMENTS-005`, `PAYMENTS-006` |
| Situation | Fuer den ersten Zahlungseingang wurde im Cash Receipt Journal eine Entwurfszeile ueber die UI vorbereitet: Debitor `D10000`, Betrag `-68.000`, Gegenkonto `BANK-RM-01`, Rechnungsbezug `PS-INV103297`. |
| Symptom | Die Zeile sieht im Grid plausibel aus, aber Journal Check zeigt `1 Issues Total`. Current line meldet: `'Amount' muss in 'Gen. Journal Line' einen Wert enthalten...`. |
| Ursache | `PAYMENTS-006` zeigt: Die Rohzahl `-68000` reicht fuer diese UI-Eingabe nicht stabil als lokalisierter Business-Central-Betrag. Das lokale Format `-68.000,00` loest die Amount-Validierung zwischenzeitlich. |
| Warum BC so reagiert | Journale sind editierbare Tabellen mit Feldvalidierungen. Sichtbarer Zelltext, gespeicherter Feldwert, Waehrungsbetrag und Journal-Check-FactBox koennen auseinanderfallen, solange die Zeile nicht fachlich korrekt validiert ist. |
| Loesung | In Zahlungsjournalen mit lokaler deutscher Anzeige Betrag als `-68.000,00` eingeben und nach Fokuswechsel/Journal Check pruefen. Keine API-Abkuerzung und kein `Post`, nur UI-Eingabe und Preflight. |
| Pruefung nach Korrektur | `PAYMENTS-006` zeigt nach lokalem Format vor Refresh `0 Issues`. Nach Refresh entsteht aber der naechste Setup-Blocker `Bank Account Posting Group` am Balance Account `BANK-RM-01`; deshalb weiterhin keine Zahlungsfreigabe. |
| Buchwirkung | Die Anleitung muss erklaeren: Zahlungsjournalzeile sichtbar ausfuellen reicht nicht. Journal Check rechts ist ein Pflicht-Kontrollpunkt. Fehler werden als Lernfall dokumentiert, nicht ueber API oder direkte Buchung umgangen. |
| Kuenftige Regel | Fachliche Anlage, Aenderung oder Vorbereitung fuer Buchscreenshots laeuft ueber UI. Bei Betragsfeldern lokales Anzeigeformat pruefen und danach Journal Check/Refresh lesen. API ist keine Abkuerzung fuer Klickpfade; wenn API als Laborfit genutzt wurde, bleibt ein UI-Pfad oder eine klare Voraussetzung im Buch offen. |

## WK-BC-PAY-004 Bank Account Posting Group fehlt am Zahlungs-Gegenkonto

| Feld | Wert |
|---|---|
| Status | geloest als Bankkonto-Posting-Fit; Folgeblocker Amount bleibt offen; keine Zahlung |
| Testfall | `PAYMENTS-006`, `PAYMENTS-007` |
| Situation | Nach Amount-Korrektur wurde im Cash Receipt Journal ein Zahlungseingangs-Entwurf mit Debitor `D10000`, Betrag `-68.000,00`, Gegenkonto `BANK-RM-01` und Rechnungsbezug `PS-INV103297` vorbereitet. |
| Symptom | Nach `Refresh` meldet Journal Check `1 Issues Total`. Current line zeigt: `'Bank Account Posting Group' ist nicht vorhanden. Identifizierende Felder und Werte: Code=''`. |
| Ursache | `BANK-RM-01` existiert als Laborbankkonto, aber die Bank Account Posting Group beziehungsweise die daran haengende Kontenfindung ist fuer eine Zahlungsbuchung noch nicht tragfaehig gesetzt. |
| Warum BC so reagiert | Beim Zahlungsjournal muss BC nicht nur Debitor und Betrag kennen. Das Gegenkonto Bankkonto muss auf ein Sachkonto durchgebucht werden koennen. Dafuer dient die Bankkontobuchungsgruppe. Ohne diese Gruppe kann BC keine Bank-/Fibu-Wirkung erzeugen. |
| Loesung | `PAYMENTS-007` oeffnet `BANK-RM-01` ueber die UI und weist `Bank Acc. Posting Group = CHECKING` persistiert nach. `CHECKING` verweist im CRONUS-USA-Labor auf G/L Account `18200`. Das ist ein Laborfit, kein deutscher Bank-/Kontenplan-Endstand. |
| Pruefung nach Korrektur | Der alte Fehler `'Bank Account Posting Group' ... Code=''` tritt im Nachlauf nicht mehr auf. Der Cash-Receipt-Draft bleibt aber gesperrt, weil Journal Check nun wieder das Amount-Issue meldet: `'Amount' muss in 'Gen. Journal Line' einen Wert enthalten...`. |
| Buchwirkung | Kapitel 19/20 muss erklaeren: Ein sichtbares Bankkonto reicht nicht. Fuer Zahlungsbuchungen braucht es Bankkonto, Bankkontobuchungsgruppe und Sachkonto-Fit, bevor `Post` fachlich erlaubt ist. |
| Kuenftige Regel | Zahlungsbuchung bleibt gesperrt, solange Journal Check Bank Account Posting Group oder Bank-Sachkonto-Fit bemängelt. |

## WK-BC-PAY-005 Amount-Issue bleibt nach Bankkonto-Posting-Fit

| Feld | Wert |
|---|---|
| Status | geloest als nicht buchender Journal-Check-Preflight; keine Zahlung |
| Testfall | `PAYMENTS-007`, `PAYMENTS-008` |
| Situation | Nach `BANK-RM-01 = CHECKING` wurde derselbe Cash-Receipt-Draft fuer `D10000`, `PS-INV103297`, Gegenkonto `BANK-RM-01` und Betrag `-68.000,00` erneut vorbereitet. |
| Symptom | Der alte Bank-Posting-Group-Fehler ist weg. Journal Check meldet aber weiterhin `1 Issues Total`; Current line nennt wieder `'Amount' muss in 'Gen. Journal Line' einen Wert enthalten...`. |
| Ursache | `PAYMENTS-008` zeigt, dass der Entwurf nach Amount-Fokus/Refresh stabil validiert werden kann. Entscheidend ist nicht nur der optisch sichtbare Betrag, sondern die erneute Validierung der aktuellen `Gen. Journal Line` ueber `Refresh` im rechten `Journal Check`. |
| Warum BC so reagiert | BC validiert Journalzeilen intern gegen die Tabelle `Gen. Journal Line`. Sichtbare Werte in Nachbar- oder Anzeigespalten reichen nicht, wenn das fachlich relevante Amount-Feld fuer die Journalzeile intern leer bleibt. |
| Loesung | In breiter Ansicht Amount-Feld bewusst mit `-68.000,00` fuellen, Zeile verlassen, `Refresh` im rechten `Journal Check` ausfuehren und erst dann den Status bewerten. `PAYMENTS-008` zeigt danach `1 Lines checked`, `0 Lines with issues`, `0 Issues Total` und `No issues found`. |
| Buchwirkung | Kapitel 19/20 muss betonen: Eine Journalzeile gilt erst als zahlungsreif, wenn `Journal Check` keine Issues meldet. Sichtbarer Betrag allein reicht nicht; `Amount` und `Amount ($)` muessen unterschieden werden. |
| Kuenftige Regel | Keine Zahlung buchen, solange `Journal Check` Amount, Posting Group oder andere Zeilenfehler meldet. Nach `Journal Check = 0 Issues` folgt zuerst eine nicht buchende Apply-/Preview-Readiness; `PAYMENTS-009` hat diesen Apply-Kontext belegt, aber `Preview Posting` war nicht direkt sichtbar. Vor einer Zahlung braucht es weiterhin eine ausdrueckliche Freigabe. |

## WK-BC-P2P-001 Kreditor ohne Template blockiert P2P-Entwurf

| Feld | Wert |
|---|---|
| Problem | Der erste P2P-Readiness-Lauf konnte für `K10000` keinen belastbaren Purchase-Order-Entwurf erzeugen, solange die Kreditoren-/Posting-Vorgaben fehlten. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/evidence/p2p-001/005-vendor-template-application-page-text.txt`, `playwright/projects/fibu-book5/evidence/p2p-001/P2P-READINESS.json`, `playwright/projects/fibu-book5/img/p2p-001-010-vendor-k10000.png` |
| Ursache | Business Central braucht beim Einkauf nicht nur eine Kreditorennummer. Zahlungsbedingungen, Zahlungsart und Posting-Kontext werden aus dem Kreditor und seiner Einrichtung abgeleitet. Ein neu erzeugter Labor-Kreditor ist ohne Template fachlich noch nicht reif für Einkaufsbelege. |
| Lösung | Auf der Vendor Card `K10000` wurde `Apply Template` genutzt und bestätigt. Danach konnte der Test den Kreditor erneut patchen und einen temporären Purchase-Order-Entwurf mit `RAW-STEEL` anlegen und wieder löschen. |
| Buchwirkung | Kapitel 12 wurde ergänzt: Der P2P-Fall startet nicht direkt mit der Bestellung, sondern braucht zuerst Kreditoren- und Artikel-Readiness. Ein fehlendes Posting-/Template-Setup ist kein Bedienfehler des Einkäufers. |
| Künftige Regel | Vor P2P-Preview oder Buchung immer erst Readiness prüfen: Kreditor, Artikel, Lagerort, Postinggruppen, Kosten, Steuer-/Tax-Setup und Cleanup-Strategie. |

## WK-BC-P2P-002 Vendor Invoice No. fehlt vor Preview/Buchung

| Feld | Wert |
|---|---|
| Problem | Der erste P2P-Preview-Versuch fuer Bestellung `106036` stoppte auf `Error Messages` statt `Posting Preview`. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/evidence/p2p-001/095-preview-posting-page-text.txt` mit Meldung `You need to enter the document number of the document from the vendor in the Vendor Invoice No. field`; Screenshot `playwright/projects/fibu-book5/img/p2p-001-095-preview-posting.png` nach Korrektur. |
| Ursache | Bei Einkaufsrechnungen erwartet BC die externe Belegnummer des Lieferanten. Sie verhindert, dass Rechnungen ohne Lieferantenreferenz gebucht oder spaeter nicht mehr eindeutig zugeordnet werden. |
| Lösung | Die v2.0-Standard-API `purchaseOrders` enthaelt `vendorInvoiceNumber` nicht. Der Laborlauf setzt das Feld deshalb ueber ODataV4 `purchaseDocuments.vendorInvoiceNumber` und oeffnet danach Preview Posting erneut. |
| Buchwirkung | Kapitel 12 muss `Kred.-Rechnungsnr.` / `Vendor Invoice No.` als Pflichtpruefung vor Preview und Buchung nennen. |
| Künftige Regel | Bei BC-Pflichtfeldern pruefen, ob die Standard-API sie wirklich abdeckt. Falls nicht, Page-/OData-Service oder UI-Pfad dokumentieren; niemals die Fehlermeldung wegklicken und buchen. |

## WK-BC-O2C-001 Tell-Me-Suche als Screenshot, aber nicht als technische Navigation

| Feld | Wert |
|---|---|
| Problem | Die Suche `Alt+Q` / `Sales Orders` war als Anfängerpfad sichtbar, aber Playwright konnte den Suchtreffer nicht immer stabil öffnen. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/img/uat-o2c-001-010-suche-verkaufsauftraege.png` |
| Ursache | Business Central rendert Tell-Me-Suchergebnisse dynamisch und teils anders als klassische Web-Links. Außerdem kann der oberste Treffer fachlich falsch sein. |
| Lösung | Für Buchscreenshots bleibt die Suche sichtbar. Der technische Lauf öffnet die Verkaufsauftragsliste danach über Page-ID `9305`. |
| Buchwirkung | Die Anleitung muss weiterhin `Alt+Q` erklären, aber ausdrücklich sagen, welchen Treffer der Leser auswählt. |
| Künftige Regel | Suche für Anwenderschulung fotografieren; kritische Playwright-Prüfungen über stabile Page-IDs oder eindeutig gescopte UI-Elemente steuern. |

## WK-BC-O2C-002 `Neu` ist Menüaktion, kein klassischer Button

| Feld | Wert |
|---|---|
| Problem | Der Helper `clickButtonInAnyFrame` fand `Neu` nicht, obwohl die Aktion sichtbar war. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/img/uat-o2c-001-020-liste-verkaufsauftraege.png` |
| Ursache | BC rendert Aktionen in der Befehlsleiste häufig als `menuitem`, nicht als `button`. |
| Lösung | Der Helper sucht jetzt nach `button` und `menuitem`. Bei `menuitem` wird nach dem Klick zusätzlich `Enter` gesendet, weil BC die Aktion teils erst fokussiert. |
| Buchwirkung | Die Buchanleitung beschreibt `Neu` als Aktion in der Verkaufsauftragsliste, nicht als beliebigen Button. |
| Künftige Regel | BC-Befehlsleisten immer als Aktionsmenü behandeln; Playwright-Helper dürfen nicht nur Button-Rollen unterstützen. |

## WK-BC-O2C-003 Debitor `D10000` wird im sichtbaren Feld `Customer Name` gewählt

| Feld | Wert |
|---|---|
| Problem | Die Eingabe `D10000` im sichtbaren Feld wurde nicht übernommen; der Auftrag blieb ohne Debitor. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/img/uat-o2c-001-030-kopf-debitor-d10000.png`; die fruehere redundante Datei `playwright/projects/fibu-book5/img/uat-o2c-001-030-neuer-verkaufsauftrag.png` wurde entfernt. |
| Ursache | Im Auftragskopf ist zuerst `Customer Name` sichtbar. Der fachliche Debitorcode `D10000` erscheint nach Auswahl in Liste und FactBox, ist aber nicht zwingend das Eingabefeld, das der Anwender zuerst sieht. |
| Lösung | Der Test gibt den Kundennamen `Mueller Maschinenbau GmbH` ein und prüft danach `D10000` im Seitentext/FactBox-Kontext. |
| Buchwirkung | Die Anleitung wurde korrigiert: Debitor über Name oder Lookup auswählen und anschließend Nummer `D10000` prüfen. |
| Künftige Regel | Sichtbares Feld und fachlicher Schlüssel sind getrennt zu erklären. Für Anfänger immer sagen: welchen Wert eingeben, wo die Nummer danach geprüft wird. |

## WK-BC-O2C-004 Labor-Screenshotläufe dürfen Entwürfe nicht stehen lassen

| Feld | Wert |
|---|---|
| Problem | Jeder UI-Lauf über `Neu` legt einen echten Verkaufsauftrag an. Fehlläufe erzeugten leere oder unvollständige Entwürfe. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/evidence/uat-o2c-001/999-cleanup.json` |
| Ursache | Business Central speichert neue Belege früh automatisch. Ein Screenshot-Test ist damit nicht nur Betrachtung, sondern verändert Daten. |
| Lösung | `UAT-O2C-001` räumt Laboraufträge mit `customerNumber = D10000` nach dem Screenshot per API wieder weg. Zwischenläufe wurden ebenfalls gezielt bereinigt. |
| Buchwirkung | Im Buch steht jetzt die Regel: Labor-Screenshotläufe abbrechen/verwerfen/entfernen; echte Evidence-Läufe bewusst behalten oder buchen. |
| Künftige Regel | Jeder Test, der Belege erzeugt, braucht vorab eine Cleanup-Strategie. Cleanup darf nie ungescopten Seitentext verwenden. |

## WK-BC-O2C-005 Ungescopter Seitentext enthält Liste und Karte gleichzeitig

| Feld | Wert |
|---|---|
| Problem | Eine frühe Cleanup-Logik nahm die erste Belegnummer aus dem Seitentext und hätte dadurch einen alten Listendatensatz erwischen können. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/img/uat-o2c-001-030-kopf-debitor-d10000.png`, `playwright/FINDINGS.md` → `FIND-BC-TEST-003` |
| Ursache | BC hält Hintergrundliste, aktuelle Karte, FactBox und Hinweise gleichzeitig im DOM. `pageText()` ist Evidence-Material, aber kein eindeutiger Datensatz-Scope. |
| Lösung | Cleanup wurde auf API-Filter `customerNumber = D10000` umgestellt. Damit werden nur Laboraufträge aus unserem Szenario entfernt. |
| Buchwirkung | Evidence-Regeln wurden ergänzt: Nachweise müssen eindeutig sagen, welcher Beleg geprüft wird. |
| Künftige Regel | Datensatznummern aus Kartenkontext, API-Antwort, URL, eindeutigem Marker oder Filter ermitteln; niemals blind aus freiem Seitentext. |

## WK-BC-O2C-006 Breiter Viewport für Tabellen und Zeilen

| Feld | Wert |
|---|---|
| Problem | Bei `1440x1000` waren BC-Listen und Verkaufszeilen zu eng; viele Spalten lagen außerhalb des sichtbaren Bereichs. |
| Sichtbarer Beleg | ältere und neue `playwright/projects/fibu-book5/img/uat-o2c-001-020-liste-verkaufsauftraege.png`; neuer Lauf zeigt mehr Spalten bis Status/Beträge. |
| Ursache | Business Central-Listen sind breit und horizontal scrollbar. Standard-Viewport-Breiten erzeugen unnötig abgeschnittene Tabellenbilder. |
| Lösung | Playwright-Viewport wurde auf `1920x1080` erhöht. Zusaetzlich darf die breite Layoutansicht beziehungsweise eine vergroesserte Seiten-/Listenansicht genutzt werden, wenn BC dadurch relevante Spalten ohne irrefuehrenden Zuschnitt zeigt. |
| Buchwirkung | Laborbilder werden aussagekräftiger, weil mehr Tabellenkontext sichtbar ist. Der Buchtext muss aber benennen, ob das Bild im normalen Layout, mit eingeklappter FactBox oder in breiter Layoutansicht aufgenommen wurde. |
| Künftige Regel | Für BC-Listen und Belegzeilen standardmäßig `1920x1080` nutzen. Für finale Bilder zusätzlich prüfen, ob FactBox ein- oder ausgeblendet werden soll und ob breite Layoutansicht, horizontaler Scroll oder Detailansicht die fachlich bessere Darstellung liefert. |

## WK-BC-O2C-007 Hilfekarten und Popover sind Laborbefunde

| Feld | Wert |
|---|---|
| Problem | BC blendet Hilfekarten wie `About sales orders` oder `About sales order details` ein; Popover können Felder überlagern. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/img/uat-o2c-001-020-liste-verkaufsauftraege.png`, `playwright/projects/fibu-book5/img/uat-o2c-001-030-kopf-debitor-d10000.png` |
| Ursache | In neuen Rollen/Companies zeigt BC kontextuelle Hilfe und Touren. Bei Feldfokus können zusätzliche Kontakt-/Lookup-Popover erscheinen. |
| Lösung | Für den aktuellen Lernlauf werden Hilfekarten bewusst nicht entfernt, weil sie zeigen, was Anfänger sehen. Für finale Buchbilder wird später entschieden, ob sie geschlossen werden. |
| Buchwirkung | Hilfekarten können im Buch als Hinweis auf BC-Onboarding erwähnt werden, gehören aber vermutlich nicht in finale Prozessscreenshots. |
| Künftige Regel | Laborbilder dürfen Hilfekarten zeigen; finale Screenshots brauchen einen kontrollierten Zustand ohne verdeckende Popover. |

## WK-BC-O2C-008 `Escape` ist kein sicherer globaler Screenshot-Cleanup

| Feld | Wert |
|---|---|
| Problem | Ein Versuch, Hilfekarten vor Screenshots pauschal mit `Escape` zu schließen, brachte BC in einen Größenänderungsmodus. Danach enthielt der Seitentext nur noch Shell-/Skripttext statt den Verkaufsauftrag. |
| Sichtbarer Beleg | Fehlgeschlagener Lauf `UAT-O2C-001` am 2026-06-07; Playwright-Trace unter `test-results/.../trace.zip` während des Laborlaufs. |
| Ursache | Der Fokus lag offenbar auf einem Splitter/Resize-Element. In Business Central bedeutet `Escape` kontextabhängig nicht nur „Popover schließen“, sondern kann einen gestarteten UI-Zustand abbrechen oder verändern. |
| Lösung | `Escape` wurde aus `settleForBookScreenshot()` entfernt. Der Test wartet nur kurz und prüft vor dem Screenshot den fachlichen Seitentext. |
| Buchwirkung | Finale Buchscreenshots dürfen nicht durch ungezielte Tastaturbereinigung entstehen. Hilfekarten werden entweder bewusst als Lernbefund gezeigt oder gezielt über ihre eigene Schließen-Aktion entfernt. |
| Künftige Regel | Keine globalen Tastatur-Workarounds ohne anschließende fachliche Prüfung. Nach jeder UI-Bereinigung muss der Test erneut Auftrag, Debitor oder Zeile im aktuellen Kontext nachweisen. |

## WK-BC-O2C-008A Teaching Tips gezielt schliessen

| Feld | Wert |
|---|---|
| Problem | Page `540` zeigte beim Standarddimensionsnachweis unten links die Karte `About default dimensions`; dadurch war der Screenshot technisch gueltig, aber als Buchbild unruhig. |
| Sichtbarer Beleg | Vorheriger Labor-Screenshot `playwright/projects/fibu-book5/img/masterdata-007-default-dimensions-item-rm-m100.png`; aktueller Lauf `npm run fibu:masterdata:default-dimensions` erzeugt die beiden Page-540-Bilder ohne Karte. |
| Ursache | Microsoft beschreibt solche Karten als Teaching Tips und Tours. In der aktuellen gemischten UI war der Schliessen-Button als `Verwerfen` beschriftet, nicht als `Close`. |
| Loesung | `dismissTours()` erkennt jetzt `Schliessen`, `Close`, `Dismiss`, `Discard` und `Verwerfen`. Der Helfer schliesst die Karte ueber ihre eigene Aktion statt global `Escape` zu druecken. |
| Buchwirkung | Teaching Tips duerfen als Lernbefund erklaert werden. Fuer Feld- und Tabellenbelege sollen sie geschlossen werden, wenn sie keine fachliche Aussage tragen. |
| Kuenftige Regel | Keine blinde globale Ausschaltung der Onboarding-Hilfe setzen. Fuer reproduzierbare Buchscreenshots Teaching Tips gezielt pro Lauf schliessen und danach den fachlichen Seitentext erneut pruefen. |

## WK-BC-INV-001 Report-Request-Pages nicht mit globalem Tour-Cleanup oder Maximize-Klick stoeren

| Feld | Wert |
|---|---|
| Problem | Der erste automatisierte `INVENTORY-002`-Lauf hing im generischen `dismissTours()` beziehungsweise verlor nach einem breiten/Maximize-Klick den Reportkontext. |
| Sichtbarer Beleg | Fehlgeschlagener Lauf `npm run fibu:inventory:valuation` am 08.06.2026; danach erfolgreiche Evidence unter `playwright/projects/fibu-book5/evidence/inventory-002/` und Screenshots `playwright/projects/fibu-book5/img/inventory-002-*`. |
| Ursache | Report-Request-Pages liegen als modaler BC-Kontext ueber dem Role Center. Ein zu breites Close-Muster (`X`) konnte falsche UI-Elemente wie `Report Inbox` treffen; zusaetzlich ist `Seite maximieren` bei Reportdialogen nicht so stabil wie bei Listen. |
| Loesung | `dismissTours()` wurde enger gefasst: kein alleinstehendes `X` mehr als Close-Kriterium, dafuer gezielte Texte wie `Verstanden`/`Got it`. `INVENTORY-002` oeffnet den Reporttreffer sofort und nutzt fuer Request Page und Vorschau den grossen Viewport statt generischem Maximize-/Breites-Layout-Klick. |
| Buchwirkung | Die Anleitung darf die Report-Request-Page mit den Filtern zeigen. Sie muss nicht behaupten, dass breite Layoutansicht fuer jeden Reportdialog noetig oder sinnvoll ist. |
| Kuenftige Regel | Breite Layoutansicht fuer Tabellen/listenartige Seiten nutzen; bei Report-Request-Pages zuerst Stabilitaet pruefen und nur gezielt schliessen, was fachlich stoert. |

## WK-BC-O2C-009 CRONUS-Labor ist nicht automatisch deutscher Steuerfit

| Feld | Wert |
|---|---|
| Problem | Der Buchfall erwartet `EUR`, `19 %` USt, Steuerbetrag `12.920` und Bruttobetrag `80.920`. Der aktuelle Laborlauf erzeugt aber `USD`, `taxCode = FURNITURE`, `taxPercent = 0`, Steuerbetrag `0` und Bruttobetrag `68.000`. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/evidence/uat-o2c-001/045-target-vs-labor-delta.md`, `playwright/projects/fibu-book5/evidence/uat-o2c-001/040-zeile-artikel-rm-m100-api-result.json` |
| Ursache | Die Spielwiese basiert auf CRONUS USA. Die bisher gesetzten Werte `CUSTOMER COMPANY`, `RETAIL`, `RESALE` und `FURNITURE` machen den technischen Verkaufsauftrag lauffähig, bilden aber keine deutsche EUR-/19-%-USt-Logik ab. |
| Lösung | Der Playwright-Test erzeugt jetzt automatisch einen Ziel-vs.-Labor-Abweichungsnachweis. Der aktuelle Lauf bleibt gültig für Klickpfad, Stammdatenbedarf und Screenshot-Lernen; der deutsche Steuer-Endstand wird als eigene Setup-Aufgabe behandelt. |
| Buchwirkung | Das Buch muss zwischen Laborlauf und finalem Zielbild unterscheiden. Screenshots aus CRONUS dürfen nicht als Nachweis für `EUR` und `19 %` USt ausgegeben werden. `TAX-001` dokumentiert jetzt die konkrete Readiness-Grenze: Sales Tax/FURNITURE/0 % ist kein VAT19-Endstand. |
| Künftige Regel | Wenn ein Buchfall fachliche Beträge, Steuer oder Währung erwartet, schreibt der Test einen Soll-Ist-Nachweis. Abweichungen werden als Setup-Lücke dokumentiert und nicht still übergangen. Praktischer DE-VAT-Ziellauf nur mit Setup-/Umgebungsfreigabe. |

## WK-BC-O2C-009A Aktueller O2C-Laborstand: EUR geloest, Steuer offen

| Feld | Wert |
|---|---|
| Problem | Der aktuelle `UAT-O2C-001`-Lauf entspricht dem Buchziel bei Waehrung und Dimension inzwischen besser, aber noch nicht beim deutschen Steuerziel. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/evidence/uat-o2c-001/045-target-vs-labor-delta.md`, `046-o2c-lab-learning-summary.md`, `playwright/projects/fibu-book5/img/uat-o2c-001-040-zeile-artikel-rm-m100.png`, `playwright/projects/fibu-book5/img/uat-o2c-001-050-dimension-productline-machine.png`. |
| Ursache | `D10000` liefert jetzt `Currency Code = EUR`. Die CRONUS-USA-Spielwiese nutzt aber weiter Sales-Tax-Logik: Artikel `RM-M100` traegt `Tax Group = FURNITURE`, die Zeile liefert `taxPercent = 0`. |
| Loesung | Der Test klappt fuer breite Zeilenbilder die rechte FactBox ein, schreibt `039-factbox-hidden-result.json`, erzeugt eine kompakte Lernzusammenfassung und markiert den Steuer-Endstand weiter als Laborgrenze. |
| Buchwirkung | Die O2C-Anleitung darf jetzt sagen: EUR ist im Labor nachgewiesen. Sie darf nicht sagen: deutsche `19 %` USt ist nachgewiesen. Vor Buchung oder finalem Screenshot braucht es weiter deutschen VAT-Zielmandanten oder sauber dokumentiertes deutsches VAT-Setup. |
| Kuenftige Regel | Wenn ein frueherer Delta-Befund teilweise geloest wurde, muss der Test die neue Wahrheit neu schreiben und das Buch die alte Abweichung korrigieren. |

## WK-BC-O2C-009B Preview Posting erreicht; Inventory Posting Setup war der Blocker

| Feld | Wert |
|---|---|
| Problem | `Preview Posting` wurde im O2C-Labor erreicht, aber Business Central zeigte vor `MASTERDATA-009` `Error Messages` statt einer Postenvorschau. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/img/uat-o2c-001-060-buchungsvorschau.png`, `playwright/projects/fibu-book5/evidence/uat-o2c-001/060-preview-posting-result.json`, `playwright/projects/fibu-book5/evidence/uat-o2c-001/060-preview-posting-learning.md`, `playwright/projects/fibu-book5/img/masterdata-008-inventory-posting-setup-fra-zl-resale.png`, `playwright/projects/fibu-book5/evidence/masterdata-008/013-diagnosis.json`, `playwright/projects/fibu-book5/img/masterdata-009-inventory-posting-setup-fra-zl-resale-14140.png`, `playwright/projects/fibu-book5/evidence/masterdata-009/010-inventory-posting-setup-fit.json` |
| Situation | Verkaufsauftrag `UAT-O2C-001` ist technisch angelegt und erreicht die Buchungsvorschau-Pruefung. Vor dem Setup-Fit oeffnete BC die Fehlerliste; nach `MASTERDATA-009` oeffnet BC `Posting Preview`. |
| Symptom | Vor dem Fix nannte `Error Messages`: `Inventory Account is missing in Inventory Posting Setup Location Code: FRA-ZL, Invt. Posting Group Code: RESALE.` Nach dem Fix ist diese Meldung nicht mehr im Preview-Text. |
| Ursache | Die Fehlermeldung lautet: `Inventory Account is missing in Inventory Posting Setup Location Code: FRA-ZL, Invt. Posting Group Code: RESALE.` BC prueft damit nicht nur Debitor, Artikel und Steuer, sondern auch die Lagerbuchungsmatrix fuer die Kombination aus Lagerort und Lagerbuchungsgruppe. |
| Warum BC so reagiert | Beim Buchen einer Artikelbewegung muss BC nicht nur Menge und Umsatz verarbeiten, sondern auch Bestandswerte auf Sachkonten fortschreiben. Dafuer braucht die Kombination aus Lagerort und Inventory Posting Group ein Bestandskonto. |
| Loesung | Nicht buchen und nicht mit `OK` im normalen Buchungsdialog weitergehen. `MASTERDATA-008` zeigt die Zielzeile `FRA-ZL` + `RESALE` auf Page `5826` mit leerem `Inventory Account`. `MASTERDATA-009` setzt fuer den CRONUS-Laborfit `Inventory Account = 14140`, weil vorhandene CRONUS-RESALE-Zeilen dieses Konto verwenden. |
| Pruefung nach Korrektur | `npm run fibu:uat:o2c` wurde erneut ausgefuehrt. Ergebnis: `openedPreview = true`, `oldInventoryPostingErrorPresent = false`, `openedPostingChoiceDialog = false`, `noPostingCommittedByTest = true`. Die Vorschau zeigt `G/L Entry = 4`, `Cust. Ledger Entry = 1`, `Item Ledger Entry = 1`, `Detailed Cust. Ledg. Entry = 1`, `Value Entry = 1`. |
| Buchwirkung | Die O2C-Anleitung braucht vor dem Buchungsschritt einen Fehler-/Pruefhinweis: Wenn die Buchungsvorschau auf `Inventory Posting Setup` stoppt, fehlt nicht der Auftrag, sondern eine Kontenfindung fuer Bestand. Leser lernen dadurch, warum Lagerort und Lagerbuchungsgruppe buchungsrelevant sind. |
| Status | Laborfix praktisch bestaetigt: Ursache diagnostiziert, `Inventory Account = 14140` gesetzt, alter Fehler verschwunden, Posting Preview sichtbar. Kein deutscher Kontenplan-Endstand und keine echte Buchung. |

## WK-BC-INV-001 Item-Journal-Spalte `Applies-to Entry` nicht mit `Unit Cost` verwechseln

| Feld | Wert |
|---|---|
| Status | geloest als Tool-/Anfaenger-Lernfall; keine Buchung |
| Testfall | `INVENTORY-006` |
| Situation | Fuer den geplanten positiven Trainingsbestand `RM-M100 +2` in `FRA-ZL` wurde eine Item-Journal-Zeile vorbereitet. |
| Symptom | Ein frueher Probeversuch schrieb `42000` in die rechts liegende Spalte `Applies-to Entry`. BC markierte die Zeile mit Fehlerhinweis statt daraus einen korrekten Kostenwert zu machen. |
| Ursache | Die Spalten im Item Journal liegen horizontal dicht nebeneinander. `Unit Cost` ist eine Bewertungs-/Kosteninformation; `Applies-to Entry` ist eine Zuordnungs-/Ausgleichsspalte und erwartet keinen Kostenbetrag. Blindes Feldindex-Fuellen ist hier gefaehrlich. |
| Warum BC so reagiert | BC validiert Journalfelder fachlich. Ein Wert in `Applies-to Entry` wird als Postenbezug interpretiert, nicht als Kostenpflege. |
| Loesung | Der stabile Lauf fuellt nur Posting Date, Entry Type, Document No., Item No., Location Code und Quantity. BC setzt `PCS`, Unit Amount, Amount und Unit Cost automatisch. Cleanup erfolgt ueber `Weitere Optionen anzeigen` -> `Zeile loeschen`, nicht ueber globales `Escape` oder `Ctrl+Delete`. |
| Pruefung nach Korrektur | `npm run fibu:inventory:target-stock-draft` laeuft gruen. Evidence zeigt `targetVisible=true`, `unitCostVisible=true`, `productlineMachineVisible=true`, `posted=false`, `cleanup.cleaned=true`. |
| Buchwirkung | Die Klickanleitung muss Journalspalten erlaeutern: Kostenwerte nicht in `Applies-to Entry` eintragen; vor Buchung Zielwerte und Dimension pruefen; erst nach stabiler Vorabkontrolle buchen. |
| Kuenftige Regel | Vor jeder echten Buchung braucht es eine dokumentierte Vorabkontrolle: bevorzugt `Preview Posting`, bei Item Journals mindestens einen belegten `Journal Check` oder einen anderen fachlich akzeptierten Preflight. Ein Fehler wird als Lernbild dokumentiert und erst fachlich geloest; er wird nicht durch zufaelliges Wegklicken oder direkte Buchung umgangen. |

## WK-BC-INV-002 Journal Check braucht sichtbare FactBox und robusten Cleanup

| Feld | Wert |
|---|---|
| Status | geloest als Tool-/Screenshot-Lernfall; keine Buchung |
| Testfall | `INVENTORY-007` |
| Situation | Fuer die vorbereitete Zielzeile `RM-M100 +2` in `FRA-ZL` sollte der rechte `Journal Check` als nicht buchender Preflight fotografiert werden. Anders als bei breiten Tabellenbildern darf die FactBox hier nicht eingeklappt werden, weil sie den fachlichen Nachweis enthaelt. |
| Symptom | Ein erster Lauf zeigte zwar die Zielzeile und `Journal Check`, blieb aber im Cleanup an der Zeilenmenue-Erkennung haengen. Ein zweiter technischer Fallback mit Tastaturloeschung verliess den Journal-Kontext und landete im Role Center. |
| Ursache | In Business Central verschiebt die sichtbare FactBox den Tabellenbereich. Das Zeilenmenue `Weitere Optionen anzeigen` ist dann nicht immer per Role-Name sichtbar. Globale Tastaturpfade sind kontextabhaengig und koennen statt der Zeile die Seite beeinflussen. |
| Loesung | `INVENTORY-007` laesst die FactBox fuer den Screenshot sichtbar, liest die Journal-Check-Buttons strukturiert aus und nutzt fuer Cleanup zuerst sichtbare/geometrische Zeilenmenue-Auswahl. Falls ein alter Restentwurf aus einem Fehlversuch auftaucht, wird er im Pre-Cleanup geloescht und der Item-Journal-Kontext frisch geoeffnet. |
| Pruefung nach Korrektur | `npm run fibu:inventory:journal-check` laeuft gruen. Evidence zeigt `journalCheckVisible=true`, `oneLineCheckedVisible=true`, `zeroLinesWithIssuesVisible=true`, `zeroIssuesTotalVisible=true`, `posted=false`, `cleanup.cleaned=true`. |
| Buchwirkung | Fuer dieses Bild ist die rechte Infobox kein Stoerer, sondern der Nachweis. Die Anleitung muss erklaeren, wann FactBox einklappen sinnvoll ist und wann sie bewusst sichtbar bleiben muss. |
| Kuenftige Regel | Tabellenbilder: FactBox einklappen, wenn sie Spalten verdraengt. Kontrollbilder: FactBox sichtbar lassen, wenn dort der fachliche Status steht. Cleanup nie nur ueber globale Tasten absichern. |

## WK-BC-INV-003 Journal-Check-Zaehler und Current-line-Status getrennt lesen

| Feld | Wert |
|---|---|
| Status | geloest als Tool-/Anfaenger-Lernfall; Laborbuchung `INV008-899959` danach erfolgreich |
| Testfall | `INVENTORY-008` |
| Situation | Vor der kontrollierten positiven Item-Journal-Laborbuchung sollte der Test erneut einen Preflight sichern. |
| Symptom | Ein erster `INVENTORY-008`-Lauf zeigte die fachlich richtige Zielzeile, aber die FactBox-Kachel blieb auf `0 Lines checked`, obwohl `Current line: No issues found` sichtbar war. Ein zweiter Lauf las den Zustand zu frueh, waehrend BC die Zeile noch speicherte. |
| Ursache | Business Central speichert Journalzeilen automatisch und aktualisiert FactBox-Kacheln asynchron. Der globale Zaehler `Lines checked` ist nicht in jedem UI-Moment der sicherste Nachweis fuer die aktuelle Zeile; der Current-line-Status und `0 Issues Total` sind fuer diesen Laborlauf der relevante Preflight. |
| Warum BC so reagiert | Journale sind editierbare Tabellen. Der sichtbare Zeileninhalt, der gespeicherte Datensatz und die rechte FactBox koennen kurzzeitig unterschiedliche Aktualisierungsstaende haben. |
| Loesung | `INVENTORY-008` wartet nach der Zeileneingabe auf einen stabilen Zustand und akzeptiert fuer die Buchungsfreigabe `Current line: No issues found` plus `0 Issues Total`. Alte `INV008-*`-Drafts werden vor dem naechsten Versuch gezielt geloescht. |
| Pruefung nach Korrektur | `npm run fibu:inventory:post-target-stock` lief gruen. Evidence zeigt `posted=true`, `documentNo=INV008-899959`, Artikelposten/Wertposten/Sachposten sichtbar und Inventory Valuation `Total Inventory Value = 67.000,00`. |
| Buchwirkung | Die Anleitung darf nicht nur auf eine einzelne Kachel schauen. Anfaenger sollen Zielzeile, Current-line-Status, `0 Issues Total`, Buchungsdialog und danach Postenspur gemeinsam pruefen. |
| Kuenftige Regel | Vor Journalbuchungen nie blind aus einem einzelnen UI-Zaehler ableiten. Wenn `Preview Posting` nicht verfuegbar ist, mindestens Current-line-Preflight, keine Issues, Zielwerte, Dimension und anschliessende Postenspur dokumentieren. |

## WK-BC-O2C-010 Dimension im Auftrag ist eigener Nachweis, nicht nur Stammdatenannahme

| Feld | Wert |
|---|---|
| Problem | Das Zielmodell erwartet `PRODUCTLINE = MACHINE`. `MASTERDATA-007` setzt diese Standarddimension am Artikel `RM-M100`, aber `UAT-O2C-001` weist diesen Dimensionswert im konkreten Verkaufsauftrag noch nicht nach. Gleichzeitig weist der Auftrag am Kopf `CHANNEL = B2B` nach. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/evidence/uat-o2c-001/045-target-vs-labor-delta.md` enthaelt `Dimension PRODUCTLINE: erwartet MACHINE, Labor liefert nicht nachgewiesen` und `Dimension CHANNEL: nicht im Zielvergleich, Labor liefert B2B`. Die API-Evidence `040-zeile-artikel-rm-m100-api-result.json` enthaelt `orderDimensionSetLines` mit `CHANNEL = B2B`. |
| Ursache | Eine Standarddimension am Artikel ist eine Vorgabe. Der Auftragskopf kann Debitor-/Kopfdimensionen tragen, waehrend die Artikel-/Produktliniendimension in der Zeile, im Dimensionsdialog oder spaeter in Posten nachgewiesen werden muss. |
| Loesung | Die zentrale Evidence-Logik vergleicht erwartete Dimensionen und zeigt jetzt auch Ist-Dimensionen, die nicht im Zielvergleich stehen. Der naechste O2C-Ausbau muss den Dimensionsdialog der Verkaufszeile oder eine geeignete Beleg-/Postenansicht fotografieren. |
| Buchwirkung | Das Buch muss klar trennen: Standarddimension vorbereiten, Dimension im Beleg pruefen, Dimension nach Buchung in Posten/Reporting nachweisen. |
| Kuenftige Regel | Keine Dimension gilt nur deshalb als prozessual bewiesen, weil sie an Stammdaten gesetzt wurde. Jeder Prozessfall braucht einen eigenen Dimensionsnachweis im Beleg oder in den gebuchten Posten. |

## WK-BC-O2C-011 Debitorwaehrung `EUR` ist Stammdatenlogik, nicht nur globale Waehrung

| Feld | Wert |
|---|---|
| Problem | Der Buchfall erwartet `EUR`, der CRONUS-Laborauftrag lief aber zuerst mit `USD`. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/evidence/mcp-currency/100-currencies-page.txt`, `playwright/projects/fibu-book5/evidence/mcp-currency/160-customer-invoicing-show-more.txt`, `playwright/projects/fibu-book5/evidence/mcp-currency/370-verify-persisted-show-more.txt` |
| Ursache | `EUR` war in der Waehrungsliste vorhanden. Am Debitor `D10000` war unter `Invoicing` -> `Mehr anzeigen` -> `Prices and Discounts` das Feld `Currency Code` jedoch leer. In CRONUS-USA bedeutet leer fuer Verkaufsbelege praktisch lokale Mandantenwaehrung, also USD. |
| Loesung | Per Playwright MCP wurde die Debitorenkarte `D10000` geoeffnet, der Stift `Aenderungen auf der Seite vornehmen` aktiviert, der FastTab `Invoicing` trotz Pflichtfeldhinweis geoeffnet, `Mehr anzeigen` gewaehlt und `Currency Code` als Combobox auf `EUR` gesetzt. Ein frischer Reload bestaetigt den persistenten Wert. |
| Buchwirkung | Das Buch muss im Stammdatenkapitel erklaeren, dass die Zielwaehrung fuer den O2C-Fall am Debitor gepflegt oder im Auftrag bewusst gesetzt werden muss. Nur eine vorhandene Waehrung `EUR` reicht nicht. |
| Kuenftige Regel | Bei jedem Zielwert wie Waehrung, USt oder Dimension unterscheiden: globale Einrichtung vorhanden, Stammdatenwert gepflegt, Wert im konkreten Beleg nachgewiesen. |

## WK-BC-O2C-012 `19 %` USt ist in CRONUS-USA kein einfacher Feldwert

| Feld | Wert |
|---|---|
| Problem | Nach der EUR-Korrektur zeigt ein neuer Auftrag fuer `D10000` zwar `Currency Code: EUR`, aber weiterhin keinen deutschen `19 %`-USt-Zustand. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/evidence/mcp-o2c-vat-check/060-after-price-and-tax-check.txt`, `playwright/projects/fibu-book5/evidence/mcp-tax-setup-open/01-opened-Tax-Areas.txt`, `02-opened-Tax-Groups.txt`, `03-opened-Tax-Details.txt`, `04-opened-VAT-Product-Posting-Groups.txt`, `05-opened-VAT-Business-Posting-Groups.txt`, `playwright/projects/fibu-book5/evidence/mcp-vat-posting-setup/vat-posting-setup-mcp-summary.json`, `playwright/projects/fibu-book5/evidence/mcp-tax-origin/tax-origin-mcp-summary.json` |
| Ursache | Der Auftrag zeigt Sales-Tax-Felder: `Tax Area Code` leer und `Tax Group Code = FURNITURE`. Die geoeffneten Setup-Seiten sind `Tax Areas` Page 469, `Tax Groups` Page 467 und `Tax Details` Page 468. Dort existieren US-Steuerlogiken wie GA/FL und FURNITURE, z. B. GA/FURNITURE mit `Tax Below Maximum 3,0`. Die VAT-Gruppenseiten Page 470/471 sind zwar vorhanden; Page 472 zeigt `VAT Posting Setup`, die Card Page 473 aber `VAT Calculation Type = Sales Tax`. Damit gibt es im aktuellen Labor keine belastbare deutsche 19-%-Kombination. |
| Loesung | Fuer den aktuellen MCP-Lernlauf wird die USt-Abweichung nicht durch ein willkuerliches US-Steuerfeld kaschiert. Zusaetzlich wurde die Herkunft dokumentiert: `RM-M100` liefert `Tax Group Code = FURNITURE`; `D10000` liefert `Tax Liable = checked`, `Tax Area Code = leer`, `Gen. Bus. Posting Group = DOMESTIC`, `Customer Posting Group = DOMESTIC` und `Currency Code = EUR`. Das Projekt dokumentiert: EUR ist geloest, deutsche USt bleibt Zielmandant-/VAT-Setup-Aufgabe. |
| Buchwirkung | Das Buch muss erklaeren, dass `19 %` nicht durch Eingabe eines Betrags entsteht. Fuer deutsche Zielbilder braucht der Leser VAT Business Posting Group, VAT Product Posting Group und VAT Posting Setup oder eine deutsche lokalisierte Company mit passendem Setup. |
| Kuenftige Regel | In CRONUS-USA keine finalen deutschen Steuerbilder erzeugen. Sales-Tax-Felder duerfen als Lernbefund gezeigt werden; finale USt-Screenshots brauchen deutschen Mandanten oder explizit dokumentiertes deutsches VAT-Setup. |
