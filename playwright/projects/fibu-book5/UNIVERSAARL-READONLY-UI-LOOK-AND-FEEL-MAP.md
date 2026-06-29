# Universaarl Read-only UI Look-and-Feel Map

Status: `prep-done`, `readonly-ui-map`, `needs-universaarl-final-company`

Aktive Zielwelt:

- Instanz: `playthru`
- Zielcompany: `UNIVERSAARL-DE` noch nicht angelegt
- Musterfirma: `Universaarl GmbH`
- Alte RM-/CRONUS-/Demo-Evidence: nur `legacy-labor-reference`

Diese Map sammelt wiederverwendbare Regeln fuer Business-Central-Oberflaeche, Klickpfade und Screenshot-QA. Sie ersetzt keine finale Universaarl-Evidence. Sie verhindert aber, dass der Autopilot oder das Buch sichtbare UI falsch deutet.

## Grundregel

Business Central zeigt auf derselben Seite oft mehrere Ebenen gleichzeitig:

- Shell: Environment, Rolle, Navigation, Suchfeld, globale Aktionen.
- Seite: Titel, Listenname, Kartenname, Status, Filter/Ansicht.
- Command Bar: Hauptbuttons, Split-Buttons, Dropdown-Pfeile, Overflow.
- Inhalt: Liste, Karte, Journal, Worksheet, Lines/Subform.
- Kontextbereiche: FastTabs, FactBoxes, Details, Anhaenge.
- Dialoge und Tooltips: erklaeren oder bestaetigen, koennen aber auch Datenwirkung ausloesen.

Ein Screenshot ist erst brauchbar, wenn klar ist, welche Ebene wichtig ist.

## Split-Buttons und Dropdowns

Auf der Seite `Mandanten` / `Companies` ist `Neu` ein gutes Beispiel:

| UI-Element | Bedeutung | Sichere Nutzung | Grenze |
| --- | --- | --- | --- |
| Hauptflaeche `Neu` | kann direkt eine neue Zeile oder einen Create-Kontext oeffnen | nur nach Gate klicken; danach Screenshot-QA der tatsaechlichen sichtbaren Seite | ein Klick auf die Hauptflaeche ist nicht dasselbe wie der Pfeil daneben |
| Pfeil neben `Neu` | oeffnet ein Dropdown mit Alternativen | read-only fuer Screenshot und Bucherklaerung, solange kein Menuepunkt ausgewaehlt wird | beweist nur sichtbare Optionen, keine Anlage |
| `Neues Unternehmen erstellen` | Assistenz-/Create-Route | erst nach Berechtigung und Decision Gate auswaehlen | darf nicht mit `Kopieren` oder `Testunternehmen` verwechselt werden |
| `Kopieren` / `Testunternehmen` | alternative Erstellungswege | fuer Universaarl nicht als Zielbasis verwenden | kann Demo-/Altdaten uebernehmen |

Tooltip-Regel: Wenn ein Button mehrdeutig ist, zuerst hover/focus verwenden und Tooltip/Accessible Name dokumentieren. Danach erst entscheiden, ob die Hauptflaeche oder der Dropdown-Pfeil gemeint ist.

## Listen und ListParts

Eine Liste beweist zunaechst nur Sichtbarkeit. Sie beweist nicht automatisch, dass ein Datensatz gespeichert wurde.

Bei `Mandanten` gilt:

- vorhandene Zeilen zeigen vorhandene Companies,
- eine leere neue Zeile zeigt einen Eingabekontext,
- ein ListPart-Titel wie `Neu - Mandanten` zeigt einen Create-Kontext,
- erst eine sichtbare gespeicherte Zeile `UNIVERSAARL-DE` beweist die Anlage.

Vor jedem Urteil pruefen:

1. Ist die Zielzeile sichtbar?
2. Ist sie gespeichert oder nur ein Eingabebereich?
3. Ist ein Fehlerbanner oder Dialog sichtbar?
4. Ist der Fokus im Vordergrundbereich oder auf der Seite dahinter?
5. Wurde nur ein Dropdown geoeffnet oder schon eine wirksame Aktion ausgefuehrt?

## Karten, FastTabs und FactBoxes

Karten und Journale koennen relevante Felder verstecken. Bevor ein Feld als fehlend gilt:

- Karte bei Bedarf maximieren,
- relevante FastTabs aufklappen,
- stoerende FastTabs einklappen,
- FactBox-Bereich pruefen oder ausblenden,
- horizontal scrollen,
- Fokusmodus fuer Lines/Subforms verwenden,
- bei Bedarf Page Inspection oder Personalisieren als Diagnose verwenden.

Diese Schritte sind Layout- und Diagnoseaktionen. Sie beweisen noch keinen gesetzten Feldwert.

## Such- und Filterlogik

Die Suche oeffnet Seiten, Berichte oder Aktionen. Filter begrenzen Zeilen oder Summen innerhalb einer Seite oder eines Reports.

