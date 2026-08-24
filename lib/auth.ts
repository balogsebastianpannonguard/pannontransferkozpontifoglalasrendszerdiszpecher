import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import {
  findStaffUserByEmail,
  verifyPassword as bcryptVerifyPassword,
  recordStaffSuccessfulLogin,
} from "./staff-auth";

export const AUTH_COOKIE_NAME = "pannon_dispatcher_session";
export const DISPATCHER_COOKIE_SECRET =
  process.env.DISPATCHER_COOKIE_SECRET || "pannon_transfer_dispatcher_super_secret_2026_jwt_key";

export interface DispatcherUser {
  email: string;
  name: string;
  role: "dispatcher" | "admin" | "partner";
  company?: string;
  loginAt: number;
  requireTwoFactor?: boolean;
  twoFactorEnabled?: boolean;
  staffId?: string;
}

export interface VerifyResult {
  success: boolean;
  message?: string;
  requireTwoFactor?: boolean;
  twoFactorEnabled?: boolean;
  user?: DispatcherUser;
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<VerifyResult> {
  if (!email || !password) {
    return { success: false, message: "Kérjük, adja meg a hozzáférési adatokat." };
  }

  // First try env-based fallback (for default super admin dispatcher account)
  const DISPATCHER_EMAIL = process.env.DISPATCHER_EMAIL || "dispecer@pannon.hu";
  const DISPATCHER_PASSWORD = process.env.DISPATCHER_PASSWORD || "Pannon2026!";
  const DISPATCHER_NAME = process.env.DISPATCHER_NAME || "Pannon Diszpécser";
  const DISPATCHER_ROLE =
    (process.env.DISPATCHER_ROLE || "dispatcher") as DispatcherUser["role"];
  const DISPATCHER_COMPANY = process.env.DISPATCHER_COMPANY || "Pannon Transfer";

  const envEmailMatch = email.trim().toLowerCase() === DISPATCHER_EMAIL.toLowerCase();
  const envPasswordMatch = password === DISPATCHER_PASSWORD;
  if (envEmailMatch && envPasswordMatch) {
    return {
      success: true,
      requireTwoFactor: false,
      twoFactorEnabled: false,
      user: {
        email: DISPATCHER_EMAIL,
        name: DISPATCHER_NAME,
        role: DISPATCHER_ROLE,
        company: DISPATCHER_COMPANY,
        loginAt: Date.now(),
      },
    };
  }

  // MongoDB staff users (role = dispatcher)
  try {
    const user = await findStaffUserByEmail(email);
    if (!user) {
      return { success: false, message: "Hibás e-mail cím vagy jelszó." };
    }
    if (user.role !== "dispatcher" && user.role !== "admin") {
      return { success: false, message: "Nincs jogosultságod a Diszpécser Központba." };
    }
    if (!user.isActivated || !user.hashedPassword) {
      return {
        success: false,
        message:
          "A fiók még nincs aktiválva. Kérlek használd a meghívó emailben kapott linket a fiókod aktiválásához.",
      };
    }
    const passwordMatch = await bcryptVerifyPassword(password, user.hashedPassword);
    if (!passwordMatch) {
      return { success: false, message: "Hibás e-mail cím vagy jelszó." };
    }
    if (user._id) {
      await recordStaffSuccessfulLogin(user._id);
    }
    return {
      success: true,
      requireTwoFactor: !!user.requireTwoFactor,
      twoFactorEnabled: !!user.twoFactorEnabled,
      user: {
        email: user.email,
        name: user.name || user.email.split("@")[0],
        role: user.role as DispatcherUser["role"],
        company: DISPATCHER_COMPANY,
        loginAt: Date.now(),
        requireTwoFactor: !!user.requireTwoFactor,
        twoFactorEnabled: !!user.twoFactorEnabled,
        staffId: user._id ? String(user._id) : undefined,
      },
    };
  } catch (err) {
    console.error("[verifyCredentials] mongo error", err);
    return { success: false, message: "Hálózati hiba, kérjük próbálja újra." };
  }
}

export async function getDispatcherProfile(user?: DispatcherUser): Promise<DispatcherUser> {
  if (user) return user;
  const DISPATCHER_EMAIL = process.env.DISPATCHER_EMAIL || "dispecer@pannon.hu";
  const DISPATCHER_NAME = process.env.DISPATCHER_NAME || "Pannon Diszpécser";
  const DISPATCHER_ROLE =
    (process.env.DISPATCHER_ROLE || "dispatcher") as DispatcherUser["role"];
  const DISPATCHER_COMPANY = process.env.DISPATCHER_COMPANY || "Pannon Transfer";
  return {
    email: DISPATCHER_EMAIL,
    name: DISPATCHER_NAME,
    role: DISPATCHER_ROLE,
    company: DISPATCHER_COMPANY,
    loginAt: Date.now(),
  };
}

export function createSessionToken(user: DispatcherUser, remember: boolean = true): string {
  const expiresIn = remember ? "7d" : "1d";
  return jwt.sign(user as object, DISPATCHER_COOKIE_SECRET, { expiresIn });
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
