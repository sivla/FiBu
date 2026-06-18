# FIXEDASSETS-061 Evidence Index

Status: `decision`, `no-bc-run`, `no-posting`, `target-field-mapping-gate`, `not-final`

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-061-K30000-FA-CNC-01-TARGET-FIELD-MAPPING-GATE.md` | Gate-Entscheidung | Der naechste enge UI-first Zielwerte-Preflight fuer `K30000` und `FA-CNC-01` ist nach `FIXEDASSETS-060` fachlich vertretbar, aber nur mit Guard, Stop-Kriterien und Cleanup. | Keinen Zielbeleg, keine Preview, keine Buchung, keinen Anlagenzugang, keine AfA, keinen deutschen Finalnachweis. | `approved-for-next-narrow-run` |
| `FIXEDASSETS-061-result.json` | Strukturierte Evidence | Erlaubte Aktionen, verbotene Aktionen, Stop-Kriterien, Erfolgskriterien und naechsten Testfall `FIXEDASSETS-062`. | Kein sichtbarer BC-Zustand und keine neue UI-Ausfuehrung. | `decision-proof` |

## Ergebnis

`FIXEDASSETS-060` beweist den aktiven `Purchase Invoice`-Karten-/Lines-Kontext nach gescoptem `Neu`, aber absichtlich noch keine Zielwerte. Deshalb wird genau ein neuer, enger UI-first Lauf freigegeben: `FIXEDASSETS-062-K30000-FA-CNC-01-TARGET-FIELD-MAPPING-NO-POSTING`.

Der Lauf darf nur pruefen, ob `K30000`, eine eindeutige `Vendor Invoice No.`, Zeilentyp `Fixed Asset` und `FA-CNC-01` in derselben sichtbaren Einkaufsrechnungs-/Zeilenumgebung gesetzt oder sichtbar gemacht werden koennen. Er darf keine Preview, kein `Post`, keinen Zugang, keine AfA und keine Setup-Aenderung ausloesen.

## Buchwirkung

Kapitel 21 darf den naechsten Schritt als Feldmapping-Preflight beschreiben: Erst wenn Kopf, Zeilentyp und Anlagen-Nr. im selben Belegkontext sichtbar sind, entsteht ein brauchbarer Screenshot fuer die Klickanleitung. Ein Code allein zaehlt nicht.

## Naechster Schritt

`FIXEDASSETS-062-K30000-FA-CNC-01-TARGET-FIELD-MAPPING-NO-POSTING`: UI-first ausfuehren, Guard nach jedem Kopf-/Zeilenschritt nutzen, Screenshot nur bei sichtbarem Zielkontext erzeugen und jeden Draft per UI bereinigen.
