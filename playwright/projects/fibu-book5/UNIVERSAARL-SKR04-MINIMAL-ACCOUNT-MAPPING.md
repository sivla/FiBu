# Universaarl SKR04 Minimal Account Mapping

Status: `source-gated-candidate`

Case: `TARGET-026I-SKR04-MINIMAL-ACCOUNT-MAPPING`

Instanz: `playthru`

Company: `UNIVERSAARL-DE`

## Zweck

`UNIVERSAARL-DE` nutzt fuer die deutsche Buchwelt SKR04. Dieses Mapping ist die kleine Startliste fuer die naechsten kontrollierten Business-Central-Setup-Schritte. Es ersetzt die alte gemischte Kandidatenliste und verhindert, dass SKR03- oder CRONUS-nahe Konten versehentlich in den deutschen Zielpfad geraten.

Dieses Mapping ist noch kein vollstaendiger Kontenplan und keine Steuerberaterfreigabe. Es ist ein enges Foundation-Mapping fuer Bank, Debitoren, Kreditoren, USt und erste Erloes-/Einkaufslogik.

## Startliste fuer `UNIVERSAARL-DE`

| Konto | Name fuer Universaarl | Kontenfamilie | Bilanz/GuV | Verwendung im naechsten Setup | Status |
| --- | --- | --- | --- | --- | --- |
| `1200` | Forderungen aus Lieferungen und Leistungen | Debitoren/Forderungen | Bilanz | Customer Posting Group spaeter | `wrong-bank-path-classified`; bestehendes Konto `1200 Bank Saarland` ist sichtbar, darf aber nicht als Bank-/Payment-/VAT-/Posting-Ziel genutzt werden |
| `1140` | Waren (Bestand) | Vorraete/Warenbestand | Bilanz | Inventory Posting Setup Inventory Account spaeter | `universaarl-created-wrong-guv-blocked`; in `TARGET-048B` sichtbar angelegt, aber noch falsch als `GuV`/`Buchung`; `TARGET-048C` muss nur `GuV/Bilanz = Bilanz` korrigieren |
| `1800` | Bank Saarland | Bank | Bilanz | Bankkonto, Zahlungsjournal, Bankabstimmung spaeter | `universaarl-proven`; in `TARGET-026J` sichtbar nach Reopen |
| `1406` | Abziehbare Vorsteuer 19 Prozent | Vorsteuer | Bilanz | Purchase VAT Account spaeter | `universaarl-proven`; in `TARGET-026K` sichtbar nach kontrolliertem Fit und Reopen |
| `3300` | Verbindlichkeiten aus Lieferungen und Leistungen | Kreditoren/Verbindlichkeiten | Bilanz | Vendor Posting Group spaeter | `universaarl-proven`; in `TARGET-026L` sichtbar nach kontrolliertem Fit und Reopen |
| `3806` | Umsatzsteuer 19 Prozent | Umsatzsteuer | Bilanz | Sales VAT Account spaeter | `universaarl-proven`; in `TARGET-026L` sichtbar nach kontrolliertem Fit und Reopen; VAT Setup bleibt offen |
| `4400` | Umsatzerloese Inland 19 Prozent | Verkaufserloese | GuV | General Posting Setup Sales Account spaeter | `universaarl-proven-guv-reopen-proof`; in `TARGET-026M-SAFE-WRITE` sichtbar als `GuV`/`Buchung` nach Karten-Reopen und Kontenplan-Reopen |
| `5400` | Wareneingang / Materialaufwand | Einkauf/Wareneinsatz | GuV | General Posting Setup Purchase/COGS-Kontext spaeter | `universaarl-proven-guv-reopen-proof`; in `TARGET-026M-SAFE-WRITE` sichtbar als `GuV`/`Buchung` nach Karten-Reopen und Kontenplan-Reopen |

## Bewusst noch nicht freigegeben

