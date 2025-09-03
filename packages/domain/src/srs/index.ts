// Entities
export { ReviewSchedule } from './entities/ReviewSchedule'
export { StudyRecord } from './entities/StudyRecord'

// Value Objects
export { ReviewFeedback } from './value-objects/ReviewFeedback'
export type { ReviewFeedbackType } from './value-objects/ReviewFeedback'
export { EaseFactor } from './value-objects/EaseFactor'
export { ReviewInterval } from './value-objects/ReviewInterval'
export { ReviewState } from './value-objects/ReviewState'
export { NotificationType } from './value-objects/NotificationType'
export { NotificationSettings } from './value-objects/NotificationSettings'

// Services
export type { ISrsService } from './services/ISrsService'
export type { ISpacedRepetitionPolicy, ReviewCalculationResult } from './services/ISpacedRepetitionPolicy'
export { SpacedRepetitionCalculator } from './services/SpacedRepetitionCalculator'
export type { IClock } from './services/IClock'
export { SrsPolicy } from './services/SrsPolicy'

// Repositories
export type { IReviewScheduleRepository } from './repositories/IReviewScheduleRepository'
export type { IStudyRecordRepository } from './repositories/IStudyRecordRepository'

// Notification Interfaces
export type { 
  INotificationService as ISrsNotificationService,
  INotificationSettingsRepository,
  INotificationHistoryRepository,
  NotificationMessage,
  ChannelSubscription
} from './interfaces/INotificationService'

// Factories
export { ReviewScheduleFactory } from './factories/ReviewScheduleFactory'

// Events
export { ReviewCompletedEvent } from './events/ReviewCompletedEvent'
export { ReviewScheduledEvent } from './events/ReviewScheduledEvent'
export { ReviewNotificationScheduledEvent } from './events/ReviewNotificationScheduledEvent'