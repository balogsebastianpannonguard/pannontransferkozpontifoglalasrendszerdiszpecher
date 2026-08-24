"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Booking, BookingStatus } from "@/lib/bookings";
import {
  Home,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  CalendarCheck,
  Users2,
  Clock,
  CarFront,
  ListChecks,
  ShieldCheck,
  Pencil,
  XCircle,
  RefreshCw,
  PlusCircle,
  CreditCard,
  Luggage,
  Mail,
  Phone,
  Building2,
  Tag,
  MessageSquareText,
  Clock3,
} from "lucide-react";

interface Stats {
  total: number;
  processing: number;
  confirmed: number;
  closed: number;
}

function statusMeta(status: BookingStatus) {
  switch (status) {
    case "confirmed":
      return {
        chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
        label: "Jóváhagyott",
      };
    case "pending":
      return {
        chip: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-500",
        label: "Függőben",
      };
    case "in-progress":
      return {
        chip: "bg-blue-50 text-blue-700 border-blue-200",
        dot: "bg-blue-500",
        label: "Folyamatban",
      };
    case "completed":
      return {
        chip: "bg-slate-50 text-slate-600 border-slate-200",
        dot: "bg-slate-400",
        label: "Befejezett",
      };
    case "cancelled":
      return {
        chip: "bg-rose-50 text-rose-700 border-rose-200",
        dot: "bg-rose-500",
        label: "Lemondott",
      };
    case "modified":
      return {
        chip: "bg-orange-50 text-orange-700 border-orange-200",
        dot: "bg-orange-500",
        label: "Módosítva",
      };
  }
}

function categoryLabel(cat: string) {
  return (
    {
      airport: "Repülőtéri",
      city: "Városi",
      "long-distance": "Távolsági",
      vip: "VIP",
      partner: "Partner",
    } as Record<string, string>
  )[cat] || cat;
}

function bookingIsCatl(b: { companyName?: string | null; travelerEmail?: string; userEmail?: string }) {
  return Boolean(
    (b.companyName && (String(b.companyName).toUpperCase().includes("CATL") || String(b.companyName).toUpperCase().includes("宁德时代"))) ||
    (b.travelerEmail && /catl/i.test(b.travelerEmail)) ||
    (b.userEmail && /catl/i.test(b.userEmail))
  );
}

