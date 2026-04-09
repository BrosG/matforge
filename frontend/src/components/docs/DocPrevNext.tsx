import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { DocPage } from "@/content/docs";

interface DocPrevNextProps {
  prev?: DocPage;
  next?: DocPage;
}

export function DocPrevNext({ prev, next }: DocPrevNextProps) {
  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Previous and next pages"
      className="flex items-stretch justify-between gap-4 mt-12 pt-8 border-t border-gray-200"
    >
      {prev ? (
        <Link
          href={`/docs/${prev.category}/${prev.slug}`}
          className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-blue-200 flex-1 max-w-[50%]"
        >
          <ArrowLeft className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500 mb-0.5">Previous</p>
            <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
              {prev.title}
            </p>
          </div>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          href={`/docs/${next.category}/${next.slug}`}
          className="group flex items-center justify-end gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-blue-200 flex-1 max-w-[50%] text-right"
        >
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500 mb-0.5">Next</p>
            <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
              {next.title}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors shrink-0" />
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
