import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import {
  getBookingById,
  assignBooking,
  updateBookingStatus,
  getBookingsCollection,
} from "@/lib/bookings";
import { createAuditLog } from "@/lib/audit-logs";
import { getDriversCollection, updateDriver } from "@/lib/drivers";
import { getVehicleCollection, updateVehicle } from "@/lib/vehicles";
import { ObjectId } from "mongodb";

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
      forceOverride?: boolean;
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

    if (!shouldRelease) {
      const forceOverride = body.forceOverride === true;
      const bookings = await getBookingsCollection();
      const activeAssignments = await bookings.find({
        _id: { $ne: new ObjectId(id) },
        status: { $in: ["confirmed", "in-progress"] },
        $or: [
          { assignedDriverId: body.driverId },
          { assignedVehicleId: body.vehicleId },
        ],
      } as any).limit(10).toArray();

      if (activeAssignments.length > 0 && !forceOverride) {
        return NextResponse.json(
          { error: "A sofőr vagy a jármű már egy másik aktív útra van kiosztva. Manuális felülbírálással folytathatod." },
          { status: 409 }
        );
      }

      const driverCollection = await getDriversCollection();
      const vehicleCollection = await getVehicleCollection();
      if (!ObjectId.isValid(body.driverId) || !ObjectId.isValid(body.vehicleId)) {
        return NextResponse.json({ error: "Érvénytelen sofőr- vagy járműazonosító." }, { status: 400 });
      }
      const driver = await driverCollection.findOne({ _id: new ObjectId(body.driverId), role: "driver" } as any);
      const vehicle = await vehicleCollection.findOne({ _id: new ObjectId(body.vehicleId) } as any);

      if (!driver) {
        return NextResponse.json({ error: "A kiválasztott sofőr nem található." }, { status: 404 });
      }
      if (!vehicle) {
        return NextResponse.json({ error: "A kiválasztott jármű nem található." }, { status: 404 });
      }
      if (driver.driverStatus === "on_route" && !forceOverride) {
        return NextResponse.json(
          { error: "A sofőr jelenleg úton van. Manuális felülbírálással folytathatod." },
          { status: 409 }
        );
      }
      if (
        (vehicle.status === "on_route" || vehicle.condition === "not_working") &&
        !forceOverride
      ) {
        return NextResponse.json(
          { error: "A jármű úton van vagy szervizelt/nem használható. Manuális felülbírálással folytathatod." },
          { status: 409 }
        );
      }
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

      const bookings = await getBookingsCollection();
      if (previousVehicleId) {
        const remainingVehicleTrips = await bookings.countDocuments({
          assignedVehicleId: previousVehicleId,
          status: "in-progress",
          _id: { $ne: new ObjectId(id) },
        } as any);
        if (remainingVehicleTrips === 0) await updateVehicle(previousVehicleId, { status: "parked" });
      }
      if (previousDriverId) {
        const remainingDriverTrips = await bookings.countDocuments({
          assignedDriverId: previousDriverId,
          status: "in-progress",
          _id: { $ne: new ObjectId(id) },
        } as any);
        if (remainingDriverTrips === 0) await updateDriver(previousDriverId, { status: "active" });
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
      details: `${body.driverName} - ${body.vehicleName}${body.forceOverride ? " (manuális felülbírálással)" : ""}`,
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
