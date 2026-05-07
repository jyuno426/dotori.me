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
  X,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { AcornIcon } from "@/components/ui/acorn-icon";
import {
  Container,
  Section,
  Eyebrow,
  Heading,
  Text,
  Button,
  Pill,
  Card,
} from "@/components/ds";

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
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
        <Container className="h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <AcornIcon className="w-6 h-6" />
            <span className="text-title text-primary-dark">도토리</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Button href="/login" variant="primary" size="sm">
              시작하기
            </Button>
          </nav>
        </Container>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-b from-accent-100/30 via-background to-background"
          />
          <Container className="pt-20 pb-24 sm:pt-28 sm:pb-32 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
            <div>
              <Pill tone="primary" dot>
                투자가 처음이어도, 이미 하고 있어도
              </Pill>
              <Heading as="h1" level="display" className="mt-6">
                노후 준비,
                <br />
                <span className="text-primary">천천히 한 알씩.</span>
              </Heading>
              <Text
                size="body-lg"
                tone="muted"
                className="mt-6 max-w-xl"
              >
                막연하던 노후를 분명한 숫자로, 검증된 자산배분 한 가지를
                골라 매달 5분이면 끝나는 매매 지시서까지 — 가입 없이
                90초면 첫 그림이 그려져요.
              </Text>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Button
                  href="/tools/retirement"
                  variant="primary"
                  size="lg"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  90초 진단 시작하기
                </Button>
                <Button href="/login" variant="outline" size="lg">
                  이미 가입하셨다면
                </Button>
              </div>

              <Stack3 className="mt-8">
                <AssurancePoint text="비밀번호 필요 없음" />
                <AssurancePoint text="마이데이터 연결 없음" />
                <AssurancePoint text="카드 등록 없음" />
              </Stack3>
            </div>

            {/* 대시보드 미리보기 mock */}
            <div className="relative hidden lg:block">
              <DashboardPreview />
            </div>
          </Container>
        </section>

        {/* Problem */}
        <Section tone="muted" bordered>
          <Container>
            <div className="max-w-2xl mb-12">
              <Eyebrow>혼자 고민하지 마세요</Eyebrow>
              <Heading as="h2" level="heading-1">
                혹시, 이런 장면
                <br />
                익숙하지 않으세요?
              </Heading>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <ProblemCard
                heading="“ISA 계좌는 만들었는데…”"
                body="증권사 권유로 만들어 두긴 했는데, 예수금만 조용히 쌓여 있어요. 뭘 사야 할지 몰라서 거의 쉬고 있는 계좌가 됐어요."
              />
              <ProblemCard
                heading="“이번 달엔 뭘 얼마나?”"
                body="월급 들어오면 대충 적립은 하는데, 매달 기준 없이 그때그때 사요. 이게 맞게 가고 있는 건지 스스로 확신이 안 들어요."
              />
              <ProblemCard
                heading="“세금 혜택, 다 챙기고 있나?”"
                body="비과세 한도·연말정산 공제… 좋다는 건 알겠는데, 내 것은 얼마 남았는지 계산기 두드리기가 벌써 피곤해요."
              />
            </div>
          </Container>
        </Section>

        {/* Before / After */}
        <Section size="lg">
          <Container>
            <div className="max-w-2xl mb-14">
              <Eyebrow>도토리를 쓰면 달라져요</Eyebrow>
              <Heading as="h2" level="heading-1">
                복잡하던 월급날이
                <br />
                10분짜리 루틴이 됩니다.
              </Heading>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <Card tone="muted" radius="xl" padding="lg">
                <Text
                  size="caption"
                  tone="muted"
                  className="mb-5 tracking-wide"
                >
                  도토리 없이
                </Text>
                <ul className="space-y-4">
                  <CompareRow
                    kind="before"
                    text="증권사 앱을 세 군데 돌아가며 잔고를 일일이 비교해요."
                  />
                  <CompareRow
                    kind="before"
                    text="“이번 달엔 뭘 사지?” 검색창과 커뮤니티를 30분 넘게 뒤져요."
                  />
                  <CompareRow
                    kind="before"
                    text="ISA 비과세 한도가 얼마 남았는지 매번 직접 계산해요."
                  />
                  <CompareRow
                    kind="before"
                    text="연말이 돼서야 “공제 한도 못 채웠네” 하고 후회해요."
                  />
                </ul>
              </Card>

              <Card
                tone="primary"
                radius="xl"
                padding="lg"
                className="relative bg-gradient-to-br from-primary-50 via-surface to-accent-50 shadow-sm"
              >
                <Pill
                  tone="primary"
                  size="sm"
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                  className="mb-5"
                >
                  도토리와 함께
                </Pill>
                <ul className="space-y-4">
                  <CompareRow
                    kind="after"
                    text="세 계좌가 한 화면에. 전체 비중이 한눈에 보여요."
                  />
                  <CompareRow
                    kind="after"
                    text="월급일 알림 한 번. “이 계좌에서 이것을 몇 주”로 끝나요."
                  />
                  <CompareRow
                    kind="after"
                    text="남은 비과세·공제 한도를 자동으로 추적해드려요."
                  />
                  <CompareRow
                    kind="after"
                    text="연말 전에 “아직 ○○만원 더 넣을 수 있어요”라고 미리 알려드려요."
                  />
                </ul>
              </Card>
            </div>
          </Container>
        </Section>

        {/* Steps */}
        <Section tone="muted" size="lg" bordered>
          <Container>
            <div className="max-w-2xl mb-14">
              <Eyebrow>이렇게 시작해요</Eyebrow>
              <Heading as="h2" level="heading-1">
                가입부터 첫 매매 계획까지,
                <br />
                딱 5분이면 됩니다.
              </Heading>
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
          </Container>
        </Section>

        {/* Features */}
        <Section size="lg">
          <Container>
            <div className="max-w-2xl mb-14">
              <Eyebrow>주요 기능</Eyebrow>
              <Heading as="h2" level="heading-1">
                계산은 도토리가,
                <br />
                실제 매매는 당신이.
              </Heading>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<PieChart className="w-5 h-5" />}
                title="세 계좌를 한눈에"
                body="증권사마다 다른 앱을 오가지 않아도 됩니다. ISA · 연금저축 · IRP를 한 화면에서 전체 그림으로 봅니다."
                bullets={[
                  "주식·채권·현금 비중",
                  "목표 대비 기울어진 정도",
                  "부부·가족 계좌 통합 (예정)",
                ]}
              />
              <FeatureCard
                icon={<Scale className="w-5 h-5" />}
                title="이번 달 매매 계획"
                body="월 적립금을 어느 계좌에 얼마나 넣을지, 몇 주를 사야 할지 계산해 매매 체크리스트로 정리합니다."
                bullets={[
                  "1주 단위 매수·매도 수량",
                  "세금 아끼는 계좌부터 먼저",
                  "ISA 비과세 한도 자동 추적",
                ]}
              />
              <FeatureCard
                icon={<BellOff className="w-5 h-5" />}
                title="조용한 알림"
                body="매일 시세를 볼 필요는 없습니다. 관리가 필요한 순간에만 알려드리고, 평소엔 조용히 기다립니다."
                bullets={[
                  "필요할 때만 푸시",
                  "주간 요약 이메일",
                  "월급일 적립 리마인더",
                ]}
              />
            </div>
          </Container>
        </Section>

        {/* Tax */}
        <section className="border-t border-border bg-gradient-to-b from-accent-50/40 to-surface-subtle/60">
          <Container className="py-20">
            <div className="max-w-2xl mb-12">
              <Eyebrow>세금 혜택</Eyebrow>
              <Heading as="h2" level="heading-1">
                놓치면 아까운 세 가지,
                <br />
                도토리가 대신 기억해드려요.
              </Heading>
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

            <Card
              tone="default"
              radius="xl"
              padding="md"
              className="mt-10 border-primary-100 flex flex-col sm:flex-row items-start gap-5"
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <Text size="label" tone="primary" className="mb-1.5">
                  예를 들어
                </Text>
                <Text size="body">
                  총급여 5,500만원 이하 직장인이 IRP·연금저축에 매년 900만원을
                  꾸준히 채우면, 연말정산 때 매년{" "}
                  <b className="text-primary-dark">148.5만원</b>을 돌려받아요.
                  10년이면 <b className="text-primary-dark">약 1,485만원</b>.
                  그냥 두면 지나가는 돈입니다.
                </Text>
                <Text size="caption" tone="subtle" className="mt-2.5">
                  * 세율·소득구간에 따라 환급액은 달라질 수 있어요.
                </Text>
              </div>
            </Card>
          </Container>
        </section>

        {/* Trust */}
        <Section size="lg">
          <Container>
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <div>
                <Eyebrow>믿고 쓸 수 있어요</Eyebrow>
                <Heading as="h2" level="heading-1" className="mb-6">
                  당신의 돈이나 계좌에
                  <br />
                  도토리는 손대지 않습니다.
                </Heading>
                <Text size="body" tone="muted">
                  도토리는 계산과 기록을 도와주는 도구일 뿐입니다. 실제 매매는
                  당신이 평소 쓰는 증권사 앱에서 직접 하시고, 도토리는 그 과정을
                  편하게 만들어드려요.
                </Text>
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
          </Container>
        </Section>

        {/* FAQ */}
        <Section tone="muted" size="lg" bordered>
          <Container size="narrow">
            <div className="text-center mb-14">
              <Eyebrow className="inline-block">자주 묻는 질문</Eyebrow>
              <Heading as="h2" level="heading-1">
                시작 전에 궁금하시죠?
              </Heading>
            </div>

            <div className="space-y-3">
              <FaqItem
                q="증권사 비밀번호를 입력해야 하나요?"
                a="아니요. 도토리는 증권사 비밀번호·공동인증서·마이데이터 연결을 일절 받지 않아요. 보유 종목과 수량만 직접 입력해주시면 됩니다."
              />
              <FaqItem
                q="특정 종목을 추천해주나요?"
                a="아니요. 도토리는 특정 종목을 추천하지 않아요. 대신 본인이 정한 목표 비율에 맞춰 “어떤 자산군을 몇 주씩 사면 되는지” 계산만 도와드립니다."
              />
              <FaqItem
                q="실제 매매도 도토리에서 하나요?"
                a="아니요. 매매는 평소 쓰시던 증권사 앱에서 직접 해주세요. 도토리가 드리는 체크리스트를 보면서 증권사 앱에서 한 줄씩 따라 사면 끝이에요."
              />
              <FaqItem
                q="투자를 한 번도 안 해봤는데 써도 되나요?"
                a="그런 분을 위해 만들었어요. 주식·채권 비중을 잘 모르겠다면 추천 비율(예: 주식 60 · 채권 40)부터 시작할 수 있고, 용어는 모두 쉬운 말로 풀어드립니다."
              />
              <FaqItem
                q="유료인가요?"
                a="계좌 2개 · 종목 10개까지는 무료로 쓸 수 있어요. 카드 등록도 필요 없고, 더 많은 계좌·종목을 관리하고 싶어지면 그때 유료 플랜을 선택할 수 있어요."
              />
            </div>
          </Container>
        </Section>

        {/* Final CTA */}
        <section className="relative overflow-hidden border-t border-border">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-50 via-background to-accent-100/40"
          />
          <Container size="narrow" className="py-24 text-center">
            <AcornIcon className="w-12 h-12 mx-auto mb-6" />
            <Heading as="h2" level="heading-1" className="mb-5">
              한 알씩 모아, 단단한 내일로.
            </Heading>
            <Text
              size="body-lg"
              tone="muted"
              className="mb-10 max-w-xl mx-auto"
            >
              계좌 2개 · 종목 10개까지 무료로 써볼 수 있어요.
              <br />
              가입부터 첫 그림까지 5분, 카드 등록도 필요 없습니다.
            </Text>
            <Button
              href="/login"
              variant="primary"
              size="lg"
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              무료로 시작하기
            </Button>
          </Container>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <Container className="py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AcornIcon className="w-5 h-5" />
            <Text as="span" size="body-sm" tone="subtle">
              도토리 · dotori.me
            </Text>
          </div>
          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="text-body-sm text-foreground-subtle hover:text-foreground transition-colors"
            >
              시작하기
            </Link>
          </div>
        </Container>
      </footer>
    </div>
  );
}

