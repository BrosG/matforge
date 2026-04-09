"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

function extractHeadings(markdown: string): TocEntry[] {
  const headings: TocEntry[] = [];
  const regex = /^(#{2,3})\s+(.+)$/gm;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(markdown)) !== null) {
    const level = match[1].length as 2 | 3;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    headings.push({ id, text, level });
  }

  return headings;
}

interface TableOfContentsProps {
  body: string;
}

export function TableOfContents({ body }: TableOfContentsProps) {
  const headings = extractHeadings(body);
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const visibleEntries = entries.filter((e) => e.isIntersecting);
    if (visibleEntries.length > 0) {
      // Pick the one closest to the top of the viewport
      const topEntry = visibleEntries.reduce((prev, curr) =>
        prev.boundingClientRect.top < curr.boundingClientRect.top ? prev : curr
      );
      setActiveId(topEntry.target.id);
    }
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin: "-80px 0px -60% 0px",
      threshold: 0,
    });

    const observer = observerRef.current;

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [headings, handleIntersection]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <aside className="sticky top-20 h-[calc(100vh-5rem)] w-48 shrink-0 overflow-y-auto hidden xl:block">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
        On this page
      </p>
      <ul className="space-y-1 border-l border-gray-200">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(heading.id);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                  setActiveId(heading.id);
                }
              }}
              className={`block text-sm transition-colors ${
                heading.level === 3 ? "pl-6" : "pl-4"
              } py-1 -ml-px ${
                activeId === heading.id
                  ? "border-l-2 border-blue-600 text-blue-600 font-medium"
                  : "border-l-2 border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
