"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CalendarDays, CarFront, Loader2, Search, UserCircle2, X } from "lucide-react";
import { getStatusDisplay, type BookingStatus } from "@/lib/booking-status";

export interface SearchableBooking {
  _id: string;
  bookingCode: string;
  travelerName?: string;
  travelerEmail?: string;
  travelerPhone?: string;
  companyName?: string;
  fromAddress?: string;
  toAddress?: string;
  flightNumber?: string;
  pickupDate: string;
  pickupTime: string;
  assignedDriverName?: string;
  assignedVehicleName?: string;
  comment?: string;
  status: BookingStatus;
}

interface SearchableDriver {
  _id?: string;
  name: string;
  phone?: string;
  email?: string;
}

interface SearchableVehicle {
  _id?: string;
  name: string;
  plates?: string;
  type?: string;
}

export interface SearchPage {
  id: string;
  label: string;
  subtitle: string;
  keywords?: string[];
  icon: React.ReactNode;
  onSelect: () => void;
}

type ResultItem =
  | { kind: "page"; key: string; score: number; page: SearchPage }
  | { kind: "booking"; key: string; score: number; booking: SearchableBooking }
  | { kind: "driver"; key: string; score: number; driver: SearchableDriver }
  | { kind: "vehicle"; key: string; score: number; vehicle: SearchableVehicle };

const MAX_PER_GROUP = 6;

/** Kisbetű + ékezetmentes + csak betű/szám: "Ráthonyi" ≈ "rathonyi", "+36 30" ≈ "3630" */
function normalize(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ő/g, "o")
    .replace(/ű/g, "u");
}

function compact(value: unknown): string {
  return normalize(value).replace(/[^a-z0-9]/g, "");
}

function scoreFields(terms: string[], fields: Array<{ text: string; weight: number }>): number {
  // Minden keresőszónak találnia kell valamelyik mezőben (ÉS kapcsolat)
  let total = 0;
  for (const term of terms) {
    const compactTerm = term.replace(/[^a-z0-9]/g, "");
    let best = 0;
    for (const field of fields) {
      const norm = normalize(field.text);
      if (!norm) continue;
      let hit = 0;
      if (norm === term) hit = field.weight * 3;
      else if (norm.startsWith(term)) hit = field.weight * 2.2;
      else if (norm.split(/[^a-z0-9]+/).some((w) => w.startsWith(term))) hit = field.weight * 1.8;
      else if (norm.includes(term)) hit = field.weight * 1.2;
      else if (compactTerm.length >= 3 && compact(field.text).includes(compactTerm)) hit = field.weight;
      if (hit > best) best = hit;
    }
    if (best === 0) return 0;
    total += best;
  }
  return total;
}

