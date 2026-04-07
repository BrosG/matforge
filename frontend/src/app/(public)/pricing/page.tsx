"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";

const TIERS = [
  {
    name: "Researcher",
    price: "Free",
    period: "",
    desc: "For individual researchers exploring materials discovery.",
    features: [
      "Up to 5 active campaigns",
      "All 11 domain plugins",
      "1,000 evaluations / campaign",
      "Pareto visualization",
      "CSV/JSON export",
      "Community support",
    ],
    cta: "Start Free",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Lab Pro",
    price: "$49",
    period: "/month",
    desc: "For research labs running production campaigns.",
    features: [
      "Unlimited campaigns",
      "All 11 domain plugins",
      "100,000 evaluations / campaign",
      "3D visualization & dashboards",
      "Custom evaluator plugins",
      "API access",
      "Priority support",
      "Team collaboration (5 seats)",
    ],
    cta: "Start Trial",
    href: "/register",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For organizations with advanced needs.",
    features: [
      "Everything in Lab Pro",
      "Unlimited evaluations",
      "Custom domain plugins",
      "On-premise deployment",
      "SSO / SAML integration",
      "Dedicated support engineer",
      "SLA guarantee",
      "Audit logging",
    ],
    cta: "Contact Us",
    href: "#",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <section className="pt-28 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-sm font-medium border border-purple-200 mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Simple Pricing
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Plans for Every <span className="gradient-text">Research Scale</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Start free. Upgrade when you need more power.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {TIERS.map((tier, i) => (
              <motion.div
                key={tier.name}
                className={`relative rounded-2xl border p-8 ${
                  tier.highlighted
                    ? "border-blue-300 bg-white shadow-xl ring-2 ring-blue-100 scale-105"
                    : "bg-white shadow-sm"
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-1">{tier.name}</h3>
                  <p className="text-sm text-gray-500">{tier.desc}</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-gray-400">{tier.period}</span>
                </div>

                <Button
                  asChild
                  variant={tier.highlighted ? "gradient" : "outline"}
                  className="w-full mb-6"
                >
                  <Link href={tier.href}>{tier.cta}</Link>
                </Button>

                <ul className="space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
