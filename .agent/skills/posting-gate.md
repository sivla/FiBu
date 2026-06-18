# Skill: posting-gate

Use this skill before Preview Posting, Post, Ship, Invoice, payment, acquisition, depreciation or any setup-changing action.

## Gate decision

Default is locked.

Allow only if all are true:

- active case explicitly allows the action
- company and instance are confirmed
- required master data and setup are visible or documented
- expected entry types are defined
- screenshot/evidence plan exists
- cleanup or no-duplicate rule exists

## Fixed Assets current lock

For `FIXEDASSETS-065` the following remain forbidden:

- `FA-CNC-01` entry in Purchase Invoice
- `K30000` entry in Purchase Invoice
- Preview Posting
- Post
- acquisition
- depreciation
- setup change
- company switch
- API shortcut
