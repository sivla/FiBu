# Workarounds und Fehlerjournal

## WK-BC-FA-060 Card-/Lines-Kontext nach `Neu` positiv nachgewiesen, aber Zielwerte bleiben gesperrt

| Feld | Wert |
|---|---|
| Status | geloest als Kontext-Preflight / kein Zielwerte-Lauf |
| Testfall | `FIXEDASSETS-060-PURCHASE-INVOICE-CARD-CONTEXT-PREFLIGHT-NO-TARGET-ENTRY` |
| Situation | Nach 058/059 war offen, ob `Neu` ueberhaupt stabil in einen aktiven Purchase-Invoice-Belegkopf mit Lines/Grid fuehrt. |
| Symptom | Vorherige Laeufe stoppten, weil Listen-/Inline-Signale noch kein sicherer Belegkontext waren. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/img/fixedassets-060-030-after-new-context-preflight.png` und `playwright/projects/fibu-book5/evidence/fixedassets-060/`. |
| Ursache | Business Central zeigt nach `Neu` mehrere UI-Schichten: Liste im Hintergrund, Kartenkopf, Lines/Grid, FactBox und Aktionsleiste. Der Test muss den Vordergrundkontext anhand mehrerer sichtbarer Signale pruefen. |
| Warum BC so reagiert | Der Webclient laesst den Listenhintergrund sichtbar und oeffnet den Beleg als Vordergrundbereich. Fuer Menschen ist das visuell erkennbar; Playwright braucht harte Kriterien. |
| Loesung | 060 akzeptiert den Kontext erst, wenn singularer `Purchase Invoice`-Titel, Pflichtfelder und Lines-/Gridspalten sichtbar sind. Zielwerte bleiben bis zu einem eigenen 061-Gate gesperrt. |
| Buchwirkung | Kapitel 21 kann diesen Screenshot als Preflight-Bild fuer den Aufbau einer Einkaufsrechnung nutzen. Es darf nicht als Anlagenkauf-, Preview- oder Buchungsbild verwendet werden. |
| Kuenftige Regel | Erst nach einem eigenen Gate duerfen `K30000`, `Vendor Invoice No.`, Zeilentyp `Fixed Asset` und `FA-CNC-01` in einem neuen Lauf getestet werden. |

## WK-BC-FA-059 Listen-/Inline-Kontext nach `Neu` spezifisch stoppen

| Feld | Wert |
|---|---|
| Status | geloest als Guard-Verfeinerung / kein BC-Lauf |
| Testfall | `FIXEDASSETS-059-PURCHASE-INVOICE-FIELD-MAPPING-HELPER-REFINEMENT-OR-MANUAL-PATH` |
| Situation | `FIXEDASSETS-058` stoppte nach `Neu`, weil kein stabiler Purchase-Invoice-Card-/Lines-Kontext bewiesen war. |
| Symptom | Der fokussierte Seitentext enthaelt `Purchase Invoices`, `Neu`, `Post`, `Invoice`, `Vendor Invoice No.` und Listen-/Inline-Signale, aber keine sichere aktive Belegkarte mit Zielzeilenkontext. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/evidence/fixedassets-059/`; kein neuer Screenshot, weil 059 vorhandene 058-Evidence maschinenlesbar neu klassifiziert. |
| Ursache | Business Central kann nach `Neu` weiterhin Listen-/Inline-Kontext, Hintergrundtexte oder noch nicht eindeutig aktive Belegflaechen zeigen. Playwright darf daraus keine sichere Werteingabe ableiten. |
| Warum BC so reagiert | Der Webclient kombiniert Liste, Aktion, Beleganfang und Shell. Ein Mensch erkennt oft visuell, ob er wirklich im Belegkopf steht; der Test braucht dafuer harte sichtbare Signale. |
| Loesung | `purchase-invoice-guards.ts` klassifiziert diesen Zustand jetzt als `blocked-list-or-inline-row-context`. Zielwerte werden erst erlaubt, wenn aktive Card, Pflichtfelder und Lines/Grid als Vordergrundkontext bewiesen sind. |
| Buchwirkung | Kapitel 21 bekommt noch kein Anlagenkauf-Bild. Das Debugging-/Nachweiskapitel kann erklaeren, warum ein Nach-`Neu`-Bild nur dann zaehlt, wenn der fachliche Zielbereich sichtbar ist. |
| Kuenftige Regel | Naechster Lauf `FIXEDASSETS-060`: Card-/Lines-Kontext ohne Zielwerteingabe pruefen; kein `K30000`, kein `FA-CNC-01`, keine Preview, kein Post. |

## WK-BC-FA-058 `Neu` geklickt, aber kein stabiler Purchase-Invoice-Card-Kontext

