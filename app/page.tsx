import { redirect } from "next/navigation";
import DispatcherDashboardClient from "./components/DispatcherDashboardClient";
import { requireAuthSession, getDispatcherProfile, type DispatcherUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await requireAuthSession();
  if (!session) {
    redirect("/login");
  }
  const user: DispatcherUser = await getDispatcherProfile(session);
  const userForClient = {
    email: user.email,
    name: user.name,
    role: user.role,
    company: user.company || "Pannon Transfer",
    loginAt: user.loginAt,
    requireTwoFactor: !!user.requireTwoFactor,
    twoFactorEnabled: !!user.twoFactorEnabled,
    staffId: user.staffId,
  };
  return <DispatcherDashboardClient initialUser={userForClient} />;
}
