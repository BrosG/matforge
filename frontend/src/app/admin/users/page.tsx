"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Search, Shield, ShieldOff, Plus, Loader2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1";
const ADMIN_EMAIL = "gauthier.bros@gmail.com";

interface AdminUser {
  id: string;
  email: string | null;
  full_name: string | null;
  credits: number;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = (session as any)?.accessToken as string | undefined;

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const q = new URLSearchParams({
        page: String(page),
        limit: "50",
        search,
      });
      const res = await fetch(`${API}/admin/users?${q.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError(`Failed to load users (${res.status})`);
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [token, page, search]);

  useEffect(() => {
    if (status === "loading") return;
    const email = (session?.user as any)?.email;
    if (!email) {
      router.replace("/login?callbackUrl=/admin/users");
      return;
    }
    if (email !== ADMIN_EMAIL) {
      router.replace("/?error=not_admin");
      return;
    }
    fetchUsers();
  }, [session, status, router, fetchUsers]);

  const addCredits = async (userId: string) => {
    const input = window.prompt("Credits to add (positive or negative):", "50");
    if (!input) return;
    const amount = parseInt(input, 10);
    if (!Number.isFinite(amount) || amount === 0) return;
    const reason = window.prompt("Reason:", "Admin grant") || "Admin grant";
    if (!token) return;
    const res = await fetch(`${API}/admin/users/${userId}/credits`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount, reason }),
    });
    if (res.ok) fetchUsers();
    else alert(`Failed: ${res.status}`);
  };

  const toggleAdmin = async (userId: string, currentlyAdmin: boolean) => {
    if (!window.confirm(currentlyAdmin ? "Remove admin rights?" : "Grant admin rights?")) return;
    if (!token) return;
    const res = await fetch(`${API}/admin/users/${userId}/toggle-admin`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchUsers();
    else alert(`Failed: ${res.status}`);
  };

  const lastPage = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white mb-1">Users</h1>
          <p className="text-sm text-gray-400">
            {total.toLocaleString()} total · page {page} of {lastPage}
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search by email…"
            className="pl-10 pr-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 w-64"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-950 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-right px-4 py-3 font-medium">Credits</th>
              <th className="text-left px-4 py-3 font-medium">Created</th>
              <th className="text-left px-4 py-3 font-medium">Flags</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin inline" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t border-gray-800 hover:bg-gray-800/40">
                  <td className="px-4 py-3 text-white">{u.email || "—"}</td>
                  <td className="px-4 py-3 text-gray-300">{u.full_name || "—"}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-200">
                    {u.credits.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {u.is_admin && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          admin
                        </span>
                      )}
                      {!u.is_active && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/10 text-red-400 border border-red-500/20">
                          inactive
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => addCredits(u.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-green-400 hover:bg-gray-800"
                        title="Add credits"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleAdmin(u.id, u.is_admin)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-gray-800"
                        title={u.is_admin ? "Revoke admin" : "Grant admin"}
                      >
                        {u.is_admin ? (
                          <ShieldOff className="h-4 w-4" />
                        ) : (
                          <Shield className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {lastPage > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 text-sm bg-gray-900 border border-gray-800 rounded-lg text-gray-300 disabled:opacity-40 hover:border-gray-700"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500">
            Page {page} / {lastPage}
          </span>
          <button
            disabled={page >= lastPage}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 text-sm bg-gray-900 border border-gray-800 rounded-lg text-gray-300 disabled:opacity-40 hover:border-gray-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
