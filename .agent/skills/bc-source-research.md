# Skill: bc-source-research

## Skill name
bc-source-research

## Purpose
Research Business Central, German accounting/compliance or Microsoft implementation facts before they become book claims, and separate source-backed product facts from locally proven UI evidence.

## Use when
- A Business Central behavior, setup meaning, module concept or release-dependent feature is not already proven by local Evidence.
- A book section needs a final product, VAT, GoBD, e-invoice, reporting, setup or best-practice claim.
- Local UI evidence shows what happened, but the agent needs to explain why Business Central behaves that way.
- A claim could affect accounting correctness, compliance, tax, posting interpretation or implementation guidance.

## Do not use when
- The task is only local formatting, JSON validation or path cleanup.
- The claim is explicitly marked as lab observation and does not explain product semantics.
- The answer is already present in a linked local Evidence result and no broader product claim is needed.

## Inputs
- Question or claim to validate.
- Target book section or evidence file.
- Local observation, screenshot or result JSON if available.
- Instance and company context, especially whether the observation is from `playthru` / `UNIVERSAARL-DE` or legacy `RM-DEMO`.
- Required claim level: `lab-observation`, `book-candidate`, `final-product-claim`, `legal-or-tax-claim`.

## Output JSON schema
```json
{
  "question": "",
  "claimLevel": "",
  "localEvidenceUsed": [],
  "sourcesUsed": [],
  "allowedClaim": "",
  "notAllowedClaim": "",
  "bookBoundary": "",
  "needsMoreEvidence": false,
  "nextStep": ""
}
```

## Rules
- Prefer local Universaarl Evidence for UI claims.
- Always state the instance and company behind local UI evidence before promoting a claim.
- Use Microsoft Learn or official Microsoft documentation for Business Central product/setup claims.
- Use Microsoft release plans for release-dependent feature availability.
- Use official German/EU sources for legal, VAT, GoBD or e-invoice claims.
- Do not turn RM-DEMO or CRONUS lab behavior into a German final claim.
- Do not cite memory for unstable Business Central, tax, legal, release or licensing facts.

## Stop if
- No official source supports a final claim.
- Local Evidence contradicts the source and the contradiction is not explained.
- The claim would require tax/legal advice beyond source-backed product explanation.
- The source is not specific enough for the book wording.

## Safety gates
- Source Claim Rules
- Screenshot Truth Gate
- Zero Open Questions Gate
- Smart Decision Gate for content-changing book patches

## Preferred taskClass
judge_work

## Default model class
gpt-5.5-low

## Max context lines
220

## Max output tokens
1200

## Tool preferred
yes, web/search or official documentation lookup when the fact is not stable locally

## Updates state
yes, update evidence README, source registry, open questions register or book patch plan when the research affects a claim
