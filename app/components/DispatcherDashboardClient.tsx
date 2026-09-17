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
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import { ClientsView } from "./ClientsView";
import PriceApprovalWidget from "./PriceApprovalWidget";
import type { PartnerMeta } from "@/lib/partner-meta";
import { getPartnerColorClasses, resolvePartnerMeta } from "@/lib/partner-meta";

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
  | "notifications"
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
  partnerMeta: PartnerMeta | null;
  price?: number;
  createdAt?: number;
}

interface RealBooking {
  _id: string;
  bookingCode: string;
  travelerName: string;
  travelerEmail: string;
  travelerPhone: string;
  portal?: string;
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
  portal?: string;
  pickupDate: string;
  pickupTime: string;
  status: BookingStatus;
  category: BookingCategory;
  createdAt: number;
}

interface NotificationsResponse {
  pendingCount: number;
  recentBookings: RecentBookingNotif[];
  partnerModifications: PartnerModificationNotif[];
  notifications: NotificationEvent[];
}

interface PartnerModificationChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

interface PartnerModificationNotif {
  id: string;
  bookingId: string;
  bookingCode: string;
  travelerName: string;
  companyName?: string;
  pickupDate: string;
  pickupTime: string;
  fromAddress: string;
  toAddress: string;
  actor: string;
  updatedAt: number;
  message: string;
  changes: PartnerModificationChange[];
}

interface NotificationEvent {
  id: string;
  type: "new_booking" | "booking_modified" | "driver_acknowledged" | "booking_event";
  title: string;
  message: string;
  bookingId: string;
  bookingCode: string;
  travelerName: string;
  companyName?: string;
  pickupDate: string;
  pickupTime: string;
  actor?: string;
  timestamp: number;
  action: string;
  changes?: PartnerModificationChange[];
}

interface NotificationToast {
  id: string;
  type: 'new_booking' | 'booking_modified' | 'status_change' | 'info';
  title: string;
  message: string;
  bookingId?: string;
  notificationId?: string;
  timestamp: number;
}

type AudioWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as AudioWindow).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.value = 1320;
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.65);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.65);
  } catch {}
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

