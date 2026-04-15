"use client";

import { useState, useRef, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Atom,
  Loader2,
  Phone,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { getFirebaseAuth } from "@/lib/firebase";
import { humanizeAuthError } from "@/lib/auth-errors";
import {
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1";

const PERKS = [
  "10 free credits on signup — no card needed",
  "205,000+ materials from MP, AFLOW & JARVIS",
  "3D Material Builder (browser, no install)",
  "IP Radar — 125M+ patent landscape",
  "AI inverse design & active learning campaigns",
];

// E.164 — leading +, 7-15 digits. Used for client-side validation only;
// Firebase performs the authoritative parse.
const E164 = /^\+[1-9]\d{6,14}$/;

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Phone auth state — always visible, no tabs.
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const recaptchaRef = useRef<HTMLDivElement>(null);

  const phoneValid = E164.test(phoneNumber);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "Registration failed");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        router.push("/login");
      } else {
        router.push(callbackUrl);
      }
    } catch (err) {
      console.error("[register] signIn threw", err);
      setError("Network error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        setError("Firebase not configured");
        setLoading(false);
        return;
      }
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const signInResult = await signIn("firebase", {
        idToken,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Sign-up failed. Please try again.");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setError(humanizeAuthError(err, "Google sign-up failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    setError("");
    if (!phoneValid) {
      setError("Enter a phone number in E.164 format (e.g. +33612345678).");
      return;
    }
    setPhoneLoading(true);
    try {
      const auth = getFirebaseAuth();
      if (!auth || !recaptchaRef.current) {
        setError("Phone sign-up is not configured.");
        setPhoneLoading(false);
        return;
      }
      const verifier = new RecaptchaVerifier(auth, recaptchaRef.current, {
        size: "invisible",
      });
      const confirmation = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        verifier,
      );
      setConfirmationResult(confirmation);
      setOtpSent(true);
    } catch (err: unknown) {
      setError(humanizeAuthError(err, "Failed to send verification code."));
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setError("");
    if (!confirmationResult || verificationCode.length < 6) return;
    setPhoneLoading(true);
    try {
      const result = await confirmationResult.confirm(verificationCode);
      const idToken = await result.user.getIdToken();
      const signInResult = await signIn("firebase", {
        idToken,
        redirect: false,
      });
      if (signInResult?.error) {
        setError("Sign-up failed. Please try again.");
      } else {
        router.push(callbackUrl);
      }
    } catch (err: unknown) {
      setError(humanizeAuthError(err, "Invalid verification code."));
    } finally {
      setPhoneLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Left branding */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/10 to-transparent" />
        <Link href="/" className="relative flex items-center gap-2.5">
          <Atom className="h-8 w-8 text-blue-400" />
          <span className="text-2xl font-black text-white">MatCraft</span>
        </Link>
        <div className="relative space-y-6">
          <h2 className="text-4xl font-black text-white leading-tight">
            Start for free.<br />Scale when ready.
          </h2>
          <p className="text-gray-400 text-lg max-w-sm">
            Join materials scientists, engineers and IP teams worldwide.
          </p>
          <div className="space-y-3">
            {PERKS.map((p) => (
              <div key={p} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm">{p}</span>
              </div>
            ))}
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-sm text-gray-300 italic mb-2">
              &ldquo;MatCraft replaced VESTA, 3 Python scripts, and our ICSD subscription in one browser tab.&rdquo;
            </p>
            <p className="text-xs text-gray-500">— Dr. M. Brennan, Computational Materials Lab</p>
          </div>
        </div>
        <p className="relative text-xs text-gray-600">
          © {new Date().getFullYear()} MatCraft · matcraft.ai
        </p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link href="/" className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <Atom className="h-7 w-7 text-blue-400" />
            <span className="text-xl font-black text-white">MatCraft</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-white mb-2">Create your account</h1>
            <p className="text-gray-400">
              Already have an account?{" "}
              <Link
                href={`/login${callbackUrl !== "/dashboard" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
              >
                Sign in →
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Google */}
          <button
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-xl border border-gray-200 transition-all mb-5 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            Continue with Google
          </button>

          {/* Email/password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder="Dr. Jane Smith"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  inputMode="email"
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder="jane@university.edu"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full pl-10 pr-12 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-1.5 flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        password.length >= (i + 1) * 3
                          ? i < 2
                            ? "bg-red-500"
                            : i < 3
                              ? "bg-amber-500"
                              : "bg-green-500"
                          : "bg-gray-700"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Create account
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-xs text-gray-600 uppercase tracking-wider">or sign up with phone</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          {/* Phone — always visible direct input */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d+]/g, ""))}
                  inputMode="tel"
                  autoComplete="tel"
                  pattern="^\+[1-9]\d{6,14}$"
                  disabled={otpSent}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-60"
                  placeholder="+33612345678"
                  aria-invalid={phoneNumber.length > 0 && !phoneValid}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                International format with country code (E.164). Example: +33612345678.
              </p>
            </div>

            {/* invisible reCAPTCHA mount — kept in the DOM at all times */}
            <div ref={recaptchaRef} />

            {!otpSent ? (
              <button
                type="button"
                onClick={handleSendCode}
                disabled={phoneLoading || !phoneValid}
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl border border-gray-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {phoneLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Send verification code
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    6-digit code sent to {phoneNumber}
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white text-center text-xl font-mono tracking-[0.5em] placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    placeholder="••••••"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={phoneLoading || verificationCode.length < 6}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {phoneLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Verify &amp; create account
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setVerificationCode("");
                    setConfirmationResult(null);
                  }}
                  className="w-full text-xs text-gray-500 hover:text-gray-400"
                >
                  ← Use a different number
                </button>
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-gray-700">
            By creating an account, you agree to our{" "}
            <Link href="/legal/terms" className="hover:text-gray-400">Terms</Link> and{" "}
            <Link href="/legal/privacy" className="hover:text-gray-400">Privacy Policy</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <RegisterForm />
    </Suspense>
  );
}
