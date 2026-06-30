# Business Central Claim Rules

Diese Regeln steuern, wann eine Aussage in Buch, Atlas, Evidence oder State stehen darf.

## Claim-Typen

| Claim-Typ | Beispiel | Erforderliche Quelle | Zielort |
| --- | --- | --- | --- |
| Produktclaim | Business Central kann Verkaufsauftraege erstellen. | Microsoft Learn oder eigene UI-Evidence | Buch, Atlas |
| UI-Claim | Auf der Seite `Mandanten` gibt es die Action `Neu`. | eigene Universaarl-Playwright-Evidence | Buch, Atlas, Evidence |
| Setup-Claim | Eine setup-nahe neue Company enthaelt Setupdaten, aber keine Sampledaten. | Microsoft Learn plus eigene Pruefung, wenn daraus ein Buchprozess wird | Buch nach Proof, sonst Atlas/Plan |
| Rechts-/Steuerclaim | Rechnungen benoetigen bestimmte Pflichtangaben. | amtliche Quelle wie UStG, AO, BMF, EU | Buch mit Quellenbezug |
| Best-Practice-Claim | Erst Grundlagen einrichten, dann Stammdaten, dann Prozesse buchen. | Microsoft Implementation Guide, Microsoft Learn Setup-Doku oder belegte Projektlogik | Buch als Best Practice, nicht als Pflicht |
| Evidence-Claim | `UNIVERSAARL-DE` wurde erstellt. | Result JSON, Screenshot, State-/Coverage-Update | Evidence, State, Buch erst nach Proof |
| Release-Claim | Ein Feature ist neu oder UI-abhaengig. | Microsoft Release Plan / What's New | Atlas, Buch mit Versionshinweis |
| Debugging-Hypothese | Diese Fehlermeldung koennte durch Berechtigungen entstehen. | Community/Blog nur als Hinweis, danach Microsoft/amtlich/Evidence | Evidence/Blocker, nicht finaler Buchclaim |

## Harte Regeln

1. Konkrete Universaarl-Klickpfade brauchen eigene `playthru`-Evidence.
2. Microsoft Learn beschreibt den Produktstandard, ersetzt aber nicht den Nachweis in `UNIVERSAARL-DE`.
3. Rechts-, Steuer-, GoBD- und E-Rechnungs-Aussagen brauchen amtliche Quellen.
4. Community, Blogs und YouTube duerfen Tests inspirieren, aber keine Buchwahrheit beweisen.
5. Wenn Quelle und UI-Evidence abweichen, gewinnt fuer die konkrete Anleitung die eigene Evidence; die Abweichung wird im Atlas oder Evidence-README erklaert.
6. Wenn keine Quelle und keine Evidence vorhanden ist, wird kein finaler Buchsatz geschrieben. Die Aussage wandert in eine interne Pruefnotiz oder wird als naechster Proof-Case geplant.
7. Vor jeder wirksamen BC- oder Buchaktion muss eine Smart Decision Card die Quellen-/Evidence-Basis, Alternativen, erwartete Wirkung, Risiken und Bucherklaerung festhalten.

## Buchtext oder internes Artefakt?

| Aussage | Buchtext | Interne Datei |
| --- | --- | --- |
| Was sieht der Anfaenger auf der Seite? | ja, direkt formuliert | Evidence/Atlas mit Details |
| Welcher Button ist sicher oder riskant? | ja, wenn belegt | Atlas mit Button-/Dialogdetails |
| Was wurde in einem Case bewiesen? | nein als Meta-Satz | Result JSON, Evidence README, Coverage |
| Welche Quelle stuetzt eine Aussage? | knapp als Quellenhinweis oder Fussnote | Source Registry |
| Was ist noch nicht bewiesen? | nur sachlich als Grenze, nicht als Agenten-To-do | State, Backlog, Evidence |
| Welche Recherche fehlt? | nein | Source Registry, Claim Rules, Case-Datei |

## Universaarl Company Creation Claim

Fuer `UNIVERSAARL-DE` gilt ab diesem Quellenlauf:

