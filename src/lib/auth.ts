import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import { generateId } from "./utils";
import { cookies } from "next/headers";
import crypto from "crypto";

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
}

export async function signUp(email: string, password: string, name?: string) {
  const existing = db.select().from(users).where(eq(users.email, email)).get();
  if (existing) {
    throw new Error("이미 등록된 이메일입니다.");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(password, salt);
  const id = generateId();

  db.insert(users)
    .values({ id, email, name: name ?? null, passwordHash: `${salt}:${hash}` })
    .run();

  return { id, email, name };
}

export async function signIn(email: string, password: string) {
  const user = db.select().from(users).where(eq(users.email, email)).get();
  if (!user) {
    throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
  }

  const [salt, storedHash] = user.passwordHash.split(":");
  const hash = hashPassword(password, salt);
  if (hash !== storedHash) {
    throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
  }

  return { id: user.id, email: user.email, name: user.name };
}

// 간단한 세션 관리 (쿠키 기반)
const SESSION_COOKIE = "dotori_session";
const sessions = new Map<string, { userId: string; expiresAt: number }>();

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7일
  sessions.set(token, { userId, expiresAt });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return token;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }

  const user = db.select().from(users).where(eq(users.id, session.userId)).get();
  if (!user) return null;

  return { userId: user.id, email: user.email, name: user.name };
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    sessions.delete(token);
    cookieStore.delete(SESSION_COOKIE);
  }
}
