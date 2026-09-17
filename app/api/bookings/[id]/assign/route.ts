import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import {
  getBookingById,
  assignBooking,
  updateBookingStatus,
} from "@/lib/bookings";
import { createAuditLog } from "@/lib/audit-logs";
import { updateDriver } from "@/lib/drivers";
import { updateVehicle } from "@/lib/vehicles";

export const dynamic = "force-dynamic";

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
    const existing = await getBookingById(id);
    if (!existing) {
      return NextResponse.json({ error: "Foglalás nem található" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      driverId: string;
      driverName: string;
      vehicleId: string;
      vehicleName: string;
    };

    const shouldRelease =
      !body.driverId &&
      !body.driverName &&
      !body.vehicleId &&
      !body.vehicleName;

    if (!shouldRelease && (!body.driverId || !body.driverName || !body.vehicleId || !body.vehicleName)) {
      return NextResponse.json(
        { error: "Hiányzó mezők: driverId, driverName, vehicleId, vehicleName" },
        { status: 400 }
      );
    }

    if (shouldRelease) {
      const previousDriverId = existing.assignedDriverId;
      const previousVehicleId = existing.assignedVehicleId;

      const assigned = await assignBooking(
        id,
        {
          driverId: "",
          driverName: "",
          vehicleId: "",
          vehicleName: "",
        },
        user.email
      );

      if (previousVehicleId) {
        await updateVehicle(previousVehicleId, { status: "parked" });
      }
      if (previousDriverId) {
        await updateDriver(previousDriverId, { status: "active" });
      }

      const updated = await updateBookingStatus(
        id,
        "pending",
        user.email,
        "Hozzárendelés visszavonva a diszpécser által"
      );

      await createAuditLog({
        timestamp: Date.now(),
        action: "booking.assigned",
        actor: user.email,
        targetType: "booking",
        targetId: id,
        details: "Hozzárendelés visszavonva; erőforrások szabadok lettek.",
      });

      return NextResponse.json({
        booking: updated || assigned,
        released: true,
      });
    }

    const assigned = await assignBooking(
      id,
      {
        driverId: body.driverId,
        driverName: body.driverName,
        vehicleId: body.vehicleId,
        vehicleName: body.vehicleName,
      },
      user.email
    );

    if (!assigned) {
      return NextResponse.json(
        { error: "Hozzárendelés sikertelen" },
        { status: 400 }
      );
    }

    await updateVehicle(body.vehicleId, { status: "on_route" });
    await updateDriver(body.driverId, { status: "on_route" });

    const updated = await updateBookingStatus(
      id,
      "confirmed",
      user.email,
      "Automatikus státuszváltoztatás hozzárendeléskor"
    );

    await createAuditLog({
      timestamp: Date.now(),
      action: "booking.assigned",
      actor: user.email,
      targetType: "booking",
      targetId: id,
      details: `${body.driverName} - ${body.vehicleName}`,
    });

    return NextResponse.json({
      booking: updated || assigned,
      confirmed: true,
    });
  } catch (err) {
    console.error("[booking assign error]", err);
    return NextResponse.json({ error: "Szerver hiba" }, { status: 500 });
  }
}