| Feld | Wert |
|---|---|
| Status | Labor-Lernfall / blockiert vor Werteingabe |
| Testfall | `FIXEDASSETS-058-K30000-FA-CNC-01-PURCHASE-INVOICE-FIELD-MAPPING-RETRY-NO-POSTING` |
| Situation | Nach dem 055-Fehler durfte genau ein neuer guarded UI-first Retry fuer `K30000` und `FA-CNC-01` laufen. |
| Symptom | `Purchase Invoices` Page `9308` wurde geoeffnet und der gescopte `Neu`-Kandidat wurde geklickt, aber der Guard erkannte danach keinen stabilen `Purchase Invoice`-Card-/Zeilenkontext. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/evidence/fixedassets-058/`; keine Screenshots, weil der Lauf vor Zielwerteingabe stoppte. |
| Ursache | Der Aktionsklick allein genuegt als Automatisierungsnachweis nicht. Business Central kann Fokus, Listen-/Card-Kontext und Hintergrundtexte so darstellen, dass der aktive Belegkontext erst separat nachgewiesen werden muss. |
| Warum BC so reagiert | Aus Anwendersicht kann ein Beleg ueber `Neu` entstehen; fuer Playwright/Evidence muss aber maschinenlesbar und visuell klar sein, ob wirklich die Vordergrundkarte beziehungsweise der Zeilenbereich aktiv ist. |
| Loesung oder Laborgrenze | Keine Zielwerte eingeben, keinen Draft erzeugen, keine Preview und kein Posting. Naechster Schritt ist ein Helper-/Manual-Path-Refinement, das den aktiven Card-/Lines-Kontext nach `Neu` beweist. |
| Buchwirkung | Kapitel 21 bekommt keine neue Anlagenkauf-Abbildung. Das Debugging-/Nachweiskapitel kann diesen Fall nutzen: Ein Klickpfad braucht nicht nur die Aktion `Neu`, sondern den sichtbaren Zielzustand danach. |
| Kuenftige Regel | Nach `Neu` immer eine harte Nachbedingung pruefen: `Purchase Invoice`-Card, relevante Pflichtfelder und Lines/Grid muessen sichtbar sein, bevor Zielwerte eingegeben werden. |

## WK-BC-FA-055 Falscher Vendor-Card-Kontext beim Purchase-Invoice-Feldmapping

| Feld | Wert |
|---|---|
| Status | geloest als Cleanup, Feldmapping bleibt blockiert |
| Testfall | `FIXEDASSETS-055-K30000-FA-CNC-01-PURCHASE-INVOICE-FIELD-MAPPING-NO-POSTING` |
| Situation | `K30000` sollte im Purchase-Invoice-Kopf und `FA-CNC-01` nur im richtigen Anlagenzeilenkontext sichtbar getestet werden. |
| Symptom | Der Lauf blieb nicht stabil im Belegzeilenkontext. Sichtbar wurden ein Vendor-Registrierungsdialog und danach `Vendor Card - V00040 - FA-CNC-01`; ausserdem entstand der Purchase-Invoice-Draft `107222`. |
| Sichtbarer Beleg | Rejected-Bilder `fixedassets-055-030-header-k30000-visible.png`, `fixedassets-055-050-line-fa-cnc-01-visible.png`; Cleanup-Bilder `fixedassets-055-071-accidental-vendor-after-cleanup.png`, `fixedassets-055-081-accidental-purchase-invoice-after-cleanup.png`; Evidence `playwright/projects/fibu-book5/evidence/fixedassets-055/`. |
| Ursache | Die Zeilen-/Lookup-Bedienung war nicht ausreichend auf den Purchase-Invoice-Zeilenbereich gescopt. Zielcode-Sichtbarkeit allein war zu schwach, weil `FA-CNC-01` in einer falschen Vendor Card sichtbar wurde. |
| Warum BC so reagiert | Business Central oeffnet bei unklaren oder nicht registrierten Eingaben Dialoge und Karten fuer verwandte Stammdaten. Das ist fachlich plausibel, aber fuer eine Klickanleitung gefaehrlich: Der sichtbare Code kann dann zum falschen Objekt gehoeren. |
| Loesung | `V00040` und `107222` wurden ueber die UI geloescht und in gefilterten Nachweisen als nicht mehr sichtbar belegt. Der 055-Test wurde verschaerft: Vendor-Registrierungsdialoge und Vendor-Card-Popups sind Stop-/Rejected-Kriterien. |
| Buchwirkung | Kapitel 21 darf 055 nicht als Anlagenkauf-Bild verwenden. Das Debugging-/Nachweiskapitel sollte diesen Fall erklaeren: Ein Screenshot muss den richtigen fachlichen Kontext zeigen, nicht nur irgendeinen Zielcode. |
| Kuenftige Regel | Vor einem neuen Field-Mapping-Lauf braucht es `FIXEDASSETS-056`: sicheren Zeilenkontext-Helper bauen, Zeilentyp und Anlagen-Nr. im selben Gridbereich pruefen, und falsche Popups sofort abbrechen. |

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

## WK-BC-FA-049 Personalisieren geoeffnet, aber Feldliste nicht sichtbar

| Feld | Wert |
|---|---|
| Status | Labor-Lernfall / kein Setup-Fix |
| Testfall | `FIXEDASSETS-049-K30000-VENDOR-PERSONALIZE-FIELD-AVAILABILITY-READONLY` |
| Situation | Fuer `K30000` sollte read-only geprueft werden, ob `Vendor Posting Group`, `Gen. Bus. Posting Group`, `Currency Code` oder `VAT Bus. Posting Group` ueber Personalisieren sichtbar gemacht werden koennen. |
| Symptom | BC oeffnete `Wird personalisiert: Vendor Card`, aber der Lauf bekam keine stabile `Add field`-/Feldlistenansicht und kein Screenshot zeigt die kritischen Feldcaptions. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/evidence/fixedassets-049/`; Screenshots `playwright/projects/fibu-book5/img/fixedassets-049-*`. |
| Ursache | Personalisieren ist ein Oberflaechenmodus. Der Modus allein beweist nur, dass die Page personalisierbar ist; er beweist nicht, dass ein bestimmtes Feld auf der Page verfuegbar, eingeblendet oder fachlich gefuellt ist. |
| Warum BC so reagiert | Business Central trennt Page-Sichtbarkeit, Nutzer-/Profil-Personalisierung, Page-Design und Tabellen-/Posting-Logik. Eine Feldverfuegbarkeit muss visuell oder technisch konkret am Feld nachgewiesen werden. |
| Loesung oder Laborgrenze | Keine Einkaufsrechnung und kein Anlagenzugang. Naechster Schritt ist `FIXEDASSETS-050`: Page Inspection, manuelle Personalisieren-Diagnose oder Setup-Gate-Entscheidung fuer die K30000-Defaults. |
| Buchwirkung | Kapitel 21 darf die Personalisieren-Bilder nur als Debug-/Diagnosebilder verwenden. Kapitel 37/38 sollte erklaeren, dass ein Personalize-Screenshot erst dann Buch-Evidence ist, wenn der konkrete Feldname oder Wert sichtbar ist. |
| Kuenftige Regel | Bei fehlenden Feldern nicht den Personalize-Modus selbst als Feldbeweis werten. Screenshot-QA muss pruefen, ob genau das behauptete Feld oder der behauptete Wert lesbar ist. |

## WK-BC-FA-038 Vendor-Auto-Number-Draft bei K30000

