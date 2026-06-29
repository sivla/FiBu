# BC Page Atlas

Status: `labor-reference`.

| Page / Kontext | Page ID falls bekannt | Bereich | Belegte Nutzung | Evidence | Grenze |
|---|---:|---|---|---|---|
| Purchase Orders | `9307` | P2P | P2P-004 oeffnet Liste, `New` oeffnet Purchase Order Card | `evidence/p2p-004/` | kein finaler Teil-WE, keine Zeile |
| Purchase Order Card | n/a | P2P | Draft `106002`, Vendor `K10000`, Lines-Kontext sichtbar | `evidence/p2p-004/030-after-vendor-controls.json` | Zeilenwerte noch offen |
| Posted Purchase Invoice | n/a | P2P | Rechnung `108219` sichtbar | `evidence/p2p-001/` | CRONUS-USA Labor |
| Vendor Ledger Entries | n/a | P2P/Payments | Rechnung `108219`, Zahlung `PAYP2P-108219`, Remaining Amount `0,00` | `evidence/p2p-003/` | kein deutscher Finalnachweis |
| Detailed Vendor Ledger Entries | n/a | P2P/Payments | Initial Entry, Payment Discount, Application | `evidence/p2p-003/` | Skonto-/Discount-Wirkung deutsch neu pruefen |
| Payment Journal | n/a | Payments/P2P | Zahlung `PAYP2P-108219` UI-first gebucht | `evidence/p2p-002/` | keine Bankabstimmung |
| Bank Account Ledger Entries | n/a | Payments/Bank | Bankspur zu Zahlungen sichtbar | `evidence/p2p-002/`, `payments-013/` | Bank Reconciliation offen |
| Fixed Asset Card | `5600` | Fixed Assets | `FA-CNC-01`, `HGB`, `MACHINES`, Karten-/Setupwerte | `evidence/fixedassets-*` | viele historische Teilfits; konkrete Evidence beachten |
| Fixed Asset Ledger Entries | `5604` | Fixed Assets | Anlagenposten zu `FA-CNC-01` / `G05001` brauchbar | `evidence/fixedassets-227/` | Page 5606 war rejected/leer |
| Fixed Asset Ledger Entries Preview | `5606` | Fixed Assets | leerer/rejected Preview-Pfad | Fixed-Assets Evidence | nicht als Postenspur nutzen |
| FA G/L Journal | n/a | Fixed Assets | Zugang `G05001`, Preview, Posting, G/L Trace | `evidence/fixedassets-225/` | Einkaufsrechnung-Route offen |
| General Journal Batches | `251` | Fixed Assets | `DEFAULT`, `Default Journal Batch`, `FA-JNL` sichtbar | `evidence/fixedassets-287/` | kein ausgewaehlter Batchwert |
| Financial Reports | n/a | Reporting | O2C-/Dimension-Reporting Teil-/Negativbefunde | `evidence/reporting-*` | Dimension-Auswertung nicht final |

## Zero-Open-Questions-Regel

Jede nicht verstandene Page erzeugt entweder einen Eintrag in `.agent/state/open_questions_register.json` oder bekommt einen finalen Status aus `BC-ZERO-OPEN-QUESTIONS-POLICY.md`.
