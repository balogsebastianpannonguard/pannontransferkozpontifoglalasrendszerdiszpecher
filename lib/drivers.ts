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

const COLLECTION_NAME = "drivers";

export async function getDriversCollection() {
  const db = await getMongoDb();
  return db.collection<Driver>(COLLECTION_NAME);
}

export async function initDriverIndexes() {
  const col = await getDriversCollection();
  try {
    await col.createIndex({ name: 1 });
    await col.createIndex({ type: 1 });
    await col.createIndex({ status: 1 });
  } catch {}
}

export async function getDrivers(): Promise<Driver[]> {
  await initDriverIndexes();
  const col = await getDriversCollection();
  const docs = await col.find().sort({ name: 1 }).toArray();
  return docs.map((d) => ({
    ...(d as any),
    _id: (d as any)._id.toString(),
  })) as Driver[];
}

export async function createDriver(data: Partial<Driver>): Promise<Driver> {
  await initDriverIndexes();
  const col = await getDriversCollection();
  const now = Date.now();
  const doc: Driver = {
    name: data.name || "Új Sofőr",
    type: (data.type as DriverType) || "permanent",
    phone: data.phone || "",
    email: data.email || "",
    status: (data.status as DriverStatus) || "active",
    assignedVehicle: data.assignedVehicle || "",
    note: data.note || "",
    createdAt: now,
    updatedAt: now,
  };
  const r = await col.insertOne(doc as any);
  const created = await col.findOne({ _id: r.insertedId });
  if (!created) throw new Error("Driver insert failed");
  return {
    ...(created as any),
    _id: (created as any)._id.toString(),
  } as Driver;
}

export async function updateDriver(
  id: ObjectId | string,
  patch: Partial<Omit<Driver, "_id" | "createdAt">>
): Promise<boolean> {
  const col = await getDriversCollection();
  const oid: ObjectId = typeof id === "string" ? new ObjectId(id) : id;
  const res = await col.updateOne(
    { _id: oid } as any,
    { $set: { ...patch, updatedAt: Date.now() } as any }
  );
  return res.modifiedCount > 0;
}

export async function deleteDriver(
  id: ObjectId | string
): Promise<boolean> {
  const col = await getDriversCollection();
  const oid: ObjectId = typeof id === "string" ? new ObjectId(id) : id;
  const res = await col.deleteOne({ _id: oid } as any);
  return res.deletedCount > 0;
}

const DEFAULT_DRIVER_SEED: Omit<Driver, "_id" | "createdAt" | "updatedAt">[] = [
  {
    name: "Kovács Péter",
    type: "permanent",
    phone: "+36 30 123 4567",
    email: "kovacs.p@pannontransfer.hu",
    status: "active",
    assignedVehicle: "Skoda Superb Barna",
    note: "",
  },
  {
    name: "Nagy Sándor",
    type: "permanent",
    phone: "+36 20 987 6543",
    email: "nagy.s@pannontransfer.hu",
    status: "active",
    assignedVehicle: "Mercedes V-Klass #1",
    note: "",
  },
  {
    name: "Tóth Gábor",
    type: "substitute",
    phone: "+36 70 555 4444",
    email: "toth.g@gmail.com",
    status: "inactive",
    assignedVehicle: "",
    note: "Csak hétvégén érhető el",
  },
];

export async function seedDriversIfEmpty(): Promise<number> {
  const col = await getDriversCollection();
  const count = await col.estimatedDocumentCount();
  if (count > 0) return 0;
  const now = Date.now();
  const docs: Driver[] = DEFAULT_DRIVER_SEED.map((s, i) => ({
    ...s,
    createdAt: now + i,
    updatedAt: now + i,
  }));
  const r = await col.insertMany(docs as any[]);
  return Object.keys(r.insertedIds).length;
}