| Feld | Wert |
|---|---|
| Status | geloest / Labor-Lernfall |
| Testfall | `FIXEDASSETS-038-K30000-VENDOR-SETUP-FIT` |
| Situation | `K30000` sollte UI-first als Kreditor fuer den spaeteren Anlagenprozess vorbereitet werden. |
| Symptom | Nach Vendor-Template-Auswahl erzeugte BC zunaechst Auto-Number-Drafts wie `V00020`/`V00030`; direkte DOM-Wertsetzung war kein belastbarer sichtbarer BC-Save-Nachweis. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/evidence/fixedassets-038/`; Screenshots `playwright/projects/fibu-book5/img/fixedassets-038-*`. |
| Ursache | Nummernserien und Vorlagen koennen beim Erstellen einer Kreditorenkarte sofort einen Datensatz anlegen. BC-Karten muessen ueber echte UI-Eingaben und relevante BC-Dialoge bedient werden. |
| Warum BC so reagiert | Business Central behandelt `No.` als identitaetsbildendes Feld; eine spaetere Aenderung kann verbundene Datensaetze betreffen und braucht daher eine Bestaetigung. |
| Loesung | Reale Playwright-Eingaben auf der Vendor Card verwenden, den Dialog zur Aenderung verbundener Datensaetze bestaetigen, danach die Vendors-Liste mit Filter `No. = K30000` neu oeffnen. Den leeren Draft `V00020` nur nach sichtbarem Nachweis per UI loeschen. |
| Pruefung nach Korrektur | `K30000 Zollspedition Nord GmbH` ist sichtbar; `V00020` zeigt nach Cleanup einen leeren Nachfilter. Keine Einkaufsrechnung, kein Zugang, keine AfA, keine Buchung. |
| Buchwirkung | Kapitel 21 muss Nummernserie, Vorlage, Zielnummer-Kontrolle und Draft-Cleanup als Anfaengerfehler erklaeren. |
| Kuenftige Regel | Bei BC-Karten keine DOM-Wertsetzung als Erfolg werten. Zielstammdaten zaehlen erst nach sichtbarem Neuoeffnen/Filter. |

## WK-BC-FA-029 Breite Caption-Suche fuellt falsche Anlagenkartenfelder

| Feld | Wert |
|---|---|
| Status | technisch im Test verbessert; fachlicher Zielstammsatz bleibt blockiert |
| Testfall | `FIXEDASSETS-029-FA-CNC-01-CONTROLLED-ASSET-SAVE` |
| Situation | Der kontrollierte Save-Lauf sollte auf der `Fixed Asset Card` `FA-CNC-01`, Beschreibung, Klasse/Unterklasse, `HGB`, `MACHINES` und Nutzungsdauer setzen. |
| Symptom | Visuell war die Anlagenkarte offen, aber die erste Implementierung schrieb mehrere Zielwerte in falsche Eingabefelder. Danach zeigte der Rerun `FA-CNC-01` bereits in der Liste und stoppte korrekt ohne Ueberschreiben. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/img/fixedassets-029-010-target-already-visible.png`; Evidence `playwright/projects/fibu-book5/evidence/fixedassets-029/`. |
| Ursache | Business Central haelt auf Karten viele Feldcaptions und Controls in gemeinsamen DOM-Bereichen. Eine Suche ueber Parent-/Ancestor-Text findet deshalb zwar die gesuchte Caption irgendwo im Umfeld, aber nicht zwingend das editierbare Control derselben sichtbaren Kartenzeile. |
| Warum BC so reagiert | Die Anwenderoberflaeche ist als Karte eindeutig, der DOM-Kontext enthaelt aber FastTabs, Hintergrundliste, Infotexte, Lookup-Buttons und mehrere benachbarte Felder. Playwright muss daher enger scopen als ein Mensch visuell lesen wuerde. |
| Loesung | `FIXEDASSETS-029` nutzt jetzt zeilen-/positionsbezogenes Card-Filling: Eine Caption wird nur mit einem sichtbaren editierbaren Control derselben Kartenzeile verbunden. Bestehende Zielcodes werden nicht ueberschrieben. |
| Buchwirkung | Kapitel 21 darf `FA-CNC-01` noch nicht als fertigen Stammsatz zeigen. Kapitel 37/38 sollten diesen Fall als Debugging- und Screenshot-QA-Regel nutzen: Ein Bild oder Locator muss genau den behaupteten fachlichen Zustand zeigen. |
| Kuenftige Regel | Bei BC-Cards keine breite Caption-/Ancestor-Suche fuer Werteingabe verwenden. Erst Page/Surface/Zeile beweisen, dann Wert setzen, danach sichtbare Kartenwerte pruefen. |

## WK-BC-FA-029B Bestehender Anlagen-Code ist keine fachlich vollstaendige Anlage

