import Link from "next/link";
import {
  Sparkles,
  FileCode,
  Zap,
  Layers,
  Code2,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import {
  DOC_CATEGORIES,
  getDocsByCategory,
  type DocCategoryMeta,
} from "@/content/docs";

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  FileCode,
  Zap,
  Layers,
  Code2,
  Terminal,
};

interface DocSidebarProps {
  currentCategory: string;
  currentSlug?: string;
}

export function DocSidebar({ currentCategory, currentSlug }: DocSidebarProps) {
  return (
    <aside className="sticky top-20 h-[calc(100vh-5rem)] w-64 shrink-0 overflow-y-auto pr-4 pb-8 hidden lg:block">
      <nav aria-label="Documentation navigation">
        <ul className="space-y-1">
          {DOC_CATEGORIES.map((cat) => (
            <SidebarCategory
              key={cat.slug}
              category={cat}
              isExpanded={cat.slug === currentCategory}
              currentSlug={currentSlug}
            />
          ))}
        </ul>
      </nav>
    </aside>
  );
}

function SidebarCategory({
  category,
  isExpanded,
  currentSlug,
}: {
  category: DocCategoryMeta;
  isExpanded: boolean;
  currentSlug?: string;
}) {
  const Icon = ICON_MAP[category.icon];
  const pages = getDocsByCategory(category.slug);

  return (
    <li>
      <div className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-900 select-none">
        {Icon && <Icon className="h-4 w-4 text-gray-500" />}
        <span>{category.title}</span>
      </div>

      {isExpanded && pages.length > 0 && (
        <ul className="ml-4 border-l border-gray-200 space-y-0.5 pb-2">
          {pages.map((page) => {
            const isActive = page.slug === currentSlug;
            return (
              <li key={page.slug}>
                <Link
                  href={`/docs/${category.slug}/${page.slug}`}
                  className={`block pl-4 pr-3 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "text-blue-600 font-medium border-l-2 border-blue-600 -ml-px"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-r-md"
                  }`}
                >
                  {page.title}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {!isExpanded && pages.length > 0 && (
        <ul className="ml-4 border-l border-gray-100 space-y-0.5 pb-2">
          {pages.map((page) => (
            <li key={page.slug}>
              <Link
                href={`/docs/${category.slug}/${page.slug}`}
                className="block pl-4 pr-3 py-1.5 text-sm text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-r-md transition-colors"
              >
                {page.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
