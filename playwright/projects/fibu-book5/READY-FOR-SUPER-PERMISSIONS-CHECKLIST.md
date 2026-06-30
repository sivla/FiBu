# Ready for Super Permissions Checklist

Diese Checkliste wird verwendet, sobald der Nutzer bestaetigt, dass ausreichende Rechte fuer Company Creation vorhanden sind.

Sie ist kein Freifahrtschein fuer einen sofortigen Live-Klick. Sie ist die Stoppliste fuer den ersten Lauf nach der Rechtefreigabe. Wenn ein Punkt nicht eindeutig erfuellt ist, bleibt `TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE` geparkt.

Kompakter Ablauf fuer diesen Moment: `UNIVERSAARL-SUPER-PERMISSION-RESUME-RUNBOOK.md`.

## Freigabe durch den Nutzer

- Der Nutzer bestaetigt ausdruecklich, dass SUPER-Rechte oder ausreichende Rechte fuer Company Creation vorhanden sind.
- Die Bestaetigung ist aktuell fuer die Instanz `playthru`.
- Es gibt keine Aufforderung, in eine andere Instanz oder Produktivumgebung zu wechseln.
- Der Autopilot fuehrt vor dem Live-Lauf erneut `git status --short`, `git pull --ff-only`, `npm run agent:preflight`, `npm run agent:context`, `npm run agent:dry-run` und `npm run agent:run-plan` aus.
- Die Smart Decision Card nennt `TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE` als ausgewaehlten Case.
- Das Resume-Runbook ist gelesen und wird als primaerer Ablauf verwendet.

## Vor dem erneuten Live-Lauf

- Branch ist sauber und aktuell.
- Aktiver State zeigt `playthru`.
- `TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE` ist der zu reaktivierende Case.
- Permission Blocker steht noch auf `parked-until-super-permissions`.
- Der Nutzer hat SUPER oder ausreichende Company-Creation-Rechte bestaetigt.
- Es wird keine API-Abkuerzung genutzt.
- Es wird keine CRONUS-Kopie genutzt.
- Es wird kein Testunternehmen als Zielbasis genutzt.
- Es wird keine direkte leere Listenzeile gespeichert, wenn eigentlich der gefuehrte Pfad `Neues Unternehmen erstellen` gemeint ist.
- Es wird kein Wizard-Finish bestaetigt, wenn Datenbasis oder Wirkung unklar sind.
- OQ-0001, OQ-0005 und OQ-0007 aus `.agent/state/open_questions_register.json` sind gelesen.

## Vor dem Klick in Business Central

- URL enthaelt `playthru`.
- Seite `Mandanten` ist sichtbar.
- `UNIVERSAARL-DE` ist noch nicht in der Liste sichtbar.
- Der Hauptbutton `Neu`, der Dropdown-Pfeil und `Neues Unternehmen erstellen` sind durch Tooltip oder Screenshot auseinandergehalten.
- Screenshot-QA ist vorbereitet: Das Bild muss zeigen, was fuer die Entscheidung wichtig ist.
- Zuerst ueber dem Hauptbutton `Neu` hovern und Tooltip/Accessible Name notieren.
- Danach ueber dem Pfeil neben `Neu` hovern und Tooltip/Accessible Name notieren.
- Wenn `Neues Unternehmen erstellen` im Dropdown gewaehlt werden soll, muss das Dropdown sichtbar offen sein und der Menueintrag selbst im Screenshot lesbar sein.
- Der Klick wird auf den Menueintrag `Neues Unternehmen erstellen` ausgefuehrt, nicht auf den Hauptbutton `Neu`, wenn der gefuehrte Assistent Ziel des Cases ist.
- Nach dem Klick muss sichtbar sein, ob ein Assistent, Dialog oder eine neue Listenzeile geoeffnet wurde.
- Nach dem Klick muss der sichtbare Zielzustand zur gewaehlten Aktion passen. Eine leere Mandantenzeile ist nicht automatisch der gefuehrte `Neues Unternehmen erstellen`-Wizard.
- Wenn der Zielzustand nicht passt, den Pfad als `rejected-path` dokumentieren und nicht weiter Werte eingeben.

## Datenbasis-Entscheidung

- Wenn Business Central zwischen `No Data`, `Setup Data Only`, `Sample Data`, `Copy Company`, `Testunternehmen` oder aehnlichen Optionen unterscheidet, wird keine Option bestaetigt, bevor sie im Screenshot und Result JSON dokumentiert ist.
- Bevorzugt ist eine saubere Zielbasis ohne Demo-Stammdaten: `No Data` oder `Setup Data Only`, wenn die UI diese Bedeutung eindeutig zeigt.
- `Sample Data`, `Testunternehmen`, `CRONUS` und `Copy Company` sind fuer die finale Universaarl-Musterfirma nicht automatisch geeignet.
- Wenn nur Demo-/Testdatenrouten sichtbar sind, wird der Lauf blockiert und nicht als Company-Creation-Erfolg markiert.
- Wenn die Datenbasis nicht sichtbar oder sprachlich unklar ist, wird nicht auf `Fertig stellen`, `Finish`, `OK`, `Ja` oder `Create` geklickt.

## Beim Anlegen

- Nur die sichtbare UI-first Route verwenden.
- Fokus in der Vordergrund-ListPart-/Namenszelle nachweisen.
- `UNIVERSAARL-DE` als Name verwenden.
- `Universaarl GmbH` als Anzeigename verwenden, wenn das Feld sichtbar und sinnvoll ist.
- Bei Fehlermeldung sofort stoppen und Fehlermeldung sichern.
- Bei Speichern die Mandantenliste erneut pruefen.
- Bei erfolgreicher sichtbarer Anlage wird ein neuer Screenshot der Mandantenliste erzeugt, auf dem `UNIVERSAARL-DE` lesbar ist.
- Wenn ein Wizard nur teilweise ausgefuellt ist, wird kein Draft/halbfertiger Zustand als Erfolg gewertet.

## Erfolgskriterium

Der Schritt ist erst erfolgreich, wenn `UNIVERSAARL-DE` sichtbar als eigene Company in der Mandantenliste steht.

## Danach

1. Permission Blocker auf `resolved` setzen.
2. Company Context beweisen.
3. In `UNIVERSAARL-DE` wechseln, nur wenn der Case es erlaubt.
4. Company Information pruefen.
5. Datenbasis pruefen: keine ungewollten Demodaten.
6. Foundation Setup planen.
7. Erst nach Company Context und Datenbasispruefung duerfen Foundation Setup, Stammdaten, Preview Posting oder Posting eigene Cases bekommen.

## Harte Stopps

- `UNIVERSAARL-DE` ist nach dem Versuch nicht sichtbar.
- Business Central zeigt eine Berechtigungs- oder Speicherfehlermeldung.
- Die Aktion wuerde eine Kopie aus CRONUS oder einer Democompany erzeugen.
- Die Datenbasis ist unklar.
- Ein Dialog fragt nach Abschluss/Fertigstellen, ohne dass Wirkung und Datenbasis verstanden sind.
- Der sichtbare Zielzustand passt nicht zur beabsichtigten Aktion.
- `UNIVERSAARL-DE` existiert bereits, aber Herkunft, Datenbasis oder Inhalt sind unklar.
- Die URL, Seite oder Instanz zeigt nicht eindeutig `playthru`.
