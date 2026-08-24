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

const STATUS_META: Record<DriverStatus, { label: string; icon: any; dot: string; color: string; bg: string; border: string; glow: string }> = {
  active: {
    label: "Aktív",
    icon: ShieldCheck,
    dot: "#10b981",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-400",
    glow: "0 0 0 4px rgba(16, 185, 129, 0.12)",
  },
  inactive: {
    label: "Inaktív",
    icon: Clock,
    dot: "#f59e0b",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-400",
    glow: "0 0 0 4px rgba(245, 158, 11, 0.12)",
  },
  on_leave: {
    label: "Szabadságon",
    icon: Briefcase,
    dot: "#8b5cf6",
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-400",
    glow: "0 0 0 4px rgba(139, 92, 246, 0.12)",
  },
};

const getAvatarGradient = (name: string) => {
  const hash = name.split("").reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const colors = [
    { from: "#1d4ed8", to: "#7c3aed" },
    { from: "#059669", to: "#0891b2" },
    { from: "#ea580c", to: "#eab308" },
    { from: "#be123c", to: "#ec4899" },
    { from: "#4f46e5", to: "#06b6d4" },
    { from: "#0ea5e9", to: "#10b981" },
    { from: "#d97706", to: "#dc2626" },
    { from: "#0f172a", to: "#475569" },
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
      substitute: filtered.filter(d => d.type === "substitute"),
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
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#fafafa" }}>
      {/* ======= PREMIUM DARK HEADER ======= */}
      <header
        className="sticky top-0 z-40 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.12)] border-b"
        style={{
          backgroundColor: "#0b1120",
          borderBottomColor: "#1e293b",
        }}
      >
        <div className="max-w-7xl mx-auto px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button
              onClick={() => router.push("/")}
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              style={{
                backgroundColor: "#1e293b",
                border: "2px solid #334155",
                color: "#94a3b8",
                boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
              }}
              title="Vissza a dashboardra"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#fbbf24";
                (e.currentTarget as HTMLElement).style.borderColor = "#fbbf24";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#94a3b8";
                (e.currentTarget as HTMLElement).style.borderColor = "#334155";
              }}
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <div>
              <div className="text-[10px] font-black tracking-[0.3em] uppercase mb-1 flex items-center gap-2" style={{ color: "#fbbf24" }}>
                <Sparkles className="w-3.5 h-3.5" />
                MUNKATÁRSAK · PREMIUM
              </div>
              <h1 className="text-3xl font-black tracking-tight flex items-center gap-3" style={{ color: "#f8fafc" }}>
                <Crown className="w-7 h-7" style={{ color: "#fbbf24" }} />
                Sofőrök kezelése
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#64748b" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Keresés név, telefon, jármű vagy megjegyzés alapján..."
                className="w-full pl-11 pr-5 py-3.5 rounded-2xl text-sm font-bold outline-none transition-all placeholder:text-slate-500"
                style={{
                  backgroundColor: "#1e293b",
                  border: "2px solid #334155",
                  color: "#f1f5f9",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
                }}
                onFocus={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = "#fbbf24";
                  (e.target as HTMLInputElement).style.boxShadow = "0 0 0 4px rgba(251, 191, 36, 0.12), inset 0 2px 4px rgba(0,0,0,0.3)";
                }}
                onBlur={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = "#334155";
                  (e.target as HTMLInputElement).style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.3)";
                }}
              />
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="group px-7 py-3.5 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all hover:-translate-y-1 active:translate-y-0 flex items-center gap-2.5 shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)",
                color: "#111827",
                boxShadow: "0 10px 30px -5px rgba(251, 191, 36, 0.5)",
                border: "2px solid #fcd34d",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 15px 40px -5px rgba(251, 191, 36, 0.7)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 30px -5px rgba(251, 191, 36, 0.5)";
              }}
            >
              <Plus className="w-5 h-5" strokeWidth={3} />
              ÚJ SOFŐR HOZZÁADÁSA
            </button>
          </div>
        </div>
        {/* Arany decorative bottom bar */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, transparent, #fbbf24, #f59e0b, #fbbf24, transparent)" }} />
      </header>

      <main className="max-w-7xl mx-auto px-8 mt-10">
        {/* ======= PREMIUM STATS ROW ======= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
          <StatCard
            title="Összes munkatárs"
            value={stats.total}
            icon={Users}
            gradient={{ from: "#0f172a", to: "#334155" }}
            accent="#fbbf24"
            sub={`${stats.total} fő a rendszerben`}
          />
          <StatCard
            title="Aktív állomány"
            value={stats.active}
            icon={ShieldCheck}
            gradient={{ from: "#064e3b", to: "#047857" }}
            accent="#34d399"
            sub="Elérhető munkatársak"
            glow
          />
          <StatCard
            title="Állandós sofőrök"
            value={stats.permanent}
            icon={Crown}
            gradient={{ from: "#1e3a8a", to: "#1d4ed8" }}
            accent="#60a5fa"
            sub="Teljes munkaidős"
          />
          <StatCard
            title="Beugrós sofőrök"
            value={stats.substitute}
            icon={Zap}
            gradient={{ from: "#4c1d95", to: "#7c3aed" }}
            accent="#c084fc"
            sub="Avatásra hívható"
          />
        </div>

        {loading ? (
          <div className="space-y-16">
            <div className="space-y-6">
              <div className="h-10 w-64 rounded-xl" style={{ backgroundColor: "#e2e8f0" }} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-[420px] rounded-3xl animate-pulse" style={{ backgroundColor: "#f1f5f9", border: "2px solid #0f172a" }} />
                ))}
              </div>
            </div>
          </div>
        ) : drivers.length === 0 ? (
          <div
            className="py-32 text-center rounded-[40px] relative overflow-hidden"
            style={{
              backgroundColor: "#ffffff",
              border: "3px solid #0f172a",
              boxShadow: "0 25px 60px -20px rgba(15, 23, 42, 0.2)",
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-2"
              style={{ background: "linear-gradient(90deg, #fbbf24, #f59e0b, #d97706)" }}
            />
            <div
              className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center mb-6"
              style={{
                backgroundColor: "#0f172a",
                border: "3px solid #fbbf24",
                boxShadow: "0 15px 30px -10px rgba(15,23,42,0.5)",
              }}
            >
              <UserCircle2 className="w-12 h-12" style={{ color: "#fbbf24" }} />
            </div>
            <h3 className="text-3xl font-black tracking-tight mb-3" style={{ color: "#0f172a" }}>
              Nincs még sofőr rögzítve
            </h3>
            <p className="text-base font-semibold mb-8" style={{ color: "#64748b" }}>
              Kattints az "ÚJ SOFŐR HOZZÁADÁSA" gombra a munkatársak felvételéhez
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="px-8 py-4 font-black text-xs uppercase tracking-widest rounded-2xl transition-all hover:-translate-y-0.5 flex items-center gap-2 mx-auto shadow-xl"
              style={{
                background: "linear-gradient(135deg, #0f172a, #1e293b)",
                color: "#f8fafc",
                border: "2px solid #334155",
              }}
            >
              <Plus className="w-4 h-4" /> Első munkatárs létrehozása
            </button>
          </div>
        ) : (
          <div className="space-y-20">
            {/* =============== ÁLLANDÓ SZEKCIÓ - MONUMENTÁLIS =============== */}
            {permanent.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-5">
                    <div
                      className="w-2 h-14 rounded-full"
                      style={{ background: "linear-gradient(180deg, #1d4ed8, #3b82f6)" }}
                    />
                    <div>
                      <h2 className="text-4xl font-black tracking-tight flex items-center gap-3" style={{ color: "#0f172a" }}>
                        <Crown className="w-8 h-8" style={{ color: "#1d4ed8" }} />
                        Állandó Sofőrök
                      </h2>
                      <p className="text-base font-semibold mt-1.5" style={{ color: "#64748b" }}>
                        Teljes munkaidős, stabil munkatársak · {permanent.length} fő
                      </p>
                    </div>
                    <span
                      className="px-4 py-2 rounded-xl text-xs font-black border-2 flex items-center gap-2"
                      style={{
                        backgroundColor: "#eff6ff",
                        borderColor: "#1d4ed8",
                        color: "#1e40af",
                        boxShadow: "0 4px 12px rgba(29, 78, 216, 0.15)",
                      }}
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      {permanent.length} FŐ · ÁLLANDÓ
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7">
                  {permanent.map((driver) => (
                    <DriverCard
                      key={driver._id}
                      driver={driver}
                      onEdit={() => setEditing(driver)}
                      onDelete={() => setDeleteTarget(driver)}
                      onPatch={patchDriver}
                      size="monumental"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* =============== BEUGRÓS SZEKCIÓ =============== */}
            {substitute.length > 0 && (
              <section>
                <div
                  className="rounded-t-[28px] px-8 py-6 flex items-center justify-between mb-0 relative overflow-hidden"
                  style={{
                    backgroundColor: "#0f172a",
                    border: "3px solid #0f172a",
                    borderBottom: "none",
                    boxShadow: "0 -15px 40px -20px rgba(15,23,42,0.3)",
                  }}
                >
                  <div className="absolute inset-x-0 top-0 h-1" style={{ background: "linear-gradient(90deg, #8b5cf6, #c084fc, #8b5cf6)" }} />
                  <div className="flex items-center gap-5">
                    <div
                      className="w-1.5 h-12 rounded-full"
                      style={{ background: "linear-gradient(180deg, #7c3aed, #c084fc)" }}
                    />
                    <div>
                      <h2 className="text-2xl font-black tracking-tight flex items-center gap-3" style={{ color: "#f8fafc" }}>
                        <Zap className="w-6 h-6" style={{ color: "#c084fc" }} />
                        Beugrós Sofőrök
                      </h2>
                      <p className="text-sm font-semibold mt-1" style={{ color: "#94a3b8" }}>
                        Avatásra hívható, rugalmas munkatársak · {substitute.length} fő
                      </p>
                    </div>
                    <span
                      className="px-3.5 py-1.5 rounded-lg text-[10px] font-black border-2 tracking-widest"
                      style={{
                        backgroundColor: "rgba(139, 92, 246, 0.15)",
                        borderColor: "#a78bfa",
                        color: "#ddd6fe",
                      }}
                    >
                      {substitute.length} FŐ · BEUGRÓS
                    </span>
                  </div>
                </div>
                <div
                  className="rounded-b-[28px] p-7 border-t-0"
                  style={{
                    backgroundColor: "#f8fafc",
                    border: "3px solid #0f172a",
                    boxShadow: "0 25px 60px -30px rgba(15,23,42,0.3)",
                  }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {substitute.map((driver) => (
                      <DriverCard
                        key={driver._id}
                        driver={driver}
                        onEdit={() => setEditing(driver)}
                        onDelete={() => setDeleteTarget(driver)}
                        onPatch={patchDriver}
                        size="compact"
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {permanent.length === 0 && substitute.length === 0 && search && (
              <div
                className="py-24 text-center rounded-[32px]"
                style={{
                  backgroundColor: "#ffffff",
                  border: "3px dashed #0f172a",
                }}
              >
                <Search className="w-10 h-10 mx-auto mb-4" style={{ color: "#94a3b8" }} />
                <h3 className="text-2xl font-black mb-2" style={{ color: "#0f172a" }}>
                  Nincs találat a keresésre
                </h3>
                <p className="font-semibold" style={{ color: "#64748b" }}>
                  Keresett kifejezés: "{search}"
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ======= MODALS ======= */}
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
          subtitle={`Biztosan törlöd ${deleteTarget.name} adatait? Ez a művelet nem vonható vissza és az összes hozzárendelt információ elveszik.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={removeDriver}
        />
      )}

      {/* ======= TOAST ======= */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div
            className="px-6 py-4 rounded-2xl shadow-2xl border-3 backdrop-blur-xl flex items-center gap-3 animate-[slideUp_0.3s_ease-out]"
            style={{
              backgroundColor: toast.ok ? "#ecfdf5" : "#fff1f2",
              border: `3px solid ${toast.ok ? "#10b981" : "#e11d48"}`,
              color: toast.ok ? "#065f46" : "#9f1239",
              boxShadow: toast.ok
                ? "0 15px 40px -10px rgba(16, 185, 129, 0.4)"
                : "0 15px 40px -10px rgba(225, 29, 72, 0.4)",
              minWidth: "340px",
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: toast.ok ? "#10b981" : "#e11d48",
              }}
            >
              {toast.ok ? <Check className="w-5 h-5 text-white" strokeWidth={3} /> : <AlertTriangle className="w-5 h-5 text-white" strokeWidth={2.5} />}
            </div>
            <div>
              <div className="text-sm font-black tracking-wide">
                {toast.ok ? "SIKERES MŰVELET" : "HIBA TÖRTÉNT"}
              </div>
              <div className="text-sm font-semibold opacity-90 mt-0.5">{toast.msg}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===========================================================
   STAT CARD
   =========================================================== */
function StatCard({
  title,
  value,
  icon: Icon,
  gradient,
  accent,
  sub,
  glow,
}: any) {
  return (
    <div
      className="group relative rounded-[28px] p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
      style={{
        backgroundColor: "#ffffff",
        border: "3px solid #0f172a",
        boxShadow: glow
          ? `0 20px 50px -15px rgba(16, 185, 129, 0.25), 0 10px 20px -10px rgba(15,23,42,0.2)`
          : `0 15px 40px -15px rgba(15,23,42,0.25)`,
      }}
    >
      {/* Dark corner accent */}
      <div
        className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"
        style={{ backgroundColor: accent }}
      />
      <div className="flex items-start gap-5 relative z-10">
        <div
          className="relative w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl"
          style={{
            background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
            color: "#ffffff",
            border: "3px solid #0f172a",
          }}
        >
          <Icon className="w-7 h-7" strokeWidth={2.2} />
          {glow && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: accent }}
              />
              <span
                className="relative inline-flex rounded-full h-5 w-5 border-3"
                style={{ backgroundColor: accent, borderColor: "#ffffff" }}
              />
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-1.5" style={{ color: "#64748b" }}>
            {title}
          </div>
          <div className="text-4xl font-black leading-none tracking-tight" style={{ color: "#0f172a" }}>
            {value}
          </div>
          <div className="text-xs font-bold mt-2 flex items-center gap-1.5" style={{ color: accent }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
            {sub}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===========================================================
   DRIVER CARD - Monumental & Compact
   =========================================================== */
function DriverCard({ driver, onPatch, onEdit, onDelete, size }: any) {
  const meta = STATUS_META[driver.status as DriverStatus];
  const avatarGrad = getAvatarGradient(driver.name);
  const isInactive = driver.status !== "active";
  const isMonumental = size === "monumental";

  const initials = driver.name
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={`group relative rounded-[28px] flex flex-col transition-all duration-400 hover:-translate-y-2 bg-white overflow-hidden ${
        isInactive ? "opacity-90" : ""
      }`}
      style={{
        border: "3px solid #0f172a",
        boxShadow: `0 20px 50px -20px rgba(15,23,42,0.35)`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 35px 80px -25px rgba(15,23,42,0.5), 0 0 0 3px ${meta.dot}22`;
        (e.currentTarget as HTMLElement).style.borderColor = meta.dot;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 50px -20px rgba(15,23,42,0.35)`;
        (e.currentTarget as HTMLElement).style.borderColor = "#0f172a";
      }}
    >
      {/* TOP ACCENT BAR */}
      <div
        className="h-2.5 w-full"
        style={{
          background: `linear-gradient(90deg, ${avatarGrad.from}, ${avatarGrad.to})`,
        }}
      />

      {/* HOVER ACTIONS */}
      <div className="absolute top-5 right-5 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
        <button
          onClick={onEdit}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg hover:scale-110"
          style={{
            backgroundColor: "#0f172a",
            border: "2px solid #334155",
            color: "#fbbf24",
          }}
          title="Szerkesztés"
        >
          <Pencil className="w-4 h-4" strokeWidth={2.5} />
        </button>
        <button
          onClick={onDelete}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg hover:scale-110"
          style={{
            backgroundColor: "#0f172a",
            border: "2px solid #334155",
            color: "#f87171",
          }}
          title="Törlés"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "#7f1d1d";
            (e.currentTarget as HTMLElement).style.borderColor = "#ef4444";
            (e.currentTarget as HTMLElement).style.color = "#fecaca";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "#0f172a";
            (e.currentTarget as HTMLElement).style.borderColor = "#334155";
            (e.currentTarget as HTMLElement).style.color = "#f87171";
          }}
        >
          <Trash2 className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>

      {/* HEADER AREA - Avatar + Info */}
      <div
        className={`relative z-10 flex items-center gap-5 border-b-3 ${
          isMonumental ? "p-7" : "p-5"
        }`}
        style={{
          backgroundColor: isMonumental
            ? "linear-gradient(180deg, #f8fafc, #ffffff)"
            : "#ffffff",
          background: isMonumental
            ? "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)"
            : undefined,
          borderBottom: "3px solid #e2e8f0",
        }}
      >
        {/* AVATAR */}
        <div className="relative shrink-0">
          <div
            className={`rounded-3xl flex items-center justify-center text-white font-black shadow-2xl ${
              isMonumental ? "w-24 h-24 text-3xl" : "w-18 h-18 text-2xl"
            }`}
            style={{
              background: `linear-gradient(135deg, ${avatarGrad.from} 0%, ${avatarGrad.to} 100%)`,
              border: "4px solid #0f172a",
              width: isMonumental ? "96px" : "72px",
              height: isMonumental ? "96px" : "72px",
              borderRadius: "24px",
              fontSize: isMonumental ? "30px" : "22px",
            }}
          >
            {initials}
          </div>
          {/* Status dot */}
          <div
            className="absolute rounded-full border-3 flex items-center justify-center"
            style={{
              bottom: isMonumental ? "-4px" : "-2px",
              right: isMonumental ? "-4px" : "-2px",
              width: isMonumental ? "30px" : "24px",
              height: isMonumental ? "30px" : "24px",
              backgroundColor: meta.dot,
              borderColor: "#ffffff",
              boxShadow: meta.glow,
            }}
          >
            {driver.status === "active" && <Check className="text-white" strokeWidth={4} style={{ width: isMonumental ? "18px" : "14px", height: isMonumental ? "18px" : "14px" }} />}
          </div>
        </div>

        {/* INFO */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border-2 flex items-center gap-1.5`}
              style={{
                backgroundColor: meta.bg,
                borderColor: meta.dot,
                color: meta.dot,
              }}
            >
              <meta.icon className="w-3 h-3" />
              {meta.label}
            </span>
            {driver.type === "permanent" && (
              <span
                className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border-2 flex items-center gap-1.5"
                style={{
                  backgroundColor: "#eff6ff",
                  borderColor: "#2563eb",
                  color: "#1d4ed8",
                }}
              >
                <Crown className="w-3 h-3" />
                Állandó
              </span>
            )}
            {driver.type === "substitute" && (
              <span
                className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border-2 flex items-center gap-1.5"
                style={{
                  backgroundColor: "#faf5ff",
                  borderColor: "#8b5cf6",
                  color: "#7c3aed",
                }}
              >
                <Zap className="w-3 h-3" />
                Beugrós
              </span>
            )}
          </div>
          <h3
            className="font-black tracking-tight truncate"
            style={{
              color: "#0f172a",
              fontSize: isMonumental ? "24px" : "20px",
              lineHeight: 1.1,
            }}
          >
            {driver.name}
          </h3>
          {driver.assignedVehicle ? (
            <div className={`flex items-center gap-2 mt-2 font-semibold ${isMonumental ? "text-base" : "text-sm"}`}>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: "#0f172a",
                }}
              >
                <CarFront className="w-4 h-4" style={{ color: "#fbbf24" }} />
              </div>
              <span className="truncate" style={{ color: "#334155" }}>
                {driver.assignedVehicle}
              </span>
            </div>
          ) : (
            <div className={`flex items-center gap-2 mt-2 font-semibold ${isMonumental ? "text-base" : "text-sm"}`}>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center opacity-40"
                style={{
                  backgroundColor: "#e2e8f0",
                }}
              >
                <CarFront className="w-4 h-4" style={{ color: "#64748b" }} />
              </div>
              <span style={{ color: "#94a3b8" }}>Nincs hozzárendelt jármű</span>
            </div>
          )}
        </div>
      </div>

      {/* DETAILS - Phone, Email, Note */}
      <div className={`flex-1 flex flex-col gap-3 ${isMonumental ? "p-6" : "p-4"}`} style={{ backgroundColor: "#f8fafc" }}>
        <div
          className="flex items-center gap-3.5 font-medium rounded-2xl p-3.5 border-2"
          style={{
            backgroundColor: "#ffffff",
            borderColor: "#e2e8f0",
            color: "#0f172a",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
            fontSize: isMonumental ? "15px" : "13px",
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "#eff6ff",
              border: "2px solid #bfdbfe",
            }}
          >
            <Phone className="w-4.5 h-4.5" style={{ color: "#2563eb", width: "18px", height: "18px" }} />
          </div>
          <span className="truncate font-bold">{driver.phone || "—"}</span>
        </div>

        {driver.email && (
          <div
            className="flex items-center gap-3.5 font-medium rounded-2xl p-3.5 border-2"
            style={{
              backgroundColor: "#ffffff",
              borderColor: "#e2e8f0",
              color: "#0f172a",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
              fontSize: isMonumental ? "15px" : "13px",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: "#faf5ff",
                border: "2px solid #ddd6fe",
              }}
            >
              <Mail className="w-4.5 h-4.5" style={{ color: "#7c3aed", width: "18px", height: "18px" }} />
            </div>
            <span className="truncate font-bold">{driver.email}</span>
          </div>
        )}

        {driver.note && (
          <div
            className="mt-auto rounded-2xl p-4 border-2 flex items-start gap-3"
            style={{
              backgroundColor: "#fffbeb",
              borderColor: "#fbbf24",
              boxShadow: "inset 0 2px 6px rgba(251, 191, 36, 0.1)",
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{
                backgroundColor: "#0f172a",
              }}
            >
              <AlertTriangle className="w-4 h-4" style={{ color: "#fbbf24" }} />
            </div>
            <div className="text-xs font-bold leading-relaxed" style={{ color: "#92400e" }}>
              {driver.note}
            </div>
          </div>
        )}
      </div>

      {/* QUICK STATUS ACTIONS */}
      <div
        className={`p-4 border-t-3 grid gap-2.5 ${
          isMonumental ? "grid-cols-3" : "grid-cols-2"
        }`}
        style={{
          backgroundColor: "#ffffff",
          borderTop: "3px solid #0f172a",
        }}
      >
        <QuickStatusBtn
          label="Aktív"
          onClick={() => onPatch(driver._id, { status: "active" })}
          active={driver.status === "active"}
          colors={{ bg: "#ecfdf5", text: "#059669", border: "#10b981", activeBg: "#10b981", activeText: "#ffffff" }}
        />
        <QuickStatusBtn
          label="Inaktív"
          onClick={() => onPatch(driver._id, { status: "inactive" })}
          active={driver.status === "inactive"}
          colors={{ bg: "#fffbeb", text: "#d97706", border: "#f59e0b", activeBg: "#f59e0b", activeText: "#1f2937" }}
        />
        {isMonumental && (
          <QuickStatusBtn
            label="Szabadság"
            onClick={() => onPatch(driver._id, { status: "on_leave" })}
            active={driver.status === "on_leave"}
            colors={{ bg: "#f5f3ff", text: "#6d28d9", border: "#8b5cf6", activeBg: "#8b5cf6", activeText: "#ffffff" }}
          />
        )}
      </div>
    </div>
  );
}

function QuickStatusBtn({ label, onClick, active, colors }: any) {
  const [hover, setHover] = useState(false);
  const baseStyle: any = {
    padding: "10px 8px",
    borderRadius: "12px",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    transition: "all 0.2s ease",
    border: "2px solid",
    cursor: active ? "default" : "pointer",
    transform: active ? "scale(1)" : hover ? "translateY(-1px)" : "scale(1)",
  };

  if (active) {
    baseStyle.backgroundColor = colors.activeBg;
    baseStyle.color = colors.activeText;
    baseStyle.borderColor = colors.activeBg;
    baseStyle.boxShadow = `0 4px 15px -5px ${colors.border}`;
    baseStyle.opacity = 1;
  } else {
    baseStyle.backgroundColor = hover ? colors.bg : "#ffffff";
    baseStyle.color = hover ? colors.text : "#64748b";
    baseStyle.borderColor = hover ? colors.border : "#e2e8f0";
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={baseStyle}
    >
      {label}
    </button>
  );
}

/* ===========================================================
   DRIVER FORM MODAL - Premium Dark
   =========================================================== */
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.85)" }}
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-white rounded-[36px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] relative"
        style={{ border: "4px solid #0f172a", boxShadow: "0 50px 120px -20px rgba(0,0,0,0.7)" }}
      >
        {/* HEADER */}
        <div
          className="relative overflow-hidden px-10 py-7 flex items-center justify-between"
          style={{ backgroundColor: "#0f172a" }}
        >
          <div
            className="absolute inset-x-0 top-0 h-1.5"
            style={{ background: "linear-gradient(90deg, #fbbf24, #f59e0b, #ef4444, #8b5cf6, #3b82f6, #fbbf24)" }}
          />
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #fbbf24, transparent)" }} />
          <div className="relative z-10 flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl"
              style={{
                backgroundColor: "#1e293b",
                border: "3px solid #fbbf24",
              }}
            >
              {initial ? (
                <Pencil className="w-7 h-7" style={{ color: "#fbbf24" }} strokeWidth={2.2} />
              ) : (
                <Sparkles className="w-7 h-7" style={{ color: "#fbbf24" }} strokeWidth={2.2} />
              )}
            </div>
            <div>
              <div className="text-[10px] font-black tracking-[0.3em] uppercase mb-1.5" style={{ color: "#fbbf24" }}>
                {initial ? "SZERKESZTÉSI MÓD" : "ÚJ MUNKATÁRS LÉTREHOZÁSA"}
              </div>
              <h2 className="text-3xl font-black tracking-tight" style={{ color: "#f8fafc" }}>
                {initial ? `${initial.name} adatainak módosítása` : "Sofőr rögzítése"}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-110 shadow-lg"
            style={{
              backgroundColor: "#1e293b",
              border: "2px solid #475569",
              color: "#94a3b8",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "#7f1d1d";
              (e.currentTarget as HTMLElement).style.borderColor = "#ef4444";
              (e.currentTarget as HTMLElement).style.color = "#fecaca";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "#1e293b";
              (e.currentTarget as HTMLElement).style.borderColor = "#475569";
              (e.currentTarget as HTMLElement).style.color = "#94a3b8";
            }}
          >
            <X className="w-6 h-6" strokeWidth={2.5} />
          </button>
        </div>

        {/* FORM BODY */}
        <div className="p-10 overflow-y-auto flex-1 space-y-7 bg-gradient-to-b from-slate-50/50 to-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Név */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <UserCircle2 className="w-3.5 h-3.5" style={{ color: "#0f172a" }} />
                Teljes név <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl outline-none transition-all font-bold text-slate-900"
                style={{
                  backgroundColor: "#f8fafc",
                  border: "3px solid #cbd5e1",
                  fontSize: "16px",
                }}
                onFocus={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = "#0f172a";
                  (e.target as HTMLInputElement).style.boxShadow = "0 0 0 4px rgba(15,23,42,0.1)";
                  (e.target as HTMLInputElement).style.backgroundColor = "#ffffff";
                }}
                onBlur={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = "#cbd5e1";
                  (e.target as HTMLInputElement).style.boxShadow = "none";
                  (e.target as HTMLInputElement).style.backgroundColor = "#f8fafc";
                }}
                placeholder="Kovács Péter"
              />
            </div>

            {/* Foglalkoztatás */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5" style={{ color: "#0f172a" }} />
                Foglalkoztatás típusa <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div
                className="flex p-1.5 rounded-2xl gap-1"
                style={{ backgroundColor: "#f1f5f9", border: "3px solid #0f172a" }}
              >
                <button
                  type="button"
                  onClick={() => setType("permanent")}
                  className={`flex-1 py-3.5 rounded-xl text-xs font-black tracking-widest transition-all flex items-center justify-center gap-2 ${
                    type === "permanent" ? "shadow-lg" : ""
                  }`}
                  style={{
                    backgroundColor: type === "permanent" ? "#1d4ed8" : "transparent",
                    color: type === "permanent" ? "#ffffff" : "#475569",
                    border: type === "permanent" ? "2px solid #1e40af" : "2px solid transparent",
                  }}
                >
                  <Crown className="w-4 h-4" /> Állandó
                </button>
                <button
                  type="button"
                  onClick={() => setType("substitute")}
                  className={`flex-1 py-3.5 rounded-xl text-xs font-black tracking-widest transition-all flex items-center justify-center gap-2 ${
                    type === "substitute" ? "shadow-lg" : ""
                  }`}
                  style={{
                    backgroundColor: type === "substitute" ? "#7c3aed" : "transparent",
                    color: type === "substitute" ? "#ffffff" : "#475569",
                    border: type === "substitute" ? "2px solid #6d28d9" : "2px solid transparent",
                  }}
                >
                  <Zap className="w-4 h-4" /> Beugrós
                </button>
              </div>
            </div>

            {/* Telefonszám */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" style={{ color: "#0f172a" }} />
                Telefonszám <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl outline-none transition-all font-bold text-slate-900"
                style={{
                  backgroundColor: "#f8fafc",
                  border: "3px solid #cbd5e1",
                  fontSize: "16px",
                }}
                onFocus={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = "#2563eb";
                  (e.target as HTMLInputElement).style.boxShadow = "0 0 0 4px rgba(37, 99, 235, 0.1)";
                  (e.target as HTMLInputElement).style.backgroundColor = "#ffffff";
                }}
                onBlur={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = "#cbd5e1";
                  (e.target as HTMLInputElement).style.boxShadow = "none";
                  (e.target as HTMLInputElement).style.backgroundColor = "#f8fafc";
                }}
                placeholder="+36 30 123 4567"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" style={{ color: "#0f172a" }} />
                Email cím <span style={{ color: "#64748b", fontWeight: 400 }}>(opcionális)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl outline-none transition-all font-bold text-slate-900"
                style={{
                  backgroundColor: "#f8fafc",
                  border: "3px solid #cbd5e1",
                  fontSize: "16px",
                }}
                onFocus={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = "#7c3aed";
                  (e.target as HTMLInputElement).style.boxShadow = "0 0 0 4px rgba(124, 58, 237, 0.1)";
                  (e.target as HTMLInputElement).style.backgroundColor = "#ffffff";
                }}
                onBlur={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = "#cbd5e1";
                  (e.target as HTMLInputElement).style.boxShadow = "none";
                  (e.target as HTMLInputElement).style.backgroundColor = "#f8fafc";
                }}
                placeholder="peter@pannontransfer.hu"
              />
            </div>

            {/* Státusz */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#0f172a" }} />
                Munka állapota <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DriverStatus)}
                className="w-full px-5 py-4 rounded-2xl outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer"
                style={{
                  backgroundColor: "#f8fafc",
                  border: "3px solid #cbd5e1",
                  fontSize: "16px",
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%230f172a' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 1.25rem center",
                  backgroundSize: "1.25rem",
                  paddingRight: "3.25rem",
                }}
                onFocus={(e) => {
                  (e.target as HTMLSelectElement).style.borderColor = "#0f172a";
                  (e.target as HTMLSelectElement).style.boxShadow = "0 0 0 4px rgba(15,23,42,0.1)";
                  (e.target as HTMLSelectElement).style.backgroundColor = "#ffffff";
                }}
                onBlur={(e) => {
                  (e.target as HTMLSelectElement).style.borderColor = "#cbd5e1";
                  (e.target as HTMLSelectElement).style.boxShadow = "none";
                  (e.target as HTMLSelectElement).style.backgroundColor = "#f8fafc";
                }}
              >
                <option value="active">✅ Aktív (Elérhető · dolgozik)</option>
                <option value="inactive">⏸ Inaktív (Nem dolgozik · szabad)</option>
                <option value="on_leave">🏝 Szabadságon / betegszabadságon</option>
              </select>
            </div>

            {/* Jármű */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <CarFront className="w-3.5 h-3.5" style={{ color: "#0f172a" }} />
                Hozzárendelt jármű <span style={{ color: "#64748b", fontWeight: 400 }}>(opcionális)</span>
              </label>
              <input
                value={assignedVehicle}
                onChange={(e) => setAssignedVehicle(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl outline-none transition-all font-bold text-slate-900"
                style={{
                  backgroundColor: "#f8fafc",
                  border: "3px solid #cbd5e1",
                  fontSize: "16px",
                }}
                onFocus={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = "#f59e0b";
                  (e.target as HTMLInputElement).style.boxShadow = "0 0 0 4px rgba(245, 158, 11, 0.1)";
                  (e.target as HTMLInputElement).style.backgroundColor = "#ffffff";
                }}
                onBlur={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = "#cbd5e1";
                  (e.target as HTMLInputElement).style.boxShadow = "none";
                  (e.target as HTMLInputElement).style.backgroundColor = "#f8fafc";
                }}
                placeholder="pl. Mercedes V-Klass #1 · Skoda Superb Barna · Toyota Proace #2"
              />
            </div>

            {/* Megjegyzés */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#0f172a" }} />
                Megjegyzés / Fontos információ <span style={{ color: "#64748b", fontWeight: 400 }}>(opcionális)</span>
              </label>
              <textarea
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl outline-none transition-all font-bold text-slate-900 resize-none"
                style={{
                  backgroundColor: "#fffbeb",
                  border: "3px solid #fde68a",
                  fontSize: "15px",
                  color: "#78350f",
                }}
                onFocus={(e) => {
                  (e.target as HTMLTextAreaElement).style.borderColor = "#f59e0b";
                  (e.target as HTMLTextAreaElement).style.boxShadow = "0 0 0 4px rgba(245, 158, 11, 0.12)";
                }}
                onBlur={(e) => {
                  (e.target as HTMLTextAreaElement).style.borderColor = "#fde68a";
                  (e.target as HTMLTextAreaElement).style.boxShadow = "none";
                }}
                placeholder="Bármilyen különös, fontos, vagy emlékeztető információ... (pl. csak hétvégén érhető el · CATL-re specializált · VIP ügyfelekhez rendelt sofőr)"
              />
            </div>
          </div>
        </div>

        {/* ACTIONS FOOTER */}
        <div
          className="px-10 py-7 flex justify-end gap-4 border-t-3"
          style={{
            backgroundColor: "#f8fafc",
            borderTop: "3px solid #0f172a",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:translate-y-0.5 flex items-center gap-2"
            style={{
              backgroundColor: "#ffffff",
              border: "3px solid #0f172a",
              color: "#0f172a",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "#f1f5f9";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "#ffffff";
            }}
          >
            Mégsem · Bezárás
          </button>
          <button
            disabled={busy}
            type="submit"
            className="px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:opacity-95 transition-all hover:-translate-y-0.5 flex items-center gap-2.5 disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
              color: "#f8fafc",
              border: "3px solid #334155",
              boxShadow: "0 15px 40px -10px rgba(15, 23, 42, 0.6)",
            }}
          >
            <Check className="w-5 h-5" style={{ color: "#fbbf24" }} strokeWidth={3} />
            {busy ? "MENTÉS FOLYAMATBAN..." : "Adatok végleges mentése"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ===========================================================
   CONFIRM MODAL
   =========================================================== */
function ConfirmModal({ title, subtitle, onConfirm, onCancel }: any) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
      style={{ backgroundColor: "rgba(127, 29, 29, 0.85)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-white rounded-[36px] shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
        style={{ border: "4px solid #0f172a", boxShadow: "0 50px 100px -20px rgba(0,0,0,0.7)" }}
      >
        <div
          className="h-3 w-full"
          style={{ background: "linear-gradient(90deg, #ef4444, #dc2626, #ef4444)" }}
        />
        <div className="px-10 py-10">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center mb-7 mx-auto shadow-2xl"
            style={{
              backgroundColor: "#0f172a",
              border: "4px solid #ef4444",
              boxShadow: "0 0 0 8px rgba(239, 68, 68, 0.1)",
            }}
          >
            <Trash2 className="w-12 h-12" style={{ color: "#ef4444" }} strokeWidth={2} />
          </div>
          <h3
            className="text-3xl font-black tracking-tight mb-4 text-center"
            style={{ color: "#0f172a" }}
          >
            {title}
          </h3>
          <p className="text-base font-semibold mb-10 text-center leading-relaxed" style={{ color: "#475569" }}>
            {subtitle}
          </p>
          <div className="flex gap-3.5">
            <button
              onClick={onCancel}
              className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:translate-y-0.5"
              style={{
                backgroundColor: "#f8fafc",
                border: "3px solid #0f172a",
                color: "#0f172a",
              }}
            >
              Mégsem · visszavonás
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:-translate-y-0.5 shadow-2xl flex items-center justify-center gap-2"
              style={{
                backgroundColor: "#dc2626",
                border: "3px solid #991b1b",
                color: "#ffffff",
                boxShadow: "0 15px 40px -10px rgba(220, 38, 38, 0.5)",
              }}
            >
              <Lock className="w-4 h-4" />
              Végleges törlés
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
