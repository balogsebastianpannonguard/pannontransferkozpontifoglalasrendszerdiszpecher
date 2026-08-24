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
  Lock,
  Sparkles,
  Crown,
  Zap,
} from "lucide-react";
import type { Driver, DriverStatus, DriverType } from "@/lib/drivers";

/* ==========================================================
   PANNON TRANSFER LIGHT/ELEGANT THEME
   Letisztult, vékony keretek (border-slate-200), finom árnyékok,
   világos hátterek, "Apple/Linear" minimalizmus.
   ========================================================== */

const STATUS_META: Record<DriverStatus, { label: string; icon: any; dot: string; bg: string; border: string; text: string }> = {
  active: {
    label: "Aktív",
    icon: ShieldCheck,
    dot: "#10b981",
    bg: "#ecfdf5",
    border: "#a7f3d0",
    text: "#047857",
  },
  inactive: {
    label: "Inaktív",
    icon: Clock,
    dot: "#f59e0b",
    bg: "#fffbeb",
    border: "#fde68a",
    text: "#b45309",
  },
  on_leave: {
    label: "Szabadságon",
    icon: Briefcase,
    dot: "#64748b",
    bg: "#f1f5f9",
    border: "#cbd5e1",
    text: "#475569",
  },
};

const getAvatarGradient = (name: string) => {
  const hash = name.split("").reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const palettes = [
    { from: "#2563eb", to: "#60a5fa" }, // Blue
    { from: "#0f172a", to: "#475569" }, // Slate
    { from: "#d97706", to: "#fbbf24" }, // Gold
    { from: "#059669", to: "#34d399" }, // Emerald
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
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#f8fafc" }}>
      {/* ======= LIGHT ELEGANT HEADER ======= */}
      <header
        className="sticky top-0 z-40 backdrop-blur-xl"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-slate-100 active:scale-95"
              style={{ border: "1px solid #e2e8f0", color: "#64748b" }}
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2} />
            </button>
            <div>
              <div className="text-[10px] font-black tracking-widest uppercase mb-0.5 flex items-center gap-1.5" style={{ color: "#2563eb" }}>
                <Users className="w-3 h-3" strokeWidth={2.5} />
                MUNKATÁRSAK
              </div>
              <h1 className="text-xl font-black tracking-tight" style={{ color: "#0f172a" }}>
                Sofőrök kezelése
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" strokeWidth={2} style={{ color: "#94a3b8" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Keresés..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-semibold outline-none transition-all placeholder:text-slate-400"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  color: "#0f172a",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                }}
                onFocus={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = "#3b82f6";
                  (e.target as HTMLInputElement).style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                }}
                onBlur={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = "#e2e8f0";
                  (e.target as HTMLInputElement).style.boxShadow = "0 1px 2px rgba(0,0,0,0.02)";
                }}
              />
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="px-5 py-2.5 text-xs font-bold rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
              style={{
                backgroundColor: "#0f172a",
                color: "#ffffff",
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)",
              }}
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Új Sofőr
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 mt-10">
        {/* ======= STATS - MINIMALIST ======= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          <StatCard title="Összes munkatárs" value={stats.total} icon={Users} color="#0f172a" />
          <StatCard title="Aktív állomány" value={stats.active} icon={ShieldCheck} color="#10b981" glow />
          <StatCard title="Állandós sofőrök" value={stats.permanent} icon={Crown} color="#2563eb" />
          <StatCard title="Beugrós sofőrök" value={stats.substitute} icon={Zap} color="#8b5cf6" />
        </div>

        {loading ? <LoadingState /> : drivers.length === 0 ? <EmptyState onStart={() => setShowAdd(true)} /> : (
          <div className="space-y-16">
            
            {/* =============== ÁLLANDÓ SZEKCIÓ =============== */}
            {permanent.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: "#2563eb" }} />
                  <h2 className="text-xl font-bold tracking-tight" style={{ color: "#0f172a" }}>
                    Állandó Sofőrök
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: "#eff6ff", color: "#1d4ed8" }}>
                    {permanent.length} fő
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {permanent.map(d => (
                    <DriverCard key={d._id} driver={d} onEdit={() => setEditing(d)} onDelete={() => setDeleteTarget(d)} onPatch={patchDriver} size="monumental" />
                  ))}
                </div>
              </section>
            )}

            {/* =============== BEUGRÓS SZEKCIÓ =============== */}
            {substitute.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6 pt-6 border-t" style={{ borderColor: "#e2e8f0" }}>
                  <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: "#8b5cf6" }} />
                  <h2 className="text-xl font-bold tracking-tight" style={{ color: "#0f172a" }}>
                    Beugrós Sofőrök
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: "#f5f3ff", color: "#6d28d9" }}>
                    {substitute.length} fő
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {substitute.map(d => (
                    <DriverCard key={d._id} driver={d} onEdit={() => setEditing(d)} onDelete={() => setDeleteTarget(d)} onPatch={patchDriver} size="compact" />
                  ))}
                </div>
              </section>
            )}

            {permanent.length === 0 && substitute.length === 0 && search && (
              <div className="py-20 text-center rounded-3xl" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
                <Search className="w-8 h-8 mx-auto mb-3" style={{ color: "#cbd5e1" }} />
                <h3 className="text-lg font-bold mb-1" style={{ color: "#0f172a" }}>Nincs találat a keresésre</h3>
                <p className="text-sm font-medium" style={{ color: "#64748b" }}>Keresett kifejezés: "{search}"</p>
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
          subtitle={`Biztosan törlöd ${deleteTarget.name} adatait?`}
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
    <div className="space-y-10">
      <div className="space-y-6">
        <div className="h-6 w-48 rounded-md bg-slate-200 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[360px] rounded-3xl bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="py-24 text-center rounded-3xl" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
      <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
        <UserCircle2 className="w-8 h-8" style={{ color: "#64748b" }} />
      </div>
      <h3 className="text-xl font-bold mb-2" style={{ color: "#0f172a" }}>Nincs még sofőr rögzítve</h3>
      <p className="text-sm font-medium mb-6" style={{ color: "#64748b" }}>Kattints az "Új Sofőr" gombra a munkatársak felvételéhez.</p>
      <button
        onClick={onStart}
        className="px-6 py-2.5 text-xs font-bold rounded-xl transition-all hover:-translate-y-0.5 flex items-center gap-2 mx-auto"
        style={{ backgroundColor: "#0f172a", color: "#ffffff", boxShadow: "0 4px 12px rgba(15,23,42,0.1)" }}
      >
        <Plus className="w-4 h-4" strokeWidth={2.5} /> Első munkatárs létrehozása
      </button>
    </div>
  );
}

