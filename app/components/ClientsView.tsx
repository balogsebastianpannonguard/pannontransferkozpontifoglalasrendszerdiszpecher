"use client";

import Link from "next/link";
import { ArrowRight, Building2, Check } from "lucide-react";
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
    <div className="max-w-7xl mx-auto w-full">
      <div className="mb-10">
        <h2 className="font-serif text-3xl font-bold tracking-tight text-slate-900 mb-2">Kiemelt Ügyfelek</h2>
        <p className="text-slate-500 font-medium">
          Kezelje a partnercégek foglalásait külön szűrhető, diszpécserbarát nézetben.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {partners.map((partner, index) => (
          <motion.div
            key={partner.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.04 }}
            className="bg-white rounded-3xl p-1 border border-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.02)] hover:shadow-[0_30px_80px_rgba(0,0,0,0.06)] transition-all duration-500 group relative overflow-hidden flex flex-col min-h-[360px]"
          >
            <div className="absolute inset-1 rounded-[22px] bg-gradient-to-b from-white to-slate-50/60 -z-10" />
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent ${partner.gradient.split(" ").slice(0, 2).join(" ")} to-transparent opacity-70 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className={`absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br ${partner.gradient.split(" ").slice(0, 2).join(" ")} rounded-full blur-[40px] opacity-10 group-hover:opacity-20 transition-all duration-700 pointer-events-none`} />

            <div className="p-7 flex flex-col h-full relative z-10">
              <div className="flex items-start justify-between mb-8">
                <div className={`w-16 h-16 rounded-[1.25rem] bg-gradient-to-br ${partner.gradient} flex items-center justify-center shadow-lg relative`}>
                  <span className="text-white font-black text-xl tracking-tighter relative z-10">{partner.short}</span>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 ${partner.tone.soft} ${partner.tone.text} border ${partner.tone.border} rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${partner.tone.dot} animate-pulse`} />
                    Aktív
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    {partner.pendingCount > 0 ? `${partner.pendingCount} nyitott` : "Szinkronizált"}
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{partner.name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-5">{partner.description}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="text-[10px] font-black tracking-[0.18em] uppercase text-slate-400 mb-1">
                      Foglalások
                    </div>
                    <div className="text-2xl font-black tracking-tight text-slate-900 tabular-nums">
                      {partner.totalCount}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="text-[10px] font-black tracking-[0.18em] uppercase text-slate-400 mb-1">
                      Feldolgozás
                    </div>
                    <div className="text-2xl font-black tracking-tight text-slate-900 tabular-nums">
                      {partner.pendingCount}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex gap-3">
                  <Link
                    href={`/bookings?partner=${partner.id}`}
                    className={`flex-1 py-3 bg-gradient-to-r ${partner.gradient} text-white rounded-xl text-[11px] font-black tracking-widest uppercase transition-all shadow-lg inline-flex items-center justify-center gap-2`}
                  >
                    Foglalások
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <div className="shrink-0 px-3 py-3 rounded-xl border border-slate-200 bg-white text-slate-500 inline-flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                  <Building2 className="w-3.5 h-3.5" />
                  Partnerenként elkülönített diszpécseri nézet
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
