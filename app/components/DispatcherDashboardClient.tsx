"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function DispatcherDashboardClient() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Minimalista Top Nav, semmi profil vagy név */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#0056D2] to-[#003F9F] flex items-center justify-center shadow-[0_4px_14px_rgba(0,86,210,0.25)]">
              <span className="text-white font-serif font-bold text-sm tracking-tight">P</span>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#FFD700] to-[#E6B800] border-2 border-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-slate-900 leading-none font-serif tracking-wide">
                Diszpécser Központ
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 font-medium uppercase tracking-widest">
                Pannon Transfer
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

      {/* Teljesen üres main terület */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Ide jön majd az, amit te kérsz. Egyelőre SEMMI. */}
      </main>
    </div>
  );
}
