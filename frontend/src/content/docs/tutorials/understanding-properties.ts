import { DocPage } from "../index";

const page: DocPage = {
  slug: "understanding-properties",
  title: "Understanding Material Properties",
  description: "What band gap, formation energy, energy above hull, and other computed properties mean.",
  category: "tutorials",
  order: 3,
  lastUpdated: "2026-04-10",
  tags: ["tutorial", "properties", "physics", "beginner"],
  readingTime: 7,
  body: `
## Understanding Material Properties

MatCraft displays many computed properties for each material. This guide explains what they mean and how to interpret them.

### Band Gap (eV)

The band gap is the energy difference between the highest occupied electronic state (valence band maximum) and the lowest unoccupied state (conduction band minimum).

- **0 eV**: Metal (conductor) -- electrons flow freely
- **0.1 - 1.0 eV**: Narrow-gap semiconductor -- infrared detectors, thermoelectrics
- **1.0 - 3.0 eV**: Semiconductor -- solar cells, LEDs, transistors
- **> 3.0 eV**: Wide-gap semiconductor or insulator -- UV devices, dielectrics

**Important**: DFT band gaps (from GGA/PBE calculations) systematically underestimate experimental values by 30-50%. The trends are reliable, but absolute values should be treated as lower bounds.

### Direct vs. Indirect Band Gap

A **direct** band gap means the VBM and CBM occur at the same point in reciprocal space. Direct-gap materials are preferred for optoelectronics (LEDs, lasers, solar cells) because they absorb and emit light efficiently without requiring phonon assistance.

An **indirect** gap (like silicon) requires a phonon to conserve momentum during optical transitions, making absorption weaker near the band edge.

### Formation Energy (eV/atom)

The formation energy is the energy released (negative) or required (positive) when forming the compound from its constituent elements in their standard states.

- **Negative**: Compound is stable relative to pure elements
- **More negative**: Stronger thermodynamic driving force for formation
- **Positive**: Compound is unstable relative to decomposition into elements

### Energy Above Hull (eV/atom)

This is the most important stability metric. It measures how far above the thermodynamic convex hull a material sits:

- **0.000**: On the hull -- thermodynamically stable phase at that composition
- **< 0.025**: Very close to stable -- likely synthesizable, may be kinetically stabilized
- **0.025 - 0.100**: Metastable -- may exist as a metastable phase under certain conditions
- **> 0.100**: Significantly unstable -- unlikely to be synthesized in bulk

### Density (g/cm3)

Mass per unit volume, calculated from the unit cell mass and volume. Useful for:

- Weight-constrained applications (aerospace, portable electronics)
- Phase identification (comparing with experimental measurements)
- Estimating volumetric energy density for batteries

### Crystal System

The seven crystal systems describe the unit cell symmetry:

| System | Lattice Constraints | Examples |
|--------|-------------------|----------|
| Cubic | a=b=c, alpha=beta=gamma=90 | Si, NaCl, GaAs |
| Hexagonal | a=b, gamma=120 | ZnO, graphite |
| Tetragonal | a=b, all angles 90 | TiO2 (rutile) |
| Orthorhombic | All angles 90 | Perovskites (some) |
| Monoclinic | One angle not 90 | Many minerals |
| Triclinic | No constraints | Least symmetric |
| Trigonal | a=b=c, alpha=beta=gamma | Quartz, calcite |

### Space Group

A more detailed symmetry classification. There are 230 space groups, each defining the complete set of symmetry operations (rotations, reflections, glide planes, screw axes) of the crystal. Materials in the same space group share similar structural motifs.

### Volume (A3/cell)

The unit cell volume in cubic Angstroms. Divide by the number of atoms to get volume per atom, which is useful for comparing materials independent of cell size.
`,
};

export default page;
