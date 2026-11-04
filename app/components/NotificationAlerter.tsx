"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, BellOff, BellRing, CheckCircle2, Monitor, PlusCircle, RefreshCw, Volume2, X, XCircle } from "lucide-react";
import { isAlertAudioReady, playAlertSound, unlockAlertAudio } from "@/lib/alert-sound";

// Minden (bejelentkezett) oldalon futó figyelő: új foglalás, partner-módosítás, lemondás stb. esetén
// hangos jelzést ad, asztali (rendszer)értesítést küld, villogtatja a lap címét, és tartós kártyát mutat.
// Több megnyitott lapnál csak az egyik szól (localStorage-os "lefoglalás").

interface AlertEvent {
  id: string;
  type: string;
  title: string;
  message?: string;
  bookingId: string;
  bookingCode: string;
  travelerName?: string;
  companyName?: string;
  pickupDate?: string;
  pickupTime?: string;
  timestamp: number;
}

const POLL_MS = 15_000;
const RERING_MS = 60_000;
const MAX_RERINGS = 5;
const KEY_CLAIMS = "dispatcher-alert-claims";
const KEY_DISMISSED = "dispatcher-alert-dismissed";
const KEY_ACK = "dispatcher-alert-ack";
const KEY_SOUND = "dispatcher-alert-sound";
const KEY_ACTIVE = "dispatcher-alert-active";
const HIDDEN_PATHS = ["/login", "/setup-password"];
// Ezek azonnali teendőt jelentenek: amíg senki nem nyúl a géphez, percenként újra megszólalnak.
const URGENT_TYPES = new Set(["new_booking", "booking_modified", "booking_cancelled"]);

function readMap(key: string): Record<string, number> {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(key: string, map: Record<string, number>) {
  const cutoff = Date.now() - 2 * 24 * 60 * 60 * 1000;
  const pruned = Object.fromEntries(Object.entries(map).filter(([, at]) => at > cutoff));
  try {
    window.localStorage.setItem(key, JSON.stringify(pruned));
  } catch {}
}

/** true, ha ez a lap "nyerte" az adott eseményt (más lap még nem jelzett róla). */
function tryClaim(id: string): boolean {
  const map = readMap(KEY_CLAIMS);
  if (map[id]) return false;
  map[id] = Date.now();
  writeMap(KEY_CLAIMS, map);
  return true;
}

// A még le nem zárt kártyák: újratöltés után is megmaradnak, és minden lapon ugyanazok látszanak.
function readActive(): AlertEvent[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY_ACTIVE) || "[]");
    const cutoff = Date.now() - 2 * 24 * 60 * 60 * 1000;
    return Array.isArray(parsed) ? parsed.filter((a) => a?.id && a.timestamp > cutoff) : [];
  } catch {
    return [];
  }
}

function writeActive(list: AlertEvent[]) {
  try {
    window.localStorage.setItem(KEY_ACTIVE, JSON.stringify(list));
  } catch {}
}

function mergeAlerts(list: AlertEvent[]): AlertEvent[] {
  return Array.from(new Map(list.map((a) => [a.id, a])).values())
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20);
}

function notificationPermission(): NotificationPermission | "unsupported" {
  return typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported";
}

function eventVisual(type: string) {
  switch (type) {
    case "new_booking":
      return { icon: PlusCircle, tone: "from-blue-500 to-indigo-600", ring: "border-blue-200" };
    case "booking_modified":
      return { icon: RefreshCw, tone: "from-amber-500 to-orange-600", ring: "border-amber-200" };
    case "booking_cancelled":
      return { icon: XCircle, tone: "from-rose-500 to-red-600", ring: "border-rose-200" };
    case "driver_acknowledged":
      return { icon: CheckCircle2, tone: "from-emerald-500 to-teal-600", ring: "border-emerald-200" };
    default:
      return { icon: Bell, tone: "from-slate-600 to-slate-800", ring: "border-slate-200" };
  }
}