// ─── 페이지 전용 조립 컴포넌트 ────────────────────────

function Stack3({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "flex flex-wrap items-center gap-x-5 gap-y-2 " + (className ?? "")
      }
    >
      {children}
    </div>
  );
}

function AssurancePoint({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-body-sm text-foreground-muted">
      <ShieldCheck className="w-4 h-4 text-primary/70" />
      {text}
    </span>
  );
}

function ProblemCard({ heading, body }: { heading: string; body: string }) {
  return (
    <Card padding="md" radius="lg">
      <Heading as="h3" level="title" tone="primary" className="mb-3">
        {heading}
      </Heading>
      <Text size="body-sm" tone="muted">
        {body}
      </Text>
    </Card>
  );
}

function CompareRow({
  kind,
  text,
}: {
  kind: "before" | "after";
  text: string;
}) {
  const isAfter = kind === "after";
  return (
    <li className="flex items-start gap-3">
      <span
        className={
          "shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center " +
          (isAfter
            ? "bg-primary text-white"
            : "bg-surface-subtle text-foreground-subtle")
        }
      >
        {isAfter ? (
          <CheckCircle2 className="w-3.5 h-3.5" />
        ) : (
          <X className="w-3 h-3" />
        )}
      </span>
      <span
        className={
          "text-body-sm " +
          (isAfter ? "text-foreground-strong" : "text-foreground-muted")
        }
      >
        {text}
      </span>
    </li>
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
    <Card padding="lg" radius="lg">
      <div className="flex items-center gap-3 mb-4">
        <span className="shrink-0 w-8 h-8 rounded-full bg-primary text-white text-label font-semibold flex items-center justify-center">
          {step}
        </span>
        <span className="text-primary">{icon}</span>
      </div>
      <Heading as="h3" level="title-lg" className="mb-2.5">
        {title}
      </Heading>
      <Text size="body-sm" tone="muted">
        {body}
      </Text>
    </Card>
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
    <Card as="article" padding="lg" radius="lg" interactive>
      <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary flex items-center justify-center mb-5">
        {icon}
      </div>
      <Heading as="h3" level="title-lg" className="mb-2.5">
        {title}
      </Heading>
      <Text size="body-sm" tone="muted" className="mb-5">
        {body}
      </Text>
      <ul className="space-y-2 border-t border-border pt-4">
        {bullets.map((b) => (
          <li
            key={b}
            className="text-body-sm text-foreground flex items-start gap-2"
          >
            <span className="mt-[7px] w-1 h-1 rounded-full bg-primary shrink-0" />
            {b}
          </li>
        ))}
      </ul>
    </Card>
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
    <Card padding="md" radius="lg">
      <Text
        size="caption"
        tone="subtle"
        className="mb-3 tracking-wide"
      >
        {label}
      </Text>
      <div className="flex items-baseline gap-1.5 mb-4 flex-wrap">
        <span className="text-heading-1 nums text-primary-dark">{value}</span>
        <Text as="span" size="caption" tone="muted">
          {suffix}
        </Text>
      </div>
      <Text size="body-sm" tone="muted">
        {body}
      </Text>
    </Card>
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
      <div className="shrink-0 w-10 h-10 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
        {icon}
      </div>
      <div>
        <Heading as="h3" level="title" className="mb-1.5">
          {title}
        </Heading>
        <Text size="body-sm" tone="muted">
          {body}
        </Text>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl bg-surface border border-border open:border-primary-200 transition-colors">
      <summary className="flex items-center gap-3 cursor-pointer list-none px-5 py-4 select-none">
        <span className="shrink-0 w-7 h-7 rounded-full bg-primary-50 text-primary flex items-center justify-center">
          <HelpCircle className="w-4 h-4" />
        </span>
        <span className="flex-1 text-title">{q}</span>
        <span className="shrink-0 text-foreground-subtle text-xl leading-none transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="px-5 pb-5 pt-1 pl-[60px] text-body-sm text-foreground-muted">
        {a}
      </div>
    </details>
  );
}

