# 테스트 구조

## 디렉토리 구조

```
tests/
├── integration/    # 패키지 간 통합 테스트
├── e2e/           # End-to-End 테스트 (API + DB + Frontend)
├── fixtures/      # 테스트 데이터 및 Mock 데이터
└── README.md      # 이 파일
```

## 테스트 레벨

### 1. 단위 테스트 (Unit Tests)
- **위치**: `packages/*/src/__tests__/`
- **목적**: 개별 클래스, 함수의 로직 검증
- **실행**: `pnpm -r test` (각 패키지별로)
- **예시**: Domain entities, Value objects, Use cases

### 2. 통합 테스트 (Integration Tests)
- **위치**: `tests/integration/`
- **목적**: 패키지 간 상호작용 검증
- **실행**: `pnpm test:integration`
- **예시**: Use case + Repository, Domain + Application 레이어

### 3. E2E 테스트 (End-to-End Tests)
- **위치**: `tests/e2e/`
- **목적**: 사용자 시나리오 전체 플로우 검증
- **실행**: `pnpm test:e2e`
- **예시**: 회원가입 → 로그인 → 프로필 수정 전체 플로우

## 테스트 데이터

### Fixtures
- **위치**: `tests/fixtures/`
- **목적**: 테스트에서 사용할 공통 데이터
- **예시**: 
  - `users.json`: 테스트 사용자 데이터
  - `schools.json`: 테스트 학교 데이터
  - `invites.json`: 테스트 초대 데이터

## 실행 명령어

```bash
# 모든 단위 테스트
pnpm -r test

# 통합 테스트만
pnpm test:integration

# E2E 테스트만  
pnpm test:e2e

# 모든 테스트
pnpm test:all
```

## 테스트 환경

- **단위/통합**: 인메모리 DB 또는 Mock 사용
- **E2E**: 실제 Supabase 테스트 환경 사용
- **CI/CD**: GitHub Actions에서 자동 실행