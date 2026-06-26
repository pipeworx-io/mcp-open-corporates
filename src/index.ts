interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * OpenCorporates MCP — Global company registry data (free, no auth, rate limited)
 *
 * Tools:
 * - search_companies: search companies by name and country
 * - get_company: get company details by jurisdiction and company number
 * - search_officers: search company officers/directors by name
 */


const BASE = 'https://api.opencorporates.com/v0.4';

// ── Types ─────────────────────────────────────────────────────────────

type OCCompany = {
  name?: string | null;
  company_number?: string | null;
  jurisdiction_code?: string | null;
  incorporation_date?: string | null;
  dissolution_date?: string | null;
  company_type?: string | null;
  registry_url?: string | null;
  opencorporates_url?: string | null;
  current_status?: string | null;
  registered_address_in_full?: string | null;
  industry_codes?: { code?: string; description?: string }[] | null;
  source?: { publisher?: string; url?: string } | null;
  alternative_names?: { company_name?: string; type?: string }[] | null;
  agent_name?: string | null;
  agent_address?: string | null;
  previous_names?: { company_name?: string }[] | null;
  branch_status?: string | null;
};

type OCOfficer = {
  id?: number | null;
  name?: string | null;
  position?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  opencorporates_url?: string | null;
  occupation?: string | null;
  nationality?: string | null;
  company?: {
    name?: string | null;
    company_number?: string | null;
    jurisdiction_code?: string | null;
    opencorporates_url?: string | null;
  } | null;
};

type OCSearchResponse<T> = {
  api_version?: string;
  results: {
    companies?: { company: T }[];
    officers?: { officer: T }[];
    total_pages?: number;
    total_count?: number;
    page?: number;
    per_page?: number;
  };
};

type OCCompanyResponse = {
  results: {
    company: OCCompany;
  };
};

function formatCompany(c: OCCompany) {
  return {
    name: c.name ?? null,
    company_number: c.company_number ?? null,
    jurisdiction: c.jurisdiction_code ?? null,
    status: c.current_status ?? null,
    type: c.company_type ?? null,
    incorporation_date: c.incorporation_date ?? null,
    dissolution_date: c.dissolution_date ?? null,
    registered_address: c.registered_address_in_full ?? null,
    agent_name: c.agent_name ?? null,
    registry_url: c.registry_url ?? null,
    opencorporates_url: c.opencorporates_url ?? null,
    industry_codes: (c.industry_codes ?? []).map((ic) => ({
      code: ic.code ?? null,
      description: ic.description ?? null,
    })),
    previous_names: (c.previous_names ?? []).map((pn) => pn.company_name ?? null).filter(Boolean),
    branch_status: c.branch_status ?? null,
  };
}

function formatOfficer(o: OCOfficer) {
  return {
    id: o.id ?? null,
    name: o.name ?? null,
    position: o.position ?? null,
    start_date: o.start_date ?? null,
    end_date: o.end_date ?? null,
    occupation: o.occupation ?? null,
    nationality: o.nationality ?? null,
    company_name: o.company?.name ?? null,
    company_number: o.company?.company_number ?? null,
    company_jurisdiction: o.company?.jurisdiction_code ?? null,
    opencorporates_url: o.opencorporates_url ?? null,
  };
}

// ── Tool definitions ──────────────────────────────────────────────────

const tools: McpToolExport['tools'] = [
  {
    name: 'search_companies',
    description:
      'Search global company registries by name. Returns company name, jurisdiction, status, type, incorporation date, and registered address. Covers 140+ jurisdictions worldwide. Example: search_companies("Tesla", country="us")',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Company name to search (e.g., "Acme Corp")' },
        country: { type: 'string', description: 'ISO 2-letter country code (e.g., "us", "gb", "de")' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_company',
    description:
      'Get full details for a specific company by jurisdiction and company number. Returns registration details, officers, filings, and industry codes. Example: get_company("us_de", "4483789") for a Delaware company.',
    inputSchema: {
      type: 'object',
      properties: {
        jurisdiction: { type: 'string', description: 'Jurisdiction code (e.g., "us_de" for Delaware, "gb" for UK, "ca_on" for Ontario)' },
        number: { type: 'string', description: 'Company registration number' },
      },
      required: ['jurisdiction', 'number'],
    },
  },
  {
    name: 'search_officers',
    description:
      'Search company officers and directors by name. Returns officer name, position, company, start/end dates, and nationality. Example: search_officers("Elon Musk")',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Officer name to search (e.g., "John Smith")' },
      },
      required: ['query'],
    },
  },
];

// ── callTool dispatcher ───────────────────────────────────────────────

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search_companies':
      return searchCompanies(args.query as string, args.country as string | undefined);
    case 'get_company':
      return getCompany(args.jurisdiction as string, args.number as string);
    case 'search_officers':
      return searchOfficers(args.query as string);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── Tool implementations ─────────────────────────────────────────────

async function searchCompanies(query: string, country?: string) {
  const params = new URLSearchParams({ q: query, format: 'json' });
  if (country) params.set('country_code', country);

  const res = await fetch(`${BASE}/companies/search?${params}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`OpenCorporates API error: ${res.status}`);

  const data = (await res.json()) as OCSearchResponse<OCCompany>;
  const companies = (data.results.companies ?? []).map((c) => formatCompany(c.company));

  return {
    query,
    total: data.results.total_count ?? companies.length,
    returned: companies.length,
    companies,
  };
}

async function getCompany(jurisdiction: string, number: string) {
  const res = await fetch(`${BASE}/companies/${jurisdiction}/${number}?format=json`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`OpenCorporates API error (${res.status}): company ${jurisdiction}/${number} not found`);

  const data = (await res.json()) as OCCompanyResponse;
  return formatCompany(data.results.company);
}

async function searchOfficers(query: string) {
  const params = new URLSearchParams({ q: query, format: 'json' });

  const res = await fetch(`${BASE}/officers/search?${params}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`OpenCorporates API error: ${res.status}`);

  const data = (await res.json()) as OCSearchResponse<OCOfficer>;
  const officers = (data.results.officers ?? []).map((o) => formatOfficer(o.officer));

  return {
    query,
    total: data.results.total_count ?? officers.length,
    returned: officers.length,
    officers,
  };
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
