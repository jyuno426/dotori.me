import { getDb } from "./db";
import { users, sessions } from "./db/schema";
import { eq, and, gt } from "drizzle-orm";
import { generateId } from "./utils";
import { cookies } from "next/headers";
import crypto from "crypto";

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
}

export async function signUp(email: string, password: string, name?: string) {
  const db = getDb();
  const existing = await db.select().from(users).where(eq(users.email, email)).get();
  if (existing) {
    throw new Error("이미 등록된 이메일입니다.");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(password, salt);
  const id = generateId();

  await db.insert(users)
    .values({ id, email, name: name ?? null, passwordHash: `${salt}:${hash}` })
    .run();

  return { id, email, name };
}

export async function signIn(email: string, password: string) {
  const db = getDb();
  const user = await db.select().from(users).where(eq(users.email, email)).get();
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

// 세션 관리 (DB 기반 + 쿠키)
const SESSION_COOKIE = "dotori_session";

export async function createSession(userId: string) {
  const db = getDb();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7일

  await db.insert(sessions).values({ token, userId, expiresAt }).run();

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

  const db = getDb();
  const session = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, Date.now())))
    .get();

  if (!session) {
    await db.delete(sessions).where(eq(sessions.token, token)).run();
    return null;
  }

  const user = await db.select().from(users).where(eq(users.id, session.userId)).get();
  if (!user) return null;

  return { userId: user.id, email: user.email, name: user.name };
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = getDb();
    await db.delete(sessions).where(eq(sessions.token, token)).run();
    cookieStore.delete(SESSION_COOKIE);
  }
}
