import { ObjectId } from "mongodb";
import { getMongoDb } from "./mongodb";

export type VehicleStatus = "parked" | "on_route";
export type VehicleCondition = "working" | "debrecen_only" | "not_working";
export type VehicleType =
  | "Toyota Proace"
  | "Skoda Octavia"
  | "Ford Transit"
  | "Ford Transit Custom"
  | "Opel Vivaro"
  | "Mercedes V-Klass"
  | "Mercedes S-Klass"
  | "Skoda Superb"
  | "MAN 20+1"
  | "Mercedes Sprinter 19+1";

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
  { name: "Mercedes V-Klass #1", type: "Mercedes V-Klass", plates: "AAAU-500", seats: 7, color: "", status: "parked", condition: "working" },
  { name: "Mercedes V-Klass #2", type: "Mercedes V-Klass", plates: "SUP-644", seats: 7, color: "", status: "parked", condition: "working" },
  { name: "Mercedes V-Klass #3", type: "Mercedes V-Klass", plates: "AICF-982", seats: 7, color: "", status: "parked", condition: "working" },
  { name: "Mercedes V-Klass #4", type: "Mercedes V-Klass", plates: "AOAZ-300", seats: 7, color: "", status: "parked", condition: "working" },
  { name: "Mercedes S-Klass", type: "Mercedes S-Klass", plates: "SZS-973", seats: 4, color: "", status: "parked", condition: "working" },
  { name: "Skoda Octavia #1", type: "Skoda Octavia", plates: "TCR-365", seats: 4, color: "", status: "parked", condition: "working" },
  { name: "Skoda Octavia #2", type: "Skoda Octavia", plates: "TCR-366", seats: 4, color: "", status: "parked", condition: "working" },
  { name: "Skoda Octavia #3", type: "Skoda Octavia", plates: "PVT-242", seats: 4, color: "", status: "parked", condition: "working" },
  { name: "Skoda Octavia #4", type: "Skoda Octavia", plates: "AEKM-834", seats: 4, color: "", status: "parked", condition: "working" },
  { name: "Skoda Superb", type: "Skoda Superb", plates: "SFN-871", seats: 4, color: "", status: "parked", condition: "working" },
  { name: "Opel Vivaro #1", type: "Opel Vivaro", plates: "RMD-432", seats: 8, color: "", status: "parked", condition: "working" },
  { name: "Opel Vivaro #2", type: "Opel Vivaro", plates: "RMD-433", seats: 8, color: "", status: "parked", condition: "working" },
  { name: "Ford Transit", type: "Ford Transit", plates: "RMD-597", seats: 8, color: "", status: "parked", condition: "working" },
  { name: "Ford Transit Custom", type: "Ford Transit Custom", plates: "REX-072", seats: 8, color: "", status: "parked", condition: "working" },
  { name: "Toyota Proace #1", type: "Toyota Proace", plates: "AOAZ-586", seats: 8, color: "", status: "parked", condition: "working" },
  { name: "Toyota Proace #2", type: "Toyota Proace", plates: "AODM-004", seats: 8, color: "", status: "parked", condition: "working" },
  { name: "Toyota Proace #3", type: "Toyota Proace", plates: "AODM-005", seats: 8, color: "", status: "parked", condition: "working" },
  { name: "MAN 20+1 #1", type: "MAN 20+1", plates: "ROC-567", seats: 20, color: "", status: "parked", condition: "working" },
  { name: "MAN 20+1 #2", type: "MAN 20+1", plates: "RJE-624", seats: 20, color: "", status: "parked", condition: "working" },
  { name: "Mercedes Sprinter 19+1", type: "Mercedes Sprinter 19+1", plates: "AEEP-292", seats: 19, color: "", status: "parked", condition: "working" },
];

export async function seedVehiclesIfEmpty(): Promise<number> {
  const col = await getVehicleCollection();
  const count = await col.estimatedDocumentCount();
  if (count > 0) return 0;
  const now = Date.now();
  const docs: Vehicle[] = DEFAULT_VEHICLE_SEED.map((s, i) => ({
    ...s,
    plates: s.plates ?? "",
    note: s.note ?? "",
    createdAt: now + i,
    updatedAt: now + i,
  }));
  const r = await col.insertMany(docs as any[]);
  return Object.keys(r.insertedIds).length;
}
