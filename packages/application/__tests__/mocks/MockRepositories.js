import { vi } from 'vitest';
// SRS Mocks
export const createMockReviewScheduleRepository = () => ({
    findById: vi.fn(),
    findByStudentAndProblem: vi.fn(),
    findDueReviews: vi.fn(),
    findTodayReviews: vi.fn(),
    findOverdueReviews: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    countByStudent: vi.fn(),
    countByStudentAndStatus: vi.fn()
});
export const createMockStudyRecordRepository = () => ({
    save: vi.fn(),
    findByStudent: vi.fn(),
    findByProblem: vi.fn(),
    findByStudentAndProblem: vi.fn(),
    countByStudent: vi.fn(),
    findByDateRange: vi.fn()
});
export const createMockSrsPolicy = () => ({
    calculateNextInterval: vi.fn(),
    createInitialState: vi.fn(),
    shouldResetInterval: vi.fn(),
    adjustForLateReview: vi.fn()
});
export const createMockClock = (fixedTime) => ({
    now: vi.fn(() => fixedTime || new Date('2024-01-01T12:00:00Z'))
});
// Gamification Mocks
export class MockTokenRepository {
    save = vi.fn();
    findById = vi.fn();
    findByUserId = vi.fn();
    findByUserIdAndDateRange = vi.fn();
    delete = vi.fn();
}
export class MockUserAchievementRepository {
    save = vi.fn();
    findById = vi.fn();
    findByUserId = vi.fn();
    findByUserIdAndAchievementId = vi.fn();
    delete = vi.fn();
}
export class MockLeaderboardRepository {
    save = vi.fn();
    findById = vi.fn();
    findUserPosition = vi.fn();
    findTopUsers = vi.fn();
    findByPeriod = vi.fn();
    delete = vi.fn();
}
// Progress Mocks  
export class MockStatisticsRepository {
    save = vi.fn();
    findById = vi.fn();
    findByUserId = vi.fn();
    update = vi.fn();
    delete = vi.fn();
}
export class MockStudyStreakRepository {
    save = vi.fn();
    findById = vi.fn();
    findByUserId = vi.fn();
    update = vi.fn();
    delete = vi.fn();
}
// Notification Mocks
export class MockNotificationHistoryRepository {
    save = vi.fn();
    findById = vi.fn();
    findByUserId = vi.fn();
    findByUserIdAndType = vi.fn();
    delete = vi.fn();
}
export class MockNotificationSettingsRepository {
    save = vi.fn();
    findById = vi.fn();
    findByUserId = vi.fn();
    update = vi.fn();
    delete = vi.fn();
}
//# sourceMappingURL=MockRepositories.js.map