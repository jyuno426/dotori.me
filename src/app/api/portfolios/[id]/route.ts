import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { portfolios } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// 포트폴리오 단건 조회
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const db = getDb();
  const row = await db
    .select()
    .from(portfolios)
    .where(and(eq(portfolios.id, id), eq(portfolios.userId, session.userId)))
    .get();

  if (!row)
    return NextResponse.json(
      { error: "포트폴리오를 찾을 수 없습니다." },
      { status: 404 },
    );

  return NextResponse.json(row);
}

// 포트폴리오 삭제 (cascade로 계좌·스냅샷·종목·목표비중 모두 삭제)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const db = getDb();
  const row = await db
    .select()
    .from(portfolios)
    .where(and(eq(portfolios.id, id), eq(portfolios.userId, session.userId)))
    .get();

  if (!row)
    return NextResponse.json(
      { error: "포트폴리오를 찾을 수 없습니다." },
      { status: 404 },
    );

  await db.delete(portfolios).where(eq(portfolios.id, id)).run();
  return NextResponse.json({ ok: true });
}
