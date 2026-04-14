# MatCraft — Complete Feature Inventory

> Every feature, its route, endpoint, auth requirement, and credit cost.

---

## Materials Database

**Route**: `/materials`  
**API**: `GET /api/v1/materials`  
**Auth**: None required  
**Credits**: Free  

| Feature | Description |
|---------|-------------|
| **205,000+ materials** | Materials Project (~155k) + AFLOW (~50k) + JARVIS (~76k pending) |
| **Text search** | Formula, external_id, element combinations |
| **Property filters** | 17 filterable properties (band gap, formation energy, Ehull, density, moduli, magnetization, thermal) |
| **Sort** | 17 sortable properties, asc/desc |
| **Pagination** | 20/page server-side |
| **Categories** | Crystal system distribution, electronic classification, property coverage |
| **Stats** | Total/stable count, avg band gap, sources — Redis cached 5min |
| **Similar materials** | Same space group + similar band gap + same n_elements |
| **Related materials** | Shared elements or crystal system, randomized (Redis cached 5min) |
| **Scatter plot** | Any 2 of 17 properties, up to 5000 points |

---

## Material Detail Page

**Route**: `/materials/{id}`  
**API**: `GET /api/v1/materials/{id}`  
**Auth**: None  
**Credits**: Free  

| Section | Content |
|---------|---------|
| Header | Formula, stability badge, crystal system, space group, source badge |
| Warnings | Scientific caveats (unstable, GGA underestimation, theoretical) |
| Provenance | DFT method, theoretical/experimental, magnetic ordering, direct/indirect gap |
| ICSD validation | Green box when experimentally verified (ICSD IDs) |
| Decomposition | Competing phases for unstable materials |
| Property cards | 17 properties as infographic cards with color-coding |
| Elements | CPK-colored badges + composition percentages |
| Oxidation states | Per-element signed notation |
| Lattice params | Conventional + primitive toggle (one-click) |
| Application scores | AI-estimated 1-10 for 8 application domains |
| Electronic structure | Band structure + DOS + Phase diagram (tabbed, MP materials) |
| 3D viewer | WebGL crystal structure (React Three Fiber) |
| Action links | Compare, Edit in Builder, Supercell tools |
| Citation | DOI + one-click copy (MP, AFLOW, JARVIS citations) |
| Export | CIF, POSCAR, XYZ, Jupyter notebook |
| Related materials | 12 related materials (streamed via Suspense) |
| Co-pilot chat | Floating NL search chat panel |

---

## 3D Crystal Structure Viewer

**Embedded in**: material detail pages  
**Component**: `MaterialStructureScene.tsx`  
**Auth**: None | **Credits**: Free  

| Feature | Detail |
|---------|--------|
| CPK element colors | 70+ elements, metallic shading |
| Adaptive bond detection | min pairwise distance × 1.3 (covers covalent ~1.5Å to metallic ~4.5Å) |
| Unit cell wireframe | 12 edges from raw 3×3 lattice matrix |
| Supercell expansion | 2×2×2 for cells with <8 atoms |
| Orbit controls | Mouse drag rotate, scroll zoom, right-click pan |
| Mobile optimization | 16 vs 32 polygon segments, DPR limiting, touch controls |
| Auto-rotation | Gentle spin, stops on interaction |

---

## 3D Material Builder

**Route**: `/material-builder`  
**Auth**: None | **Credits**: Free  
**URL param**: `?materialId=mp-149` auto-loads  

