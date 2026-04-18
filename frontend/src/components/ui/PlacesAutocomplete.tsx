"use client";

/**
 * SOTA Places autocomplete — one component, cost-optimal by design.
 *
 *  - Session tokens (UUID v4 generated on mount, reset after selection).
 *    Google bills Autocomplete + Details as one session SKU (~$0.017)
 *    instead of pay-per-keystroke.
 *  - 300ms input debounce — cuts outbound calls ~80% vs naive every-key.
 *  - Abort in-flight request on superseded input (no stale suggestions).
 *  - Keyboard nav: ArrowUp / ArrowDown / Enter / Escape.
 *  - Server fallback: the backend returns cached matches if Google errors
 *    or the API key is missing; we transparently render whatever it sends.
 *  - Graceful degradation: if the backend returns 0 suggestions, the user
 *    can still submit free-text (we preserve the raw value).
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Loader2, MapPin, Search } from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.matcraft.ai/api/v1";

interface Suggestion {
  place_id: string;
  text: string;
  main_text: string;
  secondary_text: string;
}

export interface PlaceValue {
  /** Raw text the user typed or selected. Always present. */
  text: string;
  /** Google place_id when the user picked a suggestion. */
  place_id?: string;
  /** Canonical formatted address after Details call. */
  formatted_address?: string;
  latitude?: number;
  longitude?: number;
}

interface PlacesAutocompleteProps {
  value: PlaceValue;
  onChange: (v: PlaceValue) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
  /** Opaque id sent to Google — one UUID per typing session. */
  sessionSeed?: string;
}

function newSessionToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for ancient browsers that forgot crypto.randomUUID.
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function PlacesAutocomplete({
  value,
  onChange,
  label = "Organization / Address",
  placeholder = "Start typing a company or address…",
  required,
  disabled,
  className,
  autoFocus,
  sessionSeed,
}: PlacesAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  // One session token per typing session. Regenerated after a successful
  // pick so the next lookup starts a fresh Google-billed session.
  const [sessionToken, setSessionToken] = useState<string>(
    () => sessionSeed || newSessionToken(),
  );
  const aborter = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  /* -------------------- debounced fetch -------------------- */

  useEffect(() => {
    const q = value.text.trim();
    // Don't call Google for 0-1 char queries (noisy, expensive, bad UX).
    if (q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      aborter.current?.abort();
      const controller = new AbortController();
      aborter.current = controller;
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/places/autocomplete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: q,
            session_token: sessionToken,
            language:
              typeof navigator !== "undefined"
                ? navigator.language.slice(0, 2)
                : "en",
          }),
          signal: controller.signal,
        });
        if (!res.ok) {
          setSuggestions([]);
          return;
        }
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setOpen(true);
        setActiveIdx(-1);
      } catch (err) {
        // AbortError is expected when a new keystroke supersedes.
        if ((err as { name?: string } | null)?.name !== "AbortError") {
          console.error("[places] autocomplete failed", err);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value.text, sessionToken]);

  /* -------------------- resolve details on pick -------------------- */

  const pick = useCallback(
    async (s: Suggestion) => {
      setOpen(false);
      // Optimistic: show the display text immediately.
      onChange({
        text: s.text,
        place_id: s.place_id,
      });
      try {
        const res = await fetch(`${API_BASE}/places/details`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            place_id: s.place_id,
            session_token: sessionToken,
            language:
              typeof navigator !== "undefined"
                ? navigator.language.slice(0, 2)
                : "en",
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const p = data.place;
          onChange({
            text: p.formatted_address || p.display_name || s.text,
            place_id: p.place_id,
            formatted_address: p.formatted_address,
            latitude: p.latitude,
            longitude: p.longitude,
          });
        }
      } catch (err) {
        console.error("[places] details failed", err);
      } finally {
        // Fresh session for the next lookup — keeps Google billing tidy.
        setSessionToken(newSessionToken());
      }
    },
    [onChange, sessionToken],
  );

  /* -------------------- keyboard nav -------------------- */

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open || !suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      pick(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  /* -------------------- click-outside to close -------------------- */

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  const inputId = useMemo(
    () => `places-${Math.random().toString(36).slice(2, 8)}`,
    [],
  );

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-300 mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {loading ? (
          <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 animate-spin" />
        ) : (
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        )}
        <input
          id={inputId}
          type="text"
          value={value.text}
          onChange={(e) =>
            onChange({
              ...value,
              text: e.target.value,
              // Typing invalidates any previously-selected place_id.
              place_id: undefined,
              formatted_address: undefined,
              latitude: undefined,
              longitude: undefined,
            })
          }
          onFocus={() => suggestions.length && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete="off"
          className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-60"
        />
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 left-0 right-0 rounded-xl border border-gray-700 bg-gray-900 shadow-2xl overflow-hidden">
          <ul role="listbox" aria-label="Address suggestions">
            {suggestions.map((s, i) => (
              <li
                key={s.place_id}
                role="option"
                aria-selected={i === activeIdx}
                onMouseEnter={() => setActiveIdx(i)}
                onMouseDown={(e) => {
                  e.preventDefault(); // keep input focus
                  pick(s);
                }}
                className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  i === activeIdx ? "bg-gray-800" : "hover:bg-gray-800/60"
                }`}
              >
                <MapPin className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm text-white font-medium truncate">
                    {s.main_text || s.text}
                  </div>
                  {s.secondary_text && (
                    <div className="text-xs text-gray-500 truncate">
                      {s.secondary_text}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="px-4 py-2 border-t border-gray-800 text-[10px] text-gray-600 flex items-center justify-between">
            <span>↑↓ navigate · Enter to pick · Esc to close</span>
            <span className="italic">Powered by Google Places</span>
          </div>
        </div>
      )}
    </div>
  );
}
