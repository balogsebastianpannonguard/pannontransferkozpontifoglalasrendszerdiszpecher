"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserCircle2,
  Plus,
  Pencil,
  Trash2,
  Search,
  Phone,
  Mail,
  CarFront,
  Check,
  X,
  AlertTriangle,
  ArrowLeft,
  Users,
  ShieldCheck,
  Clock,
  Briefcase,
  Sparkles,
  Crown,
  Zap,
  ChevronRight,
  Activity
} from "lucide-react";
import type { Driver, DriverStatus, DriverType } from "@/lib/drivers";

const STATUS_META: Record<DriverStatus, { label: string; icon: any; dot: string; bg: string; border: string; text: string }> = {
  active: {
    label: "Aktív",
    icon: ShieldCheck,
    dot: "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-700",
  },
  inactive: {
    label: "Inaktív",
    icon: Clock,
    dot: "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-700",
  },
  on_leave: {
    label: "Szabadság",
    icon: Briefcase,
    dot: "bg-slate-400 shadow-[0_0_12px_rgba(148,163,184,0.8)]",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    text: "text-slate-700",
  },
  on_route: {
    label: "Úton van",
    icon: Zap,
    dot: "bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-700",
  },
};

const TYPE_META: Record<DriverType, {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  cardHeader: string;
  cardBg: string;
  accentText: string;
}> = {
  permanent: {
    label: "Állandó",
    badgeBg: "bg-blue-500/10",
    badgeText: "text-blue-700",
    badgeBorder: "border-blue-500/20",
    cardHeader: "bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900",
    cardBg: "bg-white",
    accentText: "text-blue-600",
  },
  substitute: {
    label: "Beugrós",
    badgeBg: "bg-violet-500/10",
    badgeText: "text-violet-700",
    badgeBorder: "border-violet-500/20",
    cardHeader: "bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950",
    cardBg: "bg-slate-50/50",
    accentText: "text-violet-600",
  },
};

const getAvatarGradient = (name: string) => {
  const hash = name.split("").reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const palettes = [
    "from-blue-500 to-cyan-400",
    "from-violet-500 to-fuchsia-400",
    "from-emerald-500 to-teal-400",
    "from-rose-500 to-orange-400",
    "from-indigo-500 to-blue-400"
  ];
  return palettes[Math.abs(hash) % palettes.length];
};

