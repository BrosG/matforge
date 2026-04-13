"""Materials IP Radar – patent landscaping for materials science.

Searches Google Patents for materials-related patents, categorises them using
AI (Google Gemini) or a rule-based fallback, and returns a structured patent
landscape analysis with white-space identification and FTO assessment.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import re
from collections import Counter
from datetime import date, datetime
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter()

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PATENT_TERM_YEARS = 20
EXPIRING_SOON_YEARS = 2  # considered "expiring soon" if < 2 years left

MATERIALS_CATEGORIES = [
    "Composition/Alloy",
    "Process/Synthesis",
    "Application",
    "Coating/Surface Treatment",
    "Nanostructure/Morphology",
    "Characterization Method",
    "Other",
]

# Materials-science query expansion dictionary
QUERY_EXPANSIONS: dict[str, list[str]] = {
    "lifepo4": ["lithium iron phosphate", "olivine cathode", "LFP cathode"],
    "lfp": ["lithium iron phosphate", "LiFePO4", "olivine cathode"],
    "nmc": ["lithium nickel manganese cobalt oxide", "NMC cathode", "LiNiMnCoO2"],
    "lco": ["lithium cobalt oxide", "LiCoO2"],
    "nca": ["lithium nickel cobalt aluminum oxide", "LiNiCoAlO2"],
    "perovskite": ["ABX3 structure", "methylammonium lead iodide", "halide perovskite"],
    "sic": ["silicon carbide", "carborundum", "moissanite"],
    "gan": ["gallium nitride", "GaN semiconductor"],
    "zno": ["zinc oxide", "ZnO nanostructure"],
    "tio2": ["titanium dioxide", "titania", "anatase", "rutile"],
    "al2o3": ["aluminum oxide", "alumina", "corundum"],
    "mof": ["metal-organic framework", "porous coordination polymer"],
    "cnt": ["carbon nanotube", "SWCNT", "MWCNT"],
    "graphene": ["graphene oxide", "reduced graphene oxide", "rGO", "2D carbon"],
    "mos2": ["molybdenum disulfide", "MoS2 nanosheet", "2D MoS2"],
    "batio3": ["barium titanate", "BTO", "ferroelectric ceramic"],
    "pvdf": ["polyvinylidene fluoride", "piezoelectric polymer"],
    "superalloy": ["nickel-based superalloy", "Inconel", "high-temperature alloy"],
    "high entropy alloy": ["HEA", "multi-principal element alloy", "MPEA"],
    "hea": ["high entropy alloy", "multi-principal element alloy"],
    "thermoelectric": ["Seebeck effect", "Peltier material", "Bi2Te3", "skutterudite"],
    "shape memory": ["shape memory alloy", "NiTi", "Nitinol", "SMA"],
    "piezoelectric": ["PZT", "lead zirconate titanate", "piezo ceramic"],
    "cigs": ["copper indium gallium selenide", "CuInGaSe2", "thin film solar"],
    "czts": ["copper zinc tin sulfide", "Cu2ZnSnS4", "kesterite"],
}

# Category keywords for rule-based fallback
_CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "Composition/Alloy": [
        "alloy", "composition", "compound", "doped", "doping", "solid solution",
        "stoichiometry", "phase diagram", "intermetallic", "eutectic",
    ],
    "Process/Synthesis": [
        "method", "process", "synthesis", "fabrication", "sintering", "annealing",
        "deposition", "sputtering", "CVD", "PVD", "sol-gel", "hydrothermal",
        "electrospinning", "melt", "casting", "hot press", "spark plasma",
    ],
    "Application": [
        "battery", "cathode", "anode", "solar cell", "photovoltaic", "catalyst",
        "sensor", "LED", "display", "capacitor", "supercapacitor", "fuel cell",
        "thermoelectric", "semiconductor", "transistor", "electrode", "electrolyte",
    ],
    "Coating/Surface Treatment": [
        "coating", "surface", "thin film", "layer", "barrier", "encapsulat",
        "plating", "anodiz", "passivat", "corrosion", "protective",
    ],
    "Nanostructure/Morphology": [
        "nanoparticle", "nanostructure", "nanowire", "nanotube", "nanosheet",
        "quantum dot", "nanocomposite", "nanocrystal", "mesoporous", "microporous",
        "morpholog", "2D material", "heterostructure",
    ],
    "Characterization Method": [
        "characteriz", "measurement", "spectroscop", "diffraction", "microscop",
        "XRD", "SEM", "TEM", "XPS", "Raman", "FTIR", "impedance", "calorimetr",
    ],
}

# Google Patents XHR headers (browser-emulation)
_GP_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Referer": "https://patents.google.com/",
    "Origin": "https://patents.google.com",
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
}

GEMINI_SYSTEM_PROMPT = """\
You are an expert materials science patent analyst. For each patent provided,
perform the following:

1. **Categorise** into exactly one of: Composition/Alloy, Process/Synthesis,
   Application (specify: solar/battery/catalyst/sensor/etc.),
   Coating/Surface Treatment, Nanostructure/Morphology,
   Characterization Method, or Other.

2. **Claim summary**: one sentence capturing the core inventive claim.

3. **Relevance score**: 0.0 to 1.0 relative to the user query.

After analysing all patents:

4. **White spaces**: identify 3-5 unpatented or under-patented material
   application areas, with confidence (0-1) and rationale.

5. **Executive summary**: 3-4 sentences summarising the patent landscape.

6. **Freedom-to-operate assessment**: brief FTO opinion for the queried
   material/application space.

Respond ONLY with valid JSON matching this schema:
{
  "patents": [
    {
      "patent_id": "...",
      "category": "...",
      "claim_summary": "...",
      "relevance_score": 0.0
    }
  ],
  "white_spaces": [
    {
      "domain": "...",
      "description": "...",
      "confidence": 0.0,
      "rationale": "..."
    }
  ],
  "executive_summary": "...",
  "fto_assessment": "..."
}
"""

# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------


class IPRadarRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500, description="Material query")
    max_patents: int = Field(50, ge=1, le=200, description="Max patents to retrieve")


class PatentItem(BaseModel):
    patent_id: str
    title: str
    assignee: str
    filing_date: str
    jurisdiction: str
    category: str
    claim_summary: str
    relevance_score: float
    status: str
    snippet: str


class WhiteSpace(BaseModel):
    domain: str
    description: str
    confidence: float
    rationale: str


class IPRadarResponse(BaseModel):
    query: str
    total_patents_found: int
    analyzed_count: int
    stats: dict[str, Any]
    patents: list[PatentItem]
    white_spaces: list[WhiteSpace]
    executive_summary: str
    fto_assessment: str
    data_source: str
    cached: bool


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _expand_query(query: str) -> str:
    """Expand the raw query with materials-science synonyms."""
    q_lower = query.lower().strip()
    extra_terms: list[str] = []
    for key, expansions in QUERY_EXPANSIONS.items():
        if key in q_lower:
            extra_terms.extend(expansions)
    if not extra_terms:
        return query
    # Deduplicate while preserving order
    seen: set[str] = {query.lower()}
    unique: list[str] = []
    for term in extra_terms:
        if term.lower() not in seen:
            seen.add(term.lower())
            unique.append(term)
    expanded = f"{query} OR " + " OR ".join(f'"{t}"' for t in unique[:5])
    logger.debug("Expanded query: %s", expanded)
    return expanded


def _cache_key(query: str, max_patents: int) -> str:
    raw = f"{query.strip().lower()}:{max_patents}"
    return f"ip_radar:{hashlib.sha256(raw.encode()).hexdigest()}"


def _patent_status(filing_date_str: str) -> str:
    """Determine patent status from filing date using 20-year term."""
    try:
        if not filing_date_str:
            return "Unknown"
        # Handle various date formats
        for fmt in ("%Y-%m-%d", "%Y%m%d", "%Y-%m", "%Y"):
            try:
                filed = datetime.strptime(filing_date_str[:len(fmt.replace("%", "").replace("-", "0-"))], fmt).date()
                break
            except ValueError:
                continue
        else:
            # Last resort: extract year
            year_match = re.search(r"(\d{4})", filing_date_str)
            if year_match:
                filed = date(int(year_match.group(1)), 1, 1)
            else:
                return "Unknown"

        today = date.today()
        expiry = date(filed.year + PATENT_TERM_YEARS, filed.month, filed.day)
        if expiry < today:
            return "Expired"
        remaining_days = (expiry - today).days
        if remaining_days < EXPIRING_SOON_YEARS * 365:
            return "Expiring Soon"
        return "Active"
    except Exception:
        return "Unknown"


def _classify_patent_rule_based(title: str, snippet: str) -> tuple[str, str]:
    """Rule-based patent categorisation fallback. Returns (category, claim_summary)."""
    text = f"{title} {snippet}".lower()
    best_cat = "Other"
    best_score = 0
    for cat, keywords in _CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw.lower() in text)
        if score > best_score:
            best_score = score
            best_cat = cat
    # Simple claim summary from title
    claim_summary = f"Patent relating to {title[:120]}." if title else "No summary available."
    return best_cat, claim_summary


def _rule_based_relevance(query: str, title: str, snippet: str) -> float:
    """Compute a simple keyword-overlap relevance score."""
    query_tokens = set(re.findall(r"\w{3,}", query.lower()))
    text_tokens = set(re.findall(r"\w{3,}", f"{title} {snippet}".lower()))
    if not query_tokens:
        return 0.5
    overlap = len(query_tokens & text_tokens)
    return round(min(overlap / max(len(query_tokens), 1), 1.0), 2)


def _rule_based_whitespaces(query: str, categories: list[str]) -> list[dict]:
    """Generate white-space suggestions based on category gaps."""
    cat_counts = Counter(categories)
    all_cats = set(MATERIALS_CATEGORIES)
    present = set(cat_counts.keys())
    missing = all_cats - present - {"Other"}

    whitespaces: list[dict] = []
    for cat in sorted(missing):
        whitespaces.append({
            "domain": cat,
            "description": f"No patents found covering {cat} for the query '{query}'. This may represent an unpatented area.",
            "confidence": 0.4,
            "rationale": f"Zero patents in the {cat} category among analysed results.",
        })
    # Also flag under-represented categories
    if categories:
        avg = len(categories) / max(len(present), 1)
        for cat, count in cat_counts.items():
            if count < avg * 0.3 and cat != "Other":
                whitespaces.append({
                    "domain": cat,
                    "description": f"Under-represented patent activity in {cat} ({count} patents).",
                    "confidence": 0.3,
                    "rationale": f"Only {count} patents vs. average {avg:.0f} per category.",
                })
    return whitespaces[:5]


# ---------------------------------------------------------------------------
# Google Patents search
# ---------------------------------------------------------------------------


async def _search_epo_ops(
    query: str, max_patents: int
) -> tuple[list[dict[str, Any]], int]:
    """Search EPO Open Patent Services (free, no auth required for basic search).

    Coverage: 100M+ documents from 100+ patent offices.
    """
    expanded = _expand_query(query)
    cql_query = f'ti="{expanded}" OR ab="{expanded}"'
    patents: list[dict[str, Any]] = []
    total_results = 0

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Search
            resp = await client.get(
                "https://ops.epo.org/3.2/rest-services/published-data/search",
                params={"q": cql_query, "Range": f"1-{min(max_patents, 100)}"},
                headers={"Accept": "application/json"},
            )
            resp.raise_for_status()
            data = resp.json()

            # Parse response
            search_result = data.get("ops:world-patent-data", {}).get("ops:biblio-search", {})
            total_results = int(search_result.get("@total-result-count", 0))

            results_list = search_result.get("ops:search-result", {}).get("ops:publication-reference", [])
            if isinstance(results_list, dict):
                results_list = [results_list]

            for ref in results_list[:max_patents]:
                doc_id = ref.get("document-id", {})
                if isinstance(doc_id, list):
                    doc_id = doc_id[0]
                country = doc_id.get("country", {}).get("$", "")
                doc_number = doc_id.get("doc-number", {}).get("$", "")
                kind = doc_id.get("kind", {}).get("$", "")
                patent_id = f"{country}{doc_number}{kind}"

                patents.append({
                    "patent_id": patent_id,
                    "title": f"Patent {patent_id}",  # Basic search doesn't return titles
                    "snippet": "",
                    "assignee": "",
                    "filing_date": "",
                    "country_code": country,
                })

            # Batch fetch bibliographic data for richer results (title, abstract, assignee)
            if patents:
                ids_to_fetch = [p["patent_id"] for p in patents[:20]]
                for pid in ids_to_fetch:
                    try:
                        biblio_resp = await client.get(
                            f"https://ops.epo.org/3.2/rest-services/published-data/publication/docdb/{pid}/biblio",
                            headers={"Accept": "application/json"},
                        )
                        if biblio_resp.status_code == 200:
                            bdata = biblio_resp.json()
                            exchange_doc = (
                                bdata.get("ops:world-patent-data", {})
                                .get("exchange-documents", {})
                                .get("exchange-document", {})
                            )
                            if isinstance(exchange_doc, list):
                                exchange_doc = exchange_doc[0]
                            biblio_data = exchange_doc.get("bibliographic-data", {})

                            # Title
                            titles = biblio_data.get("invention-title", [])
                            if isinstance(titles, dict):
                                titles = [titles]
                            for t in titles:
                                if t.get("@lang", "") == "en":
                                    for p in patents:
                                        if p["patent_id"] == pid:
                                            p["title"] = t.get("$", p["title"])
                                            break

                            # Applicant
                            applicants = biblio_data.get("parties", {}).get("applicants", {}).get("applicant", [])
                            if isinstance(applicants, dict):
                                applicants = [applicants]
                            if applicants:
                                name = applicants[0].get("applicant-name", {}).get("name", {}).get("$", "")
                                for p in patents:
                                    if p["patent_id"] == pid:
                                        p["assignee"] = name
                                        break

                            # Filing date
                            app_ref = biblio_data.get("application-reference", {}).get("document-id", {})
                            if isinstance(app_ref, list):
                                app_ref = app_ref[0]
                            fdate = app_ref.get("date", {}).get("$", "")
                            if fdate:
                                for p in patents:
                                    if p["patent_id"] == pid:
                                        p["filing_date"] = f"{fdate[:4]}-{fdate[4:6]}-{fdate[6:8]}" if len(fdate) >= 8 else fdate
                                        break
                    except Exception:
                        pass  # Enrichment is best-effort

        logger.info("EPO OPS returned %d results (total: %d)", len(patents), total_results)
    except Exception as exc:
        logger.warning("EPO OPS search failed: %s", exc)

    return patents, total_results


async def _search_lens_org(
    query: str, max_patents: int
) -> tuple[list[dict[str, Any]], int]:
    """Search Lens.org patent database (free tier: 50 requests/day).

    Lens.org aggregates USPTO, EPO, WIPO, and 100+ other offices.
    """
    expanded = _expand_query(query)
    patents: list[dict[str, Any]] = []
    total_results = 0

    lens_token = os.environ.get("LENS_ORG_TOKEN", "")
    if not lens_token:
        logger.info("No LENS_ORG_TOKEN — skipping Lens.org search")
        return patents, total_results

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.lens.org/patent/search",
                headers={
                    "Authorization": f"Bearer {lens_token}",
                    "Content-Type": "application/json",
                },
                json={
                    "query": {
                        "bool": {
                            "should": [
                                {"match": {"title": expanded}},
                                {"match": {"abstract": expanded}},
                            ]
                        }
                    },
                    "size": min(max_patents, 100),
                    "sort": [{"date_published": "desc"}],
                    "include": ["lens_id", "title", "abstract", "applicant", "date_published", "jurisdiction"],
                },
            )
            resp.raise_for_status()
            data = resp.json()

            total_results = data.get("total", 0)
            for hit in data.get("data", []):
                patents.append({
                    "patent_id": hit.get("lens_id", ""),
                    "title": hit.get("title", ""),
                    "snippet": (hit.get("abstract", "") or "")[:500],
                    "assignee": (hit.get("applicant", [None])[0] or {}).get("name", "") if hit.get("applicant") else "",
                    "filing_date": hit.get("date_published", ""),
                    "country_code": hit.get("jurisdiction", ""),
                })

        logger.info("Lens.org returned %d results (total: %d)", len(patents), total_results)
    except Exception as exc:
        logger.warning("Lens.org search failed: %s", exc)

    return patents, total_results


async def _search_google_patents(
    query: str, max_patents: int
) -> tuple[list[dict[str, Any]], int]:
    """Search Google Patents via the unofficial XHR endpoint.

    Returns (list of raw patent dicts, total_num_results).
    """
    expanded = _expand_query(query)
    params = {
        "url": f"q={expanded}&num={max_patents}&type=PATENT",
    }
    patents: list[dict[str, Any]] = []
    total_results = 0

    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            resp = await client.get(
                "https://patents.google.com/xhr/query",
                params=params,
                headers=_GP_HEADERS,
            )
            resp.raise_for_status()

            # Google Patents prefixes response with )]}'  — strip it
            text = resp.text
            if text.startswith(")]}'"):
                text = text[4:].lstrip("\n")

            data = json.loads(text)

            # Extract total
            total_results = (
                data.get("results", {})
                .get("total_num_results", 0)
            )

            # Extract patent clusters
            clusters = (
                data.get("results", {})
                .get("cluster", [])
            )
            for cluster in clusters:
                for result in cluster.get("result", []):
                    patent = result.get("patent", {})
                    if not patent:
                        continue
                    patent_id = patent.get("publication_number", "")
                    title = patent.get("title", "")
                    snippet_raw = result.get("snippet", patent.get("abstract", ""))
                    # Assignee
                    assignee = ""
                    assignee_list = patent.get("assignee", [])
                    if assignee_list:
                        assignee = assignee_list[0] if isinstance(assignee_list[0], str) else str(assignee_list[0])
                    # Filing date
                    filing_date = patent.get("filing_date", patent.get("priority_date", ""))
                    # Country
                    country = patent.get("country_code", "")
                    if not country and patent_id:
                        # Extract from patent ID (e.g., US-1234-A → US)
                        cc_match = re.match(r"^([A-Z]{2})", patent_id)
                        country = cc_match.group(1) if cc_match else ""

                    patents.append({
                        "patent_id": patent_id,
                        "title": title,
                        "snippet": snippet_raw,
                        "assignee": assignee,
                        "filing_date": filing_date,
                        "country_code": country,
                    })

        logger.info("Google Patents returned %d results (total: %d)", len(patents), total_results)
    except httpx.HTTPStatusError as exc:
        logger.warning("Google Patents HTTP error %s: %s", exc.response.status_code, exc)
    except httpx.RequestError as exc:
        logger.warning("Google Patents request error: %s", exc)
    except (json.JSONDecodeError, KeyError, TypeError) as exc:
        logger.warning("Google Patents parse error: %s", exc)
    except Exception as exc:
        logger.error("Unexpected error querying Google Patents: %s", exc, exc_info=True)

    return patents, total_results


# ---------------------------------------------------------------------------
# Gemini AI analysis
# ---------------------------------------------------------------------------


async def _analyse_with_gemini(
    query: str, patents: list[dict[str, Any]]
) -> dict[str, Any] | None:
    """Use Google Gemini to analyse patents. Returns parsed JSON or None."""
    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.info("No Gemini API key found; falling back to rule-based analysis.")
        return None

    try:
        import google.generativeai as genai  # type: ignore[import-untyped]
    except ImportError:
        logger.info("google-generativeai not installed; falling back to rule-based analysis.")
        return None

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")

        # Build the patent summary for the prompt
        patent_summaries = []
        for p in patents[:100]:  # Cap to avoid token overflow
            patent_summaries.append(
                f"- {p['patent_id']}: \"{p['title']}\" (Assignee: {p['assignee']}, "
                f"Filed: {p['filing_date']}, Country: {p['country_code']})\n"
                f"  Snippet: {p['snippet'][:300]}"
            )
        patent_text = "\n".join(patent_summaries)

        user_prompt = (
            f"User query: {query}\n\n"
            f"Patents to analyse ({len(patent_summaries)}):\n{patent_text}"
        )

        response = model.generate_content(
            [
                {"role": "user", "parts": [GEMINI_SYSTEM_PROMPT + "\n\n" + user_prompt]},
            ],
            generation_config=genai.GenerationConfig(
                temperature=0.3,
                max_output_tokens=8192,
            ),
        )

        raw = response.text
        # Strip markdown fences if present
        raw = re.sub(r"^```(?:json)?\s*", "", raw.strip())
        raw = re.sub(r"\s*```$", "", raw.strip())

        result = json.loads(raw)
        logger.info("Gemini analysis completed successfully.")
        return result

    except json.JSONDecodeError as exc:
        logger.warning("Gemini returned non-JSON response: %s", exc)
    except Exception as exc:
        logger.warning("Gemini analysis failed: %s", exc)

    return None


# ---------------------------------------------------------------------------
# Build final response
# ---------------------------------------------------------------------------


def _build_response(
    query: str,
    raw_patents: list[dict[str, Any]],
    total_found: int,
    ai_result: dict[str, Any] | None,
    cached: bool,
) -> IPRadarResponse:
    """Merge raw patent data with AI (or rule-based) analysis."""

    # Build a lookup from AI analysis
    ai_patent_map: dict[str, dict] = {}
    if ai_result and "patents" in ai_result:
        for ap in ai_result["patents"]:
            ai_patent_map[ap.get("patent_id", "")] = ap

    patent_items: list[PatentItem] = []
    categories: list[str] = []
    assignees: list[str] = []
    jurisdictions: list[str] = []
    statuses: list[str] = []
    filing_years: list[int] = []

    for rp in raw_patents:
        pid = rp["patent_id"]
        ai_info = ai_patent_map.get(pid, {})

        # Category
        if ai_info.get("category"):
            category = ai_info["category"]
        else:
            category, _ = _classify_patent_rule_based(rp["title"], rp["snippet"])

        # Claim summary
        if ai_info.get("claim_summary"):
            claim_summary = ai_info["claim_summary"]
        else:
            _, claim_summary = _classify_patent_rule_based(rp["title"], rp["snippet"])

        # Relevance
        relevance = ai_info.get("relevance_score", _rule_based_relevance(query, rp["title"], rp["snippet"]))

        # Status
        status = _patent_status(rp["filing_date"])

        # Filing year for stats
        yr_match = re.search(r"(\d{4})", rp.get("filing_date", ""))
        if yr_match:
            filing_years.append(int(yr_match.group(1)))

        item = PatentItem(
            patent_id=pid,
            title=rp["title"],
            assignee=rp.get("assignee", "Unknown"),
            filing_date=rp.get("filing_date", ""),
            jurisdiction=rp.get("country_code", "Unknown"),
            category=category,
            claim_summary=claim_summary,
            relevance_score=round(float(relevance), 2),
            status=status,
            snippet=rp.get("snippet", "")[:500],
        )
        patent_items.append(item)
        categories.append(category)
        assignees.append(item.assignee)
        jurisdictions.append(item.jurisdiction)
        statuses.append(status)

    # Sort by relevance descending
    patent_items.sort(key=lambda x: x.relevance_score, reverse=True)

    # Stats
    stats: dict[str, Any] = {
        "by_category": dict(Counter(categories).most_common()),
        "by_assignee": dict(Counter(assignees).most_common(15)),
        "by_jurisdiction": dict(Counter(jurisdictions).most_common(10)),
        "by_status": dict(Counter(statuses).most_common()),
        "filing_date_range": {
            "earliest": min(filing_years) if filing_years else None,
            "latest": max(filing_years) if filing_years else None,
        },
    }

    # White spaces
    if ai_result and "white_spaces" in ai_result:
        white_spaces = [
            WhiteSpace(
                domain=ws.get("domain", "Unknown"),
                description=ws.get("description", ""),
                confidence=float(ws.get("confidence", 0.5)),
                rationale=ws.get("rationale", ""),
            )
            for ws in ai_result["white_spaces"]
        ]
    else:
        ws_dicts = _rule_based_whitespaces(query, categories)
        white_spaces = [WhiteSpace(**ws) for ws in ws_dicts]

    # Executive summary
    if ai_result and ai_result.get("executive_summary"):
        executive_summary = ai_result["executive_summary"]
    else:
        top_assignees = ", ".join(a for a, _ in Counter(assignees).most_common(3))
        top_cat = Counter(categories).most_common(1)
        top_cat_name = top_cat[0][0] if top_cat else "various"
        executive_summary = (
            f"Patent landscape analysis for '{query}' identified {len(patent_items)} "
            f"patents from a total of {total_found} results. "
            f"The dominant category is {top_cat_name}. "
            f"Key assignees include {top_assignees or 'various entities'}. "
            f"Analysis performed using rule-based classification."
        )

    # FTO assessment
    if ai_result and ai_result.get("fto_assessment"):
        fto_assessment = ai_result["fto_assessment"]
    else:
        active_count = statuses.count("Active")
        fto_assessment = (
            f"Preliminary FTO assessment: {active_count} active patents identified "
            f"out of {len(patent_items)} analysed. A detailed freedom-to-operate "
            f"opinion by a patent attorney is recommended before commercialisation. "
            f"This automated assessment is for informational purposes only and does "
            f"not constitute legal advice."
        )

    data_source = "Google Patents + Gemini AI" if ai_result else "Google Patents + rule-based analysis"

    return IPRadarResponse(
        query=query,
        total_patents_found=total_found,
        analyzed_count=len(patent_items),
        stats=stats,
        patents=patent_items,
        white_spaces=white_spaces,
        executive_summary=executive_summary,
        fto_assessment=fto_assessment,
        data_source=data_source,
        cached=cached,
    )


# ---------------------------------------------------------------------------
# Redis caching helpers
# ---------------------------------------------------------------------------


def _get_cached(key: str) -> IPRadarResponse | None:
    """Try to read a cached response from Redis."""
    try:
        from app.core.redis_connector import get_redis
        r = get_redis()
        raw = r.get(key)
        if raw:
            logger.info("IP Radar cache hit for key %s", key)
            return IPRadarResponse.model_validate_json(raw)
    except Exception as exc:
        logger.debug("Redis cache read failed (non-fatal): %s", exc)
    return None


def _set_cached(key: str, response: IPRadarResponse) -> None:
    """Store a response in Redis with 24-hour TTL."""
    try:
        from app.core.redis_connector import get_redis
        r = get_redis()
        r.setex(key, 86400, response.model_dump_json())
        logger.debug("IP Radar result cached under key %s", key)
    except Exception as exc:
        logger.debug("Redis cache write failed (non-fatal): %s", exc)


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.post("/search", response_model=IPRadarResponse)
async def ip_radar_search(body: IPRadarRequest) -> IPRadarResponse:
    """Search and analyse materials-science patents for a given query.

    Combines Google Patents data with AI-powered (Gemini) or rule-based
    categorisation, white-space analysis, and FTO assessment.
    """
    query = body.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query must not be empty.")

    # Check cache
    key = _cache_key(query, body.max_patents)
    cached = _get_cached(key)
    if cached is not None:
        return cached

    # Search patents — waterfall: Google Patents XHR → EPO OPS → Lens.org
    raw_patents, total_found = await _search_google_patents(query, body.max_patents)
    data_source = "Google Patents"

    # Fallback 1: EPO Open Patent Services (free, legitimate API)
    if not raw_patents:
        raw_patents, total_found = await _search_epo_ops(query, body.max_patents)
        data_source = "EPO Open Patent Services"

    # Fallback 2: Lens.org scholarly patents API (free tier)
    if not raw_patents:
        raw_patents, total_found = await _search_lens_org(query, body.max_patents)
        data_source = "Lens.org"

    logger.info("Retrieved %d patents for query '%s' via %s", len(raw_patents), query, data_source)

    # AI analysis (Gemini with rule-based fallback)
    ai_result: dict[str, Any] | None = None
    if raw_patents:
        ai_result = await _analyse_with_gemini(query, raw_patents)

    # Build structured response
    response = _build_response(query, raw_patents, total_found, ai_result, cached=False)

    # Cache the result
    _set_cached(key, response)

    return response