| Bereich | Warum noch nicht |
| --- | --- |
| Eigenkapital / Opening Balances | Opening-Balance- und Cutover-Logik braucht eigenen Migrations-/Eroeffnungsfall. |
| Bestand / Lagerbewertung | `TARGET-048` waehlt `1140 Waren (Bestand)` als source-backed Kandidat. Dieses Konto ist aber noch nicht in `UNIVERSAARL-DE` sichtbar/reopened bewiesen. Inventory Posting Setup darf erst nach `TARGET-048B` weitergehen und darf nicht aus dem alten CRONUS-Konto `14140` abgeleitet werden. |
| Anlagen | Fixed Assets brauchen Anlagenbuchungsgruppen, AfA-Buch und deutsche Sachkontenlogik als eigene Strecke. |
| Abschreibungen | AfA-Aufwand wird erst mit Anlagen-Setup und AfA-Preview/Posten festgelegt. |
| Sonstige Aufwendungen | Nur anlegen, wenn ein konkreter Beleg- oder Fehlerfall es braucht. |

## Business-Central-Gate fuer den naechsten Lauf

Der naechste UI-Case darf nicht pauschal alle Konten erzeugen. Er muss:

1. `1200 Bank Saarland` nicht fuer Bank, Zahlungsjournal, USt oder Posting Groups verwenden.
2. `1800 Bank Saarland` als sichtbares Bank-Sachkonto mit Reopen-Proof behandeln.
3. Weitere Startkonten aus der Tabelle nur kontrolliert anlegen oder blockieren.
4. Fuer jedes Konto `Nr.`, `Name`, `Kontoart`, `Bilanz/GuV` und Reopen-Sichtbarkeit beweisen.
5. Keine VAT Posting Setup, keine Posting Groups, keine Stammdaten, keine Belege, keine Preview und keine Buchung im selben Lauf ausfuehren.

## Stand nach `TARGET-026M-SAFE-WRITE`

Der Kontenplan in `UNIVERSAARL-DE` enthaelt jetzt sichtbar:

- `1800 Bank Saarland` als Bilanz-/Buchungskonto.
- `1406 Abziehbare Vorsteuer 19 Prozent` als Bilanz-/Buchungskonto.
- `3300 Verbindlichkeiten aus Lieferungen und Leistungen` als Bilanz-/Buchungskonto.
- `3806 Umsatzsteuer 19 Prozent` als Bilanz-/Buchungskonto.
- `4400 Umsatzerloese Inland 19 Prozent` sichtbar als GuV-/Buchungskonto.
- `5400 Wareneingang / Materialaufwand` sichtbar als GuV-/Buchungskonto.

Die Screenshot-QA zeigt weiterhin die offene Altlast `1200 Bank Saarland`. Dieses Konto bleibt fuer Bank, Payment, VAT und Posting Groups gesperrt, bis ein eigener sauberer Korrekturfall existiert. `1406`, `3300` und `3806` beweisen nur sichtbare Sachkonten, nicht VAT Posting Setup, Posting Groups, USt-Posten oder Kreditorenbuchungen.

`TARGET-026M` und die Recovery-Laeufe bleiben als wichtige Blocker-Evidence erhalten: Sie zeigen, dass die Feldbeschriftung `GuV/Bilanz` nicht als Wert `GuV` zaehlt. `TARGET-026M-SKR04-GUV-ACCOUNT-SAFE-WRITE-FOLLOWUP` hat den Blocker geloest: Die Sachkontokarte wurde im echten Edit-Modus geoeffnet, das Feld `GuV/Bilanz` wurde auf `GuV` gesetzt, und beide Zielkonten wurden nach Karten-Reopen und Kontenplan-Reopen sichtbar geprueft.

## Stand nach `TARGET-026N`

`TARGET-026N` hat den Kontenplan-Checkpoint nicht freigegeben. Der Lauf blieb zwar in `playthru / UNIVERSAARL-DE` und lieferte kompakte Kontenplan-Textfragmente, aber die Screenshot-QA zeigte weiterhin den Role Center statt der sichtbaren Kontenplanliste. Damit ist der Lauf absichtlich `blocked`: Ein unsichtbarer oder veralteter Frame-Text reicht nicht als Buch- oder Setup-Beweis.

