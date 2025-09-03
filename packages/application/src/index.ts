// Application layer exports
// Use Cases와 Application Services를 관리하는 애플리케이션 레이어

export * from './use-cases/index'
export * from './services/index'
export * from './auth/index'
export * from './progress/index'
export * from './gamification/index'

// 성능 최적화 및 인프라 인터페이스
export * from './infrastructure'
export * from './utils'
export * from './config'
export * from './performance'

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