# MatCraft — Complete API Reference

**Base URL**: `https://api.matcraft.ai/api/v1`  
**Auth**: `Authorization: Bearer <jwt_token>` (from `/users/login` or NextAuth session)  
**Rate limit**: 120 req/min per IP (Redis; in-memory fallback)  
**Versioning**: `/api/v1/` prefix on all endpoints

---

## Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/users/login` | None | Email + password → JWT |
| POST | `/users/register` | None | Create account (+10 free credits) |
| POST | `/users/oauth/google` | None | Google ID token → JWT |
| POST | `/users/oauth/firebase` | None | Firebase token → JWT |
| POST | `/users/guest` | None | Guest account |
| POST | `/users/refresh` | Refresh token | New access token |
| GET | `/users/me` | Required | Current user profile |
| GET | `/users/me/export` | Required | GDPR data export (JSON) |
| DELETE | `/users/me` | Required | Schedule account deletion (30-day grace) |

**Token lifetimes**: Access = 30 minutes · Refresh = 7 days

---

## Materials

### Search
```http
GET /materials?page=1&limit=20&sort_by=formula&sort_dir=asc
```

| Param | Type | Description |
|-------|------|-------------|
| `page` | int | Page number (default: 1) |
| `limit` | int | Items per page (max: 100, default: 20) |
| `q` | string | Full-text search (formula, external_id) |
| `elements` | string | Comma-separated elements: "Li,Fe,O" |
| `crystal_system` | string | Cubic/Hexagonal/Tetragonal/Orthorhombic/Monoclinic/Triclinic/Trigonal |
| `band_gap_min` | float | Min band gap (eV) |
| `band_gap_max` | float | Max band gap (eV) |
| `formation_energy_min` | float | Min formation energy (eV/atom) |
| `formation_energy_max` | float | Max formation energy (eV/atom) |
| `energy_above_hull_max` | float | Max Ehull (eV/atom) |
| `bulk_modulus_min/max` | float | Mechanical filter (GPa) |
| `shear_modulus_min/max` | float | Mechanical filter (GPa) |
| `thermal_conductivity_min/max` | float | Thermal filter (W/m·K) |
| `magnetic_ordering` | string | ferromagnetic/antiferromagnetic/non-magnetic |
| `has_elastic_data` | bool | Only materials with K, G data |
| `is_stable` | bool | Stability filter |
| `source_db` | string | materials_project/aflow/jarvis |
| `sort_by` | string | Any of 17 sortable properties |
| `sort_dir` | string | asc/desc |

**Response**: `{materials: [...], total: 204877, page: 1, limit: 20}`

### Single Material
```http
GET /materials/{id}
```
Returns full `MaterialDetail` with all properties, structure data, lattice, provenance.
**ETag** header for conditional requests. **Cache-Control: private, max-age=60**.

### Export Structure
```http
GET /materials/{id}/export/{fmt}
```
`fmt`: `cif` | `poscar` | `xyz`

### Related / Similar
```http
GET /materials/{id}/related?limit=12
GET /materials/{id}/similar
```

### Stats / Categories / Elements
```http
GET /materials/stats          # Redis cached 5 min
GET /materials/categories     # Redis cached 5 min (single SQL query)
GET /materials/elements       # Redis cached 10 min (jsonb_array_elements_text)
GET /materials/scatter?x=band_gap&y=formation_energy&limit=5000
```

---

## Electronic Structure (MP materials only)

| Endpoint | Description | Requires mp-api |
|----------|-------------|-----------------|
| `GET /electronic/bandstructure/{mp_id}` | Band structure along high-symmetry path | Yes |
| `GET /electronic/dos/{mp_id}` | Density of states (total + element-projected) | Yes |
| `GET /electronic/xrd/{mp_id}?wavelength=1.5406` | Simulated XRD pattern (pymatgen) | Yes |
| `GET /electronic/phase_diagram?elements=Li,Fe,O` | Thermodynamic convex hull (2-4 elements) | Yes |
| `GET /electronic/notebook/{mp_id}` | Auto-generated Jupyter notebook (.ipynb) | No |

