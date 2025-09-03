import { test, expect } from '@playwright/test';

/**
 * Gamification System E2E 테스트
 * GetLeaderboardsUseCase, RedeemRewardUseCase, GetStreakRankingsUseCase 통합 테스트
 */

test.describe('Gamification System', () => {
  test.beforeEach(async ({ page }) => {
    // 학생으로 로그인 후 테스트 진행
    await page.goto('/auth/signin');
    await page.fill('[data-testid=email-input]', 'student1@test.com');
    await page.fill('[data-testid=password-input]', 'test123');
    await page.click('[data-testid=signin-button]');
  });

  test('Leaderboard View - 리더보드 확인 및 전환', async ({ page }) => {
    // Given: 리더보드 페이지로 이동
    await page.goto('/gamification/leaderboard');
    
    // Then: 기본 토큰 잔액 리더보드가 표시됨
    await expect(page.locator('[data-testid=leaderboard-title]')).toContainText('토큰 잔액');
    await expect(page.locator('[data-testid=my-rank-card]')).toBeVisible();
    await expect(page.locator('[data-testid=top-3-highlights]')).toBeVisible();
    
    // When: 총 획득 토큰 리더보드로 전환
    await page.selectOption('[data-testid=board-select]', 'token_earned');
    
    // Then: 리더보드가 업데이트됨
    await expect(page.locator('[data-testid=leaderboard-title]')).toContainText('총 획득 토큰');
    
    // And: 순위 변동 표시가 보임
    await expect(page.locator('[data-testid=rank-change]')).toBeVisible();
  });

  test('Personal Ranking - 개인 순위 카드 정보', async ({ page }) => {
    // Given: 리더보드 페이지에서
    await page.goto('/gamification/leaderboard');
    
    // Then: 개인 순위 카드에 상세 정보가 표시됨
    const myRankCard = page.locator('[data-testid=my-rank-card]');
    await expect(myRankCard.locator('[data-testid=my-rank]')).toContainText('1위');
    await expect(myRankCard.locator('[data-testid=my-score]')).toBeVisible();
    await expect(myRankCard.locator('[data-testid=percentile]')).toContainText('상위');
  });

  test('Reward Redemption Flow - 보상 교환 프로세스', async ({ page }) => {
    // Given: 보상 상점으로 이동
    await page.goto('/gamification/rewards');
    
    // Then: 토큰 잔액과 보상 목록이 표시됨
    await expect(page.locator('[data-testid=token-balance]')).toBeVisible();
    await expect(page.locator('[data-testid=reward-grid]')).toBeVisible();
    
    // When: 교환 가능한 보상을 클릭
    await page.click('[data-testid=reward-card]:has([data-testid=can-afford])');
    
    // Then: 교환 확인 모달이 나타남
    await expect(page.locator('[data-testid=redemption-modal]')).toBeVisible();
    await expect(page.locator('[data-testid=token-cost]')).toBeVisible();
    await expect(page.locator('[data-testid=remaining-balance]')).toBeVisible();
    
    // When: 교환 확인
    await page.click('[data-testid=confirm-redemption]');
    
    // Then: 교환 완료 및 잔액 업데이트
    await expect(page.locator('[data-testid=redemption-success]')).toBeVisible();
    // 모달이 닫히고 토큰 잔액이 감소함을 확인
  });

  test('Reward Categories Filter - 카테고리별 필터링', async ({ page }) => {
    // Given: 보상 상점에서
    await page.goto('/gamification/rewards');
    
    // When: 디지털 배지 카테고리 선택
    await page.selectOption('[data-testid=category-select]', 'digital_badge');
    
    // Then: 해당 카테고리 보상만 표시됨
    await expect(page.locator('[data-testid=reward-card]')).toHaveCount(1);
    await expect(page.locator('[data-testid=category-badge]')).toContainText('디지털 배지');
    
    // When: 전체 카테고리로 복귀
    await page.selectOption('[data-testid=category-select]', 'all');
    
    // Then: 모든 보상이 다시 표시됨
    const rewardCards = page.locator('[data-testid=reward-card]');
    await expect(rewardCards).toHaveCount(4); // 예상 보상 개수
  });

  test('Insufficient Tokens - 토큰 부족시 처리', async ({ page }) => {
    // Given: 토큰이 부족한 학생으로 로그인
    await page.goto('/auth/signin');
    await page.fill('[data-testid=email-input]', 'poorstudent@test.com');
    await page.fill('[data-testid=password-input]', 'test123');
    await page.click('[data-testid=signin-button]');
    
    await page.goto('/gamification/rewards');
    
    // Then: 토큰 부족으로 교환 불가능한 보상들이 표시됨
    await expect(page.locator('[data-testid=reward-card]:has([data-testid=insufficient-tokens])')).toBeVisible();
    await expect(page.locator('[data-testid=token-insufficient-button]')).toBeDisabled();
    await expect(page.locator('[data-testid=token-insufficient-button]')).toContainText('토큰부족');
  });

  test('Streak Rankings - 스트릭 순위표 확인', async ({ page }) => {
    // Given: 스트릭 리더보드로 이동
    await page.goto('/progress/streaks');
    
    // Then: 스트릭 순위 정보가 표시됨
    await expect(page.locator('[data-testid=streak-rankings]')).toBeVisible();
    await expect(page.locator('[data-testid=my-streak-card]')).toBeVisible();
    
    // And: TOP 3 하이라이트가 표시됨
    await expect(page.locator('[data-testid=top-3-highlights]')).toBeVisible();
    const medals = page.locator('[data-testid=rank-medal]');
    await expect(medals.first()).toContainText('🥇');
    
    // And: 스트릭 유지 팁이 표시됨
    await expect(page.locator('[data-testid=streak-tips]')).toBeVisible();
  });

  test('Recent Redemptions History - 최근 교환 내역', async ({ page }) => {
    // Given: 보상을 교환한 이력이 있는 상태에서
    await page.goto('/gamification/rewards');
    
    // Then: 최근 교환 내역이 표시됨
    await expect(page.locator('[data-testid=recent-redemptions]')).toBeVisible();
    await expect(page.locator('[data-testid=redemption-item]')).toBeVisible();
    
    // And: 교환 상태와 날짜가 표시됨
    await expect(page.locator('[data-testid=redemption-status]')).toContainText('완료');
    await expect(page.locator('[data-testid=redemption-date]')).toBeVisible();
  });
});