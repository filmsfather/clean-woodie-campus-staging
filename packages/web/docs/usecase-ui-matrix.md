# UseCase ↔ UI 표면 매핑 매트릭스

클린 아키텍처 원칙에 따라 **UseCase 1개 ⇒ 최소 1개의 UI 표면**을 보장하는 체크 매트릭스입니다.

## 1. 인증 (Auth) UseCase

| UseCase | UI Type | UI Component | Route | Feature Flag | Status |
|---------|---------|--------------|--------|--------------|--------|
| `SignInUseCase` | Command Form | `SignInPage` | `/auth/signin` | `signIn` | ✅ Exists |
| `SignUpUseCase` | Command Form | `SignUpPage` | `/auth/signup` | `signUp` | ✅ Exists |
| `SignOutUseCase` | Command Action | `SignOutButton` | N/A | `signIn` | ❌ Missing |
| `GetProfileUseCase` | Query Screen | `ProfilePage` | `/profile` | `profile` | ✅ Exists |
| `UpdateProfileUseCase` | Command Form | `ProfileEditor` | `/profile` | `profile` | ✅ Exists |
| `CreateInviteUseCase` | Command Form | `InviteForm` | `/admin/invites/create` | `inviteSystem` | ❌ Missing |
| `ValidateInviteTokenUseCase` | Query Screen | `InviteValidationPage` | `/auth/invite/:token` | `inviteSystem` | ❌ Missing |
| `UseInviteTokenUseCase` | Command Form | `InviteSignUpForm` | `/auth/invite/:token/signup` | `inviteSystem` | ❌ Missing |
| `ChangeRoleUseCase` | Command Action | `RoleChangeButton` | N/A | `roleManagement` | ❌ Missing |
| `ResetPasswordUseCase` | Command Form | `ResetPasswordForm` | `/auth/reset-password` | `signIn` | ❌ Missing |
| `RefreshTokenUseCase` | Background | Auto-refresh | N/A | `signIn` | ❌ Missing |

## 2. 대시보드 UseCase

| UseCase | UI Type | UI Component | Route | Feature Flag | Status |
|---------|---------|--------------|--------|--------------|--------|
| `GetStudentDashboardUseCase` | Query Screen | `StudentDashboard` | `/dashboard/student` | `studentDashboard` | ✅ Exists |
| `GetGamificationDashboardUseCase` | Query Screen | `GamificationDashboard` | `/dashboard/gamification` | `gamificationDashboard` | ✅ Exists |

## 3. 문제 관리 UseCase

| UseCase | UI Type | UI Component | Route | Feature Flag | Status |
|---------|---------|--------------|--------|--------------|--------|
| Problem CRUD | Command Form | `ProblemEditor` | `/problems/create` | `problemEditor` | ✅ Exists |
| Problem Search | Query Screen | `ProblemBankBrowser` | `/problems/bank` | `problemBank` | ✅ Exists |
| Problem Analytics | Query Dashboard | `AnalyticsDashboard` | `/problems/analytics` | `analytics` | ✅ Exists |
| Bulk Operations | Command Interface | `BulkOperationsController` | `/problems/bulk` | `problemEditor` | ❌ Missing |
| Tag Management | Command Interface | `TagManager` | `/problems/tags` | `problemEditor` | ✅ Exists |

## 4. 문제집 관리 UseCase

| UseCase | UI Type | UI Component | Route | Feature Flag | Status |
|---------|---------|--------------|--------|--------------|--------|
| Problem Set Builder | Command Interface | `ProblemSetBuilder` | `/problemsets/create` | `problemSets` | ✅ Exists |
| Problem Set Assignment | Command Form | `ProblemSetAssignment` | `/problemsets/:id/assign` | `problemSets` | ✅ Exists |
| Student Assignment Manager | Query Screen | `StudentAssignmentManager` | `/assignments` | `problemSets` | ✅ Exists |

## 5. SRS (Spaced Repetition System) UseCase

| UseCase | UI Type | UI Component | Route | Feature Flag | Status |
|---------|---------|--------------|--------|--------------|--------|
| `GetTodayReviewsUseCase` | Query Screen | `TodayReviewsPage` | `/study/reviews` | `reviewSystem` | ✅ Exists |
| `SubmitReviewFeedbackUseCase` | Command Action | `ReviewFeedbackButtons` | N/A | `reviewSystem` | ✅ Exists |
| `GetReviewStatisticsUseCase` | Query Dashboard | `ReviewStatisticsPage` | `/study/stats` | `reviewSystem` | ✅ Exists |

## 6. 진도 관리 UseCase

| UseCase | UI Type | UI Component | Route | Feature Flag | Status |
|---------|---------|--------------|--------|--------------|--------|
| `GetStudentProgressUseCase` | Query Screen | `MyProgressPage` | `/progress` | `progressTracking` | ✅ Exists |
| `GetClassProgressUseCase` | Query Screen | `ClassProgressPage` | `/progress/class` | `classProgress` | ✅ Exists |
| `GetStreakRankingsUseCase` | Query Screen | `StreakLeaderboardPage` | `/progress/streaks` | `streakRankings` | ✅ Exists |
| `GetProblemSetStatsUseCase` | Query Dashboard | `ProblemSetStatsPage` | `/progress/problemsets` | `progressTracking` | ❌ Missing |
| `UpdateProgressFromStudyUseCase` | Background | Auto-update | N/A | `progressTracking` | ❌ Missing |

## 7. 게임화 UseCase

| UseCase | UI Type | UI Component | Route | Feature Flag | Status |
|---------|---------|--------------|--------|--------------|--------|
| `AwardTokensUseCase` | Background | Auto-award | N/A | `tokenSystem` | ❌ Missing |
| `GetLeaderboardsUseCase` | Query Screen | `LeaderboardPage` | `/gamification/leaderboard` | `leaderboards` | ✅ Exists |
| `RedeemRewardUseCase` | Command Form | `RewardRedemptionPage` | `/gamification/rewards` | `rewards` | ✅ Exists |

## 완료 상태 요약

- **✅ 구현됨**: 16개 UseCase
- **❌ 누락됨**: 15개 UseCase
- **완료율**: 51.6%

## 주요 구현 완료 영역

1. **✅ 인증 플로우**: SignIn/SignUp/Profile 페이지들 구현 완료
2. **✅ SRS 시스템**: 복습 인터페이스 및 통계 구현 완료
3. **✅ 진도 관리**: 클래스 진도 및 스트릭 순위표 구현 완료
4. **✅ 게임화 시스템**: 리워드/리더보드 페이지들 구현 완료

## 남은 우선순위 높은 누락 UI

1. **초대 시스템**: Invite 관련 UseCase들
2. **비밀번호 리셋**: 계정 복구 플로우
3. **토큰 자동 지급**: 백그라운드 업무
4. **실시간 진도 업데이트**: 백그라운드 동기화

## Storybook 스토리 현황

각 구현된 UI 표면에 대해 **L/Empty/Error/OK** 4가지 상태 스토리가 생성되어 MSW를 통한 현실적인 API 모킹이 제공됩니다:

- **Auth**: SignInPage, SignUpPage, ProfilePage
- **SRS**: TodayReviewsPage, ReviewStatisticsPage  
- **Progress**: ClassProgressPage, StreakLeaderboardPage
- **Gamification**: LeaderboardPage, RewardRedemptionPage