| Feld | Wert |
|---|---|
| Status | Blocker read-only bewiesen; Korrektur-Gate offen |
| Testfall | `FIXEDASSETS-029-EXISTING-ASSET-READONLY-VERIFY` |
| Situation | Nach dem gestoppten Save-Lauf wurde `FA-CNC-01` bewusst read-only aus der gefilterten `Fixed Assets`-Liste geoeffnet, um zu klaeren, ob der vorhandene Zielcode fachlich nutzbar ist. |
| Symptom | Die Karte zeigt `No. = FA-CNC-01`, aber Beschreibung, `FA Class Code`, `FA Subclass Code`, `Depreciation Book Code`, `Posting Group`, AfA-Daten und `Book Value` sind leer beziehungsweise `0,00`. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/img/fixedassets-029-existing-asset-readonly-010-filtered-list.png`, `playwright/projects/fibu-book5/img/fixedassets-029-existing-asset-readonly-020-existing-card-readonly.png`; Evidence `playwright/projects/fibu-book5/evidence/fixedassets-029-existing-asset-readonly/`. |
| Ursache | Irgendwann existiert der Nummern-/Stammdatensatz `FA-CNC-01`, aber die fachlichen Pflicht-/Zielwerte des Buchfalls wurden nicht vollstaendig gesetzt oder nicht validiert. |
| Warum BC so reagiert | Business Central kann einen Anlagenstammsatz mit Nummer speichern, ohne dass daraus schon ein buchungsfaehiger Zielstammsatz fuer Zugang, AfA und Postenspur wird. Die Nummer ist Identitaet, nicht fachlicher Setup-Fit. |
| Loesung oder Laborgrenze | Nicht weiter mit `K30000`, Einkaufsrechnung, Zugang oder AfA. `FIXEDASSETS-030` entscheidet: vorhandene Karte `FA-CNC-01` UI-first korrigieren; keinen neuen Zielcode definieren, solange die Korrektur nicht mit Evidence blockiert ist. |
| Pruefung nach Korrektur | Ein spaeterer Lauf muss in der normalen Kartenansicht Zielnummer, Beschreibung, Klasse/Unterklasse, `HGB`, `MACHINES`, AfA-Daten und erwarteten Buchwert-/Zugangsstatus sichtbar nachweisen, bevor ein Posting-Gate geoeffnet wird. |
| Buchwirkung | Kapitel 21 braucht diesen Lernfall: Ein Code in der Liste ist nur ein Identifikator. Fuer eine bebilderte Anleitung muss das Bild die fachlichen Felder zeigen, die der Leser pruefen soll. |
| Kuenftige Regel | Vor Folgeprozessen immer Kartenwerte read-only klassifizieren. Ein Screenshot ist nur Buchkandidat, wenn er das behauptete Lernziel sichtbar zeigt; sonst ist er Error-/Rejected-/Debug-Evidence. |

## WK-BC-UI-002 Personalisieren als Diagnose, wenn Felder, Spalten oder Aktionen fehlen

| Feld | Wert |
|---|---|
| Status | als Projektregel aufgenommen; noch kein konkreter BC-Lauf in `RM-DEMO` |
| Situation | In Klickanleitungen, Ledger-Listen, Verkaufs-/Einkaufszeilen, Journalzeilen oder Setup-Seiten kann ein erwartetes Feld, eine Spalte oder Aktion fehlen. |
| Symptom | Der Leser oder Testlauf findet das erwartete UI-Element nicht, obwohl Buchziel oder fachlicher Prozess es benoetigt. |
| Sichtbarer Beleg | Quellenabgleich in `MICROSOFT-DOC-VALIDATION.md`; Pattern in `BC-PLAYWRIGHT-PATTERNS.md`; Governance-Evidence `playwright/projects/fibu-book5/evidence/governance-014/`. |
| Ursache | Business Central zeigt Seiten je nach Page-Design, Rolle, Profilanpassung, Nutzer-Personalisierung, Ansicht, Sprache und Berechtigungen unterschiedlich. Ein Feld kann vorhanden, aber ausgeblendet sein; eine Aktion kann im Menue oder durch Einstellungen sichtbar werden. |
| Warum BC so reagiert | Personalisierung und Profilanpassung sind bewusste BC-Mechanismen: Nutzer und Administratoren koennen Oberflaechen vereinfachen oder erweitern, ohne die zugrunde liegende Tabelle oder Buchungslogik zu aendern. |
| Loesung | Bei fehlenden UI-Elementen vor einer Buchkorrektur pruefen: `Personalisieren`, Spalten/Felder hinzufuegen, Ansichten, Seiteneinstellungen, Profilanpassung und Rolle/Berechtigung. Wenn das Element einblendbar ist, als Nutzer-/Profilzustand markieren. Wenn es nicht verfuegbar ist, als Page-, Extension-, Setup- oder Berechtigungsgrenze dokumentieren. |
| Buchwirkung | Klickanleitungen muessen erklaeren, ob ein Screenshot die Standardansicht oder eine personalisierte/profilangepasste Ansicht zeigt. Ein Debug-Bild im Personalisierungsmodus ist nuetzlich, aber kein finales Buchbild fuer einen Prozessschritt. |
| Kuenftige Regel | Wenn ein Feld, eine Spalte oder Aktion fehlt, nicht sofort von falschem Buchtext ausgehen. Erst UI-Sichtbarkeit pruefen, dann fachliche Ursache. Personalisieren beweist Sichtbarkeit, nicht Tabellen-, Posting- oder Steuerlogik. |

## WK-BC-UI-003 Page Inspection als technische Diagnose fuer Page, Tabelle, Felder und Extensions

| Feld | Wert |
|---|---|
| Status | als Projektregel aufgenommen; noch kein konkreter BC-Lauf in `RM-DEMO` |
| Situation | Ein Klickpfad landet auf einer Seite, aber Seitenname, Page-ID, Tabellenbezug, Feldherkunft, Filter oder Extension-Einfluss sind unklar. |
| Symptom | Der sichtbare Bildschirm sieht fachlich richtig aus, aber Playwright-Locators, Buchtext oder Screenshot-Erklaerung sind unsicher: falscher ListPart, falsche Page, anderer Tabellenkontext oder nicht erkannte Erweiterung. |
| Sichtbarer Beleg | Quellenabgleich in `MICROSOFT-DOC-VALIDATION.md`; Pattern in `BC-PLAYWRIGHT-PATTERNS.md`; Governance-Evidence `playwright/projects/fibu-book5/evidence/governance-015/`. |
| Ursache | Business Central-Seiten koennen Karten, Listen, Parts, FactBoxes, Dialoge und Extensions kombinieren. Die sichtbare Ueberschrift allein reicht nicht immer, um Page, Tabelle und Feldquelle sicher zu bestimmen. |
| Warum BC so reagiert | BC trennt Page-Objekte, Source Tables, Felddefinitionen, Filter und Erweiterungen. Page Inspection macht diesen technischen Kontext sichtbar, ohne die fachliche Buchungslogik zu ersetzen. |
| Loesung | Bei technischem Zweifel `Ctrl+Alt+F1` nutzen. Falls die Tastenkombination abgefangen wird, Help & Support / `Inspect pages and data` oder Suche nach `Page Inspection` / `Seitenpruefung` versuchen. Page Name, Page ID, Source Table, Feld/Filter und Extension-Hinweise als Evidence notieren. |
| Buchwirkung | Das Buch sollte Page Inspection als Diagnosekapitel erklaeren: Es hilft Autoren und Consultants, Klickpfade technisch sauber zu dokumentieren. Finale Buchbilder bleiben normale Anwendersicht, Page-Inspection-Bilder sind Debug-/Evidence-Bilder. |
| Kuenftige Regel | Wenn ein Locator, Feld oder Page-Kontext unklar ist, Page Inspection vor groesserem Refactoring oder falscher Buchkorrektur nutzen. Page Inspection beweist technischen Kontext, nicht automatisch fachliche Richtigkeit. |

## WK-BC-FA-023 Hintergrundliste verfaelscht ungescopte Karten-Locators

| Feld | Wert |
|---|---|
| Status | geloest als Diagnosebefund; Speicherfreigabe bleibt offen |
| Testfall | `FIXEDASSETS-023-FA-CNC-01-CARD-TECHNICAL-DIAGNOSIS` |
| Situation | Die leere Anlagenkarte wurde ueber die Fixed-Assets-Liste geoeffnet und fuer `FA-CNC-01` weiter no-save diagnostiziert. |
| Symptom | Visuell ist die `Fixed Asset Card` im Vordergrund; ungescopte DOM-/Label-Suchen koennen aber weiterhin Spalten- oder Headertexte aus der dahinterliegenden Fixed-Assets-Liste finden. Dadurch wirken Feldnachweise technisch plausibel, obwohl sie nicht sicher zur aktiven Karten-Control-Zeile gehoeren. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/img/fixedassets-023-020-card-context-after-show-more.png` zeigt die leere Karte mit relevanten Controls; `playwright/projects/fibu-book5/img/fixedassets-023-040-page-inspection-diagnosis.png` zeigt Page Inspection mit `Fixed Asset Card (5600, Document)` und `Fixed Asset (5600)`. |
| Ursache | Business Central laesst Listen-/Seitenkontext im DOM, waehrend eine Karte oder ein Detailkontext im Vordergrund angezeigt wird. Playwright findet ohne engen Container-Scope sichtbare oder halb sichtbare Texte aus dem falschen Oberflaechenbereich. |
| Warum BC so reagiert | BC Pages koennen Liste, Karte, FactBox, FastTabs, Dialoge und Shell gleichzeitig halten. Die Anwendersicht ist eindeutig, aber der DOM-Kontext ist groesser als der aktuell fachlich relevante Eingabebereich. |
| Loesung | Naechster Helper muss auf aktive Vordergrundkarte, sichtbare FastTab-Region oder editierbare Control-Zeile scopen. Page Inspection darf den Page-/Tabellenkontext bestaetigen, ersetzt aber keine sichtbare Werteingabe und keinen Screenshot in normaler Anwendersicht. |
| Buchwirkung | Kapitel 21 und das Debugging-Kapitel muessen erklaeren: Technischer Seitenbezug ist ein Diagnoseanker; ein Stammdatenscreenshot zaehlt erst, wenn Zielcode und Werte im richtigen Anwenderkontext sichtbar sind. |
| Kuenftige Regel | Keine Speicherfreigabe fuer `FA-CNC-01`, solange `HGB`, `MACHINES`, Klasse/Unterklasse und AfA-Daten nicht auf der aktiven Anlagenkarte sichtbar/setzbar nachgewiesen sind. |

