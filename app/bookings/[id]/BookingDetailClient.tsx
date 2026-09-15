"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { Booking, BookingStatus } from "@/lib/bookings";
import { getPartnerColorClasses, resolvePartnerMeta } from "@/lib/partner-meta";
import type { Driver } from "@/lib/drivers";
import type { Vehicle } from "@/lib/vehicles";
import type { AuditLog } from "@/lib/audit-logs";
import {
  ChevronRight,
  Home,
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  CalendarDays,
  Clock,
  Users2,
  Luggage,
  CreditCard,
  StickyNote,
  UserCircle2,
  CarFront,
  Link2,
  Link2Off,
  Save,
  History,
  CheckCircle2,
  XCircle,
  Info,
  Map,
  Send,
  Printer,
  Check,
  Loader2,
  X,
  ShieldCheck,
  Building2,
  BadgeCheck,
  WalletCards,
  RefreshCw,
  Plus,
  Zap,
  ChevronDown,
  Lock,
  AlertCircle,
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

function statusMeta(status: BookingStatus) {
  switch (status) {
    case "confirmed":
      return {
        chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
        pill: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30",
        dot: "bg-emerald-500",
        label: "Megerősítve",
      };
    case "pending":
      return {
        chip: "bg-amber-50 text-amber-700 border-amber-200",
        pill: "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/30",
        dot: "bg-amber-500",
        label: "Függőben",
      };
    case "in-progress":
      return {
        chip: "bg-blue-50 text-blue-700 border-blue-200",
        pill: "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-blue-500/30",
        dot: "bg-blue-500",
        label: "Folyamatban",
      };
    case "completed":
      return {
        chip: "bg-slate-50 text-slate-600 border-slate-200",
        pill: "bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-slate-500/30",
        dot: "bg-slate-400",
        label: "Befejezett",
      };
    case "cancelled":
      return {
        chip: "bg-rose-50 text-rose-700 border-rose-200",
        pill: "bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-rose-500/30",
        dot: "bg-rose-500",
        label: "Lemondott",
      };
    case "modified":
      return {
        chip: "bg-orange-50 text-orange-700 border-orange-200",
        pill: "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-500/30",
        dot: "bg-orange-500",
        label: "Módosítva",
      };
  }
}

function actionBadge(action: string) {
  if (action.startsWith("booking.created"))
    return "bg-blue-50 text-blue-700 border-blue-200";
  if (action.startsWith("booking.assigned"))
    return "bg-violet-50 text-violet-700 border-violet-200";
  if (action.startsWith("booking.status_changed"))
    return "bg-amber-50 text-amber-700 border-amber-200";
  if (action.startsWith("booking.modified"))
    return "bg-slate-50 text-slate-700 border-slate-200";
  if (action.startsWith("booking.cancelled"))
    return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
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
  if (action.startsWith("booking.created")) return "bg-blue-500";
  if (action.startsWith("booking.assigned")) return "bg-violet-500";
  if (action.startsWith("booking.status_changed")) return "bg-amber-500";
  if (action.startsWith("booking.modified")) return "bg-slate-400";
  if (action.startsWith("booking.cancelled")) return "bg-rose-500";
  return "bg-slate-400";
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

function categoryGradient(cat: string, partnerMeta = resolvePartnerMeta({})) {
  if (partnerMeta) return partnerMeta.gradient;
  switch (cat) {
    case "airport":
      return "from-sky-500 to-indigo-600 shadow-sky-500/25";
    case "city":
      return "from-violet-500 to-fuchsia-600 shadow-violet-500/25";
    case "long-distance":
      return "from-orange-500 to-rose-600 shadow-orange-500/25";
    case "vip":
      return "from-amber-400 to-amber-600 shadow-amber-500/30";
    case "partner":
      return "from-emerald-500 to-teal-600 shadow-emerald-500/25";
    default:
      return "from-slate-500 to-slate-700 shadow-slate-500/25";
  }
}

function categoryLabel(cat: string, partnerMeta = resolvePartnerMeta({})) {
  if (partnerMeta) return `${partnerMeta.short} Partner`;
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
  userEmail: _userEmail,
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
  const [statusValue, setStatusValue] = useState<BookingStatus>(booking.status);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);
  const [unassigning, setUnassigning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [priceNeedsApproval, setPriceNeedsApproval] = useState(false);
  const [approvalRange, setApprovalRange] = useState<{ minAcceptable: number; maxAcceptable: number } | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalReason, setApprovalReason] = useState("");
  const [sendingApproval, setSendingApproval] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);

  const [now, setNow] = useState<number>(Date.now());
  
  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const bookingId = booking._id || "";
  const partnerMeta = resolvePartnerMeta(booking);
  const partnerTone = partnerMeta ? getPartnerColorClasses(partnerMeta.accent) : null;
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
        setStatusValue(bRes.booking.status);
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
    if (newStatus === booking.status) {
      setStatusDropdownOpen(false);
      return;
    }
    const ok = window.confirm(
      `Biztosan módosítani szeretnéd a státuszt?\n${statusLabel(booking.status)} → ${STATUS_OPTIONS.find((o) => o.value === newStatus)?.label}`
    );
    if (!ok) {
      setStatusDropdownOpen(false);
      return;
    }
    try {
      setStatusDropdownOpen(false);
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.booking) throw new Error(data?.error || "Hiba");
      setBooking(data.booking);
      setStatusValue(newStatus);
      pushToast("success", "Státusz módosítva", `${statusLabel(booking.status)} → ${STATUS_OPTIONS.find((o) => o.value === newStatus)?.label}`);
      
      const aRes = await fetch(`/api/bookings/${bookingId}/audit`).then((r) => r.json().catch(() => ({})));
      if (Array.isArray(aRes?.logs)) setAuditLogs(aRes.logs.slice(0, 20));
      
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
      setStatusValue(data.booking.status);
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
      setStatusValue(data.booking.status);
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
      setPriceNeedsApproval(false);
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: Number(priceValue) || 0 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Hiba");
      if (data?.needsApproval) {
        setPriceNeedsApproval(true);
        setApprovalRange({ minAcceptable: data.minAcceptable, maxAcceptable: data.maxAcceptable });
        pushToast("info", "Jóváhagyásra vár", "Az ár nem esik a meghatározott tartományba, ezért admin jóváhagyás szükséges.");
        return;
      }
      if (!data?.booking) throw new Error(data?.error || "Hiba");
      setBooking(data.booking);
      setIsEditingPrice(false);
      pushToast("success", "Ár mentve", `${Number(priceValue).toLocaleString("hu-HU")} Ft`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : undefined;
      pushToast("error", "Ár mentés sikertelen", msg);
    } finally {
      setSavingPrice(false);
    }
  }

  async function handleSendApprovalRequest() {
    try {
      setSendingApproval(true);
      const res = await fetch(`/api/bookings/${bookingId}/price-approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestedPrice: Number(priceValue), reason: approvalReason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.booking) throw new Error(data?.error || "Hiba");
      setBooking(data.booking);
      setShowApprovalModal(false);
      setApprovalReason("");
      setPriceNeedsApproval(false);
      pushToast("success", "Jóváhagyási kérés elküldve", "Az admin értesítést kapott a jóváhagyáshoz.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : undefined;
      pushToast("error", "Jóváhagyás kérés sikertelen", msg);
    } finally {
      setSendingApproval(false);
    }
  }

  function handleSendReminder() {
    pushToast("info", "Emlékeztető elküldve", `Kézbesítve: ${booking.travelerEmail}`);
  }

  function handlePrint() {
    window.print();
  }

  function handleOpenMaps() {
    const from = encodeURIComponent(booking.fromAddress);
    const to = encodeURIComponent(booking.toAddress);
    const url = `https://www.google.com/maps/dir/?api=1&origin=${from}&destination=${to}&travelmode=driving`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleCallClient() {
    window.location.href = `tel:${booking.travelerPhone}`;
  }

  const [finalizing, setFinalizing] = useState(false);
  const [finalizingWithDriver, setFinalizingWithDriver] = useState(false);

  async function handleFinalize(withDriver: boolean) {
    if (withDriver && !booking.assignedDriverId) {
      pushToast("error", "Nincs sofőr", "A kiküldéshez előbb rendelj hozzá egy sofőrt!");
      return;
    }
    const ok = window.confirm(
      withDriver
        ? "Biztosan véglegesíted a foglalást és kiküldöd az értesítőt a sofőrnek és az utasnak is?"
        : "Biztosan véglegesíted a foglalást? (Az utas kap értesítést)"
    );
    if (!ok) return;

    try {
      if (withDriver) setFinalizingWithDriver(true);
      else setFinalizing(true);

      const res = await fetch(`/api/bookings/${bookingId}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withDriver }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.booking) throw new Error(data?.error || "Hiba");
      
      setBooking(data.booking);
      setStatusValue(data.booking.status);
      pushToast("success", "Sikeres véglegesítés", withDriver ? "Értesítések kiküldve." : "Foglalás megerősítve.");
      if (data?.warning) {
        pushToast("info", "E-mail figyelmeztetés", data.warning);
      }
      
      // Frissítsük az audit logokat, hogy egyből látszódjon a naplóban a véglegesítés
      const aRes = await fetch(`/api/bookings/${bookingId}/audit`).then((r) => r.json().catch(() => ({})));
      if (Array.isArray(aRes?.logs)) setAuditLogs(aRes.logs.slice(0, 20));
      
    } catch (err) {
      const msg = err instanceof Error ? err.message : undefined;
      pushToast("error", "Véglegesítés sikertelen", msg || "Ismeretlen hiba történt");
    } finally {
      setFinalizing(false);
      setFinalizingWithDriver(false);
    }
  }

  const sMeta = statusMeta(statusValue);

  return (
    <div className="min-h-screen text-slate-900 antialiased bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-32 w-[32rem] h-[32rem] rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-500/20 blur-3xl opacity-60" />
        <div className="absolute -bottom-40 -right-20 w-[36rem] h-[36rem] rounded-full bg-gradient-to-tr from-emerald-400/10 via-sky-400/10 to-blue-400/15 blur-3xl opacity-70" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-indigo-300/10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        {statusValue === 'modified' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl bg-orange-50 border border-orange-200 p-4 flex items-start gap-3 shadow-sm"
          >
            <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-black text-orange-900 mb-1">Módosított foglalás!</h3>
              <p className="text-xs font-medium text-orange-800 leading-relaxed">
                Ezt a foglalást a partner módosította. Kérlek ellenőrizd az adatokat, majd nyomj a <strong>Véglegesítés</strong> vagy <strong>Kiküldés Sofőrnek</strong> gombra, hogy az új adatok eljussanak az utashoz és a sofőrhöz!
              </p>
            </div>
          </motion.div>
        )}

        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-8"
        >
          {/* Felső sáv: Vissza gomb és Morzsamenü */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => {
                if (window.history.length > 1) router.back();
                else router.push("/");
              }}
              className="shrink-0 w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center"
              title="Vissza"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                <Home className="w-4 h-4" />
                <button
                  onClick={() => router.push("/")}
                  className="hover:text-slate-800 transition"
                >
                  Irányítópult
                </button>
                <ChevronRight className="w-3.5 h-3.5" />
                <button
                  onClick={() => router.push("/bookings")}
                  className="hover:text-slate-800 transition"
                >
                  Foglalások
                </button>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-slate-800">#{booking.bookingCode}</span>
              </div>
            </div>
          </div>

          {/* Fő vezérlőpult - 56 éves felhasználóknak optimalizálva (Nagy gombok, egyértelmű feliratok) */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              {/* Bal oldal: Státusz */}
              <div className="flex-shrink-0">
                <div className="text-xs font-black tracking-widest uppercase text-slate-400 mb-2.5">
                  Foglalás státusza
                </div>
                <div className="relative">
                  <button
                    onClick={() => setStatusDropdownOpen((v) => !v)}
                    className={`inline-flex items-center justify-between gap-4 px-6 py-4 rounded-2xl ${sMeta.pill} shadow-lg hover:shadow-xl transition-all min-w-[240px]`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex items-center justify-center">
                        <span className={`w-3.5 h-3.5 rounded-full ${sMeta.dot} ${statusValue === "in-progress" ? "animate-ping absolute" : ""}`} />
                        <span className={`w-3.5 h-3.5 rounded-full ${sMeta.dot} relative`} />
                      </div>
                      <span className="text-[15px] font-black tracking-wider uppercase">
                        {sMeta.label}
                      </span>
                    </div>
                    <ChevronDown className={`w-5 h-5 transition-transform ${statusDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  
                  <AnimatePresence>
                    {statusDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-3 w-72 rounded-3xl bg-white shadow-2xl shadow-slate-900/10 border border-slate-200 overflow-hidden z-50"
                      >
                        <div className="p-3 space-y-1">
                          {STATUS_OPTIONS.map((opt) => {
                            const active = opt.value === statusValue;
                            const m = statusMeta(opt.value);
                            return (
                              <button
                                key={opt.value}
                                onClick={() => handleStatusChange(opt.value)}
                                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition ${
                                  active
                                    ? "bg-slate-100"
                                    : "hover:bg-slate-50"
                                }`}
                              >
                                <span className={`w-4 h-4 rounded-full ${m.dot}`} />
                                <span className="flex-1 text-base font-black text-slate-800">{opt.label}</span>
                                {active && <Check className="w-5 h-5 text-slate-600" />}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Jobb oldal: Műveletek */}
              <div className="flex-grow flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 text-sm font-black tracking-wider uppercase hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-60"
                >
                  <RefreshCw className={`w-5 h-5 shrink-0 ${refreshing ? "animate-spin" : ""}`} />
                  <span>Frissítés</span>
                </button>

                <button
                  onClick={() => handleFinalize(false)}
                  disabled={finalizing}
                  className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-slate-800 text-white text-sm font-black tracking-wider uppercase shadow-lg hover:bg-slate-900 hover:-translate-y-0.5 transition-all disabled:opacity-60"
                >
                  {finalizing ? <Loader2 className="w-5 h-5 shrink-0 animate-spin" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                  <span>Véglegesítés</span>
                </button>

                <button
                  onClick={() => handleFinalize(true)}
                  disabled={finalizingWithDriver}
                  className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-black tracking-wider uppercase shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-teal-700 hover:-translate-y-0.5 transition-all disabled:opacity-60"
                >
                  {finalizingWithDriver ? <Loader2 className="w-5 h-5 shrink-0 animate-spin" /> : <Send className="w-5 h-5 shrink-0" />}
                  <span className="whitespace-nowrap">Kiküldés Sofőrnek</span>
                </button>
              </div>
            </div>
          </div>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="mt-8 mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <div className={`shrink-0 w-20 h-20 rounded-3xl bg-gradient-to-br ${categoryGradient(booking.category, partnerMeta)} shadow-xl flex items-center justify-center ring-4 ring-white`}>
              <CalendarDays className="w-9 h-9 text-white" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-bold text-slate-600 mb-1">
                {formatHuDate(booking.pickupDate)}
              </div>
              <div className="flex items-baseline gap-4 flex-wrap">
                <div className={`font-black ${partnerTone ? partnerTone.text : "text-blue-600"} text-5xl sm:text-6xl tracking-tight font-mono leading-none`}>
                  {booking.pickupTime}
                </div>
                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl ${partnerTone ? `${partnerTone.soft} ${partnerTone.text} border ${partnerTone.border}` : "bg-gradient-to-r from-blue-500/15 to-indigo-500/15 text-blue-700 ring-1 ring-blue-500/20 border border-blue-200/70"} text-[11px] font-black tracking-wider uppercase`}>
                    #{booking.bookingCode}
                    {partnerMeta && <span className="ml-1 text-[9px] opacity-80 tracking-[0.18em]">{partnerMeta.short}</span>}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r ${categoryGradient(booking.category, partnerMeta)} text-white text-[11px] font-black tracking-wider uppercase shadow-md`}>
                    {categoryLabel(booking.category, partnerMeta)}
                  </span>
                  {booking.driverNotified && (
                    <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl border text-[11px] font-black tracking-wider uppercase ${booking.driverAcknowledged ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      {booking.driverAcknowledged ? (
                        <><ShieldCheck className="w-3.5 h-3.5" /> Sofőr látta</>
                      ) : (
                        <><Clock className="w-3.5 h-3.5 animate-pulse" /> Sofőr értesítve</>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="rounded-3xl bg-white shadow-2xl shadow-slate-900/[0.05] border border-slate-200/80 overflow-hidden mb-7"
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
            <div className="p-7 lg:border-r border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500/15 to-blue-500/15 border border-sky-200/60 text-sky-600">
                  <MapPin className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-black tracking-[0.18em] uppercase text-slate-500">
                  Indulás · Cél
                </span>
              </div>
              <div className="relative space-y-6">
                <div>
                  <div className="text-[10px] font-black tracking-wider uppercase text-emerald-600 mb-1">
                    Honnan
                  </div>
                  <div className="font-bold text-slate-900 text-[14px] leading-snug">
                    {booking.fromAddress}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-black tracking-wider uppercase text-rose-600 mb-1">
                    Hova
                  </div>
                  <div className="font-bold text-slate-900 text-[14px] leading-snug">
                    {booking.toAddress}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-7 lg:border-r border-slate-200 bg-gradient-to-br from-slate-50/50 to-transparent">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 border border-violet-200/60 text-violet-600">
                  <BadgeCheck className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-black tracking-[0.18em] uppercase text-slate-500">
                  Típus
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] font-black tracking-wider uppercase text-slate-400 mb-1.5">
                    Transfer
                  </div>
                  <div className="font-bold text-slate-900 text-[14px]">
                    {partnerMeta ? (
                      <span className="inline-flex items-center gap-1.5">
                        <BadgeCheck className={`w-4 h-4 ${partnerTone ? partnerTone.text : "text-blue-600"}`} />
                        {partnerMeta.short} Partner
                      </span>
                    ) : booking.transferType === "executive" ? (
                      <span className="inline-flex items-center gap-1.5">
                        <BadgeCheck className="w-4 h-4 text-amber-500" />
                        Executive
                      </span>
                    ) : (
                      "Standard"
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-black tracking-wider uppercase text-slate-400 mb-1.5">
                    Fizetés
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-black text-slate-700">
                    <WalletCards className="w-3.5 h-3.5 text-slate-500" />
                    {booking.paymentMethod === "card" ? "Bankkártya" : "Banki átutalás"}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-7 lg:border-r border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/15 border border-amber-200/60 text-amber-600">
                  <Users2 className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-black tracking-[0.18em] uppercase text-slate-500">
                  Utasok · Csomagok
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 p-3.5 text-center">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-2">
                    <Users2 className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="text-[10px] font-black tracking-wider uppercase text-slate-400">
                    Utasok
                  </div>
                  <div className="font-black text-slate-900 text-2xl tabular-nums mt-0.5">
                    {booking.travelers}
                    <span className="text-sm font-bold text-slate-400 ml-0.5">fő</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 p-3.5 text-center">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-2">
                    <Luggage className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="text-[10px] font-black tracking-wider uppercase text-slate-400">
                    Csomagok
                  </div>
                  <div className="font-black text-slate-900 text-2xl tabular-nums mt-0.5">
                    {booking.luggage}
                    <span className="text-sm font-bold text-slate-400 ml-0.5">db</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-7 bg-gradient-to-br from-emerald-50/40 via-teal-50/20 to-transparent">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 border border-emerald-200/60 text-emerald-600">
                  <CreditCard className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-black tracking-[0.18em] uppercase text-slate-500">
                  Ár · Hozzárendelés
                </span>
              </div>
              <div className="space-y-3.5">
                <div>
                  <div className="text-[10px] font-black tracking-wider uppercase text-slate-400 mb-1">
                    Összeg
                  </div>
                  {hasPrice ? (
                    <div className="font-black text-slate-900 text-2xl tabular-nums tracking-tight">
                      {booking.price!.toLocaleString("hu-HU")}
                      <span className="text-sm font-bold text-slate-400 ml-1">Ft</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-700">
                      Nincs ár megadva
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-[10px] font-black tracking-wider uppercase text-slate-400 mb-1">
                    Hozzárendelés
                  </div>
                  {isAssigned ? (
                    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span className="text-[10px] font-black tracking-wider uppercase text-emerald-700">
                          Hozzárendelve
                        </span>
                      </div>
                      <div className="text-[12px] font-bold text-slate-800 truncate">
                        {booking.assignedDriverName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {booking.assignedVehicleName}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        Várakozik a hozzárendelésre
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="rounded-3xl bg-white shadow-2xl shadow-slate-900/[0.05] border border-slate-200/80 overflow-hidden"
            >
              <div className="px-7 py-5 border-b border-slate-200/80">
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-2xl ${partnerMeta ? `bg-gradient-to-br ${partnerMeta.gradient}` : "bg-gradient-to-br from-slate-700 to-slate-900"} text-white shadow-sm flex items-center justify-center`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black tracking-[0.24em] uppercase text-slate-400 mb-0.5">
                      Utas adatai
                    </div>
                    <h2 className="font-sans font-black text-[22px] tracking-tight text-slate-900 leading-none">
                      {booking.travelerName}
                    </h2>
                  </div>
                </div>
              </div>

              <div className="p-7 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-2">
                      Utas neve
                    </div>
                    <div className="font-black text-slate-900 text-[17px] leading-tight mb-3">
                      {booking.travelerName}
                    </div>
                    {booking.companyName && (
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border w-fit ${partnerTone ? `${partnerTone.soft} ${partnerTone.text} ${partnerTone.border}` : "bg-slate-50 text-slate-700 border-slate-200"}`}>
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[11.5px] font-black tracking-tight">
                          {booking.companyName}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                    <a
                      href={`mailto:${booking.travelerEmail}`}
                      className="flex items-center gap-3 text-[13px] font-bold text-slate-700 hover:text-blue-600 transition group"
                    >
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 text-blue-600 shrink-0 group-hover:scale-[1.03] transition">
                        <Mail className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[9.5px] font-black tracking-[0.18em] uppercase text-slate-400 mb-0.5">E-mail</div>
                        <span className="truncate block">{booking.travelerEmail}</span>
                      </div>
                    </a>
                    <div className="h-px bg-gradient-to-r from-slate-200/0 via-slate-200/60 to-slate-200/0" />
                    <a
                      href={`tel:${booking.travelerPhone}`}
                      className="flex items-center gap-3 text-[13px] font-bold text-slate-700 hover:text-slate-900 transition group"
                    >
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 shrink-0 group-hover:scale-[1.03] transition">
                        <Phone className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[9.5px] font-black tracking-[0.18em] uppercase text-slate-400 mb-0.5">Telefonszám</div>
                        <span className="truncate block">{booking.travelerPhone}</span>
                      </div>
                    </a>
                  </div>
                </div>

                {(booking.secondTravelerEmail || booking.secondTravelerPhone) && (
                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/70 to-white p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Users2 className="w-4 h-4 text-slate-500" />
                      <span className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-500">
                        Második utas
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {booking.secondTravelerEmail && (
                        <a
                          href={`mailto:${booking.secondTravelerEmail}`}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-[12px] font-bold text-slate-700 hover:text-blue-600 hover:border-blue-200 transition shadow-sm"
                        >
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span className="truncate">{booking.secondTravelerEmail}</span>
                        </a>
                      )}
                      {booking.secondTravelerPhone && (
                        <a
                          href={`tel:${booking.secondTravelerPhone}`}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-[12px] font-bold text-slate-700 hover:text-slate-900 hover:border-slate-300 transition shadow-sm"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span className="truncate">{booking.secondTravelerPhone}</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <StickyNote className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-500">
                      Megjegyzés
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
                  </div>
                  {booking.comment ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm relative">
                      <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-slate-100 to-slate-50 rounded-bl-2xl border-l border-b border-slate-200" />
                      <p className="text-[13.5px] font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {booking.comment}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                          <StickyNote className="w-4.5 h-4.5 text-slate-300" />
                        </div>
                        <span className="text-[12.5px] text-slate-400 italic font-medium">
                          Nincs megjegyzés a foglaláshoz
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3.5">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-500">
                      Szolgáltatás díja
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
                    {booking.priceApprovalStatus === 'pending_approval' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-[9.5px] font-black tracking-[0.18em] uppercase text-amber-700">
                        <Clock className="w-3 h-3" />
                        Jóváhagyásra vár
                      </span>
                    )}
                    {booking.priceApprovalStatus === 'approved' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[9.5px] font-black tracking-[0.18em] uppercase text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" />
                        Jóváhagyva
                      </span>
                    )}
                    {booking.priceApprovalStatus === 'rejected' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-[9.5px] font-black tracking-[0.18em] uppercase text-rose-700">
                        <XCircle className="w-3 h-3" />
                        Elutasítva
                      </span>
                    )}
                    {hasPrice && !booking.priceApprovalStatus && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[9.5px] font-black tracking-[0.18em] uppercase text-slate-500">
                        <Clock className="w-3 h-3" />
                        Függőben
                      </span>
                    )}
                  </div>
                  {hasPrice && !isEditingPrice ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <div className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-1.5">
                          Becsült teljes összeg
                        </div>
                        <div className="font-black text-slate-900 text-4xl tabular-nums tracking-tight">
                          {booking.price!.toLocaleString("hu-HU")}
                          <span className="text-sm font-bold text-slate-400 ml-1.5">Ft</span>
                        </div>
                      </div>
                      <button
                        onClick={() => { setPriceValue(booking.price || 0); setIsEditingPrice(true); }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-black tracking-[0.18em] uppercase hover:bg-slate-100 hover:border-slate-300 transition-all"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Szerkesztés
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                        <div className="flex-1">
                          <label className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-1.5 block">
                            Összeg (Ft)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={priceValue}
                              onChange={(e) => { setPriceValue(Number(e.target.value)); setPriceNeedsApproval(false); }}
                              className={`w-full px-5 py-3.5 pr-16 rounded-xl bg-slate-50 border text-[20px] font-black text-slate-900 tabular-nums focus:outline-none focus:ring-4 transition ${priceNeedsApproval ? "border-amber-400 focus:border-amber-500 focus:ring-amber-100" : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"}`}
                              placeholder="0"
                            />
                            {priceNeedsApproval && (
                              <span className="pointer-events-none absolute right-12 top-1/2 -translate-y-1/2">
                                <Lock className="w-4 h-4 text-amber-500" />
                              </span>
                            )}
                            <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[11px] font-black tracking-[0.18em] uppercase text-slate-400">
                              Ft
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={handleSavePrice}
                          disabled={savingPrice}
                          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-slate-800 to-slate-950 text-white text-xs font-black tracking-[0.18em] uppercase shadow-lg shadow-slate-900/15 hover:from-slate-700 hover:to-slate-900 hover:-translate-y-[1px] hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 sm:min-w-[180px]"
                        >
                          {savingPrice ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Mentés…</>
                          ) : (
                            <><Save className="w-4 h-4" /> Ár mentése</>
                          )}
                        </button>
                        {hasPrice && (
                          <button
                            onClick={() => { setIsEditingPrice(false); setPriceNeedsApproval(false); }}
                            className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-black tracking-[0.18em] uppercase hover:bg-slate-200 transition-all"
                          >
                            Mégsem
                          </button>
                        )}
                      </div>

                      {priceNeedsApproval && (
                        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <div className="text-sm font-black text-amber-900 mb-0.5">Az ár jóváhagyásra szorul</div>
                              <div className="text-xs text-amber-700">
                                A megadott ár ({Number(priceValue).toLocaleString("hu-HU")} Ft) kívül esik az elfogadható tartományon.
                                {approvalRange && (
                                  <span> Elfogadható: {approvalRange.minAcceptable.toLocaleString("hu-HU")} – {approvalRange.maxAcceptable.toLocaleString("hu-HU")} Ft</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowApprovalModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black tracking-[0.18em] uppercase shadow-md shadow-amber-600/20 transition-all"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            Jóváhagyás kérése
                          </button>
                        </div>
                      )}

                      {booking.priceApprovalStatus === 'pending_approval' && booking.priceApprovalRequest && (
                        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span className="text-xs font-black text-amber-900">Admin jóváhagyásra vár</span>
                          </div>
                          <div className="text-xs text-amber-700">
                            Kért ár: <strong>{booking.priceApprovalRequest.requestedPrice.toLocaleString("hu-HU")} Ft</strong>
                            {booking.priceApprovalRequest.reason && <> · Indok: {booking.priceApprovalRequest.reason}</>}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
              className="rounded-3xl bg-white shadow-2xl shadow-slate-900/[0.05] border border-slate-200/80 overflow-hidden"
            >
              <div className="px-7 py-5 border-b border-slate-200/80">
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-2xl ${partnerMeta ? `bg-gradient-to-br ${partnerMeta.gradient}` : "bg-gradient-to-br from-slate-700 to-slate-900"} text-white shadow-sm flex items-center justify-center`}>
                    <CarFront className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black tracking-[0.24em] uppercase text-slate-400 mb-0.5">
                      Hozzárendelés
                    </div>
                    <h2 className="font-sans font-black text-[21px] tracking-tight text-slate-900 leading-none">
                      Sofőr és jármű
                    </h2>
                  </div>
                </div>
              </div>

              <div className="p-7 space-y-6">
                {isAssigned && (
                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/80 to-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-sm flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-0.5">
                            Aktív hozzárendelés
                          </div>
                          <div className="font-bold text-slate-900 text-[15px] leading-tight">
                            Jelenlegi lefoglalt erőforrások
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {booking.driverNotified && (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black tracking-[0.18em] uppercase ${booking.driverAcknowledged ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                            {booking.driverAcknowledged ? (
                              <><ShieldCheck className="w-3.5 h-3.5" /> Sofőr látta</>
                            ) : (
                              <><Clock className="w-3.5 h-3.5 animate-pulse" /> Értesítve</>
                            )}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-black tracking-[0.18em] uppercase">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          HOZZÁRENDELVE
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                            <UserCircle2 className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[9.5px] font-black tracking-[0.2em] uppercase text-slate-400 mb-0.5">
                              Sofőr
                            </div>
                            <div className="font-black text-slate-900 text-[15px] truncate leading-tight">
                              {booking.assignedDriverName || "—"}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                            <CarFront className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[9.5px] font-black tracking-[0.2em] uppercase text-slate-400 mb-0.5">
                              Jármű
                            </div>
                            <div className="font-black text-slate-900 text-[15px] truncate leading-tight">
                              {booking.assignedVehicleName || "—"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-2 block">
                      Sofőr
                    </label>
                    <div className="relative">
                      <select
                        value={selectedDriverId}
                        onChange={(e) => setSelectedDriverId(e.target.value)}
                        className="w-full px-4.5 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100 transition appearance-none pr-12 cursor-pointer hover:bg-slate-100/60"
                      >
                        <option value="">— Válassz sofőrt —</option>
                        {drivers.map((d) => (
                          <option key={d._id} value={d._id as string}>
                            {d.name} · {d.phone}
                            {d.type === "substitute" ? " (pótló)" : ""}
                            {d.status === "inactive" ? " [inaktív]" : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-2 block">
                      Jármű
                    </label>
                    <div className="relative">
                      <select
                        value={selectedVehicleId}
                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                        className="w-full px-4.5 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100 transition appearance-none pr-12 cursor-pointer hover:bg-slate-100/60"
                      >
                        <option value="">— Válassz járművet —</option>
                        {vehicles.map((v) => (
                          <option key={String(v._id)} value={String(v._id)}>
                            {v.name}
                            {v.seats ? ` · ${v.seats}fő` : ""}
                            {v.color ? ` · ${v.color}` : ""}
                            {v.plates ? ` · ${v.plates}` : ""}
                            {v.condition === "not_working" ? " [hibás]" : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleAssign}
                    disabled={assigning}
                    className={`flex-1 inline-flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-white text-[12px] font-black tracking-[0.2em] uppercase shadow-lg hover:-translate-y-[1px] hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${partnerMeta ? `bg-gradient-to-r ${partnerMeta.gradient}` : "bg-gradient-to-r from-slate-800 to-slate-950 shadow-slate-900/20 hover:from-slate-700 hover:to-slate-900"}`}
                  >
                    {assigning ? (
                      <><Loader2 className="w-4.5 h-4.5 animate-spin" /> Feldolgozás…</>
                    ) : (
                      <><CheckCircle2 className="w-4.5 h-4.5" /> Hozzárendelés</>
                    )}
                  </button>
                  {isAssigned && (
                    <button
                      onClick={handleUnassign}
                      disabled={unassigning}
                      className="sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-white border border-slate-200 text-slate-700 text-[11px] font-black tracking-[0.2em] uppercase shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed sm:min-w-[240px]"
                    >
                      {unassigning ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Feldolgozás…</>
                      ) : (
                        <><Link2Off className="w-4 h-4" /> Visszavonás</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.section>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.25 }}
              className="rounded-3xl bg-white shadow-2xl shadow-slate-900/[0.05] border border-slate-200/80 overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-slate-200/80 bg-gradient-to-r from-white via-slate-50/50 to-blue-50/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 text-white shadow-lg flex items-center justify-center ring-2 ring-white">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black tracking-[0.22em] uppercase text-slate-400 mb-0.5">
                      Napló
                    </div>
                    <h2 className="font-serif text-[20px] font-bold tracking-tight text-slate-900">
                      Műveletnapló
                    </h2>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200 text-[10.5px] font-black tracking-wider uppercase text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  Legutóbbi 20
                </div>
              </div>
              <div className="p-6 max-h-[520px] overflow-y-auto">
                {auditLogs.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center mb-4 shadow-inner">
                      <History className="w-7 h-7 text-slate-300" strokeWidth={1.5} />
                    </div>
                    <div className="font-serif text-[15px] font-bold text-slate-600 mb-0.5">
                      Nincs még naplóbejegyzés
                    </div>
                    <div className="text-[11.5px] text-slate-400">
                      A műveletek innentől kezdődően lesznek rögzítve.
                    </div>
                  </div>
                ) : (
                  <ol className="relative">
                    <div className="absolute left-[17px] top-1.5 bottom-1.5 w-0.5 bg-gradient-to-b from-slate-200 via-slate-200/70 to-transparent" />
                    {auditLogs.slice(0, 20).map((log, idx) => {
                      let detailsStr = "";
                      if (log.action === "booking.status_changed" && log.details && (log.details as any).from && (log.details as any).to) {
                        const fromLabel = statusLabel((log.details as any).from as BookingStatus);
                        const toLabel = statusLabel((log.details as any).to as BookingStatus);
                        detailsStr = `${fromLabel} → ${toLabel}`;
                      } else {
                        detailsStr =
                          typeof log.details === "string"
                            ? log.details
                            : log.details
                            ? JSON.stringify(log.details)
                            : "";
                      }
                      return (
                        <motion.li
                          key={log._id || idx}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25, delay: 0.04 * idx }}
                          className="relative pl-11 pb-5 last:pb-0"
                        >
                          <span className="absolute left-0 top-1 w-[35px] h-[35px] rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center z-10">
                            <span className={`w-2.5 h-2.5 rounded-full ${actionDotColor(log.action)}`} />
                          </span>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[9.5px] font-black tracking-wider uppercase border ${actionBadge(log.action)}`}
                              >
                                {actionLabel(log.action)}
                              </span>
                              <span className="text-[10.5px] font-bold text-slate-400">
                                {relativeTime(log.timestamp, now)}
                              </span>
                            </div>
                            <div className="text-[12.5px] font-black text-slate-800 truncate">
                              {log.actor || "Rendszer"}
                            </div>
                            {detailsStr && (
                              <div className="text-[11.5px] text-slate-500 font-medium leading-relaxed break-words">
                                {detailsStr.length > 140 ? detailsStr.slice(0, 140) + "…" : detailsStr}
                              </div>
                            )}
                          </div>
                        </motion.li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </motion.section>
          </div>
        </div>
      </div>

      {/* Jóváhagyás kérés modal */}
      <AnimatePresence>
        {showApprovalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-7"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-500/30 flex items-center justify-center text-white">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">Ár jóváhagyás</div>
                  <h3 className="font-sans font-black text-[18px] tracking-tight text-slate-900 leading-none">Jóváhagyás kérése</h3>
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 mb-5">
                <div className="text-xs font-bold text-amber-800 mb-0.5">Kért ár</div>
                <div className="text-2xl font-black tabular-nums text-amber-900">{Number(priceValue).toLocaleString("hu-HU")} <span className="text-sm font-bold text-amber-600">Ft</span></div>
                {approvalRange && (
                  <div className="text-xs text-amber-700 mt-1">
                    Elfogadható tartomány: {approvalRange.minAcceptable.toLocaleString("hu-HU")} – {approvalRange.maxAcceptable.toLocaleString("hu-HU")} Ft
                  </div>
                )}
              </div>

              <div className="mb-5">
                <label className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-1.5 block">
                  Indok (opcionális)
                </label>
                <textarea
                  value={approvalReason}
                  onChange={(e) => setApprovalReason(e.target.value)}
                  rows={3}
                  placeholder="Miért szükséges ez az ár? (pl. különleges igény, egyedi megállapodás...)"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 resize-none transition"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowApprovalModal(false); setApprovalReason(""); }}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-black tracking-[0.1em] uppercase transition"
                >
                  Mégsem
                </button>
                <button
                  onClick={handleSendApprovalRequest}
                  disabled={sendingApproval}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-black tracking-[0.1em] uppercase shadow-lg shadow-amber-500/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {sendingApproval ? (
                    <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Küldés…</span>
                  ) : (
                    <span className="flex items-center justify-center gap-2"><Send className="w-4 h-4" /> Kérés elküldése</span>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-5 right-5 z-50 space-y-2.5 max-w-sm w-[calc(100%-2.5rem)] sm:w-auto pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97, x: 8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="pointer-events-auto rounded-3xl bg-white shadow-2xl shadow-slate-900/[0.15] border border-slate-200 p-4.5 flex items-start gap-3.5"
            >
              <div
                className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center ring-2 ring-white shadow-md ${
                  t.type === "success"
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
                    : t.type === "error"
                    ? "bg-gradient-to-br from-rose-500 to-red-600 text-white"
                    : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                }`}
              >
                {t.type === "success" ? (
                  <CheckCircle2 className="w-5.5 h-5.5" />
                ) : t.type === "error" ? (
                  <XCircle className="w-5.5 h-5.5" />
                ) : (
                  <Info className="w-5.5 h-5.5" />
                )}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="text-[13px] font-black text-slate-900 leading-tight">{t.title}</div>
                {t.message && (
                  <div className="text-[11.5px] font-medium text-slate-500 mt-1 leading-relaxed">{t.message}</div>
                )}
              </div>
              <button
                onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))}
                className="shrink-0 w-8 h-8 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-white transition flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
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
