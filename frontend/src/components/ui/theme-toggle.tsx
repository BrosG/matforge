"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/components/core/ThemeProvider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={cn("flex items-center gap-0.5 p-1 rounded-lg bg-muted/60 border border-border", className)}>
      <button
        onClick={() => setTheme("light")}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          theme === "light" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
        title="Light mode"
      >
        <Sun className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          theme === "system" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
        title="System theme"
      >
        <Monitor className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          theme === "dark" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
        title="Dark mode"
      >
        <Moon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/** Compact single-button toggle for headers */
export function ThemeToggleButton({ className }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground",
        className
      )}
      title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
