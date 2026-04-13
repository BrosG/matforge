# MatCraft — Complete Product Documentation

> **The most comprehensive open materials discovery platform.**
> 205,000+ real materials from Materials Project + AFLOW, with AI-powered screening, 3D visualization, and computational tools.

**Live at:** [matcraft.ai](https://matcraft.ai)
**API Docs:** [api.matcraft.ai/api/v1/docs](https://api.matcraft.ai/api/v1/docs)
**Repository:** [github.com/BrosG/matforge](https://github.com/BrosG/matforge)

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Materials Database](#2-materials-database)
3. [Material Detail Page](#3-material-detail-page)
4. [3D Crystal Structure Viewer](#4-3d-crystal-structure-viewer)
5. [Electronic Structure](#5-electronic-structure)
6. [Structure Builder Tools](#6-structure-builder-tools)
7. [AI & Machine Learning](#7-ai--machine-learning)
8. [Search & Discovery](#8-search--discovery)
9. [Analysis & Visualization](#9-analysis--visualization)
10. [Data Export & Integration](#10-data-export--integration)
11. [Materials Discovery Engine (Materia)](#11-materials-discovery-engine-materia)
12. [API Reference](#12-api-reference)
13. [Data Sources & Citations](#13-data-sources--citations)
14. [Data Quality Pipeline](#14-data-quality-pipeline)
15. [Architecture](#15-architecture)
16. [Deployment & Infrastructure](#16-deployment--infrastructure)
17. [Security](#17-security)
18. [Domain-Specific Applications](#18-domain-specific-applications)
19. [SDK & Programmatic Access](#19-sdk--programmatic-access)
20. [Roadmap](#20-roadmap)

---

## 1. Platform Overview

MatCraft is a materials science platform that combines:

- **205,000+ real DFT-computed materials** from Materials Project and AFLOW
- **30+ properties per material** including thermodynamic, mechanical, electronic, magnetic, and thermal data
- **3D crystal structure visualization** with unit cell boxes, bonds, and supercell expansion
- **AI-powered inverse design** — specify target properties, get ranked candidates
- **Structure builder tools** — supercells, surfaces, nanoparticles, element substitution
- **Electronic structure APIs** — band structure, DOS, XRD simulation, phase diagrams
- **Jupyter notebook generation** — one-click reproducible analysis
- **Active learning campaigns** — surrogate models + Pareto optimization for materials discovery

### Who is it for?

| User | Use Case |
|------|----------|
| **Materials scientists** | Screen candidates, compare properties, export structures for DFT |
| **Engineers** | Find materials meeting specific mechanical/thermal/electronic requirements |
| **Students** | Learn crystallography, explore periodic table, understand DFT data |
| **AI researchers** | Access clean property datasets for ML model training |
| **Startups** | Rapid materials screening without running expensive DFT calculations |

### Key Differentiators

1. **Unified data from multiple sources** — Materials Project + AFLOW in one search interface
2. **Scientific transparency** — every material shows DFT method, warnings, provenance, ICSD references
3. **Application suitability scores** — AI-estimated ratings for solar, battery, catalyst, thermoelectric, etc.
4. **Structure builder** — generate supercells, surfaces, nanoparticles directly from the browser
5. **Active learning engine** — run full materials discovery campaigns with surrogate models

---

## 2. Materials Database

### Data Sources

| Source | Materials | Properties | Structure Data | API Key Required |
|--------|-----------|------------|----------------|------------------|
| **Materials Project** | ~155,000 | Band gap, formation energy, Ehull, density, volume, elastic moduli, magnetization, dielectric, Fermi energy, decomposition, ICSD refs | Full atomic positions + lattice matrix | Yes (free) |
| **AFLOW** | ~50,000 | Formation energy, band gap, density, elastic moduli, thermal conductivity, magnetization | Metadata only (no atomic positions) | No |
| **JARVIS-DFT** | ~76,000 (pending) | Formation energy, band gap, Ehull, elastic moduli, dielectric, Seebeck coefficient | Atomic positions + lattice | No |

### Property Coverage

#### Thermodynamic Properties
| Property | Unit | Description | Coverage |
|----------|------|-------------|----------|
| Band gap | eV | Energy difference between valence and conduction bands | 100% |
| Formation energy | eV/atom | Energy to form compound from elements | 100% |
| Energy above hull | eV/atom | Distance from thermodynamic convex hull (stability metric) | ~80% (MP) |
| Density | g/cm³ | Mass per unit volume | 100% |
| Volume | Å³ | Unit cell volume | ~80% |
| Is stable | boolean | Ehull ≤ 0.025 eV/atom | 100% |

#### Mechanical Properties
| Property | Unit | Description | Coverage |
|----------|------|-------------|----------|
| Bulk modulus | GPa | Resistance to uniform compression | ~10% (14k materials) |
| Shear modulus | GPa | Resistance to shape change | ~10% |
| Young's modulus | GPa | Stiffness under tension | ~10% (derived from K and G) |
| Poisson ratio | dimensionless | Lateral contraction under axial stress | ~10% |

#### Electronic & Magnetic Properties
| Property | Unit | Description | Coverage |
|----------|------|-------------|----------|
| Total magnetization | µB | Net magnetic moment per unit cell | ~60% |
| Magnetic ordering | string | ferromagnetic / antiferromagnetic / paramagnetic / non-magnetic | ~60% |
| Dielectric constant | dimensionless | Electronic contribution to dielectric response | ~5% |
| Refractive index | dimensionless | Speed of light in material vs vacuum | ~5% |
| Fermi energy | eV | Highest occupied energy level at 0K | ~80% (MP) |
| Is gap direct | boolean | Direct vs indirect band gap | ~80% (MP) |

#### Thermal Properties
| Property | Unit | Description | Coverage |
|----------|------|-------------|----------|
| Thermal conductivity | W/(m·K) | Heat conduction rate | ~5% (AFLOW) |
| Seebeck coefficient | µV/K | Thermoelectric voltage per degree | ~2% (JARVIS) |

#### Provenance & Reliability
| Field | Description |
|-------|-------------|
| Calculation method | DFT functional used (GGA-PBE, HSE06, GGA+U, OptB88vdW) |
| Is theoretical | Whether structure is computationally predicted |
| Experimentally observed | Has ICSD entry (experimentally verified structure) |
| ICSD IDs | Inorganic Crystal Structure Database reference numbers |
| Database IDs | Cross-references to other databases (COD, ICSD, etc.) |
| Decomposition pathway | Competing phases this material would decompose into |
| Warnings | Auto-generated caveats (instability, DFT band gap underestimation, etc.) |

---

## 3. Material Detail Page

Every material has a dedicated page showing:

### Header
- Chemical formula with subscript rendering (e.g., Ac₂SiHg)
- Stability badge (Stable / Unstable)
- Crystal system badge (Cubic, Hexagonal, Tetragonal, etc.)
- Space group symbol (Fm-3m, I4/mmm, etc.)
- Source database badge
- Materials Project ID with link to source
- Fetch date
- Atom count
- **Download buttons**: CIF, POSCAR, XYZ, Jupyter notebook

### Scientific Warnings
Yellow alert box showing:
- "Computationally predicted structure — not experimentally verified"
- "Calculated with GGA-PBE — band gaps may be underestimated"
- "Thermodynamically unstable (Ehull > 0.1 eV/atom)"

### Provenance Badges
- DFT method (GGA-PBE, HSE06, etc.)
- Theoretical / Computed badge
- Experimentally Observed badge (if ICSD entry exists)
- Non-magnetic (NM) / Ferromagnetic / Antiferromagnetic badge
- Direct Gap / Indirect Gap badge

### Experimental Validation
Green box showing ICSD reference numbers when the structure has been experimentally verified.

### Decomposition Pathway
For unstable materials: shows competing phases as red badges with explanation "Competing phases this material would decompose into".

### Property Tables (with hover tooltips)

Each property name shows a tooltip on hover explaining:
- What the property measures
- Why it matters
- Typical value range

Tables grouped by category:
1. **Thermodynamic Properties** — band gap, formation energy, Ehull, density, volume
2. **Mechanical Properties** — bulk modulus, shear modulus, Young's modulus, Poisson ratio
3. **Electronic & Magnetic Properties** — Fermi energy, magnetization, dielectric constant, refractive index, effective masses
4. **Thermal Properties** — thermal conductivity, Seebeck coefficient

### Elements & Composition
- Element badges with periodic table coloring
- Composition as percentages (e.g., Ac 50.0%, Si 25.0%, Hg 25.0%)

### Oxidation States
Per-element oxidation states with signed notation (e.g., Fe³⁺, O²⁻).

### Lattice Parameters
- Conventional cell a, b, c (Å) and α, β, γ (°)
- Cell type label (conventional)
- Collapsible primitive cell parameters when conversion was performed
- Properly converted: FCC primitive (60°) → conventional (90°), BCT → tetragonal, etc.

### Application Suitability Scores
AI-estimated 1-10 scores with color coding (green/yellow/red) and reasoning:
- **Solar Absorber** — based on band gap (optimal: 1.1-1.5 eV Shockley-Queisser)
- **LED / Display** — requires direct gap in visible range
- **Thermoelectric** — narrow gap + Seebeck data
- **Semiconductor** — band gap 0.5-4.0 eV
- **Dielectric / Insulator** — wide gap >4 eV
- **Hard Coating** — bulk modulus >200 GPa
- **Battery Cathode** — Li-containing oxide, stable
- **Catalyst Candidate** — contains transition metals (Fe, Co, Ni, Pt, Pd, Ru, Ir, Rh)

### Data Source & Citation
- Source database name and ID
- Link to original data source
- Proper DOI citation:
  - Materials Project: A. Jain et al., APL Materials 1, 011002 (2013). DOI: 10.1063/1.4812323
  - AFLOW: S. Curtarolo et al., Comp. Mat. Sci. 58, 218 (2012). DOI: 10.1016/j.commatsci.2012.02.005
- Cross-reference IDs to other databases

### 3D Crystal Structure Viewer
(See section 4)

### Quick Stats Cards
Below the 3D viewer: Band Gap, Formation Energy, Energy Above Hull — at a glance.

### Related Materials
Up to 12 materials sharing elements or crystal system, randomly sampled.

---

## 4. 3D Crystal Structure Viewer

Interactive WebGL-based crystal structure visualization using React Three Fiber.

### Features
- **Atom rendering** — CPK coloring (70+ elements), metallic shading
- **Adaptive bond detection** — finds minimum pairwise distance, draws bonds within 1.3x of that (covers covalent ~1.5Å to metallic ~4.5Å)
- **Unit cell wireframe** — 12 edges of the parallelepiped cell, drawn from the raw 3x3 lattice matrix
- **2x2x2 supercell expansion** — for primitive cells with <8 atoms, replicates using lattice vectors to show structural context
- **Orbit controls** — mouse drag to rotate, scroll to zoom, right-click to pan
- **Auto-rotation** — gentle spin for visual appeal, stops on interaction
- **Proper coordinate handling**:
  - Atoms from MP are in primitive cell Cartesian coordinates
  - Lattice matrix from MP defines the cell in the same frame
  - Both centered around cell center for visual alignment

### Coordinate System
Materials Project returns structures in their primitive cell with:
- `xyz` coordinates in Angstrom (Cartesian)
- `abc` coordinates as fractional (0-1)
- `lattice.matrix` as 3x3 array defining the cell vectors

The viewer uses:
1. Cartesian `xyz` directly for atom positions
2. `lattice_matrix` to draw the cell box and compute supercell translations
3. Cell center = 0.5 × (v₁ + v₂ + v₃) for centering

### Element Colors (CPK Convention)
H: white, C: gray, N: blue, O: red, Fe: orange, Cu: brown, Au: gold, etc.

---

## 5. Electronic Structure

### Band Structure API
`GET /api/v1/electronic/bandstructure/{mp_id}`

Fetches full band structure via mp-api and returns plottable JSON:
- K-point distances along high-symmetry path
- Band energies per spin channel (shifted by Efermi)
- Branch labels (Γ-X, X-M, M-Γ, etc.)
- Band gap energy, type (direct/indirect), transition

### Density of States API
`GET /api/v1/electronic/dos/{mp_id}`

Returns:
- Total DOS per spin channel
- Element-projected DOS (e.g., Fe d-states, O p-states)
- Energies relative to Fermi level

### XRD Pattern Simulator
`GET /api/v1/electronic/xrd/{mp_id}?wavelength=1.5406`

Simulates powder X-ray diffraction using pymatgen XRDCalculator:
- 2θ angles and intensities
- Miller indices (hkl) for each peak
- d-spacings
- Configurable wavelength (default: Cu Kα = 1.5406 Å)

### Phase Diagram
`GET /api/v1/electronic/phase_diagram?elements=Li,Fe,O`

Computes thermodynamic convex hull:
- All stable phases with compositions and energies
- Unstable phases with energy above hull
- Supports 2-4 element systems

### Jupyter Notebook Generator
`GET /api/v1/electronic/notebook/{mp_id}`

Auto-generates a complete .ipynb notebook with:
1. Material summary fetch
2. Crystal structure visualization
3. Band structure plot (pymatgen BSPlotter)
4. DOS plot (pymatgen DosPlotter)
5. XRD pattern simulation
6. Proper citations

One-click download, ready to run with `jupyter notebook`.

---

## 6. Structure Builder Tools

All accessible via `/api/v1/builder/` endpoints.

### Supercell Generator
`POST /builder/supercell`

Input: MP material ID + Nx, Ny, Nz dimensions
Output: Full supercell with all atom positions, lattice, volume

Example: mp-149 (Si) with 2x2x2 → 16 atoms, 8x volume

### Surface / Slab Builder
`POST /builder/surface`

Input: MP material ID + Miller index (h, k, l) + slab thickness + vacuum
Output: Surface slab ready for surface science calculations

Uses pymatgen SlabGenerator. Selects most stable termination automatically.

### Nanoparticle Carver
`POST /builder/nanoparticle`

Input: MP material ID + radius (Å)
Output: Spherical nanoparticle with centered coordinates

Builds NxNxN supercell, carves sphere of specified radius, centers at origin.

### Element Substitution
`POST /builder/substitute`

Input: MP material ID + original element + substitute element + fraction
Output: Modified structure with substituted sites

Supports:
- Full substitution (all Fe → Co)
- Partial substitution (50% of Fe sites → Co)

Uses pymatgen SubstitutionTransformation.

### AI Inverse Design
`POST /builder/inverse_design`

Input target properties:
- Band gap (eV)
- Formation energy (eV/atom)
- Bulk modulus (GPa)
- Required/excluded elements
- Crystal system

Output: Ranked list of candidate materials from the 205k database, sorted by distance from targets. Each candidate shows:
- All properties
- Match score
- Reasoning (why it matched)

---

## 7. AI & Machine Learning

### Materials Discovery Engine (Materia)

The core engine (`src/materia/`) implements a full active learning loop:

1. **Latin Hypercube Sampling** — initial design space exploration
2. **Surrogate Model Training** — NumPy MLP with MC Dropout uncertainty
3. **Acquisition Function** — MaxUncertainty, ExpectedImprovement, WeightedUCB
4. **CMA-ES Optimization** — on the surrogate to find promising candidates
5. **True Evaluation** — physics-based or DFT evaluation of candidates
6. **Pareto Front Computation** — NSGA-II fast non-dominated sort

### Surrogate Models
- **NumpyMLP** — pure NumPy implementation, no PyTorch dependency
  - Xavier initialization, ReLU activations, Adam optimizer
  - MC Dropout for uncertainty estimation (30 forward passes)
  - Early stopping with validation split
  - Z-score input/output normalization
- **ONNX** — load pre-trained models for inference
- **CHGNet** — graph neural network for crystal energy/force prediction
- **MACE** — equivariant message passing neural network

### Optimizer
- **CMA-ES** — Covariance Matrix Adaptation Evolution Strategy
  - Operates in [0,1]^D normalized space
  - Reflection + clipping boundary handling
  - Configurable sigma, max generations

### Analysis
- **Pareto front** — NSGA-II with crowding distance
- **Hypervolume** — 2D hypervolume indicator
- **Convergence** — MaxRounds, ParetoStabilized criteria

### Safe Expression Evaluator
Custom AST-whitelisted evaluator replacing `eval()`/`exec()`:
- Only arithmetic, comparisons, boolean logic allowed
- Explicit function allowlist (numpy, math builtins)
- Blocks: imports, dunder access, lambdas, comprehensions, exponent abuse
- Used for user-defined constraint and objective expressions in YAML configs

---

## 8. Search & Discovery

### Materials Explorer (`/materials`)

Client-side search interface with:

#### Text Search
- Formula search (e.g., "LiFePO4", "Ac2")
- Element search (e.g., "Li,Fe,O")
- External ID search (e.g., "mp-149")

#### Filters
- Crystal system (Cubic, Hexagonal, Tetragonal, Orthorhombic, Monoclinic, Triclinic, Trigonal)
- Band gap range (min/max)
- Formation energy range (min/max)
- Bulk modulus range (min/max)
- Shear modulus range (min/max)
- Thermal conductivity range (min/max)
- Magnetic ordering (ferromagnetic, antiferromagnetic, etc.)
- Has elastic data (boolean)
- Stability (stable/unstable/all)
- Source database (materials_project, aflow)

#### Sorting
Sort by any of 16 properties (ascending/descending):
band_gap, formation_energy, energy_above_hull, density, n_elements, crystal_system, space_group, source_db, external_id, fetched_at, bulk_modulus, shear_modulus, young_modulus, thermal_conductivity, seebeck_coefficient, total_magnetization, dielectric_constant

#### Pagination
20 materials per page, server-side pagination for fast response on 205k+ materials.

### Categories API
`GET /api/v1/materials/categories`

Returns browsable category counts:
- Crystal system distribution
- Source database distribution
- Electronic classification (metals / semiconductors / insulators)
- Property coverage (% with elastic, thermal, magnetic, dielectric, structure data)

### Scatter Plot (`/materials/scatter`)

Interactive property correlation visualizer:
- Plot any 2 of 16 properties against each other
- Color by a third property
- Filter by crystal system
- Hover points to see formula
- Up to 10,000 points rendered as SVG

---

## 9. Analysis & Visualization

### Property Scatter Plot
Available at `/materials/scatter`. Useful for:
- Band gap vs density (find light semiconductors)
- Formation energy vs Ehull (stability landscape)
- Bulk modulus vs Poisson ratio (ductility map)
- Magnetization vs band gap (half-metal search)

### Similar Materials
`GET /api/v1/materials/{id}/similar`

Finds structurally similar materials by:
- Same space group
- Similar band gap (within 20%)
- Same number of elements

### Related Materials
`GET /api/v1/materials/{id}/related`

Broader relatedness by:
- Shared elements
- Same crystal system
- Random sampling for diversity

---

## 10. Data Export & Integration

### Structure File Export
From any material detail page, one-click download:

| Format | File | Use Case |
|--------|------|----------|
| **CIF** | `.cif` | Universal crystallographic format, compatible with all visualization software |
| **POSCAR** | `.vasp` | VASP input file for DFT calculations |
| **XYZ** | `.xyz` | Simple Cartesian coordinates, compatible with most viewers |

### Jupyter Notebook Export
Auto-generated `.ipynb` with pymatgen code to reproduce:
- Material property lookup
- Crystal structure visualization
- Band structure plot
- DOS plot
- XRD pattern simulation

### Campaign Export
CSV and JSON export of campaign results (materials, properties, scores, Pareto front).

### REST API
Full programmatic access to all data and tools. See [API Reference](#12-api-reference).

---

## 11. Materials Discovery Engine (Materia)

### Campaign Workflow

```
materia init water     # Initialize with water treatment template
materia run            # Run active learning campaign
materia results        # Show top Pareto-optimal materials
materia pareto         # Plot Pareto front
materia dashboard      # Launch interactive HTML dashboard
materia export out.csv # Export results
```

### Material Definition Language (YAML)

```yaml
name: water_membrane
domain: water
parameters:
  - name: pore_radius
    range: [0.1, 5.0]
    unit: nm
  - name: membrane_thickness
    range: [1.0, 100.0]
    unit: um
objectives:
  - name: pfos_rejection
    direction: maximize
    equation: water.pfos_rejection
  - name: permeability
    direction: maximize
    equation: water.permeability
constraints:
  - expression: "pore_radius > 0.2"
    description: "Minimum pore size for water flow"
surrogate:
  architecture: mlp
  hidden_layers: [128, 128]
active_learning:
  initial_samples: 50
  samples_per_round: 10
  max_rounds: 15
```

### Plugin System

Domain-specific physics equations packaged as plugins:
- **Water treatment**: PFOS rejection (Donnan-steric pore model), Hagen-Poiseuille permeability
- Extensible: add new domains by creating a `plugins/<domain>/physics.py` file

---

## 12. API Reference

Base URL: `https://api.matcraft.ai/api/v1`

### Materials
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/materials` | Paginated search with 20+ filter params |
| GET | `/materials/stats` | Aggregate statistics (cached 5min) |
| GET | `/materials/categories` | Browse by crystal system, source, classification |
| GET | `/materials/scatter` | Property scatter plot data |
| GET | `/materials/{id}` | Full material detail with normalized data |
| GET | `/materials/{id}/related` | Related materials |
| GET | `/materials/{id}/similar` | Structurally similar materials |
| GET | `/materials/{id}/export/{fmt}` | Download CIF/POSCAR/XYZ |

### Electronic Structure
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/electronic/bandstructure/{mp_id}` | Band structure data |
| GET | `/electronic/dos/{mp_id}` | Density of states |
| GET | `/electronic/xrd/{mp_id}` | Simulated XRD pattern |
| GET | `/electronic/phase_diagram` | Convex hull for element system |
| GET | `/electronic/notebook/{mp_id}` | Jupyter notebook download |

### Structure Builder
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/builder/supercell` | Generate supercell |
| POST | `/builder/surface` | Generate surface slab |
| POST | `/builder/nanoparticle` | Carve nanoparticle |
| POST | `/builder/substitute` | Element substitution |
| POST | `/builder/inverse_design` | AI inverse design |

### Datasets
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/datasets/search` | Search public databases |
| POST | `/datasets/import` | Import into campaign + index |
| POST | `/datasets/ingest` | Admin: bulk ingest from connector |
| POST | `/datasets/ingest/all` | Admin: full background ingestion |

### Campaigns
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/campaigns` | List/create campaigns |
| GET | `/campaigns/{id}` | Campaign details |
| POST | `/campaigns/{id}/run` | Launch campaign execution |
| GET | `/campaigns/{id}/results` | Full results with materials |
| GET | `/campaigns/{id}/export` | Export as CSV/JSON/CIF/POSCAR |
| DELETE | `/campaigns/{id}` | Delete campaign |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users/login` | Email/password auth |
| POST | `/users/register` | New account |
| POST | `/users/oauth/google` | Google OAuth |
| POST | `/users/oauth/firebase` | Firebase auth |
| POST | `/users/guest` | Guest access |
| GET | `/users/me` | Current user profile |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Simple OK check |
| GET | `/health/live` | Liveness probe |
| GET | `/health/full` | DB + Redis + Celery + ingestion status |
| GET | `/info` | API version and metadata |

### Authentication
All authenticated endpoints require:
```
Authorization: Bearer <access_token>
```

Tokens obtained via `/users/login` or OAuth endpoints. Access tokens expire in 8 days, refresh tokens in 30 days.

---

## 13. Data Sources & Citations

### Materials Project
- **API**: https://api.materialsproject.org
- **Website**: https://materialsproject.org
- **Citation**: A. Jain, S.P. Ong, G. Hautier, W. Chen, W.D. Richards, S. Dacek, S. Cholia, D. Gunter, D. Skinner, G. Ceder, K.A. Persson. "Commentary: The Materials Project: A materials genome approach to accelerating materials innovation." APL Materials 1, 011002 (2013). DOI: [10.1063/1.4812323](https://doi.org/10.1063/1.4812323)
- **License**: Creative Commons Attribution 4.0

### AFLOW
- **API**: http://aflowlib.org/API/aflux/
- **Website**: http://aflowlib.org
- **Citation**: S. Curtarolo, W. Setyawan, G.L.W. Hart, M. Jahnatek, R.V. Chepulskii, R.H. Taylor, S. Wang, J. Xue, K. Yang, O. Levy, M.J. Mehl, H.T. Stokes, D.O. Demchenko, D. Morgan. "AFLOW: An automatic framework for high-throughput materials discovery." Computational Materials Science 58, 218-226 (2012). DOI: [10.1016/j.commatsci.2012.02.005](https://doi.org/10.1016/j.commatsci.2012.02.005)

### JARVIS-DFT (NIST)
- **Dataset**: https://jarvis.nist.gov/
- **Citation**: K. Choudhary, K.F. Garrity, A.C.E. Reid, B. DeCost, A.J. Biacchi, A.R.H. Walker, Z. Trautt, J. Hattrick-Simpers, A.G. Kusne, A. Centrone, A. Davydov, J. Jiang, R. Pachter, G. Cheon, E. Reed, A. Agrawal, X. Qian, V. Sharma, H. Zhuang, S.V. Kalinin, B.G. Sumpter, G. Pilania, P. Acar, S. Mandal, K. Haule, D. Vanderbilt, K. Rabe, F. Tavazza. "The joint automated repository for various integrated simulations (JARVIS) for data-driven materials design." npj Computational Materials 6, 173 (2020). DOI: [10.1038/s41524-020-00440-1](https://doi.org/10.1038/s41524-020-00440-1)

---

## 14. Data Quality Pipeline

Every material goes through a multi-stage normalization pipeline before display.

### Stage 1: Ingestion (`ingest_service.py`)
- Parse formula → composition → elements
- Map connector properties to DB columns
- Extract lattice from 3x3 matrix (correct a,b,c,α,β,γ)
- Extract atom positions (Cartesian + fractional)
- Store raw lattice matrix for 3D viewer
- Normalize crystal system names (AFLOW Bravais codes → standard names)
- Stamp versioned ingestion marker

### Stage 2: Lattice Normalization (`lattice_utils.py`)
- Detect primitive vs conventional cell by comparing angles to crystal system
- Convert FCC primitive (α=60°) → conventional (α=90°, a×√2)
- Convert BCC primitive (α≈109.47°) → conventional (α=90°, a×2/√3)
- Convert BCT primitive (a=b=c for tetragonal) → conventional (a=b≠c)
- Convert rhombohedral → hexagonal setting
- Store primitive cell as collapsible sub-section
- Derive viewer lattice from conventional params + space group centering

### Stage 3: Data Quality (`data_quality.py`)
- **Magnetization noise**: values <0.05 µB → 0.0, classified as non-magnetic
- **Magnetic ordering**: >0.5 µB = ferromagnetic, >0.05 µB = paramagnetic, else non-magnetic
- **Tag validation**: remove tags that promise data we don't have (e.g., "thermoelectric" without Seebeck data)
- **Warnings auto-generated**:
  - Ehull > 0.1 eV/atom → instability warning
  - Theoretical structure → provenance warning
  - GGA functional → band gap underestimation caveat
  - Lattice angle inconsistency → primitive cell warning

### Stage 4: API Response Normalization
- Apply lattice normalization on-the-fly for old data
- Apply data quality normalization
- Strip internal fields (`_matcraft_*` markers)
- Include `viewer_lattice` (primitive lattice for 3D viewer)

---

## 15. Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend   │────▶│   API Server │────▶│  PostgreSQL  │
│  (Next.js)   │     │  (FastAPI)   │     │  (Cloud SQL) │
│  Cloud Run   │     │  Cloud Run   │     │              │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                    ┌──────▼───────┐     ┌─────────────┐
                    │    Worker     │────▶│    Redis     │
                    │  (Celery)    │     │  (Memorystore)│
                    │  Cloud Run   │     └─────────────┘
                    └──────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │Materials │ │  AFLOW   │ │  JARVIS  │
        │ Project  │ │  API     │ │  (GCS)   │
        │  API     │ │          │ │          │
        └──────────┘ └──────────┘ └──────────┘
```

### Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+, React, TypeScript, Tailwind CSS, React Three Fiber |
| API | FastAPI, Python 3.12, Pydantic v2, SQLAlchemy 2.0 |
| Database | PostgreSQL (Cloud SQL) |
| Cache | Redis (Memorystore) |
| Task Queue | Celery with Redis broker |
| Hosting | Google Cloud Run (3 services: API, Worker, Frontend) |
| CI/CD | GitHub Actions (auto-deploy on push to main, production on v* tags) |
| Container | Docker multi-stage builds (Python 3.12 slim, Node 22 alpine) |

---

## 16. Deployment & Infrastructure

### CI/CD Pipeline
- **Push to `main`** → staging deploy (build + push + deploy all 3 services)
- **Push `v*` tag** → production deploy
- **GitHub Actions** builds Docker images, pushes to Artifact Registry, deploys to Cloud Run

### Cloud Run Configuration
| Service | Memory | CPU | Min Instances | Max Instances | Timeout |
|---------|--------|-----|---------------|---------------|---------|
| API | 2 GiB | 1 | 0 | 10 | 600s |
| Worker | 4 GiB | 2 | 1 | 5 | 3600s |
| Frontend | 512 MiB | 1 | 0 | 5 | 300s |

### Database
- PostgreSQL via Cloud SQL (matforge-db)
- Connected via Unix socket through VPC connector
- Auto-column creation on startup via `_add_missing_columns()`
- Connection pooling: QueuePool with size 20, overflow 10

### Data Ingestion
- **On startup**: health check triggers `ensure_real_data()`
- **Quick phase**: 100 materials per source (blocking, ~30s)
- **Background**: Celery task paginates all APIs (~4-6 hours for 280k)
- **Versioned markers**: bumping `_INGEST_VERSION` forces full re-ingestion
- **Upsert logic**: duplicate external_ids update instead of crash
- **Rate limiting**: 1 req/sec for MP, 2s delay for AFLOW

---

## 17. Security

### Authentication
- JWT tokens (HS256) with access (8 days) + refresh (30 days)
- Firebase Auth integration (Google, phone)
- Guest account for quick testing
- Admin role for ingestion endpoints

### Expression Evaluation
- **No `eval()`/`exec()`** — replaced with AST-whitelisted `safe_eval`
- Only arithmetic, comparisons, boolean logic, and explicit function allowlist
- Blocks: imports, dunder access, lambdas, comprehensions

### API Security
- Rate limiting: 120 req/min per IP (Redis primary, in-memory fallback)
- Security headers: X-Content-Type-Options, X-Frame-Options, Permissions-Policy
- CORS: restricted to `matcraft.ai`
- Request ID tracing on every request
- Global exception handler (never leaks stack traces)
- Startup config validation (SECRET_KEY must differ from default in production)

### Data Protection
- Internal pipeline fields (`_matcraft_*`) stripped at API boundary
- No user data in properties_json
- Bcrypt password hashing

---

## 18. Domain-Specific Applications

### Battery Materials
- Search: Li-containing oxides with stable Ehull
- Screen: formation energy, voltage window (from band gap)
- Application score: "Battery Cathode" auto-computed

### Solar Cell Absorbers
- Search: band gap 1.1-1.5 eV, direct gap, stable
- Screen: Shockley-Queisser efficiency from band gap
- Application score: "Solar Absorber" with optimal range annotation

### Catalysts
- Search: transition metal compounds (Fe, Co, Ni, Pt, Pd, Ru, Ir, Rh)
- Screen: stability, electronic structure (metallic preferred)
- Application score: "Catalyst Candidate"

### Thermoelectric Materials
- Search: narrow gap semiconductors with Seebeck data
- Screen: Seebeck coefficient, thermal conductivity
- Application score: "Thermoelectric"

### Hard Coatings
- Search: high bulk modulus (>200 GPa)
- Screen: elastic anisotropy, fracture toughness (from K/G ratio)
- Application score: "Hard Coating"

### Structural Materials
- Search: by mechanical properties (Young's modulus, Poisson ratio)
- Screen: ductile (high Poisson) vs brittle (low Poisson)
- Compare: multiple candidates side by side

---

## 19. SDK & Programmatic Access

### Python SDK
```python
# pip install matforge-sdk

from matforge_sdk import MatForgeClient

client = MatForgeClient(api_key="your-key")

# Search materials
results = client.materials.search(
    elements=["Li", "Fe", "O"],
    band_gap_max=3.0,
    is_stable=True,
    limit=100,
)

# Get material detail
material = client.materials.get("mp-149")
print(material.formula, material.band_gap, material.bulk_modulus)

# Export structure
client.materials.export("mp-149", format="poscar", path="Si.vasp")

# Inverse design
candidates = client.builder.inverse_design(
    target_band_gap=1.4,
    required_elements=["Si"],
    excluded_elements=["Pb", "Cd"],
)
```

### REST API
All endpoints documented at `/api/v1/docs` (OpenAPI/Swagger).

### Jupyter Integration
Download auto-generated notebooks from any material page.

---

## 20. Shipped Features (v0.3.0)

### Data & Ingestion
- [x] 205,000+ real materials from Materials Project (~155k) + AFLOW (~50k)
- [x] 30+ properties per material (thermodynamic, mechanical, electronic, magnetic, thermal, provenance)
- [x] Automated background ingestion via Celery (paginates all APIs, rate-limited)
- [x] Versioned ingestion markers — bump version to force full re-ingestion
- [x] Upsert logic — duplicate external_ids update instead of crash
- [x] JARVIS dataset downloaded to GCS bucket (Figshare blocks Cloud Run)
- [x] Crystal system normalization (AFLOW Bravais codes → standard names: fcc→Cubic, etc.)
- [x] Stability detection from Ehull (≤0.025 eV/atom) or formation energy fallback

### Material Detail Page
- [x] Header: formula, stability badge, crystal system, space group, source, atom count
- [x] Scientific warnings (theoretical structure, DFT band gap underestimation, instability)
- [x] Provenance badges (DFT method, Theoretical/Experimental, magnetic ordering, direct/indirect gap)
- [x] Experimental validation (ICSD IDs in green box when structure is experimentally verified)
- [x] Decomposition pathway (competing phases as red badges for unstable materials)
- [x] Property tables grouped by category with hover tooltips (17 properties with descriptions + typical ranges)
- [x] Application suitability scores (Solar, LED, Thermoelectric, Semiconductor, Hard Coating, Battery, Catalyst)
- [x] Composition as percentages (50.0%, 25.0%, 25.0%)
- [x] Lattice parameters with conventional cell label + collapsible primitive cell
- [x] Oxidation states display
- [x] Data source & citation with DOIs (Materials Project, AFLOW)
- [x] Copy Citation button (one-click clipboard copy with material ID + DOI + access date)
- [x] Cross-reference IDs to other databases
- [x] Download buttons: CIF, POSCAR, XYZ, Jupyter notebook
- [x] Quick stats cards (Band Gap, Formation Energy, Ehull)
- [x] Related materials (12 by shared elements/crystal system)
- [x] Fermi energy displayed in electronic properties
- [x] Material-specific SEO keywords (formula, elements, space group, crystal system)
- [x] JSON-LD structured data with property values (band gap, density, crystal system)
- [x] Page title: "Ac₂SiHg — Cubic Fm-3m | MatCraft"

### 3D Crystal Structure Viewer
- [x] React Three Fiber WebGL rendering with CPK element coloring (70+ elements)
- [x] Adaptive bond detection (min pairwise distance × 1.3, covers covalent ~1.5Å to metallic ~4.5Å)
- [x] Unit cell wireframe from raw 3x3 lattice matrix (12 edges)
- [x] 2x2x2 supercell expansion for primitive cells with <8 atoms
- [x] Orbit controls (rotate, zoom, pan) + auto-rotation
- [x] Raw lattice matrix stored at ingestion — atoms and box in same coordinate frame

### Search & Discovery
- [x] Paginated search with 20+ filter parameters
- [x] Text search (formula, elements, external ID)
- [x] Filters: crystal system, band gap range, formation energy range, bulk/shear modulus range, thermal conductivity range, magnetic ordering, has elastic data, stability, source database
- [x] Sort by 16 properties (ascending/descending)
- [x] Categories API (crystal system distribution, electronic classification, property coverage)
- [x] Interactive scatter plot page (/materials/scatter) — any 2 of 16 properties, color by third, filter by crystal system
- [x] Similar materials API (same space group + similar band gap + same n_elements)
- [x] Stats endpoint with Redis caching (5-minute TTL)

### Electronic Structure & Computational APIs
- [x] Band structure API (`GET /electronic/bandstructure/{mp_id}`) — via mp-api, returns plottable JSON
- [x] Density of States API (`GET /electronic/dos/{mp_id}`) — total + element-projected
- [x] XRD pattern simulator (`GET /electronic/xrd/{mp_id}`) — pymatgen XRDCalculator, configurable wavelength
- [x] Phase diagram API (`GET /electronic/phase_diagram?elements=Li,Fe,O`) — convex hull, 2-4 elements
- [x] Jupyter notebook generator (`GET /electronic/notebook/{mp_id}`) — auto-generated .ipynb

### Structure Builder APIs
- [x] Supercell generator (`POST /builder/supercell`) — NxMxL from any MP material
- [x] Surface/slab builder (`POST /builder/surface`) — Miller index, slab thickness, vacuum
- [x] Nanoparticle carver (`POST /builder/nanoparticle`) — spherical, configurable radius
- [x] Element substitution (`POST /builder/substitute`) — full or partial
- [x] AI inverse design (`POST /builder/inverse_design`) — target properties → ranked candidates

### Materials Discovery Engine (Materia)
- [x] Active learning loop: Latin Hypercube Sampling → surrogate training → CMA-ES optimization → evaluation
- [x] Surrogate models: NumPy MLP (MC Dropout), ONNX, CHGNet, MACE
- [x] Acquisition functions: MaxUncertainty, ExpectedImprovement, WeightedUCB
- [x] Pareto front computation (NSGA-II + crowding distance)
- [x] CLI: `materia init`, `run`, `results`, `pareto`, `dashboard`, `export`, `suggest`
- [x] Plugin system (water treatment domain with PFOS rejection + permeability physics)

### Security
- [x] Safe expression evaluator (AST-whitelisted, replaces eval/exec)
- [x] Rate limiting with in-memory fallback when Redis unavailable
- [x] Request ID tracing + structured logging on every request
- [x] Global exception handler (never leaks stack traces)
- [x] Startup config validation (SECRET_KEY enforcement in production)
- [x] Security headers (X-Content-Type-Options, X-Frame-Options, Permissions-Policy, Cache-Control)
- [x] Internal pipeline fields stripped at API boundary (_matcraft_* markers)

### Testing
- [x] 69 backend tests (24 safe_eval + 45 API: users, campaigns, templates, health, middleware)
- [x] 15 lattice conversion tests
- [x] 107 core engine tests (active learning, CLI, connectors, MLP, CMA-ES, Pareto, plugins)

### Infrastructure
- [x] Auto-deploy on push to main (staging) and v* tags (production) via GitHub Actions
- [x] Docker multi-stage builds (Python 3.12 slim, Node 22 alpine)
- [x] Cloud Run: API (2GiB), Worker (4GiB), Frontend (512MiB)
- [x] Cloud SQL (PostgreSQL) via VPC connector + Unix socket
- [x] Redis (Memorystore) for caching + Celery task broker
- [x] Auto-column creation on startup (ALTER TABLE for new ORM columns)
- [x] Firebase auth with graceful degradation when appId missing

---

## 21. Known Issues & Remaining Work

### Bugs (confirmed, fixes in progress)

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | BCT tetragonal lattice shows a=b=c instead of a=b≠c for I4/mmm space groups | Critical | Fix deployed, needs re-ingestion to propagate |
| 2 | AFLOW entries show `--` for formation energy and Ehull with no explanation | Medium | Needs tooltip: "Not available — AFLOW does not provide this property" |
| 3 | Mechanical properties (bulk/shear/Young's modulus) inconsistently shown — present for some MP materials but absent for others with the data | Medium | PropertyTable hides null rows correctly; coverage is ~10% of MP |
| 4 | 3D viewer bonds absent for some metallic compounds | Medium | Adaptive threshold deployed; re-ingestion needed for lattice_matrix |
| 5 | Decomposition pathway not rendering for all unstable materials | Low | `decomposes_to` field populated by MP but frontend section only shows when non-empty |

### Features — Remaining (ordered by difficulty)

#### Trivial (one-liners)
| # | Feature | Description |
|---|---------|-------------|
| 1 | AFLOW `--` tooltip | Show "Not available — AFLOW does not provide this property" on hover when values are null |
| 2 | AFLOW formation energy fallback | Derive from total energy + elemental references when available, or show clear "N/A" badge |

#### Small (frontend, data already exists)
| # | Feature | Description |
|---|---------|-------------|
| 3 | Effective mass display | Add electron/hole effective mass rows to Electronic table (schema exists, data sparse) |
| 4 | JARVIS flat file ingestion | Dataset downloaded to GCS; ingestion task coded but `jarvis-tools` fails in Docker. Alternative: read JSON directly from GCS (code exists, needs testing) |

#### Medium (new UI components)
| # | Feature | Description |
|---|---------|-------------|
| 5 | Dark mode | Tailwind `dark:` variants, root class toggle, theme persistence in localStorage |
| 6 | Primitive/conventional cell toggle | Button above lattice params swapping between conventional and primitive (both stored) |
| 7 | Interactive band structure chart | Frontend component using Recharts/D3 — API returns plottable JSON, zero backend work |
| 8 | Interactive DOS chart | Horizontal bar chart alongside band structure — API ready |
| 9 | Interactive phase diagram | Binary/ternary diagram from convex hull API — D3 for ternary geometry |
| 10 | Mobile 3D viewer optimization | Touch event handlers for React Three Fiber OrbitControls, reduced atom/bond sizes on small screens |

#### Large (significant new features)
| # | Feature | Description |
|---|---------|-------------|
| 11 | 3D structure builder UI | Browser UI for supercell/surface/nanoparticle/substitution builders (APIs all working) |
| 12 | Natural language search | LLM parses "stable semiconductor for solar cells with no lead" → API filter params |
| 13 | Materials co-pilot chat | Chat sidebar with material context loaded, LLM answers using real property data |
| 14 | Multi-material comparator | Select 2-5 materials, side-by-side comparison table + radar chart + 3D viewers |
| 15 | OQMD integration | 1M+ entries from oqmd.org REST API. Deduplication against MP entries needed |

#### Future (v1.0+)
| # | Feature | Description |
|---|---------|-------------|
| 16 | 2D materials database | C2DB, JARVIS-2D: graphene, MoS₂, h-BN, 5000+ 2D materials |
| 17 | Foundation model integration | GNoME (Google), MACE-MP, CHGNet for property prediction |
| 18 | VR/AR crystal viewer | WebXR mode for immersive structure exploration |
| 19 | Patent landscape connector | Link materials to patents mentioning them |
| 20 | Community annotations | User notes, data quality flags, corrections |
| 21 | Enterprise SSO/SAML | University/corporate single sign-on |
| 22 | On-premise deployment | Docker + Kubernetes package for air-gapped environments |

---

## License

MIT License. Data from Materials Project and AFLOW is used under their respective licenses (CC-BY-4.0).

---

*Built with Claude Code. Powered by Materials Project, AFLOW, and JARVIS-DFT.*
*Platform: [matcraft.ai](https://matcraft.ai) | Repository: [github.com/BrosG/matforge](https://github.com/BrosG/matforge)*
