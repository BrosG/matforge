"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Atom, Loader2, Mail, Lock, Eye, EyeOff, ChevronRight, Sparkles } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password. Please try again.");
    } else {
      router.push(callbackUrl);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl });
  };

  const handleGuest = async () => {
    setLoading(true);
    const result = await signIn("credentials", { guest: "true", redirect: false });
    setLoading(false);
    if (!result?.error) router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Left — branding */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

        <Link href="/" className="relative flex items-center gap-2.5">
          <Atom className="h-8 w-8 text-blue-400" />
          <span className="text-2xl font-black text-white">MatCraft</span>
        </Link>

        <div className="relative space-y-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Free to get started</span>
          </div>
          <h2 className="text-4xl font-black text-white leading-tight">
            The OS for<br />Materials Discovery
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
            205,000+ materials, AI screening, 3D builder, and IP radar — all in your browser.
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            {[
              { value: "205k+", label: "Materials" },
              { value: "10", label: "Free credits" },
              { value: "125M+", label: "Patents" },
              { value: "0$", label: "To start" },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="text-xl font-black text-white">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-gray-600">
          © {new Date().getFullYear()} MatCraft · matcraft.ai
        </p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Mobile logo */}
          <Link href="/" className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <Atom className="h-7 w-7 text-blue-400" />
            <span className="text-xl font-black text-white">MatCraft</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-white mb-2">Welcome back</h1>
            <p className="text-gray-400">
              Don&apos;t have an account?{" "}
              <Link href={`/register${callbackUrl !== "/dashboard" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                Sign up free →
              </Link>
            </p>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-xl border border-gray-200 transition-all mb-6 disabled:opacity-60"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-800" /></div>
            <div className="relative flex justify-center text-xs text-gray-500 bg-gray-950 px-3">
              <span className="bg-gray-900 px-3">or sign in with email</span>
            </div>
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-300">Password</label>
                <Link href="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300">Forgot?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign In <ChevronRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button onClick={handleGuest} className="text-xs text-gray-500 hover:text-gray-400 transition-colors">
              Continue as guest →
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-gray-600">
            By signing in, you agree to our{" "}
            <Link href="/legal/terms" className="hover:text-gray-400">Terms</Link> and{" "}
            <Link href="/legal/privacy" className="hover:text-gray-400">Privacy Policy</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <LoginForm />
    </Suspense>
  );
}
