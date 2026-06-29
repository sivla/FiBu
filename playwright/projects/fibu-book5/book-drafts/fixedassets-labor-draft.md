# Kapitel 21 Labor-Draft: Anlagenzugang und AfA in RM-DEMO

Status: `labor-draft`, `labor-sufficient-for-book-draft`, `needs-german-final-rebuild`.

Umgebung: `MCP_1_20260210 / RM-DEMO`.

Dieser Abschnitt ist ein Labor- und Vorproduktionsentwurf fuer das Buch. Er darf erklaeren, was im Business-Central-Labor praktisch beobachtet wurde. Er ist kein finaler deutscher Nachweis. Alle finalen Screenshots, deutschen Konten, deutschen Steuer-/USt-Aussagen und finalen Buchclaims muessen spaeter in einer deutschen Zielinstanz neu erzeugt werden.

## Was ist eine Anlage in Business Central?

Eine Anlage ist ein langfristig genutztes Wirtschaftsgut, zum Beispiel eine CNC-Maschine. In Business Central ist eine Anlage nicht nur ein Sachkonto. Sie braucht eine eigene Anlagenkarte, ein AfA-Buch, eine Anlagenbuchungsgruppe und spaeter Anlagenposten. Erst dadurch kann Business Central getrennt verfolgen:

- welche Anlage angeschafft wurde,
- welches AfA-Buch gilt,
- welche Buchungsart vorliegt, zum Beispiel Anschaffungskosten oder Abschreibung,
- welche Sachkonten im Hauptbuch betroffen sind,
- welcher Buchwert nach Zugang und AfA uebrig bleibt.

Anfaengerfehler: Wenn man nur ein Sachkonto bebucht, sieht man zwar Sachposten, aber keine saubere Anlagenhistorie. Fuer Anlagen muss der Nachweis immer Nebenbuch und Hauptbuch verbinden.

## Die wichtigsten Bausteine im Laborfall

| Baustein | Laborwert | Bedeutung fuer Anfaenger |
|---|---|---|
| Fixed Asset Card | `FA-CNC-01` | Stammdatenkarte der Maschine. Hier stehen Beschreibung, AfA-Buch, Buchungsgruppe, Nutzungsdauer und Buchwertsignale. |
| Depreciation Book | `HGB` | Regelwerk fuer Anlagenwerte und AfA im Labor. Im Buch darf das als Labor-AfA-Buch erklaert werden, aber nicht als deutscher HGB-Endnachweis. |
| FA Posting Group | `MACHINES` | Kontenfindung fuer Anlagenzugang, AfA, Abgang und Buchwert. Das ist keine Maschinenbeschreibung, sondern Setup fuer Sachkonten. |
| FA G/L Journal | `Fixed Asset G/L Journals` | Journalweg fuer Anlagenbuchungen im Labor. Hier wurde der Zugang `G05001` verfolgt. |
| G/L Entries | Sachposten | Hauptbuchsicht: Welche Sachkonten wurden getroffen, zum Beispiel Labor-Konten `82000` und `12210`. |
| FA Ledger Entries | Anlagenposten | Nebenbuchsicht: Welche Anlage, welches AfA-Buch und welcher Anlagenbuchungstyp betroffen sind. |

## Was wurde im Labor bewiesen?

Im Labor wurde der Anlagenzugang fuer `FA-CNC-01` ueber das Fixed Asset G/L Journal praktisch verfolgt.

Belegte Laborpunkte:

- `FA-CNC-01` existiert als Anlagenobjekt im Labor.
- `HGB` ist als AfA-Buch in der Laborstrecke verwendet.
- `MACHINES` ist als Anlagenbuchungsgruppe/Kontenfindung fuer die Maschine verwendet.
- Der Zugang wurde mit Beleg `G05001` als Laborbuchung nachvollzogen.
- Preview Posting zeigte vor der Buchung G/L-Entry- und FA-Ledger-Entry-Details.
- Nach der Buchung sind Sachposten mit Kontensignalen `82000` und `12210` und Betragssignal `120.000,00` belegt.
- Anlagenposten sind ueber die gebuchten FA Ledger Entries sichtbar; relevante Signale sind `FA-CNC-01`, `G05001`, `HGB`, `Acquisition Cost` und Betragssignal.

Wichtige Trennung fuer das Buch:

- Sachposten beantworten: Welche Hauptbuchkonten wurden getroffen?
- Anlagenposten beantworten: Welche Anlage und welches AfA-Buch wurden im Nebenbuch getroffen?
- Preview Posting ist ein Vorab-Nachweis, aber nicht dasselbe wie gebuchte Posten.
- Page `5606` war ein leerer/rejected Preview-Pfad; gebuchte Anlagenposten wurden ueber Page `5604` sinnvoller nachgewiesen.

## Grundsaetzlich verstandene Klickfolge

Labor-Clickguide als Buchentwurf:

1. `Anlagen (Fixed Assets)` oeffnen.
2. Anlage `FA-CNC-01` oeffnen oder anlegen.
3. Auf der Anlagenkarte pruefen: AfA-Buch `HGB`, Anlagenbuchungsgruppe `MACHINES`, Nutzungsdauer und Buchwertsignale.
4. Vor einer Buchung die Anlagenbuchungsgruppe pruefen. Sie entscheidet ueber Sachkonten, nicht ueber den Namen der Maschine.
5. Zugang ueber einen Anlagenbeleg oder ein Anlagenjournal vorbereiten.
6. Vor dem Buchen `Preview Posting` nutzen und pruefen, ob sowohl Sachposten als auch Anlagenposten simuliert werden.
7. Nach einer kontrollierten Laborbuchung Sachposten und Anlagenposten getrennt oeffnen.
8. Sachposten auf Konto und Betrag pruefen.
9. Anlagenposten auf Anlage, AfA-Buch, Anlagenbuchungstyp und Betrag pruefen.
10. Erst danach AfA/Calculate Depreciation als naechsten Prozess betrachten.

