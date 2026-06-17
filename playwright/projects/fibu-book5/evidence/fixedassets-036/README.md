# FIXEDASSETS-036 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-036-result.json` | JSON | strukturierter read-only Befund zu `K30000` im Vendor-Kontext | keine Kreditorenkarte und keine Buchung | labor |
| `FIXEDASSETS-036-K30000-VENDOR-PREFLIGHT-READONLY.md` | Markdown | Lernwert, Buchwirkung und naechster Schritt | keinen deutschen Finalnachweis | labor |
| `010-vendors-k30000-page-text.txt` | kompakter Seitentext | Vendor-/Kreditorenkontext und Such-/Filterbefund | keine Rohseite, keine vollstaendige Feldliste | compact |
| `020-vendors-k30000-visible-signals.json` | JSON-Diagnose | sichtbare Row-/Filter-/Leersignale fuer Screenshot-QA | keine API- oder Tabellenwahrheit | compact |
| `fixedassets-036-010-vendors-k30000-readonly.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Grenzen des Bilds | keine eigenstaendige fachliche Wahrheit | candidate / negative-list-proof |

Aktuelle Wahrheit: `K30000` ist in diesem Lauf im sichtbaren gefilterten Vendor-Kontext nicht als Datensatz sichtbar. Der Screenshot ist nur als negativer Listen-/Filterbeweis nutzbar, nicht als Kreditorenkarte. Vor Einkaufsrechnung oder Anlagenzugang braucht es zuerst eine Setup-Gate-Entscheidung fuer die UI-first Kreditoranlage.