**Band structure response** (actual schema):
```json
{
  "material_id": "mp-149",
  "efermi": 5.63,
  "is_metal": false,
  "band_gap": {"energy": 0.61, "direct": false},
  "bands": [[...], [...]],
  "kpoint_distances": [0, 0.1, ...],
  "branches": [{"name": "Γ-X", "start_index": 0, "end_index": 50}],
  "note": "Full band structure requires mp-api package"
}
```

---

## Structure Builder

All endpoints require valid Materials Project ID (`mp-*` format).

| Endpoint | Body | Description |
|----------|------|-------------|
| `POST /builder/supercell` | `{mp_id, nx, ny, nz}` | Generate NxMxL supercell |
| `POST /builder/surface` | `{mp_id, miller_h, miller_k, miller_l, min_slab_size, vacuum}` | Surface slab (pymatgen SlabGenerator) |
| `POST /builder/nanoparticle` | `{mp_id, radius}` | Spherical nanoparticle |
| `POST /builder/substitute` | `{mp_id, original_element, substitute_element, fraction}` | Element substitution |
| `POST /builder/inverse_design` | `{target_band_gap?, target_formation_energy?, required_elements?, excluded_elements?, crystal_system?}` | AI inverse design (database screening) |

---

## Natural Language Search

```http
POST /nl/search
{"query": "stable semiconductor for solar cells with no lead"}
```

**Response**:
```json
{
  "interpretation": "Searching stable materials with band_gap 1.1-1.5 eV, excluding Pb",
  "filters": {"band_gap_min": 1.1, "band_gap_max": 1.5, "is_stable": true},
  "results": [...materials...],
  "total": 47
}
```

**Recognized patterns** (25+ material synonyms, element names/symbols, band gap ranges, crystal systems, magnetic orderings, application shortcuts)

---

## IP Radar

| Endpoint | Auth | Credits | Description |
|----------|------|---------|-------------|
| `POST /ip-radar/scope-query` | Optional | Free | AI query scoping (Gemini or rule-based) |
| `POST /ip-radar/search` | Optional | 1 credit (3 free/day anon) | Full patent search + AI analysis |

### /ip-radar/scope-query
```json
// Request
{"query": "LiFePO4 battery", "context": ""}

// Response — NEEDS_CLARIFICATION
{
  "status": "NEEDS_CLARIFICATION",
  "clarification_message": "LiFePO4 is a broad field...",
  "suggested_filters": ["Synthesis & Manufacturing", "Doping", "Coatings", "Recycling"]
}

// Response — READY_TO_SEARCH
{
  "status": "READY_TO_SEARCH",
  "final_query": "LiFePO4 battery Coatings graphene oxide"
}
```

### /ip-radar/search
```json
// Request
{"query": "LiFePO4 battery Coatings graphene oxide", "max_patents": 50}

// Response
{
  "query": "LiFePO4 battery...",
  "total_patents_found": 125048,
  "analyzed_count": 50,
  "stats": {
    "by_category": {"Process/Synthesis": 18, ...},
    "by_assignee": {"CATL": 8, ...},
    "by_jurisdiction": {"CN": 22, "US": 15},
    "filing_date_range": {"earliest": "2009-08-07", "latest": "2025-01-15"}
  },
  "patents": [...],
  "white_spaces": [...],
  "executive_summary": "...",
  "fto_assessment": "..."
}
```

**Patent waterfall**: Google Patents XHR → EPO OPS → Lens.org

---

## Deep Scan

| Endpoint | Auth | Credits | Description |
|----------|------|---------|-------------|
| `POST /deep-scan/launch` | **Required** | `max_patents ÷ 100` credits | Launch async scan |
| `GET /deep-scan/{scan_id}/status` | Required | Free | Poll scan progress |
| `GET /deep-scan/{scan_id}/download` | Required | Free | Get completed results |

### Launch
```json
// Request
{
  "query": "LiFePO4 battery coatings",
  "directive": "We're developing N-doped graphene oxide coatings via CVD below 200°C. Flag relevant prior art.",
  "max_patents": 2000,
  "email": "researcher@lab.edu"
}

// Response (immediate)
{
  "scan_id": "uuid-here",
  "status": "queued",
  "estimated_time_minutes": 20,
  "credits_charged": 20
}
```

