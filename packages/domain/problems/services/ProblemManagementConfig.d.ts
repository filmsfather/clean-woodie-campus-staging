export declare class TagManagementConstants {
    static readonly MAX_TAGS_PER_PROBLEM = 10;
    static readonly DEFAULT_MAX_SUGGESTIONS = 5;
    static readonly DEFAULT_SIMILARITY_THRESHOLD = 0.5;
    static readonly MIN_TAG_LENGTH = 1;
    static readonly MAX_TAG_LENGTH = 50;
    static readonly LEVENSHTEIN_SIMILARITY_THRESHOLD = 0.7;
    static readonly MIN_USAGE_COUNT = 1;
    static readonly MAX_SEARCH_RESULTS = 20;
    static readonly MIN_WORD_LENGTH_FOR_ANALYSIS = 2;
    static readonly MAX_RECOMMENDATIONS = 3;
}
export declare class DifficultyAnalysisConstants {
    static readonly PERFORMANCE_ADJUSTMENT_THRESHOLD = 0.1;
    static readonly BALANCE_TOLERANCE_PERCENTAGE = 5;
    static readonly PROGRESSIVE_SCORE_THRESHOLD = 0.7;
    static readonly BALANCE_SCORE_THRESHOLD = 0.8;
    static readonly MAX_DIFFICULTY_CHANGE = 1;
    static readonly RECENT_HISTORY_SIZE = 5;
    static readonly IMBALANCE_THRESHOLD_PERCENTAGE = 30;
    static readonly MIN_PROGRESSION_RANGE = 1;
    static readonly MAX_PROGRESSION_RANGE = 3;
    static readonly DEFAULT_TARGET_SUCCESS_RATE = 0.7;
    static readonly CONFIDENCE_ADJUSTMENT_FACTOR = 0.8;
}
export declare class ScoringPolicyConstants {
    static readonly MIN_POINTS = 0;
    static readonly MAX_POINTS = 1000;
    static readonly DEFAULT_POINTS = 10;
    static readonly DEFAULT_MINIMUM_THRESHOLD = 0;
}
export interface TagManagementOptions {
    maxTagsPerProblem?: number;
    maxSuggestions?: number;
    similarityThreshold?: number;
    minTagLength?: number;
    maxTagLength?: number;
    levenshteinSimilarityThreshold?: number;
    minUsageCount?: number;
    maxSearchResults?: number;
    minWordLengthForAnalysis?: number;
    maxRecommendations?: number;
    enableHierarchyAnalysis?: boolean;
    enableClustering?: boolean;
    enableAutoComplete?: boolean;
    caseSensitive?: boolean;
}
export interface DifficultyAnalysisOptions {
    targetSuccessRate?: number;
    performanceAdjustmentThreshold?: number;
    balanceTolerancePercentage?: number;
    progressiveScoreThreshold?: number;
    balanceScoreThreshold?: number;
    maxDifficultyChange?: number;
    recentHistorySize?: number;
    imbalanceThresholdPercentage?: number;
    minProgressionRange?: number;
    maxProgressionRange?: number;
    confidenceAdjustmentFactor?: number;
    enableAdaptiveDifficulty?: boolean;
    enableProgressionAnalysis?: boolean;
    enableConsistencyCheck?: boolean;
}
export interface ScoringPolicyOptions {
    minPoints?: number;
    maxPoints?: number;
    defaultPoints?: number;
    defaultMinimumThreshold?: number;
    roundingStrategy?: 'round' | 'floor' | 'ceil';
    enablePartialCredit?: boolean;
}
export interface ProblemManagementConfig {
    tags: TagManagementOptions;
    difficulty: DifficultyAnalysisOptions;
    scoring: ScoringPolicyOptions;
}
export declare class ProblemManagementProfiles {
    static readonly DEFAULT_CONFIG: ProblemManagementConfig;
    static readonly ADVANCED_CONFIG: ProblemManagementConfig;
    static readonly LEARNING_OPTIMIZED_CONFIG: ProblemManagementConfig;
    static readonly ASSESSMENT_FOCUSED_CONFIG: ProblemManagementConfig;
    static readonly PROTOTYPE_CONFIG: ProblemManagementConfig;
}
export declare class ConfigMerger {
    static mergeTagOptions(base: TagManagementOptions, override: Partial<TagManagementOptions>): TagManagementOptions;
    static mergeDifficultyOptions(base: DifficultyAnalysisOptions, override: Partial<DifficultyAnalysisOptions>): DifficultyAnalysisOptions;
    static mergeScoringOptions(base: ScoringPolicyOptions, override: Partial<ScoringPolicyOptions>): ScoringPolicyOptions;
    static mergeConfigs(base: ProblemManagementConfig, override: Partial<ProblemManagementConfig>): ProblemManagementConfig;
}
export declare class ConfigValidator {
    static validateTagOptions(options: TagManagementOptions): string[];
    static validateDifficultyOptions(options: DifficultyAnalysisOptions): string[];
    static validateScoringOptions(options: ScoringPolicyOptions): string[];
    static validateConfig(config: ProblemManagementConfig): string[];
}
//# sourceMappingURL=ProblemManagementConfig.d.ts.map