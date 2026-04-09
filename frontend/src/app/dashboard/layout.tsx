"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Atom,
  LayoutDashboard,
  FlaskConical,
  PlusCircle,
  BarChart3,
  Settings,
  LogOut,
  Search,
  Bell,
  ChevronLeft,
  Layers,
  BookOpen,
  Menu,
  WifiOff,
  Wifi,
  Database,
  FileCode2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useApiStatus } from "@/lib/api-status";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/campaigns", icon: FlaskConical, label: "Campaigns" },
  { href: "/dashboard/campaigns/new", icon: PlusCircle, label: "New Campaign" },
  { href: "/explore", icon: Layers, label: "Explore" },
  { href: "/dashboard/datasets", icon: Database, label: "Datasets" },
  { href: "/dashboard/templates", icon: FileCode2, label: "Templates" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
];

const BOTTOM_NAV = [
  { href: "/docs", icon: BookOpen, label: "Documentation" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isBackendAvailable } = useApiStatus();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const sidebarWidth = collapsed ? "w-16" : "w-64";

  const NavLink = ({
    item,
  }: {
    item: { href: string; icon: React.ElementType; label: string };
  }) => {
    const active =
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href));

    const link = (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-xl transition-all duration-200",
          collapsed ? "justify-center p-2.5" : "px-3 py-2.5",
          active
            ? "bg-blue-50 text-blue-700 font-medium shadow-sm"
            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
        )}
        onClick={() => setMobileOpen(false)}
      >
        <item.icon className={cn("h-5 w-5 flex-shrink-0", active && "text-blue-600")} />
        {!collapsed && <span className="text-sm">{item.label}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      );
    }
    return link;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen flex bg-gray-50/50">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden lg:flex flex-col border-r bg-white transition-all duration-300",
            sidebarWidth
          )}
        >
          {/* Logo */}
          <div className={cn("flex items-center border-b h-16", collapsed ? "justify-center px-2" : "px-4")}>
            <Link href="/" className="flex items-center gap-2">
              <Atom className="h-7 w-7 text-blue-600 flex-shrink-0" />
              {!collapsed && (
                <span className="text-lg font-bold">
                  <span className="text-gray-900">Mat</span>
                  <span className="gradient-text">Craft</span>
                </span>
              )}
            </Link>
            {!collapsed && (
              <button
                onClick={() => setCollapsed(true)}
                className="ml-auto p-1 rounded-md hover:bg-gray-100 text-gray-400"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Search */}
          {!collapsed && (
            <div className="px-3 pt-4 pb-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
            {collapsed && (
              <button
                onClick={() => setCollapsed(false)}
                className="w-full flex justify-center p-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 mb-2"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>

          {/* Bottom section */}
          <div className="border-t px-2 py-3 space-y-1">
            {/* Status */}
            <div className={cn("flex items-center gap-2 rounded-xl px-3 py-2", collapsed && "justify-center px-0")}>
              {isBackendAvailable ? (
                <Wifi className="h-4 w-4 text-green-500 flex-shrink-0" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500 flex-shrink-0" />
              )}
              {!collapsed && (
                <span className={cn("text-xs", isBackendAvailable ? "text-green-600" : "text-red-500")}>
                  {isBackendAvailable ? "Connected" : "Disconnected"}
                </span>
              )}
            </div>

            {BOTTOM_NAV.map((item) => (
              <NavLink key={item.label} item={item} />
            ))}

            {/* User */}
            <div className={cn("flex items-center gap-3 rounded-xl p-2 mt-2 border-t pt-3", collapsed && "justify-center")}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {(user?.name || user?.email || "U")[0].toUpperCase()}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {user?.name || user?.email}
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
                  >
                    <LogOut className="h-3 w-3" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b h-14 flex items-center px-4 gap-3">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <Atom className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-sm">MatCraft</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <button className="p-1.5 rounded-lg hover:bg-gray-100 relative">
              <Bell className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                className="lg:hidden fixed inset-0 bg-black/50 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
              />
              <motion.aside
                className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-white z-50 border-r"
                initial={{ x: -264 }}
                animate={{ x: 0 }}
                exit={{ x: -264 }}
                transition={{ type: "spring", damping: 25 }}
              >
                <div className="flex items-center h-14 px-4 border-b">
                  <Atom className="h-7 w-7 text-blue-600" />
                  <span className="ml-2 text-lg font-bold">MatCraft</span>
                </div>
                <nav className="p-3 space-y-1">
                  {NAV_ITEMS.map((item) => (
                    <NavLink key={item.href} item={item} />
                  ))}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 overflow-auto lg:pt-0 pt-14">
          {/* Top bar (desktop) */}
          <header className="hidden lg:flex items-center h-16 border-b bg-white px-6 sticky top-0 z-30">
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                <Bell className="h-5 w-5 text-gray-500" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                {(user?.name || user?.email || "U")[0].toUpperCase()}
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto p-6">{children}</div>
        </main>
      </div>
    </TooltipProvider>
  );
}
