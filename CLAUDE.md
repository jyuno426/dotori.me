@AGENTS.md

## 개발 정책

### 로드맵 기반 개발

- `ROADMAP.md`을 참고하여, 미개발 항목에 우선순위 부여하여 개발.
- `ROADMAP.md`에서 구현 완료된 항목의 체크박스를 `[x]`로 변경할 것

## 디자인 시스템 정책

**전체 가이드**: `docs/design-system.md` · **프리미티브**: `src/components/ds/` · **토큰**: `src/app/globals.css` (`@theme inline`)

### 핵심 원칙 — UI를 만들 때 항상

1. **프리미티브 우선** — 새 UI는 `@/components/ds`의 프리미티브 (`Container`, `Section`, `Heading`, `Text`, `Button`, `Pill`, `Card`, `Stack`, `Eyebrow`)를 기본으로 조립한다. 직접 `<section>`, `<div>`, `<h2>`에 Tailwind를 적는 패턴은 DS가 감당 못 하는 경우에만 사용.
2. **토큰만 사용** — 색·폰트사이즈·간격은 반드시 토큰 (`bg-primary-50`, `text-heading-1`, `text-foreground-muted` 등). 임의 값 (`bg-[#abc]`, `text-[15px]`, `style={{color:"#f00"}}`)은 ESLint가 차단한다.
3. **타이포 스케일 고정** — `text-display` / `heading-1~3` / `title-lg|md|sm` / `body-lg|md|sm|xs` / `label-lg|md|sm` / `caption` / `overline`. size/line-height/letter-spacing/weight는 각 토큰에 묶여 있으므로 개별 조정 금지. 스케일 밖이 필요하면 스케일 확장 검토 후 globals.css에 토큰 추가.
4. **숫자에는 `nums`** — 금액·퍼센트·%·tabular 수치는 `<Text nums>` 또는 `className="nums"`로 tabular-nums 활성화.
5. **한글 letter-spacing 관습** — 큰 제목은 음수(−0.012em ~ −0.025em), 본문 0, 작은 UI는 살짝 양수. 이미 타이포 토큰에 반영돼 있으므로 별도 지정 불필요.

### 새 색·폰트·토큰이 필요할 때

1. 먼저 기존 토큰으로 해결 가능한지 확인 (`docs/design-system.md` 토큰 테이블 참고)
2. 없다면 `src/app/globals.css`의 `@theme inline` 블록에 토큰 추가 (색은 9단계 스케일 형태 권장)
3. `docs/design-system.md` 토큰 테이블 업데이트
4. 필요 시 프리미티브의 tone/variant 옵션으로 노출

### 차트·일러스트의 예외 팔레트

- 데이터 시각화 차트 (`*-chart.tsx` / `*.chart.tsx`)와 SVG 일러스트 (`components/**/icons/**`, `**/illustrations/**`, `acorn-icon.tsx`)는 **hex 리터럴 허용** (ESLint exempt)
- 단 arbitrary Tailwind 색·폰트사이즈와 인라인 style은 여전히 차단
- 차트 팔레트도 가능하면 DS 컬러를 먼저 후보로 (`var(--color-primary)` 등)

### ESLint 강제 규칙 (위반 시 `pnpm lint` 실패)

설정: `eslint.config.mjs` · 위반 메시지는 전부 "DS 위반: ..."으로 시작.

- Tailwind arbitrary 색 값 금지 — `bg-[#abc]`, `border-[rgb(...)]`, `text-[hsl(...)]` 등
- Tailwind arbitrary font-size 금지 — `text-[15px]`, `text-[1.1rem]` 등
- 인라인 style에 hex 색 리터럴 금지 — `style={{color: "#abc"}}` (단 `style={{color: "var(--color-primary)"}}`는 통과)
- 인라인 style에 fontSize/fontWeight 등 리터럴 금지 — `style={{fontSize: 14}}` 등
- hex 컬러 리터럴 단독 금지 — `"#abc"`, `"#aabbcc"` (exempt 경로 제외)

Claude는 위 규칙에 위배되는 코드를 **작성하기 전 단계에서** 자체 차단할 것. 무언가 불가피해 보이면 먼저 토큰 추가 여부를 사용자에게 제안한다.

## 테스트 정책

### 원칙

- 코드를 변경하면 관련 테스트도 함께 변경한다. 테스트 없는 코드 변경은 미완성이다.
- 새 기능 추가 시 해당 기능의 테스트를 반드시 작성한다.
- 기존 기능 수정 시 기존 테스트가 깨지지 않는지 확인하고, 필요하면 테스트를 업데이트한다.
- 버그 수정 시 해당 버그를 재현하는 테스트를 먼저 작성한 뒤 수정한다 (regression test).

### 테스트 실행

- 작업 완료 후 반드시 `pnpm test`를 실행하여 전체 테스트가 통과하는지 확인한다.
- 특정 파일만 테스트: `pnpm test -- src/__tests__/api/portfolios.test.ts`

### 테스트 작성 규칙

- 테스트 파일 위치: `src/__tests__/` 하위에 소스 구조를 반영하여 배치
  - `src/lib/*.ts` → `src/__tests__/lib/*.test.ts`
  - `src/app/api/**/route.ts` → `src/__tests__/api/*.test.ts`
- 테스트 DB: `createTestDb()`로 in-memory SQLite를 생성하여 격리한다 (실제 DB 접근 금지)
- 시드 데이터: `src/__tests__/helpers/test-db.ts`의 헬퍼 함수 사용 (`seedTestUser`, `seedTestPortfolio`, `seedTestAccount`, `seedTestSession`)
- API 테스트: `src/__tests__/helpers/request.ts`의 `createRequest`, `parseResponse` 사용
- 테스트 설명은 한국어로 작성하되, 무엇을 검증하는지 명확히 기술
- 외부 API 호출은 반드시 `vi.spyOn(globalThis, "fetch")`로 모킹

### 테스트가 필요한 변경

| 변경 유형 | 필요한 테스트 |
|---|---|
| API 라우트 추가/수정 | 성공 케이스, 인증 실패(401), 유효성 검증(400), 소유권 검증(404) |
| `src/lib/` 유틸리티 추가/수정 | 단위 테스트 (정상 입력, 경계값, 에러) |
| DB 스키마 변경 | `test-db.ts`의 DDL도 함께 업데이트 |
| 비즈니스 로직 변경 (수익률 등) | 계산 정확성 검증, 엣지 케이스 (빈 데이터, 0 나눗셈 등) |

## QA 정책

### 로컬 QA 계정

- 이메일: `qa@dotori.me`
- 비밀번호: `test1234`
- 이름: QA유저

### developer QA

- developer-qa/YYYY-MM-DD.md에 개발자가 개선을 원하는 사항이 날짜별로 작성되어 있음
- 개발자가 작성한 QA 리스트를 `[]` 체크박스 형태로 변경한 후, 반영이 완료되면 `[x]`로 변경할 것.
- 파일 전체가 반영이 완료되면 complete-YYYY-MM-DD.md 형식으로 파일 이름을 변경하여 완료 여부를 표시할 것.

### claude self E2E QA

- 개발/테스트 혹은 developer QA 수정 반영 후에 claude-in-chrome을 활용하여 자체 end-to-end qa를 진행.
- 각 개발 항목 마다, 개념증명/기능/UX/UI 등 더 중요한 항목에 높은 가중치를 부여하여 채점 기준을 만들것.