Der naechste Schritt ist deshalb noch kein VAT Setup und keine Stammdatenanlage, sondern `TARGET-026O`: eine sichtbare Kontenplan-Screenshot-Recovery. Erst wenn das Bild selbst `Nr.`, `Name`, `GuV/Bilanz`, `Kontoart` und die relevanten Starterkonten zeigt, darf der VAT-Posting-Groups-Preflight folgen. Die Altlast `1200 Bank Saarland` bleibt gegen `1800 Bank Saarland` zu klassifizieren.

## Stand nach `TARGET-026O`

`TARGET-026O` hat den sichtbaren Kontenplan-Checkpoint wiederhergestellt. Die direkte Page-16-URL zeigte zunaechst nicht belastbar genug den fachlichen Inhalt. Der stabile Read-only-Pfad war deshalb: in der sichtbaren Business-Central-Oberflaeche den Link `Kontenplan` verwenden und danach das sichtbare BC-Iframe fotografieren. Das Bild `target-026o-010-visible-chart-iframe.png` zeigt die Konten `1200`, `1406`, `1800`, `3300`, `3806`, `4400` und `5400` mit `GuV/Bilanz` und `Kontoart`.

Damit ist der Starter-Kontenplan als Universaarl-Foundation-Kontext sichtbar genug fuer den naechsten Read-only-Schritt `TARGET-027-VAT-POSTING-GROUPS-PREFLIGHT`. Nicht bewiesen sind weiterhin ein vollstaendiger SKR04-Kontenplan, Steuerberaterfreigabe, VAT Posting Setup, Posting Groups, Stammdaten, Belege, Preview Posting oder Buchungen. Die Doppelung `1200 Bank Saarland` und `1800 Bank Saarland` bleibt fuer Bank- und Zahlungsprozesse gesperrt, bis sie fachlich entschieden ist.

## Stand nach `TARGET-048`

`TARGET-048` hat keine Business-Central-Aktion ausgefuehrt. Der Lauf hat nur die Quellenfrage fuer das Lagerbewertungskonto entschieden: Fuer den ersten Waren-/Hardwarefall ist `1140 Waren (Bestand)` der source-backed Kandidat. `5400 Wareneingang / Materialaufwand` bleibt ein GuV-Aufwandskonto fuer Einkaufs-/Materiallogik und darf nicht still als Inventory-Posting-Setup-Konto verwendet werden.

Der naechste enge Schritt ist `TARGET-048B`: In `playthru / UNIVERSAARL-DE` wird ausschliesslich geprueft, ob `1140` bereits als Sachkonto sichtbar ist, oder es wird genau dieses eine Konto als `Bilanz`/`Buchung` angelegt und nach erneutem Oeffnen bewiesen. Item Posting Groups, Inventory Posting Setup, Artikel, Belege, Preview Posting und Posting bleiben dabei gesperrt.

## Stand nach `TARGET-048B`

`TARGET-048B` hat einen echten, aber noch nicht freigegebenen Teilfortschritt erzeugt: `1140 Waren (Bestand)` ist in `playthru / UNIVERSAARL-DE` im Kontenplan sichtbar. Die Screenshot-QA und der zeilengenaue Reopen-Text zeigen jedoch weiterhin `GuV`/`Buchung` statt `Bilanz`/`Buchung`. Damit darf `1140` noch nicht fuer Item Posting Groups oder Inventory Posting Setup verwendet werden.

Der naechste enge Schritt ist `TARGET-048C`: Nur das Feld `GuV/Bilanz` fuer Konto `1140` wird auf `Bilanz` korrigiert oder sauber blockiert. Keine anderen Sachkonten, keine Posting Groups, kein Inventory Posting Setup, keine Artikel, keine Belege, keine Preview und keine Buchung.

## Stand nach `TARGET-027`

`TARGET-027` hat keinen VAT-Setup-Fortschritt freigegeben. Der Lauf blieb read-only und versuchte Direct-Page-Routen fuer VAT Business Posting Groups, VAT Product Posting Groups und VAT Posting Setup sowie einen Such-Fallback. Die Screenshot-QA zeigte aber weiter Role Center bzw. keinen sichtbaren VAT-Seitenkontext. Deshalb bleibt VAT Setup gesperrt.