- Der praktische Buchpfad beginnt auf der Seite `Mandanten` und nutzt `Neu` beziehungsweise den Dropdown-Eintrag `Neues Unternehmen erstellen`, sobald ausreichende Rechte vorhanden sind.
- TARGET-009 ist `parked-until-super-permissions`; die fehlende Erstellung von `UNIVERSAARL-DE` ist ein Berechtigungsblocker, kein Beweis gegen den UI-Weg.
- `Kopieren`, CRONUS und `Testunternehmen` sind keine finale Universaarl-Basis, solange Datenwirkung und Demodatenfreiheit nicht belegt sind.
- Ein Privacy-/Personal-Data-Hinweis auf der Mandantenliste ist ein fachlicher Stop-/Erklaerpunkt, nicht nur UI-Rauschen.
- Vor Speichern, Finish oder Wizard-Abschluss muss die Smart Decision Card `Neu`, `Neues Unternehmen erstellen`, `Kopieren`, `Testunternehmen`, Blank/No Data und Setup-Only/Production-Setup als Alternativen bewerten.
- Bis zur Rechtefreigabe duerfen Buchtexte nur erklaeren, wie die Anlage fachlich funktioniert und warum Berechtigungen gebraucht werden. Sie duerfen nicht behaupten, dass `UNIVERSAARL-DE` bereits existiert.

## Zero-Open-Questions-Claims

Ein Claim darf nicht final werden, wenn er eine offene Objektfrage verdeckt. Jede unklare Page, Karte, Liste, jedes Feld, jede Action, jeder Dialog, jede Request Page, jeder Report, jede Tabelle, jeder Entry und jede Buchungswirkung braucht eine Quelle, Universaarl-Evidence, erlaubte AL-/Objektanalyse oder einen finalen Klassifikationsstatus.

Die internen Nachweise stehen in `BC-OBJECT-COVERAGE-CATALOG.md`, den Atlas-Dateien und `.agent/state/open_questions_register.json`. Das Buch schreibt daraus nur die fertige, anfaengerfreundliche Erklaerung.

## PREP-008 Claim-Gate vor Buchtext

Jeder neue Buchsatz bekommt vor dem Commit eine einfache Claim-Klasse. Gemischte Saetze werden geteilt.

| Satztyp | Sofort erlaubt? | Was fehlt, wenn nicht? |
| --- | --- | --- |
| Produktstandard mit Microsoft-Learn-Quelle | ja, als allgemeiner BC-Satz | Universaarl-Beweis, falls der Satz konkret wird |
| Konkrete Universaarl-UI | nur mit eigener Evidence | Screenshot, Result JSON, Atlas-/Coverage-Eintrag |
| Konkreter Universaarl-Zustand | nur mit eigener Evidence | sichtbarer Datensatz, Page-Kontext, Result JSON |
| Setup-/Posting-Wirkung | nur nach Preview/Posting/Entry-Trace | Gate, Trace, Entries und Buchwirkung |
| Best-Practice-/Projektvorgehen | ja, wenn Implementation-Guide-Quelle passt | Trennung von Vorgehen und Produktfunktion |
| Rechts-/Steuer-/Compliance-Aussage | nur mit amtlicher Quelle | amtliche Quelle und ggf. BC-Umsetzungsnachweis |

### Satz-Entscheidung

1. Nennt der Satz `UNIVERSAARL-DE`, einen Beleg, ein Feld, eine Page oder einen Button, dann ist eigene Universaarl-Evidence Pflicht.
2. Nennt der Satz nur einen Business-Central-Standardprozess, kann Microsoft Learn reichen.
3. Nennt der Satz USt, Rechnung, Aufbewahrung, GoBD, E-Rechnung oder Compliance, reicht Microsoft Learn nicht.
4. Nennt der Satz UAT, Testplan, Rollen, Cutover oder Governance, ist der Implementation Guide eine passende Quelle, aber kein UI-Beweis.
5. Nennt der Satz einen noch geparkten Pfad, muss er sachlich als Voraussetzung formuliert werden: Berechtigung, Seite, Option, naechster pruefbarer Schritt.

### Company-Creation-Spezialregel

Bis ausreichende Rechte vorhanden sind, darf die Buchfassung nur erklaeren:

- was eine Company ist,
- warum `UNIVERSAARL-DE` als eigene Zielcompany gebraucht wird,
- wo die Mandantenliste liegt,
- dass `Neu` und `Neues Unternehmen erstellen` unterschiedliche UI-Ziele sind,
- warum `Kopieren`, CRONUS und Testunternehmen nicht blind als finale Musterfirma verwendet werden,
- welche Berechtigung vor der Anlage vorhanden sein muss.

Nicht erlaubt ist:

- `UNIVERSAARL-DE ist angelegt`,
- `die Company ist leer`,
- `die Company enthaelt nur Setupdaten`,
- `die Datenbasis ist deutsch final`,
- `die spaetere Buchungsstrecke ist bereits bewiesen`.

## PREP-026 W0/W1 Claim-Regel

Fuer die ersten Universaarl-Wellen werden Saetze in zwei Ebenen getrennt:

1. Produkt-/Setup-Satz mit Microsoft-Learn-Quelle.
2. Universaarl-Satz mit eigener `playthru`-Evidence.

