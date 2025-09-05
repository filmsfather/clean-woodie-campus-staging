/**
 * SRS (Spaced Repetition System) Components Index
 * 
 * 간격 반복 시스템 관련 컴포넌트들을 중앙에서 관리하고 export
 * Clean Architecture: UI Components → Custom Hooks → API Services → Use Cases
 */

// 핵심 컴포넌트들
export { default as ReviewCard } from './ReviewCard';
export { default as ReviewSession } from './ReviewSession';
export { default as SRSStatisticsDashboard } from './SRSStatisticsDashboard';
export { default as NotificationSettings } from './NotificationSettings';

// 타입 정의들도 함께 export (필요시)
export type {
  ReviewCardProps
} from './ReviewCard';

export type {
  ReviewSessionProps
} from './ReviewSession';

export type {
  SRSStatisticsDashboardProps
} from './SRSStatisticsDashboard';

export type {
  NotificationSettingsProps
} from './NotificationSettings';

/**
 * 컴포넌트 사용 가이드
 * 
 * @example
 * ```typescript
 * // 개별 복습 카드 사용
 * import { ReviewCard } from '@/components/srs';
 * 
 * <ReviewCard
 *   review={reviewItem}
 *   onFeedbackSubmit={handleFeedback}
 *   onShowAnswer={handleShowAnswer}
 * />
 * ```
 * 
 * @example
 * ```typescript
 * // 완전한 복습 세션 사용
 * import { ReviewSession } from '@/components/srs';
 * 
 * <ReviewSession
 *   onSessionComplete={(completed, total) => {
 *     console.log(`${completed}/${total} 복습 완료`);
 *   }}
 *   onSessionExit={() => navigate('/dashboard')}
 * />
 * ```
 * 
 * @example
 * ```typescript
 * // 통계 대시보드 사용
 * import { SRSStatisticsDashboard } from '@/components/srs';
 * 
 * <SRSStatisticsDashboard
 *   showStudyPatterns={true}
 *   autoRefresh={true}
 *   refreshInterval={300000} // 5분마다
 * />
 * ```
 * 
 * @example
 * ```typescript
 * // 알림 설정 컴포넌트 사용
 * import { NotificationSettings } from '@/components/srs';
 * 
 * <NotificationSettings
 *   onSettingsUpdated={() => {
 *     console.log('알림 설정이 업데이트되었습니다');
 *   }}
 *   showStatus={true}
 * />
 * ```
 */