Der naechste Schritt ist `TARGET-027R`: erst die sichtbare Route zu den VAT-Setupseiten herstellen, dann ueber konkrete Gruppen, Steuersaetze und Konten entscheiden. Aus `TARGET-027` folgt keine deutsche 19-Prozent-USt-Behauptung und keine Freigabe fuer Posting Groups, Stammdaten, Preview oder Buchung.

## Stand nach `TARGET-027R`

`TARGET-027R` hat die Screenshot-Wahrheit teilweise repariert. `MwSt.-Produktbuchungsgruppen` (Page 471) und `MwSt.-Buchungsmatrix Einr.` (Page 472) sind in `playthru / UNIVERSAARL-DE` sichtbar read-only belegt. Die Bilder zeigen leere Listen/Matrixspalten und sichtbare Schreibaktionen wie `Neu` bzw. `Liste bearbeiten`, diese Aktionen wurden aber nicht geklickt.

`MwSt.-Geschaeftsbuchungsgruppen` (Page 470) bleibt gesperrt: Der aktuelle Fallback landet im Suchdialog `VAT Business Posting Groups` und zeigt keine Zielseite. Deshalb bleibt das VAT-Write-Gate weiter gesperrt. `1406` und `3806` sind nur vorbereitende Sachkonten; sie beweisen keine VAT Posting Setup Zeile, keinen Steuersatz, keine Preview, keine VAT Entries und keine Buchung.

## Stand nach `TARGET-027S`

`TARGET-027S` hat den Page-470-Blocker differenziert: Die alte TARGET-020-Direct-Route zeigt `MwSt.-Geschaeftsbuchungsgruppen` sichtbar read-only. Der neue TARGET-027S-Helper landet dagegen weiter im Role Center beziehungsweise Suchkontext und darf nicht als Page-Proof genutzt werden. Damit ist Page 470 als fachlicher Kontext vorhanden, aber der neue Helper braucht spaeter eine Paritaetskorrektur.

Fuer `TARGET-027B` gilt deshalb: Werte fuer VAT Business Posting Groups, VAT Product Posting Groups und VAT Posting Setup duerfen nur source-backed entschieden werden. Ein Setup-Write ist noch nicht freigegeben; Preview Posting, Posting, Stammdaten und Belege bleiben gesperrt.

## Stand nach `TARGET-027B`

`TARGET-027B` hat keine Business-Central-Aenderung ausgefuehrt. Der Lauf hat nur die kleinste source-backed Zielstruktur fuer den naechsten Schreibcase entschieden:

- `INLAND` als MwSt.-Geschaeftsbuchungsgruppe fuer den ersten deutschen Inlandspfad.
- `VAT19` als MwSt.-Produktbuchungsgruppe fuer normal besteuerte 19-Prozent-Umsaetze.
- `INLAND` + `VAT19` als spaetere MwSt.-Buchungsmatrix-Kombination.
- `3806 Umsatzsteuer 19 Prozent` als spaeteres Umsatzsteuerkonto.
- `1406 Abziehbare Vorsteuer 19 Prozent` als spaeteres Vorsteuerkonto.

Diese Werte sind noch keine Business-Central-Setup-Wahrheit. Sie sind die fachliche Zielentscheidung fuer den naechsten kleinen UI-Schreibcase `TARGET-027C`. Dort duerfen nur `INLAND` und `VAT19` auf den Gruppen-Seiten angelegt oder bestaetigt werden. Die eigentliche MwSt.-Buchungsmatrix-Zeile bleibt bis danach gesperrt.

## Stand nach `TARGET-027C`

`TARGET-027C` hat keinen VAT-Gruppen-Write freigegeben. Playwright blieb in `playthru / UNIVERSAARL-DE` und versuchte Page 470/471 direkt mit `dc=0` sowie den eng begrenzten Seiten-und-Aufgaben-Treffer. Die Screenshot-QA zeigte jedoch wieder Role Center bzw. keinen akzeptierten MwSt.-Listenbereich. Deshalb wurden `INLAND` und `VAT19` nicht angelegt und nicht als vorhanden bestaetigt.

