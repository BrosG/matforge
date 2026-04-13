export interface DocPage {
  slug: string;
  title: string;
  description: string;
  category: DocCategory;
  order: number;
  body: string;
  lastUpdated: string;
  tags: string[];
  readingTime: number;
}

export interface DocCategoryMeta {
  slug: DocCategory;
  title: string;
  description: string;
  icon: string;
  gradient: string;
  order: number;
}

export type DocCategory =
  | "getting-started"
  | "mdl"
  | "optimization"
  | "domains"
  | "api-reference"
  | "cli-reference"
  | "features"
  | "materials-api"
  | "tutorials";

export const DOC_CATEGORIES: DocCategoryMeta[] = [
  { slug: "getting-started", title: "Getting Started", description: "Set up MatCraft and run your first campaign", icon: "Sparkles", gradient: "from-blue-500 to-cyan-500", order: 0 },
  { slug: "mdl", title: "Material Definition Language", description: "Define materials, parameters, and objectives with YAML", icon: "FileCode", gradient: "from-purple-500 to-violet-500", order: 1 },
  { slug: "optimization", title: "Optimization Engine", description: "Surrogate models, active learning, and Pareto analysis", icon: "Zap", gradient: "from-amber-500 to-orange-500", order: 2 },
  { slug: "domains", title: "Material Domains", description: "Built-in domains and custom plugin development", icon: "Layers", gradient: "from-emerald-500 to-green-500", order: 3 },
  { slug: "api-reference", title: "API Reference", description: "REST API, WebSocket, and Python SDK documentation", icon: "Code2", gradient: "from-rose-500 to-pink-500", order: 4 },
  { slug: "cli-reference", title: "CLI Reference", description: "Command-line interface for MatCraft operations", icon: "Terminal", gradient: "from-slate-500 to-gray-500", order: 5 },
  { slug: "features", title: "Platform Features", description: "Detailed guides for each MatCraft feature", icon: "Star", gradient: "from-indigo-500 to-blue-500", order: 6 },
  { slug: "materials-api", title: "Materials API", description: "Complete REST API docs for materials endpoints", icon: "Database", gradient: "from-teal-500 to-emerald-500", order: 7 },
  { slug: "tutorials", title: "Tutorials", description: "Step-by-step guides for common workflows", icon: "BookOpen", gradient: "from-violet-500 to-purple-500", order: 8 },
];

// Import all pages
import quickStart from "./getting-started/quick-start";
import installation from "./getting-started/installation";
import coreConcepts from "./getting-started/core-concepts";
import configuration from "./getting-started/configuration";
import firstCampaign from "./getting-started/first-campaign";
import architecture from "./getting-started/architecture";
import glossary from "./getting-started/glossary";
import troubleshooting from "./getting-started/troubleshooting";

import mdlSpecification from "./mdl/specification";
import mdlParameters from "./mdl/parameters";
import mdlObjectives from "./mdl/objectives";
import mdlConstraints from "./mdl/constraints";
import mdlTemplates from "./mdl/templates";
import mdlYamlReference from "./mdl/yaml-reference";
import mdlValidation from "./mdl/validation";
import mdlExamples from "./mdl/examples";

import cmaEs from "./optimization/cma-es";
import mlpSurrogate from "./optimization/mlp-surrogate";
import activeLearning from "./optimization/active-learning";
import paretoAnalysis from "./optimization/pareto-analysis";
import convergence from "./optimization/convergence";
import multiObjective from "./optimization/multi-objective";
import hyperparameters from "./optimization/hyperparameters";
import benchmarks from "./optimization/benchmarks";

import domainsOverview from "./domains/overview";
import domainsWater from "./domains/water";
import domainsBattery from "./domains/battery";
import domainsSolar from "./domains/solar";
import domainsCatalyst from "./domains/catalyst";
import domainsHydrogen from "./domains/hydrogen";
import domainsThermoelectric from "./domains/thermoelectric";
import domainsPolymer from "./domains/polymer";
import domainsCeramic from "./domains/ceramic";
import domainsCustomPlugin from "./domains/custom-plugin";
import domainsStructural from "./domains/structural";

import apiOverview from "./api-reference/overview";
import apiCampaigns from "./api-reference/campaigns";
import apiJobs from "./api-reference/jobs";
import apiDatasets from "./api-reference/datasets";
import apiTemplates from "./api-reference/templates";
import apiWebsocket from "./api-reference/websocket";
import apiAuthentication from "./api-reference/authentication";
import apiErrors from "./api-reference/errors";
import apiRateLimits from "./api-reference/rate-limits";
import apiPythonSdk from "./api-reference/python-sdk";

import cliOverview from "./cli-reference/overview";
import cliInit from "./cli-reference/init";
import cliRun from "./cli-reference/run";
import cliResults from "./cli-reference/results";
import cliDashboard from "./cli-reference/dashboard";
import cliConfig from "./cli-reference/config";
import cliValidate from "./cli-reference/validate";
import cliExport from "./cli-reference/export";

