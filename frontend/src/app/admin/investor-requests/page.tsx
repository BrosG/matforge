"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Clock, Copy } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1";
const ADMIN_EMAIL = "gauthier.bros@gmail.com";

interface Request {
  id: string;
  full_name: string;
  email: string;
  company: string;
  role: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  access_password?: string;
  created_at: string;
}

const STATUS_BADGES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  approved: "bg-green-500/10 text-green-400 border border-green-500/20",
  rejected: "bg-red-500/10 text-red-400 border border-red-500/20",
};

export default function InvestorRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [copied, setCopied] = useState("");

  const getToken = () => (session as any)?.accessToken || "";

  useEffect(() => {
    if (status === "loading") return;
    const email = (session?.user as any)?.email;
    if (!email) { router.replace("/login?callbackUrl=/admin/investor-requests"); return; }
    if (email !== ADMIN_EMAIL) { router.replace("/?error=not_admin"); return; }
    fetchRequests();
  }, [session, status, filter]);

  const fetchRequests = async () => {
    const token = getToken();
    const res = await fetch(`${API}/admin/investor-requests?status=${filter}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const d = await res.json(); setRequests(d.requests || []); }
    setLoading(false);
  };

  const approve = async (id: string) => {
    const token = getToken();
    const res = await fetch(`${API}/admin/investor-requests/${id}/approve`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      alert(`Approved! Password: ${data.access_password}\n\nShare this password with ${data.email}`);
      fetchRequests();
    }
  };

  const reject = async (id: string) => {
    const token = getToken();
    await fetch(`${API}/admin/investor-requests/${id}/reject`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    fetchRequests();
  };

  const copyPw = (pw: string) => {
    navigator.clipboard.writeText(pw);
    setCopied(pw);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white mb-1">Investor Access Requests</h1>
        <p className="text-sm text-gray-400">Review and approve data room access requests</p>
      </div>
      <div className="flex gap-2 mb-6">
        {["pending", "approved", "rejected", "all"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${filter === s ? "bg-blue-600 text-white" : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 text-gray-500">No {filter} requests</div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-white">{r.full_name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_BADGES[r.status]}`}>{r.status}</span>
                    <span className="text-xs text-gray-500">{r.role}</span>
                  </div>
                  <div className="text-sm text-gray-400">{r.email} {r.company && `· ${r.company}`}</div>
                  {r.message && <div className="text-xs text-gray-500 mt-2 italic">&ldquo;{r.message}&rdquo;</div>}
                  {r.access_password && (
                    <div className="flex items-center gap-2 mt-2">
                      <code className="text-xs bg-gray-800 px-3 py-1 rounded-lg text-green-400">{r.access_password}</code>
                      <button onClick={() => copyPw(r.access_password!)} className="text-gray-500 hover:text-white">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      {copied === r.access_password && <span className="text-xs text-green-400">Copied!</span>}
                    </div>
                  )}
                  <div className="text-xs text-gray-600 mt-1">{new Date(r.created_at).toLocaleDateString()}</div>
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => approve(r.id)} className="flex items-center gap-1.5 px-3 py-2 bg-green-600/20 border border-green-500/30 text-green-400 rounded-xl text-xs hover:bg-green-600/30 transition-colors">
                      <CheckCircle className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button onClick={() => reject(r.id)} className="flex items-center gap-1.5 px-3 py-2 bg-red-600/20 border border-red-500/30 text-red-400 rounded-xl text-xs hover:bg-red-600/30 transition-colors">
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
