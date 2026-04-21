# 도토리 디자인 시스템

**위치**: `src/components/ds/` · **토큰**: `src/app/globals.css` · **사용 예시**: `src/app/page.tsx`

---

## 1. Philosophy

도토리의 시각 언어는 타 핀테크의 "빠름 · 날카로움 · 자극"과 반대 방향으로 설계된다.

### 세 가지 원칙

1. **조용한 신뢰 (Quiet Confidence)**
   - 과장된 gradient · 큰 수치 자랑 · 격렬한 애니메이션 **없음**
   - 강조는 꼭 필요한 순간에만. 평소엔 조용하다.

2. **친절한 명확함 (Kind Clarity)**
   - 투자 초보자가 읽어도 막히지 않는 단어, 계층 있는 레이아웃
   - 전문 용어 순화 (리밸런싱 → 매매 체크리스트, 드리프트 → 기울어진 정도 등)

3. **자연의 리듬 (Natural Rhythm)**
   - 따뜻한 오프화이트 · 숲의 녹색 · 도토리의 호박색
   - 유기적인 둥근 radius, 여유로운 여백, 느린 이징

---

## 2. Tokens

모든 토큰은 `src/app/globals.css`의 `@theme inline` 블록에 정의되어 있으며, 동일 이름의 Tailwind 유틸리티로 자동 노출된다.

### Font

- 단일 폰트: **Pretendard Variable** (OFL, CDN 로드)
- fallback: `-apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR"`
- feature-settings: `"ss06" "cv11"` (기본 활성)
- **수치에는 `.nums` 유틸리티(= `font-variant-numeric: tabular-nums`) 필수**

### Typography scale

`size / line-height / letter-spacing / weight` 의 고정 조합. 임의 조합 금지 — 스케일 밖이 필요하면 먼저 스케일 확장 제안.

| Token | Size | LH | LS | Weight | 용도 |
|---|---:|---:|---:|---:|---|
| `text-display`     | 56 | 1.10 | −0.025em | 700 | 랜딩 히어로 (desktop) |
| `text-display-sm`  | 40 | 1.15 | −0.022em | 700 | 모바일 히어로 |
| `text-heading-1`   | 32 | 1.25 | −0.018em | 700 | 섹션 H2 |
| `text-heading-2`   | 24 | 1.30 | −0.012em | 600 | H3 |
| `text-heading-3`   | 20 | 1.40 | −0.006em | 600 | H4 |
| `text-title-lg`    | 18 | 1.45 | −0.006em | 600 | 큰 카드 타이틀 |
| `text-title`       | 16 | 1.50 | −0.003em | 600 | 카드/블록 타이틀 |
| `text-title-sm`    | 14 | 1.45 |   0     | 600 | 소형 타이틀 |
| `text-body-lg`     | 18 | 1.70 |   0     | 400 | 리드/서브 카피 |
| `text-body`        | 16 | 1.65 |   0     | 400 | 본문 기본 |
| `text-body-sm`     | 14 | 1.60 |   0     | 400 | 보조 본문 |
| `text-body-xs`     | 13 | 1.55 | 0.005em | 400 | 푸터·주석 |
| `text-label-lg`    | 15 | 1.35 | −0.002em | 500 | 큰 버튼 라벨 |
| `text-label`       | 14 | 1.35 |   0     | 500 | 기본 라벨 |
| `text-label-sm`    | 13 | 1.35 | 0.005em | 500 | 작은 라벨 |
| `text-caption`     | 12 | 1.40 | 0.015em | 500 | 메타 · 표지 |
| `text-overline`    | 13 | 1.30 | 0.040em | 600 | 섹션 overline |

**한글 letter-spacing 가이드**
- 크기 커질수록 음수 방향 (heading/display는 −0.012em ~ −0.025em)
- 본문은 0
- 작은 UI 텍스트(label-sm, caption)는 가독성 위해 살짝 양수

### Color

3종 역할: **Neutral(따뜻한 회색)**, **Primary(숲 녹색)**, **Accent(호박색)** + semantic.

**Neutral (surface & text)** — 반드시 토큰 사용, hex 금지

