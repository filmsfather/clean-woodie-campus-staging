// Infrastructure layer exports
// 외부 의존성과 구현체들을 관리하는 인프라스트럭처 레이어

export * from './repositories/index'
export * from './adapters/index'
export * from './services/index'
export * from './auth/index'
export * from './common/index'

// 캐싱 시스템
export * from './cache/index'

// 로깅 시스템
export * from './logging/index'

// 에러 핸들링 시스템
export * from './errors/index'

// 검색 시스템
export * from './search/index'

// SRS 관련 인프라스트럭처 구현체들
export { SupabaseReviewScheduleRepository } from './srs/SupabaseReviewScheduleRepository'
export { SupabaseStudyRecordRepository } from './srs/SupabaseStudyRecordRepository'
export { ReviewCompletedEventHandler } from './srs/ReviewCompletedEventHandler'
export { SystemClock, TestClock } from './services/SystemClock'

// 실시간 알림 시스템 구현체들
export { SupabaseNotificationService } from './srs/SupabaseNotificationService'
export { SupabaseNotificationSettingsRepository } from './srs/SupabaseNotificationSettingsRepository'
export { SupabaseNotificationHistoryRepository } from './srs/SupabaseNotificationHistoryRepository'
export { ReviewNotificationEventHandler } from './srs/ReviewNotificationEventHandler'

// 진도 추적 시스템 구현체들
export { SupabaseStudyStreakRepository } from './progress/SupabaseStudyStreakRepository'
export { SupabaseStatisticsRepository } from './progress/SupabaseStatisticsRepository'

// 문제 관리 시스템 구현체들
export { SupabaseProblemRepository } from './problems/SupabaseProblemRepository'

// 문제집 관리 시스템 구현체들
export { SupabaseProblemSetRepository } from './problemsets/SupabaseProblemSetRepository'

// 과제 관리 시스템 구현체들
export * from './assignments/index'