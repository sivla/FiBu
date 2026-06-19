# FIXEDASSETS-079 Lernzusammenfassung

Status: `labor`, `route-decision`, `static-evidence-review`, `no-bc-execution`, `no-posting`, `not-final`.

## Entscheidung

Bevor wieder Zielwerte in ein Dokument oder Journal eingegeben werden, wird der naechste Schritt auf die vorhandene Anlagenkarte verlagert: `FA-CNC-01` ist in RM-DEMO read-only sichtbar, `HGB` ist als AfA-Buch sichtbar, und Microsoft Learn beschreibt die Anlagenkarte mit `Acquire` als Standardroute fuer den Erwerb.

## Warum nicht erneut Einkaufsbeleg?

Der Einkaufsbelegpfad ist fachlich laut Microsoft Learn moeglich. Im Labor wurde aber mehrfach nicht sauber bewiesen, dass die Einkaufszeile den Typ `Fixed Asset` sichtbar/stabil anbietet. Noch ein Retry im gleichen UI-Feld waere deshalb teuer und wuerde wenig lernen.

## Naechster praktischer Schritt

FA-080 soll die vorhandene Anlage `FA-CNC-01` read-only oeffnen und nur pruefen: Ist die richtige Karte sichtbar? Ist `HGB`/AfA-Kontext sichtbar? Gibt es eine `Acquire`-Aktion oder einen passenden Anlagenzugangs-Hinweis? Die Aktion wird noch nicht geklickt.

## Buchwirkung

Kapitel 21 sollte den Lesern zeigen, dass Anlagenzugang zuerst eine Routenentscheidung braucht. Ein gescheiterter Einkaufszeilen-Dropdown ist kein Beweis gegen Business Central, sondern ein Hinweis auf Page-/Setup-/Rollen-/Automationskontext.