function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (!text) return null;
  const norm = normalize(text);
  // A normalizálás hossztartó (NFD után eltávolított jelek miatt eltérhet), ezért csak akkor jelölünk, ha a hossz egyezik
  if (norm.length !== text.length) return <>{text}</>;
  const ranges: Array<[number, number]> = [];
  for (const term of terms) {
    if (!term) continue;
    let from = 0;
    while (true) {
      const idx = norm.indexOf(term, from);
      if (idx === -1) break;
      ranges.push([idx, idx + term.length]);
      from = idx + term.length;
    }
  }
  if (ranges.length === 0) return <>{text}</>;
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([r[0], r[1]]);
  }
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  merged.forEach(([s, e], i) => {
    if (s > cursor) parts.push(text.slice(cursor, s));
    parts.push(
      <mark key={i} className="bg-amber-200/80 text-slate-900 rounded px-0.5">
        {text.slice(s, e)}
      </mark>
    );
    cursor = e;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}

function formatDate(date: string) {
  const [y, m, d] = (date || "").split("-");
  return y && m && d ? `${y}. ${m}. ${d}.` : date;
}

export default function GlobalSearch({
  bookings,
  pages = [],
  onRefresh,
}: {
  bookings: SearchableBooking[];
  pages?: SearchPage[];
  onRefresh?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [drivers, setDrivers] = useState<SearchableDriver[]>([]);
  const [vehicles, setVehicles] = useState<SearchableVehicle[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const loadedExtra = useRef(false);

  const terms = useMemo(
    () => normalize(query).split(/\s+/).filter(Boolean),
    [query]
  );

  const loadExtra = useCallback(async () => {
    if (loadedExtra.current) return;
    loadedExtra.current = true;
    setLoadingExtra(true);
    try {
      const [dRes, vRes] = await Promise.all([
        fetch("/api/drivers", { credentials: "include" }).then((r) => r.json()).catch(() => ({})),
        fetch("/api/vehicles", { credentials: "include" }).then((r) => r.json()).catch(() => ({})),
      ]);
      if (Array.isArray(dRes?.drivers)) setDrivers(dRes.drivers);
      if (Array.isArray(vRes?.vehicles)) setVehicles(vRes.vehicles);
    } finally {
      setLoadingExtra(false);
    }
  }, []);

  const results = useMemo<ResultItem[]>(() => {
    if (terms.length === 0) return [];

    const pageHits: ResultItem[] = [];
    for (const pg of pages) {
      const score = scoreFields(terms, [
        { text: pg.label, weight: 10 },
        ...(pg.keywords || []).map((k) => ({ text: k, weight: 8 })),
        { text: pg.subtitle, weight: 3 },
      ]);
      if (score > 0) pageHits.push({ kind: "page", key: `p-${pg.id}`, score, page: pg });
    }
    pageHits.sort((a, b) => b.score - a.score);

    const bookingHits: ResultItem[] = [];
    for (const b of bookings) {
      const score = scoreFields(terms, [
        { text: b.bookingCode, weight: 10 },
        { text: b.travelerName || "", weight: 9 },
        { text: b.companyName || "", weight: 7 },
        { text: b.flightNumber || "", weight: 7 },
        { text: b.travelerPhone || "", weight: 6 },
        { text: b.travelerEmail || "", weight: 6 },
        { text: b.assignedDriverName || "", weight: 5 },
        { text: b.assignedVehicleName || "", weight: 5 },
        { text: b.fromAddress || "", weight: 4 },
        { text: b.toAddress || "", weight: 4 },
        { text: b.pickupDate, weight: 4 },
        { text: formatDate(b.pickupDate), weight: 4 },
        { text: b.comment || "", weight: 2 },
        { text: getStatusDisplay(b.status).label, weight: 3 },
      ]);
      if (score > 0) bookingHits.push({ kind: "booking", key: `b-${b._id}`, score, booking: b });
    }
    bookingHits.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Azonos relevanciánál a legközelebbi / legfrissebb időpont elöl
      const ab = (a as Extract<ResultItem, { kind: "booking" }>).booking;
      const bb = (b as Extract<ResultItem, { kind: "booking" }>).booking;
      return `${bb.pickupDate} ${bb.pickupTime}`.localeCompare(`${ab.pickupDate} ${ab.pickupTime}`);
    });

    const driverHits: ResultItem[] = [];
    for (const d of drivers) {
      const score = scoreFields(terms, [
        { text: d.name, weight: 9 },
        { text: d.phone || "", weight: 6 },
        { text: d.email || "", weight: 6 },
      ]);
      if (score > 0) driverHits.push({ kind: "driver", key: `d-${d._id || d.name}`, score, driver: d });
    }
    driverHits.sort((a, b) => b.score - a.score);

    const vehicleHits: ResultItem[] = [];
    for (const v of vehicles) {
      const score = scoreFields(terms, [
        { text: v.name, weight: 9 },
        { text: v.plates || "", weight: 9 },
        { text: v.type || "", weight: 3 },
      ]);
      if (score > 0) vehicleHits.push({ kind: "vehicle", key: `v-${String(v._id || v.name)}`, score, vehicle: v });
    }
    vehicleHits.sort((a, b) => b.score - a.score);

    return [
      ...pageHits.slice(0, 4),
      ...bookingHits.slice(0, MAX_PER_GROUP + 2),
      ...driverHits.slice(0, MAX_PER_GROUP),
      ...vehicleHits.slice(0, MAX_PER_GROUP),
    ];
  }, [terms, bookings, drivers, vehicles, pages]);

  const totalBookingHits = useMemo(() => {
    if (terms.length === 0) return 0;
    return results.filter((r) => r.kind === "booking").length;
  }, [results, terms]);

  const updatePosition = useCallback(() => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(460, window.innerWidth - rect.left - 16);
    const top = rect.bottom + 8;
    setPos({ top, left: rect.left, width: Math.max(width, rect.width), maxHeight: Math.max(240, window.innerHeight - top - 16) });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    function close(event: MouseEvent) {
      const target = event.target as Node;
      if (!wrapperRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    }
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("mousedown", close);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousedown", close);
    };
  }, [open, updatePosition]);

  // Gyorsbillentyűk: "/" vagy Ctrl/Cmd+K a kereséshez
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement | null)?.isContentEditable;
      if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      } else if (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function select(item: ResultItem) {
    setOpen(false);
    setQuery("");
    (document.activeElement as HTMLElement | null)?.blur?.();
    if (item.kind === "page") item.page.onSelect();
    else if (item.kind === "booking") router.push(`/bookings/${item.booking._id}`);
    else if (item.kind === "driver") router.push("/drivers");
    else router.push("/vehicles");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      if (query) setQuery("");
      else {
        setOpen(false);
        inputRef.current?.blur();
      }
      return;
    }
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[Math.min(activeIndex, results.length - 1)];
      if (item) select(item);
    }
  }

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const hasQuery = terms.length > 0;
  const groups: Array<{ kind: ResultItem["kind"]; label: string; icon: React.ReactNode }> = [
    { kind: "page", label: "Oldalak és műveletek", icon: <ArrowUpRight className="w-3.5 h-3.5" /> },
    { kind: "booking", label: "Foglalások", icon: <CalendarDays className="w-3.5 h-3.5" /> },
    { kind: "driver", label: "Sofőrök", icon: <UserCircle2 className="w-3.5 h-3.5" /> },
    { kind: "vehicle", label: "Járművek", icon: <CarFront className="w-3.5 h-3.5" /> },
  ];

  const menu =
    open && hasQuery && pos && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, maxHeight: pos.maxHeight }}
            className="z-[200] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-900/15 p-2"
            role="listbox"
            id="global-search-results"
          >
            {results.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="mx-auto mb-3 w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                  {loadingExtra ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </div>
                <div className="text-sm font-bold text-slate-700">Nincs találat</div>
                <div className="text-xs text-slate-400 mt-1">
                  Próbáld foglalási kóddal, névvel, telefonszámmal, járatszámmal, címmel, rendszámmal, vagy egy oldal nevével (pl. „járművek”).
                </div>
              </div>
            ) : (
              groups.map((group) => {
                const items = results
                  .map((r, idx) => ({ r, idx }))
                  .filter(({ r }) => r.kind === group.kind);
                if (items.length === 0) return null;
                return (
                  <div key={group.kind} className="mb-1 last:mb-0">
                    <div className="flex items-center gap-1.5 px-3 pt-2 pb-1 text-[10px] font-black tracking-[0.18em] uppercase text-slate-400">
                      {group.icon}
                      {group.label}
                      {group.kind === "booking" && totalBookingHits > 0 && (
                        <span className="ml-1 normal-case tracking-normal text-slate-300">{totalBookingHits}</span>
                      )}
                    </div>
                    {items.map(({ r, idx }) => {
                      const active = idx === activeIndex;
                      return (
                        <button
                          key={r.key}
                          type="button"
                          data-idx={idx}
                          role="option"
                          aria-selected={active}
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={() => select(r)}
                          className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-xl transition ${
                            active ? "bg-blue-50 ring-1 ring-blue-200" : "hover:bg-slate-50"
                          }`}
                        >
                          {r.kind === "page" && (
                            <SimpleRow
                              icon={r.page.icon}
                              iconClass="bg-slate-900 text-white"
                              title={r.page.label}
                              subtitle={r.page.subtitle}
                              terms={terms}
                            />
                          )}
                          {r.kind === "booking" && (
                            <BookingRow booking={r.booking} terms={terms} />
                          )}
                          {r.kind === "driver" && (
                            <SimpleRow
                              icon={<UserCircle2 className="w-4 h-4" />}
                              iconClass="bg-violet-50 text-violet-600"
                              title={r.driver.name}
                              subtitle={[r.driver.phone, r.driver.email].filter(Boolean).join(" · ")}
                              terms={terms}
                            />
                          )}
                          {r.kind === "vehicle" && (
                            <SimpleRow
                              icon={<CarFront className="w-4 h-4" />}
                              iconClass="bg-sky-50 text-sky-600"
                              title={r.vehicle.name}
                              subtitle={[r.vehicle.plates, r.vehicle.type].filter(Boolean).join(" · ")}
                              terms={terms}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
            <div className="mt-1 px-3 pt-2 pb-1 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span>↑↓ lépkedés · Enter megnyitás · Esc bezárás</span>
              {loadingExtra && <Loader2 className="w-3 h-3 animate-spin" />}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div ref={wrapperRef} className="relative group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          role="combobox"
          aria-expanded={open && hasQuery}
          aria-controls="global-search-results"
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          placeholder="Keresés (foglalás, ügyfél, jármű)…"
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            void loadExtra();
            onRefresh?.();
          }}
          onKeyDown={onKeyDown}
          className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100 transition"
        />
        {query ? (
          <button
            type="button"
            aria-label="Keresés törlése"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden xl:inline-flex px-1.5 py-0.5 rounded-md border border-slate-200 bg-white text-[10px] font-bold text-slate-400 pointer-events-none">
            /
          </kbd>
        )}
      </div>
      {menu}
    </>
  );
}

function BookingRow({ booking, terms }: { booking: SearchableBooking; terms: string[] }) {
  const s = getStatusDisplay(booking.status);
  return (
    <>
      <span className="mt-0.5 shrink-0 w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
        <CalendarDays className="w-4 h-4" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[13px] font-black text-slate-900 truncate">
            <Highlight text={booking.travelerName || "Névtelen utas"} terms={terms} />
          </span>
          <span className="text-[11px] font-black text-blue-600">
            #<Highlight text={booking.bookingCode} terms={terms} />
          </span>
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-black tracking-wider uppercase ${s.chip}`}>
            <span className={`w-1 h-1 rounded-full ${s.dot}`} />
            {s.label}
          </span>
        </span>
        <span className="block text-[11px] font-semibold text-slate-500 mt-0.5">
          {formatDate(booking.pickupDate)} · {booking.pickupTime}
          {booking.companyName ? ` · ${booking.companyName}` : ""}
        </span>
        <span className="block text-[11px] text-slate-400 truncate">
          <Highlight text={booking.fromAddress || ""} terms={terms} /> → <Highlight text={booking.toAddress || ""} terms={terms} />
        </span>
        {(booking.flightNumber || booking.assignedDriverName || booking.assignedVehicleName) && (
          <span className="block text-[10.5px] text-slate-400 truncate">
            {[booking.flightNumber, booking.assignedDriverName, booking.assignedVehicleName].filter(Boolean).join(" · ")}
          </span>
        )}
      </span>
    </>
  );
}

function SimpleRow({
  icon,
  iconClass,
  title,
  subtitle,
  terms,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  subtitle?: string;
  terms: string[];
}) {
  return (
    <>
      <span className={`mt-0.5 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${iconClass}`}>{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-black text-slate-900 truncate">
          <Highlight text={title} terms={terms} />
        </span>
        {subtitle && (
          <span className="block text-[11px] text-slate-500 truncate">
            <Highlight text={subtitle} terms={terms} />
          </span>
        )}
      </span>
    </>
  );
}