export default function DriversClient() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  const showToast = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    window.setTimeout(() => setToast(null), 3000);
  };

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/drivers");
      const data = await res.json();
      if (Array.isArray(data?.drivers)) setDrivers(data.drivers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const { permanent, substitute } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = drivers.filter(d =>
      !q || [d.name, d.phone, d.email, d.assignedVehicle, d.note].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
    return {
      permanent: filtered.filter(d => d.type === "permanent"),
      substitute: filtered.filter(d => d.type === "substitute"),
    };
  }, [drivers, search]);

  const stats = useMemo(() => ({
    total: drivers.length,
    active: drivers.filter(d => d.status === "active").length,
    permanent: drivers.filter(d => d.type === "permanent").length,
    substitute: drivers.filter(d => d.type === "substitute").length,
  }), [drivers]);

  const patchDriver = async (id: string, patch: Partial<Driver>) => {
    try {
      const res = await fetch("/api/drivers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      if (res.ok) {
        setDrivers((prev) => prev.map((d) => (d._id === id ? { ...d, ...patch, updatedAt: Date.now() } : d)));
        showToast(true, "Változások sikeresen mentve.");
        return true;
      }
      showToast(false, "Hiba történt a mentés közben.");
      return false;
    } catch {
      showToast(false, "Hálózati hiba.");
      return false;
    }
  };

  const createDriver = async (payload: Partial<Driver>) => {
    const res = await fetch("/api/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.driver) {
      setDrivers((prev) => [data.driver as Driver, ...prev]);
      showToast(true, "Új sofőr sikeresen hozzáadva.");
      return true;
    }
    showToast(false, data?.error || "Hiba történt.");
    return false;
  };

  const removeDriver = async () => {
    if (!deleteTarget?._id) return;
    const res = await fetch("/api/drivers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget._id }),
    });
    if (res.ok) {
      setDrivers((prev) => prev.filter((d) => d._id !== deleteTarget._id));
      setDeleteTarget(null);
      showToast(true, "Sofőr sikeresen törölve.");
    } else {
      showToast(false, "Hiba a törlésnél.");
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-[#F8FAFC] relative font-sans selection:bg-blue-100">
      {/* High-end decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] mix-blend-multiply animate-[pulse_8s_ease-in-out_infinite]"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-violet-400/20 rounded-full blur-[120px] mix-blend-multiply animate-[pulse_10s_ease-in-out_infinite] delay-1000"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] bg-emerald-400/20 rounded-full blur-[120px] mix-blend-multiply animate-[pulse_9s_ease-in-out_infinite] delay-2000"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      {/* FLOATING HEADER */}
      <header className="sticky top-6 z-40 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-12 transition-all duration-300">
        <div className="bg-white/70 backdrop-blur-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-5 w-full sm:w-auto">
            <button
              onClick={() => router.push("/")}
              className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200/60 flex items-center justify-center transition-all duration-300 hover:shadow-md hover:scale-105 active:scale-95 text-slate-500 hover:text-slate-900 shrink-0 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.5} />
            </button>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-blue-600 mb-1">
                <Users className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span>Csapatkezelés</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                Sofőrök
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72 group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" strokeWidth={2.5} />
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Keresés név, jármű..."
                className="w-full pl-11 pr-4 py-3 bg-white/80 border border-slate-200/80 rounded-2xl text-sm font-semibold outline-none transition-all duration-300 placeholder:text-slate-400 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 shadow-sm"
              />
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white text-sm font-bold shadow-[0_8px_20px_-6px_rgba(15,23,42,0.4)] transition-all duration-300 hover:shadow-[0_12px_24px_-6px_rgba(15,23,42,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none flex items-center gap-2 shrink-0 group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" strokeWidth={3} />
              <span className="hidden sm:inline">Új Sofőr</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          <StatCard title="Összes munkatárs" value={stats.total} icon={Users} colorClass="text-blue-600" bgClass="bg-blue-500/10" glowColor="rgba(59,130,246,0.3)" />
          <StatCard title="Aktív állomány" value={stats.active} icon={ShieldCheck} colorClass="text-emerald-600" bgClass="bg-emerald-500/10" glowColor="rgba(16,185,129,0.3)" glow />
          <StatCard title="Állandó sofőrök" value={stats.permanent} icon={Crown} colorClass="text-indigo-600" bgClass="bg-indigo-500/10" glowColor="rgba(79,70,229,0.3)" />
          <StatCard title="Beugrós sofőrök" value={stats.substitute} icon={Zap} colorClass="text-violet-600" bgClass="bg-violet-500/10" glowColor="rgba(139,92,246,0.3)" />
        </div>

        {loading ? <LoadingState /> : drivers.length === 0 ? <EmptyState onStart={() => setShowAdd(true)} /> : (
          <div className="space-y-16">

            {/* ÁLLANDÓ SZEKCIÓ */}
            {permanent.length > 0 && (
              <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center gap-4 mb-8">
                  <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100">
                    <div className="absolute inset-0 bg-blue-400/20 rounded-xl blur-md"></div>
                    <Crown className="w-5 h-5 text-blue-600 relative z-10" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      Állandó Sofőrök
                    </h2>
                    <p className="text-sm font-semibold text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      {permanent.length} fő aktív a rendszerben
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {permanent.map(d => (
                    <DriverCard key={d._id} driver={d} onEdit={() => setEditing(d)} onDelete={() => setDeleteTarget(d)} onPatch={patchDriver} />
                  ))}
                </div>
              </section>
            )}

            {/* BEUGRÓS SZEKCIÓ */}
            {substitute.length > 0 && (
              <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                <div className="flex items-center gap-4 mb-8 pt-8 relative">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                  <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100">
                    <div className="absolute inset-0 bg-violet-400/20 rounded-xl blur-md"></div>
                    <Zap className="w-5 h-5 text-violet-600 relative z-10" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      Beugrós Sofőrök
                    </h2>
                    <p className="text-sm font-semibold text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      {substitute.length} fő elérhető
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {substitute.map(d => (
                    <DriverCard key={d._id} driver={d} onEdit={() => setEditing(d)} onDelete={() => setDeleteTarget(d)} onPatch={patchDriver} />
                  ))}
                </div>
              </section>
            )}

            {permanent.length === 0 && substitute.length === 0 && search && (
              <div className="py-24 text-center rounded-[3rem] bg-white/40 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 mx-auto bg-white rounded-full shadow-sm flex items-center justify-center mb-6 relative group">
                  <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <Search className="w-10 h-10 text-slate-300 relative z-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Nincs találat</h3>
                <p className="text-base font-medium text-slate-500">Keresett kifejezés: <span className="text-slate-800 font-bold bg-slate-100 px-2 py-1 rounded-lg">"{search}"</span></p>
              </div>
            )}
          </div>
        )}
      </main>

      {(showAdd || editing) && (
        <DriverFormModal
          initial={editing}
          onClose={() => { setShowAdd(false); setEditing(null); }}
          onSubmit={async (payload: Partial<Driver>) => {
            if (editing && editing._id) {
              const ok = await patchDriver(editing._id, payload);
              if (ok) setEditing(null);
              return ok;
            } else {
              const ok = await createDriver(payload);
              if (ok) setShowAdd(false);
              return ok;
            }
          }}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          title="Sofőr törlése"
          subtitle={`Biztosan törlöd ${deleteTarget.name} adatait? Ez a művelet nem vonható vissza.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={removeDriver}
        />
      )}
      {toast && <Toast ok={toast.ok} msg={toast.msg} />}
    </div>
  );
}

/* ======= LOADING + EMPTY ======= */
function LoadingState() {
  return (
    <div className="space-y-16 animate-pulse">
      <div className="space-y-8">
        <div className="h-10 w-64 rounded-2xl bg-slate-200/60" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[460px] rounded-[2.5rem] bg-white/40 backdrop-blur-sm border border-white shadow-sm" />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="py-32 px-6 text-center rounded-[3rem] bg-white/60 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-700">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-blue-100/50 to-transparent rounded-full blur-3xl pointer-events-none group-hover:from-blue-200/50 transition-colors duration-700"></div>
      <div className="relative z-10">
        <div className="w-28 h-28 mx-auto rounded-[2.5rem] bg-gradient-to-tr from-slate-50 to-white shadow-xl border border-white flex items-center justify-center mb-8 relative">
          <div className="absolute inset-0 bg-blue-400/20 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <Activity className="w-12 h-12 text-slate-300 relative z-10 group-hover:text-blue-500 transition-colors duration-500" strokeWidth={1.5} />
        </div>
        <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Üres az állomány</h3>
        <p className="text-slate-500 font-medium mb-10 max-w-md mx-auto leading-relaxed text-lg">
          Úgy tűnik, még nem adtál hozzá munkatársat a rendszerhez. Kezdd el most a csapat építését!
        </p>
        <button
          onClick={onStart}
          className="px-10 py-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white font-bold shadow-[0_8px_20px_-6px_rgba(15,23,42,0.4)] transition-all duration-300 hover:shadow-[0_20px_30px_-6px_rgba(15,23,42,0.5)] hover:-translate-y-1 flex items-center gap-3 mx-auto text-lg group"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" strokeWidth={2.5} /> Első munkatárs hozzáadása
        </button>
      </div>
    </div>
  );
}

/* ======= STAT CARD ======= */
function StatCard({ title, value, icon: Icon, colorClass, bgClass, glowColor, glow }: any) {
  return (
    <div className={`relative overflow-hidden rounded-[2rem] p-7 bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_20px_rgb(0,0,0,0.03)] transition-all duration-500 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 group`}>
      {/* Decorative large icon background */}
      <Icon className="absolute -right-6 -bottom-6 w-32 h-32 text-slate-900/5 -rotate-12 transition-transform duration-500 group-hover:rotate-0 group-hover:scale-110" strokeWidth={1} />
      
      <div className="flex items-center gap-5 relative z-10">
        <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${bgClass} ${colorClass} shadow-inner`}>
          <Icon className="w-7 h-7 relative z-10" strokeWidth={2} />
          {glow && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${bgClass.replace('/10', '')}`} />
              <span className={`relative inline-flex rounded-full h-4 w-4 border-2 border-white ${bgClass.replace('/10', '')}`} />
            </span>
          )}
        </div>
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">{title}</div>
          <div className="text-4xl font-black text-slate-900 leading-none tracking-tighter">{value}</div>
        </div>
      </div>
    </div>
  );
}

/* ======= DRIVER CARD ======= */
function DriverCard({ driver, onPatch, onEdit, onDelete }: any) {
  const meta = STATUS_META[driver.status as DriverStatus];
  const typeMeta = TYPE_META[driver.type as DriverType];
  const StatusIcon = meta.icon;
  const avatarGrad = getAvatarGradient(driver.name);
  const initials = driver.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-[2.5rem] bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] hover:-translate-y-2 ${driver.status !== "active" ? "opacity-90 hover:opacity-100 grayscale-[0.2] hover:grayscale-0" : ""}`}>
      
      {/* CARD HEADER (Dark/Gradient) */}
      <div className={`relative h-36 ${typeMeta.cardHeader} overflow-hidden`}>
        {/* Abstract animated shapes */}
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000 delay-100"></div>
        
        {/* Shimmer effect on hover */}
        <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-hover:left-[200%] transition-all duration-1000 ease-in-out"></div>

        {/* Action Buttons */}
        <div className="absolute right-4 top-4 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
          <ActionBtn onClick={onEdit} icon={Pencil} />
          <ActionBtn onClick={onDelete} icon={Trash2} danger />
        </div>
      </div>

      {/* AVATAR & BADGES OVERLAPPING */}
      <div className="px-7 relative -mt-14 mb-4 flex justify-between items-end">
        <div className="relative group/avatar">
          <div className={`flex items-center justify-center w-[110px] h-[110px] rounded-[2rem] bg-gradient-to-br ${avatarGrad} text-white font-black text-4xl shadow-[0_12px_24px_-8px_rgba(0,0,0,0.4)] border-[6px] border-white -rotate-3 group-hover:rotate-0 transition-all duration-500 group-hover/avatar:scale-105`}>
            {initials}
          </div>
          <div className={`absolute bottom-0 right-0 w-8 h-8 rounded-full border-[4px] border-white flex items-center justify-center ${meta.dot} transition-transform duration-300 group-hover:scale-110`}></div>
        </div>

        <div className="flex flex-col items-end gap-2 pb-3">
          <Badge label={typeMeta.label} bg={typeMeta.badgeBg} color={typeMeta.badgeText} border={typeMeta.badgeBorder} icon={Sparkles} />
          <Badge label={meta.label} bg={meta.bg} color={meta.text} border={meta.border} icon={StatusIcon} />
        </div>
      </div>

      {/* CARD BODY */}
      <div className="px-7 flex-1 flex flex-col">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-4 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {driver.name}
        </h3>

        <div className="flex items-center gap-3 mb-6 bg-slate-50/80 p-3 rounded-2xl border border-slate-100 group-hover:bg-blue-50/50 transition-colors">
          <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${driver.assignedVehicle ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
            <CarFront className={`w-5 h-5 ${driver.assignedVehicle ? 'text-blue-600' : 'text-slate-400'}`} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gépjármű</span>
            <span className={`text-sm font-bold truncate ${driver.assignedVehicle ? 'text-slate-700' : 'text-slate-400 italic'}`}>
              {driver.assignedVehicle || "Nincs hozzárendelve"}
            </span>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          <InfoRow icon={Phone} label={driver.phone || "Nincs megadva telefonszám"} />
          {driver.email && <InfoRow icon={Mail} label={driver.email} />}
        </div>

        {driver.note && (
          <div className="mt-auto mb-8 flex items-start gap-3 rounded-2xl p-4 bg-amber-50 border border-amber-100/60 shadow-inner">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm font-semibold text-amber-900 leading-relaxed">{driver.note}</div>
          </div>
        )}
      </div>

      {/* CARD FOOTER (Quick Actions) */}
      <div className="p-3 mt-auto border-t border-slate-100 bg-slate-50/50 backdrop-blur-md">
        <div className="flex rounded-2xl overflow-hidden bg-slate-200/50 p-1 gap-1">
          <QuickStatusBtn label="Aktív" onClick={() => onPatch(driver._id, { status: "active" })} active={driver.status === "active"} activeColor="text-emerald-700 bg-white shadow-sm" hoverBg="hover:bg-slate-100/50" />
          <QuickStatusBtn label="Inaktív" onClick={() => onPatch(driver._id, { status: "inactive" })} active={driver.status === "inactive"} activeColor="text-amber-700 bg-white shadow-sm" hoverBg="hover:bg-slate-100/50" />
          <QuickStatusBtn label="Úton" onClick={() => onPatch(driver._id, { status: "on_route" })} active={driver.status === "on_route"} activeColor="text-blue-700 bg-white shadow-sm" hoverBg="hover:bg-slate-100/50" />
          <QuickStatusBtn label="Szabi" onClick={() => onPatch(driver._id, { status: "on_leave" })} active={driver.status === "on_leave"} activeColor="text-slate-700 bg-white shadow-sm" hoverBg="hover:bg-slate-100/50" />
        </div>
      </div>
    </div>
  );
}

function Badge({ label, bg, color, border, icon: Icon }: any) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-xl border ${border} ${bg} px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${color} shadow-sm backdrop-blur-md`}>
      {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />}
      {label}
    </span>
  );
}

function ActionBtn({ onClick, icon: Icon, danger }: any) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 transition-all duration-300 hover:scale-110 hover:bg-white/40 hover:shadow-lg ${danger ? 'text-red-200 hover:text-red-100 hover:bg-red-500/40 hover:border-red-500/50' : 'text-white'}`}
    >
      <Icon className="w-4 h-4" strokeWidth={2.5} />
    </button>
  );
}

