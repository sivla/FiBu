# FIXEDASSETS-015 Evidence-Index

Ziel: Entscheiden, ob ein enger `MACHINES`-Setup-Fit fuer die Anlagenbuchungsgruppe fachlich sicher genug fuer den naechsten Lauf ist.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-015-result.json` | JSON-Ergebnis | Entscheidung, Quellen, erlaubter Folgefit, Grenzen | keine Anlage von `MACHINES`, keine Buchung, keinen deutschen Kontenplan | labor, decision |
| `FIXEDASSETS-015-MACHINES-ACCOUNT-MAPPING-DECISION.md` | Lernzusammenfassung | warum `MACHINES` nur als CRONUS-Laboralias von `EQUIPMENT` vorbereitet werden darf | keine deutsche HGB-/Kontenplan-Wahrheit | labor, setup-decision |

## Kernaussage

`MACHINES` darf im naechsten Lauf als enger UI-first Setup-Fit vorbereitet werden, aber nur als CRONUS-USA-Laboralias mit den aus `FIXEDASSETS-006` sichtbaren `EQUIPMENT`-Konten. Der naechste Lauf darf `MACHINES` pruefen und, falls fehlend, genau diese Anlagenbuchungsgruppe mit dem `EQUIPMENT`-Kontenmuster anlegen. Er darf noch keine Anlage `FA-CNC-01`, keinen Kreditor `K30000`, keinen Zugang, keine AfA und keine Buchung erzeugen.

## Buchwirkung

Kapitel 21 kann jetzt erklaeren, warum die Anlagenbuchungsgruppe der naechste Setup-Baustein nach `HGB` ist: Sie steuert die Sachkonten fuer Zugang, Abschreibung, Abgang, Gewinn/Verlust und Wartung. `MACHINES = EQUIPMENT-Kontenmuster` ist nur ein CRONUS-Laborentscheid, kein deutscher Finalkontenplan.
