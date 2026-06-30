# Business Central Implementation Best Practices

Diese Datei sammelt Projekt- und Testprinzipien fuer das Universaarl-Buch. Best Practice ist keine gesetzliche Pflicht. Sie wird im Buch als Vorgehensmodell erklaert und erst durch Universaarl-Evidence zu einem konkreten Klick- oder Prozessnachweis.

## Quellen

- [Dynamics 365 Implementation Guide](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/overview)
- [Success by Design](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/success-by-design)
- [Testing strategy](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/testing-strategy)
- [Prepare to go live](https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/prepare-to-go-live)

## Unterscheidung im Buch

| Aussage | Bedeutung | Beweis |
| --- | --- | --- |
| Standardfunktion | Business Central bietet diese Funktion an. | Microsoft Learn |
| Best Practice | Microsoft oder Projekterfahrung empfiehlt dieses Vorgehen. | Implementation Guide / Success by Design |
| Projektentscheidung | Fuer Universaarl wird dieser Weg gewaehlt. | Decision Card, Bucherklaerung, Evidence |
| Rechts-/Steuerpflicht | Gesetzliche oder amtliche Vorgabe. | Amtliche Quelle |
| UI-Beobachtung | Diese Page, Action oder Fehlermeldung wurde gesehen. | Screenshot, Result JSON, Atlas |
| Universaarl-Evidence | Dieser Prozess wurde in `playthru` / `UNIVERSAARL-DE` bewiesen. | Evidence Pack, Screenshots, Entries |

## Environment Strategy

Universaarl nutzt `playthru` als aktive Zielinstanz. `UNIVERSAARL-DE` wird die eigene Buchcompany, sobald die erforderlichen Rechte vorhanden sind. Alte RM-DEMO- und CRONUS-Bezuege bleiben historische Laborquellen, aber keine aktive Zielwahrheit.

## Teststrategie

Jeder Buchprozess wird als UAT-faehiger Fall aufgebaut:

1. Ziel des Prozesses.
2. Setup-Voraussetzungen.
3. Stammdaten.
4. Eingabebeleg oder Journal.
5. Kontrollpunkt vor wirksamer Aktion.
6. Preview oder Check, wenn verfuegbar und sinnvoll.
7. Posting oder Prozessabschluss.
8. Postenspur.
9. Fehler- und Korrekturweg.
10. Buchtext fuer Anfaenger.

## Entry Criteria

Ein Prozess darf erst ausgefuehrt werden, wenn:

- die richtige Instanz sichtbar ist,
- die richtige Company sichtbar ist,
- Berechtigungen vorhanden sind,
- Setup-Voraussetzungen bekannt sind,
- Datenbasis und Zweck dokumentiert sind,
- riskante Buttons verstanden sind,
- Screenshot-QA sinnvoll vorbereitet ist.

## Exit Criteria

Ein Prozess gilt erst als belastbar, wenn:

- der Zielbeleg oder Datensatz sichtbar ist,
- relevante Posten oder Folgeobjekte sichtbar sind,
- Screenshots fachlich erklaerbar sind,
- Result JSON und Evidence-README nicht uebertreiben,
- Buchtext keine Agenten-Meta enthaelt,
- offene Grenzen als Grenzen markiert sind.

## PREP-008 Claim Boundary

Implementation Guide, Success by Design, Testing Strategy und Prepare to go-live liefern die Projektlogik: warum ein Prozess Entry Criteria, Exit Criteria, Testplan, Rollen, Abnahme und Cutover braucht. Sie beweisen aber keine konkrete Business-Central-Seite, keinen Button, kein Feld und keinen Universaarl-Beleg.

Fuer das Buch gilt deshalb:

- Projekt- und UAT-Kapitel duerfen sich auf diese Quellen stuetzen.
- Klickanleitungen brauchen weiterhin eigene Universaarl-Evidence.
- Ein Go-live- oder Testplan-Hinweis darf nicht so klingen, als sei der Prozess bereits in `UNIVERSAARL-DE` gebucht.
- Bei Company Creation bleibt der Implementation Guide nur die methodische Klammer; die Datenbasis der neuen Company muss spaeter in `playthru` sichtbar belegt werden.

## Defect Tracking

Ein Blocker ist kein Scheitern, wenn er sauber eingeordnet wird:

- Berechtigungsblocker
- UI-/Fokusblocker
- Setupblocker
- Datenblocker
- Quellenblocker
- Fachlicher Widerspruch
- Screenshot unbrauchbar

Jeder Blocker braucht den naechsten sinnvollen Schritt. Blindes Wiederholen derselben Aktion ist kein Fortschritt.

## Playwright als UAT-Werkzeug

Playwright soll Business Central nicht austricksen. Es soll wiederholbar zeigen, was ein Anwender sieht:

- Page Context
- Company Context
- sichtbare Actions
- Tooltips
- Dialoge
- Pflichtfelder
- sichere und riskante Buttons
- Screenshots mit fachlicher Aussage
- Posten und Folgeobjekte nach Buchung

## PREP-027 Universaarl Mapping

`PREP-027-IMPLEMENTATION-GUIDE-BEST-PRACTICE-MAPPING` verbindet die Implementation-Guide-Quellen mit der aktiven Universaarl-Arbeit:

| Prinzip | Universaarl-Regel | Folge |
| --- | --- | --- |
| Process-focused solution | Buch und Testfaelle werden nach Geschaeftsprozessen geschnitten, nicht nur nach Menues. | `BC-FULL-PLAYTHROUGH-CATALOG.md` bleibt der Prozesskompass. |
| Fit-to-standard / Fit-gap | Standardweg zuerst pruefen; Abweichung nur mit Grund, Risiko, Alternative und Test. | Jeder spaetere Custom-/Workaround-Claim braucht Decision Card und Evidence. |
| Testing strategy | Testen wird geplant, bevor Prozessdaten erzeugt werden. | `PREP-028` baut daraus die UAT-/Testmatrix. |
| Test plan | Testfaelle brauchen Scope, Rolle, Umgebung, Daten, erwartetes Ergebnis und Ergebnisstatus. | Ein Buchprozess ist nicht fertig, wenn nur ein Screenshot existiert. |
| Test types | Unit-/Process-/End-to-End-/UAT-Denken wird getrennt. | Playwright-Read-only-Probes sind keine bestandenen UATs. |

Die Detailzuordnung steht in `UNIVERSAARL-IMPLEMENTATION-GUIDE-MAPPING.md`.

## Buch als Schulungs- und UAT-Artefakt

Das Buch ist nicht nur Dokumentation. Es fuehrt Anfaenger durch Business Central und erzeugt gleichzeitig pruefbare UAT-Faelle. Jeder gute Abschnitt beantwortet:

- Welche Seite sehe ich?
- Warum brauche ich sie?
- Welche Felder sind wichtig?
- Welche Aktionen aendern Daten?
- Woran erkenne ich Erfolg?
- Welche typischen Fehler koennen auftreten?
- Wie korrigiere ich sie?
