import { redirect } from "next/navigation";
import Link from "next/link";
import {
  PieChart,
  Scale,
  BellOff,
  ShieldCheck,
  ArrowRight,
  LineChart,
  Wallet,
  UserPlus,
  Target,
  CheckCircle2,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { AcornIcon } from "@/components/ui/acorn-icon";

export const metadata = {
  title: "도토리 — ISA · 연금저축 · IRP, 뭘 사야 할지 알려드려요",
  description:
    "세 계좌를 한 화면에 모으고, 이번 달 뭘 몇 주 사야 할지 계산해드립니다. 투자가 처음이어도 괜찮아요.",
};

export default async function LandingPage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex-1">
      {/* Top nav */}
      <header className="sticky top-0 z-10 border-b border-surface-dim bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <AcornIcon className="w-6 h-6" />
            <span className="font-semibold text-primary-dark">도토리</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/login"
              className="px-3.5 py-1.5 text-sm text-foreground/70 hover:text-foreground transition-colors"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="px-3.5 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark transition-colors"
            >
              시작하기
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-b from-[color:var(--color-accent-light)]/20 via-background to-background"
          />
          <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                투자가 처음이어도, 이미 하고 있어도
              </span>
              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-[56px] font-bold leading-[1.15] tracking-tight text-foreground">
                ISA · 연금저축 · IRP,
                <br />
                이제 <span className="text-primary">헷갈리지 마세요.</span>
              </h1>
              <p className="mt-6 text-lg text-foreground/70 leading-relaxed max-w-xl">
                세 계좌를 한 화면에 모으고, 이번 달 뭘 몇 주 사야 할지까지
                계산해드립니다. 복잡한 용어는 몰라도 괜찮아요.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-white hover:bg-primary-dark transition-colors shadow-sm"
                >
                  무료로 시작하기
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="rounded-lg px-6 py-3 text-base font-medium text-foreground/80 hover:text-foreground transition-colors"
                >
                  로그인
                </Link>
              </div>

              <p className="mt-6 text-sm text-foreground/50 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                증권사 비밀번호 · 공동인증서 · 마이데이터 연결이 필요하지 않아요
              </p>
            </div>

            {/* 대시보드 미리보기 mock */}
            <div className="relative hidden lg:block">
              <DashboardPreview />
            </div>
          </div>
        </section>

        {/* Problem — 초보가 공감할 질문 3개 */}
        <section className="border-t border-surface-dim bg-surface/50">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="max-w-2xl mb-12">
              <p className="text-sm font-medium text-primary tracking-wide mb-3">
                혼자 고민하지 마세요
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
                이런 생각, 혹시
                <br />
                해보신 적 있나요?
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <ProblemCard
                heading="“ISA 계좌는 만들었는데…”"
                body="가입은 했는데 정확히 뭘 사야 할지 모르겠고, 그냥 예수금만 쌓여 있어요. 남들은 어떻게 굴리는 걸까요?"
              />
              <ProblemCard
                heading="“매달 뭘 얼마나 사야 할까?”"
                body="월급 들어온 날 적립 투자를 하긴 하는데, 뚜렷한 기준 없이 그때그때 사고 있어요. 이게 맞는 걸까 싶어요."
              />
              <ProblemCard
                heading="“세금 혜택 놓치는 거 아닐까?”"
                body="ISA 비과세, 연말정산 세액공제… 혜택이 많다던데, 내가 제대로 챙기고 있는지 확신이 안 들어요."
              />
            </div>
          </div>
        </section>

        {/* Steps — 3단계 온보딩 */}
        <section className="max-w-6xl mx-auto px-6 py-24">
          <div className="max-w-2xl mb-14">
            <p className="text-sm font-medium text-primary tracking-wide mb-3">
              이렇게 시작해요
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
              투자 초보자도
              <br />
              5분이면 첫 그림이 그려집니다.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <StepCard
              step="1"
              icon={<UserPlus className="w-5 h-5" />}
              title="보유 현황만 입력"
              body="지금 갖고 있는 종목과 수량을 알려주세요. 비밀번호나 공동인증서 없이 이름·수량만 적으면 됩니다."
            />
            <StepCard
              step="2"
              icon={<Target className="w-5 h-5" />}
              title="목표 비율 정하기"
              body="주식과 채권을 어떤 비율로 가져갈지 정해주세요. 잘 모르겠다면 추천 비율(예: 주식 60 · 채권 40)부터 시작할 수 있어요."
            />
            <StepCard
              step="3"
              icon={<CheckCircle2 className="w-5 h-5" />}
              title="매달 체크리스트 따라가기"
              body="월급일에 도토리가 “이 계좌에서 이것을 몇 주” 정리한 매매 체크리스트를 드려요. 증권사 앱에서 그대로 따라 사면 끝."
            />
          </div>
        </section>

        {/* Features — 주요 기능 3가지 */}
        <section className="border-t border-surface-dim bg-surface/50">
          <div className="max-w-6xl mx-auto px-6 py-24">
            <div className="max-w-2xl mb-14">
              <p className="text-sm font-medium text-primary tracking-wide mb-3">
                주요 기능
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
                계산은 도토리가,
                <br />
                실제 매매는 당신이.
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<PieChart className="w-5 h-5" />}
                title="세 계좌를 한눈에"
                body="증권사마다 다른 앱을 오가지 않아도 됩니다. ISA · 연금저축 · IRP를 한 화면에서 전체 그림으로 봅니다."
                bullets={["주식·채권·현금 비중", "목표 대비 기울어진 정도", "부부·가족 계좌 통합 (예정)"]}
              />
              <FeatureCard
                icon={<Scale className="w-5 h-5" />}
                title="이번 달 매매 계획"
                body="월 적립금을 어느 계좌에 얼마나 넣을지, 몇 주를 사야 할지 계산해 매매 체크리스트로 정리합니다."
                bullets={["1주 단위 매수·매도 수량", "세금 아끼는 계좌부터 먼저", "ISA 비과세 한도 자동 추적"]}
              />
              <FeatureCard
                icon={<BellOff className="w-5 h-5" />}
                title="조용한 알림"
                body="매일 시세를 볼 필요는 없습니다. 관리가 필요한 순간에만 알려드리고, 평소엔 조용히 기다립니다."
                bullets={["필요할 때만 푸시", "주간 요약 이메일", "월급일 적립 리마인더"]}
              />
            </div>
          </div>
        </section>

        {/* Tax benefits */}
        <section className="border-t border-surface-dim bg-gradient-to-b from-surface-dim/30 to-surface-dim/50">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="max-w-2xl mb-12">
              <p className="text-sm font-medium text-primary tracking-wide mb-3">
                세금 혜택
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
                놓치면 아까운 세 가지,
                <br />
                도토리가 대신 기억해드려요.
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <TaxCard
                label="ISA 이자·배당 비과세"
                value="200만원"
                suffix="까지 세금 0원"
                body="ISA 계좌에서 번 이자·배당 200만원까지는 세금이 0원이에요. 초과분도 9.9%만 분리과세되어 세 부담이 크게 줄어듭니다."
              />
              <TaxCard
                label="연말정산 환급"
                value="148.5만원"
                suffix="까지 돌려받기"
                body="IRP + 연금저축에 한 해 900만원을 넣으면, 연말정산 때 최대 148.5만원을 돌려받을 수 있어요. 매년 챙기면 큰 차이가 됩니다."
              />
              <TaxCard
                label="ISA 만기 추가 환급"
                value="최대 300만원"
                suffix="환급 가능"
                body="ISA 만기 자금을 IRP로 옮기면, 옮긴 금액의 10%(최대 300만원)를 추가로 환급받을 수 있어요. 만기 시점 챙기기가 중요합니다."
              />
            </div>
          </div>
        </section>

        {/* Trust — 믿고 쓸 수 있는 이유 */}
        <section className="max-w-6xl mx-auto px-6 py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-sm font-medium text-primary tracking-wide mb-3">
                믿고 쓸 수 있어요
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight mb-6">
                당신의 돈이나 계좌에
                <br />
                도토리는 손대지 않습니다.
              </h2>
              <p className="text-foreground/70 leading-relaxed">
                도토리는 계산과 기록을 도와주는 도구일 뿐입니다. 실제 매매는
                당신이 평소 쓰는 증권사 앱에서 직접 하시고, 도토리는 그 과정을
                편하게 만들어드려요.
              </p>
            </div>

            <div className="space-y-5">
              <PrincipleRow
                icon={<ShieldCheck className="w-5 h-5" />}
                title="비밀번호 · 인증서를 받지 않아요"
                body="증권사 로그인이나 마이데이터 연결은 요구하지 않습니다. 보유 종목과 수량만 직접 입력해주시면 돼요."
              />
              <PrincipleRow
                icon={<Wallet className="w-5 h-5" />}
                title="입력 부담도 최소로"
                body="복잡한 거래내역을 하나하나 넣지 않아도 됩니다. 보유 수량·예수금·입출금 세 가지만 알려주시면 나머지는 도토리가 계산해요."
              />
              <PrincipleRow
                icon={<LineChart className="w-5 h-5" />}
                title="매매는 직접, 도토리는 가이드만"
                body="도토리는 금융상품을 팔거나 특정 종목을 추천하지 않습니다. “이번 달 이렇게 해보세요” 정도의 가이드만 드려요."
              />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden border-t border-surface-dim">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-[color:var(--color-accent-light)]/20"
          />
          <div className="max-w-3xl mx-auto px-6 py-24 text-center">
            <AcornIcon className="w-12 h-12 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight mb-5">
              한 알씩 모아, 단단한 내일로.
            </h2>
            <p className="text-lg text-foreground/70 leading-relaxed mb-10 max-w-xl mx-auto">
              계좌 2개 · 종목 10개까지 무료로 써볼 수 있어요.
              <br />
              가입부터 첫 그림까지 5분, 카드 등록도 필요 없습니다.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-base font-medium text-white hover:bg-primary-dark transition-colors shadow-sm"
            >
              무료로 시작하기
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-dim">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-foreground/50">
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
    </div>
  );
}