// ─── Hero 우측: 정적 대시보드 미리보기 ───────────────
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
        className="absolute -inset-8 -z-10 bg-gradient-to-br from-primary-100/50 via-transparent to-accent-200/40 blur-2xl rounded-3xl"
      />
      <div className="rounded-2xl bg-surface border border-border shadow-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <Text size="caption" tone="subtle" className="mb-1">
              전체 자산
            </Text>
            <p className="text-title-lg nums text-foreground-strong">
              ₩ 127,430,000
            </p>
          </div>
          <Pill tone="success" size="sm" icon={<LineChart className="w-3 h-3" />}>
            +8.4%
          </Pill>
        </div>

        <div className="flex items-center gap-5 pt-2">
          <Donut arcs={arcs} />
          <ul className="flex-1 space-y-2">
            {segments.map((s) => (
              <li key={s.label} className="flex items-center gap-2 text-caption">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ background: s.color }}
                />
                <span className="text-foreground-muted flex-1">{s.label}</span>
                <span className="nums font-medium">{s.pct}%</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-border pt-4 space-y-2.5">
          <AccountRow
            label="ISA 계좌"
            value="₩ 41,200,000"
            badge="비과세 남은 184만"
          />
          <AccountRow
            label="연금저축"
            value="₩ 38,700,000"
            badge="올해 공제 78%"
          />
          <AccountRow label="IRP" value="₩ 29,500,000" badge="올해 공제 92%" />
          <AccountRow label="일반 계좌" value="₩ 18,030,000" />
        </div>

        <div className="flex items-center gap-2 pt-2 text-caption text-foreground-muted">
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
    <div className="flex items-center justify-between text-caption">
      <div className="flex items-center gap-2">
        <span className="text-foreground">{label}</span>
        {badge && (
          <span className="text-caption text-primary bg-primary-50 px-1.5 py-0.5 rounded">
            {badge}
          </span>
        )}
      </div>
      <span className="nums font-medium text-foreground">{value}</span>
    </div>
  );
}
