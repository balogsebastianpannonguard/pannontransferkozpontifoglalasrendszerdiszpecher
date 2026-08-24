import { Suspense } from "react";
import SetupPasswordClient from "./SetupPasswordClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Fiók aktiválása | Pannon Diszpécser Központ",
  description: "Állítsd be a hozzáférési adataidat a Pannon Diszpécser Központba.",
};

export default function SetupPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-[#0056D2]/20 border-t-[#0056D2] animate-spin" />
        </div>
      }
    >
      <SetupPasswordClient />
    </Suspense>
  );
}