## WK-BC-BUG-001 Fehler zuerst klassifizieren, dann loesen

| Feld | Wert |
|---|---|
| Status | als Projektregel und Playbook aufgenommen; noch kein neuer konkreter Fehlerlauf |
| Situation | BC-Fehler koennen aus UI, Page/Tabelle, Berechtigung, Stammdaten, Prozessstatus, Posting Setup, Extension, Daten/Filter, Integration oder Performance entstehen. |
| Symptom | Ein Test oder Anwender meldet: Feld fehlt, Aktion funktioniert nicht, Beleg laesst sich nicht buchen, User sieht Daten nicht, Seite ist langsam oder eine Integration scheitert. |
| Sichtbarer Beleg | `BC-BUGFIXING-PLAYBOOK.md`, Quellenabgleich in `MICROSOFT-DOC-VALIDATION.md`, Governance-Evidence `playwright/projects/fibu-book5/evidence/governance-016/`. |
| Ursache | Ohne Fehlerklassifikation wird zu schnell an der falschen Stelle repariert: Buchtext, Playwright-Locator, Rechte, Stammdaten oder Setup werden geaendert, obwohl eine andere Ebene ursächlich ist. |
| Warum BC so reagiert | Business Central verbindet UI, Rollen/Profile, Tabellen, Berechtigungen, Stammdaten, Posting-Matrizen, Dimensionen, Extensions, Hintergrundjobs, Integrationen und Telemetry. Ein sichtbarer Fehler ist oft nur die Oberflaeche einer tieferen Kombination. |
| Loesung | Vor Fix: Fehler aufnehmen, reproduzieren, Page Inspection/Personalisierung nutzen, Kopf-/Zeilenwerte und Setup pruefen, Berechtigungen und Datenfilter pruefen, bei Bedarf Event Recorder/Telemetry/Job Queue/Integration analysieren. |
| Buchwirkung | Das Buch bekommt eine systematische Fehleranalyse-Denkweise. Fehlerbilder werden als Lernfaelle dokumentiert, statt nur als Testabbruch oder Workaround behandelt zu werden. |
| Kuenftige Regel | Kein groesserer Fix ohne Fehlerklasse. Bei Buchungsfehlern immer Kopf plus Zeile plus Posting Setup pruefen; bei UI-Fehlern Sichtbarkeit/Page-Kontext pruefen; bei Rechte/Extension/Integration/Performance nur mit passendem Diagnosewerkzeug weitergehen. |

## WK-BC-SHOT-001 Screenshot muss den behaupteten fachlichen Zielzustand sichtbar zeigen

