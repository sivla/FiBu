# FIXEDASSETS-056 Purchase-Invoice-Feldmapping-Blocker-Diagnose

Status: `labor`, `no-bc-run`, `playwright-guard`, `no-posting`, `not-final`

## Ziel

Der abgelehnte Lauf `FIXEDASSETS-055` wird nicht wiederholt. Stattdessen wird aus der vorhandenen Evidence eine harte Stop-Regel abgeleitet: Ein sichtbarer Code `FA-CNC-01` ist nur dann ein Erfolg, wenn gleichzeitig der richtige Einkaufsrechnungs-Zeilenkontext und der Zeilentyp `Fixed Asset` sichtbar sind.

## Befund

- Der Kopf-/Header-Text aus `FIXEDASSETS-055` enthaelt einen Vendor-Registrierungsdialog (`Create a new vendor card ...`).
- Der Zielwert-Text enthaelt `Vendor Card - V00040 - FA-CNC-01`.
- Damit ist `FA-CNC-01` gerade kein Anlagenzeilenbeweis, sondern ein falscher Stammdaten-/Lookup-Kontext.

## Neue Playwright-Regel

- Nach jedem Kopf- oder Zeilenfeldschritt muss der Test pruefen, ob weiter `Purchase Invoice` plus Zeilen/Grid-Kontext sichtbar ist.
- `Vendor Card`, Vendor-Registrierungsdialoge und automatisch erzeugte Vendor-Nummern sind harte Stop-Kriterien.
- `FA-CNC-01` zaehlt erst als Erfolg, wenn `Fixed Asset` als Zeilentyp und der Zielcode im Belegzeilenkontext sichtbar sind.

## Buchwirkung

Kapitel 21 darf `FIXEDASSETS-055` nicht als Anlagenkauf verwenden. Der Fall gehoert in die Debugging-/Screenshot-QA-Erklaerung: Anfaenger muessen lernen, dass Business Central bei falschem Feldfokus Stammdatenkarten oder Registrierungsdialoge oeffnen kann.

## Naechster Schritt

`FIXEDASSETS-057-K30000-FA-CNC-01-PURCHASE-INVOICE-FIELD-MAPPING-RETRY-GATE`: erst entscheiden, ob der neue Guard fuer einen erneuten UI-first Field-Mapping-Versuch reicht. Weiterhin keine Preview, kein Post, kein Zugang und keine AfA.

## Maschinenlesbares Ergebnis

Siehe `FIXEDASSETS-056-result.json` und `010-guard-classification.json`.

```json
{
  "caseId": "FIXEDASSETS-056-PURCHASE-INVOICE-FIELD-MAPPING-BLOCKER-DIAGNOSIS",
  "environment": "MCP_1_20260210",
  "company": "RM-DEMO",
  "sourceEvidence": [
    "playwright/projects/fibu-book5/evidence/fixedassets-055/036-after-header-focused-text.txt",
    "playwright/projects/fibu-book5/evidence/fixedassets-055/050-target-values-focused-text.txt"
  ],
  "workType": "playwright-helper-and-evidence-no-bc-run",
  "posted": false,
  "bcRun": false,
  "setupChanged": false,
  "documentsCreated": false,
  "classifications": {
    "header": {
      "status": "blocked-vendor-registration-dialog",
      "success": false,
      "stopReasons": [
        "Vendor registration dialog is visible; the field entry is no longer a clean purchase-invoice-line proof."
      ],
      "visibleSignals": {
        "purchaseInvoice": true,
        "purchaseInvoicesList": true,
        "linesOrLineColumns": true,
        "fixedAssetNo": false,
        "fixedAssetLineType": false,
        "vendorNo": true,
        "vendorRegistrationDialog": true,
        "vendorCard": false,
        "accidentalVendorNo": false,
        "postingAction": true,
        "purchaseInvoiceListOrInlineRow": true
      }
    },
    "line": {
      "status": "blocked-wrong-vendor-card-context",
      "success": false,
      "stopReasons": [
        "Vendor Card context is visible; a fixed-asset number in this context is not a purchase-invoice-line proof.",
        "Accidental vendor number V00040 is visible; this indicates wrong lookup/card context.",
        "FA-CNC-01 is visible without a visible Fixed Asset line type."
      ],
      "visibleSignals": {
        "purchaseInvoice": true,
        "purchaseInvoicesList": false,
        "linesOrLineColumns": true,
        "fixedAssetNo": true,
        "fixedAssetLineType": false,
        "vendorNo": true,
        "vendorRegistrationDialog": false,
        "vendorCard": true,
        "accidentalVendorNo": true,
        "postingAction": true,
        "purchaseInvoiceListOrInlineRow": false
      }
    },
    "combined": {
      "status": "blocked-vendor-registration-dialog",
      "success": false,
      "stopReasons": [
        "Vendor registration dialog is visible; the field entry is no longer a clean purchase-invoice-line proof.",
        "Vendor Card context is visible; a fixed-asset number in this context is not a purchase-invoice-line proof.",
        "Accidental vendor number V00040 is visible; this indicates wrong lookup/card context.",
        "FA-CNC-01 is visible without a visible Fixed Asset line type."
      ],
      "visibleSignals": {
        "purchaseInvoice": true,
        "purchaseInvoicesList": true,
        "linesOrLineColumns": true,
        "fixedAssetNo": true,
        "fixedAssetLineType": false,
        "vendorNo": true,
        "vendorRegistrationDialog": true,
        "vendorCard": true,
        "accidentalVendorNo": true,
        "postingAction": true,
        "purchaseInvoiceListOrInlineRow": true
      }
    }
  },
  "decision": "do-not-rerun-field-mapping-before-a-new-gate",
  "stopCriteriaForNextUiRun": [
    "Vendor registration dialog visible",
    "Vendor Card visible",
    "Accidental vendor number visible",
    "FA-CNC-01 visible without Fixed Asset line type",
    "Purchase Invoice page no longer visible after a field action"
  ],
  "successCriteriaForFutureRetry": [
    "Purchase Invoice page remains visible",
    "Lines/Grid context remains visible",
    "Vendor K30000 remains in the invoice header",
    "Line Type is visible as Fixed Asset",
    "No. / target field shows FA-CNC-01 in the invoice line, not in a Vendor Card"
  ],
  "bookImpact": "Use FIXEDASSETS-055/056 as Debugging- und Screenshot-QA-Lernfall. Do not use the 055 target-value screenshots as Anlagenkauf evidence.",
  "nextStep": "FIXEDASSETS-057-K30000-FA-CNC-01-PURCHASE-INVOICE-FIELD-MAPPING-RETRY-GATE"
}
```
