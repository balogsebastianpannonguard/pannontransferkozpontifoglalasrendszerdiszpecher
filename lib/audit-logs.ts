import { ObjectId } from "mongodb";
import { getMongoDb } from "./mongodb";

export type AuditAction =
  | 'booking.created'
  | 'booking.status_changed'
  | 'booking.assigned'
  | 'booking.modified'
  | 'booking.cancelled'
  | 'driver.created'
  | 'vehicle.modified'
  | 'notification.sent';

export interface AuditLog {
  _id?: string;
  timestamp: number;
  action: AuditAction | string;
  actor: string;
  targetType?: 'booking' | 'driver' | 'vehicle';
  targetId?: string;
  details?: Record<string, any> | string;
  ipAddress?: string;
  userAgent?: string;
}

const COLLECTION_NAME = "audit_logs";

function convertId(doc: any): AuditLog {
  return {
    ...doc,
    _id: doc._id.toString(),
  } as AuditLog;
}

export async function getAuditLogsCollection() {
  const db = await getMongoDb();
  return db.collection<AuditLog>(COLLECTION_NAME);
}

export async function initAuditIndexes() {
  const col = await getAuditLogsCollection();
  try {
    await col.createIndex({ timestamp: -1 });
    await col.createIndex({ action: 1 });
    await col.createIndex({ actor: 1 });
    await col.createIndex({ targetType: 1, targetId: 1 });
  } catch {}
}

export async function createAuditLog(data: Omit<AuditLog, "_id">): Promise<AuditLog> {
  await initAuditIndexes();
  const col = await getAuditLogsCollection();
  const log: AuditLog = {
    ...data,
    timestamp: data.timestamp || Date.now(),
  };
  const r = await col.insertOne(log as any);
  const created = await col.findOne({ _id: r.insertedId });
  if (!created) throw new Error("Audit log insert failed");
  return convertId(created);
}

export async function listAuditLogsForTarget(
  targetType: 'booking' | 'driver' | 'vehicle',
  targetId: string,
  limit: number = 50
): Promise<AuditLog[]> {
  await initAuditIndexes();
  const col = await getAuditLogsCollection();
  const docs = await col
    .find({ targetType, targetId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
  return docs.map(convertId);
}

export async function listAllAuditLogs(limit: number = 100, skip: number = 0): Promise<AuditLog[]> {
  await initAuditIndexes();
  const col = await getAuditLogsCollection();
  const docs = await col
    .find()
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
  return docs.map(convertId);
}

export async function listAuditLogsForActor(actor: string, limit: number = 50): Promise<AuditLog[]> {
  await initAuditIndexes();
  const col = await getAuditLogsCollection();
  const docs = await col
    .find({ actor })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
  return docs.map(convertId);
}
