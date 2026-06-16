# Business Central MCP Tool Spec

## Ziel

Diese Spezifikation beschreibt einen spaeteren read-only Business-Central-MCP-Server. Sie ist noch keine Live-Implementierung. Alle Tools sind fuer sichere Diagnose, Evidence-Strukturierung und lokale Dokumentation gedacht.

## Globale Sicherheitsregeln

- Alle BC-Zugriffe sind read-only.
- Keine Buchungen, Stornos, Zahlungen, E-Mails, Job-Queue-Starts oder Integrationen.
- Keine Setup-, Stammdaten- oder Berechtigungsaenderungen.
- Keine Secrets, Cookies, Tokens oder Auth-State-Dateien in Tool-Ausgaben.
- Keine Massendumps.
- Ergebnisse werden vor Evidence-Commit redigiert.
- Schreibende BC-Tools sind blocked und werden nicht implementiert.

## Tool 1: bc_get_environment_context

Zweck:

- Environment, Company, Tenant-/URL-Kontext read-only zusammenfassen.

Input:

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| url | string | nein | BC-URL ohne Secrets |
| environment | string | nein | Environment-Name |
| company | string | nein | Company/Mandant |

Output:

| Feld | Typ | Beschreibung |
|---|---|---|
| environment | string | erkannter oder angegebener Environment-Kontext |
| company | string | erkannter oder angegebener Company-Kontext |
| safety | string | read-only Status und offene Warnungen |

Risiko:

- niedrig, aber keine Secrets ausgeben.

## Tool 2: bc_get_page_context

Zweck:

- Page Caption, Page Name, Page ID, Source Table, Table ID, Filters, Extensions dokumentieren.
- Wenn echte Page Inspection nicht automatisiert verfuegbar ist, kann das Tool nur strukturierte manuelle Angaben speichern.

## Tool 3: bc_lookup_record

Zweck:

- Datensatz read-only suchen, z. B. Customer, Vendor, Item, Sales Order, Posted Sales Invoice.

Regel:

- Nur GET.
- Nur erlaubte Felder.
- Keine Massendumps.

## Tool 4: bc_trace_document_entries

Zweck:

- Von Belegnummer zu Entries read-only verfolgen:
  - Customer Ledger Entry
  - Vendor Ledger Entry
  - G/L Entry
  - VAT Entry
  - Item Ledger Entry
  - Value Entry

## Tool 5: bc_check_posting_setup

Zweck:

- Posting-Setup-Kombinationen read-only pruefen:
  - General Posting Setup
  - VAT Posting Setup
  - Inventory Posting Setup
  - Customer/Vendor Posting Group
  - Bank Account Posting Group
  - FA Posting Group

## Tool 6: bc_check_dimensions

Zweck:

- Dimension Set ID, Default Dimensions, Pflichtdimensionen, Dimension Combinations read-only pruefen.

## Tool 7: bc_read_job_queue_status

Zweck:

- Job Queue Entries und Log Entries read-only pruefen.
- Keine Jobs starten, stoppen, neu planen oder reaktivieren.

## Tool 8: bc_read_permission_context

Zweck:

- Permission Sets, Effective Permissions, Security Filter read-only dokumentieren.
- Keine Rechteaenderung.

## Tool 9: bc_build_telemetry_query

Zweck:

- sichere KQL-Query aus Ticketkontext bauen.
- Keine Live-Ausfuehrung ohne getrennte Freigabe.

## Tool 10: bc_write_local_evidence

Zweck:

- lokale Evidence-Dateien im Repo/Arbeitsordner schreiben.
- Keine BC-Daten schreiben.

## Tool 11: bc_redact_result

Zweck:

- Ergebnisse anonymisieren:
  - E-Mail
  - IBAN
  - Tokens
  - Kundennamen
  - Belegnummern optional maskieren

## Blocked Tools

Diese Tool-Klassen werden nicht implementiert:

- post document
- invoice document
- send email
- payment export
- delete record
- modify record
- patch record
- put record
- job_start
- integration trigger

## Statuswerte

| Status | Bedeutung |
|---|---|
| available | implementiert |
| planned | geplant |
| blocked | bewusst nicht erlaubt |
| manual | nur manuell dokumentierbar |
