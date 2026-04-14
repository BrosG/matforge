// No lucide imports here — icons are string keys resolved in client components

export interface PersonaPain {
  title: string;
  desc: string;
}

export interface PersonaSolution {
  title: string;
  desc: string;
}

export interface PersonaFeature {
  icon: string;
  title: string;
  desc: string;
}

export interface PersonaTestimonial {
  quote: string;
  name: string;
  role: string;
  org: string;
}

export interface PersonaPricing {
  tier: string;
  price: string;
  period?: string;
  highlight: string;
  cta: string;
  href: string;
}

export interface Persona {
  slug: string;
  label: string;
  icon: string; // lucide icon name, resolved in client component
  iconColor: string;
  gradientFrom: string;
  gradientTo: string;
  accentColor: string;
  tagline: string;
  headline: string;
  subheadline: string;
  cardDesc: string; // 2-line description for homepage card
  pains: PersonaPain[];
  solutions: PersonaSolution[];
  features: PersonaFeature[];
  testimonial: PersonaTestimonial;
  pricing: PersonaPricing;
}

export const PERSONAS: Persona[] = [
  {
    slug: "materials-scientists",
    label: "Materials Scientists",
    icon: "FlaskConical",
    iconColor: "text-blue-500",
    gradientFrom: "from-blue-600",
    gradientTo: "to-cyan-500",
    accentColor: "blue",
    tagline: "For Research Scientists",
    headline: "Your Entire Materials Workflow — One Platform",
    subheadline:
      "Stop switching between 6 databases and 4 software suites. Search 205,000+ materials, run AI inverse design, and visualize band structures — all in the browser.",
    cardDesc:
      "205k+ unified materials, AI inverse design, band structures and phase diagrams in one tab.",
    pains: [
      {
        title: "Weeks Lost to Database Hopping",
        desc: "Materials Project, AFLOW, JARVIS, ICSD — each has a different API, schema, and access model. Merging them takes weeks per project.",
      },
      {
        title: "No AI Screening",
        desc: "Brute-force DFT screening of thousands of candidates burns compute budgets. There's no smart pre-filter to narrow the field first.",
      },
      {
        title: "Expensive Proprietary Software",
        desc: "VESTA, Materials Studio, and Schrödinger licences cost tens of thousands per year and require IT setup on every machine.",
      },
    ],
    solutions: [
      {
        title: "205,000+ Materials, One Search",
        desc: "MP, AFLOW, and JARVIS unified under a single REST API and search UI. Filter by 30+ properties in milliseconds.",
      },
      {
        title: "AI Inverse Design",
        desc: "Specify target properties and let the surrogate + active learning engine find optimal candidates — 100x faster than DFT brute force.",
      },
      {
        title: "Browser-Native Tools",
        desc: "3D structure viewer, band structure plots, and phase diagram tools load instantly. No install, no licence, no IT ticket.",
      },
    ],
    features: [
      {
        icon: "Search",
        title: "Unified Materials Search",
        desc: "Full-text and property-based search across 205,000+ entries. Filter by band gap, formation energy, crystal system, and 27 more parameters.",
      },
      {
        icon: "Box",
        title: "Interactive 3D Viewer",
        desc: "Rotate, zoom, and inspect crystal structures. Toggle lattice, bonds, and polyhedra. Export CIF, POSCAR, XYZ in one click.",
      },
      {
        icon: "BarChart2",
        title: "Electronic Structure",
        desc: "Pre-computed band structures, density of states, and projected orbital contributions visualised interactively.",
      },
      {
        icon: "Download",
        title: "DFT Export",
        desc: "Generate VASP POSCAR, Quantum ESPRESSO input, LAMMPS data, and CP2K files directly from any material page.",
      },
    ],
    testimonial: {
      quote:
        "MatCraft collapsed what used to be a two-week data-gathering phase into an afternoon. The unified search alone justified switching from our old ICSD workflow.",
      name: "Dr. Sophie Brennan",
      role: "Senior Researcher",
      org: "Institute for Functional Materials, ETH Zürich",
    },
    pricing: {
      tier: "Lab Pro",
      price: "$49",
      period: "/month",
      highlight: "Unlimited campaigns · API access · 5 team seats",
      cta: "Start 14-day free trial",
      href: "/register",
    },
  },
  {
    slug: "engineers",
    label: "Engineers & Product Teams",
    icon: "Cpu",
    iconColor: "text-orange-500",
    gradientFrom: "from-orange-500",
    gradientTo: "to-amber-400",
    accentColor: "orange",
    tagline: "For Engineers & Product Teams",
    headline: "Find the Right Material in Minutes, Not Months",
    subheadline:
      "Stop guessing which alloy or ceramic meets your mechanical and thermal specs. Filter 205,000+ materials by 16 properties, plot scatter charts, and compare candidates side-by-side.",
    cardDesc:
      "Filter by 16 mechanical & thermal properties, plot scatter charts, and compare candidates instantly.",
    pains: [
      {
        title: "Spec-Matching is Manual & Slow",
        desc: "Engineers scroll datasheets or rely on tribal knowledge to find materials meeting tensile strength, thermal conductivity, and weight constraints simultaneously.",
      },
      {
        title: "No Visual Exploration",
        desc: "Spreadsheet-based materials selection offers no way to visualise trade-offs across two or three properties at once.",
      },
      {
        title: "Siloed Materials Data",
        desc: "Property data lives in separate databases, handbooks, and supplier PDFs. Aggregating it for a decision is a project in itself.",
      },
    ],
    solutions: [
      {
        title: "16-Property Filter Panel",
        desc: "Slide range sliders for tensile strength, thermal conductivity, density, band gap, and 12 more. Results update instantly.",
      },
      {
        title: "Scatter Plot Explorer",
        desc: "Plot any two properties on X/Y axes to visualise Pareto trade-offs. Colour by crystal system or stability.",
      },
      {
        title: "Side-by-Side Comparator",
        desc: "Add up to 5 materials to the comparator and see all properties in a unified table. Export as CSV for your BOM.",
      },
    ],
    features: [
      {
        icon: "SlidersHorizontal",
        title: "Property Filters",
        desc: "16 sliders covering mechanical, thermal, electronic, and structural properties. Combine any set of constraints.",
      },
      {
        icon: "ScatterChart",
        title: "Scatter Plot Explorer",
        desc: "Interactive Recharts-powered plots. Click any point to open the material detail page.",
      },
      {
        icon: "LayoutList",
        title: "Material Comparator",
        desc: "Compare up to 5 materials across all 30+ properties in a compact, scannable table.",
      },
      {
        icon: "FileDown",
        title: "CSV Export",
        desc: "Export your filtered results or comparator table as CSV for downstream analysis in Excel or Python.",
      },
    ],
    testimonial: {
      quote:
        "We narrowed 200,000 candidates to 12 shortlisted alloys in a single afternoon. What used to take a materials engineer two weeks now happens before lunch.",
      name: "Marc Lefebvre",
      role: "Principal Engineer",
      org: "Advanced Manufacturing, Airbus",
    },
    pricing: {
      tier: "Lab Pro",
      price: "$49",
      period: "/month",
      highlight: "Unlimited searches · CSV export · API access",
      cta: "Start free",
      href: "/register",
    },
  },
  {
    slug: "students",
    label: "Students & Educators",
    icon: "GraduationCap",
    iconColor: "text-emerald-500",
    gradientFrom: "from-emerald-500",
    gradientTo: "to-teal-400",
    accentColor: "emerald",
    tagline: "For Students & Educators",
    headline: "Learn Materials Science by Doing, Not Just Reading",
    subheadline:
      "No budget? No problem. MatCraft's free tier gives students and educators real crystallographic data, a 3D structure builder, and hands-on DFT concept tools — forever free.",
    cardDesc:
      "Free forever for students — 3D crystal builder, prototype library, and hands-on DFT tools.",
    pains: [
      {
        title: "No Hands-On Digital Tools",
        desc: "Textbook diagrams of FCC and BCC structures don't convey the intuition that comes from rotating and exploring a crystal in 3D.",
      },
      {
        title: "Expensive Commercial Software",
        desc: "VESTA and Materials Studio are either hard to install or cost more than a student's semester budget.",
      },
      {
        title: "Abstract DFT Concepts",
        desc: "Band gaps and formation energies are hard to grasp without seeing how they change across different compositions.",
      },
    ],
    solutions: [
      {
        title: "Free Tier — Forever",
        desc: "Full access to materials search, 3D viewer, and structure builder at zero cost. No credit card, no expiry.",
      },
      {
        title: "3D Structure Builder",
        desc: "Build FCC, BCC, HCP, diamond cubic, perovskite, and spinel prototypes from scratch. Drag atoms, apply symmetry operations.",
      },
      {
        title: "Concept-Linked Property Data",
        desc: "Click through from a band gap value to a DOS plot. See instantly how changing composition shifts electronic properties.",
      },
    ],
    features: [
      {
        icon: "Box",
        title: "3D Crystal Builder",
        desc: "Start from 20+ prototypes (FCC, BCC, perovskite, spinel …) and modify the structure interactively in the browser.",
      },
      {
        icon: "BookOpen",
        title: "Prototype Library",
        desc: "One-click templates for all common crystal structures. Perfect for coursework and lab assignments.",
      },
      {
        icon: "BarChart2",
        title: "Visual Property Explorer",
        desc: "Band structures and DOS plots rendered for every material. Understand why TiO₂ is a semiconductor without a single line of code.",
      },
      {
        icon: "GraduationCap",
        title: "Free Forever",
        desc: "The Researcher plan is and will remain free. Educators can assign coursework based on real materials data.",
      },
    ],
    testimonial: {
      quote:
        "I had my undergrad students build perovskite structures and compare their band gaps before they'd even touched DFT code. The visual learning impact was immediate.",
      name: "Prof. Amara Diallo",
      role: "Assistant Professor, Materials Science",
      org: "University of Cape Town",
    },
    pricing: {
      tier: "Free",
      price: "$0",
      period: "forever",
      highlight: "Full materials search · 3D builder · No credit card",
      cta: "Create free account",
      href: "/register",
    },
  },
  {
    slug: "startups",
    label: "Deep Tech Startups",
    icon: "Rocket",
    iconColor: "text-violet-500",
    gradientFrom: "from-violet-600",
    gradientTo: "to-purple-500",
    accentColor: "violet",
    tagline: "For Deep Tech Startups",
    headline: "Enterprise Materials Intelligence — Startup Pricing",
    subheadline:
      "Stop paying $50k/year for ICSD or Schrödinger. MatCraft gives you 205,000+ materials free plus FTO patent analysis at a fraction of law firm rates.",
    cardDesc:
      "Free materials data + $950 FTO reports (vs. $5–10k at a law firm). Built for pre-Series B teams.",
    pains: [
      {
        title: "$50k/Year Licensing Fees",
        desc: "ICSD, Schrödinger Suite, and CCDC together can exceed $50,000 per year — pricing out pre-seed and seed-stage startups entirely.",
      },
      {
        title: "IP Blind Spots Kill Funding",
        desc: "Investors ask about Freedom-to-Operate in every due diligence. Without an FTO analysis you can't answer — and you can't afford a law firm's timeline.",
      },
      {
        title: "No API for Your Pipeline",
        desc: "Building a materials-aware product requires programmatic data access. Most databases charge enterprise rates or ban commercial use.",
      },
    ],
    solutions: [
      {
        title: "Free Materials Data",
        desc: "205,000+ materials with 30+ properties available via REST API under open data licences. No commercial use restrictions.",
      },
      {
        title: "$950 FTO Deep Scan",
        desc: "AI-powered Freedom-to-Operate report covering 125M+ patents. Delivered overnight vs. 4-6 weeks and $5-10k at a law firm.",
      },
      {
        title: "API-First Access",
        desc: "Integrate MatCraft data directly into your product or R&D pipeline with a documented REST API and CSV/JSON export.",
      },
    ],
    features: [
      {
        icon: "Shield",
        title: "IP Radar",
        desc: "Search 125M+ patents in seconds. Map the IP landscape for any material chemistry or application domain.",
      },
      {
        icon: "Zap",
        title: "Deep Scan FTO",
        desc: "Submit a materials claim and receive a structured AI FTO assessment overnight at $950 — vs. $5-10k and 4 weeks at a patent firm.",
      },
      {
        icon: "Code2",
        title: "REST API",
        desc: "Documented endpoints for search, property lookup, and bulk export. Rate-limited fairly — scale up as you grow.",
      },
      {
        icon: "TrendingUp",
        title: "Investor-Ready Output",
        desc: "Deep Scan reports include white-space maps and risk summaries formatted for technical due diligence packages.",
      },
    ],
    testimonial: {
      quote:
        "Our investor asked for an FTO analysis on Friday. We ran a Deep Scan, had the report by Saturday morning, and answered the question in our Monday call. Saved us weeks.",
      name: "Yuki Tanaka",
      role: "CEO & Co-founder",
      org: "NovaMem Technologies (Series A)",
    },
    pricing: {
      tier: "IP Radar Credits",
      price: "$99",
      period: "/100 credits",
      highlight: "Deep Scan FTO $950 · API access · Cancel anytime",
      cta: "Get started free",
      href: "/register",
    },
  },
  {
    slug: "ip-lawyers",
    label: "Patent Attorneys & IP Teams",
    icon: "Shield",
    iconColor: "text-slate-500",
    gradientFrom: "from-slate-700",
    gradientTo: "to-slate-500",
    accentColor: "slate",
    tagline: "For Patent Attorneys & IP Teams",
    headline: "AI-Powered Patent Intelligence for Materials",
    subheadline:
      "Search 125M+ patents in seconds with materials-aware AI. Deliver FTO assessments overnight instead of in a month — and find white space your clients can actually patent.",
    cardDesc:
      "Search 125M+ patents in seconds, deliver AI FTO reports overnight, and map materials white space.",
    pains: [
      {
        title: "Manual Patent Searches Take Days",
        desc: "Searching for materials IP across USPTO, EPO, and CNIPA manually — with correct chemical synonym handling — takes multiple days per matter.",
      },
      {
        title: "1-Month FTO Turnaround",
        desc: "Traditional Freedom-to-Operate analysis is a bottleneck for startup clients who need answers in days, not weeks.",
      },
      {
        title: "No Materials Domain Expertise Built In",
        desc: "General-purpose patent tools don't understand that 'cubic perovskite' and 'ABO₃ structure' can refer to the same claim scope.",
      },
    ],
    solutions: [
      {
        title: "125M+ Patents, Materials-Aware Search",
        desc: "AI query scoping automatically expands searches to include synonyms, IUPAC names, CAS numbers, and structural equivalents.",
      },
      {
        title: "Overnight FTO Assessment",
        desc: "Deep Scan delivers a structured FTO report — claim-by-claim analysis, risk rating, and white-space map — by the next morning.",
      },
      {
        title: "7 Materials Categories",
        desc: "Specialised search across composites, polymers, ceramics, semiconductors, biomaterials, coatings, and metals.",
      },
    ],
    features: [
      {
        icon: "Shield",
        title: "IP Radar",
        desc: "Semantic patent search across 125M+ documents. AI query agent auto-scopes to the right chemical terminology.",
      },
      {
        icon: "FileSearch",
        title: "Deep Scan",
        desc: "Structured FTO report with claim-by-claim breakdown, prior art timeline, and freedom-to-operate risk rating.",
      },
      {
        icon: "Map",
        title: "White Space Detection",
        desc: "Visualise gaps in the IP landscape — unclaimed compositions, process windows, or applications — for offensive prosecution.",
      },
      {
        icon: "FolderOpen",
        title: "Matter Export",
        desc: "Export patent results and FTO summaries as PDF or CSV for docketing and client deliverables.",
      },
    ],
    testimonial: {
      quote:
        "The AI query scoping is the real differentiator. It surfaced six relevant prior art references that keyword search missed entirely. My client avoided a costly prosecution mistake.",
      name: "Catherine O'Brien",
      role: "Partner, IP Practice",
      org: "Harrington & Cross LLP",
    },
    pricing: {
      tier: "Enterprise",
      price: "$499",
      period: "/month",
      highlight: "Unlimited IP Radar · Deep Scan credits · White-label reports",
      cta: "Book a demo",
      href: "/register",
    },
  },
  {
    slug: "ai-researchers",
    label: "AI & ML Researchers",
    icon: "Brain",
    iconColor: "text-indigo-500",
    gradientFrom: "from-indigo-600",
    gradientTo: "to-blue-500",
    accentColor: "indigo",
    tagline: "For AI & ML Researchers",
    headline: "Production-Ready Materials Datasets — Out of the Box",
    subheadline:
      "Stop spending weeks wrangling raw database exports. MatCraft gives you 205,000+ materials with 30+ clean, normalised properties accessible via REST API, CSV, or JSON.",
    cardDesc:
      "205k+ clean materials with 30+ normalised properties via REST API, CSV, and JSON export.",
    pains: [
      {
        title: "Raw Database Exports Are a Mess",
        desc: "MP, AFLOW, and JARVIS use different property names, units, and null conventions. Harmonising them for a training set takes weeks.",
      },
      {
        title: "No Standard Train/Test Splits",
        desc: "Without community-standard splits, benchmark comparisons across papers are meaningless — everyone uses different subsets.",
      },
      {
        title: "Property Coverage is Uneven",
        desc: "You need band gap, formation energy, elastic moduli, and magnetic moment — but no single database has all four for the same set of materials.",
      },
    ],
    solutions: [
      {
        title: "Normalised, Multi-Source Data",
        desc: "205,000+ entries with consistent property names, SI units, and explicit nulls. Ready to load into PyTorch or TensorFlow.",
      },
      {
        title: "30+ Properties per Material",
        desc: "Band gap, formation energy, elastic moduli, density, crystal system, space group, and more — all in one response payload.",
      },
      {
        title: "API + Bulk Export",
        desc: "Pull individual materials via REST API or export filtered datasets as CSV or JSON for offline training.",
      },
    ],
    features: [
      {
        icon: "Code2",
        title: "REST API",
        desc: "Documented endpoints with Python and cURL examples. Returns JSON with full property payloads. Paginated bulk access supported.",
      },
      {
        icon: "Database",
        title: "30+ Normalised Properties",
        desc: "Band gap, formation energy, bulk modulus, shear modulus, Poisson ratio, density, magnetic moment, and more.",
      },
      {
        icon: "FileDown",
        title: "CSV / JSON Export",
        desc: "Filter by any property combination and export the resulting dataset. Ideal for training GNNs and transformers.",
      },
      {
        icon: "GitBranch",
        title: "Versioned Data",
        desc: "Track which database version your training set came from. Reproducible benchmarks require reproducible data sources.",
      },
    ],
    testimonial: {
      quote:
        "We trained our graph neural network on a MatCraft export and got our first publishable results in a week. Normally the data pipeline alone takes a month.",
      name: "Dr. Priya Menon",
      role: "Postdoctoral Researcher, ML for Materials",
      org: "Stanford SUNCAT Centre",
    },
    pricing: {
      tier: "Lab Pro",
      price: "$49",
      period: "/month",
      highlight: "Bulk API · Dataset export · 5 team seats",
      cta: "Start free trial",
      href: "/register",
    },
  },
  {
    slug: "pharma-biotech",
    label: "Pharma & Biotech",
    icon: "Pill",
    iconColor: "text-rose-500",
    gradientFrom: "from-rose-500",
    gradientTo: "to-pink-400",
    accentColor: "rose",
    tagline: "For Pharma & Biotech",
    headline: "Screen Biomaterials and Drug Delivery Carriers in Minutes",
    subheadline:
      "Filter 205,000+ materials by biocompatible elements, screen Mg/Ca/Ti alloys for implants, and explore polymer carriers for nanoparticle drug delivery — all without a single lab run.",
    cardDesc:
      "Filter by biocompatible elements, screen implant alloys, and explore nanoparticle carriers computationally.",
    pains: [
      {
        title: "Biomaterial Screening is Tedious",
        desc: "Identifying candidate scaffolds or implant alloys from literature requires manual cross-referencing of biocompatibility data, mechanical properties, and degradation rates.",
      },
      {
        title: "Drug Delivery Material Selection is Ad Hoc",
        desc: "Choosing polymer carriers and nanoparticle scaffolds for encapsulation is largely experience-driven — systematic computational screening doesn't exist in most workflows.",
      },
      {
        title: "No Element-Level Safety Filter",
        desc: "General materials databases don't support filtering by biological safety of constituent elements, making it hard to identify non-toxic candidate compositions quickly.",
      },
    ],
    solutions: [
      {
        title: "Element-Level Filter",
        desc: "Restrict search to materials composed exclusively of biocompatible elements (C, H, N, O, Ca, Mg, Ti, Zn, Fe). Exclude toxic heavy metals instantly.",
      },
      {
        title: "Implant Alloy Screening",
        desc: "Filter Ti, Mg, and Co-Cr alloys by elastic modulus (bone-matching), density, and corrosion stability for orthopaedic and dental applications.",
      },
      {
        title: "Nanoparticle Builder",
        desc: "Carve spherical and cubic nanoparticles from any crystal structure. Ideal for modelling drug loading and surface functionalisation geometry.",
      },
    ],
    features: [
      {
        icon: "Filter",
        title: "Biocompatible Element Filter",
        desc: "One toggle to restrict the entire 205k database to materials containing only biologically safe elements.",
      },
      {
        icon: "Activity",
        title: "Property-Based Screening",
        desc: "Filter by elastic modulus (stiffness matching), density, band gap (for photodynamic therapy), and formation energy (stability).",
      },
      {
        icon: "Layers",
        title: "Nanoparticle Carver",
        desc: "Shape any crystal into a spherical or cubic nanoparticle of specified radius. Inspect surface termination and coordination numbers.",
      },
      {
        icon: "FileDown",
        title: "Export for MD Simulation",
        desc: "Export nanoparticle and scaffold geometries as LAMMPS or XYZ files ready for molecular dynamics in GROMACS or NAMD.",
      },
    ],
    testimonial: {
      quote:
        "We screened 400 Mg alloy compositions for biodegradable bone screws in a single afternoon. MatCraft replaced two months of literature curation and got us to preclinical candidates faster.",
      name: "Dr. Fatima Al-Rashid",
      role: "Head of Biomaterials R&D",
      org: "OsseoTherapeutics Inc.",
    },
    pricing: {
      tier: "Lab Pro",
      price: "$49",
      period: "/month",
      highlight: "Unlimited search · Nanoparticle builder · API access",
      cta: "Start free trial",
      href: "/register",
    },
  },
  {
    slug: "academia-labs",
    label: "Academic Labs & Institutes",
    icon: "Building2",
    iconColor: "text-teal-500",
    gradientFrom: "from-teal-600",
    gradientTo: "to-cyan-500",
    accentColor: "teal",
    tagline: "For Academic Labs & Institutes",
    headline: "One Platform for Your Entire Research Lab",
    subheadline:
      "Stop juggling VESTA, ICSD, your own Python scripts, and three different visualisation tools. MatCraft unifies search, structure editing, electronic analysis, and IP scouting — free for academics.",
    cardDesc:
      "Everything in one browser tab — free for academics, with proper DOI citations and Jupyter export.",
    pains: [
      {
        title: "Tool Sprawl Wastes Time",
        desc: "A typical computational lab uses 4-6 separate tools for structure visualisation, property search, plotting, and export — each with its own login and file format.",
      },
      {
        title: "Expensive Group Licences",
        desc: "Research group licences for commercial materials databases and visualisation software consume a significant share of grant budgets every year.",
      },
      {
        title: "No Reproducible Data Citations",
        desc: "Citing which version of a database a property value came from is critical for reproducibility — but most tools make this impossible to track.",
      },
    ],
    solutions: [
      {
        title: "Everything in One Tab",
        desc: "Search, view 3D structures, plot band structures, compare materials, and export — all without leaving the browser.",
      },
      {
        title: "Free for Academics",
        desc: "The Researcher plan is free forever. Academic groups get Lab Pro features at no cost during the beta programme.",
      },
      {
        title: "Proper DOI Citations",
        desc: "Every material page includes a formatted citation with database version and retrieval date. Copy BibTeX with one click.",
      },
    ],
    features: [
      {
        icon: "LayoutDashboard",
        title: "Unified Workspace",
        desc: "Search, structure viewer, property plots, and comparator all in one application. No context-switching between tools.",
      },
      {
        icon: "FileCode",
        title: "Jupyter Export",
        desc: "Export any material or dataset as a Jupyter notebook pre-loaded with property data, structure, and plotting code.",
      },
      {
        icon: "BookMarked",
        title: "DOI & BibTeX Citations",
        desc: "Machine-readable citations on every material page — track exactly where each property value came from for reproducible science.",
      },
      {
        icon: "Lock",
        title: "GDPR-Compliant",
        desc: "All data processing is EU-GDPR compliant. No personal research data is ever sold or used for third-party training.",
      },
    ],
    testimonial: {
      quote:
        "My group used to maintain three separate Python scripts just to pull data from different databases. MatCraft replaced all of them and our students actually use it because it's intuitive.",
      name: "Prof. Erik Lindqvist",
      role: "Principal Investigator",
      org: "Functional Nanomaterials Lab, KTH Royal Institute of Technology",
    },
    pricing: {
      tier: "Free for Academics",
      price: "$0",
      period: "during beta",
      highlight: "Full Lab Pro access · DOI citations · Jupyter export",
      cta: "Apply for academic access",
      href: "/register",
    },
  },
];

export function getPersona(slug: string): Persona | undefined {
  return PERSONAS.find((p) => p.slug === slug);
}