/* ======= STAT CARD (Elegant) ======= */
function StatCard({ title, value, icon: Icon, color, glow }: any) {
  return (
    <div
      className="rounded-3xl p-5 flex items-center gap-4 transition-all hover:shadow-md"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
      }}
    >
      <div
        className="relative w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}11`, color: color }}
      >
        <Icon className="w-5 h-5" strokeWidth={2} />
        {glow && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: color }} />
            <span className="relative inline-flex rounded-full h-3 w-3 border-2 border-white" style={{ backgroundColor: color }} />
          </span>
        )}
      </div>
      <div>
        <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#64748b" }}>{title}</div>
        <div className="text-2xl font-black leading-none" style={{ color: "#0f172a" }}>{value}</div>
      </div>
    </div>
  );
}

/* ======= DRIVER CARD (Light & Clean) ======= */
function DriverCard({ driver, onPatch, onEdit, onDelete, size }: any) {
  const meta = STATUS_META[driver.status as DriverStatus];
  const avatarGrad = getAvatarGradient(driver.name);
  const isMonumental = size === "monumental";
  const initials = driver.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
  
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`group relative rounded-3xl flex flex-col transition-all duration-300 bg-white overflow-hidden ${driver.status !== "active" ? "opacity-90" : ""}`}
      style={{
        border: "1px solid #e2e8f0",
        boxShadow: hover ? "0 12px 30px -10px rgba(0,0,0,0.08)" : "0 2px 8px -2px rgba(0,0,0,0.03)",
        transform: hover ? "translateY(-4px)" : "none",
      }}
    >
      {/* Kék vagy Lila top border jelzés */}
      <div className="h-1.5 w-full" style={{ backgroundColor: driver.type === "permanent" ? "#2563eb" : "#8b5cf6" }} />

      <div className={`absolute top-4 right-4 z-30 flex gap-1.5 transition-all duration-200 ${hover ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}>
        <ActionBtn onClick={onEdit} icon={Pencil} />
        <ActionBtn onClick={onDelete} icon={Trash2} danger />
      </div>

      <div className={`relative z-10 flex items-center gap-4 ${isMonumental ? "p-6" : "p-5"}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
        <div className="relative shrink-0">
          <div
            className="flex items-center justify-center text-white font-bold shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${avatarGrad.from}, ${avatarGrad.to})`,
              width: isMonumental ? "64px" : "56px",
              height: isMonumental ? "64px" : "56px",
              borderRadius: isMonumental ? "20px" : "16px",
              fontSize: isMonumental ? "20px" : "18px",
            }}
          >
            {initials}
          </div>
          <div
            className="absolute rounded-full border-2 border-white flex items-center justify-center"
            style={{
              bottom: "-2px", right: "-2px", width: "18px", height: "18px",
              backgroundColor: meta.dot,
            }}
          />
        </div>

        <div className="flex-1 min-w-0 pr-8">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Badge label={meta.label} bg={meta.bg} color={meta.text} border={meta.border} />
            <Badge 
              label={driver.type === "permanent" ? "Állandó" : "Beugrós"} 
              bg={driver.type === "permanent" ? "#eff6ff" : "#f5f3ff"} 
              color={driver.type === "permanent" ? "#1d4ed8" : "#6d28d9"} 
              border={driver.type === "permanent" ? "#bfdbfe" : "#ddd6fe"} 
            />
          </div>
          <h3 className="font-bold truncate" style={{ color: "#0f172a", fontSize: isMonumental ? "18px" : "16px" }}>
            {driver.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-sm font-medium">
            <CarFront className="w-3.5 h-3.5" style={{ color: driver.assignedVehicle ? "#64748b" : "#cbd5e1" }} />
            <span className="truncate" style={{ color: driver.assignedVehicle ? "#475569" : "#94a3b8" }}>
              {driver.assignedVehicle || "Nincs jármű"}
            </span>
          </div>
        </div>
      </div>

      <div className={`flex-1 flex flex-col gap-2.5 ${isMonumental ? "p-6" : "p-5"}`} style={{ backgroundColor: "#fafafa" }}>
        <InfoRow icon={Phone} label={driver.phone || "—"} />
        {driver.email && <InfoRow icon={Mail} label={driver.email} />}
        {driver.note && (
          <div className="mt-2 rounded-xl p-3 flex items-start gap-2.5" style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#d97706" }} />
            <div className="text-xs font-medium leading-relaxed" style={{ color: "#92400e" }}>{driver.note}</div>
          </div>
        )}
      </div>

      <div
        className={`p-3 grid gap-2 ${isMonumental ? "grid-cols-3" : "grid-cols-2"}`}
        style={{ backgroundColor: "#ffffff", borderTop: "1px solid #f1f5f9" }}
      >
        <QuickStatusBtn label="Aktív" onClick={() => onPatch(driver._id, { status: "active" })} active={driver.status === "active"} activeColor="#047857" activeBg="#ecfdf5" />
        <QuickStatusBtn label="Inaktív" onClick={() => onPatch(driver._id, { status: "inactive" })} active={driver.status === "inactive"} activeColor="#b45309" activeBg="#fffbeb" />
        {isMonumental && (
          <QuickStatusBtn label="Szabadság" onClick={() => onPatch(driver._id, { status: "on_leave" })} active={driver.status === "on_leave"} activeColor="#475569" activeBg="#f1f5f9" />
        )}
      </div>
    </div>
  );
}

