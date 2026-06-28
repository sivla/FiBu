# RM-DE-LAB-CREATE-001 UI-first Company Creation

Status: `labor-blocked`, `company-context`, `needs-german-final-rebuild`.

## Zweck

Dieser Lauf prueft und entsperrt die geplante deutsch orientierte Laborcompany `RM-DE-LAB` innerhalb der bestehenden Sandbox `MCP_1_20260210`. Der Lauf nutzt die Companies-Seite per Direct URL Page 357 und keinen API-Shortcut.

## Ergebnis

| Feld | Wert |
|---|---|
| Zielcompany | `RM-DE-LAB` |
| Bereits vorher sichtbar | nein |
| In diesem Lauf angelegt | nein |
| Danach sichtbar | nein |
| URL nach Lauf | https://businesscentral.dynamics.com/b8fd10d1-3599-4721-8651-f95bd868aba7/MCP_1_20260210?company=RM-DEMO&page=357&dc=0 |
| Zielwerte in neuer Zeile sichtbar | ja, `RM-DE-LAB` und `Rhein-Main DE Lab` |
| Speicherstatus | `Nicht gespeichert` / Seitenfehler |
| Blocker | `target-company-value-visible-but-not-saved` |

## Grenzen

- Das ist nur eine Labor-/Shell-Company innerhalb `MCP_1_20260210`.
- Es wurde kein Setup, keine Vorlage, kein Posting, kein Preview Posting und kein Company-Wechsel ausgefuehrt.
- Die Company ist kein deutscher Finalnachweis und ersetzt keine spaetere deutsche Zielinstanz.

## Naechster praktischer Hebel

Nicht nochmal blind `Neu` klicken. Naechster Case: `RM-DE-LAB-CREATE-002-SAVE-ERROR-DIAGNOSIS`, mit gezielter Fehlerdetail-Erfassung an der Companies-Zeile bzw. am Fehlerbanner. Erst danach entscheiden, ob `Enable Assisted Company Setup`, `Setup Status`, eine andere UI-Route oder RM-DEMO als Rueckfall sinnvoll ist.

## Rebuild-Hinweis

In einer spaeteren deutschen Zielinstanz muss die Company neu als `german-final-candidate` angelegt oder registriert werden. Alle Foundation-/VAT-/Kontenplan-/Posting-Gruppen-Nachweise muessen dort neu erzeugt werden.
