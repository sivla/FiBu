# P2P-032 Purchase Journal Controlled Posting Trace

Status: `controlled-labor-posting`, `posting-trace`, `needs-german-final-rebuild`.

Document No.: `P2P032-682298`
External Document No.: `EXT-P2P032-682298`

## Preflight

- Journal Check clean: yes
- Preview Posting opened: yes
- Post dialog visible before confirmation: yes

## Posting

- Posted: yes
- Confirmed exactly once by this test: yes

## Trace

| Entry type | Visible | Evidence |
|---|---:|---|
| vendor-ledger-payment | yes | 090-vendor-ledger-payment-page-text.txt |
| detailed-vendor-ledger-payment | yes | 091-detailed-vendor-ledger-payment-page-text.txt |
| gl-entries-payment | yes | 092-gl-entries-payment-page-text.txt |

## Boundary

- RM-DEMO / MCP_1_20260210 laboratory only.
- No setup change, no company switch, no API shortcut.
- No German final proof; must be rebuilt later in a German target company.
