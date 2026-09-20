"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Clock, Loader2, Lock, RefreshCw, X } from "lucide-react";

interface PriceApprovalRequest {
  requestedPrice: number;
  requestedBy: string;
  requestedAt: number;
  originalPrice?: number;
  reason?: string;
}

interface PendingApprovalBooking {
  _id: string;
  bookingCode: string;
  travelerName: string;
  fromAddress: string;
  toAddress: string;
  pickupDate: string;
  pickupTime: string;
  priceApprovalRequest: PriceApprovalRequest;
  priceApprovalStatus: "pending_approval";
}

interface PriceApprovalWidgetProps {
  userRole: "admin" | "dispatcher" | "partner";
}

export default function PriceApprovalWidget({ userRole }: PriceApprovalWidgetProps) {
  const [pendingBookings, setPendingBookings] = useState<PendingApprovalBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [decisionComments, setDecisionComments] = useState<Record<string, string>>({});
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<{ id: number; type: "success" | "error"; text: string }[]>([]);
  const toastIdRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (userRole !== "admin") return null;

  function pushToast(type: "success" | "error", text: string) {
    toastIdRef.current += 1;
    const id = toastIdRef.current;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  async function fetchPending() {
    try {
      setLoading(true);
      const res = await fetch("/api/bookings?priceApprovalStatus=pending_approval");
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.bookings) {
        setPendingBookings(
          data.bookings.filter(
            (b: any) => b.priceApprovalStatus === "pending_approval" && b.priceApprovalRequest
          ) as PendingApprovalBooking[]
        );
      }
    } catch (err) {
      console.error("[PriceApprovalWidget] fetchPending error:", err);
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }

  useEffect(() => {
    fetchPending();
    pollRef.current = setInterval(fetchPending, 30_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDecision(bookingId: string, decision: "approved" | "rejected") {
    const comment = decisionComments[bookingId] || "";
    setProcessingIds((prev) => new Set([...prev, bookingId]));
    try {
      const res = await fetch(`/api/bookings/${bookingId}/price-approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, comment }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Hiba történt");
      pushToast(
        "success",
        decision === "approved" ? "Ár jóváhagyva" : "Ár elutasítva"
      );
      setPendingBookings((prev) => prev.filter((b) => b._id !== bookingId));
      setDecisionComments((prev) => {
        const copy = { ...prev };
        delete copy[bookingId];
        return copy;
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ismeretlen hiba";
      pushToast("error", msg);
    } finally {
      setProcessingIds((prev) => {
        const copy = new Set(prev);
        copy.delete(bookingId);
        return copy;
      });
    }
  }

  // Ne jelenjen meg az üres állapot az első lekérés előtt: ez okozta a villogást.
  if (!hasLoaded || (pendingBookings.length === 0 && !loading)) return null;

  return (
    <>
      <div className="rounded-3xl bg-white border border-amber-200 shadow-lg shadow-amber-500/[0.06] overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-500/30 flex items-center justify-center text-white">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black tracking-[0.2em] uppercase text-amber-600">Admin feladat</div>
              <h3 className="font-sans font-black text-[16px] tracking-tight text-slate-900 leading-none">
                Ár jóváhagyások
                {pendingBookings.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-black">
                    {pendingBookings.length}
                  </span>
                )}
              </h3>
            </div>
          </div>
          <button
            onClick={() => fetchPending()}
            disabled={loading}
            className="w-8 h-8 rounded-xl bg-white border border-amber-200 flex items-center justify-center text-amber-600 hover:bg-amber-50 transition"
            title="Frissítés"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading && pendingBookings.length === 0 ? (
          <div className="px-6 py-8 flex items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Betöltés…</span>
          </div>
        ) : (
          <ul className="divide-y divide-amber-100">
            {pendingBookings.map((booking) => {
              const isProcessing = processingIds.has(booking._id);
              const req = booking.priceApprovalRequest;
              return (
                <li key={booking._id} className="px-6 py-5">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <a
                          href={`/bookings/${booking._id}`}
                          className="font-black text-slate-900 text-[14px] hover:text-amber-700 transition"
                        >
                          #{booking.bookingCode}
                        </a>
                        <span className="text-slate-500 text-xs font-medium">·</span>
                        <span className="text-xs font-medium text-slate-600">{booking.travelerName}</span>
                      </div>
                      <div className="text-xs text-slate-500 mb-2">
                        {booking.fromAddress} → {booking.toAddress}
                        <span className="mx-1.5">·</span>
                        {booking.pickupDate} {booking.pickupTime}
                      </div>
                      <div className="flex flex-wrap gap-3 mb-3 text-xs">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-bold">
                          <Clock className="w-3 h-3" />
                          {new Date(req.requestedAt).toLocaleString("hu-HU")}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold">
                          Diszpécer: {req.requestedBy}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-black">
                          Kért ár: {req.requestedPrice.toLocaleString("hu-HU")} Ft
                        </span>
                        {req.originalPrice !== undefined && req.originalPrice !== null && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 font-medium">
                            Eredeti: {req.originalPrice.toLocaleString("hu-HU")} Ft
                          </span>
                        )}
                      </div>
                      {req.reason && (
                        <div className="text-xs text-slate-600 italic mb-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
                          &ldquo;{req.reason}&rdquo;
                        </div>
                      )}
                      <div className="mb-3">
                        <input
                          type="text"
                          value={decisionComments[booking._id] || ""}
                          onChange={(e) =>
                            setDecisionComments((prev) => ({ ...prev, [booking._id]: e.target.value }))
                          }
                          placeholder="Megjegyzés (opcionális)…"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 transition"
                          disabled={isProcessing}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDecision(booking._id, "approved")}
                          disabled={isProcessing}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black tracking-widest uppercase shadow-md shadow-emerald-500/25 hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Elfogad
                        </button>
                        <button
                          onClick={() => handleDecision(booking._id, "rejected")}
                          disabled={isProcessing}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white text-xs font-black tracking-widest uppercase shadow-md shadow-rose-500/25 hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                          Elutasít
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Toast értesítések */}
      <div className="fixed bottom-5 left-5 z-[60] space-y-2 max-w-xs pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-2xl shadow-xl border px-4 py-3 flex items-center gap-3 text-sm font-bold ${
              t.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {t.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <X className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            {t.text}
          </div>
        ))}
      </div>
    </>
  );
}
