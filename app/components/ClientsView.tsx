"use client";

import Link from "next/link";
import { ArrowRight, Building2, Check, Star, Building } from "lucide-react";
import { motion } from "framer-motion";
import {
  getAllPartnerMeta,
  getPartnerColorClasses,
  resolvePartnerMeta,
} from "@/lib/partner-meta";

interface ClientViewBooking {
  portal?: string;
  companyName?: string;
  travelerEmail: string;
  userEmail?: string;
  status: string;
}

const partnerDescriptions: Record<string, string> = {
  catl: "Hivatalos delegációs és dolgozói transzferek. Speciális árazás és feltételek.",
  ecopro: "Debrecen-Budapest és repülőtéri transzferek vállalati kezelőfelülete.",
  eccoino: "Nemzetközi partnerfoglalások elkülönített követéssel és saját booking folyamattal.",
  vitesco: "Autóipari partnerfoglalások külön vállalati igényekkel és leválasztott nyomon követéssel.",
  schaeffler: "Schaeffler munkatársi és delegációs foglalások saját partneres folyamattal.",
  krones: "Gyártási és üzleti utak partnerenként elkülönítve, diszpécseri kezeléssel.",
  enterair: "Repüléshez kapcsolódó transzferek saját partnerlogikával és teljes követhetőséggel.",
  tama: "Dedikált partneroldal saját feltételrendszerrel és elkülönített foglalási nézettel.",
  ni: "National Instruments partnerfoglalások központi diszpécseri integrációval.",
};

export function ClientsView({ bookings = [] }: { bookings?: ClientViewBooking[] }) {
  const partners = getAllPartnerMeta().map((partner) => {
    const partnerBookings = bookings.filter((booking) => resolvePartnerMeta(booking)?.id === partner.id);
    const pendingCount = partnerBookings.filter(
      (booking) => booking.status === "pending" || booking.status === "modified"
    ).length;
    const tone = getPartnerColorClasses(partner.accent);

    return {
      ...partner,
      tone,
      totalCount: partnerBookings.length,
      pendingCount,
      description: partnerDescriptions[partner.id],
    };
  });

  return (
    <div className="max-w-7xl mx-auto w-full relative z-10 font-sans">
      <div className="mb-12 flex items-center gap-5">
        <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 shrink-0 group">
          <div className="absolute inset-0 bg-blue-400/20 rounded-2xl blur-md group-hover:blur-xl transition-all duration-500"></div>
          <Star className="w-7 h-7 text-blue-600 relative z-10 group-hover:scale-110 transition-transform duration-500" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-black tracking-widest uppercase text-blue-600 mb-1">
            <Building className="w-4 h-4" strokeWidth={2.5} />
            <span>Partnerek</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
            Kiemelt Ügyfelek
          </h2>
          <p className="text-sm font-semibold text-slate-500 mt-2 max-w-xl leading-relaxed">
            Kezelje a partnercégek foglalásait külön szűrhető, diszpécserbarát nézetben.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
        {partners.map((partner, index) => (
          <motion.div
            key={partner.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.08, ease: [0.23, 1, 0.32, 1] }}
            className="group relative flex flex-col overflow-hidden rounded-[2.5rem] bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] hover:-translate-y-2 transition-all duration-500 min-h-[400px]"
          >
            {/* Abstract animated background blobs inside card */}
            <div className={`absolute -right-10 -top-10 w-48 h-48 bg-gradient-to-br ${partner.gradient.split(" ").slice(0, 2).join(" ")} rounded-full blur-[50px] opacity-10 group-hover:opacity-30 group-hover:scale-150 transition-all duration-1000 pointer-events-none`}></div>
            <div className={`absolute -left-10 -bottom-10 w-40 h-40 bg-gradient-to-br ${partner.gradient.split(" ").slice(0, 2).join(" ")} rounded-full blur-[40px] opacity-10 group-hover:opacity-30 group-hover:scale-150 transition-all duration-1000 delay-100 pointer-events-none`}></div>

            {/* Shimmer effect on hover */}
            <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 group-hover:left-[200%] transition-all duration-1000 ease-in-out pointer-events-none z-20"></div>

            <div className="p-7 sm:p-8 flex flex-col h-full relative z-10">
              {/* Header area */}
              <div className="flex items-start justify-between mb-8">
                <div className="relative group/avatar">
                  <div className={`flex items-center justify-center w-20 h-20 rounded-[1.5rem] bg-gradient-to-br ${partner.gradient} text-white font-black text-2xl shadow-[0_12px_24px_-8px_rgba(0,0,0,0.4)] border-[5px] border-white -rotate-3 group-hover:rotate-0 transition-all duration-500 group-hover/avatar:scale-105`}>
                    {partner.short}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2.5">
                  <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-sm backdrop-blur-md ${partner.tone.soft} ${partner.tone.text} ${partner.tone.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${partner.tone.dot} animate-pulse`} />
                    Aktív
                  </span>
                  <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 shadow-inner">
                    {partner.pendingCount > 0 ? (
                      <span className="text-amber-500">{partner.pendingCount} nyitott</span>
                    ) : (
                      "Szinkronizált"
                    )}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 flex flex-col">
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight group-hover:text-blue-600 transition-colors">
                  {partner.name}
                </h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8 flex-1">
                  {partner.description}
                </p>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 group-hover:bg-blue-50/50 group-hover:border-blue-100 transition-colors">
                    <div className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-1.5 flex items-center gap-1">
                      Foglalások
                    </div>
                    <div className="text-3xl font-black tracking-tighter text-slate-900">
                      {partner.totalCount}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 group-hover:bg-amber-50/50 group-hover:border-amber-100 transition-colors">
                    <div className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-1.5 flex items-center gap-1">
                      Feldolgozás
                    </div>
                    <div className={`text-3xl font-black tracking-tighter ${partner.pendingCount > 0 ? 'text-amber-500' : 'text-slate-900'}`}>
                      {partner.pendingCount}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-5 border-t border-slate-100/80">
                <div className="flex gap-3">
                  <Link
                    href={`/bookings?partner=${partner.id}`}
                    className={`flex-1 py-4 bg-gradient-to-r ${partner.gradient} text-white rounded-2xl text-[12px] font-black tracking-widest uppercase transition-all duration-300 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_24px_-6px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 flex items-center justify-center gap-2 group/btn`}
                  >
                    Foglalások
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" strokeWidth={3} />
                  </Link>
                  <div className="shrink-0 w-14 h-14 rounded-2xl border border-slate-200 bg-white text-slate-400 flex items-center justify-center shadow-sm group-hover:border-emerald-200 group-hover:text-emerald-500 group-hover:bg-emerald-50 transition-all duration-300">
                    <Check className="w-5 h-5" strokeWidth={3} />
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  <Building2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Elkülönített partner nézet
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
