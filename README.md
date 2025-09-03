# Clean Woodie Campus - 스테이징 환경

Clean Architecture 기반의 학습 관리 시스템 스테이징 환경입니다.

## 🚀 배포 상태

- ✅ GitHub Repository 설정 완료
- ✅ Supabase Database 마이그레이션 완료  
- ✅ Vercel 프로젝트 설정 완료
- ✅ GitHub Actions 워크플로우 설정 완료
- ✅ GitHub Secrets 설정 완료

## ✨ 주요 기능

- **관리자 대시보드**: 사용자 관리, 반 관리 시스템
- **N:N 관계 지원**: 학생-반, 선생님-반 다중 배정
- **SRS 학습**: 간격반복 기반 학습 시스템
- **진도 추적**: 학습 통계 및 스트릭 관리
- **게이미피케이션**: 토큰, 업적, 리더보드
- **문제 은행**: 다양한 문제 유형 지원

## 🔧 기술 스택

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express + TypeScript (Clean Architecture)
- **Database**: Supabase PostgreSQL
- **Deployment**: GitHub Actions + Vercel
- **Package Manager**: pnpm (monorepo)

## 📦 패키지 구조

```
packages/
├── web/           # React 프론트엔드
├── api/           # Express API 서버
├── application/   # 애플리케이션 서비스 레이어
├── domain/        # 도메인 모델 및 비즈니스 로직
└── infrastructure/ # 인프라스트럭처 레이어
```

## 🚀 자동 배포

`main` 브랜치에 코드를 푸시하면 GitHub Actions가 자동으로:

1. 린트 및 타입 체크 실행
2. 테스트 실행
3. 빌드 생성
4. Vercel에 배포

---

🤖 Generated with Claude Code