# Fehlerjournal

Dieses Journal verdichtet Debugging-Faelle aus dem alten Business-Central-/Playwright-Buchprojekt. Die alten Artefakte wurden aus diesem Branch entfernt; die Lernregeln bleiben als Buchmaterial erhalten.

## Vorlage

| Feld | Bedeutung |
|---|---|
| Problem | Was ist passiert? |
| Symptom | Woran wurde es sichtbar? |
| Ursache | Warum ist es passiert? |
| Fix | Was wurde geaendert? |
| Nachweis | Wie wurde der Fix geprueft? |
| Regel | Was gilt kuenftig? |

## UI-001 Fehlende Felder sind nicht automatisch fehlende Funktionen

| Feld | Wert |
|---|---|
| Problem | Ein erwartetes Feld, eine Spalte oder Aktion fehlt in der Oberflaeche. |
| Symptom | Anleitung oder Test findet das Element nicht, obwohl der Prozess es braucht. |
| Ursache | Rolle, Profil, Ansicht, Personalisierung, Sprache, Berechtigung oder Page-Design veraendern die sichtbare UI. |
| Fix | Erst Sichtbarkeit pruefen: Personalisieren, Ansichten, Profil, Rolle und Berechtigungen. |
| Nachweis | Element ist einblendbar oder die Grenze ist als Page-/Berechtigungs-/Setup-Befund dokumentiert. |
| Regel | Fehlende UI zuerst diagnostizieren, nicht sofort Buchtext oder Code umbauen. |

## UI-002 Page Inspection klaert technischen Kontext

| Feld | Wert |
|---|---|
| Problem | Sichtbarer Seitenname, Feldquelle oder Tabellenkontext ist unklar. |
| Symptom | Locator, Buchtext oder Screenshot-Erklaerung koennen auf falscher Page oder falschem Part beruhen. |
| Ursache | Business-Anwendungen kombinieren Karten, Listen, Parts, FactBoxes, Dialoge und Extensions. |
| Fix | Technische Seiteninspektion nutzen und Page Name, Page ID, Source Table, Feld und Filter dokumentieren. |
| Nachweis | Der technische Kontext ist als Evidence notiert. |
| Regel | Bei unklarem Page-/Feldkontext erst inspizieren, dann refactoren. |

## UI-003 Sichtbarer Text ist kein sicheres Klickziel

| Feld | Wert |
|---|---|
| Problem | Ein Tell-Me-/Suchtreffer war sichtbar, aber nicht per Role-Selector klickbar. |
| Symptom | Der Test fand Text, oeffnete aber nicht den erwarteten Kontext. |
| Ursache | Treffer werden dynamisch und verschachtelt gerendert; das sichtbare Text-Element ist nicht zwingend der klickbare Vorfahr. |
| Fix | Trefferkandidaten sammeln, passenden klickbaren Vorfahren waehlen, danach Zielseitenkontext pruefen. |
| Nachweis | Nach dem Klick ist die erwartete Seite im Seitentext sichtbar. |
| Regel | Nie blind den ersten Treffer oder Enter verwenden, wenn die Zielseite fachlich wichtig ist. |

## UI-004 `New` kann nur als Icon sichtbar sein

| Feld | Wert |
|---|---|
| Problem | Die Aktion `New/Neu` wurde nicht gefunden, obwohl sie sichtbar war. |
| Symptom | Snapshot zeigte einen Icon-Button mit Tooltip, aber keinen sichtbaren Buttontext. |
| Ursache | Aktionsleisten sparen Platz und rendern Befehle als Icon mit Titel oder Tooltip. |
| Fix | Locator bewertet Text, `aria-label`, `title`, Tooltip und Seitenkontext. |
| Nachweis | Nach der Aktion ist der erwartete Zielzustand sichtbar. |
| Regel | Aktionen immer mit Kontext und Nachherpruefung behandeln. |

## UI-005 Generisches `New`, `OK` oder `Post` ist riskant

| Feld | Wert |
|---|---|
| Problem | Ein ungescopter Klick kann in Shell, Role Center, Liste oder Karte landen. |
| Symptom | Der Test bewegt sich in einen anderen Kontext als den fachlich gemeinten. |
| Ursache | Globale und lokale Aktionen koexistieren in derselben UI. |
| Fix | Aktionen an Seite, Dialog, Liste, Karte oder Datensatz ankern. |
| Nachweis | Der Zielkontext und Zielwert sind nach der Aktion sichtbar. |
| Regel | Kritische Aktionen nie ohne fachlichen Containeranker ausfuehren. |

## TEST-001 Seitentitel ist kein Zielwert

