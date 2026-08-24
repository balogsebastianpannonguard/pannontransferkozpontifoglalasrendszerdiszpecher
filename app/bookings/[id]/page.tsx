import BookingDetailClient from "./BookingDetailClient";
import { getBookingById, type Booking } from "@/lib/bookings";
import { getDrivers, type Driver } from "@/lib/drivers";
import { listVehicles, type Vehicle } from "@/lib/vehicles";
import { listAuditLogsForTarget, type AuditLog } from "@/lib/audit-logs";
import { requireAuthSession, getDispatcherProfile, type DispatcherUser } from "@/lib/auth";
import {
  MapPinX,
  Home,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuthSession();
  let userEmail = "dispecer@pannon.hu";
  
  if (session) {
    const user: DispatcherUser = await getDispatcherProfile(session);
    userEmail = user.email;
  }

  const { id } = await params;

  const [booking, drivers, vehicles] = await Promise.all([
    getBookingById(id),
    getDrivers(),
    listVehicles(),
  ]);

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex items-center justify-center px-4">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-32 w-[32rem] h-[32rem] rounded-full bg-gradient-to-br from-blue-400/30 to-indigo-500/30 blur-3xl opacity-60" />
          <div className="absolute -bottom-40 -right-20 w-[36rem] h-[36rem] rounded-full bg-gradient-to-tr from-violet-400/20 via-fuchsia-400/10 to-rose-400/20 blur-3xl opacity-70" />
        </div>
        <div className="relative z-10 max-w-lg w-full rounded-3xl bg-white shadow-xl shadow-slate-900/[0.04] border border-slate-200/80 p-10 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-50 to-red-50 border border-rose-200 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <MapPinX className="w-10 h-10 text-rose-500" strokeWidth={1.6} />
          </div>
          <div className="text-[10px] font-black tracking-[0.22em] uppercase text-slate-400 mb-1">
            404 · Nem található
          </div>
          <h1 className="font-serif text-[32px] font-bold tracking-tight text-slate-900 mb-3">
            A foglalás nem létezik
          </h1>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed">
            Az Ön által keresett foglalás törölve lett, vagy sohasem létezett.
            Kérjük, térjen vissza a foglalások listájához.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white text-xs font-black tracking-widest uppercase shadow-lg shadow-slate-900/25 hover:-translate-y-0.5 hover:shadow-xl transition-all"
            >
              <Home className="w-4 h-4" />
              Irányítópult
            </Link>
            <Link
              href="/bookings"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs font-black tracking-widest uppercase shadow-sm hover:bg-slate-50 hover:shadow-md transition-all"
            >
              <ChevronRight className="w-4 h-4" />
              Foglalások listája
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const auditLogs = await listAuditLogsForTarget("booking", id, 20);

  return (
    <BookingDetailClient
      booking={booking as Booking}
      drivers={drivers as Driver[]}
      vehicles={vehicles as Vehicle[]}
      auditLogs={auditLogs as AuditLog[]}
      userEmail={userEmail}
    />
  );
}
