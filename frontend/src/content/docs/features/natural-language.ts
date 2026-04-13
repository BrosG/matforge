import { DocPage } from "../index";

const page: DocPage = {
  slug: "natural-language",
  title: "Natural Language Search",
  description: "Search the materials database using plain English queries powered by AI.",
  category: "features",
  order: 14,
  lastUpdated: "2026-04-10",
  tags: ["natural-language", "ai", "search", "nlp"],
  readingTime: 4,
  body: `
## Natural Language Search

MatCraft supports searching the materials database using plain English queries. Instead of manually setting filter sliders and dropdowns, you can describe what you are looking for in natural language.

### How It Works

When you type a natural language query, MatCraft's AI parser:

1. **Extracts intent**: Identifies whether you are searching for a specific material, a class of materials, or materials matching property criteria
2. **Maps to filters**: Converts property descriptions to numeric filter ranges (e.g., "wide band gap" becomes band_gap > 2.5 eV)
3. **Identifies elements**: Recognizes element names, symbols, and compound types
4. **Executes search**: Runs the translated query against the database and returns ranked results

### Example Queries

| Natural Language Query | Translated Filters |
|-----------------------|-------------------|
| "stable binary oxides with band gap around 3 eV" | elements: O, n_elements: 2, band_gap: 2.5-3.5, Ehull < 0.05 |
| "high density metals without toxic elements" | density > 10, exclude: Pb, Cd, Hg, As, band_gap: 0 |
| "perovskites for solar cells" | formula pattern: ABO3, band_gap: 1.0-1.8 |
| "lightweight insulators" | density < 3.0, band_gap > 5.0 |
| "thermodynamically stable ternary nitrides" | elements: N, n_elements: 3, Ehull: 0 |

### Using Natural Language Search

1. Click the search bar on the main dashboard
2. Type your query in plain English
3. Press Enter or click the search button
4. Review the translated filters shown below the search bar
5. Adjust any filters manually if the AI interpretation needs refinement

### Tips for Better Results

- **Be specific about properties**: "band gap between 1 and 2 eV" works better than "semiconductor"
- **Name elements explicitly**: "contains lithium and oxygen" is more precise than "lithium compound"
- **Specify stability**: Add "stable" or "low energy above hull" to filter out metastable phases
- **Use comparatives**: "high density", "low band gap", "wide gap" are understood

### Fallback Behavior

If the AI parser cannot confidently interpret your query, it falls back to a text search across formula names and material descriptions. The translated filter interpretation is always shown so you can verify and adjust.

### Limitations

Natural language search works best for property-based queries. It does not currently support:

- Structural queries ("materials with octahedral coordination")
- Synthesis-related queries ("easy to synthesize")
- Application-specific queries beyond basic property mapping
- Queries referencing specific papers or databases by name
`,
};

export default page;
