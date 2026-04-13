import { DocPage } from "../index";

const page: DocPage = {
  slug: "getting-started",
  title: "Getting Started with MatCraft",
  description: "Your first visit to MatCraft: navigating the dashboard, searching materials, and viewing properties.",
  category: "tutorials",
  order: 0,
  lastUpdated: "2026-04-10",
  tags: ["tutorial", "beginner", "getting-started"],
  readingTime: 6,
  body: `
## Getting Started with MatCraft

Welcome to MatCraft, an open materials science platform with access to over 205,000 materials from Materials Project, AFLOW, and JARVIS databases. This tutorial walks you through your first visit.

### Step 1: Open the Dashboard

Navigate to [matcraft.io](https://matcraft.io) in your browser. No account is required for basic browsing. The landing page shows the main dashboard with:

- **Search bar**: The primary way to find materials
- **Quick stats**: Total materials count, data sources, and recent additions
- **Featured tools**: Links to scatter plot, phase diagrams, and inverse design

### Step 2: Search for a Material

Type "silicon" or "Si" into the search bar and press Enter. The results page shows all silicon-containing materials sorted by relevance. Each result card displays:

- Chemical formula (e.g., Si, SiO2, SiC)
- Band gap value
- Crystal system and space group
- Energy above hull (thermodynamic stability indicator)
- Data source badge (MP, AFLOW, or JARVIS)

### Step 3: View a Material

Click on any result to open the material detail page. The detail page is organized into tabs:

- **Overview**: Summary of key properties in a card layout
- **Structure**: Interactive 3D crystal viewer with rotation, zoom, and supercell controls
- **Electronic**: Band structure and density of states plots (when available)
- **XRD**: Simulated powder diffraction pattern
- **Applications**: AI-estimated suitability scores for various engineering applications
- **Similar**: Materials with related composition or structure

### Step 4: Explore the 3D Viewer

On the Structure tab, interact with the crystal:

- Left-click and drag to rotate
- Scroll to zoom in and out
- Right-click and drag to pan
- Click the 2x2x2 button to see the supercell expansion

### Step 5: Check Electronic Properties

Switch to the Electronic tab. If the material has band structure data, you will see the E(k) dispersion plot. The band gap value and type (direct/indirect) are shown above the plot.

### Step 6: Download Structure Files

Click the Download button on the Structure tab to export the crystal structure as CIF (universal), POSCAR (for VASP), or XYZ format.

### Step 7: Create an Account (Optional)

While browsing is free, creating an account gives you:

- Higher API rate limits (1,000 requests/hour vs. 100)
- Access to builder tools (supercell, surface, nanoparticle, substitution)
- Saved searches and material bookmarks
- Jupyter notebook export

Click "Sign In" in the top navigation and choose Google, GitHub, or ORCID authentication.

### Next Steps

- [Your First Materials Search](/docs/tutorials/first-search) -- Learn advanced search techniques
- [Understanding Material Properties](/docs/tutorials/understanding-properties) -- What the numbers mean
- [API Quickstart](/docs/tutorials/api-quickstart) -- Programmatic access to the database
`,
};

export default page;
