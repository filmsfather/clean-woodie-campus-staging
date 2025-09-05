/**
 * 캐시 키 생성 및 TTL 상수
 */
export const CacheKeys = {
    // Student Dashboard
    STUDENT_DASHBOARD: (studentId) => `dashboard:student:${studentId}`,
    TEACHER_DASHBOARD: (teacherId) => `dashboard:teacher:${teacherId}`,
    // Student Statistics
    STUDENT_STATS: (studentId, period) => `stats:student:${studentId}:${period}`,
    // SRS (Spaced Repetition System)
    SRS_TODAY_REVIEWS: (studentId) => `srs:reviews:today:${studentId}`,
    SRS_OVERDUE_REVIEWS: (studentId) => `srs:reviews:overdue:${studentId}`,
    SRS_STUDENT_STATS: (studentId) => `srs:stats:${studentId}`,
    SRS_PROBLEM_PERFORMANCE: (problemId) => `srs:performance:${problemId}`,
    // Progress Tracking
    STUDENT_STREAK: (studentId) => `progress:streak:${studentId}`,
    STUDENT_ALL_STATS: (studentId) => `progress:stats:all:${studentId}`,
    STUDENT_PROBLEM_SET_STATS: (studentId, problemSetId) => `progress:stats:${studentId}:${problemSetId}`,
    TOP_STREAKS: (limit) => `progress:top_streaks:${limit}`,
    AT_RISK_STUDENTS: () => `progress:at_risk_students`,
    CLASS_PROGRESS: (classId) => `progress:class:${classId}`,
    // Problems
    PROBLEM_DETAIL: (problemId) => `problems:detail:${problemId}`,
    PROBLEM_STATS: (problemId) => `problems:stats:${problemId}`,
    TEACHER_PROBLEMS: (teacherId, filters) => `problems:teacher:${teacherId}:${filters}`,
    PROBLEM_SEARCH: (query, filters) => `problems:search:${query}:${filters}`,
    PROBLEMS_BY_TAGS: (tags, filters) => `problems:tags:${tags.join(',')}:${filters}`,
    POPULAR_PROBLEMS: (limit) => `problems:popular:${limit}`,
    // Problem Analytics
    TEACHER_STATISTICS: (teacherId) => `problems:teacher_stats:${teacherId}`,
    TAG_ANALYTICS: (teacherId) => `problems:tag_analytics:${teacherId}`,
    TAG_RECOMMENDATIONS: (contentHash) => `problems:tag_recommend:${contentHash}`,
    UNIQUE_TAGS: (teacherId) => `problems:unique_tags:${teacherId}`,
    DIFFICULTY_DISTRIBUTION: (teacherId) => `problems:difficulty_dist:${teacherId}`,
    TYPE_DISTRIBUTION: (teacherId) => `problems:type_dist:${teacherId}`,
    SIMILAR_PROBLEMS: (problemId, limit) => `problems:similar:${problemId}:${limit}`,
    // Bulk Operations
    BULK_OWNERSHIP: (teacherId, problemIdsHash) => `problems:bulk_ownership:${teacherId}:${problemIdsHash}`,
    BULK_ACCESS: (teacherId, problemIdsHash) => `problems:bulk_access:${teacherId}:${problemIdsHash}`,
};
export const CacheTTL = {
    SHORT: 300, // 5 minutes
    MEDIUM: 900, // 15 minutes  
    LONG: 1800, // 30 minutes
    EXTRA_LONG: 3600 // 1 hour
};
//# sourceMappingURL=CacheConstants.js.map