Dieser Klickpfad ist im Labor ausreichend verstanden, um einen markierten Labor-Buchdraft zu schreiben. Er ist noch kein finaler deutscher Clickguide.

## Calculate Depreciation / AfA: aktueller Laborblock

Die AfA-Strecke ist noch nicht als erfolgreicher AfA-Journal- oder AfA-Buchungsprozess bewiesen.

In `FIXEDASSETS-291` wurde die Request Page `Calculate Depreciation` praktisch geoeffnet. Sichtbar bewiesen wurden:

- Depreciation Book: `HGB`
- Posting Date: `31.01.2027`
- Document No.: `FADEP-291-OK`
- Fixed Asset Filter: `FA-CNC-01`
- `OK` wurde genau einmal bestaetigt.

Danach wurde im Fixed Asset G/L Journal gesucht. Ergebnis:

- `FADEP-291-OK` wurde nicht sichtbar gefunden.
- Es wurde keine AfA-Journalzeile bewiesen.
- Es wurde kein Preview Posting ausgefuehrt.
- Es wurde keine AfA gebucht.

In `FIXEDASSETS-295` wurde der gleiche OK-only-Pfad mit frischer Belegnummer `FADEP-295-OK` wiederholt. Auch diese Belegnummer war danach im geprueften Fixed Asset G/L Journal nicht sichtbar. `FIXEDASSETS-296` bewertet das als Stoppsignal: Der Prozess wird in `RM-DEMO` geparkt, bis eine neue Ursache oder ein neuer UI-/Setup-Pfad belegt ist.

`FIXEDASSETS-297` grenzt den Blocker weiter ein: Fuer den alten Beleg `FADEP-267-OK` ist ein plausibles Datumsproblem bewiesen, weil `30.06.2026` vor dem Zugang `01.01.2027` lag. Das erklaert aber nicht automatisch den spaeteren Lauf `FADEP-295-OK`; dort ist die exakte Ursache weiterhin offen. Deshalb bleibt die Regel: kein weiterer Calculate-Depreciation-OK, kein Preview Posting und keine AfA-Buchung, solange keine neue, nicht wiederholte Hypothese den Ausgabekontext oder die AfA-Berechtigung feldsicher erklaert.

Anfaenger-Lernpunkt: `OK` auf der `Calculate Depreciation` Request Page bedeutet nicht automatisch, dass eine sichtbare Journalzeile erzeugt wurde. `OK` startet nur den Batch-/Berechnungslauf. Danach muss man pruefen, ob und wo Business Central eine Journalzeile erzeugt hat. Wenn keine Zeile sichtbar ist, darf man nicht blind erneut `OK` klicken. Nach zwei kontrollierten OK-Laeufen ohne sichtbare Zeile gilt erst recht: kein Preview Posting, keine Buchung, erst Ursache klaeren. Man prueft Datum, AfA-Faelligkeit, Restbuchwert, AfA-Buch, Journal Template, Batch, Filter und Ausgabeziel.

Klassifikation fuer das Buch:

- Anlagenzugang: `labor-proven`, `labor-sufficient-for-book-draft`, `needs-german-final-rebuild`.
- AfA/Calculate Depreciation: `labor-blocked`, `labor-sufficient-for-book-draft`, `needs-german-final-rebuild`.
- FA-296/297: `labor-blocked` und `labor-sufficient-for-book-draft`, weil der Blocker als Anfaenger-Lernpunkt ins Buch gehoert.

## Was muss spaeter deutsch/final neu gemacht werden?

In der deutschen Zielinstanz muessen diese Punkte neu erzeugt und gescreenshottet werden:

- deutsche Anlagenkarte fuer die Zielanlage,
- deutsches AfA-Buch bzw. Ziel-AfA-Setup,
- deutsche Anlagenbuchungsgruppe und deutsche Sachkontenfindung,
- Zugang mit deutschem Zielbeleg oder Zieljournal,
- Preview Posting mit deutschen UI-Labels,
- gebuchte Sachposten,
- gebuchte Anlagenposten,
- AfA-Berechnung mit sichtbarer Journalzeile,
- Preview Posting fuer AfA,
- gebuchte AfA-Posten,
- Kontrollbericht/Anlagenspiegel,
- deutsche Steuer-/Konten-/Abschlusswirkung nur nach echter deutscher Evidence.

Nicht aus dem Labor uebernehmen:

- keine finalen deutschen Kontenclaims aus `82000`/`12210`,
- keine finale HGB-Behauptung aus dem Labor-Code `HGB`,
- keine steuerliche Aussage,
- keine finalen Screenshots aus `RM-DEMO`.

## Evidence-Anker

- `playwright/projects/fibu-book5/evidence/fixedassets-225/FIXEDASSETS-225-decision.md`
- `playwright/projects/fibu-book5/evidence/fixedassets-227/FIXEDASSETS-227-POSTED-TRACE.md`
- `playwright/projects/fibu-book5/evidence/fixedassets-229/FIXEDASSETS-229-DEPRECIATION-READINESS.md`
- `playwright/projects/fibu-book5/evidence/fixedassets-231/FIXEDASSETS-231-HGB-INTEGRATION-VALUE-PROOF.md`
- `playwright/projects/fibu-book5/evidence/fixedassets-291/FIXEDASSETS-291-result.json`
- `.agent/state/cases/fixedassets-292-fa-depreciation-ok-result-blocker-review.json`
