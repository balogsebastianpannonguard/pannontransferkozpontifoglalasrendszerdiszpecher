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
  Briefcase
} from "lucide-react";
import type { Driver, DriverStatus, DriverType } from "@/lib/drivers";

const STATUS_META: Record<DriverStatus, { label: string; icon: any; dot: string; color: string; bg: string; border: string }> = {
  active: {
    label: "Aktív",
    icon: ShieldCheck,
    dot: "#10b981", // emerald-500
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200"
  },
  inactive: {
    label: "Inaktív",
    icon: Clock,
    dot: "#f59e0b", // amber-500
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200"
  },
  on_leave: {
    label: "Szabadságon",
    icon: Briefcase,
    dot: "#8b5cf6", // violet-500
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200"
  },
};

// Abstract Avatar Gradients based on driver name hash
const getAvatarGradient = (name: string) => {
  const hash = name.split("").reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const colors = [
    "from-blue-500 to-indigo-600",
    "from-emerald-400 to-teal-600",
    "from-amber-400 to-orange-500",
    "from-rose-400 to-red-600",
    "from-violet-500 to-fuchsia-600",
    "from-cyan-400 to-blue-600",
  ];
  return colors[Math.abs(hash) % colors.length];
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
      substitute: filtered.filter(d => d.type === "substitute")
    };
  }, [drivers, search]);

  const stats = useMemo(() => {
    return {
      total: drivers.length,
      active: drivers.filter(d => d.status === "active").length,
      permanent: drivers.filter(d => d.type === "permanent").length,
      substitute: drivers.filter(d => d.type === "substitute").length,
    };
  }, [drivers]);

  const patchDriver = async (id: string, patch: Partial<Driver>) => {
    try {
      const res = await fetch("/api/drivers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      if (res.ok) {
        setDrivers((prev) => prev.map((d) => (d._id === id ? { ...d, ...patch, updatedAt: Date.now() } : d)));
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

  const createDriver = async (payload: Partial<Driver>) => {
    const res = await fetch("/api/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.driver) {
      setDrivers((prev) => [data.driver as Driver, ...prev]);
      showToast(true, "Sofőr hozzáadva");
      return true;
    }
    showToast(false, data?.error || "Hiba");
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
      showToast(true, "Sofőr törölve");
    } else {
      showToast(false, "Hiba a törlésnél");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-24">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button
              onClick={() => router.push("/")}
              className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 shadow-sm"
              title="Vissza"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="text-[10px] font-black tracking-[0.25em] text-blue-600 uppercase mb-0.5 flex items-center gap-1.5">
                <UserCircle2 className="w-3.5 h-3.5" />
                Munkatársak
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Sofőrök kezelése</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Keresés név, telefon, jármű..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100/70 border border-slate-200/80 rounded-xl text-sm font-bold focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder-slate-400"
              />
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" strokeWidth={3} />
              Új Sofőr
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8">
        {/* Elegant Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
          <StatCard title="Összes sofőr" value={stats.total} icon={Users} color="text-slate-600" bg="bg-white border-slate-200" />
          <StatCard title="Aktív állomány" value={stats.active} icon={ShieldCheck} color="text-emerald-600" bg="bg-white border-slate-200" glow />
          <StatCard title="Állandós" value={stats.permanent} icon={Briefcase} color="text-blue-600" bg="bg-white border-slate-200" />
          <StatCard title="Beugrós" value={stats.substitute} icon={Clock} color="text-purple-600" bg="bg-white border-slate-200" />
        </div>

        {loading ? (
          <div className="space-y-12">
            <div className="space-y-4">
              <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white rounded-3xl border border-slate-200 animate-pulse shadow-sm" />)}
              </div>
            </div>
          </div>
        ) : drivers.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-[32px] border border-slate-200 border-dashed shadow-sm">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
              <UserCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Nincs még sofőr rögzítve</h3>
            <p className="text-sm font-semibold text-slate-500 mt-2">Kattints az "Új Sofőr" gombra a munkatársak felvételéhez.</p>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* ÁLLANDÓS SZEKCIÓ */}
            {permanent.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-6 rounded-full bg-blue-500" />
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Állandó Sofőrök</h2>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">{permanent.length} fő</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {permanent.map(driver => (
                    <DriverCard key={driver._id} driver={driver} onEdit={() => setEditing(driver)} onDelete={() => setDeleteTarget(driver)} onPatch={patchDriver} isLarge />
                  ))}
                </div>
              </section>
            )}

            {/* BEUGRÓS SZEKCIÓ */}
            {substitute.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6 pt-6 border-t border-slate-200/60">
                  <div className="w-1.5 h-6 rounded-full bg-purple-500" />
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Beugrós Sofőrök</h2>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold border border-purple-100">{substitute.length} fő</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {substitute.map(driver => (
                    <DriverCard key={driver._id} driver={driver} onEdit={() => setEditing(driver)} onDelete={() => setDeleteTarget(driver)} onPatch={patchDriver} isLarge={false} />
                  ))}
                </div>
              </section>
            )}

            {permanent.length === 0 && substitute.length === 0 && search && (
               <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
                 <h3 className="text-lg font-black text-slate-900">Nincs találat a keresésre: "{search}"</h3>
               </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {(showAdd || editing) && (
        <DriverFormModal
          initial={editing}
          onClose={() => {
            setShowAdd(false);
            setEditing(null);
          }}
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className={`px-5 py-3 rounded-xl shadow-2xl border flex items-center gap-2.5 backdrop-blur-xl ${
            toast.ok ? "bg-emerald-50/90 border-emerald-200 text-emerald-900" : "bg-rose-50/90 border-rose-200 text-rose-900"
          }`}>
            {toast.ok ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="text-sm font-bold tracking-wide">{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, bg, color, glow }: any) {
  return (
    <div className={`p-5 rounded-[24px] border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow ${bg}`}>
      <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-slate-50 border border-slate-100 ${color}`}>
        <Icon className="w-5 h-5" />
        {glow && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-black text-slate-900 leading-none tracking-tight">{value}</div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{title}</div>
      </div>
    </div>
  );
}

function DriverCard({ driver, onPatch, onEdit, onDelete, isLarge }: any) {
  const meta = STATUS_META[driver.status as DriverStatus];
  const avatarGrad = getAvatarGradient(driver.name);
  const isInactive = driver.status !== "active";

  const initials = driver.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className={`bg-white rounded-[24px] border border-slate-200/80 transition-all duration-300 flex flex-col group hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 relative overflow-hidden ${isInactive ? 'opacity-85 grayscale-[0.2]' : ''}`}>
      
      {/* Actions (Hover) */}
      <div className="absolute top-3 right-3 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={onDelete} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-rose-600 hover:border-rose-200 shadow-sm transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>

      <div className={`p-5 flex ${isLarge ? 'flex-row items-center gap-5' : 'flex-col items-center text-center gap-3'} border-b border-slate-100 relative`}>
        {/* Avatar */}
        <div className={`relative shrink-0 rounded-2xl bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-white shadow-lg ${isLarge ? 'w-20 h-20' : 'w-16 h-16'}`}>
          <span className={`font-black tracking-tighter ${isLarge ? 'text-2xl' : 'text-xl'}`}>{initials}</span>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center" style={{ backgroundColor: meta.dot }}>
             {driver.status === "active" && <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />}
          </div>
        </div>

        {/* Info */}
        <div className={`flex-1 min-w-0 ${isLarge ? '' : 'w-full'}`}>
          <div className="flex items-center gap-2 mb-1 justify-center sm:justify-start">
             <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${meta.bg} ${meta.border} ${meta.color}`}>
               {meta.label}
             </div>
          </div>
          <h3 className={`font-black text-slate-900 tracking-tight truncate ${isLarge ? 'text-xl' : 'text-lg'}`}>{driver.name}</h3>
          {driver.assignedVehicle ? (
            <div className={`flex items-center gap-1.5 mt-1.5 text-sm font-semibold text-slate-600 ${isLarge ? '' : 'justify-center'}`}>
              <CarFront className="w-4 h-4 text-blue-500" />
              <span className="truncate">{driver.assignedVehicle}</span>
            </div>
          ) : (
            <div className={`flex items-center gap-1.5 mt-1.5 text-sm font-semibold text-slate-400 ${isLarge ? '' : 'justify-center'}`}>
               <CarFront className="w-4 h-4 opacity-50" /> Nincs jármű
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="p-4 bg-slate-50/50 flex-1 flex flex-col gap-3">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <Phone className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <span className="truncate">{driver.phone || "—"}</span>
        </div>
        
        {driver.email && (
          <div className="flex items-center gap-3 text-sm font-medium text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]">
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
              <Mail className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <span className="truncate">{driver.email}</span>
          </div>
        )}

        {driver.note && (
          <div className="mt-auto p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-[11px] font-bold text-amber-900 leading-snug">{driver.note}</div>
          </div>
        )}
      </div>

      {/* Quick Status Change */}
      <div className="p-3 border-t border-slate-100 bg-white grid grid-cols-2 gap-2">
        <button
          onClick={() => onPatch(driver._id, { status: "active" })}
          disabled={driver.status === "active"}
          className="py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50 disabled:bg-emerald-50 disabled:text-emerald-700 disabled:border-emerald-200 border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          Aktív
        </button>
        <button
          onClick={() => onPatch(driver._id, { status: "inactive" })}
          disabled={driver.status === "inactive"}
          className="py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50 disabled:bg-amber-50 disabled:text-amber-700 disabled:border-amber-200 border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          Inaktív
        </button>
      </div>
    </div>
  );
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()} className="w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase mb-1">
              {initial ? "Szerkesztés" : "Hozzáadás"}
            </div>
            <h2 className="text-2xl font-black text-slate-900">{initial ? "Sofőr módosítása" : "Új sofőr rögzítése"}</h2>
          </div>
          <button type="button" onClick={onClose} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Teljes név *</label>
              <input required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900" placeholder="Kovács Péter" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Foglalkoztatás *</label>
              <div className="flex p-1 rounded-2xl bg-slate-100 border border-slate-200">
                <button type="button" onClick={() => setType("permanent")} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${type === "permanent" ? "bg-white text-blue-700 shadow-sm border border-slate-200/50" : "text-slate-500"}`}>Állandó</button>
                <button type="button" onClick={() => setType("substitute")} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${type === "substitute" ? "bg-white text-purple-700 shadow-sm border border-slate-200/50" : "text-slate-500"}`}>Beugrós</button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Telefonszám *</label>
              <input required value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900" placeholder="+36 30 123 4567" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Email (opcionális)</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900" placeholder="peter@example.com" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Státusz *</label>
              <select value={status} onChange={e => setStatus(e.target.value as DriverStatus)} className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 appearance-none">
                <option value="active">Aktív (Dolgozik)</option>
                <option value="inactive">Inaktív (Nem dolgozik)</option>
                <option value="on_leave">Szabadságon / Beteg</option>
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Hozzárendelt jármű (opcionális)</label>
              <input value={assignedVehicle} onChange={e => setAssignedVehicle(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900" placeholder="pl. Skoda Superb Barna" />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Megjegyzés</label>
              <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 resize-none" placeholder="Bármilyen egyéb információ..." />
            </div>
          </div>
        </div>

        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-200 transition-colors">
            Mégsem
          </button>
          <button disabled={busy} type="submit" className="px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-lg shadow-slate-900/20 hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-70" style={{ backgroundImage: "linear-gradient(90deg, #0f172a, #1e293b)" }}>
            <Check className="w-4 h-4" strokeWidth={3} /> Mentés
          </button>
        </div>
      </form>
    </div>
  );
}

function ConfirmModal({ title, subtitle, onConfirm, onCancel }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-6 border border-rose-100">
          <Trash2 className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">{title}</h3>
        <p className="text-sm font-semibold text-slate-600 mb-8 leading-relaxed">{subtitle}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">Mégsem</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-colors">Törlés</button>
        </div>
      </div>
    </div>
  );
}