| Feld | Wert |
|---|---|
| Problem | Ein Test haette eine Seite als Erfolg gewertet, obwohl der konkrete Datensatz fehlte. |
| Symptom | Seitentitel war sichtbar, Zielnummer aber nicht. |
| Ursache | Zu breite Pruefung erkennt Kontext statt Zielobjekt. |
| Fix | Assertions auf konkrete Nummern, Codes, Betraege oder Statuswerte verschaerfen. |
| Nachweis | Status unterscheidet `Seite erreichbar` von `Zielwert sichtbar`. |
| Regel | Kontext und Zielwert getrennt pruefen. |

## TEST-002 Grid-Spalten nicht per Hoffnung fuellen

| Feld | Wert |
|---|---|
| Problem | Ein Kostenwert wurde in die falsche Journalspalte geschrieben. |
| Symptom | Die Anwendung markierte die Zeile mit Fehlerhinweis statt den Kostenwert zu speichern. |
| Ursache | Horizontale Grids sind eng; Feldindex und sichtbare Position koennen taeuschen. |
| Fix | Feld bewusst fokussieren, Spaltenbedeutung pruefen, nach Eingabe Zielwerte validieren. |
| Nachweis | Richtige Zielspalten und Preflight-Status sind sichtbar. |
| Regel | Keine fachlichen Werte in Grids schreiben, ohne Feldbedeutung und Nachherzustand zu pruefen. |

## TEST-003 Asynchrone UI-Zustaende getrennt lesen

| Feld | Wert |
|---|---|
| Problem | Ein Journal-Check-Zaehler war noch nicht aktualisiert, waehrend der Current-line-Status schon korrekt war. |
| Symptom | Unterschiedliche UI-Elemente zeigten kurz widerspruechliche Zustandsinformationen. |
| Ursache | Auto-Save und FactBox-Aktualisierung laufen asynchron. |
| Fix | Auf stabilen Zustand warten und die fachlich relevante Statuskombination pruefen. |
| Nachweis | Zielzeile, Current-line-Status und Issues-Status passen zusammen. |
| Regel | Nicht aus einem einzelnen UI-Zaehler ableiten, wenn mehrere Statusquellen existieren. |

## DATA-001 Globale Einrichtung ist nicht konkreter Belegwert

| Feld | Wert |
|---|---|
| Problem | Eine erwartete Waehrung existierte global, kam aber nicht im Auftrag an. |
| Symptom | Beleg lief mit anderer Waehrung als das Buchziel. |
| Ursache | Der Debitor hatte keinen passenden Waehrungscode; leer bedeutete lokale Mandantenwaehrung. |
| Fix | Stammdatenwert setzen oder im Beleg bewusst nachweisen. |
| Nachweis | Frischer Beleg zeigt den erwarteten Waehrungscode. |
| Regel | Globale Einrichtung, Stammdatenwert und Belegwert getrennt nachweisen. |

## DATA-002 Setup-Fehler nicht als Bedienfehler behandeln

| Feld | Wert |
|---|---|
| Problem | Buchungsvorschau stoppte wegen fehlendem Bestandskonto. |
| Symptom | Fehlermeldung nannte fehlendes Inventory Account fuer Lagerort und Buchungsgruppe. |
| Ursache | Kontenfindung fuer die Kombination war nicht eingerichtet. |
| Fix | Setup-Zeile diagnostizieren und nur fachlich begruendeten Labor- oder Zielwert setzen. |
| Nachweis | Alter Fehler ist weg; Vorschau zeigt erwartete Postenarten; keine echte Buchung ohne Freigabe. |
| Regel | Fehlermeldungen fachlich lesen, nicht durch zufaellige Feldfuellung kaschieren. |

## DOC-001 Screenshot muss den behaupteten Zustand zeigen

| Feld | Wert |
|---|---|
| Problem | Screenshots zeigten leere Karten, wurden aber beinahe als Zielstammdaten-Bilder behandelt. |
| Symptom | Zielcodes waren im Bild nicht sichtbar. |
| Ursache | Formular-Preflight wurde mit Zielzustand verwechselt. |
| Fix | Bildtyp korrigieren: Laborbild, Preflight, Zielbild oder Nachweisbild. |
| Nachweis | Bildmetadaten und Text sagen klar, was bewiesen ist und was nicht. |
| Regel | Kein Screenshot darf mehr behaupten, als sichtbar oder separat belegt ist. |

## DOC-002 FactBox ist manchmal Stoerer, manchmal Beweis

| Feld | Wert |
|---|---|
| Problem | Rechte Infoboxen verdraengen Tabellen, enthalten aber manchmal den eigentlichen Kontrollstatus. |
| Symptom | Breite Listen brauchen Platz; Kontrollbilder brauchen die FactBox. |
| Ursache | Layout- und Beweisziel sind nicht dasselbe. |
| Fix | Vor jedem Screenshot entscheiden: Tabellenbild oder Kontrollbild. |
| Nachweis | Der Screenshot zeigt entweder die relevanten Spalten oder den relevanten Kontrollstatus. |
| Regel | UI-Bereinigung nie pauschal anwenden; sie muss zum Beweisziel passen. |
