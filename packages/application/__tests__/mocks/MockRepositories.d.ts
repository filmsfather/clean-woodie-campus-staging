import type { IReviewScheduleRepository, IStudyRecordRepository, ISpacedRepetitionPolicy, IClock } from '@woodie/domain';
export declare const createMockReviewScheduleRepository: () => IReviewScheduleRepository;
export declare const createMockStudyRecordRepository: () => IStudyRecordRepository;
export declare const createMockSrsPolicy: () => ISpacedRepetitionPolicy;
export declare const createMockClock: (fixedTime?: Date) => IClock;
export declare class MockTokenRepository {
    save: import("vitest").Mock<any, any>;
    findById: import("vitest").Mock<any, any>;
    findByUserId: import("vitest").Mock<any, any>;
    findByUserIdAndDateRange: import("vitest").Mock<any, any>;
    delete: import("vitest").Mock<any, any>;
}
export declare class MockUserAchievementRepository {
    save: import("vitest").Mock<any, any>;
    findById: import("vitest").Mock<any, any>;
    findByUserId: import("vitest").Mock<any, any>;
    findByUserIdAndAchievementId: import("vitest").Mock<any, any>;
    delete: import("vitest").Mock<any, any>;
}
export declare class MockLeaderboardRepository {
    save: import("vitest").Mock<any, any>;
    findById: import("vitest").Mock<any, any>;
    findUserPosition: import("vitest").Mock<any, any>;
    findTopUsers: import("vitest").Mock<any, any>;
    findByPeriod: import("vitest").Mock<any, any>;
    delete: import("vitest").Mock<any, any>;
}
export declare class MockStatisticsRepository {
    save: import("vitest").Mock<any, any>;
    findById: import("vitest").Mock<any, any>;
    findByUserId: import("vitest").Mock<any, any>;
    update: import("vitest").Mock<any, any>;
    delete: import("vitest").Mock<any, any>;
}
export declare class MockStudyStreakRepository {
    save: import("vitest").Mock<any, any>;
    findById: import("vitest").Mock<any, any>;
    findByUserId: import("vitest").Mock<any, any>;
    update: import("vitest").Mock<any, any>;
    delete: import("vitest").Mock<any, any>;
}
export declare class MockNotificationHistoryRepository {
    save: import("vitest").Mock<any, any>;
    findById: import("vitest").Mock<any, any>;
    findByUserId: import("vitest").Mock<any, any>;
    findByUserIdAndType: import("vitest").Mock<any, any>;
    delete: import("vitest").Mock<any, any>;
}
export declare class MockNotificationSettingsRepository {
    save: import("vitest").Mock<any, any>;
    findById: import("vitest").Mock<any, any>;
    findByUserId: import("vitest").Mock<any, any>;
    update: import("vitest").Mock<any, any>;
    delete: import("vitest").Mock<any, any>;
}
//# sourceMappingURL=MockRepositories.d.ts.map