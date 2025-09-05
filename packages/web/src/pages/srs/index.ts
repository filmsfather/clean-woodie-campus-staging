/**
 * SRS (Spaced Repetition System) Pages Index
 * 
 * SRS 관련 페이지들을 중앙에서 관리하고 export
 * 각 페이지는 인증 및 권한 가드를 포함하고 있습니다.
 */

// SRS 페이지들
export { default as ReviewPage } from './ReviewPage';
export { default as StatisticsPage } from './StatisticsPage';
export { default as SettingsPage } from './SettingsPage';

/**
 * 페이지 라우팅 정보
 * 
 * 라우터 설정에서 사용할 수 있는 페이지 정보들
 */
export const SRS_ROUTES = {
  REVIEW: '/srs/review',
  STATISTICS: '/srs/statistics', 
  SETTINGS: '/srs/settings'
} as const;

/**
 * 페이지 메타데이터
 * 
 * 네비게이션과 SEO에 사용할 수 있는 메타 정보들
 */
export const SRS_PAGE_META = {
  review: {
    title: '복습',
    description: 'SRS 복습 세션을 진행합니다',
    icon: '📚',
    requiresAuth: true,
    feature: 'srs'
  },
  statistics: {
    title: '통계',
    description: '학습 통계와 성과를 확인합니다',
    icon: '📊',
    requiresAuth: true,
    feature: 'srs'
  },
  settings: {
    title: '설정',
    description: 'SRS 알림과 복습 설정을 관리합니다',
    icon: '⚙️',
    requiresAuth: true,
    feature: 'srs'
  }
} as const;