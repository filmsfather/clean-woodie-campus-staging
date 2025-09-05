// Repository
export { SupabaseAssignmentRepository } from './SupabaseAssignmentRepository';

// Factories
export { AssignmentServiceFactory } from './factories/AssignmentServiceFactory';

// Services
export { AssignmentNotificationService } from './services/AssignmentNotificationService';
export { CachedAssignmentService } from './services/CachedAssignmentService';
export { AssignmentAuthorizationService } from './services/AssignmentAuthorizationService';

// Executors
export { AssignmentDueDateExecutor } from './executors/AssignmentDueDateExecutor';

// Event Handlers
export { AssignmentEventHandlers } from './events/AssignmentEventHandlers';

// Adapters
export { AssignmentAnalyticsAdapter } from './adapters/AssignmentAnalyticsAdapter';

// Types
export type {
  AssignmentNotificationPayload,
  DueDateNotificationPayload
} from './services/AssignmentNotificationService';

export type {
  CacheConfig
} from './services/CachedAssignmentService';

export type {
  UserRole,
  ClassMembership,
  AuthorizationContext,
  AuthorizationResult
} from './services/AssignmentAuthorizationService';

export type {
  AssignmentDueDateExecutorConfig,
  ExecutionResult
} from './executors/AssignmentDueDateExecutor';

export type {
  AssignmentAnalyticsData,
  AssignmentPerformanceMetrics,
  TeacherAssignmentInsights,
  ClassAssignmentAnalytics,
  AnalyticsEventPayload
} from './adapters/AssignmentAnalyticsAdapter';