# BC Error And Blocker Atlas

Status: `labor-reference`.

| Blocker | Bereich | Symptom | Ursache / Interpretation | Evidence | Naechste Regel |
|---|---|---|---|---|---|
| `Vendor Invoice No.` fehlt | P2P | Preview/Buchung stoppt | externe Lieferantenbelegnummer ist Pflichtfeld | P2P-001 | im Buch als Pflichtfeld erklaeren |
| P2P-004 Headerfeld ohne Label | P2P/Playwright | Vendor-Feld nicht ueber Label gefunden | BC rendert Header-Control ohne hilfreiche ARIA/Title-Signale | `evidence/p2p-004/030-after-vendor-controls.json` | enger geometrischer Fallback nur mit Nachherwert |
| P2P-005 Lines-Grid ohne sichere Controls | P2P/Playwright | Zeilenansicht ist sichtbar, aber Control-Snapshot liefert keine sicher befuellbare Route fuer Item/Menge/Preis/Qty. to Receive | BC Lines/Subform/Grid-Kontext wird in diesem Zustand nicht durch einfache `input`-Locatoren stabil erfasst | `evidence/p2p-005/P2P-005-result.json` | P2P-006: fokussierte Lines/Grid-Control-Diagnose auf Draft `106051`, keine Preview/Posting vorher |
| P2P-006 Lines-Fokus ohne Datenzeile | P2P/Playwright | Breite Layoutansicht und Lines-Fokusmodus zeigen Spalten, aber keine Datenzeile; Meldung `In dieser Ansicht kann nichts angezeigt werden` | Draft `106051` hat keinen sichtbaren Tabellen-Datensatz, daher sind Item/Menge/Preis/Qty. to Receive nicht sicher editierbar | `evidence/p2p-006/P2P-006-result.json`, `evidence/p2p-006/020-grid-control-snapshot.json` | keine Preview/Posting; naechster Schritt: gezielter Datenzeilen-Erzeugungs-/Select-items-Pfad oder anderer sauberer P2P-Teil-WE-Draft |
| FA Page 5606 leer | Fixed Assets | Preview-/Ledger-Pfad leer | falscher/rejected Page-Pfad fuer Postenspur | Fixed-Assets Evidence | Page 5604 fuer FA Ledger Trace nutzen |
| Calculate Depreciation erzeugt keine sichtbare Journalzeile | Fixed Assets | OK mit Parametern, danach keine Zeile im geprueften Journal | Batch-/Journal-/Eligibility-Kontext offen | `evidence/fixedassets-291/` | kein weiterer OK ohne neuen bounded Gate |
| Related Card Navigation | Fixed Assets | Feldklick oeffnet falsche Karte | BC-Wert/Lookup ist Related-Link, nicht editierbares Zielcontrol | Fixed-Assets Patterns | Vordergrundkarte vor/nach jedem Klick validieren |
| Personalisieren zeigt Kontext, aber keine Feldwerte | Debugging | Personalisieren offen, Zielwerte nicht sichtbar | Feldverfuegbarkeit != Wertebeweis | `fixedassets-049` | Page Inspection/Field Evidence separat |
| Payment Discount unerwartet sichtbar | Payments/P2P | Detailed Vendor Ledger zeigt Discount | CRONUS-Zahlungsbedingung/Laborwirkung | `p2p-003` | im Buch als Laborbefund markieren, deutsch neu pruefen |
