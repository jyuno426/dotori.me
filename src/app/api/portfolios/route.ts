import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { portfolios } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { generateId } from "@/lib/utils";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = db
    .select()
    .from(portfolios)
    .where(eq(portfolios.userId, session.userId))
    .all();

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "포트폴리오 이름을 입력해주세요." }, { status: 400 });
  }

  const id = generateId();
  db.insert(portfolios)
    .values({ id, userId: session.userId, name, description: description ?? null })
    .run();

  const row = db.select().from(portfolios).where(eq(portfolios.id, id)).get();
  return NextResponse.json(row, { status: 201 });
}
