/**
 * Maps raw errors from Firebase / NextAuth / the backend into user-friendly
 * messages. Never surface minified errors like "t is not iterable" to end
 * users — those indicate bugs (usually Firebase config missing or NextAuth
 * /api/auth returning HTML) and must be swallowed into a generic fallback
 * while being logged for debugging.
 */

const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  "auth/popup-closed-by-user": "Sign-in cancelled.",
  "auth/popup-blocked": "Popup blocked. Please allow popups and try again.",
  "auth/cancelled-popup-request": "Sign-in cancelled.",
  "auth/account-exists-with-different-credential":
    "An account already exists with this email. Try a different sign-in method.",
  "auth/network-request-failed": "Network error. Check your connection.",
  "auth/too-many-requests": "Too many attempts. Please wait and try again.",
  "auth/invalid-phone-number": "Invalid phone number. Include country code (e.g. +33).",
  "auth/invalid-verification-code": "Invalid verification code.",
  "auth/code-expired": "Verification code expired. Request a new one.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/operation-not-allowed":
    "This sign-in method is not enabled. Contact support.",
  "auth/invalid-api-key": "Authentication service unavailable.",
  "auth/configuration-not-found": "Authentication service unavailable.",
};

// Minified runtime errors that leak from third-party SDKs. Never show raw.
const MINIFIED_PATTERNS = [
  /is not iterable/i,
  /is not a function/i,
  /undefined is not an object/i,
  /cannot read propert(y|ies) of (undefined|null)/i,
  /^[a-z]\s/i, // starts with a single minified var like "t "
];

export function humanizeAuthError(err: unknown, fallback: string): string {
  if (!err) return fallback;

  // Firebase error shape: { code: "auth/xxx", message: "..." }
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = String((err as { code: unknown }).code);
    if (code in FIREBASE_ERROR_MESSAGES) return FIREBASE_ERROR_MESSAGES[code];
    if (code.startsWith("auth/")) {
      return `Sign-in failed (${code.replace("auth/", "")}). Please try again.`;
    }
  }

  const rawMessage =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "";

  if (!rawMessage) return fallback;

  // Redact minified / cryptic runtime errors.
  for (const pattern of MINIFIED_PATTERNS) {
    if (pattern.test(rawMessage)) {
      // eslint-disable-next-line no-console
      console.error("[auth] cryptic error redacted for UI:", rawMessage, err);
      return fallback;
    }
  }

  // Firebase sometimes wraps the code in the message: "Firebase: Error (auth/xxx)."
  const codeMatch = rawMessage.match(/\(auth\/([a-z-]+)\)/);
  if (codeMatch) {
    const code = `auth/${codeMatch[1]}`;
    if (code in FIREBASE_ERROR_MESSAGES) return FIREBASE_ERROR_MESSAGES[code];
  }

  return rawMessage.length > 160 ? fallback : rawMessage;
}
