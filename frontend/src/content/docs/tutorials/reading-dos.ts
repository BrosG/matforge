import { DocPage } from "../index";

const page: DocPage = {
  slug: "reading-dos",
  title: "Reading Density of States",
  description: "How to interpret total and element-projected DOS plots for electronic structure analysis.",
  category: "tutorials",
  order: 5,
  lastUpdated: "2026-04-10",
  tags: ["tutorial", "dos", "electronic", "interpretation"],
  readingTime: 6,
  body: `
## Reading Density of States

The density of states (DOS) is a complementary view to the band structure. While band structures show E(k) dispersion, the DOS shows how many states exist at each energy level.

### What the Axes Mean

- **X-axis**: Energy in eV, referenced to the Fermi level (0 eV)
- **Y-axis**: Density of states in states/eV/unit cell. Higher values mean more electronic states are available at that energy.

### Step 1: Identify Material Type

Look at the DOS value at the Fermi level (E = 0):

- **Non-zero DOS at E_F**: Metal. The material has free carriers for electrical conduction.
- **Zero DOS at E_F with a gap**: Semiconductor or insulator. The gap size in the DOS should match the band structure gap.
- **Very small but non-zero DOS at E_F**: Could be a semimetal or a numerical artifact from broadening.

### Step 2: Read the Band Gap from DOS

For semiconductors, the band gap appears as a region of zero DOS around the Fermi level. Measure the width of this zero region to determine the gap. The left edge is the valence band maximum and the right edge is the conduction band minimum.

### Step 3: Analyze Element Contributions

The element-projected DOS (pDOS) shows which elements contribute states at each energy:

- **Valence band**: Look at which elements dominate below E_F. In metal oxides, oxygen 2p states often dominate the upper valence band.
- **Conduction band**: In transition metal oxides, metal d-states often form the conduction band minimum.
- **Hybridization**: When two elements show overlapping peaks at the same energy, their orbitals are hybridized (bonding interaction).

### Step 4: Identify Key Features

- **Sharp peaks (van Hove singularities)**: Correspond to flat bands in the band structure. These indicate localized states or narrow bandwidth.
- **Broad features**: Correspond to dispersive bands with light effective mass.
- **A deep valley (pseudogap)**: A region of very low (but not zero) DOS, sometimes seen in metallic alloys. Indicates partial gap formation.

### Example: Titanium Dioxide (TiO2)

In rutile TiO2:

1. The valence band (below E_F) is dominated by O 2p states spanning -8 to 0 eV
2. The conduction band (above E_F) is dominated by Ti 3d states starting at ~3 eV
3. The 3 eV gap between O 2p and Ti 3d states is the band gap
4. Some Ti-O hybridization is visible in the lower valence band region

### Relating DOS to Properties

- **Thermoelectrics**: A sharp DOS peak near E_F can enhance the Seebeck coefficient
- **Catalysis**: The d-band center (average energy of d-states) correlates with adsorption strength
- **Optical properties**: The joint DOS (valence + conduction) determines absorption spectra
- **Magnetism**: Differences between spin-up and spin-down DOS indicate magnetic ordering

### Comparing with Band Structure

A flat band in the band structure produces a sharp peak in the DOS. A steep, dispersive band produces a broad, low-amplitude contribution to the DOS. Use both plots together for a complete picture of the electronic structure.
`,
};

export default page;
