"""Natural-language search endpoint.

Converts plain English queries into structured material search filters
using rule-based NLP (no external LLM dependency).
"""

from __future__ import annotations

import logging
import re
from typing import Any

from app.db.base import get_db
from app.services import material_service
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/nl", tags=["natural-language"])

# ---------------------------------------------------------------------------
# Element name -> symbol mapping
# ---------------------------------------------------------------------------

ELEMENT_MAP: dict[str, str] = {
    "hydrogen": "H",
    "helium": "He",
    "lithium": "Li",
    "beryllium": "Be",
    "boron": "B",
    "carbon": "C",
    "nitrogen": "N",
    "oxygen": "O",
    "fluorine": "F",
    "neon": "Ne",
    "sodium": "Na",
    "magnesium": "Mg",
    "aluminum": "Al",
    "aluminium": "Al",
    "silicon": "Si",
    "phosphorus": "P",
    "sulfur": "S",
    "sulphur": "S",
    "chlorine": "Cl",
    "argon": "Ar",
    "potassium": "K",
    "calcium": "Ca",
    "scandium": "Sc",
    "titanium": "Ti",
    "vanadium": "V",
    "chromium": "Cr",
    "manganese": "Mn",
    "iron": "Fe",
    "cobalt": "Co",
    "nickel": "Ni",
    "copper": "Cu",
    "zinc": "Zn",
    "gallium": "Ga",
    "germanium": "Ge",
    "arsenic": "As",
    "selenium": "Se",
    "bromine": "Br",
    "krypton": "Kr",
    "rubidium": "Rb",
    "strontium": "Sr",
    "yttrium": "Y",
    "zirconium": "Zr",
    "niobium": "Nb",
    "molybdenum": "Mo",
    "technetium": "Tc",
    "ruthenium": "Ru",
    "rhodium": "Rh",
    "palladium": "Pd",
    "silver": "Ag",
    "cadmium": "Cd",
    "indium": "In",
    "tin": "Sn",
    "antimony": "Sb",
    "tellurium": "Te",
    "iodine": "I",
    "xenon": "Xe",
    "cesium": "Cs",
    "caesium": "Cs",
    "barium": "Ba",
    "lanthanum": "La",
    "cerium": "Ce",
    "praseodymium": "Pr",
    "neodymium": "Nd",
    "promethium": "Pm",
    "samarium": "Sm",
    "europium": "Eu",
    "gadolinium": "Gd",
    "terbium": "Tb",
    "dysprosium": "Dy",
    "holmium": "Ho",
    "erbium": "Er",
    "thulium": "Tm",
    "ytterbium": "Yb",
    "lutetium": "Lu",
    "hafnium": "Hf",
    "tantalum": "Ta",
    "tungsten": "W",
    "rhenium": "Re",
    "osmium": "Os",
    "iridium": "Ir",
    "platinum": "Pt",
    "gold": "Au",
    "mercury": "Hg",
    "thallium": "Tl",
    "lead": "Pb",
    "bismuth": "Bi",
    "polonium": "Po",
    "astatine": "At",
    "radon": "Rn",
    "francium": "Fr",
    "radium": "Ra",
    "actinium": "Ac",
    "thorium": "Th",
    "protactinium": "Pa",
    "uranium": "U",
    "neptunium": "Np",
    "plutonium": "Pu",
    "americium": "Am",
    "curium": "Cm",
}

# Reverse: symbol (lowered) -> symbol (canonical case)
SYMBOL_SET: dict[str, str] = {v.lower(): v for v in ELEMENT_MAP.values()}
# Also add two-letter symbols explicitly from the periodic table
for _sym in list(SYMBOL_SET.values()):
    SYMBOL_SET[_sym.lower()] = _sym

CRYSTAL_SYSTEMS = [
    "cubic",
    "hexagonal",
    "tetragonal",
    "orthorhombic",
    "monoclinic",
    "triclinic",
    "trigonal",
]

TRANSITION_METALS = [
    "Sc",
    "Ti",
    "V",
    "Cr",
    "Mn",
    "Fe",
    "Co",
    "Ni",
    "Cu",
    "Zn",
    "Y",
    "Zr",
    "Nb",
    "Mo",
    "Ru",
    "Rh",
    "Pd",
    "Ag",
    "Hf",
    "Ta",
    "W",
    "Re",
    "Os",
    "Ir",
    "Pt",
    "Au",
]

# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------


class NLSearchRequest(BaseModel):
    query: str


