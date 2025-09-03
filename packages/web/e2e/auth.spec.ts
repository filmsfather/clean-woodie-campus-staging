import { test, expect } from '@playwright/test';

/**
 * Auth 시스템 E2E 테스트
 * SignInUseCase, SignUpUseCase, GetProfile/UpdateProfileUseCase 통합 테스트
 */

test.describe('Authentication System', () => {
  test.beforeEach(async ({ page }) => {
    // MSW가 활성화된 개발 환경으로 이동
    await page.goto('/');
  });

  test('SignIn Flow - 로그인 성공 시나리오', async ({ page }) => {
    // Given: 로그인 페이지로 이동
    await page.goto('/auth/signin');
    
    // When: 유효한 자격 증명으로 로그인
    await page.fill('[data-testid=email-input]', 'student1@test.com');
    await page.fill('[data-testid=password-input]', 'test123');
    await page.click('[data-testid=signin-button]');
    
    // Then: 대시보드로 리다이렉트되고 사용자 정보가 표시됨
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid=user-name]')).toContainText('김학생');
  });

  test('SignIn Flow - 잘못된 자격 증명 에러 처리', async ({ page }) => {
    // Given: 로그인 페이지로 이동
    await page.goto('/auth/signin');
    
    // When: 잘못된 자격 증명으로 로그인 시도
    await page.fill('[data-testid=email-input]', 'invalid@test.com');
    await page.fill('[data-testid=password-input]', 'wrong-password');
    await page.click('[data-testid=signin-button]');
    
    // Then: 에러 메시지가 표시됨
    await expect(page.locator('[data-testid=error-message]')).toBeVisible();
    await expect(page.locator('[data-testid=error-message]')).toContainText('Invalid credentials');
  });

  test('SignUp Flow - 새 사용자 등록', async ({ page }) => {
    // Given: 회원가입 페이지로 이동
    await page.goto('/auth/signup');
    
    // When: 새 사용자 정보로 회원가입
    await page.fill('[data-testid=name-input]', '새로운학생');
    await page.fill('[data-testid=email-input]', 'newstudent@test.com');
    await page.fill('[data-testid=password-input]', 'newpassword123');
    await page.fill('[data-testid=confirm-password-input]', 'newpassword123');
    await page.selectOption('[data-testid=role-select]', 'student');
    await page.click('[data-testid=signup-button]');
    
    // Then: 자동 로그인되어 대시보드로 이동
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid=user-name]')).toContainText('새로운학생');
  });

  test('Profile Update Flow - 프로필 정보 수정', async ({ page }) => {
    // Given: 로그인된 상태에서 프로필 페이지로 이동
    await page.goto('/auth/signin');
    await page.fill('[data-testid=email-input]', 'student1@test.com');
    await page.fill('[data-testid=password-input]', 'test123');
    await page.click('[data-testid=signin-button]');
    await page.goto('/profile');
    
    // When: 프로필 정보 수정
    await page.fill('[data-testid=phone-input]', '010-9999-8888');
    await page.selectOption('[data-testid=difficulty-select]', 'hard');
    await page.click('[data-testid=save-profile-button]');
    
    // Then: 수정 완료 메시지가 표시됨
    await expect(page.locator('[data-testid=success-message]')).toBeVisible();
    await expect(page.locator('[data-testid=success-message]')).toContainText('저장되었습니다');
    
    // And: 변경된 정보가 표시됨
    await expect(page.locator('[data-testid=phone-input]')).toHaveValue('010-9999-8888');
  });
});