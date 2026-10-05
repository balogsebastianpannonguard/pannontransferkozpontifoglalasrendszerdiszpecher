"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BellRing,
  Car,
  ChevronRight,
  Loader2,
  MapPin,
  MessageSquareText,
  RefreshCw,
  Search,
  Smile,
  Frown,
  Star,
  UserCircle2,
  FlaskConical,
  Send,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import type { BookingEase, ConcernArea, FeedbackItem } from "@/lib/feedbacks";

type Filter = "all" | "satisfied" | "unsatisfied" | "test";

const CONCERN_LABEL: Record<ConcernArea, string> = {
  booking: "Foglalási folyamat",
  notifications: "Értesítések",
  driver: "Sofőr",
  vehicle: "Jármű",
  other: "Egyéb",
};

const EASE_LABEL: Record<BookingEase, string> = {
  very_easy: "Nagyon könnyű",
  easy: "Könnyű",
  neutral: "Semleges",
  difficult: "Nehéz",
  very_difficult: "Nagyon nehéz",
};

const EASE_SCORE: Record<BookingEase, number> = { very_easy: 5, easy: 4, neutral: 3, difficult: 2, very_difficult: 1 };

function easeTone(ease: BookingEase) {
  const score = EASE_SCORE[ease] ?? 3;
  if (score >= 4) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (score === 3) return "bg-slate-100 text-slate-600 border-slate-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
}

