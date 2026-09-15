import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { getBookingById, getBookingsCollection } from "@/lib/bookings";
import { createAuditLog } from "@/lib/audit-logs";
import { sendEmail } from "@/lib/nodemailer";
import { getStaffCollection } from "@/lib/staff-auth";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

// POST: Diszpécher ár-jóváhagyás kérés küldése
export async function POST(
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

    const body = (await request.json().catch(() => ({}))) as {
      requestedPrice?: number;
      reason?: string;
    };

    if (!body.requestedPrice || isNaN(body.requestedPrice)) {
      return NextResponse.json({ error: "Érvénytelen ár" }, { status: 400 });
    }

    const now = Date.now();

    const col = await getBookingsCollection();
    const oid = new ObjectId(id);

    await col.updateOne(
      { _id: oid } as any,
      {
        $set: {
          priceApprovalStatus: "pending_approval",
          priceApprovalRequest: {
            requestedPrice: body.requestedPrice,
            requestedBy: user.email,
            requestedAt: now,
            originalPrice: booking.price,
            reason: body.reason || undefined,
          },
          priceApprovalResponse: null,
          updatedAt: now,
        },
        $push: {
          auditTrail: {
            timestamp: now,
            action: "price.approval_requested",
            actor: user.email,
            details: `Jóváhagyás kérve: ${body.requestedPrice} Ft${body.reason ? ` - Indok: ${body.reason}` : ""}`,
          },
        },
      }
    );

    await createAuditLog({
      timestamp: now,
      action: "booking.modified",
      actor: user.email,
      targetType: "booking",
      targetId: id,
      details: {
        action: "price_approval_requested",
        requestedPrice: body.requestedPrice,
        reason: body.reason,
      },
    });

    // Admin felhasználók értesítése emailben
    try {
      const staffCol = await getStaffCollection();
      const admins = await staffCol.find({ role: "admin", isActivated: true }).toArray();

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || "http://localhost:3000";
      const bookingUrl = `${baseUrl}/bookings/${id}`;

      for (const admin of admins) {
        await sendEmail({
          to: admin.email,
          subject: `[Pannon Transfer] Ár jóváhagyás szükséges - #${booking.bookingCode}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1e293b;">Ár jóváhagyás szükséges</h2>
              <p>Kedves Admin,</p>
              <p>A <strong>${user.name || user.email}</strong> diszpécher ár-jóváhagyást kért az alábbi foglaláshoz:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr style="background: #f8fafc;">
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold;">Foglalás kód</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${booking.bookingCode}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold;">Utas neve</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${booking.travelerName}</td>
                </tr>
                <tr style="background: #f8fafc;">
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold;">Útvonal</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${booking.fromAddress} → ${booking.toAddress}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold;">Indulás</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${booking.pickupDate} ${booking.pickupTime}</td>
                </tr>
                <tr style="background: #f8fafc;">
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold;">Jelenlegi ár</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${booking.price ? booking.price.toLocaleString("hu-HU") + " Ft" : "Nincs beállítva"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #0ea5e9;">Kért ár</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #0ea5e9; font-weight: bold;">${body.requestedPrice.toLocaleString("hu-HU")} Ft</td>
                </tr>
                ${body.reason ? `
                <tr style="background: #f8fafc;">
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold;">Indok</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${body.reason}</td>
                </tr>
                ` : ""}
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold;">Diszpécher</td>
                  <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${user.name || user.email} (${user.email})</td>
                </tr>
              </table>
              <p>
                <a href="${bookingUrl}" style="display: inline-block; padding: 10px 20px; background: #1e293b; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Foglalás megtekintése és döntés
                </a>
              </p>
              <p style="color: #64748b; font-size: 14px;">Ezt az emailt automatikusan küldte a Pannon Transfer Diszpécser Rendszer.</p>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      console.error("[price-approval POST] Email küldés sikertelen:", emailErr);
    }

    const updated = await getBookingById(id);
    return NextResponse.json({ booking: updated });
  } catch (err) {
    console.error("[price-approval POST error]", err);
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}

// PATCH: Admin dönt (elfogad / elutasít)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentSession();
  if (!user) {
    return NextResponse.json({ error: "Nincs jogosultságod" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Csak adminok dönthetnek az ár jóváhagyásról" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const booking = await getBookingById(id);
    if (!booking) {
      return NextResponse.json({ error: "Foglalás nem található" }, { status: 404 });
    }

    if (!booking.priceApprovalRequest) {
      return NextResponse.json({ error: "Nincs függő jóváhagyás kérés" }, { status: 400 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      decision?: "approved" | "rejected";
      comment?: string;
    };

    if (!body.decision || !["approved", "rejected"].includes(body.decision)) {
      return NextResponse.json({ error: "Érvénytelen döntés (approved/rejected)" }, { status: 400 });
    }

    const now = Date.now();
    const col = await getBookingsCollection();
    const oid = new ObjectId(id);

    const approvalResponse = {
      respondedBy: user.email,
      respondedAt: now,
      decision: body.decision,
      comment: body.comment || undefined,
    };

    const updateSet: Record<string, any> = {
      priceApprovalStatus: body.decision,
      priceApprovalResponse: approvalResponse,
      updatedAt: now,
    };

    if (body.decision === "approved") {
      updateSet.price = booking.priceApprovalRequest.requestedPrice;
    }

    await col.updateOne(
      { _id: oid } as any,
      {
        $set: updateSet,
        $push: {
          auditTrail: {
            timestamp: now,
            action: `price.approval_${body.decision}`,
            actor: user.email,
            details: `Ár ${body.decision === "approved" ? "jóváhagyva" : "elutasítva"}: ${booking.priceApprovalRequest.requestedPrice} Ft${body.comment ? ` - Megjegyzés: ${body.comment}` : ""}`,
          },
        },
      }
    );

    await createAuditLog({
      timestamp: now,
      action: "booking.modified",
      actor: user.email,
      targetType: "booking",
      targetId: id,
      details: {
        action: `price_approval_${body.decision}`,
        requestedPrice: booking.priceApprovalRequest.requestedPrice,
        comment: body.comment,
      },
    });

    // Értesítő email a kérő diszpéchernek
    try {
      const requesterEmail = booking.priceApprovalRequest.requestedBy;
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || "http://localhost:3000";
      const bookingUrl = `${baseUrl}/bookings/${id}`;
      const isApproved = body.decision === "approved";

      await sendEmail({
        to: requesterEmail,
        subject: `[Pannon Transfer] ${isApproved ? "Ár jóváhagyva" : "Ár elutasítva"} - #${booking.bookingCode}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: ${isApproved ? "#059669" : "#dc2626"};">
              Ár ${isApproved ? "jóváhagyva ✓" : "elutasítva ✗"}
            </h2>
            <p>Kedves Diszpécer,</p>
            <p>Az admin ${isApproved ? "<strong>jóváhagyta</strong>" : "<strong>elutasította</strong>"} az ár módosítási kérésedet a <strong>#${booking.bookingCode}</strong> foglaláshoz.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr style="background: #f8fafc;">
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold;">Foglalás kód</td>
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${booking.bookingCode}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold;">Kért ár</td>
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${booking.priceApprovalRequest.requestedPrice.toLocaleString("hu-HU")} Ft</td>
              </tr>
              <tr style="background: #f8fafc;">
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold;">Döntés</td>
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: ${isApproved ? "#059669" : "#dc2626"}; font-weight: bold;">
                  ${isApproved ? "JÓVÁHAGYVA" : "ELUTASÍTVA"}
                </td>
              </tr>
              ${body.comment ? `
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold;">Admin megjegyzés</td>
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${body.comment}</td>
              </tr>
              ` : ""}
              <tr style="background: #f8fafc;">
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold;">Admin</td>
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${user.name || user.email}</td>
              </tr>
            </table>
            <p>
              <a href="${bookingUrl}" style="display: inline-block; padding: 10px 20px; background: #1e293b; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Foglalás megtekintése
              </a>
            </p>
            <p style="color: #64748b; font-size: 14px;">Ezt az emailt automatikusan küldte a Pannon Transfer Diszpécser Rendszer.</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("[price-approval PATCH] Email küldés sikertelen:", emailErr);
    }

    const updated = await getBookingById(id);
    return NextResponse.json({ booking: updated });
  } catch (err) {
    console.error("[price-approval PATCH error]", err);
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}
