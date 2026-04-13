import { DocPage } from "../index";

const page: DocPage = {
  slug: "reading-band-structures",
  title: "Reading Band Structures",
  description: "How to interpret electronic band structure plots for metals, semiconductors, and insulators.",
  category: "tutorials",
  order: 4,
  lastUpdated: "2026-04-10",
  tags: ["tutorial", "band-structure", "electronic", "interpretation"],
  readingTime: 6,
  body: `
## Reading Band Structures

Electronic band structure plots can look intimidating, but they encode rich information about a material's electronic properties. This tutorial teaches you how to read them.

### Anatomy of a Band Structure Plot

The x-axis shows the path through the Brillouin zone along high-symmetry directions. Greek letters (Gamma, etc.) and Latin letters (X, K, L, M, etc.) mark high-symmetry points.

The y-axis shows energy in electron volts (eV), referenced to the Fermi level at 0 eV. Each curve (band) represents a set of electronic states at each k-point.

### Step 1: Identify the Fermi Level

The horizontal dashed line at E = 0 eV is the Fermi level. In a metal at 0 K, all states below this line are occupied and all above are empty.

### Step 2: Check for a Band Gap

Look at the region around E = 0:

- **No gap** (bands cross E = 0): The material is a metal. Free electrons at the Fermi level carry current.
- **Gap present**: The material is a semiconductor or insulator. The gap size determines which category.

### Step 3: Find the VBM and CBM

- **VBM** (Valence Band Maximum): The highest point of the topmost occupied band
- **CBM** (Conduction Band Minimum): The lowest point of the bottommost unoccupied band

If the VBM and CBM are at the same k-point, the gap is **direct**. If they are at different k-points, the gap is **indirect**.

### Step 4: Assess Band Dispersion

The curvature of bands near the VBM and CBM tells you about carrier effective mass:

- **Steep, parabolic bands**: Light effective mass, high carrier mobility. Good for transistors and transparent conductors.
- **Flat bands**: Heavy effective mass, low mobility. Can lead to high density of states (useful for thermoelectrics).

The effective mass is inversely proportional to the second derivative of E(k): m* = hbar^2 / (d^2E/dk^2).

### Step 5: Look for Spin Splitting

In magnetic materials, spin-up (blue) and spin-down (red) bands are plotted separately. If they differ:

- **Spin splitting at the Fermi level**: The material is magnetic
- **Half-metallic**: One spin channel has a gap while the other is metallic -- useful for spintronics

### Common Patterns

**Silicon (indirect semiconductor)**: VBM at Gamma, CBM between Gamma and X. Band gap ~1.1 eV. Relatively flat valence band top.

**GaAs (direct semiconductor)**: Both VBM and CBM at Gamma. Band gap ~1.4 eV. Light electron effective mass (steep CBM).

**Iron (metal)**: Multiple bands crossing the Fermi level. Strong spin splitting between up and down channels.

### Practical Tips

- Focus on bands within 3-4 eV of the Fermi level; deeper bands are rarely relevant for device properties
- Compare band structures of similar materials to see how substitution changes electronic properties
- Remember that DFT (GGA) underestimates band gaps; the band shapes and dispersions are more reliable than absolute gap values
- For optical applications, look for direct transitions near the band edges
`,
};

export default page;