Beispiele:

| Satz | Claim-Klasse | Erlaubt jetzt? | Warum |
| --- | --- | --- | --- |
| Eine Company enthaelt Geschaeftsdaten einer Einheit. | Produktclaim | ja | Microsoft Learn `Create new companies` |
| Fuer neue Companies kann SUPER noetig sein. | Produkt-/Permission-Claim | ja | Microsoft Learn `Create new companies` |
| `UNIVERSAARL-DE` steht in der Mandantenliste. | Evidence-Claim | nein | erst nach read-only oder Create-Evidence |
| `Production - Setup Data Only` ist eine setupnahe Option ohne Sampledaten. | Produktclaim | ja | Microsoft Learn `Create new companies` |
| Universaarl wurde mit `Production - Setup Data Only` angelegt. | Evidence-Claim | nein | erst nach sichtbarer Auswahl und Erfolg |
| Nummernserien helfen Datensaetze, Konten, Belege und Journalzeilen eindeutig zu identifizieren. | Produkt-/Setupclaim | ja | Microsoft Learn `Create number series` |
| Die Universaarl-Verkaufsrechnung bekommt Nummer `...`. | Evidence-Claim | nein | erst nach konkretem Beleg |
| In den Nr.-Serienzeilen werden Startdatum, Startnummer und Endnummer gepflegt. | Produkt-/Setupclaim | ja | Microsoft Learn `Create number series`; konkrete Universaarl-Werte brauchen TARGET-016I |
| `U-CUST00001` ist als Startnummer fuer Universaarl gespeichert. | Evidence-Claim | nein | erst nach sichtbarem Reopen-Proof in `UNIVERSAARL-DE` |
| Posting Groups steuern Kontenfindung. | Produkt-/Setupclaim | ja | Microsoft Learn `Posting group setup` |
| Ein Universaarl-Beleg bucht auf Konto `...`. | Setup-/Posting-Wirkung | nein | erst nach Preview/Posting/Entries |
| VAT Setup kombiniert VAT Business und Product Posting Groups. | Produkt-/Setupclaim | ja | Microsoft Learn `Set up VAT` |
| Deutsche 19 Prozent USt ist eingerichtet. | Rechts-/Steuer- plus Evidence-Claim | nein | amtliche Quelle plus Universaarl-Setup/Preview/VAT Entries |
| Dimensionen kategorisieren Entries und unterstuetzen Analyse. | Produkt-/Setupclaim | ja | Microsoft Learn `Work with dimensions` |
| Universaarl-Posten enthalten `PRODUCTLINE`. | Evidence-Claim | nein | erst nach Beleg-/Entry-Trace |

## PREP-036 W1 Foundation Gate

PREP-036 ist eine Ausfuehrungsregel fuer den ersten Lauf nach der Rechtefreigabe, kein Business-Central-Nachweis. Als Planungs- und Buchstrukturclaim ist erlaubt: Company Creation kommt vor Company Information, Company Information kommt vor Foundation Setup, und Nummernserien, Buchungsgruppen, USt-Setup und Dimensionen kommen vor ersten Belegen, Preview oder Posting.

Ohne spaetere Universaarl-Evidence duerfen daraus keine Live-Claims abgeleitet werden: `UNIVERSAARL-DE` ist noch nicht erstellt, Company Information ist nicht gespeichert, Nummernserien/Buchungsgruppen/USt/Dimensionen sind nicht eingerichtet, Preview/Post ist nicht freigegeben und deutsche 19-Prozent-USt ist nicht final bewiesen. Die Detailregel steht in `playwright/projects/fibu-book5/UNIVERSAARL-W1-FOUNDATION-READINESS-GATE.md`.

## PREP-038 Company Information Gate

Microsoft Learn stuetzt die allgemeine Aussage, dass Company Information zum Grundsetup gehoert und dass die angezeigten Felder/FastTabs je Land/Region variieren koennen. Daraus darf das Buch allgemein erklaeren, warum Unternehmensdaten direkt nach der Company-Anlage geprueft werden.

Nicht erlaubt ohne spaetere Universaarl-Evidence sind konkrete Aussagen wie: `UNIVERSAARL-DE` ist aktiv, `Universaarl GmbH` ist gespeichert, ein bestimmtes Feld ist sichtbar/pflichtig, eine Adresse oder USt-ID ist gepflegt oder ein Screenshot zeigt den finalen Zielzustand. TARGET-COMPANY-INFO-001 muss zuerst read-only Page/Feld/FastTab-Kontext liefern; TARGET-COMPANY-INFO-002 darf erst danach kontrolliert speichern.
