// Application layer exports
// Use Cases와 Application Services를 관리하는 애플리케이션 레이어

// 핵심 기능 - 항상 export
export * from './use-cases/index'
export * from './services/index'
export * from './auth/index'
export * from './progress/index'
export * from './problems/index'
export * from './problemsets/index'
export * from './assignments/index'

// 공통 인터페이스 및 설정 (IProblemService 충돌 방지를 위해 problems에서 가져옴)
export * from './common/config'
export * from './utils'

// 기능별 조건부 export는 FeatureModules로 처리

// SRS 관련 Application Services
export { 
  ReviewQueueService
} from './srs/services/ReviewQueueService'

export type {
  ReviewQueueItem,
  ReviewStatistics,
  ReviewCompletionResult
} from './srs/services/ReviewQueueService'

export {
  NotificationManagementService
} from './srs/services/NotificationManagementService'

export type {
  ScheduleNotificationRequest,
  NotificationStatistics
} from './srs/services/NotificationManagementService'

// SRS Use Cases
export { GetTodayReviewsUseCase } from './srs/use-cases/GetTodayReviewsUseCase'
export { SubmitReviewFeedbackUseCase } from './srs/use-cases/SubmitReviewFeedbackUseCase'  
export { GetReviewStatisticsUseCase } from './srs/use-cases/GetReviewStatisticsUseCase'