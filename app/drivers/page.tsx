import { redirect } from "next/navigation";
import DriversClient from "./DriversClient";
import { requireAuthSession, getDispatcherProfile, type DispatcherUser } from "@/lib/auth";
import { seedDriversIfEmpty } from "@/lib/drivers";

export const dynamic = "force-dynamic";

export default async function DriversPage() {
  const session = await requireAuthSession();
  if (!session) redirect("/login");
  const user: DispatcherUser = await getDispatcherProfile(session);
  try {
    await seedDriversIfEmpty();
  } catch {}
  return <DriversClient />;
}
