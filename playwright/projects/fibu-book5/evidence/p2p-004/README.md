# P2P-004 Evidence Index

Status: CRONUS-USA-Labor, UI-first Purchase-Order-Gate fuer Teil-WE-Fall, keine Preview, keine Buchung, kein deutscher Finalnachweis.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `010-purchase-orders-list-page-text.txt` | UI-Seitentext | Purchase Orders Einstieg | keinen Beleg | labor-navigation |
| `010-purchase-orders-list-actions.json` | Action Snapshot | relevante List-Actions inkl. New-Kontext | keinen Klickpfad nach New | labor-navigation |
| `020-after-new-purchase-order-page-text.txt` | UI-Seitentext | Purchase Order Card nach New | keine Zeile, keine Buchung | labor-gate |
| `020-after-new-purchase-order-controls.json` | Control Snapshot | sichtbare Eingabefelder/Aktionen nach New | keine fachliche Feldsicherheit fuer alle Zeilenfelder | labor-gate |
| `030-after-vendor-page-text.txt` | UI-Seitentext | Vendor-Kopfbefund nach Eingabe | keine Teil-WE | labor-gate |
| `030-after-vendor-controls.json` | Control Snapshot | Feld-/Zeilenkandidaten nach Vendor | keine Zeilenbuchung | labor-gate |
| `P2P-004-result.json` | JSON Ergebnis | strukturierter Gate-/Blockerbefund | keine automatische State-Finalisierung | labor |
| `P2P-004-PARTIAL-RECEIPT-GATE.md` | Lernnotiz | Anfaengerlogik fuer Bestellt/Geliefert/Fakturiert | keinen finalen deutschen Nachweis | labor |
