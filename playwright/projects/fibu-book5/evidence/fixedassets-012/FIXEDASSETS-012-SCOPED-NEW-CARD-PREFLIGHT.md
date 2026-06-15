# FIXEDASSETS-012 Scoped New/Card Preflight

Status: `labor`, `ui-first`, `form-preflight`, `cancel-safe`, `no-save`, `no-setup-change`, `no-posting`, `not-final`.

Diese Aktion ist als autonome RM-DEMO-Laboraktion vertretbar, weil sie keine Stammdaten speichert, keine Buchung ausloest und nur die bereits freigegebenen Zielseiten aus `FIXEDASSETS-011` nutzt. Zweck ist, Pflichtfelder, Defaults/Templates und Abbruchwege zu verstehen, bevor ein spaeterer Setup-Fit geplant wird.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| BC-Lauf | ja, UI-first |
| Setup geaendert | nein |
| Buchung | nein |

## Ergebnis

| Zielkontext | New/Neu geklickt | Formular/Folgekontext sichtbar | Sicher geschlossen | Status |
|---|---:|---:|---:|---|
| FA Posting Groups | ja | ja | ja | candidate-form-preflight |
| Depreciation Books | ja | ja | ja | candidate-form-preflight |
| Fixed Assets | ja | ja | ja | candidate-form-preflight |
| Vendors | ja | ja | ja | candidate-form-preflight |

## Screenshot-QA nach Sichtpruefung

Die vier Screenshots zeigen nicht die Zielcodes `MACHINES`, `HGB`, `FA-CNC-01` oder `K30000`. Sichtbar sind nur neue leere Karten beziehungsweise der Vendor-Template-Dialog:

- `fixedassets-012-010-fa-posting-groups-new-preflight.png` zeigt die leere `FA Posting Group Card` mit Pflichtfeld `Code` und Konto-/Disposal-Feldern; der Zielcode `MACHINES` ist noch nicht vorhanden.
- `fixedassets-012-020-depreciation-books-new-preflight.png` zeigt die leere `Depreciation Book Card` mit Pflichtfeld `Code`, Defaults und G/L-Integration-Schaltern; der Zielcode `HGB` ist noch nicht vorhanden.
- `fixedassets-012-030-fixed-assets-new-preflight.png` zeigt die leere `Fixed Asset Card` mit Pflichtfeldern wie `Description`, `FA Subclass Code` und AfA-Feldern; die Zielanlage `FA-CNC-01` ist noch nicht vorhanden.
- `fixedassets-012-040-vendors-new-preflight.png` zeigt nur die Vorlagenauswahl fuer einen neuen Kreditor; `K30000` ist nicht sichtbar und nicht angelegt.

Damit sind die Bilder keine Buch-Screenshots fuer fertige Zielstammdaten. Sie sind nur Labor-Evidence fuer Formularstruktur, Pflichtfelder, Vorlagen und sichere Abbruchwege. Ein spaeteres Buchbild fuer Kapitel 21 muss den jeweiligen Zielcode sichtbar zeigen, entweder in einer gefilterten Liste oder auf einer Karte nach bewusst freigegebenem, idempotentem UI-Setup-Fit.

## Was praktisch belegt ist

- Der Lauf prueft `New/Neu` nicht mehr nur als sichtbaren Button, sondern als kontrollierten Formular-/Folgekontext.
- Die Screenshots beweisen nur den Formular- oder Template-Kontext, nicht die Existenz der Zielcodes.
- Es wurde nichts gespeichert, nichts angelegt und nichts gebucht.
- Ein spaeterer Setup-Fit braucht weiterhin eine eigene Vorher/Nachher- und Idempotenz-Evidence.

## Anfaenger-Lernwert

Business Central unterscheidet zwischen einer Liste, einem neuen Datensatzformular, Vorlagen-/Template-Auswahl und dem eigentlichen Speichern. Fuer Anlagen ist dieser Zwischenschritt wichtig, weil falsche Pflichtfelder oder Defaults spaeter falsche Anlagenposten oder Buchungsblocker erzeugen koennen.

## Buchwirkung

Kapitel 21 kann den Formular-Preflight als didaktischen Schritt nutzen: Leser sehen, dass `Neu` nicht sofort fachlich sicher ist, sondern erst Pflichtfelder, Defaults, Templates und der sichere Abbruch verstanden werden muessen.

## Naechster Schritt

FIXEDASSETS-013-SETUP-FIT-DECISION: Aus FIXEDASSETS-012 entscheiden, ob ein kleiner idempotenter UI-first Setup-Fit fuer genau einen Zielwert sicher ist, oder ob ein Formularpfad rejected/blockiert bleibt.
