import { requireAuthSession, getDispatcherProfile, type DispatcherUser } from "@/lib/auth";
import { listAllBookings, type Booking } from "@/lib/bookings";
import BookingsListClient from "./BookingsListClient";

export const dynamic = "force-dynamic";

export default async function BookingsListPage() {
  const session = await requireAuthSession();
  let _userEmail = "dispecer@pannon.hu";

  if (session) {
    const user: DispatcherUser = await getDispatcherProfile(session);
    _userEmail = user.email;
  }

  const bookings = (await listAllBookings()) as Booking[];

  const initialStats = {
    total: bookings.length,
    processing: bookings.filter((b) => b.status === "pending" || b.status === "modified").length,
    confirmed: bookings.filter((b) => b.status === "confirmed" || b.status === "in-progress").length,
    closed: bookings.filter((b) => b.status === "completed" || b.status === "cancelled").length,
  };

  return <BookingsListClient bookings={bookings} initialStats={initialStats} />;
}