| Feld | Wert |
|---|---|
| Status | geloest als QA-Regel nach `FIXEDASSETS-012`; fuer kuenftige Screenshots zwingend |
| Testfall | `FIXEDASSETS-012` |
| Situation | Der Formular-Preflight oeffnete leere Karten fuer FA Posting Groups, Depreciation Books und Fixed Assets sowie den Vendor-Template-Dialog. |
| Symptom | Die Screenshots waren technisch sauber, zeigten aber nicht den behaupteten fachlichen Zielzustand: hier also nicht die Zielcodes `MACHINES`, `HGB`, `FA-CNC-01` oder `K30000`. Sie duerfen deshalb nicht als Buchbilder fuer fertige Zielstammdaten gelten. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/img/fixedassets-012-010-fa-posting-groups-new-preflight.png`, `playwright/projects/fibu-book5/img/fixedassets-012-020-depreciation-books-new-preflight.png`, `playwright/projects/fibu-book5/img/fixedassets-012-030-fixed-assets-new-preflight.png`, `playwright/projects/fibu-book5/img/fixedassets-012-040-vendors-new-preflight.png`; QA-Korrektur in `SCREENSHOT-QA.md`. |
| Ursache | Der Lauf belegte den Formular-/Template-Kontext, nicht den fachlichen Zielzustand. Ein leerer Kartenkontext ist fachlich nuetzlich, aber er beweist keinen angelegten Code und keinen fertigen Stammdatensatz. |
| Warum BC so reagiert | Business Central trennt Liste, neue Karte, Vorlagenauswahl, Pflichtfelder und Speichern. Vor dem Speichern ist ein Code nur dann Belegbestandteil, wenn er im Feld sichtbar eingegeben oder als vorhandener Datensatz in der Liste/Karte sichtbar ist. |
| Loesung | Screenshot-Metadaten und Coverage wurden auf `form-preflight-only-target-code-not-visible` beziehungsweise Labor-Formular-Preflight korrigiert. Der Test schreibt diese Grenze kuenftig direkt in `bookUse` und `knownLimitations`. |
| Buchwirkung | Kapitel 21 darf die Bilder nur als Lernbilder fuer Pflichtfelder, Vorlagen und sicheren Abbruch nutzen. Buchbilder fuer Zielstammdaten brauchen spaeter den jeweils behaupteten Zustand sichtbar im Bild, zum Beispiel Code, Name, Pflichtfelder, Buchungsgruppe oder Status. |
| Kuenftige Regel | Kein Screenshot wird als Zielwert-, Buchungs-, Reporting- oder Buchbildnachweis eingestuft, wenn das, was der Leser sehen soll, nicht im Bild sichtbar ist. Das kann je nach Schritt Code, Name, Betrag, Waehrung, Steuer, Status, Buchungsoption, Postenart, Konto, Dimension, Filter, Fehlermeldung, Reportzeile oder Dialogauswahl sein. Page-Text, JSON oder ein geoeffnetes leeres Formular koennen Evidence sein, ersetzen aber keine visuelle Buchfreigabe. |

## WK-BC-FA-022 Falscher Lookup-Kontext darf nicht als Wertnachweis zaehlen

| Feld | Wert |
|---|---|
| Status | geloest als Rejected-QA-/Locator-Regel nach `FIXEDASSETS-022`; Folgearbeit ist technische Diagnose, kein Speicherlauf |
| Testfall | `FIXEDASSETS-022` |
| Situation | Auf der leeren `Fixed Asset Card` sollten no-save die Lookups fuer `FA Class Code`, `FA Subclass Code`, `Depreciation Book Code` und `Posting Group` geprueft werden. |
| Symptom | Ein erster optimistischer Locator-Versuch erzeugte Bilder, deren Seitentext Zielwerte vermuten liess. Die visuelle Pruefung zeigte aber einen Nummernserien-Dialog, nicht den behaupteten FA-Class-/Subclass-Lookup. |
| Sichtbarer Beleg | Korrigierte Evidence unter `playwright/projects/fibu-book5/evidence/fixedassets-022/`; retained Screenshot nur `playwright/projects/fibu-book5/img/fixedassets-022-020-empty-card-context.png`. |
| Ursache | Der Locator hatte das Feldlabel ueber zu breite Umgebungstexte gesucht und dadurch faktisch das falsche Control beziehungsweise den falschen Dialog bedient. Business Central-Seitentext kann im Hintergrund weiterhin andere Feldnamen enthalten. |
| Warum BC so reagiert | Business Central-Karten enthalten viele Labels, Controls, AssistEdit-/Lookup-Buttons und Hintergrundlisten gleichzeitig. Ein Seitentexttreffer beweist nicht, dass der sichtbare Dialog fachlich zum Ziel-Feld gehoert. |
| Loesung | Artefakte vor jedem Lauf fuer den Testfall bereinigen; nur Screenshots behalten, die den behaupteten Code im richtigen Kontext zeigen. Der korrigierte Lauf behaelt nur das leere Kartenkontextbild und dokumentiert Lookup-Werte als nicht belegt. |
| Buchwirkung | Kapitel 21 bekommt keinen Speicherlauf fuer `FA-CNC-01`. Die Anleitung muss vor dem Speichern technische Felder/Lookups sicher klaeren; dieser Fall gehoert auch ins spaetere Kapitel zu BC-Debugging und technischer Nachweisfuehrung. |
| Kuenftige Regel | Bei Lookup-/AssistEdit-Screenshots immer visuell pruefen: Dialogtitel, Spalten, Code und fachlicher Kontext muessen zur Behauptung passen. Page Inspection oder Personalisieren nutzen, wenn sichtbare Labels nicht robust anklickbar sind. |

## WK-BC-FA-010 Tell-Me-Treffer ist sichtbar, aber nicht per Role-Selector klickbar

| Feld | Wert |
|---|---|
| Status | geloest im Test `FIXEDASSETS-010`; Regel fuer kuenftige Setup-Preflights behalten |
| Testfall | `FIXEDASSETS-010` |
| Situation | Der neue Setup-Preflight sollte `FA Posting Groups` ueber Tell-Me oeffnen, um den Anlagenbuchungsgruppen-Kontext read-only in breiter Layoutansicht zu sichern. |
| Symptom | Der erste Testlauf fand den sichtbaren Text `FA Posting Groups` nur als `DIV`; der Role-/Text-Klick oeffnete den Kontext nicht belastbar. Der Lauf war technisch gruen, aber fachlich war `contextVisible = false` fuer FA Posting Groups. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/evidence/fixedassets-010/FIXEDASSETS-010-result.json` aus dem Nachlauf zeigt jetzt `contextVisible = true` und Klickmethode `dom-click`; Screenshot `playwright/projects/fibu-book5/img/fixedassets-010-010-fa-posting-groups-preflight.png`. |
| Ursache | Business Centrals Tell-Me-Ergebnisse koennen als verschachtelte sichtbare Elemente erscheinen, deren klickbarer Vorfahr nicht direkt als sauberer `button`, `link`, `menuitem` oder `option` per Playwright-Rolle erreichbar ist. |
| Warum BC so reagiert | Die Business-Central-Webshell rendert Suchtreffer, Role-Center und Aktionsbereiche dynamisch. Sichtbarer Text allein beweist nicht, dass der naive Locator auf dem tatsaechlichen Klickziel sitzt. |
| Loesung | Der Test nutzt fuer genau diesen Treffer den bereits im Projekt bewaehrten DOM-Fallback: passendes sichtbares Element finden, den naechsten klickbaren Vorfahren waehlen und danach den Zielkontext pruefen. Kein blinder Enter-Fallback und kein ungescopter `New/Neu`-Klick. |
| Pruefung nach Korrektur | Der Nachlauf `npm run fibu:fixedassets:setup-preflight` ist erfolgreich. `FA Posting Groups`, `Depreciation Books`, `Fixed Assets` und `Vendors` sind als Kontexte sichtbar; `MACHINES`, `HGB`, `FA-CNC-01` und `K30000` bleiben nicht sichtbar; kein Setup und keine Buchung. |
| Buchwirkung | Kapitel 21 kann `FA Posting Groups` als erreichbaren Setup-Kontext zeigen, muss aber weiterhin erklaeren: Sichtbarer Setup-Ort ist noch kein Setup-Fit. |
| Kuenftige Regel | Bei Tell-Me nicht blind Enter druecken. Erst Trefferkandidaten sammeln, gezielt klicken, danach den Zielseitenkontext pruefen. DOM-Fallback nur fuer den konkreten Treffer und immer mit Nachpruefung des Seitentextes. |

## WK-BC-FA-016 `New/Neu` kann auf Karten nur als Icon-Titel sichtbar sein

