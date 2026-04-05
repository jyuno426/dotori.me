import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { holdings, accounts, portfolios } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { generateId } from "@/lib/utils";
import { eq, and } from "drizzle-orm";

// 특정 계좌의 보유 종목 조회
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = req.nextUrl.searchParams.get("accountId");
  const portfolioId = req.nextUrl.searchParams.get("portfolioId");

  if (accountId) {
    const rows = db.select().from(holdings).where(eq(holdings.accountId, accountId)).all();
    return NextResponse.json(rows);
  }

  if (portfolioId) {
    const rows = db
      .select({ holding: holdings, account: accounts })
      .from(holdings)
      .innerJoin(accounts, eq(holdings.accountId, accounts.id))
      .where(eq(accounts.portfolioId, portfolioId))
      .all();
    return NextResponse.json(
      rows.map((r) => ({ ...r.holding, accountName: r.account.name }))
    );
  }

  return NextResponse.json({ error: "accountId 또는 portfolioId가 필요합니다." }, { status: 400 });
}

// 보유 종목 추가/수정
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { accountId, ticker, name, assetClass, shares } = await req.json();

  // 계좌 소유권 확인
  const account = db
    .select({ account: accounts, portfolio: portfolios })
    .from(accounts)
    .innerJoin(portfolios, eq(accounts.portfolioId, portfolios.id))
    .where(and(eq(accounts.id, accountId), eq(portfolios.userId, session.userId)))
    .get();
  if (!account) return NextResponse.json({ error: "계좌를 찾을 수 없습니다." }, { status: 404 });

  if (!ticker || !name || !assetClass || shares == null) {
    return NextResponse.json({ error: "필수 항목을 입력해주세요." }, { status: 400 });
  }

  // 같은 계좌·종목이면 수량 업데이트
  const existing = db
    .select()
    .from(holdings)
    .where(and(eq(holdings.accountId, accountId), eq(holdings.ticker, ticker)))
    .get();

  if (existing) {
    db.update(holdings)
      .set({ shares, name, assetClass, updatedAt: new Date() })
      .where(eq(holdings.id, existing.id))
      .run();
    const updated = db.select().from(holdings).where(eq(holdings.id, existing.id)).get();
    return NextResponse.json(updated);
  }

  const id = generateId();
  db.insert(holdings)
    .values({ id, accountId, ticker, name, assetClass, shares })
    .run();

  const row = db.select().from(holdings).where(eq(holdings.id, id)).get();
  return NextResponse.json(row, { status: 201 });
}

// 보유 종목 삭제
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const holdingId = req.nextUrl.searchParams.get("id");
  if (!holdingId) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });

  db.delete(holdings).where(eq(holdings.id, holdingId)).run();
  return NextResponse.json({ ok: true });
}
