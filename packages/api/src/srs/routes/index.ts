import { Router } from 'express'
import { createReviewRoutes } from './ReviewRoutes'
import { createSRSScheduleRoutes } from './SRSScheduleRoutes'
import { createSRSAnalyticsRoutes } from './SRSAnalyticsRoutes'
import { createSRSNotificationRoutes } from './SRSNotificationRoutes'
import { createSRSStudyRecordRoutes } from './SRSStudyRecordRoutes'

/**
 * SRS 모듈의 모든 라우트를 통합하는 메인 라우터
 * 
 * Clean Architecture 및 DDD 원칙:
 * - 단일 책임 원칙에 따라 각 도메인별로 라우트 분리
 * - 의존성 역전 원칙 준수 (Application Layer Use Cases 사용)
 * - 관심사의 분리 (복습/스케줄/분석/알림/학습기록)
 * 
 * 라우트 구조:
 * /api/srs
 * ├── /reviews                    # 복습 큐 및 피드백 (ReviewRoutes)
 * │   ├── GET    /today           # 오늘의 복습 항목
 * │   └── POST   /:id/feedback    # 피드백 제출
 * ├── /schedules                  # 복습 스케줄 관리 (SRSScheduleRoutes)
 * │   ├── POST   /                # 스케줄 생성
 * │   └── GET    /overdue         # 연체 스케줄 조회
 * ├── /analysis                   # 학습 분석 (SRSAnalyticsRoutes)
 * │   ├── GET    /study-patterns  # 학습 패턴 분석
 * │   └── POST   /difficulty-assessment  # 난이도 평가
 * ├── /problems/:id/performance   # 문제별 성과 조회
 * ├── /retention-probability      # 기억 보존 확률
 * ├── /students/:id/review-stats  # 학생별 통계
 * ├── /statistics/comprehensive   # 종합 통계
 * ├── /notifications              # 알림 관리 (SRSNotificationRoutes)
 * │   ├── GET    /status          # 알림 상태 조회
 * │   ├── GET    /settings        # 설정 조회
 * │   ├── PUT    /settings        # 설정 업데이트
 * │   ├── POST   /process-queue   # 큐 처리 (관리자)
 * │   ├── POST   /trigger-overdue # 연체 알림 트리거
 * │   └── POST   /test            # 테스트 알림 (개발용)
 * └── /study-records              # 학습 기록 (SRSStudyRecordRoutes)
 *     ├── POST   /                # 기록 생성
 *     ├── GET    /                # 기록 조회
 *     ├── GET    /:id             # 상세 조회
 *     └── GET    /analytics       # 분석 데이터
 */
export function createSRSRoutes(): Router {
  const router = Router()

  // 각 도메인별 라우터 생성
  const reviewRoutes = createReviewRoutes()
  const scheduleRoutes = createSRSScheduleRoutes()
  const analyticsRoutes = createSRSAnalyticsRoutes()
  const notificationRoutes = createSRSNotificationRoutes()
  const studyRecordRoutes = createSRSStudyRecordRoutes()

  // 라우트 마운트
  router.use('', reviewRoutes)              // /api/srs/reviews/*
  router.use('/schedules', scheduleRoutes)  // /api/srs/schedules/*
  router.use('', analyticsRoutes)           // /api/srs/analysis/*, /api/srs/problems/*, etc.
  router.use('', notificationRoutes)        // /api/srs/notifications/*
  router.use('/study-records', studyRecordRoutes) // /api/srs/study-records/*

  return router
}

/**
 * SRS 라우트를 메인 애플리케이션에 마운트
 */
export function mountSRSRoutes(app: any): void {
  const srsRouter = createSRSRoutes()
  
  // /api/srs 경로에 모든 SRS 라우트 마운트
  app.use('/api/srs', srsRouter)
  
  console.log('✅ SRS routes mounted at /api/srs')
  console.log('📚 Available SRS endpoints:')
  console.log('   Reviews:')
  console.log('     GET  /api/srs/reviews/today')
  console.log('     POST /api/srs/reviews/:scheduleId/feedback')
  console.log('   Schedules:')
  console.log('     POST /api/srs/schedules')
  console.log('     GET  /api/srs/schedules/overdue')
  console.log('   Analytics:')
  console.log('     GET  /api/srs/analysis/study-patterns')
  console.log('     POST /api/srs/analysis/difficulty-assessment')
  console.log('     GET  /api/srs/problems/:problemId/performance')
  console.log('     GET  /api/srs/retention-probability')
  console.log('     GET  /api/srs/students/:studentId/review-stats')
  console.log('     GET  /api/srs/statistics/comprehensive')
  console.log('   Notifications:')
  console.log('     GET  /api/srs/notifications/status')
  console.log('     GET  /api/srs/notifications/settings')
  console.log('     PUT  /api/srs/notifications/settings')
  console.log('     POST /api/srs/notifications/process-queue')
  console.log('     POST /api/srs/notifications/trigger-overdue')
  console.log('     POST /api/srs/notifications/test (dev only)')
  console.log('   Study Records:')
  console.log('     POST /api/srs/study-records')
  console.log('     GET  /api/srs/study-records')
  console.log('     GET  /api/srs/study-records/:recordId')
  console.log('     GET  /api/srs/study-records/analytics')
}

// 개별 라우트 마운트 함수들도 export (필요시 개별 사용 가능)
export { mountSRSScheduleRoutes } from './SRSScheduleRoutes'
export { mountSRSAnalyticsRoutes } from './SRSAnalyticsRoutes'  
export { mountSRSNotificationRoutes } from './SRSNotificationRoutes'
export { mountSRSStudyRecordRoutes } from './SRSStudyRecordRoutes'