import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { accounts, portfolios } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// 계좌 단건 조회
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const db = getDb();
  const row = await db
    .select({ account: accounts, portfolio: portfolios })
    .from(accounts)
    .innerJoin(portfolios, eq(accounts.portfolioId, portfolios.id))
    .where(and(eq(accounts.id, id), eq(portfolios.userId, session.userId)))
    .get();

  if (!row) return NextResponse.json({ error: "계좌를 찾을 수 없습니다." }, { status: 404 });

  return NextResponse.json({
    ...row.account,
    portfolioId: row.portfolio.id,
    portfolioName: row.portfolio.name,
  });
}

// 계좌 삭제 (cascade로 스냅샷도 함께 삭제)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const db = getDb();
  const row = await db
    .select({ account: accounts, portfolio: portfolios })
    .from(accounts)
    .innerJoin(portfolios, eq(accounts.portfolioId, portfolios.id))
    .where(and(eq(accounts.id, id), eq(portfolios.userId, session.userId)))
    .get();

  if (!row) return NextResponse.json({ error: "계좌를 찾을 수 없습니다." }, { status: 404 });

  await db.delete(accounts).where(eq(accounts.id, id)).run();
  return NextResponse.json({ ok: true });
}
