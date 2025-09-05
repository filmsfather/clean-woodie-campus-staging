/**
 * 캐시 키 생성 및 TTL 상수
 */

export const CacheKeys = {
  // Student Dashboard
  STUDENT_DASHBOARD: (studentId: string) => `dashboard:student:${studentId}`,
  TEACHER_DASHBOARD: (teacherId: string) => `dashboard:teacher:${teacherId}`,
  
  // Student Statistics
  STUDENT_STATS: (studentId: string, period: string) => `stats:student:${studentId}:${period}`,
  
  // SRS (Spaced Repetition System)
  SRS_TODAY_REVIEWS: (studentId: string) => `srs:reviews:today:${studentId}`,
  SRS_OVERDUE_REVIEWS: (studentId: string) => `srs:reviews:overdue:${studentId}`,
  SRS_STUDENT_STATS: (studentId: string) => `srs:stats:${studentId}`,
  SRS_PROBLEM_PERFORMANCE: (problemId: string) => `srs:performance:${problemId}`,
  
  // Progress Tracking
  STUDENT_STREAK: (studentId: string) => `progress:streak:${studentId}`,
  STUDENT_ALL_STATS: (studentId: string) => `progress:stats:all:${studentId}`,
  STUDENT_PROBLEM_SET_STATS: (studentId: string, problemSetId: string) => `progress:stats:${studentId}:${problemSetId}`,
  TOP_STREAKS: (limit: number) => `progress:top_streaks:${limit}`,
  AT_RISK_STUDENTS: () => `progress:at_risk_students`,
  CLASS_PROGRESS: (classId: string) => `progress:class:${classId}`,
  
  // Problems
  PROBLEM_DETAIL: (problemId: string) => `problems:detail:${problemId}`,
  PROBLEM_STATS: (problemId: string) => `problems:stats:${problemId}`,
  TEACHER_PROBLEMS: (teacherId: string, filters: string) => `problems:teacher:${teacherId}:${filters}`,
  PROBLEM_SEARCH: (query: string, filters: string) => `problems:search:${query}:${filters}`,
  PROBLEMS_BY_TAGS: (tags: string[], filters: string) => `problems:tags:${tags.join(',')}:${filters}`,
  POPULAR_PROBLEMS: (limit: number) => `problems:popular:${limit}`,
  
  // Problem Analytics
  TEACHER_STATISTICS: (teacherId: string) => `problems:teacher_stats:${teacherId}`,
  TAG_ANALYTICS: (teacherId: string) => `problems:tag_analytics:${teacherId}`,
  TAG_RECOMMENDATIONS: (contentHash: string) => `problems:tag_recommend:${contentHash}`,
  UNIQUE_TAGS: (teacherId: string) => `problems:unique_tags:${teacherId}`,
  DIFFICULTY_DISTRIBUTION: (teacherId: string) => `problems:difficulty_dist:${teacherId}`,
  TYPE_DISTRIBUTION: (teacherId: string) => `problems:type_dist:${teacherId}`,
  SIMILAR_PROBLEMS: (problemId: string, limit: number) => `problems:similar:${problemId}:${limit}`,
  
  // Bulk Operations
  BULK_OWNERSHIP: (teacherId: string, problemIdsHash: string) => 
    `problems:bulk_ownership:${teacherId}:${problemIdsHash}`,
  BULK_ACCESS: (teacherId: string, problemIdsHash: string) => 
    `problems:bulk_access:${teacherId}:${problemIdsHash}`,
}

export const CacheTTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 900,     // 15 minutes  
  LONG: 1800,      // 30 minutes
  EXTRA_LONG: 3600 // 1 hour
}