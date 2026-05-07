import Link from "next/link";
import { AcornIcon } from "@/components/ui/acorn-icon";
import { Container } from "@/components/ds";
import { PortfolioQuiz } from "./PortfolioQuiz";

export const metadata = {
  title: "자산배분 진단 — 내게 맞는 한 길 찾기 | 도토리",
  description:
    "2~3분 두세 문항이면 끝나요. 영구포트폴리오·K-올웨더형·글로벌 60/40·30대 성장형 중 결이 맞는 자산배분을 안내해드려요.",
};

export default function PortfolioQuizPage() {
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
        <Container className="max-w-2xl">
          <PortfolioQuiz />
        </Container>
      </main>
    </div>
  );
}
