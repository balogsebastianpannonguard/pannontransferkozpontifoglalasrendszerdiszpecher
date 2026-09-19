import { requireAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewBookingClient from "./NewBookingClient";

export const dynamic = "force-dynamic";

export default async function NewBookingPage() {
  const session = await requireAuthSession();
  if (!session) redirect("/login");
  return <NewBookingClient />;
}
