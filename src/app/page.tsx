import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { AcornIcon } from "@/components/ui/acorn-icon";

export const metadata = {
  title: "도토리 — ISA·연금저축·IRP 자산배분 리밸런싱",
  description:
    "당신의 세 계좌를 한눈에, 세금까지 고려한 리밸런싱. 스노우볼72로 전략을 검증했다면, 도토리로 실행하세요.",
};

export default async function LandingPage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <AcornIcon className="w-10 h-10" />
            <span className="text-xl font-bold text-primary-dark">도토리</span>
          </div>

          <p className="text-sm font-medium text-primary mb-5 tracking-wide">
            ISA · 연금저축 · IRP 자산배분 매니저
          </p>

          <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-foreground mb-6">
            전략은 검증했습니다.
            <br />
            이제 <span className="text-primary">&lsquo;내 돈&rsquo;으로 굴릴 차례</span>입니다.
          </h1>

          <p className="text-lg text-foreground/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            당신의 ISA · 연금저축 · IRP를 한 화면에, 오늘 당장 몇 주를 사야
            하는지 계산해드립니다. 세금 한도와 만기 혜택까지 놓치지 않게.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-6 py-3 text-base font-medium text-white hover:bg-primary-dark transition-colors"
            >
              무료로 시작하기
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-surface-dim px-6 py-3 text-base font-medium text-foreground hover:bg-surface-dim/50 transition-colors"
            >
              로그인
            </Link>
          </div>

          <p className="text-sm text-foreground/50">
            계좌 비밀번호도, 공동인증서도, 마이데이터 동의도 필요 없습니다.
          </p>
        </div>
      </section>

      {/* 보완재 서사 */}
      <section className="px-6 py-14 bg-surface-dim/40 border-y border-surface-dim">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-foreground/70 text-base sm:text-lg leading-relaxed">
            <span className="font-semibold text-foreground">스노우볼72</span>로
            전략을 검증했다면, <span className="font-semibold text-primary">도토리</span>로 실행하세요.
            <br className="hidden sm:block" />
            연 수수료 30~100만원 내며 맡기지 마세요. 월 4,900원부터 직접 굴리세요.
          </p>
        </div>
      </section>

      {/* 3가지 핵심 가치 */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">
            세 계좌, 하나의 전략
          </h2>
          <p className="text-foreground/60 text-center mb-14">
            증권사 앱이 쪼개놓은 자산을, 도토리가 다시 합쳐드립니다.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <article className="rounded-xl bg-surface border border-surface-dim p-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary text-xl font-bold">
                ①
              </div>
              <h3 className="text-lg font-semibold mb-2">다계좌 통합 뷰</h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                ISA · 연금저축 · IRP · 일반위탁을 한 화면에. 자산군별 비중과
                목표 대비 편차를 한눈에 확인하세요.
              </p>
            </article>

            <article className="rounded-xl bg-surface border border-surface-dim p-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary text-xl font-bold">
                ②
              </div>
              <h3 className="text-lg font-semibold mb-2">세금 최적화 리밸런싱</h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                ISA 비과세 200만원 한도, 연금계좌 세액공제 900만원, ISA→IRP
                이체 10% 추가 공제까지 반영한 매매 지시서.
              </p>
            </article>

            <article className="rounded-xl bg-surface border border-surface-dim p-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary text-xl font-bold">
                ③
              </div>
              <h3 className="text-lg font-semibold mb-2">덜 보게 만드는 앱</h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                편차가 없으면 침묵합니다. 매일 호가 보지 마세요. 월 2~4회면
                충분한 자산배분 투자의 본래 리듬을 지킵니다.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* 경쟁 좌표 */}
      <section className="px-6 py-20 bg-surface-dim/40 border-y border-surface-dim">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            도토리는 <span className="text-primary">어디에</span> 있나요?
          </h2>

          <div className="space-y-4 text-sm sm:text-base">
            <div className="flex items-start gap-4 p-5 rounded-lg bg-surface border border-surface-dim">
              <div className="font-semibold text-foreground/60 min-w-[96px]">든든 vs 도토리</div>
              <div className="text-foreground/80">
                <span className="text-foreground/50">자율주행(맡기세요, AUM 수수료)</span>
                {" → "}
                <span className="font-medium text-primary-dark">수동 기어 + 고성능 계기판 (당신이 운전)</span>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-lg bg-surface border border-surface-dim">
              <div className="font-semibold text-foreground/60 min-w-[96px]">스노우볼72 vs 도토리</div>
              <div className="text-foreground/80">
                <span className="text-foreground/50">전략 연구실(과거 백테스트)</span>
                {" → "}
                <span className="font-medium text-primary-dark">운영실(오늘 몇 주를 사야 하나)</span>
              </div>
            </div>

            <div className="flex items-start gap-4 p-5 rounded-lg bg-surface border border-surface-dim">
              <div className="font-semibold text-foreground/60 min-w-[96px]">더리치 vs 도토리</div>
              <div className="text-foreground/80">
                <span className="text-foreground/50">종목 시세 트래커</span>
                {" → "}
                <span className="font-medium text-primary-dark">자산배분 비중 + 세금 최적화</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <AcornIcon className="w-12 h-12 mx-auto mb-5" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            한 알씩 모아, 단단한 내일로.
          </h2>
          <p className="text-foreground/70 mb-8 leading-relaxed">
            계좌 2개, 종목 10개까지 무료로 사용할 수 있습니다.
            <br />
            가입 후 5분이면 첫 포트폴리오를 확인할 수 있어요.
          </p>
          <Link
            href="/signup"
            className="inline-block rounded-lg bg-primary px-8 py-3 text-base font-medium text-white hover:bg-primary-dark transition-colors"
          >
            무료로 시작하기
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 border-t border-surface-dim">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-foreground/50">
          <div className="flex items-center gap-2">
            <AcornIcon className="w-5 h-5" />
            <span>도토리 · dotori.me</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/login" className="hover:text-foreground transition-colors">
              로그인
            </Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">
              회원가입
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
