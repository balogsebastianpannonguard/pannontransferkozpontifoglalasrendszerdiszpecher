import { requireAuthSession } from "@/lib/auth";
import NewBookingClient from "./NewBookingClient";

export const dynamic = "force-dynamic";

export default async function NewBookingPage() {
  await requireAuthSession();
  return <NewBookingClient />;
}
