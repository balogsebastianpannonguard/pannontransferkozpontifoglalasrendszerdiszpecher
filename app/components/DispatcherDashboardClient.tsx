"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  CalendarCheck,
  CarFront,
  Users2,
  Clock,
  PlusCircle,
  UserPlus,
  BarChart3,
  Route,
  ShieldAlert,
  ShieldCheck,
  Star,
  Calendar,
} from "lucide-react";

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

export default function DispatcherDashboardClient({
  initialUser,
}: {
  initialUser: DispatcherDashboardUser;
}) {
  const router = useRouter();
  const [user] = useState<DispatcherDashboardUser>(initialUser);

  useEffect(() => {
    // session check: ha minden oké, maradunk itt
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 6
      ? "Jó éjszakát"
      : hour < 11
      ? "Jó reggelt"
      : hour < 18
      ? "Szép napot"
      : "Jó estét";

  const monogram = (() => {
    const name = user?.name || user?.email || "D";
    const parts = name.split(/[._\s@-]/).filter(Boolean);
    if (parts.length === 1) {
      return (parts[0]?.slice(0, 2) || "D").toUpperCase();
    }
    return (
      (parts[0]?.charAt(0) || "D") + (parts[1]?.charAt(0) || "")
    ).toUpperCase();
  })();

  const roleBadge =
    user.role === "admin"
      ? {
          label: "ADMIN",
          gradient: "from-slate-900 to-black",
          text: "text-white",
          border: "border-slate-800",
        }
      : {
          label: "DISZPÉCSER",
          gradient: "from-[#0056D2] to-[#003F9F]",
          text: "text-white",
          border: "border-[#0056D2]",
        };

  const need2FA = !!user.requireTwoFactor && !user.twoFactorEnabled;

  const stats = [
    {
      label: "Mai foglalások",
      value: "0",
      hint: "Napi menetrend",
      color: "from-[#0056D2] to-[#0047BA]",
      soft: "bg-[#0056D2]/5",
      border: "border-[#0056D2]/15",
      icon: (
        <CalendarCheck className="w-6 h-6 text-[#0056D2]" strokeWidth={1.9} />
      ),
    },
    {
      label: "Elérhető járművek",
      value: "—",
      hint: "Kézbesítve",
      color: "from-emerald-600 to-teal-700",
      soft: "bg-emerald-600/5",
      border: "border-emerald-600/15",
      icon: <CarFront className="w-6 h-6 text-emerald-700" strokeWidth={1.9} />,
    },
    {
      label: "Aktív ügyfelek",
      value: "—",
      hint: "Partner kapcsolatok",
      color: "from-indigo-600 to-violet-700",
      soft: "bg-indigo-600/5",
      border: "border-indigo-600/15",
      icon: <Users2 className="w-6 h-6 text-indigo-700" strokeWidth={1.9} />,
    },
    {
      label: "Ma befejezésre vár",
      value: "0",
      hint: "Határidőben",
      color: "from-amber-500 to-orange-600",
      soft: "bg-amber-500/5",
      border: "border-amber-500/15",
      icon: <Clock className="w-6 h-6 text-amber-700" strokeWidth={1.9} />,
    },
  ];

  const quickActions = [
    {
      label: "Foglalás",
      desc: "Új foglalás rögzítése",
      color: "from-[#0056D2] to-[#0047BA]",
      icon: <PlusCircle className="w-5 h-5" strokeWidth={2} />,
    },
    {
      label: "Ügyfél",
      desc: "Partner hozzáadása",
      color: "from-emerald-600 to-teal-700",
      icon: <UserPlus className="w-5 h-5" strokeWidth={2} />,
    },
    {
      label: "Menetrend",
      desc: "Napi és heti",
      color: "from-indigo-600 to-violet-700",
      icon: <Route className="w-5 h-5" strokeWidth={2} />,
    },
    {
      label: "Jelentés",
      desc: "Napi összesítés",
      color: "from-amber-500 to-orange-600",
      icon: <BarChart3 className="w-5 h-5" strokeWidth={2} />,
    },
  ];

  const fmtLogin = (ts: number) => {
    try {
      return new Date(ts).toLocaleString("hu-HU", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "–";
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Sticky Top Nav */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#0056D2] to-[#003F9F] flex items-center justify-center shadow-[0_4px_14px_rgba(0,86,210,0.25)]">
              <span className="text-white font-serif font-bold text-sm tracking-tight">
                P
              </span>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#FFD700] to-[#E6B800] border-2 border-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-slate-900 leading-none font-serif tracking-wide">
                Diszpécser Központ
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 font-medium uppercase tracking-widest">
                {user.company || "Pannon Transfer"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0056D2] to-[#003F9F] flex items-center justify-center text-white font-black text-xs shadow-sm">
                {monogram}
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[12px] font-bold text-slate-900 truncate max-w-[140px]">
                  {user.name}
                </span>
                <span className="text-[9.5px] text-slate-500 font-semibold uppercase tracking-widest">
                  {user.role === "admin" ? "Admin" : "Diszpécser"}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-500 hover:text-red-600 flex items-center justify-center transition-all"
              title="Kijelentkezés"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-7">
        {/* 2FA Warning */}
        {need2FA && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-amber-700" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-amber-900 mb-1">
                Kétfaktoros hitelesítés bekapcsolása kötelező
              </div>
              <p className="text-sm text-amber-800 leading-relaxed">
                A fiókod biztonsága érdekében a rendszergazda kötelezővé tette a 2FA-t. Kérjük,
                menj a Beállításokba és kapcsold be a mobilos kétfaktoros hitelesítést.
              </p>
            </div>
            <button
              onClick={() =>
                alert(
                  "A kétfaktoros hitelesítés beállítása hamarosan itt érhető el. Kérjük, addig is használj erős jelszót és ne oszd meg a hozzáférési adataidat."
                )
              }
              className="shrink-0 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black tracking-widest uppercase transition-colors"
            >
              2FA beállítása
            </button>
          </div>
        )}

        {/* Hero greeting */}
        <section className="relative overflow-hidden rounded-[28px] bg-white border border-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.06)] p-7 sm:p-9">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gradient-to-br from-[#0056D2]/[0.1] via-[#0047BA]/[0.05] to-transparent blur-3xl pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[2px] bg-gradient-to-r from-transparent via-[#FFD700]/50 to-transparent opacity-80 pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row gap-7 lg:items-center lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#0056D2] via-[#0047BA] to-[#003F9F] flex items-center justify-center shadow-[0_18px_40px_rgba(0,86,210,0.3)]">
                  <span className="text-white font-black text-2xl tracking-tight">
                    {monogram}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 border-4 border-white shadow-lg flex items-center justify-center">
                  <Star className="w-4 h-4 text-white" fill="currentColor" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-black tracking-[0.15em] uppercase bg-gradient-to-br ${roleBadge.gradient} ${roleBadge.text} shadow-sm`}
                  >
                    <Star className="w-3 h-3 mr-1" fill="currentColor" />
                    {roleBadge.label}
                  </span>
                  {user.twoFactorEnabled ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black tracking-widest uppercase bg-emerald-50 text-emerald-700 border-emerald-200">
                      <ShieldCheck className="w-3 h-3" />
                      2FA ✓
                    </span>
                  ) : user.requireTwoFactor ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black tracking-widest uppercase bg-amber-50 text-amber-700 border-amber-200">
                      <ShieldAlert className="w-3 h-3" />
                      2FA Kötelező
                    </span>
                  ) : null}
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight mb-2">
                  {greeting}, {user.name}! 👋
                </h1>
                <p className="text-slate-500 font-medium leading-relaxed max-w-2xl">
                  Üdv újra a Pannon Diszpécser Központban. Ma is személyre szabottan fogunk:
                  a foglalások, a járművek és az ügyfelek már várnak.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 font-medium flex-wrap">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Legutóbbi belépés: <strong className="text-slate-800">{fmtLogin(user.loginAt)}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:max-w-sm w-full shrink-0">
              <div className="rounded-2xl bg-gradient-to-br from-[#0056D2] via-[#0047BA] to-[#003F9F] p-6 text-white shadow-[0_18px_44px_rgba(0,86,210,0.35)] relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FFD700]/60 to-transparent opacity-80" />
                <div className="text-[10px] font-black tracking-[0.25em] uppercase text-white/70 mb-2">
                  Hozzáférés szintje
                </div>
                <div className="flex items-baseline gap-2 mb-5">
                  <span className="text-4xl font-black tracking-tight">{user.role === "admin" ? "10" : "8"}</span>
                  <span className="text-white/70 font-semibold">/ 10 jogosultság</span>
                </div>
                <div className="space-y-2 text-xs text-white/90 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
                    {user.role === "admin" ? "Teljes CRM & diszpécser hozzáférés" : "Diszpécseri műveletek"}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Jelszó &amp; profil kezelés
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-300" />
                    Foglalások &amp; menetrend
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2.5">
            <span className="w-1 h-7 rounded-full bg-gradient-to-b from-[#0056D2] to-[#FFD700]" />
            Áttekintés
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <div
                key={i}
                className={`relative rounded-2xl bg-white border ${s.border} shadow-[0_10px_30px_rgba(15,23,42,0.04)] hover:shadow-[0_16px_46px_rgba(15,23,42,0.08)] hover:-translate-y-1 transition-all duration-300 p-5 overflow-hidden`}
              >
                <div className={`absolute -top-12 -right-12 w-36 h-36 rounded-full ${s.soft} blur-2xl pointer-events-none`} />
                <div className="flex items-start justify-between mb-5 relative">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.12)]`}
                  >
                    {s.icon}
                  </div>
                </div>
                <div className="text-xs uppercase tracking-[0.18em] font-black text-slate-500 mb-2">
                  {s.label}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight text-slate-900">{s.value}</span>
                  <span className="text-xs font-semibold text-slate-400">{s.hint}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick actions */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2.5">
            <span className="w-1 h-7 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
            Gyors műveletek
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((a, i) => (
              <button
                key={i}
                onClick={() =>
                  alert(
                    `A „${a.label}” funkció hamarosan elérhető. Addig is nyugodtan vedd fel a kapcsolatot az ügyvezetővel további segítségért.`
                  )
                }
                className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 text-left shadow-[0_10px_30px_rgba(15,23,42,0.04)] hover:shadow-[0_18px_46px_rgba(15,23,42,0.1)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`absolute -top-12 -right-12 w-36 h-36 rounded-full bg-gradient-to-br ${a.color} opacity-5 blur-2xl group-hover:opacity-10 transition-opacity`} />
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${a.color} text-white flex items-center justify-center shadow-[0_6px_16px_rgba(0,0,0,0.12)] mb-4`}
                >
                  {a.icon}
                </div>
                <div className="font-bold text-slate-900 mb-0.5 tracking-tight">{a.label}</div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{a.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Coming soon placeholder */}
        <section className="rounded-3xl bg-white border border-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.05)] p-7 sm:p-9 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0056D2]/5 via-[#0047BA]/5 to-[#FFD700]/10 border border-[#0056D2]/15 flex items-center justify-center mx-auto mb-5">
            <Calendar className="w-8 h-8 text-[#0056D2]" strokeWidth={1.6} />
          </div>
          <h3 className="font-serif text-2xl font-bold text-slate-900 mb-2">
            Foglalási tábla &amp; Menetrend hamarosan
          </h3>
          <p className="text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
            A személyre szabott dashboard folyamatosan bővül. A következő lépésekben itt jelenik meg a
            napi foglalási tábla, a jármű-allokáció és a live kommunikációs központ is.
          </p>
        </section>
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-xs text-slate-400 font-medium leading-relaxed">
          © {new Date().getFullYear()} Pannon Transfer · Ügyvezető: Balog Sebastian Máté
        </p>
      </footer>
    </div>
  );
}
