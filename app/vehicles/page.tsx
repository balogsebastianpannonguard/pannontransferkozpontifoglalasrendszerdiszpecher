import { redirect } from "next/navigation";
import VehiclesClient from "./VehiclesClient";
import { requireAuthSession, getDispatcherProfile, type DispatcherUser } from "@/lib/auth";
import { seedVehiclesIfEmpty } from "@/lib/vehicles";

export const dynamic = "force-dynamic";

export default async function VehiclesPage() {
  const session = await requireAuthSession();
  if (!session) redirect("/login");
  const user: DispatcherUser = await getDispatcherProfile(session);
  try {
    await seedVehiclesIfEmpty();
  } catch {}
  return <VehiclesClient />;
}
