import { DocPage } from "../index";

const page: DocPage = {
  slug: "xrd-simulation",
  title: "XRD Pattern Simulation",
  description: "Simulate powder X-ray diffraction patterns for phase identification and characterization.",
  category: "features",
  order: 8,
  lastUpdated: "2026-04-10",
  tags: ["xrd", "diffraction", "characterization", "simulation"],
  readingTime: 4,
  body: `
## XRD Pattern Simulation

MatCraft computes simulated powder X-ray diffraction (XRD) patterns from crystal structure data. These patterns are essential for comparing theoretical predictions with experimental measurements for phase identification.

### How It Works

The simulation uses the kinematic diffraction theory to calculate peak positions and intensities:

1. **Structure factors** are computed from atomic positions, site occupancies, and atomic scattering factors
2. **Peak positions** are determined by Bragg's law: 2d*sin(theta) = n*lambda
3. **Peak intensities** account for the Lorentz-polarization factor, multiplicity, and Debye-Waller thermal factors
4. **Peak profiles** use a pseudo-Voigt function with configurable broadening

### Viewing XRD Patterns

Open any material's detail page and select the **XRD** tab. The simulated pattern displays with:

- **X-axis**: 2-theta angle (degrees), default range 10-90 degrees
- **Y-axis**: Relative intensity (normalized to 100 for the strongest peak)
- **Peak labels**: Miller indices (hkl) shown above significant peaks

### Configuration

- **Radiation source**: Cu K-alpha (1.5406 A, default), Mo K-alpha (0.7107 A), Co K-alpha (1.7890 A)
- **2-theta range**: Adjustable from 5 to 180 degrees
- **Peak width**: Gaussian broadening parameter (FWHM) in degrees

### Comparing with Experiment

Download the simulated pattern data and overlay it with your experimental XRD data to:

- Confirm phase identity of synthesized materials
- Identify impurity phases in multi-phase samples
- Check for preferred orientation effects
- Detect peak shifts from lattice strain or compositional variation

### Export Options

- **PNG/SVG**: Publication-quality plot images
- **CSV**: Two-theta and intensity columns for external plotting
- **JSON**: Full diffraction data including peak positions, intensities, and Miller indices
- **Jupyter notebook**: Matplotlib code to reproduce and customize the plot

### API Access

\`\`\`bash
curl "https://matcraft.io/api/electronic/xrd/mp-149?radiation=CuKa&two_theta_range=10,90"
\`\`\`

Returns arrays of two-theta values, intensities, and annotated peak positions with Miller indices.

### Limitations

Simulated patterns assume a perfect crystal with no preferred orientation, strain, or amorphous background. Real experimental patterns will show additional broadening and background contributions not captured by the simulation.
`,
};

export default page;
