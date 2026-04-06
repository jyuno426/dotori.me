@AGENTS.md

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

## QA 완료 후

- QA가 모두 완료되면 `ROADMAP.md`에서 구현 완료된 항목의 체크박스를 `[x]`로 변경할 것

## 로컬 QA 계정

- 이메일: `qa@dotori.me`
- 비밀번호: `test1234`
- 이름: QA유저
