// 매직 넘버 상수화 & 옵션화
// 태그 관리 상수
export class TagManagementConstants {
    static MAX_TAGS_PER_PROBLEM = 10;
    static DEFAULT_MAX_SUGGESTIONS = 5;
    static DEFAULT_SIMILARITY_THRESHOLD = 0.5;
    static MIN_TAG_LENGTH = 1;
    static MAX_TAG_LENGTH = 50;
    static LEVENSHTEIN_SIMILARITY_THRESHOLD = 0.7;
    static MIN_USAGE_COUNT = 1;
    static MAX_SEARCH_RESULTS = 20;
    static MIN_WORD_LENGTH_FOR_ANALYSIS = 2;
    static MAX_RECOMMENDATIONS = 3;
}
// 난이도 분석 상수
export class DifficultyAnalysisConstants {
    static PERFORMANCE_ADJUSTMENT_THRESHOLD = 0.1;
    static BALANCE_TOLERANCE_PERCENTAGE = 5;
    static PROGRESSIVE_SCORE_THRESHOLD = 0.7;
    static BALANCE_SCORE_THRESHOLD = 0.8;
    static MAX_DIFFICULTY_CHANGE = 1;
    static RECENT_HISTORY_SIZE = 5;
    static IMBALANCE_THRESHOLD_PERCENTAGE = 30; // 30% 이상이면 재조정
    static MIN_PROGRESSION_RANGE = 1;
    static MAX_PROGRESSION_RANGE = 3;
    static DEFAULT_TARGET_SUCCESS_RATE = 0.7;
    static CONFIDENCE_ADJUSTMENT_FACTOR = 0.8;
}
// 채점 정책 상수
export class ScoringPolicyConstants {
    static MIN_POINTS = 0;
    static MAX_POINTS = 1000;
    static DEFAULT_POINTS = 10;
    static DEFAULT_MINIMUM_THRESHOLD = 0.0;
}
// 설정 프로필 클래스
export class ProblemManagementProfiles {
    // 기본 설정 (보수적)
    static DEFAULT_CONFIG = {
        tags: {
            maxTagsPerProblem: TagManagementConstants.MAX_TAGS_PER_PROBLEM,
            maxSuggestions: TagManagementConstants.DEFAULT_MAX_SUGGESTIONS,
            similarityThreshold: TagManagementConstants.DEFAULT_SIMILARITY_THRESHOLD,
            minTagLength: TagManagementConstants.MIN_TAG_LENGTH,
            maxTagLength: TagManagementConstants.MAX_TAG_LENGTH,
            levenshteinSimilarityThreshold: TagManagementConstants.LEVENSHTEIN_SIMILARITY_THRESHOLD,
            minUsageCount: TagManagementConstants.MIN_USAGE_COUNT,
            maxSearchResults: TagManagementConstants.MAX_SEARCH_RESULTS,
            minWordLengthForAnalysis: TagManagementConstants.MIN_WORD_LENGTH_FOR_ANALYSIS,
            maxRecommendations: TagManagementConstants.MAX_RECOMMENDATIONS,
            enableHierarchyAnalysis: true,
            enableClustering: true,
            enableAutoComplete: true,
            caseSensitive: false
        },
        difficulty: {
            targetSuccessRate: DifficultyAnalysisConstants.DEFAULT_TARGET_SUCCESS_RATE,
            performanceAdjustmentThreshold: DifficultyAnalysisConstants.PERFORMANCE_ADJUSTMENT_THRESHOLD,
            balanceTolerancePercentage: DifficultyAnalysisConstants.BALANCE_TOLERANCE_PERCENTAGE,
            progressiveScoreThreshold: DifficultyAnalysisConstants.PROGRESSIVE_SCORE_THRESHOLD,
            balanceScoreThreshold: DifficultyAnalysisConstants.BALANCE_SCORE_THRESHOLD,
            maxDifficultyChange: DifficultyAnalysisConstants.MAX_DIFFICULTY_CHANGE,
            recentHistorySize: DifficultyAnalysisConstants.RECENT_HISTORY_SIZE,
            imbalanceThresholdPercentage: DifficultyAnalysisConstants.IMBALANCE_THRESHOLD_PERCENTAGE,
            minProgressionRange: DifficultyAnalysisConstants.MIN_PROGRESSION_RANGE,
            maxProgressionRange: DifficultyAnalysisConstants.MAX_PROGRESSION_RANGE,
            confidenceAdjustmentFactor: DifficultyAnalysisConstants.CONFIDENCE_ADJUSTMENT_FACTOR,
            enableAdaptiveDifficulty: true,
            enableProgressionAnalysis: true,
            enableConsistencyCheck: true
        },
        scoring: {
            minPoints: ScoringPolicyConstants.MIN_POINTS,
            maxPoints: ScoringPolicyConstants.MAX_POINTS,
            defaultPoints: ScoringPolicyConstants.DEFAULT_POINTS,
            defaultMinimumThreshold: ScoringPolicyConstants.DEFAULT_MINIMUM_THRESHOLD,
            roundingStrategy: 'round',
            enablePartialCredit: true
        }
    };
    // 고급 사용자 설정 (더 유연함)
    static ADVANCED_CONFIG = {
        tags: {
            ...ProblemManagementProfiles.DEFAULT_CONFIG.tags,
            maxTagsPerProblem: 15, // 더 많은 태그 허용
            maxSuggestions: 8,
            similarityThreshold: 0.3, // 더 관대한 유사도
            levenshteinSimilarityThreshold: 0.6,
            maxSearchResults: 50,
            enableHierarchyAnalysis: true,
            enableClustering: true
        },
        difficulty: {
            ...ProblemManagementProfiles.DEFAULT_CONFIG.difficulty,
            performanceAdjustmentThreshold: 0.05, // 더 민감한 조정
            balanceTolerancePercentage: 3, // 더 엄격한 균형
            maxDifficultyChange: 1.5, // 더 큰 변화 허용
            recentHistorySize: 10, // 더 많은 이력 고려
            imbalanceThresholdPercentage: 20 // 더 빠른 재조정
        },
        scoring: {
            ...ProblemManagementProfiles.DEFAULT_CONFIG.scoring,
            roundingStrategy: 'ceil', // 학생에게 유리하게
            defaultMinimumThreshold: 0.2 // 20% 이상 필요
        }
    };
    // 학습 최적화 설정 (교육 효과 중심)
    static LEARNING_OPTIMIZED_CONFIG = {
        tags: {
            ...ProblemManagementProfiles.DEFAULT_CONFIG.tags,
            maxTagsPerProblem: 8, // 집중도를 위해 제한
            maxSuggestions: 3,
            similarityThreshold: 0.6, // 더 정확한 태그
            enableAutoComplete: true,
            enableHierarchyAnalysis: true
        },
        difficulty: {
            ...ProblemManagementProfiles.DEFAULT_CONFIG.difficulty,
            targetSuccessRate: 0.8, // 더 높은 성공률 목표
            performanceAdjustmentThreshold: 0.05,
            maxDifficultyChange: 0.5, // 더 점진적 변화
            recentHistorySize: 7,
            progressiveScoreThreshold: 0.8, // 더 엄격한 진행도
            enableAdaptiveDifficulty: true,
            enableProgressionAnalysis: true
        },
        scoring: {
            ...ProblemManagementProfiles.DEFAULT_CONFIG.scoring,
            roundingStrategy: 'round',
            defaultMinimumThreshold: 0.3, // 30% 최소 요구사항
            enablePartialCredit: true
        }
    };
    // 평가 중심 설정 (정확성 중심)
    static ASSESSMENT_FOCUSED_CONFIG = {
        tags: {
            ...ProblemManagementProfiles.DEFAULT_CONFIG.tags,
            maxTagsPerProblem: 5, // 명확한 분류
            maxSuggestions: 3,
            similarityThreshold: 0.8, // 매우 정확한 태그만
            enableClustering: false, // 명확한 분류 우선
            caseSensitive: true // 정확성 중시
        },
        difficulty: {
            ...ProblemManagementProfiles.DEFAULT_CONFIG.difficulty,
            targetSuccessRate: 0.6, // 변별력 있는 난이도
            balanceScoreThreshold: 0.9, // 매우 엄격한 균형
            maxDifficultyChange: 1, // 안정적인 난이도
            enableAdaptiveDifficulty: false, // 고정 난이도 선호
            enableConsistencyCheck: true
        },
        scoring: {
            ...ProblemManagementProfiles.DEFAULT_CONFIG.scoring,
            roundingStrategy: 'floor', // 엄격한 채점
            defaultMinimumThreshold: 0.5, // 50% 최소 요구사항
            enablePartialCredit: false // 전체 정답만 인정
        }
    };
    // 빠른 프로토타이핑 설정 (관대함)
    static PROTOTYPE_CONFIG = {
        tags: {
            ...ProblemManagementProfiles.DEFAULT_CONFIG.tags,
            maxTagsPerProblem: 20, // 매우 많은 태그 허용
            maxSuggestions: 10,
            similarityThreshold: 0.2, // 매우 관대한 유사도
            enableHierarchyAnalysis: false, // 간단함 우선
            enableClustering: false
        },
        difficulty: {
            ...ProblemManagementProfiles.DEFAULT_CONFIG.difficulty,
            balanceTolerancePercentage: 15, // 매우 관대한 균형
            maxDifficultyChange: 2, // 빠른 조정 허용
            enableConsistencyCheck: false // 빠른 개발 우선
        },
        scoring: {
            ...ProblemManagementProfiles.DEFAULT_CONFIG.scoring,
            roundingStrategy: 'ceil', // 관대한 채점
            enablePartialCredit: true
        }
    };
}
// 설정 병합 유틸리티
export class ConfigMerger {
    static mergeTagOptions(base, override) {
        return { ...base, ...override };
    }
    static mergeDifficultyOptions(base, override) {
        return { ...base, ...override };
    }
    static mergeScoringOptions(base, override) {
        return { ...base, ...override };
    }
    static mergeConfigs(base, override) {
        return {
            tags: override.tags ? this.mergeTagOptions(base.tags, override.tags) : base.tags,
            difficulty: override.difficulty ? this.mergeDifficultyOptions(base.difficulty, override.difficulty) : base.difficulty,
            scoring: override.scoring ? this.mergeScoringOptions(base.scoring, override.scoring) : base.scoring
        };
    }
}
// 설정 검증 유틸리티
export class ConfigValidator {
    static validateTagOptions(options) {
        const errors = [];
        if (options.maxTagsPerProblem !== undefined) {
            if (options.maxTagsPerProblem < 1 || options.maxTagsPerProblem > 50) {
                errors.push('maxTagsPerProblem must be between 1 and 50');
            }
        }
        if (options.similarityThreshold !== undefined) {
            if (options.similarityThreshold < 0 || options.similarityThreshold > 1) {
                errors.push('similarityThreshold must be between 0 and 1');
            }
        }
        if (options.minTagLength !== undefined && options.maxTagLength !== undefined) {
            if (options.minTagLength > options.maxTagLength) {
                errors.push('minTagLength cannot be greater than maxTagLength');
            }
        }
        return errors;
    }
    static validateDifficultyOptions(options) {
        const errors = [];
        if (options.targetSuccessRate !== undefined) {
            if (options.targetSuccessRate < 0 || options.targetSuccessRate > 1) {
                errors.push('targetSuccessRate must be between 0 and 1');
            }
        }
        if (options.balanceTolerancePercentage !== undefined) {
            if (options.balanceTolerancePercentage < 0 || options.balanceTolerancePercentage > 100) {
                errors.push('balanceTolerancePercentage must be between 0 and 100');
            }
        }
        if (options.maxDifficultyChange !== undefined) {
            if (options.maxDifficultyChange < 0 || options.maxDifficultyChange > 4) {
                errors.push('maxDifficultyChange must be between 0 and 4');
            }
        }
        return errors;
    }
    static validateScoringOptions(options) {
        const errors = [];
        if (options.minPoints !== undefined && options.maxPoints !== undefined) {
            if (options.minPoints > options.maxPoints) {
                errors.push('minPoints cannot be greater than maxPoints');
            }
        }
        if (options.defaultMinimumThreshold !== undefined) {
            if (options.defaultMinimumThreshold < 0 || options.defaultMinimumThreshold > 1) {
                errors.push('defaultMinimumThreshold must be between 0 and 1');
            }
        }
        return errors;
    }
    static validateConfig(config) {
        const errors = [];
        errors.push(...this.validateTagOptions(config.tags));
        errors.push(...this.validateDifficultyOptions(config.difficulty));
        errors.push(...this.validateScoringOptions(config.scoring));
        return errors;
    }
}
//# sourceMappingURL=ProblemManagementConfig.js.map