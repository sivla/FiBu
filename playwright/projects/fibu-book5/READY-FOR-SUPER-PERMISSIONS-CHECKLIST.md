# Ready for Super Permissions Checklist

Diese Checkliste wird verwendet, sobald der Nutzer bestaetigt, dass ausreichende Rechte fuer Company Creation vorhanden sind.

## Vor dem erneuten Live-Lauf

- Branch ist sauber und aktuell.
- Aktiver State zeigt `playthru`.
- `TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE` ist der zu reaktivierende Case.
- Permission Blocker steht noch auf `parked-until-super-permissions`.
- Der Nutzer hat SUPER oder ausreichende Company-Creation-Rechte bestaetigt.
- Es wird keine API-Abkuerzung genutzt.
- Es wird keine CRONUS-Kopie genutzt.
- Es wird kein Testunternehmen als Zielbasis genutzt.
- Es wird kein Wizard-Finish bestaetigt, wenn Datenbasis oder Wirkung unklar sind.

## Vor dem Klick in Business Central

- URL enthaelt `playthru`.
- Seite `Mandanten` ist sichtbar.
- `UNIVERSAARL-DE` ist noch nicht in der Liste sichtbar.
- Der Hauptbutton `Neu`, der Dropdown-Pfeil und `Neues Unternehmen erstellen` sind durch Tooltip oder Screenshot auseinandergehalten.
- Screenshot-QA ist vorbereitet: Das Bild muss zeigen, was fuer die Entscheidung wichtig ist.
- Zuerst ueber dem Hauptbutton `Neu` hovern und Tooltip/Accessible Name notieren.
- Danach ueber dem Pfeil neben `Neu` hovern und Tooltip/Accessible Name notieren.
- Wenn `Neues Unternehmen erstellen` im Dropdown gewaehlt werden soll, muss das Dropdown sichtbar offen sein und der Menueintrag selbst im Screenshot lesbar sein.
- Nach dem Klick muss der sichtbare Zielzustand zur gewaehlten Aktion passen. Eine leere Mandantenzeile ist nicht automatisch der gefuehrte `Neues Unternehmen erstellen`-Wizard.
- Wenn der Zielzustand nicht passt, den Pfad als `rejected-path` dokumentieren und nicht weiter Werte eingeben.

## Beim Anlegen

- Nur die sichtbare UI-first Route verwenden.
- Fokus in der Vordergrund-ListPart-/Namenszelle nachweisen.
- `UNIVERSAARL-DE` als Name verwenden.
- `Universaarl GmbH` als Anzeigename verwenden, wenn das Feld sichtbar und sinnvoll ist.
- Bei Fehlermeldung sofort stoppen und Fehlermeldung sichern.
- Bei Speichern die Mandantenliste erneut pruefen.

## Erfolgskriterium

Der Schritt ist erst erfolgreich, wenn `UNIVERSAARL-DE` sichtbar als eigene Company in der Mandantenliste steht.

## Danach

1. Permission Blocker auf `resolved` setzen.
2. Company Context beweisen.
3. In `UNIVERSAARL-DE` wechseln, nur wenn der Case es erlaubt.
4. Company Information pruefen.
5. Datenbasis pruefen: keine ungewollten Demodaten.
6. Foundation Setup planen.

## Harte Stopps

- `UNIVERSAARL-DE` ist nach dem Versuch nicht sichtbar.
- Business Central zeigt eine Berechtigungs- oder Speicherfehlermeldung.
- Die Aktion wuerde eine Kopie aus CRONUS oder einer Democompany erzeugen.
- Die Datenbasis ist unklar.
- Ein Dialog fragt nach Abschluss/Fertigstellen, ohne dass Wirkung und Datenbasis verstanden sind.
