"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Atom,
  ChevronRight,
  ChevronDown,
  FlaskConical,
  Cpu,
  GraduationCap,
  Rocket,
  Shield,
  Brain,
  Pill,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ThemeToggleButton } from "@/components/ui/theme-toggle";
import { CreditsIndicator } from "@/components/ui/CreditsIndicator";
import { LowCreditsBanner } from "@/components/ui/LowCreditsBanner";
import { cn } from "@/lib/utils";

interface NavLink {
  href: string;
  label: string;
}

interface SolutionLink {
  href: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

const NAV_LINKS: NavLink[] = [
  { href: "/materials", label: "Materials" },
  { href: "/material-builder", label: "3D Builder" },
  { href: "/builder", label: "Tools" },
  { href: "/compare", label: "Compare" },
  { href: "/ip-radar", label: "IP Radar" },
  { href: "/docs", label: "Docs" },
  { href: "/faq", label: "FAQ" },
];

const SOLUTIONS_LINKS: SolutionLink[] = [
  { href: "/for/materials-scientists", label: "Materials Scientists", icon: FlaskConical, color: "text-blue-500" },
  { href: "/for/engineers", label: "Engineers & Product Teams", icon: Cpu, color: "text-orange-500" },
  { href: "/for/students", label: "Students & Educators", icon: GraduationCap, color: "text-emerald-500" },
  { href: "/for/startups", label: "Deep Tech Startups", icon: Rocket, color: "text-violet-500" },
  { href: "/for/ip-lawyers", label: "Patent Attorneys", icon: Shield, color: "text-slate-500" },
  { href: "/for/ai-researchers", label: "AI & ML Researchers", icon: Brain, color: "text-indigo-500" },
  { href: "/for/pharma-biotech", label: "Pharma & Biotech", icon: Pill, color: "text-rose-500" },
  { href: "/for/academia-labs", label: "Academic Labs", icon: Building2, color: "text-teal-500" },
];

export function Header() {
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [mobileSolutionsOpen, setMobileSolutionsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSolutionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        "bg-white/90 dark:bg-gray-950/90 backdrop-blur-lg border-b border-border",
        scrolled ? "shadow-sm" : ""
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative">
              <Atom className="h-8 w-8 text-blue-600" />
              <div className="absolute -inset-1 bg-blue-600/20 rounded-full blur-sm -z-10" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-foreground">Mat</span>
              <span className="gradient-text">Craft</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
              >
                {link.label}
              </Link>
            ))}

            {/* Solutions dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setSolutionsOpen(!solutionsOpen)}
                onMouseEnter={() => setSolutionsOpen(true)}
                className={cn(
                  "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  solutionsOpen
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                Solutions
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    solutionsOpen && "rotate-180"
                  )}
                />
              </button>

              <AnimatePresence>
                {solutionsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    onMouseLeave={() => setSolutionsOpen(false)}
                    className="absolute right-0 top-full mt-1 w-64 rounded-xl bg-white dark:bg-gray-900 border border-border shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden z-50"
                  >
                    <div className="p-2">
                      <p className="px-2 pb-1.5 pt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Built for
                      </p>
                      {SOLUTIONS_LINKS.map((item) => {
                        const ItemIcon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSolutionsOpen(false)}
                            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors group"
                          >
                            <ItemIcon
                              className={cn("h-4 w-4 flex-shrink-0", item.color)}
                            />
                            <span className="text-sm font-medium text-foreground group-hover:text-foreground">
                              {item.label}
                            </span>
                            <ChevronRight className="ml-auto h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Desktop Auth + Theme */}
          <div className="hidden md:flex items-center gap-2">
            <CreditsIndicator />
            <ThemeToggleButton />
            {isAuthenticated ? (
              <Button asChild variant="gradient" size="sm">
                <Link href="/dashboard">
                  Dashboard <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild variant="gradient" size="sm">
                  <Link href="/register">
                    Get Started <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Low credits warning */}
      <LowCreditsBanner />

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/95 dark:bg-gray-950/95 backdrop-blur-lg border-b border-border overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile Solutions accordion */}
              <div>
                <button
                  onClick={() => setMobileSolutionsOpen(!mobileSolutionsOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg"
                >
                  Solutions
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      mobileSolutionsOpen && "rotate-180"
                    )}
                  />
                </button>
                <AnimatePresence>
                  {mobileSolutionsOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden ml-2 mt-1 space-y-1"
                    >
                      {SOLUTIONS_LINKS.map((item) => {
                        const ItemIcon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => { setMobileOpen(false); setMobileSolutionsOpen(false); }}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg"
                          >
                            <ItemIcon className={cn("h-4 w-4", item.color)} />
                            {item.label}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-2 border-t space-y-2">
                {isAuthenticated ? (
                  <Button asChild variant="gradient" className="w-full">
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/login">Sign In</Link>
                    </Button>
                    <Button asChild variant="gradient" className="w-full">
                      <Link href="/register">Get Started</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
