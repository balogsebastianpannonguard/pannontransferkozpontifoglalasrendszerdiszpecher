import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, isVerifiedAdmin } from "@/lib/auth";
import {
  deleteBookingById,
  getBookingById,
  markBookingTouchedByDispatcher,
  updateBooking,
  type Booking,
} from "@/lib/bookings";
import { createAuditLog } from "@/lib/audit-logs";
import { getPartnerPricingByKey } from "@/lib/partner-pricing";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;
const PHONE_RE = /^\+?[0-9][0-9\s()\-/.]{4,24}$/;

function splitList(value: unknown, separator: RegExp = /[\s,;]+/): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(separator)
    .map((v) => v.trim())
    .filter(Boolean);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Nincs jogosultságod" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const booking = await getBookingById(id);
    if (!booking) {
      return NextResponse.json({ error: "Foglalás nem található" }, { status: 404 });
    }
    return NextResponse.json({ booking });
  } catch (err) {
    console.error("[booking GET error]", err);
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Nincs jogosultságod" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = await getBookingById(id);
    if (!existing) {
      return NextResponse.json({ error: "Foglalás nem található" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as Partial<Booking>;

    const patch: Partial<Omit<Booking, "_id" | "createdAt" | "updatedAt" | "auditTrail">> =
      {};

    const allowedFields: (keyof Omit<
      Booking,
      "_id" | "createdAt" | "updatedAt" | "auditTrail"
    >)[] = [
      "bookingCode",
      "userEmail",
      "travelerEmail",
      "travelerName",
      "travelerPhone",
      "secondTravelerEmail",
      "secondTravelerPhone",
      "companyName",
      "paymentMethod",
      "transferType",
      "fromType",
      "fromAddress",
      "toType",
      "toAddress",
      "flightNumber",
      "pickupDate",
      "pickupTime",
      "travelers",
      "luggage",
      "comment",
      "category",
      "status",
      "assignedDriverId",
      "assignedDriverName",
      "assignedVehicleId",
      "assignedVehicleName",
      "plannedDriverId",
      "plannedDriverName",
      "plannedVehicleId",
      "plannedVehicleName",
      "price",
      "priceCurrency",
      "createdBy",
    ];

    for (const field of allowedFields) {
      if (field in body) {
        (patch as any)[field] = (body as any)[field];
      }
    }

    if ("luggage" in patch) {
      const n = Number(patch.luggage);
      if (!Number.isInteger(n) || n < 0 || n > 99) {
        return NextResponse.json({ error: "A csomagok száma 0 és 99 közötti egész szám legyen." }, { status: 400 });
      }
      patch.luggage = n;
    }

    if ("travelers" in patch) {
      const n = Number(patch.travelers);
      if (!Number.isInteger(n) || n < 1 || n > 99) {
        return NextResponse.json({ error: "Az utasok száma 1 és 99 közötti egész szám legyen." }, { status: 400 });
      }
      patch.travelers = n;
    }

    for (const field of ["plannedDriverId", "plannedDriverName", "plannedVehicleId", "plannedVehicleName"] as const) {
      if (field in patch) {
        const v = patch[field];
        patch[field] = typeof v === "string" ? v.trim().slice(0, 200) : "";
      }
    }

    if ("travelerPhone" in patch) {
      const phone = typeof patch.travelerPhone === "string" ? patch.travelerPhone.trim() : "";
      if (!PHONE_RE.test(phone)) {
        return NextResponse.json({ error: "Érvénytelen telefonszám." }, { status: 400 });
      }
      patch.travelerPhone = phone;
    }

    if ("travelerName" in patch) {
      const name = typeof patch.travelerName === "string" ? patch.travelerName.replace(/\s+/g, " ").trim() : "";
      if (!name || name.length > 200) {
        return NextResponse.json({ error: "Az utas neve nem lehet üres (legfeljebb 200 karakter)." }, { status: 400 });
      }
      patch.travelerName = name;
    }

    if ("travelerEmail" in patch) {
      const email = typeof patch.travelerEmail === "string" ? patch.travelerEmail.trim() : "";
      if (!EMAIL_RE.test(email)) {
        return NextResponse.json({ error: "Érvénytelen e-mail cím." }, { status: 400 });
      }
      patch.travelerEmail = email;
    }

    // A második utas mezői több értéket is tartalmazhatnak (vesszővel elválasztva), és üresek is lehetnek.
    if ("secondTravelerEmail" in patch) {
      const list = splitList(patch.secondTravelerEmail);
      if (list.some((e) => !EMAIL_RE.test(e))) {
        return NextResponse.json({ error: "A második utas e-mail címe érvénytelen." }, { status: 400 });
      }
      patch.secondTravelerEmail = list.join(", ");
    }

    if ("secondTravelerPhone" in patch) {
      const list = splitList(patch.secondTravelerPhone, /[,;]+/);
      if (list.some((p) => !PHONE_RE.test(p))) {
        return NextResponse.json({ error: "A második utas telefonszáma érvénytelen." }, { status: 400 });
      }
      patch.secondTravelerPhone = list.join(", ");
    }

    if ("pickupTime" in patch) {
      const pickupTime = typeof patch.pickupTime === "string" ? patch.pickupTime.trim() : "";
      const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(pickupTime);
      if (!match) {
        return NextResponse.json(
          { error: "A felvételi időpont érvényes HH:MM formátumú kell legyen." },
          { status: 400 }
        );
      }
      patch.pickupTime = pickupTime;
    }

    // Ha diszpécer módosítja az árat, ellenőrizze a partner pricing alapján. Más pénznemnél (nem HUF) a
    // forintban számolt partner-ártartomány nem értelmezhető, ott ezt a jóváhagyási kaput kihagyjuk.
    const effectiveCurrency = (patch.priceCurrency ?? existing.priceCurrency ?? "HUF") as string;
    if ("price" in patch && user.role === "dispatcher" && existing.portal && effectiveCurrency === "HUF") {
      const partnerPricing = await getPartnerPricingByKey(existing.portal, { seedIfMissing: false });
      if (partnerPricing && partnerPricing.vehicles.length > 0) {
        const prices = partnerPricing.vehicles.map((v) => v.newPrice2026);
        const minAcceptable = Math.min(...prices) * 0.7;
        // A partner-árazásból számolt felső határ reálisan alacsony tud lenni (pl. kisebb partnereknél
        // ~260 000 Ft), ami szükségtelen jóváhagyást kényszerít ki hosszabb/különleges utaknál - ezért
        // sosem alacsonyabb 1 500 000 Ft-nál.
        const maxAcceptable = Math.max(Math.max(...prices) * 1.5, 1_500_000);
        const requestedPrice = Number(patch.price);

        if (requestedPrice < minAcceptable || requestedPrice > maxAcceptable) {
          return NextResponse.json({
            needsApproval: true,
            message: "Az ár jóváhagyásra vár",
            minAcceptable: Math.round(minAcceptable),
            maxAcceptable: Math.round(maxAcceptable),
          });
        }
      }
    }

    const fieldLabels: Record<string, string> = {
      pickupDate: "Felvétel dátuma",
      pickupTime: "Felvételi időpont",
      fromAddress: "Felvételi cím",
      toAddress: "Érkezési cím",
      flightNumber: "Flight number / Járatszám",
      travelers: "Utasok száma",
      luggage: "Csomagok száma",
      comment: "Diszpécseri megjegyzés",
      assignedDriverName: "Sofőr",
      assignedVehicleName: "Jármű",
      plannedDriverName: "Kiválasztott sofőr",
      plannedVehicleName: "Kiválasztott jármű",
      status: "Foglalás állapota",
      price: "Ár",
      companyName: "Cégnév",
      paymentMethod: "Fizetési mód",
      travelerName: "Utas neve",
      travelerEmail: "Utas e-mail címe",
      travelerPhone: "Utas telefonszáma",
      secondTravelerEmail: "Második utas e-mail címe",
      secondTravelerPhone: "Második utas telefonszáma",
      priceCurrency: "Pénznem",
    };
    const changes = Object.keys(patch)
      .filter((field) => {
        // A kiválasztás belső azonosítói zajt okoznának a naplóban — a név elég.
        if (field === "plannedDriverId" || field === "plannedVehicleId") return false;
        const patchField = field as keyof typeof patch;
        return JSON.stringify(existing[field as keyof Booking]) !== JSON.stringify(patch[patchField]);
      })
      .map((field) => {
        const patchField = field as keyof typeof patch;
        return {
          field: fieldLabels[field] || field,
          oldValue: existing[field as keyof Booking],
          newValue: patch[patchField],
        };
      });

    const updated = await updateBooking(
      id,
      patch,
      user.email,
      JSON.stringify({ message: "A diszpécser módosította a foglalást", changes })
    );
    if (!updated) {
      return NextResponse.json({ error: "Módosítás sikertelen" }, { status: 400 });
    }

    // Valódi diszpécseri változtatás után (pl. beírt ár) a "Beérkezett" foglalás "Módosított" (sárga) lesz,
    // kivéve ha a kérés maga állít státuszt.
    const touched =
      changes.length > 0 && !("status" in patch) ? await markBookingTouchedByDispatcher(id) : null;

    await createAuditLog({
      timestamp: Date.now(),
      action: "booking.modified",
      actor: user.email,
      targetType: "booking",
      targetId: id,
      details: JSON.stringify(patch),
    });

    // A diszpécseri módosításokról (pl. felvételi időpont, sofőr/jármű, egyéb adatok)
    // nem küldünk e-mailt az utasnak/NI-nak — csak a véglegesítésről vagy a lemondásról.

    return NextResponse.json({ booking: touched ?? updated });
  } catch (err) {
    console.error("[booking PATCH error]", err);
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}

/**
 * Foglalás végleges törlése – KIZÁRÓLAG adminnak (tesztelési célra). A diszpécserek ezt nem érik el:
 * a gomb sem jelenik meg nekik, és a szerver is elutasítja. Megerősítésként a foglalási kódot kell elküldeni.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Nincs jogosultságod" }, { status: 401 });
  }
  if (!(await isVerifiedAdmin(user))) {
    return NextResponse.json({ error: "Ehhez a művelethez admin jogosultság szükséges" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const existing = await getBookingById(id);
    if (!existing) {
      return NextResponse.json({ error: "Foglalás nem található" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as { confirmCode?: string };
    if (typeof body.confirmCode !== "string" || body.confirmCode.trim() !== existing.bookingCode) {
      return NextResponse.json({ error: "Hiányzó vagy hibás megerősítés" }, { status: 400 });
    }

    const deleted = await deleteBookingById(id);
    if (!deleted) {
      return NextResponse.json({ error: "A törlés sikertelen" }, { status: 400 });
    }

    await createAuditLog({
      timestamp: Date.now(),
      action: "booking.deleted_by_admin",
      actor: user.email,
      targetType: "booking",
      targetId: id,
      details: JSON.stringify({
        bookingCode: existing.bookingCode,
        portal: existing.portal,
        companyName: existing.companyName,
        travelerName: existing.travelerName,
        pickupDate: existing.pickupDate,
        pickupTime: existing.pickupTime,
        status: existing.status,
        reason: "Admin törlés (tesztelés)",
      }),
    });

    return NextResponse.json({ success: true, bookingCode: existing.bookingCode });
  } catch (err) {
    console.error("[booking DELETE error]", err);
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}