function formatPickup(e: AlertEvent) {
  if (!e.pickupDate) return e.pickupTime || "";
  const [y, m, d] = e.pickupDate.split("-");
  const date = y && m && d ? `${y}. ${m}. ${d}.` : e.pickupDate;
  return e.pickupTime ? `${date} ${e.pickupTime}` : date;
}

export default function NotificationAlerter() {
  const pathname = usePathname();
  const router = useRouter();
  const hiddenPath = HIDDEN_PATHS.some((p) => pathname === p || pathname?.startsWith(`${p}/`));

  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(true);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [ringing, setRinging] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [audioReady, setAudioReady] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [panelOpen, setPanelOpen] = useState(false);

  const lastPoll = useRef(0);
  const seen = useRef(new Set<string>());
  const soundOnRef = useRef(true);
  const ringingRef = useRef(false);
  const urgentRef = useRef(false);
  const reringCount = useRef(0);
  const baseTitle = useRef("");
  const lastAckWrite = useRef(0);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setMounted(true);
      setPermission(notificationPermission());
      let on = true;
      try {
        on = window.localStorage.getItem(KEY_SOUND) !== "off";
      } catch {}
      soundOnRef.current = on;
      setSoundOn(on);
      setAlerts(readActive());
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  // Új bejelentkezés után (login oldalról visszatérve) újra figyelünk.
  const [prevHidden, setPrevHidden] = useState(hiddenPath);
  if (prevHidden !== hiddenPath) {
    setPrevHidden(hiddenPath);
    if (!hiddenPath) setAuthorized(true);
  }

  const stopRinging = useCallback((broadcast: boolean) => {
    if (!ringingRef.current) return;
    ringingRef.current = false;
    urgentRef.current = false;
    reringCount.current = 0;
    setRinging(false);
    if (broadcast) {
      try {
        window.localStorage.setItem(KEY_ACK, String(Date.now()));
      } catch {}
    }
  }, []);

  // Bármilyen interakció: feloldja a hangot ezen a lapon, és nyugtázza a csengést (a dispécser a gépnél van).
  useEffect(() => {
    function onInteract() {
      unlockAlertAudio();
      window.setTimeout(() => setAudioReady(isAlertAudioReady()), 50);
      stopRinging(false);
      // A többi lap is hallja: ha ott szól a jelzés, ott is elhallgat.
      const now = Date.now();
      if (now - lastAckWrite.current > 3000) {
        lastAckWrite.current = now;
        try {
          window.localStorage.setItem(KEY_ACK, String(now));
        } catch {}
      }
    }
    function onStorage(e: StorageEvent) {
      if (e.key === KEY_ACK) stopRinging(false);
      if (e.key === KEY_ACTIVE) setAlerts(readActive());
      if (e.key === KEY_SOUND) {
        const on = e.newValue !== "off";
        soundOnRef.current = on;
        setSoundOn(on);
      }
    }
    window.addEventListener("pointerdown", onInteract, true);
    window.addEventListener("keydown", onInteract, true);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("pointerdown", onInteract, true);
      window.removeEventListener("keydown", onInteract, true);
      window.removeEventListener("storage", onStorage);
    };
  }, [stopRinging]);

  const announce = useCallback(async (events: AlertEvent[]) => {
    const urgent = events.some((e) => URGENT_TYPES.has(e.type));

    // Hang: csak olyan lap szól, ahol a hang fel van oldva — a zárolt lap kicsit vár, hogy egy másik nyerhessen.
    if (soundOnRef.current) {
      if (!isAlertAudioReady()) await new Promise((r) => window.setTimeout(r, 1500));
      if (isAlertAudioReady() && events.some((e) => tryClaim(`sound:${e.id}`))) {
        const played = await playAlertSound();
        if (played) {
          ringingRef.current = true;
          urgentRef.current = urgentRef.current || urgent;
          reringCount.current = 0;
          setRinging(true);
        }
      }
    }

    // Asztali értesítés: akkor is látszik, ha a böngésző a háttérben van vagy le van kicsinyítve.
    if (notificationPermission() === "granted" && (document.hidden || !document.hasFocus())) {
      for (const e of events.slice(0, 3)) {
        if (!tryClaim(`os:${e.id}`)) continue;
        try {
          const n = new Notification(e.title, {
            body: [`#${e.bookingCode}`, e.travelerName, formatPickup(e)].filter(Boolean).join(" · "),
            tag: e.id,
            requireInteraction: URGENT_TYPES.has(e.type),
          });
          n.onclick = () => {
            window.focus();
            router.push(`/bookings/${e.bookingId}`);
            n.close();
          };
        } catch {}
      }
    }
  }, [router]);

  const poll = useCallback(async () => {
    try {
      const since = lastPoll.current || Date.now() - 60_000;
      const res = await fetch(`/api/notifications?since=${since}`, { credentials: "include", cache: "no-store" });
      if (res.status === 401) {
        setAuthorized(false);
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      // Rövid átfedés, hogy a lekérdezés közben írt esemény se essen ki; az azonosító kiszűri a duplát.
      lastPoll.current = Date.now() - 5_000;
      const events: AlertEvent[] = Array.isArray(data?.notifications) ? data.notifications : [];
      const fresh = events.filter((e) => e?.id && !seen.current.has(e.id));
      fresh.forEach((e) => seen.current.add(e.id));
      const dismissed = readMap(KEY_DISMISSED);
      const active = readActive();
      const activeIds = new Set(active.map((a) => a.id));
      const toShow = fresh.filter((e) => !dismissed[e.id] && !activeIds.has(e.id));
      if (toShow.length === 0) return;
      const merged = mergeAlerts([...toShow, ...active]);
      writeActive(merged);
      setAlerts(merged);
      // A hangot/asztali értesítést a "lefoglalás" védi a duplától (más lap vagy újratöltés).
      await announce(toShow);
    } catch {}
  }, [announce]);

  useEffect(() => {
    if (!mounted || hiddenPath || !authorized) return;
    const kick = window.setTimeout(() => void poll(), 0);
    const timer = window.setInterval(() => void poll(), POLL_MS);
    const onVisible = () => {
      if (!document.hidden) void poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      window.clearTimeout(kick);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [mounted, hiddenPath, authorized, poll]);

  // Ismétlés: sürgős eseménynél percenként újra szól (legfeljebb 5×), amíg senki nem nyúl a géphez.
  useEffect(() => {
    if (!ringing) return;
    const timer = window.setInterval(() => {
      if (!ringingRef.current || !urgentRef.current || !soundOnRef.current) return;
      if (reringCount.current >= MAX_RERINGS) {
        stopRinging(false);
        return;
      }
      reringCount.current += 1;
      void playAlertSound();
    }, RERING_MS);
    return () => window.clearInterval(timer);
  }, [ringing, stopRinging]);

  // Villogó lapcím, hogy a fülek között is feltűnjön.
  const unreadCount = alerts.length;
  useEffect(() => {
    if (!ringing) return;
    let flip = false;
    const timer = window.setInterval(() => {
      if (!document.title.startsWith("🔔")) baseTitle.current = document.title;
      flip = !flip;
      document.title = flip ? `🔔 ${unreadCount || 1} új értesítés` : baseTitle.current;
    }, 1000);
    return () => {
      window.clearInterval(timer);
      if (document.title.startsWith("🔔") && baseTitle.current) document.title = baseTitle.current;
    };
  }, [ringing, unreadCount]);

  const dismiss = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const map = readMap(KEY_DISMISSED);
    ids.forEach((id) => (map[id] = Date.now()));
    writeMap(KEY_DISMISSED, map);
    const remaining = readActive().filter((a) => !ids.includes(a.id));
    writeActive(remaining);
    setAlerts(remaining);
  }, []);

  // Ha a diszpécser megnyitja a foglalást, annak kártyái eltűnnek.
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    const match = /^\/bookings\/([^/]+)$/.exec(pathname || "");
    if (match) {
      const ids = alerts.filter((a) => a.bookingId === match[1]).map((a) => a.id);
      if (ids.length > 0) setAlerts((cur) => cur.filter((a) => !ids.includes(a.id)));
    }
  }
  useEffect(() => {
    const match = /^\/bookings\/([^/]+)$/.exec(pathname || "");
    if (!match) return;
    // Tárolóban is lezárjuk (újratöltés és a többi lap miatt); az esemény-azonosító a foglalás azonosítójával kezdődik.
    const active = readActive();
    const ids = new Set([
      ...active.filter((a) => a.bookingId === match[1]).map((a) => a.id),
      ...Array.from(seen.current).filter((id) => id.startsWith(`${match[1]}-`)),
    ]);
    if (ids.size === 0) return;
    const map = readMap(KEY_DISMISSED);
    ids.forEach((id) => (map[id] = map[id] || Date.now()));
    writeMap(KEY_DISMISSED, map);
    writeActive(active.filter((a) => !ids.has(a.id)));
  }, [pathname]);

  function toggleSound() {
    const next = !soundOn;
    soundOnRef.current = next;
    setSoundOn(next);
    try {
      window.localStorage.setItem(KEY_SOUND, next ? "on" : "off");
    } catch {}
    if (!next) stopRinging(true);
  }

  async function testSound() {
    unlockAlertAudio();
    const ok = await playAlertSound();
    setAudioReady(ok || isAlertAudioReady());
  }

  async function requestDesktop() {
    if (!("Notification" in window)) return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        new Notification("Asztali értesítések bekapcsolva", {
          body: "Így akkor is szólunk, ha a diszpécser felület a háttérben van.",
        });
      }
    } catch {}
  }

  if (!mounted || hiddenPath || !authorized) return null;

  const visible = alerts.slice(0, 3);
  const more = alerts.length - visible.length;
  const locked = soundOn && !audioReady;

  return (
    <div
      data-alert-ui
      className="fixed bottom-4 z-[150] flex flex-col items-start gap-2 pointer-events-none"
      // Az irányítópulton a 280 px-es oldalsáv mellé kerül, hogy ne takarja a menüt és a profilt.
      style={{ left: pathname === "/" ? 296 : 16, width: "min(340px, calc(100vw - 2rem))" }}
    >
      <AnimatePresence initial={false}>
        {visible.map((a) => {
          const v = eventVisual(a.type);
          const Icon = v.icon;
          return (
            <motion.div
              key={a.id}
              layout
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className={`pointer-events-auto w-full rounded-2xl bg-white shadow-2xl shadow-slate-900/15 border ${v.ring} overflow-hidden`}
            >
              <div className={`h-1 bg-gradient-to-r ${v.tone}`} />
              <div className="px-4 py-3 flex items-start gap-3">
                <div className={`shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br ${v.tone} text-white flex items-center justify-center shadow-sm`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-[13px] text-slate-900 leading-tight">{a.title}</div>
                  <div className="mt-0.5 text-[11.5px] font-semibold text-slate-600 truncate">
                    #{a.bookingCode}
                    {a.travelerName ? ` · ${a.travelerName}` : ""}
                  </div>
                  {(a.pickupDate || a.pickupTime) && (
                    <div className="text-[11px] font-bold text-slate-400 tabular-nums">{formatPickup(a)}</div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      dismiss(alerts.filter((x) => x.bookingId === a.bookingId).map((x) => x.id));
                      router.push(`/bookings/${a.bookingId}`);
                    }}
                    className="mt-2 inline-flex items-center rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-black text-white hover:bg-slate-800 transition"
                  >
                    Megnyitás →
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss([a.id])}
                  aria-label="Értesítés bezárása"
                  className="shrink-0 w-6 h-6 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex items-center justify-center transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {alerts.length > 1 && (
        <div className="pointer-events-auto flex items-center gap-2 text-[11px] font-bold">
          {more > 0 && <span className="rounded-lg bg-white/90 px-2 py-1 text-slate-600 shadow-sm border border-slate-200">+{more} további</span>}
          <button
            type="button"
            onClick={() => dismiss(alerts.map((a) => a.id))}
            className="rounded-lg bg-white/90 px-2 py-1 text-slate-600 shadow-sm border border-slate-200 hover:bg-white"
          >
            Mind elolvasva
          </button>
        </div>
      )}

      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-auto w-full rounded-2xl bg-white shadow-2xl shadow-slate-900/15 border border-slate-200 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="font-black text-[13px] text-slate-900">Hangos értesítés</div>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                aria-label="Bezárás"
                className="w-6 h-6 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11.5px] leading-snug font-medium text-slate-500">
              Új foglalásnál, partneri módosításnál és lemondásnál hangos jelzés szól, és percenként megismétlődik
              (legfeljebb 5-ször), amíg valaki nem nyúl a géphez.
            </p>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12px] font-bold text-slate-700">Hangjelzés</span>
              <button
                type="button"
                role="switch"
                aria-checked={soundOn}
                aria-label="Hangjelzés be/ki"
                onClick={toggleSound}
                className={`relative w-11 h-6 rounded-full transition ${soundOn ? "bg-emerald-500" : "bg-slate-300"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${soundOn ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => void testSound()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-black text-slate-700 hover:bg-slate-100"
            >
              <Volume2 className="w-4 h-4" />
              Hang kipróbálása
            </button>
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
              <div className="flex items-center gap-2 text-[12px] font-bold text-slate-700">
                <Monitor className="w-4 h-4 text-slate-500" />
                Asztali értesítés
                <span
                  className={`ml-auto text-[10.5px] font-black ${
                    permission === "granted" ? "text-emerald-600" : permission === "denied" ? "text-rose-600" : "text-amber-600"
                  }`}
                >
                  {permission === "granted" ? "Bekapcsolva" : permission === "denied" ? "Letiltva" : permission === "unsupported" ? "Nem támogatott" : "Kikapcsolva"}
                </span>
              </div>
              {permission === "default" && (
                <button
                  type="button"
                  onClick={() => void requestDesktop()}
                  className="mt-2 w-full rounded-lg bg-slate-900 px-3 py-1.5 text-[11.5px] font-black text-white hover:bg-slate-800"
                >
                  Engedélyezés
                </button>
              )}
              {permission === "denied" && (
                <p className="mt-1.5 text-[11px] leading-snug text-slate-500">
                  A böngészőben le van tiltva. A címsor melletti lakat ikonnál engedélyezhető.
                </p>
              )}
            </div>
            <p className="text-[10.5px] leading-snug text-slate-400">
              Tipp: a gép hangereje legyen felhangosítva, és a diszpécser felület maradjon nyitva egy böngészőlapon.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => {
          unlockAlertAudio();
          setPanelOpen((o) => !o);
        }}
        title={ringing ? "Új értesítés" : soundOn ? "Hangos értesítés beállításai" : "A hangjelzés ki van kapcsolva"}
        aria-label="Hangos értesítés beállításai"
        className={`pointer-events-auto inline-flex items-center gap-2 rounded-full shadow-lg border transition ${
          ringing
            ? "bg-rose-600 border-rose-500 text-white px-4 h-11 animate-pulse"
            : locked
              ? "bg-amber-50 border-amber-300 text-amber-800 px-4 h-11"
              : soundOn
                ? "bg-white border-slate-200 text-slate-600 w-11 h-11 justify-center hover:text-slate-900"
                : "bg-white border-rose-200 text-rose-500 w-11 h-11 justify-center"
        }`}
      >
        {ringing ? (
          <>
            <BellRing className="w-5 h-5" />
            <span className="text-[12px] font-black">Új értesítés!</span>
          </>
        ) : locked ? (
          <>
            <BellOff className="w-4 h-4" />
            <span className="text-[11.5px] font-black">Kattints a hang bekapcsolásához</span>
          </>
        ) : soundOn ? (
          <Bell className="w-5 h-5" />
        ) : (
          <BellOff className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
