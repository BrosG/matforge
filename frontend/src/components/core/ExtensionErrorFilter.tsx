"use client";

import { useEffect } from "react";

/**
 * Suppresses noisy unhandled-promise rejections originating from browser
 * extensions injecting `inpage.js` into every page (MetaMask, Phantom,
 * Coinbase Wallet, etc.). These errors are not from our code — the
 * extension auto-attempts a Web3 connection and fails because we don't
 * use Web3.
 *
 * Without this, the user's console fills with cryptic
 *   "Failed to connect to MetaMask"
 * warnings on every page load, masking real errors.
 */
const EXTENSION_NOISE = [
  /MetaMask/i,
  /Phantom/i,
  /Coinbase Wallet/i,
  /chrome-extension:\/\//i,
  /moz-extension:\/\//i,
  /inpage\.js/i,
  /provider-injection/i,
];

function looksLikeExtensionError(reason: unknown): boolean {
  if (!reason) return false;
  const message =
    reason instanceof Error
      ? `${reason.message} ${reason.stack ?? ""}`
      : String(reason);
  return EXTENSION_NOISE.some((re) => re.test(message));
}

export function ExtensionErrorFilter() {
  useEffect(() => {
    const onRejection = (event: PromiseRejectionEvent) => {
      if (looksLikeExtensionError(event.reason)) {
        // Stop the rejection from being logged as "Uncaught (in promise)".
        event.preventDefault();
      }
    };
    const onError = (event: ErrorEvent) => {
      if (
        looksLikeExtensionError(event.error) ||
        looksLikeExtensionError(event.message) ||
        (event.filename && EXTENSION_NOISE.some((re) => re.test(event.filename)))
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("error", onError, true);
    return () => {
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("error", onError, true);
    };
  }, []);

  return null;
}
