"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Droplets,
  Battery,
  Sun,
  Wind,
  FlaskConical,
  Atom,
  HardHat,
  Leaf,
  Sprout,
  Cpu,
  Shirt,
  ArrowRight,
  Sparkles,
  Target,
  Layers,
  Zap,
  Shield,
  Gem,
} from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DOMAINS = [
  {
    key: "water",
    name: "Water Filtration",
    icon: Droplets,
    gradient: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50",
    description:
      "Optimize membranes for contaminant rejection, permeability, and fouling resistance. Uses Donnan-steric pore models and Hagen-Poiseuille equations.",
    objectives: ["PFOS Rejection", "Permeability", "Fouling Resistance"],
    parameters: 5,
    example: "Nanofiltration membrane for PFAS removal",
  },
  {
    key: "battery",
    name: "Battery Materials",
    icon: Battery,
    gradient: "from-green-500 to-emerald-500",
    bg: "bg-green-50",
    description:
      "Design electrode and electrolyte materials for energy density, cycle life, and rate capability. Supports NMC cathodes, solid-state electrolytes, and anode materials.",
    objectives: ["Energy Density", "Cycle Retention", "Rate Capability"],
    parameters: 5,
    example: "NMC cathode composition optimization",
  },
  {
    key: "solar",
    name: "Solar Cells",
    icon: Sun,
    gradient: "from-amber-500 to-yellow-500",
    bg: "bg-amber-50",
    description:
      "Engineer photovoltaic absorbers for maximum efficiency and stability. Supports perovskite, organic, and tandem architectures.",
    objectives: ["Efficiency", "Stability", "Bandgap Match"],
    parameters: 4,
    example: "Perovskite composition for 25%+ efficiency",
  },
  {
    key: "co2",
    name: "CO2 Capture",
    icon: Wind,
    gradient: "from-teal-500 to-cyan-500",
    bg: "bg-teal-50",
    description:
      "Create sorbents and membranes for direct air capture and flue gas separation. Optimize capacity, selectivity, and regeneration energy.",
    objectives: ["CO2 Capacity", "Selectivity", "Regeneration Energy"],
    parameters: 4,
    example: "MOF-based sorbent for DAC",
  },
  {
    key: "catalyst",
    name: "Catalysis",
    icon: FlaskConical,
    gradient: "from-purple-500 to-violet-500",
    bg: "bg-purple-50",
    description:
      "Discover catalysts with optimal activity, selectivity, and durability for chemical reactions. Supports heterogeneous and homogeneous systems.",
    objectives: ["Conversion", "Selectivity", "Stability"],
    parameters: 4,
    example: "Fischer-Tropsch catalyst design",
  },
  {
    key: "hydrogen",
    name: "Hydrogen Storage",
    icon: Atom,
    gradient: "from-indigo-500 to-blue-500",
    bg: "bg-indigo-50",
    description:
      "Design metal hydrides and porous materials for high-capacity hydrogen storage with fast kinetics and low desorption temperatures.",
    objectives: ["Storage Capacity", "Kinetics", "Desorption Temp"],
    parameters: 4,
    example: "Mg-Ni alloy for 7 wt% H2",
  },
  {
    key: "construction",
    name: "Construction Materials",
    icon: HardHat,
    gradient: "from-orange-500 to-red-500",
    bg: "bg-orange-50",
    description:
      "Optimize concrete, composites, and coatings for strength, durability, and sustainability. Balance mechanical properties with environmental impact.",
    objectives: ["Compressive Strength", "Durability", "CO2 Footprint"],
    parameters: 5,
    example: "Low-carbon concrete mix design",
  },
  {
    key: "bio",
    name: "Biomaterials",
    icon: Leaf,
    gradient: "from-lime-500 to-green-500",
    bg: "bg-lime-50",
    description:
      "Engineer biocompatible materials for implants, tissue scaffolds, and drug delivery. Optimize biocompatibility, degradation rate, and mechanical properties.",
    objectives: ["Biocompatibility", "Degradation Rate", "Mechanical Strength"],
    parameters: 4,
    example: "Biodegradable polymer scaffold",
  },
  {
    key: "agri",
    name: "Agricultural Materials",
    icon: Sprout,
    gradient: "from-emerald-500 to-lime-500",
    bg: "bg-emerald-50",
    description:
      "Design controlled-release fertilizers, soil amendments, and crop protection materials with optimized nutrient delivery and environmental safety.",
    objectives: ["Release Profile", "Soil Health", "Efficiency"],
    parameters: 4,
    example: "Controlled-release nitrogen fertilizer",
  },
  {
    key: "electronics",
    name: "Electronics",
    icon: Cpu,
    gradient: "from-sky-500 to-blue-500",
    bg: "bg-sky-50",
    description:
      "Optimize semiconductor, dielectric, and thermal management materials for next-generation electronics with improved performance and reliability.",
    objectives: ["Conductivity", "Dielectric Constant", "Thermal Conductivity"],
    parameters: 5,
    example: "High-k dielectric for transistors",
  },
  {
    key: "textile",
    name: "Smart Textiles",
    icon: Shirt,
    gradient: "from-pink-500 to-rose-500",
    bg: "bg-pink-50",
    description:
      "Create functional fabrics with sensing, actuation, and adaptive properties. Balance technical performance with comfort and wearability.",
    objectives: ["Sensitivity", "Comfort Index", "Durability"],
    parameters: 4,
    example: "Piezoelectric fiber for wearable sensors",
  },
  {
    key: "thermoelectric",
    name: "Thermoelectrics",
    icon: Zap,
    gradient: "from-orange-500 to-red-500",
    bg: "bg-orange-50",
    description:
      "Optimize thermoelectric materials for efficient heat-to-electricity conversion. Maximize the figure of merit ZT by balancing Seebeck coefficient, electrical conductivity, and thermal conductivity.",
    objectives: ["Seebeck Coefficient", "Electrical Conductivity", "ZT Figure of Merit"],
    parameters: 5,
    example: "Bi2Te3-based alloy for waste heat recovery",
  },
  {
    key: "superconductor",
    name: "Superconductors",
    icon: Atom,
    gradient: "from-sky-500 to-indigo-500",
    bg: "bg-sky-50",
    description:
      "Discover high-temperature superconducting materials with elevated critical temperatures, high current densities, and practical magnetic field tolerances.",
    objectives: ["Critical Temperature", "Current Density", "Field Tolerance"],
    parameters: 4,
    example: "YBCO-based high-Tc superconductor",
  },
  {
    key: "polymer",
    name: "Polymers & Plastics",
    icon: Layers,
    gradient: "from-violet-500 to-purple-500",
    bg: "bg-violet-50",
    description:
      "Design sustainable polymers and plastics with optimized mechanical strength, biodegradability, and processability for packaging, structural, and biomedical applications.",
    objectives: ["Tensile Strength", "Biodegradability", "Processability"],
    parameters: 5,
    example: "PLA-blend for biodegradable packaging",
  },
  {
    key: "coating",
    name: "Coatings & Thin Films",
    icon: Shield,
    gradient: "from-slate-500 to-gray-600",
    bg: "bg-slate-50",
    description:
      "Engineer protective and functional coatings with optimized hardness, adhesion, corrosion resistance, and optical properties for industrial and consumer applications.",
    objectives: ["Hardness", "Adhesion Strength", "Corrosion Resistance"],
    parameters: 5,
    example: "TiN-based wear-resistant coating",
  },
  {
    key: "ceramic",
    name: "Advanced Ceramics",
    icon: Gem,
    gradient: "from-rose-500 to-pink-500",
    bg: "bg-rose-50",
    description:
      "Optimize advanced ceramics for extreme environments with high fracture toughness, thermal shock resistance, and chemical stability for aerospace, energy, and biomedical uses.",
    objectives: ["Fracture Toughness", "Thermal Shock Resistance", "Density"],
    parameters: 4,
    example: "Zirconia-toughened alumina for implants",
  },
];

