"use client";

import { Atom } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  text?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Loading({ text = "Loading...", className, size = "md" }: LoadingProps) {
  const iconSizes = { sm: "h-6 w-6", md: "h-10 w-10", lg: "h-16 w-16" };
  const textSizes = { sm: "text-xs", md: "text-sm", lg: "text-base" };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <Atom className={cn("animate-spin text-primary", iconSizes[size])} />
      <p className={cn("text-muted-foreground", textSizes[size])}>{text}</p>
    </div>
  );
}

export function PageLoading({ text }: { text?: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loading text={text} size="lg" />
    </div>
  );
}
