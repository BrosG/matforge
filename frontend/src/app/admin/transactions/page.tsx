"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1";
const ADMIN_EMAIL = "gauthier.bros@gmail.com";

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

export default function AdminTransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [txs, setTxs] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = (session as any)?.accessToken as string | undefined;

  const fetchTransactions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API}/admin/transactions?page=${page}&limit=50`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) {
        setError(`Failed to load transactions (${res.status})`);
        return;
      }
      const data = await res.json();
      setTxs(data.transactions || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [token, page]);

  useEffect(() => {
    if (status === "loading") return;
    const email = (session?.user as any)?.email;
    if (!email) {
      router.replace("/login?callbackUrl=/admin/transactions");
      return;
    }
    if (email !== ADMIN_EMAIL) {
      router.replace("/?error=not_admin");
      return;
    }
    fetchTransactions();
  }, [session, status, router, fetchTransactions]);

  const lastPage = Math.max(1, Math.ceil(total / 50));

  const totalIn = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalOut = txs.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white mb-1">Credit Transactions</h1>
        <p className="text-sm text-gray-400">
          {total.toLocaleString()} total · page {page} of {lastPage}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">Credits granted (page)</div>
          <div className="text-2xl font-black text-green-400">
            +{totalIn.toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">Credits spent (page)</div>
          <div className="text-2xl font-black text-red-400">
            {totalOut.toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="text-xs text-gray-500 uppercase mb-1">Net (page)</div>
          <div className="text-2xl font-black text-white">
            {(totalIn + totalOut).toLocaleString()}
          </div>
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
              <th className="text-left px-4 py-3 font-medium">When</th>
              <th className="text-left px-4 py-3 font-medium">User</th>
              <th className="text-right px-4 py-3 font-medium">Amount</th>
              <th className="text-right px-4 py-3 font-medium">Balance after</th>
              <th className="text-left px-4 py-3 font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin inline" />
                </td>
              </tr>
            ) : txs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-gray-500">
                  No transactions yet
                </td>
              </tr>
            ) : (
              txs.map((t) => (
                <tr key={t.id} className="border-t border-gray-800 hover:bg-gray-800/40">
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {t.created_at ? new Date(t.created_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-300 font-mono text-xs truncate max-w-[180px]">
                    {t.user_id}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono font-semibold ${
                      t.amount >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1 justify-end">
                      {t.amount >= 0 ? (
                        <TrendingUp className="h-3.5 w-3.5" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5" />
                      )}
                      {t.amount > 0 ? `+${t.amount}` : t.amount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-200">
                    {t.balance_after.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-xs">
                    {t.description || "—"}
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
