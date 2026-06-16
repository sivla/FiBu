# Business Central Object Mapping Starter

## Ziel

Dieses Mapping hilft, Ticketanalysen schneller von der sichtbaren Page zu den wahrscheinlichen Tabellen, gebuchten Dokumenten und Entries zu fuehren. Es ist ein Starter, kein vollstaendiges Objektlexikon.

## Sales

| Prozess | Page | Header Table | Line Table | Posted Document | Entries |
|---|---|---|---|---|---|
| Sales Order | Sales Order | Sales Header | Sales Line | Posted Sales Invoice | Customer Ledger Entry, G/L Entry, VAT Entry, Item Ledger Entry, Value Entry |

## Purchase

| Prozess | Page | Header Table | Line Table | Posted Document | Entries |
|---|---|---|---|---|---|
| Purchase Order | Purchase Order | Purchase Header | Purchase Line | Posted Purchase Invoice/Receipt | Vendor Ledger Entry, G/L Entry, VAT Entry, Item Ledger Entry, Value Entry |

## Finance

| Prozess | Page | Header Table | Line Table | Posted Document | Entries |
|---|---|---|---|---|---|
| General Journal | General Journals | Gen. Journal Batch | Gen. Journal Line | kein klassisches Posted Document | G/L Entry, Customer/Vendor/Bank Ledger Entry je Kontoart |
| Payment Journal | Payment Journals | Gen. Journal Batch | Gen. Journal Line | kein klassisches Posted Document | Vendor Ledger Entry, Bank Account Ledger Entry, G/L Entry |

## Inventory

| Prozess | Page | Header Table | Line Table | Posted Document | Entries |
|---|---|---|---|---|---|
| Item Journal | Item Journals | Item Journal Batch | Item Journal Line | kein klassisches Posted Document | Item Ledger Entry, Value Entry, ggf. G/L Entry |
| Inventory Posting Setup | Inventory Posting Setup | Inventory Posting Setup | n/a | n/a | beeinflusst G/L Entry bei Item-Postings |

## Warehouse

| Prozess | Page | Header Table | Line Table | Posted Document | Entries |
|---|---|---|---|---|---|
| Warehouse Receipt | Warehouse Receipt | Warehouse Receipt Header | Warehouse Receipt Line | Posted Whse. Receipt | Warehouse Entry, ggf. Item Ledger Entry nach Folgeprozess |
| Warehouse Shipment | Warehouse Shipment | Warehouse Shipment Header | Warehouse Shipment Line | Posted Whse. Shipment | Warehouse Entry, ggf. Item Ledger Entry nach Folgeprozess |

## Service

| Prozess | Page | Header Table | Line Table | Posted Document | Entries |
|---|---|---|---|---|---|
| Service Order | Service Order | Service Header | Service Line | Posted Service Invoice/Shipment | Service Ledger Entry, Customer Ledger Entry, G/L Entry, ggf. Item/Value Entry |

## Projects

| Prozess | Page | Header Table | Line Table | Posted Document | Entries |
|---|---|---|---|---|---|
| Project/Job Journal | Project Journals | Job Journal Batch | Job Journal Line | kein klassisches Posted Document | Job Ledger Entry, ggf. G/L Entry |

## Manufacturing

| Prozess | Page | Header Table | Line Table | Posted Document | Entries |
|---|---|---|---|---|---|
| Production Order | Released Production Order | Production Order | Prod. Order Line/Component/Routing Line | kein klassisches Posted Document | Item Ledger Entry, Value Entry, Capacity Ledger Entry, G/L Entry |

## Debugging-Nutzen

Das Mapping hilft bei Page Inspection, Hypothesenbildung, Datenchecks, Entry-Nachweisen und Regressionstests.

## Wie dieses Mapping in Ticketanalysen genutzt wird

1. Sichtbare Page aus Ticket oder Screenshot bestimmen.
2. Prozesszeile im Mapping suchen.
3. wahrscheinliche Header-/Line-Tabellen notieren.
4. Posted Document und Entries als Nachweisziel festlegen.
5. Unsichere Objektangaben als Annahme markieren und per Page Inspection/API pruefen.
