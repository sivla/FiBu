# Local Tooling Status

Status date: 2026-07-05
Scope: local workstation checks during `PROJECT-IMPROVEMENT-FREEZE-001`.

This file records local tool availability without activating MCP servers, logging in, publishing AL apps or opening Business Central.

## Checked tools

| Tool | Status | Observed command/source | Allowed use during freeze | Gate before stronger use |
| --- | --- | --- | --- | --- |
| `altool` | missing | `Get-Command altool` returned no command | none | install/provenance decision before use |
| `al` | missing | `Get-Command al` returned no command | none | install/provenance decision before use |
| `dotnet` | available | `C:\Program Files\dotnet\dotnet.exe`, version `6.0.428` | local read/build diagnostics only when a case needs it | no publish/deploy side effects without explicit case |
| `npx` | available | `C:\Program Files\nodejs\npx.ps1`, version `10.9.3` | existing repo scripts and non-live checks | package provenance review before new community MCP/tool execution |

## MCP stance

- Microsoft Learn Docs MCP is the preferred read-only source path for Business Central product facts when available.
- Official AL MCP / AL tooling can support compile, build, diagnostics and symbols after the tool exists locally.
- AL auth, AL publish, debugging sessions, Business Central MCP write actions and live sandbox writes remain locked until an explicit case grants them.
- Community MCPs such as AL Dependency MCP and BC Code Intelligence MCP are advisory only. They cannot support final book claims without Microsoft Learn, local Evidence or another authoritative source.

## Current blocker classification

The missing `altool` / `al` commands are not a Business Central blocker. They only mean AL MCP workflows are not locally runnable from this workstation yet. Treat them as `tooling-unavailable` unless a future AL-specific case requires installation.
