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
  | "cli-reference";

export const DOC_CATEGORIES: DocCategoryMeta[] = [
  { slug: "getting-started", title: "Getting Started", description: "Set up MatCraft and run your first campaign", icon: "Sparkles", gradient: "from-blue-500 to-cyan-500", order: 0 },
  { slug: "mdl", title: "Material Definition Language", description: "Define materials, parameters, and objectives with YAML", icon: "FileCode", gradient: "from-purple-500 to-violet-500", order: 1 },
  { slug: "optimization", title: "Optimization Engine", description: "Surrogate models, active learning, and Pareto analysis", icon: "Zap", gradient: "from-amber-500 to-orange-500", order: 2 },
  { slug: "domains", title: "Material Domains", description: "Built-in domains and custom plugin development", icon: "Layers", gradient: "from-emerald-500 to-green-500", order: 3 },
  { slug: "api-reference", title: "API Reference", description: "REST API, WebSocket, and Python SDK documentation", icon: "Code2", gradient: "from-rose-500 to-pink-500", order: 4 },
  { slug: "cli-reference", title: "CLI Reference", description: "Command-line interface for MatCraft operations", icon: "Terminal", gradient: "from-slate-500 to-gray-500", order: 5 },
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

export const ALL_DOC_PAGES: DocPage[] = [
  quickStart, installation, coreConcepts, configuration, firstCampaign, architecture, glossary, troubleshooting,
  mdlSpecification, mdlParameters, mdlObjectives, mdlConstraints, mdlTemplates, mdlYamlReference, mdlValidation, mdlExamples,
  cmaEs, mlpSurrogate, activeLearning, paretoAnalysis, convergence, multiObjective, hyperparameters, benchmarks,
  domainsOverview, domainsWater, domainsBattery, domainsSolar, domainsCatalyst, domainsHydrogen, domainsThermoelectric, domainsPolymer, domainsCeramic, domainsCustomPlugin,
  apiOverview, apiCampaigns, apiJobs, apiDatasets, apiTemplates, apiWebsocket, apiAuthentication, apiErrors, apiRateLimits, apiPythonSdk,
  cliOverview, cliInit, cliRun, cliResults, cliDashboard, cliConfig, cliValidate, cliExport,
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
