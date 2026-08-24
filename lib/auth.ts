import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const AUTH_COOKIE_NAME = "pannon_dispatcher_session";
export const DISPATCHER_COOKIE_SECRET =
  process.env.DISPATCHER_COOKIE_SECRET || "pannon_transfer_dispatcher_super_secret_2026_jwt_key";

export interface DispatcherUser {
  email: string;
  name: string;
  role: "dispatcher" | "admin" | "partner";
  company?: string;
  loginAt: number;
}

const DISPATCHER_EMAIL = process.env.DISPATCHER_EMAIL || "dispecer@pannon.hu";
const DISPATCHER_PASSWORD = process.env.DISPATCHER_PASSWORD || "Pannon2026!";
const DISPATCHER_NAME = process.env.DISPATCHER_NAME || "Pannon Diszpécser";
const DISPATCHER_ROLE = (process.env.DISPATCHER_ROLE || "dispatcher") as DispatcherUser["role"];
const DISPATCHER_COMPANY = process.env.DISPATCHER_COMPANY || "Pannon Transfer";

export async function verifyCredentials(
  email: string,
  password: string
): Promise<{ success: boolean; message?: string }> {
  if (!email || !password) {
    return { success: false, message: "Kérjük, adja meg a hozzáférési adatokat." };
  }

  const emailMatch = email.trim().toLowerCase() === DISPATCHER_EMAIL.toLowerCase();
  const passwordMatch = password === DISPATCHER_PASSWORD;

  if (!emailMatch || !passwordMatch) {
    return { success: false, message: "Hibás e-mail cím vagy jelszó." };
  }

  return { success: true };
}

export async function getDispatcherProfile(): Promise<DispatcherUser> {
  return {
    email: DISPATCHER_EMAIL,
    name: DISPATCHER_NAME,
    role: DISPATCHER_ROLE,
    company: DISPATCHER_COMPANY,
    loginAt: Date.now(),
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createSessionToken(user: DispatcherUser, remember: boolean = true): string {
  const expiresIn = remember ? "7d" : "1d";
  return jwt.sign(user, DISPATCHER_COOKIE_SECRET, { expiresIn });
}

export function verifySessionToken(token: string): DispatcherUser | null {
  try {
    return jwt.verify(token, DISPATCHER_COOKIE_SECRET) as DispatcherUser;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string, remember: boolean = true) {
  const cookieStore = await cookies();
  const maxAge = remember ? 60 * 60 * 24 * 7 : 60 * 60 * 24 * 1;
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function getCurrentSession(): Promise<DispatcherUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireAuthSession(): Promise<DispatcherUser | null> {
  return getCurrentSession();
}
