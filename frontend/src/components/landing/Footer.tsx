"use client";

import Link from "next/link";
import { Atom, Github, Mail } from "lucide-react";
import { VersionBadge } from "@/components/core/VersionGuard";

const FOOTER_LINKS = {
  Platform: [
    { href: "/materials", label: "Materials Database" },
    { href: "/material-builder", label: "3D Material Builder" },
    { href: "/ip-radar", label: "IP Radar" },
    { href: "/compare", label: "Compare" },
    { href: "/builder", label: "Structure Tools" },
  ],
  Resources: [
    { href: "/docs", label: "Documentation" },
    { href: "/docs/tutorials/getting-started", label: "Getting Started" },
    { href: "/docs/materials-api/overview", label: "API Reference" },
    { href: "/faq", label: "FAQ" },
    { href: "/press", label: "Press" },
  ],
  Company: [
    { href: "/about", label: "About" },
    { href: "/pricing", label: "Pricing" },
    { href: "/investors", label: "Investors" },
    { href: "/domains", label: "Domains" },
  ],
  Legal: [
    { href: "/legal/privacy", label: "Privacy Policy" },
    { href: "/legal/terms", label: "Terms of Service" },
    { href: "/legal/cookies", label: "Cookies" },
    { href: "/legal/mentions", label: "Mentions légales" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer — brand (2 cols) + 4 link cols = 6 total */}
        <div className="py-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-10">
          {/* Brand — spans 2 cols on large screens */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <Atom className="h-7 w-7 text-blue-400" />
              <span className="text-xl font-bold text-white">MatCraft</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-xs">
              Accelerate materials discovery with AI-powered surrogate models,
              active learning, and Pareto optimization. From concept to
              candidate in hours, not months.
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

          {/* 4 link columns — each takes 1 col */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title} className="col-span-1">
              <h3 className="font-semibold text-white text-xs uppercase tracking-wider mb-4">
                {title}
              </h3>
              <ul className="space-y-2.5">
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
