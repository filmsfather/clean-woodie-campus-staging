import { test, expect } from '@playwright/test';

/**
 * SRS (Spaced Repetition System) E2E 테스트
 * GetTodayReviewsUseCase, SubmitReviewFeedbackUseCase, GetReviewStatisticsUseCase 통합 테스트
 */

test.describe('SRS Review System', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 후 테스트 진행
    await page.goto('/auth/signin');
    await page.fill('[data-testid=email-input]', 'student1@test.com');
    await page.fill('[data-testid=password-input]', 'test123');
    await page.click('[data-testid=signin-button]');
  });

  test('Today Reviews Flow - 오늘의 리뷰 세션 진행', async ({ page }) => {
    // Given: 오늘의 리뷰 페이지로 이동
    await page.goto('/study/reviews');
    
    // Then: 리뷰할 문제들이 표시됨
    await expect(page.locator('[data-testid=review-queue]')).toBeVisible();
    await expect(page.locator('[data-testid=problem-card]')).toBeVisible();
    
    // When: 첫 번째 문제에 대한 피드백 제출
    await page.click('[data-testid=show-answer-button]');
    await page.click('[data-testid=difficulty-good]');
    
    // Then: 다음 문제로 넘어가거나 완료 화면이 표시됨
    await expect(page.locator('[data-testid=feedback-submitted]')).toBeVisible();
  });

  test('Review Feedback Flow - 각 난이도별 피드백 처리', async ({ page }) => {
    // Given: 리뷰 진행 중
    await page.goto('/study/reviews');
    await page.click('[data-testid=show-answer-button]');
    
    // When: "다시" 피드백 선택
    await page.click('[data-testid=difficulty-again]');
    
    // Then: 즉시 다시 표시될 예정임을 알림
    await expect(page.locator('[data-testid=next-interval]')).toContainText('1일');
    
    // When: 다음 문제에서 "쉬움" 피드백 선택
    await page.click('[data-testid=show-answer-button]');
    await page.click('[data-testid=difficulty-easy]');
    
    // Then: 더 긴 간격으로 설정됨
    await expect(page.locator('[data-testid=next-interval]')).toContainText('14일');
  });

  test('Review Statistics View - 리뷰 통계 확인', async ({ page }) => {
    // Given: 리뷰 통계 페이지로 이동
    await page.goto('/study/stats');
    
    // Then: 전체 통계가 표시됨
    await expect(page.locator('[data-testid=overall-stats]')).toBeVisible();
    await expect(page.locator('[data-testid=total-reviews]')).toBeVisible();
    await expect(page.locator('[data-testid=accuracy-rate]')).toBeVisible();
    
    // And: 일일 리뷰 차트가 표시됨
    await expect(page.locator('[data-testid=daily-chart]')).toBeVisible();
    
    // And: 난이도별 분포 차트가 표시됨
    await expect(page.locator('[data-testid=difficulty-chart]')).toBeVisible();
  });

  test('Review Queue Management - 큐 상태별 표시', async ({ page }) => {
    // Given: 리뷰 페이지로 이동
    await page.goto('/study/reviews');
    
    // Then: 큐 상태 정보가 표시됨
    await expect(page.locator('[data-testid=queue-stats]')).toBeVisible();
    await expect(page.locator('[data-testid=total-reviews]')).toContainText('2');
    await expect(page.locator('[data-testid=overdue-count]')).toContainText('1');
    
    // And: 우선순위별 정렬된 문제들이 표시됨
    const problemCards = page.locator('[data-testid=problem-card]');
    const firstCard = problemCards.first();
    await expect(firstCard.locator('[data-testid=priority-high]')).toBeVisible();
  });

  test('Empty Review Queue - 리뷰할 문제가 없는 경우', async ({ page }) => {
    // Given: 모든 리뷰를 완료한 상태에서
    await page.goto('/study/reviews');
    
    // Mock 응답을 빈 큐로 변경하는 시나리오를 위해
    // 실제 구현에서는 MSW override를 사용
    
    // Then: 완료 메시지가 표시됨
    // await expect(page.locator('[data-testid=no-reviews]')).toBeVisible();
    // await expect(page.locator('[data-testid=congratulations]')).toContainText('모든 리뷰를 완료했습니다');
  });
});