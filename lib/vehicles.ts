import { ObjectId } from "mongodb";
import { getMongoDb } from "./mongodb";

export type VehicleStatus = "parked" | "on_route";
export type VehicleCondition = "working" | "debrecen_only" | "not_working";
export type VehicleType =
  | "Toyota Proace Verso"
  | "Skoda Octavia (Újabb)"
  | "Skoda Octavia (Régebbi)"
  | "Ford Transit"
  | "Opel Vivaro"
  | "Ford 9 Személyes Kisbusz"
  | "Mercedes V-Klass"
  | "Mercedes V-Klass (Szürke)"
  | "Skoda Superb (Újabb, Barna)";

export interface Vehicle {
  _id?: string | ObjectId;
  name: string;
  type: VehicleType | string;
  plates?: string;
  seats?: number;
  color?: string;
  status: VehicleStatus;
  condition: VehicleCondition;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

const COLLECTION_NAME = "vehicles";

export async function getVehicleCollection() {
  const db = await getMongoDb();
  return db.collection<Vehicle>(COLLECTION_NAME);
}

export async function initVehicleIndexes() {
  const col = await getVehicleCollection();
  try {
    await col.createIndex({ plates: 1 }, { unique: true, sparse: true });
    await col.createIndex({ status: 1 });
    await col.createIndex({ condition: 1 });
    await col.createIndex({ type: 1 });
  } catch {}
}

export async function listVehicles(): Promise<Vehicle[]> {
  await initVehicleIndexes();
  const col = await getVehicleCollection();
  const docs = await col.find().sort({ createdAt: -1 }).toArray();
  return docs.map((d) => ({
    ...d,
    _id: d._id.toString(),
  })) as unknown as Vehicle[];
}

export async function createVehicle(data: Omit<Vehicle, "_id" | "createdAt" | "updatedAt">): Promise<Vehicle> {
  await initVehicleIndexes();
  const col = await getVehicleCollection();
  const now = Date.now();
  const v: Vehicle = { ...data, createdAt: now, updatedAt: now };
  const r = await col.insertOne(v as any);
  const created = await col.findOne({ _id: r.insertedId });
  if (!created) throw new Error("Vehicle insert failed");
  return {
    ...created,
    _id: created._id.toString(),
  } as unknown as Vehicle;
}

export async function updateVehicle(id: ObjectId | string, patch: Partial<Omit<Vehicle, "_id" | "createdAt">>): Promise<boolean> {
  const col = await getVehicleCollection();
  const oid: ObjectId = typeof id === "string" ? new ObjectId(id) : id;
  const res = await col.updateOne({ _id: oid }, { $set: { ...patch, updatedAt: Date.now() } });
  return res.modifiedCount > 0;
}

export async function deleteVehicle(id: ObjectId | string): Promise<boolean> {
  const col = await getVehicleCollection();
  const oid: ObjectId = typeof id === "string" ? new ObjectId(id) : id;
  const res = await col.deleteOne({ _id: oid });
  return res.deletedCount > 0;
}

export const DEFAULT_VEHICLE_SEED: Omit<Vehicle, "_id" | "createdAt" | "updatedAt">[] = [
  { name: "Toyota Proace Verso #1", type: "Toyota Proace Verso", seats: 8, color: "Fehér", status: "parked", condition: "working" },
  { name: "Toyota Proace Verso #2", type: "Toyota Proace Verso", seats: 8, color: "Fehér", status: "parked", condition: "working" },
  { name: "Toyota Proace Verso #3", type: "Toyota Proace Verso", seats: 8, color: "Szürke", status: "parked", condition: "working" },
  { name: "Skoda Octavia Kombi Újabb #1", type: "Skoda Octavia (Újabb)", seats: 5, color: "Fehér", status: "parked", condition: "working" },
  { name: "Skoda Octavia Kombi Újabb #2", type: "Skoda Octavia (Újabb)", seats: 5, color: "Kék", status: "parked", condition: "working" },
  { name: "Skoda Octavia Kombi Régebbi", type: "Skoda Octavia (Régebbi)", seats: 5, color: "Fekete", status: "parked", condition: "working" },
  { name: "Ford Transit", type: "Ford Transit", seats: 9, color: "Fehér", status: "parked", condition: "working" },
  { name: "Opel Vivaro #1", type: "Opel Vivaro", seats: 8, color: "Fehér", status: "parked", condition: "working" },
  { name: "Opel Vivaro #2", type: "Opel Vivaro", seats: 8, color: "Szürke", status: "parked", condition: "working" },
  { name: "Ford 9 Személyes Kisbusz", type: "Ford 9 Személyes Kisbusz", seats: 9, color: "Fehér", status: "parked", condition: "working" },
  { name: "Mercedes V-Klass #1", type: "Mercedes V-Klass", seats: 7, color: "Fekete", status: "parked", condition: "working" },
  { name: "Mercedes V-Klass #2", type: "Mercedes V-Klass", seats: 7, color: "Fekete", status: "parked", condition: "working" },
  { name: "Mercedes V-Klass #3", type: "Mercedes V-Klass", seats: 7, color: "Fehér", status: "parked", condition: "working" },
  { name: "Mercedes V-Klass #4", type: "Mercedes V-Klass", seats: 7, color: "Fekete", status: "parked", condition: "working" },
  { name: "Mercedes V-Klass (Szürke)", type: "Mercedes V-Klass (Szürke)", seats: 7, color: "Szürke", status: "parked", condition: "working" },
  { name: "Skoda Superb Barna", type: "Skoda Superb (Újabb, Barna)", seats: 5, color: "Barna", status: "parked", condition: "working" },
];

export async function seedVehiclesIfEmpty(): Promise<number> {
  const col = await getVehicleCollection();
  const count = await col.estimatedDocumentCount();
  if (count > 0) return 0;
  const now = Date.now();
  const docs: Vehicle[] = DEFAULT_VEHICLE_SEED.map((s, i) => ({
    ...s,
    plates: "",
    note: "",
    createdAt: now + i,
    updatedAt: now + i,
  }));
  const r = await col.insertMany(docs as any[]);
  return Object.keys(r.insertedIds).length;
}
