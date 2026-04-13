import { DocPage } from "../index";

const page: DocPage = {
  slug: "materials-search",
  title: "Materials Search & Discovery",
  description: "Complete guide to searching 205k+ materials with filters, sorting, and pagination.",
  category: "features",
  order: 0,
  lastUpdated: "2026-04-10",
  tags: ["search", "discovery", "filters", "materials"],
  readingTime: 5,
  body: `
## Materials Search & Discovery

MatCraft provides access to over 205,000 materials aggregated from Materials Project, AFLOW, and JARVIS databases. The search interface is designed for both quick lookups and advanced multi-criteria filtering.

### Basic Search

Type any chemical formula, material name, or property keyword into the search bar. MatCraft supports several query formats:

- **Exact formula**: \`SiO2\`, \`GaAs\`, \`LiFePO4\`
- **Partial formula**: \`Li*O*\` matches any lithium oxide
- **Elements filter**: Select elements to find all materials containing them
- **Natural language**: "high band gap oxide with low density" (see [Natural Language Search](/docs/features/natural-language))

### Filter Panel

The left sidebar exposes powerful filters:

| Filter | Description | Example |
|--------|-------------|---------|
| Band gap | Range slider (0 - 12 eV) | 1.0 - 2.0 eV for solar absorbers |
| Energy above hull | Thermodynamic stability | < 0.05 eV/atom for stable phases |
| Density | Mass density range | 2.0 - 5.0 g/cm3 |
| Crystal system | Cubic, hexagonal, etc. | Select one or more |
| Space group | Hermann-Mauguin symbol | Fm-3m, P6_3/mmc |
| Number of elements | Binary, ternary, etc. | 2 - 4 elements |
| Data source | MP, AFLOW, JARVIS | Select providers |

### Sorting

Click any column header to sort results. Available sort fields include formula, band gap, energy above hull, density, formation energy, and number of sites. Click again to toggle ascending/descending order.

### Pagination

Results are paginated at 20 items per page by default. You can adjust this to 50 or 100 using the page size selector. The total count is displayed at the top of the results list.

### Saving Searches

Bookmark any search by copying the URL -- all filter state is encoded in query parameters. This makes it easy to share specific material sets with collaborators.

### API Access

All search functionality is available via the REST API:

\`\`\`bash
curl "https://matcraft.io/api/materials?band_gap_min=1.0&band_gap_max=2.0&sort=band_gap&limit=20"
\`\`\`

See the [Materials API](/docs/materials-api/materials-list) for complete parameter documentation.

### Performance

Searches typically return in under 200ms thanks to indexed database queries and server-side caching. Complex multi-filter queries may take up to 500ms on first request, with subsequent identical queries served from cache.
`,
};

export default page;
