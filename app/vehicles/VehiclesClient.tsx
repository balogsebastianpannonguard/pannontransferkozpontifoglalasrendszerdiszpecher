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
  Activity
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
  { label: string; icon: any; textColor: string; backgroundColor: string; borderColor: string }
> = {
  working: {
    label: "Működik",
    icon: ShieldCheck,
    textColor: "#047857",
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
  },
  debrecen_only: {
    label: "Csak Debrecen",
    icon: MapPin,
    textColor: "#b45309",
    backgroundColor: "#fffbeb",
    borderColor: "#fcd34d",
  },
  not_working: {
    label: "Nem működik",
    icon: AlertTriangle,
    textColor: "#be123c",
    backgroundColor: "#fff1f2",
    borderColor: "#fda4af",
  },
};

// Inline gradients guarantee they won't be purged by Tailwind JIT issues
const getGradientCSS = (type: string, isParked: boolean) => {
  if (isParked) return "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)";
  const t = type.toLowerCase();
  if (t.includes("mercedes")) return "linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #6d28d9 100%)";
  if (t.includes("skoda")) return "linear-gradient(135deg, #10b981 0%, #0d9488 50%, #0e7490 100%)";
  if (t.includes("ford")) return "linear-gradient(135deg, #f43f5e 0%, #dc2626 50%, #ea580c 100%)";
  if (t.includes("opel")) return "linear-gradient(135deg, #c026d3 0%, #9333ea 50%, #4338ca 100%)";
  if (t.includes("toyota")) return "linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #e11d48 100%)";
  return "linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)";
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
    <div
      className="min-h-screen text-slate-900 pb-24"
      style={{
        backgroundColor: "#f8fafc",
        backgroundImage:
          "radial-gradient(circle at top left, rgba(59,130,246,0.08), transparent 28%), radial-gradient(circle at top right, rgba(99,102,241,0.08), transparent 22%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
      }}
    >
      {/* Modern Compact Header */}
      <header
        className="sticky top-0 z-40 border-b border-slate-200 shadow-sm"
        style={{ backgroundColor: "rgba(255,255,255,0.88)", backdropFilter: "blur(18px)" }}
      >
        <div className="max-w-[1880px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
              title="Vissza"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="text-[9px] font-black tracking-widest text-blue-600 uppercase flex items-center gap-1.5">
                <CarFront className="w-3 h-3" />
                Flottakezelő
              </div>
              <h1 className="text-lg font-black tracking-tight text-slate-900">Járművek</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Keresés..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-slate-400"
                style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}
              />
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="px-5 py-2 rounded-lg text-white text-xs font-bold uppercase tracking-widest shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2"
              style={{ backgroundImage: "linear-gradient(90deg, #0f172a, #1e293b)" }}
            >
              <Plus className="w-4 h-4" strokeWidth={3} />
              Új jármű
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1880px] mx-auto px-6 mt-6">
        {/* Compact Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Összes jármű" value={stats.total} icon={CarFront} tone={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0", color: "#475569" }} />
          <StatCard title="Úton van" value={stats.onRoute} icon={Activity} tone={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe", color: "#2563eb" }} />
          <StatCard title="Működik" value={stats.working} icon={ShieldCheck} tone={{ backgroundColor: "#ecfdf5", borderColor: "#a7f3d0", color: "#059669" }} />
          <StatCard title="Szervizben" value={stats.broken} icon={AlertTriangle} tone={{ backgroundColor: "#fff1f2", borderColor: "#fda4af", color: "#e11d48" }} />
        </div>

        {/* Compact Filters */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-2.5 rounded-2xl border shadow-sm"
          style={{ backgroundColor: "rgba(255,255,255,0.9)", borderColor: "#e2e8f0", backdropFilter: "blur(16px)" }}
        >
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            <FilterTab active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>Összes</FilterTab>
            <FilterTab active={statusFilter === "parked"} onClick={() => setStatusFilter("parked")} dot="#94a3b8">Áll / Szabad</FilterTab>
            <FilterTab active={statusFilter === "on_route"} onClick={() => setStatusFilter("on_route")} dot="#3b82f6">Úton van</FilterTab>
            <div className="w-px h-5 bg-slate-200 mx-2 shrink-0" />
            <FilterTab active={conditionFilter === "working"} onClick={() => setConditionFilter("working")}>Működik</FilterTab>
            <FilterTab active={conditionFilter === "not_working"} onClick={() => setConditionFilter("not_working")}>Hibás</FilterTab>
          </div>
          <div className="text-[11px] font-bold text-slate-400 px-3 uppercase tracking-widest whitespace-nowrap">
            <span className="text-slate-900">{filtered.length}</span> találat
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-72 rounded-[24px] bg-white border border-slate-200/80 animate-pulse shadow-sm" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-[24px] border border-slate-200/80 border-dashed shadow-sm">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Nincs találat</h3>
            <p className="text-sm font-semibold text-slate-500 mt-1">Próbáld módosítani a szűrőket vagy a keresést.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filtered.map((v) => (
              <VehicleCard key={v._id} vehicle={v} onPatch={patchVehicle} onEdit={() => setEditing(v)} onDelete={() => setDeleteTarget(v)} />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {(showAdd || editing) && (
        <VehicleFormModal
          initial={editing}
          onClose={() => {
            setShowAdd(false);
            setEditing(null);
          }}
          onSubmit={async (payload: Partial<Vehicle>) => {
            if (editing) {
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

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className={`px-4 py-2.5 rounded-lg shadow-xl border flex items-center gap-2 ${
            toast.ok 
              ? "bg-emerald-50 border-emerald-200 text-emerald-900" 
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}>
            {toast.ok ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span className="text-xs font-bold uppercase tracking-widest">{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, tone }: any) {
  return (
    <div className="p-4 rounded-[24px] bg-white border border-slate-200 flex items-center gap-4 transition-all" style={{ boxShadow: "0 12px 30px -24px rgba(15,23,42,0.35)" }}>
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
        style={{
          backgroundColor: tone.backgroundColor,
          borderColor: tone.borderColor,
          color: tone.color,
        }}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-black text-slate-900 leading-none tracking-tight">{value}</div>
        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">{title}</div>
      </div>
    </div>
  );
}

function FilterTab({ active, onClick, children, dot }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
        active 
          ? "text-white shadow-sm" 
          : "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
      style={active ? { backgroundImage: "linear-gradient(90deg, #0f172a, #1e293b)" } : {}}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dot }} />}
      {children}
    </button>
  );
}

function VehicleCard({ vehicle, onPatch, onEdit, onDelete }: any) {
  const isParked = vehicle.status === "parked";
  const cond = CONDITION_META[vehicle.condition as VehicleCondition];
  const CondIcon = cond.icon;

  return (
    <div className="bg-white rounded-[24px] border border-slate-200/80 transition-all duration-300 flex flex-col overflow-hidden group hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50" style={{ boxShadow: "0 12px 32px -16px rgba(15,23,42,0.1)" }}>
      {/* Banner */}
      <div
        className="h-[136px] w-full p-5 flex flex-col justify-between relative overflow-hidden"
        style={{ backgroundImage: getGradientCSS(vehicle.type, isParked) }}
      >
        {/* Subtle top glare */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex justify-between items-start">
          <div className="px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm"
               style={{ backgroundColor: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.2)", color: "#ffffff", backdropFilter: "blur(8px)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isParked ? "#cbd5e1" : "#ffffff", animation: isParked ? "none" : "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite", boxShadow: isParked ? "none" : "0 0 8px rgba(255,255,255,0.8)" }} />
            {isParked ? "Áll / Szabad" : "Úton van"}
          </div>

          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
             <button onClick={onEdit} className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 flex items-center justify-center text-white transition-all shadow-sm"><Pencil className="w-3.5 h-3.5" /></button>
             <button onClick={onDelete} className="w-8 h-8 rounded-lg bg-white/20 hover:bg-rose-500/80 hover:border-rose-400 backdrop-blur-md border border-white/30 flex items-center justify-center text-white transition-all shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        <div className="relative z-10 mt-auto">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] truncate mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>{vehicle.type}</div>
          <div className="text-xl font-black text-white truncate tracking-tight drop-shadow-md">{vehicle.name}</div>
        </div>

        <CarFront className="absolute -bottom-6 -right-4 w-28 h-28 transform group-hover:scale-110 transition-transform duration-700 ease-out" style={{ color: "rgba(255,255,255,0.07)" }} strokeWidth={1} />
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col bg-white">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-5">
          <div
            className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border"
            style={{
              backgroundColor: cond.backgroundColor,
              borderColor: cond.borderColor,
              color: cond.textColor,
            }}
          >
            <CondIcon className="w-3.5 h-3.5" /> {cond.label}
          </div>
          {vehicle.seats && (
            <div
              className="px-2.5 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"
              style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0", color: "#475569" }}
            >
              <Users className="w-3.5 h-3.5" /> {vehicle.seats} fős
            </div>
          )}
        </div>

        {/* Data Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3 rounded-xl border shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" style={{ backgroundColor: "#f8fafc", borderColor: "#f1f5f9" }}>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
              <Hash className="w-3 h-3 text-slate-300" /> Rendszám
            </div>
            <div className="text-[13px] font-black text-slate-900 uppercase tracking-wide">{vehicle.plates || "—"}</div>
          </div>
          <div className="p-3 rounded-xl border shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" style={{ backgroundColor: "#f8fafc", borderColor: "#f1f5f9" }}>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
              <Palette className="w-3 h-3 text-slate-300" /> Szín
            </div>
            <div className="text-[13px] font-black text-slate-900 truncate">{vehicle.color || "—"}</div>
          </div>
        </div>

        {/* Note */}
        {vehicle.note && (
          <div className="mb-5 p-3 rounded-xl border flex items-start gap-2.5" style={{ backgroundColor: "#fffbeb", borderColor: "#fde68a" }}>
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-[11px] font-bold text-amber-900 leading-snug">{vehicle.note}</div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-auto pt-1">
          <button
            onClick={() => onPatch(vehicle._id, { status: isParked ? "on_route" : "parked" })}
            className="w-full py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border shadow-sm hover:-translate-y-0.5 hover:shadow-md"
            style={
              isParked
                ? { backgroundColor: "#0f172a", borderColor: "#0f172a", color: "#ffffff" }
                : { backgroundColor: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }
            }
          >
            {isParked ? "Indítás útra" : "Parkolásba rakás"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()} className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="text-[9px] font-bold tracking-widest text-blue-600 uppercase mb-1">
              {initial ? "Szerkesztés" : "Hozzáadás"}
            </div>
            <h2 className="text-xl font-black text-slate-900">{initial ? "Jármű módosítása" : "Új jármű rögzítése"}</h2>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors shadow-sm">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Megjelenítendő név *</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm font-bold" placeholder="pl. Mercedes V-Klass #1" />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Típus *</label>
              <input required value={type} onChange={e => setType(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm font-bold" placeholder="pl. Mercedes V-Klass" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Rendszám</label>
              <input value={plates} onChange={e => setPlates(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm font-bold uppercase" placeholder="ABC-123" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Szín</label>
              <input value={color} onChange={e => setColor(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm font-bold" placeholder="Fekete" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Ülések száma</label>
              <input type="number" value={seats} onChange={e => setSeats(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm font-bold" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Státusz</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm font-bold appearance-none">
                <option value="parked">Áll / Szabad</option>
                <option value="on_route">Úton van</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Állapot</label>
              <select value={condition} onChange={e => setCondition(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm font-bold appearance-none">
                <option value="working">Működik</option>
                <option value="debrecen_only">Csak Debrecen</option>
                <option value="not_working">Nem működik</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Megjegyzés</label>
            <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm font-bold resize-none" placeholder="Opcionális megjegyzés a járműhöz..." />
          </div>
        </div>

        <div className="px-6 py-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-200 transition-colors">
            Mégsem
          </button>
          <button disabled={busy} type="submit" className="px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest text-white shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-70" style={{ backgroundImage: "linear-gradient(90deg, #0f172a, #1e293b)" }}>
            <Check className="w-4 h-4" /> Mentés
          </button>
        </div>
      </form>
    </div>
  );
}

function ConfirmModal({ title, subtitle, onConfirm, onCancel }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
        <p className="text-sm font-semibold text-slate-600 mb-6 leading-relaxed">{subtitle}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">Mégsem</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-colors">Törlés</button>
        </div>
      </div>
    </div>
  );
}
