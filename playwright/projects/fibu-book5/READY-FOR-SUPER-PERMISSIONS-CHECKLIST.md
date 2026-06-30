# Ready for Super Permissions Checklist

Diese Checkliste wird verwendet, sobald der Nutzer bestätigt, dass ausreichende Rechte für Company Creation vorhanden sind.

Sie ist kein Freifahrtschein für einen sofortigen Live-Klick. Sie ist die Stoppliste für den ersten Lauf nach der Rechtefreigabe. Wenn ein Punkt nicht eindeutig erfüllt ist, bleibt `TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE` geparkt.

Kompakter Ablauf für diesen Moment: `UNIVERSAARL-SUPER-PERMISSION-RESUME-RUNBOOK.md`.

## Freigabe durch den Nutzer

- Der Nutzer bestätigt ausdrücklich, dass SUPER-Rechte oder ausreichende Rechte für Company Creation vorhanden sind.
- Die Bestätigung ist aktuell für die Instanz `playthru`.
- Es gibt keine Aufforderung, in eine andere Instanz oder Produktivumgebung zu wechseln.
- Der Autopilot führt vor dem Live-Lauf erneut `git status --short`, `git pull --ff-only`, `npm run agent:preflight`, `npm run agent:context`, `npm run agent:dry-run` und `npm run agent:run-plan` aus.
- Die Smart Decision Card nennt `TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE` als ausgewählten Case.
- Das Resume-Runbook ist gelesen und wird als primärer Ablauf verwendet.

## Vor dem erneuten Live-Lauf

- Branch ist sauber und aktuell.
- Aktiver State zeigt `playthru`.
- `TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE` ist der zu reaktivierende Case.
- Permission Blocker steht noch auf `parked-until-super-permissions`.
- Der Nutzer hat SUPER oder ausreichende Company-Creation-Rechte bestätigt.
- Es wird keine API-Abkürzung genutzt.
- Es wird keine CRONUS-Kopie genutzt.
- Es wird kein Testunternehmen als Zielbasis genutzt.
- Es wird keine direkte leere Listenzeile gespeichert, wenn eigentlich der geführte Pfad `Neues Unternehmen erstellen` gemeint ist.
- Es wird kein Wizard-Finish bestätigt, wenn Datenbasis oder Wirkung unklar sind.
- OQ-0001, OQ-0005 und OQ-0007 aus `.agent/state/open_questions_register.json` sind gelesen.

## Vor dem Klick in Business Central

- URL enthält `playthru`.
- Seite `Mandanten` ist sichtbar.
- `UNIVERSAARL-DE` ist noch nicht in der Liste sichtbar.
- Der Hauptbutton `Neu`, der Dropdown-Pfeil und `Neues Unternehmen erstellen` sind durch Tooltip oder Screenshot auseinandergehalten.
- Die Zielroute ist ausdrücklich: Pfeil neben `Neu` -> `Neues Unternehmen erstellen`.
- Der Hauptbutton `Neu` ist für diesen Resume-Lauf nicht der Zielklick.
- Screenshot-QA ist vorbereitet: Das Bild muss zeigen, was für die Entscheidung wichtig ist.
- Zuerst über dem Hauptbutton `Neu` hovern und Tooltip/Accessible Name notieren.
- Danach über dem Pfeil neben `Neu` hovern und Tooltip/Accessible Name notieren.
- Wenn `Neues Unternehmen erstellen` im Dropdown gewählt werden soll, muss das Dropdown sichtbar offen sein und der Menüeintrag selbst im Screenshot lesbar sein.
- Der Klick wird auf den Menüeintrag `Neues Unternehmen erstellen` ausgeführt, nicht auf den Hauptbutton `Neu`.
- Nach dem Klick muss sichtbar sein, ob ein Assistent, Dialog oder eine neue Listenzeile geöffnet wurde.
- Nach dem Klick muss der sichtbare Zielzustand zur gewählten Aktion passen. Eine leere Mandantenzeile ist nicht automatisch der geführte `Neues Unternehmen erstellen`-Wizard.
- Wenn der Zielzustand nicht passt, den Pfad als `rejected-path` dokumentieren und nicht weiter Werte eingeben.
- Die vollständige Screenshot-Kette aus `UNIVERSAARL-COMPANY-CREATION-SCREENSHOT-QA-GATE.md` ist vorbereitet.

## Datenbasis-Entscheidung

- Wenn Business Central zwischen `No Data`, `Setup Data Only`, `Sample Data`, `Copy Company`, `Testunternehmen` oder ähnlichen Optionen unterscheidet, wird keine Option bestätigt, bevor sie im Screenshot und Result JSON dokumentiert ist.
- Bevorzugt ist eine saubere Zielbasis ohne Demo-Stammdaten: `No Data` oder `Setup Data Only`, wenn die UI diese Bedeutung eindeutig zeigt.
- `Sample Data`, `Testunternehmen`, `CRONUS` und `Copy Company` sind für die finale Universaarl-Musterfirma nicht automatisch geeignet.
- Wenn nur Demo-/Testdatenrouten sichtbar sind, wird der Lauf blockiert und nicht als Company-Creation-Erfolg markiert.
- Wenn die Datenbasis nicht sichtbar oder sprachlich unklar ist, wird nicht auf `Fertig stellen`, `Finish`, `OK`, `Ja` oder `Create` geklickt.

## Beim Anlegen

- Nur die sichtbare UI-first Route verwenden.
- Fokus in der Vordergrund-ListPart-/Namenszelle nachweisen.
- `UNIVERSAARL-DE` als Name verwenden.
- `Universaarl GmbH` als Anzeigename verwenden, wenn das Feld sichtbar und sinnvoll ist.
- Bei Fehlermeldung sofort stoppen und Fehlermeldung sichern.
- Bei Speichern die Mandantenliste erneut prüfen.
- Bei erfolgreicher sichtbarer Anlage wird ein neuer Screenshot der Mandantenliste erzeugt, auf dem `UNIVERSAARL-DE` lesbar ist.
- Wenn ein Wizard nur teilweise ausgefüllt ist, wird kein Draft/halbfertiger Zustand als Erfolg gewertet.

## Erfolgskriterium

Der Schritt ist erst erfolgreich, wenn `UNIVERSAARL-DE` sichtbar als eigene Company in der Mandantenliste steht.

## Danach

1. Permission Blocker auf `resolved` setzen.
2. Company Context beweisen.
3. In `UNIVERSAARL-DE` wechseln, nur wenn der Case es erlaubt.
4. Company Information prüfen.
5. Datenbasis prüfen: keine ungewollten Demodaten.
6. Foundation Setup planen.
7. Erst nach Company Context und Datenbasisprüfung dürfen Foundation Setup, Stammdaten, Preview Posting oder Posting eigene Cases bekommen.

## Harte Stopps

- `UNIVERSAARL-DE` ist nach dem Versuch nicht sichtbar.
- Business Central zeigt eine Berechtigungs- oder Speicherfehlermeldung.
- Die Aktion würde eine Kopie aus CRONUS oder einer Democompany erzeugen.
- Die Datenbasis ist unklar.
- Ein Dialog fragt nach Abschluss/Fertigstellen, ohne dass Wirkung und Datenbasis verstanden sind.
- Der sichtbare Zielzustand passt nicht zur beabsichtigten Aktion.
- `UNIVERSAARL-DE` existiert bereits, aber Herkunft, Datenbasis oder Inhalt sind unklar.
- Die URL, Seite oder Instanz zeigt nicht eindeutig `playthru`.
