import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { securities } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { or, like, sql } from "drizzle-orm";

// 종목 검색
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 10, 30);

  if (!q || q.length === 0) {
    return NextResponse.json([]);
  }

  const pattern = `%${q}%`;

  const rows = db
    .select()
    .from(securities)
    .where(
      or(
        sql`LOWER(${securities.name}) LIKE LOWER(${pattern})`,
        like(securities.ticker, pattern)
      )
    )
    .limit(limit)
    .all();

  return NextResponse.json(rows);
}
