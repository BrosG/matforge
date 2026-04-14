"""Deep Scan Celery task – bulk patent analysis pipeline.

Searches for patents (up to 15,000+), analyses them in batches via Gemini AI
(with rule-based fallback), and compiles a structured report.  Progress is
streamed to Redis so the frontend can poll.
"""

from __future__ import annotations

import json
import logging
import math
import os
import re
from collections import Counter
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Celery app import
# ---------------------------------------------------------------------------

from app.tasks.celery_app import celery_app  # noqa: E402

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SCAN_TTL_SECONDS = 48 * 3600  # 48 hours
BATCH_SIZE = 20  # patents per AI call

# ---------------------------------------------------------------------------
# Redis helpers (synchronous — runs inside the Celery worker)
# ---------------------------------------------------------------------------


def _redis():
    from app.core.redis_connector import get_redis

    return get_redis()


def _scan_key(scan_id: str) -> str:
    return f"deep_scan:{scan_id}"


def _result_key(scan_id: str) -> str:
    return f"deep_scan_result:{scan_id}"


def _update_status(
    scan_id: str,
    *,
    status: str | None = None,
    progress: float | None = None,
    patents_found: int | None = None,
    patents_analyzed: int | None = None,
    message: str | None = None,
    result_url: str | None = None,
) -> None:
    """Merge partial updates into the scan metadata in Redis."""
    try:
        r = _redis()
        raw = r.get(_scan_key(scan_id))
        meta = json.loads(raw) if raw else {}
        if status is not None:
            meta["status"] = status
        if progress is not None:
            meta["progress"] = progress
        if patents_found is not None:
            meta["patents_found"] = patents_found
        if patents_analyzed is not None:
            meta["patents_analyzed"] = patents_analyzed
        if message is not None:
            meta["message"] = message
        if result_url is not None:
            meta["result_url"] = result_url
        r.setex(_scan_key(scan_id), SCAN_TTL_SECONDS, json.dumps(meta))
    except Exception as exc:
        logger.warning("Redis status update failed for %s: %s", scan_id, exc)


# ---------------------------------------------------------------------------
# Reuse helpers from ip_radar (synchronous wrappers where needed)
# ---------------------------------------------------------------------------


def _import_ip_radar():
    """Lazily import ip_radar helpers to avoid circular imports."""
    from app.api.v1.endpoints import ip_radar

    return ip_radar


def _search_patents_sync(
    query: str, max_patents: int
) -> tuple[list[dict[str, Any]], int]:
    """Run the async patent search functions synchronously inside Celery."""
    import asyncio

    ip = _import_ip_radar()

    async def _do_search():
        # Try Google Patents first
        patents, total = await ip._search_google_patents(query, max_patents)
        if patents:
            return patents, total, "Google Patents"

        # Fallback to EPO
        logger.info("Google Patents returned 0 results; trying EPO OPS…")
        patents, total = await ip._search_epo_ops(query, max_patents)
        if patents:
            return patents, total, "EPO OPS"

        # Fallback to Lens.org
        logger.info("EPO also empty; trying Lens.org…")
        patents, total = await ip._search_lens_org(query, max_patents)
        return patents, total, "Lens.org"

    try:
        loop = asyncio.new_event_loop()
        patents, total, _source = loop.run_until_complete(_do_search())
        loop.close()
    except Exception as exc:
        logger.error("Patent search failed: %s", exc, exc_info=True)
        patents, total = [], 0

    return patents, total


def _classify_rule_based(title: str, snippet: str, query: str) -> dict[str, Any]:
    """Rule-based patent classification (single patent)."""
    ip = _import_ip_radar()
    category, claim_summary = ip._classify_patent_rule_based(title, snippet)
    relevance = ip._rule_based_relevance(query, title, snippet)
    return {
        "category": category,
        "claim_summary": claim_summary,
        "relevance_score": relevance,
        "directive_relevance": 0.0,
    }


# ---------------------------------------------------------------------------
# Gemini batch analysis (synchronous)
# ---------------------------------------------------------------------------