// Features
import featuresMaterialsSearch from "./features/materials-search";
import featuresCrystalViewer from "./features/crystal-viewer";
import featuresStructureBuilder from "./features/structure-builder";
import featuresInverseDesign from "./features/inverse-design";
import featuresScatterPlot from "./features/scatter-plot";
import featuresBandStructure from "./features/band-structure";
import featuresDensityOfStates from "./features/density-of-states";
import featuresPhaseDiagrams from "./features/phase-diagrams";
import featuresXrdSimulation from "./features/xrd-simulation";
import featuresJupyterExport from "./features/jupyter-export";
import featuresStructureExport from "./features/structure-export";
import featuresApplicationScores from "./features/application-scores";
import featuresComparator from "./features/comparator";
import featuresDarkMode from "./features/dark-mode";
import featuresNaturalLanguage from "./features/natural-language";

// Materials API
import matApiOverview from "./materials-api/overview";
import matApiAuthentication from "./materials-api/authentication";
import matApiMaterialsList from "./materials-api/materials-list";
import matApiMaterialsDetail from "./materials-api/materials-detail";
import matApiMaterialsExport from "./materials-api/materials-export";
import matApiMaterialsSimilar from "./materials-api/materials-similar";
import matApiMaterialsScatter from "./materials-api/materials-scatter";
import matApiElectronicBand from "./materials-api/electronic-band";
import matApiElectronicDos from "./materials-api/electronic-dos";
import matApiElectronicXrd from "./materials-api/electronic-xrd";
import matApiElectronicPhase from "./materials-api/electronic-phase";
import matApiBuilderSupercell from "./materials-api/builder-supercell";
import matApiBuilderSurface from "./materials-api/builder-surface";
import matApiBuilderNanoparticle from "./materials-api/builder-nanoparticle";
import matApiBuilderSubstitute from "./materials-api/builder-substitute";

// Tutorials
import tutorialsGettingStarted from "./tutorials/getting-started";
import tutorialsFirstSearch from "./tutorials/first-search";
import tutorialsFirstCampaign from "./tutorials/first-campaign";
import tutorialsUnderstandingProperties from "./tutorials/understanding-properties";
import tutorialsReadingBandStructures from "./tutorials/reading-band-structures";
import tutorialsReadingDos from "./tutorials/reading-dos";
import tutorialsUsingBuilder from "./tutorials/using-builder";
import tutorialsExportingData from "./tutorials/exporting-data";
import tutorialsApiQuickstart from "./tutorials/api-quickstart";
import tutorialsCampaignAdvanced from "./tutorials/campaign-advanced";

export const ALL_DOC_PAGES: DocPage[] = [
  quickStart, installation, coreConcepts, configuration, firstCampaign, architecture, glossary, troubleshooting,
  mdlSpecification, mdlParameters, mdlObjectives, mdlConstraints, mdlTemplates, mdlYamlReference, mdlValidation, mdlExamples,
  cmaEs, mlpSurrogate, activeLearning, paretoAnalysis, convergence, multiObjective, hyperparameters, benchmarks,
  domainsOverview, domainsWater, domainsBattery, domainsSolar, domainsCatalyst, domainsHydrogen, domainsThermoelectric, domainsPolymer, domainsCeramic, domainsCustomPlugin, domainsStructural,
  apiOverview, apiCampaigns, apiJobs, apiDatasets, apiTemplates, apiWebsocket, apiAuthentication, apiErrors, apiRateLimits, apiPythonSdk,
  cliOverview, cliInit, cliRun, cliResults, cliDashboard, cliConfig, cliValidate, cliExport,
  // Features
  featuresMaterialsSearch, featuresCrystalViewer, featuresStructureBuilder, featuresInverseDesign, featuresScatterPlot, featuresBandStructure, featuresDensityOfStates, featuresPhaseDiagrams, featuresXrdSimulation, featuresJupyterExport, featuresStructureExport, featuresApplicationScores, featuresComparator, featuresDarkMode, featuresNaturalLanguage,
  // Materials API
  matApiOverview, matApiAuthentication, matApiMaterialsList, matApiMaterialsDetail, matApiMaterialsExport, matApiMaterialsSimilar, matApiMaterialsScatter, matApiElectronicBand, matApiElectronicDos, matApiElectronicXrd, matApiElectronicPhase, matApiBuilderSupercell, matApiBuilderSurface, matApiBuilderNanoparticle, matApiBuilderSubstitute,
  // Tutorials
  tutorialsGettingStarted, tutorialsFirstSearch, tutorialsFirstCampaign, tutorialsUnderstandingProperties, tutorialsReadingBandStructures, tutorialsReadingDos, tutorialsUsingBuilder, tutorialsExportingData, tutorialsApiQuickstart, tutorialsCampaignAdvanced,
];

export function getDocPage(category: string, slug: string): DocPage | undefined {
  return ALL_DOC_PAGES.find((p) => p.category === category && p.slug === slug);
}

export function getDocsByCategory(category: string): DocPage[] {
  return ALL_DOC_PAGES.filter((p) => p.category === category).sort((a, b) => a.order - b.order);
}

export function getAdjacentPages(category: string, slug: string): { prev?: DocPage; next?: DocPage } {
  const pages = getDocsByCategory(category);
  const idx = pages.findIndex((p) => p.slug === slug);
  return {
    prev: idx > 0 ? pages[idx - 1] : undefined,
    next: idx < pages.length - 1 ? pages[idx + 1] : undefined,
  };
}
