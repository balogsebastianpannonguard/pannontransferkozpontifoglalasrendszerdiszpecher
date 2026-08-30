"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { Booking, BookingStatus } from "@/lib/bookings";
import type { Driver } from "@/lib/drivers";
import type { Vehicle } from "@/lib/vehicles";
import type { AuditLog } from "@/lib/audit-logs";
import {
  ChevronRight, Home, ArrowLeft, User, Mail, Phone, MapPin, 
  CalendarDays, Clock, Users2, Luggage, CreditCard, StickyNote, UserCircle2,
  CarFront, Link2Off, Save, History, CheckCircle2, XCircle, Info,
  Check, Loader2, X, ShieldCheck, Building2, BadgeCheck,
  WalletCards, RefreshCw, Plus, CircleSlash, ArrowRight, ChevronDown
} from "lucide-react";

const HUN_MONTHS = [
  "Január", "Február", "Március", "Április", "Május", "Június",
  "Július", "Augusztus", "Szeptember", "Október", "November", "December",
];
const HUN_WEEKDAYS_LONG = ["Vasárnap", "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat"];

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: "pending", label: "Függőben" },
  { value: "modified", label: "Módosítva" },
  { value: "confirmed", label: "Megerősítve" },
  { value: "in-progress", label: "Folyamatban" },
  { value: "completed", label: "Befejezett" },
  { value: "cancelled", label: "Lemondott" },
];

function actionBadge(action: string) {
  if (action.startsWith("booking.created")) return "bg-slate-100 text-slate-700";
  if (action.startsWith("booking.assigned")) return "bg-blue-50 text-blue-700";
  if (action.startsWith("booking.status_changed")) return "bg-slate-100 text-slate-700";
  if (action.startsWith("booking.modified")) return "bg-slate-100 text-slate-700";
  if (action.startsWith("booking.cancelled")) return "bg-rose-50 text-rose-700";
  return "bg-slate-50 text-slate-600";
}

function actionLabel(action: string) {
  if (action.startsWith("booking.created")) return "Létrehozva";
  if (action.startsWith("booking.assigned")) return "Hozzárendelve";
  if (action.startsWith("booking.status_changed")) return "Státusz váltás";
  if (action.startsWith("booking.modified")) return "Módosítva";
  if (action.startsWith("booking.cancelled")) return "Lemondva";
  if (action.startsWith("driver.created")) return "Sofőr létrehozva";
  if (action.startsWith("vehicle.modified")) return "Jármű módosítva";
  if (action.startsWith("notification.sent")) return "Értesítés elküldve";
  return action;
}

function actionDotColor(action: string) {
  if (action.startsWith("booking.created")) return "bg-slate-400";
  if (action.startsWith("booking.assigned")) return "bg-blue-500";
  if (action.startsWith("booking.status_changed")) return "bg-slate-500";
  if (action.startsWith("booking.modified")) return "bg-slate-400";
  if (action.startsWith("booking.cancelled")) return "bg-rose-500";
  return "bg-slate-300";
}

function relativeTime(timestamp: number, now: number): string {
  const diff = now - timestamp;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${Math.max(0, s)} másodperce`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} perce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} órája`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} napja`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w} hete`;
  return new Date(timestamp).toLocaleDateString("hu-HU");
}

function categoryLabel(cat: string, isCatl: boolean = false) {
  if (isCatl) return "CATL Partner";
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
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const weekday = HUN_WEEKDAYS_LONG[dt.getDay()];
  return `${weekday}, ${y}. ${HUN_MONTHS[(m || 1) - 1]} ${d}.`;
}

interface Toast {
  id: number;
  type: "success" | "error" | "info";
  title: string;
  message?: string;
}

