# FIXEDASSETS-060 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-060-result.json` | JSON | Kontext-Preflight nach `New/Neu`, Safety-Status, naechster Schritt | keinen Zielbeleg, keine Buchung | `labor`, `ui-first`, `no-target-entry` |
| `030-after-new-guard.json` | JSON | Purchase-Invoice-Guard-Zustand nach `New/Neu` | keine Feldwerte | `guard` |
| `031-after-new-card-context-signals.json` | JSON | ob singularer Belegtitel, Pflichtfelder und Lines/Grid sichtbar sind | keine Zielwerte | `context-preflight` |
| `032-after-new-focused-text.txt` | kompakter Seitentext | sichtbaren UI-Kontext nach `New/Neu` | keinen visuellen Buchbeweis allein | `compact` |
| `fixedassets-060-030-after-new-context-preflight.png` | Screenshot | Kontextbild nach `New/Neu`: Belegkopf, Pflichtfelder und Lines/Grid | keinen Anlagenkauf; kein `K30000`, kein `FA-CNC-01`, keine Preview, keine Buchung | `candidate`, nur Preflight |
| `040-leave-context-result.json` | JSON | Verlassen ohne Zielwerte/Posting | keine Datenbank-Cleanup-Pruefung | `safety` |

Aktuelle Wahrheit: Nach New/Neu sind ein singularer Purchase-Invoice-Titel, Pflichtfelder und Lines-/Gridspalten sichtbar. Es wurden bewusst keine Zielwerte eingegeben. Der Screenshot ist nur fuer den Karten-/Lines-Kontext brauchbar; FactBox und Default-Zeilentyp `Item` bleiben sichtbare Grenzen.