| Feld | Wert |
|---|---|
| Status | geloest im Test `FIXEDASSETS-016`; Regel fuer kuenftige Setup-Fits behalten |
| Testfall | `FIXEDASSETS-016` |
| Situation | `MACHINES` sollte auf der `FA Posting Group Card` UI-first als CRONUS-Laboralias von `EQUIPMENT` angelegt werden. |
| Symptom | Der erste Lauf fand keinen `New/Neu`-Kandidaten, obwohl die Seite die Aktion anzeigt. Im Playwright-Snapshot war der relevante Button nur als Icon mit Titel `Erstellen Sie einen neuen Eintrag.` sichtbar, nicht als Text `Neu`. |
| Sichtbarer Beleg | Fehlkontext im lokalen Playwright-Error-Snapshot; geloester Lauf mit `playwright/projects/fibu-book5/evidence/fixedassets-016/014-scoped-new-candidates.json` und Nachherbild `playwright/projects/fibu-book5/img/fixedassets-016-020-fa-posting-groups-after-machines.png`. |
| Ursache | Business Central rendert Kartenaktionen teilweise als Icon-Buttons mit Titel/Tooltip. Ein Helper, der nur sichtbaren Text oder `aria-label` `New/Neu` akzeptiert, uebersieht diese Aktion. |
| Warum BC so reagiert | Karten- und Aktionsleisten sparen Platz und zeigen oft nur Symbole. Der fachliche Kontext entsteht aus Karte, Titel, Tooltip und Nachherzustand, nicht nur aus dem sichtbaren Buttontext. |
| Loesung | Der `FIXEDASSETS-016`-Helper bewertet `New/Neu` jetzt auch titelbasierte Kandidaten und prueft danach den Zielzustand: `MACHINES`, `12210` und `82000` muessen sichtbar sein. |
| Buchwirkung | Die Anleitung darf nicht nur „Neu klicken“ sagen. Sie muss im Screenshot oder Text klar machen, dass der Plus-/Neu-Icon auf der `FA Posting Group Card` gemeint ist und dass der Erfolg erst am sichtbaren Code/Konto-Set erkennbar ist. |
| Kuenftige Regel | Bei Kartenaktionen immer Text, `aria-label`, Titel/Tooltip und Seitenkontext bewerten. Danach nicht dem Klick vertrauen, sondern den sichtbaren Zielzustand als Screenshot und Evidence pruefen. |

## WK-BC-PAY-011 Bank Account Ledger Entries ueber Page 371 nicht belastbar sichtbar

| Feld | Wert |
|---|---|
| Status | offen als read-only Folgepfad; Zahlung nicht wiederholen |
| Testfall | `PAYMENTS-011` |
| Situation | Nach der kontrollierten Laborzahlung `PAY011-PS103297` sollte die Postenspur neben Debitorenposten, detaillierten Debitorenposten und Sachposten auch Bank Account Ledger Entries sichern. |
| Symptom | Der getestete direkte Page-371-Pfad zeigte keinen belastbaren `Bank Account Ledger Entries`-Kontext und die Zahlung `PAY011-PS103297` war dort nicht sichtbar. |
| Sichtbarer Beleg | `playwright/projects/fibu-book5/img/payments-011-063-bank-account-ledger-payment.png`, `playwright/projects/fibu-book5/evidence/payments-011/063-bank-account-ledger-payment-page-text.txt`, `playwright/projects/fibu-book5/evidence/payments-011/PAYMENTS-011-result.json` |
| Ursache | Der direkte Page-ID-/Listenpfad war fuer diese Bankpostenpruefung im Labor nicht stabil genug. Das widerlegt nicht die Zahlungsbuchung: Debitorenposten, Detailed Customer Ledger Entries und G/L Entries sind sichtbar. Es zeigt nur, dass der Bank-Account-Ledger-UI-Pfad separat geklaert werden muss. |
| Warum BC so reagiert | Business Central trennt Journalbuchung, Debitorenposten, Sachposten und Bankposten in unterschiedliche Seiten/Kontexte. Eine falsche oder unpassende Listenseite kann leer bleiben oder keinen Zielkontext zeigen, obwohl andere Postenarten korrekt gebucht wurden. |
| Loesung | Nicht erneut zahlen. Fuer den naechsten Lauf einen read-only Pfad ueber Bank Account Card `BANK-RM-01`, Related Entries/Navigate/Find Entries oder korrekte Bank Account Ledger Entries Seite suchen und nur den vorhandenen Zahlungsbeleg `PAY011-PS103297` pruefen. |
| Buchwirkung | Kapitel 19/20 duerfen die Laborzahlung, OP-Ausgleich, Payment Discount und Sachposten als belegt erklaeren. Seit `PAYMENTS-013` sind auch Bank Account Ledger Entries ueber Page `372` als CRONUS-USA-Labor belegt; Bankabstimmung bleibt offen. |
| Kuenftige Regel | Bei Postenspur-Folgepruefungen nicht blind dieselbe Page-ID wiederholen. Wenn eine Postenart nicht sichtbar wird, als rejected UI-Pfad dokumentieren und einen alternativen read-only Einstieg suchen; keine neue Buchung erzeugen. |

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

## WK-BC-REP-001 Analysis-View-Fit braucht sichere Card-/Listen-Feldzuordnung

| Feld | Wert |
|---|---|
| Status | blockiert / Gate verbraucht; kein Setup-Fit |
| Testfall | `REPORTING-011` |
| Situation | Nach `REPORTING-002` bis `REPORTING-010` wurde ein einmaliger UI-first Laborfit fuer eine eigene Analysis View `RM-PLCH` mit `PRODUCTLINE` und `CHANNEL` freigegeben. |
| Symptom | `Analysis Views` ist erreichbar und zeigt `GEN_LEDGER`, `REVENUE`, Dimensionsspalten, `Analysis by Dimensions` und `Update`. Der Test fand aber keine sicher editierbaren Textfelder fuer Code, Name und Dimensionscodes. |
| Ursache | Die sichtbare Liste ist kein stabiler Editierkontext fuer Playwright. Ohne belegte Card-/Listen-Feldzuordnung waere ein Klick auf `Neu` plus Feldfuellung riskant: falsche Felder koennten gefuellt oder ein halber Setup-Datensatz erzeugt werden. |
| Warum BC so reagiert | Analysis Views sind Reporting-Setup. BC trennt Listenanzeige, Aktionen und editierbare Anlage-/Pflegeoberflaeche. Sichtbare Spaltennamen sind noch keine sicheren Eingabefelder. |
| Loesung | Der Lauf wurde bewusst als `rejected` dokumentiert. `RM-PLCH` wurde nicht angelegt. Ein neuer Setup-Versuch braucht ein ausdrueckliches Feldmapping-/Setup-Gate und muss zuerst die Card/List-Felder sicher identifizieren. |
| Pruefung nach Korrektur | `npm run fibu:reporting:analysis-view-fit` laeuft gruen und schreibt Evidence, aber mit `fitStatus=rejected`, `createdOrUpdatedByUi=false`, `noPostingCommittedByTest=true`, `noPaymentCommittedByTest=true`. |
| Buchwirkung | Kapitel 10 und 25 duerfen weiter trennen: Dimension am Artikelposten ist belegt; Reporting nach `PRODUCTLINE`/`CHANNEL` ist noch nicht belegt. Eine passende Analysis View bleibt ein eigener Setup-Klickpfad, der erst bebildert werden darf, wenn die Anlageoberflaeche stabil dokumentiert ist. |
| Kuenftige Regel | Keine Analysis View per API oder unsicherer Feldindex-Abkuerzung anlegen. Setup-Screenshots brauchen einen stabilen UI-Klickpfad, Vorher/Nachher-Evidence und ein eigenes Gate. |

