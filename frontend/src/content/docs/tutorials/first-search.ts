import { DocPage } from "../index";

const page: DocPage = {
  slug: "first-search",
  title: "Your First Materials Search",
  description: "Step-by-step tutorial for searching materials with filters, element selection, and property ranges.",
  category: "tutorials",
  order: 1,
  lastUpdated: "2026-04-10",
  tags: ["tutorial", "search", "filters", "beginner"],
  readingTime: 6,
  body: `
## Your First Materials Search

This tutorial walks through a realistic search scenario: finding stable oxide semiconductors with band gaps suitable for solar energy applications.

### Goal

Find thermodynamically stable metal oxides with band gaps between 1.0 and 2.0 eV that could serve as solar absorber materials.

### Step 1: Open the Search Page

Click "Explore Materials" on the dashboard or navigate directly to the search page. You will see the search bar and filter panel.

### Step 2: Set Element Filters

In the filter panel on the left:

1. Click the **Elements** filter section
2. Click on "O" (oxygen) in the periodic table selector to require oxygen
3. The results update immediately to show only oxygen-containing materials

### Step 3: Set Band Gap Range

Scroll down to the **Band Gap** filter:

1. Drag the left slider to 1.0 eV
2. Drag the right slider to 2.0 eV
3. The result count updates to show how many materials match

This range targets the Shockley-Queisser optimal window for single-junction solar cells.

### Step 4: Filter for Stability

Set the **Energy Above Hull** filter:

1. Enter 0.05 in the maximum field
2. This limits results to materials within 50 meV/atom of the convex hull, indicating good thermodynamic stability

### Step 5: Sort Results

Click the **Band Gap** column header to sort results by band gap. Click again to toggle between ascending and descending order. Materials closest to the 1.34 eV Shockley-Queisser optimum will appear near the middle.

### Step 6: Review Results

Scan through the results. You will find well-known solar materials like:

- **Cu2O** (cuprous oxide): Band gap ~2.0 eV, cubic
- **SnO** (tin monoxide): Band gap ~0.7 eV (at the edge of our range)
- **BiVO4** (bismuth vanadate): Band gap ~2.4 eV (photoelectrochemistry)

### Step 7: Refine with Crystal System

If you want cubic materials specifically (for isotropic optical properties):

1. Open the **Crystal System** filter
2. Select "cubic"
3. The results narrow further

### Step 8: Save Your Search

Copy the URL from your browser address bar. All filter settings are encoded in the URL parameters, so sharing this link gives collaborators the exact same search view.

### Step 9: Compare Top Candidates

Check the comparison boxes on 3-5 promising materials, then click "Compare Selected" to open the side-by-side comparator view.

### Tips

- Start broad, then narrow: Apply one filter at a time and watch the result count
- Use the element exclude filter to remove toxic elements (Pb, Cd, Tl)
- Sort by Energy Above Hull to prioritize the most stable candidates
- Check the data source badge: Materials Project data is generally well-validated
`,
};

export default page;