// ─── 서브 컴포넌트 ─────────────────────────────────────

function ProblemCard({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="rounded-xl bg-surface border border-surface-dim p-6">
      <h3 className="text-base font-semibold mb-3 text-primary-dark">{heading}</h3>
      <p className="text-sm text-foreground/70 leading-relaxed">{body}</p>
    </div>
  );
}

function StepCard({
  step,
  icon,
  title,
  body,
}: {
  step: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="relative rounded-xl bg-surface border border-surface-dim p-7">
      <div className="flex items-center gap-3 mb-4">
        <span className="shrink-0 w-8 h-8 rounded-full bg-primary text-white text-sm font-semibold flex items-center justify-center">
          {step}
        </span>
        <span className="text-primary">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold mb-2.5 tracking-tight">{title}</h3>
      <p className="text-sm text-foreground/70 leading-relaxed">{body}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
  bullets,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  bullets: string[];
}) {
  return (
    <article className="rounded-xl bg-surface border border-surface-dim p-7 hover:border-primary/30 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2.5 tracking-tight">{title}</h3>
      <p className="text-sm text-foreground/70 leading-relaxed mb-5">{body}</p>
      <ul className="space-y-2 border-t border-surface-dim pt-4">
        {bullets.map((b) => (
          <li
            key={b}
            className="text-sm text-foreground/80 flex items-start gap-2"
          >
            <span className="mt-[7px] w-1 h-1 rounded-full bg-primary shrink-0" />
            {b}
          </li>
        ))}
      </ul>
    </article>
  );
}

