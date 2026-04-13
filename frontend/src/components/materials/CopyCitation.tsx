"use client";

import { useState } from "react";

interface CopyCitationProps {
  text: string;
  citation: string;
}

export function CopyCitation({ text, citation }: CopyCitationProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = citation;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-1">
      <p className="text-xs text-blue-600 flex-1">{text}</p>
      <button
        onClick={handleCopy}
        className="text-xs px-2 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors whitespace-nowrap"
      >
        {copied ? "Copied!" : "Copy Citation"}
      </button>
    </div>
  );
}