function InfoRow({ icon: Icon, label }: any) {
  return (
    <div className="flex items-center gap-3.5 text-sm group cursor-default">
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 group-hover:border-blue-100 transition-all duration-300 group-hover:scale-110">
        <Icon className="w-4 h-4" strokeWidth={2.5} />
      </div>
      <span className="font-semibold text-slate-600 truncate group-hover:text-slate-900 transition-colors">{label}</span>
    </div>
  );
}

function QuickStatusBtn({ label, onClick, active, activeColor, hoverBg }: any) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`flex-1 flex items-center justify-center rounded-xl py-2.5 text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${active ? `${activeColor}` : `bg-transparent text-slate-500 ${hoverBg}`}`}
    >
      {label}
    </button>
  );
}

/* ======= MODALS ======= */
function DriverFormModal({ initial, onClose, onSubmit }: any) {
  const [name, setName] = useState(initial?.name || "");
  const [type, setType] = useState<DriverType>(initial?.type || "permanent");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [assignedVehicle, setAssignedVehicle] = useState(initial?.assignedVehicle || "");
  const [status, setStatus] = useState<DriverStatus>(initial?.status || "active");
  const [note, setNote] = useState(initial?.note || "");
  const [busy, setBusy] = useState(false);

  const submit = async (e: any) => {
    e.preventDefault();
    setBusy(true);
    await onSubmit({ name, type, phone, email, assignedVehicle, status, note });
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl bg-slate-900/40 animate-in fade-in duration-300" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-400 ease-out">
        
        {/* Header */}
        <div className="px-10 py-8 flex items-center justify-between border-b border-slate-100/50 bg-white/50 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest">{initial ? 'Szerkesztés' : 'Új hozzáadása'}</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {initial ? "Sofőr adatlapja" : "Új munkatárs"}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-3 rounded-2xl bg-white shadow-sm border border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-900 hover:scale-105 active:scale-95 transition-all">
            <X className="w-6 h-6" strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="p-10 overflow-y-auto flex-1 bg-slate-50/30 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <Field label="Teljes név" required mdFull>
              <Input value={name} onChange={setName} placeholder="Pl. Kovács Péter" autoFocus icon={UserCircle2} />
            </Field>

            <Field label="Foglalkoztatás típusa" required>
              <div className="flex p-1.5 rounded-2xl bg-slate-100/80 border border-slate-200/50 shadow-inner">
                <button type="button" onClick={() => setType("permanent")} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 ${type === "permanent" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  <Crown className="w-4 h-4" /> Állandó
                </button>
                <button type="button" onClick={() => setType("substitute")} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 ${type === "substitute" ? "bg-white text-violet-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  <Zap className="w-4 h-4" /> Beugrós
                </button>
              </div>
            </Field>

            <Field label="Állapot" required>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  {status === "active" ? <ShieldCheck className="w-5 h-5 text-emerald-500" /> : status === "inactive" ? <Clock className="w-5 h-5 text-amber-500" /> : status === "on_route" ? <Zap className="w-5 h-5 text-blue-500" /> : <Briefcase className="w-5 h-5 text-slate-500" />}
                </div>
                <select value={status} onChange={(e) => setStatus(e.target.value as DriverStatus)} className="w-full pl-12 pr-10 py-4 rounded-2xl outline-none font-bold appearance-none bg-white border border-slate-200 text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm group-hover:border-blue-300">
                  <option value="active">Aktív (Elérhető)</option>
                  <option value="inactive">Inaktív</option>
                  <option value="on_route">Úton van</option>
                  <option value="on_leave">Szabadságon</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronRight className="w-5 h-5 text-slate-400 rotate-90" />
                </div>
              </div>
            </Field>

            <Field label="Telefonszám" required>
              <Input value={phone} onChange={setPhone} placeholder="+36 30 123 4567" icon={Phone} />
            </Field>

            <Field label="Email cím">
              <Input value={email} onChange={setEmail} type="email" placeholder="Opcionális" icon={Mail} />
            </Field>

            <Field label="Hozzárendelt jármű" mdFull>
              <Input value={assignedVehicle} onChange={setAssignedVehicle} placeholder="pl. Mercedes V-Klass (Opcionális)" icon={CarFront} />
            </Field>

            <Field label="Megjegyzés, belső infók" mdFull>
              <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-5 py-4 rounded-2xl outline-none font-semibold resize-none bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm placeholder:text-slate-400 text-slate-700 hover:border-blue-300" placeholder="Fontos információk, preferenciák, megjegyzések..." />
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-6 flex justify-end gap-4 border-t border-slate-100/50 bg-white/50 relative z-10">
          <button type="button" onClick={onClose} className="px-6 py-4 rounded-2xl text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm">
            Mégsem
          </button>
          <button disabled={busy} type="submit" className="px-8 py-4 rounded-2xl text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_8px_20px_-6px_rgba(37,99,235,0.5)] transition-all hover:shadow-[0_12px_24px_-6px_rgba(37,99,235,0.6)] hover:-translate-y-0.5 disabled:opacity-70 disabled:pointer-events-none flex items-center gap-2">
            {busy ? "Folyamatban..." : (initial ? "Változások mentése" : "Sofőr hozzáadása")}
            {!busy && <Check className="w-4 h-4" strokeWidth={3} />}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, mdFull, children }: any) {
  return (
    <div className={`space-y-2.5 ${mdFull ? "md:col-span-2" : ""}`}>
      <label className="text-[11px] font-black text-slate-500 ml-1 uppercase tracking-widest flex items-center gap-1">
        {label} {required && <span className="text-red-500 text-lg leading-none">*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", icon: Icon, autoFocus }: any) {
  return (
    <div className="relative group">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
          <Icon className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        </div>
      )}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} className={`w-full ${Icon ? 'pl-12' : 'pl-5'} pr-5 py-4 rounded-2xl outline-none font-bold bg-white border border-slate-200 text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm placeholder:text-slate-300 placeholder:font-semibold hover:border-blue-300`} />
    </div>
  );
}

function ConfirmModal({ title, subtitle, onConfirm, onCancel }: any) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-xl bg-slate-900/60 animate-in fade-in duration-300" onClick={onCancel}>
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] p-10 text-center animate-in zoom-in-95 duration-400 ease-out border border-white" onClick={(e) => e.stopPropagation()}>
        <div className="w-24 h-24 rounded-full bg-red-50 mx-auto flex items-center justify-center mb-6 border-[8px] border-white shadow-[0_12px_24px_-8px_rgba(239,68,68,0.4)]">
          <Trash2 className="w-10 h-10 text-red-500" strokeWidth={2.5} />
        </div>
        <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">{title}</h3>
        <p className="text-base font-semibold text-slate-500 mb-10 leading-relaxed px-4">{subtitle}</p>
        <div className="flex flex-col gap-3">
          <button onClick={onConfirm} className="w-full py-4 rounded-2xl text-base font-bold bg-red-500 text-white shadow-[0_8px_20px_-6px_rgba(239,68,68,0.5)] hover:shadow-[0_12px_24px_-6px_rgba(239,68,68,0.6)] hover:-translate-y-0.5 transition-all">
            Igen, véglegesen törlöm
          </button>
          <button onClick={onCancel} className="w-full py-4 rounded-2xl text-base font-bold bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200/60">
            Mégsem, visszalépek
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ ok, msg }: { ok: boolean; msg: string }) {
  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[120] animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className={`px-6 py-4 rounded-[1.5rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] flex items-center gap-4 border-[2px] backdrop-blur-xl ${ok ? 'bg-white/90 border-emerald-100' : 'bg-white/90 border-red-100'}`}>
        <div className={`w-10 h-10 rounded-[1rem] flex items-center justify-center shadow-inner ${ok ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
          {ok ? <Check className="w-5 h-5" strokeWidth={3} /> : <AlertTriangle className="w-5 h-5" strokeWidth={3} />}
        </div>
        <div className="text-base font-black text-slate-800 pr-3 tracking-tight">{msg}</div>
      </div>
    </div>
  );
}
