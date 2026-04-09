import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface DocBreadcrumbProps {
  items: BreadcrumbItem[];
}

export function DocBreadcrumb({ items }: DocBreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6"
    >
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && (
            <ChevronRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="text-blue-600 hover:underline hover:text-blue-700 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium truncate max-w-[240px]">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
