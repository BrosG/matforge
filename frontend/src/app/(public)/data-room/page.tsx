"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1";

export default function DataRoomPage() {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (!password.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/investor-access/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("investor_access_token", password.trim());
        localStorage.setItem("investor_access_name", data.full_name || "");
        window.location.href = "/data-room/dashboard";
      } else {
        setError("Invalid access password. Request access at matcraft.ai/investors");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Investor Data Room</h1>
          <p className="text-gray-400 text-sm">Enter your access password to continue</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 space-y-4">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              placeholder="Access password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 pr-12 text-sm"
            />
            <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl py-3" onClick={handleVerify} disabled={loading || !password.trim()}>
            {loading ? "Verifying..." : "Enter Data Room"}
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>

          <div className="text-center pt-2">
            <Link href="/investors" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Don&apos;t have access? Request it →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
