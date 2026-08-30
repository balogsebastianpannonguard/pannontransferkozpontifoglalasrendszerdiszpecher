import { ObjectId } from "mongodb";
import { getMongoDb } from "./mongodb";

export type DriverStatus = "active" | "inactive" | "on_leave";
export type DriverType = "permanent" | "substitute";

export interface Driver {
  _id?: string;
  name: string;
  type: DriverType;
  phone: string;
  email?: string;
  status: DriverStatus;
  assignedVehicle?: string;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

// A sofőröket a közös 'staff_users' kollekcióból olvassuk (role: 'driver')
const COLLECTION_NAME = "staff_users";

export async function getDriversCollection() {
  const db = await getMongoDb();
  return db.collection(COLLECTION_NAME);
}

export async function getDrivers(): Promise<Driver[]> {
  const col = await getDriversCollection();
  // Csak a sofőröket kérjük le
  const docs = await col.find({ role: "driver" }).sort({ name: 1 }).toArray();
  
  return docs.map((d: any) => {
    // Státusz leképezés a staff_users mezőiből
    let mappedStatus: DriverStatus = "inactive";
    if (d.status === "active" || d.isActivated) mappedStatus = "active";
    if (d.driverStatus) mappedStatus = d.driverStatus; // Ha a diszpécser már felülírta
    
    return {
      _id: d._id.toString(),
      name: d.name || d.email?.split("@")[0] || "Ismeretlen",
      type: d.driverType || "permanent",
      phone: d.phone || "",
      email: d.email || "",
      status: mappedStatus,
      assignedVehicle: d.assignedVehicle || "",
      note: d.note || "",
      createdAt: d.createdAt || Date.now(),
      updatedAt: d.updatedAt || Date.now(),
    };
  });
}

export async function createDriver(data: Partial<Driver>): Promise<Driver> {
  const col = await getDriversCollection();
  const now = Date.now();
  
  const doc = {
    email: data.email || `driver_${now}@pannontransfer.hu`,
    normalizedEmail: (data.email || `driver_${now}@pannontransfer.hu`).toLowerCase(),
    role: "driver",
    name: data.name || "Új Sofőr",
    driverType: data.type || "permanent",
    phone: data.phone || "",
    driverStatus: data.status || "active",
    assignedVehicle: data.assignedVehicle || "",
    note: data.note || "",
    isActivated: false,
    requireTwoFactor: false,
    createdAt: now,
    updatedAt: now,
  };
  
  const r = await col.insertOne(doc as any);
  return {
    ...doc,
    _id: r.insertedId.toString(),
    type: doc.driverType as DriverType,
    status: doc.driverStatus as DriverStatus,
  };
}

export async function updateDriver(
  id: ObjectId | string,
  patch: Partial<Omit<Driver, "_id" | "createdAt">>
): Promise<boolean> {
  const col = await getDriversCollection();
  const oid: ObjectId = typeof id === "string" ? new ObjectId(id) : id;
  
  const updateData: any = { updatedAt: Date.now() };
  if (patch.name !== undefined) updateData.name = patch.name;
  if (patch.type !== undefined) updateData.driverType = patch.type;
  if (patch.phone !== undefined) updateData.phone = patch.phone;
  if (patch.email !== undefined) {
    updateData.email = patch.email;
    updateData.normalizedEmail = patch.email.toLowerCase();
  }
  if (patch.status !== undefined) updateData.driverStatus = patch.status;
  if (patch.assignedVehicle !== undefined) updateData.assignedVehicle = patch.assignedVehicle;
  if (patch.note !== undefined) updateData.note = patch.note;

  const res = await col.updateOne({ _id: oid }, { $set: updateData });
  return res.modifiedCount > 0;
}

export async function deleteDriver(
  id: ObjectId | string
): Promise<boolean> {
  const col = await getDriversCollection();
  const oid: ObjectId = typeof id === "string" ? new ObjectId(id) : id;
  const res = await col.deleteOne({ _id: oid });
  return res.deletedCount > 0;
}

export async function seedDriversIfEmpty(): Promise<number> {
  // A dummy sofőröket kivettük, az igazi sofőrök a staff_users kollekcióba kerülnek
  // regisztráció/meghívás útján a Foglalási Központból.
  return 0;
}
