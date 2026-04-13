# MatCraft IP Radar — Technical Documentation

> **AI-powered patent landscape intelligence for materials science.**
> Search 125M+ patents worldwide, categorize with AI, identify white spaces, and assess freedom-to-operate — all from your browser.

**Live at:** [matcraft.ai/ip-radar](https://matcraft.ai/ip-radar)
**API Endpoint:** `POST https://api.matcraft.ai/api/v1/ip-radar/search`
**Authentication:** None required (public endpoint)
**Rate Limit:** 120 req/min per IP (same as platform)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Data Sources](#3-data-sources)
4. [AI Analysis Engine](#4-ai-analysis-engine)
5. [Patent Categories](#5-patent-categories)
6. [API Reference](#6-api-reference)
7. [Frontend Dashboard](#7-frontend-dashboard)
8. [Caching Strategy](#8-caching-strategy)
9. [Query Expansion](#9-query-expansion)
10. [Patent Status Logic](#10-patent-status-logic)
11. [White Space Detection](#11-white-space-detection)
12. [Freedom-to-Operate Assessment](#12-freedom-to-operate-assessment)
13. [Cost Analysis](#13-cost-analysis)
14. [Limitations & Disclaimers](#14-limitations--disclaimers)
15. [Comparison with Competitors](#15-comparison-with-competitors)

---

## 1. Overview

IP Radar is MatCraft's patent landscaping tool designed specifically for materials science. It answers the question: **"Who has patents on this material, and where are the opportunities?"**

### What it does

1. Takes a materials science query (formula, material name, application keyword)
2. Searches 125M+ patents across 100+ patent offices worldwide
3. Categorizes each patent into 7 materials science domains using AI
4. Identifies unpatented white spaces (innovation opportunities)
5. Generates a freedom-to-operate (FTO) assessment
6. Presents results in an interactive dashboard with charts and filterable cards

### Example queries

| Query | What it finds |
|-------|--------------|
| `LiFePO4 battery` | 125,000+ patents on lithium iron phosphate cathodes |
| `Perovskite solar cell` | Patents on ABX3 absorbers, fabrication, stability |
| `SiC power semiconductor` | Silicon carbide device patents, wafer growth, doping |
| `Graphene composite` | Graphene-reinforced materials patents |
| `MoS2 catalyst` | Molybdenum disulfide catalysis patents |
| `Solid-state electrolyte` | Solid-state battery electrolyte patents |
| `High-entropy alloy` | Multi-principal-element alloy composition patents |
| `MOF gas separation` | Metal-organic framework membrane patents |

---

## 2. Architecture

```
┌────────────────────┐     ┌──────────────────────────────────────────────┐
│  Frontend           │     │  Backend (FastAPI on Cloud Run)               │
│  /ip-radar          │────▶│  POST /api/v1/ip-radar/search                │
│  IPRadar.tsx        │     │  ├── Input sanitization (500 char limit)     │
│  ~830 lines         │     │  ├── Query expansion (25+ material synonyms) │
│  Recharts + Motion  │     │  ├── Redis cache check (24-hour TTL)         │
└────────────────────┘     │  ├── Patent search (waterfall)               │
                           │  │   ├── 1. Google Patents XHR (primary)     │
                           │  │   ├── 2. EPO OPS (fallback)               │
                           │  │   └── 3. Lens.org (fallback)              │
                           │  ├── AI analysis                             │
                           │  │   ├── Gemini 2.0 Flash (primary)          │
                           │  │   └── Rule-based classifier (fallback)    │
                           │  ├── Patent status computation               │
                           │  ├── White space identification              │
                           │  ├── Statistics aggregation                  │
                           │  └── Cache result in Redis                   │
                           └──────────────────────────────────────────────┘
```

### Request flow

1. User enters query (e.g., "LiFePO4 battery cathode")
2. Frontend POSTs to `/api/v1/ip-radar/search`
3. Backend expands query with materials synonyms
4. Checks Redis cache (24-hour TTL)
5. If miss: searches Google Patents XHR → EPO OPS → Lens.org (waterfall)
6. Runs AI analysis (Gemini 2.0 Flash or rule-based fallback)
7. Computes patent statuses, aggregates statistics
8. Caches result, returns structured JSON
9. Frontend transforms response and renders dashboard

---

## 3. Data Sources

### Primary: Google Patents XHR

| Property | Value |
|----------|-------|
| **URL** | `https://patents.google.com/xhr/query` |
| **Coverage** | 125M+ patent publications worldwide |
| **Jurisdictions** | US, EP, WO, CN, JP, KR, AU, CA, IN, GB, and more |
| **Cost** | Free (unofficial endpoint) |
| **Auth required** | No |
| **Rate limit** | Undocumented; browser-emulation headers required |

**How it works:**

The endpoint is the same XHR call that the Google Patents web UI makes. We send a query with browser-emulation headers:

```python
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...",
    "Accept": "application/json",
    "Referer": "https://patents.google.com/",
    "Origin": "https://patents.google.com",
}
```

**Response includes:**
- `total_num_results` — global count (e.g., 125,048 for "lithium iron phosphate")
- Patent clusters with: publication_number, title, snippet, assignee, filing_date, priority_date, grant_date, country_code, inventor, language, figures
- Summary statistics: top assignees with filing frequency by year range, top inventors, CPC classification codes

**Response prefix:** Google Patents prepends `)]}'` to the JSON response (XSS protection). We strip this before parsing.

### Fallback 1: EPO Open Patent Services

| Property | Value |
|----------|-------|
| **URL** | `https://ops.epo.org/3.2/rest-services/` |
| **Coverage** | 100M+ documents from 100+ patent offices |
| **Cost** | Free tier (requires OAuth for recent policy change) |
| **Auth** | Anonymous OAuth client credentials (free registration) |

**Query method:** CQL (Common Query Language)
```
ti="lithium iron phosphate" OR ab="lithium iron phosphate"
```

**Enrichment:** After initial search, batch-fetches bibliographic data (title, abstract, applicant, filing date) in groups of 20 for richer results.

### Fallback 2: Lens.org

| Property | Value |
|----------|-------|
| **URL** | `https://api.lens.org/patent/search` |
| **Coverage** | USPTO, EPO, WIPO, 100+ offices |
| **Cost** | Free tier: 50 requests/day |
| **Auth** | Bearer token (`LENS_ORG_TOKEN` env var) |

**Query method:** Elasticsearch-style JSON body with bool/should match on title and abstract.

### Waterfall priority

```
1. Google Patents XHR  →  if 0 results or error:
2. EPO OPS             →  if 0 results or error:
3. Lens.org            →  if 0 results:
4. Return empty (frontend shows mock demo data)
```

---

## 4. AI Analysis Engine

### Primary: Google Gemini 2.0 Flash

| Setting | Value |
|---------|-------|
| **Model** | `gemini-2.0-flash` |
| **Temperature** | 0.3 (low — precise, legally cautious) |
| **Max output tokens** | 8,192 |
| **Response format** | JSON (parsed from markdown-fenced output) |
| **API key** | `GOOGLE_API_KEY` or `GEMINI_API_KEY` env var |

### System prompt

```
You are an expert materials science patent analyst working for MatCraft,
a materials discovery platform. You analyze patent data to provide IP
landscaping intelligence for researchers and engineering teams.

Your tasks:
1. CATEGORIZE each patent into exactly one domain:
   Composition/Alloy, Process/Synthesis, Application,
   Coating/Surface Treatment, Nanostructure/Morphology,
   Characterization Method, or Other.
2. SUMMARIZE each patent's key claim in ONE sentence —
   focus on what is specifically protected.
3. SCORE relevance (0.0-1.0) to the queried material.
4. IDENTIFY white spaces (unpatented opportunities).
5. WRITE an executive summary of the IP landscape.
6. PROVIDE a freedom-to-operate assessment.

Be precise, legally cautious, and actionable.
Always note that this is AI-generated analysis and not legal advice.
```

### User prompt (per request)

```
Analyze the following patent landscape for: "{query}"

PATENTS FOUND ({count} total):
- [{patent_id}] "{title}" (Assignee: {assignee}, Filed: {filing_date}, {country})
  Snippet: {snippet[:300]}
...

For each patent:
1. Classify into ONE category
2. Summarize the exact legal claim boundary in ONE sentence
3. Score relevance from 0.0 to 1.0

Then identify white spaces and provide executive summary + FTO assessment.

Respond in JSON with keys: patent_analyses, white_spaces, executive_summary, fto_assessment
```

### Fallback: Rule-based classifier

When Gemini is unavailable (no API key, quota exceeded, import error), a keyword-based classifier runs:

**Category detection keywords:**

| Category | Keywords (title + snippet) |
|----------|---------------------------|
| Composition/Alloy | alloy, composition, compound, doped, substitut |
| Process/Synthesis | method, process, synthesis, fabricat, manufactur, prepar |
| Application | battery, solar, catalys, sensor, device, electrode, cell |
| Coating/Surface Treatment | coating, surface, film, layer, deposit, plat |
| Nanostructure/Morphology | nano, quantum dot, nanowire, nanoparticle, thin film, 2D |
| Characterization Method | characteriz, measur, detect, analys, spectroscop, diffract |
| Other | (default) |

**Relevance scoring:** Keyword overlap between query terms and patent title+snippet, normalized to 0.0-1.0. Minimum 0.3 for any matched patent.

**Limitations of fallback:**
- No claim-by-claim analysis
- No white space identification (uses category-gap heuristic instead)
- No executive summary (uses template)
- No FTO assessment (uses generic template)

---

## 5. Patent Categories

The AI classifies each patent into exactly one of 7 materials science categories:

| Category | Description | Color (UI) | Example |
|----------|-------------|------------|---------|
| **Composition/Alloy** | Material compositions, alloys, compounds, doped materials | Indigo `#6366f1` | "LiFePO4/C composite cathode material" |
| **Process/Synthesis** | Manufacturing methods, synthesis routes, fabrication | Green `#22c55e` | "Method for preparing carbon-coated LFP" |
| **Application** | Device patents: batteries, solar cells, catalysts, sensors | Amber `#f59e0b` | "Lithium-ion battery with LFP cathode" |
| **Coating/Surface Treatment** | Coatings, surface modifications, thin films | Cyan `#06b6d4` | "Carbon nanotube coating on LFP particles" |
| **Nanostructure/Morphology** | Nanomaterials, morphology control, particle engineering | Pink `#ec4899` | "Nano-sized LFP with controlled crystal facets" |
| **Characterization Method** | Measurement, analysis, testing, quality control | Purple `#8b5cf6` | "XRD method for LFP crystal phase analysis" |
| **Other** | Everything else | Gray `#94a3b8` | — |

---

## 6. API Reference

### Request

```http
POST /api/v1/ip-radar/search
Content-Type: application/json

{
  "query": "LiFePO4 battery cathode",
  "max_patents": 50
}
```

| Field | Type | Default | Range | Description |
|-------|------|---------|-------|-------------|
| `query` | string | required | 1-500 chars | Material formula, name, or application keyword |
| `max_patents` | int | 50 | 1-200 | Max patents to fetch (AI analyzes all) |

### Response

```json
{
  "query": "LiFePO4 battery cathode",
  "total_patents_found": 125048,
  "analyzed_count": 50,
  "stats": {
    "by_category": {
      "Process/Synthesis": 18,
      "Application": 12,
      "Composition/Alloy": 8,
      "Nanostructure/Morphology": 6,
      "Coating/Surface Treatment": 4,
      "Characterization Method": 2
    },
    "by_assignee": {
      "Contemporary Amperex Technology Co.": 8,
      "GM Global Technology Operations": 5,
      "Semiconductor Energy Laboratory": 4
    },
    "by_jurisdiction": {
      "CN": 22,
      "US": 15,
      "JP": 8,
      "WO": 3,
      "EP": 2
    },
    "by_status": {
      "Active": 35,
      "Expired": 8,
      "Expiring Soon": 7
    },
    "filing_date_range": {
      "earliest": "2009-08-07",
      "latest": "2025-01-15"
    }
  },
  "patents": [
    {
      "patent_id": "US11721804B2",
      "title": "Carbon-coated lithium iron phosphate positive active material",
      "assignee": "Contemporary Amperex Technology Co., Limited",
      "filing_date": "2022-09-06",
      "jurisdiction": "US",
      "category": "Composition/Alloy",
      "claim_summary": "Claims carbon-coated LiFePO4 with specific H/D ratio of coating thickness to particle diameter for improved rate performance.",
      "relevance_score": 0.92,
      "status": "Active",
      "snippet": "A carbon component accounts for 0.7% to 1.3% of a total mass..."
    }
  ],
  "white_spaces": [
    {
      "domain": "Recycling & End-of-Life",
      "description": "Limited patents on closed-loop LFP recycling with lithium recovery rates >95%.",
      "confidence": 0.82,
      "rationale": "Most recycling patents focus on NMC/NCA cathodes. LFP-specific recycling at scale is underexplored."
    }
  ],
  "executive_summary": "The LiFePO4 patent landscape shows 125,000+ patents dominated by Chinese manufacturers...",
  "fto_assessment": "Several core synthesis patents are approaching expiration (2025-2028)...",
  "data_source": "Google Patents + rule-based analysis",
  "cached": false
}
```

### Response fields

| Field | Type | Description |
|-------|------|-------------|
| `query` | string | The expanded search query |
| `total_patents_found` | int | Global patent count for this query |
| `analyzed_count` | int | Number of patents with AI analysis |
| `stats` | object | Aggregated statistics (category, assignee, jurisdiction, status, dates) |
| `patents` | array | Individual patent analyses |
| `white_spaces` | array | Innovation opportunities identified by AI |
| `executive_summary` | string | AI-generated overview of the landscape |
| `fto_assessment` | string | High-level freedom-to-operate analysis |
| `data_source` | string | Which patent source was used |
| `cached` | bool | Whether this result came from cache |

---

## 7. Frontend Dashboard

### URL

`https://matcraft.ai/ip-radar`

Supports URL parameter for sharing: `?q=LiFePO4+battery`

### Components

| Component | Library | Purpose |
|-----------|---------|---------|
| Search bar | React state | Query input with quick example buttons |
| Loading animation | framer-motion | 5-step animated progress sequence |
| Stats bar | Tailwind grid | Total patents, analyzed, jurisdictions, date range |
| Executive summary | Card | AI overview with key findings |
| Category donut chart | Recharts PieChart | Patent distribution by category |
| Assignee bar chart | Recharts BarChart | Top patent holders |
| White space cards | framer-motion | Innovation opportunities with confidence bars |
| Patent cards | Filterable grid | Category tabs, status badges, relevance scores |
| FTO assessment | Card | Freedom-to-operate with legal disclaimer |

### Quick example buttons

Pre-configured material searches:
- LiFePO4 battery
- Perovskite solar cell
- SiC power semiconductor
- Graphene composite
- MoS2 catalyst
- Solid-state electrolyte

### Loading sequence

When a search is submitted, an animated 5-step progress shows:

1. "Searching patent databases..." (spinner)
2. "Found {n} patents across {j} jurisdictions..."
3. "AI analyzing patent landscape..."
4. "Identifying white spaces and opportunities..."
5. "Generating executive summary..."

Each step transitions with framer-motion spring animations.

### Patent card details

Each patent card shows:
- **Patent ID** — linked to `https://patents.google.com/patent/{id}`
- **Title** (bold)
- **Assignee**
- **Filing date** + jurisdiction badge (e.g., "US", "CN", "EP")
- **Status badge** — Active (green), Expiring Soon (amber), Expired (red)
- **Category badge** — color-coded matching the donut chart
- **Relevance score** — 0-100% bar
- **Claim summary** — AI-generated one-sentence summary
- **Snippet** — expandable patent text excerpt

### Filtering

Patent cards can be filtered by category via tab buttons:
All | Composition/Alloy | Process/Synthesis | Application | Coating | Nanostructure | Characterization | Other

---

## 8. Caching Strategy

### Redis cache

| Setting | Value |
|---------|-------|
| **Key format** | `ip_radar:{sha256(query\|max_patents)[:32]}` |
| **TTL** | 24 hours (86,400 seconds) |
| **Storage** | Full JSON response payload |
| **Behavior** | Skip gracefully if Redis unavailable |

### Why 24 hours?

Patent data changes slowly — new patents publish weekly, but the landscape for a given material doesn't shift dramatically day-to-day. 24 hours balances freshness with API latency and cost.

### Cache invalidation

No explicit invalidation. Cache expires naturally after 24 hours. Searching the same query within 24 hours returns the cached result instantly (< 50ms vs 5-15s for fresh search).

---

## 9. Query Expansion

The backend expands common materials science abbreviations into their full names for broader patent coverage:

| Input | Expanded to |
|-------|------------|
| `LiFePO4` | `LiFePO4 OR "lithium iron phosphate" OR "LFP cathode"` |
| `SiC` | `SiC OR "silicon carbide"` |
| `GaN` | `GaN OR "gallium nitride"` |
| `perovskite` | `perovskite OR "ABX3" OR "methylammonium lead"` |
| `graphene` | `graphene OR "graphene oxide" OR "reduced graphene oxide"` |
| `MOF` | `MOF OR "metal-organic framework" OR "metal organic framework"` |
| `HEA` | `HEA OR "high-entropy alloy" OR "multi-principal element"` |
| `OLED` | `OLED OR "organic light-emitting"` |
| `thermoelectric` | `thermoelectric OR "Seebeck" OR "Peltier"` |
| `superconductor` | `superconductor OR "superconducting" OR "high-Tc"` |

25+ material abbreviations are expanded. The expansion is applied before the patent search query is sent.

---

## 10. Patent Status Logic

```python
def _patent_status(filing_date: str) -> str:
    filing_year = int(filing_date[:4])
    current_year = date.today().year
    years_remaining = (filing_year + 20) - current_year

    if years_remaining <= 0:
        return "Expired"          # Past 20-year utility patent term
    elif years_remaining <= 2:
        return "Expiring Soon"    # Within 2 years of expiration
    else:
        return "Active"           # More than 2 years remaining
```

| Status | Condition | UI Color |
|--------|-----------|----------|
| **Active** | Filing year + 20 > current year + 2 | Green |
| **Expiring Soon** | Filing year + 20 within 2 years | Amber |
| **Expired** | Filing year + 20 <= current year | Red |

**Note:** This uses the standard 20-year utility patent term from filing date. Actual expiration can vary due to patent term adjustments (PTA), terminal disclaimers, maintenance fee lapses, or jurisdiction-specific rules. The status is an estimate, not a legal determination.

---

## 11. White Space Detection

### AI-powered (Gemini)

When Gemini is available, it analyzes the full patent landscape and identifies:
- **Domain gaps** — material application areas with few or no patents
- **Process gaps** — unpatented manufacturing methods
- **Combination gaps** — unexplored material combinations
- **Scale-up gaps** — patents exist for lab-scale but not industrial production

Each white space includes:
- `domain` — the opportunity area
- `description` — what's missing from the patent landscape
- `confidence` — AI's confidence score (0.0-1.0)
- `rationale` — why this is an opportunity

### Rule-based fallback

When Gemini is unavailable, white spaces are detected by analyzing which of the 7 categories have zero or very few patents. If a category has < 5% of total patents, it's flagged as a potential white space.

---

## 12. Freedom-to-Operate Assessment

The FTO assessment is a high-level AI-generated analysis that considers:
- Core patent expiration dates
- Dominant assignees and their portfolio strength
- Geographic coverage gaps
- Generic/biosimilar entry opportunities
- Key claims that may need to be designed around

**Important disclaimer:** The FTO assessment is AI-generated and is NOT legal advice. It should be reviewed by qualified patent attorneys before making business decisions. Real FTO requires professional patent search and claim-by-claim analysis.

---

## 13. Cost Analysis

| Component | Cost per search | Notes |
|-----------|----------------|-------|
| Google Patents XHR | $0.00 | Free, unofficial endpoint |
| EPO OPS (fallback) | $0.00 | Free tier (with OAuth) |
| Lens.org (fallback) | $0.00 | Free tier: 50/day |
| Gemini 2.0 Flash | ~$0.01-0.03 | Depends on patent count |
| Redis cache | ~$0.001 | Per read/write |
| **Total (first search)** | **~$0.01-0.03** | Cached for 24h after |
| **Total (cached)** | **~$0.001** | Redis lookup only |

---

## 14. Limitations & Disclaimers

1. **Not legal advice** — All analysis is AI-generated and should be reviewed by patent professionals before making business or legal decisions.

2. **Coverage gaps** — Google Patents may not include the most recently published patents (lag of 2-4 weeks). EPO and Lens.org have similar lags.

3. **Snippet-level analysis** — The AI reads patent titles and snippets (first 300 characters of abstract/claims), not the full patent text. Nuanced claim boundaries may be missed.

4. **Status estimates** — Patent status is estimated from filing date + 20 years. Actual status depends on maintenance fees, terminal disclaimers, PTAs, and jurisdiction-specific rules.

5. **Query scope** — Patent search is keyword-based, not semantic. Materials with many synonyms (e.g., "graphene" vs "monolayer graphite") benefit from query expansion but may still miss edge cases.

6. **Rate limits** — Google Patents XHR is an unofficial endpoint and may be rate-limited or blocked from certain IP ranges (including some cloud providers).

7. **FTO limitations** — Freedom-to-operate assessment is high-level only. Professional FTO searches require claim charting, prosecution history review, and doctrine of equivalents analysis.

---

## 15. Comparison with Competitors

| Feature | MatCraft IP Radar | PatSnap ($1000+/mo) | Orbit Intelligence ($$$) | Google Patents (free) | Lens.org (free) |
|---------|-------------------|---------------------|--------------------------|----------------------|-----------------|
| **Free to use** | Yes | No | No | Yes | Yes (50/day) |
| **Materials science focus** | Yes | Generic | Generic | Generic | Generic |
| **AI categorization** | 7 materials categories | Generic AI | Manual | None | None |
| **White space detection** | AI-powered | Yes | Yes | No | No |
| **FTO assessment** | AI-generated | Yes | Yes | No | No |
| **Executive summary** | AI-generated | Yes | Manual | No | No |
| **Interactive charts** | Donut + bar | Full dashboard | Full dashboard | Timeline only | Basic |
| **Query expansion** | 25+ materials terms | Industry-specific | Manual | None | None |
| **Patent count** | 125M+ | 150M+ | 120M+ | 125M+ | 130M+ |
| **API access** | REST API | REST API | REST API | No official API | REST API |
| **Integration with materials DB** | 205k+ materials | No | No | No | No |

**MatCraft's unique advantage:** The only patent landscaping tool specifically designed for materials science, with AI categorization into materials-specific domains, integrated with a 205k+ materials database, completely free, and accessible in a browser.

---

## Backend Files

| File | Lines | Purpose |
|------|-------|---------|
| `backend/app/api/v1/endpoints/ip_radar.py` | ~700 | Full patent service: search, AI analysis, caching, response building |
| `backend/app/api/v1/api.py` | 1 line added | Router registration: `ip_radar.router` with prefix="/ip-radar" |

## Frontend Files

| File | Lines | Purpose |
|------|-------|---------|
| `frontend/src/components/ip-radar/IPRadar.tsx` | ~830 | Full dashboard: search, charts, patent cards, white spaces, FTO |
| `frontend/src/app/(public)/ip-radar/page.tsx` | ~20 | Server component wrapper with Suspense |
| `frontend/src/app/(public)/ip-radar/layout.tsx` | ~25 | SEO metadata and OpenGraph |

---

## Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `GOOGLE_API_KEY` or `GEMINI_API_KEY` | No | — | Gemini AI analysis (falls back to rule-based) |
| `LENS_ORG_TOKEN` | No | — | Lens.org patent search (skipped if absent) |
| `REDIS_URL` | No | — | Result caching (works without, just no cache) |

No API keys are strictly required. Without Gemini, the system uses rule-based classification. Without Lens.org, it falls back through the waterfall. Without Redis, every search hits the patent APIs directly.

---

*Part of the MatCraft platform. Built with Claude Code.*
*Patent data from Google Patents, EPO Open Patent Services, and Lens.org.*
*AI analysis powered by Google Gemini 2.0 Flash.*
