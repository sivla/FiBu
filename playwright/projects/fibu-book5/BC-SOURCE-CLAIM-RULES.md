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

- Die direkte Mandanten-Listenzeile ist kein bevorzugter Buchpfad.
- Der bevorzugte Buchpfad ist die offizielle Create-New-Company-/Assisted-Setup-Route.
- `Kopieren`, CRONUS und `Testunternehmen` sind keine finale Universaarl-Basis, solange Datenwirkung und Demodatenfreiheit nicht belegt sind.
- Ein Privacy-/Personal-Data-Hinweis auf der Mandantenliste ist ein fachlicher Stop-/Erklaerpunkt, nicht nur UI-Rauschen.