Der wichtige Fortschritt ist die strengere Sicherheitsregel: `Neu` oder `Liste bearbeiten` darf bei VAT-Gruppen nur innerhalb einer sichtbar verifizierten VAT-Form/Grid-Oberflaeche geklickt werden. Generische Texte wie `Neu`, `Neue` oder `Beschreibung` reichen nicht, weil sie aus Role Center, Hintergrund-DOM oder Suchkontext stammen koennen.

Der naechste Schritt ist `TARGET-027C2`: erst die sichtbare Page-470/Page-471-Oberflaeche recovern und als Screenshot akzeptieren. Erst danach darf der INLAND/VAT19-Schreibcase wiederholt werden. Die VAT Posting Setup Matrix, Preview Posting, Posting, Stammdaten und Belege bleiben gesperrt.

## Stand nach `TARGET-027C2`

`TARGET-027C2` hat den VAT-Write weiterhin nicht freigegeben. Der Lauf blieb read-only in `playthru / UNIVERSAARL-DE` und erzeugte rejected Screenshots fuer direkte Page-470/Page-471-Routen sowie fuer die Suchfallbacks. Die wichtigste neue Erkenntnis ist kein Steuer-Setup, sondern ein Bedien-/Helper-Blocker: Der Tell-Me-Dialog ist sichtbar, aber das Suchfeld bleibt im Screenshot leer. Damit darf kein Suchergebnis und keine Zielseite behauptet werden.

Fuer den SKR04-Pfad bedeutet das: `1406` und `3806` bleiben nur vorbereitende Sachkonten. `INLAND`, `VAT19`, die 19-Prozent-Matrix, Preview Posting, VAT Entries und G/L Entries sind weiterhin nicht bewiesen. Der naechste kleine Schritt ist `TARGET-027C3-TELL-ME-INPUT-FOCUS-RECOVERY`: erst die sichtbare Suchfeld-/Fokusroute reparieren oder eine andere sichtbare Navigationsroute finden, dann den VAT-Gruppen-Write neu bewerten.

## Stand nach `TARGET-027C3` und C2-Retry

`TARGET-027C3` hat die sichtbare Business-Central-Suche wieder nutzbar gemacht: Der Suchdialog enthaelt den Begriff `MwSt.-Geschaeftsbuchungsgruppen` und zeigt den gleichnamigen Treffer in der Gruppe `Verwaltung`. Das ist Navigations-Evidence, keine USt-Einrichtung.

Der anschliessende read-only C2-Retry hat Page 471 `MwSt.-Produktbuchungsgruppen` sichtbar akzeptiert. Page 470 `MwSt.-Geschaeftsbuchungsgruppen` blieb danach noch blockiert, weil der Trefferklick noch nicht in eine akzeptierte Listenoberflaeche fuehrte.

## Stand nach `TARGET-027C4`

`TARGET-027C4` hat den Page-470-Oberflaechenblocker geloest. Der Suchdialog zeigt den Treffer `MwSt.-Geschaeftsbuchungsgruppen`; der engere Trefferklick oeffnet danach die Seite `MwSt.-Geschaeftsbuchungsgruppen` mit den Spalten `Code` und `Beschreibung`. Damit ist die Zieloberflaeche fuer den naechsten kleinen Setup-Write erreichbar.

Das ist weiterhin kein USt-Setup-Beweis. `INLAND` und `VAT19` wurden nicht angelegt, die MwSt.-Buchungsmatrix wurde nicht geaendert, und es gibt keine Preview, keine VAT Entries und keine Sachposten. Der naechste sinnvolle Schritt ist ein begrenzter Write-Retry: nur `INLAND` auf Page 470 und `VAT19` auf Page 471 mit Vorher-/Nachher-/Reopen-Proof. Die Matrixzeile und jede steuerliche 19-Prozent-Behauptung bleiben bis danach gesperrt.

## Stand nach `TARGET-027C` Retry

`TARGET-027C` hat die beiden Voraussetzungscodes in `playthru / UNIVERSAARL-DE` sichtbar bestaetigt:

- `INLAND` auf Page 470 `MwSt.-Geschaeftsbuchungsgruppen` mit Beschreibung `Inland Deutschland`.
- `VAT19` auf Page 471 `MwSt.-Produktbuchungsgruppen` mit Beschreibung `USt 19 Prozent`.

