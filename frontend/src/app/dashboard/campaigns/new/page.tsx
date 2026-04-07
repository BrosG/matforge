"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
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
  Shield,
  Layers,
  Target,
  Gem,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Sparkles,
  Settings2,
  Code2,
  Rocket,
  Info,
  Zap,
  Brain,
  Dna,
  BarChart3,
  Gauge,
  Network,
} from "lucide-react";
import { api } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { DOMAIN_LABELS, type Domain } from "@/types/campaign";

/* ------------------------------------------------------------------ */
/* Domain configuration                                                */
/* ------------------------------------------------------------------ */

const DOMAIN_CONFIG: Record<
  Domain,
  { icon: React.ElementType; color: string; gradient: string; description: string }
> = {
  water: {
    icon: Droplets,
    color: "text-blue-500",
    gradient: "from-blue-500 to-cyan-500",
    description: "Optimize water filtration membranes for rejection, permeability, and fouling resistance",
  },
  battery: {
    icon: Battery,
    color: "text-green-500",
    gradient: "from-green-500 to-emerald-500",
    description: "Design battery electrode materials for energy density, cycle life, and charge rate",
  },
  solar: {
    icon: Sun,
    color: "text-amber-500",
    gradient: "from-amber-500 to-yellow-500",
    description: "Engineer photovoltaic materials for efficiency, stability, and bandgap tuning",
  },
  co2: {
    icon: Wind,
    color: "text-teal-500",
    gradient: "from-teal-500 to-cyan-500",
    description: "Create sorbents and membranes for CO2 capture capacity and selectivity",
  },
  catalyst: {
    icon: FlaskConical,
    color: "text-purple-500",
    gradient: "from-purple-500 to-violet-500",
    description: "Discover catalysts optimizing activity, selectivity, and durability",
  },
  hydrogen: {
    icon: Atom,
    color: "text-indigo-500",
    gradient: "from-indigo-500 to-blue-500",
    description: "Design hydrogen storage materials for capacity, kinetics, and operating conditions",
  },
  construction: {
    icon: HardHat,
    color: "text-orange-500",
    gradient: "from-orange-500 to-red-500",
    description: "Optimize construction materials for strength, durability, and sustainability",
  },
  bio: {
    icon: Leaf,
    color: "text-lime-500",
    gradient: "from-lime-500 to-green-500",
    description: "Engineer biocompatible materials for tissue engineering and drug delivery",
  },
  agri: {
    icon: Sprout,
    color: "text-emerald-500",
    gradient: "from-emerald-500 to-lime-500",
    description: "Design agricultural materials for soil health and controlled release",
  },
  electronics: {
    icon: Cpu,
    color: "text-sky-500",
    gradient: "from-sky-500 to-blue-500",
    description: "Optimize electronic materials for conductivity, dielectric, and thermal properties",
  },
  textile: {
    icon: Shirt,
    color: "text-pink-500",
    gradient: "from-pink-500 to-rose-500",
    description: "Create smart textiles with sensing, actuation, and comfort properties",
  },
  thermoelectric: {
    icon: Zap,
    color: "text-orange-500",
    gradient: "from-orange-500 to-red-500",
    description: "Optimize thermoelectric materials for heat-to-electricity conversion and ZT figure of merit",
  },
  superconductor: {
    icon: Atom,
    color: "text-sky-500",
    gradient: "from-sky-500 to-indigo-500",
    description: "Discover high-Tc superconductors with elevated critical temperature and current density",
  },
  polymer: {
    icon: Layers,
    color: "text-violet-500",
    gradient: "from-violet-500 to-purple-500",
    description: "Design sustainable polymers optimizing strength, biodegradability, and processability",
  },
  coating: {
    icon: Shield,
    color: "text-slate-500",
    gradient: "from-slate-500 to-gray-600",
    description: "Engineer protective coatings for hardness, adhesion, and corrosion resistance",
  },
  ceramic: {
    icon: Gem,
    color: "text-rose-500",
    gradient: "from-rose-500 to-pink-500",
    description: "Optimize advanced ceramics for fracture toughness, thermal shock resistance, and density",
  },
};

