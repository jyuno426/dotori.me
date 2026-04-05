import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { targetAllocations, portfolios } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { generateId } from "@/lib/utils";
import { eq, and } from "drizzle-orm";

// 목표 비중 조회
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const portfolioId = req.nextUrl.searchParams.get("portfolioId");
  if (!portfolioId) {
    return NextResponse.json({ error: "portfolioId가 필요합니다." }, { status: 400 });
  }

  const pf = db
    .select()
    .from(portfolios)
    .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, session.userId)))
    .get();
  if (!pf) return NextResponse.json({ error: "포트폴리오를 찾을 수 없습니다." }, { status: 404 });

  const rows = db
    .select()
    .from(targetAllocations)
    .where(eq(targetAllocations.portfolioId, portfolioId))
    .all();

  return NextResponse.json(rows);
}

// 목표 비중 저장 (전체 교체)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { portfolioId, allocations } = await req.json();

  const pf = db
    .select()
    .from(portfolios)
    .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, session.userId)))
    .get();
  if (!pf) return NextResponse.json({ error: "포트폴리오를 찾을 수 없습니다." }, { status: 404 });

  if (!Array.isArray(allocations) || allocations.length === 0) {
    return NextResponse.json({ error: "비중 데이터를 입력해주세요." }, { status: 400 });
  }

  // 합계 검증
  const total = allocations.reduce((s: number, a: { targetPercent: number }) => s + a.targetPercent, 0);
  if (Math.abs(total - 100) > 0.01) {
    return NextResponse.json({ error: "목표 비중 합계가 100%가 되어야 합니다." }, { status: 400 });
  }

  // 기존 삭제 후 새로 삽입
  db.delete(targetAllocations)
    .where(eq(targetAllocations.portfolioId, portfolioId))
    .run();

  for (const alloc of allocations) {
    if (alloc.targetPercent > 0) {
      db.insert(targetAllocations)
        .values({
          id: generateId(),
          portfolioId,
          assetClass: alloc.assetClass,
          targetPercent: alloc.targetPercent,
        })
        .run();
    }
  }

  const rows = db
    .select()
    .from(targetAllocations)
    .where(eq(targetAllocations.portfolioId, portfolioId))
    .all();

  return NextResponse.json(rows);
}