function TaxCard({
  label,
  value,
  suffix,
  body,
}: {
  label: string;
  value: string;
  suffix: string;
  body: string;
}) {
  return (
    <div className="rounded-xl bg-surface border border-surface-dim p-6">
      <p className="text-xs font-medium text-foreground/50 tracking-wide mb-3">
        {label}
      </p>
      <div className="flex items-baseline gap-1.5 mb-4 flex-wrap">
        <span className="text-3xl font-bold tracking-tight text-primary-dark">
          {value}
        </span>
        <span className="text-xs text-foreground/60">{suffix}</span>
      </div>
      <p className="text-sm text-foreground/70 leading-relaxed">{body}</p>
    </div>
  );
}

function PrincipleRow({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h3 className="text-base font-semibold mb-1.5">{title}</h3>
        <p className="text-sm text-foreground/70 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

// Hero 우측: 정적 대시보드 미리보기 카드
function DashboardPreview() {
  const segments = [
    { label: "국내 주식", pct: 34, color: "var(--color-primary)" },
    { label: "해외 주식", pct: 31, color: "var(--color-primary-light)" },
    { label: "채권", pct: 22, color: "var(--color-accent)" },
    { label: "현금·대안", pct: 13, color: "var(--color-accent-light)" },
  ];

  let cumulative = 0;
  const arcs = segments.map((s) => {
    const start = cumulative;
    cumulative += s.pct;
    return { ...s, start, end: cumulative };
  });

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-8 -z-10 bg-gradient-to-br from-primary/10 via-transparent to-[color:var(--color-accent)]/10 blur-2xl rounded-3xl"
      />
      <div className="rounded-2xl bg-surface border border-surface-dim shadow-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-foreground/50 mb-1">전체 자산</p>
            <p className="text-xl font-bold tracking-tight">₩ 127,430,000</p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-md">
            <LineChart className="w-3 h-3" />
            +8.4%
          </span>
        </div>

        <div className="flex items-center gap-5 pt-2">
          <Donut arcs={arcs} />
          <ul className="flex-1 space-y-2">
            {segments.map((s) => (
              <li key={s.label} className="flex items-center gap-2 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ background: s.color }}
                />
                <span className="text-foreground/70 flex-1">{s.label}</span>
                <span className="font-medium tabular-nums">{s.pct}%</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-surface-dim pt-4 space-y-2.5">
          <AccountRow label="ISA 계좌" value="₩ 41,200,000" badge="비과세 남은 184만" />
          <AccountRow label="연금저축" value="₩ 38,700,000" badge="올해 공제 78%" />
          <AccountRow label="IRP" value="₩ 29,500,000" badge="올해 공제 92%" />
          <AccountRow label="일반 계좌" value="₩ 18,030,000" />
        </div>

        <div className="flex items-center gap-2 pt-2 text-xs text-foreground/60">
          <BellOff className="w-3.5 h-3.5" />
          <span>이번 달은 매매하지 않아도 괜찮아요</span>
        </div>
      </div>
    </div>
  );
}

function Donut({
  arcs,
}: {
  arcs: { start: number; end: number; color: string }[];
}) {
  const r = 32;
  const cx = 40;
  const cy = 40;
  const toXY = (pct: number) => {
    const angle = (pct / 100) * 2 * Math.PI - Math.PI / 2;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as const;
  };
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="shrink-0">
      {arcs.map((a, i) => {
        const [x1, y1] = toXY(a.start);
        const [x2, y2] = toXY(a.end);
        const large = a.end - a.start > 50 ? 1 : 0;
        return (
          <path
            key={i}
            d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
            fill={a.color}
          />
        );
      })}
      <circle cx={cx} cy={cy} r="18" fill="var(--color-surface)" />
    </svg>
  );
}

function AccountRow({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <span className="text-foreground/80">{label}</span>
        {badge && (
          <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
            {badge}
          </span>
        )}
      </div>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
