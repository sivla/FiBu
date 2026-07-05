# Realism Review - Data Requests 2026-07-05

Status: draft
Purpose: Apply the Universaarl realism standard to the first Jira-ready data-request candidates.
Last reviewed: 2026-07-05

## Scope

Reviewed file:

- `DATA-REQUEST-JIRA-CANDIDATES-DRAFT.md`

Reviewed requests:

- `DR-CORE-001 Company information`
- `DR-CORE-002 Organization model`
- `DR-MD-001 Customers`
- `DR-MD-002 Vendors`
- `DR-MD-003 Items, services and non-inventory items`

This review is local project work only. It does not approve Business Central setup, data import, UAT execution or final book claims.

## Review criteria

Each request is checked against the realism gates:

- named fictional customer owner
- internal owner or responsible role
- realistic timing
- required format
- required and optional fields
- validation rules
- missing/unclear fields handled as questions, risks or decisions
- BC usage
- implementation route candidate
- training, UAT, evidence and book impact
- clear risk if missing

## Summary

| Request | Realism verdict | Ready for Jira candidate | Ready for BC setup | Main follow-up |
| --- | --- | --- | --- | --- |
| `DR-CORE-001` | passes with tax-review boundary | yes | no | create sample company-info row and tax-review data question |
| `DR-CORE-002` | passes with classification dependency | yes | no | create organization classification template |
| `DR-MD-001` | passes as data request, blocked for setup | yes | no | wait for posting groups, VAT groups, payment terms and numbering policy |
| `DR-MD-002` | passes as data request, blocked for setup | yes | no | separate payment/bank data gate and avoid real bank data |
| `DR-MD-003` | passes as data request, blocked for setup | yes | no | decide product type, UOM, posting groups, costing and load route |

Overall verdict: the five candidates are realistic enough for Jira/project planning. They are intentionally not setup-ready. That is correct: the next project work is data-template/simulation and dependency closure, not blind BC creation.

## DR-CORE-001 Company information

Realism verdict: pass.

What works:

- Owner split is plausible: CFO owns finance/company data, sponsor reviews identity, tax advisor reviews tax-sensitive wording.
- Timing is realistic before Company Information setup and final company-context screenshots.
- The request separates company identity from tax/legal finality.
- BC usage, training and book impact are clear.

Open realism gaps:

- Due timing is project-relative, not calendar-dated.
- No sample row exists yet.
- VAT registration wording is still a review input.

Required follow-ups:

- Create `UNIVERSAARL_CORE_CompanyInformation` simulated row.
- Add a tax-review question for VAT registration wording.
- Add a Confluence-style company information data request page later.

Do not do yet:

- Do not write Company Information in Business Central from this request alone.
- Do not treat fictional VAT wording as compliance approval.

## DR-CORE-002 Organization model

Realism verdict: pass.

What works:

- The request forces classification instead of turning every department into a dimension.
- It separates legal entity, BC company, physical location, dimension candidate, role group and reporting-only value.
- Customer owners reflect realistic tension between reporting, IT and phase-1 scope.

Open realism gaps:

- No first organization table exists yet.
- Location and dimension boundaries will need consultant review.
- Intercompany and foreign-company implications are only guarded, not modeled.

Required follow-ups:

- Create `UNIVERSAARL_CORE_OrganizationModel` simulated table.
- Add columns for classification, phase and owner.
- Turn unclear values into decision items before dimension or role setup.

Do not do yet:

- Do not create dimensions or locations until classification is reviewed.
- Do not assume every country/company uses the German SKR04-oriented foundation.

## DR-MD-001 Customers

Realism verdict: pass as data request; blocked for setup.

What works:

- Sales and finance ownership is plausible.
- Required fields include posting, tax, payment and scenario purpose.
- Manual example and scalable route are separated.
- Missing setup dependencies are explicit blockers.

Open realism gaps:

- No actual fictional customer rows exist yet.
- Payment terms and posting groups are not guaranteed to exist.
- No route decision yet between manual sample, template, configuration package or import.

Required follow-ups:

- Create a simulated customer request table with at least one simple training customer and one business customer.
- Add validation columns for posting group readiness, VAT group readiness and payment terms.
- Create a route decision before mass creation.

Do not do yet:

- Do not create customers before finance dependencies are stable.
- Do not import customer lists without template/configuration-package validation.

## DR-MD-002 Vendors

Realism verdict: pass as data request; blocked for setup.

What works:

- Purchasing and finance ownership is realistic.
- Bank/payment data is explicitly gated.
- Vendor data is tied to P2P, fixed assets, services and payment scenarios.
- Required fields include payment method/terms and posting group dependencies.

Open realism gaps:

- No fictional vendor rows exist yet.
- Payment method dependency is not yet resolved.
- Bank/payment scenarios need separate risk handling.

Required follow-ups:

- Create a simulated vendor request table with at least one material vendor, one service vendor and one later fixed-asset vendor candidate.
- Add payment/bank field boundary: placeholder only until payment case unlocks it.
- Create vendor setup route decision after dependencies are known.

Do not do yet:

- Do not store real bank data.
- Do not create payment-ready vendors before payment method and bank/payment gates exist.

## DR-MD-003 Items, services and non-inventory items

Realism verdict: pass as data request; blocked for setup.

What works:

- The request distinguishes inventory, service and non-inventory behavior.
- It links item type to posting groups, costing, UOM, inventory value and training.
- It avoids treating an item card as just a document-line placeholder.
- It names route alternatives: manual, template, configuration package, Excel-assisted package, API or park.

Open realism gaps:

- No product catalog exists yet.
- No UOM baseline, item category baseline or posting setup readiness exists.
- Inventory valuation and costing are not yet proven.

Required follow-ups:

- Create a simulated product/service table with type, UOM, scenario and dependency status.
- Add at least one simple manual learning item, one service, one non-inventory item and one parked inventory/costing-sensitive item.
- Create route decision before bulk item creation.

Do not do yet:

- Do not create item records before posting groups, UOM and costing assumptions are explicit.
- Do not claim inventory valuation without later evidence.

## Next project work

1. Create simulated data tables for `CORE-001`, `CORE-002`, `MD-001`, `MD-002` and `MD-003`.
2. Add Jira import rows or ticket candidates only after the simulated tables include validation status.
3. Create a Playwright scenario catalog for read-first validation of Company Information, customer/vendor/item cards and list/card reopen proof.
4. Keep live BC work paused until a read-first foundation/master-data preflight is selected and gated.