function formatHuDate(dateStr: string): string {
  const HUN_MONTHS = [
    "Január", "Február", "Március", "Április", "Május", "Június",
    "Július", "Augusztus", "Szeptember", "Október", "November", "December",
  ];
  const HUN_WEEKDAYS_LONG = ["Vasárnap", "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat"];
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const weekday = HUN_WEEKDAYS_LONG[dt.getDay()];
  return `${weekday}, ${y}. ${HUN_MONTHS[(m || 1) - 1]} ${d}.`;
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}. ${pad(d.getMonth() + 1)}. ${pad(d.getDate())} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function BookingsListClient({
  bookings,
  initialStats,
}: {
  bookings: Booking[];
  initialStats: Stats;
}) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "confirmed" | "closed">("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const filteredBookings = useMemo(() => {
    switch (activeFilter) {
      case "pending":
        return bookings.filter((b) => b.status === "pending" || b.status === "modified");
      case "confirmed":
        return bookings.filter((b) => b.status === "confirmed" || b.status === "in-progress");
      case "closed":
        return bookings.filter((b) => b.status === "completed" || b.status === "cancelled");
      default:
        return bookings;
    }
  }, [bookings, activeFilter]);

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleRefresh() {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 800);
  }

  async function confirmCancel() {
    if (!cancellingId) return;
    setConfirmLoading(true);
    try {
      await fetch(`/api/bookings/${cancellingId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "cancelled" }),
      });
      router.refresh();
    } finally {
      setConfirmLoading(false);
      setCancellingId(null);
    }
  }

  const filterTabs = [
    { id: "all" as const, label: "Minden", count: initialStats.total },
    { id: "pending" as const, label: "Függőben", count: initialStats.processing },
    { id: "confirmed" as const, label: "Jóváhagyott", count: initialStats.confirmed },
    { id: "closed" as const, label: "Lezárt", count: initialStats.closed },
  ];

  return (
    <div className="min-h-screen text-slate-900 antialiased bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-32 w-[32rem] h-[32rem] rounded-full bg-gradient-to-br from-blue-400/30 to-indigo-500/30 blur-3xl opacity-60" />
        <div className="absolute -bottom-40 -right-20 w-[36rem] h-[36rem] rounded-full bg-gradient-to-tr from-violet-400/20 via-fuchsia-400/10 to-rose-400/20 blur-3xl opacity-70" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-amber-300/10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16">
        <header className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-white/70 backdrop-blur-2xl border-b border-slate-200/70 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => router.push("/")}
                className="shrink-0 w-11 h-11 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center"
              >
                <ArrowLeft className="w-[18px] h-[18px]" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Home className="w-3.5 h-3.5" />
                  <button onClick={() => router.push("/")} className="hover:text-slate-800 transition">
                    Irányítópult
                  </button>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-slate-700">Foglalások</span>
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <h1 className="font-serif text-[24px] sm:text-[26px] font-bold tracking-tight text-slate-900">
                    Foglalások
                  </h1>
                  <span className="text-[13px] font-semibold text-slate-500">
                    Valós idejű státusz és részletek
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs font-black tracking-wider uppercase shadow-sm hover:bg-slate-50 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                Frissítés
              </button>
              <button
                onClick={() => router.push("/bookings/new")}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-xs font-black tracking-wider uppercase shadow-lg shadow-blue-600/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/40 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                Új foglalás
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-3xl bg-white shadow-lg shadow-slate-900/[0.03] border border-slate-200/80 p-5 relative overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all">
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200">
                ÖSSZES
              </span>
            </div>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center ring-2 ring-white">
                <ListChecks className="w-5 h-5" />
              </div>
            </div>
            <div className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">
              ÖSSZES FOGLALÁS
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-black tracking-tight text-slate-900 tabular-nums">
                {initialStats.total}
              </span>
              <span className="text-sm font-bold text-slate-400">db</span>
            </div>
          </div>

          <div className="rounded-3xl bg-white shadow-lg shadow-slate-900/[0.03] border border-slate-200/80 p-5 relative overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all">
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-amber-50 text-amber-700 border border-amber-200">
                FÜGGŐBEN
              </span>
            </div>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-lg shadow-amber-500/30 flex items-center justify-center ring-2 ring-white">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">
              FELDOLGOZÁS ALATT
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-black tracking-tight text-slate-900 tabular-nums">
                {initialStats.processing}
              </span>
              <span className="text-sm font-bold text-slate-400">db</span>
            </div>
          </div>

          <div className="rounded-3xl bg-white shadow-lg shadow-slate-900/[0.03] border border-slate-200/80 p-5 relative overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all">
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                AKTÍV
              </span>
            </div>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 flex items-center justify-center ring-2 ring-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">
              JÓVÁHAGYOTT
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-black tracking-tight text-slate-900 tabular-nums">
                {initialStats.confirmed}
              </span>
              <span className="text-sm font-bold text-slate-400">db</span>
            </div>
          </div>

          <div className="rounded-3xl bg-white shadow-lg shadow-slate-900/[0.03] border border-slate-200/80 p-5 relative overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all">
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-slate-100 text-slate-600 border border-slate-200">
                LEZÁRT
              </span>
            </div>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 text-white shadow-lg shadow-slate-500/30 flex items-center justify-center ring-2 ring-white">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">
              BEFEJEZETT
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-black tracking-tight text-slate-900 tabular-nums">
                {initialStats.closed}
              </span>
              <span className="text-sm font-bold text-slate-400">db</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-6 p-1.5 rounded-2xl bg-white/60 backdrop-blur border border-slate-200/60 w-fit">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold tracking-wide transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg shadow-slate-900/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full text-[10px] font-black tabular-nums ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {filteredBookings.length === 0 ? (
          <div className="rounded-[28px] bg-white shadow-xl shadow-slate-900/[0.04] border border-slate-200/80 overflow-hidden">
            <div className="py-20 px-8 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center mb-6 shadow-inner">
                <CalendarCheck className="w-12 h-12 text-slate-300" strokeWidth={1.4} />
              </div>
              <div className="font-serif text-2xl font-bold text-slate-700 mb-2">
                Nincs megjeleníthető foglalás
              </div>
              <div className="text-sm text-slate-500 mb-6 max-w-md">
                A kiválasztott szűrőfeltételnek megfelelő foglalás nem található a rendszerben.
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setActiveFilter("all")}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-xs font-black tracking-widest uppercase shadow-lg shadow-blue-600/30 hover:-translate-y-0.5 hover:shadow-xl transition-all"
                >
                  <ListChecks className="w-4 h-4" />
                  Összes foglalás
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((b) => {
              const s = statusMeta(b.status);
              const isExpanded = expandedIds.has(b._id || "");
              const isExecutive = b.transferType === "executive";
              const paymentLabel = b.paymentMethod === "card" ? "Bankkártya" : "Banki átutalás";
              const isCatl = bookingIsCatl(b);

              return (
                <div
                  key={b._id || b.bookingCode}
                  className="rounded-3xl bg-white shadow-lg shadow-slate-900/[0.04] border border-slate-200/80 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col xl:flex-row gap-4 xl:gap-6">
                      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-0 md:divide-x divide-slate-200">
                        <div className="md:pr-5 pb-4 md:pb-0 md:min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-black tracking-wider ${isCatl ? "border-blue-300 bg-blue-100 text-blue-700 ring-1 ring-blue-200" : "border-blue-200 bg-blue-50 text-blue-700"}`}>
                              <span className={`w-2 h-2 rounded-full ${isCatl ? "bg-blue-600 animate-pulse" : "bg-blue-500"}`} />
                              #{b.bookingCode}
                              {isCatl && <span className="ml-1 text-[9px] font-black tracking-widest opacity-80">CATL</span>}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10.5px] font-black tracking-wider uppercase ${s.chip}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${b.status === "in-progress" ? "animate-pulse" : ""}`} />
                              {s.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[15px] font-bold text-slate-900 mb-3 flex-wrap">
                            <CalendarCheck className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                            <span>{formatHuDate(b.pickupDate)}</span>
                            <span className={`font-mono font-black ${isCatl ? "text-indigo-700 bg-indigo-50 border border-indigo-200" : "text-blue-600 bg-blue-50"} px-2 py-0.5 rounded-lg tabular-nums`}>
                              {b.pickupTime}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <div className="flex flex-col items-center pt-1 shrink-0">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                                <span className="w-px h-4 my-1 bg-gradient-to-b from-emerald-300 to-rose-300" style={{
                                  backgroundImage: "repeating-linear-gradient(to bottom, #94a3b8 0, #94a3b8 2px, transparent 2px, transparent 5px)"
                                }} />
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-100" />
                              </div>
                              <div className="min-w-0 flex-1 space-y-2">
                                <div>
                                  <div className="text-[9.5px] font-black tracking-[0.18em] uppercase text-emerald-600 mb-0.5">
                                    HONNAN
                                  </div>
                                  <div className="text-[13px] font-semibold text-slate-800 leading-snug truncate">
                                    {b.fromAddress}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[9.5px] font-black tracking-[0.18em] uppercase text-rose-600 mb-0.5">
                                    HOVA
                                  </div>
                                  <div className="text-[13px] font-semibold text-slate-800 leading-snug truncate">
                                    {b.toAddress}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="md:px-5 py-4 md:py-0 border-t md:border-t-0 border-slate-200">
                          <div className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-2">
                            TÍPUS
                          </div>
                          <div
                            className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[11px] font-black tracking-wider uppercase mb-2 ${
                              isCatl
                                ? "bg-gradient-to-r from-blue-500/15 to-indigo-600/15 text-indigo-700 border border-indigo-200"
                                : isExecutive
                                ? "bg-gradient-to-r from-amber-400/15 to-amber-500/15 text-amber-700 border border-amber-200"
                                : "bg-gradient-to-r from-blue-500/15 to-indigo-500/15 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {isCatl ? "CATL Partner" : isExecutive ? "Executive" : "Standard"}
                          </div>
                          <div className={`text-[18px] font-black tracking-tight ${isCatl ? "text-indigo-700" : isExecutive ? "text-amber-700" : "text-blue-700"}`}>
                            {isCatl ? "CATL Partner" : isExecutive ? "Executive" : "Standard"}
                          </div>
                          <div className="text-[11px] font-bold text-slate-500 mt-1">
                            {isCatl ? "CATL Hungary Kft." : categoryLabel(b.category)}
                          </div>
                        </div>

                        <div className="md:px-5 py-4 md:py-0 border-t md:border-t-0 border-slate-200 space-y-4">
                          <div>
                            <div className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-1.5">
                              <Users2 className="w-3.5 h-3.5" />
                              UTASOK
                            </div>
                            <div className="text-[18px] font-black tracking-tight text-slate-900 tabular-nums">
                              {b.travelers} <span className="text-sm font-bold text-slate-400">fő</span>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-1.5">
                              <Luggage className="w-3.5 h-3.5" />
                              CSOMAG
                            </div>
                            <div className="text-[18px] font-black tracking-tight text-slate-900 tabular-nums">
                              {b.luggage} <span className="text-sm font-bold text-slate-400">db</span>
                            </div>
                          </div>
                        </div>

                        <div className="md:px-5 md:pl-5 py-4 md:py-0 border-t md:border-t-0 border-slate-200 space-y-4">
                          <div>
                            <div className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-1.5">
                              <CreditCard className="w-3.5 h-3.5" />
                              FIZETÉS
                            </div>
                            <div className="text-[14px] font-bold text-slate-800">
                              {paymentLabel}
                            </div>
                            {b.price !== undefined && (
                              <div className="font-black text-slate-900 text-[15px] tracking-tight tabular-nums mt-0.5">
                                {b.price.toLocaleString("hu-HU")}
                                <span className="text-xs text-slate-400 font-bold ml-1">Ft</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-1.5">
                              <CarFront className="w-3.5 h-3.5" />
                              SOFŐR & JÁRMŰ
                            </div>
                            {b.assignedDriverName && b.assignedVehicleName ? (
                              <div className="text-[13px] font-bold text-slate-800 leading-snug">
                                <div>{b.assignedDriverName}</div>
                                <div className="text-slate-600 font-semibold">{b.assignedVehicleName}</div>
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10.5px] font-bold text-slate-500 bg-slate-100 border border-slate-200">
                                Hozzárendelés függőben
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="xl:w-[220px] shrink-0 flex flex-row xl:flex-col items-stretch xl:items-end gap-2 xl:gap-2 border-t xl:border-t-0 xl:border-l border-slate-200 xl:pl-5 pt-4 xl:pt-0">
                        <button
                          onClick={() => toggleExpanded(b._id || "")}
                          className="flex-1 xl:w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 text-[11px] font-black tracking-wider uppercase shadow-sm hover:bg-slate-50 hover:shadow-md hover:-translate-y-0.5 transition-all"
                        >
                          Részletek
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 rotate-180 transition-transform" />
                          ) : (
                            <ChevronDown className="w-4 h-4 transition-transform" />
                          )}
                        </button>
                        <button
                          onClick={() => router.push(`/bookings/${b._id}`)}
                          className="flex-1 xl:w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-[11px] font-black tracking-wider uppercase shadow-lg shadow-blue-600/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/40 transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Módosítás
                        </button>
                        <button
                          onClick={() => setCancellingId(b._id || null)}
                          className="flex-1 xl:w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl bg-white border border-rose-200 text-rose-600 text-[11px] font-black tracking-wider uppercase shadow-sm hover:bg-rose-50 hover:border-rose-300 hover:shadow-md hover:-translate-y-0.5 transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Lemondás
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-200/80 bg-gradient-to-br from-slate-50/80 via-white to-blue-50/30 px-5 sm:px-6 py-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-2">
                            <Mail className="w-3.5 h-3.5" />
                            UTAS E-MAIL
                          </div>
                          <a
                            href={`mailto:${b.travelerEmail}`}
                            className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 hover:underline break-all"
                          >
                            {b.travelerEmail}
                          </a>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-2">
                            <Phone className="w-3.5 h-3.5" />
                            UTAS TELEFON
                          </div>
                          <a
                            href={`tel:${b.travelerPhone}`}
                            className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            {b.travelerPhone}
                          </a>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-2">
                            <Users2 className="w-3.5 h-3.5" />
                            2. UTAS
                          </div>
                          <div className="text-[13px] font-semibold text-slate-700 space-y-0.5">
                            {b.secondTravelerEmail ? (
                              <>
                                <div>
                                  <a href={`mailto:${b.secondTravelerEmail}`} className="text-blue-600 hover:underline">
                                    {b.secondTravelerEmail}
                                  </a>
                                </div>
                                {b.secondTravelerPhone && (
                                  <a href={`tel:${b.secondTravelerPhone}`} className="text-blue-600 hover:underline block">
                                    {b.secondTravelerPhone}
                                  </a>
                                )}
                              </>
                            ) : (
                              <span className="text-slate-400 italic">Nincs megadva</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-2">
                            <Building2 className="w-3.5 h-3.5" />
                            CÉG
                          </div>
                          <div className="text-[13px] font-semibold text-slate-700">
                            {b.companyName || <span className="text-slate-400 italic">Nincs megadva</span>}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-2">
                            <Tag className="w-3.5 h-3.5" />
                            KATEGÓRIA
                          </div>
                          <div className="text-[13px] font-semibold text-slate-700">
                            {categoryLabel(b.category)}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-2">
                            <Clock3 className="w-3.5 h-3.5" />
                            LÉTREHOZVA
                          </div>
                          <div className="text-[13px] font-semibold text-slate-700 tabular-nums">
                            {formatTimestamp(b.createdAt)}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <div className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-2">
                            <MessageSquareText className="w-3.5 h-3.5" />
                            MEGJEGYZÉS
                          </div>
                          <div className="rounded-2xl bg-white border border-slate-200 p-3 text-[13px] font-medium text-slate-700 min-h-[44px]">
                            {b.comment || <span className="text-slate-400 italic">Nincs megjegyzés</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => router.push(`/bookings/${b._id}`)}
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white text-xs font-black tracking-widest uppercase shadow-lg shadow-slate-900/25 hover:-translate-y-0.5 hover:shadow-xl transition-all"
                        >
                          Teljes részletek és kezelés
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {cancellingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-100 to-red-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <XCircle className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-[20px] font-bold tracking-tight text-slate-900 mb-1">
                    Foglalás lemondása
                  </h3>
                  <p className="text-sm text-slate-500">
                    Biztosan lemondja ezt a foglalást? Ez a művelet nem visszavonható.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setCancellingId(null)}
                disabled={confirmLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs font-black tracking-wider uppercase shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-all"
              >
                Mégse
              </button>
              <button
                onClick={confirmCancel}
                disabled={confirmLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 text-white text-xs font-black tracking-wider uppercase shadow-lg shadow-rose-500/30 hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 transition-all"
              >
                {confirmLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Lemondás
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
