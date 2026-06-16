# FIXEDASSETS-034 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-034-result.json` | JSON | Subclass-Persistenz, Safety, finaler Kartenwert | keinen Zugang, keine AfA, keine deutsche Finalitaet | labor |
| `FIXEDASSETS-034-FA-CNC-01-SUBCLASS-DIAGNOSIS.md` | Markdown | Lernwert, Buchwirkung, naechster Schritt | keine Buchung | labor |
| `050-subclass-selection-result.json` | JSON | finaler Subclass-Wert im idempotenten Rerun | keinen erneuten Auswahlklick | field-proof |
| `060-page-inspection-context.txt` | Text | warum Page Inspection im Rerun nicht erneut genutzt wurde | kein neuer technischer Page-Nachweis | technical-reference |
| `fixedassets-034-010-card-before-subclass-diagnosis.screenshot.json` | Screenshot-Metadaten | Company, Laborstatus, Kartenkontext vor/bei Subclass-Pruefung | keinen finalen deutschen Anlagenbeleg | candidate |
| `fixedassets-034-040-subclass-lookup-open.screenshot.json` | Screenshot-Metadaten | dokumentiert den Subclass-/Kartenkontext aus dem Diagnosepfad | keine HGB/MACHINES-Vollansicht | candidate |
| `fixedassets-034-050-final-subclass-state.screenshot.json` | Screenshot-Metadaten | final sichtbaren Subclass-Zustand `EQUIPMENT` plus AfA-Zeilen | keine Anschaffung, keine AfA, keine Postenspur | book-candidate-labor |

Aktuelle Wahrheit: `FA Subclass Code = EQUIPMENT` ist sichtbar gesetzt. Das Finalbild aus 034 zeigt nicht alle Felder gleichzeitig; der vollstaendige Labor-Stammdatenfit entsteht aus 033 plus 034.