function formatWhen(timestamp: number) {
  return new Date(timestamp).toLocaleString("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Stat({ label, value, sub, icon, tone }: { label: string; value: string; sub?: string; icon: React.ReactNode; tone: string }) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-900/[0.04]">
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg ${tone}`}>{icon}</div>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-1 font-serif text-[30px] font-bold leading-none tracking-tight text-slate-900">{value}</div>
      {sub && <div className="mt-2 text-xs font-medium text-slate-500">{sub}</div>}
    </div>
  );
}

function TextBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
      <div className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{title}</div>
      <p className="whitespace-pre-wrap text-[13px] font-medium leading-relaxed text-slate-700">{text}</p>
    </div>
  );
}

function TestFeedbackPanel({ defaultEmail, onSubmittedHint }: { defaultEmail: string; onSubmittedHint: () => void }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [language, setLanguage] = useState<"hu" | "en">("en");
  const [busy, setBusy] = useState<"send" | "open" | null>(null);
  const [result, setResult] = useState<{ url: string; sent: boolean; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(mode: "send" | "open") {
    setError(null);
    setResult(null);
    setBusy(mode);
    try {
      const response = await fetch("/api/feedback/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, language, sendEmail: mode === "send" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) {
        if (data.url) setResult({ url: data.url, sent: false, email });
        throw new Error(data.error || "A próba visszajelzés nem hozható létre.");
      }
      setResult({ url: data.url, sent: Boolean(data.sent), email: data.email });
      if (mode === "open") window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "A próba visszajelzés nem hozható létre.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-dashed border-amber-300/80 bg-gradient-to-br from-amber-50/80 via-white to-white shadow-xl shadow-slate-900/[0.04]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition active:bg-amber-50/60 sm:px-6"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/25">
          <FlaskConical className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold text-slate-900">Próba feedback (NI)</span>
          <span className="block text-xs font-medium text-slate-500">Nézd meg, hogyan látja az utas a levelet és a kérdőívet – a Location Support nem kap semmit.</span>
        </span>
        <ChevronRight className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <div className="space-y-5 border-t border-amber-200/70 px-5 py-5 sm:px-6">
          <ol className="grid gap-3 text-[13px] font-medium text-slate-600 sm:grid-cols-3">
            <li className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3"><b className="text-slate-900">1.</b> Add meg a címet, ahová a próba levél menjen.</li>
            <li className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3"><b className="text-slate-900">2.</b> Nyisd meg a levélben a linket, és töltsd ki a kérdőívet.</li>
            <li className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3"><b className="text-slate-900">3.</b> Az összefoglaló levél ugyanide érkezik (ezt kapná a Location Support).</li>
          </ol>

          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">E-mail cím</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pelda@cim.hu"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Nyelv</label>
              <div className="flex rounded-xl border border-slate-200 bg-slate-100/80 p-1">
                {(["hu", "en"] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLanguage(code)}
                    className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wider transition active:scale-95 ${language === code ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy !== null || !email.trim()}
              onClick={() => void run("send")}
              className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-slate-900/25 transition duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "send" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Próba levél küldése
            </button>
            <button
              type="button"
              disabled={busy !== null || !email.trim()}
              onClick={() => void run("open")}
              className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-xs font-black uppercase tracking-widest text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "open" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />} Csak a kérdőív megnyitása
            </button>
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          {result && (
            <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {result.sent ? `A próba levél elküldve ide: ${result.email}` : "A próba kérdőív létrejött."}
              </div>
              <div className="text-xs font-medium text-emerald-700">
                A kitöltés összefoglalója ide érkezik: {result.email}. A kitöltött próba a „Próbák” fülön jelenik meg.
              </div>
              <a href={result.url} target="_blank" rel="noopener noreferrer" onClick={onSubmittedHint} className="inline-flex items-center gap-1.5 break-all text-xs font-black text-emerald-800 underline decoration-emerald-300 underline-offset-2">
                <ExternalLink className="h-3.5 w-3.5 shrink-0" /> Kérdőív megnyitása
              </a>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export function FeedbackView({ isAdmin = false, defaultTestEmail = "" }: { isAdmin?: boolean; defaultTestEmail?: string }) {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/feedback", { credentials: "include", cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "A visszajelzések nem tölthetők be.");
      setItems(data.feedbacks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "A visszajelzések nem tölthetők be.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const realItems = useMemo(() => items.filter((i) => !i.test), [items]);
  const testItems = useMemo(() => items.filter((i) => i.test), [items]);

  const stats = useMemo(() => {
    const total = realItems.length;
    const satisfied = realItems.filter((i) => i.satisfied).length;
    const notified = realItems.filter((i) => i.notificationReceived).length;
    const scored = realItems.filter((i) => EASE_SCORE[i.bookingEase]);
    const avg = scored.length ? scored.reduce((sum, i) => sum + EASE_SCORE[i.bookingEase], 0) / scored.length : 0;
    const pct = (n: number) => (total ? `${Math.round((n / total) * 100)}%` : "–");
    return { total, satisfied, unsatisfied: total - satisfied, satisfiedPct: pct(satisfied), notifiedPct: pct(notified), avg };
  }, [realItems]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (filter === "test" ? testItems : realItems).filter((i) => {
      if (filter === "satisfied" && !i.satisfied) return false;
      if (filter === "unsatisfied" && i.satisfied) return false;
      if (!q) return true;
      return [i.bookingCode, i.respondentName, i.respondentEmail, i.driverName, i.companyName, i.experience, i.difficulties]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [realItems, testItems, filter, query]);

  const tabs: Array<{ id: Filter; label: string; count: number }> = [
    { id: "all", label: "Mind", count: stats.total },
    { id: "satisfied", label: "Elégedett", count: stats.satisfied },
    { id: "unsatisfied", label: "Nem elégedett", count: stats.unsatisfied },
    ...(isAdmin || testItems.length > 0 ? [{ id: "test" as const, label: "Próbák", count: testItems.length }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-0.5 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Utasok véleménye</div>
          <h2 className="font-serif text-[28px] font-bold leading-tight tracking-tight text-slate-900">Visszajelzések</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            A lezárt utak után az utasok által kitöltött kérdőívek. A Location Support minden visszajelzésről e-mailben értesítést kap.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-widest text-slate-600 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow active:translate-y-0 active:scale-95"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Frissítés
        </button>
      </div>

      {isAdmin && <TestFeedbackPanel defaultEmail={defaultTestEmail} onSubmittedHint={() => setFilter("test")} />}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat label="Összes visszajelzés" value={String(stats.total)} icon={<MessageSquareText className="h-5 w-5" />} tone="bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-600/25" />
        <Stat
          label="Elégedett"
          value={stats.satisfiedPct}
          sub={stats.total ? `${stats.satisfied} igen · ${stats.unsatisfied} nem` : undefined}
          icon={<Smile className="h-5 w-5" />}
          tone="bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-600/25"
        />
        <Stat
          label="Értesítést megkapta"
          value={stats.notifiedPct}
          sub="12–24 órával az út előtt"
          icon={<BellRing className="h-5 w-5" />}
          tone="bg-gradient-to-br from-amber-400 to-orange-600 shadow-amber-600/25"
        />
        <Stat
          label="Foglalási felület"
          value={stats.total ? `${stats.avg.toFixed(1)} / 5` : "–"}
          sub="1 = nagyon nehéz · 5 = nagyon könnyű"
          icon={<Star className="h-5 w-5" />}
          tone="bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-violet-600/25"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-100/80 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition duration-200 active:scale-95 ${
                filter === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-black ${filter === tab.id ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"}`}>{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Keresés (foglalás, utas, sofőr…)"
            className="w-full rounded-xl border border-slate-200/80 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center rounded-3xl border border-slate-200/80 bg-white py-20">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
          <AlertTriangle className="h-5 w-5 shrink-0" /> {error}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-slate-200/80 bg-white px-6 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50">
            <MessageSquareText className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
          </div>
          <div className="font-serif text-xl font-bold text-slate-700">
            {items.length === 0 ? "Még nem érkezett visszajelzés" : filter === "test" ? "Még nincs próba visszajelzés" : "Nincs a szűrésnek megfelelő visszajelzés"}
          </div>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {items.length === 0
              ? "Amint egy utas kitölti a kérdőívet az út lezárása után, itt fog megjelenni."
              : "Próbálj másik szűrőt vagy keresőszót."}
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {visible.map((item) => (
            <li key={item.id} className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-900/[0.04] transition duration-200 hover:shadow-2xl hover:shadow-slate-900/[0.07] sm:p-6">
              <div className={`absolute inset-y-0 left-0 w-1.5 ${item.satisfied ? "bg-gradient-to-b from-emerald-400 to-teal-600" : "bg-gradient-to-b from-amber-400 to-orange-600"}`} />
              <div className="flex flex-wrap items-start justify-between gap-3 pl-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[16px] font-bold text-slate-900">{item.respondentName || item.respondentEmail}</span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                        item.satisfied ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      {item.satisfied ? <Smile className="h-3 w-3" /> : <Frown className="h-3 w-3" />}
                      {item.satisfied ? "Elégedett" : "Nem elégedett"}
                    </span>
                    {item.test && <span className="rounded-md border border-amber-300 bg-amber-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-800">Próba</span>}
                    {item.companyName && <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{item.companyName}</span>}
                  </div>
                  <div className="mt-1 text-xs font-medium text-slate-400">{item.respondentEmail}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-bold text-slate-500">{formatWhen(item.createdAt)}</div>
                  {item.bookingId && (
                    <Link
                      href={`/bookings/${item.bookingId}`}
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-blue-700 transition hover:text-blue-900"
                    >
                      #{item.bookingCode} <ChevronRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 pl-2 text-[12px] font-medium text-slate-500">
                {(item.fromAddress || item.toAddress) && (
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{[item.fromAddress, item.toAddress].filter(Boolean).join(" → ")}</span>
                  </span>
                )}
                {item.pickupDate && (
                  <span className="inline-flex items-center gap-1.5">
                    {item.pickupDate} {item.pickupTime}
                  </span>
                )}
                {item.driverName && (
                  <span className="inline-flex items-center gap-1.5">
                    <UserCircle2 className="h-3.5 w-3.5 text-slate-400" /> {item.driverName}
                  </span>
                )}
                {item.vehicleName && (
                  <span className="inline-flex items-center gap-1.5">
                    <Car className="h-3.5 w-3.5 text-slate-400" /> {item.vehicleName}
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 pl-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                    item.notificationReceived ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                >
                  <BellRing className="h-3 w-3" /> Értesítés: {item.notificationReceived ? "megkapta" : "nem kapta meg"}
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${easeTone(item.bookingEase)}`}>
                  <Star className="h-3 w-3" /> Foglalási felület: {EASE_LABEL[item.bookingEase] ?? item.bookingEase}
                </span>
                {item.concerns.map((concern) => (
                  <span key={concern} className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700">
                    {concern === "other" && item.concernOther ? `Egyéb: ${item.concernOther}` : CONCERN_LABEL[concern] ?? concern}
                  </span>
                ))}
              </div>

              {(item.experience || item.difficulties) && (
                <div className="mt-4 grid gap-3 pl-2 md:grid-cols-2">
                  {item.experience && <TextBlock title="Tapasztalat" text={item.experience} />}
                  {item.difficulties && <TextBlock title="Leírt nehézségek" text={item.difficulties} />}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
