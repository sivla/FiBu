# Case Study Architecture Gate

Purpose: keep Universaarl as a realistic Business Central implementation, not a loose collection of pages, tests and screenshots.

The agent acts as a Business Central consultant and solution architect. Before setup, master-data, process or book decisions, it must connect the action to the fictional company.

## Universaarl Company Frame

Use this frame unless a newer approved company blueprint supersedes it:

- Legal entity: Universaarl GmbH
- Target company: `UNIVERSAARL-DE`
- Instance: `playthru`
- Country focus: Germany first, later optional additional companies/countries
- Currency: EUR unless a specific case justifies another currency
- Chart logic: SKR04-oriented starter chart for the German company, not a full tax-advisor-approved chart
- Business shape: trading, services, inventory, later manufacturing/projects/service/fixed assets
- Organization axes: departments, product lines, channels, regions and locations
- Setup theme: build a plausible company foundation before sales, purchase, inventory, payment and reporting scenarios

## Required Questions

Before a larger setup or book section is accepted, answer:

- Which Universaarl business need does this serve?
- Which BC concept is being configured or explained?
- Which dependency comes before this step?
- Which downstream process will use the result?
- Which route is recommended for a real project and why?
- What would be risky, fragile or untypical for a real BC implementation?
- What source, evidence or assumption supports the decision?
- What must Playwright prove to make the step repeatable?
- How does the book explain the decision without sounding like a test log?

## Topic Architecture Checklist

| Topic | Consultant Question |
| --- | --- |
| Company / Environment | Is this the right company and data basis for the book world? |
| Fiscal year / periods | Does the period plan support posting, reporting and close examples? |
| Number series | Are codes readable, controlled and suitable for audit/reopen proof? |
| Chart of accounts | Are accounts minimal, SKR04-oriented and correctly typed before posting groups use them? |
| Posting groups | Do they explain account determination instead of hiding it? |
| VAT setup | Is product logic separated from German tax/compliance proof? |
| Dimensions | Do dimensions match departments, product lines, channels and reporting goals? |
| Master data | Do customers, vendors, items and locations serve multiple book processes? |
| Documents / journals | Is the start state, expected BC reaction, validation and correction path clear? |
| Reports / entries | Does the process create enough entries for meaningful screenshots and explanations? |
| Roles / permissions | Does the role model fit a realistic implementation and not just SUPER testing? |

## Stop Or Rework

Stop or redesign the step if:

- it only exists because the queue says so,
- it creates data without a book or business purpose,
- it explains a screenshot without a BC concept,
- it repeats a fragile Playwright path without a new hypothesis,
- it uses RM-DEMO, CRONUS or legacy lab data as active Universaarl truth,
- it claims final accounting, tax or compliance correctness without the required source/evidence.

## Output

For material setup/book decisions, include a short `caseStudyArchitecture` block in the case, result, evidence README or decision card:

```json
{
  "caseStudyArchitecture": {
    "businessNeed": "",
    "bcConcept": "",
    "dependencyBefore": [],
    "downstreamProcesses": [],
    "recommendedImplementationRoute": "",
    "sourceOrEvidenceBasis": [],
    "bookExplanation": "",
    "playwrightProofNeeded": ""
  }
}
```
