# Universaarl Company Creation Screenshot QA Gate

Status: `prep-done`

Instanz: `playthru`

Zielcompany: `UNIVERSAARL-DE` (`planned-not-yet-created`)

Dieses Gate gilt fuer den ersten Company-Creation-Lauf nach Rechtefreigabe. Es verhindert, dass ein Screenshot nur allgemein die Mandantenliste zeigt, aber nicht den entscheidenden UI-Zustand.

## Zielroute

```text
Mandanten -> Pfeil neben Neu -> Neues Unternehmen erstellen
```

Der Hauptbutton `Neu` ist nicht der Zielklick fuer den gefuehrten Anlageweg. Eine leere Mandantenzeile ist kein Beweis fuer `Neues Unternehmen erstellen`.

## Pflichtbilder vor einer wirksamen Auswahl

| Nr. | Bildtyp | Muss sichtbar sein | Stop, wenn |
| ---: | --- | --- | --- |
| 1 | Companies-Kontext vor Aktion | Seite `Mandanten`, Instanz `playthru`, vorhandene Companies, `UNIVERSAARL-DE` nicht sichtbar | falsche Instanz, falsche Seite, Zielcompany bereits sichtbar und Herkunft unklar |
| 2 | Hauptbutton-Hover | Hauptbutton `Neu` plus Tooltip/Accessible Name | Tooltip fehlt und Button/Pfeil nicht unterscheidbar sind |
| 3 | Pfeil-Hover | kleiner Pfeil neben `Neu` plus Tooltip/Accessible Name | Hover zeigt nicht den Pfeil oder Screenshot schneidet den Pfeil ab |
| 4 | Dropdown offen | Dropdown unter `Neu` mit lesbarem Eintrag `Neues Unternehmen erstellen` | nur Hauptbutton `Neu` sichtbar ist oder Menueintrag nicht lesbar ist |
| 5 | Klickziel vor Klick | Maus-/Locator-Ziel liegt auf dem Menueintrag, nicht auf der Button-Hauptflaeche | Ziel ist Hauptbutton, `Kopieren`, `Testunternehmen` oder unklarer Menuepunkt |

## Pflichtbilder nach der Auswahl

| Nr. | Bildtyp | Muss sichtbar sein | Bedeutung |
| ---: | --- | --- | --- |
| 6 | Folgezustand nach Klick | Assistent, Dialog oder klarer neuer Zustand nach `Neues Unternehmen erstellen` | bestaetigt, dass der Menueintrag wirklich getroffen wurde |
| 7 | Datenbasisentscheidung | sichtbare Option wie `No Data`, `Setup Data Only`, `Sample Data`, `Copy Company` oder `Testunternehmen` | entscheidet, ob der Pfad weitergehen darf |
| 8 | Vor Abschluss | Name `UNIVERSAARL-DE`, ggf. Anzeigename `Universaarl GmbH`, sichtbare Datenbasis, sichtbarer Abschlussbutton | erst dann darf ueber `Fertig stellen`/`Finish` entschieden werden |
| 9 | Ergebnisliste | `UNIVERSAARL-DE` sichtbar in der Mandantenliste | einziger Erfolgsscreenshot fuer die Anlage |
| 10 | Fehlerbild | vollstaendige Berechtigungs-/Speicherfehlermeldung | Blocker, kein Erfolg |

## Rejected-Path-Bilder

Diese Bilder sind wichtig, aber keine Erfolgsscreenshots:

- leere Mandantenzeile nach Hauptbutton `Neu`,
- Dropdown ohne lesbares `Neues Unternehmen erstellen`,
- Assistent ohne sichtbare Datenbasis,
- Dialog mit `OK`, `Ja`, `Finish`, `Create` oder `Fertig stellen`, bevor Wirkung und Datenbasis klar sind,
- Liste nach Versuch ohne sichtbares `UNIVERSAARL-DE`.

Rejected-Path-Bilder duerfen im Buch erklaeren, warum ein Weg nicht reicht. Sie duerfen nicht als Company-Anlage, Datenbasiswahl oder finaler Universaarl-Beweis verwendet werden.

## Buchtext-Regel

Im Buch wird nicht geschrieben, dass ein Screenshot etwas "beweist". Der Text erklaert direkt, was der Leser sieht:

```text
Im Dropdown neben Neu ist der Eintrag Neues Unternehmen erstellen sichtbar. Dieser Eintrag startet den gefuehrten Anlageweg. Der Hauptbutton Neu bleibt ein anderes Ziel und wird fuer diesen Schritt nicht verwendet.
```

## Naechste Cases

```text
TARGET-009-MAIN-NEU-LIST-COMPANY-CREATE-GATE
TARGET-COMPANY-INFO-001-COMPANY-INFORMATION-READONLY
```

`TARGET-009` bleibt bis zur Rechtefreigabe geparkt.