export default function DomainsPage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-16 bg-gradient-to-b from-purple-50/50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-sm font-medium border border-purple-200 mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              16 Domains
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Materials Science <span className="gradient-text">Domains</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              MatForge supports optimization across 16 materials science domains,
              each with domain-specific physics models and parameter spaces.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Domains */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {DOMAINS.map((domain, i) => {
              const Icon = domain.icon;
              return (
                <motion.div
                  key={domain.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        {/* Icon side */}
                        <div
                          className={`md:w-48 p-6 flex flex-col items-center justify-center ${domain.bg} border-b md:border-b-0 md:border-r`}
                        >
                          <div
                            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${domain.gradient} flex items-center justify-center shadow-lg mb-3`}
                          >
                            <Icon className="h-7 w-7 text-white" />
                          </div>
                          <h3 className="font-bold text-center">{domain.name}</h3>
                        </div>

                        {/* Content side */}
                        <div className="flex-1 p-6">
                          <p className="text-sm text-muted-foreground mb-4">
                            {domain.description}
                          </p>

                          <div className="flex flex-wrap gap-4 mb-4">
                            <div className="flex items-center gap-1.5">
                              <Target className="h-3.5 w-3.5 text-blue-500" />
                              <span className="text-xs text-muted-foreground">
                                {domain.objectives.length} Objectives
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Layers className="h-3.5 w-3.5 text-purple-500" />
                              <span className="text-xs text-muted-foreground">
                                {domain.parameters} Parameters
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {domain.objectives.map((obj) => (
                              <Badge
                                key={obj}
                                variant="secondary"
                                className="text-[10px]"
                              >
                                {obj}
                              </Badge>
                            ))}
                          </div>

                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Example:</span>{" "}
                            {domain.example}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Optimize?
          </h2>
          <p className="text-blue-100 mb-6">
            Choose your domain and launch a campaign in under 2 minutes.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-blue-600"
            >
              <Link href="/register">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
