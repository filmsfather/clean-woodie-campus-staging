// 캐시 서비스 인터페이스
// 캐시 키 빌더 유틸리티
export class CacheKeyBuilder {
    static SEPARATOR = ':';
    static forProblem(problemId) {
        return `problem${this.SEPARATOR}${problemId}`;
    }
    static forTeacherProblems(teacherId) {
        return `teacher_problems${this.SEPARATOR}${teacherId}`;
    }
    static forTeacherStatistics(teacherId) {
        return `teacher_stats${this.SEPARATOR}${teacherId}`;
    }
    static forTagAnalytics(teacherId) {
        return `tag_analytics${this.SEPARATOR}${teacherId}`;
    }
    static forDifficultyAnalysis(teacherId) {
        return `difficulty_analysis${this.SEPARATOR}${teacherId}`;
    }
    static forSearchResult(hash) {
        return `search${this.SEPARATOR}${hash}`;
    }
    static forTagRecommendation(contentHash) {
        return `tag_recommend${this.SEPARATOR}${contentHash}`;
    }
    static forBulkPermission(teacherId, problemIdsHash) {
        return `bulk_permission${this.SEPARATOR}${teacherId}${this.SEPARATOR}${problemIdsHash}`;
    }
    // 패턴 생성
    static teacherPattern(teacherId) {
        return `*${this.SEPARATOR}${teacherId}*`;
    }
    static problemPattern(problemId) {
        return `*${this.SEPARATOR}${problemId}*`;
    }
}
// 캐시 태그 상수
export class CacheTags {
    static TEACHER_DATA = 'teacher_data';
    static PROBLEM_DATA = 'problem_data';
    static STATISTICS = 'statistics';
    static ANALYTICS = 'analytics';
    static SEARCH_RESULTS = 'search_results';
    static RECOMMENDATIONS = 'recommendations';
    static forTeacher(teacherId) {
        return `teacher_${teacherId}`;
    }
    static forProblem(problemId) {
        return `problem_${problemId}`;
    }
}
// 캐시 전략 설정
export class CacheStrategies {
    // 짧은 캐시 (검색 결과 등)
    static SHORT_TTL = 300; // 5분
    // 중간 캐시 (통계, 분석 데이터)
    static MEDIUM_TTL = 1800; // 30분
    // 긴 캐시 (문제 메타데이터 등)
    static LONG_TTL = 3600; // 1시간
    // 매우 긴 캐시 (불변 데이터)
    static VERY_LONG_TTL = 86400; // 24시간
    static getStatisticsOptions() {
        return {
            ttl: this.MEDIUM_TTL,
            tags: [CacheTags.STATISTICS, CacheTags.ANALYTICS],
            compress: true,
            serialize: true
        };
    }
    static getSearchOptions() {
        return {
            ttl: this.SHORT_TTL,
            tags: [CacheTags.SEARCH_RESULTS],
            compress: true,
            serialize: true
        };
    }
    static getProblemOptions() {
        return {
            ttl: this.LONG_TTL,
            tags: [CacheTags.PROBLEM_DATA],
            serialize: true
        };
    }
    static getRecommendationOptions() {
        return {
            ttl: this.MEDIUM_TTL,
            tags: [CacheTags.RECOMMENDATIONS],
            serialize: true
        };
    }
}
//# sourceMappingURL=ICacheService.js.map