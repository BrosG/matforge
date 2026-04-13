import { DocPage } from "../index";

const page: DocPage = {
  slug: "structural",
  title: "Structural Materials Guide",
  description: "Hard coatings, alloys, ceramics, and Poisson ratio analysis for structural applications.",
  category: "domains",
  order: 10,
  lastUpdated: "2026-04-13",
  tags: ["structural", "coatings", "alloys", "ceramics", "poisson-ratio", "mechanical"],
  readingTime: 7,
  body: `
## Structural Materials Guide

Structural materials must withstand mechanical loads, resist wear, and maintain integrity under harsh conditions. MatCraft provides tools for screening candidates based on elastic properties, hardness estimates, and thermodynamic stability. This guide covers hard coatings, alloys, ceramics, and how to use Poisson ratio analysis for material selection.

### Hard Coatings

Hard coatings protect surfaces from wear, corrosion, and high-temperature oxidation. They are used on cutting tools, turbine blades, and biomedical implants. Key material families include:

**Transition metal nitrides** (TiN, CrN, ZrN): These cubic rock-salt structures combine high hardness (20-30 GPa) with metallic conductivity. TiN is the classic gold-colored coating on drill bits. In MatCraft, search for binary nitrides with high bulk modulus and filter for cubic crystal system.

**Transition metal carbides** (TiC, WC, SiC): Extremely hard materials with Vickers hardness often exceeding 25 GPa. WC-Co cemented carbides are the backbone of the cutting tool industry. Filter for carbides with high shear modulus in MatCraft.

**Ternary coatings** (TiAlN, CrAlN, TiSiN): Adding aluminum or silicon to binary nitrides improves oxidation resistance and hot hardness. Search for ternary nitrides containing Al or Si and sort by formation energy to find stable compositions.

### Screening for Hardness

While MatCraft does not report Vickers hardness directly, several computed properties serve as proxies:

- **Shear modulus (G)**: Strongly correlated with hardness. Materials with G > 150 GPa are typically superhard.
- **Bulk modulus (K)**: Measures incompressibility. High K is necessary but not sufficient for hardness.
- **Pugh ratio (K/G)**: Predicts ductile vs. brittle behavior (see below).
- **Energy above hull**: Hard materials must be thermodynamically accessible. Filter Ehull < 0.1 eV/atom.

A useful scatter plot in MatCraft: plot bulk modulus vs. shear modulus. The upper-right quadrant contains the hardest and stiffest materials.

### Structural Alloys

Metallic alloys for structural applications balance strength, ductility, and processability. Key families in the MatCraft database:

**Steel compositions**: Fe-based alloys with C, Mn, Cr, Ni, Mo, V. Advanced high-strength steels (AHSS) achieve tensile strengths above 1 GPa while maintaining formability. Search for Fe-containing compounds and examine their elastic properties.

**Titanium alloys**: Ti-Al, Ti-V, Ti-Al-V systems offer exceptional strength-to-weight ratio. The Ti-6Al-4V alloy is the workhorse of aerospace. Search for Ti-Al binary and ternary phases.

**Nickel superalloys**: Ni-Al, Ni-Cr, Ni-Co systems form ordered intermetallic phases (gamma-prime, Ni3Al) that provide high-temperature strength. Search for Ni-Al intermetallics and sort by formation energy.

### Ceramics for Structural Use

Ceramics combine high hardness, high melting points, and chemical inertness but suffer from brittleness:

**Oxide ceramics**: Al2O3 (alumina), ZrO2 (zirconia), MgO (magnesia). Alumina is the most widely used structural ceramic due to its high hardness and chemical stability. Zirconia is notable for transformation toughening.

**Non-oxide ceramics**: Si3N4, SiC, B4C, BN. Silicon nitride and silicon carbide offer exceptional high-temperature strength and thermal shock resistance. B4C is the third hardest material after diamond and cubic BN.

**MAX phases**: Mn+1AXn compounds (M = transition metal, A = group 13-16 element, X = C or N) like Ti3AlC2 combine ceramic hardness with metallic machinability and thermal shock resistance. Search for ternary carbides and nitrides with layered structures.

### Poisson Ratio Analysis

Poisson's ratio (v) is one of the most informative mechanical properties for structural material selection:

**Interpreting values:**

- **v ~ 0.25-0.30**: Typical for metals. Indicates moderate lateral expansion under axial load.
- **v ~ 0.15-0.25**: Typical for ceramics and covalent solids. These materials resist lateral deformation.
- **v ~ 0.45-0.50**: Near incompressible (rubber-like behavior). The material deforms in shape but not volume.
- **v < 0 (auxetic)**: Rare materials that expand laterally when stretched. Useful for impact absorption and biomedical implants.

**Pugh criterion (K/G ratio):**

The ratio of bulk modulus to shear modulus predicts ductile versus brittle behavior:

- **K/G > 1.75**: Ductile. The material can deform plastically before fracturing. Desirable for structural metals.
- **K/G < 1.75**: Brittle. The material fractures without significant plastic deformation. Common in ceramics.

This can be recast in terms of Poisson's ratio: materials with v > 0.26 tend to be ductile; those with v < 0.26 tend to be brittle.

**Using the scatter plot:**

In MatCraft, create a scatter plot of Poisson's ratio vs. bulk modulus. This reveals four quadrants:

| Quadrant | Properties | Material Type |
|----------|-----------|---------------|
| High K, high v | Stiff and ductile | Structural metals |
| High K, low v | Stiff and brittle | Hard ceramics |
| Low K, high v | Compliant and ductile | Polymeric/soft |
| Low K, low v | Compliant and brittle | Porous ceramics |

### Campaign Configuration for Structural Materials

To run an optimization campaign for structural applications:

\`\`\`yaml
name: hard-coating-search
domain: ceramic

parameters:
  - name: metal_fraction
    type: continuous
    bounds: [0.3, 0.7]
  - name: nitrogen_content
    type: continuous
    bounds: [0.3, 0.5]

objectives:
  - name: shear_modulus
    direction: maximize
  - name: stability
    direction: minimize
    property: e_above_hull

constraints:
  - expression: metal_fraction + nitrogen_content <= 1.0
\`\`\`

### Recommended Workflows

1. **Coating discovery**: Search for binary/ternary nitrides and carbides with high shear modulus and Ehull < 0.05 eV/atom. Use the scatter plot to compare K vs. G.
2. **Alloy screening**: Search for intermetallic phases in the target element system. Sort by formation energy to identify the most stable compounds. Check Poisson's ratio to predict ductility.
3. **Ceramic selection**: Filter for oxides or non-oxides with high bulk modulus. Use the Pugh criterion to assess brittleness. Check phase diagrams for competing phases.
`,
};

export default page;