def _analyse_batch_gemini(
    query: str,
    directive: str,
    batch: list[dict[str, Any]],
) -> list[dict[str, Any]] | None:
    """Analyse a batch of patents with Gemini.  Returns list of per-patent dicts or None."""
    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None

    try:
        import google.generativeai as genai  # type: ignore[import-untyped]
    except ImportError:
        return None

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")

        patent_lines = []
        for p in batch:
            patent_lines.append(
                f'- {p["patent_id"]}: "{p["title"]}" '
                f"(Assignee: {p.get('assignee', '')}, Filed: {p.get('filing_date', '')}, "
                f"Country: {p.get('country_code', '')})\n"
                f"  Snippet: {(p.get('snippet', '') or '')[:300]}"
            )
        patent_text = "\n".join(patent_lines)

        directive_block = ""
        if directive:
            directive_block = (
                f'\nCUSTOM RESEARCH DIRECTIVE: "{directive}"\n'
                'For each patent, also score a "directive_relevance" (0-1) indicating '
                "how relevant this patent is to the researcher's specific goal above.\n"
            )

        system_prompt = (
            "You are an expert materials science patent analyst. "
            "For each patent provided, return a JSON array of objects with keys: "
            "patent_id, category, claim_summary, relevance_score, directive_relevance.\n"
            "Categories: Composition/Alloy, Process/Synthesis, Application, "
            "Coating/Surface Treatment, Nanostructure/Morphology, "
            "Characterization Method, Other.\n"
            "relevance_score: 0-1 relevance to the user query.\n"
            f"{directive_block}"
            "Respond ONLY with a valid JSON array.  No markdown fences."
        )

        user_prompt = (
            f"User query: {query}\n\nPatents to analyse ({len(batch)}):\n{patent_text}"
        )

        response = model.generate_content(
            [{"role": "user", "parts": [system_prompt + "\n\n" + user_prompt]}],
            generation_config=genai.GenerationConfig(
                temperature=0.3,
                max_output_tokens=4096,
            ),
        )

        raw = response.text.strip()
        # Strip markdown fences if present
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

        parsed = json.loads(raw)
        if isinstance(parsed, dict) and "patents" in parsed:
            parsed = parsed["patents"]
        if not isinstance(parsed, list):
            return None
        return parsed

    except json.JSONDecodeError as exc:
        logger.warning("Gemini batch returned non-JSON: %s", exc)
    except Exception as exc:
        logger.warning("Gemini batch analysis failed: %s", exc)

    return None


# ---------------------------------------------------------------------------
# Report compilation helpers
# ---------------------------------------------------------------------------


