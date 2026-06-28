# BC Error And Blocker Atlas

Status: `labor-reference`.

| Blocker | Bereich | Symptom | Ursache / Interpretation | Evidence | Naechste Regel |
|---|---|---|---|---|---|
| `Vendor Invoice No.` fehlt | P2P | Preview/Buchung stoppt | externe Lieferantenbelegnummer ist Pflichtfeld | P2P-001 | im Buch als Pflichtfeld erklaeren |
| P2P-004 Headerfeld ohne Label | P2P/Playwright | Vendor-Feld nicht ueber Label gefunden | BC rendert Header-Control ohne hilfreiche ARIA/Title-Signale | `evidence/p2p-004/030-after-vendor-controls.json` | enger geometrischer Fallback nur mit Nachherwert |
| FA Page 5606 leer | Fixed Assets | Preview-/Ledger-Pfad leer | falscher/rejected Page-Pfad fuer Postenspur | Fixed-Assets Evidence | Page 5604 fuer FA Ledger Trace nutzen |
| Calculate Depreciation erzeugt keine sichtbare Journalzeile | Fixed Assets | OK mit Parametern, danach keine Zeile im geprueften Journal | Batch-/Journal-/Eligibility-Kontext offen | `evidence/fixedassets-291/` | kein weiterer OK ohne neuen bounded Gate |
| Related Card Navigation | Fixed Assets | Feldklick oeffnet falsche Karte | BC-Wert/Lookup ist Related-Link, nicht editierbares Zielcontrol | Fixed-Assets Patterns | Vordergrundkarte vor/nach jedem Klick validieren |
| Personalisieren zeigt Kontext, aber keine Feldwerte | Debugging | Personalisieren offen, Zielwerte nicht sichtbar | Feldverfuegbarkeit != Wertebeweis | `fixedassets-049` | Page Inspection/Field Evidence separat |
| Payment Discount unerwartet sichtbar | Payments/P2P | Detailed Vendor Ledger zeigt Discount | CRONUS-Zahlungsbedingung/Laborwirkung | `p2p-003` | im Buch als Laborbefund markieren, deutsch neu pruefen |