| Werkzeug | Zweck | Datenwirkung | Buchreife |
| --- | --- | --- | --- |
| Suche / Tell Me | Seite oder Funktion finden | Navigation | gut fuer Einstieg, nicht fuer Beweis einer Buchung |
| Listenfilter | sichtbare Zeilen begrenzen | read-only, solange keine Ansicht gespeichert wird | braucht Datenreichtum |
| Summenfilter | FlowFields/Summen beeinflussen | read-only, aber fachlich erklaerungsbeduerftig | erst mit Universaarl-Posten |
| Ansicht speichern | Benutzeransicht sichern | kann Personalisierung/Ansichten veraendern | eigener Gate-Fall |
| Report Request Page | Reportfilter vor Ausfuehrung | Reportausfuehrung muss klassifiziert werden | eigener Gate-Fall |

## Filter- und Ansichten-QA

Ein Filter-Screenshot ist erst brauchbar, wenn die Filterwirkung sichtbar ist. Dafuer braucht das Bild mehr als nur ein geoeffnetes Filterfeld.

| Screenshot-Typ | Muss sichtbar sein | Beweist | Beweist nicht |
| --- | --- | --- | --- |
| Suche / Tell Me | Suchbegriff, Treffer, Zielseite nach Auswahl | Navigationsweg | dass ein Datensatz existiert oder geaendert wurde |
| Listenfilter | gefilterte Spalte oder Filterleiste, sichtbare Zeilen, Listentitel | welche Zeilen aktuell angezeigt werden | Buchungswirkung oder Summenlogik |
| Sortierung | Spaltenkopf, Sortierrichtung, mehrere vergleichbare Zeilen | Reihenfolge der sichtbaren Liste | Vollstaendigkeit aller Daten |
| `Filter totals by` | betroffener Summen-/FlowField-Kontext und Filterwert | Summenfilter-Kontext | die zugrunde liegenden Posten ohne Entry-Trace |
| gespeicherte Ansicht | Ansichtname, Filter/Spaltenkontext | Benutzer- oder Rollenansicht | allgemeiner Standard fuer alle Benutzer |
| Analysis Mode | aktive Analyseansicht, Gruppierung/Spalten/Summen | read-only Analyse von Listendaten | Report- oder Ledger-Finalnachweis |
| Request Page | Reportname, Filter/Optionen, Start-/Abbruchaktion | Reportparameter vor Ausfuehrung | dass der Report korrekt oder vollstaendig ist |

Vor einem finalen Screenshot fuer das Buch muss die Liste genug Daten enthalten. Eine einzelne Zeile ist fuer Filter- und Sortiererklaerungen nur ein Platzhalter.

## Screenshot-QA vor Buchverwendung

Jeder relevante Screenshot braucht mindestens:

- Page oder sichtbarer Seitentitel,
- Company- oder Shell-Kontext,
- markierter Button/Feldbereich,
- sichtbarer Zielzustand,
- Grenze: was der Screenshot nicht beweist,
- Status: `draft`, `book-candidate`, `legacy`, `rejected` oder `final-candidate`.

Nicht ausreichend:

- nur ein kleiner Ausschnitt ohne Kontext,
- Dropdown ohne erklaerten Zielbutton,
- Bild nach Klick ohne Pruefung, ob der Klick die richtige Ebene getroffen hat,
- Button sichtbar, aber Tooltip/Accessible Name unbekannt,
- gespeicherter Zustand behauptet, obwohl nur Eingabezeile sichtbar ist.

## Stop-Regeln

Sofort stoppen und als Gate dokumentieren, wenn sichtbar wird:

- `Speichern`, `Fertig stellen`, `OK`, `Ja`, `Delete`, `Loeschen`,
- `Post`, `Buchen`, `Preview Posting`, `Ship`, `Invoice`, `Payment`,
- Wizard-Schritte mit Datenanlage,
- Fehler-/Berechtigungsdialog,
- Company-Kontext unklar,
- Zielinstanz nicht `playthru`.

## Evidence-Anker

| Evidence | Beitrag zur Map | Grenze |
| --- | --- | --- |
| `target-001` | Companies Page read-only Kontext | keine Anlage |
| `target-007-companies-new-dropdown-clickguide` | Pfeil neben `Neu`, Dropdown und Tooltips | kein Menuepunkt ausgewaehlt |
| `target-008-companies-new-row-field-save-gate` | neue Zeile/ListPart-Kontext | keine gespeicherte Company |
| `target-009-main-neu-list-company-create-gate` | sichtbare Create-Route und Berechtigungsgrenze | `UNIVERSAARL-DE` nicht sichtbar |

## Naechster praktischer Nutzen

Wenn die Rechte vorhanden sind, wird TARGET-009 nicht blind wiederholt. Der naechste Lauf prueft zuerst:

1. Page `Mandanten` sichtbar.
2. Tooltip/Accessible Name des richtigen `Neu`-Elements.
3. Dropdown-Pfeil und Menuepunkt `Neues Unternehmen erstellen` sichtbar.
4. Keine Auswahl von `Kopieren` oder `Testunternehmen`.
5. Nach Auswahl: Screenshot-QA des tatsaechlichen Wizard-/ListPart-Kontexts.
6. Wenn ein Fehler erscheint: exakter Fehlertext, sichtbare Page und keine weitere Aktion.
