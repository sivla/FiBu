# FIXEDASSETS-013 Setup-Fit Decision

Status: done-decision-no-bc-run  
Environment: MCP_1_20260210  
Company: RM-DEMO  
Work type: setup-fit decision  
Posting: no  
Setup change: no  
Evidence status: labor decision, not DE-final

## Goal

Decide whether the Fixed Assets evidence chain is sufficient to allow exactly one narrow idempotent UI-first setup fit in the next run.

The target objects from chapter 21 are:

| Target | Book role | Decision |
|---|---|---|
| `HGB` | Depreciation book / AfA-Buch | approved as the only next narrow setup-fit candidate |
| `MACHINES` | FA Posting Group / Anlagenbuchungsgruppe | not approved |
| `FA-CNC-01` | Fixed Asset | not approved |
| `K30000` | Vendor for acquisition invoice | not approved |

## Evidence Used

- `FIXEDASSETS-009`: gate chain and stop criteria.
- `FIXEDASSETS-010`: read-only UI contexts for FA Posting Groups, Depreciation Books, Fixed Assets and Vendors.
- `FIXEDASSETS-011`: decision that form preflight is needed before setup.
- `FIXEDASSETS-012`: cancel-safe empty cards/template dialog and abort paths.
- Screenshot QA from `FIXEDASSETS-012`.
- Microsoft Learn:
  - [Set Up Fixed Asset Depreciation](https://learn.microsoft.com/en-us/dynamics365/business-central/fa-how-setup-depreciation)
  - [Set Up General Fixed Assets Information](https://learn.microsoft.com/en-au/dynamics365/business-central/fa-how-setup-general)
  - [Acquire fixed assets](https://learn.microsoft.com/en-us/dynamics365/business-central/fa-how-acquire)

## Decision

`HGB` is the only safe next candidate for a later explicit setup-fit run.

Reason:

- The Depreciation Book Card was opened cancel-safe in `FIXEDASSETS-012`.
- The visible form is narrow compared with the FA Posting Group Card.
- The setup object is a prerequisite layer before asset acquisition.
- Microsoft Learn treats depreciation books as the place where depreciation terms are defined for fixed assets.
- Creating `HGB` does not by itself post anything.
- Creating `HGB` does not require the many G/L account fields that a new FA Posting Group requires.

This does not mean `HGB` has been created. It only approves the next run to attempt a controlled idempotent UI-first fit.

## Why The Other Targets Stay Locked

| Target | Why not safe yet | Needed before release |
|---|---|---|
| `MACHINES` | The FA Posting Group Card shows many account fields such as Acquisition Cost Account, Accum. Depreciation Account, Maintenance Expense Account and disposal/balancing accounts. Account values must not be guessed. | separate account-mapping decision from CRONUS reference or German target account plan |
| `FA-CNC-01` | The Fixed Asset Card depends on depreciation book, posting group and acquisition path. Creating the asset now would produce a partial object without a proven setup chain. | `HGB`, posting group decision, acquisition path, required fields |
| `K30000` | The Vendor New action opens a template dialog. The downstream Vendor Card fields and posting/payment-group defaults were not mapped in this Fixed Assets run. | separate vendor setup path and template decision |

## Next Run Allowed

`FIXEDASSETS-014-HGB-DEPRECIATION-BOOK-FIT`

Allowed:

- stay in `MCP_1_20260210`
- use company `RM-DEMO`
- open `Depreciation Books`
- check whether `HGB` already exists
- if missing, open the scoped Depreciation Book Card
- create exactly one depreciation book with:
  - `Code = HGB`
  - `Description = HGB depreciation book`
- keep visible defaults unless the UI or Microsoft documentation requires a change
- capture before/after screenshots where `HGB` is visible
- write compact JSON and Markdown evidence

Not allowed:

- no Fixed Asset `FA-CNC-01`
- no FA Posting Group `MACHINES`
- no Vendor `K30000`
- no Purchase Invoice
- no acquisition
- no depreciation run
- no posting
- no German final HGB/accounting claim

## Beginner Learning

For a beginner, the important point is the sequence. A depreciation book is part of the valuation/depreciation setup. It is not the asset itself and it is not the account mapping. Therefore, `HGB` can be prepared before `FA-CNC-01`, but a real acquisition still needs the posting group, vendor or journal path, preview/check and posting trace.

## Book Impact

Chapter 21 should not tell the reader to create `FA-CNC-01` first in the current RM-DEMO lab. The evidence-based sequence is:

1. prove setup pages,
2. fit `HGB` depreciation book,
3. decide and fit `MACHINES` account mapping,
4. create the asset/vendor/acquisition path,
5. only then preview and post.

This is a CRONUS-USA lab decision. It is not a German final Fixed Assets proof.
