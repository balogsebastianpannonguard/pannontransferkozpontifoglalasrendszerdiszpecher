import os

content = """\"\"\"use client\"\"\";

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
} from "lucide-react";
import type { Driver, DriverStatus, DriverType } from "@/lib/drivers";

const STATUS_META: Record<DriverStatus, { label: string; icon: any; dot: string; bg: string; border: string; text: string }> = {
  active: {
    label: "Aktív",
    icon: ShieldCheck,
    dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-600",
  },
  inactive: {
    label: "Inaktív",
    icon: Clock,
    dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-600",
  },
  on_leave: {
    label: "Szabadság",
    icon: Briefcase,
    dot: "bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.8)]",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    text: "text-slate-600",
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
    cardHeader: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
    cardBg: "bg-white",
    accentText: "text-blue-600",
  },
  substitute: {
    label: "Beugrós",
    badgeBg: "bg-violet-500/10",
    badgeText: "text-violet-700",
    badgeBorder: "border-violet-500/20",
    cardHeader: "bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950",
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
    "from-amber-500 to-yellow-400"
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
    <div className=\"min-h-screen pb-24 bg-slate-50 relative overflow-hidden font-sans\">
      {/* Decorative background blobs */}
      <div className=\"absolute top-0 left-0 w-full h-96 overflow-hidden pointer-events-none z-0\">
        <div className=\"absolute -top-32 -left-32 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl\"></div>
        <div className=\"absolute top-0 right-0 w-[500px] h-[500px] bg-violet-400/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3\"></div>
      </div>

      {/* HEADER */}
      <header className=\"sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-white shadow-[0_4px_30px_rgba(0,0,0,0.03)]\">
        <div className=\"max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between\">
          <div className=\"flex items-center gap-5\">
            <button
              onClick={() => router.push(\"/\")}
              className=\"w-11 h-11 rounded-2xl bg-white shadow-sm border border-slate-200/60 flex items-center justify-center transition-all duration-300 hover:shadow-md hover:scale-105 active:scale-95 text-slate-500 hover:text-slate-800\"
            >
              <ArrowLeft className=\"w-5 h-5\" strokeWidth={2.5} />
            </button>
            <div>
              <div className=\"flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-blue-600 mb-1\">
                <Users className=\"w-3.5 h-3.5\" strokeWidth={2.5} />
                <span>Munkatársak</span>
              </div>
              <h1 className=\"text-2xl font-extrabold text-slate-900 tracking-tight leading-none\">
                Sofőrök kezelése
              </h1>
            </div>
          </div>

          <div className=\"flex items-center gap-4\">
            <div className=\"relative hidden md:block w-80 group\">
              <div className=\"absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none\">
                <Search className=\"w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors\" strokeWidth={2.5} />
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder=\"Keresés név, email, jármű alapján...\"
                className=\"w-full pl-11 pr-4 py-2.5 bg-white/80 border border-slate-200/80 rounded-2xl text-sm font-semibold outline-none transition-all duration-300 placeholder:text-slate-400 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 shadow-sm\"
              />
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className=\"px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-sm font-bold shadow-[0_8px_16px_-6px_rgba(15,23,42,0.4)] transition-all duration-300 hover:shadow-[0_12px_20px_-6px_rgba(15,23,42,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none flex items-center gap-2\"
            >
              <Plus className=\"w-4 h-4\" strokeWidth={2.5} />
              Új Sofőr
            </button>
          </div>
        </div>
      </header>

      <main className=\"max-w-7xl mx-auto px-6 lg:px-8 mt-8 relative z-10\">
        {/* STATS */}
        <div className=\"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10\">
          <StatCard title=\"Összes munkatárs\" value={stats.total} icon={Users} colorClass=\"text-blue-600\" bgClass=\"bg-blue-500/10\" borderClass=\"border-blue-100\" />
          <StatCard title=\"Aktív állomány\" value={stats.active} icon={ShieldCheck} colorClass=\"text-emerald-600\" bgClass=\"bg-emerald-500/10\" borderClass=\"border-emerald-100\" glow />
          <StatCard title=\"Állandó sofőrök\" value={stats.permanent} icon={Crown} colorClass=\"text-indigo-600\" bgClass=\"bg-indigo-500/10\" borderClass=\"border-indigo-100\" />
          <StatCard title=\"Beugrós sofőrök\" value={stats.substitute} icon={Zap} colorClass=\"text-violet-600\" bgClass=\"bg-violet-500/10\" borderClass=\"border-violet-100\" />
        </div>

        {loading ? <LoadingState /> : drivers.length === 0 ? <EmptyState onStart={() => setShowAdd(true)} /> : (
          <div className=\"space-y-12\">
            
            {/* ÁLLANDÓ SZEKCIÓ */}
            {permanent.length > 0 && (
              <section className=\"animate-in fade-in slide-in-from-bottom-4 duration-700\">
                <div className=\"flex items-center gap-3 mb-6\">
                  <div className=\"w-1.5 h-7 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]\" />
                  <h2 className=\"text-2xl font-extrabold text-slate-900 tracking-tight\">
                    Állandó Sofőrök
                  </h2>
                  <span className=\"px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 ml-2\">
                    {permanent.length} fő
                  </span>
                </div>
                <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">
                  {permanent.map(d => (
                    <DriverCard key={d._id} driver={d} onEdit={() => setEditing(d)} onDelete={() => setDeleteTarget(d)} onPatch={patchDriver} />
                  ))}
                </div>
              </section>
            )}

            {/* BEUGRÓS SZEKCIÓ */}
            {substitute.length > 0 && (
              <section className=\"animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150\">
                <div className=\"flex items-center gap-3 mb-6 pt-8 relative\">
                  <div className=\"absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent\"></div>
                  <div className=\"w-1.5 h-7 rounded-full bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.6)]\" />
                  <h2 className=\"text-2xl font-extrabold text-slate-900 tracking-tight\">
                    Beugrós Sofőrök
                  </h2>
                  <span className=\"px-3 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-700 ml-2\">
                    {substitute.length} fő
                  </span>
                </div>
                <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">
                  {substitute.map(d => (
                    <DriverCard key={d._id} driver={d} onEdit={() => setEditing(d)} onDelete={() => setDeleteTarget(d)} onPatch={patchDriver} />
                  ))}
                </div>
              </section>
            )}

            {permanent.length === 0 && substitute.length === 0 && search && (
              <div className=\"py-24 text-center rounded-3xl bg-white/50 backdrop-blur-md border border-slate-200/60 shadow-sm animate-in zoom-in-95 duration-500\">
                <div className=\"w-20 h-20 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4\">
                  <Search className=\"w-10 h-10 text-slate-400\" />
                </div>
                <h3 className=\"text-xl font-extrabold text-slate-900 mb-2\">Nincs találat a keresésre</h3>
                <p className=\"text-sm font-medium text-slate-500\">Keresett kifejezés: <span className=\"text-slate-800 font-bold\">\"{search}\"</span></p>
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
          title=\"Sofőr törlése\"
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
    <div className=\"space-y-12 animate-pulse\">
      <div className=\"space-y-6\">
        <div className=\"h-8 w-64 rounded-xl bg-slate-200/80\" />
        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">
          {[1, 2, 3].map(i => (
            <div key={i} className=\"h-[420px] rounded-3xl bg-white/60 border border-slate-200/50\" />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className=\"py-28 px-6 text-center rounded-[2.5rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/20 relative overflow-hidden\">
      <div className=\"absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-blue-50/50 to-transparent rounded-full blur-3xl pointer-events-none\"></div>
      <div className=\"relative z-10\">
        <div className=\"w-24 h-24 mx-auto rounded-[2rem] bg-gradient-to-tr from-slate-100 to-white shadow-inner border border-white flex items-center justify-center mb-6 relative group\">
          <div className=\"absolute inset-0 bg-blue-400/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500\"></div>
          <UserCircle2 className=\"w-12 h-12 text-slate-400 relative z-10\" strokeWidth={1.5} />
        </div>
        <h3 className=\"text-2xl font-extrabold text-slate-900 mb-3\">Nincs még sofőr rögzítve</h3>
        <p className=\"text-slate-500 font-medium mb-8 max-w-sm mx-auto leading-relaxed\">
          Úgy tűnik, még nem adtál hozzá munkatársat a rendszerhez. Kezdd el most a csapat építését!
        </p>
        <button
          onClick={onStart}
          className=\"px-8 py-3.5 rounded-2xl bg-slate-900 text-white font-bold shadow-[0_8px_20px_-6px_rgba(15,23,42,0.4)] transition-all duration-300 hover:shadow-[0_14px_24px_-6px_rgba(15,23,42,0.5)] hover:-translate-y-1 flex items-center gap-3 mx-auto\"
        >
          <Plus className=\"w-5 h-5\" strokeWidth={2.5} /> Első munkatárs hozzáadása
        </button>
      </div>
    </div>
  );
}

/* ======= STAT CARD ======= */
function StatCard({ title, value, icon: Icon, colorClass, bgClass, borderClass, glow }: any) {
  return (
    <div className={`relative overflow-hidden rounded-3xl p-6 bg-white border ${borderClass} shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 group`}>
      <div className=\"absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-40\" style={{ backgroundColor: 'currentColor' }}></div>
      <div className=\"flex items-center gap-4 relative z-10\">
        <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${bgClass} ${colorClass}`}>
          <Icon className=\"w-6 h-6\" strokeWidth={2} />
          {glow && (
            <span className=\"absolute -top-1 -right-1 flex h-3.5 w-3.5\">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${bgClass.replace('/10', '')}`} />
              <span className={`relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-white ${bgClass.replace('/10', '')}`} />
            </span>
          )}
        </div>
        <div>
          <div className=\"text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-1.5\">{title}</div>
          <div className=\"text-3xl font-black text-slate-900 leading-none tracking-tight\">{value}</div>
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
  const initials = driver.name.split(\" \").map((n: string) => n[0]).slice(0, 2).join(\"\").toUpperCase();
  
  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-[2rem] bg-white border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-500 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-1 ${driver.status !== \"active\" ? \"opacity-90 hover:opacity-100\" : \"\"}`}>
      
      {/* CARD HEADER (Dark/Gradient) */}
      <div className={`relative h-28 ${typeMeta.cardHeader} overflow-hidden`}>
        {/* Abstract shapes in header */}
        <div className=\"absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl\"></div>
        <div className=\"absolute -left-10 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-xl\"></div>
        
        {/* Action Buttons */}
        <div className=\"absolute right-3 top-3 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-1 group-hover:translate-y-0\">
          <ActionBtn onClick={onEdit} icon={Pencil} />
          <ActionBtn onClick={onDelete} icon={Trash2} danger />
        </div>
      </div>

      {/* AVATAR OVERLAPPING */}
      <div className=\"px-6 relative -mt-12 mb-3 flex justify-between items-end\">
        <div className=\"relative\">
          <div className={`flex items-center justify-center w-24 h-24 rounded-[1.5rem] bg-gradient-to-br ${avatarGrad} text-white font-black text-3xl shadow-[0_8px_16px_-6px_rgba(0,0,0,0.3)] border-4 border-white rotate-3 group-hover:rotate-0 transition-transform duration-500`}>
            {initials}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center ${meta.dot}`}></div>
        </div>
        
        <div className=\"flex flex-col items-end gap-1.5 pb-2\">
          <Badge label={typeMeta.label} bg={typeMeta.badgeBg} color={typeMeta.badgeText} border={typeMeta.badgeBorder} icon={Sparkles} />
          <Badge label={meta.label} bg={meta.bg} color={meta.text} border={meta.border} icon={StatusIcon} />
        </div>
      </div>

      {/* CARD BODY */}
      <div className=\"px-6 flex-1 flex flex-col\">
        <h3 className=\"text-xl font-extrabold text-slate-900 tracking-tight mb-3 line-clamp-1\">
          {driver.name}
        </h3>
        
        <div className=\"flex items-center gap-2 mb-5\">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${driver.assignedVehicle ? 'bg-blue-50' : 'bg-slate-50'}`}>
            <CarFront className={`w-4 h-4 ${driver.assignedVehicle ? 'text-blue-600' : 'text-slate-400'}`} />
          </div>
          <span className={`text-sm font-bold truncate ${driver.assignedVehicle ? 'text-slate-700' : 'text-slate-400'}`}>
            {driver.assignedVehicle || \"Nincs jármű rendelve\"}
          </span>
        </div>

        <div className=\"space-y-2 mb-6\">
          <InfoRow icon={Phone} label={driver.phone || \"Nincs megadva telefonszám\"} />
          {driver.email && <InfoRow icon={Mail} label={driver.email} />}
        </div>

        {driver.note && (
          <div className=\"mt-auto mb-6 flex items-start gap-3 rounded-2xl p-4 bg-amber-50/50 border border-amber-100/50\">
            <AlertTriangle className=\"w-4 h-4 text-amber-500 shrink-0 mt-0.5\" />
            <div className=\"text-xs font-semibold text-amber-800 leading-relaxed\">{driver.note}</div>
          </div>
        )}
      </div>

      {/* CARD FOOTER (Quick Actions) */}
      <div className=\"p-2 mt-auto border-t border-slate-100 bg-slate-50/50\">
        <div className=\"grid grid-cols-3 gap-2\">
          <QuickStatusBtn label=\"Aktív\" onClick={() => onPatch(driver._id, { status: \"active\" })} active={driver.status === \"active\"} activeColor=\"text-emerald-700\" activeBg=\"bg-emerald-100\" border=\"border-emerald-200\" defaultText=\"text-slate-500\" hoverBg=\"hover:bg-slate-100\" />
          <QuickStatusBtn label=\"Inaktív\" onClick={() => onPatch(driver._id, { status: \"inactive\" })} active={driver.status === \"inactive\"} activeColor=\"text-amber-700\" activeBg=\"bg-amber-100\" border=\"border-amber-200\" defaultText=\"text-slate-500\" hoverBg=\"hover:bg-slate-100\" />
          <QuickStatusBtn label=\"Szabadság\" onClick={() => onPatch(driver._id, { status: \"on_leave\" })} active={driver.status === \"on_leave\"} activeColor=\"text-slate-700\" activeBg=\"bg-slate-200\" border=\"border-slate-300\" defaultText=\"text-slate-500\" hoverBg=\"hover:bg-slate-100\" />
        </div>
      </div>
    </div>
  );
}

function Badge({ label, bg, color, border, icon: Icon }: any) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-xl border ${border} ${bg} px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${color}`}>
      {Icon && <Icon className=\"w-3 h-3\" strokeWidth={2.5} />}
      {label}
    </span>
  );
}

function ActionBtn({ onClick, icon: Icon, danger }: any) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 transition-all duration-300 hover:scale-110 hover:bg-white/20 ${danger ? 'text-red-400 hover:text-red-300' : 'text-white'}`}
    >
      <Icon className=\"w-4 h-4\" strokeWidth={2.5} />
    </button>
  );
}

function InfoRow({ icon: Icon, label }: any) {
  return (
    <div className=\"flex items-center gap-3 text-sm group\">
      <div className=\"flex items-center justify-center w-8 h-8 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600 transition-colors\">
        <Icon className=\"w-4 h-4\" strokeWidth={2} />
      </div>
      <span className=\"font-medium text-slate-600 truncate\">{label}</span>
    </div>
  );
}

function QuickStatusBtn({ label, onClick, active, activeColor, activeBg, border, defaultText, hoverBg }: any) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`flex items-center justify-center rounded-xl py-2.5 text-[10px] font-extrabold uppercase tracking-widest transition-all duration-200 border ${active ? `${activeBg} ${activeColor} ${border} shadow-sm` : `bg-transparent border-transparent ${defaultText} ${hoverBg}`}`}
    >
      {label}
    </button>
  );
}

/* ======= MODALS ======= */
function DriverFormModal({ initial, onClose, onSubmit }: any) {
  const [name, setName] = useState(initial?.name || \"\");
  const [type, setType] = useState<DriverType>(initial?.type || \"permanent\");
  const [phone, setPhone] = useState(initial?.phone || \"\");
  const [email, setEmail] = useState(initial?.email || \"\");
  const [assignedVehicle, setAssignedVehicle] = useState(initial?.assignedVehicle || \"\");
  const [status, setStatus] = useState<DriverStatus>(initial?.status || \"active\");
  const [note, setNote] = useState(initial?.note || \"\");
  const [busy, setBusy] = useState(false);

  const submit = async (e: any) => {
    e.preventDefault();
    setBusy(true);
    await onSubmit({ name, type, phone, email, assignedVehicle, status, note });
    setBusy(false);
  };

  return (
    <div className=\"fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-slate-900/60 animate-in fade-in duration-300\" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className=\"w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300\">
        
        {/* Header */}
        <div className=\"px-8 py-6 flex items-center justify-between border-b border-slate-100 bg-white relative z-10\">
          <div>
            <h2 className=\"text-2xl font-extrabold text-slate-900 tracking-tight\">
              {initial ? \"Sofőr szerkesztése\" : \"Új sofőr rögzítése\"}
            </h2>
            <p className=\"text-sm font-medium text-slate-500 mt-1\">
              Töltsd ki a munkatárs adatait az űrlapon.
            </p>
          </div>
          <button type=\"button\" onClick={onClose} className=\"p-2.5 rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors\">
            <X className=\"w-5 h-5\" strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className=\"p-8 overflow-y-auto flex-1 bg-slate-50/50\">
          <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
            <Field label=\"Teljes név\" required mdFull>
              <Input value={name} onChange={setName} placeholder=\"Kovács Péter\" autoFocus />
            </Field>

            <Field label=\"Foglalkoztatás típusa\" required>
              <div className=\"flex p-1.5 rounded-2xl bg-slate-100/80 border border-slate-200/50\">
                <button type=\"button\" onClick={() => setType(\"permanent\")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${type === \"permanent\" ? \"bg-white text-blue-600 shadow-sm\" : \"text-slate-500 hover:text-slate-700\"}`}>
                  Állandó
                </button>
                <button type=\"button\" onClick={() => setType(\"substitute\")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${type === \"substitute\" ? \"bg-white text-violet-600 shadow-sm\" : \"text-slate-500 hover:text-slate-700\"}`}>
                  Beugrós
                </button>
              </div>
            </Field>

            <Field label=\"Állapot\" required>
              <div className=\"relative\">
                <select value={status} onChange={(e) => setStatus(e.target.value as DriverStatus)} className=\"w-full pl-4 pr-10 py-3.5 rounded-2xl outline-none font-bold appearance-none bg-white border border-slate-200 text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm\">
                  <option value=\"active\">Aktív (Elérhető)</option>
                  <option value=\"inactive\">Inaktív</option>
                  <option value=\"on_leave\">Szabadságon</option>
                </select>
                <div className=\"absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none\">
                  <div className=\"w-2 h-2 border-r-2 border-b-2 border-slate-400 rotate-45\"></div>
                </div>
              </div>
            </Field>

            <Field label=\"Telefonszám\" required>
              <Input value={phone} onChange={setPhone} placeholder=\"+36 30 123 4567\" icon={Phone} />
            </Field>
            
            <Field label=\"Email cím\">
              <Input value={email} onChange={setEmail} type=\"email\" placeholder=\"Opcionális\" icon={Mail} />
            </Field>

            <Field label=\"Hozzárendelt jármű\" mdFull>
              <Input value={assignedVehicle} onChange={setAssignedVehicle} placeholder=\"pl. Mercedes V-Klass (Opcionális)\" icon={CarFront} />
            </Field>
            
            <Field label=\"Megjegyzés, belső infók\" mdFull>
              <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className=\"w-full px-4 py-3.5 rounded-2xl outline-none font-medium resize-none bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm placeholder:text-slate-400 text-slate-700\" placeholder=\"Fontos információk, preferenciák...\" />
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div className=\"px-8 py-5 flex justify-end gap-3 border-t border-slate-100 bg-white relative z-10\">
          <button type=\"button\" onClick={onClose} className=\"px-6 py-3 rounded-2xl text-sm font-bold bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors\">
            Mégsem
          </button>
          <button disabled={busy} type=\"submit\" className=\"px-8 py-3 rounded-2xl text-sm font-bold bg-blue-600 text-white shadow-[0_8px_16px_-6px_rgba(37,99,235,0.4)] transition-all hover:shadow-[0_12px_20px_-6px_rgba(37,99,235,0.5)] hover:-translate-y-0.5 disabled:opacity-70 disabled:pointer-events-none flex items-center gap-2\">
            {busy ? \"Mentés folyamatban...\" : (initial ? \"Változások mentése\" : \"Sofőr hozzáadása\")}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, mdFull, children }: any) {
  return (
    <div className={`space-y-2 ${mdFull ? \"md:col-span-2\" : \"\"}`}>
      <label className=\"text-xs font-extrabold text-slate-700 ml-1 uppercase tracking-widest\">
        {label} {required && <span className=\"text-red-500\">*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = \"text\", icon: Icon, autoFocus }: any) {
  return (
    <div className=\"relative\">
      {Icon && (
        <div className=\"absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none\">
          <Icon className=\"w-4 h-4 text-slate-400\" />
        </div>
      )}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} className={`w-full ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3.5 rounded-2xl outline-none font-semibold bg-white border border-slate-200 text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm placeholder:text-slate-400 placeholder:font-medium`} />
    </div>
  );
}

function ConfirmModal({ title, subtitle, onConfirm, onCancel }: any) {
  return (
    <div className=\"fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 animate-in fade-in duration-300\" onClick={onCancel}>
      <div className=\"w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300\" onClick={(e) => e.stopPropagation()}>
        <div className=\"w-20 h-20 rounded-full bg-red-50 mx-auto flex items-center justify-center mb-5 border-4 border-white shadow-[0_0_0_4px_rgba(254,226,226,0.5)]\">
          <Trash2 className=\"w-8 h-8 text-red-500\" strokeWidth={2.5} />
        </div>
        <h3 className=\"text-2xl font-extrabold text-slate-900 mb-2 tracking-tight\">{title}</h3>
        <p className=\"text-sm font-medium text-slate-500 mb-8 leading-relaxed\">{subtitle}</p>
        <div className=\"flex flex-col gap-3\">
          <button onClick={onConfirm} className=\"w-full py-3.5 rounded-2xl text-sm font-bold bg-red-500 text-white shadow-[0_8px_16px_-6px_rgba(239,68,68,0.4)] hover:shadow-[0_12px_20px_-6px_rgba(239,68,68,0.5)] hover:-translate-y-0.5 transition-all\">
            Igen, törlöm
          </button>
          <button onClick={onCancel} className=\"w-full py-3.5 rounded-2xl text-sm font-bold bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors\">
            Mégsem
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ ok, msg }: { ok: boolean; msg: string }) {
  return (
    <div className=\"fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300\">
      <div className={`px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border ${ok ? 'bg-white border-emerald-100' : 'bg-white border-red-100'}`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${ok ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
          {ok ? <Check className=\"w-4 h-4\" strokeWidth={3} /> : <AlertTriangle className=\"w-4 h-4\" strokeWidth={3} />}
        </div>
        <div className=\"text-sm font-bold text-slate-800 pr-2\">{msg}</div>
      </div>
    </div>
  );
}
"""

with open('/Users/balogsebastian/Downloads/pannontransferweboldal/pannontransferkozpontifoglalasrendszerdiszpecher/app/drivers/DriversClient.tsx', 'w') as f:
    f.write(content)

print("Done")