export default function BookingDetailClient({
  booking: initialBooking,
  drivers,
  vehicles,
  auditLogs: initialAuditLogs,
}: {
  booking: Booking;
  drivers: Driver[];
  vehicles: Vehicle[];
  auditLogs: AuditLog[];
  userEmail: string;
}) {
  const router = useRouter();
  const toastIdRef = useRef<number>(0);

  const [booking, setBooking] = useState<Booking>(initialBooking);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>(
    booking.assignedDriverId || ""
  );
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    booking.assignedVehicleId || ""
  );
  const [priceValue, setPriceValue] = useState<number>(booking.price || 0);
  const [assigning, setAssigning] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);
  const [unassigning, setUnassigning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const [now, setNow] = useState<number>(Date.now());
  
  useEffect(() => {
    // Frissítjük a jelenlegi időt kliens oldalon a hidratáció után,
    // így elkerüljük a szerver és kliens közötti Date.now() eltérést.
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const bookingId = booking._id || "";
  const isCatl = bookingIsCatl(booking);
  const isAssigned = useMemo(
    () => !!booking.assignedDriverId && !!booking.assignedVehicleId,
    [booking.assignedDriverId, booking.assignedVehicleId]
  );
  const hasPrice = useMemo(() => booking.price !== undefined && booking.price !== null && booking.price > 0, [booking.price]);

  function pushToast(type: Toast["type"], title: string, message?: string) {
    toastIdRef.current += 1;
    const id = toastIdRef.current;
    setToasts((t) => [...t, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4000);
  }

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        setRefreshing(true);
        const [bRes, aRes] = await Promise.all([
          fetch(`/api/bookings/${bookingId}`).then((r) => r.json().catch(() => ({}))),
          fetch(`/api/bookings/${bookingId}/audit`).then((r) => r.json().catch(() => ({}))),
        ]);
        if (bRes?.booking) setBooking(bRes.booking);
        if (Array.isArray(aRes?.logs)) setAuditLogs(aRes.logs.slice(0, 20));
      } catch {
      } finally {
        setTimeout(() => setRefreshing(false), 400);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [bookingId]);

  async function handleRefresh() {
    try {
      setRefreshing(true);
      const [bRes, aRes] = await Promise.all([
        fetch(`/api/bookings/${bookingId}`).then((r) => r.json().catch(() => ({}))),
        fetch(`/api/bookings/${bookingId}/audit`).then((r) => r.json().catch(() => ({}))),
      ]);
      if (bRes?.booking) {
        setBooking(bRes.booking);
        setSelectedDriverId(bRes.booking.assignedDriverId || "");
        setSelectedVehicleId(bRes.booking.assignedVehicleId || "");
        setPriceValue(bRes.booking.price || 0);
      }
      if (Array.isArray(aRes?.logs)) setAuditLogs(aRes.logs.slice(0, 20));
      pushToast("success", "Frissítve", "A foglalás adatai frissítve.");
    } catch {
      pushToast("error", "Frissítés sikertelen");
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  }

  async function handleStatusChange(newStatus: BookingStatus) {
    if (newStatus === booking.status) return;
    const ok = window.confirm(
      `Biztosan módosítani szeretnéd a státuszt erre: ${STATUS_OPTIONS.find((o) => o.value === newStatus)?.label}?`
    );
    if (!ok) return;
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.booking) throw new Error(data?.error || "Hiba");
      setBooking(data.booking);
      pushToast("success", "Státusz módosítva", `${statusLabel(booking.status)} → ${STATUS_OPTIONS.find((o) => o.value === newStatus)?.label}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : undefined;
      pushToast("error", "Sikertelen státuszváltás", msg);
    }
  }

  async function handleAssign() {
    const driver = drivers.find((d) => d._id === selectedDriverId);
    const vehicle = vehicles.find((v) => String(v._id) === selectedVehicleId);
    if (!driver || !vehicle) {
      pushToast("error", "Hiányzó kiválasztás", "Válaszd ki a sofőrt és a járművet.");
      return;
    }
    try {
      setAssigning(true);
      const res = await fetch(`/api/bookings/${bookingId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: driver._id,
          driverName: driver.name,
          vehicleId: String(vehicle._id),
          vehicleName: vehicle.name,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.booking) throw new Error(data?.error || "Hiba");
      setBooking(data.booking);
      pushToast("success", "Sikeres hozzárendelés!", "Státusz automatikusan megerősítve.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : undefined;
      pushToast("error", "Hozzárendelés sikertelen", msg);
    } finally {
      setAssigning(false);
    }
  }

  async function handleUnassign() {
    const ok = window.confirm("Biztosan visszavonod a hozzárendelést?");
    if (!ok) return;
    try {
      setUnassigning(true);
      const res = await fetch(`/api/bookings/${bookingId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: "",
          driverName: "",
          vehicleId: "",
          vehicleName: "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.booking) throw new Error(data?.error || "Hiba");
      setBooking(data.booking);
      setSelectedDriverId("");
      setSelectedVehicleId("");
      pushToast("info", "Hozzárendelés visszavonva");
    } catch (err) {
      const msg = err instanceof Error ? err.message : undefined;
      pushToast("error", "Visszavonás sikertelen", msg);
    } finally {
      setUnassigning(false);
    }
  }

  async function handleSavePrice() {
    try {
      setSavingPrice(true);
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: Number(priceValue) || 0 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.booking) throw new Error(data?.error || "Hiba");
      setBooking(data.booking);
      pushToast("success", "Ár mentve", `${Number(priceValue).toLocaleString("hu-HU")} Ft`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : undefined;
      pushToast("error", "Ár mentés sikertelen", msg);
    } finally {
      setSavingPrice(false);
    }
  }

  // --- FOLYAAMTÁBRA / STEPPER LOGIC ---
  const FLOW_STEPS = ["pending", "confirmed", "in-progress", "completed"];
  
  const currentStepIndex = booking.status === "cancelled" 
    ? -1 
    : booking.status === "modified" 
      ? 0 
      : FLOW_STEPS.indexOf(booking.status);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => {
                if (window.history.length > 1) router.back();
                else router.push("/");
              }}
              className="shrink-0 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-[11px] font-black tracking-wider uppercase text-slate-400">
              <span className="hidden sm:inline">Irányítópult</span>
              <ChevronRight className="hidden sm:inline w-3 h-3" />
              <span className="hidden sm:inline">Foglalások</span>
              <ChevronRight className="hidden sm:inline w-3 h-3" />
              <span className="text-slate-800">#{booking.bookingCode}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 text-[11px] font-black tracking-wider uppercase hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Frissítés</span>
            </button>
            <button
              onClick={() => router.push("/bookings")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-[11px] font-black tracking-wider uppercase hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Új foglalás</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* TOP CARD: Date & Stepper */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="text-sm font-bold text-slate-500 mb-2">
                {formatHuDate(booking.pickupDate)}
              </div>
              <div className="flex items-center gap-4">
                <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-slate-900 font-mono">
                  {booking.pickupTime}
                </h1>
                <div className="flex flex-col gap-1.5">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-black tracking-wider uppercase">
                    #{booking.bookingCode}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase ${isCatl ? 'bg-blue-50 text-blue-700' : 'bg-slate-800 text-white'}`}>
                    {categoryLabel(booking.category, isCatl)}
                  </span>
                </div>
              </div>
            </div>

            {booking.status === "cancelled" ? (
              <div className="flex items-center gap-4 bg-rose-50 border border-rose-200 rounded-2xl p-4">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <CircleSlash className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <div className="text-sm font-black text-rose-800 uppercase tracking-wider">Foglalás lemondva</div>
                  <div className="text-xs font-medium text-rose-600/80">Ez a foglalás törlésre került a folyamatból.</div>
                </div>
                <button 
                  onClick={() => handleStatusChange("pending")}
                  className="ml-4 px-4 py-2 bg-white rounded-xl text-[11px] font-black tracking-wider uppercase text-slate-700 hover:bg-slate-50 border border-slate-200 transition-colors"
                >
                  Visszaállítás
                </button>
              </div>
            ) : (
              <button 
                onClick={() => handleStatusChange("cancelled")}
                className="text-[11px] font-black tracking-wider uppercase text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-full transition-colors"
              >
                Foglalás lemondása
              </button>
            )}
          </div>

          {/* STEPPER / FOLYAMATÁBRA */}
          {booking.status !== "cancelled" && (
            <div className="relative pt-4 pb-2">
              <div className="absolute top-[28px] left-0 w-full h-1 bg-slate-100 rounded-full" />
              <div 
                className="absolute top-[28px] left-0 h-1 bg-blue-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${currentStepIndex > 0 ? (currentStepIndex / (FLOW_STEPS.length - 1)) * 100 : 0}%` }}
              />
              
              <div className="relative flex justify-between">
                {FLOW_STEPS.map((step, idx) => {
                  const isActive = currentStepIndex === idx;
                  const isPast = currentStepIndex > idx;
                  const label = step === "pending" 
                    ? (booking.status === "modified" ? "Módosítva" : "Függőben") 
                    : statusLabel(step as BookingStatus);
                  
                  return (
                    <div key={step} className="flex flex-col items-center gap-3 relative z-10 w-24 group">
                      <div className="relative">
                        <button
                          onClick={() => handleStatusChange(step as BookingStatus)}
                          className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                            isActive 
                              ? "bg-blue-600 border-blue-100 text-white scale-110 shadow-lg shadow-blue-500/30" 
                              : isPast 
                                ? "bg-blue-600 border-white text-white hover:scale-105" 
                                : "bg-white border-slate-100 text-slate-300 hover:border-slate-200 hover:text-slate-500 hover:scale-105"
                          }`}
                        >
                          {isPast ? <Check className="w-4 h-4" /> : <span className="text-xs font-black">{idx + 1}</span>}
                        </button>
                      </div>
                      <span className={`text-[10px] font-black tracking-wider uppercase text-center transition-colors duration-300 ${
                        isActive ? "text-blue-700" : isPast ? "text-slate-800" : "text-slate-400 group-hover:text-slate-600"
                      }`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="mt-8 flex items-center justify-end">
             <div className="relative">
                <button
                  onClick={() => setStatusDropdownOpen((v) => !v)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors text-[10px] font-black tracking-wider uppercase"
                >
                  <span>Minden státusz</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${statusDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {statusDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2.5 w-56 rounded-2xl bg-white shadow-xl shadow-slate-900/10 border border-slate-200 overflow-hidden z-50"
                    >
                      <div className="p-1.5">
                        {STATUS_OPTIONS.map((opt) => {
                          const active = opt.value === booking.status;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => handleStatusChange(opt.value)}
                              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-colors ${
                                active
                                  ? "bg-slate-50 text-blue-700"
                                  : "hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              <span className="text-[11px] font-black tracking-wider uppercase">{opt.label}</span>
                              {active && <Check className="w-4 h-4 text-blue-600" />}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
          </div>
        </div>

        {/* MIDDLE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* ÚTVONAL ÉS RÉSZLETEK */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
              <div className="p-6 md:w-1/2 border-b md:border-b-0 md:border-r border-slate-100">
                <div className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-6 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  Útvonal
                </div>
                <div className="relative pl-6 space-y-6">
                  <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-slate-100" />
                  <div className="relative">
                    <div className="absolute -left-6 top-1.5 w-2 h-2 rounded-full bg-slate-300 ring-4 ring-white" />
                    <div className="text-[10px] font-black tracking-wider uppercase text-slate-400 mb-0.5">Honnan</div>
                    <div className="text-sm font-bold text-slate-900 leading-snug">{booking.fromAddress}</div>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-6 top-1.5 w-2 h-2 rounded-full bg-slate-800 ring-4 ring-white" />
                    <div className="text-[10px] font-black tracking-wider uppercase text-slate-400 mb-0.5">Hova</div>
                    <div className="text-sm font-bold text-slate-900 leading-snug">{booking.toAddress}</div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 md:w-1/2 bg-slate-50/50">
                <div className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-6 flex items-center gap-2">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Részletek
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-[10px] font-black tracking-wider uppercase text-slate-400 mb-1">Típus</div>
                    <div className="text-sm font-bold text-slate-900">{isCatl ? "CATL Partner" : booking.transferType === "executive" ? "Executive" : "Standard"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black tracking-wider uppercase text-slate-400 mb-1">Fizetés</div>
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <WalletCards className="w-4 h-4 text-slate-400" />
                      {booking.paymentMethod === "card" ? "Bankkártya" : "Átutalás"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black tracking-wider uppercase text-slate-400 mb-1">Utasok</div>
                    <div className="text-xl font-black text-slate-900 tabular-nums">
                      {booking.travelers} <span className="text-xs font-bold text-slate-400">fő</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black tracking-wider uppercase text-slate-400 mb-1">Csomagok</div>
                    <div className="text-xl font-black text-slate-900 tabular-nums">
                      {booking.luggage} <span className="text-xs font-bold text-slate-400">db</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* UTAS ADATAI */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <div className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-6 flex items-center gap-2">
                <User className="w-3.5 h-3.5" />
                Utas adatai
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">{booking.travelerName}</h3>
                  {booking.companyName && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[10px] font-black tracking-wider uppercase">
                      <Building2 className="w-3 h-3" />
                      {booking.companyName}
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  <a href={`mailto:${booking.travelerEmail}`} className="flex items-center gap-3 text-sm font-bold text-slate-700 hover:text-blue-600 transition">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0"><Mail className="w-3.5 h-3.5" /></div>
                    <span className="truncate">{booking.travelerEmail}</span>
                  </a>
                  <a href={`tel:${booking.travelerPhone}`} className="flex items-center gap-3 text-sm font-bold text-slate-700 hover:text-blue-600 transition">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0"><Phone className="w-3.5 h-3.5" /></div>
                    <span className="truncate">{booking.travelerPhone}</span>
                  </a>
                </div>
              </div>
              
              {(booking.secondTravelerEmail || booking.secondTravelerPhone) && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-3">Második utas</div>
                  <div className="flex flex-wrap gap-4">
                    {booking.secondTravelerEmail && (
                      <a href={`mailto:${booking.secondTravelerEmail}`} className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition">
                        <Mail className="w-3.5 h-3.5" /> {booking.secondTravelerEmail}
                      </a>
                    )}
                    {booking.secondTravelerPhone && (
                      <a href={`tel:${booking.secondTravelerPhone}`} className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition">
                        <Phone className="w-3.5 h-3.5" /> {booking.secondTravelerPhone}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* MEGJEGYZÉS */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <div className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-4 flex items-center gap-2">
                <StickyNote className="w-3.5 h-3.5" />
                Megjegyzés
              </div>
              {booking.comment ? (
                <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {booking.comment}
                </p>
              ) : (
                <p className="text-sm font-medium text-slate-400 italic">Nincs megjegyzés a foglaláshoz.</p>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            
            {/* PÉNZÜGYEK / ÁR */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <div className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-6 flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5" />
                Szolgáltatás díja
              </div>
              {hasPrice ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] font-black tracking-wider uppercase text-slate-400 mb-1">Teljes összeg</div>
                    <div className="text-3xl font-black text-slate-900 tabular-nums">
                      {booking.price!.toLocaleString("hu-HU")} <span className="text-sm font-bold text-slate-400">Ft</span>
                    </div>
                  </div>
                  <button onClick={() => setPriceValue(booking.price || 0)} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black tracking-wider uppercase transition">
                    Szerkesztés
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="number"
                      value={priceValue}
                      onChange={(e) => setPriceValue(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black text-slate-900 outline-none focus:border-blue-500 transition"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">Ft</span>
                  </div>
                  <button onClick={handleSavePrice} disabled={savingPrice} className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black tracking-wider uppercase transition disabled:opacity-50">
                    {savingPrice ? "Mentés..." : "Ár mentése"}
                  </button>
                </div>
              )}
            </div>

            {/* HOZZÁRENDELÉS */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <div className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Hozzárendelés
                </div>
                {isAssigned && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black uppercase tracking-wider">Aktív</span>}
              </div>

              {isAssigned ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <UserCircle2 className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-[10px] font-black tracking-wider uppercase text-slate-400">Sofőr</div>
                      <div className="text-sm font-bold text-slate-900">{booking.assignedDriverName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <CarFront className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-[10px] font-black tracking-wider uppercase text-slate-400">Jármű</div>
                      <div className="text-sm font-bold text-slate-900">{booking.assignedVehicleName}</div>
                    </div>
                  </div>
                  <button onClick={handleUnassign} disabled={unassigning} className="w-full py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-black tracking-wider uppercase transition disabled:opacity-50">
                    {unassigning ? "Visszavonás..." : "Visszavonás"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black tracking-wider uppercase text-slate-400 mb-1 block">Sofőr</label>
                    <select
                      value={selectedDriverId}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition"
                    >
                      <option value="">— Válassz —</option>
                      {drivers.map(d => <option key={d._id} value={d._id as string}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black tracking-wider uppercase text-slate-400 mb-1 block">Jármű</label>
                    <select
                      value={selectedVehicleId}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition"
                    >
                      <option value="">— Válassz —</option>
                      {vehicles.map(v => <option key={String(v._id)} value={String(v._id)}>{v.name}</option>)}
                    </select>
                  </div>
                  <button onClick={handleAssign} disabled={assigning} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black tracking-wider uppercase transition disabled:opacity-50 mt-2">
                    {assigning ? "Mentés..." : "Hozzárendelés"}
                  </button>
                </div>
              )}
            </div>

            {/* MŰVELETNAPLÓ */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 overflow-hidden flex flex-col">
              <div className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-3.5 h-3.5" />
                  Napló
                </div>
              </div>
              <div className="flex-1 max-h-[400px] overflow-y-auto pr-2">
                {auditLogs.length === 0 ? (
                  <div className="text-center text-xs font-medium text-slate-400 italic py-4">Nincs még bejegyzés.</div>
                ) : (
                  <div className="space-y-5 relative">
                    <div className="absolute left-1.5 top-2 bottom-2 w-px bg-slate-100" />
                    {auditLogs.slice(0, 10).map((log, idx) => (
                      <div key={log._id || idx} className="relative pl-6">
                        <div className={`absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 border-white ring-1 ring-slate-200 ${actionDotColor(log.action)}`} />
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <span className="text-[11px] font-black tracking-wider uppercase text-slate-700">{actionLabel(log.action)}</span>
                          <span className="text-[10px] font-bold text-slate-400">{relativeTime(log.timestamp, now)}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          {log.actor || "Rendszer"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      <div className="fixed bottom-5 right-5 z-50 space-y-2.5 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97, x: 8 }}
              className="pointer-events-auto rounded-2xl bg-slate-900 text-white shadow-xl p-4 flex items-start gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold leading-tight">{t.title}</div>
                {t.message && <div className="text-xs text-slate-300 mt-1">{t.message}</div>}
              </div>
              <button onClick={() => setToasts((l) => l.filter(x => x.id !== t.id))} className="text-slate-400 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function statusLabel(status: BookingStatus) {
  return STATUS_OPTIONS.find((o) => o.value === status)?.label || status;
}
