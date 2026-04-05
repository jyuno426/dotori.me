import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts, portfolios } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { generateId } from "@/lib/utils";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const portfolioId = req.nextUrl.searchParams.get("portfolioId");

  if (portfolioId) {
    // 해당 포트폴리오가 사용자 소유인지 확인
    const pf = db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, session.userId)))
      .get();
    if (!pf) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const rows = db
      .select()
      .from(accounts)
      .where(eq(accounts.portfolioId, portfolioId))
      .all();
    return NextResponse.json(rows);
  }

  // 사용자의 모든 계좌
  const rows = db
    .select({ account: accounts, portfolio: portfolios })
    .from(accounts)
    .innerJoin(portfolios, eq(accounts.portfolioId, portfolios.id))
    .where(eq(portfolios.userId, session.userId))
    .all();

  return NextResponse.json(rows.map((r) => ({ ...r.account, portfolioName: r.portfolio.name })));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { portfolioId, name, broker, accountType, taxType, owner } = await req.json();

  // 포트폴리오 소유권 확인
  const pf = db
    .select()
    .from(portfolios)
    .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, session.userId)))
    .get();
  if (!pf) return NextResponse.json({ error: "포트폴리오를 찾을 수 없습니다." }, { status: 404 });

  if (!name || !accountType || !taxType) {
    return NextResponse.json({ error: "필수 항목을 입력해주세요." }, { status: 400 });
  }

  const id = generateId();
  db.insert(accounts)
    .values({
      id,
      portfolioId,
      name,
      broker: broker ?? null,
      accountType,
      taxType,
      owner: owner ?? null,
    })
    .run();

  const row = db.select().from(accounts).where(eq(accounts.id, id)).get();
  return NextResponse.json(row, { status: 201 });
}
