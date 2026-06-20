# FIXEDASSETS-125 Evidence Index

Status: `local-evidence-review`, `judge_work`, `no-bc-run`, `no-playwright-run`, `no-posting`

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-125-acquisition-route-audit.md` | Route Audit | Vergleich von Purchase Invoice, FA G/L Journal und Acquire nach FA-124 | keine neue UI-Evidence, keine Buchungswirkung | `accepted-local-decision` |
| `FIXEDASSETS-125-result.json` | Result JSON | naechster praktischer Case ist Acquire-Ursachendiagnose auf `FA-CNC-01` | kein Anlagenzugang, keine Preview, kein Post | `state-sync-input` |

## Kurzbefund

Nach FA-124 ist der Purchase-Invoice-Line-Type-Pfad zwar fachlich weiterhin attraktiv, aber praktisch nicht belastbar: `Fixed Asset`/`Anlage` wurde trotz Dropdown-, Menuebutton-, Page-Inspection- und Personalize-Diagnosen nicht als auswaehlbare Zeilentyp-Option bewiesen.

Der FA-G/L-Journal-Pfad hat eine Zielzeilen-Shell, aber keine sichere Werteingabe fuer Betrag und Gegenkonto. Der Active-Cell-Probe verlor sogar Page-/Zielzeilen-Signale.

Der `Acquire`-Pfad ist als Aktion sichtbar, aber deaktiviert. Genau diese Ursache ist noch nicht verstanden. Deshalb ist er der beste naechste Diagnosehebel, bevor ein neuer Anlagenzugangsversuch gestartet wird.
