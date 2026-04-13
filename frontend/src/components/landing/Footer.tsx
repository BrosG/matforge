"use client";

import Link from "next/link";
import { Atom, Github, Mail } from "lucide-react";
import { VersionBadge } from "@/components/core/VersionGuard";

const FOOTER_LINKS = {
  Platform: [
    { href: "/materials", label: "Materials Database" },
    { href: "/material-builder", label: "3D Material Builder" },
    { href: "/builder", label: "Structure Tools" },
    { href: "/compare", label: "Compare Materials" },
    { href: "/ip-radar", label: "IP Radar" },
  ],
  Resources: [
    { href: "/docs", label: "Documentation" },
    { href: "/docs/tutorials/getting-started", label: "Getting Started" },
    { href: "/docs/materials-api/overview", label: "API Reference" },
    { href: "/faq", label: "FAQ" },
  ],
  Company: [
    { href: "/about", label: "About" },
    { href: "/pricing", label: "Pricing" },
    { href: "/domains", label: "Domains" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <Atom className="h-7 w-7 text-blue-400" />
              <span className="text-xl font-bold text-white">MatCraft</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-sm">
              Accelerate materials discovery with AI-powered surrogate models,
              active learning, and multi-objective Pareto optimization. From
              concept to candidate in hours, not months.
            </p>
            <div className="flex gap-3">
              <a
                href="https://github.com/matcraft"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="mailto:hello@matcraft.ai"
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">
                {title}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} MatCraft &mdash; matcraft.ai. All
            rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-600">
              Built for materials scientists and engineers
            </p>
            <VersionBadge />
          </div>
        </div>
      </div>
    </footer>
  );
}
