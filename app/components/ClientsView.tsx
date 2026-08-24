"use client";

import { MailOpen, ArrowRight, ShieldCheck, Check, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export function ClientsView() {
  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-10">
        <h2 className="font-serif text-3xl font-bold tracking-tight text-slate-900 mb-2">Kiemelt Ügyfelek</h2>
        <p className="text-slate-500 font-medium">Tekintse át a partnercégek és delegációk foglalási rendszereit.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* PREMIUM CATL Card */}
        <div className="bg-white rounded-3xl p-1 border border-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.02)] hover:shadow-[0_30px_80px_rgba(0,0,0,0.06)] transition-all duration-500 group relative overflow-hidden flex flex-col min-h-[340px]">
          
          <div className="absolute inset-1 rounded-[22px] bg-gradient-to-b from-white to-slate-50/50 -z-10" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-[#0047BA] to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br from-[#0047BA]/10 to-[#00B4D8]/10 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
          
          <div className="p-7 flex flex-col h-full relative z-10">
            <div className="flex items-start justify-between mb-8">
              <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-[#0047BA] to-[#00B4D8] flex items-center justify-center shadow-lg shadow-[#0047BA]/20 relative">
                <div className="absolute inset-0 rounded-[1.25rem] bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="text-white font-black text-xl tracking-tighter relative z-10">CATL</span>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Aktív
                </span>
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  Enterprise
                </span>
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900 mb-2">CATL Hungary Kft.</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-5">
                Hivatalos delegációs és dolgozói transzferek. Speciális árazás és feltételek.
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-bold tracking-widest uppercase text-slate-400">Portál elérés</span>
                <a href="/catl" target="_blank" rel="noopener noreferrer" className="group/link flex items-center gap-1.5">
                  <span className="text-sm font-bold text-[#0047BA] group-hover/link:text-[#00B4D8] transition-colors">/catl</span>
                  <div className="w-6 h-6 rounded-full bg-[#0047BA]/5 flex items-center justify-center group-hover/link:bg-[#00B4D8]/10 transition-colors">
                    <svg className="w-3 h-3 text-[#0047BA] group-hover/link:text-[#00B4D8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </div>
                </a>
              </div>

              <div className="flex gap-3 mt-4">
                <button className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-black tracking-widest uppercase transition-colors shadow-lg shadow-slate-900/20">
                  Foglalások
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}