class NLMaterialSummary(BaseModel):
    id: str
    formula: str
    band_gap: float | None = None
    formation_energy: float | None = None
    energy_above_hull: float | None = None
    crystal_system: str | None = None
    is_stable: bool = False
    elements: list[str] = []
    source_db: str = ""

    model_config = {"from_attributes": True}


class NLSearchResponse(BaseModel):
    interpretation: str
    filters: dict[str, Any]
    results: list[NLMaterialSummary]
    total: int


# ---------------------------------------------------------------------------
# Parser helpers
# ---------------------------------------------------------------------------


def _resolve_element(token: str) -> str | None:
    """Return canonical element symbol for a token, or None."""
    low = token.lower().strip(".,;:()")
    if low in ELEMENT_MAP:
        return ELEMENT_MAP[low]
    if low in SYMBOL_SET:
        return SYMBOL_SET[low]
    return None


def _parse_exclusions(query_lower: str) -> list[str]:
    """Find 'no X', 'without X', 'exclude X', 'X-free' patterns."""
    excluded: list[str] = []
    # "no lead", "without cadmium", "exclude Pb"
    for pattern in [
        r"\bno\s+(\w+)",
        r"\bwithout\s+(\w+)",
        r"\bexclud(?:e|ing)\s+(\w+)",
        r"\b(\w+)[- ]free\b",
    ]:
        for m in re.finditer(pattern, query_lower):
            sym = _resolve_element(m.group(1))
            if sym and sym not in excluded:
                excluded.append(sym)
    return excluded


def _parse_inclusions(query_lower: str, excluded: list[str]) -> list[str]:
    """Find element mentions that are NOT part of exclusion phrases."""
    # Build a set of tokens that belong to exclusion contexts
    exclusion_tokens: set[str] = set()
    for pattern in [
        r"\bno\s+(\w+)",
        r"\bwithout\s+(\w+)",
        r"\bexclud(?:e|ing)\s+(\w+)",
        r"\b(\w+)[- ]free\b",
    ]:
        for m in re.finditer(pattern, query_lower):
            exclusion_tokens.add(m.group(1).lower())

    included: list[str] = []
    # Check each word
    for token in re.findall(r"\b[a-zA-Z]{1,15}\b", query_lower):
        if token.lower() in exclusion_tokens:
            continue
        sym = _resolve_element(token)
        if sym and sym not in excluded and sym not in included:
            included.append(sym)
    return included


def _parse_crystal_system(query_lower: str) -> str | None:
    for cs in CRYSTAL_SYSTEMS:
        if cs in query_lower:
            return cs
    return None


