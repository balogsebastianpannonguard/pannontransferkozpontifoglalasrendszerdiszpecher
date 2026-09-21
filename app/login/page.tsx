import DispatcherPremiumLogin from "./components/DispatcherPremiumLogin";
import DirectLoginRedirect from "./components/DirectLoginRedirect";
import { findStaffUserByDirectLoginToken } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawToken = typeof params?.token === "string" ? params.token : undefined;

  if (rawToken) {
    const staffUser = await findStaffUserByDirectLoginToken(rawToken);
    if (
      staffUser &&
      staffUser.isActivated &&
      (staffUser.role === "admin" || staffUser.role === "dispatcher")
    ) {
      return <DirectLoginRedirect token={rawToken} />;
    }
  }

  return <DispatcherPremiumLogin />;
}