/* ------------------------------------------------------------------ */
/* YAML templates                                                      */
/* ------------------------------------------------------------------ */

const DOMAIN_TEMPLATES: Partial<Record<Domain, string>> = {
  water: `name: Water Filtration Membrane
domain: water
version: "1.0"
description: Optimize PFOS rejection membrane with permeability and fouling trade-offs

parameters:
  - name: pore_diameter
    range: [0.5, 5.0]
    unit: nm
    description: Average pore diameter of the membrane
  - name: active_layer_thickness
    range: [50.0, 500.0]
    unit: nm
    description: Thickness of the active separation layer
  - name: surface_charge_density
    range: [-50.0, 0.0]
    unit: mC/m2
    description: Surface charge density (negative for cation rejection)
  - name: crosslink_density
    range: [0.1, 0.9]
    unit: fraction
    description: Degree of polymer crosslinking
  - name: hydrophilicity
    range: [30.0, 90.0]
    unit: degrees
    description: Contact angle (lower = more hydrophilic)

objectives:
  - name: pfos_rejection
    direction: maximize
    unit: "%"
    equation: "water.pfos_rejection"
  - name: permeability
    direction: maximize
    unit: LMH/bar
    equation: "water.permeability"
  - name: fouling_resistance
    direction: maximize
    unit: score
    equation: "water.fouling_resistance"

constraints:
  - expression: "pfos_rejection >= 90.0"
    description: Minimum PFOS rejection requirement`,

  battery: `name: Lithium-Ion Electrode Material
domain: battery
version: "1.0"
description: Optimize cathode composition for energy density and cycle stability

parameters:
  - name: nickel_ratio
    range: [0.3, 0.9]
    unit: fraction
    description: Nickel content in NMC cathode
  - name: manganese_ratio
    range: [0.05, 0.4]
    unit: fraction
    description: Manganese content for structural stability
  - name: cobalt_ratio
    range: [0.05, 0.3]
    unit: fraction
    description: Cobalt content for rate capability
  - name: particle_size
    range: [1.0, 20.0]
    unit: um
    description: Average particle diameter
  - name: calcination_temp
    range: [700.0, 950.0]
    unit: C
    description: Calcination temperature

objectives:
  - name: energy_density
    direction: maximize
    unit: Wh/kg
  - name: cycle_retention
    direction: maximize
    unit: "%"
  - name: rate_capability
    direction: maximize
    unit: "%"`,

  solar: `name: Perovskite Solar Cell
domain: solar
version: "1.0"
description: Optimize perovskite composition for efficiency and stability

parameters:
  - name: lead_ratio
    range: [0.5, 1.0]
    unit: fraction
    description: Lead content in ABX3
  - name: tin_ratio
    range: [0.0, 0.5]
    unit: fraction
    description: Tin substitution ratio
  - name: halide_ratio
    range: [0.0, 1.0]
    unit: fraction
    description: Iodide to bromide ratio
  - name: film_thickness
    range: [200.0, 800.0]
    unit: nm
    description: Active layer thickness

objectives:
  - name: efficiency
    direction: maximize
    unit: "%"
  - name: stability
    direction: maximize
    unit: hours
  - name: bandgap
    direction: minimize
    unit: eV`,
};

/* ------------------------------------------------------------------ */
/* Engine configuration types                                          */
/* ------------------------------------------------------------------ */

type OptimizationStrategy = "surrogate_al" | "bayesian_opt" | "reinforcement_learning";
type SurrogateArch = "mlp_2x64" | "mlp_3x128" | "mlp_4x256";
type AcquisitionFn = "max_uncertainty" | "expected_improvement" | "ucb" | "thompson";
type OptimizerAlgo = "cmaes" | "nsga2";

interface EngineConfig {
  strategy: OptimizationStrategy;
  surrogate: {
    architecture: SurrogateArch;
    learningRate: number;
    epochs: number;
    mcSamples: number;
    dropout: number;
  };
  optimizer: {
    algorithm: OptimizerAlgo;
    sigma0: number;
    maxGenerations: number;
    populationScale: number;
  };
  activeLearning: {
    acquisition: AcquisitionFn;
    initialSamples: number;
    samplesPerRound: number;
    explorationWeight: number;
  };
}