Die akzeptierte Evidenz sind die Reopen-Screenshots. Der rohe Text-Extractor hat aktive Business-Central-Gridwerte nicht zuverlaessig gelesen; deshalb ist dieser Lauf zugleich ein Playwright-Learning fuer Grid-/Screenshot-QA. Ein wiederholter Schreibversuch zeigte zwischenzeitlich `Nicht gespeichert`, weil der Zielcode offenbar bereits vorhanden war. Entscheidend ist der Reopen-Beweis: jeweils eine sichtbare Zeile bleibt auf der passenden Seite erhalten.

Weiter offen bleibt die eigentliche MwSt.-Buchungsmatrix auf Page 472. `1406` und `3806` sind vorbereitete SKR04-Sachkonten, aber noch nicht in einer `INLAND` + `VAT19` Matrixzeile verwendet. Es gibt weiterhin keine 19-Prozent-USt-Berechnung, keine Preview, keine VAT Entries und keine Sachposten.

## Stand nach `TARGET-027D/D2/D3`

`TARGET-027D` hat Page 472 `MwSt.-Buchungsmatrix Einr.` wirksam beruehrt, aber nicht fachlich erfolgreich abgeschlossen. Nach Reopen ist eine partielle Zeile `INLAND` + `VAT19` sichtbar. Die Screenshot-QA zeigt jedoch, dass die Werte aus dem Tab-/Feldfluss verrutscht sind: `19` steht als Beschreibung, `MwSt. %` ist nicht als `19` bewiesen, und die Steuerkonten `3806` und `1406` sind nicht sichtbar zugeordnet.

`TARGET-027D2` und `TARGET-027D3` haben zwei Korrekturrouten geprueft:

- Karten-/Detailroute: blockiert, weil keine eindeutig geoeffnete Karte mit Feldlabels sichtbar wurde.
- Listen-Zellkorrektur: blockiert, weil die Zielwerte nach Reopen nicht sichtbar in derselben Matrixzeile persistiert sind.

Damit ist der aktuelle USt-Stand `blocked-partial-vat-matrix-row`. `INLAND` und `VAT19` sind als Gruppen belegt, aber die MwSt.-Buchungsmatrix ist nicht fertig. Vor Stammdaten, Preview Posting oder Posting muss `TARGET-027D4` zuerst Page Inspection bzw. ein feldgebundenes Control-Mapping fuer Page 472 liefern. Erst danach darf entschieden werden, ob die partielle Zeile korrigiert oder sauber bereinigt und neu angelegt wird.

## Stand nach `TARGET-027D4`

`TARGET-027D4` hat keine Werte geschrieben. Der Lauf hat die unvollstaendige Page-472-Zeile technisch sichtbar gemacht:

- Page: `VAT Posting Setup (472, List)` / `MwSt.-Buchungsmatrix Einr.`
- Tabelle: `VAT Posting Setup (325)`
- Zeile: `INLAND` + `VAT19`
- aktueller Befund: Beschreibung `19`, `VAT % = 0`, `Sales VAT Account = (Leer)`, `Purchase VAT Account = (Leer)`

Damit ist die naechste Entscheidung enger: Entweder wird genau diese bestehende Zeile korrigiert, oder sie wird sauber bereinigt und anschliessend neu angelegt. Beides braucht Vorher-/Nachher-/Reopen-Proof. `1406` und `3806` bleiben vorbereitete SKR04-Sachkonten; sie sind noch nicht als USt-Konten in der Matrix bewiesen. Preview Posting, VAT Entries, Sachposten, Stammdaten und Belege bleiben gesperrt.

## Quellenbasis

- DATEV SKR04 Produktseite: https://www.datev.de/web/de/datev-shop/rechnungswesen/skr-04/
- SKR04-Referenz fuer Nummernpruefung: https://www.collmex.de/skr04.pdf

Die GuV-Detailkonten `4400` und `5400` sind als Starterkonten UI-seitig sichtbar bewiesen. Sie sind trotzdem noch keine vollstaendige SKR04-, Steuer- oder Posting-Readiness, weil VAT Posting Setup, Posting Groups, Belege, Preview Posting und Posten noch fehlen.
