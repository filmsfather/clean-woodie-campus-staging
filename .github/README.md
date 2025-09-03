# GitHub Actions Setup Guide

## Required GitHub Environments

GitHub Repository → Settings → Environments에서 다음 환경을 생성하세요:

### 1. staging 환경
- **Protection rules**: None (자동 배포)
- **Environment secrets**: 아래 Secrets 섹션 참조

### 2. production 환경  
- **Protection rules**: 
  - ✅ Required reviewers: 최소 1명 이상
  - ✅ Prevent administrators from bypassing required reviews
- **Environment secrets**: 아래 Secrets 섹션 참조

> 💡 **승인 플로우**: Production 배포는 자동으로 진행되지 않습니다. Required reviewers로 지정된 사람이 GitHub에서 수동으로 승인해야 배포가 시작됩니다.

## Required GitHub Secrets

### Staging Environment Secrets
Repository → Settings → Environments → staging → Environment secrets:

```
STAGING_SUPABASE_URL=https://your-staging-project.supabase.co
STAGING_SUPABASE_ANON_KEY=your-staging-anon-key
```

### Production Environment Secrets  
Repository → Settings → Environments → production → Environment secrets:

```
PRODUCTION_SUPABASE_URL=https://your-production-project.supabase.co
PRODUCTION_SUPABASE_ANON_KEY=your-production-anon-key
```

## 🚨 보안 주의사항

### ✅ 안전한 것들 (클라이언트에 노출되어도 OK)
- `VITE_SUPABASE_URL`: 공개 API URL
- `VITE_SUPABASE_ANON_KEY`: 공개 익명 키 (RLS로 보호됨)

### ⛔ 절대 금지 (클라이언트에 노출되면 안됨)
- Supabase Service Role Key
- 데이터베이스 직접 연결 정보
- 서버 전용 API 키
- JWT 시크릿

## 워크플로우 동작 방식

### CI (모든 PR/Push)
1. **lint-and-typecheck**: ESLint + TypeScript 검사
2. **test**: 단위/통합 테스트 실행  
3. **build**: 빌드 검증 (artifact 업로드)

### Deploy (main 브랜치 Push)
1. **build-staging**: Staging용 빌드 생성
2. **build-production**: Production용 빌드 생성  
3. **deploy-staging**: Staging 자동 배포
4. **deploy-production**: Production 수동 승인 후 배포

### 동시성 제어
- `concurrency: deploy-${{ github.ref }}`로 동시 배포 방지
- 새 배포 시 이전 배포 자동 취소

## 아티팩트 재사용 옵션

현재는 staging/production을 별도로 빌드하지만, **속도와 일관성을 위해 하나의 빌드 산출물을 공유**할 수도 있습니다:

### 옵션 1: 별도 빌드 (현재 방식)
- ✅ 환경별 다른 설정 가능
- ✅ 빌드 시점에 환경 변수 주입
- ❌ 빌드 시간 2배

### 옵션 2: 단일 빌드 재사용
```yaml
# build-staging job의 artifact를 production에서도 재사용
# 단, 환경별 차이는 런타임에 처리 (예: 환경 변수 주입)
```
- ✅ 빌드 시간 단축
- ✅ staging/production 완전 동일한 코드
- ❌ 런타임 환경 변수 주입 필요

## 환경별 설정 파일 구조

### `.env.staging` (템플릿)
```bash
# Staging Environment Configuration
VITE_APP_NAME="Clean Woodie Campus (Staging)"
VITE_APP_ENV=staging
VITE_API_BASE_URL=https://staging-api.clean-woodie-campus.com

# GitHub Secrets에서 주입:
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY

# Feature flags
VITE_ENABLE_DEV_TOOLS=true
VITE_ENABLE_ANALYTICS=false
```

### `.env.production` (템플릿)
```bash
# Production Environment Configuration  
VITE_APP_NAME="Clean Woodie Campus"
VITE_APP_ENV=production
VITE_API_BASE_URL=https://api.clean-woodie-campus.com

# GitHub Secrets에서 주입:
# VITE_SUPABASE_URL  
# VITE_SUPABASE_ANON_KEY

# Feature flags
VITE_ENABLE_DEV_TOOLS=false
VITE_ENABLE_ANALYTICS=true
```

빌드 시 `--mode staging/production`으로 해당 환경 파일이 자동으로 로드됩니다.