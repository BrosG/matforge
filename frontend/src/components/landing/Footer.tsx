"use client";

import Link from "next/link";
import { Atom, Github, Mail } from "lucide-react";

const FOOTER_LINKS = {
  Platform: [
    { href: "/explore", label: "Explore Campaigns" },
    { href: "/domains", label: "Domains" },
    { href: "/pricing", label: "Pricing" },
    { href: "/#features", label: "Features" },
  ],
  Resources: [
    { href: "/about", label: "About" },
    { href: "/docs", label: "Documentation" },
    { href: "/docs#api", label: "API Reference" },
    { href: "/docs#plugins", label: "Plugin Guide" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/cookies", label: "Cookie Policy" },
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
              <span className="text-xl font-bold text-white">MatForge</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-sm">
              Accelerate materials discovery with AI-powered surrogate models,
              active learning, and multi-objective Pareto optimization. From
              concept to candidate in hours, not months.
            </p>
            <div className="flex gap-3">
              <a
                href="https://github.com/matforge"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="mailto:hello@matforge.io"
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
            &copy; {new Date().getFullYear()} MatForge &mdash; matforge.io. All
            rights reserved.
          </p>
          <p className="text-xs text-gray-600">
            Built for materials scientists and engineers
          </p>
        </div>
      </div>
    </footer>
  );
}
