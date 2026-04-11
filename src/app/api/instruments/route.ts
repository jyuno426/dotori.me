import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { instruments, portfolios } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { generateId } from "@/lib/utils";
import { eq, and } from "drizzle-orm";

// 종목 목록 조회
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const portfolioId = req.nextUrl.searchParams.get("portfolioId");
  if (!portfolioId) {
    return NextResponse.json({ error: "portfolioId가 필요합니다." }, { status: 400 });
  }

  const db = getDb();
  const pf = await db
    .select()
    .from(portfolios)
    .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, session.userId)))
    .get();
  if (!pf) return NextResponse.json({ error: "포트폴리오를 찾을 수 없습니다." }, { status: 404 });

  const rows = await db
    .select()
    .from(instruments)
    .where(eq(instruments.portfolioId, portfolioId))
    .all();

  return NextResponse.json(rows);
}

// 종목 추가/수정 (upsert: portfolioId + ticker)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { portfolioId, ticker, name, assetClass } = await req.json();

  if (!portfolioId || !ticker || !name || !assetClass) {
    return NextResponse.json({ error: "필수 항목을 입력해주세요." }, { status: 400 });
  }

  const db = getDb();
  const pf = await db
    .select()
    .from(portfolios)
    .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, session.userId)))
    .get();
  if (!pf) return NextResponse.json({ error: "포트폴리오를 찾을 수 없습니다." }, { status: 404 });

  // upsert: 같은 (portfolioId, ticker) 존재 시 업데이트
  const existing = await db
    .select()
    .from(instruments)
    .where(and(eq(instruments.portfolioId, portfolioId), eq(instruments.ticker, ticker)))
    .get();

  if (existing) {
    await db.update(instruments)
      .set({ name, assetClass })
      .where(eq(instruments.id, existing.id))
      .run();
    const updated = await db.select().from(instruments).where(eq(instruments.id, existing.id)).get();
    return NextResponse.json(updated);
  }

  const id = generateId();
  await db.insert(instruments)
    .values({ id, portfolioId, ticker, name, assetClass })
    .run();

  const row = await db.select().from(instruments).where(eq(instruments.id, id)).get();
  return NextResponse.json(row, { status: 201 });
}

// 종목 삭제
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });

  // 소유권 확인
  const db = getDb();
  const row = await db
    .select({ instrument: instruments, portfolio: portfolios })
    .from(instruments)
    .innerJoin(portfolios, eq(instruments.portfolioId, portfolios.id))
    .where(and(eq(instruments.id, id), eq(portfolios.userId, session.userId)))
    .get();
  if (!row) return NextResponse.json({ error: "종목을 찾을 수 없습니다." }, { status: 404 });

  await db.delete(instruments).where(eq(instruments.id, id)).run();
  return NextResponse.json({ ok: true });
}
