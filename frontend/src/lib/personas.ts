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

/**
 * Real-money pricing table rendered on persona pages.
 * Every `sku` MUST match the backend key in
 * backend/app/api/v1/endpoints/stripe_payments.py (CREDIT_PACKAGES /
 * SUBSCRIPTION_PLANS). Drift returns 400 "Unknown package".
 */
export interface PersonaPricingTier {
  sku?: string;                  // backend SKU (omit for "Free" row)
  name: string;
  price: string;                 // display price, e.g. "$49" or "Free"
  period?: string;               // "/mo", "one-time", etc.
  perCredit?: string;            // effective unit rate, for nerds
  billing: "free" | "one-time" | "subscription";
  credits: string;               // "10 starter credits", "50 / mo", etc.
  features: string[];            // bullet list on the card
  recommended?: boolean;         // highlight + scale up
  whyForYou: string;             // persona-tailored reason for this tier
  cta: string;
  href: string;                  // /register, /pricing, /register?plan=xxx
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
  pricing: PersonaPricing;             // legacy single-tier callout (kept for compat)
  pricingTable: PersonaPricingTier[];  // 3-tier comparison, rendered on the page
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
    pricingTable: [
      {
        name: "Free",
        price: "$0",
        period: "forever",
        billing: "free",
        credits: "10 signup credits · rolls over",
        features: [
          "Materials search (205k+)",
          "3D structure viewer & exports (CIF, POSCAR, XYZ)",
          "Band structures & DOS plots",
          "Community support",
        ],
        whyForYou:
          "Use this to decide if MatCraft replaces your ICSD/VESTA workflow before committing any cash.",
        cta: "Create free account",
        href: "/register",
      },
      {
        sku: "researcher_monthly",
        name: "Researcher",
        price: "$49",
        period: "/mo",
        perCredit: "$0.98 / credit",
        billing: "subscription",
        credits: "50 credits / month · rolls 30 days",
        recommended: true,
        features: [
          "Everything in Free",
          "IP Radar searches & AI inverse design",
          "Active-learning campaigns (NSGA-II Pareto)",
          "Email support (24h SLA)",
        ],
        whyForYou:
          "Modal tier for an active PhD / postdoc — covers the monthly screening budget without lab-software price tags.",
        cta: "Start Researcher →",
        href: "/register?plan=researcher_monthly",
      },
      {
        sku: "professional_monthly",
        name: "Professional",
        price: "$149",
        period: "/mo",
        perCredit: "$0.75 / credit",
        billing: "subscription",
        credits: "200 credits / month · pooled across seats",
        features: [
          "Everything in Researcher",
          "REST API (60 req/min)",
          "Deep Scan with 24h SLA",
          "Priority support (4h SLA)",
        ],
        whyForYou:
          "Drop-in upgrade when your group moves from individual research to a shared lab pipeline.",
        cta: "Try Professional →",
        href: "/register?plan=professional_monthly",
      },
    ],
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
    pricingTable: [
      {
        name: "Free",
        price: "$0",
        period: "forever",
        billing: "free",
        credits: "10 signup credits",
        features: [
          "Full 16-property filter panel",
          "Scatter plot explorer",
          "Materials comparator (up to 5)",
          "CSV export of filtered results",
        ],
        whyForYou:
          "Validate the tool on a single spec sheet before putting it on the BOM workflow.",
        cta: "Start free",
        href: "/register",
      },
      {
        sku: "pro_50",
        name: "Pro Pack",
        price: "$99",
        period: "one-time",
        perCredit: "$1.98 / credit",
        billing: "one-time",
        credits: "50 credits · valid 12 months",
        recommended: true,
        features: [
          "Everything in Free",
          "50 IP Radar searches for spec-matching",
          "Or 5 Deep Scans for FTO review",
          "No recurring charge — pay as you use",
        ],
        whyForYou:
          "Engineers don't buy subscriptions for ad-hoc selection work — this pack covers a full NPI cycle.",
        cta: "Buy Pro Pack →",
        href: "/register?pack=pro_50",
      },
      {
        sku: "professional_monthly",
        name: "Professional",
        price: "$149",
        period: "/mo",
        perCredit: "$0.75 / credit",
        billing: "subscription",
        credits: "200 credits / mo · team seats",
        features: [
          "Everything in Pro Pack, monthly",
          "REST API for direct CAD integration",
          "Campaign engine for multi-objective search",
          "Priority support (4h SLA)",
        ],
        whyForYou:
          "If you run ≥3 parallel programs, the subscription $0.75/credit beats one-off $1.98 purchases.",
        cta: "Try Professional →",
        href: "/register?plan=professional_monthly",
      },
    ],
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
    pricingTable: [
      {
        name: "Free — Student",
        price: "$0",
        period: "forever",
        billing: "free",
        credits: "10 signup credits · no card",
        recommended: true,
        features: [
          "Materials search (205k+)",
          "3D crystal builder with 20+ prototypes",
          "Band structures & DOS",
          "All exports (CIF, POSCAR, XYZ, BibTeX)",
        ],
        whyForYou:
          "Coursework and thesis projects never need more than this tier. Assign homework freely.",
        cta: "Create free account",
        href: "/register",
      },
      {
        sku: "starter_10",
        name: "Starter Pack",
        price: "$29",
        period: "one-time",
        perCredit: "$2.90 / credit",
        billing: "one-time",
        credits: "10 credits · valid 12 months",
        features: [
          "Everything in Free",
          "10 IP Radar searches for your dissertation",
          "Or 1 mid-size Deep Scan for prior art review",
          "No subscription — buy once, use anywhere",
        ],
        whyForYou:
          "When your thesis defence needs a patent landscape chart, buy exactly what you need.",
        cta: "Get 10 credits →",
        href: "/register?pack=starter_10",
      },
      {
        name: "Educator programme",
        price: "$0",
        period: "for classrooms",
        billing: "free",
        credits: "Pooled class credits on request",
        features: [
          "Free Professional-tier access for verified educators",
          "Classroom dashboard (students, assignments, progress)",
          "Bulk account provisioning (CSV or .edu SSO)",
          "DOI citations + Jupyter notebook exports",
        ],
        whyForYou:
          "Teach 205k real materials instead of 4 textbook cases — we cover credits for your class.",
        cta: "Apply for access",
        href: "mailto:education@matcraft.ai?subject=Educator%20programme",
      },
    ],
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
    pricingTable: [
      {
        sku: "starter_10",
        name: "Starter Pack",
        price: "$29",
        period: "one-time",
        perCredit: "$2.90 / credit",
        billing: "one-time",
        credits: "10 credits",
        features: [
          "10 IP Radar searches pre-diligence",
          "Validate the FTO workflow on 1 real chemistry",
          "No subscription commitment",
          "Credits valid 12 months",
        ],
        whyForYou:
          "The cheapest insurance before your next investor call asks about Freedom-to-Operate.",
        cta: "Buy Starter →",
        href: "/register?pack=starter_10",
      },
      {
        sku: "deep_scan_pack_50",
        name: "Deep Scan Bundle",
        price: "$199",
        period: "one-time",
        perCredit: "$39.80 / scan",
        billing: "one-time",
        credits: "5 large FTO scans",
        recommended: true,
        features: [
          "5× Deep Scan FTO reports (2,000 patents each)",
          "Directive-aware AI ranking",
          "Exportable JSON + exec summary for investor pack",
          "Stored 12 months for re-run with fresh corpora",
        ],
        whyForYou:
          "One Deep Scan for the Monday investor call + 4 in reserve for every term-sheet DD. Replaces a $30–100k law-firm FTO at 300× the speed.",
        cta: "Buy Deep Scan Bundle →",
        href: "/register?pack=deep_scan_pack_50",
      },
      {
        sku: "professional_monthly",
        name: "Professional",
        price: "$149",
        period: "/mo",
        perCredit: "$0.75 / credit",
        billing: "subscription",
        credits: "200 credits / mo",
        features: [
          "REST API for product-integrated searches",
          "Unlimited materials data + campaigns",
          "Deep Scan with 24h SLA",
          "Priority support (4h SLA)",
        ],
        whyForYou:
          "When your product roadmap depends on continuous IP awareness — e.g., compound-library screeners or materials-aware SaaS.",
        cta: "Try Professional →",
        href: "/register?plan=professional_monthly",
      },
    ],
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
    pricingTable: [
      {
        sku: "deep_scan_pack_50",
        name: "Deep Scan Bundle",
        price: "$199",
        period: "one-time",
        perCredit: "$39.80 / scan",
        billing: "one-time",
        credits: "5 large FTO scans",
        features: [
          "Per-matter budget — bill directly to the client file",
          "Claim-by-claim AI analysis on 2,000 patents / scan",
          "Exportable PDF/JSON for docket files",
          "Materials-aware synonym expansion (IUPAC + CAS)",
        ],
        whyForYou:
          "Drop-in replacement for the $5-10k preliminary FTO you'd otherwise bill your startup client — at 20× the turnaround.",
        cta: "Buy Bundle →",
        href: "/register?pack=deep_scan_pack_50",
      },
      {
        sku: "professional_monthly",
        name: "Professional",
        price: "$149",
        period: "/mo",
        perCredit: "$0.75 / credit",
        billing: "subscription",
        credits: "200 credits / mo",
        recommended: true,
        features: [
          "200 IP Radar + Deep Scan credits / mo",
          "REST API for Foundation / Relativity integration",
          "White-space detection for offensive prosecution",
          "4h priority support SLA",
        ],
        whyForYou:
          "Modal tier for a solo practitioner or small IP boutique running 10–20 active matters.",
        cta: "Try Professional →",
        href: "/register?plan=professional_monthly",
      },
      {
        sku: "enterprise_monthly",
        name: "Enterprise",
        price: "$499",
        period: "/mo",
        perCredit: "$0.50 / credit",
        billing: "subscription",
        credits: "1,000 credits / mo · pooled",
        features: [
          "Unlimited seats across the IP practice",
          "White-label PDF reports with firm letterhead",
          "SSO (Google / Azure AD / Okta)",
          "Dedicated CSM + 99.9% SLA + DPA",
        ],
        whyForYou:
          "For AmLaw 100 or full-service IP boutiques — credits pooled across associates, one MSA for the firm.",
        cta: "Book a demo",
        href: "mailto:sales@matcraft.ai?subject=Enterprise%20demo%20(IP%20firm)",
      },
    ],
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
    pricingTable: [
      {
        name: "Free",
        price: "$0",
        period: "forever",
        billing: "free",
        credits: "10 signup credits",
        features: [
          "Materials search + 30+ normalised properties",
          "Up to 1,000 rows per CSV export",
          "Versioned data (DB snapshot hash on every export)",
          "Public Python + cURL examples",
        ],
        whyForYou:
          "Benchmark a proof-of-concept GNN on a real dataset before asking for budget.",
        cta: "Start free",
        href: "/register",
      },
      {
        sku: "researcher_monthly",
        name: "Researcher",
        price: "$49",
        period: "/mo",
        perCredit: "$0.98 / credit",
        billing: "subscription",
        credits: "50 credits / month",
        recommended: true,
        features: [
          "REST API (60 req/min) + paginated bulk access",
          "JSON + CSV exports up to 50k rows",
          "Train/test split helpers on request",
          "Cancel any time — roll-over 30 days",
        ],
        whyForYou:
          "Modal tier for a postdoc or PhD training a property predictor. $49 beats the GPU-hour bill of rerunning a MP pull.",
        cta: "Start Researcher →",
        href: "/register?plan=researcher_monthly",
      },
      {
        sku: "professional_monthly",
        name: "Professional",
        price: "$149",
        period: "/mo",
        perCredit: "$0.75 / credit",
        billing: "subscription",
        credits: "200 credits / mo + bulk API",
        features: [
          "API (600 req/min) + parallel workers",
          "Full-database exports (205k rows)",
          "Versioned data with reproducible commit hashes",
          "Priority support (4h SLA)",
        ],
        whyForYou:
          "When your benchmark requires the full 205k corpus — or your lab is running 3+ predictors against our data.",
        cta: "Try Professional →",
        href: "/register?plan=professional_monthly",
      },
    ],
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
    pricingTable: [
      {
        sku: "researcher_monthly",
        name: "Researcher",
        price: "$49",
        period: "/mo",
        perCredit: "$0.98 / credit",
        billing: "subscription",
        credits: "50 credits / month",
        features: [
          "Biocompatible-element filter (C/H/N/O/Ca/Mg/Ti/Zn/Fe)",
          "Nanoparticle carver + LAMMPS/XYZ export",
          "Implant alloy screening (Ti/Mg/Co-Cr)",
          "Unlimited 3D viewer + structure exports",
        ],
        whyForYou:
          "Cost-equivalent to a single 1h consultancy call — covers a full preclinical screening cycle.",
        cta: "Start Researcher →",
        href: "/register?plan=researcher_monthly",
      },
      {
        sku: "professional_monthly",
        name: "Professional",
        price: "$149",
        period: "/mo",
        perCredit: "$0.75 / credit",
        billing: "subscription",
        credits: "200 credits / mo",
        recommended: true,
        features: [
          "Everything in Researcher",
          "REST API for in-silico screening pipelines",
          "Active-learning campaigns for carrier optimisation",
          "4h priority support SLA + onboarding call",
        ],
        whyForYou:
          "Modal tier for a biomaterials team — 200 credits covers ~40 parallel carrier evaluations per month.",
        cta: "Try Professional →",
        href: "/register?plan=professional_monthly",
      },
      {
        sku: "enterprise_monthly",
        name: "Enterprise",
        price: "$499",
        period: "/mo",
        perCredit: "$0.50 / credit",
        billing: "subscription",
        credits: "1,000 credits / mo · pooled",
        features: [
          "Unlimited team seats (SSO)",
          "99.9% uptime SLA + dedicated CSM",
          "Custom MSA, DPA, SOC2 evidence pack",
          "On-prem / VPC option for GxP-validated environments",
        ],
        whyForYou:
          "For large pharma R&D orgs that need GxP-adjacent data controls and pooled credits across multiple drug-delivery programmes.",
        cta: "Book a demo",
        href: "mailto:sales@matcraft.ai?subject=Enterprise%20demo%20(Pharma)",
      },
    ],
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
    pricingTable: [
      {
        name: "Free — Academic",
        price: "$0",
        period: "forever",
        billing: "free",
        credits: "10 signup credits + roll-over",
        recommended: true,
        features: [
          "Unified workspace (search + 3D + plots + comparator)",
          "DOI + BibTeX citations on every material",
          "Jupyter notebook export with property data pre-loaded",
          "GDPR-compliant — EU-only data processing option",
        ],
        whyForYou:
          "The default tier for every academic lab — coursework, thesis work, and most published studies fit here.",
        cta: "Create lab account",
        href: "/register",
      },
      {
        sku: "professional_monthly",
        name: "Lab Professional",
        price: "$149",
        period: "/mo",
        perCredit: "$0.75 / credit",
        billing: "subscription",
        credits: "200 credits / mo · shared by lab members",
        features: [
          "REST API for grant-funded data pipelines",
          "Campaign engine for multi-objective search",
          "Deep Scan credits for thesis IP reviews",
          "Priority support (4h SLA)",
        ],
        whyForYou:
          "When your group runs IP-Radar-heavy grant deliverables or publishes 5+ papers / yr using MatCraft data.",
        cta: "Apply to upgrade",
        href: "mailto:academic@matcraft.ai?subject=Lab%20Professional%20upgrade",
      },
      {
        name: "Institute licence",
        price: "Custom",
        period: "annual",
        billing: "subscription",
        credits: "Unlimited seats · pooled credits",
        features: [
          "Institute-wide SSO (eduGAIN, Shibboleth, SAML)",
          "Locked-in pricing for 3-year licence",
          "DPA + public-sector procurement docs on request",
          "Dedicated scientist CSM (PhD Materials)",
        ],
        whyForYou:
          "For universities or national labs — one invoice, unlimited student seats, and a named CSM who understands DFT.",
        cta: "Talk to academic sales",
        href: "mailto:institutes@matcraft.ai?subject=Institute%20licence",
      },
    ],
  },
];

export function getPersona(slug: string): Persona | undefined {
  return PERSONAS.find((p) => p.slug === slug);
}
