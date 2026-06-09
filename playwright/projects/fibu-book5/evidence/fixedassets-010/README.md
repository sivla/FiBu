# FIXEDASSETS-010 Evidence-Index

Status: `labor`, `read-only`, `setup-preflight`, `gate-locked`, `no-posting`, `no-setup-change`, `not-final`.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-010-result.json` | JSON-Ergebnis | strukturierte UI-Preflight-Pruefung fuer die naechste Setup-Entscheidung | keinen Setup-Fit und keine Buchung | labor |
| `FIXEDASSETS-010-SETUP-PREFLIGHT-READONLY.md` | Lernzusammenfassung | Anfaengererklaerung, Gate-Status und Buchwirkung | keinen deutschen Finalnachweis | labor |
| `010-fa-posting-groups-page-text.txt` | Seitentext | UI-Kontext Anlagenbuchungsgruppen / FA Posting Groups | kein `MACHINES`-Setup | labor-read-only |
| `020-depreciation-books-page-text.txt` | Seitentext | UI-Kontext AfA-Buecher / Depreciation Books | kein `HGB`-Setup | labor-read-only |
| `030-fixed-assets-page-text.txt` | Seitentext | UI-Kontext Anlagen / Fixed Assets | keine Anlage `FA-CNC-01` | labor-read-only |
| `040-vendors-page-text.txt` | Seitentext | UI-Kontext Kreditoren / Vendors fuer `K30000` | keinen Kreditor `K30000` | labor-read-only |
| `*-ui-hints.json` | JSON-Auszug | sichtbare Feld-/Aktionshinweise und Row-Snippets je Seite | keine Rohsnapshots und keine vollstaendige Feldliste | compact |
| `*-buttons.json` | JSON-Auszug | sichtbare Buttonnamen je Seite | keine Klickfreigabe fuer `New/Neu` | compact |
| `*.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Grenzen je Bild | keine eigenstaendige fachliche Wahrheit ohne JSON/Markdown | candidate |

## Kernaussage

FIXEDASSETS-011-SETUP-GATE-DECISION: aus dieser Preflight-Evidence eine explizite, eng begrenzte Setup-Freigabe fuer MACHINES/HGB/FA-CNC-01/K30000 ableiten oder fehlende UI-Mappings nachschaerfen; weiterhin keine Buchung ohne separaten Posting-Gate.
