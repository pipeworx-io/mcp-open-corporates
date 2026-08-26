# mcp-open-corporates

OpenCorporates MCP — Global company registry data (BYO key)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `search_companies` | Search global company registries by name across 140+ jurisdictions. Returns company name, jurisdiction, status, type, incorporation date, and registered address. REQUIRES your own OpenCorporates API token via _apiKey — their public API is closed and keyless calls return 401. For keyless global company lookup use gleif search_lei instead. Example: search_companies({query:"Tesla", country:"us", _apiKey:"..."}) |
| `get_company` | Get full details for a specific company by jurisdiction and company number. Returns registration details, officers, filings, and industry codes. REQUIRES your own OpenCorporates API token via _apiKey — their public API is closed and keyless calls return 401. Example: get_company({jurisdiction:"us_de", number:"4483789", _apiKey:"..."}) for a Delaware company. |
| `search_officers` | Search company officers and directors by name. Returns officer name, position, company, start/end dates, and nationality. REQUIRES your own OpenCorporates API token via _apiKey — their public API is closed and keyless calls return 401. Example: search_officers({query:"Elon Musk", _apiKey:"..."}) |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "open-corporates": {
      "url": "https://gateway.pipeworx.io/open-corporates/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/open-corporates/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Open Corporates data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
