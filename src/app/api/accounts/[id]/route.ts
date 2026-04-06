import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
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

  const row = db
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
