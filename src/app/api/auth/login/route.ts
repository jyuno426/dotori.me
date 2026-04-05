import { NextRequest, NextResponse } from "next/server";
import { signIn, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "이메일과 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    const user = await signIn(email, password);
    await createSession(user.id);

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "로그인 실패";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
