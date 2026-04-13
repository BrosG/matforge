import { FaqItem } from "./index";

const faqs: FaqItem[] = [
  {
    slug: "what-is-band-gap",
    question: "What is band gap and why does it matter?",
    answer: `The band gap is the energy difference (in electron volts, eV) between the highest occupied electronic state and the lowest unoccupied state in a solid material.

## Why It Matters

The band gap determines a material's fundamental electronic behavior:

- **Zero band gap (metals)**: Electrons flow freely, making the material a conductor (e.g., copper, iron)
- **Small band gap (0.1-1.5 eV)**: Semiconductor behavior; used in transistors, solar cells, infrared detectors
- **Medium band gap (1.5-3.5 eV)**: Wider semiconductors for LEDs, power electronics, visible-light photodetectors
- **Large band gap (> 3.5 eV)**: Insulators and ultrawide-gap semiconductors for high-voltage devices, UV optics

## For Solar Cells

The optimal band gap for a single-junction solar cell is approximately 1.34 eV (the Shockley-Queisser limit). Materials with band gaps of 1.0-1.8 eV are prime candidates for photovoltaic absorbers.

## DFT Caveat

Band gaps computed with standard DFT (GGA/PBE) are systematically underestimated by 30-50%. Use them for relative comparisons and screening, not as absolute values.`,
    category: "properties",
    order: 0,
    relatedSlugs: ["direct-vs-indirect-gap", "what-is-formation-energy"],
    tags: ["band-gap", "electronic", "semiconductor"],
  },
  {
    slug: "direct-vs-indirect-gap",
    question: "What is the difference between a direct and indirect band gap?",
    answer: `In a direct band gap material, the valence band maximum (VBM) and conduction band minimum (CBM) occur at the same point in reciprocal space (the same k-vector). In an indirect band gap material, the VBM and CBM are at different k-points.

## Practical Implications

- **Direct gap materials** (GaAs, CdTe, halide perovskites): Efficient light absorption and emission. Preferred for LEDs, lasers, and solar cells because photons can directly excite electrons across the gap.
- **Indirect gap materials** (Si, Ge, diamond): Weaker optical absorption near the band edge because a phonon (lattice vibration) is needed to conserve crystal momentum. Silicon solar cells work despite this, but require thicker absorber layers (~200 um vs. ~1 um for direct-gap materials).

## How to Check

MatCraft displays "Direct" or "Indirect" on each material's detail page. In the band structure plot, a direct gap shows VBM and CBM at the same k-point, while an indirect gap shows them at different positions along the k-path.`,
    category: "properties",
    order: 1,
    relatedSlugs: ["what-is-band-gap", "how-to-read-band-structure"],
    tags: ["band-gap", "direct", "indirect", "optical"],
  },
  {
    slug: "what-is-formation-energy",
    question: "What is formation energy?",
    answer: `Formation energy (in eV/atom) is the energy change when a compound is formed from its constituent elements in their standard states (e.g., metallic iron, O2 gas, graphite for carbon).

## Interpretation

- **Negative formation energy**: The compound is more stable than the separated elements. Most known stable compounds have negative formation energy.
- **More negative = more stable**: A formation energy of -3.0 eV/atom indicates a stronger thermodynamic driving force than -1.0 eV/atom.
- **Positive formation energy**: The compound is energetically unfavorable relative to the elements, though it may still exist as a metastable phase.

## Relation to Energy Above Hull

Formation energy alone does not tell you if a compound is the most stable phase at its composition. The energy above hull (Ehull) compares against ALL known competing phases, making it a better stability indicator. A material can have a very negative formation energy but still be above the hull if a more stable phase exists at the same composition.`,
    category: "properties",
    order: 2,
    relatedSlugs: ["what-is-ehull", "what-is-band-gap"],
    tags: ["formation-energy", "thermodynamics", "stability"],
  },
  {
    slug: "what-is-ehull",
    question: "What is energy above hull (Ehull)?",
    answer: `Energy above hull (Ehull, in eV/atom) measures how far a material is from the thermodynamic convex hull -- the set of most stable phases at each composition in a chemical system.

## Interpretation

- **Ehull = 0**: The material is on the convex hull and is a thermodynamically stable phase
- **Ehull < 0.025 eV/atom**: Very close to stable; likely synthesizable or may exist as a metastable phase
- **Ehull = 0.025 - 0.100 eV/atom**: Moderately metastable; may be accessible under specific synthesis conditions
- **Ehull > 0.100 eV/atom**: Significantly unstable; unlikely to be synthesized in bulk equilibrium conditions

## Why It Matters

Ehull is the single most important stability metric in computational materials science. Screening for Ehull < 0.05 eV/atom is a standard first filter when searching for synthesizable candidate materials.

## How It Is Computed

The convex hull is constructed from formation energies of all known phases in a chemical system. Ehull is the energy difference between a material and the hull at its composition. The Materials Project computes this using the full database of known phases.`,
    category: "properties",
    order: 3,
    relatedSlugs: ["what-is-formation-energy", "what-is-band-gap"],
    tags: ["ehull", "stability", "convex-hull", "thermodynamics"],
  },
  {
    slug: "what-is-space-group",
    question: "What are space groups and crystal systems?",
    answer: `Space groups classify the complete symmetry of a crystal structure, including translations, rotations, reflections, glide planes, and screw axes. There are 230 unique space groups.

## Crystal Systems

The 230 space groups are organized into 7 crystal systems based on unit cell geometry:

| System | Cell Shape | Example |
|--------|-----------|---------|
| Cubic | a=b=c, all right angles | NaCl (Fm-3m), Si (Fd-3m) |
| Hexagonal | a=b, gamma=120 | ZnO (P6_3mc) |
| Tetragonal | a=b, all right angles | TiO2 rutile (P4_2/mnm) |
| Orthorhombic | All right angles | Many perovskites |
| Monoclinic | One non-right angle | Common in minerals |
| Triclinic | No angle constraints | Least symmetric |
| Trigonal | a=b=c, equal angles | Quartz (P3_121) |

## Why It Matters

Symmetry determines many material properties:
- **Optical**: Cubic materials are optically isotropic
- **Piezoelectric**: Requires non-centrosymmetric space group
- **Elastic**: Higher symmetry means fewer independent elastic constants
- **Electronic**: Band structure topology is constrained by symmetry`,
    category: "properties",
    order: 4,
    relatedSlugs: ["what-is-band-gap"],
    tags: ["space-group", "crystal-system", "symmetry"],
  },
  {
    slug: "what-units-are-used",
    question: "What units does MatCraft use for material properties?",
    answer: `MatCraft uses standard units from computational materials science:

| Property | Unit | Notes |
|----------|------|-------|
| Band gap | eV (electron volts) | 1 eV = 1.602 x 10^-19 J |
| Formation energy | eV/atom | Energy per atom |
| Energy above hull | eV/atom | Stability metric |
| Density | g/cm3 | Mass density |
| Volume | A3 (cubic Angstroms) | Unit cell volume; 1 A = 10^-10 m |
| Lattice parameters | A (Angstroms) | a, b, c lengths |
| Lattice angles | degrees | alpha, beta, gamma |
| Bulk modulus | GPa | Resistance to compression |
| Elastic constants | GPa | Stiffness tensor components |

All energies are referenced to 0 K (zero Kelvin) and zero pressure unless otherwise noted. DFT calculations are performed at the athermal limit (T=0 with no zero-point energy).`,
    category: "properties",
    order: 5,
    relatedSlugs: ["what-is-band-gap", "what-is-formation-energy"],
    tags: ["units", "conventions"],
  },
  {
    slug: "what-are-application-scores",
    question: "How are the application suitability scores calculated?",
    answer: `Application suitability scores (0-100) are heuristic estimates of how well a material might perform for a specific engineering application. They are NOT definitive predictions.

## Methodology

Each application has a scoring function that:

1. Checks hard requirements (e.g., solar absorbers must have band gap > 0.5 eV)
2. Computes a weighted distance from ideal property values
3. Normalizes to a 0-100 scale

## Example: Solar Score

The solar absorber score considers:
- Band gap proximity to 1.34 eV (Shockley-Queisser optimum): 50% weight
- Direct vs. indirect gap bonus: 20% weight
- Thermodynamic stability (low Ehull): 20% weight
- Light element preference (lower density): 10% weight

## Limitations

- Based only on bulk computed properties
- Does not account for defect chemistry, surfaces, or interfaces
- Does not consider synthesis feasibility, cost, or toxicity
- Scores are relative rankings, not absolute performance predictions

Use scores for initial screening, then validate with detailed calculations or experiments.`,
    category: "properties",
    order: 6,
    relatedSlugs: ["what-is-band-gap", "what-is-ehull"],
    tags: ["application-scores", "suitability", "screening"],
  },
  {
    slug: "negative-band-gap",
    question: "Why do some materials show a band gap of 0 eV?",
    answer: `A band gap of 0 eV means the material is metallic -- it has no energy gap between occupied and unoccupied electronic states. This is a real physical result, not an error.

## Common Cases

- **Pure metals**: Fe, Cu, Al, Au all have zero band gap
- **Metallic compounds**: Many transition metal borides, carbides, and nitrides are metallic
- **Semimetals**: Materials like Bi or graphite have zero or near-zero gaps with very low DOS at the Fermi level
- **Heavily doped semiconductors**: May appear metallic in DFT calculations

## DFT Artifacts

In rare cases, GGA/PBE calculations may incorrectly predict a zero band gap for materials that are experimentally semiconducting. This happens most often for:
- Strongly correlated systems (rare earth compounds, Mott insulators)
- Materials where GGA+U corrections are needed but not applied
- Very small gap materials where the calculated gap falls below numerical noise

If you expect a non-zero gap but see 0 eV, check if the material has known strong correlation effects.`,
    category: "properties",
    order: 7,
    relatedSlugs: ["what-is-band-gap", "data-accuracy"],
    tags: ["band-gap", "metal", "zero-gap"],
  },
  {
    slug: "bulk-modulus-meaning",
    question: "What do bulk modulus and elastic properties tell me?",
    answer: `Elastic properties describe how a material responds to mechanical stress:

## Bulk Modulus (K)

Resistance to uniform compression. Higher K means the material is harder to compress.
- Diamond: ~440 GPa (extremely incompressible)
- Steel: ~160 GPa
- Lead: ~46 GPa (easily compressed)

## Shear Modulus (G)

Resistance to shape change. Higher G means more rigid.

## Young's Modulus (E)

Resistance to stretching/compression along one axis. The most commonly reported mechanical property.

## Poisson's Ratio (v)

How much a material expands laterally when compressed. Ranges from -1 to 0.5:
- ~0.3: Typical for metals
- ~0.2: Ceramics
- < 0: Auxetic materials (rare, expand laterally when compressed)

## Pugh's Ratio (K/G)

Predicts ductile vs. brittle behavior:
- K/G > 1.75: Ductile (metals)
- K/G < 1.75: Brittle (ceramics)

Note: Elastic properties are not available for all materials in the database. They require separate elastic constant calculations beyond standard structure relaxation.`,
    category: "properties",
    order: 8,
    relatedSlugs: ["what-units-are-used"],
    tags: ["elastic", "mechanical", "bulk-modulus"],
  },
  {
    slug: "what-is-dielectric-constant",
    question: "What is the dielectric constant and when is it useful?",
    answer: `The dielectric constant (relative permittivity) measures how strongly a material polarizes in response to an applied electric field. It is a dimensionless number relative to vacuum permittivity.

## Interpretation

- **Low dielectric constant (1-5)**: Weak polarization. Materials like SiO2 (3.9) and diamond (5.7) are used as insulators and low-k dielectrics in microelectronics.
- **Medium dielectric constant (5-50)**: Moderate response. Common in optical materials and some ceramics.
- **High dielectric constant (50-1000+)**: Strong polarization. Materials like BaTiO3 (>1000) and SrTiO3 (~300) are used in capacitors, energy storage, and ferroelectric devices.

## Static vs. Optical

MatCraft may report two types:
- **Static (ionic + electronic)**: The full dielectric response including ionic relaxation. Relevant for DC applications and capacitors.
- **Optical (electronic only)**: The high-frequency response. Related to the refractive index by n = sqrt(epsilon_optical).

## Applications

- **Capacitors**: High dielectric constant materials store more energy per unit volume
- **Gate insulators**: Need moderate dielectric constant with high breakdown field
- **Low-k interconnects**: Low dielectric constant reduces parasitic capacitance in integrated circuits
- **Optical coatings**: Dielectric constant determines refractive index for antireflection and mirror coatings`,
    category: "properties",
    order: 9,
    relatedSlugs: ["what-is-band-gap", "what-units-are-used"],
    tags: ["dielectric", "permittivity", "capacitor", "optical"],
  },
];

export default faqs;