const DEFAULT_ENGINE: EngineConfig = {
  strategy: "surrogate_al",
  surrogate: {
    architecture: "mlp_2x64",
    learningRate: 0.001,
    epochs: 200,
    mcSamples: 20,
    dropout: 0.1,
  },
  optimizer: {
    algorithm: "cmaes",
    sigma0: 0.3,
    maxGenerations: 200,
    populationScale: 1.0,
  },
  activeLearning: {
    acquisition: "max_uncertainty",
    initialSamples: 20,
    samplesPerRound: 10,
    explorationWeight: 0.5,
  },
};

const STRATEGY_OPTIONS: {
  key: OptimizationStrategy;
  label: string;
  icon: React.ElementType;
  gradient: string;
  description: string;
  badge: string;
}[] = [
  {
    key: "surrogate_al",
    label: "Surrogate + Active Learning",
    icon: Brain,
    gradient: "from-blue-500 to-purple-500",
    description:
      "MLP surrogate with MC Dropout uncertainty, CMA-ES optimizer, and active learning loop. Best for expensive evaluations.",
    badge: "Recommended",
  },
  {
    key: "bayesian_opt",
    label: "Bayesian Optimization",
    icon: BarChart3,
    gradient: "from-emerald-500 to-teal-500",
    description:
      "Gaussian Process surrogate with Expected Improvement acquisition. Best for low-dimensional (<10 params) problems.",
    badge: "Classic",
  },
  {
    key: "reinforcement_learning",
    label: "RL Agent (DQN Rainbow)",
    icon: Dna,
    gradient: "from-orange-500 to-rose-500",
    description:
      "Deep Q-Network with Rainbow enhancements (PER, Dueling, Noisy Nets, C51). Learns sequential composition strategies.",
    badge: "Experimental",
  },
];

const ARCH_OPTIONS: { key: SurrogateArch; label: string; desc: string }[] = [
  { key: "mlp_2x64", label: "MLP 2x64", desc: "2 hidden layers, 64 neurons each (fast)" },
  { key: "mlp_3x128", label: "MLP 3x128", desc: "3 hidden layers, 128 neurons (balanced)" },
  { key: "mlp_4x256", label: "MLP 4x256", desc: "4 hidden layers, 256 neurons (expressive)" },
];

const ACQUISITION_OPTIONS: { key: AcquisitionFn; label: string; desc: string }[] = [
  { key: "max_uncertainty", label: "Max Uncertainty", desc: "Explore regions where surrogate is least certain" },
  { key: "expected_improvement", label: "Expected Improvement", desc: "Balance exploration and exploitation" },
  { key: "ucb", label: "Upper Confidence Bound", desc: "Optimistic exploration with tunable confidence" },
  { key: "thompson", label: "Thompson Sampling", desc: "Probabilistic sampling from the posterior" },
];

/* ------------------------------------------------------------------ */
/* Helper: build YAML from engine config                               */
/* ------------------------------------------------------------------ */

function buildEngineYaml(engine: EngineConfig): string {
  const archMap: Record<SurrogateArch, string> = {
    mlp_2x64: "[64, 64]",
    mlp_3x128: "[128, 128, 128]",
    mlp_4x256: "[256, 256, 256, 256]",
  };

  return `
surrogate:
  hidden_layers: ${archMap[engine.surrogate.architecture]}
  learning_rate: ${engine.surrogate.learningRate}
  epochs: ${engine.surrogate.epochs}
  mc_samples: ${engine.surrogate.mcSamples}
  dropout: ${engine.surrogate.dropout}

optimizer:
  algorithm: ${engine.optimizer.algorithm}
  sigma0: ${engine.optimizer.sigma0}
  max_generations: ${engine.optimizer.maxGenerations}
  population_scale: ${engine.optimizer.populationScale}

active_learning:
  initial_samples: ${engine.activeLearning.initialSamples}
  samples_per_round: ${engine.activeLearning.samplesPerRound}
  acquisition: ${engine.activeLearning.acquisition}
  exploration_weight: ${engine.activeLearning.explorationWeight}`.trim();
}

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

