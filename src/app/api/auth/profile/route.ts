import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const user = await db.select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, session.userId))
    .get();

  if (!user) return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });

  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();

  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
  }

  const trimmed = name.trim();
  if (trimmed.length > 50) {
    return NextResponse.json({ error: "이름은 50자 이내로 입력해주세요." }, { status: 400 });
  }

  const db = getDb();
  await db.update(users)
    .set({ name: trimmed })
    .where(eq(users.id, session.userId))
    .run();

  return NextResponse.json({ name: trimmed });
}
