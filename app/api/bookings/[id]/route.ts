import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { getBookingById, updateBooking, type Booking } from "@/lib/bookings";
import { createAuditLog } from "@/lib/audit-logs";
import { getPartnerPricingByKey } from "@/lib/partner-pricing";
import { sendEmail } from "@/lib/nodemailer";
import { buildBookingModificationEmail } from "@/lib/email-templates";
import { buildTrackUrl } from "@/lib/partner-portal-url";

export const dynamic = "force-dynamic";

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
      "price",
      "createdBy",
    ];

    for (const field of allowedFields) {
      if (field in body) {
        (patch as any)[field] = (body as any)[field];
      }
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

    // Ha diszpécer módosítja az árat, ellenőrizze a partner pricing alapján
    if ("price" in patch && user.role === "dispatcher" && existing.portal) {
      const partnerPricing = await getPartnerPricingByKey(existing.portal, { seedIfMissing: false });
      if (partnerPricing && partnerPricing.vehicles.length > 0) {
        const prices = partnerPricing.vehicles.map((v) => v.newPrice2026);
        const minAcceptable = Math.min(...prices) * 0.7;
        const maxAcceptable = Math.max(...prices) * 1.5;
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
      status: "Foglalás állapota",
      price: "Ár",
      companyName: "Cégnév",
    };
    const changes = Object.keys(patch)
      .filter((field) => {
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

    await createAuditLog({
      timestamp: Date.now(),
      action: "booking.modified",
      actor: user.email,
      targetType: "booking",
      targetId: id,
      details: JSON.stringify(patch),
    });

    const emailTarget = existing.userEmail || existing.travelerEmail;
    if (emailTarget && changes.length > 0) {
      const emailResult = await sendEmail({
        to: emailTarget,
        subject: `Foglalás módosítva · #${existing.bookingCode}`,
        html: buildBookingModificationEmail({
          bookingCode: existing.bookingCode,
          travelerName: existing.travelerName,
          changes,
          trackUrl: buildTrackUrl(existing.bookingTrackToken),
        }),
      });
      if (!emailResult.success) {
        console.warn("[booking PATCH] módosítási e-mail nem küldhető:", emailResult.error);
      }
    }

    return NextResponse.json({ booking: updated });
  } catch (err) {
    console.error("[booking PATCH error]", err);
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}
