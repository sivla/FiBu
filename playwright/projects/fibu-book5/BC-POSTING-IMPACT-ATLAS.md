# BC Posting Impact Atlas

Status: `labor-reference`.

| Prozess | Ausfuehrung | Beleg | Posten / Wirkung | Evidence | Nicht bewiesen |
|---|---|---|---|---|---|
| O2C Sales Order | Ship and Invoice | `PS-INV103297` | Customer Ledger, G/L Entries, Item Ledger, Value Entries, Dimensionen teilweise | `evidence/uat-o2c-001/` | deutsche 19% USt, deutscher Kontenplan |
| P2P Purchase Order | Receive and Invoice | Posted Purchase Invoice `108219` | Vendor Ledger, Detailed Vendor Ledger, G/L Entries, Item Ledger Entry `793`, Value Entries | `evidence/p2p-001/` | deutsche Vorsteuer, deutsche Konten, deutsche Screenshots |
| P2P Vendor Payment | Payment Journal Post | `PAYP2P-108219` | Vendor Ledger, Detailed Vendor Ledger, Bank Account Ledger Entries, G/L Entries, Remaining Amount `0,00`, Payment Discount | `evidence/p2p-002/`, `p2p-003/` | Bankabstimmung, deutscher Bank-/Compliance-Finalnachweis |
| Fixed Asset Acquisition | FA G/L Journal Post | `G05001` | G/L Entries `82000`/`12210`, FA Ledger Entries Page `5604`, Acquisition Cost | `evidence/fixedassets-225/`, `227`, `229`, `231` | Einkaufsrechnung Art=Anlage, deutscher Finalnachweis |
| Fixed Asset Depreciation | Calculate Depreciation OK | `FADEP-291-OK` als Parameter | keine sichtbare Journalzeile im geprueften Kontext | `evidence/fixedassets-291/` | Preview/Post/AfA-Postenspur |
| P2P Partial Receipt | nicht gebucht | Draft `106002` | keine Posten; nur Kopf-/Zeilenkontext | `evidence/p2p-004/` | RAW-STEEL-Zeile, Teilmenge, Preview, Receipt, Invoice |
