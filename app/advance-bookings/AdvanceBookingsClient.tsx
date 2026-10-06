"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarPlus,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Copy,
  Loader2,
  Plane,
  Plus,
  Save,
  Trash2,
  UserCircle2,
  Users2,
} from "lucide-react";
import { getAllPartnerMeta, resolvePartnerMeta } from "@/lib/partner-meta";
import { looksLikeAirport } from "@/lib/airport-detect";
import type { AdvanceListItem } from "@/lib/advance-bookings";

interface Viewer {
  email: string;
  name: string;
  role: string;
}

interface Row {
  key: string;
  date: string;
  time: string;
  company: string;
  pax: string;
  from: string;
  to: string;
  flight: string;
  name: string;
  phone: string;
  comment: string;
  more: boolean;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[15px] font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100";
const labelClass = "mb-1.5 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-400";

let keyCounter = 0;
const newKey = () => `r${Date.now().toString(36)}${(keyCounter++).toString(36)}`;
const newBatchId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : newKey() + Math.random().toString(36).slice(2));

function emptyRow(seed?: Partial<Row>): Row {
  return { key: newKey(), date: "", time: "", company: "", pax: "", from: "", to: "", flight: "", name: "", phone: "", comment: "", more: false, ...seed };
}

function defaultMonth(): string {
  const d = new Date();
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

function firstOfMonth(month: string): string {
  return `${month}-01`;
}

/** "szucs.eva@pannonguard.hu" → "Szucs Eva" – ha nincs mentett név. */
function prettyActor(name?: string, email?: string): string {
  const source = (name && name.includes("@") ? name.split("@")[0] : name) || (email ? email.split("@")[0] : "");
  return source
    .split(/[._\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function CompanyChip({ company }: { company: string }) {
  const typed = company.trim();
  if (!typed) return null;
  const meta = resolvePartnerMeta({ companyName: typed });
  if (meta) {
    return (
      <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Beállított cég: {meta.name}
      </span>
    );
  }
  return (
    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Új cég – szürke jelölés a naptárban
    </span>
  );
}

export default function AdvanceBookingsClient({ viewer }: { viewer: Viewer }) {
  const router = useRouter();
  const [month] = useState(defaultMonth);
  const [rows, setRows] = useState<Row[]>(() => [emptyRow()]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const batchId = useRef(newBatchId());

  const [items, setItems] = useState<AdvanceListItem[]>([]);
  const [listMonth, setListMonth] = useState(month);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [onlyMine, setOnlyMine] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadList = useCallback(async (target: string) => {
    setListLoading(true);
    setListError(null);
    try {
      const res = await fetch(`/api/advance-bookings?month=${target}`, { credentials: "include", cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.replace("/login?next=/advance-bookings");
        return;
      }
      if (!res.ok) throw new Error(data.error || "A lista nem tölthető be.");
      setItems(data.items || []);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "A lista nem tölthető be.");
    } finally {
      setListLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadList(listMonth), 0);
    return () => window.clearTimeout(timer);
  }, [listMonth, loadList]);

  const companyOptions = useMemo(() => {
    const names = new Set<string>(getAllPartnerMeta().map((m) => m.name));
    for (const item of items) if (item.companyName) names.add(item.companyName);
    return Array.from(names).sort((a, b) => a.localeCompare(b, "hu"));
  }, [items]);

  const update = (key: string, patch: Partial<Row>) => {
    setRows((current) => current.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: "" }));
  };

  const addRow = () =>
    setRows((current) => {
      const last = current[current.length - 1];
      // Az új sor átveszi az előző dátumát, cégét és idejét – a menetrendet gyors végigvinni
      return [...current, emptyRow(last ? { date: last.date, company: last.company, time: last.time } : { date: firstOfMonth(month) })];
    });

  const duplicateRow = (key: string) =>
    setRows((current) => {
      const index = current.findIndex((r) => r.key === key);
      if (index < 0) return current;
      const copy = { ...current[index], key: newKey() };
      return [...current.slice(0, index + 1), copy, ...current.slice(index + 1)];
    });

  const removeRow = (key: string) =>
    setRows((current) => (current.length === 1 ? [emptyRow({ date: current[0].date })] : current.filter((r) => r.key !== key)));

  const filledRows = rows.filter((r) => r.date || r.time || r.company || r.pax || r.from || r.to);

  function checkRow(r: Row): string | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) return "Add meg a dátumot.";
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(r.time)) return "Add meg az időpontot.";
    if (!r.company.trim()) return "Add meg a céget.";
    const pax = Number(r.pax);
    if (!Number.isInteger(pax) || pax < 1 || pax > 60) return "Az utasok száma 1 és 60 között legyen.";
    if (!r.from.trim()) return "Add meg, honnan indul.";
    if (!r.to.trim()) return "Add meg, hová megy.";
    return null;
  }

  async function save() {
    setBanner(null);
    if (filledRows.length === 0) {
      setBanner({ kind: "error", text: "Tölts ki legalább egy sort." });
      return;
    }
    const nextErrors: Record<string, string> = {};
    for (const r of filledRows) {
      const problem = checkRow(r);
      if (problem) nextErrors[r.key] = problem;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setBanner({ kind: "error", text: `${Object.keys(nextErrors).length} sorban hiányzik vagy hibás egy adat – nézd át a pirossal jelölt sorokat.` });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/advance-bookings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: batchId.current,
          trips: filledRows.map((r) => ({
            pickupDate: r.date,
            pickupTime: r.time,
            companyName: r.company,
            travelers: Number(r.pax),
            fromAddress: r.from,
            toAddress: r.to,
            flightNumber: r.flight,
            travelerName: r.name,
            travelerPhone: r.phone,
            comment: r.comment,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.replace("/login?next=/advance-bookings");
        return;
      }
      if (data.alreadySaved) {
        setRows([emptyRow({ date: filledRows[filledRows.length - 1]?.date })]);
        batchId.current = newBatchId();
        setBanner({ kind: "ok", text: "Ezek az utak már mentve vannak." });
        void loadList(listMonth);
        return;
      }
      if (!res.ok && !data.results) throw new Error(data.error || "A mentés nem sikerült.");

      const results: Array<{ index: number; ok: boolean; error?: string }> = data.results || [];
      const failed = results.filter((x) => !x.ok);
      const failedKeys = new Map(failed.map((x) => [filledRows[x.index]?.key, x.error || "A mentés nem sikerült."]));
      const saved = results.length - failed.length;

      if (failed.length === 0) {
        const lastDate = filledRows[filledRows.length - 1]?.date;
        setRows([emptyRow({ date: lastDate })]);
        setErrors({});
        batchId.current = newBatchId();
        setBanner({ kind: "ok", text: `${saved} út felvéve – megjelennek a központi naptárban.` });
      } else {
        // Csak a hibás sorok maradnak, a többi mentve van
        setRows(filledRows.filter((r) => failedKeys.has(r.key)));
        setErrors(Object.fromEntries(Array.from(failedKeys.entries()).map(([k, v]) => [k as string, v])));
        batchId.current = newBatchId();
        setBanner({ kind: "error", text: `${saved} út mentve, ${failed.length} sor hibás maradt – javítsd, és mentsd újra.` });
      }
      const savedMonth = filledRows[0]?.date?.slice(0, 7);
      if (savedMonth && savedMonth !== listMonth) setListMonth(savedMonth);
      else void loadList(listMonth);
    } catch (err) {
      setBanner({ kind: "error", text: err instanceof Error ? err.message : "A mentés nem sikerült." });
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(item: AdvanceListItem) {
    if (!window.confirm(`Biztosan törlöd ezt az utat?\n${item.pickupDate} ${item.pickupTime} · ${item.companyName}`)) return;
    setDeleting(item.id);
    try {
      const res = await fetch(`/api/advance-bookings?id=${item.id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "A törlés nem sikerült.");
      setItems((current) => current.filter((x) => x.id !== item.id));
    } catch (err) {
      setListError(err instanceof Error ? err.message : "A törlés nem sikerült.");
    } finally {
      setDeleting(null);
    }
  }

  const visibleItems = useMemo(
    () => (onlyMine ? items.filter((i) => (i.createdBy || "").toLowerCase() === viewer.email.toLowerCase()) : items),
    [items, onlyMine, viewer.email]
  );
  const grouped = useMemo(() => {
    const map = new Map<string, AdvanceListItem[]>();
    for (const item of visibleItems) {
      if (!map.has(item.pickupDate)) map.set(item.pickupDate, []);
      map.get(item.pickupDate)!.push(item);
    }
    return Array.from(map.entries());
  }, [visibleItems]);
  const totalPax = visibleItems.reduce((sum, i) => sum + i.travelers, 0);

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 text-slate-900">
      <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm transition active:scale-95">
            <ArrowLeft className="h-4 w-4" /> Központi naptár
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm">
            <UserCircle2 className="h-4 w-4 text-blue-600" /> Bejelentkezve: {prettyActor(viewer.name, viewer.email)}
          </div>
        </header>

        <div className="mb-6">
          <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
            <CalendarPlus className="h-3.5 w-3.5 text-blue-600" /> Pannon Transfer · Diszpécser Központ
          </div>
          <h1 className="font-serif text-[30px] font-bold leading-tight tracking-tight sm:text-[36px]">Előre felvett utak</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            Írd be az előre ismert utakat (például a következő hónap menetrendjét). Mentés után bekerülnek a központi naptárba és az adatbázisba, a naptárban
            pedig látszik, hogy ki vette fel őket. Ismeretlen cég szürke jelölést kap.
          </p>
        </div>

        {banner && (
          <div
            role="status"
            className={`mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm font-semibold ${
              banner.kind === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {banner.kind === "ok" ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />}
            {banner.text}
          </div>
        )}

        <datalist id="company-options">
          {companyOptions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>

        <section className="space-y-4">
          {rows.map((row, index) => {
            const airport = looksLikeAirport(row.from) || looksLikeAirport(row.to);
            const error = errors[row.key];
            return (
              <article
                key={row.key}
                className={`rounded-3xl border bg-white p-4 shadow-xl shadow-slate-900/[0.04] sm:p-6 ${error ? "border-rose-300 ring-4 ring-rose-100" : "border-slate-200/80"}`}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-xs font-black text-white shadow-md shadow-blue-600/25">
                      {index + 1}
                    </span>
                    <span className="text-sm font-bold text-slate-700">Út</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => duplicateRow(row.key)}
                      className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition active:scale-95"
                    >
                      <Copy className="h-3.5 w-3.5" /> Másolás
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRow(row.key)}
                      aria-label="Sor törlése"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:text-rose-600 active:scale-95"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <label className={labelClass}>Dátum</label>
                    <input type="date" value={row.date} min="2020-01-01" onChange={(e) => update(row.key, { date: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Idő</label>
                    <input type="time" value={row.time} onChange={(e) => update(row.key, { time: e.target.value })} className={inputClass} />
                  </div>
                  <div className="col-span-2 sm:col-span-2">
                    <label className={labelClass}>Utasok száma</label>
                    <div className="relative">
                      <Users2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={60}
                        value={row.pax}
                        onChange={(e) => update(row.key, { pax: e.target.value })}
                        placeholder="fő"
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <label className={labelClass}>Cég</label>
                  <input
                    list="company-options"
                    value={row.company}
                    onChange={(e) => update(row.key, { company: e.target.value })}
                    placeholder="pl. National Instruments"
                    autoComplete="off"
                    className={inputClass}
                  />
                  <CompanyChip company={row.company} />
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
                  <div>
                    <label className={labelClass}>Honnan</label>
                    <input value={row.from} onChange={(e) => update(row.key, { from: e.target.value })} placeholder="pl. Budapest Liszt Ferenc Repülőtér" className={inputClass} />
                  </div>
                  <ArrowRight className="mx-auto hidden h-5 w-5 text-slate-300 sm:mb-3.5 sm:block" />
                  <div>
                    <label className={labelClass}>Hova</label>
                    <input value={row.to} onChange={(e) => update(row.key, { to: e.target.value })} placeholder="pl. Debrecen, NI Hungary" className={inputClass} />
                  </div>
                </div>

                {airport && (
                  <div className="mt-3 sm:max-w-xs">
                    <label className={labelClass}>
                      <Plane className="mr-1 inline h-3 w-3" /> Járatszám (ha ismert)
                    </label>
                    <input value={row.flight} onChange={(e) => update(row.key, { flight: e.target.value.toUpperCase() })} placeholder="pl. W6 1234" className={inputClass} />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => update(row.key, { more: !row.more })}
                  aria-expanded={row.more}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-blue-700"
                >
                  További adatok (utas, telefon, megjegyzés)
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${row.more ? "rotate-180" : ""}`} />
                </button>
                {row.more && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Utas neve (opcionális)</label>
                      <input value={row.name} onChange={(e) => update(row.key, { name: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Telefonszám (opcionális)</label>
                      <input type="tel" value={row.phone} onChange={(e) => update(row.key, { phone: e.target.value })} className={inputClass} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Megjegyzés (opcionális)</label>
                      <textarea value={row.comment} onChange={(e) => update(row.key, { comment: e.target.value })} rows={2} maxLength={500} className={`${inputClass} resize-y`} />
                    </div>
                  </div>
                )}

                {error && (
                  <p role="alert" className="mt-4 flex items-center gap-2 text-[13px] font-bold text-rose-600">
                    <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
                  </p>
                )}
              </article>
            );
          })}
        </section>

        <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-slate-200/80 bg-white/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-0 sm:backdrop-blur-none">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={addRow}
              className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-xs font-black uppercase tracking-widest text-slate-700 shadow-sm transition active:scale-95"
            >
              <Plus className="h-4 w-4" /> Új sor
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-6 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-600/30 transition active:scale-[0.98] disabled:opacity-60 sm:flex-none"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Mentés…" : `Utak mentése${filledRows.length ? ` (${filledRows.length})` : ""}`}
            </button>
          </div>
        </div>

        <section className="mt-12">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Már felvett utak</div>
              <h2 className="font-serif text-[24px] font-bold leading-tight tracking-tight">
                {visibleItems.length} út · {totalPax} utas
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm">
                <CalendarDays className="h-4 w-4 text-blue-600" />
                <input type="month" value={listMonth} onChange={(e) => e.target.value && setListMonth(e.target.value)} className="bg-transparent text-sm font-semibold outline-none" />
              </label>
              <button
                type="button"
                onClick={() => setOnlyMine((v) => !v)}
                aria-pressed={onlyMine}
                className={`rounded-xl border px-3.5 py-2.5 text-xs font-black uppercase tracking-wider shadow-sm transition active:scale-95 ${
                  onlyMine ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                Csak az enyéim
              </button>
            </div>
          </div>

          {listError && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {listError}
            </div>
          )}

          {listLoading && items.length === 0 ? (
            <div className="flex justify-center rounded-3xl border border-slate-200/80 bg-white py-14">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : grouped.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center text-sm font-medium text-slate-500">
              Ebben a hónapban még nincs előre felvett út.
            </div>
          ) : (
            <div className="space-y-5">
              {grouped.map(([date, list]) => (
                <div key={date}>
                  <div className="mb-2 px-1 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    {new Date(`${date}T12:00:00`).toLocaleDateString("hu-HU", { month: "long", day: "numeric", weekday: "long" })}
                    <span className="ml-2 text-slate-400">· {list.length} út</span>
                  </div>
                  <ul className="space-y-2.5">
                    {list.map((item) => (
                      <li key={item.id} className="relative flex items-start gap-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm sm:p-4">
                        <div className={`absolute inset-y-0 left-0 w-1.5 ${item.knownCompany ? "bg-gradient-to-b from-blue-500 to-indigo-600" : "bg-slate-400"}`} />
                        <div className="w-14 shrink-0 pl-2 pt-0.5 font-mono text-[15px] font-black tabular-nums text-slate-800">{item.pickupTime}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${item.knownCompany ? "bg-blue-50 text-blue-700" : "bg-slate-200 text-slate-600"}`}>
                              {item.companyName}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
                              <Users2 className="h-3.5 w-3.5" /> {item.travelers} fő
                            </span>
                            {item.assignedDriverName && <span className="text-xs font-bold text-emerald-700">· {item.assignedDriverName}</span>}
                          </div>
                          <div className="mt-1 text-[13px] font-semibold text-slate-700">
                            {item.fromAddress} <span className="text-slate-300">→</span> {item.toAddress}
                          </div>
                          {(item.travelerName || item.flightNumber || item.comment) && (
                            <div className="mt-1 text-xs font-medium text-slate-500">
                              {[item.travelerName, item.flightNumber && `✈ ${item.flightNumber}`, item.comment].filter(Boolean).join(" · ")}
                            </div>
                          )}
                          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                            <UserCircle2 className="h-3.5 w-3.5" /> Felvette: {prettyActor(item.createdByName, item.createdBy)} ·{" "}
                            {new Date(item.createdAt).toLocaleString("hu-HU", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                        {item.deletable && (
                          <button
                            type="button"
                            onClick={() => void removeItem(item)}
                            disabled={deleting === item.id}
                            aria-label="Út törlése"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:text-rose-600 active:scale-95 disabled:opacity-50"
                          >
                            {deleting === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
