# mcp-open-corporates

OpenCorporates MCP — Global company registry data (BYO key)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Open Corporates data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
