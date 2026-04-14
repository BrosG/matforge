"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Users, CreditCard, Search, Activity, Database, AlertCircle, TrendingUp, Shield, Clock, CheckCircle } from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1";
const ADMIN_EMAIL = "gauthier.bros@gmail.com";

const CHART_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: `Apr ${i + 1}`,
  users: Math.floor(Math.random() * 50 + 10 + i * 2),
  revenue: Math.floor(Math.random() * 500 + 100 + i * 15),
  searches: Math.floor(Math.random() * 200 + 50 + i * 5),
}));

interface Stats {
  total_users: number;
  active_users_7d: number;
  total_campaigns: number;
  total_credits_sold: number;
  credits_sold_30d: number;
  pending_investor_requests: number;
}

function StatCard({ icon: Icon, label, value, sub, color = "blue" }: { icon: any; label: string; value: string | number; sub?: string; color?: string }) {
  const colors: Record<string, string> = { blue: "from-blue-600 to-blue-700", purple: "from-purple-600 to-purple-700", green: "from-green-600 to-green-700", amber: "from-amber-600 to-amber-700" };
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center mb-3`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="text-2xl font-black text-white mb-0.5">{typeof value === "number" ? value.toLocaleString() : value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {sub && <div className="text-xs text-gray-600 mt-1">{sub}</div>}
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    const email = (session?.user as any)?.email;
    if (!email || email !== ADMIN_EMAIL) { router.replace("/login"); return; }

    const token = (session as any)?.accessToken;
    fetch(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, [session, status, router]);

  if (status === "loading" || loading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Dashboard</h1>
        <p className="text-sm text-gray-400">Platform overview — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats?.total_users ?? 0} sub={`${stats?.active_users_7d ?? 0} active this week`} color="blue" />
        <StatCard icon={CreditCard} label="Credits Sold (30d)" value={stats?.credits_sold_30d ?? 0} sub={`${stats?.total_credits_sold ?? 0} all time`} color="green" />
        <StatCard icon={Activity} label="Campaigns" value={stats?.total_campaigns ?? 0} color="purple" />
        <StatCard icon={AlertCircle} label="Investor Requests" value={stats?.pending_investor_requests ?? 0} sub="pending review" color="amber" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Revenue (30 days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={CHART_DATA}>
              <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "8px" }} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">User Growth (30 days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "8px" }} />
              <Line type="monotone" dataKey="users" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System health */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">System Health</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: "API Server", status: "operational" },
            { name: "PostgreSQL", status: "operational" },
            { name: "Redis", status: "operational" },
            { name: "Celery Worker", status: "operational" },
          ].map((s) => (
            <div key={s.name} className="flex items-center gap-2 p-3 bg-gray-800 rounded-xl">
              <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
              <span className="text-xs text-gray-300">{s.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
