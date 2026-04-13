import { FaqItem } from "./index";

const faqs: FaqItem[] = [
  {
    slug: "what-data-sources",
    question: "What data sources does MatCraft use?",
    answer: `MatCraft aggregates materials data from three major open databases:

## Materials Project (MP)

The largest source in MatCraft, providing ~150,000 materials computed with DFT using the PBE functional with Hubbard U corrections for transition metals. MP data includes crystal structures, formation energies, band gaps, elastic properties, and electronic structure (band structure and DOS).

## AFLOW

The Automatic FLOW repository contributes ~60,000 additional materials. AFLOW uses similar DFT methods (PBE) but with different pseudopotentials and convergence settings. AFLOW provides thermodynamic, electronic, and mechanical properties.

## JARVIS-DFT

The Joint Automated Repository for Various Integrated Simulations adds ~40,000 materials computed with the OptB88vdW functional, which better captures van der Waals interactions. JARVIS data includes band gaps (both OPT and MBJ functionals), elastic constants, and solar efficiency estimates.

Each material in MatCraft is tagged with its source so you can filter by database when comparing properties.`,
    category: "data-sources",
    order: 0,
    relatedSlugs: ["data-freshness", "data-accuracy"],
    tags: ["data", "sources", "mp", "aflow", "jarvis"],
  },
  {
    slug: "data-freshness",
    question: "How often is the materials data updated?",
    answer: `MatCraft refreshes its database on a quarterly basis, synchronizing with the latest releases from each data source:

- **Materials Project**: Updated when MP releases new database versions (approximately every 3-6 months)
- **AFLOW**: Updated when new AFLOW releases are published
- **JARVIS**: Updated with each new JARVIS-DFT release

The "last updated" date is shown on each material's detail page. You can also check the database version on the About page.

For the most current data, you can always query the upstream databases directly. MatCraft provides links to the original source page for each material.`,
    category: "data-sources",
    order: 1,
    relatedSlugs: ["what-data-sources", "data-accuracy"],
    tags: ["data", "freshness", "updates"],
  },
  {
    slug: "data-accuracy",
    question: "How accurate are the computed material properties?",
    answer: `The accuracy depends on the property and the computational method used:

## Band Gaps

DFT band gaps calculated with GGA (PBE) functionals systematically underestimate experimental values by 30-50%. For example, silicon's computed gap is typically 0.6 eV vs. the experimental 1.12 eV. JARVIS provides MBJ-corrected band gaps that are more accurate for many materials.

## Formation Energies

GGA formation energies are generally accurate to within 0.1-0.2 eV/atom for most inorganic compounds. The Materials Project applies energy corrections for certain elements (O, S, N) and oxidation states.

## Energy Above Hull (Ehull)

This is a relative quantity and benefits from error cancellation. Ehull values < 0.025 eV/atom reliably indicate thermodynamically stable phases. The error in Ehull is typically 0.02-0.05 eV/atom.

## Crystal Structures

Computed lattice parameters are typically within 1-3% of experimental values for GGA calculations. Interatomic distances are reliable for most bonding environments.

## General Advice

Use computed properties for screening and trend identification rather than precise quantitative predictions. Always validate top candidates with higher-level calculations (HSE06, GW) or experimental measurements.`,
    category: "data-sources",
    order: 2,
    relatedSlugs: ["what-data-sources", "dft-methods"],
    tags: ["accuracy", "dft", "band-gap", "reliability"],
  },
  {
    slug: "cross-database-duplicates",
    question: "Are there duplicate materials across databases?",
    answer: `Yes, many materials appear in multiple databases (MP, AFLOW, JARVIS) since they compute overlapping sets of structures. MatCraft does not deduplicate these entries because:

1. **Different methods**: Each database uses different DFT settings (functionals, pseudopotentials, convergence criteria), so property values differ
2. **Useful for comparison**: Seeing the same material from multiple sources lets you assess the sensitivity of computed properties to methodology
3. **Different properties**: Some properties are only available from specific databases

When searching, you can filter by data source to see results from a single database. The material detail page shows the data source badge and links to the original database entry.`,
    category: "data-sources",
    order: 3,
    relatedSlugs: ["what-data-sources", "data-accuracy"],
    tags: ["duplicates", "databases", "comparison"],
  },
  {
    slug: "missing-properties",
    question: "Why are some properties missing for certain materials?",
    answer: `Not all properties are computed for every material in the database. Common reasons:

- **Band structure / DOS**: Only available for materials with electronic structure calculations in Materials Project. AFLOW and JARVIS materials may not have these.
- **Elastic properties**: Require separate elastic constant calculations that have not been performed for all materials.
- **Band gap = 0**: Metals have zero band gap by definition; this is a real value, not missing data.
- **Phase diagrams**: Require all competing phases in the chemical system to be computed, which may not be complete for exotic element combinations.

Missing values are displayed as "--" or "N/A" in the interface. In the API, missing fields are either absent from the JSON response or set to null.`,
    category: "data-sources",
    order: 4,
    relatedSlugs: ["data-accuracy", "what-data-sources"],
    tags: ["missing", "properties", "availability"],
  },
  {
    slug: "can-i-add-data",
    question: "Can I upload my own materials data to MatCraft?",
    answer: `Currently, MatCraft serves as a read-only aggregator of public materials databases. You cannot upload custom materials to the shared database.

However, for the optimization campaign workflow, you can:

1. **Import seed data**: Upload CSV or JSON files with your experimental measurements as starting data for optimization campaigns
2. **Custom evaluations**: Use the Python SDK to wrap your own simulation codes or experimental workflows as evaluation backends

For self-hosted deployments, you have full control over the database and can add custom materials to your local instance.

We are exploring a community contribution feature for a future release that would allow vetted users to submit validated data.`,
    category: "data-sources",
    order: 5,
    relatedSlugs: ["what-data-sources"],
    tags: ["upload", "custom-data", "contribution"],
  },
  {
    slug: "data-licensing",
    question: "What are the licensing terms for the materials data?",
    answer: `Each data source has its own license:

- **Materials Project**: Creative Commons Attribution 4.0 (CC BY 4.0). You may use, share, and adapt the data with proper attribution.
- **AFLOW**: Available under a permissive academic license. See aflowlib.org for terms.
- **JARVIS**: Public domain, distributed by NIST. No restrictions on use.

MatCraft aggregates and presents this data but does not claim ownership. When using data from MatCraft in publications, please cite both MatCraft and the original data source(s). Citation information is provided on each material's detail page.`,
    category: "data-sources",
    order: 6,
    relatedSlugs: ["what-data-sources"],
    tags: ["licensing", "citation", "attribution"],
  },
  {
    slug: "total-materials-count",
    question: "How many materials are in the MatCraft database?",
    answer: `MatCraft currently contains over 205,000 materials:

- **Materials Project**: ~150,000 materials
- **AFLOW**: ~60,000 materials (some overlap with MP)
- **JARVIS-DFT**: ~40,000 materials (some overlap with MP)

The total unique chemical compositions number approximately 180,000 after accounting for cross-database overlap. The database grows with each quarterly update as the upstream sources add new calculations.

You can see the current count and breakdown on the MatCraft dashboard.`,
    category: "data-sources",
    order: 7,
    relatedSlugs: ["what-data-sources", "data-freshness"],
    tags: ["count", "database-size", "statistics"],
  },
  {
    slug: "experimental-vs-computed",
    question: "Does MatCraft include experimental data?",
    answer: `MatCraft primarily contains computationally predicted (DFT) properties, not experimental measurements. This is because:

1. Computational data is systematic and covers a much larger chemical space
2. DFT calculations provide a consistent set of properties for every material
3. Experimental data is scattered across literature and difficult to aggregate uniformly

However, some experimental context is available:

- ICSD (Inorganic Crystal Structure Database) structures are used as starting points for many DFT calculations
- The Materials Project validates key materials against experimental data
- JARVIS includes comparison with available experimental band gaps

For experimental properties, we recommend complementary databases like the NIST Materials Data Repository, Springer Materials, or Citrine Informatics.`,
    category: "data-sources",
    order: 8,
    relatedSlugs: ["data-accuracy", "what-data-sources"],
    tags: ["experimental", "computed", "dft"],
  },
  {
    slug: "data-citation",
    question: "How should I cite MatCraft data in publications?",
    answer: `When using MatCraft data in academic publications, please cite both MatCraft and the original data source(s).

## Citing MatCraft

Include the MatCraft URL and access date:

> Materials data retrieved from MatCraft (https://matcraft.ai), accessed [date].

## Citing Original Sources

Each material's detail page shows which database it comes from. Cite the appropriate source:

- **Materials Project**: A. Jain et al., "Commentary: The Materials Project: A materials genome approach to accelerating materials innovation," APL Materials 1, 011002 (2013).
- **AFLOW**: S. Curtarolo et al., "AFLOW: An automatic framework for high-throughput materials discovery," Computational Materials Science 58, 218-226 (2012).
- **JARVIS-DFT**: K. Choudhary et al., "The joint automated repository for various integrated simulations (JARVIS) for data-driven materials design," npj Computational Materials 6, 173 (2020).

## Per-Material Citation

Click the "Cite" button on any material detail page to copy a formatted citation that includes the material ID, data source, and access date.`,
    category: "data-sources",
    order: 9,
    relatedSlugs: ["data-licensing", "what-data-sources"],
    tags: ["citation", "publication", "attribution"],
  },
];

export default faqs;