## WK-BC-REP-002 `New/Neu` in Business Central ist ohne Seitenkontext zu riskant

| Feld | Wert |
|---|---|
| Status | geloest als Tool-/Anfaenger-Lernfall; Gate verbraucht; kein Setup-Fit |
| Testfall | `REPORTING-013` |
| Situation | Nach `GOVERNANCE-007` durfte genau ein Feldmapping-/Setup-Lauf fuer die Analysis View `RM-PLCH` erfolgen. Der Lauf sollte zuerst Feldpositionen belegen und nur bei sicherer UI-Zuordnung anlegen oder aendern. |
| Symptom | `REPORTING-013` konnte die bestehende `REVENUE`-Karte oeffnen und Feldpositionen fuer `Code`, `Name`, `Dimension 1 Code` und `Dimension 2 Code` belegen. Ein kontrollierter Folgeversuch zeigte aber, dass ein ungescopter Klick auf `New/Neu` in den Role-Center-Kontext fallen kann. |
| Ursache | Business Central zeigt Aktionen kontextabhaengig ueber Shell, Rollencenter, Listen, Karten und Aktionsleisten. Ein sichtbares `New/Neu` ist nicht automatisch die Neuanlage der fachlich gemeinten Liste oder Karte. |
| Warum BC so reagiert | Der Webclient bietet globale und seitenbezogene Aktionen gleichzeitig an. Playwright findet nach Rollenname zuerst ein sichtbares Element; ohne Container-/Frame-/Seitenanker kann das die falsche Aktion sein. |
| Loesung | `REPORTING-013` wurde bewusst als `rejected` geschlossen. `RM-PLCH` wurde nicht angelegt oder geaendert. Der Test schreibt Feldmapping-Evidence, klickt aber kein ungescopter `New/Neu` mehr. |
| Pruefung nach Korrektur | `npm run fibu:reporting:analysis-view-fieldmapping` laeuft gruen. Evidence zeigt `fieldmappingSafe=true`, `setupAttempted=false`, `setupChanged=false`, `noPostingCommittedByTest=true`, `noPaymentCommittedByTest=true`. |
| Buchwirkung | Eine Klickanleitung darf nicht nur sagen „Neu klicken“. Sie muss zeigen, auf welcher Seite, in welcher Liste/Karte und in welchem Kontext die Neuanlage erfolgt. Fuer Analysis Views bleibt der Setup-Klickpfad offen, bis `New/Neu` stabil gescoped ist. |
| Kuenftige Regel | Keine generischen `New/Neu`-, `Post`-, `OK`- oder aehnlichen Aktionen fuer Setup/Buchung ohne fachlichen Containeranker. Bei mehrdeutigen Aktionen lieber abbrechen, Evidence schreiben und einen Lernfall dokumentieren. |

## WK-BC-FA-001 Anlagenkarte kann bei Lookup-Preflight automatisch eine Nummer speichern

| Feld | Wert |
|---|---|
| Status | erkannt, eigener Entwurf per UI bereinigt; Save-Gate bleibt blockiert |
| Testfall | `FIXEDASSETS-027` |
| Situation | Nach `FIXEDASSETS-026` waren alle relevanten Anlagenkarten-Controls sichtbar. Der naechste Schritt sollte nur pruefen, ob `HGB`, `MACHINES` und Klassen-/Unterklassenwerte im Lookup sichtbar sind. |
| Symptom | Die Lookup-Screenshots zeigen die richtigen Werte, aber oben auch die automatisch erzeugte Nummer `FA000110` und den Status `Gespeichert`. Der urspruengliche reine No-Save-Anspruch war damit falsch. |
| Ursache | Business Central kann beim Oeffnen einer neuen Karte und beim Arbeiten mit Lookup-/Pflichtfeldern eine Nummer aus der Nummernserie zuweisen und den Datensatz speichern, auch wenn der fachliche Zielwert noch nicht ausgefuellt ist. |
| Warum BC so reagiert | Karten sind editierbare Stammdatenobjekte. Eine automatisch vergebene `No.` ist selbst ein persistenter Zustand; Lookups und Pflichtfeldvalidierung finden auf diesem Kartenobjekt statt. |
| Loesung | Der eigene Entwurf `FA000110` wurde ueber die `Fixed Asset Card` geloescht. Evidence zeigt den Dialog `FA000110 loeschen?` und den gefilterten Nachlauf, in dem `FA000110` nicht mehr sichtbar ist. Der 027-Test wurde gegen Wiederholung gesperrt, bis ein cleanup-aware Pattern existiert. |
| Pruefung nach Korrektur | `playwright/projects/fibu-book5/evidence/fixedassets-027/100-auto-number-draft-cleanup-coordinate-result.json` meldet `stillVisibleAfterCleanup=false`; Screenshot `fixedassets-027-100-cleanup-after-filter.png` zeigt die leere Filteransicht. |
| Buchwirkung | Kapitel 21 muss erklaeren: Ein Lookup-Preflight auf einer neuen Anlage ist nicht automatisch no-save. Fuer Anfaenger braucht die Klickanleitung entweder einen bewusst freigegebenen Speicherschritt oder einen klaren Abbruch-/Cleanup-Pfad. |
| Kuenftige Regel | Vor Stammdaten-Preflights nicht nur die Zielnummer pruefen. Auch automatisch erzeugte Nummern erkennen, dokumentieren und bereinigen. Kein Save-Gate fuer `FA-CNC-01`, bevor Klasse/Unterklasse, AfA-Daten und Auto-Number-Strategie entschieden sind. |
