import Link from "next/link";
import { AcornIcon } from "@/components/ui/acorn-icon";
import { Container } from "@/components/ds";
import { RetirementCalculator } from "./RetirementCalculator";

export const metadata = {
  title: "은퇴 자금 계산기 — 30대도 늦지 않은 노후 준비 | 도토리",
  description:
    "막연한 노후 불안을 90초 안에 분명한 숫자로 바꿔드려요. 자산배분 기반 시뮬레이션, 가입 없이 바로 확인.",
};

export default function RetirementToolPage() {
  return (
    <div className="flex-1 bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
        <Container className="h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <AcornIcon className="w-6 h-6" />
            <span className="text-title text-primary-dark">도토리</span>
          </Link>
        </Container>
      </header>

      <main className="py-12 sm:py-20">
        <Container className="max-w-3xl">
          <RetirementCalculator />
        </Container>
      </main>
    </div>
  );
}
