# WAREHOUSE-013 Evidence Index

Status: `labor`, `ui-first`, `blocked`, `no-posting`, `not-final`.

## Kernbefund

WAREHOUSE-013 hat den vorhandenen Warehouse-Receipt-Kontext `RE000001` wiederverwendet. Der Beleg ist sichtbar und wurde ohne neuen Draft genutzt. Die Route `Get Source Documents...` wurde in diesem Lauf aber nicht als echte Source-Document-Auswahl sichtbar erreicht. Es wurde kein Source Document bestaetigt und kein Warehouse Receipt gebucht.

## Dateien

| Datei | Typ | Beweist | Beweist nicht |
|---|---|---|---|
| `WAREHOUSE-013-result.json` | Result JSON | RE000001 sichtbar/wiederverwendet; no-post/no-preview/no-source-confirm Flags | Source-Auswahl, Receipt Posting, Put-away, Postenspur |
| `WAREHOUSE-013-EXISTING-RECEIPT-GET-SOURCE-DOCUMENTS.md` | Lernnotiz | Kurzbewertung des blockierten Existing-Receipt-Pfads | Deutschen Finalnachweis |
| `010-list-text.txt` | UI-Text | Listen-/Receipt-Kontext | Keine vollstaendige UI-Aussage |
| `020-card-text.txt` | UI-Text | Karten-/Receipt-Kontextauszug | Keine Source-Auswahl |
| `030-card-buttons.json` | UI-Inventar | Sichtbare Buttons nach Oeffnung | Keine sichere Get-Source-Aktion |
| `040-get-source-candidates.json` | UI-Inventar | Keine kandidaten im Lauf | Nicht, dass die Aktion nie existiert |
| `050-post-candidates-not-clicked.json` | Safety Evidence | Post Receipt wurde erkannt und nicht geklickt | Posting |
| `060-final-text.txt` | UI-Text | finaler UI-Kontext | Source-Auswahl |
| `070-final-buttons.json` | UI-Inventar | finale sichtbare Buttons | Source Confirmation |

## Naechster Schritt

WAREHOUSE-014 soll den Unterschied zwischen WAREHOUSE-011 und WAREHOUSE-012/013 diagnostizieren: Action-Visibility nach Draft-Card-Oeffnung, ggf. maximierte Karte/breite Ansicht, aber weiterhin ohne `OK`, `Select`, `Post` oder Preview.
