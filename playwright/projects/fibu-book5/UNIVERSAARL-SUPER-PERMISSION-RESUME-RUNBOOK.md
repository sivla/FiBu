# Universaarl Super-Permission Resume Runbook

Status: `prep-done`

Instanz: `playthru`

Zielcompany: `UNIVERSAARL-DE` (`planned-not-yet-created`)

Dieses Runbook gilt fuer den ersten Lauf, nachdem ausreichende Rechte fuer Company Creation bestaetigt wurden. Es ist keine Business-Central-Evidence und ersetzt keine Screenshots. Es ist die kompakte Arbeitsreihenfolge, damit der naechste Live-Lauf nicht zwischen Checkliste, Blockerdatei, W1-Gate und State suchen muss.

## Startbedingung

Der Lauf beginnt nur, wenn der Nutzer ausdruecklich bestaetigt:

```text
Ich habe in playthru ausreichende Rechte, um Companies anzulegen.
```

Ohne diese Bestaetigung bleibt `TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE` geparkt.

## Phase 0 - Repo und Agent

Vor Business Central:

1. `git status --short`
2. `git pull --ff-only`
3. `npm run agent:preflight`
4. `npm run agent:context`
5. `npm run agent:dry-run`
6. `npm run agent:run-plan`

Der State muss zeigen:

- Instanz: `playthru`
- Zielcompany: `UNIVERSAARL-DE`
- TARGET-009 als reaktivierbarer Case
- keine Anweisung zu API-Shortcut, CRONUS-Kopie oder Testunternehmen

## Phase 1 - Mandantenliste oeffnen

Business Central wird nur in `playthru` geoeffnet.

Auf der Seite `Mandanten` wird zuerst read-only geprueft:

- URL/Kontext zeigt `playthru`.
- `UNIVERSAARL-DE` ist noch nicht sichtbar.
- Hauptbutton `Neu`, Pfeil neben `Neu` und Dropdown sind unterscheidbar.
- Tooltip oder Accessible Name bestaetigt, welches UI-Ziel gemeint ist.

Wenn `UNIVERSAARL-DE` bereits sichtbar ist, wird nicht erneut angelegt. Dann wird Herkunft/Datenbasis geprueft und der Lauf wechselt zu Company Context.

## Phase 2 - Richtige Aktion treffen

Zielaktion:

```text
Mandantenliste -> Pfeil neben Neu -> Neues Unternehmen erstellen
```

Der Hauptbutton `Neu` ist nicht die Zielaktion dieses Resume-Laufs. Er kann eine leere Mandantenzeile oeffnen und war in der bisherigen Evidence ein eigener, nicht final erfolgreicher Pfad. Wenn nach dem Klick eine leere Zeile statt eines gefuehrten Anlagewegs erscheint, wird der Pfad als `rejected-path` dokumentiert.

Stopps:

- Hauptbutton `Neu` wurde versehentlich getroffen.
- Eine leere Listenzeile erscheint, obwohl der gefuehrte Wizard Ziel war.
- Dropdown ist nicht offen oder der Menueintrag ist nicht lesbar.
- `Kopieren`, `Testunternehmen`, CRONUS oder Sample-Data-Route waere die naechste Wirkung.
- Datenbasis ist nicht sichtbar oder unklar.

Ein falscher Klick ist kein Grund zum Weiterprobieren. Er wird als `rejected-path` dokumentiert.

## Phase 3 - Datenbasis entscheiden

Bevor `Fertig stellen`, `Finish`, `OK`, `Ja` oder `Create` bestaetigt wird, muss sichtbar sein, welche Datenbasis entsteht.

Bevorzugt:

- `No Data`, wenn klar sichtbar.
- `Setup Data Only`, wenn klar sichtbar.

Nicht als finale Universaarl-Basis:

- `Sample Data`
- `Testunternehmen`
- CRONUS-Kopie
- Copy Company ohne eigenen Copy-Usecase
- unklare Demo-/Vorlagenroute

Wenn die Datenbasis unklar ist, wird der Lauf blockiert und kein Wizard abgeschlossen.

## Phase 4 - Erfolg pruefen

Company Creation ist erst erfolgreich, wenn `UNIVERSAARL-DE` sichtbar in der Mandantenliste steht.

Pflicht-Evidence:

- Screenshot vor der Anlage mit Mandantenliste.
- Screenshot mit Tooltip/Accessible Name fuer den Hauptbutton `Neu`.
- Screenshot mit Tooltip/Accessible Name fuer den Pfeil neben `Neu`.
- Screenshot mit offenem Dropdown und lesbarem `Neues Unternehmen erstellen`.
- Screenshot unmittelbar nach dem Klick, der zeigt, ob ein Assistent, Dialog oder eine leere Zeile geoeffnet wurde.
- Screenshot der Datenbasisentscheidung, falls ein Wizard erscheint.
- Screenshot nach Erfolg mit `UNIVERSAARL-DE` in der Liste.
- Result JSON mit no-API, no-CRONUS-copy, no-Testunternehmen, selected-data-basis.

Die detaillierte Bildkette steht in `playwright/projects/fibu-book5/UNIVERSAARL-COMPANY-CREATION-SCREENSHOT-QA-GATE.md`.

## Phase 5 - Nach der Anlage nicht springen

Nach erfolgreicher sichtbarer Anlage kommt nicht sofort Setup oder Stammdaten.

Die Reihenfolge ist:

1. Company Context pruefen.
2. `UNIVERSAARL-DE` als aktive Company sichtbar machen.
3. Company Information oeffnen.
4. Company Information vor/nach Pflege dokumentieren.
5. Datenbasis pruefen: keine unbemerkten Demo-/CRONUS-Daten.
6. Number Series preflight.
7. Posting Groups preflight.
8. VAT Setup / USt preflight.
9. Dimensions preflight.
10. Erst danach erste Stammdaten und Prozessbelege.

Details stehen in `playwright/projects/fibu-book5/UNIVERSAARL-W1-FOUNDATION-READINESS-GATE.md`.

## Phase 6 - State und Buchgrenze

Nach dem Lauf werden aktualisiert:

- `.agent/state/current.json`
- `.agent/state/marathon_queue.json`
- `.agent/state/last_run_summary.json`
- `.agent/state/open_questions_register.json`
- `playwright/projects/fibu-book5/PERMISSION-BLOCKERS.md`
- `playwright/projects/fibu-book5/BC-SCREENSHOT-INVENTORY.md`
- passende Evidence-README und Result JSON

Buchtext darf erst angepasst werden, wenn der sichtbare Zustand klar ist. Das Buch schreibt fuer Anfaenger, nicht fuer den Agenten. Es sagt also nicht "der Case beweist", sondern erklaert, was man in Business Central sieht und was der naechste Klick bewirkt.

## Harte Stopps

- Instanz ist nicht `playthru`.
- Nutzerrechte sind nicht bestaetigt.
- `UNIVERSAARL-DE` ist sichtbar, aber Herkunft/Datenbasis ist unklar.
- Zielaktion ist nicht eindeutig.
- Datenbasis ist unklar.
- Wizard fragt nach Abschluss, bevor die Wirkung klar ist.
- Business Central zeigt Berechtigungs-, Speicher- oder Validierungsfehler.
- Screenshot zeigt nicht den relevanten Button, Dropdown, Dialog oder Feldbereich.

Bei einem harten Stopp wird nicht "ein bisschen weiter" geklickt. Der Lauf endet mit Blocker, Screenshot, Result JSON und naechstem konkretem Loesungsweg.
