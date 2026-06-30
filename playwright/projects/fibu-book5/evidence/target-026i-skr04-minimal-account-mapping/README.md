# TARGET-026I SKR04 Minimal Account Mapping

Status: `observed`

Instance: `playthru`

Company: `UNIVERSAARL-DE`

## Purpose

This local-analysis evidence defines the small source-gated SKR04 start list for the German Universaarl company before the next Business Central setup write.

## Result

- `1200` is no longer treated as bank. The existing `1200 Bank Saarland` account needs correction or blocker classification.
- `1800` is the next Bank Saarland candidate.
- VAT, posting groups, master data, Preview Posting and posting remain locked until the starter accounts are visible and reopened in Business Central.
- Foreign companies do not inherit SKR04 automatically; they need their own localized chart-of-accounts gate.

## Next

Run `TARGET-026J-SKR04-ACCOUNT-CLEANUP-AND-SETUP-GATE` in Business Central only after confirming the controlled account setup route.