function Badge({ label, bg, color, border }: any) {
  return (
    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border"
      style={{ backgroundColor: bg, borderColor: border, color }}
    >
      {label}
    </span>
  );
}

function ActionBtn({ onClick, icon: Icon, danger }: any) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        color: danger ? "#ef4444" : "#64748b",
        boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
      }}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}

function InfoRow({ icon: Icon, label }: any) {
  return (
    <div className="flex items-center gap-3 text-sm font-medium">
      <div className="w-6 h-6 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" style={{ color: "#94a3b8" }} />
      </div>
      <span className="truncate" style={{ color: "#334155" }}>{label}</span>
    </div>
  );
}

function QuickStatusBtn({ label, onClick, active, activeColor, activeBg }: any) {
  return (
    <button
      onClick={onClick}
      className="py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
      style={{
        backgroundColor: active ? activeBg : "transparent",
        color: active ? activeColor : "#94a3b8",
        border: `1px solid ${active ? activeColor : "transparent"}`,
      }}
    >
      {label}
    </button>
  );
}

/* ======= MODALS (Light & Minimal) ======= */
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.4)" }} onClick={onClose}
    >
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        <div className="px-8 py-6 flex items-center justify-between border-b" style={{ borderColor: "#e2e8f0" }}>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "#0f172a" }}>
              {initial ? "Sofőr szerkesztése" : "Új sofőr hozzáadása"}
            </h2>
            <p className="text-sm font-medium mt-1" style={{ color: "#64748b" }}>
              Adja meg a munkatárs alapvető adatait.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Teljes név" required mdFull>
              <Input value={name} onChange={setName} placeholder="Kovács Péter" />
            </Field>

            <Field label="Foglalkoztatás" required>
              <div className="flex p-1 rounded-xl" style={{ backgroundColor: "#f1f5f9" }}>
                <button type="button" onClick={() => setType("permanent")}
                  className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
                  style={{ backgroundColor: type === "permanent" ? "#ffffff" : "transparent", color: type === "permanent" ? "#0f172a" : "#64748b", boxShadow: type === "permanent" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}
                >
                  Állandó
                </button>
                <button type="button" onClick={() => setType("substitute")}
                  className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
                  style={{ backgroundColor: type === "substitute" ? "#ffffff" : "transparent", color: type === "substitute" ? "#0f172a" : "#64748b", boxShadow: type === "substitute" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}
                >
                  Beugrós
                </button>
              </div>
            </Field>

            <Field label="Telefonszám" required>
              <Input value={phone} onChange={setPhone} placeholder="+36 30 123 4567" />
            </Field>
            <Field label="Email cím">
              <Input value={email} onChange={setEmail} type="email" placeholder="Opcionális" />
            </Field>
            <Field label="Állapot" required>
              <select
                value={status} onChange={(e) => setStatus(e.target.value as DriverStatus)}
                className="w-full px-4 py-3 rounded-xl outline-none font-medium appearance-none bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white transition-all"
              >
                <option value="active">Aktív (Elérhető)</option>
                <option value="inactive">Inaktív</option>
                <option value="on_leave">Szabadságon</option>
              </select>
            </Field>
            <Field label="Hozzárendelt jármű" mdFull>
              <Input value={assignedVehicle} onChange={setAssignedVehicle} placeholder="pl. Mercedes V-Klass #1 (Opcionális)" />
            </Field>
            <Field label="Megjegyzés" mdFull>
              <textarea
                rows={3} value={note} onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-3 rounded-xl outline-none font-medium resize-none bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white transition-all"
                placeholder="Fontos információk..."
              />
            </Field>
          </div>
        </div>

        <div className="px-8 py-5 flex justify-end gap-3 border-t" style={{ borderColor: "#e2e8f0", backgroundColor: "#f8fafc" }}>
          <button type="button" onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", color: "#475569" }}
          >
            Mégsem
          </button>
          <button disabled={busy} type="submit"
            className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
            style={{ backgroundColor: "#0f172a", color: "#ffffff" }}
          >
            {busy ? "Mentés..." : "Mentés"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, mdFull, children }: any) {
  return (
    <div className={`space-y-1.5 ${mdFull ? "md:col-span-2" : ""}`}>
      <label className="text-xs font-bold text-slate-700 ml-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: any) {
  return (
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl outline-none font-medium bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white transition-all"
    />
  );
}

function ConfirmModal({ title, subtitle, onConfirm, onCancel }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.4)" }} onClick={onCancel}
    >
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="w-16 h-16 rounded-full bg-red-50 mx-auto flex items-center justify-center mb-4">
          <Trash2 className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm font-medium text-slate-500 mb-8">{subtitle}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">
            Mégsem
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600">
            Törlés
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ ok, msg }: { ok: boolean; msg: string }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 bg-white border border-slate-100">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${ok ? 'bg-green-100' : 'bg-red-100'}`}>
          {ok ? <Check className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
        </div>
        <div className="text-sm font-bold text-slate-700">{msg}</div>
      </div>
    </div>
  );
}
