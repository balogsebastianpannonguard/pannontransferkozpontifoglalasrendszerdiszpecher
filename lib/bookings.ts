import { ObjectId, Filter } from "mongodb";
import { getMongoDb } from "./mongodb";

export type BookingStatus = 'pending' | 'modified' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
export type BookingCategory = 'airport' | 'city' | 'long-distance' | 'vip' | 'partner';
export type PaymentMethod = 'card' | 'bank';
export type TransferType = 'standard' | 'executive';

export interface BookingAuditEntry {
  timestamp: number;
  action: string;
  actor: string;
  details?: string;
}

export interface Booking {
  _id?: string;
  bookingCode: string;
  userEmail: string;
  travelerEmail: string;
  travelerName: string;
  travelerPhone: string;
  secondTravelerEmail?: string;
  secondTravelerPhone?: string;
  companyName?: string;
  paymentMethod: PaymentMethod;
  transferType: TransferType;
  fromType: 'airport' | 'other';
  fromAddress: string;
  toType: 'airport' | 'other';
  toAddress: string;
  pickupDate: string;
  pickupTime: string;
  travelers: number;
  luggage: number;
  comment?: string;
  category: BookingCategory;
  status: BookingStatus;
  assignedDriverId?: string;
  assignedDriverName?: string;
  assignedVehicleId?: string;
  assignedVehicleName?: string;
  driverNotified?: boolean;
  driverAcknowledged?: boolean;
  price?: number;
  createdBy?: string;
  createdAt: number;
  updatedAt: number;
  auditTrail?: BookingAuditEntry[];
}

const COLLECTION_NAME = "bookings";

function convertId(doc: any): Booking {
  return {
    ...doc,
    _id: doc._id.toString(),
  } as Booking;
}

export async function getBookingsCollection() {
  const db = await getMongoDb();
  return db.collection<Booking>(COLLECTION_NAME);
}

export async function initBookingIndexes() {
  const col = await getBookingsCollection();
  try {
    await col.createIndex({ bookingCode: 1 }, { unique: true });
    await col.createIndex({ userEmail: 1 });
    await col.createIndex({ status: 1 });
    await col.createIndex({ pickupDate: 1, pickupTime: 1 });
    await col.createIndex({ createdAt: 1 });
  } catch {}
}

export async function listAllBookings(filter?: { status?: BookingStatus; fromDate?: string; toDate?: string }): Promise<Booking[]> {
  await initBookingIndexes();
  const col = await getBookingsCollection();
  const query: Filter<any> = {};
  if (filter?.status) {
    query.status = filter.status;
  }
  if (filter?.fromDate) {
    query.pickupDate = { ...(query.pickupDate || {}), $gte: filter.fromDate };
  }
  if (filter?.toDate) {
    query.pickupDate = { ...(query.pickupDate || {}), $lte: filter.toDate };
  }
  const docs = await col.find(query).sort({ createdAt: -1 }).toArray();
  return docs.map(convertId);
}

export async function listPendingBookings(): Promise<Booking[]> {
  await initBookingIndexes();
  const col = await getBookingsCollection();
  const docs = await col.find({ status: 'pending' }).sort({ createdAt: 1 }).toArray();
  return docs.map(convertId);
}

export async function getBookingById(id: ObjectId | string): Promise<Booking | null> {
  const col = await getBookingsCollection();
  const oid: ObjectId = typeof id === "string" ? new ObjectId(id) : id;
  const doc = await col.findOne({ _id: oid } as any);
  if (!doc) return null;
  return convertId(doc);
}

export async function getBookingByCode(code: string): Promise<Booking | null> {
  const col = await getBookingsCollection();
  const doc = await col.findOne({ bookingCode: code });
  if (!doc) return null;
  return convertId(doc);
}

export async function assignBooking(
  id: ObjectId | string,
  assignment: { driverId: string; driverName: string; vehicleId: string; vehicleName: string },
  actor: string
): Promise<Booking | null> {
  const col = await getBookingsCollection();
  const oid: ObjectId = typeof id === "string" ? new ObjectId(id) : id;
  const now = Date.now();
  const details = `Hozzárendelve: ${assignment.driverName} - ${assignment.vehicleName}`;
  const res = await col.findOneAndUpdate(
    { _id: oid } as any,
    {
      $set: {
        assignedDriverId: assignment.driverId,
        assignedDriverName: assignment.driverName,
        assignedVehicleId: assignment.vehicleId,
        assignedVehicleName: assignment.vehicleName,
        updatedAt: now,
      },
      $push: {
        auditTrail: {
          timestamp: now,
          action: 'assigned',
          actor,
          details,
        },
      },
    },
    { returnDocument: 'after' }
  );
  if (!res) return null;
  return convertId(res);
}

