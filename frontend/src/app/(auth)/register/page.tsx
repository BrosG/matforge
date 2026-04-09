"use client";

import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Atom, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFirebaseAuth } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Phone auth state
  const [showPhone, setShowPhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);

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

      if (result?.error) {
        setError("Registration succeeded but sign-in failed. Please log in.");
        router.push("/login");
      } else {
        router.push("/dashboard");
      }
    } catch {
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
      const message = err instanceof Error ? err.message : "Google sign-up failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    setError("");
    if (!phoneNumber) {
      setError("Please enter a phone number");
      return;
    }
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      if (!auth || !recaptchaRef.current) {
        setError("Firebase not configured");
        setLoading(false);
        return;
      }
      const verifier = new RecaptchaVerifier(auth, recaptchaRef.current, { size: "invisible" });
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setConfirmationResult(confirmation);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send code";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setError("");
    if (!confirmationResult || !verificationCode) return;
    setLoading(true);
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
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid verification code";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-blue-50" />
      <div className="absolute top-32 -right-32 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl animate-blob" />
      <div className="absolute bottom-32 -left-32 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: "2s" }} />
      <div className="absolute inset-0 grid-pattern opacity-50" />

      <div className="relative flex-1 flex items-center justify-center px-4">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <Atom className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold">
                <span className="text-gray-900">Mat</span>
                <span className="gradient-text">Craft</span>
              </span>
            </Link>
            <p className="text-muted-foreground mt-2">
              Create your account
            </p>
          </div>

          {/* Card */}
          <div className="glass rounded-2xl p-8 shadow-xl border border-white/30">
            {!showPhone ? (
              <>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-2.5 border rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                      placeholder="Dr. Jane Smith"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 border rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                      placeholder="jane@university.edu"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                      placeholder="Min. 8 characters"
                      required
                      minLength={8}
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="gradient"
                    className="w-full"
                    size="lg"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white/80 px-3 text-muted-foreground">or</span>
                  </div>
                </div>

                {error && !loading && (
                  <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 mb-3">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <button
                    onClick={handleGoogleSignUp}
                    className="w-full flex items-center justify-center gap-2 border py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
                    disabled={loading}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Sign up with Google
                  </button>

                  <button
                    onClick={() => { setShowPhone(true); setError(""); }}
                    className="w-full flex items-center justify-center gap-2 border py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
                    disabled={loading}
                  >
                    <Phone className="h-4 w-4" />
                    Sign up with Phone
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-5">
                {error && (
                  <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                    {error}
                  </div>
                )}

                {!confirmationResult ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full px-4 py-2.5 border rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                        placeholder="+1 234 567 8900"
                        required
                      />
                    </div>
                    <Button
                      onClick={handleSendCode}
                      variant="gradient"
                      className="w-full"
                      size="lg"
                      disabled={loading}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send Verification Code
                    </Button>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Verification Code</label>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="w-full px-4 py-2.5 border rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                        placeholder="123456"
                        required
                      />
                    </div>
                    <Button
                      onClick={handleVerifyCode}
                      variant="gradient"
                      className="w-full"
                      size="lg"
                      disabled={loading}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Verify & Create Account
                    </Button>
                  </>
                )}

                <button
                  onClick={() => { setShowPhone(false); setConfirmationResult(null); setError(""); }}
                  className="w-full text-sm text-muted-foreground hover:underline"
                >
                  Back to email sign up
                </button>
              </div>
            )}

            <div ref={recaptchaRef} />

            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