| 토큰 | 용도 |
|---|---|
| `bg-background`       | 페이지 바탕 (따뜻한 오프화이트) |
| `bg-surface`          | 카드 · 입력 · 네비 등 올라간 면 |
| `bg-surface-muted`    | 살짝 가라앉은 면 |
| `bg-surface-subtle`   | 더 가라앉은 면 (Before/After 좌측 등) |
| `text-foreground`         | 기본 본문 텍스트 |
| `text-foreground-strong`  | 헤딩 · 강조 텍스트 |
| `text-foreground-muted`   | 부가 설명 |
| `text-foreground-subtle`  | 메타 · 비활성 |
| `border-border`       | 기본 테두리 |
| `border-border-strong`| 강조 테두리 |

**Primary (Forest green #4F7942)** · 9-step scale
- `primary-50` … `primary-900`
- 별칭: `primary` (= 500), `primary-light` (= 400), `primary-dark` (= 700)

**Accent (Warm amber #D4A574)** · 7-step scale
- `accent-50` … `accent-700`
- 별칭: `accent` (= 400), `accent-light` (= 200), `accent-dark` (= 600)

**Semantic**
- `success` / `success-bg`
- `warning` / `warning-bg`
- `danger`  / `danger-bg`
- `info`    / `info-bg`

### Radius

- `rounded-xs`  0.25 | `rounded-sm`  0.375 | `rounded-md`  0.5
- `rounded-lg`  0.75 | `rounded-xl`  1 | `rounded-2xl` 1.25 | `rounded-3xl` 1.5
- `rounded-pill` (완전 원형 배지)

**기본 규칙**
- 버튼 sm → `rounded-md`, md → `rounded-lg`, lg → `rounded-xl`
- 카드: `rounded-lg` 또는 `rounded-xl`
- elevated 카드(Hero mock): `rounded-2xl`
- Pill/Chip: `rounded-pill`

### Shadow (warm-tinted)

섀도우는 **순수 검정이 아닌 따뜻한 갈색 알파**. 숲·흙 팔레트와의 연속성.

- `shadow-xs` → 버튼 기본 hairline
- `shadow-sm` → 일반 카드
- `shadow-md` → 툴팁 · 드롭다운
- `shadow-lg` → 드로어 · 포커스 카드
- `shadow-xl` → 모달 · Hero mock

### Motion

- `--duration-fast`     120ms — 버튼 상태 전환
- `--duration-base`     180ms — 기본 transition
- `--duration-slow`     280ms — 카드 elevation, 레이아웃 shift
- `--duration-ambient`  520ms — 분위기성 장식

Easing
- `--ease-quiet`  `cubic-bezier(0.22, 1, 0.36, 1)` — 기본. "조용히 도착"
- `--ease-calm`   `cubic-bezier(0.45, 0, 0.25, 1)` — 대칭 상호작용
- `--ease-spring` `cubic-bezier(0.34, 1.56, 0.64, 1)` — 강조 피드백

**`prefers-reduced-motion` 존중** (globals.css에서 전역 비활성)

---

## 3. Primitives

모든 프리미티브는 `@/components/ds`에서 import.

```tsx
import { Container, Section, Eyebrow, Heading, Text, Button, Pill, Card, Stack } from "@/components/ds";
```

### `<Container size?="narrow|default|wide">`
- max-width + 좌우 패딩 통일 (`max-w-3xl | 6xl | 7xl` · `px-6`)

### `<Section tone?="default|muted|subtle" size?="sm|md|lg" bordered?>`
- 섹션 세로 리듬 통일. `bordered`로 상단 구분선.

### `<Eyebrow tone?="primary|accent|muted">`
- 섹션 overline. `text-overline` 적용.

### `<Heading as?="h1..h6" level?="display|heading-1..3|title-lg|title|title-sm" tone?>`
- 시맨틱(`as`)과 시각 스케일(`level`) 분리.
- `display`은 자동으로 모바일 `display-sm` → 데스크탑 `display`로 스위치.

### `<Text as?="p|span|div|li" size?="body-lg..label-sm|caption" tone?="default|strong|muted|subtle|primary|onPrimary|danger" nums?>`
- 금액·수치에는 반드시 `nums` prop (tabular numerals).

### `<Button variant?="primary|secondary|ghost|outline" size?="sm|md|lg" href? iconLeft? iconRight? fullWidth?>`
- `href` 있으면 Next.js `<Link>` 자동.
- 포커스 링은 globals.css의 `:focus-visible`이 전역 처리.

### `<Pill tone?="primary|accent|muted|success|warning|danger|info" size?="sm|md" dot? icon? bordered?>`
- 인라인 칩. dot (상태 점), icon, 테두리 off 옵션.

### `<Card tone?="default|muted|primary|elevated" padding?="none|sm|md|lg" radius?="md|lg|xl|2xl" interactive? as?>`
- 인터랙티브 카드는 hover 시 `border-primary-200`.

### `<Stack direction?="col|row" gap?="xs|sm|md|lg|xl|2xl" align? justify? wrap?>`
- 플렉스 스택 유틸.

---

## 4. Usage patterns

### 섹션 스캐폴드
```tsx
<Section tone="muted" size="lg" bordered>
  <Container>
    <Eyebrow>섹션 표지</Eyebrow>
    <Heading as="h2" level="heading-1">섹션 헤드라인</Heading>
    <Text size="body-lg" tone="muted" className="mt-4 max-w-2xl">
      섹션 리드 문장.
    </Text>
    {/* ... */}
  </Container>
</Section>
```

### 금액·수치
```tsx
<Text size="title-lg" nums tone="strong">₩ 127,430,000</Text>
<span className="text-heading-1 nums text-primary-dark">148.5만원</span>
```

### 상태 배지
```tsx
<Pill tone="success" size="sm" icon={<LineChart className="w-3 h-3" />}>+8.4%</Pill>
<Pill tone="primary" dot>초보자 환영</Pill>
```

### CTA
```tsx
<Button href="/signup" variant="primary" size="lg" iconRight={<ArrowRight className="w-4 h-4" />}>
  무료로 시작하기
</Button>
```

---

## 5. 강제 규칙 (ESLint)

`eslint.config.mjs`에서 다음 패턴을 **error 레벨**로 차단한다. `pnpm lint` 실패 = 머지 불가.

| 규칙 | 위반 예 | 권장 대체 |
|---|---|---|
| Tailwind arbitrary 색 | `bg-[#4f7942]` | `bg-primary` |
| Tailwind arbitrary font-size | `text-[15px]` | `text-label-lg` |
| 인라인 hex 색 | `style={{color:"#f00"}}` | `className="text-danger"` 또는 `style={{color:"var(--color-danger)"}}` |
| 인라인 폰트 속성 | `style={{fontSize:14}}` | `className="text-body-sm"` |
| hex 리터럴 단독 | `"#aabbcc"` | DS 토큰 |

**예외 경로** (hex 허용, 나머지 구조 규칙은 여전히 적용)
- `src/components/ui/acorn-icon.tsx`
- `src/components/**/icons/**`
- `src/components/**/illustrations/**`
- `src/components/**/*-chart.tsx` · `*.chart.tsx`

**테스트 경로** (`src/__tests__/**`): DS 강제 완전 off.

불가피한 사용은 `// eslint-disable-next-line no-restricted-syntax` 1회성 허용.

## 6. 새 토큰 추가 워크플로우

1. 기존 토큰으로 해결 가능한지 먼저 확인 (위 테이블 참고)
2. `src/app/globals.css`의 `@theme inline` 블록에 토큰 추가
   - 색: 9단계 스케일 (`50`, `100`, `200` … `900`) 권장
   - 타이포: `--text-xxx` + `--text-xxx--line-height` + `--text-xxx--letter-spacing` + `--text-xxx--font-weight` 4종 함께
3. 본 문서 `## 2. Tokens` 테이블 업데이트
4. 필요하면 프리미티브에 `tone` / `level` / `variant` 옵션으로 노출

## 7. 금지 사항

- **이모지** — 사용자가 명시 요청하지 않으면 금지 (CLAUDE.md 반영)
- **경쟁사 브랜드 요소 모방** — 토스/든든/스노우볼 등 (CLAUDE.md 반영)
- **hard-shadow (순수 검정 알파)** — warm-tinted 토큰 사용

---

## 8. 확장 로드맵

- [ ] Form primitives: `Input`, `Select`, `Textarea`, `Checkbox`, `Switch`
- [ ] Navigation: `Tabs`, `Menu`, `Breadcrumb`
- [ ] Feedback: `Toast`, `Modal`, `Banner`, `EmptyState`
- [ ] Data: `Table`, `Stat`, `Sparkline`
- [ ] Dark mode 토큰 검증 (현재 베이스만 정의)

---

*Last updated: 2026-04-21 — Pretendard 단일 폰트 + 9단계 타이포 스케일 + 프리미티브 8종 초기 릴리스*