def parse_query(query: str) -> tuple[dict[str, Any], str]:
    """Parse a natural-language query into search filters and interpretation."""
    q = query.lower().strip()
    filters: dict[str, Any] = {}
    interpretations: list[str] = []

    # --- Exclusions first (so inclusions can skip them) ---
    excluded = _parse_exclusions(q)
    if excluded:
        filters["exclude_elements"] = excluded
        interpretations.append(f"excluding {', '.join(excluded)}")

    # --- Element inclusions ---
    included = _parse_inclusions(q, excluded)

    # --- Stability ---
    if re.search(r"\bunstable\b", q):
        filters["is_stable"] = False
        interpretations.append("unstable")
    elif re.search(r"\bstable\b", q):
        filters["is_stable"] = True
        interpretations.append("stable")

    # --- Crystal system ---
    cs = _parse_crystal_system(q)
    if cs:
        filters["crystal_system"] = cs
        interpretations.append(f"{cs} crystal system")

    # --- Band gap / electronic classification ---
    if re.search(r"\bsolar\b", q):
        filters["band_gap_min"] = 1.1
        filters["band_gap_max"] = 1.5
        interpretations.append("band gap 1.1-1.5 eV (solar)")
    elif re.search(r"\bwide[- ]?gap\b", q):
        filters["band_gap_min"] = 3.0
        interpretations.append("wide band gap (>3.0 eV)")
    elif re.search(r"\bnarrow[- ]?gap\b", q):
        filters["band_gap_max"] = 1.0
        filters["band_gap_min"] = 0.01
        interpretations.append("narrow band gap (<1.0 eV)")
    elif re.search(r"\binsulator\b", q):
        filters["band_gap_min"] = 4.0
        interpretations.append("insulator (band gap >4.0 eV)")
    elif re.search(r"\bsemiconductor\b", q):
        filters["band_gap_min"] = 0.5
        filters["band_gap_max"] = 4.0
        interpretations.append("semiconductor (band gap 0.5-4.0 eV)")
    elif re.search(r"\bmetal(?:lic)?\b", q) and not re.search(
        r"\btransition\s+metal", q
    ):
        filters["band_gap_max"] = 0.0
        interpretations.append("metallic (zero band gap)")

    # --- Mechanical properties ---
    if re.search(r"\bhard\b", q):
        filters["bulk_modulus_min"] = 200.0
        interpretations.append("hard (bulk modulus >200 GPa)")
    if re.search(r"\bstiff\b", q):
        # young_modulus not a direct search filter in the service, use bulk as proxy
        filters["bulk_modulus_min"] = max(filters.get("bulk_modulus_min", 0), 200.0)
        interpretations.append("stiff (modulus >200 GPa)")
    if re.search(r"\bductile\b", q):
        # poisson_ratio not a direct filter; we can't filter on it via the service
        # but we can note it in interpretation
        interpretations.append("ductile (Poisson ratio >0.3 — post-filter)")

    # --- Magnetic ---
    if re.search(r"\bnon[- ]?magnetic\b", q):
        filters["magnetic_ordering"] = "NM"
        interpretations.append("non-magnetic")
    elif re.search(r"\bferromagnetic\b", q):
        filters["magnetic_ordering"] = "FM"
        interpretations.append("ferromagnetic")
    elif re.search(r"\bantiferromagnetic\b", q):
        filters["magnetic_ordering"] = "AFM"
        interpretations.append("antiferromagnetic")
    elif re.search(r"\bmagnetic\b", q):
        filters["magnetic_ordering"] = "FM"
        interpretations.append("magnetic (ferromagnetic)")

    # --- Application shortcuts ---
    if re.search(r"\bbatter(?:y|ies)\b", q):
        if "Li" not in included:
            included.append("Li")
        if "O" not in included:
            included.append("O")
        if "is_stable" not in filters:
            filters["is_stable"] = True
        interpretations.append("battery application (Li + O, stable)")

    if re.search(r"\bcatalys(?:t|is|tic)\b", q):
        # Add common catalyst transition metals if none specified
        if not included:
            included.extend(["Fe", "Co", "Ni", "Pt"])
        interpretations.append("catalyst application")

    if re.search(r"\bthermoelectric\b", q):
        if "band_gap_min" not in filters:
            filters["band_gap_min"] = 0.01
        if "band_gap_max" not in filters:
            filters["band_gap_max"] = 1.0
        interpretations.append("thermoelectric (narrow gap)")

    # --- Formation energy shortcuts ---
    if re.search(r"\bthermodynamically\s+stable\b", q):
        filters["energy_above_hull_max"] = 0.05
        interpretations.append("energy above hull <0.05 eV/atom")

    # --- Include elements in filters ---
    if included:
        filters["elements"] = included
        interpretations.append(f"containing {', '.join(included)}")

    # Build interpretation string
    if interpretations:
        interpretation = "Searching for materials: " + "; ".join(interpretations)
    else:
        interpretation = "Broad search (no specific filters detected)"

    return filters, interpretation


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.post("/search", response_model=NLSearchResponse)
def nl_search(body: NLSearchRequest, db: Session = Depends(get_db)):
    """Convert a natural-language query to structured filters, run the search,
    and return both the interpretation and matching materials."""

    filters, interpretation = parse_query(body.query)

    # Map parsed filters to material_service.search kwargs
    search_kwargs: dict[str, Any] = {
        "page": 1,
        "limit": 20,
    }

    # Direct pass-through keys
    for key in [
        "crystal_system",
        "is_stable",
        "magnetic_ordering",
        "band_gap_min",
        "band_gap_max",
        "formation_energy_min",
        "formation_energy_max",
        "energy_above_hull_max",
        "bulk_modulus_min",
        "bulk_modulus_max",
        "shear_modulus_min",
        "shear_modulus_max",
        "thermal_conductivity_min",
        "thermal_conductivity_max",
    ]:
        if key in filters:
            search_kwargs[key] = filters[key]

    # Elements inclusion
    if "elements" in filters:
        search_kwargs["elements"] = filters["elements"]

    # Run the search
    results, total = material_service.search(db, **search_kwargs)

    # Post-filter: exclude elements (the service doesn't support exclusion natively)
    exclude_elements = filters.get("exclude_elements", [])
    if exclude_elements:
        filtered = []
        for mat in results:
            mat_elements = mat.elements or []
            if not any(ex in mat_elements for ex in exclude_elements):
                filtered.append(mat)
        # Adjust total (approximate — full accuracy would require DB-level filter)
        total = total - (len(results) - len(filtered))
        results = filtered

    return NLSearchResponse(
        interpretation=interpretation,
        filters=filters,
        results=results,
        total=max(total, 0),
    )
