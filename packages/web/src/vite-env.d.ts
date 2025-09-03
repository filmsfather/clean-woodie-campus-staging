/// <reference types="vite/client" />

// Vite 환경 변수 타입 정의
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production'
  readonly VITE_APP_VERSION: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  
  // 개발/디버깅 도구
  readonly VITE_ENABLE_DEV_TOOLS: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_MSW_ENABLED: string
  readonly VITE_STORYBOOK_ENABLED: string
  
  // Auth System Feature Flags
  readonly VITE_FEATURE_SIGNIN: string
  readonly VITE_FEATURE_SIGNUP: string
  readonly VITE_FEATURE_PROFILE: string
  readonly VITE_FEATURE_INVITE_SYSTEM: string
  readonly VITE_FEATURE_ROLE_MANAGEMENT: string
  
  // Dashboard Feature Flags
  readonly VITE_FEATURE_STUDENT_DASHBOARD: string
  readonly VITE_FEATURE_TEACHER_DASHBOARD: string
  readonly VITE_FEATURE_ADMIN_DASHBOARD: string
  readonly VITE_FEATURE_GAMIFICATION_DASHBOARD: string
  
  // Problem Management Feature Flags
  readonly VITE_FEATURE_PROBLEM_BANK: string
  readonly VITE_FEATURE_PROBLEM_SETS: string
  readonly VITE_FEATURE_PROBLEM_EDITOR: string
  readonly VITE_FEATURE_GRADING: string
  
  // SRS System Feature Flags
  readonly VITE_FEATURE_REVIEW_SYSTEM: string
  readonly VITE_FEATURE_REVIEW_STATISTICS: string
  readonly VITE_FEATURE_NOTIFICATIONS: string
  
  // Progress Management Feature Flags
  readonly VITE_FEATURE_PROGRESS_TRACKING: string
  readonly VITE_FEATURE_CLASS_PROGRESS: string
  readonly VITE_FEATURE_STREAK_RANKINGS: string
  
  // Gamification Feature Flags
  readonly VITE_FEATURE_TOKENS: string
  readonly VITE_FEATURE_ACHIEVEMENTS: string
  readonly VITE_FEATURE_LEADERBOARDS: string
  readonly VITE_FEATURE_REWARDS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// MSW 관련 전역 변수 (Vite define으로 주입됨)
declare const __MSW_ENABLED__: boolean;