| Panel | Features |
|-------|---------|
| **Left — Elements** | 40+ elements, CPK colors, 3 categories (Common, Transition, Rare Earth) |
| **Left — Prototypes** | 10 one-click templates: FCC/BCC/HCP/Diamond/Rocksalt/Perovskite/Fluorite/Zincblende/Wurtzite/Spinel |
| **Left — Lattice** | a,b,c,α,β,γ with crystal system auto-constraints |
| **Viewport** | True 3D placement (3 orthogonal planes), drag-to-move, Delete key, unit cell wireframe |
| **Right — Add Atom** | Fractional coordinate input (x,y,z fields), synced with palette |
| **Right — Properties** | Formula, atom count, space group, volume, composition |
| **Right — Quick Actions** | Surface slab modal, nanoparticle modal |
| **Right — Export** | CIF, POSCAR, XYZ download |
| **Right — Share** | Base64 structure in URL for sharing |
| **Drag & Drop** | Import CIF or POSCAR files |
| **Keyboard** | F=fit, R=rotate, 1/2/3=axis views, Del=delete, Ctrl+Z/Y=undo/redo |

---

## IP Radar

**Route**: `/ip-radar`  
**Auth**: Optional (3 free/day anonymous, 1 credit/search authenticated)  

### AI Query Scoping Agent
`POST /api/v1/ip-radar/scope-query`  
- Evaluates if query is BROAD or PRECISE using Gemini 2.0 Flash
- Rule-based fallback with 6 material-specific filter sets
- Returns 3-4 domain-specific narrowing suggestions or refined query

### Patent Search
`POST /api/v1/ip-radar/search`  
- **Waterfall**: Google Patents XHR (125M+) → EPO OPS → Lens.org
- **Query expansion**: 25+ material abbreviations (LiFePO4 → "lithium iron phosphate" OR "LFP cathode")
- **AI analysis**: Gemini 2.0 Flash categorizes 50 patents, identifies white spaces, writes FTO
- **7 categories**: Composition/Alloy, Process/Synthesis, Application, Coating, Nanostructure, Characterization, Other
- **Redis cached**: 24 hours per query hash

---

## Deep Scan

**Route**: Triggered from `/ip-radar`  
**Auth**: **Required**  
**Credits**: `max_patents ÷ 100`  

Pipeline (Celery worker):
1. Patent extraction (Google Patents → EPO → Lens.org)
2. Batch AI analysis (20 patents/batch, Gemini 2.0 Flash)
3. Custom directive injection: `directive_relevance` score per patent
4. Report compilation (executive summary, FTO, white spaces, directive section)
5. Redis storage (48h TTL)
6. Email notification (placeholder)

---

## Electronic Structure

**Route**: Embedded in material detail  
**Auth**: None | **Credits**: Free  
**Requires**: mp-api package installed  

| Feature | Source | Available |
|---------|--------|-----------|
| Band structure | Materials Project | MP materials only |
| Density of states | Materials Project | MP materials only |
| XRD pattern | pymatgen XRDCalculator | Any material with structure |
| Phase diagram | Materials Project | 2-4 element systems |
| Jupyter notebook | Auto-generated .ipynb | MP materials only |

---

## Natural Language Search

**Route**: `/materials` (co-pilot panel) + `/ip-radar`  
**API**: `POST /api/v1/nl/search`  
**Auth**: None | **Credits**: Free  

Recognized patterns:
- **90+ elements**: full names ("silicon") and symbols ("Si")
- **Exclusions**: "no lead", "without cadmium", "lead-free"
- **Crystal systems**: cubic, hexagonal, tetragonal, etc.
- **Band gap ranges**: semiconductor (0.5-4.0), insulator (>4.0), solar (1.1-1.5)
- **Applications**: "battery" → Li+O+stable, "catalyst" → transition metals
- **Mechanical**: "hard" (K>200 GPa), "stiff" (E>200 GPa)

---

## Campaign Engine (Materia)

**Route**: `/explore`, `/dashboard/campaigns`  
**Auth**: Required | **Credits**: Free (compute-heavy)  

| Component | Description |
|-----------|-------------|
| Latin Hypercube Sampling | Initial design space exploration |
| NumpyMLP surrogate | Pure NumPy, MC Dropout uncertainty (30 forward passes) |
| CMA-ES optimizer | Covariance Matrix Adaptation Evolution Strategy |
| Acquisition functions | MaxUncertainty, ExpectedImprovement, WeightedUCB |
| Pareto front | NSGA-II with crowding distance |
| Convergence | MaxRounds, ParetoStabilized criteria |
| External models | ONNX, CHGNet, MACE |
| Plugin system | Custom domain evaluators (water treatment implemented) |