function categoryGradient(
  cat: BookingCategory,
  isNewOrModified: boolean = false,
  partnerMeta?: PartnerMeta | null
) {
  if (partnerMeta) return partnerMeta.gradient;
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

function categoryLabel(cat: BookingCategory, partnerMeta?: PartnerMeta | null) {
  if (partnerMeta) return partnerMeta.short;
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

function formatModificationChange(change: PartnerModificationChange): string {
  const labels: Record<string, string> = {
    pickupDate: "dátum",
    pickupTime: "felvételi idő",
    fromAddress: "indulási cím",
    toAddress: "érkezési cím",
    travelers: "utasok száma",
    luggage: "csomagok száma",
    travelerPhone: "utas telefonszáma",
    secondTravelerEmail: "második utas e-mailje",
    secondTravelerPhone: "második utas telefonszáma",
    comment: "megjegyzés",
  };
  const value = (input: unknown) => input === null || input === undefined || input === "" ? "—" : String(input);
  return `${labels[change.field] || change.field}: ${value(change.oldValue)} → ${value(change.newValue)}`;
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
  const [renderNow, setRenderNow] = useState(() => Date.now());

  const today = useMemo(() => new Date(), []);
  const [cursorDate, setCursorDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const [selectedDateKey, setSelectedDateKey] = useState<string>(
    `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`
  );

  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [recentBookings, setRecentBookings] = useState<RecentBookingNotif[]>([]);
  const [partnerModifications, setPartnerModifications] = useState<PartnerModificationNotif[]>([]);
  const [notificationEvents, setNotificationEvents] = useState<NotificationEvent[]>([]);
  const [unreadBookingCount, setUnreadBookingCount] = useState(0);
  const [unreadModificationCount, setUnreadModificationCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const lastPollTimestamp = useRef<number>(0);

  const [notificationToasts, setNotificationToasts] = useState<NotificationToast[]>([]);
  const [newBookingBanner, setNewBookingBanner] = useState<{bookings: RecentBookingNotif[], show: boolean} | null>(null);
  const lastSeenBookingIds = useRef<Set<string>>(new Set());
  const lastSeenModificationIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);
  const [viewedBookingIds, setViewedBookingIds] = useState<Set<string>>(new Set());
  const readNotificationIds = useRef<Set<string>>(new Set());

  const [realBookings, setRealBookings] = useState<RealBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsMeta, setBookingsMeta] = useState({ pendingCount: 0, totalCount: 0 });

  // Teljes törlés modal state
  const [deleteAllModal, setDeleteAllModal] = useState<"closed" | "confirm1" | "confirm2" | "deleting" | "done">("closed");
  const [deleteAllConfirmText, setDeleteAllConfirmText] = useState("");
  const [deleteAllResult, setDeleteAllResult] = useState<{ deletedCount: number } | null>(null);
  const [deleteAllError, setDeleteAllError] = useState<string | null>(null);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const [popoverKey, setPopoverKey] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setHour(new Date().getHours()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("dispatcher-read-notification-ids");
      if (stored) readNotificationIds.current = new Set(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    const t = setInterval(() => setRenderNow(Date.now()), 1_000);
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

  // Auto-dismiss toasts after 6 seconds
  useEffect(() => {
    if (notificationToasts.length === 0) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setNotificationToasts(prev => prev.filter(t => now - t.timestamp < 6000));
    }, 1000);
    return () => clearInterval(timer);
  }, [notificationToasts.length]);

  // Auto-dismiss new booking banner after 15 seconds
  useEffect(() => {
    if (!newBookingBanner?.show) return;
    const timer = setTimeout(() => {
      setNewBookingBanner(prev => prev ? { ...prev, show: false } : null);
    }, 15000);
    return () => clearTimeout(timer);
  }, [newBookingBanner?.show]);

  function dismissToast(toastId: string) {
    setNotificationToasts(prev => prev.filter(t => t.id !== toastId));
  }

  function dismissBanner() {
    setNewBookingBanner(prev => prev ? { ...prev, show: false } : null);
  }

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
        id: "notifications",
        label: "Értesítések",
        subtitle: "Minden rendszeresemény",
        icon: <Bell className="w-5 h-5" />,
        badge: unreadBookingCount + unreadModificationCount > 0
          ? unreadBookingCount + unreadModificationCount
          : undefined,
        accent: "from-amber-400 to-orange-500",
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
    [pendingCount, unreadBookingCount, unreadModificationCount]
  );

  const transformedBookings: DemoBooking[] = useMemo(() => {
    return realBookings.map((b) => {
      const parts = b.pickupDate.split("-");
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const partnerMeta = resolvePartnerMeta(b);
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
        partnerMeta,
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

  async function fetchNotifications(showLoading = false, history = false) {
    if (showLoading) setNotifLoading(true);
    try {
      const since = lastPollTimestamp.current || Date.now() - 60_000;
      const res = await fetch(`/api/notifications?since=${since}${history ? "&history=1" : ""}`, { credentials: "include" });
      if (res.ok) {
        const data: NotificationsResponse = await res.json();
        const firstLoad = isFirstLoad.current;
        setPendingCount(data.pendingCount);
        setRecentBookings(data.recentBookings || []);
        const modifications = data.partnerModifications || [];
        const events = data.notifications || [];
        if (events.length > 0) {
          setNotificationEvents((current) => {
            const merged = [...events, ...current];
            return Array.from(new Map(merged.map((item) => [item.id, item])).values())
              .sort((a, b) => b.timestamp - a.timestamp)
              .slice(0, 200);
          });
        }
        setPartnerModifications((current) => {
          const merged = [...modifications, ...current];
          return Array.from(new Map(merged.map((item) => [item.id, item])).values())
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(0, 20);
        });
        // Keep a short overlap between polls so an update written during a request
        // cannot disappear between two polling windows; event IDs deduplicate it.
        lastPollTimestamp.current = Date.now() - 5_000;

        const newBookingEvents = events.filter((event) => event.type === "new_booking");
        const currentIds = new Set(newBookingEvents.map((event) => event.bookingId));

        if (firstLoad || history) {
          lastSeenBookingIds.current = currentIds;
        } else {
          const newBookings = newBookingEvents
            .filter((event) => !lastSeenBookingIds.current.has(event.bookingId))
            .map((event) => ({
              _id: event.bookingId,
              bookingCode: event.bookingCode,
              travelerName: event.travelerName,
              companyName: event.companyName,
              pickupDate: event.pickupDate,
              pickupTime: event.pickupTime,
              status: "pending" as BookingStatus,
              category: "partner" as BookingCategory,
              createdAt: event.timestamp,
            }));
          if (newBookings.length > 0) {
            playNotificationSound();

            const newToasts: NotificationToast[] = newBookings.map(b => ({
              id: `toast-${b._id}-${Date.now()}`,
              type: 'new_booking' as const,
              title: 'Új foglalás érkezett!',
              message: `${b.travelerName}${b.companyName ? ` (${b.companyName})` : ''} — ${b.pickupDate} ${b.pickupTime}`,
              bookingId: b._id,
              timestamp: Date.now(),
            }));
            setNotificationToasts(prev => [...newToasts, ...prev].slice(0, 10));
            setUnreadBookingCount((count) => count + newBookings.filter((booking) => {
              return !Array.from(readNotificationIds.current).some((id) => id.startsWith(`${booking._id}-`));
            }).length);

            setNewBookingBanner({ bookings: newBookings, show: true });
          }
          lastSeenBookingIds.current = currentIds;
        }

        const newModifications = modifications.filter(
          (item) => !lastSeenModificationIds.current.has(item.id)
        );
        if (firstLoad || history) {
          lastSeenModificationIds.current = new Set(modifications.map((item) => item.id));
        } else if (newModifications.length > 0) {
          playNotificationSound();
          setUnreadModificationCount((count) => count + newModifications.filter(
            (item) => !readNotificationIds.current.has(item.id)
          ).length);
          const newToasts: NotificationToast[] = newModifications.map((item) => ({
            id: `toast-${item.id}`,
            type: "booking_modified",
            title: "Foglalás módosult",
            message: `#${item.bookingCode} · ${item.travelerName} — ${item.changes
              .map((change) => formatModificationChange(change))
              .join(", ") || item.message}`,
            bookingId: item.bookingId,
            timestamp: Date.now(),
          }));
          setNotificationToasts((current) => [...newToasts, ...current].slice(0, 10));
          lastSeenModificationIds.current = new Set([
            ...lastSeenModificationIds.current,
            ...modifications.map((item) => item.id),
          ]);
        }
        isFirstLoad.current = false;
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
    const timer = window.setTimeout(() => {
      void fetchBookings();
      void fetchNotifications();
    }, 0);

    const notifTimer = setInterval(() => fetchNotifications(false), 30_000);
    const bookingTimer = setInterval(() => fetchBookings(), 60_000);

    return () => {
      clearTimeout(timer);
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
      fetchNotifications(true, true);
    }
  }

  function markNotificationRead(notificationId: string, type?: NotificationEvent["type"]) {
    if (!notificationId || readNotificationIds.current.has(notificationId)) return;
    readNotificationIds.current.add(notificationId);
    try {
      window.localStorage.setItem(
        "dispatcher-read-notification-ids",
        JSON.stringify(Array.from(readNotificationIds.current).slice(-500))
      );
    } catch {}
    if (type === "new_booking") {
      setUnreadBookingCount((count) => Math.max(0, count - 1));
    } else if (type === "booking_modified") {
      setUnreadModificationCount((count) => Math.max(0, count - 1));
    }
  }

  function markBookingNotificationsRead(bookingId: string) {
    const matching = notificationEvents.filter((event) => event.bookingId === bookingId);
    matching.forEach((event) => markNotificationRead(event.id, event.type));
  }

  function openNotificationsPage() {
    setActive("notifications");
    void fetchNotifications(true, true);
  }

  async function handleLogout() {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    router.replace("/login");
  }

  async function handleDeleteAllBookings() {
    setDeleteAllModal("deleting");
    setDeleteAllError(null);
    try {
      const res = await fetch("/api/bookings/delete-all", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ confirm: "TOROL_MINDEN_FOGLALAST" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteAllError(data.error || "Ismeretlen hiba");
        setDeleteAllModal("confirm2");
        return;
      }
      setDeleteAllResult({ deletedCount: data.deletedCount });
      setDeleteAllModal("done");
      // Frissítjük a lokális state-et
      setRealBookings([]);
      setBookingsMeta({ pendingCount: 0, totalCount: 0 });
      setPendingCount(0);
      setRecentBookings([]);
      setNotificationToasts([]);
      setNewBookingBanner(null);
      setShowNotificationsDropdown(false);
      lastSeenBookingIds.current = new Set();
    } catch (err) {
      setDeleteAllError("Hálózati hiba a törlés közben.");
      setDeleteAllModal("confirm2");
    }
  }

  function closeDeleteAllModal() {
    setDeleteAllModal("closed");
    setDeleteAllConfirmText("");
    setDeleteAllResult(null);
    setDeleteAllError(null);
  }

  function markAsViewed(bookingId: string) {
    setViewedBookingIds(prev => new Set([...prev, bookingId]));
  }

  function isNewBooking(b: { id?: string; _id?: string; status: BookingStatus; createdAt?: number }) {
    const id = b.id || b._id;
    if (id && viewedBookingIds.has(id)) return false;
    if (b.status !== "pending") return false;
    if (!b.createdAt) return false;
    return renderNow - b.createdAt < 24 * 60 * 60 * 1000;
  }

  const unreadNotificationTotal = unreadBookingCount + unreadModificationCount;

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
                        if (item.id === "notifications") {
                          openNotificationsPage();
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
                      unreadNotificationTotal > 0 ? "ring-2 ring-rose-200 ring-offset-1 animate-pulse" : ""
                    }`}
                  >
                    {notifLoading ? (
                      <Loader2 className="w-[18px] h-[18px] animate-spin" />
                    ) : (
                      <Bell className={`w-[18px] h-[18px] ${unreadNotificationTotal > 0 ? "animate-bounce text-rose-600" : ""}`} />
                    )}
                    {unreadNotificationTotal > 0 && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-rose-500 ring-2 ring-white animate-ping" />
                    )}
                    {unreadNotificationTotal > 0 && (
                      <span className="absolute top-1 right-1.5 px-1.5 py-0.5 text-[9px] font-black rounded-full bg-rose-500 text-white ring-2 ring-white min-w-[1.1rem] flex items-center justify-center">
                        {unreadNotificationTotal > 99 ? "99+" : unreadNotificationTotal}
                      </span>
                    )}
                  </button>
                  {showNotificationsDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-[420px] shadow-2xl border border-slate-200 rounded-2xl bg-white overflow-hidden z-50">
                      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-slate-900 text-[14px]">Értesítések</span>
                          {unreadNotificationTotal > 0 && (
                            <span className="h-5 min-w-[1.25rem] px-1.5 rounded-full text-[10px] font-black flex items-center justify-center bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-sm">
                              {unreadNotificationTotal}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => fetchNotifications(true, true)}
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
                        {notificationEvents.length === 0 ? (
                          <div className="py-14 px-8 flex flex-col items-center justify-center text-center">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center mb-3">
                              <Bell className="w-7 h-7 text-slate-300" strokeWidth={1.5} />
                            </div>
                            <div className="font-bold text-sm text-slate-700 mb-1">Nincs új értesítés</div>
                            <div className="text-xs text-slate-500">Minden foglalás feldolgozva van.</div>
                          </div>
                        ) : (
                          <ul className="divide-y divide-slate-100">
                            {notificationEvents.slice(0, 30).map((event) => (
                              <li key={event.id}>
                                <button
                                  onClick={() => {
                                    router.push(`/bookings/${event.bookingId}`);
                                    setShowNotificationsDropdown(false);
                                  }}
                                  className="w-full text-left px-5 py-3.5 hover:bg-slate-50 transition flex items-start gap-3 group"
                                >
                                  <div className={`shrink-0 mt-0.5 w-9 h-9 rounded-xl shadow-sm flex items-center justify-center text-white ${
                                    event.type === "new_booking"
                                      ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                                      : event.type === "booking_modified"
                                        ? "bg-gradient-to-br from-amber-500 to-orange-600"
                                        : event.type === "driver_acknowledged"
                                          ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                                          : "bg-gradient-to-br from-slate-600 to-slate-800"
                                  }`}>
                                    {event.type === "new_booking" ? <PlusCircle className="w-4 h-4" /> : event.type === "booking_modified" ? <RefreshCw className="w-4 h-4" /> : event.type === "driver_acknowledged" ? <CheckCircle2 className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                      <span className="font-mono text-[11px] font-black text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                        {event.bookingCode}
                                      </span>
                                      <span className="font-black text-[13px] text-slate-900 truncate">{event.title}</span>
                                    </div>
                                    <div className="text-[11.5px] text-slate-700 font-semibold">
                                      {event.travelerName} · {event.pickupDate} {event.pickupTime}
                                    </div>
                                    <div className="mt-1 text-[10.5px] text-slate-600 leading-relaxed">
                                      {event.changes?.map(formatModificationChange).join(" · ") || event.message}
                                    </div>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 shrink-0 mt-1.5 transition" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="border-t border-slate-200 px-5 py-3 bg-slate-50/50">
                        <button
                          onClick={() => {
                            openNotificationsPage();
                            setShowNotificationsDropdown(false);
                          }}
                          className="w-full text-center text-[12px] font-bold text-blue-600 hover:text-blue-700 transition py-1 rounded-lg hover:bg-blue-50"
                        >
                          Összes értesítés megtekintése →
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

          {/* New booking banner */}
          {newBookingBanner?.show && (
            <div
              className="shrink-0 relative overflow-hidden"
              style={{
                animation: 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <style>{`
                @keyframes slideDown {
                  from { transform: translateY(-100%); opacity: 0; }
                  to { transform: translateY(0); opacity: 1; }
                }
                @keyframes borderPulse {
                  0%, 100% { border-color: rgba(99, 102, 241, 0.5); }
                  50% { border-color: rgba(99, 102, 241, 1); }
                }
              `}</style>
              <div
                className="mx-4 mt-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl shadow-indigo-600/30 border-2 border-indigo-400"
                style={{ animation: 'borderPulse 2s ease-in-out infinite' }}
              >
                <div className="px-6 py-4 flex items-center gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30">
                    <Bell className="w-6 h-6 text-white animate-bounce" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-black tracking-tight">Új foglalás érkezett!</span>
                      {newBookingBanner.bookings.length > 1 && (
                        <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-black backdrop-blur-sm">
                          +{newBookingBanner.bookings.length} új
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {newBookingBanner.bookings.slice(0, 3).map((b) => (
                        <button
                          key={b._id}
                          onClick={() => {
                            markBookingNotificationsRead(b._id);
                            markAsViewed(b._id);
                            router.push(`/bookings/${b._id}`);
                            dismissBanner();
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm transition-all text-left group"
                        >
                          <span className="font-mono text-[11px] font-black text-white/80">{b.bookingCode}</span>
                          <span className="font-bold text-sm truncate max-w-[160px]">{b.travelerName}</span>
                          {b.companyName && <span className="text-xs text-white/70 truncate max-w-[100px]">({b.companyName})</span>}
                          <span className="text-xs font-mono font-bold text-white/90 bg-white/10 px-1.5 py-0.5 rounded">{b.pickupTime}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-white/50 group-hover:text-white/90 transition" />
                        </button>
                      ))}
                      {newBookingBanner.bookings.length > 3 && (
                        <span className="text-xs font-bold text-white/70">+{newBookingBanner.bookings.length - 3} további...</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={dismissBanner}
                    className="shrink-0 w-8 h-8 rounded-xl bg-white/10 hover:bg-white/25 flex items-center justify-center transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 px-8 py-6 pb-10 overflow-x-hidden">
            {active === "notifications" ? (
              <NotificationsView
                events={notificationEvents}
                loading={notifLoading}
                onRefresh={() => fetchNotifications(true)}
                onOpenBooking={(bookingId) => {
                  markBookingNotificationsRead(bookingId);
                  markAsViewed(bookingId);
                  router.push(`/bookings/${bookingId}`);
                }}
                onRead={markNotificationRead}
              />
            ) : active === "clients" ? (
              <ClientsView bookings={realBookings} />
            ) : active === "settings" ? (
              <SettingsView
                user={user}
                totalBookings={bookingsMeta.totalCount || realBookings.length}
                onDeleteAll={() => setDeleteAllModal("confirm1")}
              />
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
                    {calendarCells.map((cell, idx) => {
                      const colIndex = idx % 7;
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
                                    markAsViewed(b.id);
                                    router.push(`/bookings/${b.id}`);
                                  }}
                                  className={`relative pl-2 pr-1.5 py-1 rounded-lg text-[10px] leading-tight font-semibold bg-gradient-to-r ${categoryGradient(b.category, isNewOrMod, b.partnerMeta)} text-white shadow-sm cursor-pointer hover:brightness-105 transition`}
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
                              className={`absolute z-[80] bottom-full w-[380px] max-w-[90vw] transition-all ease-out duration-200 ${
                                colIndex < 2 ? "left-0" : colIndex > 4 ? "right-0" : "left-1/2 -translate-x-1/2"
                              } ${
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
                                            markAsViewed(b.id);
                                            router.push(`/bookings/${b.id}`);
                                          }}
                                          className="group relative flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3 cursor-pointer hover:shadow-md hover:border-slate-300 hover:-translate-y-[1px] transition-all overflow-hidden"
                                        >
                                          <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${categoryGradient(b.category, isNewOrMod, b.partnerMeta)}`} />

                                          <div className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${categoryGradient(b.category, isNewOrMod, b.partnerMeta)} shadow-md flex flex-col items-center justify-center text-white relative`}>
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
                                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md bg-gradient-to-r ${categoryGradient(b.category, isNewOrMod, b.partnerMeta)} text-white text-[8.5px] font-black tracking-wider uppercase shadow-sm`}>
                                                {categoryLabel(b.category, b.partnerMeta)}
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
                              <div className={`absolute -bottom-1.5 w-3 h-3 rotate-45 bg-white border-r border-b border-slate-200 ${
                                colIndex < 2 ? "left-[15%]" : colIndex > 4 ? "right-[15%]" : "left-1/2 -translate-x-1/2"
                              }`} />
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
                {/* Ár jóváhagyás widget - csak adminoknak */}
                {user.role === "admin" && (
                  <PriceApprovalWidget userRole={user.role} />
                )}
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
                    {calendarCells.map((cell, idx) => {
                      const colIndex = idx % 7;
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
                              const isNewOrMod = b.status === "pending" || b.status === "modified";
                              const isNewBadge = isNewBooking(b);
                              return (
                                <div
                                  key={b.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsViewed(b.id);
                                    router.push(`/bookings/${b.id}`);
                                  }}
                                  className={`relative pl-2 pr-1.5 py-1 rounded-lg text-[10px] leading-tight font-semibold bg-gradient-to-r ${categoryGradient(b.category, isNewOrMod, b.partnerMeta)} text-white shadow-sm cursor-pointer hover:brightness-105 transition`}
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
                              className={`absolute z-[80] bottom-full w-[380px] max-w-[90vw] transition-all ease-out duration-200 ${
                                colIndex < 2 ? "left-0" : colIndex > 4 ? "right-0" : "left-1/2 -translate-x-1/2"
                              } ${
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
                                            markAsViewed(b.id);
                                            router.push(`/bookings/${b.id}`);
                                          }}
                                          className="group relative flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3 cursor-pointer hover:shadow-md hover:border-slate-300 hover:-translate-y-[1px] transition-all overflow-hidden"
                                        >
                                          <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${categoryGradient(b.category, isNewOrMod, b.partnerMeta)}`} />

                                          <div className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${categoryGradient(b.category, isNewOrMod, b.partnerMeta)} shadow-md flex flex-col items-center justify-center text-white relative`}>
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
                                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md bg-gradient-to-r ${categoryGradient(b.category, isNewOrMod, b.partnerMeta)} text-white text-[8.5px] font-black tracking-wider uppercase shadow-sm`}>
                                                {categoryLabel(b.category, b.partnerMeta)}
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
                              <div className={`absolute -bottom-1.5 w-3 h-3 rotate-45 bg-white border-r border-b border-slate-200 ${
                                colIndex < 2 ? "left-[15%]" : colIndex > 4 ? "right-[15%]" : "left-1/2 -translate-x-1/2"
                              }`} />
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
                            <div className="text-sm text-slate-500 mb-4 max-w-sm">Kattints az &quot;Erre a napra&quot; gombra új foglalás létrehozásához, vagy válaszd ki egy másik napot a naptárból.</div>
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
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${categoryGradient(b.category, isNewOrMod, b.partnerMeta)}`} />
                                <div className="flex items-start gap-4 pl-2">
                                  <div className={`shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${categoryGradient(b.category, isNewOrMod, b.partnerMeta)} shadow-lg flex flex-col items-center justify-center text-white relative`}>
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
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md bg-gradient-to-r ${categoryGradient(b.category, isNewOrMod, b.partnerMeta)} text-white text-[9.5px] font-black tracking-wider uppercase shadow-sm`}>
                                        {categoryLabel(b.category, b.partnerMeta)}
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
                                        onClick={() => { markAsViewed(b.id); router.push(`/bookings/${b.id}`); }}
                                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-[10.5px] font-bold text-slate-600 hover:bg-slate-50 transition"
                                      >
                                        Részletek
                                      </button>
                                      <button
                                        onClick={() => { markAsViewed(b.id); router.push(`/bookings/${b.id}`); }}
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

      {deleteAllModal !== "closed" && (
        <div className="fixed inset-0 z-[110]">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => {
              if (deleteAllModal !== "deleting") {
                closeDeleteAllModal();
              }
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-white shadow-2xl shadow-slate-950/30 overflow-hidden">
              <div className="px-7 py-5 border-b border-slate-200 bg-gradient-to-r from-rose-50 via-white to-orange-50">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 shadow-lg shadow-rose-600/30 flex items-center justify-center text-white">
                    {deleteAllModal === "done" ? (
                      <CheckCircle2 className="w-7 h-7" />
                    ) : deleteAllModal === "deleting" ? (
                      <Loader2 className="w-7 h-7 animate-spin" />
                    ) : (
                      <AlertTriangle className="w-7 h-7" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-black tracking-[0.24em] uppercase text-rose-600 mb-1">
                      {deleteAllModal === "done" ? "Törlés kész" : "Visszafordíthatatlan művelet"}
                    </div>
                    <h3 className="font-serif text-[28px] font-bold tracking-tight text-slate-900">
                      {deleteAllModal === "confirm1" && "Teljes foglalás törlése"}
                      {deleteAllModal === "confirm2" && "Utolsó megerősítés"}
                      {deleteAllModal === "deleting" && "Foglalások törlése folyamatban"}
                      {deleteAllModal === "done" && "Minden foglalás törölve"}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {deleteAllModal === "confirm1" &&
                        "Ez minden foglalást eltávolít a rendszerből. A partnercégek foglalási oldalain és a diszpécseri nézetben is azonnal üres lesz a lista."}
                      {deleteAllModal === "confirm2" &&
                        "Biztonsági okból még egy megerősítést kérünk. Csak akkor menj tovább, ha tényleg tiszta lappal akarsz indulni."}
                      {deleteAllModal === "deleting" &&
                        "Dolgozom rajta. Ez pár másodperc lehet, közben ne zárd be ezt az ablakot."}
                      {deleteAllModal === "done" &&
                        "A foglalási adatbázis kiürült. A dashboard és a partnerportálok is nulláról indulnak tovább."}
                    </p>
                  </div>
                  {deleteAllModal !== "deleting" && (
                    <button
                      onClick={closeDeleteAllModal}
                      className="shrink-0 w-10 h-10 rounded-2xl border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="px-7 py-6 space-y-5">
                {(deleteAllModal === "confirm1" || deleteAllModal === "confirm2") && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                        <div className="text-[9px] font-black tracking-[0.18em] uppercase text-rose-500 mb-1">Érintett rekordok</div>
                        <div className="text-2xl font-black tracking-tight text-slate-900 tabular-nums">{bookingsMeta.totalCount || realBookings.length}</div>
                        <div className="text-[11px] font-medium text-slate-500">összes foglalás</div>
                      </div>
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <div className="text-[9px] font-black tracking-[0.18em] uppercase text-amber-600 mb-1">Hatás</div>
                        <div className="text-sm font-black text-slate-900">Partner + Diszpécser</div>
                        <div className="text-[11px] font-medium text-slate-500">minden nézetből eltűnik</div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="text-[9px] font-black tracking-[0.18em] uppercase text-slate-500 mb-1">Visszaállítás</div>
                        <div className="text-sm font-black text-slate-900">Nincs automatikus mentés</div>
                        <div className="text-[11px] font-medium text-slate-500">a törlés végleges</div>
                      </div>
                    </div>

                    {deleteAllModal === "confirm2" && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                        <label htmlFor="delete-all-confirm" className="block text-[11px] font-black tracking-[0.18em] uppercase text-slate-500 mb-2">
                          Írd be pontosan: TOROL_MINDEN_FOGLALAST
                        </label>
                        <input
                          id="delete-all-confirm"
                          type="text"
                          value={deleteAllConfirmText}
                          onChange={(e) => setDeleteAllConfirmText(e.target.value)}
                          autoFocus
                          placeholder="TOROL_MINDEN_FOGLALAST"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-rose-100 focus:border-rose-300 transition"
                        />
                        <div className="mt-2 text-[12px] text-slate-500">
                          Ezzel kizárjuk a véletlen kattintást egy ilyen kemény műveletnél.
                        </div>
                      </div>
                    )}

                    {deleteAllError && (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                        {deleteAllError}
                      </div>
                    )}
                  </>
                )}

                {deleteAllModal === "deleting" && (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Foglalások végleges törlése folyamatban</div>
                      <div className="text-sm text-slate-500 mt-1">Kiürítem az összes foglalást a központi adatforrásból.</div>
                    </div>
                  </div>
                )}

                {deleteAllModal === "done" && (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-[16px]">A törlés sikeres volt.</div>
                        <div className="text-sm text-slate-600 mt-1">
                          Törölt foglalások száma:{" "}
                          <span className="font-black text-slate-900">{deleteAllResult?.deletedCount ?? 0} db</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-7 py-5 border-t border-slate-200 bg-slate-50/70 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-[12px] text-slate-500">
                  {deleteAllModal === "confirm1" && "Csak admin végezheti el ezt a műveletet."}
                  {deleteAllModal === "confirm2" && "A törlés azonnal lefut, amint jóváhagyod."}
                  {deleteAllModal === "deleting" && "Kérlek várj, amíg a folyamat befejeződik."}
                  {deleteAllModal === "done" && "A rendszer most tiszta állapotban van."}
                </div>
                <div className="flex items-center justify-end gap-2">
                  {deleteAllModal === "confirm1" && (
                    <>
                      <button
                        onClick={closeDeleteAllModal}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[12px] font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition"
                      >
                        Mégse
                      </button>
                      <button
                        onClick={() => setDeleteAllModal("confirm2")}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 text-white text-[12px] font-black tracking-widest uppercase shadow-lg shadow-rose-600/25 hover:-translate-y-0.5 transition"
                      >
                        Tovább
                      </button>
                    </>
                  )}

                  {deleteAllModal === "confirm2" && (
                    <>
                      <button
                        onClick={() => setDeleteAllModal("confirm1")}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[12px] font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition"
                      >
                        Vissza
                      </button>
                      <button
                        onClick={handleDeleteAllBookings}
                        disabled={deleteAllConfirmText !== "TOROL_MINDEN_FOGLALAST"}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 text-white text-[12px] font-black tracking-widest uppercase shadow-lg shadow-rose-600/25 hover:-translate-y-0.5 transition disabled:opacity-40 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                      >
                        Végleges törlés
                      </button>
                    </>
                  )}

                  {deleteAllModal === "done" && (
                    <button
                      onClick={closeDeleteAllModal}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white text-[12px] font-black tracking-widest uppercase shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 transition"
                    >
                      Rendben
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Toast notification container */}
      {notificationToasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none" style={{ maxWidth: '420px' }}>
          <style>{`
            @keyframes toastSlideIn {
              from { transform: translateX(120%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            @keyframes toastFadeOut {
              from { opacity: 1; transform: translateX(0); }
              to { opacity: 0; transform: translateX(120%); }
            }
          `}</style>
            {notificationToasts.map((toast) => {
              const age = renderNow - toast.timestamp;
            const isFading = age > 5000;
            return (
              <div
                key={toast.id}
                className="pointer-events-auto rounded-2xl shadow-2xl shadow-indigo-600/20 border border-indigo-200/80 overflow-hidden"
                style={{
                  animation: isFading
                    ? 'toastFadeOut 0.4s ease-in forwards'
                    : 'toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-1 py-0.5" />
                <div className="bg-white px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 flex items-center justify-center text-white">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-[13px] text-slate-900 mb-0.5">{toast.title}</div>
                      <div className="text-[12px] font-medium text-slate-600 leading-relaxed">{toast.message}</div>
                    </div>
                    <button
                      onClick={() => dismissToast(toast.id)}
                      className="shrink-0 w-6 h-6 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex items-center justify-center transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {toast.bookingId && (
                    <button
                      onClick={() => {
                        if (toast.bookingId) markBookingNotificationsRead(toast.bookingId);
                        if (toast.bookingId) markAsViewed(toast.bookingId);
                        router.push(`/bookings/${toast.bookingId}`);
                        dismissToast(toast.id);
                      }}
                      className="mt-3 w-full text-center py-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 text-xs font-bold text-blue-700 hover:from-blue-100 hover:to-indigo-100 transition-all"
                    >
                      Foglalás megtekintése →
                    </button>
                  )}
                </div>
                {/* Progress bar showing time remaining */}
                <div className="h-1 bg-slate-100">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000 ease-linear"
                      style={{ width: `${Math.max(0, 100 - ((renderNow - toast.timestamp) / 6000) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NotificationsView({
  events,
  loading,
  onRefresh,
  onOpenBooking,
  onRead,
}: {
  events: NotificationEvent[];
  loading: boolean;
  onRefresh: () => void;
  onOpenBooking: (bookingId: string) => void;
  onRead: (notificationId: string, type: NotificationEvent["type"]) => void;
}) {
  const eventStyle = (type: NotificationEvent["type"]) => {
    if (type === "new_booking") {
      return {
        icon: <PlusCircle className="w-5 h-5" />,
        iconClass: "bg-blue-600 text-white shadow-blue-500/25",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
        label: "Új foglalás",
      };
    }
    if (type === "booking_modified") {
      return {
        icon: <RefreshCw className="w-5 h-5" />,
        iconClass: "bg-amber-500 text-white shadow-amber-500/25",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
        label: "Foglalás módosítva",
      };
    }
    if (type === "driver_acknowledged") {
      return {
        icon: <CheckCircle2 className="w-5 h-5" />,
        iconClass: "bg-emerald-600 text-white shadow-emerald-500/25",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        label: "Sofőr visszaigazolta",
      };
    }
    return {
      icon: <Bell className="w-5 h-5" />,
      iconClass: "bg-slate-700 text-white shadow-slate-500/25",
      badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
      label: "Foglalási esemény",
    };
  };

  return (
    <section className="max-w-6xl mx-auto space-y-6">
      <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white px-7 py-7 shadow-2xl shadow-slate-900/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-2xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-300" />
              </div>
              <span className="text-[11px] font-black tracking-[0.22em] uppercase text-blue-200">Diszpécser központ</span>
            </div>
            <h2 className="font-serif text-3xl font-bold tracking-tight">Értesítési központ</h2>
            <p className="mt-1.5 text-sm text-slate-300">
              Minden fontos foglalási és sofőri esemény egy helyen, időrendben.
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 ring-1 ring-white/15 text-sm font-bold transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Frissítés
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-7">
          <div className="rounded-2xl bg-white/10 ring-1 ring-white/10 px-4 py-3">
            <div className="text-[10px] uppercase tracking-widest text-slate-300 font-black">Összes esemény</div>
            <div className="text-2xl font-black mt-1">{events.length}</div>
          </div>
          <div className="rounded-2xl bg-white/10 ring-1 ring-white/10 px-4 py-3">
            <div className="text-[10px] uppercase tracking-widest text-slate-300 font-black">Módosítások</div>
            <div className="text-2xl font-black mt-1">{events.filter((event) => event.type === "booking_modified").length}</div>
          </div>
          <div className="rounded-2xl bg-white/10 ring-1 ring-white/10 px-4 py-3 col-span-2 sm:col-span-1">
            <div className="text-[10px] uppercase tracking-widest text-slate-300 font-black">Sofőri visszaigazolás</div>
            <div className="text-2xl font-black mt-1">{events.filter((event) => event.type === "driver_acknowledged").length}</div>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] bg-white border border-slate-200/80 shadow-xl shadow-slate-900/[0.04] overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Értesítési előzmények</h3>
            <p className="text-xs text-slate-500 mt-1">A legfrissebb események vannak legfelül.</p>
          </div>
          {loading && <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
        </div>
        {events.length === 0 && !loading ? (
          <div className="py-20 px-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
              <Bell className="w-8 h-8 text-slate-300" />
            </div>
            <h4 className="mt-4 font-bold text-slate-700">Még nincs megjeleníthető értesítés</h4>
            <p className="mt-1 text-sm text-slate-500">Az új események automatikusan ide kerülnek.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {events.map((event) => {
              const style = eventStyle(event.type);
              return (
                <button
                  key={event.id}
                  onClick={() => {
                    onRead(event.id, event.type);
                    onOpenBooking(event.bookingId);
                  }}
                  className="w-full text-left px-6 py-5 hover:bg-slate-50/80 transition group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg ${style.iconClass}`}>
                      {style.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${style.badgeClass}`}>
                          {style.label}
                        </span>
                        <span className="font-mono text-[11px] font-black text-slate-500">#{event.bookingCode}</span>
                        <span className="text-[11px] text-slate-400">
                          {new Intl.DateTimeFormat("hu-HU", {
                            year: "numeric", month: "2-digit", day: "2-digit",
                            hour: "2-digit", minute: "2-digit",
                          }).format(new Date(event.timestamp))}
                        </span>
                      </div>
                      <h4 className="mt-2 text-[15px] font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                        {event.title}
                      </h4>
                      <p className="mt-1 text-sm text-slate-600 leading-relaxed">{event.message}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="font-bold text-slate-700">{event.travelerName}</span>
                        {event.companyName && <span>{event.companyName}</span>}
                        <span>{event.pickupDate} · {event.pickupTime}</span>
                        {event.actor && <span>Rögzítette: {event.actor}</span>}
                      </div>
                      {event.changes && event.changes.length > 0 && (
                        <div className="mt-3 rounded-xl bg-amber-50/70 border border-amber-100 px-3 py-2 text-xs text-amber-900 leading-relaxed">
                          {event.changes.map(formatModificationChange).join(" · ")}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 shrink-0 mt-2 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
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

function SettingsView({
  user,
  totalBookings,
  onDeleteAll,
}: {
  user: { email: string; name: string; role: string };
  totalBookings: number;
  onDeleteAll: () => void;
}) {
  const isAdmin = user.role === "admin";

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="text-[10px] font-black tracking-[0.22em] uppercase text-slate-400 mb-1">Rendszer</div>
        <h2 className="font-serif text-[30px] font-bold tracking-tight text-slate-900">Beállítások</h2>
        <p className="text-sm text-slate-500 mt-1">Profil és rendszer-szintű konfigurációk.</p>
      </div>

      {/* Profil kártya */}
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-lg shadow-slate-900/[0.03] p-6">
        <div className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-4">Fiók adatok</div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 shadow-lg shadow-blue-700/30 flex items-center justify-center text-white font-black text-xl ring-2 ring-white">
            {(user.name || user.email).slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-[16px]">{user.name || user.email}</div>
            <div className="text-sm text-slate-500">{user.email}</div>
            <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-slate-800 to-slate-950 text-white text-[9px] font-black tracking-widest uppercase border border-slate-700">
              <Star className="w-2.5 h-2.5" fill="currentColor" strokeWidth={0} />
              {isAdmin ? "ADMIN" : "DISZPÉCSER"}
            </div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3">
            <div className="text-[9px] font-black tracking-widest uppercase text-slate-400 mb-0.5">Jogosultság szint</div>
            <div className="font-black text-slate-900 text-lg tabular-nums">{isAdmin ? "10" : "8"} <span className="text-xs font-bold text-slate-400">/ 10</span></div>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3">
            <div className="text-[9px] font-black tracking-widest uppercase text-slate-400 mb-0.5">Aktív foglalások</div>
            <div className="font-black text-slate-900 text-lg tabular-nums">{totalBookings} <span className="text-xs font-bold text-slate-400">db</span></div>
          </div>
        </div>
      </div>

      {/* Veszélyes zóna - csak adminoknak */}
      {isAdmin ? (
        <div className="rounded-3xl border-2 border-rose-200 bg-rose-50/40 p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 shadow-lg shadow-rose-600/30 flex items-center justify-center text-white">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-black tracking-[0.2em] uppercase text-rose-600 mb-0.5">Veszélyes zóna</div>
              <h3 className="font-bold text-slate-900 text-[17px]">Rendszer visszaállítás</h3>
              <p className="text-sm text-slate-600 mt-1">
                Ezek a műveletek <span className="font-black text-rose-600">visszafordíthatatlanok</span>. Csak akkor használd, ha teljesen tiszta lappal szeretnél indulni.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-rose-200 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-[14px]">Teljes foglalás törlése</div>
                  <div className="text-[12px] text-slate-500 mt-0.5 max-w-sm">
                    Véglegesen törli az összes foglalást az adatbázisból — a partnercégek portáljain is eltűnnek. Jelenlegi foglalások: <span className="font-black text-slate-900">{totalBookings} db</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onDeleteAll}
                className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 text-white text-[12px] font-black tracking-widest uppercase shadow-lg shadow-rose-600/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-rose-600/40 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Összes törlése
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-6 flex items-center gap-4">
          <div className="shrink-0 w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-slate-700">Veszélyes műveletek</div>
            <div className="text-[12px] text-slate-500 mt-0.5">Ehhez a szekciókhoz admin jogosultság szükséges.</div>
          </div>
        </div>
      )}
    </div>
  );
}