def _compile_report(
    query: str,
    directive: str,
    raw_patents: list[dict[str, Any]],
    analyses: dict[str, dict[str, Any]],
    total_found: int,
) -> dict[str, Any]:
    """Build the full structured deep-scan report."""
    ip = _import_ip_radar()

    patent_items: list[dict[str, Any]] = []
    categories: list[str] = []
    assignees: list[str] = []
    jurisdictions: list[str] = []
    statuses: list[str] = []
    filing_years: list[int] = []
    directive_scores: list[float] = []

    for rp in raw_patents:
        pid = rp["patent_id"]
        ai = analyses.get(pid, {})

        category = (
            ai.get("category")
            or _classify_rule_based(rp.get("title", ""), rp.get("snippet", ""), query)[
                "category"
            ]
        )
        claim_summary = (
            ai.get("claim_summary")
            or f"Patent relating to {(rp.get('title', '') or '')[:120]}."
        )
        relevance = float(
            ai.get(
                "relevance_score",
                ip._rule_based_relevance(
                    query, rp.get("title", ""), rp.get("snippet", "")
                ),
            )
        )
        directive_rel = float(ai.get("directive_relevance", 0.0))
        status = ip._patent_status(rp.get("filing_date", ""))

        yr_match = re.search(r"(\d{4})", rp.get("filing_date", ""))
        if yr_match:
            filing_years.append(int(yr_match.group(1)))

        item = {
            "patent_id": pid,
            "title": rp.get("title", ""),
            "assignee": rp.get("assignee", "Unknown"),
            "filing_date": rp.get("filing_date", ""),
            "jurisdiction": rp.get("country_code", "Unknown"),
            "category": category,
            "claim_summary": claim_summary,
            "relevance_score": round(relevance, 2),
            "directive_relevance": round(directive_rel, 2),
            "status": status,
            "snippet": (rp.get("snippet", "") or "")[:500],
        }
        patent_items.append(item)
        categories.append(category)
        assignees.append(item["assignee"])
        jurisdictions.append(item["jurisdiction"])
        statuses.append(status)
        directive_scores.append(directive_rel)

    # Sort by relevance descending
    patent_items.sort(key=lambda x: x["relevance_score"], reverse=True)

    # Statistics
    stats = {
        "by_category": dict(Counter(categories).most_common()),
        "by_assignee": dict(Counter(assignees).most_common(20)),
        "by_jurisdiction": dict(Counter(jurisdictions).most_common(15)),
        "by_status": dict(Counter(statuses).most_common()),
        "by_year": dict(sorted(Counter(filing_years).items())) if filing_years else {},
        "filing_date_range": {
            "earliest": min(filing_years) if filing_years else None,
            "latest": max(filing_years) if filing_years else None,
        },
        "total_found": total_found,
        "total_analyzed": len(patent_items),
    }

    # White spaces
    ws_dicts = ip._rule_based_whitespaces(query, categories)
    white_spaces = ws_dicts[:5]

    # Executive summary
    top_assignees = ", ".join(a for a, _ in Counter(assignees).most_common(5))
    top_cat = Counter(categories).most_common(1)
    top_cat_name = top_cat[0][0] if top_cat else "various"
    active_count = statuses.count("Active")

    executive_summary = (
        f"Deep scan patent landscape analysis for '{query}' processed {len(patent_items)} "
        f"patents from a corpus of {total_found} results. "
        f"The dominant category is {top_cat_name} ({Counter(categories).get(top_cat_name, 0)} patents). "
        f"Key assignees include {top_assignees or 'various entities'}. "
        f"{active_count} patents are currently active."
    )

    # FTO assessment
    fto_assessment = (
        f"Preliminary FTO assessment: {active_count} active patents identified "
        f"out of {len(patent_items)} analysed for '{query}'. "
    )
    if directive:
        high_directive = sum(1 for s in directive_scores if s >= 0.7)
        fto_assessment += (
            f"Of these, {high_directive} patents scored high directive relevance "
            f'(>=0.7) for the research goal: "{directive[:100]}". '
        )
    fto_assessment += (
        "A detailed freedom-to-operate opinion by a patent attorney is recommended "
        "before commercialisation. This automated assessment is for informational "
        "purposes only and does not constitute legal advice."
    )

    # Directive-specific section
    directive_section = None
    if directive:
        top_directive_patents = sorted(
            patent_items, key=lambda x: x["directive_relevance"], reverse=True
        )[:20]
        directive_section = {
            "directive": directive,
            "top_relevant_patents": top_directive_patents,
            "average_directive_relevance": round(
                sum(directive_scores) / max(len(directive_scores), 1), 3
            ),
            "high_relevance_count": sum(1 for s in directive_scores if s >= 0.7),
            "medium_relevance_count": sum(
                1 for s in directive_scores if 0.3 <= s < 0.7
            ),
            "low_relevance_count": sum(1 for s in directive_scores if s < 0.3),
        }

    return {
        "query": query,
        "directive": directive,
        "executive_summary": executive_summary,
        "fto_assessment": fto_assessment,
        "stats": stats,
        "patents": patent_items,
        "white_spaces": white_spaces,
        "directive_analysis": directive_section,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


# ---------------------------------------------------------------------------
# Celery task
# ---------------------------------------------------------------------------


@celery_app.task(
    name="app.tasks.deep_scan.run_deep_scan",
    bind=True,
    soft_time_limit=3600,  # 1 hour soft limit
    time_limit=3660,  # hard kill after 61 minutes
)
def run_deep_scan(
    self,
    scan_id: str,
    query: str,
    directive: str,
    max_patents: int,
    email: str,
):
    """Execute the full deep-scan pipeline."""
    logger.info(
        "Deep scan %s started: query=%r, max_patents=%d", scan_id, query, max_patents
    )

    try:
        # ------------------------------------------------------------------
        # Step 1 — Search
        # ------------------------------------------------------------------
        _update_status(
            scan_id,
            status="searching",
            progress=0.05,
            message="Searching patent databases…",
        )
        self.update_state(state="SEARCHING", meta={"scan_id": scan_id})

        patents, total_found = _search_patents_sync(query, max_patents)
        _update_status(
            scan_id,
            progress=0.15,
            patents_found=len(patents),
            message=f"Found {len(patents)} patents (total corpus: {total_found}).",
        )

        if not patents:
            _update_status(
                scan_id,
                status="completed",
                progress=1.0,
                message="No patents found for the given query.",
            )
            # Store empty result
            empty_report = _compile_report(query, directive, [], {}, 0)
            _redis().setex(
                _result_key(scan_id), SCAN_TTL_SECONDS, json.dumps(empty_report)
            )
            _update_status(
                scan_id,
                result_url=f"/api/v1/deep-scan/{scan_id}/download",
            )
            return {"scan_id": scan_id, "status": "completed", "patents": 0}

        # ------------------------------------------------------------------
        # Step 2 — AI batch analysis
        # ------------------------------------------------------------------
        _update_status(
            scan_id,
            status="analyzing",
            progress=0.20,
            message="Analysing patents with AI…",
        )
        self.update_state(state="ANALYZING", meta={"scan_id": scan_id})

        analyses: dict[str, dict[str, Any]] = {}
        num_batches = math.ceil(len(patents) / BATCH_SIZE)

        for batch_idx in range(num_batches):
            start = batch_idx * BATCH_SIZE
            end = start + BATCH_SIZE
            batch = patents[start:end]

            try:
                ai_results = _analyse_batch_gemini(query, directive, batch)
                if ai_results:
                    for item in ai_results:
                        pid = item.get("patent_id", "")
                        if pid:
                            analyses[pid] = item
                else:
                    # Rule-based fallback for this batch
                    for p in batch:
                        analyses[p["patent_id"]] = _classify_rule_based(
                            p.get("title", ""), p.get("snippet", ""), query
                        )
            except Exception as exc:
                logger.warning(
                    "Batch %d/%d failed — falling back to rule-based: %s",
                    batch_idx + 1,
                    num_batches,
                    exc,
                )
                for p in batch:
                    if p["patent_id"] not in analyses:
                        analyses[p["patent_id"]] = _classify_rule_based(
                            p.get("title", ""), p.get("snippet", ""), query
                        )

            # Progress update
            analyzed_so_far = min(end, len(patents))
            progress = 0.20 + 0.60 * (analyzed_so_far / len(patents))
            _update_status(
                scan_id,
                progress=round(progress, 3),
                patents_analyzed=analyzed_so_far,
                message=f"Analysed {analyzed_so_far}/{len(patents)} patents…",
            )

        # ------------------------------------------------------------------
        # Step 3 — Compile report
        # ------------------------------------------------------------------
        _update_status(
            scan_id, status="generating", progress=0.85, message="Generating report…"
        )
        self.update_state(state="GENERATING", meta={"scan_id": scan_id})

        report = _compile_report(query, directive, patents, analyses, total_found)

        # ------------------------------------------------------------------
        # Step 4 — Store results
        # ------------------------------------------------------------------
        _redis().setex(_result_key(scan_id), SCAN_TTL_SECONDS, json.dumps(report))

        result_url = f"/api/v1/deep-scan/{scan_id}/download"
        _update_status(
            scan_id,
            status="completed",
            progress=1.0,
            patents_found=len(patents),
            patents_analyzed=len(patents),
            message=f"Deep scan complete — {len(patents)} patents analysed.",
            result_url=result_url,
        )

        # ------------------------------------------------------------------
        # Step 5 — Email notification (placeholder)
        # ------------------------------------------------------------------
        if email:
            logger.info(
                "Deep scan %s completed. Email notification would be sent to %s. "
                "(Email sending not yet implemented.)",
                scan_id,
                email,
            )

        logger.info(
            "Deep scan %s completed successfully: %d patents analysed.",
            scan_id,
            len(patents),
        )
        return {"scan_id": scan_id, "status": "completed", "patents": len(patents)}

    except Exception as exc:
        logger.error("Deep scan %s failed: %s", scan_id, exc, exc_info=True)
        _update_status(
            scan_id,
            status="failed",
            progress=0.0,
            message=f"Scan failed: {str(exc)[:200]}",
        )
        # Do not re-raise — the task is marked as failed via Redis, and we
        # don't want Celery to retry automatically.
        return {"scan_id": scan_id, "status": "failed", "error": str(exc)[:500]}
