# MCP Server Registry

Purpose: curated MCP options for the FiBu / Business Central book project.

This registry separates safe read-only research, AL development tooling, community code-intelligence tools and live Business Central data access. Do not treat all MCPs as equal: some are documentation sources, some can compile/publish code, and some can read or mutate Business Central data.

Local availability is tracked in `.agent/mcp/LOCAL-TOOLING-STATUS.md`. Do not assume `altool`, `al`, `dotnet`, `npx` or an MCP server exists locally until that file or a fresh check confirms it.

## Priority

| Priority | MCP | Status | Use for | Default gate |
| --- | --- | --- | --- | --- |
| 1 | Microsoft Learn Docs MCP | official | MB-800, Microsoft Learn, BC product docs, setup and release research | allow read-only |
| 2 | Official AL MCP Server | official | AL compile/build/diagnostics/symbol search; auth and publish only when explicitly allowed | allow compile/read; gate auth/publish |
| 3 | Business Central MCP Server | official | Sandbox data/API access; start read-only | read-only first |
| 4 | AL Dependency MCP Server | community | `.alpackages` symbol/dependency exploration | allow only after package/version review |
| 5 | BC Code Intelligence MCP | community | BC/AL review guidance and architecture heuristics | advisory only |
| 6 | Troubleshooting MCP Server for AL | official VS Code debug surface | paused AL debug sessions, call stack, variables, source frames, breakpoints | debug-session only |

## Official Microsoft Learn Docs MCP

Use for source-backed Business Central and MB-800 research.

```json
{
  "mcpServers": {
    "microsoft.docs.mcp": {
      "type": "http",
      "url": "https://learn.microsoft.com/api/mcp"
    }
  }
}
```

Rules:

- Safe as a default read-only source.
- Prefer this before general web search for Microsoft product facts.
- Use it from `bc-source-research` before final book claims.

## Official AL MCP Server

Use for AL development operations when an AL workspace exists.

```json
{
  "mcpServers": {
    "al": {
      "type": "stdio",
      "command": "altool",
      "args": ["launchmcpserver", "--transport", "stdio"]
    }
  }
}
```

Primary tool classes:

- `al_compile`, `al_build`, `al_getdiagnostics`
- `al_downloadsymbols`, `al_symbolsearch`, `al_getpackagedependencies`
- `al_auth_login`, `al_auth_logout`
- `al_publish`

Rules:

- Compile, build, diagnostics and symbol search are normal AL-dev operations.
- `al_auth_login` and `al_auth_logout` need an auth decision because they open browser/token flows.
- `al_publish` needs a Smart Decision Card and sandbox target confirmation.
- Do not use AL publish tooling as a shortcut for book Evidence unless the case is explicitly about AL extensions.

## Troubleshooting MCP Server for AL

Use only during an active paused AL debugging session in VS Code. This is not a normal always-on project MCP.

Useful for:

- call stack analysis
- variable inspection
- source frame retrieval
- programmatic breakpoint placement

Rules:

- Requires an active debug session paused at a breakpoint or runtime error.
- Verify the findings against local source and expected BC behavior.
- Do not treat debug-state findings as user-facing book evidence without a separate UI/evidence path.

## Business Central MCP Server

Use for direct Business Central API-backed access after a separate environment configuration exists.

Default stance:

- Start read-only.
- Use only against the active sandbox/target instance.
- Do not enable create/modify/delete/bound actions until a Smart Decision Card authorizes the exact configuration.

Example placeholder:

```json
{
  "mcpServers": {
    "businesscentral-readonly": {
      "type": "http",
      "url": "https://mcp.businesscentral.dynamics.com",
      "headers": {
        "TenantId": "<tenant-guid>",
        "EnvironmentName": "playthru",
        "Company": "UNIVERSAARL-DE",
        "ConfigurationName": ""
      }
    }
  }
}
```

Rules:

- Keep tenant IDs and real connection strings out of committed files.
- Read-only is acceptable for inventory, context and source-of-truth checks.
- Write operations require explicit BC MCP Server configuration in Business Central plus project gates.

## Community MCPs

### AL Dependency MCP Server

Use for compiled symbol/package visibility from `.alpackages`.

```json
{
  "mcpServers": {
    "al-symbols-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "al-mcp-server"]
    }
  }
}
```

Rules:

- Review package/version before enabling.
- Treat as code navigation and dependency analysis, not as a Microsoft source.
- Prefer official AL MCP symbol search when it is enough.

### BC Code Intelligence MCP

Use as advisory BC/AL architecture and review guidance.

```json
{
  "mcpServers": {
    "bc-code-intelligence": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "bc-code-intelligence-mcp"]
    }
  }
}
```

Rules:

- Community guidance is not a source for book claims.
- Use for second opinions, design review and AL best-practice prompts.
- Verify any recommendation against Microsoft Learn, local Evidence or local code.

## Activation Policy

1. Add only read-only MCPs by default.
2. Add local command MCPs only after command availability and package provenance are checked.
3. Add Business Central write tools only after sandbox, company, purpose, Evidence and rollback/cleanup path are documented.
4. Keep private local connection details in an ignored local config file.
5. Record which MCP affected a book claim, helper, capability or case decision.
