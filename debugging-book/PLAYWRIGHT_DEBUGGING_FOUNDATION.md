# Playwright Debugging Foundation

## Ziel

Playwright soll Business-Central-Debugging reproduzierbar machen: Seiten oeffnen, sichtbare Symptome sichern, UI-Zustaende vergleichen und Regressionstests formulieren. Playwright ersetzt keine fachliche Analyse. Es erzeugt Evidence.

## Warum BC-UI schwierig ist

Business Central rendert Shell, Role Center, Pages, Parts, FactBoxes und Dialoge dynamisch. Viele Inhalte liegen in Frames. Sprache, Profil, Personalisierung und Berechtigungen veraendern die UI. Buttons koennen Text, Icon, Tooltip oder Menueeintrag sein. Grids speichern asynchron.

## Grundregeln fuer stabile Klicks

1. Erst Seite und Kontext identifizieren.
2. Treffer bewusst waehlen.
3. Kritische Aktionen scopen.
4. Nach jedem Klick Zielkontext pruefen.
5. Bei Mehrdeutigkeit stoppen und Evidence schreiben.

## Tell-Me / Alt+Q Suche

Tell-Me ist gut fuer Navigation, aber nicht eindeutig genug fuer blinde Automatisierung. Ein Test soll Suchbegriff, Treffer und Zielseite dokumentieren.

## Keine blinden ersten Treffer

Der erste sichtbare Treffer ist nur dann erlaubt, wenn der Test beweist, dass er eindeutig ist. Sonst braucht der Test Trefferindex, Label, Kontext oder einen direkten Page-ID-Pfad.

## Buttons wie New, OK, Post, Release, Send nicht generisch klicken

Diese Buttons koennen globale Wirkung haben. Sie duerfen nur geklickt werden, wenn die richtige Page oder der richtige Dialog bewiesen ist, der Ziel-Datensatz eindeutig ist, die Safe-Action-Policy passt und eine Nachherpruefung definiert ist.

## Kontextanker

Gute Kontextanker sind Page Caption plus Page ID, Dokumentnummer, Zielcode, Tabellenzeile mit eindeutigem Wert, Dialogtitel oder Field Label plus sichtbarer Wert.

## Nachherpruefung

Ein Klick gilt erst als erfolgreich, wenn der erwartete Zustand sichtbar oder strukturiert belegt ist.

## Screenshots als Evidence

Screenshots sind Beweisstuecke mit Grenzen. Sie muessen Zweck, Status und bekannte Grenzen erhalten.

## Screenshot-Typen

| Typ | Beweist | Beweist nicht |
|---|---|---|
| Einstieg | Seite erreichbar | richtiger Datensatz |
| Preflight | Formular geoeffnet | Datensatz gespeichert |
| Zielzustand | Wert sichtbar | fachliche Buchungswirkung |
| Postenspur | Entry sichtbar | vollstaendige Abschlusspruefung |
| Fehlerbild | Symptom sichtbar | Ursache sicher bestaetigt |

## Locator-Regeln

- Rollen-Locators bevorzugen, aber BC-spezifische Fallbacks dokumentieren.
- Sichtbaren Text nicht automatisch als Klickziel behandeln.
- `title`, `aria-label`, Tooltip und Menuekontext bei Icon-Buttons beruecksichtigen.
- Kritische Locators muessen Eindeutigkeit pruefen.
- Grid-Spalten nicht nach Hoffnung oder Index fuellen, wenn Feldlabel/Feldposition nicht belegt ist.

## Assertion-Regeln

- Seitentitel ist Kontext, kein Zielwert.
- Zielwert, Kontext und Status getrennt pruefen.
- Bei Datenwirkung UI plus API/OData/MCP kombinieren.
- Negative Assertions fuer alte Fehlertexte nutzen.
- Safety Assertions setzen: `posted=false`, `paymentSent=false`, `emailSent=false`, wenn das Ziel read-only ist.

## Wartebedingungen

Warte auf Business-Central-Shell, Page Caption, Zielwert, abgeschlossenen Speicherzustand, aktualisierte FactBox/Journal Check oder erwartete Fehlermeldung. Warte nicht nur auf feste Timeouts.

## Umgang mit asynchronen UI-Zustaenden

BC-Grids, FactBoxes und Journal Checks koennen kurz unterschiedliche Staende zeigen. Ein Test muss relevante Statusquellen zusammen pruefen und bei widerspruechlichen Signalen warten oder abbrechen.

## Umgang mit Grids

- Grid-Spalten nie per Hoffnung oder blindem Index fuellen.
- Vor Eingabe Feldlabel, Spaltenposition und Zeilenkontext belegen.
- Nach Eingabe gespeicherten oder sichtbaren Zielwert pruefen.
- Bei Journals zusaetzlich Journal Check, Current Line und Issues getrennt lesen.

## Umgang mit Dialogen und Teaching Tips

- Teaching Tips duerfen Screenshots ueberlagern und muessen als eigener UI-Zustand behandelt werden.
- Dialoge brauchen Titel- oder Textanker.
- `OK`, `Yes`, `Ja`, `Cancel`, `Abbrechen` nie generisch klicken, wenn die Wirkung nicht klar ist.
- Wenn ein Dialog eine Buchung, Zahlung, Freigabe oder Versand bestaetigt, greift die Safe-Action-Policy.

## Datenschutz bei Screenshots

Echte Namen, Bankdaten, Steuerdaten, E-Mail-Adressen und Belegdetails anonymisieren. Roh-Traces nicht dauerhaft versionieren, wenn sie sensible Daten enthalten.

## Regressionstest-Regeln

Ein Regressionstest muss sagen, welcher alte Fehler verhindert wird, welche Page/Table/Felder betroffen sind, welche Evidence entsteht, ob der Test read-only bleibt, welche Aktion verboten bleibt und welche Daten anonym oder synthetisch sind.

## Anti-Patterns

- Ersten Tell-Me-Treffer blind klicken.
- `Post`, `OK`, `New`, `Release` oder `Send` ohne Kontextanker klicken.
- Seitentitel als Zielwert werten.
- Grid-Spalten nach Index fuellen, ohne Feldbedeutung zu belegen.
- Screenshot als Root Cause ausgeben, obwohl er nur Symptom zeigt.
- Fixed Timeout statt fachlicher Wartebedingung verwenden.
- Playwright-Test gruen machen, indem Assertions abgeschwaecht werden.
