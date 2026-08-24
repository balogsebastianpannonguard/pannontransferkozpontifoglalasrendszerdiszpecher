import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getMongoDb } from "./mongodb";

export const STAFF_BCRYPT_ROUNDS = 12;

export type StaffRole = "admin" | "dispatcher";

export interface StaffUser {
  _id?: string | ObjectId;
  email: string;
  normalizedEmail: string;
  role: StaffRole;
  name?: string;
  hashedPassword: string | null;
  inviteRawToken: string;
  inviteTokenHash: string;
  inviteIssuedAt: number;
  inviteExpiresAt: number;
  isActivated: boolean;
  activatedAt: number | null;
  requireTwoFactor: boolean;
  twoFactorSecret: string | null;
  twoFactorEnabled: boolean;
  welcomeEmailSent: boolean;
  createdAt: number;
  updatedAt: number;
  lastLoginAt: number | null;
}

const COLLECTION_NAME = "staff_users";

export async function getStaffCollection() {
  const db = await getMongoDb();
  return db.collection<StaffUser>(COLLECTION_NAME);
}

export async function initStaffUserIndexes() {
  const col = await getStaffCollection();
  try {
    await col.createIndex({ normalizedEmail: 1 }, { unique: true });
    await col.createIndex({ inviteTokenHash: 1 });
    await col.createIndex({ inviteExpiresAt: 1 }, { expireAfterSeconds: 0 });
  } catch {}
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function hashToken(token: string) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, STAFF_BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function findStaffUserByInviteToken(rawToken: string): Promise<StaffUser | null> {
  await initStaffUserIndexes();
  const col = await getStaffCollection();
  const hash = await hashToken(rawToken);
  const user = (await col.findOne({
    inviteTokenHash: hash,
    inviteExpiresAt: { $gt: Date.now() },
  })) as StaffUser | null;
  return user;
}

export async function findStaffUserByEmail(email: string): Promise<StaffUser | null> {
  await initStaffUserIndexes();
  const col = await getStaffCollection();
  const normalizedEmail = normalizeEmail(email);
  const user = (await col.findOne({ normalizedEmail })) as StaffUser | null;
  return user;
}

export async function setStaffUserPasswordAndActivate(
  id: string | ObjectId,
  password: string
): Promise<boolean> {
  const col = await getStaffCollection();
  const oid = typeof id === "string" ? new ObjectId(id) : id;
  const hashedPassword = await hashPassword(password);
  const res = await col.updateOne(
    { _id: oid },
    {
      $set: {
        hashedPassword,
        isActivated: true,
        activatedAt: Date.now(),
        updatedAt: Date.now(),
      },
    }
  );
  return res.modifiedCount > 0;
}

export async function setStaffTwoFactorSecret(
  id: ObjectId,
  secret: string,
  enabled: boolean = true
): Promise<boolean> {
  const col = await getStaffCollection();
  const res = await col.updateOne(
    { _id: id },
    {
      $set: {
        twoFactorSecret: secret,
        twoFactorEnabled: enabled,
        updatedAt: Date.now(),
      },
    }
  );
  return res.modifiedCount > 0;
}

export async function recordStaffSuccessfulLogin(id: string | ObjectId): Promise<void> {
  const col = await getStaffCollection();
  const oid = typeof id === "string" ? new ObjectId(id) : id;
  await col.updateOne(
    { _id: oid },
    {
      $set: {
        lastLoginAt: Date.now(),
        updatedAt: Date.now(),
      },
    }
  );
}
