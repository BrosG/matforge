"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BookOpen, Database, Globe, Code2, Server, Atom, ChevronRight, ExternalLink } from "lucide-react";

const ADMIN_EMAIL = "gauthier.bros@gmail.com";

const DOCS = [
  {
    icon: Globe,
    title: "Architecture",
    file: "ARCHITECTURE.md",
    description: "System diagram, tech stack, Cloud Run services, middleware stack, CI/CD pipeline",
    color: "blue",
  },
  {
    icon: Database,
    title: "Database",
    file: "DATABASE.md",
    description: "ER diagram, all 8 tables, 40+ IndexedMaterial columns, indexes, data quality pipeline",
    color: "green",
  },
  {
    icon: Code2,
    title: "API Reference",
    file: "API_REFERENCE.md",
    description: "Every endpoint across 16 routers, auth, credit costs, request/response schemas",
    color: "purple",
  },
  {
    icon: BookOpen,
    title: "Features",
    file: "FEATURES.md",
    description: "Complete feature inventory, routes, credit costs, keyboard shortcuts, Stripe products",
    color: "amber",
  },
  {
    icon: Server,
    title: "Deployment",
    file: "DEPLOYMENT.md",
    description: "CI/CD pipeline, 18 Secret Manager secrets, Stripe config, troubleshooting runbook",
    color: "red",
  },
  {
    icon: Atom,
    title: "Materials Database",
    file: "MATERIALS_DATABASE.md",
    description: "Why it's game-changing, data quality pipeline, Nobel Prize thesis, future roadmap",
    color: "cyan",
  },
];

const COLORS: Record<string, string> = {
  blue: "from-blue-600 to-blue-700",
  green: "from-green-600 to-green-700",
  purple: "from-purple-600 to-purple-700",
  amber: "from-amber-600 to-amber-700",
  red: "from-red-600 to-red-700",
  cyan: "from-cyan-600 to-cyan-700",
};

// Inline markdown content (loaded from .claude/ docs)
const DOC_CONTENT: Record<string, string> = {};

export default function AdminDocsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    const email = (session?.user as any)?.email;
    if (!email || email !== ADMIN_EMAIL) { router.replace("/login"); return; }
  }, [session, status, router]);

  const loadDoc = async (file: string) => {
    setLoading(true);
    setActiveDoc(file);
    // Docs are served from the repo root .claude/ dir via a simple API or embedded
    // For now, show a note that docs are in .claude/ directory
    setContent(`# ${file}\n\nThis document is stored at \`d:\\matcraft\\.claude\\${file}\`\n\nView it in your editor or terminal:\n\`\`\`bash\ncat .claude/${file}\n\`\`\``);
    setLoading(false);
  };

  if (activeDoc) {
    const doc = DOCS.find(d => d.file === activeDoc)!;
    return (
      <div className="p-6">
        <button onClick={() => setActiveDoc(null)} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
          ← Back to Documentation
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${COLORS[doc.color]} flex items-center justify-center`}>
            <doc.icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">{doc.title}</h1>
            <p className="text-sm text-gray-400">{doc.description}</p>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <p className="text-gray-400 text-sm mb-4">
            This document is stored at <code className="text-blue-400 bg-gray-800 px-2 py-0.5 rounded">.claude/{doc.file}</code> in the repository root.
          </p>
          <div className="flex gap-3">
            <a
              href={`https://github.com/BrosG/matforge/blob/main/.claude/${doc.file}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-xl text-sm hover:bg-blue-600/30 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              View on GitHub
            </a>
          </div>
          <div className="mt-6 p-4 bg-gray-800 rounded-xl">
            <p className="text-xs font-mono text-gray-500 mb-2">Terminal command:</p>
            <code className="text-green-400 font-mono text-sm">cat d:/matcraft/.claude/{doc.file}</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white mb-1">Technical Documentation</h1>
        <p className="text-sm text-gray-400">
          6 comprehensive documents covering the entire MatCraft codebase.
          Stored in <code className="text-blue-400 bg-gray-900 px-2 py-0.5 rounded text-xs">.claude/</code> directory.
        </p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {DOCS.map((doc) => (
          <button
            key={doc.file}
            onClick={() => loadDoc(doc.file)}
            className="text-left p-5 bg-gray-900 border border-gray-800 rounded-2xl hover:border-gray-700 transition-all group"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${COLORS[doc.color]} flex items-center justify-center mb-4`}>
              <doc.icon className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-bold text-white mb-2 group-hover:text-blue-400 transition-colors flex items-center justify-between">
              {doc.title}
              <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-blue-400" />
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">{doc.description}</p>
            <div className="mt-3 text-[10px] text-gray-600 font-mono">.claude/{doc.file}</div>
          </button>
        ))}
      </div>

      {/* Quick reference */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Quick Reference</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          {[
            { label: "GCP Project", value: "matforge-50499" },
            { label: "Region", value: "us-central1" },
            { label: "DB", value: "matforge-db (Cloud SQL)" },
            { label: "Stripe Webhook", value: "we_1TM9G6D2..." },
            { label: "Materials indexed", value: "204,877" },
            { label: "Admin email", value: "gauthier.bros@gmail.com" },
          ].map((item) => (
            <div key={item.label} className="flex justify-between py-2 border-b border-gray-800">
              <span className="text-gray-400">{item.label}</span>
              <span className="text-white font-mono text-xs">{item.value}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-amber-900/20 border border-amber-500/30 rounded-xl">
          <p className="text-xs text-amber-400 font-semibold">⚠️ Action Required</p>
          <p className="text-xs text-amber-300 mt-1">Rotate Stripe sk_live_ key — it was exposed in a chat session. Go to Stripe Dashboard → Developers → API keys → Roll.</p>
        </div>
      </div>
    </div>
  );
}