### Status polling
```json
{
  "scan_id": "uuid",
  "status": "analyzing",  // queued | searching | analyzing | generating | completed | failed
  "progress": 0.45,
  "patents_found": 2000,
  "patents_analyzed": 900,
  "message": "Analyzing patents 900/2000..."
}
```

---

## Credits

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /credits/balance` | Required | `{"credits": 12, "email": "..."}` |
| `POST /credits/purchase` | Required | Simulate purchase (dev only) |
| `GET /credits/history` | Required | Last 50 transactions |

**Credit costs summary**:
| Action | Cost |
|--------|------|
| IP Radar search | 1 credit |
| Deep Scan | max_patents ÷ 100 |
| Scoping query | Free |
| Material search | Free |
| Structure builder API | Free |
| Electronic structure | Free |

---

## Stripe Payments

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /stripe/config` | None | Publishable key + packages |
| `POST /stripe/create-checkout-session` | Required | One-time credit purchase |
| `POST /stripe/create-subscription-session` | Required | Monthly subscription |
| `POST /stripe/webhook` | Stripe signature | Fulfill credits (idempotent) |
| `POST /stripe/create-portal-session` | Required | Manage subscription |

**Packages**:
- starter_10: 10 credits / $29 (`price_1TM9EnD2rITmpkEzV3nX0vHY`)
- pro_50: 50 credits / $99 (`price_1TM9EoD2rITmpkEzm2ymCGvR`)
- enterprise_200: 200 credits / $299 (`price_1TM9EpD2rITmpkEzqDjNYy5p`)
- deep_scan_pack_50: 50 credits / $199 (`price_1TM9EqD2rITmpkEzClJIqe37`)

**Subscriptions**:
- researcher_monthly: 50 cr/mo / $49 (`price_1TM9ErD2rITmpkEzDHTEpF6k`)
- professional_monthly: 200 cr/mo / $149 (`price_1TM9ErD2rITmpkEzPFnN3kdk`)
- enterprise_monthly: 1000 cr/mo / $499 (`price_1TM9EsD2rITmpkEzL731XlRM`)

**Webhook endpoint**: `we_1TM9G6D2rITmpkEzdOoSgZDq`

---

## Admin (ADMIN_EMAILS: gauthier.bros@gmail.com)

| Endpoint | Description |
|----------|-------------|
| `GET /admin/stats` | Platform stats (users, revenue, campaigns) |
| `GET /admin/users?search=&page=1` | Paginated user list |
| `POST /admin/users/{id}/credits` | Add credits manually |
| `POST /admin/users/{id}/toggle-admin` | Toggle admin flag |
| `GET /admin/transactions?page=1` | All credit transactions |
| `GET /admin/investor-requests?status=pending` | Access requests |
| `POST /admin/investor-requests/{id}/approve` | Approve + generate password |
| `POST /admin/investor-requests/{id}/reject` | Reject request |

---

## Investor Access

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /investor-access/request` | None | Submit access request |
| `POST /investor-access/verify` | None | Verify password → data room |

---

## Health

| Endpoint | Description |
|----------|-------------|
| `GET /health` | `{"status": "ok"}` |
| `GET /health/live` | Liveness probe |
| `GET /health/full` | DB + Redis + Celery status |

---

## Error Codes

| Code | When |
|------|------|
| 400 | Invalid request body or params |
| 401 | Missing or invalid JWT |
| 402 | Insufficient credits |
| 403 | Admin access required |
| 404 | Resource not found |
| 422 | Validation error (Pydantic) |
| 429 | Rate limit or free search limit exceeded |
| 500 | Internal server error (never leaks stack trace) |
| 501 | Feature requires uninstalled package (mp-api) |
| 503 | Payment system not configured |

---

## Campaigns (Active Learning)

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /campaigns` | Required | List user's campaigns |
| `POST /campaigns` | Required | Create campaign |
| `GET /campaigns/{id}` | Required | Campaign details |
| `POST /campaigns/{id}/run` | Required | Start Celery optimization |
| `GET /campaigns/{id}/results` | Required | Results + Pareto front |
| `GET /campaigns/{id}/export?format=csv` | Required | CSV/JSON/CIF/POSCAR export |
| `DELETE /campaigns/{id}` | Required | Delete campaign |
