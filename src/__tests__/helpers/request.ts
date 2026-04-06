/**
 * NextRequest / NextResponse 테스트 헬퍼
 */
import { NextRequest } from "next/server";

/**
 * 테스트용 NextRequest 생성
 */
export function createRequest(
  method: string,
  url: string,
  body?: Record<string, unknown>,
): NextRequest {
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

/**
 * NextResponse에서 JSON body와 status를 추출
 */
export async function parseResponse(response: Response) {
  const body = await response.json();
  return { body, status: response.status };
}
