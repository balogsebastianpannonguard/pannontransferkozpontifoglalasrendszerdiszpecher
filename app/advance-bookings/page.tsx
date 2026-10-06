import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import AdvanceBookingsClient from "./AdvanceBookingsClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Előre felvett utak · Pannon Transfer" };

export default async function AdvanceBookingsPage() {
  const user = await getCurrentSession();
  // Belépés nélkül a belépőoldal, onnan belépés után vissza ide
  if (!user || (user.role !== "dispatcher" && user.role !== "admin")) {
    redirect("/login?next=/advance-bookings");
  }
  return <AdvanceBookingsClient viewer={{ email: user.email, name: user.name || user.email, role: user.role }} />;
}
