"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CarFront,
  Plus,
  Pencil,
  Trash2,
  Search,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  X,
  Check,
  Users,
  Hash,
  Palette,
  Activity,
  ChevronRight,
  Sparkles
} from "lucide-react";

type VehicleStatus = "parked" | "on_route";
type VehicleCondition = "working" | "debrecen_only" | "not_working";

interface Vehicle {
  _id: string;
  name: string;
  type: string;
  plates?: string;
  seats?: number;
  color?: string;
  status: VehicleStatus;
  condition: VehicleCondition;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

const CONDITION_META: Record<
  VehicleCondition,
  { label: string; icon: any; textColor: string; backgroundColor: string; borderColor: string; dot: string }
> = {
  working: {
    label: "Működik",
    icon: ShieldCheck,
    textColor: "text-emerald-700",
    backgroundColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    dot: "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]"
  },
  debrecen_only: {
    label: "Csak Debrecen",
    icon: MapPin,
    textColor: "text-amber-700",
    backgroundColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    dot: "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]"
  },
  not_working: {
    label: "Nem működik",
    icon: AlertTriangle,
    textColor: "text-rose-700",
    backgroundColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
    dot: "bg-rose-500 shadow-[0_0_12px_rgba(225,29,72,0.8)]"
  },
};

const getGradientCSS = (type: string, isParked: boolean) => {
  if (isParked) return "linear-gradient(135deg, #0f172a 0%, #334155 100%)";
  const t = type.toLowerCase();
  if (t.includes("mercedes")) return "linear-gradient(135deg, #1e3a8a 0%, #312e81 50%, #4c1d95 100%)";
  if (t.includes("skoda")) return "linear-gradient(135deg, #064e3b 0%, #134e4a 50%, #164e63 100%)";
  if (t.includes("ford")) return "linear-gradient(135deg, #881337 0%, #7f1d1d 50%, #7c2d12 100%)";
  if (t.includes("opel")) return "linear-gradient(135deg, #4a044e 0%, #581c87 50%, #312e81 100%)";
  if (t.includes("toyota")) return "linear-gradient(135deg, #78350f 0%, #7c2d12 50%, #881337 100%)";
  return "linear-gradient(135deg, #1e40af 0%, #3730a3 50%, #5b21b6 100%)";
};

export default function VehiclesClient() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | VehicleStatus>("all");
  const [conditionFilter, setConditionFilter] = useState<"all" | VehicleCondition>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  const showToast = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    window.setTimeout(() => setToast(null), 3000);
  };

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vehicles");
      const data = await res.json();
      if (Array.isArray(data?.vehicles)) setVehicles(data.vehicles);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const stats = useMemo(() => {
    const total = vehicles.length;
    const onRoute = vehicles.filter((v) => v.status === "on_route").length;
    const working = vehicles.filter((v) => v.condition === "working").length;
    const broken = vehicles.filter((v) => v.condition === "not_working").length;
    return { total, onRoute, working, broken };
  }, [vehicles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vehicles.filter((v) => {
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
      if (conditionFilter !== "all" && v.condition !== conditionFilter) return false;
      if (!q) return true;
      return [v.name, v.type, v.plates, v.color, v.note].filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [vehicles, search, statusFilter, conditionFilter]);

  const patchVehicle = async (id: string, patch: Partial<Vehicle>) => {
    try {
      const res = await fetch("/api/vehicles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      if (res.ok) {
        setVehicles((prev) => prev.map((v) => (v._id === id ? { ...v, ...patch, updatedAt: Date.now() } : v)));
        showToast(true, "Változások mentve");
        return true;
      }
      showToast(false, "Hiba a mentés közben");
      return false;
    } catch {
      showToast(false, "Hálózati hiba");
      return false;
    }
  };

  const createVehicle = async (payload: Partial<Vehicle>) => {
    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.vehicle) {
      setVehicles((prev) => [data.vehicle as Vehicle, ...prev]);
      showToast(true, "Jármű hozzáadva");
      return true;
    }
    showToast(false, data?.error || "Hiba");
    return false;
  };

  const removeVehicle = async () => {
    if (!deleteTarget) return;
    const res = await fetch("/api/vehicles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget._id }),
    });
    if (res.ok) {
      setVehicles((prev) => prev.filter((v) => v._id !== deleteTarget._id));
      setDeleteTarget(null);
      showToast(true, "Jármű törölve");
    } else {
      showToast(false, "Hiba a törlésnél");
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
                <CarFront className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span>Flottakezelő</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                Járműpark
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
                placeholder="Keresés típus, rendszám..."
                className="w-full pl-11 pr-4 py-3 bg-white/80 border border-slate-200/80 rounded-2xl text-sm font-semibold outline-none transition-all duration-300 placeholder:text-slate-400 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 shadow-sm"
              />
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white text-sm font-bold shadow-[0_8px_20px_-6px_rgba(15,23,42,0.4)] transition-all duration-300 hover:shadow-[0_12px_24px_-6px_rgba(15,23,42,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none flex items-center gap-2 shrink-0 group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" strokeWidth={3} />
              <span className="hidden sm:inline">Új Jármű</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <StatCard title="Összes jármű" value={stats.total} icon={CarFront} colorClass="text-blue-600" bgClass="bg-blue-500/10" glowColor="rgba(59,130,246,0.3)" />
          <StatCard title="Úton van" value={stats.onRoute} icon={Activity} colorClass="text-indigo-600" bgClass="bg-indigo-500/10" glowColor="rgba(79,70,229,0.3)" glow />
          <StatCard title="Működik" value={stats.working} icon={ShieldCheck} colorClass="text-emerald-600" bgClass="bg-emerald-500/10" glowColor="rgba(16,185,129,0.3)" />
          <StatCard title="Szervizben" value={stats.broken} icon={AlertTriangle} colorClass="text-rose-600" bgClass="bg-rose-500/10" glowColor="rgba(225,29,72,0.3)" />
        </div>

        {/* GLASS FILTER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 p-3 rounded-[2rem] bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide px-2">
            <FilterTab active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>Összes</FilterTab>
            <FilterTab active={statusFilter === "parked"} onClick={() => setStatusFilter("parked")} dot="#94a3b8">Áll / Szabad</FilterTab>
            <FilterTab active={statusFilter === "on_route"} onClick={() => setStatusFilter("on_route")} dot="#3b82f6">Úton van</FilterTab>
            <div className="w-px h-6 bg-slate-200/80 mx-2 shrink-0" />
            <FilterTab active={conditionFilter === "working"} onClick={() => setConditionFilter("working")}>Működik</FilterTab>
            <FilterTab active={conditionFilter === "not_working"} onClick={() => setConditionFilter("not_working")}>Hibás</FilterTab>
          </div>
          <div className="text-[11px] font-black text-slate-400 px-4 uppercase tracking-widest whitespace-nowrap bg-white py-2 rounded-xl shadow-sm border border-slate-100">
            <span className="text-slate-900">{filtered.length}</span> jármű
          </div>
        </div>

        {loading ? <LoadingState /> : filtered.length === 0 ? <EmptyState onStart={() => setShowAdd(true)} /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {filtered.map((v) => (
              <VehicleCard key={v._id} vehicle={v} onPatch={patchVehicle} onEdit={() => setEditing(v)} onDelete={() => setDeleteTarget(v)} />
            ))}
          </div>
        )}
      </main>

      {(showAdd || editing) && (
        <VehicleFormModal
          initial={editing}
          onClose={() => { setShowAdd(false); setEditing(null); }}
          onSubmit={async (payload: Partial<Vehicle>) => {
            if (editing && editing._id) {
              const ok = await patchVehicle(editing._id, payload);
              if (ok) setEditing(null);
              return ok;
            } else {
              const ok = await createVehicle(payload);
              if (ok) setShowAdd(false);
              return ok;
            }
          }}
        />
      )}
      
      {deleteTarget && (
        <ConfirmModal
          title="Jármű törlése"
          subtitle={`Biztosan törlöd a(z) ${deleteTarget.name} járművet? Ez a művelet nem vonható vissza.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={removeVehicle}
        />
      )}
      
      {toast && <Toast ok={toast.ok} msg={toast.msg} />}
    </div>
  );
}

/* ======= STAT CARD ======= */
function StatCard({ title, value, icon: Icon, colorClass, bgClass, glowColor, glow }: any) {
  return (
    <div className={`relative overflow-hidden rounded-[2rem] p-7 bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_20px_rgb(0,0,0,0.03)] transition-all duration-500 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 group`}>
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

function FilterTab({ active, onClick, children, dot }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 whitespace-nowrap shrink-0 ${
        active 
          ? "bg-slate-900 text-white shadow-[0_8px_16px_-6px_rgba(15,23,42,0.4)]" 
          : "bg-transparent text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm"
      }`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" : ""}`} style={!active ? { backgroundColor: dot } : {}} />}
      {children}
    </button>
  );
}

/* ======= VEHICLE CARD ======= */
function VehicleCard({ vehicle, onPatch, onEdit, onDelete }: any) {
  const isParked = vehicle.status === "parked";
  const cond = CONDITION_META[vehicle.condition as VehicleCondition];
  const CondIcon = cond.icon;

  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-[2.5rem] bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] hover:-translate-y-2 ${vehicle.condition === 'not_working' ? 'grayscale-[0.3]' : ''}`}>
      
      {/* Header Banner */}
      <div 
        className="relative h-44 w-full p-7 flex flex-col justify-between overflow-hidden"
        style={{ backgroundImage: getGradientCSS(vehicle.type, isParked) }}
      >
        {/* Shimmer effect on hover */}
        <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-hover:left-[200%] transition-all duration-1000 ease-in-out pointer-events-none z-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-black/20 pointer-events-none" />

        <div className="relative z-20 flex justify-between items-start">
          <div className="px-3 py-1.5 rounded-xl border border-white/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm bg-black/20 backdrop-blur-md text-white">
            <span className={`w-2 h-2 rounded-full ${!isParked && 'animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]'}`} style={{ backgroundColor: isParked ? "#cbd5e1" : "#ffffff" }} />
            {isParked ? "Áll / Szabad" : "Úton van"}
          </div>

          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-2 group-hover:translate-x-0">
             <button onClick={onEdit} className="w-10 h-10 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 flex items-center justify-center text-white transition-all shadow-sm hover:scale-110"><Pencil className="w-4 h-4" /></button>
             <button onClick={onDelete} className="w-10 h-10 rounded-2xl bg-white/20 hover:bg-rose-500/80 hover:border-rose-400 backdrop-blur-md border border-white/30 flex items-center justify-center text-white transition-all shadow-sm hover:scale-110"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="relative z-20 mt-auto">
          <div className="text-[11px] font-black uppercase tracking-[0.2em] truncate mb-1 text-white/70">{vehicle.type}</div>
          <div className="text-2xl font-black text-white truncate tracking-tight drop-shadow-lg">{vehicle.name}</div>
        </div>

        <CarFront className="absolute -bottom-6 -right-4 w-36 h-36 transform group-hover:scale-110 transition-transform duration-700 ease-out text-white/10" strokeWidth={1} />
      </div>

      {/* Body */}
      <div className="p-7 flex-1 flex flex-col">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border shadow-sm backdrop-blur-md ${cond.backgroundColor} ${cond.borderColor} ${cond.textColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cond.dot}`} />
            <CondIcon className="w-3.5 h-3.5" /> {cond.label}
          </div>
          {vehicle.seats && (
            <div className="px-3 py-1.5 rounded-xl border bg-slate-50 border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
              <Users className="w-3.5 h-3.5" /> {vehicle.seats} fős
            </div>
          )}
        </div>

        {/* Data Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/80 group-hover:bg-white transition-colors">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-300" /> Rendszám
            </div>
            <div className="text-sm font-black text-slate-900 uppercase tracking-wide">{vehicle.plates || "—"}</div>
          </div>
          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/80 group-hover:bg-white transition-colors">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
              <Palette className="w-3.5 h-3.5 text-slate-300" /> Szín
            </div>
            <div className="text-sm font-black text-slate-900 truncate">{vehicle.color || "—"}</div>
          </div>
        </div>

        {/* Note */}
        {vehicle.note && (
          <div className="mb-6 p-4 rounded-2xl border border-amber-100/60 bg-amber-50 shadow-inner flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs font-bold text-amber-900 leading-relaxed">{vehicle.note}</div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-auto pt-2">
          <button
            onClick={() => onPatch(vehicle._id, { status: isParked ? "on_route" : "parked" })}
            className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_8px_16px_-6px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 hover:shadow-[0_12px_20px_-6px_rgba(0,0,0,0.3)] ${
              isParked
                ? "bg-gradient-to-r from-slate-900 to-slate-800 text-white"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
            }`}
          >
            {isParked ? "Indítás útra" : "Parkolásba rakás"}
            <ChevronRight className="w-4 h-4" strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ======= MODALS ======= */
function VehicleFormModal({ initial, onClose, onSubmit }: any) {
  const [name, setName] = useState(initial?.name || "");
  const [type, setType] = useState(initial?.type || "");
  const [plates, setPlates] = useState(initial?.plates || "");
  const [seats, setSeats] = useState(initial?.seats?.toString() || "5");
  const [color, setColor] = useState(initial?.color || "");
  const [status, setStatus] = useState(initial?.status || "parked");
  const [condition, setCondition] = useState(initial?.condition || "working");
  const [note, setNote] = useState(initial?.note || "");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await onSubmit({
      name, type, plates, seats: seats ? parseInt(seats) : undefined, color, status, condition, note
    });
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
              {initial ? "Jármű adatlapja" : "Új jármű rögzítése"}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-3 rounded-2xl bg-white shadow-sm border border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-900 hover:scale-105 active:scale-95 transition-all">
            <X className="w-6 h-6" strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="p-10 overflow-y-auto flex-1 bg-slate-50/30 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <Field label="Megjelenítendő név" required mdFull>
              <Input value={name} onChange={setName} placeholder="pl. Mercedes V-Klass #1" autoFocus icon={CarFront} />
            </Field>

            <Field label="Típus" required>
              <Input value={type} onChange={setType} placeholder="pl. Mercedes V-Klass" />
            </Field>

            <Field label="Rendszám">
              <Input value={plates} onChange={setPlates} placeholder="ABC-123" icon={Hash} />
            </Field>

            <Field label="Szín">
              <Input value={color} onChange={setColor} placeholder="Fekete" icon={Palette} />
            </Field>

            <Field label="Ülések száma">
              <Input type="number" value={seats} onChange={setSeats} placeholder="5" icon={Users} />
            </Field>

            <Field label="Státusz">
              <div className="relative group">
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-5 py-4 rounded-2xl outline-none font-bold appearance-none bg-white border border-slate-200 text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm group-hover:border-blue-300">
                  <option value="parked">Áll / Szabad</option>
                  <option value="on_route">Úton van</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronRight className="w-5 h-5 text-slate-400 rotate-90" />
                </div>
              </div>
            </Field>

            <Field label="Állapot">
              <div className="relative group">
                <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full px-5 py-4 rounded-2xl outline-none font-bold appearance-none bg-white border border-slate-200 text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm group-hover:border-blue-300">
                  <option value="working">Működik</option>
                  <option value="debrecen_only">Csak Debrecen</option>
                  <option value="not_working">Nem működik</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronRight className="w-5 h-5 text-slate-400 rotate-90" />
                </div>
              </div>
            </Field>

            <Field label="Megjegyzés, belső infók" mdFull>
              <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-5 py-4 rounded-2xl outline-none font-semibold resize-none bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm placeholder:text-slate-400 text-slate-700 hover:border-blue-300" placeholder="Opcionális megjegyzés a járműhöz..." />
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-6 flex justify-end gap-4 border-t border-slate-100/50 bg-white/50 relative z-10">
          <button type="button" onClick={onClose} className="px-6 py-4 rounded-2xl text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm">
            Mégsem
          </button>
          <button disabled={busy} type="submit" className="px-8 py-4 rounded-2xl text-sm font-bold bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-[0_8px_20px_-6px_rgba(15,23,42,0.5)] transition-all hover:shadow-[0_12px_24px_-6px_rgba(15,23,42,0.6)] hover:-translate-y-0.5 disabled:opacity-70 disabled:pointer-events-none flex items-center gap-2">
            {busy ? "Folyamatban..." : (initial ? "Változások mentése" : "Jármű hozzáadása")}
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

/* ======= LOADING + EMPTY ======= */
function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="h-[460px] rounded-[2.5rem] bg-white/40 backdrop-blur-sm border border-white shadow-sm" />
      ))}
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
          <Search className="w-12 h-12 text-slate-300 relative z-10 group-hover:text-blue-500 transition-colors duration-500" strokeWidth={1.5} />
        </div>
        <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Nincs jármű a rendszerben</h3>
        <p className="text-slate-500 font-medium mb-10 max-w-md mx-auto leading-relaxed text-lg">
          Úgy tűnik, még nem rögzítettél járművet vagy nem található a szűrésnek megfelelő eredmény.
        </p>
        <button
          onClick={onStart}
          className="px-10 py-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white font-bold shadow-[0_8px_20px_-6px_rgba(15,23,42,0.4)] transition-all duration-300 hover:shadow-[0_20px_30px_-6px_rgba(15,23,42,0.5)] hover:-translate-y-1 flex items-center gap-3 mx-auto text-lg group"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" strokeWidth={2.5} /> Jármű hozzáadása
        </button>
      </div>
    </div>
  );
}