export async function updateBookingStatus(
  id: ObjectId | string,
  status: BookingStatus,
  actor: string,
  details?: string
): Promise<Booking | null> {
  const col = await getBookingsCollection();
  const oid: ObjectId = typeof id === "string" ? new ObjectId(id) : id;
  const existing = await col.findOne({ _id: oid } as any);
  if (!existing) return null;
  const oldStatus = existing.status;
  const now = Date.now();
  const res = await col.findOneAndUpdate(
    { _id: oid } as any,
    {
      $set: {
        status,
        updatedAt: now,
      },
      $push: {
        auditTrail: {
          timestamp: now,
          action: `status:${oldStatus}->${status}`,
          actor,
          details,
        },
      },
    },
    { returnDocument: 'after' }
  );
  if (!res) return null;
  return convertId(res);
}

export async function updateBooking(
  id: ObjectId | string,
  patch: Partial<Omit<Booking, "_id" | "createdAt" | "updatedAt" | "auditTrail">>,
  actor: string,
  details?: string
): Promise<Booking | null> {
  const col = await getBookingsCollection();
  const oid: ObjectId = typeof id === "string" ? new ObjectId(id) : id;
  const now = Date.now();
  const res = await col.findOneAndUpdate(
    { _id: oid } as any,
    {
      $set: {
        ...patch,
        updatedAt: now,
      },
      $push: {
        auditTrail: {
          timestamp: now,
          action: 'modified',
          actor,
          details,
        },
      },
    },
    { returnDocument: 'after' }
  );
  if (!res) return null;
  return convertId(res);
}

export async function getBookingsForMonth(year: number, month: number): Promise<Booking[]> {
  await initBookingIndexes();
  const col = await getBookingsCollection();
  const mm = String(month + 1).padStart(2, '0');
  const yyyy = String(year);
  const prefix = `${yyyy}-${mm}`;
  const docs = await col.find({ pickupDate: { $regex: `^${prefix}` } }).sort({ pickupDate: 1, pickupTime: 1 }).toArray();
  return docs.map(convertId);
}

function generateBookingCode(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PT${yyyy}${mm}${dd}${rand}`;
}

export async function createBooking(
  data: Partial<Omit<Booking, "_id" | "bookingCode" | "createdAt" | "updatedAt" | "auditTrail">> & {
    userEmail: string;
    travelerEmail: string;
    travelerName: string;
    travelerPhone: string;
    paymentMethod: PaymentMethod;
    transferType: TransferType;
    fromType: 'airport' | 'other';
    fromAddress: string;
    toType: 'airport' | 'other';
    toAddress: string;
    pickupDate: string;
    pickupTime: string;
    travelers: number;
    luggage: number;
    category: BookingCategory;
  },
  actor?: string
): Promise<Booking> {
  await initBookingIndexes();
  const col = await getBookingsCollection();
  const now = Date.now();

  let bookingCode = generateBookingCode();
  let exists = await col.findOne({ bookingCode });
  let attempts = 0;
  while (exists && attempts < 20) {
    bookingCode = generateBookingCode();
    exists = await col.findOne({ bookingCode });
    attempts++;
  }

  const status: BookingStatus = (data.status as BookingStatus) || 'pending';
  const auditEntry: BookingAuditEntry = {
    timestamp: now,
    action: 'created',
    actor: actor || data.userEmail || 'system',
    details: 'Foglalás létrehozva',
  };

  const booking: Omit<Booking, "_id"> = {
    ...data,
    bookingCode,
    status,
    createdBy: actor || data.createdBy || data.userEmail,
    createdAt: now,
    updatedAt: now,
    auditTrail: [auditEntry],
  };

  const res = await col.insertOne(booking as any);
  const created = await col.findOne({ _id: res.insertedId });
  if (!created) throw new Error("Booking creation failed");
  return convertId(created);
}

export async function countBookingsByStatus(status?: BookingStatus): Promise<{ pendingCount: number; totalCount: number }> {
  await initBookingIndexes();
  const col = await getBookingsCollection();
  const totalCount = await col.countDocuments();
  const pendingCount = await col.countDocuments({ status: 'pending' });
  return { pendingCount, totalCount };
}