const steps = [
  { id: "domain", label: "Domain", icon: Sparkles },
  { id: "details", label: "Details", icon: Settings2 },
  { id: "engine", label: "Engine", icon: Brain },
  { id: "definition", label: "Definition", icon: Code2 },
  { id: "launch", label: "Launch", icon: Rocket },
];

/* ------------------------------------------------------------------ */
/* Slider with label helper                                            */
/* ------------------------------------------------------------------ */

function ConfigSlider({
  label,
  value,
  onChange,
  min,
  max,
  step: stepVal,
  unit,
  accent = "blue",
  info,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
  accent?: string;
  info?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium">{label}</label>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
            className={`w-20 px-2 py-1 border rounded-lg text-center text-sm font-mono focus:outline-none focus:ring-2 focus:ring-${accent}-200`}
            step={stepVal}
            min={min}
            max={max}
          />
          {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={stepVal}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full accent-${accent}-500`}
      />
      <div className="flex justify-between mt-0.5">
        <span className="text-[10px] text-muted-foreground">{min}</span>
        {info && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Info className="h-2.5 w-2.5" />
            {info}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground">{max}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Campaign details
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState<Domain>("water");
  const [budget, setBudget] = useState(500);
  const [rounds, setRounds] = useState(15);
  const [autoRun, setAutoRun] = useState(true);

  // Engine config
  const [engine, setEngine] = useState<EngineConfig>(DEFAULT_ENGINE);

  // YAML (auto-populated from template + engine config)
  const [yaml, setYaml] = useState(DOMAIN_TEMPLATES.water || "");
  const [yamlDirty, setYamlDirty] = useState(false);

  const domainInfo = DOMAIN_CONFIG[domain];

  const updateEngine = (patch: Partial<EngineConfig>) => {
    setEngine((prev) => ({ ...prev, ...patch }));
  };
  const updateSurrogate = (patch: Partial<EngineConfig["surrogate"]>) => {
    setEngine((prev) => ({ ...prev, surrogate: { ...prev.surrogate, ...patch } }));
  };
  const updateOptimizer = (patch: Partial<EngineConfig["optimizer"]>) => {
    setEngine((prev) => ({ ...prev, optimizer: { ...prev.optimizer, ...patch } }));
  };
  const updateAL = (patch: Partial<EngineConfig["activeLearning"]>) => {
    setEngine((prev) => ({ ...prev, activeLearning: { ...prev.activeLearning, ...patch } }));
  };

  const handleDomainSelect = (d: Domain) => {
    setDomain(d);
    if (DOMAIN_TEMPLATES[d] && !yamlDirty) {
      setYaml(DOMAIN_TEMPLATES[d]!);
    }
    if (!name) {
      setName(`${DOMAIN_LABELS[d]} Optimization`);
    }
  };

  // When moving from engine step to definition step, inject engine config into YAML
  const handleEngineToDefinition = () => {
    if (!yamlDirty) {
      const template = DOMAIN_TEMPLATES[domain] || yaml;
      // Strip existing surrogate/optimizer/active_learning sections
      const stripped = template
        .replace(/\n\nsurrogate:[\s\S]*?(?=\n\n[a-z]|\n*$)/g, "")
        .replace(/\n\noptimizer:[\s\S]*?(?=\n\n[a-z]|\n*$)/g, "")
        .replace(/\n\nactive_learning:[\s\S]*?(?=\n\n[a-z]|\n*$)/g, "")
        .trimEnd();
      setYaml(`${stripped}\n\n${buildEngineYaml(engine)}`);
    }
  };

  const canProceed = useMemo(() => {
    switch (step) {
      case 0: return !!domain;
      case 1: return !!name;
      case 2: return true;
      case 3: return !!yaml;
      case 4: return true;
      default: return false;
    }
  }, [step, domain, name, yaml]);

  const handleNext = () => {
    if (step === 2) handleEngineToDefinition();
    setStep(step + 1);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const campaign = await api.campaigns.create({
        name,
        description: description || undefined,
        domain,
        definition_yaml: yaml,
        config: { budget, rounds },
      });
      if (autoRun) {
        await api.campaigns.run(campaign.id, { budget, rounds });
      }
      return campaign;
    },
    onSuccess: (campaign) => {
      router.push(`/dashboard/campaigns/${campaign.id}`);
    },
  });

  /* -------------------------------------------------------------- */
  /* Step renderers                                                   */
  /* -------------------------------------------------------------- */

  const renderStep = () => {
    switch (step) {
      /* ---- Step 1: Domain ---- */
      case 0:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Choose a Domain</CardTitle>
              <p className="text-sm text-muted-foreground">
                Select the materials science domain for your optimization campaign
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {(Object.entries(DOMAIN_CONFIG) as [Domain, (typeof DOMAIN_CONFIG)[Domain]][]).map(
                  ([key, config]) => {
                    const Icon = config.icon;
                    const isSelected = domain === key;
                    const hasTemplate = !!DOMAIN_TEMPLATES[key];
                    return (
                      <button
                        key={key}
                        onClick={() => handleDomainSelect(key)}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/50 shadow-sm"
                            : "border-gray-100 hover:border-gray-300"
                        }`}
                      >
                        {hasTemplate && (
                          <Badge
                            variant="secondary"
                            className="absolute top-2 right-2 text-[9px] px-1 py-0"
                          >
                            Template
                          </Badge>
                        )}
                        <div
                          className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center mb-3 shadow-sm`}
                        >
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <p className="font-medium text-sm">{DOMAIN_LABELS[key]}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {config.description}
                        </p>
                        {isSelected && (
                          <motion.div
                            layoutId="domain-check"
                            className="absolute top-3 left-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"
                          >
                            <Check className="h-3 w-3 text-white" />
                          </motion.div>
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            </CardContent>
          </Card>
        );

      /* ---- Step 2: Details ---- */
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-blue-500" />
                Campaign Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Selected domain summary */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border">
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${domainInfo.gradient} flex items-center justify-center`}
                >
                  {(() => {
                    const Icon = domainInfo.icon;
                    return <Icon className="h-4 w-4 text-white" />;
                  })()}
                </div>
                <div>
                  <p className="text-sm font-medium">{DOMAIN_LABELS[domain]}</p>
                  <p className="text-xs text-muted-foreground">{domainInfo.description}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Campaign Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Water Membrane Optimization v1"
                  className="w-full px-4 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Description
                  <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe the goal of this campaign..."
                  className="w-full px-4 py-2.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all resize-none"
                />
              </div>

              {/* Budget & Rounds */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <ConfigSlider
                  label="Evaluation Budget"
                  value={budget}
                  onChange={setBudget}
                  min={50}
                  max={5000}
                  step={50}
                  unit="evals"
                  accent="blue"
                  info="Total material evaluations"
                />
                <ConfigSlider
                  label="Learning Rounds"
                  value={rounds}
                  onChange={setRounds}
                  min={1}
                  max={50}
                  step={1}
                  unit="rounds"
                  accent="purple"
                  info="Active learning iterations"
                />
              </div>

              {/* Estimate */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/50 to-purple-50/50 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Estimation</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-blue-600">~{Math.round(budget / rounds)}</p>
                    <p className="text-[10px] text-muted-foreground">Evals per round</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-purple-600">{budget}</p>
                    <p className="text-[10px] text-muted-foreground">Total evaluations</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-emerald-600">{rounds}</p>
                    <p className="text-[10px] text-muted-foreground">Learning cycles</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      /* ---- Step 3: Engine Configuration ---- */
      case 2:
        return (
          <div className="space-y-6">
            {/* Optimization Strategy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-500" />
                  Optimization Strategy
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Choose the core optimization engine for material discovery
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {STRATEGY_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const selected = engine.strategy === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => updateEngine({ strategy: opt.key })}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                          selected
                            ? "border-blue-500 bg-blue-50/30 shadow-sm"
                            : "border-gray-100 hover:border-gray-300"
                        }`}
                      >
                        <Badge
                          variant={selected ? "default" : "secondary"}
                          className="absolute top-2 right-2 text-[9px]"
                        >
                          {opt.badge}
                        </Badge>
                        <div
                          className={`w-10 h-10 rounded-lg bg-gradient-to-br ${opt.gradient} flex items-center justify-center mb-3 shadow-sm`}
                        >
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <p className="font-medium text-sm pr-16">{opt.label}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {opt.description}
                        </p>
                        {selected && (
                          <motion.div
                            layoutId="strategy-check"
                            className="absolute bottom-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"
                          >
                            <Check className="h-3 w-3 text-white" />
                          </motion.div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Surrogate Model */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Network className="h-4 w-4 text-purple-500" />
                  Surrogate Model
                  <Badge variant="secondary" className="text-[9px] ml-auto">
                    {engine.strategy === "reinforcement_learning" ? "DQN Rainbow" : "MLP + MC Dropout"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Architecture */}
                <div>
                  <label className="block text-sm font-medium mb-2">Network Architecture</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ARCH_OPTIONS.map((arch) => (
                      <button
                        key={arch.key}
                        onClick={() => updateSurrogate({ architecture: arch.key })}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          engine.surrogate.architecture === arch.key
                            ? "border-purple-400 bg-purple-50"
                            : "border-gray-100 hover:border-gray-300"
                        }`}
                      >
                        <p className="font-mono text-sm font-medium">{arch.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{arch.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <ConfigSlider
                    label="Learning Rate"
                    value={engine.surrogate.learningRate}
                    onChange={(v) => updateSurrogate({ learningRate: v })}
                    min={0.0001}
                    max={0.01}
                    step={0.0001}
                    accent="purple"
                    info="Adam optimizer lr"
                  />
                  <ConfigSlider
                    label="Training Epochs"
                    value={engine.surrogate.epochs}
                    onChange={(v) => updateSurrogate({ epochs: v })}
                    min={50}
                    max={500}
                    step={10}
                    accent="purple"
                    info="Max epochs per round"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <ConfigSlider
                    label="MC Dropout Samples"
                    value={engine.surrogate.mcSamples}
                    onChange={(v) => updateSurrogate({ mcSamples: v })}
                    min={5}
                    max={50}
                    step={5}
                    accent="purple"
                    info="Uncertainty estimation"
                  />
                  <ConfigSlider
                    label="Dropout Rate"
                    value={engine.surrogate.dropout}
                    onChange={(v) => updateSurrogate({ dropout: v })}
                    min={0.0}
                    max={0.5}
                    step={0.05}
                    accent="purple"
                    info="Regularization"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Optimizer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gauge className="h-4 w-4 text-blue-500" />
                  Optimizer
                  <Badge variant="secondary" className="text-[9px] ml-auto">
                    {engine.optimizer.algorithm === "cmaes" ? "CMA-ES" : "NSGA-II"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2">Algorithm</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { key: "cmaes" as const, label: "CMA-ES", desc: "Covariance Matrix Adaptation. Best for continuous parameter spaces." },
                      { key: "nsga2" as const, label: "NSGA-II", desc: "Non-dominated Sorting GA. Best for many objectives (>3)." },
                    ]).map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => updateOptimizer({ algorithm: opt.key })}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          engine.optimizer.algorithm === opt.key
                            ? "border-blue-400 bg-blue-50"
                            : "border-gray-100 hover:border-gray-300"
                        }`}
                      >
                        <p className="font-mono text-sm font-medium">{opt.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <ConfigSlider
                    label="Initial Step Size (σ₀)"
                    value={engine.optimizer.sigma0}
                    onChange={(v) => updateOptimizer({ sigma0: v })}
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    accent="blue"
                    info="Larger = more exploration"
                  />
                  <ConfigSlider
                    label="Max Generations"
                    value={engine.optimizer.maxGenerations}
                    onChange={(v) => updateOptimizer({ maxGenerations: v })}
                    min={50}
                    max={500}
                    step={25}
                    accent="blue"
                    info="Per active learning round"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Active Learning */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4 text-emerald-500" />
                  Active Learning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2">Acquisition Function</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ACQUISITION_OPTIONS.map((acq) => (
                      <button
                        key={acq.key}
                        onClick={() => updateAL({ acquisition: acq.key })}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          engine.activeLearning.acquisition === acq.key
                            ? "border-emerald-400 bg-emerald-50"
                            : "border-gray-100 hover:border-gray-300"
                        }`}
                      >
                        <p className="text-sm font-medium">{acq.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{acq.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <ConfigSlider
                    label="Initial Samples (LHS)"
                    value={engine.activeLearning.initialSamples}
                    onChange={(v) => updateAL({ initialSamples: v })}
                    min={10}
                    max={100}
                    step={5}
                    accent="emerald"
                    info="Latin Hypercube Sampling"
                  />
                  <ConfigSlider
                    label="Samples per Round"
                    value={engine.activeLearning.samplesPerRound}
                    onChange={(v) => updateAL({ samplesPerRound: v })}
                    min={5}
                    max={50}
                    step={5}
                    accent="emerald"
                    info="New evaluations per cycle"
                  />
                </div>

                <ConfigSlider
                  label="Exploration Weight"
                  value={engine.activeLearning.explorationWeight}
                  onChange={(v) => updateAL({ explorationWeight: v })}
                  min={0.0}
                  max={1.0}
                  step={0.1}
                  accent="emerald"
                  info="0 = exploit, 1 = explore"
                />
              </CardContent>
            </Card>
          </div>
        );

      /* ---- Step 4: Material Definition ---- */
      case 3:
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Code2 className="h-5 w-5 text-blue-500" />
                    Material Definition
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Parameters, objectives, constraints, and engine configuration in MDL YAML format
                  </p>
                </div>
                {DOMAIN_TEMPLATES[domain] && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const template = DOMAIN_TEMPLATES[domain]!
                        .replace(/\n\nsurrogate:[\s\S]*?(?=\n\n[a-z]|\n*$)/g, "")
                        .replace(/\n\noptimizer:[\s\S]*?(?=\n\n[a-z]|\n*$)/g, "")
                        .replace(/\n\nactive_learning:[\s\S]*?(?=\n\n[a-z]|\n*$)/g, "")
                        .trimEnd();
                      setYaml(`${template}\n\n${buildEngineYaml(engine)}`);
                      setYamlDirty(false);
                    }}
                  >
                    Reset Template
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                  <Badge variant="secondary" className="text-[10px]">YAML</Badge>
                  <Badge variant="secondary" className="text-[10px]">MDL v1.0</Badge>
                </div>
                <textarea
                  value={yaml}
                  onChange={(e) => {
                    setYaml(e.target.value);
                    setYamlDirty(true);
                  }}
                  rows={28}
                  className="w-full px-4 py-3 border rounded-xl bg-gray-950 text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-y leading-relaxed"
                  spellCheck={false}
                />
              </div>

              <div className="mt-4 p-4 rounded-lg bg-amber-50 border border-amber-100">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-800">
                    <p className="font-medium mb-1">MDL Quick Reference</p>
                    <ul className="space-y-0.5 text-amber-700">
                      <li><strong>parameters</strong>: Input variables with ranges and units</li>
                      <li><strong>objectives</strong>: Properties to maximize/minimize with equations</li>
                      <li><strong>constraints</strong>: Hard constraints on objective values</li>
                      <li><strong>surrogate</strong>: MLP neural network configuration</li>
                      <li><strong>optimizer</strong>: CMA-ES / NSGA-II settings</li>
                      <li><strong>active_learning</strong>: Acquisition strategy and convergence</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      /* ---- Step 5: Review & Launch ---- */
      case 4:
        return (
          <div className="space-y-6">
            <Card className="border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-blue-500" />
                  Review & Launch
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-gray-50 border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Campaign</p>
                    <p className="font-semibold mt-1">{name}</p>
                    {description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                    )}
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50 border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Domain</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className={`w-6 h-6 rounded-md bg-gradient-to-br ${domainInfo.gradient} flex items-center justify-center`}
                      >
                        {(() => {
                          const Icon = domainInfo.icon;
                          return <Icon className="h-3.5 w-3.5 text-white" />;
                        })()}
                      </div>
                      <span className="font-semibold">{DOMAIN_LABELS[domain]}</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 text-center">
                    <p className="text-2xl font-bold text-blue-600">{budget}</p>
                    <p className="text-xs text-muted-foreground">Evaluations</p>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-50 border border-purple-100 text-center">
                    <p className="text-2xl font-bold text-purple-600">{rounds}</p>
                    <p className="text-xs text-muted-foreground">Rounds</p>
                  </div>
                  <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
                    <p className="text-2xl font-bold text-emerald-600">~{Math.round(budget / rounds)}</p>
                    <p className="text-xs text-muted-foreground">Per Round</p>
                  </div>
                </div>

                {/* Engine summary */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50/50 to-purple-50/50 border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Engine Configuration</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Strategy</p>
                      <p className="text-xs font-medium mt-0.5">
                        {engine.strategy === "surrogate_al"
                          ? "Surrogate + AL"
                          : engine.strategy === "bayesian_opt"
                          ? "Bayesian Opt"
                          : "DQN Rainbow"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Surrogate</p>
                      <p className="text-xs font-mono font-medium mt-0.5">
                        {engine.surrogate.architecture.replace("mlp_", "").replace("x", "×")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Optimizer</p>
                      <p className="text-xs font-medium mt-0.5">
                        {engine.optimizer.algorithm === "cmaes" ? "CMA-ES" : "NSGA-II"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Acquisition</p>
                      <p className="text-xs font-medium mt-0.5">
                        {engine.activeLearning.acquisition.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Definition preview */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Material Definition Preview
                  </p>
                  <pre className="p-4 rounded-lg bg-gray-950 text-gray-300 text-xs font-mono overflow-x-auto max-h-48 overflow-y-auto">
                    {yaml.slice(0, 600)}
                    {yaml.length > 600 && "\n..."}
                  </pre>
                </div>

                {/* Auto run toggle */}
                <label className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={autoRun}
                      onChange={(e) => setAutoRun(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-500 transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Start immediately after creation</p>
                    <p className="text-xs text-muted-foreground">
                      Campaign will begin optimizing right away
                    </p>
                  </div>
                </label>
              </CardContent>
            </Card>

            {createMutation.isError && (
              <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100">
                {(createMutation.error as Error).message}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  /* -------------------------------------------------------------- */
  /* Render                                                          */
  /* -------------------------------------------------------------- */

  return (
    <div className="max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Campaigns", href: "/dashboard/campaigns" },
          { label: "New Campaign" },
        ]}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold">New Campaign</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure and launch a materials optimization campaign
        </p>
      </motion.div>

      {/* Step indicator */}
      <div className="flex items-center gap-1.5 mb-8 overflow-x-auto pb-1">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={s.id} className="flex items-center gap-1.5 flex-1 min-w-0">
              <button
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all w-full ${
                  isActive
                    ? "bg-blue-50 text-blue-600 border border-blue-200"
                    : isDone
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-pointer hover:bg-emerald-100"
                    : "bg-gray-50 text-gray-400 border border-gray-100"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isActive
                      ? "bg-blue-500 text-white"
                      : isDone
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className="hidden sm:inline truncate">{s.label}</span>
                <Icon className="h-3.5 w-3.5 ml-auto hidden sm:block flex-shrink-0" />
              </button>
              {i < steps.length - 1 && (
                <div
                  className={`w-6 h-0.5 rounded-full flex-shrink-0 ${
                    isDone ? "bg-emerald-300" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content — single keyed wrapper for reliable AnimatePresence */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between mt-8"
      >
        <Button
          variant="outline"
          onClick={() => (step > 0 ? setStep(step - 1) : router.back())}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {step > 0 ? "Back" : "Cancel"}
        </Button>

        {step < steps.length - 1 ? (
          <Button variant="gradient" onClick={handleNext} disabled={!canProceed}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="gradient"
            size="lg"
            onClick={() => createMutation.mutate()}
            disabled={!name || !yaml || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-4 w-4" />
                {autoRun ? "Create & Launch" : "Create Campaign"}
              </>
            )}
          </Button>
        )}
      </motion.div>
    </div>
  );
}