---

## Credit System

**Route**: `/dashboard/settings?tab=billing`  
**API**: `/api/v1/credits/*`, `/api/v1/stripe/*`  

| Package | Credits | Price | Stripe Price ID |
|---------|---------|-------|-----------------|
| Starter | 10 | $29 | price_1TM9EnD2... |
| Pro | 50 | $99 | price_1TM9EoD2... |
| Enterprise | 200 | $299 | price_1TM9EpD2... |
| Deep Scan Pack | 50 | $199 | price_1TM9EqD2... |
| Researcher (mo) | 50/mo | $49 | price_1TM9ErD2... |
| Professional (mo) | 200/mo | $149 | price_1TM9ErD2... |
| Enterprise (mo) | 1000/mo | $499 | price_1TM9EsD2... |

**Free tier**: 10 credits on signup + 3 anonymous searches/day (IP-tracked in Redis)

---

## Admin Dashboard

**Route**: `/admin` (gauthier.bros@gmail.com only)  
**Auth**: Required + admin email check  

| Page | Features |
|------|---------|
| `/admin` | Stats grid, revenue chart, user growth chart, system health |
| `/admin/users` | Searchable user table, add credits, toggle admin |
| `/admin/transactions` | All credit transactions paginated |
| `/admin/investor-requests` | Approve/reject data room access, copy generated passwords |

---

## Investor Data Room

| Route | Access | Description |
|-------|--------|-------------|
| `/investors` | Public | Teasing page, request access modal |
| `/data-room` | Password | Entry gate (POST /investor-access/verify) |
| `/data-room/dashboard` | Password | Full data room: exec summary, 42-competitor table, market, ask |

**Flow**: Request → Admin approves → Password generated → Email shared → Data room access

---

## Legal / Compliance

| Route | Description |
|-------|-------------|
| `/legal/privacy` | GDPR privacy policy |
| `/legal/terms` | Terms of service (French law) |
| `/legal/cookies` | Cookie policy + table |
| `/legal/mentions` | French mentions légales |
| `/press` | Press kit, releases, soundbites |
| `/investors` | Investor teasing + data room |

---

## 8 Persona Pages

**Route**: `/for/{persona}`  
**Auth**: None | **Credits**: Free  

| Slug | Audience | Key Features Highlighted |
|------|----------|------------------------|
| `materials-scientists` | Materials scientists | Search, 3D viewer, electronic structure, DFT export |
| `engineers` | Engineers | Property filters, comparator, CSV export |
| `students` | Students/educators | Free tier, 3D builder, prototypes |
| `startups` | Deep tech startups | Free data, $950 Deep Scan vs $5-10k law firm |
| `ip-lawyers` | Patent attorneys | IP Radar, Deep Scan, 7 categories, white spaces |
| `ai-researchers` | ML researchers | API access, 30+ properties, clean datasets |
| `pharma-biotech` | Life sciences | Element filtering, nanoparticle builder |
| `academia-labs` | Academic labs | Jupyter export, citations, GDPR-compliant |

---

## Versioning Strategy

| Layer | Mechanism | Result |
|-------|-----------|--------|
| Next.js Build ID | Git SHA-12 via `generateBuildId` | Unique JS chunk hashes per deploy |
| HTML pages | Middleware → `no-cache, no-store, s-maxage=0` | Never cached by CDN |
| Static assets | `/_next/static/*` → `immutable, max-age=31536000` | Cached forever (content-hashed) |
| Version polling | `GET /api/version` every 60s | "Update now" banner when new deploy detected |
| Cloud Run | `--revision-suffix {sha}` + `--min-instances 1` | Instant traffic cutover, no cold starts |
