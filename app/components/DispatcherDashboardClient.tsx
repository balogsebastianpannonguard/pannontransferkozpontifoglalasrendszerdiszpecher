"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  CalendarCheck,
  CarFront,
  Users2,
  Clock,
  PlusCircle,
  UserPlus,
  UserCircle2,
  BarChart3,
  ShieldAlert,
  ShieldCheck,
  Star,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Home,
  ListChecks,
  FileBarChart,
  Settings,
  Bell,
  Search,
  MapPin,
  Gauge,
  X,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { ClientsView } from "./ClientsView";

interface DispatcherDashboardUser {
  email: string;
  name: string;
  role: "dispatcher" | "admin" | "partner";
  company?: string;
  loginAt: number;
  requireTwoFactor?: boolean;
  twoFactorEnabled?: boolean;
  staffId?: string;
}

type NavItemId =
  | "dashboard"
  | "calendar"
  | "bookings"
  | "vehicles"
  | "drivers"
  | "clients"
  | "routes"
  | "reports"
  | "settings";

interface SidebarNavItem {
  id: NavItemId;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  accent?: string;
  badge?: string | number;
  locked?: boolean;
}

const HUN_MONTHS = [
  "Január", "Február", "Március", "Április", "Május", "Június",
  "Július", "Augusztus", "Szeptember", "Október", "November", "December",
];
const HUN_WEEKDAYS_LONG = ["Vasárnap", "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat"];
const HUN_WEEKDAYS_SHORT = ["V", "H", "K", "Sz", "Cs", "P", "Szo"];

type BookingStatus = "confirmed" | "pending" | "in-progress" | "completed" | "cancelled" | "modified";
type BookingCategory = "airport" | "city" | "long-distance" | "vip" | "partner";

interface DemoBooking {
  id: string;
  day: number;
  month: number;
  year: number;
  time: string;
  client: string;
  route: string;
  vehicle: string;
  pax: number;
  status: BookingStatus;
  category: BookingCategory;
  isCatl: boolean;
  price?: number;
  createdAt?: number;
}

interface RealBooking {
  _id: string;
  bookingCode: string;
  travelerName: string;
  travelerEmail: string;
  travelerPhone: string;
  companyName?: string;
  userEmail?: string;
  fromAddress: string;
  toAddress: string;
  pickupDate: string;
  pickupTime: string;
  travelers: number;
  luggage: number;
  transferType: string;
  paymentMethod: string;
  status: BookingStatus;
  category: BookingCategory;
  assignedDriverName?: string;
  assignedVehicleName?: string;
  price?: number;
  comment?: string;
  createdAt: number;
}

interface RecentBookingNotif {
  _id: string;
  bookingCode: string;
  travelerName: string;
  companyName?: string;
  travelerEmail?: string;
  userEmail?: string;
  pickupDate: string;
  pickupTime: string;
  status: BookingStatus;
  category: BookingCategory;
  createdAt: number;
  get isCatl(): boolean;
}

function bookingIsCatl(b: { companyName?: string; travelerEmail?: string; userEmail?: string }) {
  return Boolean(
    (b.companyName && (b.companyName.toUpperCase().includes("CATL") || b.companyName.toUpperCase().includes("宁德时代"))) ||
    (b.travelerEmail && /catl/i.test(b.travelerEmail)) ||
    (b.userEmail && /catl/i.test(b.userEmail))
  );
}

interface NotificationsResponse {
  pendingCount: number;
  recentBookings: RecentBookingNotif[];
}

function monogramOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatGreeting(hour: number, name: string) {
  const n = name.split(/\s+/)[0] || name;
  if (hour < 6) return `Jó éjszakát, ${n}! 🌙`;
  if (hour < 11) return `Jó reggelt, ${n}! ☀️`;
  if (hour < 18) return `Szép napot, ${n}! 👋`;
  return `Jó estét, ${n}! 🌆`;
}

function statusColor(status: BookingStatus) {
  switch (status) {
    case "confirmed":
      return {
        dot: "bg-emerald-500",
        chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
        bar: "bg-gradient-to-r from-emerald-500 to-teal-500",
        label: "Megerősítve",
      };
    case "pending":
      return {
        dot: "bg-amber-500",
        chip: "bg-amber-50 text-amber-700 border-amber-200",
        bar: "bg-gradient-to-r from-amber-500 to-orange-500",
        label: "Függőben",
      };
    case "modified":
      return {
        dot: "bg-blue-500",
        chip: "bg-blue-50 text-blue-700 border-blue-200",
        bar: "bg-gradient-to-r from-blue-500 to-indigo-500",
        label: "Módosítva",
      };
    case "in-progress":
      return {
        dot: "bg-blue-500",
        chip: "bg-blue-50 text-blue-700 border-blue-200",
        bar: "bg-gradient-to-r from-blue-500 to-indigo-500",
        label: "Folyamatban",
      };
    case "completed":
      return {
        dot: "bg-slate-400",
        chip: "bg-slate-50 text-slate-600 border-slate-200",
        bar: "bg-gradient-to-r from-slate-400 to-slate-500",
        label: "Befejezett",
      };
    case "cancelled":
      return {
        dot: "bg-rose-500",
        chip: "bg-rose-50 text-rose-700 border-rose-200",
        bar: "bg-gradient-to-r from-rose-500 to-red-500",
        label: "Lemondott",
      };
  }
}

function categoryGradient(cat: BookingCategory, isNewOrModified: boolean = false, isCatl: boolean = false) {
  if (isCatl) return "from-blue-500 to-indigo-600 shadow-blue-500/25";
  if (isNewOrModified) return "from-blue-500 to-indigo-600 shadow-blue-500/25";
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
  }
}

function categoryLabel(cat: BookingCategory) {
  return {
    airport: "Repülőtéri",
    city: "Városi",
    "long-distance": "Távolsági",
    vip: "VIP",
    partner: "Partner",
  }[cat];
}

function todayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function DispatcherDashboardClient({
  initialUser,
}: {
  initialUser: DispatcherDashboardUser;
}) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [active, setActive] = useState<NavItemId>("dashboard");
  const [hour, setHour] = useState(new Date().getHours());

  const today = useMemo(() => new Date(), []);
  const [cursorDate, setCursorDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const [selectedDateKey, setSelectedDateKey] = useState<string>(
    `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`
  );

  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [recentBookings, setRecentBookings] = useState<RecentBookingNotif[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const lastPollTimestamp = useRef<number>(0);

  const [realBookings, setRealBookings] = useState<RealBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsMeta, setBookingsMeta] = useState({ pendingCount: 0, totalCount: 0 });

  const notificationsRef = useRef<HTMLDivElement>(null);
  const [popoverKey, setPopoverKey] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setHour(new Date().getHours()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotificationsDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const greeting = useMemo(() => formatGreeting(hour, user.name || user.email), [hour, user.name, user.email]);

  const roleMeta = useMemo(() => {
    const isAdmin = user.role === "admin";
    return {
      badgeClass: isAdmin
        ? "bg-gradient-to-r from-slate-800 to-slate-950 text-white border-slate-700 shadow-slate-900/25"
        : "bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-blue-500 shadow-blue-600/25",
      starClass: isAdmin
        ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-amber-500/40"
        : "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-amber-500/40",
      label: isAdmin ? "ADMIN" : "DISZPÉCSER",
      accessLevel: isAdmin ? 10 : 8,
      avatarClass: isAdmin
        ? "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950 shadow-slate-900/40 text-white"
        : "bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 shadow-blue-700/40 text-white",
    };
  }, [user.role]);

  const navItems: SidebarNavItem[] = useMemo(
    () => [
      {
        id: "dashboard",
        label: "Irányítópult",
        subtitle: "Áttekintés",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
          </svg>
        ),
      },
      {
        id: "calendar",
        label: "Naptár & Menetrend",
        subtitle: "Foglalások naptárban",
        icon: <CalendarIcon className="w-5 h-5" />,
        accent: "from-blue-500 to-indigo-600",
      },
      {
        id: "bookings",
        label: "Foglalások",
        subtitle: "Összes rendelés",
        icon: <ListChecks className="w-5 h-5" />,
        badge: pendingCount > 0 ? pendingCount : undefined,
      },
      {
        id: "vehicles",
        label: "Járművek",
        subtitle: "Flotta kezelés",
        icon: <CarFront className="w-5 h-5" />,
      },
      {
        id: "drivers",
        label: "Sofőrök",
        subtitle: "Munkatársak kezelése",
        icon: <UserCircle2 className="w-5 h-5" />,
      },
      {
        id: "clients",
        label: "Ügyfelek",
        subtitle: "Partnercégek",
        icon: <Users2 className="w-5 h-5" />,
      },
      {
        id: "routes",
        label: "Útvonalak",
        subtitle: "Mentett útvonalak",
        icon: <MapPin className="w-5 h-5" />,
        locked: true,
      },
      {
        id: "reports",
        label: "Jelentések",
        subtitle: "Statisztikák",
        icon: <FileBarChart className="w-5 h-5" />,
        locked: true,
      },
      {
        id: "settings",
        label: "Beállítások",
        subtitle: "Profil & rendszer",
        icon: <Settings className="w-5 h-5" />,
      },
    ],
    [pendingCount]
  );

  const transformedBookings: DemoBooking[] = useMemo(() => {
    return realBookings.map((b) => {
      const parts = b.pickupDate.split("-");
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const isCatl = Boolean(
        (b.companyName && (b.companyName.toUpperCase().includes("CATL") || b.companyName.toUpperCase().includes("宁德时代"))) ||
        (b.travelerEmail && /catl/i.test(b.travelerEmail)) ||
        (b.userEmail && /catl/i.test(b.userEmail))
      );
      return {
        id: b._id,
        day: d,
        month: m,
        year: y,
        time: b.pickupTime,
        client: b.travelerName + (b.companyName ? ` · ${b.companyName}` : ""),
        route: b.fromAddress + " → " + b.toAddress,
        vehicle: b.assignedVehicleName || "Hozzárendelés függőben",
        pax: b.travelers,
        status: b.status,
        category: b.category,
        isCatl,
        price: b.price,
        createdAt: b.createdAt,
      };
    });
  }, [realBookings]);

  const monthBookings = useMemo(() => {
    const y = cursorDate.getFullYear();
    const m = cursorDate.getMonth();
    const map = new Map<string, DemoBooking[]>();
    for (const b of transformedBookings) {
      if (b.year !== y || b.month !== m) continue;
      const key = `${y}-${m}-${b.day}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return map;
  }, [transformedBookings, cursorDate]);

  const stats = useMemo(() => {
    const todayStr = todayString();
    const todayBookings = realBookings.filter((b) => b.pickupDate === todayStr);
    const confirmed = realBookings.filter((b) => b.status === "confirmed" || b.status === "in-progress").length;
    const pending = realBookings.filter((b) => b.status === "pending" || b.status === "modified").length;
    const revenue = realBookings
      .filter((b) => b.price && (b.status === "confirmed" || b.status === "in-progress" || b.status === "completed"))
      .reduce((s, b) => s + (b.price || 0), 0);
    return {
      today: todayBookings.length,
      confirmed,
      pending,
      revenue,
      inProgress: realBookings.filter((b) => b.status === "in-progress").length,
    };
  }, [realBookings]);

  const calendarCells = useMemo(() => {
    const y = cursorDate.getFullYear();
    const m = cursorDate.getMonth();
    const firstOfMonth = new Date(y, m, 1);
    const firstWeekday = firstOfMonth.getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const daysInPrev = new Date(y, m, 0).getDate();

    const cells: { day: number; month: number; year: number; inMonth: boolean; key: string }[] = [];
    const startOffset = (firstWeekday + 6) % 7;
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = daysInPrev - i;
      const date = new Date(y, m - 1, d);
      cells.push({
        day: d, month: date.getMonth(), year: date.getFullYear(), inMonth: false,
        key: `${date.getFullYear()}-${date.getMonth()}-${d}`,
      });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, month: m, year: y, inMonth: true, key: `${y}-${m}-${d}` });
    }
    while (cells.length % 7 !== 0) {
      const nextD = cells.length - (startOffset + daysInMonth) + 1;
      const date = new Date(y, m + 1, nextD);
      cells.push({
        day: nextD, month: date.getMonth(), year: date.getFullYear(), inMonth: false,
        key: `${date.getFullYear()}-${date.getMonth()}-${nextD}`,
      });
    }
    return cells;
  }, [cursorDate]);

  const selectedBookings = useMemo(() => monthBookings.get(selectedDateKey) || [], [monthBookings, selectedDateKey]);
  const selectedDateParts = selectedDateKey.split("-").map(Number);
  const selectedDateObj = new Date(selectedDateParts[0], selectedDateParts[1], selectedDateParts[2]);
  const isSelectedToday =
    selectedDateParts[0] === today.getFullYear() &&
    selectedDateParts[1] === today.getMonth() &&
    selectedDateParts[2] === today.getDate();

  async function fetchNotifications(showLoading = false) {
    if (showLoading) setNotifLoading(true);
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (res.ok) {
        const data: NotificationsResponse = await res.json();
        setPendingCount(data.pendingCount);
        setRecentBookings(data.recentBookings || []);
        lastPollTimestamp.current = Date.now();
      }
    } catch {}
    if (showLoading) setNotifLoading(false);
  }

  async function fetchBookings() {
    setBookingsLoading(true);
    try {
      const res = await fetch("/api/bookings", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setRealBookings(data.bookings || []);
        if (data.meta) {
          setBookingsMeta(data.meta);
          if (typeof data.meta.pendingCount === "number") {
            setPendingCount(data.meta.pendingCount);
          }
        }
      }
    } catch {}
    setBookingsLoading(false);
  }

  useEffect(() => {
    fetchBookings();
    fetchNotifications();

    const notifTimer = setInterval(() => fetchNotifications(false), 30_000);
    const bookingTimer = setInterval(() => fetchBookings(), 60_000);

    return () => {
      clearInterval(notifTimer);
      clearInterval(bookingTimer);
    };
  }, []);

  function gotoMonth(offset: number) {
    setCursorDate(new Date(cursorDate.getFullYear(), cursorDate.getMonth() + offset, 1));
  }
  function gotoToday() {
    setCursorDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDateKey(`${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`);
  }

  function scrollToCalendar() {
    const el = document.querySelector('[data-calendar-section="true"]');
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleNotifications() {
    const willOpen = !showNotificationsDropdown;
    setShowNotificationsDropdown(willOpen);
    if (willOpen) {
      fetchNotifications(true);
    }
  }

  async function handleLogout() {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    router.replace("/login");
  }

  function isNewBooking(b: { status: BookingStatus; createdAt?: number }) {
    if (b.status !== "pending") return false;
    if (!b.createdAt) return false;
    return Date.now() - b.createdAt < 24 * 60 * 60 * 1000;
  }

  return (
    <div className="min-h-screen text-slate-900 antialiased _dbg-grad-bg bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-32 w-[32rem] h-[32rem] rounded-full bg-gradient-to-br from-blue-400/30 to-indigo-500/30 blur-3xl opacity-60" />
        <div className="absolute -bottom-40 -right-20 w-[36rem] h-[36rem] rounded-full bg-gradient-to-tr from-violet-400/20 via-fuchsia-400/10 to-rose-400/20 blur-3xl opacity-70" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-amber-300/10 blur-3xl" />
      </div>
      <div className="relative z-10 flex min-h-screen w-full">
        <aside className="w-[280px] shrink-0 bg-white/85 backdrop-blur-2xl border-r border-slate-200/70 flex flex-col sticky top-0 h-screen overflow-hidden">
          {/* Logo */}
          <div className="px-6 pt-6 pb-5 border-b border-slate-200/70">
            <div className="flex items-center gap-3.5">
              <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 shadow-lg shadow-blue-700/30 flex items-center justify-center ring-2 ring-white">
                <span className="text-white font-black text-lg tracking-tight">P</span>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 ring-2 ring-white" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-serif text-[15px] font-bold tracking-tight text-slate-900">Diszpécser Központ</span>
                <span className="text-[10px] font-black tracking-[0.22em] text-slate-400 uppercase">Pannon Transfer</span>
              </div>
            </div>
          </div>

          {/* Szűrés / quick search */}
          <div className="px-5 pt-5 pb-3">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition" />
              <input
                type="text"
                placeholder="Keresés (foglalás, ügyfél, jármű)…"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100 transition"
              />
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-1 scroll-smooth [scrollbar-width:thin]">
            <div className="px-3 mb-2">
              <span className="text-[10px] font-black tracking-[0.22em] uppercase text-slate-400">Menü</span>
            </div>
            <ul className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = active === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        if (item.id === "vehicles") {
                          router.push("/vehicles");
                          return;
                        }
                        if (item.id === "drivers") {
                          router.push("/drivers");
                          return;
                        }
                        if (item.id === "bookings") {
                          router.push("/bookings");
                          return;
                        }
                        setActive(item.id);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group relative overflow-hidden ${
                        isActive
                          ? "bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg shadow-slate-900/20 _dbg-grad-nav-active"
                          : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm hover:border-slate-200/70"
                      }`}
                    >
                      {isActive && (
                        <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-r-full bg-gradient-to-b ${item.accent || "from-blue-400 to-indigo-500"}`} />
                      )}
                      <span className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition ${
                        isActive
                          ? "bg-white/15 text-white ring-1 ring-white/20"
                          : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-700 ring-1 ring-slate-200/70 group-hover:ring-slate-200"
                      }`}>
                        {item.icon}
                      </span>
                      <span className="flex-1 text-left flex flex-col items-start leading-tight">
                        <span className={`text-[13.5px] ${isActive ? "text-white" : ""}`}>{item.label}</span>
                        {item.subtitle && (
                          <span className={`text-[10.5px] font-medium mt-0.5 ${isActive ? "text-slate-300" : "text-slate-400"}`}>{item.subtitle}</span>
                        )}
                      </span>
                      {item.locked && (
                        <div className="shrink-0 w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                          </svg>
                        </div>
                      )}
                      {item.badge !== undefined && (
                        <span className={`shrink-0 h-5 min-w-[1.25rem] px-1.5 rounded-full text-[10px] font-black flex items-center justify-center ${
                          isActive
                            ? "bg-white text-slate-900"
                            : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm shadow-blue-500/30"
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User block */}
          <div className="px-4 py-3 border-t border-slate-200/80 bg-gradient-to-br from-slate-50/90 to-white/90 backdrop-blur-xl">
            {user.requireTwoFactor && !user.twoFactorEnabled && (
              <button
                onClick={() => router.push("/two-factor")}
                className="w-full mb-3 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-800 text-[11px] font-bold flex items-center gap-2 hover:shadow-sm transition"
              >
                <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                Kétfaktoros védelem bekapcsolása
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className={`w-10 h-10 rounded-2xl ring-2 ring-white shadow-md flex items-center justify-center font-black text-[13px] bg-gradient-to-br ${roleMeta.avatarClass}`}>
                  {monogramOf(user.name || user.email)}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-lg shadow-sm flex items-center justify-center ${roleMeta.starClass}`}>
                  <Star className="w-2 h-2" fill="currentColor" strokeWidth={0} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-slate-900 truncate leading-tight">
                  {user.name || user.email.split("@")[0]}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-[1px] rounded-md text-[8.5px] font-black tracking-widest uppercase ring-1 ring-inset border ${roleMeta.badgeClass}`}>
                    <Star className="w-[10px] h-[10px]" fill="currentColor" strokeWidth={0} />
                    {roleMeta.label}
                  </span>
                  <span className="text-[10.5px] text-slate-500 font-medium truncate">{user.email}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Kijelentkezés"
                className="shrink-0 w-8 h-8 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all flex items-center justify-center"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </button>
            </div>
          </div>
        </aside>

        {/* ========== MAIN ========== */}
        <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
          {/* Top bar */}
          <header className="shrink-0 z-20 bg-white/70 backdrop-blur-2xl border-b border-slate-200/70 px-8 py-4">
            <div className="flex items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Home className="w-3.5 h-3.5" />
                  <span>Diszpécser Központ</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-slate-700">{navItems.find((n) => n.id === active)?.label}</span>
                </div>
                <h1 className="font-serif text-[26px] font-bold tracking-tight text-slate-900 mt-1 flex items-center gap-3">
                  {greeting}
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-700 ring-1 ring-emerald-500/20 border border-emerald-200/70">
                    {roleMeta.accessLevel} / 10 Jogosultság
                  </span>
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  {pendingCount > 0 ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-xs font-bold text-amber-700">Figyelem: {pendingCount} függő</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-slate-600">Rendszer OK</span>
                    </>
                  )}
                  <span className="w-px h-4 bg-slate-200 mx-1" />
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-mono font-bold text-slate-700 tabular-nums">
                    {today.toLocaleDateString("hu-HU", { year: "numeric", month: "2-digit", day: "2-digit" })}
                  </span>
                </div>
                <div className="relative" ref={notificationsRef}>
                  <button
                    onClick={toggleNotifications}
                    className={`relative w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:shadow-md transition-all flex items-center justify-center ${
                      pendingCount > 0 ? "ring-2 ring-rose-200 ring-offset-1 animate-pulse" : ""
                    }`}
                  >
                    {notifLoading ? (
                      <Loader2 className="w-[18px] h-[18px] animate-spin" />
                    ) : (
                      <Bell className="w-[18px] h-[18px]" />
                    )}
                    {pendingCount > 0 && (
                      <span className="absolute top-1 right-1.5 px-1.5 py-0.5 text-[9px] font-black rounded-full bg-rose-500 text-white ring-2 ring-white min-w-[1.1rem] flex items-center justify-center">
                        {pendingCount > 99 ? "99+" : pendingCount}
                      </span>
                    )}
                  </button>
                  {showNotificationsDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-[420px] shadow-2xl border border-slate-200 rounded-2xl bg-white overflow-hidden z-50">
                      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-slate-900 text-[14px]">Értesítések</span>
                          {pendingCount > 0 && (
                            <span className="h-5 min-w-[1.25rem] px-1.5 rounded-full text-[10px] font-black flex items-center justify-center bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-sm">
                              {pendingCount}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => fetchNotifications(true)}
                            className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1"
                          >
                            <RefreshCw className={`w-3 h-3 ${notifLoading ? "animate-spin" : ""}`} />
                            Frissítés
                          </button>
                          <button
                            onClick={() => setShowNotificationsDropdown(false)}
                            className="w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition flex items-center justify-center"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="max-h-[420px] overflow-y-auto">
                        {pendingCount === 0 && recentBookings.length === 0 ? (
                          <div className="py-14 px-8 flex flex-col items-center justify-center text-center">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center mb-3">
                              <Bell className="w-7 h-7 text-slate-300" strokeWidth={1.5} />
                            </div>
                            <div className="font-bold text-sm text-slate-700 mb-1">Nincs új értesítés</div>
                            <div className="text-xs text-slate-500">Minden foglalás feldolgozva van.</div>
                          </div>
                        ) : (
                          <ul className="divide-y divide-slate-100">
                            {recentBookings.map((rb) => {
                              const s = statusColor(rb.status);
                              const isNew = rb.status === "pending" || rb.status === "modified";
                              const catl = bookingIsCatl(rb);
                              return (
                                <li key={rb._id}>
                                  <button
                                    onClick={() => {
                                      router.push(`/bookings/${rb._id}`);
                                      setShowNotificationsDropdown(false);
                                    }}
                                    className="w-full text-left px-5 py-3 hover:bg-slate-50 transition flex items-start gap-3 group"
                                  >
                                    <div className={`shrink-0 mt-0.5 w-9 h-9 rounded-xl bg-gradient-to-br ${categoryGradient(rb.category, isNew, catl)} shadow-sm flex items-center justify-center text-white`}>
                                      <ListChecks className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                        <span className="font-mono text-[11px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{rb.bookingCode}</span>
                                        <span className="font-bold text-[13px] text-slate-900 truncate">{rb.travelerName}</span>
                                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-black tracking-wider uppercase ${s.chip}`}>
                                          <span className={`w-1 h-1 rounded-full ${s.dot}`} />
                                          {s.label}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-[11.5px] text-slate-600">
                                        <span>{rb.pickupDate}</span>
                                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{rb.pickupTime}</span>
                                      </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0 mt-1.5 transition" />
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                      <div className="border-t border-slate-200 px-5 py-3 bg-slate-50/50">
                        <button
                          onClick={() => {
                            router.push("/bookings");
                            setShowNotificationsDropdown(false);
                          }}
                          className="w-full text-center text-[12px] font-bold text-blue-600 hover:text-blue-700 transition py-1 rounded-lg hover:bg-blue-50"
                        >
                          Összes foglalás megtekintése →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => router.push("/bookings")}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-xs font-black tracking-wider uppercase shadow-lg shadow-blue-600/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/40 transition-all flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  Új foglalás
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 px-8 py-6 pb-10 overflow-x-hidden">
            {active === "clients" ? (
              <ClientsView />
            ) : active === "calendar" ? (
              <div className="h-full flex flex-col">
                <section className="flex-1 flex flex-col rounded-[2.5rem] bg-white shadow-xl shadow-slate-900/[0.04] border border-slate-200/80 min-h-[800px] overflow-hidden">
                  {/* Calendar toolbar */}
                  <div className="px-7 pt-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 w-full bg-gradient-to-br from-slate-50/80 via-white to-blue-50/40 shrink-0">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-black tracking-[0.22em] uppercase text-slate-400 mb-0.5">Teljes képernyős naptár</div>
                        <h2 className="font-serif text-[28px] font-bold tracking-tight text-slate-900 leading-tight">
                          {HUN_MONTHS[cursorDate.getMonth()]} <span className="text-slate-400">{cursorDate.getFullYear()}</span>
                        </h2>
                      </div>
                      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 border border-slate-200 shrink-0">
                        <button
                          onClick={() => gotoMonth(-1)}
                          className="w-9 h-9 rounded-xl hover:bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center transition shadow-sm hover:shadow"
                        >
                          <ChevronLeft className="w-[18px] h-[18px]" />
                        </button>
                        <button
                          onClick={gotoToday}
                          className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-[11px] font-black tracking-widest uppercase shadow-md shadow-blue-600/25 hover:-translate-y-0.5 hover:shadow-lg transition-all"
                        >
                          Ma
                        </button>
                        <button
                          onClick={() => gotoMonth(1)}
                          className="w-9 h-9 rounded-xl hover:bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center transition shadow-sm hover:shadow"
                        >
                          <ChevronRight className="w-[18px] h-[18px]" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {(
                        [
                          { c: "from-sky-500 to-indigo-600", t: "Repülőtéri" },
                          { c: "from-violet-500 to-fuchsia-600", t: "Városi" },
                          { c: "from-orange-500 to-rose-600", t: "Távolsági" },
                          { c: "from-amber-400 to-amber-600", t: "VIP" },
                          { c: "from-emerald-500 to-teal-600", t: "Partner" },
                          { c: "from-blue-500 to-indigo-600", t: "Új / Módosítva" },
                        ] as { c: string; t: string }[]
                      ).map((l) => (
                        <span key={l.t} className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200">
                          <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${l.c}`} />
                          <span className="text-[10.5px] font-bold text-slate-600">{l.t}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Weekday header */}
                  <div className="grid grid-cols-7 w-full min-w-0 bg-slate-50/60 border-b border-slate-200/80 shrink-0">
                    {(["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"] as const).map((d, i) => {
                      const weekend = i >= 5;
                      return (
                        <div key={d} className={`px-3 py-3 text-[11px] font-black tracking-[0.16em] uppercase text-center ${weekend ? "text-rose-500/80" : "text-slate-500"}`}>
                          {d}
                        </div>
                      );
                    })}
                  </div>

                  {/* Calendar grid (Full height) */}
                  <div className="flex-1 grid grid-cols-7 w-full min-w-0 overflow-y-auto">
                    {calendarCells.map((cell) => {
                      const isToday =
                        cell.inMonth &&
                        cell.day === today.getDate() &&
                        cell.month === today.getMonth() &&
                        cell.year === today.getFullYear();
                      const isSelected = cell.key === selectedDateKey;
                      const bookings = (cell.inMonth ? monthBookings.get(cell.key) : null) || [];
                      const weekend = new Date(cell.year, cell.month, cell.day).getDay() % 6 === 0;
                      return (
                        <div
                          key={cell.key}
                          onClick={() => {
                            if (!cell.inMonth) {
                              setCursorDate(new Date(cell.year, cell.month, 1));
                            }
                            setSelectedDateKey(cell.key);
                            if (bookings.length > 0) {
                              setPopoverKey(popoverKey === cell.key ? null : cell.key);
                            }
                          }}
                          onMouseLeave={() => {
                            setPopoverKey(null);
                          }}
                          className={`group relative min-h-[140px] p-2.5 text-left border-b border-r border-slate-200/70 transition-all cursor-pointer flex flex-col ${
                            cell.inMonth ? "bg-white" : "bg-slate-50/40"
                          } ${isSelected ? "ring-2 ring-blue-500 ring-inset z-10 bg-blue-50/60" : "hover:bg-slate-50"}`}
                        >
                          {/* Corner: date number */}
                          <div className="flex items-center justify-between mb-2 shrink-0">
                            <span
                              className={`inline-flex items-center justify-center min-w-[1.9rem] h-7 px-2 rounded-full text-[12px] font-bold transition ${
                                isToday
                                  ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-100"
                                  : cell.inMonth
                                  ? weekend
                                    ? "text-rose-600/80"
                                    : "text-slate-700 group-hover:bg-slate-100"
                                  : "text-slate-400 group-hover:text-slate-500"
                              }`}
                            >
                              {cell.day}
                            </span>
                            {bookings.length > 0 && (
                              <span
                                className={`select-none px-1.5 h-4 rounded-md text-[9px] font-black flex items-center justify-center transition ${
                                  bookings.some((b) => b.status === "pending" || b.status === "modified")
                                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                                } ${popoverKey === cell.key ? "ring-2 ring-blue-400 scale-105 shadow-md shadow-blue-500/20" : ""}`}
                              >
                                {bookings.length}
                              </span>
                            )}
                          </div>
                          {/* Bookings list */}
                          <div className="flex-1 space-y-1.5 overflow-hidden">
                            {bookings.slice(0, 4).map((b) => {
                              const isNewOrMod = b.status === "pending" || b.status === "modified";
                              const isNewBadge = isNewBooking(b);
                              return (
                                <div
                                  key={b.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/bookings/${b.id}`);
                                  }}
                                  className={`relative pl-2 pr-1.5 py-1 rounded-lg text-[10px] leading-tight font-semibold bg-gradient-to-r ${categoryGradient(b.category, isNewOrMod, b.isCatl)} text-white shadow-sm cursor-pointer hover:brightness-105 transition`}
                                >
                                  {isNewBadge && (
                                    <span className="absolute -top-0.5 -left-0.5 px-1 py-[1px] rounded bg-white text-blue-700 text-[7px] font-black shadow-sm border border-blue-200">
                                      ÚJ
                                    </span>
                                  )}
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-mono font-black tabular-nums tracking-tight opacity-95">{b.time}</span>
                                    <span className={`w-1.5 h-1.5 rounded-full ${b.status === "in-progress" ? "animate-pulse" : ""} bg-white/90`} />
                                  </div>
                                  <div className="truncate font-bold">{b.client}</div>
                                </div>
                              );
                            })}
                            {bookings.length > 4 && (
                              <div className="text-[10px] font-bold text-slate-500 px-1">+{bookings.length - 4} további…</div>
                            )}
                          </div>
                          {/* Status bar */}
                          {bookings.length > 0 && (
                            <div className="absolute bottom-1.5 left-2.5 right-2.5 h-1 rounded-full overflow-hidden flex shrink-0">
                              {bookings.slice(0, 6).map((b) => {
                                const c = statusColor(b.status);
                                return <div key={b.id} className={`flex-1 ${c.bar}`} />;
                              })}
                            </div>
                          )}

                          {/* CLICK POPOVER - FELETTÉRE */}
                          {bookings.length > 0 && (
                            <div
                              onMouseLeave={() => {
                                setPopoverKey(null);
                              }}
                              className={`absolute z-[80] left-1/2 -translate-x-1/2 bottom-full w-[380px] max-w-[90vw] transition-all ease-out duration-200 ${
                                popoverKey === cell.key
                                  ? "opacity-100 translate-y-0 pointer-events-auto"
                                  : "opacity-0 translate-y-2 pointer-events-none"
                              }`}
                            >
                              <div className="relative rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/[0.08] overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-200/80 bg-gradient-to-r from-slate-50/80 via-white to-blue-50/40 flex items-center justify-between">
                                  <div>
                                    <div className="text-[9px] font-black tracking-[0.22em] uppercase text-slate-400 mb-0.5">
                                      {HUN_WEEKDAYS_LONG[new Date(cell.year, cell.month, cell.day).getDay()]}
                                    </div>
                                    <div className="font-serif text-[17px] font-bold tracking-tight text-slate-900">
                                      {new Date(cell.year, cell.month, cell.day).toLocaleDateString("hu-HU", { month: "long", day: "numeric", year: "numeric" })}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200">
                                    <CalendarCheck className="w-3.5 h-3.5 text-blue-600" />
                                    <span className="text-[11px] font-black text-blue-700">{bookings.length} foglalás</span>
                                  </div>
                                </div>

                                <div className="max-h-[380px] overflow-y-auto p-2 space-y-1.5">
                                  {[...bookings]
                                    .sort((a, b) => a.time.localeCompare(b.time))
                                    .map((b) => {
                                      const s = statusColor(b.status);
                                      const isNewOrMod = b.status === "pending" || b.status === "modified";
                                      const isNewBadge = isNewBooking(b);
                                      return (
                                        <div
                                          key={b.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/bookings/${b.id}`);
                                          }}
                                          className="group relative flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3 cursor-pointer hover:shadow-md hover:border-slate-300 hover:-translate-y-[1px] transition-all overflow-hidden"
                                        >
                                          <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${categoryGradient(b.category, isNewOrMod, b.isCatl)}`} />

                                          <div className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${categoryGradient(b.category, isNewOrMod, b.isCatl)} shadow-md flex flex-col items-center justify-center text-white relative`}>
                                            {isNewBadge && (
                                              <span className="absolute -top-1 -right-1 px-1 py-[1px] rounded bg-white text-blue-700 text-[7px] font-black shadow-sm border border-blue-200">
                                                ÚJ
                                              </span>
                                            )}
                                            <span className="font-mono font-black text-[12px] leading-none tracking-tight">{b.time.split(":")[0]}</span>
                                            <span className="font-mono font-bold text-[10px] leading-none opacity-85 mt-0.5">:{b.time.split(":")[1]}</span>
                                          </div>

                                          <div className="flex-1 min-w-0 pl-1">
                                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                              <span className="font-bold text-[13px] text-slate-900 truncate">{b.client}</span>
                                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[8.5px] font-black tracking-wider uppercase ${s.chip}`}>
                                                <span className={`w-1 h-1 rounded-full ${s.dot} ${b.status === "in-progress" ? "animate-pulse" : ""}`} />
                                                {s.label}
                                              </span>
                                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md bg-gradient-to-r ${categoryGradient(b.category, isNewOrMod, b.isCatl)} text-white text-[8.5px] font-black tracking-wider uppercase shadow-sm`}>
                                                {b.isCatl ? "CATL" : categoryLabel(b.category)}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                              <span className="truncate">{b.route}</span>
                                            </div>
                                          </div>

                                          <div className="shrink-0 flex flex-col items-end gap-1">
                                            {b.price !== undefined && b.price > 0 && (
                                              <div className="font-black text-slate-900 text-[13px] tracking-tight tabular-nums whitespace-nowrap">
                                                {b.price.toLocaleString("hu-HU")}
                                                <span className="text-[10px] text-slate-400 font-bold ml-0.5">Ft</span>
                                              </div>
                                            )}
                                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                                          </div>
                                        </div>
                                      );
                                    })}
                                </div>

                                <div className="px-4 py-2.5 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
                                  <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-slate-400">Kattints a részletekért</span>
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedDateKey(cell.key);
                                      if (!cell.inMonth) setCursorDate(new Date(cell.year, cell.month, 1));
                                      setPopoverKey(null);
                                      setActive("dashboard");
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSelectedDateKey(cell.key);
                                        if (!cell.inMonth) setCursorDate(new Date(cell.year, cell.month, 1));
                                        setPopoverKey(null);
                                        setActive("dashboard");
                                      }
                                    }}
                                    className="cursor-pointer text-[10.5px] font-black tracking-widest uppercase text-blue-700 hover:text-blue-800 flex items-center gap-1 transition focus:outline-none focus:ring-2 focus:ring-blue-200 rounded-md px-1.5 py-0.5"
                                  >
                                    Nap megnyitása
                                    <ChevronRight className="w-3 h-3" />
                                  </span>
                                </div>
                              </div>
                              {/* Nyíl: a popover alján, a cella közepére mutat (lefelé, mivel a popup FELETTÉRE van) */}
                              <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 rotate-45 bg-white border-r border-b border-slate-200" />
                            </div>
                          )}
                          {/* END POPOVER */}
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-6">
                {/* === LEFT: STAT CARDS === */}
                <div className="lg:w-[26%] xl:w-[22%] shrink-0 flex flex-col gap-5">
                <StatCardRaw
                  title="MAI FOGLALÁSOK"
                  subtitle="Napi menetrend"
                  value={stats.today}
                  suffix="db"
                  iconBoxClass="bg-gradient-to-br from-blue-500 to-indigo-600"
                  barClass="bg-gradient-to-r from-blue-500 to-indigo-600"
                  icon={<CalendarCheck className="w-5 h-5" />}
                  trend={stats.today > 0 ? `${stats.today} foglalás ma` : "Nincs foglalás"}
                />
                <StatCardRaw
                  title="MEGERŐSÍTVE"
                  subtitle="Aktív foglalások"
                  value={stats.confirmed}
                  suffix="db"
                  iconBoxClass="bg-gradient-to-br from-emerald-500 to-teal-600"
                  barClass="bg-gradient-to-r from-emerald-500 to-teal-600"
                  icon={<ShieldCheck className="w-5 h-5" />}
                  trend={stats.confirmed > 0 ? `${stats.confirmed} megerősítve` : "Nincs adat"}
                />
                <div onClick={scrollToCalendar} className="cursor-pointer">
                  <StatCardRaw
                    title="FÜGGŐ BEN LESZ"
                    subtitle="Jóváhagyásra vár"
                    value={stats.pending}
                    suffix="db"
                    iconBoxClass="bg-gradient-to-br from-amber-400 to-orange-600"
                    barClass="bg-gradient-to-r from-amber-400 to-orange-600"
                    icon={<Clock className="w-5 h-5" />}
                    trend={stats.pending > 0 ? "Görgessen a naptárhoz" : "Nincs adat"}
                  />
                </div>
                <StatCardRaw
                  title="ELÉRHETŐ JÁRMŰ"
                  subtitle="Aktív flotta"
                  value={0}
                  suffix="db"
                  iconBoxClass="bg-gradient-to-br from-violet-500 to-fuchsia-600"
                  barClass="bg-gradient-to-r from-violet-500 to-fuchsia-600"
                  icon={<CarFront className="w-5 h-5" />}
                  trend="Nincs adat"
                />
              </div>

              {/* === RIGHT: CALENDAR + SIDE PANEL === */}
              <div className="flex-1 min-w-0 space-y-6" data-calendar-section="true">
                {/* Calendar card */}
                <section className="rounded-[28px] bg-white shadow-xl shadow-slate-900/[0.04] border border-slate-200/80 overflow-hidden w-full">
                  {/* Calendar toolbar */}
                  <div className="px-7 pt-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 w-full bg-gradient-to-br from-slate-50/80 via-white to-blue-50/40 _dbg-grad-calendar-head">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-black tracking-[0.22em] uppercase text-slate-400 mb-0.5">Menetrend naptár</div>
                        <h2 className="font-serif text-[28px] font-bold tracking-tight text-slate-900 leading-tight">
                          {HUN_MONTHS[cursorDate.getMonth()]} <span className="text-slate-400">{cursorDate.getFullYear()}</span>
                        </h2>
                      </div>
                      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 border border-slate-200 shrink-0">
                        <button
                          onClick={() => gotoMonth(-1)}
                          className="w-9 h-9 rounded-xl hover:bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center transition shadow-sm hover:shadow"
                        >
                          <ChevronLeft className="w-[18px] h-[18px]" />
                        </button>
                        <button
                          onClick={gotoToday}
                          className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-[11px] font-black tracking-widest uppercase shadow-md shadow-blue-600/25 hover:-translate-y-0.5 hover:shadow-lg transition-all"
                        >
                          Ma
                        </button>
                        <button
                          onClick={() => gotoMonth(1)}
                          className="w-9 h-9 rounded-xl hover:bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center transition shadow-sm hover:shadow"
                        >
                          <ChevronRight className="w-[18px] h-[18px]" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {(
                        [
                          { c: "from-sky-500 to-indigo-600", t: "Repülőtéri" },
                          { c: "from-violet-500 to-fuchsia-600", t: "Városi" },
                          { c: "from-orange-500 to-rose-600", t: "Távolsági" },
                          { c: "from-amber-400 to-amber-600", t: "VIP" },
                          { c: "from-emerald-500 to-teal-600", t: "Partner" },
                          { c: "from-blue-500 to-indigo-600", t: "Új / Módosítva" },
                        ] as { c: string; t: string }[]
                      ).map((l) => (
                        <span key={l.t} className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200">
                          <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${l.c}`} />
                          <span className="text-[10.5px] font-bold text-slate-600">{l.t}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Weekday header */}
                  <div className="grid grid-cols-7 w-full min-w-0 bg-slate-50/60 border-b border-slate-200/80">
                    {(["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"] as const).map((d, i) => {
                      const weekend = i >= 5;
                      return (
                        <div key={d} className={`px-3 py-3 text-[11px] font-black tracking-[0.16em] uppercase text-center ${weekend ? "text-rose-500/80" : "text-slate-500"}`}>
                          {d}
                        </div>
                      );
                    })}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 w-full min-w-0">
                    {calendarCells.map((cell) => {
                      const isToday =
                        cell.inMonth &&
                        cell.day === today.getDate() &&
                        cell.month === today.getMonth() &&
                        cell.year === today.getFullYear();
                      const isSelected = cell.key === selectedDateKey;
                      const bookings = (cell.inMonth ? monthBookings.get(cell.key) : null) || [];
                      const weekend = new Date(cell.year, cell.month, cell.day).getDay() % 6 === 0;
                      return (
                        <div
                          key={cell.key}
                          onClick={() => {
                            if (!cell.inMonth) {
                              setCursorDate(new Date(cell.year, cell.month, 1));
                            }
                            setSelectedDateKey(cell.key);
                            if (bookings.length > 0) {
                              setPopoverKey(popoverKey === cell.key ? null : cell.key);
                            }
                          }}
                          onMouseLeave={() => {
                            setPopoverKey(null);
                          }}
                          className={`group relative min-h-[120px] p-2.5 text-left border-b border-r border-slate-200/70 transition-all cursor-pointer ${
                            cell.inMonth ? "bg-white" : "bg-slate-50/40"
                          } ${isSelected ? "ring-2 ring-blue-500 ring-inset z-10 bg-blue-50/60" : "hover:bg-slate-50"}`}
                        >
                          {/* Corner: date number */}
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`inline-flex items-center justify-center min-w-[1.9rem] h-7 px-2 rounded-full text-[12px] font-bold transition ${
                                isToday
                                  ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-100"
                                  : cell.inMonth
                                  ? weekend
                                    ? "text-rose-600/80"
                                    : "text-slate-700 group-hover:bg-slate-100"
                                  : "text-slate-400 group-hover:text-slate-500"
                              }`}
                            >
                              {cell.day}
                            </span>
                            {bookings.length > 0 && (
                              <span
                                className={`select-none px-1.5 h-4 rounded-md text-[9px] font-black flex items-center justify-center transition ${
                                  bookings.some((b) => b.status === "pending" || b.status === "modified")
                                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                                } ${popoverKey === cell.key ? "ring-2 ring-blue-400 scale-105 shadow-md shadow-blue-500/20" : ""}`}
                              >
                                {bookings.length}
                              </span>
                            )}
                          </div>
                          {/* Bookings list */}
                          <div className="space-y-1.5 overflow-hidden">
                            {bookings.slice(0, 3).map((b) => {
                              const c = statusColor(b.status);
                              const isNewOrMod = b.status === "pending" || b.status === "modified";
                              const isNewBadge = isNewBooking(b);
                              return (
                                <div
                                  key={b.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/bookings/${b.id}`);
                                  }}
                                  className={`relative pl-2 pr-1.5 py-1 rounded-lg text-[10px] leading-tight font-semibold bg-gradient-to-r ${categoryGradient(b.category, isNewOrMod, b.isCatl)} text-white shadow-sm cursor-pointer hover:brightness-105 transition`}
                                >
                                  {isNewBadge && (
                                    <span className="absolute -top-0.5 -left-0.5 px-1 py-[1px] rounded bg-white text-blue-700 text-[7px] font-black shadow-sm border border-blue-200">
                                      ÚJ
                                    </span>
                                  )}
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-mono font-black tabular-nums tracking-tight opacity-95">{b.time}</span>
                                    <span className={`w-1.5 h-1.5 rounded-full ${b.status === "in-progress" ? "animate-pulse" : ""} bg-white/90`} />
                                  </div>
                                  <div className="truncate font-bold">{b.client}</div>
                                </div>
                              );
                            })}
                            {bookings.length > 3 && (
                              <div className="text-[10px] font-bold text-slate-500 px-1">+{bookings.length - 3} további…</div>
                            )}
                          </div>
                          {/* Status bar */}
                          {bookings.length > 0 && (
                            <div className="absolute bottom-1.5 left-2.5 right-2.5 h-1 rounded-full overflow-hidden flex">
                              {bookings.slice(0, 6).map((b) => {
                                const c = statusColor(b.status);
                                return <div key={b.id} className={`flex-1 ${c.bar}`} />;
                              })}
                            </div>
                          )}

                          {/* CLICK POPOVER - FELETTÉRE */}
                          {bookings.length > 0 && (
                            <div
                              onMouseLeave={() => {
                                setPopoverKey(null);
                              }}
                              className={`absolute z-[80] left-1/2 -translate-x-1/2 bottom-full w-[380px] max-w-[90vw] transition-all ease-out duration-200 ${
                                popoverKey === cell.key
                                  ? "opacity-100 translate-y-0 pointer-events-auto"
                                  : "opacity-0 translate-y-2 pointer-events-none"
                              }`}
                            >
                              <div className="relative rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/[0.08] overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-200/80 bg-gradient-to-r from-slate-50/80 via-white to-blue-50/40 flex items-center justify-between">
                                  <div>
                                    <div className="text-[9px] font-black tracking-[0.22em] uppercase text-slate-400 mb-0.5">
                                      {HUN_WEEKDAYS_LONG[new Date(cell.year, cell.month, cell.day).getDay()]}
                                    </div>
                                    <div className="font-serif text-[17px] font-bold tracking-tight text-slate-900">
                                      {new Date(cell.year, cell.month, cell.day).toLocaleDateString("hu-HU", { month: "long", day: "numeric", year: "numeric" })}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200">
                                    <CalendarCheck className="w-3.5 h-3.5 text-blue-600" />
                                    <span className="text-[11px] font-black text-blue-700">{bookings.length} foglalás</span>
                                  </div>
                                </div>

                                <div className="max-h-[380px] overflow-y-auto p-2 space-y-1.5">
                                  {[...bookings]
                                    .sort((a, b) => a.time.localeCompare(b.time))
                                    .map((b) => {
                                      const s = statusColor(b.status);
                                      const isNewOrMod = b.status === "pending" || b.status === "modified";
                                      const isNewBadge = isNewBooking(b);
                                      return (
                                        <div
                                          key={b.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/bookings/${b.id}`);
                                          }}
                                          className="group relative flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3 cursor-pointer hover:shadow-md hover:border-slate-300 hover:-translate-y-[1px] transition-all overflow-hidden"
                                        >
                                          <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${categoryGradient(b.category, isNewOrMod, b.isCatl)}`} />

                                          <div className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${categoryGradient(b.category, isNewOrMod, b.isCatl)} shadow-md flex flex-col items-center justify-center text-white relative`}>
                                            {isNewBadge && (
                                              <span className="absolute -top-1 -right-1 px-1 py-[1px] rounded bg-white text-blue-700 text-[7px] font-black shadow-sm border border-blue-200">
                                                ÚJ
                                              </span>
                                            )}
                                            <span className="font-mono font-black text-[12px] leading-none tracking-tight">{b.time.split(":")[0]}</span>
                                            <span className="font-mono font-bold text-[10px] leading-none opacity-85 mt-0.5">:{b.time.split(":")[1]}</span>
                                          </div>

                                          <div className="flex-1 min-w-0 pl-1">
                                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                              <span className="font-bold text-[13px] text-slate-900 truncate">{b.client}</span>
                                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[8.5px] font-black tracking-wider uppercase ${s.chip}`}>
                                                <span className={`w-1 h-1 rounded-full ${s.dot} ${b.status === "in-progress" ? "animate-pulse" : ""}`} />
                                                {s.label}
                                              </span>
                                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md bg-gradient-to-r ${categoryGradient(b.category, isNewOrMod, b.isCatl)} text-white text-[8.5px] font-black tracking-wider uppercase shadow-sm`}>
                                                {b.isCatl ? "CATL" : categoryLabel(b.category)}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                              <span className="truncate">{b.route}</span>
                                            </div>
                                          </div>

                                          <div className="shrink-0 flex flex-col items-end gap-1">
                                            {b.price !== undefined && b.price > 0 && (
                                              <div className="font-black text-slate-900 text-[13px] tracking-tight tabular-nums whitespace-nowrap">
                                                {b.price.toLocaleString("hu-HU")}
                                                <span className="text-[10px] text-slate-400 font-bold ml-0.5">Ft</span>
                                              </div>
                                            )}
                                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                                          </div>
                                        </div>
                                      );
                                    })}
                                </div>

                                <div className="px-4 py-2.5 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
                                  <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-slate-400">Kattints a részletekért</span>
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedDateKey(cell.key);
                                      if (!cell.inMonth) setCursorDate(new Date(cell.year, cell.month, 1));
                                      setPopoverKey(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSelectedDateKey(cell.key);
                                        if (!cell.inMonth) setCursorDate(new Date(cell.year, cell.month, 1));
                                        setPopoverKey(null);
                                      }
                                    }}
                                    className="cursor-pointer text-[10.5px] font-black tracking-widest uppercase text-blue-700 hover:text-blue-800 flex items-center gap-1 transition focus:outline-none focus:ring-2 focus:ring-blue-200 rounded-md px-1.5 py-0.5"
                                  >
                                    Nap megnyitása
                                    <ChevronRight className="w-3 h-3" />
                                  </span>
                                </div>
                              </div>
                              {/* Nyíl: a popover alján, a cella közepére mutat (lefelé, mivel a popup FELETTÉRE van) */}
                              <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 rotate-45 bg-white border-r border-b border-slate-200" />
                            </div>
                          )}
                          {/* END POPOVER */}
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Selected day panel */}
                <section className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                  <div className="xl:col-span-3 rounded-3xl bg-white shadow-xl shadow-slate-900/[0.04] border border-slate-200/80 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-200/80 bg-gradient-to-r from-white via-slate-50/70 to-blue-50/40 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-black tracking-[0.22em] uppercase text-slate-400 mb-0.5">Kiválasztott nap</div>
                        <h3 className="font-serif text-[22px] font-bold tracking-tight text-slate-900 flex items-center gap-3">
                          {isSelectedToday && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-[10px] font-black tracking-widest uppercase shadow shadow-blue-600/30">
                              Ma
                            </span>
                          )}
                          {selectedDateObj.toLocaleDateString("hu-HU", { month: "long", day: "numeric", year: "numeric" })} ·{" "}
                          <span className="text-slate-500">{HUN_WEEKDAYS_LONG[selectedDateObj.getDay()]}</span>
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-1.5">
                          <CalendarCheck className="w-3.5 h-3.5 text-blue-600" />
                          {selectedBookings.length} foglalás
                        </div>
                        <button
                          onClick={() => router.push("/bookings")}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white text-[11px] font-black tracking-widest uppercase shadow-lg shadow-slate-900/25 hover:-translate-y-0.5 transition flex items-center gap-1.5"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          Erre a napra
                        </button>
                      </div>
                    </div>
                    <div className="p-2 max-h-[460px] overflow-y-auto">
                      {selectedBookings.length === 0 ? (
                        <div className="py-16 px-8 flex flex-col items-center justify-center text-center">
                          <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center mb-4 shadow-inner">
                            <CalendarIcon className="w-10 h-10 text-slate-300" strokeWidth={1.4} />
                          </div>
                          <div className="font-serif text-xl font-bold text-slate-700 mb-1">Nincs foglalás ezen a napon</div>
                          <div className="text-sm text-slate-500 mb-4 max-w-sm">Kattints az "Erre a napra" gombra új foglalás létrehozásához, vagy válaszd ki egy másik napot a naptárból.</div>
                        </div>
                      ) : (
                        <ul className="p-4 space-y-3">
                          {selectedBookings.map((b) => {
                            const s = statusColor(b.status);
                            const isNewOrMod = b.status === "pending" || b.status === "modified";
                            const isNewBadge = isNewBooking(b);
                            return (
                              <li
                                key={b.id}
                                className="group relative rounded-2xl border border-slate-200 bg-white hover:shadow-lg hover:border-slate-300 transition-all p-4 overflow-hidden"
                              >
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${categoryGradient(b.category, isNewOrMod, b.isCatl)}`} />
                                <div className="flex items-start gap-4 pl-2">
                                  <div className={`shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${categoryGradient(b.category, isNewOrMod, b.isCatl)} shadow-lg flex flex-col items-center justify-center text-white relative`}>
                                    {isNewBadge && (
                                      <span className="absolute -top-1 -right-1 px-1 py-[1px] rounded bg-white text-blue-700 text-[8px] font-black shadow-sm border border-blue-200">
                                        ÚJ
                                      </span>
                                    )}
                                    <span className="font-mono font-black text-[13px] leading-none tracking-tight">{b.time.split(":")[0]}</span>
                                    <span className="font-mono font-bold text-[11px] leading-none opacity-80 mt-0.5">:{b.time.split(":")[1]}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                      <span className="font-bold text-slate-900 truncate">{b.client}</span>
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9.5px] font-black tracking-wider uppercase ${s.chip}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${b.status === "in-progress" ? "animate-pulse" : ""}`} />
                                        {s.label}
                                      </span>
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md bg-gradient-to-r ${categoryGradient(b.category, isNewOrMod, b.isCatl)} text-white text-[9.5px] font-black tracking-wider uppercase shadow-sm`}>
                                        {b.isCatl ? "CATL" : categoryLabel(b.category)}
                                      </span>
                                      {isNewBadge && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 border border-blue-200 text-[9.5px] font-black tracking-wider uppercase">
                                          🔵 ÚJ
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-600 font-medium">
                                      <span className="inline-flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                        <span className="truncate max-w-[24rem]">{b.route}</span>
                                      </span>
                                      <span className="inline-flex items-center gap-1.5">
                                        <CarFront className="w-3.5 h-3.5 text-slate-400" />
                                        {b.vehicle}
                                      </span>
                                      <span className="inline-flex items-center gap-1.5">
                                        <Users2 className="w-3.5 h-3.5 text-slate-400" />
                                        {b.pax} fő
                                      </span>
                                    </div>
                                  </div>
                                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                                    {b.price !== undefined && (
                                      <div className="font-black text-slate-900 text-lg tracking-tight tabular-nums">
                                        {b.price.toLocaleString("hu-HU")}
                                        <span className="text-xs text-slate-400 font-bold ml-1">Ft</span>
                                      </div>
                                    )}
                                    <div className="flex gap-1.5">
                                      <button
                                        onClick={() => router.push(`/bookings/${b.id}`)}
                                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-[10.5px] font-bold text-slate-600 hover:bg-slate-50 transition"
                                      >
                                        Részletek
                                      </button>
                                      <button
                                        onClick={() => router.push(`/bookings/${b.id}`)}
                                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white text-[10.5px] font-black tracking-wider uppercase shadow hover:-translate-y-0.5 transition"
                                      >
                                        Szerkesztés
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
                  </div>
                </section>
              </div>
            </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function StatDots({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex-1 rounded-xl bg-white/10 ring-1 ring-white/15 px-2.5 py-2">
      <div className="text-[9px] font-black tracking-widest uppercase text-blue-100/80">{label}</div>
      <div className="flex items-end gap-1 mt-0.5">
        <span className={`text-lg font-black tracking-tight bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
          {value}
        </span>
        <span className="text-[9px] font-bold text-blue-200/60 mb-0.5">db</span>
      </div>
    </div>
  );
}

function StatCardRaw({
  title,
  subtitle,
  value,
  suffix,
  iconBoxClass,
  barClass,
  icon,
  trend,
}: {
  title: string;
  subtitle: string;
  value: number;
  suffix?: string;
  iconBoxClass: string;
  barClass: string;
  icon: React.ReactNode;
  trend?: string;
}) {
  return (
    <div className="rounded-3xl bg-white shadow-lg shadow-slate-900/[0.03] border border-slate-200/80 p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl ${iconBoxClass} text-white shadow-lg flex items-center justify-center ring-2 ring-white`}>
          {icon}
        </div>
        {trend && (
          <span className="text-[10.5px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded-full">{trend}</span>
        )}
      </div>
      <div className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">{title}</div>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className="text-3xl font-black tracking-tight text-slate-900 tabular-nums">{value}</span>
        {suffix && <span className="text-sm font-bold text-slate-400">{suffix}</span>}
      </div>
      <div className="text-[12px] font-semibold text-slate-500 mt-0.5">{subtitle}</div>
      <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${Math.min(100, Math.max(10, value * 12))}%` }} />
      </div>
    </div>
  );
}

function QuickAction({
  label,
  subtitle,
  color,
  icon,
}: {
  label: string;
  subtitle: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <button className="group text-left relative rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg transition-all p-4 overflow-hidden">
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${color} opacity-10 blur-2xl group-hover:opacity-25 transition`} />
      <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${color} text-white shadow-md flex items-center justify-center mb-3 group-hover:-translate-y-0.5 group-hover:scale-105 transition`}>
        {icon}
      </div>
      <div className="relative font-bold text-sm text-slate-900">{label}</div>
      <div className="relative text-[11px] font-medium text-slate-500 mt-0.5">{subtitle}</div>
    </button>
  );
}
