import { DocPage } from "../index";

const page: DocPage = {
  slug: "crystal-viewer",
  title: "3D Crystal Structure Viewer",
  description: "Using the WebGL crystal viewer: rotate, zoom, supercell expansion, and bond detection.",
  category: "features",
  order: 1,
  lastUpdated: "2026-04-10",
  tags: ["viewer", "3d", "crystal", "webgl", "visualization"],
  readingTime: 5,
  body: `
## 3D Crystal Structure Viewer

MatCraft includes an interactive WebGL-based crystal structure viewer built on Three.js. The viewer renders unit cells with atom spheres, bond sticks, and a translucent unit cell wireframe.

### Controls

| Action | Mouse | Trackpad |
|--------|-------|----------|
| Rotate | Left-click + drag | Two-finger drag |
| Zoom | Scroll wheel | Pinch |
| Pan | Right-click + drag | Three-finger drag |
| Reset view | Double-click | Double-tap |

### Atom Visualization

Atoms are rendered as spheres color-coded by element using CPK (Corey-Pauling-Koltun) coloring conventions. Sphere radii scale with covalent radius by default. You can switch to ionic radius or van der Waals radius using the display settings panel.

### Bond Detection

Bonds are automatically detected when interatomic distances fall within the sum of covalent radii plus a configurable tolerance (default 0.3 Angstroms). You can adjust the tolerance or disable bond rendering entirely in the settings.

### Supercell Expansion

Expand the unit cell along any axis using the supercell controls:

- Click the **2x2x2** button for a quick eight-cell expansion
- Use the custom input fields to specify any NxMxL expansion (up to 5x5x5)
- The viewer updates in real-time as atoms are replicated across periodic boundaries

### Unit Cell Box

A wireframe box shows the unit cell boundaries with lattice vectors labeled a, b, c. Lattice parameters (a, b, c, alpha, beta, gamma) are displayed in the information panel below the viewer.

### Display Options

- **Background**: Toggle between dark (default) and light backgrounds
- **Atom labels**: Show/hide element symbols on each atom
- **Polyhedra**: Render coordination polyhedra for selected central atoms
- **Miller planes**: Overlay crystallographic planes by specifying (hkl) indices

### Export

Right-click the viewer to save a PNG screenshot. For publication-quality images, use the high-resolution export option (2x or 4x rendering scale) in the export menu.

### Embedding

The viewer component can be embedded in Jupyter notebooks via the MatCraft Python SDK:

\`\`\`python
from matcraft import CrystalViewer

viewer = CrystalViewer(material_id="mp-149")
viewer.show()  # renders in notebook cell
\`\`\`

### Browser Compatibility

The viewer requires WebGL 2.0 support. All modern browsers (Chrome 80+, Firefox 75+, Safari 15+, Edge 80+) are supported. Hardware-accelerated GPU rendering is recommended for supercells larger than 3x3x3.
`,
};

export default page;
