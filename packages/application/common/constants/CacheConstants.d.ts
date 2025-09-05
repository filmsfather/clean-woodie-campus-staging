/**
 * 캐시 키 생성 및 TTL 상수
 */
export declare const CacheKeys: {
    STUDENT_DASHBOARD: (studentId: string) => string;
    TEACHER_DASHBOARD: (teacherId: string) => string;
    STUDENT_STATS: (studentId: string, period: string) => string;
    SRS_TODAY_REVIEWS: (studentId: string) => string;
    SRS_OVERDUE_REVIEWS: (studentId: string) => string;
    SRS_STUDENT_STATS: (studentId: string) => string;
    SRS_PROBLEM_PERFORMANCE: (problemId: string) => string;
    STUDENT_STREAK: (studentId: string) => string;
    STUDENT_ALL_STATS: (studentId: string) => string;
    STUDENT_PROBLEM_SET_STATS: (studentId: string, problemSetId: string) => string;
    TOP_STREAKS: (limit: number) => string;
    AT_RISK_STUDENTS: () => string;
    CLASS_PROGRESS: (classId: string) => string;
    PROBLEM_DETAIL: (problemId: string) => string;
    PROBLEM_STATS: (problemId: string) => string;
    TEACHER_PROBLEMS: (teacherId: string, filters: string) => string;
    PROBLEM_SEARCH: (query: string, filters: string) => string;
    PROBLEMS_BY_TAGS: (tags: string[], filters: string) => string;
    POPULAR_PROBLEMS: (limit: number) => string;
    TEACHER_STATISTICS: (teacherId: string) => string;
    TAG_ANALYTICS: (teacherId: string) => string;
    TAG_RECOMMENDATIONS: (contentHash: string) => string;
    UNIQUE_TAGS: (teacherId: string) => string;
    DIFFICULTY_DISTRIBUTION: (teacherId: string) => string;
    TYPE_DISTRIBUTION: (teacherId: string) => string;
    SIMILAR_PROBLEMS: (problemId: string, limit: number) => string;
    BULK_OWNERSHIP: (teacherId: string, problemIdsHash: string) => string;
    BULK_ACCESS: (teacherId: string, problemIdsHash: string) => string;
};
export declare const CacheTTL: {
    SHORT: number;
    MEDIUM: number;
    LONG: number;
    EXTRA_LONG: number;
};
//# sourceMappingURL=CacheConstants.d.ts.map