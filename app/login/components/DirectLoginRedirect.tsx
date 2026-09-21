"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * Rendered only when /login is visited with a valid ?token= direct-login link.
 * Automatically authenticates on mount and redirects — no form, no click needed.
 * Falls back to the normal login page if the request fails for any reason.
 */
export default function DirectLoginRedirect({ token }: { token: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/direct-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          cache: "no-store",
        });
        const json = await res.json().catch(() => null);
        if (!cancelled && res.ok && json?.success) {
          window.location.href = "/";
          return;
        }
      } catch {
        // ignore, fall through to failed state below
      }
      if (!cancelled) setFailed(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (failed) {
      window.location.href = "/login";
    }
  }, [failed]);

  return (
    <div className="relative min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-[#0056D2] animate-spin" />
        <p className="text-[13px] text-slate-400 font-medium tracking-wide">
          Bejelentkezés...
        </p>
      </div>
    </div>
  );
}
